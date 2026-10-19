package main

import "testing"

func TestValidateURL(t *testing.T) {
	tests := []struct {
		store, url string
		ok         bool
	}{
		{"ceneo", "https://www.ceneo.pl/123456", true},
		{"ceneo", "https://ceneo.pl/123456", true},
		{"allegro", "https://allegro.pl/oferta/gra-123", true},
		{"ggdeals", "https://gg.deals/pl/game/hades/", true},
		{"ggdeals", "https://gg.deals:443/game/hades/", true},
		{"ceneo", "http://www.ceneo.pl/123456", false},   // plain http
		{"ceneo", "https://allegro.pl/oferta/1", false},  // wrong store
		{"ceneo", "https://evil.com/?x=ceneo.pl", false}, // allowlisted name only in the query
		{"ceneo", "https://ceneo.pl.evil.com/1", false},  // suffix trick
		{"ceneo", "https://notceneo.pl/1", false},        // prefix trick
		{"ceneo", "https://user:pw@ceneo.pl/1", false},   // userinfo
		{"ceneo", "https://ceneo.pl:8443/1", false},      // non-standard port
		{"ceneo", "https://127.0.0.1/", false},           // IP literal
		{"ceneo", "https://[::1]/", false},               // IPv6 literal
		{"ceneo", "file:///etc/passwd", false},           // other scheme
		{"ceneo", "", false},                             // empty
		{"amazon", "https://www.ceneo.pl/123456", false}, // unknown store
	}
	for _, tc := range tests {
		_, err := ValidateURL(tc.store, tc.url)
		if (err == nil) != tc.ok {
			t.Errorf("ValidateURL(%q, %q) err = %v, want ok=%v", tc.store, tc.url, err, tc.ok)
		}
	}
}
