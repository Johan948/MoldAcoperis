const fs = require('fs');
const path = require('path');
const vm = require('vm');

const repoRoot = path.resolve(__dirname, '..');
const htmlExtensions = new Set(['.html']);
const assetExtensions = new Set([
    '.jpg',
    '.jpeg',
    '.png',
    '.webp',
    '.gif',
    '.svg',
    '.mp4',
    '.webm',
    '.mov',
    '.avi',
    '.mkv'
]);
const criticalFileMarkers = [
    '????',
    'mВІ',
    'AcasДѓ',
    'SolicitДѓ',
    'ChiИ™inДѓu',
    'CГ',
    'Дѓ',
    'И™',
    'И›',
    'РџС',
    'Р”Р',
    'РљР',
    'СЏ'
];
const targetScriptNames = [
    'js/main.js',
    'js/projects-data.js',
    'js/projects-render.js',
    'js/configurator-loader.js'
];
const productShellFiles = [
    'produse/accesorii-acoperis/index.html',
    'produse/sindrila-bituminoasa/index.html',
    'produse/sistem-de-scurgere/index.html',
    'produse/tabla-cutata/index.html',
    'produse/tigla-metalica/index.html',
    'ru/produse/accesorii-acoperis/index.html',
    'ru/produse/sindrila-bituminoasa/index.html',
    'ru/produse/sistem-de-scurgere/index.html',
    'ru/produse/tabla-cutata/index.html',
    'ru/produse/tigla-metalica/index.html',
    'ru/produse/tigla-metalica-modulara/index.html'
];
const privacyShellFiles = [
    'politica-confidentialitate/index.html',
    'ru/politica-confidentialitate/index.html'
];
const aboutShellFiles = [
    'despre-noi/index.html',
    'ru/despre-noi/index.html'
];
const contactShellFiles = [
    'contact/index.html',
    'ru/contact/index.html'
];

function walk(dirPath, predicate) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    const results = [];

    for (const entry of entries) {
        if (entry.name === '.git' || entry.name === 'node_modules') continue;
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
            results.push(...walk(fullPath, predicate));
            continue;
        }
        if (!predicate || predicate(fullPath)) {
            results.push(fullPath);
        }
    }

    return results;
}

function toPosix(relativePath) {
    return relativePath.split(path.sep).join('/');
}

function relPath(fullPath) {
    return toPosix(path.relative(repoRoot, fullPath));
}

function readUtf8(filePath) {
    return fs.readFileSync(filePath, 'utf8');
}

function bytesToMb(bytes) {
    return Number((bytes / (1024 * 1024)).toFixed(2));
}

function extractAttribute(tag, attributeName) {
    const attributePattern = new RegExp(`${attributeName}\\s*=\\s*(['"])(.*?)\\1`, 'i');
    const match = tag.match(attributePattern);
    return match ? match[2] : '';
}

function extractProjectsData() {
    const projectsDataPath = path.join(repoRoot, 'js', 'projects-data.js');
    const projectsDataCode = readUtf8(projectsDataPath);
    const sandbox = { window: {} };
    vm.createContext(sandbox);
    vm.runInContext(projectsDataCode, sandbox);
    return Array.isArray(sandbox.window.MA_PROJECTS) ? sandbox.window.MA_PROJECTS : [];
}

function extractBalancedObject(sourceCode, variableName) {
    const marker = `const ${variableName} =`;
    const markerIndex = sourceCode.indexOf(marker);
    if (markerIndex === -1) {
        throw new Error(`Could not find "${variableName}" in source.`);
    }

    const firstBraceIndex = sourceCode.indexOf('{', markerIndex);
    if (firstBraceIndex === -1) {
        throw new Error(`Could not find opening brace for "${variableName}".`);
    }

    let depth = 0;
    let inSingle = false;
    let inDouble = false;
    let inTemplate = false;
    let escaped = false;

    for (let index = firstBraceIndex; index < sourceCode.length; index += 1) {
        const char = sourceCode[index];

        if (escaped) {
            escaped = false;
            continue;
        }

        if (char === '\\') {
            escaped = true;
            continue;
        }

        if (!inDouble && !inTemplate && char === '\'' ) {
            inSingle = !inSingle;
            continue;
        }

        if (!inSingle && !inTemplate && char === '"') {
            inDouble = !inDouble;
            continue;
        }

        if (!inSingle && !inDouble && char === '`') {
            inTemplate = !inTemplate;
            continue;
        }

        if (inSingle || inDouble || inTemplate) continue;

        if (char === '{') {
            depth += 1;
        } else if (char === '}') {
            depth -= 1;
            if (depth === 0) {
                return sourceCode.slice(firstBraceIndex, index + 1);
            }
        }
    }

    throw new Error(`Could not parse object "${variableName}".`);
}

function extractProjectImageManifest() {
    const projectsRenderPath = path.join(repoRoot, 'js', 'projects-render.js');
    const projectsRenderCode = readUtf8(projectsRenderPath);
    const objectLiteral = extractBalancedObject(projectsRenderCode, 'projectImageManifest');
    return vm.runInNewContext(`(${objectLiteral})`);
}

function getHtmlFiles() {
    return walk(repoRoot, (filePath) => htmlExtensions.has(path.extname(filePath).toLowerCase()));
}

function auditHtmlScripts(htmlFiles) {
    const summary = {};

    for (const scriptName of targetScriptNames) {
        summary[scriptName] = { pages: 0, missingDefer: 0, examples: [] };
    }

    for (const htmlFile of htmlFiles) {
        const html = readUtf8(htmlFile);
        const scriptTags = html.match(/<script\b[^>]*>/gi) || [];

        for (const tag of scriptTags) {
            const src = extractAttribute(tag, 'src').replace(/\\/g, '/');
            if (!src) continue;

            for (const scriptName of targetScriptNames) {
                if (!src.endsWith(scriptName)) continue;

                const bucket = summary[scriptName];
                bucket.pages += 1;

                if (!/\bdefer\b/i.test(tag)) {
                    bucket.missingDefer += 1;
                    if (bucket.examples.length < 5) {
                        bucket.examples.push(relPath(htmlFile));
                    }
                }
            }
        }
    }

    return summary;
}

function auditHtmlImages(htmlFiles) {
    let total = 0;
    let decodingAsync = 0;
    let loadingLazy = 0;
    let fetchPriority = 0;
    const examplesMissingDecoding = [];
    const examplesMissingLazy = [];

    for (const htmlFile of htmlFiles) {
        const html = readUtf8(htmlFile);
        const imgTags = html.match(/<img\b[^>]*>/gi) || [];

        for (const tag of imgTags) {
            total += 1;
            const src = extractAttribute(tag, 'src');
            const decoding = extractAttribute(tag, 'decoding').toLowerCase();
            const loading = extractAttribute(tag, 'loading').toLowerCase();
            const fetchpriority = extractAttribute(tag, 'fetchpriority').toLowerCase();
            const isLikelyCriticalAsset = Boolean(fetchpriority) || /(?:^|\/)logo(?:[._-]|$)/i.test(src);

            if (decoding === 'async') {
                decodingAsync += 1;
            } else if (examplesMissingDecoding.length < 8) {
                examplesMissingDecoding.push(`${relPath(htmlFile)} -> ${src || '[inline-src-missing]'}`);
            }

            if (loading === 'lazy') {
                loadingLazy += 1;
            } else if (!isLikelyCriticalAsset && examplesMissingLazy.length < 8) {
                examplesMissingLazy.push(`${relPath(htmlFile)} -> ${src || '[inline-src-missing]'}`);
            }

            if (fetchpriority) {
                fetchPriority += 1;
            }
        }
    }

    return {
        total,
        decodingAsync,
        loadingLazy,
        fetchPriority,
        missingDecodingExamples: examplesMissingDecoding,
        missingLazyExamples: examplesMissingLazy
    };
}

function auditLargeAssets() {
    const imagesRoot = path.join(repoRoot, 'images');
    if (!fs.existsSync(imagesRoot)) {
        return { over5Mb: [], over10Mb: [] };
    }

    const assets = walk(imagesRoot, (filePath) => assetExtensions.has(path.extname(filePath).toLowerCase()))
        .map((filePath) => {
            const stats = fs.statSync(filePath);
            return {
                path: relPath(filePath),
                bytes: stats.size,
                mb: bytesToMb(stats.size)
            };
        })
        .sort((left, right) => right.bytes - left.bytes);

    return {
        over5Mb: assets.filter((asset) => asset.bytes >= 5 * 1024 * 1024).slice(0, 20),
        over10Mb: assets.filter((asset) => asset.bytes >= 10 * 1024 * 1024).slice(0, 20),
        top10: assets.slice(0, 10)
    };
}

function auditCoreFileSizes() {
    const trackedFiles = [
        'css/style.css',
        'js/main.js',
        'js/projects-render.js',
        'js/projects-data.js',
        'js/configurator-lt-test.js',
        'js/configurator.js',
        'js/configurator-loader.js'
    ];

    return trackedFiles
        .map((relativePath) => {
            const absolutePath = path.join(repoRoot, relativePath);
            if (!fs.existsSync(absolutePath)) return null;
            const size = fs.statSync(absolutePath).size;
            return {
                path: relativePath,
                bytes: size,
                kb: Number((size / 1024).toFixed(1))
            };
        })
        .filter(Boolean);
}

function normalizeNearDuplicateSlug(slug) {
    return String(slug || '')
        .toLowerCase()
        .replace(/(.)\1+/g, '$1');
}

function auditProjectsData(projects) {
    const idCounts = new Map();
    const slugCounts = new Map();
    const normalizedSlugCounts = new Map();

    for (const project of projects) {
        idCounts.set(project.id, (idCounts.get(project.id) || 0) + 1);
        slugCounts.set(project.slug, (slugCounts.get(project.slug) || 0) + 1);

        const normalized = normalizeNearDuplicateSlug(project.slug);
        if (!normalizedSlugCounts.has(normalized)) {
            normalizedSlugCounts.set(normalized, []);
        }
        normalizedSlugCounts.get(normalized).push(project.slug);
    }

    return {
        totalProjects: projects.length,
        duplicateIds: Array.from(idCounts.entries()).filter(([, count]) => count > 1).map(([value, count]) => ({ value, count })),
        duplicateSlugs: Array.from(slugCounts.entries()).filter(([, count]) => count > 1).map(([value, count]) => ({ value, count })),
        nearDuplicateSlugs: Array.from(normalizedSlugCounts.entries())
            .filter(([, slugList]) => new Set(slugList).size > 1)
            .map(([normalized, slugList]) => ({ normalized, slugs: Array.from(new Set(slugList)).sort() }))
    };
}

function auditProjectShellFiles(projects) {
    const files = [];

    for (const project of projects) {
        files.push(path.join(repoRoot, 'portofoliu', 'proiecte', project.slug, 'index.html'));
        files.push(path.join(repoRoot, 'ru', 'portofoliu', 'proiecte', project.slug, 'index.html'));
    }

    return auditShellFamily(files, {
        emptyTopInfo: /<div class="header__top-info">\s*<\/div>/,
        emptyTopSocial: /<div class="header__top-social">\s*<\/div>/,
        emptyNav: /<ul class="header__menu" id="navMenu">\s*<\/ul>/,
        footerShell: /<footer class="footer"><\/footer>/,
        noHeaderCta: (html) => !/header__cta\s+js-open-modal/.test(html),
        noBackToTop: (html) => !/id="backToTop"/.test(html),
        noModal: (html) => !/id="ofertaModal"/.test(html),
        emptyCtaShell: /<section class="cta-banner">\s*<div class="container">\s*<\/div>\s*<\/section>/s,
        staticProjectHeader: /<h1 class="page-header__title" id="projectHeroTitle">[^<]+<\/h1>/,
        staticProjectContent: /<main id="projectPageContent">\s*<section class="project-detail">/s
    });
}

function auditShellFamily(fileList, checks) {
    const results = {
        totalFiles: fileList.length,
        presentFiles: 0,
        missingFiles: [],
        checks: {}
    };

    for (const checkName of Object.keys(checks)) {
        results.checks[checkName] = { passed: 0, failed: [] };
    }

    for (const filePath of fileList) {
        if (!fs.existsSync(filePath)) {
            results.missingFiles.push(relPath(filePath));
            continue;
        }

        results.presentFiles += 1;
        const html = readUtf8(filePath);

        for (const [checkName, rule] of Object.entries(checks)) {
            const passed = typeof rule === 'function' ? rule(html) : rule.test(html);
            if (passed) {
                results.checks[checkName].passed += 1;
            } else if (results.checks[checkName].failed.length < 6) {
                results.checks[checkName].failed.push(relPath(filePath));
            }
        }
    }

    return results;
}

function auditProjectManifest(projects, manifest) {
    const missingProjectPages = [];
    const manifestMissing = [];
    const manifestExtras = [];

    for (const project of projects) {
        const folderName = String(project.id).padStart(2, '0');
        const folderPath = path.join(repoRoot, 'images', 'projects', folderName);
        const manifestFiles = Array.isArray(manifest[project.id]) ? manifest[project.id] : [];
        const existingFiles = fs.existsSync(folderPath)
            ? fs.readdirSync(folderPath).filter((name) => fs.statSync(path.join(folderPath, name)).isFile())
            : [];

        const roProjectPage = path.join(repoRoot, 'portofoliu', 'proiecte', project.slug, 'index.html');
        const ruProjectPage = path.join(repoRoot, 'ru', 'portofoliu', 'proiecte', project.slug, 'index.html');

        if (!fs.existsSync(roProjectPage)) missingProjectPages.push(relPath(roProjectPage));
        if (!fs.existsSync(ruProjectPage)) missingProjectPages.push(relPath(ruProjectPage));

        for (const fileName of manifestFiles) {
            if (!fs.existsSync(path.join(folderPath, fileName))) {
                manifestMissing.push(`${folderName}/${fileName}`);
            }
        }

        const extraFiles = existingFiles
            .filter((fileName) => !fileName.startsWith('.'))
            .filter((fileName) => !manifestFiles.includes(fileName))
            .sort();

        if (extraFiles.length) {
            manifestExtras.push({
                folder: `images/projects/${folderName}`,
                extraFiles: extraFiles.slice(0, 10)
            });
        }
    }

    return {
        projectCount: projects.length,
        manifestEntries: Object.keys(manifest).length,
        missingProjectPages,
        missingManifestFiles: manifestMissing,
        extraProjectFiles: manifestExtras
    };
}

function auditMojibake() {
    const criticalJsFiles = [
        path.join(repoRoot, 'js', 'projects-data.js'),
        path.join(repoRoot, 'js', 'projects-render.js'),
        path.join(repoRoot, 'js', 'main.js')
    ];
    const criticalHtmlRoots = [
        path.join(repoRoot, 'portofoliu', 'proiecte'),
        path.join(repoRoot, 'ru', 'portofoliu', 'proiecte'),
        path.join(repoRoot, 'blog'),
        path.join(repoRoot, 'ru', 'blog'),
        path.join(repoRoot, 'produse'),
        path.join(repoRoot, 'ru', 'produse')
    ];
    const candidateFiles = [
        ...criticalJsFiles,
        path.join(repoRoot, 'index.html'),
        path.join(repoRoot, 'ru', 'index.html'),
        ...criticalHtmlRoots.flatMap((rootPath) => fs.existsSync(rootPath)
            ? walk(rootPath, (filePath) => filePath.endsWith('.html'))
            : [])
    ];

    const seen = new Set();
    const uniqueCandidates = candidateFiles.filter((filePath) => {
        const key = filePath.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return fs.existsSync(filePath);
    });

    const suspectFiles = [];

    for (const filePath of uniqueCandidates) {
        const source = readUtf8(filePath);
        const hits = criticalFileMarkers.filter((marker) => source.includes(marker));
        if (!hits.length) continue;
        suspectFiles.push({
            path: relPath(filePath),
            markers: hits
        });
    }

    return {
        scannedFiles: uniqueCandidates.length,
        suspectFiles
    };
}

function buildReport() {
    const htmlFiles = getHtmlFiles();
    const projects = extractProjectsData();
    const projectImageManifest = extractProjectImageManifest();

    return {
        generatedAt: new Date().toISOString(),
        repoRoot,
        htmlPages: htmlFiles.length,
        coreFiles: auditCoreFileSizes(),
        scripts: auditHtmlScripts(htmlFiles),
        htmlImages: auditHtmlImages(htmlFiles),
        largeAssets: auditLargeAssets(),
        projects: auditProjectsData(projects),
        projectManifest: auditProjectManifest(projects, projectImageManifest),
        shellFamilies: {
            projectPages: auditProjectShellFiles(projects),
            productPages: auditShellFamily(productShellFiles.map((relativePath) => path.join(repoRoot, relativePath)), {
                emptyTopInfo: /<div class="header__top-info">\s*<\/div>/,
                emptyTopSocial: /<div class="header__top-social">\s*<\/div>/,
                emptyNav: /<ul class="header__menu" id="navMenu">\s*<\/ul>/,
                footerShell: /<footer class="footer"><\/footer>/,
                noHeaderCta: (html) => !/header__cta\s+js-open-modal/.test(html),
                noBackToTop: (html) => !/id="backToTop"/.test(html),
                noModal: (html) => !/id="ofertaModal"/.test(html)
            }),
            privacyPages: auditShellFamily(privacyShellFiles.map((relativePath) => path.join(repoRoot, relativePath)), {
                emptyTopInfo: /<div class="header__top-info">\s*<\/div>/,
                emptyTopSocial: /<div class="header__top-social">\s*<\/div>/,
                emptyNav: /<ul class="header__menu" id="navMenu">\s*<\/ul>/,
                footerShell: /<footer class="footer"><\/footer>/,
                noHeaderCta: (html) => !/header__cta\s+js-open-modal/.test(html),
                noBackToTop: (html) => !/id="backToTop"/.test(html),
                noModal: (html) => !/id="ofertaModal"/.test(html)
            }),
            aboutPages: auditShellFamily(aboutShellFiles.map((relativePath) => path.join(repoRoot, relativePath)), {
                emptyTopInfo: /<div class="header__top-info">\s*<\/div>/,
                emptyTopSocial: /<div class="header__top-social">\s*<\/div>/,
                emptyNav: /<ul class="header__menu" id="navMenu">\s*<\/ul>/,
                footerShell: /<footer class="footer"><\/footer>/,
                noHeaderCta: (html) => !/header__cta\s+js-open-modal/.test(html),
                noBackToTop: (html) => !/id="backToTop"/.test(html),
                noModal: (html) => !/id="ofertaModal"/.test(html)
            }),
            contactPages: auditShellFamily(contactShellFiles.map((relativePath) => path.join(repoRoot, relativePath)), {
                emptyTopInfo: /<div class="header__top-info">\s*<\/div>/,
                emptyTopSocial: /<div class="header__top-social">\s*<\/div>/,
                emptyNav: /<ul class="header__menu" id="navMenu">\s*<\/ul>/,
                footerShell: /<footer class="footer"><\/footer>/,
                noHeaderCta: (html) => !/header__cta\s+js-open-modal/.test(html),
                noBackToTop: (html) => !/id="backToTop"/.test(html),
                noModal: (html) => !/id="ofertaModal"/.test(html)
            })
        },
        mojibake: auditMojibake()
    };
}

function formatShellFamily(name, familyReport) {
    const lines = [
        `- ${name}: files=${familyReport.totalFiles}, present=${familyReport.presentFiles}, missing=${familyReport.missingFiles.length}`
    ];

    for (const [checkName, result] of Object.entries(familyReport.checks)) {
        lines.push(`  - ${checkName}: ${result.passed}/${familyReport.presentFiles}`);
        if (result.failed.length) {
            lines.push(`    examples: ${result.failed.join(', ')}`);
        }
    }

    if (familyReport.missingFiles.length) {
        lines.push(`  - missing examples: ${familyReport.missingFiles.slice(0, 6).join(', ')}`);
    }

    return lines.join('\n');
}

function printHumanReport(report) {
    console.log('=== MoldAcoperis Site Audit ===');
    console.log(`Generated: ${report.generatedAt}`);
    console.log(`Repo root: ${report.repoRoot}`);
    console.log(`HTML pages: ${report.htmlPages}`);
    console.log('');

    console.log('Core files:');
    for (const file of report.coreFiles) {
        console.log(`- ${file.path}: ${file.kb} KB`);
    }
    console.log('');

    console.log('Script defer coverage:');
    for (const [scriptName, result] of Object.entries(report.scripts)) {
        console.log(`- ${scriptName}: pages=${result.pages}, missingDefer=${result.missingDefer}`);
        if (result.examples.length) {
            console.log(`  examples: ${result.examples.join(', ')}`);
        }
    }
    console.log('');

    console.log('HTML image hints:');
    console.log(`- total img tags: ${report.htmlImages.total}`);
    console.log(`- decoding=\"async\": ${report.htmlImages.decodingAsync}`);
    console.log(`- loading=\"lazy\": ${report.htmlImages.loadingLazy}`);
    console.log(`- fetchpriority set: ${report.htmlImages.fetchPriority}`);
    if (report.htmlImages.missingDecodingExamples.length) {
        console.log(`- missing decoding examples: ${report.htmlImages.missingDecodingExamples.join(', ')}`);
    }
    if (report.htmlImages.missingLazyExamples.length) {
        console.log(`- missing lazy examples: ${report.htmlImages.missingLazyExamples.join(', ')}`);
    }
    console.log('');

    console.log('Largest assets:');
    for (const asset of report.largeAssets.top10) {
        console.log(`- ${asset.path}: ${asset.mb} MB`);
    }
    console.log(`- over 5 MB: ${report.largeAssets.over5Mb.length}`);
    console.log(`- over 10 MB: ${report.largeAssets.over10Mb.length}`);
    console.log('');

    console.log('Projects data:');
    console.log(`- total projects: ${report.projects.totalProjects}`);
    console.log(`- duplicate ids: ${report.projects.duplicateIds.length}`);
    console.log(`- duplicate slugs: ${report.projects.duplicateSlugs.length}`);
    console.log(`- near-duplicate slugs: ${report.projects.nearDuplicateSlugs.length}`);
    if (report.projects.nearDuplicateSlugs.length) {
        for (const group of report.projects.nearDuplicateSlugs) {
            console.log(`  - ${group.normalized}: ${group.slugs.join(', ')}`);
        }
    }
    console.log('');

    console.log('Project manifest:');
    console.log(`- projects expected: ${report.projectManifest.projectCount}`);
    console.log(`- manifest entries: ${report.projectManifest.manifestEntries}`);
    console.log(`- missing project pages: ${report.projectManifest.missingProjectPages.length}`);
    console.log(`- missing manifest files: ${report.projectManifest.missingManifestFiles.length}`);
    console.log(`- project folders with extra files: ${report.projectManifest.extraProjectFiles.length}`);
    if (report.projectManifest.missingManifestFiles.length) {
        console.log(`  missing examples: ${report.projectManifest.missingManifestFiles.slice(0, 10).join(', ')}`);
    }
    if (report.projectManifest.extraProjectFiles.length) {
        for (const entry of report.projectManifest.extraProjectFiles.slice(0, 8)) {
            console.log(`  - ${entry.folder}: extras=${entry.extraFiles.join(', ')}`);
        }
    }
    console.log('');

    console.log('Shell families:');
    console.log(formatShellFamily('projectPages', report.shellFamilies.projectPages));
    console.log(formatShellFamily('productPages', report.shellFamilies.productPages));
    console.log(formatShellFamily('privacyPages', report.shellFamilies.privacyPages));
    console.log(formatShellFamily('aboutPages', report.shellFamilies.aboutPages));
    console.log(formatShellFamily('contactPages', report.shellFamilies.contactPages));
    console.log('');

    console.log('Mojibake scan:');
    console.log(`- scanned files: ${report.mojibake.scannedFiles}`);
    console.log(`- suspect files: ${report.mojibake.suspectFiles.length}`);
    if (report.mojibake.suspectFiles.length) {
        for (const suspect of report.mojibake.suspectFiles.slice(0, 12)) {
            console.log(`  - ${suspect.path}: ${suspect.markers.join(', ')}`);
        }
    }
}

const report = buildReport();

if (process.argv.includes('--json')) {
    console.log(JSON.stringify(report, null, 2));
} else {
    printHumanReport(report);
}
