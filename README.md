# Game Wishlist

Mobilna aplikacja (Expo / React Native) do prowadzenia wishlisty gier i **monitorowania cen w Ceneo, Allegro i GG.deals**.
Układ ekranów pochodzi z makiety z Claude Design (Start, Gry, Szczegóły gry, Dodaj/Edytuj, Platformy, Ustawienia).

## Stack

- Expo SDK 58, React Native 0.88, React 19, TypeScript, Expo Router
- **NativeWind v5** (Tailwind CSS v4) do stylowania
- **[`@kjaniec-dev/design`](https://www.npmjs.com/package/@kjaniec-dev/design) 1.0.0**: tokeny kolorów, promienie i motyw `@theme` (ciemny motyw domyślnie)
- Zustand + AsyncStorage (dane lokalne), `react-native-svg` (ikony i wykres cen)

### Dlaczego tylko tokeny, a nie `@kjaniec-dev/ui`?

`@kjaniec-dev/ui` to biblioteka komponentów **webowych** (HTML + `react-dom`), więc nie działa w React Native.
Aplikacja używa z niej tego, co się da przenieść: tokenów i motywu z `@kjaniec-dev/design`.
`scripts/build-theme.mjs` (uruchamiany w `postinstall`) generuje z pakietu:

- `src/kj-theme.generated.css`: zmienne `--kj-*`, wariant ciemny pod `prefers-color-scheme` (na natywie nie ma klasy `.dark`) oraz mostek Tailwind `@theme`,
- `src/lib/kj-colors.generated.ts`: gotowe palety dla miejsc, gdzie nie da się użyć `className` (SVG, gradienty, motyw nawigacji).

Dzięki temu działają klasy takie jak `bg-canvas`, `bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-primary`, `text-success`.

## Uruchomienie

```bash
npm install
npx expo start
```

Aplikacja wymaga development builda lub Expo Go zgodnego z SDK 58. Wersja webowa: `npx expo start --web`.

## Ceny

Użytkownik dodaje grę, a na ekranie gry wkleja link do oferty w każdym ze sklepów (adres jest sprawdzany pod kątem domeny).
Aplikacja zapisuje historię cen, pokazuje wykres, zmianę względem poprzedniego odczytu, najtańszą ofertę i oznaczenie **Okazja**, gdy najniższa cena spadnie do ceny docelowej.
Ceny odświeżają się po otwarciu aplikacji (jeśli ostatni odczyt jest starszy niż 6 h), po pociągnięciu listy w dół i przyciskiem „Odśwież”.

### Źródło cen

Aplikacja nie scrapuje sklepów bezpośrednio (CORS, ochrona przed botami, regulaminy). Ceny pobiera z backendu, którego adres podaje się w `.env`:

```
EXPO_PUBLIC_PRICE_API_URL=https://twoj-backend.example.com
```

Kontrakt (jedno zapytanie na ofertę):

```
GET {EXPO_PUBLIC_PRICE_API_URL}/price?store=ceneo|allegro|ggdeals&url=<link do oferty>
200 { "price": 129.99 }     // cena w PLN
200 { "price": null }       // oferta bez ceny / niedostępna
```

**Bez ustawionej zmiennej działa tryb demo**: ceny są symulowane, a świeżo dodany link dostaje przykładową historię z 30 dni.
Tryb jest widoczny w Ustawieniach (wiersz „Źródło cen”). Dane przykładowe można wczytać z ekranu Start lub z Ustawień.

## Struktura

```
src/app/            trasy (Expo Router): (tabs)/*, game/[id], form
src/components/     ui.tsx (komponenty z makiety), icon.tsx, screen.tsx
src/lib/            store.ts (Zustand), prices.ts (źródło cen i wyliczenia), catalog.ts, demo.ts, theme.ts
scripts/            build-theme.mjs
```

## Znane ograniczenia

- Brak powiadomień push o spadku ceny: na razie oznaczenie „Okazja” w aplikacji. Wymaga `expo-notifications` + zadania w tle i development builda.
- Brak importu z JSON (jest eksport przez systemowe „Udostępnij”).
- `overrides.lightningcss` w `package.json` jest potrzebne: NativeWind v5 (rc) nie działa z lightningcss 1.33.
