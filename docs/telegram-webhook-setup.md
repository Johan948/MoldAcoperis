# Telegram Webhook Setup (oferta)

Formularul de oferta trimite acum JSON catre un endpoint webhook.

## 1) Configureaza endpoint-ul in frontend

In `js/main.js` exista variabila:

- `offerWebhookEndpoint`

Poti seta endpoint-ul in doua moduri:

1. Global JS (recomandat):
   - setezi `window.MA_OFFER_WEBHOOK = "https://..."` inainte de `js/main.js`
2. Meta tag pe pagina:
   - `<meta name="ma-offer-webhook" content="https://...">`

## 1.1) Configureaza API key-ul Make (x-make-apikey)

Daca webhook-ul Make cere cheia in header, configureaza cheia astfel:

1. Global JS:
  - setezi `window.MA_MAKE_API_KEY = "CHEIA_TA"` inainte de `js/main.js`
2. Meta tag pe pagina:
  - `<meta name="ma-make-apikey" content="CHEIA_TA">`

Aplicatia trimite automat header-ul HTTP:

- `x-make-apikey: CHEIA_TA`

Important:

- Cand API key-ul este activ, endpoint-ul trebuie sa permita CORS pentru request-ul cu header custom.
- Fallback-ul `no-cors` nu poate trimite `x-make-apikey`.

## 2) Creeaza un webhook simplu (Cloudflare Worker exemplu)

```js
export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    try {
      const data = await request.json();
      const lead = data.lead || {};
      const lines = [
        "Noua solicitare oferta",
        `Nume: ${lead.name || "-"}`,
        `Telefon: ${lead.phone || "-"}`,
        `Limba: ${data.language || "-"}`,
        `Pagina: ${data.pageUrl || "-"}`,
        `Timp: ${data.submittedAt || "-"}`
      ];

      if (data.estimateSummary) {
        lines.push(`Estimare: ${data.estimateSummary}`);
      }

      const text = lines.join("\n");

      const tgUrl = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`;
      const tgRes = await fetch(tgUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: env.TELEGRAM_CHAT_ID,
          text
        })
      });

      if (!tgRes.ok) {
        const details = await tgRes.text();
        return new Response(`Telegram error: ${details}`, { status: 502 });
      }

      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    } catch (err) {
      return new Response(`Invalid request: ${err.message}`, { status: 400 });
    }
  }
};
```

Seteaza secretele in Worker:

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`

## 3) Test rapid

1. Deschide site-ul
2. Trimite formularul "Solicita Oferta"
3. Verifica mesajul in Telegram

Daca endpoint-ul nu e configurat, site-ul afiseaza eroare in modal.
