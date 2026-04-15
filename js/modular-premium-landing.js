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
