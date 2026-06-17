# Analytics — provozní poznámky

## Vercel Web Analytics

Projekt používá **Vercel Web Analytics** pro základní přehled návštěvnosti.

### Kód

Balíček `@vercel/analytics` je v `package.json`.
Komponenta `<Analytics />` je v root layoutu (`app/layout.tsx`) — sleduje všechny stránky globálně.

```tsx
import { Analytics } from "@vercel/analytics/next";
// ...
<body>
  {children}
  <Analytics />
</body>
```

### Zapnutí / vypnutí

Analytics se **aktivuje ve Vercel dashboardu** — záložka projektu → Analytics → Enable.
Bez aktivace ve dashboardu se žádná data neshromažďují, i když je komponenta v kódu.

### Co se sleduje

Pouze základní přehled návštěvnosti: počet návštěv, stránky, referrers.
Vercel Web Analytics je cookie-free a GDPR-friendly — nevyžaduje souhlas s cookies.

### Co se NEsleduje

Žádné osobní údaje se neukládají do vlastní DB.
Žádné vlastní události ani custom tracking zatím není implementován.

---

## GoatCounter (volitelné)

Projekt má také podporu pro **GoatCounter** jako alternativní open-source analytics.
Aktivuje se přes env proměnnou `NEXT_PUBLIC_GOATCOUNTER_CODE` v Vercelu.
Pokud proměnná není nastavená, GoatCounter skript se nenačte.
