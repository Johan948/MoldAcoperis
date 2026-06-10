(function () {
    const projects = Array.isArray(window.MA_PROJECTS) ? window.MA_PROJECTS.slice() : [];
    const currentPath = window.location.pathname || '/';
    const isRussianPage = /^\/ru(?:\/|$)/.test(currentPath);
    const categoryLabels = {
        ro: {
            'tigla-metalica': 'Țiglă Metalică',
            'tigla-metalica-modulara': 'Țiglă Metalică Modulară',
            'sindrila-bituminoasa': 'Șindrilă Bituminoasă',
            'tabla-cutata': 'Tablă Cutată',
            'sistem-de-scurgere': 'Sistem de Scurgere',
            'accesorii-acoperis': 'Accesorii Acoperiș'
        },
        ru: {
            'tigla-metalica': 'Металлочерепица',
            'tigla-metalica-modulara': 'Модульная металлочерепица',
            'sindrila-bituminoasa': 'Битумная черепица',
            'tabla-cutata': 'Профнастил',
            'sistem-de-scurgere': 'Водосточная система',
            'accesorii-acoperis': 'Кровельные аксессуары'
        }
    };
    const cardThemes = {
        'tigla-metalica': { className: 'project-tone--graphite', icon: 'fa-layer-group' },
        'tigla-metalica-modulara': { className: 'project-tone--bronze', icon: 'fa-th-large' },
        'sindrila-bituminoasa': { className: 'project-tone--forest', icon: 'fa-shapes' },
        'tabla-cutata': { className: 'project-tone--steel', icon: 'fa-grip-lines' },
        'sistem-de-scurgere': { className: 'project-tone--blue', icon: 'fa-water' },
        'accesorii-acoperis': { className: 'project-tone--sand', icon: 'fa-puzzle-piece' }
    };
    const homepageFeaturedIds = [1, 8, 9, 15, 20, 23];
    const uiText = isRussianPage
        ? {
            projectLabel: 'Проект',
            homeBreadcrumb: 'Главная',
            portfolioBreadcrumb: 'Портфолио',
            breadcrumbLabel: 'Хлебные крошки',
            viewProject: 'Смотреть проект',
            viewDetails: 'Смотреть детали',
            documentedProjects: 'документированных проектов',
            realDocumentedProject: 'Реальный документированный проект',
            roofArea: 'площадь кровли',
            configuration: 'конфигурация',
            houseDimensions: 'размеры дома',
            technicalData: 'Технические данные',
            materialsFinishes: 'Материалы и отделка',
            product: 'Продукт',
            locality: 'Локация',
            dimensions: 'Размеры дома',
            roofConfig: 'Конфигурация',
            roofSurface: 'Площадь кровли',
            color: 'Цвет',
            warranty: 'Гарантия',
            drainage: 'Водосточная система',
            eaves: 'Карниз / доборные элементы',
            note: 'Примечание',
            projectSummary: 'Суть проекта',
            definingExecution: 'Что характеризует этот объект',
            projectLead: 'Каждый проект в портфолио сочетает основное кровельное покрытие с водостоком, карнизными решениями и совместимыми аксессуарами. Здесь выбранная система была ориентирована на баланс между внешним видом, надёжностью и минимальным обслуживанием.',
            similarProject: 'Хотите похожий проект?',
            similarProjectDesc: 'Сообщите нам населённый пункт, примерную площадь и желаемый материал, а команда MoldAcoperis подготовит предложение под ваш объект.',
            requestOffer: 'Запросить предложение',
            contactTeam: 'Связаться с командой',
            moreProjects: 'Другие проекты',
            sameCategoryProjects: 'Похожие работы из той же категории',
            categoryProjectsDesc: (category) => `Посмотрите и другие проекты, выполненные с использованием ${category}.`,
            chipsProduct: 'Продукт',
            chipsLocality: 'Населённый пункт',
            workAria: (locality) => `Открыть проект в ${locality}`,
            noteConfiguration: (roofShape, dimensions) => `Конфигурация адаптирована под ${roofShape.toLowerCase()} и жилой объём ${dimensions}.`,
            noteSystem: (drainage, eaves) => `Система дополнена решением ${drainage} и доборными элементами ${eaves}.`,
            noteWarranty: (color, warranty) => `Цветовое решение ${color} и гарантия ${warranty}.`,
            summaryLine: (project, productName, roofShape) => `Проект #${project.id}: ${productName} ${project.model} в ${project.locality}, кровля ${roofShape.toLowerCase()} площадью ${project.area} м².`
        }
        : {
            projectLabel: 'Proiect',
            homeBreadcrumb: 'Acasă',
            portfolioBreadcrumb: 'Portofoliu',
            breadcrumbLabel: 'Breadcrumb',
            viewProject: 'Vezi proiectul',
            viewDetails: 'Vezi Detalii',
            documentedProjects: 'proiecte documentate',
            realDocumentedProject: 'Proiect real documentat',
            roofArea: 'm² acoperiș',
            configuration: 'configurație',
            houseDimensions: 'dimensiuni casă',
            technicalData: 'Date tehnice',
            materialsFinishes: 'Materiale și finisaje',
            product: 'Produs',
            locality: 'Localitate',
            dimensions: 'Dimensiuni casă',
            roofConfig: 'Configurație',
            roofSurface: 'Suprafață acoperiș',
            color: 'Culoare',
            warranty: 'Garanție',
            drainage: 'Sistem de scurgere',
            eaves: 'Streașină / margini',
            note: 'Observație',
            projectSummary: 'Rezumat proiect',
            definingExecution: 'Ce definește această execuție',
            projectLead: 'Fiecare proiect din portofoliu combină învelitoarea principală cu drenaj, elemente de streașină și accesorii compatibile. În acest caz, soluția aleasă a urmărit echilibrul dintre aspect, rezistență și întreținere redusă.',
            similarProject: 'Vrei un proiect similar?',
            similarProjectDesc: 'Spune-ne localitatea, suprafața și produsul dorit, iar echipa MoldAcoperis îți pregătește o ofertă adaptată proiectului tău.',
            requestOffer: 'Solicită Ofertă',
            contactTeam: 'Discută cu echipa',
            moreProjects: 'Mai multe proiecte',
            sameCategoryProjects: 'Lucrări similare din aceeași categorie',
            categoryProjectsDesc: (category) => `Vezi și alte proiecte realizate cu ${category}.`,
            chipsProduct: 'Produs',
            chipsLocality: 'Localitate',
            workAria: (locality) => `Vezi proiectul ${locality}`,
            noteConfiguration: (roofShape, dimensions) => `Configurație adaptată pentru ${roofShape} și volum rezidențial ${dimensions}.`,
            noteSystem: (drainage, eaves) => `Integrare completă cu ${drainage} și finisaje ${eaves}.`,
            noteWarranty: (color, warranty) => `Paletă cromatică ${color} și garanție ${warranty}.`,
            summaryLine: (project, productName, roofShape) => `${project.summary}`
        };
    const productLabels = {
        'Tigla metalica': isRussianPage ? 'Металлочерепица' : 'Tigla metalica',
        'Tigla metalica modulara': isRussianPage ? 'Модульная металлочерепица' : 'Tigla metalica modulara',
        'Sindrila bituminoasa': isRussianPage ? 'Битумная черепица' : 'Sindrila bituminoasa'
    };
    const roofShapeLabels = {
        '3 pante': isRussianPage ? '3 ската' : '3 pante',
        '4 pante': isRussianPage ? '4 ската' : '4 pante',
        '5 pante': isRussianPage ? '5 скатов' : '5 pante',
        '6 pante': isRussianPage ? '6 скатов' : '6 pante',
        '7 pante': isRussianPage ? '7 скатов' : '7 pante'
    };
    const projectImageManifest = {
        1: ['01.jpg', '01-02.jpg', '01-03.jpg', '01-04.jpg', '01-05.jpg', '01-06.jpg', '01-07.jpg', '01-08.jpg'],
        2: ['02.jpg', '02-01.jpg', '02-02.jpg', '02-03.jpg', '02-04.jpg', '02-06.jpg', '02-07.jpg', '02-08.jpg', '02-09.jpg', '02-10.jpg', '02-11.jpg', '02-12.jpg', '02-13.jpg', '02-14.jpg', '02-16.jpg', '03-05.jpg'],
        3: ['03.jpg', '03-01.jpg', '03-02.jpg', '03-03.jpg', '03-05.jpg', '03-06.jpg', '03-07.jpg', '03-08.jpg', '03-09.jpg', '03-10.jpg', '04-04.jpg'],
        4: ['04.jpg', '04-01.jpg', '04-02.jpg'],
        5: ['05.jpg', '05-01.jpg', '05-02.jpg', '05-03.jpg', '05-05.jpg', '05-06.jpg'],
        6: ['06.jpg', '06-01.jpg', '06-03.jpg'],
        7: ['07.jpg', '07-01.jpg', '07-02.jpg', '07-07.jpg', '07-08.jpg', '07-09.jpg', '07-10.jpg', '07-11.jpg', '07-12.jpg', '07-13.jpg', '07-15.jpg', '08-03.jpg', '08-04.jpg', '08-05.jpg', '08-06.jpg'],
        8: ['08.jpg', '08-01.jpg', '08-02.jpg', '08-06.jpg', '08-07.jpg', '08-08.jpg', '08-09.jpg', '08-10.jpg', '08-11.jpg', '08-12.jpg'],
        9: ['09.jpg', '09-01.jpg', '09-03.jpg', '09-04.jpg', '09-05.jpg'],
        10: ['10.jpg', '10-01.jpg', '10-02.jpg', '10-03.jpg', '10-04.jpg', '10-05.jpg', '10-06.jpg', '10-07.jpg', '10-08.jpg'],
        11: ['11.jpg', '11-01.jpg', '11-02.jpg', '11-03.jpg', '11-04.jpg', '11-05.jpg', '11-06.jpg', '11-08.jpg'],
        12: ['12.jpg', '12-01.jpg', '12-02.jpg', '12-03.jpg', '12-05.jpg'],
        13: ['13.jpg', '13-01.jpg', '13-03.jpg', '13-04.jpg', '13-05.jpg', '13-06.jpg', '13-07.jpg', '13-08.jpg'],
        14: ['14.jpg', '14-02.jpg', '14-03.jpg', '14-04.jpg', '14-05.jpg'],
        15: ['15.jpg', '15-02.jpg', '15-03.jpg', '15-04.jpg', '15-05.jpg'],
        16: ['16.jpg', '16-02.jpg', '16-03.jpg', '16-04.jpg'],
        17: ['17.jpg', '17-02.jpg', '17-03.jpg', '17-04.jpg', '17-05.jpg', '17-07.jpg', '17-08.jpg', '17-09.jpg', '17-10.jpg', '17-11.jpg'],
        18: ['18.jpg', '18-01.jpg', '18-02.jpg', '18-03.jpg'],
        19: ['19.jpg', '19-01.jpg', '19-02.jpg'],
        20: ['20.jpg', '20-01.jpg', '20-02.jpg', '20-03.jpg', '20-04.jpg'],
        21: ['21.jpg', '21-01.jpg', '21-02.jpg', '21-04jpg.webp', '21-05.jpg', '21-06.jpg', '21-07.jpg', '21-08.jpg', '21-09.jpg'],
        22: ['22.jpg', '22-01.jpg'],
        23: ['23.jpg', '23-01.jpg', '23-02jpg.webp', '23-04.jpg', '23-05.jpg'],
        24: ['24.jpg', '24-02.jpg', '25-03.jpg', '26-04.jpg'],
        25: ['25.jpg', '25-01.jpg'],
        26: ['26.jpg', '26-01.jpg', '26-02.jpg', '26-03.jpg', '26-04.jpg', '26-05jpg.webp', '26-07.jpg', '26-08.jpg', '26-09.jpg', '26-10.jpg', '26-11.jpg', '26-13.jpg', '26-14.jpg', '26.06.jpg'],
        27: ['27.jpg', '27-01.jpg', '27-02.jpg', '27-03.jpg', '27-05.jpg', '27-06.jpg', '27-08.jpg', '27-09.jpg', '27-10.jpg', '27-11.jpg', '27-12.jpg', '27-13.jpg', '27-15.jpg', '27-16.jpg', '27-17.jpg', '27-18.jpg', '27-19.jpg', '27-20.jpg', '27-21.jpg'],
        28: ['28.jpg', '28-01.jpg', '28-02.jpg', '28-03.jpg', '28-05.jpg', '28-06.jpg'],
        29: ['29.jpg', '29-02.jpg', '29-03.jpg', '29-04.jpg', '29-05.jpg', '29-06.jpg']
    };

    const escapeHtml = (value) => String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    const normalizeCategory = (category) => {
        if (category === 'tigla-metalica-modulara') return 'tigla-modulara';
        if (category === 'sindrila-bituminoasa') return 'sindrila';
        return category;
    };

    const getAssetPrefix = () => {
        const script = document.querySelector('script[src*="projects-render.js"]');
        if (!script) return null;
        const src = String(script.getAttribute('src') || '').replace(/\\/g, '/');
        if (!src || /^https?:\/\//i.test(src) || src.startsWith('/')) return null;
        const marker = 'js/projects-render.js';
        const idx = src.lastIndexOf(marker);
        if (idx === -1) return null;
        return src.slice(0, idx);
    };

    const localizedCategoryLabel = (category) => categoryLabels[isRussianPage ? 'ru' : 'ro'][category] || category;
    const localizedProduct = (project) => {
        const value = productLabels[project.product] || project.product;
        if (isRussianPage) return value;
        const replacements = {
            'Tigla metalica': 'Țiglă metalică',
            'Tigla metalica modulara': 'Țiglă metalică modulară',
            'Sindrila bituminoasa': 'Șindrilă bituminoasă',
            'Tabla Cutata': 'Tablă Cutată',
            'Accesorii Acoperis': 'Accesorii Acoperiș'
        };
        return replacements[value] || value;
    };
    const localizedRoofShape = (roofShape) => roofShapeLabels[roofShape] || roofShape;
    const localizedSummary = (project) => uiText.summaryLine(project, localizedProduct(project), localizedRoofShape(project.roofShape));
    const projectHref = (project) => isRussianPage ? `/ru/portofoliu/proiecte/${project.slug}/` : `/portofoliu/proiecte/${project.slug}/`;
    const homeHref = isRussianPage ? '/ru/' : '/';
    const portfolioHref = isRussianPage ? '/ru/portofoliu' : '/portofoliu';
    const currentProjectSlug = () => {
        const match = currentPath.match(/^\/(?:ru\/)?portofoliu\/proiecte\/([^/]+)/);
        return match ? decodeURIComponent(match[1]) : '';
    };
    const resolveCurrentProject = () => {
        const projectId = Number(document.body && document.body.getAttribute('data-project-id'));
        if (Number.isFinite(projectId) && projectId > 0) {
            const byId = projects.find(item => item.id === projectId);
            if (byId) return byId;
        }

        const slug = currentProjectSlug();
        if (slug) {
            const bySlug = projects.find(item => item.slug === slug);
            if (bySlug) return bySlug;
        }

        return null;
    };
    const lightboxText = isRussianPage
        ? {
            close: 'Закрыть',
            previous: 'Предыдущее изображение',
            next: 'Следующее изображение',
            counter: (current, total) => `${current} / ${total}`
        }
        : {
            close: 'Închide',
            previous: 'Imaginea precedentă',
            next: 'Imaginea următoare',
            counter: (current, total) => `${current} / ${total}`
        };
    const assetPrefix = getAssetPrefix();
    const unique = (values) => Array.from(new Set(values.filter(Boolean)));
    const projectImagePaths = (project, fileName = 'cover.webp') => {
        const folder = String(project.id).padStart(2, '0');
        const filePath = `images/projects/${folder}/${fileName}`;
        const absolute = `/${filePath}`;
        if (assetPrefix !== null) {
            return [`${assetPrefix}${filePath}`, absolute];
        }
        return unique([
            absolute,
            filePath,
            `./${filePath}`,
            `../${filePath}`,
            `../../${filePath}`,
            `../../../${filePath}`
        ]);
    };
    const getProjectManifestImages = (project) => projectImageManifest[Number(project.id)] || [];
    const projectImageCandidates = (project) => {
        const manifestImages = getProjectManifestImages(project);
        if (manifestImages.length) {
            return [manifestImages[0]];
        }

        const idName = String(project.id).padStart(2, '0');
        return [`${idName}.jpg`];
    };
    const projectGalleryImageCandidates = (project) => {
        const manifestImages = getProjectManifestImages(project);
        if (manifestImages.length > 1) {
            return manifestImages.slice(1);
        }
        return [];
    };
    let lastRenderedProjectId = null;
    let isProjectContentReady = false;

    const formatArea = (project) => `${project.area} m&sup2;`;
    const setMetaContent = (selector, value, attribute) => {
        const element = document.querySelector(selector);
        if (!element) return;
        element.setAttribute(attribute || 'content', value);
    };

    const markProjectHydrated = () => {
        if (!document.body || !document.body.hasAttribute('data-project-id')) return;
        isProjectContentReady = true;
        document.body.setAttribute('data-project-hydrated', '1');
    };

    const ensureProjectHeaderShell = () => {
        if (!document.body || !document.body.hasAttribute('data-project-id')) return;

        const pageHeader = document.querySelector('.page-header');
        if (!pageHeader) return;

        let overlay = pageHeader.querySelector('.page-header__overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'page-header__overlay';
            pageHeader.prepend(overlay);
        }

        let container = pageHeader.querySelector('.container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'container';
            pageHeader.appendChild(container);
        }

        let content = container.querySelector('.page-header__content');
        if (!content) {
            content = document.createElement('div');
            content.className = 'page-header__content';
            container.appendChild(content);
        }

        if (
            !content.querySelector('#projectHeroTitle')
            || !content.querySelector('#projectHeroSubtitle')
            || !content.querySelector('#projectBreadcrumbCurrent')
        ) {
            content.innerHTML = `
                <h1 class="page-header__title" id="projectHeroTitle"></h1>
                <p class="page-header__subtitle" id="projectHeroSubtitle"></p>
                <nav class="page-header__breadcrumb" aria-label="${uiText.breadcrumbLabel}">
                    <ol class="breadcrumb" itemscope itemtype="https://schema.org/BreadcrumbList">
                        <li class="breadcrumb__item" itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
                            <a href="${homeHref}" itemprop="item"><span itemprop="name">${uiText.homeBreadcrumb}</span></a>
                            <meta itemprop="position" content="1">
                        </li>
                        <li class="breadcrumb__item" itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
                            <a href="${portfolioHref}" itemprop="item"><span itemprop="name">${uiText.portfolioBreadcrumb}</span></a>
                            <meta itemprop="position" content="2">
                        </li>
                        <li class="breadcrumb__item breadcrumb__item--active" itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
                            <span itemprop="name" id="projectBreadcrumbCurrent"></span>
                            <meta itemprop="position" content="3">
                        </li>
                    </ol>
                </nav>
            `;
        }
    };

    const sanitizeProjectHeaderFallback = () => {
        ensureProjectHeaderShell();
        const project = resolveCurrentProject();
        if (!project) {
            markProjectHydrated();
            return;
        }

        const safeTitle = `${localizedProduct(project)} ${project.model} ${isRussianPage ? 'в' : 'în'} ${project.locality}`;
        const safeSubtitle = `${project.location} · ${project.area} m² · ${localizedRoofShape(project.roofShape)}`;

        const heroTitle = document.getElementById('projectHeroTitle');
        const heroSubtitle = document.getElementById('projectHeroSubtitle');
        const breadcrumb = document.getElementById('projectBreadcrumbCurrent');

        if (heroTitle) heroTitle.textContent = safeTitle;
        if (heroSubtitle) heroSubtitle.textContent = safeSubtitle;
        if (breadcrumb) breadcrumb.textContent = `${uiText.projectLabel} #${project.id}`;
        document.title = `${safeTitle} | MoldAcoperis`;

        if (document.body) {
            document.body.setAttribute('data-project-id', String(project.id));
        }
    };

    const getProjectsForCategory = (category) => {
        if (category === 'tabla-cutata') return projects.filter(project => /tabl[ăa] cutat[ăa]/i.test(project.eaves));
        if (category === 'sistem-de-scurgere') return projects.filter(project => Boolean(project.drainage));
        if (category === 'accesorii-acoperis') return projects.slice();
        return projects.filter(project => project.category === category);
    };

    const buildVisual = (project, options = {}) => {
        const theme = cardThemes[project.category] || cardThemes['tigla-metalica'];
        const imageAlt = `${localizedProduct(project)} ${project.model} ${isRussianPage ? 'в' : 'în'} ${project.locality}`;
        const imageSources = projectImageCandidates(project).flatMap((fileName) => projectImagePaths(project, fileName));
        const firstImage = imageSources[0];
        const imageSourceList = imageSources.join('||');
        const loading = options.loading || 'lazy';
        const decoding = options.decoding || 'async';
        const fetchPriorityAttr = options.fetchPriority ? ` fetchpriority="${options.fetchPriority}"` : '';
        const visualInner = options.minimal ? '' : `
                <div class="project-visual__inner">
                    <span class="project-visual__id">${uiText.projectLabel} #${project.id}</span>
                    <i class="fas ${theme.icon}" aria-hidden="true"></i>
                    <strong>${escapeHtml(project.model)}</strong>
                    <span>${escapeHtml(project.locality)}</span>
                </div>`;
        return `
            <div class="project-visual ${theme.className}${options.minimal ? ' project-visual--minimal' : ''}">
                <img class="project-visual__photo js-fallback-image" src="${firstImage}" data-source-list="${escapeHtml(imageSourceList)}" data-source-index="0" alt="${escapeHtml(imageAlt)}" loading="${loading}" decoding="${decoding}"${fetchPriorityAttr}>
                ${visualInner}
            </div>
        `;
    };

    const buildWorkCard = (project) => `
        <article class="works__item works__item--real" data-category="${normalizeCategory(project.category)}">
            <a class="works__img works__img--link" href="${projectHref(project)}" aria-label="${escapeHtml(uiText.workAria(project.locality))}">
                ${buildVisual(project, { minimal: true })}
            </a>
            <div class="works__info">
                <div class="works__eyebrow">
                    <span class="works__category">${escapeHtml(localizedCategoryLabel(project.category))}</span>
                    <span class="works__project-id">${uiText.projectLabel} #${project.id}</span>
                </div>
                <h4>${escapeHtml(localizedProduct(project))}${project.model ? ` ${escapeHtml(project.model)}` : ''}</h4>
                <p>${escapeHtml(localizedSummary(project))}</p>
                <div class="works__details">
                    <span class="works__meta"><i class="fas fa-map-marker-alt"></i> ${escapeHtml(project.locality)}</span>
                    <span class="works__meta works__meta--soft"><i class="fas fa-ruler-combined"></i> ${formatArea(project)}</span>
                </div>
                <a href="${projectHref(project)}" class="portfolio-card__link works__link">${uiText.viewDetails} <i class="fas fa-arrow-right"></i></a>
            </div>
        </article>
    `;

    const buildPortfolioCard = (project) => `
        <article class="portfolio-card portfolio-card--real" data-category="${project.category}">
            <a href="${projectHref(project)}" class="portfolio-card__image-link" aria-label="${escapeHtml(uiText.workAria(project.locality))}">
                ${buildVisual(project)}
                <span class="portfolio-card__badge">${escapeHtml(localizedCategoryLabel(project.category))}</span>
            </a>
            <div class="portfolio-card__content">
                <div class="portfolio-card__eyebrow">${uiText.projectLabel} #${project.id}</div>
                <h3 class="portfolio-card__title">${escapeHtml(localizedProduct(project))} ${escapeHtml(project.model)} ${isRussianPage ? 'в' : 'în'} ${escapeHtml(project.locality)}</h3>
                <p class="portfolio-card__desc">${escapeHtml(localizedSummary(project))}</p>
                <div class="portfolio-card__meta portfolio-card__meta--stack">
                    <span class="portfolio-card__location"><i class="fas fa-map-marker-alt"></i> ${escapeHtml(project.location)}</span>
                    <span class="portfolio-card__location"><i class="fas fa-ruler-combined"></i> ${formatArea(project)} · ${escapeHtml(localizedRoofShape(project.roofShape))}</span>
                </div>
                <a href="${projectHref(project)}" class="portfolio-card__link">${uiText.viewDetails} <i class="fas fa-arrow-right"></i></a>
            </div>
        </article>
    `;

    const buildProductProjectCard = (project) => `
        <article class="product-project-card">
            <a href="${projectHref(project)}" class="product-project-card__media" aria-label="${escapeHtml(uiText.workAria(project.locality))}">
                ${buildVisual(project)}
            </a>
            <div class="product-project-card__body">
                <div class="product-project-card__topline">
                    <span>${uiText.projectLabel} #${project.id}</span>
                    <span>${formatArea(project)}</span>
                </div>
                <h3>${escapeHtml(localizedProduct(project))} ${escapeHtml(project.model)}</h3>
                <p>${escapeHtml(project.location)}</p>
                <ul class="product-project-card__facts">
                    <li><i class="fas fa-house"></i> ${escapeHtml(localizedRoofShape(project.roofShape))}</li>
                    <li><i class="fas fa-palette"></i> ${escapeHtml(project.color)}</li>
                </ul>
                <a href="${projectHref(project)}" class="product-project-card__link">${uiText.viewProject} <i class="fas fa-arrow-right"></i></a>
            </div>
        </article>
    `;

    const buildProjectGalleryItem = (project, fileName, index) => {
        const imageSources = projectImagePaths(project, fileName);
        const firstImage = imageSources[0];
        const imageSourceList = imageSources.join('||');
        const imageAlt = `${localizedProduct(project)} ${project.model} ${isRussianPage ? 'в' : 'în'} ${project.locality} - ${index + 1}`;
        return `
            <figure class="project-gallery__item">
                <img class="js-fallback-image" src="${firstImage}" data-source-list="${escapeHtml(imageSourceList)}" data-source-index="0" alt="${escapeHtml(imageAlt)}" loading="lazy" decoding="async">
            </figure>
        `;
    };

    const hydrateFallbackImages = (scope) => {
        const root = scope || document;
        const images = root.querySelectorAll('img.js-fallback-image[data-source-list]');
        images.forEach((img) => {
            if (img.dataset.fallbackBound === '1') return;
            img.dataset.fallbackBound = '1';

            const markLoaded = () => {
                const galleryItem = img.closest('.project-gallery__item');
                if (galleryItem) galleryItem.classList.add('is-loaded');
            };

            const moveToNextSource = () => {
                const sources = (img.dataset.sourceList || '').split('||').filter(Boolean);
                const nextIndex = Number(img.dataset.sourceIndex || 0) + 1;
                if (nextIndex < sources.length) {
                    img.dataset.sourceIndex = String(nextIndex);
                    img.src = sources[nextIndex];
                    return;
                }
                const galleryItem = img.closest('.project-gallery__item');
                if (galleryItem) {
                    galleryItem.remove();
                    return;
                }
                const visual = img.closest('.project-visual');
                img.remove();
                if (visual) visual.classList.add('project-visual--fallback');
            };

            img.addEventListener('load', markLoaded);
            img.addEventListener('error', moveToNextSource);

            if (img.complete && img.naturalWidth > 0) {
                markLoaded();
            }
        });
    };

        let projectLightbox = null;

        const ensureProjectLightbox = () => {
            if (projectLightbox) return projectLightbox;

            const overlay = document.createElement('div');
            overlay.className = 'project-lightbox';
            overlay.setAttribute('aria-hidden', 'true');
            overlay.innerHTML = `
                <div class="project-lightbox__dialog" role="dialog" aria-modal="true" aria-label="Image viewer">
                    <button type="button" class="project-lightbox__close" aria-label="${escapeHtml(lightboxText.close)}">
                        <i class="fas fa-times" aria-hidden="true"></i>
                    </button>
                    <button type="button" class="project-lightbox__nav project-lightbox__nav--prev" aria-label="${escapeHtml(lightboxText.previous)}">
                        <i class="fas fa-chevron-left" aria-hidden="true"></i>
                    </button>
                    <figure class="project-lightbox__figure">
                        <img class="project-lightbox__image" src="" alt="">
                        <figcaption class="project-lightbox__caption"></figcaption>
                    </figure>
                    <button type="button" class="project-lightbox__nav project-lightbox__nav--next" aria-label="${escapeHtml(lightboxText.next)}">
                        <i class="fas fa-chevron-right" aria-hidden="true"></i>
                    </button>
                    <div class="project-lightbox__counter">1 / 1</div>
                </div>
            `;
            document.body.appendChild(overlay);

            const imageEl = overlay.querySelector('.project-lightbox__image');
            const captionEl = overlay.querySelector('.project-lightbox__caption');
            const counterEl = overlay.querySelector('.project-lightbox__counter');
            const prevBtn = overlay.querySelector('.project-lightbox__nav--prev');
            const nextBtn = overlay.querySelector('.project-lightbox__nav--next');
            const closeBtn = overlay.querySelector('.project-lightbox__close');

            const state = {
                items: [],
                index: 0,
                showAt(targetIndex) {
                    if (!this.items.length) return;
                    const total = this.items.length;
                    this.index = (targetIndex + total) % total;
                    const item = this.items[this.index];
                    imageEl.classList.add('is-switching');
                    imageEl.src = item.src;
                    imageEl.alt = item.alt;
                    captionEl.textContent = item.alt;
                    counterEl.textContent = lightboxText.counter(this.index + 1, total);
                },
                open(items, startIndex) {
                    if (!items.length) return;
                    this.items = items;
                    overlay.classList.add('is-active');
                    overlay.setAttribute('aria-hidden', 'false');
                    document.body.classList.add('project-lightbox-open');
                    this.showAt(startIndex || 0);
                },
                close() {
                    overlay.classList.remove('is-active');
                    overlay.setAttribute('aria-hidden', 'true');
                    document.body.classList.remove('project-lightbox-open');
                }
            };

            imageEl.addEventListener('load', () => {
                imageEl.classList.remove('is-switching');
            });

            prevBtn.addEventListener('click', () => state.showAt(state.index - 1));
            nextBtn.addEventListener('click', () => state.showAt(state.index + 1));
            closeBtn.addEventListener('click', () => state.close());
            overlay.addEventListener('click', (event) => {
                if (event.target === overlay) state.close();
            });

            document.addEventListener('keydown', (event) => {
                if (!overlay.classList.contains('is-active')) return;
                if (event.key === 'Escape') state.close();
                if (event.key === 'ArrowLeft') state.showAt(state.index - 1);
                if (event.key === 'ArrowRight') state.showAt(state.index + 1);
            });

            projectLightbox = state;
            return state;
        };

        const bindProjectImageLightbox = (scope) => {
            const root = scope || document;
            const selector = '.project-detail__panel .project-visual__photo, .project-gallery__item img';
            const images = root.querySelectorAll(selector);
            if (!images.length) return;

            images.forEach((img) => {
                if (img.dataset.lightboxBound === '1') return;
                img.dataset.lightboxBound = '1';
                img.addEventListener('click', () => {
                    const candidates = Array.from(root.querySelectorAll(selector)).filter((node) => node.naturalWidth > 0 && node.src);
                    if (!candidates.length) return;
                    const items = candidates.map((node) => ({
                        src: node.currentSrc || node.src,
                        alt: node.alt || ''
                    }));
                    const activeSrc = img.currentSrc || img.src;
                    const startIndex = Math.max(0, candidates.findIndex((node) => (node.currentSrc || node.src) === activeSrc));
                    ensureProjectLightbox().open(items, startIndex);
                });
            });
        };

    const buildProjectGallerySection = (project) => {
        const title = isRussianPage ? 'Фотогалерея проекта' : 'Galerie foto proiect';
        const galleryFiles = projectGalleryImageCandidates(project);
        if (!galleryFiles.length) {
            return '';
        }
        const items = galleryFiles.map((fileName, index) => buildProjectGalleryItem(project, fileName, index)).join('');
        return `
            <section class="project-gallery">
                <div class="container">
                    <div class="section-header">
                        <span class="section-header__tag">${isRussianPage ? 'Фото' : 'Foto'}</span>
                        <h2 class="section-header__title">${title}</h2>
                    </div>
                    <div class="project-gallery__grid">${items}</div>
                </div>
            </section>
        `;
    };

    const getHomepageWorksByFilter = (filter) => {
        if (filter === 'tigla-metalica') return projects.filter(project => project.category === 'tigla-metalica');
        if (filter === 'tigla-modulara') return projects.filter(project => project.category === 'tigla-metalica-modulara');
        if (filter === 'sindrila') return projects.filter(project => project.category === 'sindrila-bituminoasa');
        return homepageFeaturedIds.map(id => projects.find(project => project.id === id)).filter(Boolean);
    };

    const renderHomepageWorks = (filter = 'all') => {
        const worksGrid = document.getElementById('worksGrid');
        if (!worksGrid) return;
        const list = getHomepageWorksByFilter(filter);
        worksGrid.innerHTML = list.map(buildWorkCard).join('');
        hydrateFallbackImages(worksGrid);
    };

    const getPortfolioProjectsByFilter = (filter) => {
        if (!filter || filter === 'all') return projects;
        return projects.filter(project => project.category === filter);
    };

    const renderPortfolioGrid = (filter = 'all') => {
        const portfolioGrid = document.querySelector('.portfolio-grid');
        if (!portfolioGrid) return;
        const list = getPortfolioProjectsByFilter(filter);
        portfolioGrid.innerHTML = list.map(buildPortfolioCard).join('');
        hydrateFallbackImages(portfolioGrid);
        const countNode = document.getElementById('portfolioProjectsCount');
        if (countNode) countNode.textContent = '1500+';
    };

    const renderProductSections = () => {
        const sections = document.querySelectorAll('[data-projects-category]');
        if (!sections.length) return;
        sections.forEach(section => {
            const category = section.getAttribute('data-projects-category');
            const list = getProjectsForCategory(category);
            const grid = section.querySelector('[data-projects-grid]');
            const count = section.querySelector('[data-projects-count]');
            if (count) count.textContent = `1500+ ${uiText.documentedProjects}`;
            if (grid) {
                grid.innerHTML = list.map(buildProductProjectCard).join('');
                hydrateFallbackImages(grid);
            }
        });
    };

    const renderProjectPage = (options = {}) => {
        const { force = false } = options;
        const content = document.getElementById('projectPageContent');
        if (!content) {
            markProjectHydrated();
            return;
        }

        const project = resolveCurrentProject();
        if (!project) {
            markProjectHydrated();
            return;
        }

        const projectId = String(project.id);
        const alreadyRendered =
            !force &&
            isProjectContentReady &&
            lastRenderedProjectId === projectId &&
            content.dataset.renderedProjectId === projectId &&
            content.childElementCount > 0;

        if (alreadyRendered) {
            markProjectHydrated();
            return;
        }

        const related = projects.filter(item => item.category === project.category && item.id !== project.id).slice(0, 3);
        const projectTitle = isRussianPage
            ? `${uiText.projectLabel} #${project.id} ${localizedProduct(project)} ${project.model} в ${project.locality} | MoldAcoperis`
            : `Proiectul #${project.id} ${project.product} ${project.model} în ${project.locality} | MoldAcoperis`;
        const projectMetaDescription = isRussianPage
            ? `${localizedSummary(project)} Площадь ${project.area} м², ${localizedRoofShape(project.roofShape)}, ${project.location}.`
            : `${project.summary} Suprafață ${project.area} m², ${project.roofShape}, ${project.location}.`;
        document.title = projectTitle;
        setMetaContent('meta[name="description"]', projectMetaDescription);
        setMetaContent('link[rel="canonical"]', `https://www.moldacoperis.md${projectHref(project)}`, 'href');
        setMetaContent('meta[property="og:title"]', projectTitle);
        setMetaContent('meta[property="og:description"]', `${localizedSummary(project)} ${project.location}.`);
        setMetaContent('meta[property="og:url"]', `https://www.moldacoperis.md${projectHref(project)}`);

        const breadcrumb = document.getElementById('projectBreadcrumbCurrent');
        const heroTitle = document.getElementById('projectHeroTitle');
        const heroSubtitle = document.getElementById('projectHeroSubtitle');
        if (breadcrumb) breadcrumb.textContent = `${uiText.projectLabel} #${project.id}`;
        if (heroTitle) heroTitle.textContent = `${localizedProduct(project)} ${project.model} ${isRussianPage ? 'в' : 'în'} ${project.locality}`;
        if (heroSubtitle) heroSubtitle.textContent = `${project.location} · ${project.area} m² · ${localizedRoofShape(project.roofShape)}`;

        content.innerHTML = `
            <section class="project-detail">
                <div class="container">
                    <div class="project-detail__hero">
                        <div class="project-detail__intro">
                            <span class="project-detail__eyebrow">${uiText.realDocumentedProject}</span>
                            <h2>${uiText.projectLabel} #${project.id}</h2>
                            <p>${escapeHtml(localizedSummary(project))}</p>
                            <div class="project-detail__chips">
                                <span><i class="fas fa-layer-group"></i> ${escapeHtml(localizedProduct(project))}</span>
                                <span><i class="fas fa-map-marker-alt"></i> ${escapeHtml(project.locality)}</span>
                                <span><i class="fas fa-ruler-combined"></i> ${formatArea(project)}</span>
                            </div>
                        </div>
                        <aside class="project-detail__panel">
                            ${buildVisual(project, { loading: 'eager', decoding: 'async', fetchPriority: 'high' })}
                            <div class="project-detail__panel-grid">
                                <div><strong>${project.area}</strong><span>${uiText.roofArea}</span></div>
                                <div><strong>${escapeHtml(localizedRoofShape(project.roofShape))}</strong><span>${uiText.configuration}</span></div>
                                <div><strong>${escapeHtml(project.color)}</strong><span>${uiText.color.toLowerCase()}</span></div>
                                <div><strong>${escapeHtml(project.dimensions)}</strong><span>${uiText.houseDimensions}</span></div>
                            </div>
                        </aside>
                    </div>
                </div>
            </section>
            <section class="project-facts">
                <div class="container">
                    <div class="project-facts__grid">
                        <article class="project-facts__card">
                            <h3>${uiText.technicalData}</h3>
                            <ul>
                                <li><span>${uiText.product}</span><strong>${escapeHtml(localizedProduct(project))} ${escapeHtml(project.model)}</strong></li>
                                <li><span>${uiText.locality}</span><strong>${escapeHtml(project.location)}</strong></li>
                                <li><span>${uiText.dimensions}</span><strong>${escapeHtml(project.dimensions)}</strong></li>
                                <li><span>${uiText.roofConfig}</span><strong>${escapeHtml(localizedRoofShape(project.roofShape))}</strong></li>
                                <li><span>${uiText.roofSurface}</span><strong>${formatArea(project)}</strong></li>
                            </ul>
                        </article>
                        <article class="project-facts__card">
                            <h3>${uiText.materialsFinishes}</h3>
                            <ul>
                                <li><span>${uiText.color}</span><strong>${escapeHtml(project.color)}</strong></li>
                                <li><span>${uiText.warranty}</span><strong>${escapeHtml(project.warranty)}</strong></li>
                                <li><span>${uiText.drainage}</span><strong>${escapeHtml(project.drainage)}</strong></li>
                                <li><span>${uiText.eaves}</span><strong>${escapeHtml(project.eaves)}</strong></li>
                                ${project.specialNote ? `<li><span>${uiText.note}</span><strong>${escapeHtml(project.specialNote)}</strong></li>` : ''}
                            </ul>
                        </article>
                    </div>
                </div>
            </section>
            ${buildProjectGallerySection(project)}
            <section class="project-story">
                <div class="container">
                    <div class="project-story__layout">
                        <div>
                            <span class="section-header__tag">${uiText.projectSummary}</span>
                            <h2 class="section-header__title section-header__title--left">${uiText.definingExecution}</h2>
                            <p class="project-story__lead">${uiText.projectLead}</p>
                            <div class="project-story__notes">
                                <div><i class="fas fa-check-circle"></i><span>${escapeHtml(uiText.noteConfiguration(localizedRoofShape(project.roofShape), project.dimensions))}</span></div>
                                <div><i class="fas fa-check-circle"></i><span>${escapeHtml(uiText.noteSystem(project.drainage, project.eaves))}</span></div>
                                <div><i class="fas fa-check-circle"></i><span>${escapeHtml(uiText.noteWarranty(project.color, project.warranty))}</span></div>
                            </div>
                        </div>
                        <div class="project-story__cta-card">
                            <h3>${uiText.similarProject}</h3>
                            <p>${uiText.similarProjectDesc}</p>
                            <div class="project-story__cta-actions">
                                <button type="button" class="btn btn--primary js-open-modal">${uiText.requestOffer}</button>
                                <a href="${isRussianPage ? '/ru/contact' : '/contact'}" class="btn btn--secondary">${uiText.contactTeam}</a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <section class="project-related">
                <div class="container">
                    <div class="section-header">
                        <span class="section-header__tag">${uiText.moreProjects}</span>
                        <h2 class="section-header__title">${uiText.sameCategoryProjects}</h2>
                        <p class="section-header__desc">${escapeHtml(uiText.categoryProjectsDesc(localizedCategoryLabel(project.category)))}</p>
                    </div>
                    <div class="product-projects__grid">${related.map(buildProductProjectCard).join('')}</div>
                </div>
            </section>
        `;
        content.dataset.renderedProjectId = projectId;
        lastRenderedProjectId = projectId;
        hydrateFallbackImages(content);
        bindProjectImageLightbox(content);

        const existingSchema = document.getElementById('projectSchemaJsonLd');
        if (existingSchema) existingSchema.remove();

        const schema = document.createElement('script');
        schema.id = 'projectSchemaJsonLd';
        schema.type = 'application/ld+json';
        schema.textContent = JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: isRussianPage ? `${uiText.projectLabel} #${project.id} ${localizedProduct(project)} ${project.model} в ${project.locality}` : `Proiectul #${project.id} ${project.product} ${project.model} în ${project.locality}`,
            description: `${localizedSummary(project)} ${project.location}.`,
            mainEntityOfPage: `https://www.moldacoperis.md${projectHref(project)}`,
            author: { '@type': 'Organization', name: 'MoldAcoperis' },
            publisher: { '@type': 'Organization', name: 'MoldAcoperis' }
        });
        document.head.appendChild(schema);

        markProjectHydrated();
    };

    window.MA_PROJECTS_RENDER = window.MA_PROJECTS_RENDER || {};
    window.MA_PROJECTS_RENDER.renderHomepageWorksByFilter = renderHomepageWorks;
    window.MA_PROJECTS_RENDER.renderPortfolioGridByFilter = renderPortfolioGrid;
    window.MA_PROJECTS_RENDER.renderProjectPage = renderProjectPage;

    // Render project details as soon as scripts are parsed to avoid placeholder header flashes.
    sanitizeProjectHeaderFallback();
    renderProjectPage();

    document.addEventListener('DOMContentLoaded', () => {
        renderHomepageWorks();
        renderPortfolioGrid();
        renderProductSections();
        if (!isProjectContentReady) {
            renderProjectPage();
        }
    });

    window.addEventListener('pageshow', (event) => {
        sanitizeProjectHeaderFallback();
        if (!event.persisted) {
            if (!isProjectContentReady) {
                renderProjectPage();
            }
            return;
        }

        const content = document.getElementById('projectPageContent');
        const project = resolveCurrentProject();
        const projectId = project ? String(project.id) : null;
        const needsRestoreRender =
            !projectId ||
            !content ||
            content.dataset.renderedProjectId !== projectId ||
            content.childElementCount === 0;

        if (needsRestoreRender) {
            isProjectContentReady = false;
            renderProjectPage({ force: true });
        } else {
            markProjectHydrated();
        }
    });
})();

