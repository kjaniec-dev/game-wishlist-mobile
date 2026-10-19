package main

import (
	"context"
	"crypto/subtle"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"strings"
	"time"
)

type Server struct {
	fetch   Fetcher
	cache   *Cache
	apiKey  string
	timeout time.Duration
}

func NewServer(f Fetcher, c *Cache, apiKey string, timeout time.Duration) *Server {
	return &Server{fetch: f, cache: c, apiKey: apiKey, timeout: timeout}
}

func (s *Server) Handler() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, _ *http.Request) {
		writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
	})
	mux.HandleFunc("GET /price", s.price)
	return mux
}

type priceResponse struct {
	// Price is null when the page was read but holds no price (e.g. out of stock).
	Price    *float64 `json:"price"`
	Currency string   `json:"currency,omitempty"`
	Source   string   `json:"source,omitempty"`
	Cached   bool     `json:"cached"`
	Error    string   `json:"error,omitempty"`
}

func (s *Server) price(w http.ResponseWriter, r *http.Request) {
	if !s.authorized(r) {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "invalid or missing API key"})
		return
	}
	store := r.URL.Query().Get("store")
	u, err := ValidateURL(store, r.URL.Query().Get("url"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}

	key := store + "|" + u.String()
	res, cached, err := s.cache.Do(key, func() (Result, error) {
		// Detached from the caller: a client that gives up must not poison the shared in-flight lookup.
		ctx, cancel := context.WithTimeout(context.Background(), s.timeout)
		defer cancel()
		page, err := s.fetch.Fetch(ctx, store, u)
		if err != nil {
			return Result{}, err
		}
		return ExtractPrice(page)
	})

	var up *UpstreamError
	switch {
	case err == nil:
		p := res.Price
		writeJSON(w, http.StatusOK, priceResponse{Price: &p, Currency: res.Currency, Source: res.Source, Cached: cached})
	case errors.Is(err, ErrNoPrice), errors.Is(err, ErrCurrency):
		writeJSON(w, http.StatusOK, priceResponse{Cached: cached, Error: err.Error()})
	case errors.As(err, &up):
		slog.Warn("upstream failure", "store", store, "status", up.Status)
		writeJSON(w, http.StatusBadGateway, map[string]string{"error": err.Error()})
	default:
		slog.Warn("fetch failed", "store", store, "err", err)
		writeJSON(w, http.StatusBadGateway, map[string]string{"error": "could not fetch the offer"})
	}
}

func (s *Server) authorized(r *http.Request) bool {
	if s.apiKey == "" {
		return true
	}
	got := strings.TrimPrefix(r.Header.Get("Authorization"), "Bearer ")
	return subtle.ConstantTimeCompare([]byte(got), []byte(s.apiKey)) == 1
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}
