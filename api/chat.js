const fs = require('fs');
const path = require('path');
const { knowledgeBase } = require('./chat-knowledge');
const { getRelevantSiteChunks, getDirectFactAnswer } = require('./chat-site-content');

function loadEnvFileIfNeeded() {
    if (process.env.GEMINI_API_KEY) {
        return;
    }

    const envPaths = [
        path.join(process.cwd(), '.env.local'),
        path.join(process.cwd(), '.env')
    ];

    envPaths.forEach((envPath) => {
        if (!fs.existsSync(envPath)) {
            return;
        }

        const content = fs.readFileSync(envPath, 'utf8');
        content.split(/\r?\n/).forEach((line) => {
            const trimmedLine = line.trim();
            if (!trimmedLine || trimmedLine.startsWith('#')) {
                return;
            }

            const separatorIndex = trimmedLine.indexOf('=');
            if (separatorIndex === -1) {
                return;
            }

            const key = trimmedLine.slice(0, separatorIndex).trim();
            const rawValue = trimmedLine.slice(separatorIndex + 1).trim();
            const value = rawValue.replace(/^['"]|['"]$/g, '');

            if (key && !process.env[key]) {
                process.env[key] = value;
            }
        });
    });
}

loadEnvFileIfNeeded();

const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta';

function normalizeText(value) {
    return String(value || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function safeJson(res, statusCode, payload) {
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.end(JSON.stringify(payload));
}

function buildKnowledgeContext(language, latestMessage, topic) {
    const locale = language === 'ru' ? 'ru' : 'ro';
    const base = knowledgeBase[locale];
    const normalizedMessage = normalizeText(`${topic || ''} ${latestMessage || ''}`);

    const scoredTopics = base.topics.map((topic) => {
        const haystack = normalizeText(`${topic.title} ${topic.content}`);
        let score = 0;
        normalizedMessage.split(' ').forEach((token) => {
            if (token.length >= 4 && haystack.includes(token)) {
                score += 1;
            }
        });
        return { topic, score };
    });

    const selectedTopics = scoredTopics
        .sort((a, b) => b.score - a.score)
        .slice(0, 4)
        .map(({ topic }) => `- ${topic.title}: ${topic.content}`)
        .join('\n');

    const faqEntries = Array.isArray(base.faq) ? base.faq : [];
    const scoredFaq = faqEntries.map((entry) => {
        const haystack = normalizeText(`${entry.question} ${entry.answer}`);
        let score = 0;
        normalizedMessage.split(' ').forEach((token) => {
            if (token.length >= 4 && haystack.includes(token)) {
                score += 1;
            }
        });
        return { entry, score };
    });

    const selectedFaq = scoredFaq
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map(({ entry }) => `- Q: ${entry.question}\n  A: ${entry.answer}`)
        .join('\n');

    const siteContext = getRelevantSiteChunks(latestMessage, topic, 5, locale).join('\n');

    return {
        locale,
        company: base.company,
        topic: String(topic || '').trim(),
        contextText: selectedTopics || base.topics.slice(0, 3).map((topic) => `- ${topic.title}: ${topic.content}`).join('\n'),
        faqText: selectedFaq,
        siteContextText: siteContext,
        policies: base.policies
    };
}

function buildSystemInstruction(language, context) {
    if (language === 'ru') {
        return [
            'You are the MoldAcoperis website assistant for Russian-speaking visitors.',
            'Always answer in Russian.',
            'Your role is to act like a competent roofing consultant: friendly, calm, practical, and conversion-oriented without being pushy.',
            'Keep answers short, practical, and sales-safe.',
            'Answer the user question first, then suggest the most useful next step.',
            'Use only the supplied MoldAcoperis knowledge context.',
            'If the exact answer is unavailable, say so briefly and direct the user to request a quote or contact the team.',
            'Never invent exact pricing, stock, guaranteed deadlines, or technical specs that are not in the provided context.',
            'Do not publish final per-square-meter tariffs as a default answer. Explain that prices are orientative and depend on project details.',
            'If warranty ranges, technical values or product specs are present in the provided context, use them directly and summarize them clearly.',
            'Do not promote installation as a standalone page or standalone service. Use the framing: complete roof system, correct execution, personalized quote.',
            'If the user wants a quote, ask for name, phone, locality, roof/product type, and optionally approximate area or photos.',
            'Never say that a request was submitted, registered, saved or sent unless the website explicitly confirms it after a real form submission.',
            'Do not use markdown formatting like **bold**, bullet markdown, or headings with symbols. Return clean plain text only.',
            'When the user shows buying intent, suggest leaving name, phone, locality, and roof type.',
            context.topic ? `Current chat topic selected by the user: ${context.topic}. Use it as supporting context for short follow-up messages.` : '',
            `Company info: ${context.company.name}, phone ${context.company.phone}, email ${context.company.email}, address ${context.company.address}, service area ${context.company.area}, experience ${context.company.experience || ''}, projects ${context.company.projects || ''}.`,
            'Policies:',
            ...context.policies,
            'Knowledge context:',
            context.contextText,
            context.faqText ? 'Relevant FAQ:' : '',
            context.faqText || '',
            context.siteContextText ? 'Relevant product page context:' : '',
            context.siteContextText || ''
        ].join('\n');
    }

    return [
        'You are the MoldAcoperis website assistant for Romanian-speaking visitors.',
        'Always answer in Romanian.',
        'Rolul tau este sa raspunzi ca un consultant competent pentru acoperisuri: prietenos, calm, practic si orientat spre conversie fara presiune.',
        'Keep answers concise, practical and commercially safe.',
        'Raspunde mai intai la intrebarea utilizatorului, apoi propune pasul urmator util.',
        'Use only the supplied MoldAcoperis knowledge context.',
        'If the exact answer is unavailable, say so briefly and recommend a quote request or direct contact.',
        'Never invent exact pricing, stock, guaranteed deadlines or technical specs that are not in the context.',
        'Nu publica tarife finale pe metru patrat ca raspuns standard. Explica faptul ca preturile sunt orientative si depind de detaliile proiectului.',
        'If warranty ranges, technical values or product specs are present in the provided context, use them directly and summarize them clearly.',
        'Nu promova montajul ca pagina sau serviciu separat. Foloseste formularea: sistem complet de acoperis, executie corecta, oferta personalizata.',
        'Daca utilizatorul doreste oferta, cere nume, telefon, localitate, tip acoperis/produs si optional suprafata aproximativa sau poze.',
        'Never say that a request was submitted, registered, saved or sent unless the website explicitly confirms it after a real form submission.',
        'Do not use markdown formatting like **bold**, bullet markdown, or headings with symbols. Return clean plain text only.',
        'When the user shows buying intent, suggest leaving name, phone, locality and roof type.',
        context.topic ? `Current chat topic selected by the user: ${context.topic}. Use it as supporting context for short follow-up messages.` : '',
        `Company info: ${context.company.name}, phone ${context.company.phone}, email ${context.company.email}, address ${context.company.address}, service area ${context.company.area}, experience ${context.company.experience || ''}, projects ${context.company.projects || ''}.`,
        'Policies:',
        ...context.policies,
        'Knowledge context:',
        context.contextText,
        context.faqText ? 'Relevant FAQ:' : '',
        context.faqText || '',
        context.siteContextText ? 'Relevant product page context:' : '',
        context.siteContextText || ''
    ].join('\n');
}

function extractReply(data) {
    const candidates = Array.isArray(data && data.candidates) ? data.candidates : [];
    const firstCandidate = candidates[0] || {};
    const parts = firstCandidate.content && Array.isArray(firstCandidate.content.parts)
        ? firstCandidate.content.parts
        : [];
    const text = parts
        .map((part) => typeof part.text === 'string' ? part.text : '')
        .join('\n')
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/^\s*[*]\s+/gm, '- ')
        .trim();

    return {
        text,
        finishReason: String(firstCandidate.finishReason || '').toUpperCase()
    };
}

async function callGemini({ apiKey, model, systemInstruction, history }) {
    const endpoint = `${GEMINI_API_URL}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            system_instruction: {
                parts: [{ text: systemInstruction }]
            },
            generationConfig: {
                temperature: 0.35,
                topP: 0.9,
                maxOutputTokens: 4096
            },
            contents: history
        })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        const errorMessage = data && data.error && data.error.message
            ? data.error.message
            : `Gemini request failed with ${response.status}`;
        throw new Error(errorMessage);
    }

    return extractReply(data);
}

function needsContinuation(replyText, finishReason) {
    if (!replyText) {
        return false;
    }

    if (finishReason === 'MAX_TOKENS') {
        return true;
    }

    return !/[.!?)]["']?\s*$/.test(replyText);
}

async function generateReplyWithContinuation({ apiKey, model, systemInstruction, history }) {
    let combinedReply = '';
    let currentHistory = [...history];

    for (let attempt = 0; attempt < 3; attempt += 1) {
        const result = await callGemini({
            apiKey,
            model,
            systemInstruction,
            history: currentHistory
        });

        const chunk = String(result.text || '').trim();
        if (!chunk) {
            break;
        }

        combinedReply = combinedReply
            ? `${combinedReply}${combinedReply.endsWith('-') ? '' : ' '}${chunk}`.trim()
            : chunk;

        if (!needsContinuation(chunk, result.finishReason)) {
            break;
        }

        currentHistory = [
            ...currentHistory,
            {
                role: 'model',
                parts: [{ text: chunk }]
            },
            {
                role: 'user',
                parts: [{
                    text: 'Continue exact de unde te-ai oprit. Nu repeta inceputul si incheie raspunsul complet.'
                }]
            }
        ];
    }

    return combinedReply.trim();
}

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return safeJson(res, 405, { error: 'Method not allowed' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'replace_with_your_gemini_api_key') {
        return safeJson(res, 500, { error: 'Missing GEMINI_API_KEY environment variable' });
    }

    const body = typeof req.body === 'string'
        ? JSON.parse(req.body || '{}')
        : (req.body || {});

    const language = body.language === 'ru' ? 'ru' : 'ro';
    const message = String(body.message || '').trim();
    const topic = String(body.topic || '').trim();
    const history = Array.isArray(body.history) ? body.history : [];

    if (!message) {
        return safeJson(res, 400, { error: 'Message is required' });
    }

    const directFactAnswer = getDirectFactAnswer(message, topic, language);
    if (directFactAnswer) {
        return safeJson(res, 200, { reply: directFactAnswer });
    }

    const context = buildKnowledgeContext(language, message, topic);
    const systemInstruction = buildSystemInstruction(language, context);
    const contents = history
        .slice(-10)
        .map((entry) => ({
            role: entry.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: String(entry.text || '').slice(0, 1200) }]
        }));

    contents.push({
        role: 'user',
        parts: [{ text: message }]
    });

    try {
        const reply = await generateReplyWithContinuation({
            apiKey,
            model: DEFAULT_MODEL,
            systemInstruction,
            history: contents
        });

        return safeJson(res, 200, {
            reply: reply || (language === 'ru'
                ? 'Nu am gasit un raspuns sigur in acest moment. Te rog cere o oferta sau contacteaza echipa.'
                : 'Nu am gasit un raspuns sigur in acest moment. Te rog cere o oferta sau contacteaza echipa.')
        });
    } catch (error) {
        return safeJson(res, 500, {
            error: error.message || 'Gemini request failed'
        });
    }
};
