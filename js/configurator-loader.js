(function () {
    'use strict';

    const loaderScript = document.currentScript;
    if (!loaderScript) return;

    const targetSelector = loaderScript.dataset.target || '#configurator';
    const targetEl = document.querySelector(targetSelector);
    if (!targetEl) return;

    const scriptQueue = [
        loaderScript.dataset.three,
        loaderScript.dataset.controls,
        loaderScript.dataset.configurator
    ].filter(Boolean);

    if (!scriptQueue.length) return;

    let started = false;

    function loadScript(src) {
        return new Promise((resolve, reject) => {
            const existing = document.querySelector(`script[src="${src}"]`);
            if (existing) {
                if (existing.dataset.loaded === 'true') {
                    resolve();
                    return;
                }
                existing.addEventListener('load', () => resolve(), { once: true });
                existing.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)), { once: true });
                return;
            }

            const script = document.createElement('script');
            script.src = src;
            script.async = false;
            script.onload = () => {
                script.dataset.loaded = 'true';
                resolve();
            };
            script.onerror = () => reject(new Error(`Failed to load ${src}`));
            document.body.appendChild(script);
        });
    }

    async function startLoading() {
        if (started) return;
        started = true;

        targetEl.classList.add('cfg--lazy-loading');

        try {
            for (const src of scriptQueue) {
                await loadScript(src);
            }
            targetEl.classList.add('cfg--lazy-ready');
        } catch (error) {
            console.warn('Configurator lazy loader failed:', error);
            targetEl.classList.add('cfg--lazy-error');
        } finally {
            targetEl.classList.remove('cfg--lazy-loading');
        }
    }

    function shouldLoadImmediately() {
        const rect = targetEl.getBoundingClientRect();
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
        return window.location.hash === '#configurator' || rect.top < viewportHeight + 320;
    }

    function attachInteractionTriggers() {
        const eagerSelectors = [
            'a[href="/#configurator"]',
            'a[href="#configurator"]',
            '.cfg__panel',
            '.cfg__canvas-wrap',
            '.cfg__intro-card',
            '.js-open-modal'
        ];

        document.querySelectorAll(eagerSelectors.join(',')).forEach((node) => {
            ['pointerdown', 'touchstart', 'focusin', 'mouseenter'].forEach((eventName) => {
                node.addEventListener(eventName, startLoading, { once: true, passive: true });
            });
        });
    }

    if (shouldLoadImmediately()) {
        startLoading();
        return;
    }

    attachInteractionTriggers();

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            if (entries.some((entry) => entry.isIntersecting)) {
                observer.disconnect();
                startLoading();
            }
        }, {
            rootMargin: '350px 0px'
        });

        observer.observe(targetEl);
    } else {
        const onScroll = () => {
            if (shouldLoadImmediately()) {
                window.removeEventListener('scroll', onScroll);
                startLoading();
            }
        };

        window.addEventListener('scroll', onScroll, { passive: true });
    }
})();
