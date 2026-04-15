const fs = require('fs');
const path = require('path');

function loadEnvFileIfNeeded() {
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

function safeJson(res, statusCode, payload) {
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.end(JSON.stringify(payload));
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
        return safeJson(res, 500, { error: 'Missing MAKE_OFFER_WEBHOOK_URL environment variable' });
    }

    const payload = typeof req.body === 'string'
        ? JSON.parse(req.body || '{}')
        : (req.body || {});

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
        return safeJson(res, 502, {
            error: 'Offer webhook request failed',
            status: response.status,
            message: message.slice(0, 300)
        });
    }

    return safeJson(res, 200, { ok: true });
};
