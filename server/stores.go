package main

import (
	"errors"
	"net"
	"net/url"
	"strings"
)

// storeHosts is the allowlist of domains the server will fetch for each store. It is the only thing standing between
// `?url=` and an open proxy / SSRF, so every request and every redirect hop is checked against it.
var storeHosts = map[string][]string{
	"ceneo":   {"ceneo.pl"},
	"allegro": {"allegro.pl"},
	"ggdeals": {"gg.deals"},
}

var errBadURL = errors.New("url does not point to the selected store")

// ValidateURL parses raw and checks that it is an https URL on one of the store's domains.
func ValidateURL(store, raw string) (*url.URL, error) {
	hosts, ok := storeHosts[store]
	if !ok {
		return nil, errors.New("unknown store")
	}
	u, err := url.Parse(strings.TrimSpace(raw))
	if err != nil {
		return nil, errBadURL
	}
	return u, checkURL(u, hosts)
}

func checkURL(u *url.URL, hosts []string) error {
	if u.Scheme != "https" || u.User != nil || (u.Port() != "" && u.Port() != "443") {
		return errBadURL
	}
	host := strings.ToLower(u.Hostname())
	if net.ParseIP(host) != nil {
		return errBadURL
	}
	for _, h := range hosts {
		if host == h || strings.HasSuffix(host, "."+h) {
			return nil
		}
	}
	return errBadURL
}
