# Gemini Chat Setup

Acest proiect include acum un endpoint serverless pentru chat AI:

- `api/chat.js`
- `api/chat-knowledge.js`

## Ce trebuie sa configurezi

1. Adauga variabila de mediu:

`GEMINI_API_KEY`

2. Optional, seteaza modelul:

`GEMINI_MODEL=gemini-2.0-flash`

3. Hosteaza proiectul pe o platforma care suporta functii serverless in folderul `api/`, de exemplu Vercel.

## Test local rapid

Poti porni un server local simplu astfel:

`node dev-server.js`

Apoi deschizi:

`http://localhost:8787`

## Cum functioneaza

- widgetul din site trimite mesajul catre `/api/chat`
- endpointul selecteaza context relevant din knowledge base
- endpointul trimite promptul si istoricul scurt catre Gemini
- raspunsul revine in widget
- daca endpointul nu merge, widgetul cade pe raspunsurile locale deja existente

## Observatii

- cheia Gemini nu trebuie pusa niciodata in frontend
- knowledge base-ul initial este local si editabil in `api/chat-knowledge.js`
- pentru productie serioasa, urmatorul pas este sa inlocuim knowledge base-ul static cu un RAG real
