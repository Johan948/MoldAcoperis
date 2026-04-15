# Configurator 3D casa in L

Demo standalone pentru o casa in forma de L, pregatit ca baza de integrare in website-ul principal.

## Cum se ruleaza

1. Deschide `index.html` intr-un browser modern.
2. Daca browserul blocheaza importurile ES modules locale, serveste folderul printr-un server static simplu.

Exemple:

```powershell
python -m http.server 8080
```

sau

```powershell
npx serve .
```

## Ce include

- geometrie parametrizabila pentru ambele corpuri ale casei
- control pentru inaltimea peretilor, coama si streasina
- personalizare culori pereti, soclu si acoperis
- camera orbit cu zoom, rotire si pan
- statistici rapide pentru suprafata si volum aproximativ

## Observatii pentru integrare

- Logica 3D este in `script.js`.
- UI-ul este separat in `index.html` si `style.css`.
- Importurile `three` si `OrbitControls` folosesc CDN si pot fi inlocuite usor cu dependintele din proiectul principal.
