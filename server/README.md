# Game Wishlist price server

Mały serwis w Go (bez zależności poza biblioteką standardową), który zwraca aktualną cenę gry z linku do oferty
w **Ceneo, Allegro lub GG.deals**. Używa go aplikacja mobilna (`EXPO_PUBLIC_PRICE_API_URL`).

```
GET /price?store=ceneo|allegro|ggdeals&url=<https link do oferty>
Authorization: Bearer <API_KEY>        # tylko gdy ustawiono API_KEY

200 {"price":129.99,"currency":"PLN","source":"json-ld","cached":false}
200 {"price":null,"error":"no price found on the page","cached":false}   # strona wczytana, ale bez ceny
400 {"error":"url does not point to the selected store"}
401 {"error":"invalid or missing API key"}
502 {"error":"shop blocked the request (HTTP 403)"}                        # sklep zablokował lub nie odpowiedział
GET /healthz  → 200
```

## Uruchomienie

```bash
go run .                                     # :8080
API_KEY=tajne CACHE_TTL=30m go run .
docker build -t wishlist-price-server . && docker run -p 8080:8080 -e API_KEY=tajne wishlist-price-server
go test -race ./...
```

| Zmienna | Domyślnie | Opis |
|---|---|---|
| `PORT` | `8080` | port HTTP |
| `API_KEY` | puste | jeśli ustawione, wymagany nagłówek `Authorization: Bearer …` (puste = serwis otwarty, w logu pojawia się ostrzeżenie) |
| `CACHE_TTL` | `30m` | jak długo pamiętać cenę (błędy: 2 min) |
| `UPSTREAM_TIMEOUT` | `15s` | limit czasu pobierania strony sklepu |
| `HOST_MIN_GAP` | `1s` | minimalny odstęp między zapytaniami do tego samego sklepu |
| `USER_AGENT` | mobilny Chrome | nagłówek `User-Agent` wysyłany do sklepów |

## Jak czyta ceny

Serwis nie używa selektorów CSS, które psują się przy każdej zmianie strony. Czyta dane, które sklepy publikują dla wyszukiwarek:

1. JSON-LD `schema.org` (`Offer` / `AggregateOffer`, także w `@graph` i tablicach), przy kilku ofertach wybiera najniższą dostępną,
2. meta `product:price:amount` / `og:price:amount` / `itemprop=price`.

Akceptuje tylko PLN. Formaty `129.99`, `129,99`, `1 299,00 zł`, `1.299,99` są obsługiwane.

## Bezpieczeństwo

- Adres musi być `https` na domenie wybranego sklepu (`ceneo.pl`, `allegro.pl`, `gg.deals` i subdomeny), bez loginu, bez IP, bez niestandardowego portu. Ta sama reguła obowiązuje dla każdego przekierowania, więc `?url=` nie działa jako otwarte proxy ani SSRF.
- Odpowiedzi błędów nie ujawniają szczegółów wewnętrznych.
- Równoległe zapytania o tę samą ofertę dzielą jedno pobranie, a zapytania do jednego sklepu są rozstawiane w czasie.

## Ważne ograniczenia

**Parsery nie były uruchamiane na żywych stronach sklepów.** Środowisko, w którym powstał serwis, nie miało do nich dostępu, więc testy używają ręcznie napisanych stron w typowych formatach, a nie zapisów prawdziwych stron. Pierwsze zapytanie na prawdziwy link pokaże, czy dany sklep publikuje cenę w jednym z powyższych formatów.

- **Allegro** zwykle blokuje zautomatyzowane zapytania (odpowiedź 403 daje błąd 502). Trwałe rozwiązanie to oficjalne API Allegro (OAuth, bezpłatna rejestracja aplikacji).
- **Ceneo** ma API partnerskie, ale wymaga akceptacji. Scrapowanie może być sprzeczne z regulaminem, więc sprawdź go przed użyciem.
- **GG.deals** ma oficjalne API z kluczem (wyszukiwanie po Steam App ID lub tytule), które jest stabilniejsze niż czytanie HTML.
- Regulaminy sklepów mogą zabraniać automatycznego pobierania stron. Odpowiadasz za zgodność użycia z nimi.
