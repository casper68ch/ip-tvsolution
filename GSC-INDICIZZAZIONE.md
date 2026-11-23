# Indicizzazione su Google Search Console

Procedura esatta per far indicizzare e posizionare https://ip-tvsolution.online.

> Nota: il blocco temporaneo dell'ISP locale verso alcuni IP Cloudflare (188.114.x) **non riguarda Googlebot**. Il sito è raggiungibile normalmente dall'esterno: i controlli qui sotto vanno fatti nella Search Console, non dal browser di casa.

## 1. Accesso

1. Vai su https://search.google.com/search-console
2. Accedi con **montebellog@gmail.com**.
3. Seleziona la proprietà **ip-tvsolution.online** (già verificata in precedenza).

## 2. Invia la sitemap

1. Menu a sinistra → **Indicizzazione** → **Sitemap**.
2. In "Aggiungi una nuova sitemap" incolla:
   ```
   sitemap.xml
   ```
3. Clicca **Invia**.
4. Dopo qualche minuto lo stato deve diventare **Operazione riuscita** (41 URL circa: home, chi siamo, guida, FAQ, note legali, 8 piattaforme, 21 player).

## 3. Richiedi indicizzazione delle 6 URL chiave

Menu **Indicizzazione** → **Controllo URL** (barra in alto "Controlla qualsiasi URL"), incolla una alla volta e clicca **Richiedi indicizzazione**:

1. `https://ip-tvsolution.online/`
2. `https://ip-tvsolution.online/app/iptv-solution-windows/`
3. `https://ip-tvsolution.online/app/iptv-solution-web/`
4. `https://ip-tvsolution.online/app/iptv-solution-smart-tv/`
5. `https://ip-tvsolution.online/app/iptv-solution-android/`
6. `https://ip-tvsolution.online/app/iptv-solution-iphone/`

## 4. Verifica dopo 24–48 ore

- **Indicizzazione → Pagine**: controlla che le URL risultino "Indicizzate".
- **Prestazioni** (o *Search Analytics*): filtra la query `ip-tvsolution` e verifica impression/click.
- Se una pagina resta "Non indicizzata", apri il risultato e controlla il motivo (di solito "Scoperta — non ancora indicizzata": basta attendere).

## 5. Cose che aiutano il posizionamento (già fatte)

- JSON-LD `Organization`, `WebSite`, `ItemList`, `SoftwareApplication`, `FAQPage`, `BreadcrumbList`.
- `robots.txt` con sitemap dichiarata.
- `og-image.png` 1200×630 per la condivisione social.
- Lighthouse: Performance 90, Accessibilità 97, Best Practices 100, SEO 100; LCP 2.0s, CLS 0.
- Contenuti unici per ciascuna delle 21 schede player.

## 6. Tempi realistici

Un dominio nuovo impiega in media **4–12 settimane** per comparire nelle prime posizioni con query di marca. La richiesta di indicizzazione accelera la scoperta, ma non garantisce il ranking: contano backlink legittimi (GitHub, social, directory), coerenza del brand e contenuti aggiornati.

Link utili: README GitHub pronto nel repository (`README-GITHUB.md`) da pubblicare quando crei la repo.
