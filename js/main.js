/* ============================================
   MoldAcoperis - Main JavaScript
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

    const supportWidgetFeatures = {
        messengers: window.MA_ENABLE_FLOATING_MESSENGERS !== false,
        chatbot: window.MA_ENABLE_SITE_CHATBOT === true
    };

    const ensureViewportFitCover = () => {
        const viewportMeta = document.querySelector('meta[name="viewport"]');
        if (!viewportMeta) return;

        const rawContent = String(viewportMeta.getAttribute('content') || '').trim();
        if (/viewport-fit\s*=\s*cover/i.test(rawContent)) return;

        const baseContent = rawContent
            ? rawContent.replace(/\s*,\s*$/, '')
            : 'width=device-width, initial-scale=1.0';

        viewportMeta.setAttribute('content', `${baseContent}, viewport-fit=cover`);
    };

    ensureViewportFitCover();

    const setupMobileViewportGuards = () => {
        const html = document.documentElement;
        const userAgent = String(navigator.userAgent || '');
        const isMobile = /Android|iPhone|iPad|iPod/i.test(userAgent)
            || (window.matchMedia && window.matchMedia('(max-width: 768px)').matches);
        const isInAppBrowser = /Telegram|FBAN|FBAV|Instagram|Line|MicroMessenger|WhatsApp|Viber/i.test(userAgent)
            || (isMobile && /wv|WebView/i.test(userAgent));

        html.classList.toggle('is-mobile-viewport', Boolean(isMobile));
        html.classList.toggle('is-in-app-browser', Boolean(isInAppBrowser));

        const applyViewportHeight = () => {
            const viewportHeight = Math.round(
                (window.visualViewport && window.visualViewport.height)
                || window.innerHeight
                || html.clientHeight
                || 0
            );

            if (viewportHeight > 0) {
                html.style.setProperty('--ma-viewport-height', `${viewportHeight}px`);
            }
        };

        applyViewportHeight();
        window.addEventListener('resize', applyViewportHeight, { passive: true });
        window.addEventListener('orientationchange', () => window.setTimeout(applyViewportHeight, 220), { passive: true });
        window.addEventListener('pageshow', applyViewportHeight, { passive: true });

        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', applyViewportHeight, { passive: true });
            window.visualViewport.addEventListener('scroll', applyViewportHeight, { passive: true });
        }
    };

    setupMobileViewportGuards();

    // Keep the homepage hero background video smooth, but prefer a static hero when the device
    // or connection is likely to struggle with a 67 MB looping background video.
    const setupHeroBackgroundVideo = () => {
        const heroSection = document.querySelector('.hero');
        const heroVideo = heroSection?.querySelector('.hero__video');
        if (!heroSection || !heroVideo) return;

        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection || null;
        const prefersReducedMotion = typeof window.matchMedia === 'function'
            && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const lowBandwidth = typeof connection?.effectiveType === 'string'
            && /(^2g$|3g)/i.test(connection.effectiveType);
        const lowMemory = typeof navigator.deviceMemory === 'number' && navigator.deviceMemory <= 4;
        const lowCpu = typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency <= 4;
        const shouldUseStaticHero = prefersReducedMotion
            || Boolean(connection?.saveData)
            || lowBandwidth
            || lowMemory
            || lowCpu;

        heroVideo.muted = true;
        heroVideo.defaultMuted = true;
        heroVideo.playsInline = true;
        heroVideo.preload = 'metadata';
        heroVideo.setAttribute('playsinline', '');
        heroVideo.setAttribute('webkit-playsinline', '');

        const enableStaticFallback = () => {
            heroSection.classList.add('hero--static');
            heroSection.classList.remove('hero--video-ready');
            heroVideo.pause();
        };

        if (shouldUseStaticHero) {
            enableStaticFallback();
            return;
        }

        let lastKnownTime = 0;
        let stallTicks = 0;
        let monitorId = null;
        let intersectionObserver = null;

        const safePlay = () => {
            if (document.hidden || heroSection.classList.contains('hero--static')) return;

            const playAttempt = heroVideo.play();
            if (playAttempt && typeof playAttempt.catch === 'function') {
                playAttempt.catch(() => {});
            }
        };

        const handleHealthyPlayback = () => {
            stallTicks = 0;
            lastKnownTime = heroVideo.currentTime;
            heroSection.classList.remove('hero--static');
            heroSection.classList.add('hero--video-ready');
        };

        const monitorPlayback = () => {
            if (document.hidden || heroSection.classList.contains('hero--static')) return;

            if (heroVideo.paused) {
                safePlay();
                return;
            }

            const currentTime = heroVideo.currentTime;
            const hasAdvanced = currentTime > lastKnownTime + 0.04;

            if (hasAdvanced) {
                handleHealthyPlayback();
                return;
            }

            stallTicks += 1;

            if (stallTicks >= 2) {
                safePlay();
            }

            if (stallTicks >= 4) {
                enableStaticFallback();
            }
        };

        ['loadedmetadata', 'loadeddata', 'canplay', 'playing', 'timeupdate'].forEach((eventName) => {
            heroVideo.addEventListener(eventName, handleHealthyPlayback, { passive: true });
        });

        ['waiting', 'stalled', 'error'].forEach((eventName) => {
            heroVideo.addEventListener(eventName, () => {
                stallTicks += 1;
                if (stallTicks >= 3 || eventName === 'error') {
                    enableStaticFallback();
                    return;
                }
                safePlay();
            }, { passive: true });
        });

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                heroVideo.pause();
                return;
            }

            safePlay();
        }, { passive: true });

        window.addEventListener('focus', safePlay, { passive: true });

        if ('IntersectionObserver' in window) {
            intersectionObserver = new IntersectionObserver((entries) => {
                const entry = entries[0];
                if (!entry) return;

                if (entry.isIntersecting) {
                    safePlay();
                    return;
                }

                heroVideo.pause();
            }, { threshold: 0.2 });

            intersectionObserver.observe(heroSection);
        }

        monitorId = window.setInterval(monitorPlayback, 2000);
        window.addEventListener('beforeunload', () => {
            if (monitorId) window.clearInterval(monitorId);
            if (intersectionObserver) intersectionObserver.disconnect();
        }, { once: true });

        safePlay();
    };

    setupHeroBackgroundVideo();

    // ---------- HEADER SCROLL EFFECT ----------
    const header = document.getElementById('header');
    const burgerBtn = document.getElementById('burgerBtn');
    const navMenu = document.getElementById('navMenu');
    const headerNavContainer = document.querySelector('.header__nav .container');
    const socialProfiles = {
        facebook: 'https://www.facebook.com/moldacoperis.md/',
        instagram: 'https://www.instagram.com/moldacoperis.md/',
        viber: 'viber://chat?number=%2B37379360360',
        youtube: 'https://www.youtube.com/@moldacoperis',
        tiktok: 'https://www.tiktok.com/@moldacoperis.md1'
    };

    // Prevent forced-dark extensions from applying destructive filters on brand logos.
    document.querySelectorAll('.header__logo-img, .hero__brand-logo').forEach((imgEl) => {
        imgEl.setAttribute('data-darkreader-ignore', '');
        imgEl.setAttribute('data-darkreader-inline-filter', 'none');
    });

    const logoLightSrc = '/images/logo-light.png';
    const forceLightLogo = () => {
        document.querySelectorAll('.header__logo-img, .hero__brand-logo').forEach((logoEl) => {
            if (logoEl.getAttribute('src') !== logoLightSrc) {
                logoEl.setAttribute('src', logoLightSrc);
            }
        });
    };

    forceLightLogo();

    const normalizePath = (path) => {
        if (!path || path === '/') return '/';
        return path.replace(/\/+$/, '') || '/';
    };

    const currentPath = normalizePath(window.location.pathname);
    const isRussianPage = currentPath === '/ru' || currentPath.startsWith('/ru/');
    const rootPath = normalizePath(currentPath.replace(/^\/ru(?=\/|$)/, '') || '/');
    const thankYouPath = '/thank-you';
    const modularPremiumPath = '/produse/tigla-metalica-modulara-premium';
    const modularRuRootPath = '/produse/tigla-metalica-modulara';
    const modularRuPath = '/ru/produse/tigla-metalica-modulara';
    const isModularPremiumFamilyPage = rootPath === modularPremiumPath || rootPath === modularRuRootPath;
    const productRoutes = [
        '/produse/tigla-metalica',
        modularPremiumPath,
        '/produse/sindrila-bituminoasa',
        '/produse/tabla-cutata',
        '/produse/sistem-de-scurgere',
        '/produse/accesorii-acoperis'
    ];
    const localizePath = (path, language = (isRussianPage ? 'ru' : 'ro')) => {
        if (language === 'ru') {
            return path === '/' ? '/ru/' : `/ru${path}`;
        }

        return path;
    };
    const getLanguageSwitcherPath = (language) => {
        if (isModularPremiumFamilyPage) {
            return language === 'ru' ? `${modularRuPath}/` : `${modularPremiumPath}/`;
        }

        const projectDetailMatch = currentPath.match(/^\/(?:ru\/)?portofoliu\/proiecte\/([^/]+)$/);
        if (projectDetailMatch) {
            const slug = projectDetailMatch[1];
            return language === 'ru' ? `/ru/portofoliu/proiecte/${slug}/` : `/portofoliu/proiecte/${slug}/`;
        }

        const primaryRoutes = ['/', '/portofoliu', '/despre-noi', '/blog', '/contact', '/rechizite', '/politica-confidentialitate'];
        // Check specific product routes first, otherwise '/produse' would match every product detail page.
        const localizedRoutes = [...productRoutes, ...primaryRoutes];

        for (const route of localizedRoutes) {
            const roRoute = normalizePath(route);
            const ruRoute = normalizePath(localizePath(route, 'ru'));
            const isRootRoute = route === '/';
            const matchesRo = currentPath === roRoute || (!isRootRoute && currentPath.startsWith(`${roRoute}/`));
            const matchesRu = currentPath === ruRoute || (!isRootRoute && currentPath.startsWith(`${ruRoute}/`));

            if (matchesRo || matchesRu) {
                return language === 'ru' ? localizePath(route, 'ru') : route;
            }
        }

        return language === 'ru' ? '/ru/' : '/';
    };

    const redirectToThankYouPage = (source) => {
        if (typeof window.gtag === 'function') {
            window.gtag('event', 'lead_redirect_to_thank_you', {
                event_category: 'lead',
                lead_source: source || 'form'
            });
        }

        window.setTimeout(() => {
            window.location.assign(thankYouPath);
        }, 300);
    };
    const uiText = isRussianPage
        ? {
            reviewsAvailable: (count) => `${count} отзывов`,
            reviewsEmpty: 'Скоро здесь появятся проверенные отзывы клиентов MoldAcoperis.',
            googleRatingLabel: (ratingValue) => `Рейтинг Google ${ratingValue.toFixed(1)} из 5`,
            modalConfig: 'Конфигурация',
            modalMaterial: 'Материал',
            modalQuality: 'Качество',
            modalArea: 'Площадь',
            modalEstimate: 'Ориентировочная стоимость',
            modalSubmitting: 'Отправка...',
            modalSuccessTitle: 'Заявка успешно отправлена!',
            modalSuccessMessage: 'Мы свяжемся с вами в ближайшее время.',
            modalErrorTitle: 'Не удалось отправить заявку',
            modalErrorMessage: 'Проверьте подключение и попробуйте снова.',
            modalMissingWebhook: 'Telegram webhook не настроен. Добавьте endpoint для приема заявок.',
            configuratorLeadSubmitting: 'Отправка запроса...',
            configuratorLeadSuccess: 'Заявка отправлена. Мы скоро свяжемся с вами с ориентировочной оценкой.',
            configuratorLeadSuccessTitle: 'Заявка успешно отправлена',
            configuratorLeadSuccessMessage: 'Мы свяжемся с вами в ближайшее время.',
            configuratorLeadError: 'Сейчас не удалось отправить заявку. Попробуйте еще раз или позвоните нам напрямую.',
            configuratorLeadRequired: 'Заполните имя и телефон, чтобы мы могли связаться с вами.',
            productLeadSubmitting: 'Отправка...',
            productLeadSuccess: 'Заявка отправлена. Мы свяжемся с вами в ближайшее время.',
            productLeadError: 'Не удалось отправить заявку. Попробуйте еще раз или позвоните нам напрямую.',
            productLeadRequired: 'Заполните имя и телефон, чтобы мы могли связаться с вами.',
            headerOfferLabel: 'Запросить предложение',
            headerBurgerLabel: 'Открыть меню',
            areaUnit: 'м²',
            currency: 'лей'
        }
        : {
            reviewsAvailable: (count) => `${count} recenzii disponibile`,
            reviewsEmpty: 'În curând aici vor apărea și recenzii verificate de la clienții MoldAcoperiș.',
            googleRatingLabel: (ratingValue) => `Rating Google ${ratingValue.toFixed(1)} din 5`,
            modalConfig: 'Configuratie',
            modalMaterial: 'Material',
            modalQuality: 'Calitate',
            modalArea: 'Suprafata',
            modalEstimate: 'Cost estimat',
            modalSubmitting: 'Se trimite...',
            modalSuccessTitle: 'Cerere trimisa cu succes!',
            modalSuccessMessage: 'Va vom contacta in curand.',
            modalErrorTitle: 'Cererea nu a putut fi trimisa',
            modalErrorMessage: 'Verificati conexiunea si incercati din nou.',
            modalMissingWebhook: 'Webhook-ul Telegram nu este configurat. Adauga endpoint-ul pentru cereri.',
            configuratorLeadSubmitting: 'Se trimite cererea...',
            configuratorLeadSuccess: 'Cererea a fost trimisă. Revenim în scurt timp cu estimarea orientativă.',
            configuratorLeadSuccessTitle: 'Solicitarea a fost transmisă cu succes',
            configuratorLeadSuccessMessage: 'Vei fi contactat în scurt timp.',
            configuratorLeadError: 'Cererea nu a putut fi trimisă acum. Încearcă din nou sau sună-ne direct.',
            configuratorLeadRequired: 'Completează numele și telefonul ca să te putem contacta.',
            productLeadSubmitting: 'Se trimite...',
            productLeadSuccess: 'Solicitarea a fost transmisă. Te contactăm în scurt timp.',
            productLeadError: 'Solicitarea nu a putut fi trimisă. Încearcă din nou sau sună-ne direct.',
            productLeadRequired: 'Completează numele și telefonul ca să te putem contacta.',
            corrugatedSubmitting: 'Se trimite cererea...',
            corrugatedSuccess: 'Cererea a fost trimisa. Revenim in cel mai scurt timp.',
            corrugatedError: 'Cererea nu a putut fi trimisa. Incearca din nou.',
            headerOfferLabel: 'Solicită Ofertă',
            headerBurgerLabel: 'Deschide meniul',
            areaUnit: 'm²',
            currency: 'lei'
        };

    const ensureOfferModalShell = () => {
        if (!document.body) return null;

        let modalRoot = document.getElementById('ofertaModal');
        if (modalRoot) return modalRoot;

        modalRoot = document.createElement('div');
        modalRoot.className = 'modal-overlay';
        modalRoot.id = 'ofertaModal';
        modalRoot.innerHTML = `
            <div class="modal">
                <button class="modal__close" id="modalClose" aria-label="${isRussianPage ? 'Закрыть' : 'Închide'}"><i class="fas fa-times"></i></button>
                <div class="modal__icon"><i class="fas fa-file-invoice"></i></div>
                <h3 class="modal__title">${isRussianPage ? 'Запросить предложение' : 'Solicită Ofertă'}</h3>
                <p class="modal__desc">${isRussianPage ? 'Оставьте данные, и мы свяжемся с вами с понятным персональным предложением для вашего проекта.' : 'Completează datele, iar noi revenim cu o ofertă clară și personalizată pentru proiectul tău.'}</p>
                <div class="modal__summary" id="modalSummary"></div>
                <form class="modal__form" id="ofertaForm">
                    <div class="modal__field"><label for="ofertaNume"><i class="fas fa-user"></i> ${isRussianPage ? 'Имя и фамилия' : 'Nume și prenume'}</label><input type="text" id="ofertaNume" name="nume" placeholder="Exemplu: Ion Popescu" required></div>
                    <div class="modal__field"><label for="ofertaTel"><i class="fas fa-phone"></i> ${isRussianPage ? 'Telefon' : 'Telefon'}</label><input type="tel" id="ofertaTel" name="telefon" placeholder="Exemplu: 0712 345 678" required></div>
                    <button type="submit" class="btn btn--primary btn--lg modal__submit"><i class="fas fa-paper-plane"></i> ${isRussianPage ? 'Отправить заявку' : 'Trimite Cererea'}</button>
                </form>
                <div class="modal__success" id="modalSuccess"><i class="fas fa-check-circle"></i><h4>${uiText.modalSuccessTitle}</h4><p>${uiText.modalSuccessMessage}</p></div>
            </div>
        `;

        document.body.appendChild(modalRoot);
        return modalRoot;
    };

    const ensureBackToTopElement = () => {
        if (!document.body) return null;

        let backToTopButton = document.getElementById('backToTop');
        if (backToTopButton) return backToTopButton;

        backToTopButton = document.createElement('button');
        backToTopButton.className = 'back-to-top';
        backToTopButton.id = 'backToTop';
        backToTopButton.setAttribute('aria-label', isRussianPage ? 'Наверх' : 'Înapoi sus');
        backToTopButton.innerHTML = '<i class="fas fa-chevron-up"></i>';
        document.body.appendChild(backToTopButton);
        return backToTopButton;
    };

    ensureOfferModalShell();
    const pageBody = document.body;
    const isHomepage = pageBody && pageBody.classList.contains('homepage');
    const isProductPage = rootPath.startsWith('/produse/');
    const isPortfolioIndexPage = rootPath === '/portofoliu';
    const isProjectDetailPage = /^\/portofoliu\/proiecte\/[^/]+$/.test(rootPath);
    const isContactPage = rootPath === '/contact';
    const isCorrugatedProductPage = rootPath === '/produse/tabla-cutata';

    const setupHomepageConfiguratorAnchorGuard = () => {
        if (!isHomepage) return;

        const normalizePathForCompare = (value) => {
            const normalized = String(value || '/').replace(/\/+$/, '');
            return normalized || '/';
        };
        const isMobileViewport = () => document.documentElement.classList.contains('is-mobile-viewport')
            || (window.matchMedia && window.matchMedia('(max-width: 768px)').matches);
        const isReloadNavigation = () => {
            const navigationEntry = performance.getEntriesByType
                ? performance.getEntriesByType('navigation')[0]
                : null;
            return navigationEntry?.type === 'reload'
                || (performance.navigation && performance.navigation.type === 1);
        };
        const clearHash = () => {
            if (window.location.hash !== '#configurator') return;
            window.history.replaceState(null, document.title, `${window.location.pathname}${window.location.search}`);
        };

        if (isMobileViewport() && window.location.hash === '#configurator' && isReloadNavigation()) {
            clearHash();
            window.requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: 'auto' }));
            window.setTimeout(() => window.scrollTo({ top: 0, left: 0, behavior: 'auto' }), 80);
        }

        document.addEventListener('click', (event) => {
            const anchor = event.target.closest('a[href]');
            if (!anchor) return;

            let url;
            try {
                url = new URL(anchor.getAttribute('href'), window.location.href);
            } catch (error) {
                return;
            }

            const samePage = url.origin === window.location.origin
                && normalizePathForCompare(url.pathname) === normalizePathForCompare(window.location.pathname);
            if (!samePage || url.hash !== '#configurator') return;

            const configurator = document.getElementById('configurator');
            if (!configurator) return;

            event.preventDefault();
            configurator.scrollIntoView({ behavior: 'smooth', block: 'start' });
            clearHash();
        });
    };

    setupHomepageConfiguratorAnchorGuard();

    const setupMetalTileImageLightbox = () => {
        if (rootPath !== '/produse/tigla-metalica' || !pageBody) return;

        const selector = '.product-metal-tile-page .metal-tile-models__media img';
        const images = Array.from(document.querySelectorAll(selector));
        if (!images.length) return;

        const labels = isRussianPage
            ? {
                close: '\u0417\u0430\u043a\u0440\u044b\u0442\u044c \u0438\u0437\u043e\u0431\u0440\u0430\u0436\u0435\u043d\u0438\u0435',
                previous: '\u041f\u0440\u0435\u0434\u044b\u0434\u0443\u0449\u0435\u0435 \u0438\u0437\u043e\u0431\u0440\u0430\u0436\u0435\u043d\u0438\u0435',
                next: '\u0421\u043b\u0435\u0434\u0443\u044e\u0449\u0435\u0435 \u0438\u0437\u043e\u0431\u0440\u0430\u0436\u0435\u043d\u0438\u0435',
                fallbackTitle: '\u041c\u0435\u0442\u0430\u043b\u043b\u043e\u0447\u0435\u0440\u0435\u043f\u0438\u0446\u0430',
                zoom: '\u0423\u0432\u0435\u043b\u0438\u0447\u0438\u0442\u044c'
            }
            : {
                close: '\u00cenchide imaginea',
                previous: 'Imaginea anterioar\u0103',
                next: 'Imaginea urm\u0103toare',
                fallbackTitle: '\u021aigl\u0103 metalic\u0103',
                zoom: 'M\u0103re\u0219te'
            };

        let lightbox = null;

        const getImageTitle = (img) => {
            const cardTitle = img.closest('.metal-tile-models__card')?.querySelector('.metal-tile-models__title')?.textContent?.trim();
            return cardTitle || img.getAttribute('alt') || labels.fallbackTitle;
        };

        const visibleImages = () => images.filter((img) => {
            if (!img.src && !img.getAttribute('src')) return false;
            if (img.closest('[hidden]')) return false;
            return true;
        });

        const ensureLightbox = () => {
            if (lightbox) return lightbox;

            const overlay = document.createElement('div');
            overlay.className = 'project-lightbox product-image-lightbox';
            overlay.setAttribute('aria-hidden', 'true');
            overlay.innerHTML = `
                <div class="project-lightbox__dialog" role="dialog" aria-modal="true" aria-label="${labels.fallbackTitle}">
                    <button type="button" class="project-lightbox__close" aria-label="${labels.close}">
                        <i class="fas fa-times" aria-hidden="true"></i>
                    </button>
                    <button type="button" class="project-lightbox__nav project-lightbox__nav--prev" aria-label="${labels.previous}">
                        <i class="fas fa-chevron-left" aria-hidden="true"></i>
                    </button>
                    <figure class="project-lightbox__figure">
                        <img class="project-lightbox__image" src="" alt="" decoding="async">
                        <figcaption class="project-lightbox__caption"></figcaption>
                    </figure>
                    <button type="button" class="project-lightbox__nav project-lightbox__nav--next" aria-label="${labels.next}">
                        <i class="fas fa-chevron-right" aria-hidden="true"></i>
                    </button>
                    <div class="project-lightbox__counter">1 / 1</div>
                </div>
            `;
            document.body.appendChild(overlay);

            const dialog = overlay.querySelector('.project-lightbox__dialog');
            const imageEl = overlay.querySelector('.project-lightbox__image');
            const captionEl = overlay.querySelector('.project-lightbox__caption');
            const counterEl = overlay.querySelector('.project-lightbox__counter');
            const prevBtn = overlay.querySelector('.project-lightbox__nav--prev');
            const nextBtn = overlay.querySelector('.project-lightbox__nav--next');
            const closeBtn = overlay.querySelector('.project-lightbox__close');

            const state = {
                items: [],
                index: 0,
                activeTrigger: null,
                showAt(targetIndex) {
                    if (!this.items.length) return;
                    const total = this.items.length;
                    this.index = (targetIndex + total) % total;
                    const item = this.items[this.index];
                    imageEl.classList.add('is-switching');
                    imageEl.src = item.src;
                    imageEl.alt = item.alt;
                    captionEl.textContent = item.title;
                    dialog.setAttribute('aria-label', item.title);
                    counterEl.textContent = `${this.index + 1} / ${total}`;
                },
                open(startImage, trigger) {
                    const candidates = visibleImages();
                    if (!candidates.length) return;

                    this.items = candidates.map((img) => {
                        const title = getImageTitle(img);
                        return {
                            src: img.currentSrc || img.src || img.getAttribute('src'),
                            alt: img.getAttribute('alt') || title,
                            title
                        };
                    });

                    const activeSrc = startImage.currentSrc || startImage.src || startImage.getAttribute('src');
                    const startIndex = Math.max(0, candidates.findIndex((img) => {
                        const source = img.currentSrc || img.src || img.getAttribute('src');
                        return source === activeSrc;
                    }));

                    this.activeTrigger = trigger || startImage;
                    overlay.classList.add('is-active');
                    overlay.setAttribute('aria-hidden', 'false');
                    document.body.classList.add('project-lightbox-open');
                    this.showAt(startIndex);
                    closeBtn.focus({ preventScroll: true });
                },
                close() {
                    overlay.classList.remove('is-active');
                    overlay.setAttribute('aria-hidden', 'true');
                    document.body.classList.remove('project-lightbox-open');
                    imageEl.removeAttribute('src');

                    if (this.activeTrigger && typeof this.activeTrigger.focus === 'function') {
                        this.activeTrigger.focus({ preventScroll: true });
                    }
                    this.activeTrigger = null;
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

            lightbox = state;
            return state;
        };

        images.forEach((img) => {
            const frame = img.closest('.metal-tile-models__media') || img;
            if (frame.dataset.productLightboxBound === '1') return;

            frame.dataset.productLightboxBound = '1';
            frame.classList.add('has-product-lightbox');
            frame.setAttribute('role', 'button');
            frame.setAttribute('tabindex', '0');
            frame.setAttribute('aria-label', `${labels.zoom}: ${getImageTitle(img)}`);
            frame.setAttribute('data-lightbox-label', labels.zoom);

            frame.addEventListener('click', () => ensureLightbox().open(img, frame));
            frame.addEventListener('keydown', (event) => {
                if (event.key !== 'Enter' && event.key !== ' ') return;
                event.preventDefault();
                ensureLightbox().open(img, frame);
            });
        });
    };

    setupMetalTileImageLightbox();

    const projectPageCtaContent = isRussianPage
        ? {
            title: 'Хотите похожий проект?',
            desc: 'Отправьте примерную площадь и желаемый материал, а мы подготовим персональное предложение под ваш объект.',
            primaryLabel: 'Запросить предложение',
            secondaryLabel: 'Связаться с нами',
            secondaryHref: '/ru/contact'
        }
        : {
            title: 'Vrei un proiect similar?',
            desc: 'Trimite-ne suprafața aproximativă și produsul dorit, iar pregătim o ofertă personalizată pentru acoperișul tău.',
            primaryLabel: 'Solicită Ofertă',
            secondaryLabel: 'Contactează-ne',
            secondaryHref: '/contact'
        };
    const headerTopInfoContent = isRussianPage
        ? {
            address: 'Calea Basarabiei 30, Chișinău'
        }
        : {
            address: 'Calea Basarabiei 30, Chișinău'
        };
    const defaultOfferWebhookEndpoint = '/api/offer';
    const offerWebhookEndpoint = String(
        window.MA_OFFER_WEBHOOK
        || (document.querySelector('meta[name="ma-offer-webhook"]') || {}).content
        || defaultOfferWebhookEndpoint
        || ''
    ).trim();
    function isSameOriginEndpoint(endpoint) {
        try {
            return new URL(endpoint, window.location.href).origin === window.location.origin;
        } catch (error) {
            return true;
        }
    }
    const defaultHeaderImage = '/images/products/header/blog_header.jpg';
    const directHeaderImageMap = [
        ['/despre-noi', '/images/products/header/despre_noi_header.jpg'],
        ['/contact', '/images/products/header/contact_header.jpg'],
        ['/portofoliu', '/images/products/header/portofoliu_header.jpg'],
        ['/rechizite', '/images/products/header/contact_header.jpg'],
        ['/thank-you', '/images/products/header/contact_header.jpg'],
        ['/politica-confidentialitate', '/images/products/header/politica_confidentialitate.jpg'],
        ['/produse/accesorii-acoperis', '/images/products/header/accesorii_acoperis.jpg'],
        ['/produse/tabla-cutata', '/images/products/header/tabla_cutata.jpg'],
        ['/produse/tigla-metalica-modulara-premium', '/images/products/header/tigla_metalica_modulara.jpg'],
        ['/produse/tigla-metalica-modulara', '/images/products/header/tigla_metalica_modulara.jpg'],
        ['/produse/tigla-metalica', '/images/products/header/tigla_metalica_header.jpg'],
        ['/produse/sindrila-bituminoasa', '/images/products/header/sindrila_header.jpg'],
        ['/blog', '/images/products/header/blog_header.jpg']
    ];

    const uniqueValues = (values) => [...new Set(values.filter(Boolean))];

    const resolveHeaderImageByPath = () => {
        const cachedImage = window.sessionStorage.getItem(`ma-header-image:${rootPath}`);
        if (cachedImage) {
            return cachedImage;
        }

        const projectDetailMatch = rootPath.match(/^\/portofoliu\/proiecte\/([^/]+)$/);
        let projectHeaderImage = null;

        if (projectDetailMatch) {
            const projectSlug = decodeURIComponent(projectDetailMatch[1]);
            const projectIdFromBody = Number(document.body && document.body.getAttribute('data-project-id'));
            let projectId = Number.isFinite(projectIdFromBody) && projectIdFromBody > 0 ? projectIdFromBody : null;

            if (!projectId && Array.isArray(window.MA_PROJECTS)) {
                const matchedProject = window.MA_PROJECTS.find((item) => item && item.slug === projectSlug);
                if (matchedProject && Number.isFinite(Number(matchedProject.id))) {
                    projectId = Number(matchedProject.id);
                }
            }

            if (projectId) {
                const folder = String(projectId).padStart(2, '0');
                projectHeaderImage = `/images/projects/${folder}/${folder}.jpg`;
            }
        }

        const mappedImage = directHeaderImageMap.find(([route]) => rootPath === route || rootPath.startsWith(`${route}/`));
        const resolved = projectHeaderImage || (mappedImage ? mappedImage[1] : defaultHeaderImage);
        window.sessionStorage.setItem(`ma-header-image:${rootPath}`, resolved);
        return resolved;
    };

    const applyHeaderBackgroundImages = () => {
        const pageHeader = document.querySelector('.page-header');
        const articleHero = document.querySelector('.article-page__hero');

        if (!pageHeader && !articleHero) {
            return;
        }

        [pageHeader, articleHero].filter(Boolean).forEach((element) => {
            element.setAttribute('data-darkreader-ignore', '');
            element.setAttribute('data-darkreader-inline-bgimage', 'none');
            element.setAttribute('data-darkreader-inline-bgcolor', 'initial');
        });

        const applyImage = (imagePath) => {
            if (pageHeader) {
                pageHeader.style.setProperty('--page-header-image', `url('${imagePath}')`);
                pageHeader.style.backgroundImage = `linear-gradient(135deg, rgba(26, 26, 46, 0.9) 0%, rgba(34, 34, 58, 0.88) 50%, rgba(42, 26, 14, 0.86) 100%), url('${imagePath}')`;
                pageHeader.style.backgroundPosition = 'center, center';
                pageHeader.style.backgroundSize = 'cover, cover';
                pageHeader.style.backgroundRepeat = 'no-repeat, no-repeat';
            }

            if (articleHero) {
                articleHero.style.setProperty('--article-hero-image', `url('${imagePath}')`);
                articleHero.style.backgroundImage = `linear-gradient(135deg, rgba(16, 22, 32, 0.88) 0%, rgba(24, 31, 46, 0.82) 52%, rgba(35, 24, 16, 0.78) 100%), url('${imagePath}')`;
                articleHero.style.backgroundPosition = 'center, center';
                articleHero.style.backgroundSize = 'cover, cover';
                articleHero.style.backgroundRepeat = 'no-repeat, no-repeat';
            }
        };

        // Apply a single resolved image to prevent first-paint flicker between fallback and route image.
        const resolvedImage = resolveHeaderImageByPath() || defaultHeaderImage;
        applyImage(resolvedImage);
    };
    const isActivePath = (path) => {
        const normalizedPath = normalizePath(path);
        if (normalizedPath === '/' || normalizedPath === '/ru') return currentPath === normalizedPath;
        return currentPath === normalizedPath || currentPath.startsWith(`${normalizedPath}/`);
    };

    const isActiveAnchor = (anchorId) => {
        if (!isRussianPage) return false;
        const hash = window.location.hash || '#';
        if (anchorId === '#') return hash === '#' || hash === '';
        return hash === anchorId;
    };

    const localizedProductCatalog = isRussianPage
        ? [
            {
                slug: 'tigla-metalica',
                href: '/ru/produse/tigla-metalica/',
                navLabel: 'Металлочерепица',
                title: 'Классическая металлочерепица',
                image: '/images/products/tigla-metalica.jpg',
                icon: 'fas fa-layer-group',
                desc: 'Классическое решение для частных домов с хорошим балансом цены и ресурса.'
            },
            {
                slug: 'tigla-metalica-modulara',
                href: `${modularRuPath}/`,
                navLabel: 'Модульная металлочерепица',
                title: 'Модульная металлочерепица',
                image: '/images/tigla-metalica-modulara.jpg',
                icon: 'fas fa-th-large',
                desc: 'Удобна на сложной геометрии и снижает отходы при монтаже.',
                isModular: true
            },
            {
                slug: 'sindrila-bituminoasa',
                href: '/ru/produse/sindrila-bituminoasa/',
                navLabel: 'Битумная черепица',
                title: 'Битумная черепица',
                image: '/images/products/sindrila-bituminoasa.jpg',
                icon: 'fas fa-home',
                desc: 'Гибкая кровля с выразительным дизайном и хорошими акустическими свойствами.'
            },
            {
                slug: 'tabla-cutata',
                href: '/ru/produse/tabla-cutata/',
                navLabel: 'Профнастил',
                title: 'Профнастил',
                image: '/images/products/tabla-cutata.jpg',
                icon: 'fas fa-grip-lines',
                desc: 'Практичный материал для технических, коммерческих и частных проектов.'
            },
            {
                slug: 'sistem-de-scurgere',
                href: '/ru/produse/sistem-de-scurgere/',
                navLabel: 'Водосточная система',
                title: 'Водосточная система',
                image: '/images/products/Sistem_de_scurgere/sisteme-de-scurgere.jpg',
                icon: 'fas fa-water',
                desc: 'Надежный отвод воды и защита фасада и фундамента от переувлажнения.'
            },
            {
                slug: 'accesorii-acoperis',
                href: '/ru/produse/accesorii-acoperis/',
                navLabel: 'Кровельные аксессуары',
                title: 'Кровельные аксессуары',
                image: '/images/products/accesorii_acoperis.jpg',
                icon: 'fas fa-puzzle-piece',
                desc: 'Доборные элементы для полного, аккуратного и долговечного кровельного узла.'
            }
        ]
        : [
            {
                slug: 'tigla-metalica',
                href: '/produse/tigla-metalica/',
                navLabel: 'Țiglă Metalică',
                title: 'Tigla Metalica Clasica',
                image: '/images/products/tigla-metalica.jpg',
                icon: 'fas fa-layer-group',
                desc: 'Solutie clasica pentru locuinte, cu echilibru bun intre cost si durabilitate.'
            },
            {
                slug: 'tigla-metalica-modulara-premium',
                href: `${modularPremiumPath}/`,
                navLabel: 'Țiglă Metalică Modulară',
                title: 'Tigla Metalica Modulara',
                image: '/images/tigla-metalica-modulara.jpg',
                icon: 'fas fa-th-large',
                desc: 'Ideala pentru geometrii complexe, cu montaj rapid si deseuri reduse.',
                isModular: true
            },
            {
                slug: 'sindrila-bituminoasa',
                href: '/produse/sindrila-bituminoasa/',
                navLabel: 'Șindrilă Bituminoasă',
                title: 'Sindrila Bituminoasa',
                image: '/images/products/sindrila-bituminoasa.jpg',
                icon: 'fas fa-home',
                desc: 'Invelitoare flexibila, premium, potrivita pentru acoperisuri cu forme variate.'
            },
            {
                slug: 'tabla-cutata',
                href: '/produse/tabla-cutata/',
                navLabel: 'Tablă Cutată',
                title: 'Tabla Cutata',
                image: '/images/products/tabla-cutata.jpg',
                icon: 'fas fa-grip-lines',
                desc: 'Varianta practica pentru proiecte tehnice, comerciale si anexe rezidentiale.'
            },
            {
                slug: 'sistem-de-scurgere',
                href: '/produse/sistem-de-scurgere/',
                navLabel: 'Sistem de Scurgere',
                title: 'Sistem de Scurgere',
                image: '/images/products/Sistem_de_scurgere/sisteme-de-scurgere.jpg',
                icon: 'fas fa-water',
                desc: 'Colecteaza si evacueaza apa eficient pentru protectia fatadei si fundatiei.'
            },
            {
                slug: 'accesorii-acoperis',
                href: '/produse/accesorii-acoperis/',
                navLabel: 'Accesorii Acoperiș',
                title: 'Accesorii Acoperis',
                image: '/images/products/accesorii_acoperis.jpg',
                icon: 'fas fa-puzzle-piece',
                desc: 'Elemente complementare pentru etansare, ventilare si finisaj corect al sistemului.'
            }
        ];

    const localizedProductLinks = localizedProductCatalog.map((item) => ({
        href: item.href,
        label: item.navLabel,
        isModular: Boolean(item.isModular)
    }));

    const localizedPrimaryNavLinks = isRussianPage
        ? [
            { href: localizePath('/'), label: 'Домой' },
            { href: localizePath('/portofoliu'), label: 'Портфолио' },
            { href: localizePath('/despre-noi'), label: 'О нас' },
            { href: localizePath('/blog'), label: 'Блог' },
            { href: localizePath('/contact'), label: 'Контакты' }
        ]
        : [
            { href: '/', label: 'Acasă' },
            { href: '/portofoliu', label: 'Portofoliu' },
            { href: '/despre-noi', label: 'Despre Noi' },
            { href: '/blog', label: 'Blog' },
            { href: '/contact', label: 'Contact' }
        ];

    const localizedUtilityLinks = isRussianPage
        ? [
            { href: '/ru/despre-noi', label: 'О нас' },
            { href: '/ru/portofoliu', label: 'Портфолио' },
            { href: '/ru/#configurator', label: 'Оценка цены' },
            { href: '/ru/blog', label: 'Блог' },
            { href: '/ru/intrebari-frecvente', label: 'Частые вопросы' },
                { href: '/ru/informaciya-moldacoperis', label: 'Полезная информация' },
            { href: '/ru/contact', label: 'Контакты' },
            { href: '/ru/rechizite', label: 'Реквизиты' },
            { href: '/ru/politica-confidentialitate', label: 'Политика конфиденциальности' }
        ]
        : [
            { href: '/despre-noi', label: 'Despre Noi' },
            { href: '/portofoliu', label: 'Portofoliu' },
            { href: '/#configurator', label: 'Estimare Preț' },
            { href: '/blog', label: 'Blog' },
            { href: '/intrebari-frecvente', label: 'Întrebări Frecvente' },
                { href: '/informatii-moldacoperis', label: 'Informații utile' },
            { href: '/contact', label: 'Contact' },
            { href: '/rechizite', label: 'Rechizite' },
            { href: '/politica-confidentialitate', label: 'Politica de Confidențialitate' }
        ];

    const footerContent = isRussianPage
        ? {
            about: 'MoldAcoperis - ваш надежный партнер для любых кровельных работ. Качество, профессионализм и гарантия.',
            productHeading: 'Продукция',
            usefulHeading: 'Полезные ссылки',
            contactHeading: 'Контакты',
            usefulLinks: localizedUtilityLinks,
            contactLines: [
                '<i class="fas fa-map-marker-alt"></i> Calea Basarabiei 30, Chisinau',
                '<a href="tel:+37379360360"><i class="fas fa-phone"></i> +373 79 360 360</a>',
                '<a href="mailto:moldacoperis@gmail.com"><i class="fas fa-envelope"></i> moldacoperis@gmail.com</a>',
                '<i class="fas fa-clock"></i> Пн - Пт: 08:30 - 17:30 | Сб: 08:30 - 12:30'
            ],
            copyright: '&copy; 2026 MoldAcoperis. Все права защищены.'
        }
        : {
            about: 'MoldAcoperis - compania ta de incredere pentru orice tip de lucrare legata de acoperisuri. Calitate, profesionalism, garantie.',
            productHeading: 'Produse',
            usefulHeading: 'Linkuri Utile',
            contactHeading: 'Contact',
            usefulLinks: localizedUtilityLinks,
            contactLines: [
                '<i class="fas fa-map-marker-alt"></i> Calea Basarabiei 30, Chisinau',
                '<a href="tel:+37379360360"><i class="fas fa-phone"></i> +373 79 360 360</a>',
                '<a href="mailto:moldacoperis@gmail.com"><i class="fas fa-envelope"></i> moldacoperis@gmail.com</a>',
                '<i class="fas fa-clock"></i> Lun - Vin: 08:30 - 17:30 | Sam: 08:30 - 12:30'
            ],
            copyright: '&copy; 2026 MoldAcoperis. Toate drepturile rezervate.'
        };

    const renderHeaderProductLinks = () => {
        return localizedProductLinks.map((item) => {
            const isActive = item.isModular ? isModularPremiumFamilyPage : isActivePath(item.href);
            const modularLabelClass = item.isModular
                ? `header__dropdown-label header__dropdown-label--tagged${isRussianPage ? ' header__dropdown-label--tagged-ru' : ''}`
                : 'header__dropdown-label';
            const modularBadgeClass = item.isModular
                ? `header__new-badge header__new-badge--dropdown${isRussianPage ? ' header__new-badge--dropdown-ru' : ''}`
                : 'header__new-badge';
            const labelContent = item.isModular
                ? `<span class="${modularLabelClass}">${item.label}<span class="${modularBadgeClass}">Nou</span></span>`
                : `<span class="${modularLabelClass}">${item.label}</span>`;
            return `<li><a href="${item.href}"${isActive ? ' class="active"' : ''}>${labelContent}</a></li>`;
        }).join('');
    };

    const renderPrimaryNavLink = (item) => {
        return `<li><a href="${item.href}" class="header__menu-link${isActivePath(item.href) ? ' active' : ''}">${item.label}</a></li>`;
    };

    const renderPrimaryNavLinks = (items) => {
        return items.map(renderPrimaryNavLink).join('');
    };

    const renderFooterLinkList = (items) => {
        return items.map((item) => `<li><a href="${item.href}">${item.label}</a></li>`).join('');
    };

    const buildProductsMenu = () => {
        if (!navMenu) return;

        const [homeNavItem, ...secondaryNavItems] = localizedPrimaryNavLinks;
        const productsPath = localizePath('/produse');

        navMenu.innerHTML = `
            ${renderPrimaryNavLink(homeNavItem)}
            <li class="header__dropdown${isActivePath(productsPath) ? ' open' : ''}">
                <a href="#" class="header__menu-link${isActivePath(productsPath) ? ' active' : ''}" data-dropdown-trigger="products"><span class="header__menu-link-main"><span>${isRussianPage ? 'Продукция' : 'Produse'}</span><span class="header__new-badge">NOU</span></span><i class="fas fa-chevron-down header__dropdown-arrow"></i></a>
                <ul class="header__dropdown-menu">
                    ${renderHeaderProductLinks()}
                </ul>
            </li>
            ${renderPrimaryNavLinks(secondaryNavItems)}
        `;
    };

    const buildLanguageSwitcher = () => {
        if (!headerNavContainer || headerNavContainer.querySelector('.header__lang-switcher')) return;

        const languageSwitcher = document.createElement('div');
        const currentLanguage = isRussianPage ? 'ru' : 'ro';
        const romanianPath = getLanguageSwitcherPath('ro');
        const russianPath = getLanguageSwitcherPath('ru');

        languageSwitcher.className = 'header__lang-switcher';
        languageSwitcher.innerHTML = `
            <a href="${romanianPath}" class="header__lang-link${currentLanguage === 'ro' ? ' active' : ''}" hreflang="ro" lang="ro">RO</a>
            <a href="${russianPath}" class="header__lang-link${currentLanguage === 'ru' ? ' active' : ''}" hreflang="ru" lang="ru">RU</a>
        `;

        const burgerButton = headerNavContainer.querySelector('#burgerBtn');
        if (burgerButton) {
            headerNavContainer.insertBefore(languageSwitcher, burgerButton);
        } else {
            headerNavContainer.appendChild(languageSwitcher);
        }
    };

    const buildRelatedProductsSection = () => {
        if (!rootPath.startsWith('/produse/')) return;

        const segments = rootPath.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);
        const currentProductSlug = segments[1] || '';
        const relatedProducts = localizedProductCatalog.filter((product) => product.slug !== currentProductSlug);
        if (!relatedProducts.length) return;

        const sectionTitle = isRussianPage ? 'Узнайте Больше' : 'Afla Mai Multe';
        const sectionTag = isRussianPage ? 'Полезные ссылки' : 'Informatii Utile';
        const sectionIntro = isRussianPage
            ? 'Мы собрали самые полезные страницы для сравнения, монтажа и быстрого расчета стоимости, чтобы вам было проще выбрать правильную конфигурацию крыши.'
            : 'Am selectat cele mai utile pagini pentru comparatie, montaj si estimare rapida de cost, astfel incat sa alegi configuratia corecta pentru acoperisul tau.';
        const cardCtaLabel = isRussianPage ? 'Подробнее' : 'Vezi detalii';

        const cards = [...relatedProducts, ...relatedProducts].map((product, index) => {
            const isClone = index >= relatedProducts.length;
            const cloneAttrs = isClone ? ' aria-hidden="true" tabindex="-1" class="product-links__card product-links__card--clone"' : ' class="product-links__card"';

            return `
                <a href="${product.href}"${cloneAttrs}>
                    <div class="product-links__media">
                        <img src="${product.image}" alt="${product.title}" loading="lazy" decoding="async">
                    </div>
                    <div class="product-links__body">
                        <h3 class="product-links__title">${product.title}</h3>
                        <p class="product-links__desc">${product.desc}</p>
                        <span class="product-links__arrow">${cardCtaLabel}</span>
                    </div>
                </a>
            `;
        }).join('');

        let section = document.querySelector('.product-links');
        const sectionMarkup = `
            <div class="container">
                <div class="section-header">
                    <span class="section-header__tag">${sectionTag}</span>
                    <h2 class="section-header__title">${sectionTitle}</h2>
                </div>
                <div class="product-links__intro"><p>${sectionIntro}</p></div>
                <div class="product-links__viewport">
                    <div class="product-links__grid product-links__grid--rolling">
                        ${cards}
                    </div>
                </div>
            </div>
        `;

        if (!section) {
            section = document.createElement('section');
            section.className = 'product-links product-links--rolling';
            section.innerHTML = sectionMarkup;

            const anchor = document.querySelector('.product-projects, .cta-banner, footer.footer, main > section:last-of-type');
            if (anchor && anchor.parentElement) {
                anchor.parentElement.insertBefore(section, anchor);
            } else {
                document.body.appendChild(section);
            }
            return;
        }

        section.classList.add('product-links--rolling');
        section.innerHTML = sectionMarkup;
    };

    const escapeProductLeadHtml = (value) => String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    const getCurrentProductName = () => {
        const title = document.querySelector('.page-header__title');
        const text = title ? title.textContent.trim() : '';
        if (text) return text;
        return (document.title || 'MoldAcoperis').split('|')[0].trim();
    };

    const buildProductLeadCardSection = () => {
        if (!isProductPage || document.querySelector('.product-lead-card-section') || document.querySelector('.corrugated-lead--top')) return;

        const productName = getCurrentProductName();
        const safeProductName = escapeProductLeadHtml(productName);
        const content = isRussianPage
            ? {
                tag: 'Персональное предложение',
                title: `Расчет для: ${safeProductName}`,
                desc: 'Оставьте имя и телефон, и консультант свяжется с вами для уточнения деталей.',
                name: 'Имя',
                namePlaceholder: 'Ivan Popescu',
                phone: 'Телефон',
                phonePlaceholder: '07xx xxx xxx',
                submit: 'Получить расчет',
                privacy: 'Данные используются только для связи по выбранному продукту.'
            }
            : {
                tag: 'Ofertă personalizată',
                title: `Calcul pentru: ${safeProductName}`,
                desc: 'Lasă numele și telefonul, iar consultantul te contactează pentru detalii.',
                name: 'Nume',
                namePlaceholder: 'Ion Popescu',
                phone: 'Telefon',
                phonePlaceholder: '07xx xxx xxx',
                submit: 'Primește calculul',
                privacy: 'Folosim datele doar pentru contact privind produsul ales.'
            };

        const section = document.createElement('section');
        section.className = 'product-lead-card-section';
        section.innerHTML = `
            <div class="container">
                <div class="product-lead-card" data-product-name="${safeProductName}">
                    <div class="product-lead-card__copy">
                        <span class="section-header__tag">${content.tag}</span>
                        <h2>${content.title}</h2>
                        <p>${content.desc}</p>
                    </div>
                    <form class="product-lead-card__form" id="productLeadForm" novalidate>
                        <input type="hidden" name="produs" value="${safeProductName}">
                        <div class="product-lead-card__grid">
                            <label class="product-lead-card__field" for="productLeadName">
                                <span>${content.name}</span>
                                <input id="productLeadName" name="nume" type="text" autocomplete="name" placeholder="${content.namePlaceholder}" required>
                            </label>
                            <label class="product-lead-card__field" for="productLeadPhone">
                                <span>${content.phone}</span>
                                <input id="productLeadPhone" name="telefon" type="tel" inputmode="tel" autocomplete="tel" placeholder="${content.phonePlaceholder}" required>
                            </label>
                        </div>
                        <button type="submit" class="btn btn--primary btn--lg product-lead-card__submit">
                            <i class="fas fa-paper-plane"></i> ${content.submit}
                        </button>
                        <p class="product-lead-card__privacy">${content.privacy}</p>
                        <p class="product-lead-card__status" id="productLeadStatus" role="status" aria-live="polite"></p>
                    </form>
                </div>
            </div>
        `;

        const pageHeader = document.querySelector('.page-header');
        if (pageHeader && pageHeader.parentElement) {
            pageHeader.parentElement.insertBefore(section, pageHeader.nextSibling);
            return;
        }

        const intro = document.querySelector('.product-intro');
        if (intro && intro.parentElement) {
            intro.parentElement.insertBefore(section, intro);
        } else {
            document.body.appendChild(section);
        }
    };

    const applyUnifiedFooterLayout = () => {
        const footer = document.querySelector('footer.footer');
        if (!footer) return;

        footer.innerHTML = `
            <div class="container">
                <div class="footer__grid">
                    <div class="footer__col">
                        <img src="/images/logo-light.png" alt="MoldAcoperis" class="footer__logo" decoding="async">
                        <p class="footer__about">${footerContent.about}</p>
                        <div class="footer__social">
                            <a href="#" aria-label="Facebook"><i class="fab fa-facebook-f"></i></a>
                            <a href="#" aria-label="Instagram"><i class="fab fa-instagram"></i></a>
                            <a href="#" aria-label="Viber"><i class="fab fa-viber"></i></a>
                        </div>
                    </div>
                    <div class="footer__col">
                        <h4 class="footer__heading">${footerContent.productHeading}</h4>
                        <ul class="footer__links">
                            ${renderFooterLinkList(localizedProductLinks)}
                        </ul>
                    </div>
                    <div class="footer__col">
                        <h4 class="footer__heading">${footerContent.usefulHeading}</h4>
                        <ul class="footer__links">
                            ${renderFooterLinkList(footerContent.usefulLinks)}
                        </ul>
                    </div>
                    <div class="footer__col">
                        <h4 class="footer__heading">${footerContent.contactHeading}</h4>
                        <ul class="footer__contact">
                            ${footerContent.contactLines.map((line) => `<li>${line}</li>`).join('')}
                        </ul>
                    </div>
                </div>
                <div class="footer__bottom">
                    <p>${footerContent.copyright}</p>
                </div>
            </div>
        `;
    };

    const ensurePrivacyPolicyFooterLink = () => {
        const privacyPath = localizePath('/politica-confidentialitate');
        const privacyLabel = isRussianPage ? 'Политика конфиденциальности' : 'Politica de Confidențialitate';
        const footer = document.querySelector('footer.footer');
        if (!footer) return;

        const hasPrivacyLink = Array.from(footer.querySelectorAll('.footer__links a')).some((anchor) => {
            const href = anchor.getAttribute('href') || '';
            return href.includes('/politica-confidentialitate');
        });

        if (hasPrivacyLink) return;

        const footerLinkLists = footer.querySelectorAll('.footer__links');
        const targetList = footerLinkLists.length
            ? footerLinkLists[footerLinkLists.length - 1]
            : null;

        if (!targetList) return;

        const li = document.createElement('li');
        li.innerHTML = `<a href="${privacyPath}">${privacyLabel}</a>`;
        targetList.appendChild(li);
    };

    const applySocialLinksToSections = (selector) => {
        const socialSections = document.querySelectorAll(selector);

        socialSections.forEach(section => {
            const ensureSocialLink = (label, iconMarkup, beforeNode = null) => {
                let link = section.querySelector(`a[aria-label="${label}"]`);

                if (!link) {
                    link = document.createElement('a');
                    link.setAttribute('aria-label', label);
                    link.innerHTML = iconMarkup;

                    if (beforeNode && beforeNode.parentNode === section) {
                        section.insertBefore(link, beforeNode);
                    } else {
                        section.appendChild(link);
                    }
                }

                return link;
            };

            const facebookLink = socialProfiles.facebook
                ? ensureSocialLink('Facebook', '<i class="fab fa-facebook-f"></i>')
                : section.querySelector('a[aria-label="Facebook"]');
            const instagramLink = socialProfiles.instagram
                ? ensureSocialLink('Instagram', '<i class="fab fa-instagram"></i>')
                : section.querySelector('a[aria-label="Instagram"]');
            const viberLink = socialProfiles.viber
                ? ensureSocialLink('Viber', '<i class="fab fa-viber"></i>')
                : section.querySelector('a[aria-label="Viber"]');
            const youtubeLink = socialProfiles.youtube
                ? ensureSocialLink('YouTube', '<i class="fab fa-youtube"></i>', viberLink)
                : section.querySelector('a[aria-label="YouTube"]');

            if (facebookLink && socialProfiles.facebook) {
                facebookLink.href = socialProfiles.facebook;
                facebookLink.target = '_blank';
                facebookLink.rel = 'noopener noreferrer';
            }

            if (instagramLink && socialProfiles.instagram) {
                instagramLink.href = socialProfiles.instagram;
                instagramLink.target = '_blank';
                instagramLink.rel = 'noopener noreferrer';
            }

            if (viberLink && socialProfiles.viber) {
                viberLink.href = socialProfiles.viber;
                viberLink.removeAttribute('target');
                viberLink.removeAttribute('rel');
            }

            if (youtubeLink && socialProfiles.youtube) {
                youtubeLink.href = socialProfiles.youtube;
                youtubeLink.target = '_blank';
                youtubeLink.rel = 'noopener noreferrer';
            }
        });
    };

    const applyHeaderSocialLinks = () => {
        applySocialLinksToSections('.header__top-social, .header__social');
    };

    const ensureHeaderTopInfo = () => {
        const topInfoSections = document.querySelectorAll('.header__top-info');

        topInfoSections.forEach((section) => {
            if (!section) return;

            section.innerHTML = `
                <a href="tel:+37379360360" class="header__top-link"><i class="fas fa-phone"></i> +373 79 360 360</a>
                <a href="mailto:moldacoperis@gmail.com" class="header__top-link"><i class="fas fa-envelope"></i> moldacoperis@gmail.com</a>
                <span class="header__top-link"><i class="fas fa-map-marker-alt"></i> ${headerTopInfoContent.address}</span>
            `;
        });
    };

    const ensureHeaderOfferButtons = () => {
        let headerButtons = Array.from(document.querySelectorAll('.header__cta.js-open-modal'));

        if (!headerButtons.length && headerNavContainer) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'btn btn--primary header__cta js-open-modal';

            if (burgerBtn && burgerBtn.parentNode === headerNavContainer) {
                headerNavContainer.insertBefore(button, burgerBtn);
            } else {
                headerNavContainer.appendChild(button);
            }

            headerButtons = [button];
        }

        return headerButtons;
    };

    const normalizeHeaderActionLabels = () => {
        ensureHeaderOfferButtons().forEach((button) => {
            button.textContent = uiText.headerOfferLabel;
            button.setAttribute('aria-label', uiText.headerOfferLabel);
            button.setAttribute('title', uiText.headerOfferLabel);
        });

        if (burgerBtn) {
            burgerBtn.setAttribute('aria-label', uiText.headerBurgerLabel);
        }
    };

    const applyFooterSocialLinks = () => {
        applySocialLinksToSections('.footer__social');
    };

    const applyFooterLogoVariant = () => {
        const footerLogos = document.querySelectorAll('.footer__logo');

        footerLogos.forEach(logo => {
            const currentSrc = logo.getAttribute('src');

            if (!currentSrc || !currentSrc.includes('images/')) {
                return;
            }

            const assetDirectory = currentSrc.slice(0, currentSrc.lastIndexOf('/') + 1);
            logo.setAttribute('src', `${assetDirectory}logo-light.png`);
        });
    };

    const ensureProjectPageCtaBanner = () => {
        if (!isProjectDetailPage) return;

        const ctaBanner = document.querySelector('.cta-banner');
        if (!ctaBanner) return;

        let container = ctaBanner.querySelector('.container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'container';
            ctaBanner.appendChild(container);
        }

        container.innerHTML = `
            <div class="cta-banner__content">
                <h2 class="cta-banner__title">${projectPageCtaContent.title}</h2>
                <p class="cta-banner__desc">${projectPageCtaContent.desc}</p>
                <div class="cta-banner__actions">
                    <button type="button" class="btn btn--white btn--lg js-open-modal">${projectPageCtaContent.primaryLabel}</button>
                    <a href="${projectPageCtaContent.secondaryHref}" class="btn btn--outline-white btn--lg">${projectPageCtaContent.secondaryLabel}</a>
                </div>
            </div>
        `;
    };

    const initSiteShell = () => {
        buildProductsMenu();
        buildLanguageSwitcher();
        ensureHeaderTopInfo();
        applyHeaderSocialLinks();
        normalizeHeaderActionLabels();
        applyHeaderBackgroundImages();
        ensureProjectPageCtaBanner();
    };

    initSiteShell();

    const backToTop = ensureBackToTopElement();
    let lastScrollY = window.scrollY;
    let scrollUiTicking = false;

    const updateScrollUi = () => {
        scrollUiTicking = false;
        const currentScrollY = window.scrollY;

        if (header) {
            const menuOpen = navMenu && navMenu.classList.contains('open');

            if (currentScrollY > 50) {
                header.classList.add('header--scrolled');
            } else {
                header.classList.remove('header--scrolled');
            }

            if (menuOpen || currentScrollY <= 120) {
                header.classList.remove('header--hidden');
            } else if (currentScrollY > lastScrollY) {
                header.classList.add('header--hidden');
            } else {
                header.classList.remove('header--hidden');
            }
        }

        if (backToTop) {
            backToTop.classList.toggle('visible', currentScrollY > 400);
        }

        lastScrollY = currentScrollY;
    };

    const scheduleScrollUiUpdate = () => {
        if (scrollUiTicking) return;
        scrollUiTicking = true;
        requestAnimationFrame(updateScrollUi);
    };

    const initScrollUiFeature = () => {
        window.addEventListener('scroll', scheduleScrollUiUpdate, { passive: true });
        updateScrollUi();
    };

    initScrollUiFeature();

    // ---------- MOBILE MENU ----------
    const initMobileMenuFeature = () => {
        if (!burgerBtn || !navMenu) return;

        const menuBackdrop = document.createElement('button');
        menuBackdrop.type = 'button';
        menuBackdrop.className = 'header__menu-backdrop';
        menuBackdrop.setAttribute('aria-label', isRussianPage ? 'Закрыть меню' : 'Inchide meniul');
        document.body.appendChild(menuBackdrop);

        const closeMobileMenu = () => {
            burgerBtn.classList.remove('active');
            burgerBtn.setAttribute('aria-expanded', 'false');
            navMenu.classList.remove('open');
            document.body.classList.remove('menu-open');
            menuBackdrop.classList.remove('visible');
            navMenu.querySelectorAll('.header__dropdown.open').forEach((node) => node.classList.remove('open'));
        };

        const openMobileMenu = () => {
            burgerBtn.classList.add('active');
            burgerBtn.setAttribute('aria-expanded', 'true');
            navMenu.classList.add('open');
            document.body.classList.add('menu-open');
            menuBackdrop.classList.add('visible');
            header.classList.remove('header--hidden');
        };

        burgerBtn.setAttribute('aria-expanded', 'false');

        burgerBtn.addEventListener('click', () => {
            if (navMenu.classList.contains('open')) {
                closeMobileMenu();
                return;
            }

            openMobileMenu();
        });

        menuBackdrop.addEventListener('click', closeMobileMenu);

        // Mobile dropdown toggle
        const dropdown = navMenu.querySelector('.header__dropdown');
        if (dropdown) {
            const dropdownLink = dropdown.querySelector('.header__menu-link');
            dropdownLink.addEventListener('click', (e) => {
                e.preventDefault();
                if (window.innerWidth <= 768) {
                    dropdown.classList.toggle('open');
                }
            });
        }

        navMenu.querySelectorAll('.header__menu-link').forEach(link => {
            link.addEventListener('click', () => {
                // Don't close menu if it's the dropdown toggle on mobile
                if (window.innerWidth <= 768 && link.closest('.header__dropdown')) return;
                closeMobileMenu();
            });
        });

        // Close mobile menu when clicking dropdown sub-links
        navMenu.querySelectorAll('.header__dropdown-menu a').forEach(link => {
            link.addEventListener('click', () => {
                closeMobileMenu();
            });
        });

        document.addEventListener('click', (event) => {
            if (window.innerWidth > 768) return;
            if (!navMenu.classList.contains('open')) return;
            const clickedInsideMenu = navMenu.contains(event.target);
            const clickedBurger = burgerBtn.contains(event.target);
            const clickedBackdrop = menuBackdrop.contains(event.target);
            if (!clickedInsideMenu && !clickedBurger && !clickedBackdrop) {
                closeMobileMenu();
            }
        });

        window.addEventListener('resize', () => {
            if (window.innerWidth > 768 && navMenu.classList.contains('open')) {
                closeMobileMenu();
            }
        });

        window.addEventListener('pageshow', (event) => {
            if (!event.persisted) return;

            closeMobileMenu();
            document.body.style.overflow = '';

            document.querySelectorAll('.modal-overlay.active').forEach((overlay) => {
                overlay.classList.remove('active');
            });
        });
    };

    initMobileMenuFeature();

    // ---------- ANIMATED COUNTERS ----------
    const counters = Array.from(document.querySelectorAll('[data-count]'));
    const animatedCounters = new WeakSet();

    const startCounterAnimation = (counter) => {
        if (!counter || animatedCounters.has(counter)) return;

        animatedCounters.add(counter);
        const target = parseInt(counter.getAttribute('data-count'), 10);
        const suffix = counter.getAttribute('data-suffix') || '';
        const duration = 2000;
        const step = target / (duration / 16);
        let current = 0;

        const updateCounter = () => {
            current += step;
            if (current < target) {
                counter.textContent = `${Math.floor(current)}${suffix}`;
                requestAnimationFrame(updateCounter);
            } else {
                counter.textContent = `${target}${suffix}`;
            }
        };

        updateCounter();
    };

    const initCounterFeature = () => {
        if (!counters.length) return;

        if ('IntersectionObserver' in window) {
            const counterObserver = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;
                    startCounterAnimation(entry.target);
                    counterObserver.unobserve(entry.target);
                });
            }, {
                threshold: 0.2,
                rootMargin: '0px 0px 80px 0px'
            });

            counters.forEach((counter) => counterObserver.observe(counter));
        } else {
            const animateVisibleCounters = () => {
                counters.forEach((counter) => {
                    if (animatedCounters.has(counter)) return;
                    const rect = counter.getBoundingClientRect();
                    if (rect.top < window.innerHeight && rect.bottom > 0) {
                        startCounterAnimation(counter);
                    }
                });

                if (counters.every((counter) => animatedCounters.has(counter))) {
                    window.removeEventListener('scroll', animateVisibleCounters);
                }
            };

            window.addEventListener('scroll', animateVisibleCounters, { passive: true });
            animateVisibleCounters();
        }
    };

    initCounterFeature();

    // ---------- BACK TO TOP ----------
    const initBackToTopFeature = () => {
        if (!backToTop) return;

        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    };

    initBackToTopFeature();

    // ---------- SMOOTH SCROLL FOR ANCHOR LINKS ----------
    document.addEventListener('click', (e) => {
        const anchor = e.target.closest('a[href^="#"]');
        if (!anchor) return;

        const targetId = anchor.getAttribute('href');
        if (!targetId || targetId === '#') return;

        const target = document.querySelector(targetId);
        if (!target) return;

        e.preventDefault();
        const isHeaderMenuInteraction = Boolean(anchor.closest('.header__menu, .header__nav, .header__dropdown-menu'));
        target.scrollIntoView({ behavior: isHeaderMenuInteraction ? 'auto' : 'smooth', block: 'start' });
    });

    const scheduleIdleInit = (initFn, timeout = 1200) => {
        let initialized = false;
        let idleId = null;
        let timeoutId = null;

        const initOnce = () => {
            if (initialized) return;
            initialized = true;
            if (idleId !== null && 'cancelIdleCallback' in window) {
                window.cancelIdleCallback(idleId);
            }
            if (timeoutId !== null) {
                window.clearTimeout(timeoutId);
            }
            initFn();
        };

        if ('requestIdleCallback' in window) {
            idleId = window.requestIdleCallback(initOnce, { timeout });
        }

        timeoutId = window.setTimeout(initOnce, timeout);
        return initOnce;
    };

    const scheduleViewportOrIdleInit = (target, initFn, options = {}) => {
        if (!target) {
            return scheduleIdleInit(initFn, options.timeout || 1400);
        }

        let initialized = false;
        let observer = null;
        let idleId = null;
        let timeoutId = null;

        const initOnce = () => {
            if (initialized) return;
            initialized = true;
            if (observer) observer.disconnect();
            if (idleId !== null && 'cancelIdleCallback' in window) {
                window.cancelIdleCallback(idleId);
            }
            if (timeoutId !== null) {
                window.clearTimeout(timeoutId);
            }
            initFn();
        };

        if ('IntersectionObserver' in window) {
            observer = new IntersectionObserver((entries) => {
                if (entries.some((entry) => entry.isIntersecting)) {
                    initOnce();
                }
            }, {
                rootMargin: options.rootMargin || '0px 0px 320px 0px',
                threshold: options.threshold || 0.01
            });
            observer.observe(target);
        }

        if ('requestIdleCallback' in window) {
            idleId = window.requestIdleCallback(initOnce, { timeout: options.timeout || 1800 });
        }

        timeoutId = window.setTimeout(initOnce, options.timeout || 1800);
        return initOnce;
    };

    let footerEnhancementsInitialized = false;
    const initFooterEnhancements = () => {
        if (footerEnhancementsInitialized) return;
        footerEnhancementsInitialized = true;
        applyUnifiedFooterLayout();
        ensurePrivacyPolicyFooterLink();
        applyFooterSocialLinks();
        applyFooterLogoVariant();
    };

    const footerElement = document.querySelector('footer.footer');
    if (footerElement) {
        scheduleViewportOrIdleInit(footerElement, initFooterEnhancements, {
            timeout: 1800,
            rootMargin: '0px 0px 420px 0px'
        });
    }

    const initProductPageEnhancements = () => {
        if (!isProductPage) return;

        const setupTechnicalDetailsToggles = () => {
            const labels = isRussianPage
                ? { open: 'Узнать детали', close: 'Скрыть детали' }
                : { open: 'Află detaliile', close: 'Ascunde detaliile' };
            const technicalSelectors = [
                'table.metal-tile-models__table',
                'table.corrugated-types__table',
                '.modular-models__tech',
                '.drainage-material-card__list',
                '.product-features__meta'
            ];
            const technicalGroupSelector = [
                '.metal-tile-models__grid',
                '.corrugated-types__grid',
                '.modular-models__tech-grid',
                '.drainage-materials__grid',
                '.product-features__meta'
            ].join(',');

            const closeSiblingTechnicalDetails = (details) => {
                const group = details.closest(technicalGroupSelector);
                if (!group) return;
                group.querySelectorAll('.technical-details[open]').forEach((siblingDetails) => {
                    if (siblingDetails !== details) {
                        siblingDetails.open = false;
                    }
                });
            };

            document.querySelectorAll(technicalSelectors.join(',')).forEach((element, index) => {
                if (
                    element.closest('.technical-details') ||
                    element.closest('[data-technical-toggle-skip="true"]') ||
                    element.dataset.technicalToggleReady === '1'
                ) return;

                const details = document.createElement('details');
                const summary = document.createElement('summary');
                const label = document.createElement('span');
                const icon = document.createElement('i');
                const isWideBlock = element.matches('.product-features__meta');

                details.className = `technical-details${isWideBlock ? ' technical-details--wide' : ''}`;
                details.dataset.openLabel = labels.open;
                details.dataset.closeLabel = labels.close;
                summary.className = 'technical-details__summary';
                label.className = 'technical-details__label';
                label.textContent = labels.open;
                icon.className = 'fas fa-chevron-down';
                icon.setAttribute('aria-hidden', 'true');
                summary.append(label, icon);

                const contentId = `technical-details-${index + 1}`;
                element.id = element.id || contentId;
                summary.setAttribute('aria-controls', element.id);

                element.dataset.technicalToggleReady = '1';
                element.parentNode.insertBefore(details, element);
                details.append(summary, element);
                details.addEventListener('toggle', () => {
                    if (details.open) closeSiblingTechnicalDetails(details);
                    label.textContent = details.open ? labels.close : labels.open;
                });
            });
        };

        setupTechnicalDetailsToggles();
        buildProductLeadCardSection();

        const relatedProductsAnchor = document.querySelector('.product-projects, .cta-banner, footer.footer, main > section:last-of-type');
        scheduleViewportOrIdleInit(relatedProductsAnchor, buildRelatedProductsSection, {
            timeout: 1700,
            rootMargin: '0px 0px 420px 0px'
        });
    };

    initProductPageEnhancements();

    // ---------- GOOGLE REVIEWS READY BLOCK ----------
    const googleReviewsList = document.getElementById('googleReviewsList');
    const googleReviewsTemplate = document.getElementById('googleReviewCardTemplate');
    const googleReviewsRating = document.getElementById('googleReviewsRating');
    const googleReviewsCount = document.getElementById('googleReviewsCount');
    const googleReviewsStars = document.getElementById('googleReviewsStars');
    const googleReviewsLink = document.getElementById('googleReviewsLink');

    const getInitials = (name) => {
        return name
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map(part => part.charAt(0).toUpperCase())
            .join('') || 'MR';
    };

    const createStarsMarkup = (rating) => {
        const normalizedRating = Math.max(0, Math.min(5, Number(rating) || 0));
        const fullStars = Math.floor(normalizedRating);
        const hasHalfStar = normalizedRating - fullStars >= 0.5 && fullStars < 5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        return [
            '<i class="fas fa-star"></i>'.repeat(fullStars),
            hasHalfStar ? '<i class="fas fa-star-half-stroke"></i>' : '',
            '<i class="far fa-star"></i>'.repeat(emptyStars)
        ].join('');
    };

    const buildReviewSourceMarkup = (source) => {
        const normalized = String(source || '').toLowerCase();
        if (normalized.includes('facebook')) {
            return '<span class="testimonials__summary-platform"><i class="fab fa-facebook-f" aria-hidden="true"></i><span>Facebook Reviews</span></span>';
        }
        return '<span class="testimonials__summary-platform"><i class="fab fa-google" aria-hidden="true"></i><span>Google Reviews</span></span>';
    };

    const mixedReviewsLabelMarkup = '<span class="testimonials__summary-platform"><i class="fab fa-google" aria-hidden="true"></i><span>Google Reviews</span></span><span class="testimonials__summary-separator">+</span><span class="testimonials__summary-platform"><i class="fab fa-facebook-f" aria-hidden="true"></i><span>Facebook Reviews</span></span>';

    let googleReviewsInitialized = false;
    const initGoogleReviewsSection = () => {
        if (googleReviewsInitialized || !googleReviewsList || !googleReviewsTemplate) return;
        googleReviewsInitialized = true;
        const fixedReviewsProfileUrl = 'https://www.google.com/search?sca_esv=1a51245140343e35&rlz=1C1GCEU_enRO1154RO1154&sxsrf=ANbL-n6mYH-gtgyDrkTuosjw4mdW0Wleug:1775570916090&si=AL3DRZEsmMGCryMMFSHJ3StBhOdZ2-6yYkXd_doETEE1OR-qOURNb0ZM7ATSkaaBovhnm726F4CwzxjXLH8IYlPOBqDYiE9PggU4BZuq1184fUKQVfWII60D1lKJCDwXGKjOa_M47pY9&q=Moldacoperis+Reviews&sa=X&ved=2ahUKEwiun-iN9duTAxXGxwIHHQ09DfYQ0bkNegQIOhAH&biw=1536&bih=826&dpr=1.25';
        const fixedRating = 4.9;
        const fallbackReviewsRo = [
            {
                authorName: 'Valentina Antoni',
                rating: 5,
                text: 'Sunt cei mai buni. O echipa de profesionisti 100%. Recomand cu incredere.',
                relativeTimeDescription: '28 martie, 15:21',
                source: 'Facebook Reviews'
            },
            {
                authorName: 'Elena Budu',
                rating: 5,
                text: 'Recomand. Foarte bravo si receptivi, calitativ.',
                relativeTimeDescription: '3 aprilie 2025',
                source: 'Facebook Reviews'
            },
            {
                authorName: 'Anna Hyncu',
                rating: 5,
                text: 'Companie excelenta! Cei mai buni profesionisti in domeniu, sunt foarte multumita.',
                relativeTimeDescription: '5 octombrie 2024',
                source: 'Facebook Reviews'
            },
            {
                authorName: 'Marina Pascal',
                rating: 5,
                text: 'Recomand cu toata increderea echipa Moldacoperis daca aveti nevoie de un acoperis nou. Incepand de la oferta de pret si pana la renovarea integrala, la cheie, totul a fost executat profesionist.',
                relativeTimeDescription: 'Acum o saptamana',
                source: 'Google Reviews'
            }
        ];

        const fallbackReviewsRu = [
            {
                authorName: 'Irina Rusnak',
                rating: 5,
                text: 'Спасибо команде Moldacoperis за консультацию и аккуратную работу. Все выполнено быстро и в срок. Рекомендую как профессионалов в Молдове.',
                relativeTimeDescription: '7 месяцев назад',
                source: 'Google Reviews'
            },
            {
                authorName: 'Serj S',
                rating: 5,
                text: 'Благодарю за грамотный расчет материалов, своевременную доставку и отличное качество. Команда подробно проконсультировала по всем вопросам.',
                relativeTimeDescription: '3 года назад',
                source: 'Google Reviews'
            },
            {
                authorName: 'J K A',
                rating: 5,
                text: 'Проконсультировали по максимуму, все объяснили и сделали отлично.',
                relativeTimeDescription: '7 месяцев назад',
                source: 'Google Reviews'
            }
        ];

        const fallbackReviews = isRussianPage ? fallbackReviewsRu : fallbackReviewsRo;

        const sourceData = window.googleReviewsData || {};
        const reviews = Array.isArray(sourceData.reviews) && sourceData.reviews.length
            ? sourceData.reviews
            : fallbackReviews;
        const rating = fixedRating;

        if (googleReviewsRating) {
            googleReviewsRating.textContent = rating.toFixed(1);
        }

        if (googleReviewsCount) {
            googleReviewsCount.innerHTML = mixedReviewsLabelMarkup;
        }

        if (googleReviewsStars) {
            googleReviewsStars.innerHTML = createStarsMarkup(rating);
            googleReviewsStars.setAttribute('aria-label', uiText.googleRatingLabel(rating));
        }

        if (googleReviewsLink) {
            googleReviewsLink.href = fixedReviewsProfileUrl;
            googleReviewsLink.removeAttribute('aria-disabled');
        }

        googleReviewsList.innerHTML = '';
        googleReviewsList.classList.remove('testimonials__grid--ticker');

        const createReviewCard = (review) => {
            const card = googleReviewsTemplate.content.cloneNode(true);
            const authorName = review.authorName || review.author_name || 'Client verificat';
            const reviewText = review.text || review.comment || 'Recenzie disponibila in curand.';
            const reviewRating = Number(review.rating) || rating;
            const reviewSource = review.source || 'Google Reviews';
            const reviewMetaNode = card.querySelector('[data-review-meta]');
            const reviewSourceNode = card.querySelector('[data-review-source]');

            card.querySelector('[data-review-stars]').innerHTML = createStarsMarkup(reviewRating);
            card.querySelector('[data-review-text]').textContent = `"${reviewText}"`;
            card.querySelector('[data-review-avatar]').textContent = getInitials(authorName);
            card.querySelector('[data-review-author]').textContent = authorName;
            if (reviewMetaNode) {
                reviewMetaNode.textContent = '';
                reviewMetaNode.style.display = 'none';
            }
            if (reviewSourceNode) {
                reviewSourceNode.innerHTML = buildReviewSourceMarkup(reviewSource);
            }

            return card;
        };

        if (!reviews.length) {
            googleReviewsList.innerHTML = `<div class="testimonials__empty">${uiText.reviewsEmpty}</div>`;
        } else {
            const prefersReducedMotionReviews = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            const visibleReviews = reviews.slice(0, 6);

            if (!prefersReducedMotionReviews && visibleReviews.length > 1) {
                googleReviewsList.classList.add('testimonials__grid--ticker');
                const tickerTrack = document.createElement('div');
                tickerTrack.className = 'testimonials__ticker-track';
                const duplicatedReviews = [...visibleReviews, ...visibleReviews];

                duplicatedReviews.forEach((review, index) => {
                    const card = createReviewCard(review);
                    if (index >= visibleReviews.length) {
                        card.querySelector('.testimonial-card')?.setAttribute('aria-hidden', 'true');
                    }
                    tickerTrack.appendChild(card);
                });

                googleReviewsList.appendChild(tickerTrack);
            } else {
                visibleReviews.forEach((review) => {
                    googleReviewsList.appendChild(createReviewCard(review));
                });
            }
        }
    };

    const hasGoogleReviewsSection = Boolean(googleReviewsList && googleReviewsTemplate);
    const initReviewsFeature = () => {
        if (!hasGoogleReviewsSection) return;

        if (isHomepage) {
            const reviewsAnchor = googleReviewsList.closest('.testimonials, section') || googleReviewsList;
            scheduleViewportOrIdleInit(reviewsAnchor, initGoogleReviewsSection, { timeout: 1800, rootMargin: '0px 0px 360px 0px' });
        } else {
            initGoogleReviewsSection();
        }
    };

    initReviewsFeature();

    // ---------- PAGE ENTER EFFECTS ----------
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const applyPageEnterEffects = () => {
        const body = document.body;
        if (!body) return;

        if (prefersReducedMotion) {
            body.classList.add('page-enter-active');
            return;
        }

        // Homepage uses scroll-based reveal on cards; combining it with section page-enter
        // can make cards look clipped at section edges during appearance.
        if (isHomepage) {
            body.classList.add('page-enter-active');
            return;
        }

        body.classList.add('page-enter');

        const enterTargets = [
            '.hero',
            '.page-header',
            '.cfg',
            'main > section',
            '.portfolio-section',
            '.portfolio-stats',
            '.product-intro',
            '.product-advantages',
            '.product-pricing',
            '.product-projects',
            '.project-detail',
            '.project-facts',
            '.project-story',
            '.project-related',
            '.section',
            '.cta-banner',
            '.calc-hero'
        ];

        const uniqueTargets = new Set();
        document.querySelectorAll(enterTargets.join(', ')).forEach(section => {
            if (!section || uniqueTargets.has(section) || section.closest('.modal, .modal-overlay')) return;
            uniqueTargets.add(section);
        });

        Array.from(uniqueTargets).forEach((section, index) => {
            section.setAttribute('data-page-enter', '');
            const delay = Math.min(index * 0.045, 0.42);
            section.style.setProperty('--page-enter-delay', `${delay}s`);
        });

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                body.classList.add('page-enter-active');
            });
        });
    };

    const initPageEnterFeature = () => {
        applyPageEnterEffects();

        window.addEventListener('pageshow', (event) => {
            if (!event.persisted) return;
            document.body.classList.add('page-enter-active');
        });
    };

    initPageEnterFeature();

    // ---------- SCROLL REVEAL ANIMATIONS ----------
    let revealAnimationsInitialized = false;
    const initRevealAnimations = () => {
        if (revealAnimationsInitialized) return;
        revealAnimationsInitialized = true;

        const observerOptions = {
            threshold: 0.01,
            rootMargin: '0px 0px 120px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        const revealTargets = new Set();
        const addRevealTarget = (element, variantClass) => {
            if (!element || revealTargets.has(element)) return;
            element.classList.add('reveal');
            if (variantClass) element.classList.add(variantClass);
            revealTargets.add(element);
            observer.observe(element);
        };

        document.querySelectorAll('.reveal, .service-card, .testimonial-card, .process__step, .why-us__feature, .works__item').forEach(el => {
            addRevealTarget(el);
        });

        const headingRevealSelector = '.page-header__title, .section-header__title, .calc-hero__title';

        const wrapHeadingWords = (rootNode, state) => {
            if (rootNode.nodeType === Node.TEXT_NODE) {
                const fragment = document.createDocumentFragment();
                const parts = rootNode.textContent.split(/(\s+)/);

                parts.forEach(part => {
                    if (!part) return;
                    if (/^\s+$/.test(part)) {
                        fragment.appendChild(document.createTextNode(part));
                        return;
                    }

                    const word = document.createElement('span');
                    word.className = 'heading-word';
                    word.style.setProperty('--word-delay', `${Math.min(state.wordIndex * 34, 680)}ms`);
                    word.textContent = part;
                    state.wordIndex += 1;
                    fragment.appendChild(word);
                });

                return fragment;
            }

            if (rootNode.nodeType === Node.ELEMENT_NODE) {
                const clone = rootNode.cloneNode(false);
                rootNode.childNodes.forEach(child => {
                    clone.appendChild(wrapHeadingWords(child, state));
                });
                return clone;
            }

            return document.createTextNode('');
        };

        document.querySelectorAll(headingRevealSelector).forEach(heading => {
            if (heading.dataset.headingAnimated === '1' || !heading.textContent.trim()) return;

            const state = { wordIndex: 0 };
            const fragment = document.createDocumentFragment();
            heading.childNodes.forEach(child => fragment.appendChild(wrapHeadingWords(child, state)));
            heading.innerHTML = '';
            heading.appendChild(fragment);
            heading.dataset.headingAnimated = '1';
        });

        const textRevealSelector = [
            '.page-header__title',
            '.page-header__subtitle',
            '.page-header__breadcrumb',
            '.section-header__tag',
            '.section-header__title',
            '.section-header__desc',
            '.product-intro__content > *',
            '.cta-banner__title',
            '.cta-banner__desc',
            '.cta-banner__actions',
            '.project-detail__eyebrow',
            '.project-detail__intro h2',
            '.project-detail__intro p',
            '.project-detail__chips',
            '.project-detail__panel-grid',
            '.project-facts__card h3',
            '.project-facts__card li',
            '.project-story__lead',
            '.project-story__notes div',
            '.project-story__cta-card h3',
            '.project-story__cta-card p',
            '.project-story__cta-actions',
            '.product-projects__summary',
            '.portfolio-stats__item',
            '.calc-hero__eyebrow',
            '.calc-hero__title',
            '.calc-hero__desc',
            '.calc-hero__points li',
            '.page-header__content h1',
            '.page-header__content p',
            '.section .container > p',
            '.section .container > ul > li',
            '.section .container > ol > li',
            '.section .container > div > p',
            '.section .container > div > ul > li',
            '.section .container > div > ol > li'
        ].join(', ');

        const textRevealExclusions = [
            '.hero',
            '.cfg',
            '.header',
            '.footer',
            '.modal',
            '.modal-overlay',
            '.works__item',
            '.portfolio-card',
            '.product-project-card',
            '.service-card',
            '.testimonial-card',
            '.process__step',
            '.why-us__feature',
            '.header__menu',
            '.header__top-bar',
            'form'
        ].join(', ');

        const textRevealGroups = new WeakMap();

        document.querySelectorAll(textRevealSelector).forEach(element => {
            if (element.closest(textRevealExclusions) || element.classList.contains('reveal')) return;

            const group = element.closest('.page-header__content, .section-header, .product-intro__content, .cta-banner__content, .project-detail__intro, .project-detail__panel, .project-facts__card, .project-story__layout, .product-projects__summary, .portfolio-stats__grid, .calc-hero__content, .section, main') || element.parentElement;
            const order = textRevealGroups.get(group) || 0;
            const delay = Math.min(order * 0.08, 0.4);

            element.style.setProperty('--reveal-delay', `${delay}s`);
            textRevealGroups.set(group, order + 1);

            if (element.matches(headingRevealSelector)) {
                addRevealTarget(element, 'reveal--heading');
            } else {
                addRevealTarget(element, 'reveal--text');
            }
        });
    };

    const initRevealFeature = () => {
        if (isHomepage) {
            scheduleIdleInit(initRevealAnimations, 900);
            return;
        }

        initRevealAnimations();
    };

    initRevealFeature();

    // ---------- WORKS FILTER ----------
    const filterBtns = document.querySelectorAll('.works__filter');
    const projectRenderApi = window.MA_PROJECTS_RENDER || null;
    const hasHomepageRenderer = projectRenderApi && typeof projectRenderApi.renderHomepageWorksByFilter === 'function';
    const hasPortfolioRenderer = projectRenderApi && typeof projectRenderApi.renderPortfolioGridByFilter === 'function';
    const initHomepageWorksFilter = () => {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('works__filter--active'));
                btn.classList.add('works__filter--active');

                const filter = btn.getAttribute('data-filter') || 'all';

                if (hasHomepageRenderer) {
                    projectRenderApi.renderHomepageWorksByFilter(filter);
                    return;
                }

                const worksItems = document.querySelectorAll('.works__item');

                worksItems.forEach(item => {
                    if (filter === 'all' || item.getAttribute('data-category') === filter) {
                        item.classList.remove('hidden');
                    } else {
                        item.classList.add('hidden');
                    }
                });
            });
        });
    };

    const hasHomepageWorksFilters = Boolean(isHomepage && filterBtns.length);
    if (hasHomepageWorksFilters) {
        initHomepageWorksFilter();
    }

    // ---------- PORTFOLIO FILTER ----------
    const portfolioFilterBtns = document.querySelectorAll('.portfolio-filters__btn');
    const initPortfolioFilter = () => {
        portfolioFilterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                portfolioFilterBtns.forEach(b => b.classList.remove('portfolio-filters__btn--active'));
                btn.classList.add('portfolio-filters__btn--active');

                const filter = btn.getAttribute('data-filter') || 'all';

                if (hasPortfolioRenderer) {
                    projectRenderApi.renderPortfolioGridByFilter(filter);
                    return;
                }

                const portfolioCards = document.querySelectorAll('.portfolio-card');

                portfolioCards.forEach(card => {
                    if (filter === 'all' || card.getAttribute('data-category') === filter) {
                        card.classList.remove('hidden');
                    } else {
                        card.classList.add('hidden');
                    }
                });
            });
        });
    };

    const hasPortfolioFilters = Boolean(isPortfolioIndexPage && portfolioFilterBtns.length);
    if (hasPortfolioFilters) {
        initPortfolioFilter();
    }

    // ---------- MODAL OFERTA ----------
    const modal       = document.getElementById('ofertaModal');
    const modalClose  = document.getElementById('modalClose');
    const modalForm   = document.getElementById('ofertaForm');
    const modalSummary = document.getElementById('modalSummary');
    const modalSuccess = document.getElementById('modalSuccess');
    const modalSubmitButton = modalForm ? modalForm.querySelector('button[type="submit"]') : null;
    const modalSuccessIcon = modalSuccess ? modalSuccess.querySelector('i') : null;
    const modalSuccessTitle = modalSuccess ? modalSuccess.querySelector('h4') : null;
    const modalSuccessDesc = modalSuccess ? modalSuccess.querySelector('p') : null;
    const defaultSubmitLabel = modalSubmitButton ? modalSubmitButton.textContent : '';
    const hasOfferModal = Boolean(modal && modalForm && modalSummary && modalSuccess);

    function openModal(options) {
        if (!hasOfferModal) return;
        var modalOptions = options || {};
        var shouldShowEstimate = Boolean(modalOptions.showEstimate);
        var state = shouldShowEstimate && window.__cfgState ? window.__cfgState() : null;
        var fmt = function (n) { return n.toLocaleString(isRussianPage ? 'ru-RU' : 'ro-RO'); };

        if (state && state.name && state.area > 0) {
            if (Array.isArray(state.offers) && state.offers.length && state.lowestTotal > 0) {
                var estimateText = state.lowestTotal === state.highestTotal
                    ? fmt(state.lowestTotal) + ' ' + uiText.currency
                    : fmt(state.lowestTotal) + ' - ' + fmt(state.highestTotal) + ' ' + uiText.currency;

                modalSummary.innerHTML =
                    '<span>' + uiText.modalConfig + ': <strong>' + (state.houseLabel || 'Casa simpla - 2 pante') + '</strong></span>' +
                    '<span>' + uiText.modalMaterial + ': <strong>' + state.name + '</strong></span>' +
                    '<span>' + uiText.modalQuality + ': <strong>' + (state.qualityLabel || 'VIP / Premium / Standard') + '</strong></span>' +
                    '<span>' + uiText.modalArea + ': <strong>' + fmt(state.area) + ' ' + uiText.areaUnit + '</strong></span>' +
                    '<span>' + uiText.modalEstimate + ': <strong>' + estimateText + '</strong></span>';
            } else {
                var materialPrice = Math.round(state.price * (state.quality || 1));
                var total = state.area * (materialPrice + state.manopera);
                modalSummary.innerHTML =
                    '<span>' + uiText.modalConfig + ': <strong>' + (state.houseLabel || '2 pante') + '</strong></span>' +
                    '<span>' + uiText.modalMaterial + ': <strong>' + state.name + '</strong></span>' +
                    '<span>' + uiText.modalQuality + ': <strong>' + (state.qualityLabel || 'Standard') + '</strong></span>' +
                    '<span>' + uiText.modalArea + ': <strong>' + fmt(state.area) + ' ' + uiText.areaUnit + '</strong></span>' +
                    '<span>' + uiText.modalEstimate + ': <strong>' + fmt(total) + ' ' + uiText.currency + '</strong></span>';
            }
            modalSummary.classList.add('has-data');
        } else {
            modalSummary.innerHTML = '';
            modalSummary.classList.remove('has-data');
        }

        modalForm.style.display = '';
        modalForm.reset();
        modalSuccess.classList.remove('show');
        modalSuccess.classList.remove('is-error');
        if (modalSubmitButton) {
            modalSubmitButton.disabled = false;
            modalSubmitButton.classList.remove('is-loading');
            modalSubmitButton.textContent = defaultSubmitLabel;
        }
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function showModalFeedback(type, title, message) {
        if (!modalSuccess || !modalSuccessTitle || !modalSuccessDesc) return;
        modalSuccessTitle.textContent = title;
        modalSuccessDesc.textContent = message;
        modalSuccess.classList.toggle('is-error', type === 'error');
        if (modalSuccessIcon) {
            modalSuccessIcon.className = type === 'error' ? 'fas fa-exclamation-circle' : 'fas fa-check-circle';
        }
        modalSuccess.classList.add('show');
    }

    function escapeRegExp(value) {
        return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function buildEstimateSummaryList() {
        if (!modalSummary || !modalSummary.classList.contains('has-data')) return '';

        const wantedLabels = [uiText.modalConfig, uiText.modalMaterial, uiText.modalQuality, uiText.modalArea, uiText.modalEstimate];
        const lines = [];
        const rows = modalSummary.querySelectorAll('span');

        rows.forEach((row) => {
            const strong = row.querySelector('strong');
            if (!strong) return;

            const fullText = (row.textContent || '').replace(/\s+/g, ' ').trim();
            const value = (strong.textContent || '').replace(/\s+/g, ' ').trim();
            if (!fullText || !value) return;

            const label = fullText.slice(0, Math.max(0, fullText.length - value.length)).replace(/[:\s]+$/g, '').trim();
            if (!wantedLabels.includes(label)) return;

            lines.push(`${label}: ${value}`);
        });

        if (lines.length) {
            return lines.join('\n');
        }

        let rawSummary = (modalSummary.textContent || '').replace(/\s+/g, ' ').trim();
        wantedLabels.forEach((label) => {
            const labelPattern = new RegExp(`${escapeRegExp(label)}\\s*:`, 'g');
            rawSummary = rawSummary.replace(labelPattern, `\n${label}:`);
        });
        return rawSummary.replace(/^\n+/, '').trim();
    }

    async function submitOfferRequest(payload) {
        const serializedPayload = JSON.stringify(payload);
        const fallbackFormPayload = new URLSearchParams({
            source: String(payload.source || ''),
            language: String(payload.language || ''),
            pageUrl: String(payload.pageUrl || ''),
            pagePath: String(payload.pagePath || ''),
            submittedAt: String(payload.submittedAt || ''),
            leadName: String((payload.lead && payload.lead.name) || ''),
            leadPhone: String((payload.lead && payload.lead.phone) || ''),
            estimateSummary: String(payload.estimateSummary || ''),
            payloadJson: serializedPayload
        }).toString();
        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => controller.abort(), 10000);
        const jsonHeaders = {
            'Content-Type': 'application/json'
        };

        try {
            const response = await fetch(offerWebhookEndpoint, {
                method: 'POST',
                headers: jsonHeaders,
                body: serializedPayload,
                signal: controller.signal
            });

            if (!response.ok) {
                throw new Error(`Webhook returned ${response.status}`);
            }
            return;
        } catch (error) {
            if (error && error.name === 'AbortError') {
                throw error;
            }

            if (isSameOriginEndpoint(offerWebhookEndpoint)) {
                throw error;
            }

            // Some external webhook providers block browser CORS checks.
            // Retry in no-cors mode so the request can still be delivered.
            const fallbackController = new AbortController();
            const fallbackTimeoutId = window.setTimeout(() => fallbackController.abort(), 10000);
            try {
                await fetch(offerWebhookEndpoint, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
                    },
                    body: fallbackFormPayload,
                    signal: fallbackController.signal
                });
            } catch (fallbackError) {
                throw fallbackError;
            } finally {
                window.clearTimeout(fallbackTimeoutId);
            }
        } finally {
            window.clearTimeout(timeoutId);
        }
    }

    function closeModal() {
        if (!modal) return;
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    const initOfferModal = () => {
        document.addEventListener('click', function (e) {
            const btn = e.target.closest('.js-open-modal');
            if (!btn) return;

            if (btn.tagName === 'A') e.preventDefault();

            var isConfigTrigger = Boolean(
                btn.closest('#configurator, .cfg, .calc-hero, .calc-layout, .calculator, [data-offer-mode="calculated"]')
            );

            openModal({ showEstimate: isConfigTrigger });
        });

        if (modalClose) {
            modalClose.addEventListener('click', closeModal);
        }

        modal.addEventListener('click', function (e) {
            if (e.target === modal) closeModal();
        });
    };

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && modal && modal.classList.contains('active')) closeModal();
        if (e.key === 'Escape' && navMenu && navMenu.classList.contains('open')) {
            burgerBtn.classList.remove('active');
            burgerBtn.setAttribute('aria-expanded', 'false');
            navMenu.classList.remove('open');
            document.body.classList.remove('menu-open');
            const backdrop = document.querySelector('.header__menu-backdrop');
            if (backdrop) backdrop.classList.remove('visible');
        }
    });

    if (hasOfferModal) {
        initOfferModal();
    }

    if (hasOfferModal) {
        modalForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            if (!offerWebhookEndpoint) {
                modalForm.style.display = 'none';
                showModalFeedback('error', uiText.modalErrorTitle, uiText.modalMissingWebhook);
                return;
            }

            const formData = new FormData(modalForm);
            const nume = String(formData.get('nume') || '').trim();
            const telefon = String(formData.get('telefon') || '').trim();
            const estimateSummary = buildEstimateSummaryList();

            if (modalSubmitButton) {
                modalSubmitButton.disabled = true;
                modalSubmitButton.classList.add('is-loading');
                modalSubmitButton.textContent = uiText.modalSubmitting;
            }

            try {
                await submitOfferRequest({
                    source: 'oferta-modal',
                    language: isRussianPage ? 'ru' : 'ro',
                    pageUrl: window.location.href,
                    pagePath: window.location.pathname,
                    submittedAt: new Date().toISOString(),
                    lead: {
                        name: nume,
                        phone: telefon
                    },
                    estimateSummary: estimateSummary
                });

                modalForm.style.display = 'none';
                showModalFeedback('success', uiText.modalSuccessTitle, uiText.modalSuccessMessage);
                redirectToThankYouPage('oferta-modal');
            } catch (error) {
                modalForm.style.display = 'none';
                showModalFeedback('error', uiText.modalErrorTitle, uiText.modalErrorMessage);
                console.error('Offer webhook error:', error);
            } finally {
                if (modalSubmitButton) {
                    modalSubmitButton.disabled = false;
                    modalSubmitButton.classList.remove('is-loading');
                    modalSubmitButton.textContent = defaultSubmitLabel;
                }
            }
        });
    }

    const configuratorLeadForm = document.getElementById('configuratorLeadForm');
    const configuratorLeadStatus = document.getElementById('configuratorLeadStatus');
    const configuratorLeadSubmit = configuratorLeadForm ? configuratorLeadForm.querySelector('button[type="submit"]') : null;
    const configuratorLeadDefaultSubmit = configuratorLeadSubmit ? configuratorLeadSubmit.innerHTML : '';
    const configuratorLeadModal = document.getElementById('configuratorLeadModal');
    const configuratorLeadClose = document.getElementById('configuratorLeadClose');
    const configuratorLeadOpenButtons = Array.from(document.querySelectorAll('.js-open-cfg-lead-modal'));
    let configuratorLeadAutoTimer = null;
    let configuratorLeadLastFocus = null;
    const corrugatedLeadForm = document.getElementById('corrugatedLeadForm');
    const corrugatedLeadStatus = document.getElementById('corrugatedLeadStatus');
    const corrugatedLeadSubmit = corrugatedLeadForm ? corrugatedLeadForm.querySelector('button[type="submit"]') : null;
    const corrugatedLeadDefaultSubmit = corrugatedLeadSubmit ? corrugatedLeadSubmit.textContent : '';
    const productLeadForm = document.getElementById('productLeadForm');
    const productLeadStatus = document.getElementById('productLeadStatus');
    const productLeadSubmit = productLeadForm ? productLeadForm.querySelector('button[type="submit"]') : null;
    const productLeadDefaultSubmit = productLeadSubmit ? productLeadSubmit.innerHTML : '';

    const contactForm = document.getElementById('contactForm');
    const contactSuccess = document.getElementById('contactSuccess');
    const contactSubmitButton = contactForm ? contactForm.querySelector('button[type="submit"]') : null;
    const contactDefaultSubmitLabel = contactSubmitButton ? contactSubmitButton.textContent : '';
    const hasConfiguratorLeadForm = Boolean(configuratorLeadForm && configuratorLeadSubmit);
    const hasConfiguratorLeadModal = Boolean(configuratorLeadModal);
    const isCampaignConfiguratorLead = configuratorLeadForm?.dataset.offerSource === 'configurator-campaign-landing';
    const hasCorrugatedLeadForm = Boolean(corrugatedLeadForm && corrugatedLeadSubmit);
    const hasProductLeadForm = Boolean(productLeadForm && productLeadSubmit);
    const hasContactLeadForm = Boolean(contactForm && contactSubmitButton);

    function openConfiguratorLeadModal(options) {
        if (!hasConfiguratorLeadModal) return;
        const modalOptions = options || {};
        if (configuratorLeadAutoTimer) {
            window.clearTimeout(configuratorLeadAutoTimer);
            configuratorLeadAutoTimer = null;
        }
        configuratorLeadLastFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        configuratorLeadModal.classList.add('is-active');
        configuratorLeadModal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('cfg-lead-modal-open');
        if (!modalOptions.keepStatus) {
            setConfiguratorLeadStatus('', '');
        }
        trackConfiguratorLeadEvent('configurator_lead_popup_open', {
            trigger: modalOptions.trigger || 'manual'
        });
        window.setTimeout(() => {
            const firstInput = configuratorLeadForm
                ? configuratorLeadForm.querySelector('input, select, textarea')
                : configuratorLeadModal.querySelector('input, select, textarea, button');
            if (firstInput && typeof firstInput.focus === 'function') {
                firstInput.focus();
            }
        }, 80);
    }

    function closeConfiguratorLeadModal() {
        if (!hasConfiguratorLeadModal) return;
        if (configuratorLeadAutoTimer) {
            window.clearTimeout(configuratorLeadAutoTimer);
            configuratorLeadAutoTimer = null;
        }
        configuratorLeadModal.classList.remove('is-active');
        configuratorLeadModal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('cfg-lead-modal-open');
        if (configuratorLeadLastFocus && typeof configuratorLeadLastFocus.focus === 'function') {
            configuratorLeadLastFocus.focus();
        }
    }

    function scheduleConfiguratorLeadModal() {
        if (!hasConfiguratorLeadModal) return;
        if (configuratorLeadAutoTimer) {
            window.clearTimeout(configuratorLeadAutoTimer);
        }
        configuratorLeadAutoTimer = window.setTimeout(() => {
            openConfiguratorLeadModal({ trigger: 'final_step' });
        }, 520);
    }

    function showConfiguratorLeadSuccessState() {
        const costPanel = document.querySelector('[data-panel-key="cost"]');
        if (!costPanel) return;

        const panelHead = costPanel.querySelector('.cfg__panel-head');
        const panelBody = costPanel.querySelector('.cfg__panel-body');
        const panelToggle = costPanel.querySelector('[data-panel-toggle]');

        costPanel.classList.remove('is-collapsed');
        costPanel.classList.add('is-lead-success');

        if (panelHead) {
            panelHead.setAttribute('aria-hidden', 'true');
        }

        if (panelToggle) {
            panelToggle.setAttribute('aria-expanded', 'true');
        }

        if (panelBody) {
            panelBody.innerHTML = `
                <div class="cfg-lead-success" tabindex="-1">
                    <span class="cfg-lead-success__icon"><i class="fas fa-check"></i></span>
                    <h4>${uiText.configuratorLeadSuccessTitle}</h4>
                    <p>${uiText.configuratorLeadSuccessMessage}</p>
                </div>
            `;

            const successBlock = panelBody.querySelector('.cfg-lead-success');
            if (successBlock && typeof successBlock.focus === 'function') {
                successBlock.focus({ preventScroll: true });
            }
        }
    }

    function setConfiguratorLeadStatus(type, message) {
        if (!configuratorLeadStatus) return;
        configuratorLeadStatus.textContent = message || '';
        configuratorLeadStatus.classList.toggle('is-success', type === 'success');
        configuratorLeadStatus.classList.toggle('is-error', type === 'error');
    }

    function trackConfiguratorLeadEvent(eventName, params) {
        const eventParams = Object.assign({ event_category: 'lead_test', section: 'configurator_hybrid' }, params || {});
        if (typeof window.gtag === 'function') {
            window.gtag('event', eventName, eventParams);
        }
        if (typeof window.clarity === 'function') {
            window.clarity('event', eventName);
        }
    }

    function trackCalculatorCampaignLeadEvent(eventName, params) {
        if (!isCampaignConfiguratorLead) return;
        const eventParams = Object.assign({
            event_category: 'calculator_campaign',
            calculator_source: 'configurator-campaign-landing'
        }, params || {});
        if (typeof window.gtag === 'function') {
            window.gtag('event', eventName, eventParams);
        }
        if (typeof window.clarity === 'function') {
            window.clarity('event', eventName);
        }
    }

    function buildConfiguratorLeadSummary(formData, configState) {
        const labels = isRussianPage
            ? {
                configuration: 'Конфигурация',
                material: 'Материал',
                estimatedSurface: 'Площадь из конфигуратора',
                drainage: 'Водосток',
                budgetOptions: 'Запрошенные варианты',
                location: 'Населенный пункт',
                surface: 'Примерная площадь',
                workType: 'Тип работ',
                details: 'Детали'
            }
            : {
                configuration: 'Configurație',
                material: 'Material',
                estimatedSurface: 'Suprafață din configurator',
                drainage: 'Scurgere',
                budgetOptions: 'Variante solicitate',
                location: 'Localitate',
                surface: 'Suprafață aproximativă',
                workType: 'Tip lucrare',
                details: 'Detalii'
            };
        const rows = [
            [labels.configuration, configState?.houseLabel],
            [labels.material, configState?.name],
            [labels.estimatedSurface, configState?.area ? `${configState.area} m2` : ''],
            [labels.drainage, configState?.drainageLabel],
            [labels.budgetOptions, 'Standard / Premium / VIP'],
            [labels.location, formData.localitate],
            [labels.surface, formData.suprafata ? `${formData.suprafata} m2` : ''],
            [labels.workType, formData.lucrare],
            [labels.details, formData.mesaj]
        ];

        return rows
            .filter((row) => String(row[1] || '').trim())
            .map((row) => `${row[0]}: ${String(row[1]).trim()}`)
            .join('\n');
    }

    const initConfiguratorLeadForm = () => {
        configuratorLeadForm.addEventListener('focusin', () => {
            trackConfiguratorLeadEvent('configurator_lead_start');
        }, { once: true });

        configuratorLeadForm.addEventListener('submit', async function (event) {
            event.preventDefault();

            if (!offerWebhookEndpoint) {
                setConfiguratorLeadStatus('error', uiText.modalMissingWebhook);
                return;
            }

            const formData = new FormData(configuratorLeadForm);
            const leadData = {
                nume: String(formData.get('nume') || '').trim(),
                telefon: String(formData.get('telefon') || '').trim(),
                localitate: String(formData.get('localitate') || '').trim(),
                suprafata: String(formData.get('suprafata') || '').trim(),
                lucrare: String(formData.get('lucrare') || '').trim(),
                mesaj: String(formData.get('mesaj') || '').trim()
            };

            const phoneDigits = leadData.telefon.replace(/\D/g, '');
            if (!leadData.nume || !leadData.telefon || (isCampaignConfiguratorLead && phoneDigits.length < 8)) {
                setConfiguratorLeadStatus('error', uiText.configuratorLeadRequired);
                return;
            }

            const configuratorState = window.__cfgState ? window.__cfgState() : null;

            if (configuratorLeadSubmit) {
                configuratorLeadSubmit.disabled = true;
                configuratorLeadSubmit.classList.add('is-loading');
                configuratorLeadSubmit.textContent = uiText.configuratorLeadSubmitting;
            }

            setConfiguratorLeadStatus('', '');
            trackConfiguratorLeadEvent('configurator_lead_submit', {
                has_area: Boolean(leadData.suprafata),
                has_configurator_state: Boolean(configuratorState),
                has_location: Boolean(leadData.localitate),
                work_type: leadData.lucrare || 'not_selected'
            });
            trackCalculatorCampaignLeadEvent('calculator_lead_submit', {
                has_configurator_state: Boolean(configuratorState),
                has_location: Boolean(leadData.localitate)
            });

            try {
                const configuratorLeadSource = configuratorLeadForm.dataset.offerSource || 'configurator-lead-test';

                await submitOfferRequest({
                    source: configuratorLeadSource,
                    language: isRussianPage ? 'ru' : 'ro',
                    pageUrl: window.location.href,
                    pagePath: window.location.pathname,
                    submittedAt: new Date().toISOString(),
                    lead: {
                        name: leadData.nume,
                        phone: leadData.telefon,
                        location: leadData.localitate,
                        surface: leadData.suprafata || (configuratorState?.area ? String(configuratorState.area) : ''),
                        workType: leadData.lucrare
                    },
                    configuration: configuratorState ? {
                        houseLabel: configuratorState.houseLabel || '',
                        material: configuratorState.name || '',
                        materialType: configuratorState.materialType || '',
                        area: configuratorState.area || '',
                        drainage: configuratorState.drainageLabel || ''
                    } : null,
                    message: leadData.mesaj,
                    estimateSummary: buildConfiguratorLeadSummary(leadData, configuratorState)
                });

                configuratorLeadForm.reset();
                setConfiguratorLeadStatus('success', uiText.configuratorLeadSuccess);
                showConfiguratorLeadSuccessState();
                trackConfiguratorLeadEvent('configurator_lead_success', {
                    work_type: leadData.lucrare || 'not_selected'
                });
                trackCalculatorCampaignLeadEvent('calculator_lead_success');
                redirectToThankYouPage(configuratorLeadSource);
            } catch (error) {
                setConfiguratorLeadStatus('error', uiText.configuratorLeadError);
                trackConfiguratorLeadEvent('configurator_lead_error');
                trackCalculatorCampaignLeadEvent('calculator_lead_error');
                console.error('Configurator lead form webhook error:', error);
            } finally {
                if (configuratorLeadSubmit) {
                    configuratorLeadSubmit.disabled = false;
                    configuratorLeadSubmit.classList.remove('is-loading');
                    configuratorLeadSubmit.innerHTML = configuratorLeadDefaultSubmit;
                }
            }
        });
    };

    const initCorrugatedLeadForm = () => {
        corrugatedLeadForm.addEventListener('submit', async function (event) {
            event.preventDefault();

            if (!offerWebhookEndpoint) {
                if (corrugatedLeadStatus) {
                    corrugatedLeadStatus.textContent = uiText.modalMissingWebhook;
                    corrugatedLeadStatus.classList.add('is-error');
                    corrugatedLeadStatus.classList.remove('is-success');
                }
                return;
            }

            const formData = new FormData(corrugatedLeadForm);
            const prenume = String(formData.get('prenume') || '').trim();
            const telefon = String(formData.get('telefon') || '').trim();

            if (!prenume || !telefon) {
                if (corrugatedLeadStatus) {
                    corrugatedLeadStatus.textContent = uiText.corrugatedError;
                    corrugatedLeadStatus.classList.add('is-error');
                    corrugatedLeadStatus.classList.remove('is-success');
                }
                return;
            }

            if (corrugatedLeadSubmit) {
                corrugatedLeadSubmit.disabled = true;
                corrugatedLeadSubmit.classList.add('is-loading');
                corrugatedLeadSubmit.textContent = uiText.corrugatedSubmitting;
            }

            if (corrugatedLeadStatus) {
                corrugatedLeadStatus.textContent = '';
                corrugatedLeadStatus.classList.remove('is-success', 'is-error');
            }

            try {
                await submitOfferRequest({
                    source: 'tabla-cutata-inline-form',
                    language: isRussianPage ? 'ru' : 'ro',
                    pageUrl: window.location.href,
                    pagePath: window.location.pathname,
                    submittedAt: new Date().toISOString(),
                    lead: {
                        name: prenume,
                        phone: telefon
                    },
                    estimateSummary: ''
                });

                corrugatedLeadForm.reset();
                if (corrugatedLeadStatus) {
                    corrugatedLeadStatus.textContent = uiText.corrugatedSuccess;
                    corrugatedLeadStatus.classList.add('is-success');
                    corrugatedLeadStatus.classList.remove('is-error');
                }
                redirectToThankYouPage('tabla-cutata-inline-form');
            } catch (error) {
                if (corrugatedLeadStatus) {
                    corrugatedLeadStatus.textContent = uiText.corrugatedError;
                    corrugatedLeadStatus.classList.add('is-error');
                    corrugatedLeadStatus.classList.remove('is-success');
                }
                console.error('Corrugated lead form webhook error:', error);
            } finally {
                if (corrugatedLeadSubmit) {
                    corrugatedLeadSubmit.disabled = false;
                    corrugatedLeadSubmit.classList.remove('is-loading');
                    corrugatedLeadSubmit.textContent = corrugatedLeadDefaultSubmit;
                }
            }
        });
    };

    function setProductLeadStatus(type, message) {
        if (!productLeadStatus) return;
        productLeadStatus.textContent = message || '';
        productLeadStatus.classList.toggle('is-success', type === 'success');
        productLeadStatus.classList.toggle('is-error', type === 'error');
    }

    function buildProductLeadSummary(leadData) {
        const labels = isRussianPage
            ? {
                product: 'Продукт'
            }
            : {
                product: 'Produs'
            };

        return [
            [labels.product, leadData.produs]
        ]
            .filter((row) => String(row[1] || '').trim())
            .map((row) => `${row[0]}: ${String(row[1]).trim()}`)
            .join('\n');
    }

    const initProductLeadForm = () => {
        productLeadForm.addEventListener('submit', async function (event) {
            event.preventDefault();

            if (!offerWebhookEndpoint) {
                setProductLeadStatus('error', uiText.modalMissingWebhook);
                return;
            }

            const formData = new FormData(productLeadForm);
            const leadData = {
                produs: String(formData.get('produs') || getCurrentProductName()).trim(),
                nume: String(formData.get('nume') || '').trim(),
                telefon: String(formData.get('telefon') || '').trim()
            };

            if (!leadData.nume || !leadData.telefon) {
                setProductLeadStatus('error', uiText.productLeadRequired);
                return;
            }

            if (productLeadSubmit) {
                productLeadSubmit.disabled = true;
                productLeadSubmit.classList.add('is-loading');
                productLeadSubmit.textContent = uiText.productLeadSubmitting;
            }

            setProductLeadStatus('', '');

            if (typeof window.gtag === 'function') {
                window.gtag('event', 'product_lead_submit', {
                    event_category: 'product_lead',
                    product_name: leadData.produs
                });
            }
            if (typeof window.clarity === 'function') {
                window.clarity('event', 'product_lead_submit');
            }

            try {
                await submitOfferRequest({
                    source: 'product-card-form',
                    language: isRussianPage ? 'ru' : 'ro',
                    pageUrl: window.location.href,
                    pagePath: window.location.pathname,
                    submittedAt: new Date().toISOString(),
                    lead: {
                        name: leadData.nume,
                        phone: leadData.telefon,
                        product: leadData.produs
                    },
                    product: {
                        name: leadData.produs,
                        path: rootPath
                    },
                    estimateSummary: buildProductLeadSummary(leadData)
                });

                productLeadForm.reset();
                setProductLeadStatus('success', uiText.productLeadSuccess);

                if (typeof window.gtag === 'function') {
                    window.gtag('event', 'product_lead_success', {
                        event_category: 'product_lead',
                        product_name: leadData.produs
                    });
                }
                redirectToThankYouPage('product-card-form');
            } catch (error) {
                setProductLeadStatus('error', uiText.productLeadError);
                if (typeof window.gtag === 'function') {
                    window.gtag('event', 'product_lead_error', {
                        event_category: 'product_lead',
                        product_name: leadData.produs
                    });
                }
                console.error('Product lead form webhook error:', error);
            } finally {
                if (productLeadSubmit) {
                    productLeadSubmit.disabled = false;
                    productLeadSubmit.classList.remove('is-loading');
                    productLeadSubmit.innerHTML = productLeadDefaultSubmit;
                }
            }
        });
    };

    const initContactLeadForm = () => {
        contactForm.addEventListener('submit', async function (event) {
            event.preventDefault();

            if (!offerWebhookEndpoint) {
                window.alert(uiText.modalMissingWebhook);
                return;
            }

            const formData = new FormData(contactForm);
            const nume = String(formData.get('nume') || '').trim();
            const email = String(formData.get('email') || '').trim();
            const telefon = String(formData.get('telefon') || '').trim();
            const mesaj = String(formData.get('mesaj') || '').trim();

            if (!nume || !email || !mesaj) {
                return;
            }

            if (contactSubmitButton) {
                contactSubmitButton.disabled = true;
                contactSubmitButton.classList.add('is-loading');
                contactSubmitButton.textContent = uiText.modalSubmitting;
            }

            try {
                await submitOfferRequest({
                    source: 'contact-page-form',
                    language: isRussianPage ? 'ru' : 'ro',
                    pageUrl: window.location.href,
                    pagePath: window.location.pathname,
                    submittedAt: new Date().toISOString(),
                    lead: {
                        name: nume,
                        phone: telefon,
                        email: email
                    },
                    message: mesaj,
                    estimateSummary: ''
                });

                contactForm.reset();
                contactForm.style.display = 'none';
                if (contactSuccess) {
                    contactSuccess.classList.add('show');
                }
                redirectToThankYouPage('contact-page-form');
            } catch (error) {
                window.alert(uiText.modalErrorMessage);
                console.error('Contact form webhook error:', error);
            } finally {
                if (contactSubmitButton) {
                    contactSubmitButton.disabled = false;
                    contactSubmitButton.classList.remove('is-loading');
                    contactSubmitButton.textContent = contactDefaultSubmitLabel;
                }
            }
        });
    };

    if (hasConfiguratorLeadForm) {
        initConfiguratorLeadForm();
    }

    if (hasConfiguratorLeadModal) {
        configuratorLeadOpenButtons.forEach((button) => {
            button.addEventListener('click', () => {
                openConfiguratorLeadModal({ trigger: 'button' });
            });
        });

        if (configuratorLeadClose) {
            configuratorLeadClose.addEventListener('click', closeConfiguratorLeadModal);
        }

        configuratorLeadModal.addEventListener('click', (event) => {
            if (event.target === configuratorLeadModal) {
                closeConfiguratorLeadModal();
            }
        });

        window.addEventListener('configurator:lead-ready', scheduleConfiguratorLeadModal);

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && configuratorLeadModal.classList.contains('is-active')) {
                closeConfiguratorLeadModal();
            }
        });
    }

    if (isCorrugatedProductPage && hasCorrugatedLeadForm) {
        initCorrugatedLeadForm();
    }

    if (hasProductLeadForm) {
        initProductLeadForm();
    }

    if (isContactPage && hasContactLeadForm) {
        initContactLeadForm();
    }

    const chatText = isRussianPage
        ? {
            title: 'Ассистент MoldAcoperis',
            subtitle: 'Помогает выбрать кровельную систему и быстро отправить заявку.',
            status: 'Сейчас онлайн',
            statusAi: 'AI активен',
            statusFallback: 'Автоответ',
            statusOffline: 'AI недоступен',
            toggleLabel: 'Спросите нас о кровле',
            teaserText: 'Это AI-ассистент MoldAcoperis. Он поможет быстро выбрать кровельную систему и отправить заявку консультанту.',
            teaserCta: 'Попробовать сейчас',
            teaserCloseAria: 'Закрыть сообщение ассистента',
            inputPlaceholder: 'Напишите ваш вопрос...',
            intro: 'Здравствуйте! Я виртуальный ассистент MoldAcoperis.\nПомогу выбрать кровельный материал, водосток, аксессуары и передать заявку консультанту.',
            quickLabel: 'Можно начать с:',
            quickActions: [
                { label: 'Цена и предложение', action: 'price' },
                { label: 'Модульная металлочерепица', action: 'modular' },
                { label: 'Кровля под ключ', action: 'install' },
                { label: 'Пусть мне позвонят', action: 'lead_call' }
            ],
            askName: 'Конечно. Чтобы передать заявку дальше, напишите ваше имя.',
            askPhone: 'Спасибо. Укажите, пожалуйста, номер телефона.',
            askLocation: 'В каком населенном пункте находится объект?',
            askRoofType: 'Какой тип кровли или какой продукт вас интересует?',
            askLeadCompact: 'Чтобы я передал заявку дальше, напишите одним сообщением: имя, телефон, населенный пункт и тип кровли или нужный продукт. Пример: Сергей, +37360111222, Резина, битумная черепица.',
            invalidPhone: 'Нужен корректный номер телефона, чтобы мы могли связаться с вами. Укажите номер минимум с 8 цифрами.',
            sendingLead: 'Отлично. Передаю данные нашей команде прямо сейчас.',
            leadSuccess: 'Заявка зарегистрирована. Консультант MoldAcoperis свяжется с вами в ближайшее время.',
            leadError: 'Сейчас не удалось отправить заявку. Попробуйте еще раз или позвоните напрямую по номеру +373 79 360 360.',
            leadFormInvalid: 'Отправьте все данные одним сообщением: имя, телефон, населенный пункт и тип кровли или нужный продукт.',
            fallback: 'Я могу помочь с выбором материала, водостока, аксессуаров, ориентировочной оценкой и заявкой на персональное предложение.',
            note: 'Вы получите быстрые ориентировочные ответы, а для точного предложения запрос будет передан консультанту MoldAcoperis.',
            sendAria: 'Отправить сообщение',
            closeAria: 'Закрыть чат',
            openAria: 'Открыть чат',
            leadReason: 'Заявка из чата',
            actionsAfterAnswer: [
                { label: 'Запросить предложение', action: 'lead_offer' },
                { label: 'Перезвоните мне', action: 'lead_call' },
                { label: 'Показать продукты', action: 'products' }
            ],
            answers: {
                price: 'Цена зависит от покрытия, толщины, площади, формы крыши, аксессуаров, водостока и населенного пункта. Для точной оценки лучше передать данные консультанту.',
                modular: 'Модульная металлочерепица позиционируется как современное, премиальное и практичное решение: быстрый монтаж, компактная транспортировка, меньше отходов и более простая замена модулей. Кроме того, доступны 2 эксклюзивные формы.',
                metal: 'Металлочерепица остается одним из самых популярных решений для новых домов и замены старой кровли: сбалансированный внешний вид, малый вес, быстрый монтаж и широкий выбор покрытий и цветов.',
                shingle: 'Битумная черепица особенно подходит для крыш со сложной геометрией, когда важны гибкость материала, аккуратные детали и ровный внешний вид.',
                drainage: 'Водосточная система защищает фасад, фундамент и пространство вокруг дома. Мы можем быстро подсказать подходящий размер и материал в зависимости от дома и площади кровли.',
                accessories: 'Правильные аксессуары важны для герметичности, вентиляции, конька, ендовы и финишных узлов. Обычно мы рекомендуем совместимую полную систему, а не выбор только по цене.',
                install: 'Для надежной крыши важна вся система: основание, пленки, вентиляция, аксессуары, водосток и корректное исполнение. Лучше рассматривать проект как полное решение, а не отдельную операцию.',
                repair: 'Для ремонта важно понять, есть ли протечки, деформированные листы, ослабленные саморезы, проблемы с коньком, ендовами или водостоком. При желании я могу сразу оформить заявку для связи с командой.',
                warranty: 'Долговечность и гарантия зависят от материала, толщины, защитного покрытия и правильного монтажа. Именно поэтому мы рекомендуем полное решение, а не выбор только по самой низкой цене.',
                area: 'MoldAcoperis работает в Кишиневе и по всей Молдове. Если скажете населенный пункт, я добавлю его сразу в заявку.',
                contact: 'С нами можно связаться по телефону +373 79 360 360 или по email moldacoperis@gmail.com. Если хотите, я могу прямо сейчас передать заявку и попросить, чтобы вам перезвонили.',
                calculator: 'Сейчас на сайте доступна форма быстрой оценки. Оставьте данные, и консультант подготовит ориентировочный расчет под ваш проект.'
            }
        }
        : {
            title: 'Asistent MoldAcoperis',
            subtitle: 'Te ajuta sa alegi sistemul potrivit si sa trimiti rapid o cerere.',
            status: 'Online acum',
            statusAi: 'AI activ',
            statusFallback: 'Răspuns automat',
            statusOffline: 'AI indisponibil',
            toggleLabel: 'Intreaba-ne despre acoperis',
            teaserText: 'Acesta este asistentul AI MoldAcoperis. Te ajută să alegi rapid sistemul potrivit și să trimiți o cerere către echipă.',
            teaserCta: 'Încearcă acum',
            teaserCloseAria: 'Închide mesajul asistentului',
            inputPlaceholder: 'Scrie intrebarea ta...',
            intro: 'Salut! Sunt asistentul virtual MoldAcoperis.\nTe pot ajuta sa alegi materialul, sistemul de scurgere, accesoriile si sa transmiti rapid o cerere.',
            welcomeTyped: 'Salut! Sunt aici ca sa te ajut rapid cu acoperisul tau. Ma poti intreba despre pret, garantie, produse sau poti sa-mi spui direct ce sistem te intereseaza.',
            quickLabel: 'Poti incepe cu:',
            quickActions: [
                { label: 'Pret si oferta', action: 'price' },
                { label: 'Tigla metalica modulara', action: 'modular' },
                { label: 'Acoperis complet', action: 'install' },
                { label: 'Vreau sa ma sune cineva', action: 'lead_call' }
            ],
            askName: 'Sigur. Ca sa trimitem cererea mai departe, spune-mi numele tau.',
            askPhone: 'Multumesc. Care este numarul de telefon?',
            askLocation: 'In ce localitate este proiectul?',
            askRoofType: 'Ce tip de acoperis sau ce produs te intereseaza?',
            askLeadCompact: 'Ca sa trimit mai departe cererea, scrie-mi intr-un singur mesaj: nume, telefon, localitate, tipul acoperisului sau produsul dorit. Exemplu: Sergiu, +37360111222, Rezina, sindrila bituminoasa.',
            leadFormShortHint: 'Daca iti este mai usor, trimite-mi toate datele intr-un singur mesaj: nume, telefon, localitate si tipul acoperisului. Exemplu: Sergiu, +37360111222, Rezina, sindrila bituminoasa. Sau poti sa-mi pui in continuare o intrebare.',
            invalidPhone: 'Am nevoie de un numar de telefon valid ca sa te putem contacta. Poti scrie un numar cu cel putin 8 cifre.',
            sendingLead: 'Perfect. Trimit datele catre echipa noastra chiar acum.',
            leadSuccess: 'Cererea a fost inregistrata. Un consultant MoldAcoperis te va contacta in cel mai scurt timp.',
            leadError: 'Nu am reusit sa trimit cererea acum. Poti incerca din nou sau suna direct la +373 79 360 360.',
            leadFormInvalid: 'Trimite-mi toate datele intr-un singur mesaj: nume, telefon, localitate si tipul acoperisului sau produsul dorit.',
            fallback: 'Pot sa te ajut cu produse, preturi orientative, sisteme complete, reparatii, garantie si livrare. Daca vrei, pot sa preiau direct o cerere de oferta.',
            note: 'Primesti raspunsuri rapide si orientative, iar pentru o oferta exacta solicitarea este transmisa unui consultant MoldAcoperis.',
            sendAria: 'Trimite mesaj',
            closeAria: 'Inchide chatul',
            openAria: 'Deschide chatul',
            leadReason: 'Cerere preluata din chat',
            actionsAfterAnswer: [
                { label: 'Solicita oferta', action: 'lead_offer' },
                { label: 'Sunati-ma', action: 'lead_call' },
                { label: 'Vezi produsele', action: 'products' }
            ],
            answers: {
                price: 'Prețul depinde de învelitoare, grosime, acoperire, suprafață, forma acoperișului, accesorii, sistemul de scurgere și localitate. Pentru un preț corect este nevoie de ofertă personalizată.',
                modular: 'Tigla metalica modulara este o solutie moderna, premium si practica: transport compact, manipulare usoara, pierderi mai mici si inlocuire mai simpla a modulelor. Este foarte potrivita pentru case noi si acoperisuri mai complexe.',
                metal: 'Tigla metalica este una dintre cele mai cautate optiuni pentru case noi si renovari: aspect echilibrat, greutate redusa, montaj eficient si multe optiuni de finisaj si culoare.',
                shingle: 'Sindrila bituminoasa este potrivita mai ales pentru acoperisuri cu forme mai complexe, unde ai nevoie de flexibilitate, un aspect uniform si o buna adaptare la detalii.',
                drainage: 'Sistemul de scurgere protejeaza fatada, fundatia si zonele de langa casa. Putem recomanda rapid dimensiunea si materialul potrivit in functie de casa si suprafata acoperisului.',
                accessories: 'Accesoriile corecte fac diferenta la etansare, ventilare, coama, dolie si finisaje. De regula le recomandam impreuna cu sistemul complet, nu separat, ca sa eviti incompatibilitatile.',
                install: 'Pentru un acoperis durabil conteaza sistemul complet: suport corect, folii, ventilare, accesorii, drenaj si executie buna. Cel mai sigur este sa pornim de la proiect si sa pregatim o oferta personalizata.',
                repair: 'Pentru reparatii, cel mai bine este sa stim daca ai infiltratii, tabla deformata, suruburi slabite, probleme la coama, dolii sau sistemul de scurgere. Daca vrei, pot prelua cererea si te contacteaza echipa.',
                warranty: 'Durabilitatea si garantia depind de material, grosime, stratul de protectie, compatibilitatea accesoriilor si executia corecta. Tocmai de aceea recomandam solutia completa, nu doar alegerea dupa cel mai mic pret.',
                area: 'MoldAcoperis lucreaza in Chisinau si in toata Moldova. Daca imi spui localitatea, o includ direct in cererea ta.',
                contact: 'Ne poti contacta direct la +373 79 360 360 sau pe email la moldacoperis@gmail.com. Daca vrei, pot sa transmit chiar acum o cerere si sa fii sunat.',
                calculator: 'Momentan pe site este disponibil formularul de estimare rapidă. Lasă datele, iar consultantul pregătește o estimare orientativă pentru proiectul tău.'
            }
        };

    const chatStorageKey = `ma-chat-history-${isRussianPage ? 'ru' : 'ro'}`;
    const chatLeadStorageKey = `ma-chat-lead-${isRussianPage ? 'ru' : 'ro'}`;
    const chatGreetingSeenKey = `ma-chat-greeting-${isRussianPage ? 'ru' : 'ro'}`;
    const chatTeaserDismissedKey = `ma-chat-teaser-dismissed-${isRussianPage ? 'ru' : 'ro'}`;
    const chatApiEndpoint = String(window.MA_CHAT_API || '/api/chat').trim();
    const chatHistoryLimit = 16;
    const chatHistoryTtlMs = 1000 * 60 * 60 * 24 * 14;
    const chatHistoryMaxStorageChars = 50000;
    const chatMessageMaxChars = 1200;

    function buildFloatingMessengers() {
        if (!document.body || document.querySelector('.floating-messengers')) {
            return;
        }

        const labels = isRussianPage
            ? {
                telegram: 'Написать в Telegram',
                whatsapp: 'Написать в WhatsApp',
                viber: 'Написать в Viber'
            }
            : {
                telegram: 'Scrie-ne pe Telegram',
                whatsapp: 'Scrie-ne pe WhatsApp',
                viber: 'Scrie-ne pe Viber'
            };

        const messengerRoot = document.createElement('div');
        messengerRoot.className = 'floating-messengers';
        messengerRoot.innerHTML = `
            <a class="floating-messengers__link floating-messengers__link--telegram" href="tg://resolve?phone=37379360360" data-fallback-href="https://t.me/+37379360360" aria-label="${labels.telegram}" title="${labels.telegram}">
                <i class="fab fa-telegram-plane"></i>
            </a>
            <a class="floating-messengers__link floating-messengers__link--whatsapp" href="https://wa.me/37379360360" aria-label="${labels.whatsapp}" title="${labels.whatsapp}">
                <i class="fab fa-whatsapp"></i>
            </a>
            <a class="floating-messengers__link floating-messengers__link--viber" href="viber://chat?number=%2B37379360360" aria-label="${labels.viber}" title="${labels.viber}">
                <i class="fab fa-viber"></i>
            </a>
        `;

        document.body.appendChild(messengerRoot);

        messengerRoot.addEventListener('click', (event) => {
            const link = event.target.closest('.floating-messengers__link');
            if (!link) {
                return;
            }

            event.preventDefault();
            const href = link.getAttribute('href');
            if (!href) {
                return;
            }
            const fallbackHref = link.getAttribute('data-fallback-href');

            if (fallbackHref) {
                window.location.href = href;

                window.setTimeout(() => {
                    if (document.visibilityState === 'visible') {
                        window.location.href = fallbackHref;
                    }
                }, 700);

                return;
            }

            window.location.href = href;
        });
    }

    function buildSiteChatbot() {
        if (!supportWidgetFeatures.chatbot) {
            return;
        }

        if (!document.body || document.querySelector('.chat-widget')) {
            return;
        }

        const quickActionMap = {
            'pret si oferta': 'price',
            'tigla metalica modulara': 'modular',
            'acoperis complet': 'install',
            'vreau sa ma sune cineva': 'lead_call',
            'solicita oferta': 'lead_offer',
            'sunati-ma': 'lead_call',
            'vezi produsele': 'products',
            'tigla metalica': 'metal',
            'sindrila bituminoasa': 'shingle',
            'contact': 'contact',
            'reparatii acoperis': 'repair',
            'цена и предложение': 'price',
            'модульная металлочерепица': 'modular',
            'монтаж кровли': 'install',
            'пусть мне позвонят': 'lead',
            'запросить предложение': 'lead',
            'перезвоните мне': 'lead',
            'показать продукты': 'products'
        };

        function createAction(label, action) {
            return { label, action };
        }

        function getActionLabel(actionItem) {
            if (!actionItem) {
                return '';
            }

            return typeof actionItem === 'string' ? actionItem : String(actionItem.label || '').trim();
        }

        function getActionValue(actionItem) {
            if (!actionItem) {
                return '';
            }

            return typeof actionItem === 'string'
                ? String(actionItem).trim()
                : String(actionItem.action || actionItem.label || '').trim();
        }

        function getProductActions() {
            return isRussianPage
                ? [
                    createAction('Металлочерепица', 'metal'),
                    createAction('Модульная металлочерепица', 'modular'),
                    createAction('Битумная черепица', 'shingle')
                ]
                : [
                    createAction('Tigla metalica', 'metal'),
                    createAction('Tigla metalica modulara', 'modular'),
                    createAction('Sindrila bituminoasa', 'shingle')
                ];
        }

        function getDefaultAnswerActions() {
            return isRussianPage
                ? [
                    createAction('Запросить предложение', 'lead_offer'),
                    createAction('Кровля под ключ', 'install'),
                    createAction('Контакты', 'contact')
                ]
                : [
                    createAction('Solicita oferta', 'lead_offer'),
                    createAction('Acoperis complet', 'install'),
                    createAction('Contact', 'contact')
                ];
        }

        function getLeadSuccessActions() {
            return isRussianPage
                ? [
                    createAction('Запросить предложение', 'price'),
                    createAction('Кровля под ключ', 'install')
                ]
                : [
                    createAction('Pret si oferta', 'price'),
                    createAction('Acoperis complet', 'install')
                ];
        }

        function getLeadErrorActions() {
            return isRussianPage
                ? [
                    createAction('Перезвоните мне', 'lead_call'),
                    createAction('Цена и предложение', 'price')
                ]
                : [
                    createAction('Sunati-ma', 'lead_call'),
                    createAction('Pret si oferta', 'price')
                ];
        }

        const knowledgeBase = [
            { intent: 'price', keywords: ['pret', 'preturi', 'costa', 'cost', 'oferta', 'oferta personalizata', 'estimare', 'buget'] },
            { intent: 'modular', keywords: ['modulara', 'modular', 'tigla modulara', 'tigla metalica modulara'] },
            { intent: 'metal', keywords: ['tigla metalica', 'metalica', 'tabla pentru acoperis'] },
            { intent: 'shingle', keywords: ['sindrila', 'bituminoasa', 'sindrila bituminoasa'] },
            { intent: 'drainage', keywords: ['jgheab', 'burlan', 'sistem de scurgere', 'scurgere', 'drenaj'] },
            { intent: 'accessories', keywords: ['accesorii', 'coama', 'dolie', 'folie', 'suruburi'] },
            { intent: 'install', keywords: ['montaj', 'instalare', 'echipa', 'executie', 'manopera'] },
            { intent: 'repair', keywords: ['reparatie', 'reparatii', 'infiltratii', 'curge', 'renovare'] },
            { intent: 'warranty', keywords: ['garantie', 'durata', 'rezista', 'durabilitate'] },
            { intent: 'area', keywords: ['chisinau', 'balti', 'orhei', 'cahul', 'localitate', 'moldova', 'zona'] },
            { intent: 'contact', keywords: ['telefon', 'contact', 'email', 'adresa', 'program', 'sun', 'apel'] },
            { intent: 'calculator', keywords: ['calculator', 'configurator', 'calcul', 'estimare online'] }
        ];

        const chatRoot = document.createElement('aside');
        chatRoot.className = 'chat-widget';
        chatRoot.setAttribute('aria-live', 'polite');
        chatRoot.innerHTML = `
            <div class="chat-widget__panel" role="dialog" aria-label="${chatText.title}">
                <div class="chat-widget__header">
                    <div class="chat-widget__head">
                        <div class="chat-widget__brand">
                            <span class="chat-widget__brand-icon" aria-hidden="true"><img src="/images/logo-light.png" alt="" loading="lazy" decoding="async"></span>
                            <h3 class="chat-widget__title">${chatText.title}</h3>
                        </div>
                        <button type="button" class="chat-widget__close" aria-label="${chatText.closeAria}">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                <div class="chat-widget__body">
                    <div class="chat-widget__messages"></div>
                    <div class="chat-widget__composer">
                        <div class="chat-widget__quick"></div>
                        <form class="chat-widget__form">
                            <input class="chat-widget__input" type="text" placeholder="${chatText.inputPlaceholder}" autocomplete="off">
                            <button class="chat-widget__send" type="submit" aria-label="${chatText.sendAria}">
                                <i class="fas fa-paper-plane"></i>
                            </button>
                        </form>
                        <p class="chat-widget__note">${chatText.note}</p>
                    </div>
                </div>
            </div>
            <div class="chat-widget__teaser" aria-hidden="true">
                <button type="button" class="chat-widget__teaser-close" aria-label="${chatText.teaserCloseAria}">
                    <i class="fas fa-times"></i>
                </button>
                <p>${chatText.teaserText}</p>
                <button type="button" class="chat-widget__teaser-cta">${chatText.teaserCta}</button>
            </div>
            <button type="button" class="chat-widget__toggle" aria-label="${chatText.openAria}">
                <span class="chat-widget__toggle-label">${chatText.toggleLabel}</span>
                <span class="chat-widget__toggle-badge">AI</span>
                <i class="fas fa-comments"></i>
            </button>
        `;

        document.body.appendChild(chatRoot);

        const toggleButton = chatRoot.querySelector('.chat-widget__toggle');
        const closeButton = chatRoot.querySelector('.chat-widget__close');
        const messagesEl = chatRoot.querySelector('.chat-widget__messages');
        const quickEl = chatRoot.querySelector('.chat-widget__quick');
        const formEl = chatRoot.querySelector('.chat-widget__form');
        const inputEl = chatRoot.querySelector('.chat-widget__input');
        const statusTextEl = chatRoot.querySelector('.chat-widget__status span:last-child');
        const teaserEl = chatRoot.querySelector('.chat-widget__teaser');
        const teaserCloseButton = chatRoot.querySelector('.chat-widget__teaser-close');
        const teaserCtaButton = chatRoot.querySelector('.chat-widget__teaser-cta');

        let leadFlow = null;
        let messageHistory = loadMessageHistory();
        let isOpen = false;
        let aiMode = 'unknown';
        let activeTopic = '';
        let isWelcomeTyping = false;
        let teaserDelayId = 0;

        function setChatMode(mode) {
            aiMode = mode;
            if (!statusTextEl) return;
            statusTextEl.textContent =
                mode === 'ai' ? chatText.statusAi
                    : mode === 'offline' ? chatText.statusOffline
                        : chatText.statusFallback;
        }

        function setActiveTopic(topic) {
            activeTopic = String(topic || '').trim();
        }

        function normalizeChatInput(value) {
            return String(value || '')
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^\p{L}\p{N}\s]/gu, ' ')
                .replace(/\s+/g, ' ')
                .trim();
        }

        function loadMessageHistory() {
            try {
                const rawHistory = window.localStorage.getItem(chatStorageKey);
                if (!rawHistory) {
                    return [];
                }

                if (rawHistory.length > chatHistoryMaxStorageChars) {
                    window.localStorage.removeItem(chatStorageKey);
                    return [];
                }

                const parsedHistory = JSON.parse(rawHistory);
                const compactHistory = compactStoredChatHistory(parsedHistory);
                if (JSON.stringify(compactHistory) !== rawHistory) {
                    window.localStorage.setItem(chatStorageKey, JSON.stringify(compactHistory));
                }

                return compactHistory;
            } catch (error) {
                try {
                    window.localStorage.removeItem(chatStorageKey);
                } catch (storageError) {}
                return [];
            }
        }

        function saveMessageHistory() {
            try {
                messageHistory = compactStoredChatHistory(messageHistory);
                window.localStorage.setItem(chatStorageKey, JSON.stringify(messageHistory));
            } catch (error) {
                // Ignore storage errors.
            }
        }

        function normalizeStoredChatAction(actionItem) {
            if (!actionItem) {
                return null;
            }

            if (typeof actionItem === 'string') {
                return actionItem.slice(0, 80);
            }

            return {
                label: String(actionItem.label || '').slice(0, 80),
                action: String(actionItem.action || '').slice(0, 80)
            };
        }

        function normalizeStoredChatMessage(message) {
            if (!message || typeof message !== 'object') {
                return null;
            }

            const role = message.role === 'user' ? 'user' : 'bot';
            const text = String(message.text || '').trim().slice(0, chatMessageMaxChars);
            if (!text) {
                return null;
            }

            const actions = Array.isArray(message.actions)
                ? message.actions
                    .slice(0, 4)
                    .map(normalizeStoredChatAction)
                    .filter(Boolean)
                : [];

            return {
                role,
                text,
                actions,
                savedAt: Number(message.savedAt) || Date.now()
            };
        }

        function compactStoredChatHistory(history) {
            if (!Array.isArray(history)) {
                return [];
            }

            const now = Date.now();
            const cutoff = now - chatHistoryTtlMs;

            return history
                .map(normalizeStoredChatMessage)
                .filter(Boolean)
                .filter((message) => message.savedAt >= cutoff)
                .slice(-chatHistoryLimit);
        }

        function saveLeadFlow() {
            // Lead capture remains in-memory only to avoid sticky collection state
            // after refreshes or previous incomplete attempts.
        }

        function scrollMessagesToEnd() {
            window.requestAnimationFrame(() => {
                messagesEl.scrollTop = messagesEl.scrollHeight;
            });
        }

        function formatChatText(value) {
            return String(value || '')
                .replace(/\*\*(.*?)\*\*/g, '$1')
                .replace(/__(.*?)__/g, '$1')
                .replace(/^[ \t]*[-*][ \t]+/gm, '')
                .trim();
        }

        function renderQuickReplies(replies) {
            quickEl.innerHTML = '';
            const items = Array.isArray(replies) && replies.length ? replies : chatText.quickActions;

            items.forEach((item) => {
                const replyButton = document.createElement('button');
                replyButton.type = 'button';
                replyButton.className = 'chat-widget__chip';
                replyButton.textContent = getActionLabel(item);
                replyButton.dataset.prompt = getActionLabel(item);
                replyButton.dataset.action = getActionValue(item);
                quickEl.appendChild(replyButton);
            });
        }

        function appendMessage(message) {
            const wrapper = document.createElement('div');
            wrapper.className = `chat-widget__message chat-widget__message--${message.role === 'user' ? 'user' : 'bot'}`;
            wrapper.textContent = formatChatText(message.text);

            if (Array.isArray(message.actions) && message.actions.length) {
                const actionsEl = document.createElement('div');
                actionsEl.className = 'chat-widget__message-actions';

                message.actions.forEach((actionItem) => {
                    const actionButton = document.createElement('button');
                    actionButton.type = 'button';
                    actionButton.className = 'chat-widget__chip';
                    actionButton.textContent = getActionLabel(actionItem);
                    actionButton.dataset.prompt = getActionLabel(actionItem);
                    actionButton.dataset.action = getActionValue(actionItem);
                    actionsEl.appendChild(actionButton);
                });

                wrapper.appendChild(actionsEl);
            }

            messagesEl.appendChild(wrapper);
            scrollMessagesToEnd();
        }

        function persistMessage(message) {
            messageHistory.push(message);
            saveMessageHistory();
        }

        function addMessage(role, text, actions) {
            const message = {
                role,
                text: String(text || '').trim(),
                actions: Array.isArray(actions) ? actions : []
            };

            persistMessage(message);
            appendMessage(message);
        }

        function typeBotMessage(text, actions, speed) {
            return new Promise((resolve) => {
                const cleanText = formatChatText(text);
                const wrapper = document.createElement('div');
                wrapper.className = 'chat-widget__message chat-widget__message--bot chat-widget__message--typing';
                messagesEl.appendChild(wrapper);

                let index = 0;
                const stepDelay = typeof speed === 'number' ? speed : 18;

                function finish() {
                    wrapper.classList.remove('chat-widget__message--typing');

                    if (Array.isArray(actions) && actions.length) {
                        const actionsEl = document.createElement('div');
                        actionsEl.className = 'chat-widget__message-actions';

                        actions.forEach((actionItem) => {
                            const actionButton = document.createElement('button');
                            actionButton.type = 'button';
                            actionButton.className = 'chat-widget__chip';
                            actionButton.textContent = getActionLabel(actionItem);
                            actionButton.dataset.prompt = getActionLabel(actionItem);
                            actionButton.dataset.action = getActionValue(actionItem);
                            actionsEl.appendChild(actionButton);
                        });

                        wrapper.appendChild(actionsEl);
                    }

                    persistMessage({
                        role: 'bot',
                        text: cleanText,
                        actions: Array.isArray(actions) ? actions : []
                    });
                    scrollMessagesToEnd();
                    resolve();
                }

                function typeNext() {
                    index += 1;
                    wrapper.textContent = cleanText.slice(0, index);
                    scrollMessagesToEnd();

                    if (index >= cleanText.length) {
                        finish();
                        return;
                    }

                    window.setTimeout(typeNext, stepDelay);
                }

                window.setTimeout(typeNext, 180);
            });
        }

        function hydrateMessages() {
            messagesEl.innerHTML = '';

            if (!messageHistory.length) {
                renderQuickReplies([]);
                return;
            }

            messageHistory.forEach((message) => appendMessage(message));
            renderQuickReplies(chatText.quickActions);
        }

        function shouldAutoFocusChatInput() {
            if (!inputEl) {
                return false;
            }

            if (window.innerWidth <= 768) {
                return false;
            }

            if (typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches) {
                return false;
            }

            return true;
        }

        function hasDismissedChatTeaser() {
            try {
                return window.sessionStorage.getItem(chatTeaserDismissedKey) === '1';
            } catch (error) {
                return false;
            }
        }

        function markChatTeaserDismissed() {
            try {
                window.sessionStorage.setItem(chatTeaserDismissedKey, '1');
            } catch (error) {
                // Ignore session storage issues.
            }
        }

        function hideChatTeaser(rememberChoice) {
            if (teaserDelayId) {
                window.clearTimeout(teaserDelayId);
                teaserDelayId = 0;
            }

            chatRoot.classList.remove('has-teaser');

            if (teaserEl) {
                teaserEl.setAttribute('aria-hidden', 'true');
            }

            if (rememberChoice) {
                markChatTeaserDismissed();
            }
        }

        function showChatTeaser() {
            teaserDelayId = 0;

            if (!teaserEl || isOpen || messageHistory.length || leadFlow || hasDismissedChatTeaser()) {
                return;
            }

            teaserEl.setAttribute('aria-hidden', 'false');
            chatRoot.classList.add('has-teaser');
        }

        function scheduleChatTeaser() {
            if (!teaserEl || messageHistory.length || leadFlow || hasDismissedChatTeaser()) {
                return;
            }

            teaserDelayId = window.setTimeout(showChatTeaser, 5200);
        }

        function openChat() {
            isOpen = true;
            hideChatTeaser(true);
            chatRoot.classList.add('is-open');
            document.body.classList.add('chat-open');

            if (shouldAutoFocusChatInput()) {
                try {
                    inputEl.focus({ preventScroll: true });
                } catch (error) {
                    inputEl.focus();
                }
            }

            scrollMessagesToEnd();
        }

        function closeChat() {
            isOpen = false;
            chatRoot.classList.remove('is-open');
            document.body.classList.remove('chat-open');

            if (document.activeElement === inputEl) {
                inputEl.blur();
            }
        }

        function markGreetingSeen() {
            try {
                window.sessionStorage.setItem(chatGreetingSeenKey, '1');
            } catch (error) {
                // Ignore session storage issues.
            }
        }

        function hasSeenGreeting() {
            try {
                return window.sessionStorage.getItem(chatGreetingSeenKey) === '1';
            } catch (error) {
                return false;
            }
        }

        function showWelcomeSequence() {
            if (messageHistory.length || hasSeenGreeting() || isWelcomeTyping) {
                return;
            }

            isWelcomeTyping = true;
            markGreetingSeen();
            typeBotMessage(chatText.welcomeTyped || chatText.intro, chatText.quickActions, 14)
                .then(() => {
                    renderQuickReplies(chatText.quickActions);
                })
                .finally(() => {
                    isWelcomeTyping = false;
                });
        }

        function ensureInitialChatContent() {
            if (messageHistory.length || isWelcomeTyping) {
                return;
            }

            if (hasSeenGreeting()) {
                addMessage('bot', chatText.welcomeTyped || chatText.intro, chatText.quickActions);
                renderQuickReplies(chatText.quickActions);
                return;
            }

            showWelcomeSequence();
        }

        function extractIntent(message) {
            const normalized = normalizeChatInput(message);
            let bestMatch = null;
            let bestScore = 0;

            knowledgeBase.forEach((entry) => {
                let score = 0;
                entry.keywords.forEach((keyword) => {
                    if (normalized.includes(normalizeChatInput(keyword))) {
                        score += keyword.length > 8 ? 3 : 2;
                    }
                });

                if (score > bestScore) {
                    bestScore = score;
                    bestMatch = entry.intent;
                }
            });

            if (/(solicita oferta|cer oferta|cere oferta|vreau oferta|vreau o oferta|oferta personalizata|trimite oferta|request quote|quote request|запросить предложение|хочу предложение|нужно предложение)/.test(normalized)) {
                return 'lead_offer';
            }

            if (/(sunati ma|vreau sa ma sune|contact consultant|apel|call me|suna ma|sunati|перезвоните|позвоните|свяжитесь)/.test(normalized)) {
                return 'lead_call';
            }

            if (/(pret|costa|cost|price|quote|цена|стоимость|сколько стоит)/.test(normalized)) {
                return 'price';
            }

            return bestMatch;
        }

        function getAnswerByIntent(intent) {
            if (!intent) {
                return {
                    text: chatText.fallback,
                    actions: chatText.actionsAfterAnswer
                };
            }

            if (intent === 'lead' || intent === 'lead_offer') {
                return {
                    text: isRussianPage
                        ? 'Чтобы подготовить подходящее предложение, мне нужны несколько базовых данных о проекте.'
                        : 'Ca sa pregatim o oferta potrivita, am nevoie de cateva date de baza despre proiect.',
                    actions: []
                };
            }

            if (intent === 'lead_call') {
                return {
                    text: isRussianPage
                        ? 'Оставьте данные, и консультант MoldAcoperis свяжется с вами по телефону в ближайшее время.'
                        : 'Lasa-ne datele si un consultant MoldAcoperis revine cu un apel in cel mai scurt timp.',
                    actions: []
                };
            }

            if (intent === 'products') {
                return {
                    text: isRussianPage
                        ? 'Putem discuta despre tigla metalica, tigla metalica modulara, sindrila bituminoasa, sistem de scurgere si accesorii. Spune-mi ce produs te intereseaza.'
                        : 'Putem discuta despre tigla metalica, tigla metalica modulara, sindrila bituminoasa, sistem de scurgere si accesorii. Spune-mi ce produs te intereseaza.',
                    actions: getProductActions()
                };
            }

            return {
                text: chatText.answers[intent] || chatText.fallback,
                actions: intent === 'price' || intent === 'contact'
                    ? chatText.actionsAfterAnswer
                    : getDefaultAnswerActions()
            };
        }

        function startLeadFlow(reason, sourceText) {
            leadFlow = {
                step: 'collecting',
                reason: reason || chatText.leadReason,
                sourceText: sourceText || '',
                data: {}
            };
            saveLeadFlow();
            addMessage('bot', chatText.askLeadCompact);
        }

        function getLeadReasonByIntent(intent) {
            if (intent === 'lead_call') {
                return isRussianPage ? 'Запрос обратного звонка из чата' : 'Solicitare apel din chat';
            }

            if (intent === 'lead_offer' || intent === 'price') {
                return isRussianPage ? 'Запрос предложения из чата' : 'Solicitare oferta din chat';
            }

            return chatText.leadReason;
        }

        function getTopicLabel(intent, userText) {
            const map = {
                price: isRussianPage ? 'pret si oferta' : 'pret si oferta',
                modular: isRussianPage ? 'tigla metalica modulara' : 'tigla metalica modulara',
                metal: isRussianPage ? 'tigla metalica' : 'tigla metalica',
                shingle: isRussianPage ? 'sindrila bituminoasa' : 'sindrila bituminoasa',
                products: isRussianPage ? 'produse pentru acoperis' : 'produse pentru acoperis',
                drainage: isRussianPage ? 'sistem de scurgere' : 'sistem de scurgere',
                accessories: isRussianPage ? 'accesorii acoperis' : 'accesorii acoperis',
                install: isRussianPage ? 'krovlya pod klyuch' : 'acoperis complet',
                repair: isRussianPage ? 'reparatii acoperis' : 'reparatii acoperis',
                warranty: isRussianPage ? 'garantie acoperis' : 'garantie acoperis',
                contact: isRussianPage ? 'contact MoldAcoperis' : 'contact MoldAcoperis',
                calculator: isRussianPage ? 'calculator acoperis' : 'calculator acoperis',
                lead_offer: isRussianPage ? 'solicitare oferta' : 'solicitare oferta',
                lead_call: isRussianPage ? 'solicitare apel' : 'solicitare apel'
            };

            return map[intent] || String(userText || '').trim();
        }

        function looksLikePhone(value) {
            const digits = String(value || '').replace(/\D/g, '');
            return digits.length >= 8;
        }

        function extractLeadPayloadFromText(rawText) {
            const text = String(rawText || '').trim();
            if (!text) {
                return null;
            }

            const phoneMatch = text.match(/(\+?\d[\d\s()-]{7,}\d)/);
            if (!phoneMatch) {
                return null;
            }

            const phone = phoneMatch[1].trim();
            const segments = text
                .split(/[\n,;]+/)
                .map((segment) => segment.trim())
                .filter(Boolean);

            const nonPhoneSegments = segments.filter((segment) => !segment.includes(phone));
            let name = nonPhoneSegments[0] || '';
            let location = nonPhoneSegments[1] || '';
            let roofType = nonPhoneSegments.slice(2).join(', ');

            if (!name) {
                const beforePhone = text.slice(0, phoneMatch.index).split(/[\n,;]+/).map((segment) => segment.trim()).filter(Boolean);
                name = beforePhone.pop() || '';
            }

            if (!location || !roofType) {
                const afterPhone = text.slice(phoneMatch.index + phone.length)
                    .split(/[\n,;]+/)
                    .map((segment) => segment.trim())
                    .filter(Boolean);

                if (!location) {
                    location = afterPhone[0] || location;
                }

                if (!roofType) {
                    roofType = afterPhone.slice(location ? 1 : 0).join(', ') || roofType;
                }
            }

            if (!name || !location || !roofType || !looksLikePhone(phone)) {
                return null;
            }

            return {
                name,
                phone,
                location,
                roofType
            };
        }

        function looksLikeGeneralQuestion(rawText) {
            const text = String(rawText || '').trim();
            const normalized = normalizeChatInput(text);

            if (!normalized) {
                return false;
            }

            if (text.includes('?')) {
                return true;
            }

            return /^(ce|cum|care|cat|unde|cand|de ce|pot|puteti|vreau|ma intereseaza|what|how|where|can|do you|как|где|когда|почему|можете|хочу|интересует)/.test(normalized);
        }

        function looksLikeAccidentalShortReply(rawText) {
            const text = String(rawText || '').trim();
            const normalized = normalizeChatInput(text);

            if (!normalized) {
                return true;
            }

            const tokens = normalized.split(' ').filter(Boolean);
            return text.length <= 2 || (tokens.length <= 1 && normalized.length <= 3);
        }

        function aiReplyRequestsLead(replyText) {
            const normalizedReply = normalizeChatInput(replyText);
            const asksForFields = ['nume', 'telefon', 'localitate', 'acoperis', 'produs'].filter((token) => normalizedReply.includes(token)).length >= 3
                || ['имя', 'телефон', 'населенныи', 'кровл', 'продукт'].filter((token) => normalizedReply.includes(token)).length >= 3;
            const asksToLeaveDetails = /(lasa|lasati|scrie|trimite|te rog|completeaza|остав|укаж|напиш)/.test(normalizedReply);
            return asksForFields && asksToLeaveDetails;
        }

        async function submitLeadFromChat() {
            addMessage('bot', chatText.sendingLead);

            try {
                await submitOfferRequest({
                    source: 'site-chatbot',
                    language: isRussianPage ? 'ru' : 'ro',
                    pageUrl: window.location.href,
                    pagePath: window.location.pathname,
                    submittedAt: new Date().toISOString(),
                    lead: {
                        name: leadFlow.data.name,
                        phone: leadFlow.data.phone,
                        location: leadFlow.data.location || '',
                        interest: leadFlow.data.roofType || ''
                    },
                    message: [
                        `Motiv: ${leadFlow.reason || chatText.leadReason}`,
                        `Localitate: ${leadFlow.data.location || '-'}`,
                        `Tip acoperis / interes: ${leadFlow.data.roofType || '-'}`,
                        leadFlow.sourceText ? `Mesaj initial: ${leadFlow.sourceText}` : ''
                    ].filter(Boolean).join('\n'),
                    estimateSummary: ''
                });

                addMessage('bot', chatText.leadSuccess, getLeadSuccessActions());
                leadFlow = null;
                saveLeadFlow();
                return true;
            } catch (error) {
                console.error('Chatbot lead webhook error:', error);
                addMessage('bot', chatText.leadError, getLeadErrorActions());
                return false;
            }
        }

        async function handleLeadStep(userText) {
            if (!leadFlow) {
                return false;
            }

            if (leadFlow.step === 'collecting') {
                const parsedLead = extractLeadPayloadFromText(userText);
                if (parsedLead) {
                    leadFlow.data = parsedLead;
                    saveLeadFlow();
                    await submitLeadFromChat();
                    return true;
                }

                if (looksLikeGeneralQuestion(userText)) {
                    leadFlow = null;
                    saveLeadFlow();
                    return false;
                }

                if (looksLikeAccidentalShortReply(userText)) {
                    addMessage('bot', chatText.leadFormShortHint || chatText.leadFormInvalid);
                    return true;
                }

                addMessage('bot', chatText.leadFormInvalid);
                return true;
            }

            if (leadFlow.step === 'name') {
                leadFlow.data.name = userText;
                leadFlow.step = 'phone';
                saveLeadFlow();
                addMessage('bot', chatText.askPhone);
                return true;
            }

            if (leadFlow.step === 'phone') {
                if (!looksLikePhone(userText)) {
                    addMessage('bot', chatText.invalidPhone);
                    return true;
                }

                leadFlow.data.phone = userText;
                leadFlow.step = 'location';
                saveLeadFlow();
                addMessage('bot', chatText.askLocation);
                return true;
            }

            if (leadFlow.step === 'location') {
                leadFlow.data.location = userText;
                leadFlow.step = 'roofType';
                saveLeadFlow();
                addMessage('bot', chatText.askRoofType);
                return true;
            }

            if (leadFlow.step === 'roofType') {
                leadFlow.data.roofType = userText;
                saveLeadFlow();
                await submitLeadFromChat();
                return true;
            }

            return false;
        }

        async function requestAiReply(userText, topicContext) {
            const candidateEndpoints = [];

            if (chatApiEndpoint) {
                candidateEndpoints.push(chatApiEndpoint);
            }

            if (!candidateEndpoints.length) {
                throw new Error('Missing chat API endpoint');
            }

            const historyPayload = messageHistory
                .slice(-10)
                .map((entry) => ({
                    role: entry.role === 'bot' ? 'assistant' : 'user',
                    text: entry.text
                }));

            let lastError = null;

            for (const endpoint of candidateEndpoints) {
                try {
                    const response = await fetch(endpoint, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            language: isRussianPage ? 'ru' : 'ro',
                            pagePath: window.location.pathname,
                            pageUrl: window.location.href,
                            topic: topicContext || '',
                            message: userText,
                            history: historyPayload
                        })
                    });

                    const data = await response.json().catch(() => ({}));
                    if (!response.ok || !data.reply) {
                        throw new Error((data && data.error) || `Chat API failed with ${response.status}`);
                    }

                    return String(data.reply || '').trim();
                } catch (error) {
                    lastError = error;
                }
            }

            throw lastError || new Error('Chat API unavailable');
        }

        async function answerMessage(userText, forcedIntent) {
            if (!userText) {
                return;
            }

            if (forcedIntent && leadFlow && leadFlow.step === 'collecting') {
                leadFlow = null;
                saveLeadFlow();
            }

            addMessage('user', userText);

            if (await handleLeadStep(userText)) {
                return;
            }

            const normalized = normalizeChatInput(userText);
            const quickIntent = forcedIntent || quickActionMap[normalized] || extractIntent(userText);

            if (!forcedIntent) {
                const directLeadPayload = extractLeadPayloadFromText(userText);
                if (directLeadPayload) {
                    leadFlow = {
                        step: 'collecting',
                        reason: getLeadReasonByIntent(quickIntent),
                        sourceText: userText,
                        data: directLeadPayload
                    };
                    saveLeadFlow();
                    await submitLeadFromChat();
                    return;
                }
            }

            if (forcedIntent && quickIntent && !String(quickIntent).startsWith('lead')) {
                setActiveTopic(getTopicLabel(quickIntent, userText));
            }

            if (quickIntent === 'lead' || quickIntent === 'lead_offer' || quickIntent === 'lead_call') {
                const leadIntro = getAnswerByIntent(quickIntent);
                if (leadIntro && leadIntro.text) {
                    addMessage('bot', leadIntro.text, leadIntro.actions);
                }
                startLeadFlow(getLeadReasonByIntent(quickIntent), userText);
                return;
            }

            if (quickIntent === 'products') {
                const productsAnswer = getAnswerByIntent('products');
                addMessage('bot', productsAnswer.text, productsAnswer.actions);
                return;
            }

            if (forcedIntent) {
                const forcedAnswer = getAnswerByIntent(quickIntent);
                addMessage('bot', forcedAnswer.text, forcedAnswer.actions);
                return;
            }

            try {
                const aiReply = await requestAiReply(userText, activeTopic);
                if (aiReply) {
                    setChatMode('ai');
                    addMessage('bot', aiReply, quickIntent === 'price' || quickIntent === 'contact' ? chatText.actionsAfterAnswer : []);
                    if (aiReplyRequestsLead(aiReply)) {
                        leadFlow = {
                            step: 'collecting',
                            reason: chatText.leadReason,
                            sourceText: userText,
                            data: (leadFlow && leadFlow.data) || {}
                        };
                        saveLeadFlow();
                    }
                    return;
                }
            } catch (error) {
                setChatMode('offline');
                console.warn('Chat API unavailable, using local fallback:', error);
            }

            const answer = getAnswerByIntent(quickIntent);
            addMessage('bot', answer.text, answer.actions);
        }

        toggleButton.addEventListener('click', () => {
            if (isOpen) {
                closeChat();
            } else {
                openChat();
                ensureInitialChatContent();
            }
        });

        teaserCloseButton.addEventListener('click', (event) => {
            event.stopPropagation();
            hideChatTeaser(true);
        });

        teaserCtaButton.addEventListener('click', (event) => {
            event.stopPropagation();
            openChat();
            ensureInitialChatContent();
        });

        closeButton.addEventListener('click', closeChat);

        chatRoot.addEventListener('click', (event) => {
            const promptButton = event.target.closest('[data-prompt], [data-action]');
            if (!promptButton) {
                return;
            }

            const action = promptButton.getAttribute('data-action');
            const prompt = promptButton.getAttribute('data-prompt');
            if (action || prompt) {
                answerMessage(prompt || action, action || undefined);
            }
        });

        formEl.addEventListener('submit', async (event) => {
            event.preventDefault();
            const userText = String(inputEl.value || '').trim();
            if (!userText) {
                return;
            }

            inputEl.value = '';
            await answerMessage(userText);
        });

        renderQuickReplies(chatText.quickActions);
        hydrateMessages();
        setChatMode('unknown');
        if (leadFlow) {
            if (leadFlow.step === 'collecting') {
                addMessage('bot', chatText.askLeadCompact);
            }
            openChat();
        } else {
            scheduleChatTeaser();
        }
    }

    let supportWidgetsInitialized = false;

    const initSupportWidgets = () => {
        if (supportWidgetsInitialized) return;
        supportWidgetsInitialized = true;

        if (supportWidgetFeatures.messengers) {
            buildFloatingMessengers();
        }

        if (supportWidgetFeatures.chatbot) {
            buildSiteChatbot();
        }
    };

    const initSupportWidgetsFeature = () => {
        if (!supportWidgetFeatures.messengers && !supportWidgetFeatures.chatbot) {
            return;
        }

        const supportWidgetTriggerEvents = ['pointerdown', 'touchstart', 'keydown', 'scroll'];
        const detachSupportWidgetTriggers = [];

        const triggerSupportWidgets = () => {
            detachSupportWidgetTriggers.splice(0).forEach((detach) => detach());
            initSupportWidgets();
        };

        const scheduleSupportWidgets = () => {
            if ('requestIdleCallback' in window) {
                const idleId = window.requestIdleCallback(triggerSupportWidgets, { timeout: 1800 });
                detachSupportWidgetTriggers.push(() => window.cancelIdleCallback(idleId));
                return;
            }

            const timeoutId = window.setTimeout(triggerSupportWidgets, 900);
            detachSupportWidgetTriggers.push(() => window.clearTimeout(timeoutId));
        };

        supportWidgetTriggerEvents.forEach((eventName) => {
            const handler = () => {
                triggerSupportWidgets();
            };
            window.addEventListener(eventName, handler, { once: true, passive: true });
            detachSupportWidgetTriggers.push(() => window.removeEventListener(eventName, handler));
        });

        scheduleSupportWidgets();
    };

    initSupportWidgetsFeature();
});
