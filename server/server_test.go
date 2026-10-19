package main

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"net/url"
	"sync"
	"sync/atomic"
	"testing"
	"time"
)

type fakeFetcher struct {
	calls atomic.Int32
	page  string
	err   error
	delay time.Duration
}

func (f *fakeFetcher) Fetch(ctx context.Context, store string, u *url.URL) ([]byte, error) {
	f.calls.Add(1)
	time.Sleep(f.delay)
	return []byte(f.page), f.err
}

const okPage = `<script type="application/ld+json">{"@type":"Offer","price":"129,99","priceCurrency":"PLN"}</script>`

func get(t *testing.T, s *Server, path, auth string) (*httptest.ResponseRecorder, map[string]any) {
	t.Helper()
	req := httptest.NewRequest(http.MethodGet, path, nil)
	if auth != "" {
		req.Header.Set("Authorization", auth)
	}
	rec := httptest.NewRecorder()
	s.Handler().ServeHTTP(rec, req)
	var body map[string]any
	_ = json.Unmarshal(rec.Body.Bytes(), &body)
	return rec, body
}

func newTestServer(f Fetcher, key string) *Server {
	return NewServer(f, NewCache(time.Minute, time.Minute), key, time.Second)
}

const goodPath = "/price?store=ceneo&url=https%3A%2F%2Fwww.ceneo.pl%2F123"

func TestPriceOK(t *testing.T) {
	f := &fakeFetcher{page: okPage}
	s := newTestServer(f, "")
	rec, body := get(t, s, goodPath, "")
	if rec.Code != 200 || body["price"] != 129.99 || body["currency"] != "PLN" || body["cached"] != false {
		t.Fatalf("got %d %v", rec.Code, body)
	}
	// Second identical request is served from the cache without touching the shop.
	_, body = get(t, s, goodPath, "")
	if body["cached"] != true || f.calls.Load() != 1 {
		t.Fatalf("expected cache hit, calls=%d body=%v", f.calls.Load(), body)
	}
}

func TestPriceNull(t *testing.T) {
	s := newTestServer(&fakeFetcher{page: "<html>brak</html>"}, "")
	rec, body := get(t, s, goodPath, "")
	if rec.Code != 200 {
		t.Fatalf("status = %d", rec.Code)
	}
	if v, present := body["price"]; !present || v != nil {
		t.Fatalf("price must be present and null, got %v", body)
	}
}

func TestPriceUpstreamFailure(t *testing.T) {
	s := newTestServer(&fakeFetcher{err: &UpstreamError{Status: 403, Blocked: true}}, "")
	rec, body := get(t, s, goodPath, "")
	if rec.Code != http.StatusBadGateway || body["error"] == nil {
		t.Fatalf("got %d %v", rec.Code, body)
	}
	s = newTestServer(&fakeFetcher{err: errors.New("dial tcp: secret internal detail")}, "")
	_, body = get(t, s, goodPath, "")
	if body["error"] != "could not fetch the offer" {
		t.Fatalf("internal error leaked to the client: %v", body)
	}
}

func TestPriceBadRequest(t *testing.T) {
	f := &fakeFetcher{page: okPage}
	s := newTestServer(f, "")
	for _, path := range []string{
		"/price",
		"/price?store=ceneo",
		"/price?store=ceneo&url=https%3A%2F%2Fevil.com%2F1",
		"/price?store=ceneo&url=http%3A%2F%2Fwww.ceneo.pl%2F1",
		"/price?store=nope&url=https%3A%2F%2Fwww.ceneo.pl%2F1",
	} {
		if rec, _ := get(t, s, path, ""); rec.Code != http.StatusBadRequest {
			t.Errorf("%s: status = %d, want 400", path, rec.Code)
		}
	}
	if f.calls.Load() != 0 {
		t.Fatal("invalid requests must never reach the shop")
	}
}

func TestAuth(t *testing.T) {
	s := newTestServer(&fakeFetcher{page: okPage}, "secret")
	if rec, _ := get(t, s, goodPath, ""); rec.Code != http.StatusUnauthorized {
		t.Errorf("no key: %d", rec.Code)
	}
	if rec, _ := get(t, s, goodPath, "Bearer wrong"); rec.Code != http.StatusUnauthorized {
		t.Errorf("wrong key: %d", rec.Code)
	}
	if rec, _ := get(t, s, goodPath, "Bearer secret"); rec.Code != http.StatusOK {
		t.Errorf("right key: %d", rec.Code)
	}
	if rec, _ := get(t, s, "/healthz", ""); rec.Code != http.StatusOK {
		t.Errorf("healthz must not need a key: %d", rec.Code)
	}
}

func TestConcurrentRequestsShareOneFetch(t *testing.T) {
	f := &fakeFetcher{page: okPage, delay: 50 * time.Millisecond}
	s := newTestServer(f, "")
	var wg sync.WaitGroup
	for range 20 {
		wg.Add(1)
		go func() {
			defer wg.Done()
			if rec, _ := get(t, s, goodPath, ""); rec.Code != 200 {
				t.Errorf("status = %d", rec.Code)
			}
		}()
	}
	wg.Wait()
	if n := f.calls.Load(); n != 1 {
		t.Fatalf("fetch called %d times, want 1", n)
	}
}

func TestCacheExpiry(t *testing.T) {
	now := time.Now()
	c := NewCache(time.Minute, 10*time.Second)
	c.now = func() time.Time { return now }
	calls := 0
	fn := func() (Result, error) { calls++; return Result{Price: 1}, nil }
	c.Do("k", fn)
	c.Do("k", fn)
	now = now.Add(2 * time.Minute)
	c.Do("k", fn)
	if calls != 2 {
		t.Fatalf("calls = %d, want 2", calls)
	}
}
