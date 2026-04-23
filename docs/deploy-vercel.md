# Deploy MoldAcoperis pe Vercel

## De ce Vercel

Site-ul are HTML/CSS/JS static, dar chatul AI si formularul de oferta folosesc endpointuri backend:

- `/api/chat`
- `/api/offer`

Un hosting pur static poate afisa paginile, dar nu poate executa aceste endpointuri. Vercel este varianta recomandata pentru testul de lansare, pentru ca poate servi simultan fisiere statice si functii serverless din folderul `api`.

## Pasi de deploy

1. Conecteaza repository-ul GitHub `Johan948/MoldAcoperis` in Vercel.
2. La framework preset alege `Other`.
3. Lasa build command gol.
4. Lasa output directory gol sau root-ul implicit al proiectului.
5. Adauga variabilele de mediu din sectiunea urmatoare.
6. Ruleaza deploy-ul.
7. Testeaza homepage, pagina RU, `/api/chat` si `/api/offer`.

## Variabile de mediu necesare

```text
GEMINI_API_KEY=cheia_reala_gemini
GEMINI_MODEL=gemini-2.5-flash
MAKE_OFFER_WEBHOOK_URL=https://hook....
MAKE_API_KEY=optional_daca_webhookul_il_cere
TELEGRAM_BOT_TOKEN=optional_pentru_trimitere_directa
TELEGRAM_CHAT_ID=optional_pentru_trimitere_directa
OFFER_DELIVERY_MODE=make
```

Pentru trimitere directa in Telegram, fara Make, seteaza `OFFER_DELIVERY_MODE=telegram` si completeaza `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID`.

## Test rapid dupa deploy

- Deschide homepage RO.
- Deschide homepage RU.
- Trimite un mesaj simplu in chat.
- Trimite o cerere de oferta din configurator sau chat.
- Verifica raspunsul `/api/offer`: daca `deliveredTo.make=true`, site-ul a predat cererea catre Make; daca mesajul nu apare in Telegram, trebuie verificata maparea din Make.
- Verifica in consola browserului sa nu existe erori `404` sau `500`.

## Daca alegem alt hosting

Hostingul trebuie sa suporte functii backend sau trebuie sa avem un backend separat. Daca alegem GitHub Pages, cPanel static sau un CDN simplu, chatul AI si formularul de oferta nu vor functiona fara un serviciu API separat.
