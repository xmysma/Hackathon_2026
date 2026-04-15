---
name: commit-push
description: Stega, committa och pusha ändringar i excel-app till GitHub
allowed-tools: Bash
argument-hint: "[commit-meddelande]"
---

Utför följande steg för repot `/workspaces/Hackathon`:

1. Kör `git status` för att se vilka filer som ändrats.
2. Stega enbart filer under `excel-app/` (använd aldrig `git add -A` eller `git add .` – det kan råka inkludera Excel-filer eller temporärfiler som `~$*.xls`).
3. Skapa en commit. Om användaren angav ett meddelande via $ARGUMENTS, använd det. Annars formulera ett kort, beskrivande meddelande på engelska baserat på ändringarna.
   Lägg alltid till: `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>`
4. Pusha till `origin master`.
5. Bekräfta att pushen lyckades och länka till repot: https://github.com/xmysma/Hackathon_2026
