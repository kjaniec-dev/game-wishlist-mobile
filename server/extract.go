package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"html"
	"math"
	"regexp"
	"strconv"
	"strings"
)

// Result is a price read from a product page.
type Result struct {
	Price    float64 `json:"price"`
	Currency string  `json:"currency"`
	// Source says which part of the page the price came from ("json-ld" or "meta").
	Source string `json:"source"`
}

var (
	// ErrNoPrice means the page was fetched but carries no usable price (out of stock, listing page, changed markup).
	ErrNoPrice = errors.New("no price found on the page")
	// ErrCurrency means every price found was in a currency other than PLN.
	ErrCurrency = errors.New("price is not in PLN")
)

var (
	ldRe   = regexp.MustCompile(`(?is)<script[^>]+type\s*=\s*["']application/ld\+json["'][^>]*>(.*?)</script>`)
	metaRe = regexp.MustCompile(`(?is)<meta\s+([^>]*?)/?>`)
	attrRe = regexp.MustCompile(`([\w:.-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')`)
)

type candidate struct {
	price    float64
	currency string
}

// ExtractPrice reads the PLN price of a product page. JSON-LD (schema.org Offer) is preferred because shops keep it
// stable for search engines; <meta> price tags are the fallback. When a page lists several offers the lowest in-stock
// one wins.
func ExtractPrice(page []byte) (Result, error) {
	var cands []candidate
	for _, m := range ldRe.FindAllSubmatch(page, -1) {
		var doc any
		if err := json.Unmarshal([]byte(strings.TrimSpace(html.UnescapeString(string(m[1])))), &doc); err != nil {
			continue
		}
		walkOffers(doc, &cands)
	}
	source := "json-ld"
	if len(cands) == 0 {
		cands = metaCandidates(page)
		source = "meta"
	}
	return pickLowestPLN(cands, source)
}

func pickLowestPLN(cands []candidate, source string) (Result, error) {
	var best *candidate
	foreign := ""
	for i := range cands {
		c := cands[i]
		if c.currency != "" && !strings.EqualFold(c.currency, "PLN") {
			foreign = c.currency
			continue
		}
		if best == nil || c.price < best.price {
			best = &cands[i]
		}
	}
	switch {
	case best != nil:
		return Result{Price: best.price, Currency: "PLN", Source: source}, nil
	case foreign != "":
		return Result{}, fmt.Errorf("%w (%s)", ErrCurrency, strings.ToUpper(foreign))
	default:
		return Result{}, ErrNoPrice
	}
}

func walkOffers(v any, out *[]candidate) {
	switch n := v.(type) {
	case []any:
		for _, e := range n {
			walkOffers(e, out)
		}
	case map[string]any:
		if hasType(n["@type"], "Offer", "AggregateOffer") && !outOfStock(n["availability"]) {
			raw, ok := n["price"]
			if !ok {
				raw = n["lowPrice"] // AggregateOffer
			}
			if p, ok := toPrice(raw); ok {
				cur, _ := n["priceCurrency"].(string)
				*out = append(*out, candidate{p, cur})
			}
		}
		for _, e := range n {
			walkOffers(e, out)
		}
	}
}

func hasType(t any, names ...string) bool {
	has := func(s string) bool {
		s = s[strings.LastIndexAny(s, "/#")+1:] // tolerate full schema.org URLs
		for _, n := range names {
			if strings.EqualFold(s, n) {
				return true
			}
		}
		return false
	}
	switch v := t.(type) {
	case string:
		return has(v)
	case []any:
		for _, e := range v {
			if s, ok := e.(string); ok && has(s) {
				return true
			}
		}
	}
	return false
}

func outOfStock(a any) bool {
	s, _ := a.(string)
	s = strings.ToLower(s)
	return strings.Contains(s, "outofstock") || strings.Contains(s, "soldout") || strings.Contains(s, "discontinued")
}

func metaCandidates(page []byte) []candidate {
	var price, currency string
	for _, m := range metaRe.FindAllSubmatch(page, -1) {
		attrs := map[string]string{}
		for _, a := range attrRe.FindAllSubmatch(m[1], -1) {
			val := string(a[2])
			if val == "" {
				val = string(a[3])
			}
			attrs[strings.ToLower(string(a[1]))] = html.UnescapeString(val)
		}
		key := strings.ToLower(firstNonEmpty(attrs["property"], attrs["name"], attrs["itemprop"]))
		switch key {
		case "product:price:amount", "og:price:amount", "price":
			if price == "" {
				price = attrs["content"]
			}
		case "product:price:currency", "og:price:currency", "pricecurrency":
			if currency == "" {
				currency = attrs["content"]
			}
		}
	}
	if p, ok := toPrice(price); ok {
		return []candidate{{p, currency}}
	}
	return nil
}

func firstNonEmpty(s ...string) string {
	for _, v := range s {
		if v != "" {
			return v
		}
	}
	return ""
}

func toPrice(v any) (float64, bool) {
	var p float64
	switch n := v.(type) {
	case float64:
		p = n
	case string:
		var ok bool
		if p, ok = parsePrice(n); !ok {
			return 0, false
		}
	default:
		return 0, false
	}
	if p <= 0 || math.IsInf(p, 0) || math.IsNaN(p) {
		return 0, false
	}
	return math.Round(p*100) / 100, true
}

// parsePrice accepts "129.99", "129,99", "1 299,99 zł" and "1.299,99".
func parsePrice(s string) (float64, bool) {
	s = strings.NewReplacer(" ", "", " ", "", "zł", "", "PLN", "", "pln", "").Replace(strings.TrimSpace(s))
	switch dot, comma := strings.LastIndex(s, "."), strings.LastIndex(s, ","); {
	case dot >= 0 && comma >= 0 && comma > dot: // 1.299,99
		s = strings.ReplaceAll(s, ".", "")
		s = strings.Replace(s, ",", ".", 1)
	case dot >= 0 && comma >= 0: // 1,299.99
		s = strings.ReplaceAll(s, ",", "")
	case comma >= 0:
		s = strings.Replace(s, ",", ".", 1)
	}
	p, err := strconv.ParseFloat(s, 64)
	return p, err == nil
}
