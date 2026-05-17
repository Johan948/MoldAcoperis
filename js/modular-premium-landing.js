(function () {
    function ready(callback) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callback, { once: true });
            return;
        }
        callback();
    }

    ready(function () {
        const root = document.querySelector('.product-modular-launch-page');
        if (!root) return;

        const isRussianLocale = document.documentElement.lang === 'ru';
        const modelTabs = Array.from(document.querySelectorAll('[data-model-tab]'));
        const modelPanels = Array.from(document.querySelectorAll('[data-model-panel]'));

        let activeModelName = null;

        function activateModel(modelName) {
            if (!modelName || modelName === activeModelName) return;
            activeModelName = modelName;

            modelTabs.forEach((tab) => {
                const isActive = tab.dataset.modelTab === modelName;
                tab.classList.toggle('is-active', isActive);
                tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
                tab.setAttribute('tabindex', isActive ? '0' : '-1');
            });

            modelPanels.forEach((panel) => {
                const isActive = panel.dataset.modelPanel === modelName;
                panel.classList.toggle('is-active', isActive);
                panel.hidden = !isActive;
            });
        }

        function preloadHiddenModelImages() {
            modelPanels.forEach((panel) => {
                if (!panel.hidden) return;

                panel.querySelectorAll('img[src]').forEach((img) => {
                    const source = img.currentSrc || img.getAttribute('src');
                    if (!source) return;

                    const preloaded = new Image();
                    preloaded.decoding = 'async';
                    preloaded.src = source;
                    if (typeof preloaded.decode === 'function') {
                        preloaded.decode().catch(() => {});
                    }
                });
            });
        }

        function initModularImageLightbox() {
            const images = Array.from(document.querySelectorAll('.modular-landing-hero__card img, .modular-models__media img, .modular-gallery__item img'));
            if (!images.length) return;

            const labels = isRussianLocale
                ? {
                    close: 'Закрыть изображение',
                    open: 'Увеличить',
                    fallbackTitle: 'Модульная металлочерепица',
                }
                : {
                    close: 'Închide imaginea',
                    open: 'Mărește',
                    fallbackTitle: 'Țiglă metalică modulară',
                };

            const lightbox = document.createElement('div');
            lightbox.className = 'modular-image-lightbox';
            lightbox.setAttribute('aria-hidden', 'true');
            lightbox.innerHTML = [
                '<div class="modular-image-lightbox__dialog" role="dialog" aria-modal="true" aria-label="' + labels.fallbackTitle + '">',
                '<button class="modular-image-lightbox__close" type="button" aria-label="' + labels.close + '"><i class="fas fa-times"></i></button>',
                '<figure class="modular-image-lightbox__figure">',
                '<img class="modular-image-lightbox__image" src="" alt="" decoding="async">',
                '<figcaption class="modular-image-lightbox__caption"></figcaption>',
                '</figure>',
                '</div>',
            ].join('');
            document.body.appendChild(lightbox);

            const dialog = lightbox.querySelector('.modular-image-lightbox__dialog');
            const preview = lightbox.querySelector('.modular-image-lightbox__image');
            const caption = lightbox.querySelector('.modular-image-lightbox__caption');
            const closeButton = lightbox.querySelector('.modular-image-lightbox__close');
            let activeTrigger = null;

            function getImageTitle(img) {
                const modelTitle = img.closest('[data-model-panel]')?.querySelector('.modular-models__content h3')?.textContent?.trim();
                const heroTitle = img.closest('.modular-landing-hero__card')?.querySelector('.modular-landing-hero__card-meta strong')?.textContent?.trim();
                const galleryTitle = img.closest('.modular-gallery__project')?.querySelector('.modular-gallery__project-copy h3')?.textContent?.trim();
                return modelTitle || heroTitle || galleryTitle || img.getAttribute('alt') || labels.fallbackTitle;
            }

            function openLightbox(img) {
                const source = img.currentSrc || img.getAttribute('src');
                if (!source) return;

                activeTrigger = img;
                const title = getImageTitle(img);
                preview.src = source;
                preview.alt = img.getAttribute('alt') || title;
                caption.textContent = title;
                dialog.setAttribute('aria-label', title);
                lightbox.classList.add('is-active');
                lightbox.setAttribute('aria-hidden', 'false');
                document.body.classList.add('modular-lightbox-open');
                closeButton.focus({ preventScroll: true });
            }

            function closeLightbox() {
                lightbox.classList.remove('is-active');
                lightbox.setAttribute('aria-hidden', 'true');
                document.body.classList.remove('modular-lightbox-open');
                preview.removeAttribute('src');
                if (activeTrigger) {
                    activeTrigger.focus({ preventScroll: true });
                    activeTrigger = null;
                }
            }

            images.forEach((img) => {
                const frame = img.closest('.modular-models__media, .modular-landing-hero__card, .modular-gallery__item');
                const trigger = frame || img;
                if (frame) {
                    frame.classList.add('has-modular-lightbox');
                    frame.setAttribute('data-modular-lightbox-label', labels.open);
                }

                trigger.setAttribute('role', 'button');
                trigger.setAttribute('tabindex', '0');
                trigger.setAttribute('aria-label', labels.open + ': ' + getImageTitle(img));

                trigger.addEventListener('click', () => openLightbox(img));
                trigger.addEventListener('keydown', (event) => {
                    if (!['Enter', ' '].includes(event.key)) return;
                    event.preventDefault();
                    openLightbox(img);
                });
            });

            closeButton.addEventListener('click', closeLightbox);
            lightbox.addEventListener('click', (event) => {
                if (event.target === lightbox) {
                    closeLightbox();
                }
            });
            document.addEventListener('keydown', (event) => {
                if (event.key === 'Escape' && lightbox.classList.contains('is-active')) {
                    closeLightbox();
                }
            });
        }

        modelTabs.forEach((tab) => {
            tab.addEventListener('click', () => activateModel(tab.dataset.modelTab));
            tab.addEventListener('keydown', (event) => {
                if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
                event.preventDefault();

                const currentIndex = modelTabs.indexOf(tab);
                let nextIndex = currentIndex;

                if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % modelTabs.length;
                if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + modelTabs.length) % modelTabs.length;
                if (event.key === 'Home') nextIndex = 0;
                if (event.key === 'End') nextIndex = modelTabs.length - 1;

                modelTabs[nextIndex].focus();
                activateModel(modelTabs[nextIndex].dataset.modelTab);
            });
        });

        if (modelTabs.length && modelPanels.length) {
            const initialModel = (modelTabs.find((tab) => tab.classList.contains('is-active')) || modelTabs[0]).dataset.modelTab;
            activateModel(initialModel);

            if ('requestIdleCallback' in window) {
                window.requestIdleCallback(preloadHiddenModelImages, { timeout: 1200 });
            } else {
                window.setTimeout(preloadHiddenModelImages, 300);
            }
        }

        initModularImageLightbox();

        const leadForm = document.getElementById('modularLeadForm');
        const modal = document.getElementById('ofertaModal');
        const modalSummary = document.getElementById('modalSummary');
        const modalName = document.getElementById('ofertaNume');
        const modalPhone = document.getElementById('ofertaTel');
        const modalForm = document.getElementById('ofertaForm');
        const modalSuccess = document.getElementById('modalSuccess');
        const openModalTrigger = document.querySelector('.js-open-modal');

        function openOfferModal() {
            if (!modal) return;
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        function resetModalState() {
            if (modalForm) {
                modalForm.style.display = '';
            }
            if (modalSuccess) {
                modalSuccess.classList.remove('show');
                modalSuccess.classList.remove('is-error');
            }
        }

        function injectLeadSummary(formData) {
            if (!modalSummary) return;

            const localitate = String(formData.get('localitate') || '').trim();

            const rows = [];
            if (localitate) {
                rows.push('<span>Localitate: <strong>' + localitate + '</strong></span>');
            }
            rows.push('<span>Interes: <strong>Tigla metalica modulara premium</strong></span>');

            modalSummary.innerHTML = rows.join('');
            modalSummary.classList.toggle('has-data', rows.length > 0);
        }

        if (leadForm) {
            leadForm.addEventListener('submit', (event) => {
                event.preventDefault();

                const formData = new FormData(leadForm);
                const leadName = String(formData.get('nume') || '').trim();
                const leadPhone = String(formData.get('telefon') || '').trim();

                if (modalName) modalName.value = leadName;
                if (modalPhone) modalPhone.value = leadPhone;

                injectLeadSummary(formData);
                resetModalState();
                root.classList.add('is-lead-complete');

                if (modal) {
                    openOfferModal();
                } else if (openModalTrigger) {
                    openModalTrigger.click();
                }
            });
        }
    });
})();
