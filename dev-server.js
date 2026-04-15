const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const chatHandler = require('./api/chat');
const offerHandler = require('./api/offer');

const PORT = Number(process.env.PORT || 8787);
const ROOT_DIR = process.cwd();

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.avif': 'image/avif',
    '.gif': 'image/gif',
    '.ico': 'image/x-icon',
    '.txt': 'text/plain; charset=utf-8',
    '.xml': 'application/xml; charset=utf-8'
};

function sendJson(res, statusCode, payload) {
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(payload));
}

function setCorsHeaders(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function mapUrlToFilePath(urlPath) {
    let safePath = decodeURIComponent(urlPath.split('?')[0]);
    if (safePath === '/') {
        safePath = '/index.html';
    }

    const absolutePath = path.normalize(path.join(ROOT_DIR, safePath));
    if (!absolutePath.startsWith(ROOT_DIR)) {
        return null;
    }

    if (fs.existsSync(absolutePath) && fs.statSync(absolutePath).isFile()) {
        return absolutePath;
    }

    if (fs.existsSync(absolutePath) && fs.statSync(absolutePath).isDirectory()) {
        const indexPath = path.join(absolutePath, 'index.html');
        if (fs.existsSync(indexPath)) {
            return indexPath;
        }
    }

    if (!path.extname(absolutePath)) {
        const htmlPath = `${absolutePath}.html`;
        if (fs.existsSync(htmlPath)) {
            return htmlPath;
        }

        const indexPath = path.join(absolutePath, 'index.html');
        if (fs.existsSync(indexPath)) {
            return indexPath;
        }
    }

    return null;
}

function serveStatic(req, res) {
    const filePath = mapUrlToFilePath(req.url || '/');
    if (!filePath) {
        res.statusCode = 404;
        res.end('Not found');
        return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.statusCode = 200;
    res.setHeader('Content-Type', MIME_TYPES[ext] || 'application/octet-stream');
    fs.createReadStream(filePath).pipe(res);
}

async function handleJsonApi(req, res, handler, label) {
    setCorsHeaders(res);

    if (req.method === 'OPTIONS') {
        res.statusCode = 204;
        res.end();
        return;
    }

    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', async () => {
        try {
            const rawBody = Buffer.concat(chunks).toString('utf8');
            req.body = rawBody ? JSON.parse(rawBody) : {};
        } catch (error) {
            sendJson(res, 400, { error: 'Invalid JSON body' });
            return;
        }

        try {
            await handler(req, res);
        } catch (error) {
            console.error(`${label} handler error:`, error);
            sendJson(res, 500, { error: 'Internal server error' });
        }
    });
}

const server = http.createServer(async (req, res) => {
    const currentUrl = new URL(req.url || '/', `http://${req.headers.host || `localhost:${PORT}`}`);

    if (currentUrl.pathname === '/api/chat') {
        await handleJsonApi(req, res, chatHandler, 'Chat');
        return;
    }

    if (currentUrl.pathname === '/api/offer') {
        await handleJsonApi(req, res, offerHandler, 'Offer');
        return;
    }

    serveStatic(req, res);
});

server.listen(PORT, () => {
    console.log(`MoldAcoperis dev server running at http://localhost:${PORT}`);
});
