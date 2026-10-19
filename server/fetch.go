package main

import (
	"context"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"sync"
	"time"
)

// Fetcher downloads a product page. It is an interface so handlers can be tested without the network.
type Fetcher interface {
	Fetch(ctx context.Context, store string, u *url.URL) ([]byte, error)
}

// UpstreamError is a failed or blocked response from the shop.
type UpstreamError struct {
	Status  int
	Blocked bool
}

func (e *UpstreamError) Error() string {
	if e.Blocked {
		return fmt.Sprintf("shop blocked the request (HTTP %d)", e.Status)
	}
	return fmt.Sprintf("shop answered HTTP %d", e.Status)
}

const maxBody = 4 << 20 // product pages are well under this; the cap protects memory

type httpFetcher struct {
	client    *http.Client
	userAgent string
	limiter   *hostLimiter
}

func NewHTTPFetcher(userAgent string, timeout, minGap time.Duration) *httpFetcher {
	return &httpFetcher{
		userAgent: userAgent,
		limiter:   &hostLimiter{gap: minGap, next: map[string]time.Time{}},
		client:    &http.Client{Timeout: timeout},
	}
}

func (f *httpFetcher) Fetch(ctx context.Context, store string, u *url.URL) ([]byte, error) {
	hosts := storeHosts[store]
	client := *f.client
	client.CheckRedirect = redirectPolicy(hosts)

	if err := f.limiter.wait(ctx, u.Hostname()); err != nil {
		return nil, err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u.String(), nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", f.userAgent)
	req.Header.Set("Accept", "text/html,application/xhtml+xml")
	req.Header.Set("Accept-Language", "pl-PL,pl;q=0.9,en;q=0.5")

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		blocked := resp.StatusCode == http.StatusForbidden || resp.StatusCode == http.StatusTooManyRequests || resp.StatusCode == http.StatusServiceUnavailable
		return nil, &UpstreamError{Status: resp.StatusCode, Blocked: blocked}
	}
	return io.ReadAll(io.LimitReader(resp.Body, maxBody))
}

// redirectPolicy keeps a shop redirect from leading anywhere off the store's allowlist.
func redirectPolicy(hosts []string) func(*http.Request, []*http.Request) error {
	return func(req *http.Request, via []*http.Request) error {
		if len(via) >= 5 {
			return errors.New("too many redirects")
		}
		return checkURL(req.URL, hosts)
	}
}

// hostLimiter spaces requests to the same host so the server stays a polite client.
type hostLimiter struct {
	gap  time.Duration
	mu   sync.Mutex
	next map[string]time.Time
}

func (l *hostLimiter) wait(ctx context.Context, host string) error {
	l.mu.Lock()
	now := time.Now()
	at := l.next[host]
	if at.Before(now) {
		at = now
	}
	l.next[host] = at.Add(l.gap)
	l.mu.Unlock()

	if d := time.Until(at); d > 0 {
		select {
		case <-time.After(d):
		case <-ctx.Done():
			return ctx.Err()
		}
	}
	return nil
}
