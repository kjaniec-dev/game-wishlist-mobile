package main

import (
	"sync"
	"time"
)

type cacheEntry struct {
	res Result
	err error
	exp time.Time
}

type inflight struct {
	done chan struct{}
	res  Result
	err  error
}

// Cache is a small TTL cache that also collapses concurrent lookups of the same key into one upstream call.
// Failures are cached for a shorter time so a blocked shop is not hammered by retries.
type Cache struct {
	ttl, negTTL time.Duration
	maxItems    int
	now         func() time.Time

	mu       sync.Mutex
	items    map[string]cacheEntry
	inflight map[string]*inflight
}

func NewCache(ttl, negTTL time.Duration) *Cache {
	return &Cache{
		ttl: ttl, negTTL: negTTL, maxItems: 10000, now: time.Now,
		items: map[string]cacheEntry{}, inflight: map[string]*inflight{},
	}
}

// Do returns the cached value for key or runs fn once for all concurrent callers. cached reports a cache hit.
func (c *Cache) Do(key string, fn func() (Result, error)) (res Result, cached bool, err error) {
	c.mu.Lock()
	if e, ok := c.items[key]; ok && c.now().Before(e.exp) {
		c.mu.Unlock()
		return e.res, true, e.err
	}
	if call, ok := c.inflight[key]; ok {
		c.mu.Unlock()
		<-call.done
		return call.res, false, call.err
	}
	call := &inflight{done: make(chan struct{})}
	c.inflight[key] = call
	c.mu.Unlock()

	call.res, call.err = fn()

	c.mu.Lock()
	ttl := c.ttl
	if call.err != nil {
		ttl = c.negTTL
	}
	if len(c.items) >= c.maxItems {
		c.sweep()
	}
	c.items[key] = cacheEntry{call.res, call.err, c.now().Add(ttl)}
	delete(c.inflight, key)
	c.mu.Unlock()
	close(call.done)
	return call.res, false, call.err
}

// sweep drops expired entries, or everything if the cache is still full of live ones. Caller holds c.mu.
func (c *Cache) sweep() {
	now := c.now()
	for k, e := range c.items {
		if !now.Before(e.exp) {
			delete(c.items, k)
		}
	}
	if len(c.items) >= c.maxItems {
		c.items = map[string]cacheEntry{}
	}
}
