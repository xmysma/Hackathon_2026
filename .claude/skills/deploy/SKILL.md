---
name: deploy
description: Bygg excel-app för produktion och ge driftsättningsinstruktioner
allowed-tools: Bash
---

1. Kör `npm run build` i `/workspaces/Hackathon/excel-app` och verifiera att det lyckas.
2. Ge sedan följande instruktioner till användaren:

**Driftsättning på webbhotell**

Ladda upp hela innehållet i mappen `excel-app/dist/` till din katalog på webbhotellet (t.ex. via FTP eller filhanteraren i kontrollpanelen).

Viktigt:
- Ladda upp filerna inuti `dist/` – inte själva `dist/`-mappen.
- `base: './'` är redan konfigurerat i `vite.config.ts`, så appen fungerar i valfri undermapp eller subdomän utan ytterligare ändringar.
- Appen kräver ingen server-side-logik – alla filer är statiska.
- Om du använder Apache: skapa en `.htaccess`-fil med `FallbackResource index.html` om du vill ha ren URL-routing (krävs inte för nuvarande app).
