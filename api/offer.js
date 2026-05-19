const fs = require('fs');
const path = require('path');

function loadEnvFileIfNeeded() {
    const envPaths = [
        path.join(process.cwd(), '.env.local'),
        path.join(process.cwd(), '.env')
    ];

    envPaths.forEach((envPath) => {
        if (!fs.existsSync(envPath)) return;

        const content = fs.readFileSync(envPath, 'utf8');
        content.split(/\r?\n/).forEach((line) => {
            const trimmedLine = line.trim();
            if (!trimmedLine || trimmedLine.startsWith('#')) return;

            const separatorIndex = trimmedLine.indexOf('=');
            if (separatorIndex === -1) return;

            const key = trimmedLine.slice(0, separatorIndex).trim();
            const rawValue = trimmedLine.slice(separatorIndex + 1).trim();
            const value = rawValue.replace(/^['"]|['"]$/g, '');

            if (key && !process.env[key]) {
                process.env[key] = value;
            }
        });
    });
}

function safeJson(res, statusCode, payload) {
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.end(JSON.stringify(payload));
}

function cleanString(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
}

function cleanMultiline(value) {
    return String(value || '').replace(/\r\n/g, '\n').trim();
}

function firstNonEmpty(...values) {
    for (const value of values) {
        const cleaned = cleanString(value);
        if (cleaned) return cleaned;
    }
    return '';
}

function parseRequestBody(req) {
    if (!req.body) return {};
    if (typeof req.body === 'object') return req.body;

    const rawBody = String(req.body || '').trim();
    if (!rawBody) return {};

    try {
        return JSON.parse(rawBody);
    } catch (error) {
        const params = new URLSearchParams(rawBody);
        const payloadJson = params.get('payloadJson');

        if (payloadJson) {
            try {
                return JSON.parse(payloadJson);
            } catch (payloadError) {
                return Object.fromEntries(params.entries());
            }
        }

        return Object.fromEntries(params.entries());
    }
}

function normalizeOfferPayload(rawPayload) {
    const payload = rawPayload && typeof rawPayload === 'object' ? rawPayload : {};
    const rawLead = payload.lead && typeof payload.lead === 'object' ? payload.lead : {};
    const leadName = firstNonEmpty(rawLead.name, payload.leadName, payload.name, payload.nume, payload.prenume);
    const leadPhone = firstNonEmpty(rawLead.phone, payload.leadPhone, payload.phone, payload.telefon);
    const leadEmail = firstNonEmpty(rawLead.email, payload.leadEmail, payload.email);
    const leadLocation = firstNonEmpty(rawLead.location, payload.leadLocation, payload.location, payload.localitate);
    const leadInterest = firstNonEmpty(rawLead.interest, rawLead.roofType, payload.leadInterest, payload.roofType, payload.product, payload.interest);
    const messageText = cleanMultiline(payload.message || payload.messageText || payload.mesaj || '');
    const estimateSummary = cleanMultiline(payload.estimateSummary || payload.summary || '');

    return {
        ...payload,
        source: firstNonEmpty(payload.source, 'website'),
        language: firstNonEmpty(payload.language, 'ro'),
        pageUrl: cleanString(payload.pageUrl),
        pagePath: cleanString(payload.pagePath),
        submittedAt: firstNonEmpty(payload.submittedAt, new Date().toISOString()),
        lead: {
            ...rawLead,
            name: leadName,
            phone: leadPhone,
            email: leadEmail,
            location: leadLocation,
            interest: leadInterest
        },
        leadName,
        leadPhone,
        leadEmail,
        leadLocation,
        leadInterest,
        messageText,
        estimateSummary
    };
}

async function sendMakeWebhook(webhookUrl, makeApiKey, payload) {
    const headers = {
        'Content-Type': 'application/json'
    };

    if (makeApiKey) {
        headers['x-make-apikey'] = makeApiKey;
    }

    const response = await fetch(webhookUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const message = await response.text().catch(() => '');
        const error = new Error('Offer webhook request failed');
        error.status = response.status;
        error.details = message.slice(0, 300);
        throw error;
    }
}

loadEnvFileIfNeeded();

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return safeJson(res, 405, { error: 'Method not allowed' });
    }

    const webhookUrl = String(process.env.MAKE_OFFER_WEBHOOK_URL || '').trim();
    const makeApiKey = String(process.env.MAKE_API_KEY || '').trim();

    if (!webhookUrl || !/^https:\/\/hook\./i.test(webhookUrl)) {
        return safeJson(res, 500, {
            error: 'Missing offer delivery configuration',
            required: 'Set MAKE_OFFER_WEBHOOK_URL'
        });
    }

    let payload;
    try {
        payload = normalizeOfferPayload(parseRequestBody(req));
    } catch (error) {
        return safeJson(res, 400, { error: 'Invalid request body' });
    }

    try {
        await sendMakeWebhook(webhookUrl, makeApiKey, payload);
    } catch (error) {
        return safeJson(res, 502, {
            error: error.message || 'Offer delivery failed',
            status: error.status || 502,
            message: error.details || ''
        });
    }

    return safeJson(res, 200, {
        ok: true,
        deliveredTo: {
            make: true
        }
    });
};
