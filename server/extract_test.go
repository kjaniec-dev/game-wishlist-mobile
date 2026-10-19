package main

import (
	"errors"
	"testing"
)

// The pages below are hand-written fixtures in the shapes shops commonly publish (schema.org JSON-LD, OpenGraph
// product meta). They are NOT captures of the live sites, which could not be reached while writing this.
func TestExtractPrice(t *testing.T) {
	tests := []struct {
		name    string
		page    string
		want    float64
		source  string
		wantErr error
	}{
		{
			name:   "product with single offer, numeric price",
			page:   `<script type="application/ld+json">{"@context":"https://schema.org","@type":"Product","name":"Game","offers":{"@type":"Offer","price":129.99,"priceCurrency":"PLN"}}</script>`,
			want:   129.99,
			source: "json-ld",
		},
		{
			name:   "string price with decimal comma",
			page:   `<script type="application/ld+json">{"@type":"Product","offers":{"@type":"Offer","price":"1 299,00 zł","priceCurrency":"PLN"}}</script>`,
			want:   1299,
			source: "json-ld",
		},
		{
			name:   "aggregate offer uses lowPrice",
			page:   `<script type="application/ld+json">{"@type":"Product","offers":{"@type":"AggregateOffer","lowPrice":"89.90","highPrice":"199.00","priceCurrency":"PLN"}}</script>`,
			want:   89.9,
			source: "json-ld",
		},
		{
			name:   "offers array picks the lowest in-stock",
			page:   `<script type="application/ld+json">{"@type":"Product","offers":[{"@type":"Offer","price":"150","priceCurrency":"PLN","availability":"https://schema.org/InStock"},{"@type":"Offer","price":"99","priceCurrency":"PLN","availability":"https://schema.org/OutOfStock"},{"@type":"Offer","price":"120","priceCurrency":"PLN"}]}</script>`,
			want:   120,
			source: "json-ld",
		},
		{
			name:   "@graph and multiple ld+json blocks",
			page:   `<script type="application/ld+json">{"@type":"BreadcrumbList"}</script><script type="application/ld+json">{"@graph":[{"@type":"WebSite"},{"@type":["Product","Thing"],"offers":{"@type":"Offer","price":"59.99","priceCurrency":"PLN"}}]}</script>`,
			want:   59.99,
			source: "json-ld",
		},
		{
			name:   "thousands separators dot and comma",
			page:   `<script type="application/ld+json">{"@type":"Offer","price":"1.299,50","priceCurrency":"PLN"}</script>`,
			want:   1299.5,
			source: "json-ld",
		},
		{
			name:   "missing currency is assumed PLN",
			page:   `<script type="application/ld+json">{"@type":"Offer","price":"49"}</script>`,
			want:   49,
			source: "json-ld",
		},
		{
			name:   "invalid json-ld falls back to meta",
			page:   `<script type="application/ld+json">{not json</script><meta property="product:price:amount" content="79,99"><meta property="product:price:currency" content="PLN">`,
			want:   79.99,
			source: "meta",
		},
		{
			name:   "meta with content before property",
			page:   `<meta content='34.50' property='og:price:amount' />`,
			want:   34.5,
			source: "meta",
		},
		{
			name:   "itemprop price meta",
			page:   `<meta itemprop="price" content="19.99"><meta itemprop="priceCurrency" content="PLN">`,
			want:   19.99,
			source: "meta",
		},
		{
			name:    "foreign currency only",
			page:    `<script type="application/ld+json">{"@type":"Offer","price":"29.99","priceCurrency":"EUR"}</script>`,
			wantErr: ErrCurrency,
		},
		{
			name:   "PLN preferred over cheaper foreign offer",
			page:   `<script type="application/ld+json">{"@type":"Product","offers":[{"@type":"Offer","price":"20","priceCurrency":"EUR"},{"@type":"Offer","price":"110","priceCurrency":"PLN"}]}</script>`,
			want:   110,
			source: "json-ld",
		},
		{
			name:    "all offers out of stock",
			page:    `<script type="application/ld+json">{"@type":"Offer","price":"99","priceCurrency":"PLN","availability":"OutOfStock"}</script>`,
			wantErr: ErrNoPrice,
		},
		{name: "zero price is not a price", page: `<script type="application/ld+json">{"@type":"Offer","price":0,"priceCurrency":"PLN"}</script>`, wantErr: ErrNoPrice},
		{name: "no price anywhere", page: `<html><body>Brak oferty</body></html>`, wantErr: ErrNoPrice},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			got, err := ExtractPrice([]byte(tc.page))
			if tc.wantErr != nil {
				if !errors.Is(err, tc.wantErr) {
					t.Fatalf("err = %v, want %v", err, tc.wantErr)
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if got.Price != tc.want || got.Source != tc.source || got.Currency != "PLN" {
				t.Fatalf("got %+v, want price %v from %s", got, tc.want, tc.source)
			}
		})
	}
}
