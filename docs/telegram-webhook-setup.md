# Telegram Offer Setup

Formularele si chatul trimit cererile de oferta catre endpointul backend:

- `/api/offer`

Frontendul nu trebuie sa contina tokenuri Telegram sau URL-uri private. Endpointul backend citeste variabilele din `.env.local` in dezvoltare sau din setarile de environment ale hostingului in productie.

## Varianta 1: Make webhook

Configureaza:

```env
MAKE_OFFER_WEBHOOK_URL=https://hook...
MAKE_API_KEY=optional_make_api_key
OFFER_DELIVERY_MODE=make
```

Endpointul trimite catre Make un payload JSON normalizat, inclusiv campuri usor de mapat:

```json
{
  "source": "site-chatbot",
  "language": "ro",
  "leadName": "Ion",
  "leadPhone": "+373...",
  "leadEmail": "",
  "leadLocation": "Chisinau",
  "leadInterest": "tigla metalica",
  "messageText": "Mesajul clientului",
  "estimateSummary": "Rezumat configurator",
  "telegramText": "Text gata formatat pentru Telegram"
}
```

In Make, cea mai sigura mapare este sa trimiti direct campul `telegramText` in modulul Telegram `Send a message`.

## Varianta 2: Telegram direct

Daca vrei sa eliminam dependenta de Make pentru oferta, configureaza:

```env
TELEGRAM_BOT_TOKEN=tokenul_botului
TELEGRAM_CHAT_ID=id_chat_sau_grup
OFFER_DELIVERY_MODE=telegram
```

In acest mod, `/api/offer` trimite direct mesajul in Telegram si poate returna eroare reala daca Telegram respinge cererea.

## Varianta 3: Make + Telegram direct

Pentru testare sau redundanta:

```env
MAKE_OFFER_WEBHOOK_URL=https://hook...
TELEGRAM_BOT_TOKEN=tokenul_botului
TELEGRAM_CHAT_ID=id_chat_sau_grup
OFFER_DELIVERY_MODE=both
```

Atentie: acest mod poate dubla mesajele daca Make trimite deja in Telegram.

## Test local

1. Completeaza `.env.local`.
2. Porneste site-ul cu:

```bash
npm run dev
```

3. Testeaza endpointul:

```bash
curl -X POST http://localhost:8787/api/offer \
  -H "Content-Type: application/json" \
  -d "{\"source\":\"test\",\"lead\":{\"name\":\"Test\",\"phone\":\"+37300000000\"},\"message\":\"Test oferta\"}"
```

Un raspuns bun arata asa:

```json
{
  "ok": true,
  "deliveredTo": {
    "make": true,
    "telegram": false
  }
}
```

Daca `make` este `true`, site-ul a transmis cererea catre Make. Daca mesajul nu apare in Telegram, problema este in scenariul Make sau in maparea modulului Telegram.
