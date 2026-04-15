const fs = require('fs');
const path = require('path');

const PRODUCT_PAGES = [
    {
        key: 'tigla-metalica',
        title: 'Tigla metalica',
        filePath: path.join(process.cwd(), 'produse', 'tigla-metalica', 'index.html'),
        ruFilePath: path.join(process.cwd(), 'ru', 'produse', 'tigla-metalica', 'index.html'),
        keywords: ['tigla metalica', 'enigma', 'eterna', 'getica', 'laguna', 'optima', 'regalis']
    },
    {
        key: 'tigla-metalica-modulara-premium',
        title: 'Tigla metalica modulara',
        filePath: path.join(process.cwd(), 'produse', 'tigla-metalica-modulara-premium', 'index.html'),
        keywords: ['tigla metalica modulara', 'tigla modulara', 'modulara', 'tigla metalica modulara premium', 'modulara premium', 'parma', 'panorama']
    },
    {
        key: 'sindrila-bituminoasa',
        title: 'Sindrila bituminoasa',
        filePath: path.join(process.cwd(), 'produse', 'sindrila-bituminoasa', 'index.html'),
        ruFilePath: path.join(process.cwd(), 'ru', 'produse', 'sindrila-bituminoasa', 'index.html'),
        keywords: ['sindrila', 'sindrila bituminoasa', 'cambridge', 'katepal', 'kerabit', 'ruflex']
    },
    {
        key: 'sistem-de-scurgere',
        title: 'Sistem de scurgere',
        filePath: path.join(process.cwd(), 'produse', 'sistem-de-scurgere', 'index.html'),
        ruFilePath: path.join(process.cwd(), 'ru', 'produse', 'sistem-de-scurgere', 'index.html'),
        keywords: ['sistem de scurgere', 'jgheab', 'burlan', 'drainage', '125/87', '150/100']
    },
    {
        key: 'accesorii-acoperis',
        title: 'Accesorii acoperis',
        filePath: path.join(process.cwd(), 'produse', 'accesorii-acoperis', 'index.html'),
        ruFilePath: path.join(process.cwd(), 'ru', 'produse', 'accesorii-acoperis', 'index.html'),
        keywords: ['accesorii', 'accesorii acoperis', 'coama', 'dolie', 'folie']
    },
    {
        key: 'tabla-cutata',
        title: 'Tabla cutata',
        filePath: path.join(process.cwd(), 'produse', 'tabla-cutata', 'index.html'),
        ruFilePath: path.join(process.cwd(), 'ru', 'produse', 'tabla-cutata', 'index.html'),
        keywords: ['tabla cutata', 'profnastil', 'h7', 'h18', 'h44', 'hp12']
    }
];

const cachedChunks = { ro: null, ru: null };
const cachedModelComparisons = { ro: null, ru: null };

function decodeHtml(value) {
    return String(value || '')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/&rsquo;/gi, "'")
        .replace(/&ldquo;/gi, '"')
        .replace(/&rdquo;/gi, '"')
        .replace(/&deg;/gi, ' grade ')
        .replace(/&sup2;/gi, ' m2 ')
        .replace(/&trade;|&reg;/gi, ' ')
        .replace(/&#x27;/gi, "'")
        .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function stripHtml(value) {
    return decodeHtml(String(value || ''))
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<br\s*\/?>/gi, ' ')
        .replace(/<\/(p|li|tr|h1|h2|h3|h4|td|th|section|article|div)>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function normalizeText(value) {
    return String(value || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function getLocaleFilePath(page, language) {
    if (language === 'ru' && page.ruFilePath && fs.existsSync(page.ruFilePath)) {
        return page.ruFilePath;
    }

    return page.filePath;
}

function getMetaContent(html, name) {
    const pattern = new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i');
    const match = html.match(pattern);
    return match ? stripHtml(match[1]) : '';
}

function slicePreview(html, anchorIndex) {
    if (anchorIndex < 0) {
        return '';
    }

    const rawSlice = html.slice(anchorIndex, anchorIndex + 1800);
    const preview = stripHtml(rawSlice)
        .replace(/\s+/g, ' ')
        .trim();

    return preview.length > 420 ? `${preview.slice(0, 420).trim()}...` : preview;
}

function extractChunksFromPage(page, language = 'ro') {
    const sourcePath = getLocaleFilePath(page, language);
    if (!fs.existsSync(sourcePath)) {
        return [];
    }

    const html = fs.readFileSync(sourcePath, 'utf8');
    const chunks = [];
    const metaTitle = stripHtml((html.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || '');
    const metaDescription = getMetaContent(html, 'description');

    if (metaTitle || metaDescription) {
        chunks.push({
            kind: 'meta',
            source: page.title,
            heading: metaTitle || page.title,
            content: metaDescription || metaTitle,
            keywords: page.keywords
        });
    }

    const headingRegex = /<h([1-3])[^>]*>([\s\S]*?)<\/h\1>/gi;
    let match;

    while ((match = headingRegex.exec(html)) !== null) {
        const heading = stripHtml(match[2]);
        const content = slicePreview(html, match.index + match[0].length);

        if (!heading || !content) {
            continue;
        }

        chunks.push({
            kind: 'section',
            source: page.title,
            heading,
            content,
            keywords: page.keywords
        });
    }

    const rowRegex = /<tr[^>]*>\s*<t[dh][^>]*>([\s\S]*?)<\/t[dh]>\s*<t[dh][^>]*>([\s\S]*?)<\/t[dh]>\s*<\/tr>/gi;
    while ((match = rowRegex.exec(html)) !== null) {
        const label = stripHtml(match[1]);
        const value = stripHtml(match[2]);

        if (!label || !value) {
            continue;
        }

        chunks.push({
            kind: 'row',
            source: page.title,
            heading: `Date tehnice - ${label}`,
            content: `${label}: ${value}`,
            factLabel: label,
            factValue: value,
            keywords: [...page.keywords, label]
        });
    }

    const statRegex = /<article[^>]*product-features__meta-card[^>]*>[\s\S]*?<strong>([\s\S]*?)<\/strong>[\s\S]*?<span>([\s\S]*?)<\/span>[\s\S]*?<\/article>/gi;
    while ((match = statRegex.exec(html)) !== null) {
        const value = stripHtml(match[1]);
        const label = stripHtml(match[2]);

        if (!label || !value) {
            continue;
        }

        chunks.push({
            kind: 'stat',
            source: page.title,
            heading: `Repere rapide - ${label}`,
            content: `${label}: ${value}`,
            factLabel: label,
            factValue: value,
            keywords: [...page.keywords, label]
        });
    }

    return chunks;
}

function extractMetalTileModelComparisons(language = 'ro') {
    const page = PRODUCT_PAGES.find((entry) => entry.key === 'tigla-metalica');
    const sourcePath = page ? getLocaleFilePath(page, language) : '';
    if (!page || !sourcePath || !fs.existsSync(sourcePath)) {
        return [];
    }

    const html = fs.readFileSync(sourcePath, 'utf8');
    const cards = [];
    const cardRegex = /<article[^>]*metal-tile-models__card[^>]*>([\s\S]*?)<\/article>/gi;
    let match;

    while ((match = cardRegex.exec(html)) !== null) {
        const cardHtml = match[1];
        const title = stripHtml((cardHtml.match(/<h3[^>]*metal-tile-models__title[^>]*>([\s\S]*?)<\/h3>/i) || [])[1] || '');
        const description = stripHtml((cardHtml.match(/<p[^>]*metal-tile-models__desc[^>]*>([\s\S]*?)<\/p>/i) || [])[1] || '');

        if (!title || !description) {
            continue;
        }

        const rows = {};
        const rowRegex = /<tr>\s*<td>([\s\S]*?)<\/td>\s*<td>([\s\S]*?)<\/td>\s*<\/tr>/gi;
        let rowMatch;
        while ((rowMatch = rowRegex.exec(cardHtml)) !== null) {
            rows[stripHtml(rowMatch[1])] = stripHtml(rowMatch[2]);
        }

        cards.push({
            title,
            description,
            width: rows['Latimea utila'] || '',
            slope: rows['Inclinatia minima'] || '',
            weight: rows['Greutate'] || ''
        });
    }

    return cards;
}

function loadAllChunks(language = 'ro') {
    const locale = language === 'ru' ? 'ru' : 'ro';
    if (cachedChunks[locale]) {
        return cachedChunks[locale];
    }

    cachedChunks[locale] = PRODUCT_PAGES.flatMap((page) => extractChunksFromPage(page, locale));
    return cachedChunks[locale];
}

function loadModelComparisons(language = 'ro') {
    const locale = language === 'ru' ? 'ru' : 'ro';
    if (cachedModelComparisons[locale]) {
        return cachedModelComparisons[locale];
    }

    cachedModelComparisons[locale] = {
        metalClassic: extractMetalTileModelComparisons(locale)
    };

    return cachedModelComparisons[locale];
}

function getRelevantSiteChunks(message, topic, limit = 5, language = 'ro') {
    const combined = normalizeText(`${topic || ''} ${message || ''}`);
    const tokens = combined.split(' ').filter((token) => token.length >= 3);

    return scoreChunks(combined, tokens, language)
        .slice(0, limit)
        .map(({ chunk }) => `- ${chunk.source} / ${chunk.heading}: ${chunk.content}`);
}

function scoreChunks(combined, tokens, language = 'ro') {
    return loadAllChunks(language)
        .map((chunk) => {
            const haystack = normalizeText(`${chunk.source} ${chunk.heading} ${chunk.content} ${(chunk.keywords || []).join(' ')}`);
            let score = 0;

            tokens.forEach((token) => {
                if (haystack.includes(token)) {
                    score += token.length >= 7 ? 3 : 2;
                }
            });

            (chunk.keywords || []).forEach((keyword) => {
                if (combined.includes(normalizeText(keyword))) {
                    score += 4;
                }
            });

            return { chunk, score };
        })
        .filter((entry) => entry.score > 0)
        .sort((a, b) => b.score - a.score);
}

function detectFactType(combined) {
    if (/(diferenta|diferente|compara|comparatie|care model|modelele|modele|разниц|сравни|сравнен|какая модель|модел)/.test(combined)) return 'comparison';
    if (/(garantie|garantii|warranty|гарант)/.test(combined)) return 'warranty';
    if (/(grosime|thickness|толщин|mm|мм)/.test(combined)) return 'thickness';
    if (/(panta minima|panta|slope|inclin|уклон)/.test(combined)) return 'slope';
    if (/(zinc|zincare|цинк)/.test(combined)) return 'zinc';
    if (/(dimensiune|dimensiuni|latime|lungime|modul|size|dimension|размер|ширин|длин|модул)/.test(combined)) return 'dimensions';
    if (/(date tehnice|specificatii|specificatii tehnice|caracteristici|техническ|характеристик|параметр)/.test(combined)) return 'specs';
    return '';
}

function detectProduct(combined) {
    if (/(modulara premium|parma|panorama|модульн.*premium|парма|панорама)/.test(combined)) return 'tigla-metalica-modulara-premium';
    if (/(tigla metalica modulara|tigla modulara|modulara|модульн.*металлочерепиц|модульн.*черепиц)/.test(combined)) return 'tigla-metalica-modulara-premium';
    if (/(sindrila|bituminoasa|cambridge|katepal|kerabit|ruflex|битумн.*черепиц|гибк.*черепиц)/.test(combined)) return 'sindrila-bituminoasa';
    if (/(sistem de scurgere|jgheab|burlan|125 87|150 100|водосточн|желоб|труб)/.test(combined)) return 'sistem-de-scurgere';
    if (/(tabla cutata|profnastil|h7|h18|h44|hp12|профнастил|профлист)/.test(combined)) return 'tabla-cutata';
    if (/(tigla metalica|enigma|eterna|getica|laguna|optima|regalis|металлочерепиц)/.test(combined)) return 'tigla-metalica';
    return '';
}

function buildFactReply(language, productLabel, factType, factChunks) {
    const locale = language === 'ru' ? 'ru' : 'ro';
    const facts = factChunks
        .slice(0, factType === 'specs' ? 5 : 4)
        .map((entry) => entry.chunk)
        .map((chunk) => {
            if (chunk.factLabel && chunk.factValue) {
                return `${chunk.factLabel}: ${chunk.factValue}`;
            }

            return chunk.content;
        });

    if (!facts.length) {
        return '';
    }

    if (locale === 'ru') {
        if (factType === 'warranty') {
            return `По данным на сайте, для продукта "${productLabel}" указана гарантия в диапазоне ${facts.map((fact) => fact.replace(/^Garantie:\s*/i, '').replace(/^Гарантия:\s*/i, '')).join('; ')}.`;
        }

        if (factType === 'specs') {
            return `Для "${productLabel}" на сайте указаны такие технические данные: ${facts.join('; ')}.`;
        }

        return `Для "${productLabel}" на сайте указано: ${facts.join('; ')}.`;
    }

    if (factType === 'warranty') {
        return `${productLabel} are pe site o garantie mentionata in intervalul ${facts.map((fact) => fact.replace(/^Garantie:\s*/i, '')).join('; ')}.`;
    }

    if (factType === 'specs') {
        return `Pentru ${productLabel}, pe site apar aceste date tehnice: ${facts.join('; ')}.`;
    }

    return `Pentru ${productLabel}, pe site este mentionat: ${facts.join('; ')}.`;
}

function buildMetalClassicComparisonReply(language) {
    const models = loadModelComparisons(language).metalClassic || [];
    if (!models.length) {
        return '';
    }

    const summaries = models.slice(0, 6).map((model) => {
        const cleanName = language === 'ru'
            ? model.title.replace(/^Металлочерепица\s+/i, '').trim()
            : model.title.replace(/^Tigla Metalica\s+/i, '').trim();
        const parts = [model.description];

        if (model.slope) {
            parts.push(language === 'ru' ? `минимальный уклон ${model.slope}` : `panta minima ${model.slope}`);
        }

        if (model.weight) {
            parts.push(language === 'ru' ? `вес ${model.weight}` : `greutate ${model.weight}`);
        }

        return `${cleanName}: ${parts.join(', ')}`;
    });

    if (language === 'ru') {
        return `Разница между моделями классической металлочерепицы связана прежде всего с профилем, визуальным характером и несколькими практическими параметрами. Кратко: ${summaries.join('; ')}.`;
    }

    return `Diferența dintre modelele de țiglă metalică clasică ține mai ales de profil, aspectul vizual și câțiva parametri practici. Pe scurt: ${summaries.join('; ')}.`;
}

function getDirectFactAnswer(message, topic, language = 'ro') {
    const normalizedMessage = normalizeText(message || '');
    const combined = normalizeText(`${topic || ''} ${message || ''}`);
    const tokens = combined.split(' ').filter((token) => token.length >= 3);
    const factType = detectFactType(normalizedMessage);
    const productKey = detectProduct(combined);

    if (factType === 'comparison' && productKey === 'tigla-metalica') {
        return buildMetalClassicComparisonReply(language);
    }

    if (!factType || !productKey) {
        return '';
    }

    const productPage = PRODUCT_PAGES.find((page) => page.key === productKey);
    if (!productPage) {
        return '';
    }

    const factMatchers = {
        warranty: /(garantie|warranty)/,
        thickness: /(grosime|thickness|mm)/,
        slope: /(panta minima|panta|slope|inclin)/,
        zinc: /(zinc|zincare)/,
        dimensions: /(dimensiune|latime|lungime|modul|size|dimension)/,
        specs: /(garantie|grosime|panta minima|zinc|dimensiune|latime|lungime|greutate|rezistenta|acoperire)/
    };

    const matchingChunks = scoreChunks(combined, tokens, language)
        .filter((entry) => entry.chunk.source.toLowerCase() === productPage.title.toLowerCase())
        .filter((entry) => entry.chunk.kind === 'row' || entry.chunk.kind === 'stat')
        .filter((entry) => factMatchers[factType].test(normalizeText(`${entry.chunk.heading} ${entry.chunk.content}`)));

    if (factType === 'specs') {
        const preferredOrder = [
            /garantie/,
            /grosime/,
            /panta minima|panta/,
            /acoperire zinc|zinc/,
            /dimensiune|latime|lungime|modul/,
            /greutate/
        ];

        const ordered = [];
        preferredOrder.forEach((pattern) => {
            const found = matchingChunks.find((entry) => pattern.test(normalizeText(`${entry.chunk.heading} ${entry.chunk.content}`)));
            if (found && !ordered.includes(found)) {
                ordered.push(found);
            }
        });

        matchingChunks.forEach((entry) => {
            if (!ordered.includes(entry)) {
                ordered.push(entry);
            }
        });

        return buildFactReply(language, productPage.title, factType, ordered);
    }

    return buildFactReply(language, productPage.title, factType, matchingChunks);
}

module.exports = {
    getRelevantSiteChunks,
    getDirectFactAnswer
};
