// Command server is a small price-lookup service for the Game Wishlist app: given a product page on Ceneo, Allegro
// or GG.deals it returns the current PLN price.
package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"
)

const defaultUserAgent = "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36"

func main() {
	cfg := struct {
		addr, apiKey, userAgent        string
		cacheTTL, upstreamTimeout, gap time.Duration
	}{
		addr:            ":" + env("PORT", "8080"),
		apiKey:          os.Getenv("API_KEY"),
		userAgent:       env("USER_AGENT", defaultUserAgent),
		cacheTTL:        envDuration("CACHE_TTL", 30*time.Minute),
		upstreamTimeout: envDuration("UPSTREAM_TIMEOUT", 15*time.Second),
		gap:             envDuration("HOST_MIN_GAP", time.Second),
	}
	if cfg.apiKey == "" {
		slog.Warn("API_KEY is empty: the service is open to anyone who can reach it")
	}

	fetcher := NewHTTPFetcher(cfg.userAgent, cfg.upstreamTimeout, cfg.gap)
	srv := &http.Server{
		Addr:              cfg.addr,
		Handler:           NewServer(fetcher, NewCache(cfg.cacheTTL, 2*time.Minute), cfg.apiKey, cfg.upstreamTimeout).Handler(),
		ReadHeaderTimeout: 5 * time.Second,
		WriteTimeout:      cfg.upstreamTimeout + 10*time.Second,
	}

	go func() {
		slog.Info("listening", "addr", cfg.addr, "cacheTTL", cfg.cacheTTL)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			slog.Error("server stopped", "err", err)
			os.Exit(1)
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)
	<-stop
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	_ = srv.Shutdown(ctx)
}

func env(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

func envDuration(key string, def time.Duration) time.Duration {
	v := os.Getenv(key)
	if v == "" {
		return def
	}
	if d, err := time.ParseDuration(v); err == nil && d > 0 {
		return d
	}
	if n, err := strconv.Atoi(v); err == nil && n > 0 { // bare number = seconds
		return time.Duration(n) * time.Second
	}
	slog.Warn("ignoring invalid duration", "key", key, "value", v)
	return def
}
