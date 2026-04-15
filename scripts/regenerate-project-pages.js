const fs = require('fs');
const path = require('path');
const vm = require('vm');

const repoRoot = path.resolve(__dirname, '..');
const projectsDataPath = path.join(repoRoot, 'js', 'projects-data.js');
const projectsDataCode = fs.readFileSync(projectsDataPath, 'utf8');

const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(projectsDataCode, sandbox);

const projects = sandbox.window.MA_PROJECTS || [];

const ruProductMap = {
    'Tigla metalica': 'Металлочерепица',
    'Tigla metalica modulara': 'Модульная металлочерепица',
    'Sindrila bituminoasa': 'Битумная черепица',
    'Tabla Cutata': 'Профнастил',
    'Accesorii Acoperis': 'Кровельные аксессуары'
};

const ruRoofShapeMap = {
    '3 pante': '3 ската',
    '4 pante': '4 ската',
    '5 pante': '5 скатов',
    '6 pante': '6 скатов',
    '7 pante': '7 скатов'
};

const escapeHtml = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const escapeJson = (value) => String(value ?? '');

const localizedProduct = (project, language) => {
    if (language === 'ru') {
        return ruProductMap[project.product] || project.product;
    }

    const roProductMap = {
        'Tigla metalica': 'Țiglă metalică',
        'Tigla metalica modulara': 'Țiglă metalică modulară',
        'Sindrila bituminoasa': 'Șindrilă bituminoasă',
        'Tabla Cutata': 'Tablă cutată',
        'Accesorii Acoperis': 'Accesorii acoperiș'
    };

    return roProductMap[project.product] || project.product;
};

const localizedRoofShape = (roofShape, language) => {
    if (language === 'ru') {
        return ruRoofShapeMap[roofShape] || roofShape;
    }

    return roofShape;
};

const buildProjectTitle = (project, language) => {
    if (language === 'ru') {
        return `Проект #${project.id} ${localizedProduct(project, 'ru')} ${project.model} в ${project.locality} | MoldAcoperis`;
    }

    return `Proiectul #${project.id} ${localizedProduct(project, 'ro')} ${project.model} în ${project.locality} | MoldAcoperis`;
};

const buildProjectDescription = (project, language) => {
    if (language === 'ru') {
        return `Документированный проект MoldAcoperis: ${localizedProduct(project, 'ru')} ${project.model} в ${project.locality}, площадь ${project.area} м², ${localizedRoofShape(project.roofShape, 'ru')} и полный набор кровельных деталей.`;
    }

    return `Proiect documentat MoldAcoperis: ${localizedProduct(project, 'ro')} ${project.model} în ${project.locality}, suprafață ${project.area} m², ${localizedRoofShape(project.roofShape, 'ro')} și pachet complet de detalii pentru acoperiș.`;
};

const buildSummaryLead = (project, language) => {
    if (language === 'ru') {
        return `${localizedProduct(project, 'ru')} ${project.model} для объекта в ${project.locality} с площадью кровли ${project.area} м² и конфигурацией ${localizedRoofShape(project.roofShape, 'ru').toLowerCase()}.`;
    }

    return `${localizedProduct(project, 'ro')} ${project.model} pentru un proiect din ${project.locality}, cu ${project.area} m² de acoperiș și configurație ${localizedRoofShape(project.roofShape, 'ro').toLowerCase()}.`;
};

const buildAlternateLinks = (project) => {
    const roHref = `https://moldacoperis.md/portofoliu/proiecte/${project.slug}/`;
    const ruHref = `https://moldacoperis.md/ru/portofoliu/proiecte/${project.slug}/`;

    return [
        `    <link rel="alternate" hreflang="ro" href="${escapeHtml(roHref)}">`,
        `    <link rel="alternate" hreflang="ru" href="${escapeHtml(ruHref)}">`,
        `    <link rel="alternate" hreflang="x-default" href="${escapeHtml(roHref)}">`
    ].join('\n');
};

const buildStructuredData = (project, language, pageHref) => {
    const isRussianPage = language === 'ru';
    const homeHref = isRussianPage ? 'https://moldacoperis.md/ru/' : 'https://moldacoperis.md/';
    const portfolioHref = isRussianPage ? 'https://moldacoperis.md/ru/portofoliu/' : 'https://moldacoperis.md/portofoliu/';

    return JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'BreadcrumbList',
                itemListElement: [
                    {
                        '@type': 'ListItem',
                        position: 1,
                        name: isRussianPage ? 'Главная' : 'Acasă',
                        item: homeHref
                    },
                    {
                        '@type': 'ListItem',
                        position: 2,
                        name: isRussianPage ? 'Портфолио' : 'Portofoliu',
                        item: portfolioHref
                    },
                    {
                        '@type': 'ListItem',
                        position: 3,
                        name: `${isRussianPage ? 'Проект' : 'Proiect'} #${project.id}`,
                        item: pageHref
                    }
                ]
            },
            {
                '@type': 'Article',
                headline: buildProjectTitle(project, language).replace(' | MoldAcoperis', ''),
                description: buildProjectDescription(project, language),
                mainEntityOfPage: pageHref,
                author: { '@type': 'Organization', name: 'MoldAcoperis' },
                publisher: { '@type': 'Organization', name: 'MoldAcoperis' },
                about: localizedProduct(project, language),
                articleSection: isRussianPage ? 'Портфолио' : 'Portofoliu',
                inLanguage: language,
                keywords: [
                    localizedProduct(project, language),
                    project.model,
                    project.locality,
                    localizedRoofShape(project.roofShape, language)
                ]
            }
        ]
    });
};

const buildStaticProjectMain = (project, language, depthPrefix) => {
    const isRussianPage = language === 'ru';
    const coverFolder = String(project.id).padStart(2, '0');
    const coverSrc = `${depthPrefix}images/projects/${coverFolder}/${coverFolder}.jpg`;
    const summaryHeading = isRussianPage ? 'Кратко о проекте' : 'Pe scurt despre proiect';
    const technicalHeading = isRussianPage ? 'Технические repere' : 'Repere tehnice';
    const introTag = isRussianPage ? 'Документированный объект' : 'Obiect documentat';
    const facts = [
        {
            label: isRussianPage ? 'Продукт' : 'Produs',
            value: `${localizedProduct(project, language)} ${project.model}`
        },
        {
            label: isRussianPage ? 'Локация' : 'Localitate',
            value: project.location
        },
        {
            label: isRussianPage ? 'Размеры дома' : 'Dimensiuni casă',
            value: project.dimensions
        },
        {
            label: isRussianPage ? 'Конфигурация' : 'Configurație',
            value: localizedRoofShape(project.roofShape, language)
        },
        {
            label: isRussianPage ? 'Площадь кровли' : 'Suprafață acoperiș',
            value: `${project.area} m²`
        },
        {
            label: isRussianPage ? 'Цвет' : 'Culoare',
            value: project.color
        },
        {
            label: isRussianPage ? 'Гарантия' : 'Garanție',
            value: project.warranty
        },
        {
            label: isRussianPage ? 'Водосток' : 'Sistem de scurgere',
            value: project.drainage
        },
        {
            label: isRussianPage ? 'Карниз и finisaje' : 'Streașină și finisaje',
            value: project.eaves
        }
    ];

    if (project.specialNote) {
        facts.push({
            label: isRussianPage ? 'Observație' : 'Observație',
            value: project.specialNote
        });
    }

    const factsMarkup = facts.map(({ label, value }) => `
                                <li><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></li>`).join('');

    const projectLead = isRussianPage
        ? `Этот проект опубликован в статическом HTML как документированный кейс MoldAcoperis, чтобы страница была понятна поисковым системам даже без выполнения JavaScript.`
        : `Acest proiect este publicat și în HTML static, ca exemplu documentat MoldAcoperis, astfel încât pagina să fie clară pentru motoarele de căutare chiar și fără execuție JavaScript.`;

    return `
    <main id="projectPageContent">
        <section class="project-detail">
            <div class="container">
                <div class="project-detail__hero">
                    <div class="project-detail__intro">
                        <span class="project-detail__eyebrow">${escapeHtml(introTag)}</span>
                        <h2>${escapeHtml(summaryHeading)}</h2>
                        <p>${escapeHtml(project.summary)}</p>
                        <p>${escapeHtml(buildSummaryLead(project, language))}</p>
                        <div class="project-detail__chips">
                            <span><i class="fas fa-layer-group"></i> ${escapeHtml(localizedProduct(project, language))}</span>
                            <span><i class="fas fa-map-marker-alt"></i> ${escapeHtml(project.locality)}</span>
                            <span><i class="fas fa-ruler-combined"></i> ${project.area} m²</span>
                        </div>
                    </div>
                    <aside class="project-detail__panel">
                        <div class="project-visual project-visual--cover">
                            <img class="project-visual__photo js-fallback-image" src="${escapeHtml(coverSrc)}" data-source-list="${escapeHtml(coverSrc)}" data-source-index="0" alt="${escapeHtml(`${localizedProduct(project, language)} ${project.model} ${isRussianPage ? 'в' : 'în'} ${project.locality}`)}" loading="eager" decoding="async">
                        </div>
                        <div class="project-detail__panel-grid">
                            <div><strong>${project.area}</strong><span>${isRussianPage ? 'м² кровли' : 'm² acoperiș'}</span></div>
                            <div><strong>${escapeHtml(localizedRoofShape(project.roofShape, language))}</strong><span>${isRussianPage ? 'конфигурация' : 'configurație'}</span></div>
                            <div><strong>${escapeHtml(project.color)}</strong><span>${isRussianPage ? 'цвет' : 'culoare'}</span></div>
                            <div><strong>${escapeHtml(project.dimensions)}</strong><span>${isRussianPage ? 'размеры дома' : 'dimensiuni casă'}</span></div>
                        </div>
                    </aside>
                </div>
            </div>
        </section>
        <section class="project-facts">
            <div class="container">
                <div class="project-facts__grid">
                    <article class="project-facts__card">
                        <h3>${escapeHtml(technicalHeading)}</h3>
                        <p>${escapeHtml(projectLead)}</p>
                        <ul>${factsMarkup}
                        </ul>
                    </article>
                    <article class="project-facts__card">
                        <h3>${isRussianPage ? 'Почему этот кейс важен' : 'De ce contează acest proiect'}</h3>
                        <ul>
                            <li><span>${isRussianPage ? 'Итог' : 'Rezumat'}</span><strong>${escapeHtml(project.summary)}</strong></li>
                            <li><span>${isRussianPage ? 'Материал' : 'Material'}</span><strong>${escapeHtml(localizedProduct(project, language))} ${escapeHtml(project.model)}</strong></li>
                            <li><span>${isRussianPage ? 'Регион' : 'Zonă'}</span><strong>${escapeHtml(project.locality)}</strong></li>
                            <li><span>${isRussianPage ? 'Покрытие' : 'Finisaj'}</span><strong>${escapeHtml(project.color)}</strong></li>
                        </ul>
                    </article>
                </div>
            </div>
        </section>
    </main>`;
};

const buildProjectHeader = (project, language, homeHref, portfolioHref) => {
    const isRussianPage = language === 'ru';
    const homeLabel = isRussianPage ? 'Главная' : 'Acasă';
    const portfolioLabel = isRussianPage ? 'Портфолио' : 'Portofoliu';
    const heroTitle = `${localizedProduct(project, language)} ${project.model} ${isRussianPage ? 'в' : 'în'} ${project.locality}`;
    const heroSubtitle = `${project.location} · ${project.area} m² · ${localizedRoofShape(project.roofShape, language)}`;

    return `
            <div class="page-header__content">
                <nav class="page-header__breadcrumb" aria-label="${isRussianPage ? 'Хлебные крошки' : 'Breadcrumb'}">
                    <ol class="breadcrumb" itemscope itemtype="https://schema.org/BreadcrumbList">
                        <li class="breadcrumb__item" itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
                            <a href="${homeHref}" itemprop="item"><span itemprop="name">${escapeHtml(homeLabel)}</span></a>
                            <meta itemprop="position" content="1">
                        </li>
                        <li class="breadcrumb__item" itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
                            <a href="${portfolioHref}" itemprop="item"><span itemprop="name">${escapeHtml(portfolioLabel)}</span></a>
                            <meta itemprop="position" content="2">
                        </li>
                        <li class="breadcrumb__item breadcrumb__item--active" itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
                            <span itemprop="name" id="projectBreadcrumbCurrent">${isRussianPage ? 'Проект' : 'Proiect'} #${project.id}</span>
                            <meta itemprop="position" content="3">
                        </li>
                    </ol>
                </nav>
                <h1 class="page-header__title" id="projectHeroTitle">${escapeHtml(heroTitle)}</h1>
                <p class="page-header__subtitle" id="projectHeroSubtitle">${escapeHtml(heroSubtitle)}</p>
            </div>`;
};

const buildProjectShell = (project, language) => {
    const isRussianPage = language === 'ru';
    const lang = isRussianPage ? 'ru' : 'ro';
    const depthPrefix = isRussianPage ? '../../../../' : '../../../';
    const homeHref = isRussianPage ? '/ru/' : '/';
    const portfolioHref = isRussianPage ? '/ru/portofoliu' : '/portofoliu';
    const pageHref = isRussianPage
        ? `https://moldacoperis.md/ru/portofoliu/proiecte/${project.slug}/`
        : `https://moldacoperis.md/portofoliu/proiecte/${project.slug}/`;
    const pageTitle = buildProjectTitle(project, language);
    const pageDescription = buildProjectDescription(project, language);
    const burgerLabel = isRussianPage ? 'Открыть меню' : 'Deschide meniul';
    const ogLocale = isRussianPage ? 'ru_RU' : 'ro_RO';

    return `<!DOCTYPE html>
<html lang="${lang}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light only">
    <title>${escapeHtml(pageTitle)}</title>
    <meta name="description" content="${escapeHtml(pageDescription)}">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="${escapeHtml(pageHref)}">
    <meta property="og:title" content="${escapeHtml(pageTitle)}">
    <meta property="og:description" content="${escapeHtml(pageDescription)}">
    <meta property="og:type" content="article">
    <meta property="og:url" content="${escapeHtml(pageHref)}">
    <meta property="og:locale" content="${ogLocale}">
${buildAlternateLinks(project)}
    <script type="application/ld+json">${buildStructuredData(project, language, pageHref)}</script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <link rel="stylesheet" href="${depthPrefix}css/style.css">
</head>
<body data-project-id="${project.id}">
    <header class="header" id="header">
        <div class="header__top-bar">
            <div class="container">
                <div class="header__top-info"></div>
                <div class="header__top-social"></div>
            </div>
        </div>
        <nav class="header__nav">
            <div class="container">
                <a href="${homeHref}" class="header__logo"><img src="${depthPrefix}images/logo.png" alt="MoldAcoperis" class="header__logo-img" width="1025" height="436" decoding="async"></a>
                <ul class="header__menu" id="navMenu"></ul>
                <button class="header__burger" id="burgerBtn" aria-label="${escapeHtml(burgerLabel)}"><span></span><span></span><span></span></button>
            </div>
        </nav>
    </header>

    <section class="page-header">
        <div class="page-header__overlay"></div>
        <div class="container">${buildProjectHeader(project, language, homeHref, portfolioHref)}
        </div>
    </section>

${buildStaticProjectMain(project, language, depthPrefix)}

    <section class="cta-banner">
        <div class="container"></div>
    </section>

    <footer class="footer"></footer>

    <script src="${depthPrefix}js/projects-data.js" defer></script>
    <script src="${depthPrefix}js/projects-render.js" defer></script>
    <script src="${depthPrefix}js/main.js" defer></script>
</body>
</html>
`;
};

const targets = projects.flatMap((project) => ([
    {
        path: path.join(repoRoot, 'portofoliu', 'proiecte', project.slug, 'index.html'),
        content: buildProjectShell(project, 'ro')
    },
    {
        path: path.join(repoRoot, 'ru', 'portofoliu', 'proiecte', project.slug, 'index.html'),
        content: buildProjectShell(project, 'ru')
    }
]));

for (const target of targets) {
    fs.mkdirSync(path.dirname(target.path), { recursive: true });
    fs.writeFileSync(target.path, target.content, 'utf8');
}

console.log(`regenerated=${targets.length}`);
