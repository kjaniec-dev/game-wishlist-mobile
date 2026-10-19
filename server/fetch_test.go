package main

import (
	"context"
	"net/http"
	"net/url"
	"testing"
	"time"
)

func TestRedirectPolicy(t *testing.T) {
	policy := redirectPolicy(storeHosts["ceneo"])
	req := func(raw string) *http.Request {
		u, _ := url.Parse(raw)
		return &http.Request{URL: u}
	}
	if err := policy(req("https://www.ceneo.pl/other"), nil); err != nil {
		t.Errorf("same-store redirect rejected: %v", err)
	}
	for _, raw := range []string{"https://evil.com/", "http://www.ceneo.pl/", "https://169.254.169.254/latest/meta-data"} {
		if err := policy(req(raw), nil); err == nil {
			t.Errorf("redirect to %s must be rejected", raw)
		}
	}
	if err := policy(req("https://www.ceneo.pl/"), make([]*http.Request, 5)); err == nil {
		t.Error("redirect chain longer than 5 must be rejected")
	}
}

func TestHostLimiterSpacesRequests(t *testing.T) {
	l := &hostLimiter{gap: 40 * time.Millisecond, next: map[string]time.Time{}}
	start := time.Now()
	for range 3 {
		if err := l.wait(context.Background(), "ceneo.pl"); err != nil {
			t.Fatal(err)
		}
	}
	if d := time.Since(start); d < 80*time.Millisecond {
		t.Errorf("3 requests took %v, want >= 80ms", d)
	}
	// A different host is not delayed by the first one.
	start = time.Now()
	_ = l.wait(context.Background(), "allegro.pl")
	if d := time.Since(start); d > 20*time.Millisecond {
		t.Errorf("other host waited %v", d)
	}
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	if err := l.wait(ctx, "ceneo.pl"); err == nil {
		t.Error("cancelled context must abort the wait")
	}
}
