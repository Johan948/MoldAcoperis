(function () {
    'use strict';

    const isSandboxConfigurator = Boolean(document.getElementById('configuratorTest'));

    const canvasEl = document.getElementById('cfgCanvas');
    const wrapEl = document.getElementById('cfgCanvasWrap');
    const hintEl = document.getElementById('cfgCanvasHint');
    const shapeBtns = document.querySelectorAll('.cfg__shape-btn');
    const colorBtns = document.querySelectorAll('.cfg__color-btn');
    const qualitySelect = document.getElementById('cfgQuality');
    const drainageSelect = document.getElementById('cfgDrainage');
    const qualityOffersEl = document.getElementById('cfgQualityOffers');
    const areaInput = document.getElementById('cfgArea');
    const panelEl = document.querySelector('.cfg__panel');
    const panelSections = document.querySelectorAll('.cfg__panel-section');
    const costEl = document.querySelector('.cfg__cost');
    const dimsResetBtn = document.getElementById('cfgDimsReset');
    const dimsNoteEl = document.getElementById('cfgDimsNote');
    const wingFieldEls = document.querySelectorAll('[data-wing-field]');
    const eaveOverhangInput = document.getElementById('cfgEaveOverhang');
    const eaveOverhangValueEl = document.getElementById('cfgEaveOverhangValue');
    const panelToggleBtns = document.querySelectorAll('[data-panel-toggle]');
    const shapeSummaryEl = document.getElementById('cfgShapeSummary');
    const dimsSummaryEl = document.getElementById('cfgDimsSummary');
    const materialSummaryEl = document.getElementById('cfgMaterialSummary');
    const colorSummaryEl = document.getElementById('cfgColorSummary');
    const drainageSummaryEl = document.getElementById('cfgDrainageSummary');
    const costSummaryEl = document.getElementById('cfgCostSummary');
    const colorPaletteEl = document.getElementById('cfgColorPalette');
    const colorCurrentEl = document.getElementById('cfgColorCurrent');
    const costNoteEl = document.querySelector('.cfg__cost-note');

    const dimensionInputs = {
        mainWidth: document.getElementById('cfgMainWidth'),
        mainDepth: document.getElementById('cfgMainDepth'),
        wingWidth: document.getElementById('cfgWingWidth'),
        wingDepth: document.getElementById('cfgWingDepth')
    };

    const dimensionValueEls = {
        mainWidth: document.getElementById('cfgMainWidthValue'),
        mainDepth: document.getElementById('cfgMainDepthValue'),
        wingWidth: document.getElementById('cfgWingWidthValue'),
        wingDepth: document.getElementById('cfgWingDepthValue')
    };

    if (!canvasEl || !wrapEl) return;

    const isRussianLocale = document.documentElement.lang === 'ru';
    const numberLocale = isRussianLocale ? 'ru-RU' : 'ro-RO';
    const offerTexts = isRussianLocale
        ? {
            material: 'Материал',
            labor: 'Монтаж',
            drainage: 'Водосток',
            drainageRates: 'Тарифы водостока: дополнительный каталог из эталонного симулятора',
            noteBitumen: 'Включает автоматическую смету для битумной черепицы, монтаж и водосток',
            noteModular: 'Включает модульную черепицу, металлические аксессуары по геометрии, монтаж и водосток',
            noteGeneric: 'Включает материал, монтаж и выбранную водосточную систему',
            currency: 'лей'
        }
        : {
            material: 'Material',
            labor: 'Manopera',
            drainage: 'Scurgere',
            drainageRates: 'Tarife scurgere: catalog extras din simulatorul de referință',
            noteBitumen: 'Include devizul automat pentru șindrilă, manopera și scurgere',
            noteModular: 'Include modulara, accesorii metalice deduse din geometrie, manopera și scurgere',
            noteGeneric: 'Include materialul, manopera și sistemul de scurgere selectat',
            currency: 'lei'
        };

    const defaultShapeDimensions = {
        rect: {
            mainWidth: 8.6,
            mainDepth: 5,
            wingWidth: 4.2,
            wingDepth: 8.2
        },
        'l-shape': {
            mainWidth: 8.3,
            mainDepth: 4.4,
            wingWidth: 4.2,
            wingDepth: 8.2
        },
        't-shape': {
            mainWidth: 8.8,
            mainDepth: 4.2,
            wingWidth: 4.25,
            wingDepth: 8.2
        }
    };

    const shapeDimensionState = {
        rect: { ...defaultShapeDimensions.rect },
        'l-shape': { ...defaultShapeDimensions['l-shape'] },
        't-shape': { ...defaultShapeDimensions['t-shape'] }
    };

    let scene;
    let camera;
    let renderer;
    let controls;
    let ambientLight;
    let sunLight;
    let fillLight;
    let hemiLight;
    let houseGroup;
    let groundGroup;
    let drainagePreviewGroup = null;
    let fallbackCtx = null;
    let useFallbackRenderer = false;
    let roofMeshes = [];
    let drainagePreviewState = null;
    let weatherAudioState = null;
    let weatherNoiseBuffer = null;

    let currentShapeType = 'rect';
    let currentShapeLabel = 'Casă simplă';
    let currentRoofType = 'gable';
    let currentRoofLabel = '2 pante';
    let currentColor = '#383E42';
    let currentColorLabel = 'Antracit premium';
    let currentMaterialType = 'metal-modular';
    let currentPrice = 159;
    let currentManopera = 120;
    let currentName = 'Țiglă Modulară';
    let currentQualityKey = 'standart';
    let currentDrainageKey = 'none';
    let currentDrainageLabel = 'Fără sistem de scurgere';
    let currentShapeComplexity = 1;
    let currentRoofComplexity = 1;
    let currentEaveOverhang = eaveOverhangInput ? (parseFloat(eaveOverhangInput.value) || 0.48) : 0.48;
    let guidedPanelFlowActive = true;
    let activeMobilePanelKey = 'shape';
    let mobileStepperEl = null;
    const DRAINAGE_PREVIEW_DURATION = 5000;
    const DEFAULT_SCENE_BG = 0xf4f3f1;
    const PREVIEW_SCENE_BG = 0xd7dde2;
    const DEFAULT_FOG = 0xf4f3f1;
    const PREVIEW_FOG = 0xc6cfd8;

    const roofReferenceSources = {
        'metal-modular': 'images/products/tigla_modualra/Elegant Voestalpine 0,53 7016.jpg',
        'bitumen-shingle': 'images/products/sindrila_bituminoasa/sindrila_bituminoasa_cambridge_xtreme.png'
    };

    const qualityColorPalettes = {
        'metal-modular': {
            vip: [
                { hex: '#383e42', label: 'Antracit premium', code: 'RAL 7016' },
                { hex: '#2f2a29', label: 'Maro inchis', code: 'RAL 8019' },
                { hex: '#4a2d20', label: 'Maro ciocolatiu', code: 'RAL 8017' }
            ],
            premium: [
                { hex: '#383e42', label: 'Antracit premium', code: 'RAL 7016' },
                { hex: '#9b5b3d', label: 'Teracota', code: 'RAL 8004' },
                { hex: '#4a2d20', label: 'Maro ciocolatiu', code: 'RAL 8017' },
                { hex: '#2f2a29', label: 'Maro inchis', code: 'RAL 8019' }
            ],
            standart: [
                { hex: '#383e42', label: 'Antracit premium', code: 'RAL 7016' },
                { hex: '#4a2d20', label: 'Maro ciocolatiu', code: 'RAL 8017' },
                { hex: '#2f2a29', label: 'Maro inchis', code: 'RAL 8019' }
            ]
        },
        'bitumen-shingle': {
            vip: [
                { hex: '#6e4f38', label: 'Maro de toamna', code: 'Autumn Brown' },
                { hex: '#7a7f85', label: 'Ardezie gri', code: 'Slate Grey' },
                { hex: '#3a2d25', label: 'Maro inchis', code: 'Dark Brown' },
                { hex: '#4b5057', label: 'Gri grafit', code: 'Graphite' },
                { hex: '#2a2b2e', label: 'Negru antracit', code: 'Anthracite' },
                { hex: '#7b4634', label: 'Maro rosiatic', code: 'Rust Brown' },
                { hex: '#8d8780', label: 'Gri natural', code: 'Natural Slate' }
            ],
            premium: [
                { hex: '#6f7378', label: 'Harvard Slate', code: 'gri ardezie' },
                { hex: '#7c3f33', label: 'Maro caramiziu', code: 'Brick Brown' },
                { hex: '#40454b', label: 'Gri inchis', code: 'Dark Grey' },
                { hex: '#33373d', label: 'Gri antracit', code: 'Anthracite Grey' },
                { hex: '#222528', label: 'Negru grafit', code: 'Graphite Black' },
                { hex: '#5b4335', label: 'Maro natural', code: 'Natural Brown' },
                { hex: '#5e3f32', label: 'Maro castaniu', code: 'Chestnut Brown' }
            ],
            standart: [
                { hex: '#24272a', label: 'Negru grafit', code: 'Graphite Black' },
                { hex: '#72767a', label: 'Gri ardezie', code: 'Slate Grey' },
                { hex: '#5a4334', label: 'Maro natural', code: 'Natural Brown' },
                { hex: '#7f3b32', label: 'Rosu caramiziu', code: 'Brick Red' },
                { hex: '#2f4336', label: 'Verde inchis', code: 'Dark Green' },
                { hex: '#4a3328', label: 'Maro ciocolatiu', code: 'Chocolate Brown' },
                { hex: '#363a40', label: 'Gri antracit', code: 'Anthracite Grey' }
            ]
        }
    };

    const defaultProductColors = {
        'metal-modular': '#383e42',
        'bitumen-shingle': '#24272a'
    };

    const materialQualityOptions = {
        'bitumen-shingle': [
            { key: 'vip', label: 'VIP (Cambridge Xtreme)', price: 375, discount: 0 },
            { key: 'premium', label: 'Premium (Cambridge Xpress)', price: 345, discount: 0 },
            { key: 'standart', label: 'Standart (Katepal)', price: 330, discount: 0 }
        ],
        'metal-modular': [
            { key: 'vip', label: 'VIP (Voestalpine)', price: 250, discount: 0 },
            { key: 'premium', label: 'Premium (Arcelor Mittal)', price: 220, discount: 0 },
            { key: 'standart', label: 'Standart (SeAH)', price: 159, discount: 0 }
        ]
    };

    const BITUMEN_ESTIMATE_FACTORS = {
        shinglesCoverage: 1.025,
        underlaymentCoverage: 1.15,
        diffusionCoverage: 1.1,
        nailsCoverage: 16,
        battenCoverage: 7,
        aeratorCoverage: 35,
        osbSheetArea: 3.125,
        extraOsbSheets: 2,
        gutterTrimAllowance: 2
    };

    const BITUMEN_PRICING = {
        starterStrip: { label: 'Starter strip', unitPrice: { vip: 375, premium: 345, standart: 330 }, discount: 0, unit: 'ml' },
        ridgeCaps: { label: 'Coama Superglass 3TAB', unitPrice: { vip: 295, premium: 295, standart: 330 }, discount: 0, unit: 'ml' },
        underlayment: { label: 'Membrana sub sindrila', unitPrice: { vip: 105, premium: 105, standart: 82 }, discount: 0, unit: 'mp' },
        diffusionMembrane: { label: 'Membrana de difuzie', unitPrice: { vip: 19.5, premium: 17.5, standart: 15 }, discount: 0, unit: 'mp' },
        nails: { label: 'Cuie inelata / striata 3,0x30 zincat', unitPrice: 120, discount: 0, unit: 'kg' },
        plasticBatten: { label: 'Bat de plastic 310 m/l', unitPrice: { vip: 110, premium: 110, standart: 95 }, discount: 0, unit: 'buc' },
        aerator: { label: 'Aerator special / ECO copertina', unitPrice: 320, discount: 0, unit: 'buc' },
        osb12: { label: 'OSB 3 12 mm', unitPrice: { vip: 305, premium: 305, standart: 295 }, discount: 0, unit: 'foi' },
        gutterTrim: { label: 'Regleta jgheab sindrila B125', unitPrice: { vip: 124, premium: 94, standart: 84 }, discount: 0, unit: 'ml' },
        frontonTrim: { label: 'Bordura fronton RF', unitPrice: { vip: 144, premium: 124, standart: 114 }, discount: 0, unit: 'ml' }
    };

    const MODULAR_ESTIMATE_FACTORS = {
        diffusionMembrane: 1.1,
        screws35PerSquareMeter: 8,
        ridgeTapeRollLength: 5,
        frontonAllowance: 2,
        gutterAllowance: 2,
        eaveCombPerMeter: 1
    };

    const MODULAR_PRICING = {
        ridge: { label: 'Coama modulara / semicirculara B312', unitPrice: { vip: 189, premium: 160, standart: 149 }, discount: 0, unit: 'ml' },
        ridgeCap: { label: 'Capac coama modulara / semicirculara', unitPrice: { vip: 189, premium: 160, standart: 144 }, discount: 0, unit: 'buc' },
        frontonTrim: { label: 'Bordura fronton dreapta / decorativa B250', unitPrice: { vip: 177, premium: 149, standart: 144 }, discount: 0, unit: 'ml' },
        dripEdge: { label: 'Picurator B70', unitPrice: { vip: 44, premium: 35, standart: 35 }, discount: 0, unit: 'ml' },
        gutterTrim: { label: 'Regleta jgheab tigla B178', unitPrice: { vip: 124, premium: 105, standart: 89 }, discount: 0, unit: 'ml' },
        innerValley: { label: 'Dolie interioara B625', unitPrice: { vip: 175, premium: 175, standart: 175 }, discount: 0, unit: 'ml' },
        diffusionMembrane: { label: 'Membrana de difuzie', unitPrice: { vip: 19.5, premium: 17.5, standart: 15 }, discount: 0, unit: 'mp' },
        ridgeTape: { label: 'Lenta coama 180 mm x 5 m', unitPrice: { vip: 279, premium: 279, standart: 279 }, discount: 0, unit: 'buc' },
        eaveComb: { label: 'Pieptene streașină', unitPrice: { vip: 57, premium: 57, standart: 57 }, discount: 0, unit: 'buc' },
        ventilationGrid: { label: 'Grilă ventilare streașină plastic / metal', unitPrice: { vip: 59, premium: 59, standart: 45 }, discount: 0, unit: 'ml' },
        screws35: { label: 'Suruburi 35 mm', unitPrice: { vip: 1.15, premium: 1.15, standart: 1.15 }, discount: 0, unit: 'buc' }
    };

    const DRAINAGE_RULES = {
        gutterPieceLength: 3,
        downpipePieceLength: 3,
        extensionPieceLength: 1,
        hookSpacing: 0.85,
        clampSpacing: 1.5,
        maxGutterPerDownspout: 12,
        downpipeOffset: 0.42,
        gutterOutset: 0.02,
        gutterDrop: 0.1,
        wallClearance: 0.025,
        outletDrop: 0.18,
        dischargeReach: 0.18
    };

    const DRAINAGE_BASE_PRODUCTS = {
        gutter: {
            code: 'JG',
            label: 'Jgheab L3m',
            unit: 'buc',
            unitPrice: 360,
            discount: 0
        },
        gutterHook: {
            code: 'CI',
            label: 'Cirlig jgheab',
            unit: 'buc',
            unitPrice: 84,
            discount: 0
        },
        gutterConnector: {
            code: 'BJ',
            label: 'Bratara / conector jgheab',
            unit: 'buc',
            unitPrice: 84,
            discount: 0
        },
        endCap: {
            code: 'CU',
            label: 'Capac universal',
            unit: 'buc',
            unitPrice: 74,
            discount: 0
        },
        exteriorCorner: {
            code: 'KE',
            label: 'Koltar exterior 90',
            unit: 'buc',
            unitPrice: 397.5,
            discount: 0
        },
        interiorCorner: {
            code: 'KI',
            label: 'Koltar interior 90',
            unit: 'buc',
            unitPrice: 397.5,
            discount: 0
        },
        gutterOutlet: {
            code: 'RA',
            label: 'Racord jgheab',
            unit: 'buc',
            unitPrice: 187,
            discount: 0
        },
        downpipeElbow: {
            code: 'CB',
            label: 'Cot burlan',
            unit: 'buc',
            unitPrice: 184,
            discount: 0
        },
        downpipeExtension: {
            code: 'PB',
            label: 'Prelungitor burlan L1m',
            unit: 'buc',
            unitPrice: 139,
            discount: 0
        },
        downpipe: {
            code: 'BU',
            label: 'Burlan L3m',
            unit: 'buc',
            unitPrice: 406,
            discount: 0
        },
        downpipeClamp: {
            code: 'BB',
            label: 'Bratara burlan',
            unit: 'buc',
            unitPrice: 79,
            discount: 0
        },
        dischargeElbow: {
            code: 'CE',
            label: 'Cot evacuare',
            unit: 'buc',
            unitPrice: 187,
            discount: 0
        }
    };

    const DRAINAGE_SYSTEMS = {
        none: {
            key: 'none',
            label: 'Fără sistem de scurgere',
            pricingAvailable: false,
            gutterDiameter: 0,
            downpipeDiameter: 0,
            color: 0x6f7882,
            accent: 0xd8e0e6,
            products: null
        },
        'with-drainage': {
            key: 'with-drainage',
            label: 'Cu sistem de scurgere',
            pricingAvailable: true,
            gutterDiameter: 0.125,
            downpipeDiameter: 0.087,
            color: 0x6a737b,
            accent: 0xd3dce3,
            products: DRAINAGE_BASE_PRODUCTS
        }
    };

    const roofReferenceImages = new Map();
    const roofReferenceTiles = new Map();
    const roofReferenceStatus = new Map();

    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }

    function replayClass(el, className) {
        if (!el) return;
        el.classList.remove(className);
        void el.offsetWidth;
        el.classList.add(className);
    }

    function triggerConfiguratorFeedback() {
        replayClass(wrapEl, 'is-updating');
        replayClass(costEl, 'is-updating');
        panelSections.forEach((section) => replayClass(section, 'is-updating'));
    }

    function disposeTextureSafe(texture) {
        if (texture && typeof texture.dispose === 'function') {
            texture.dispose();
        }
    }

    function disposeMaterialSafe(material) {
        if (!material) return;

        if (Array.isArray(material)) {
            material.forEach((item) => disposeMaterialSafe(item));
            return;
        }

        const textureKeys = [
            'map',
            'lightMap',
            'aoMap',
            'emissiveMap',
            'bumpMap',
            'normalMap',
            'specularMap',
            'roughnessMap',
            'metalnessMap',
            'alphaMap',
            'displacementMap',
            'envMap',
            'clearcoatMap',
            'clearcoatNormalMap',
            'clearcoatRoughnessMap',
            'sheenColorMap',
            'sheenRoughnessMap',
            'transmissionMap',
            'thicknessMap',
            'iridescenceMap',
            'iridescenceThicknessMap',
            'anisotropyMap',
            'gradientMap'
        ];

        const disposed = new Set();
        textureKeys.forEach((key) => {
            const texture = material[key];
            if (!texture || disposed.has(texture)) return;
            disposed.add(texture);
            disposeTextureSafe(texture);
        });

        if (typeof material.dispose === 'function') {
            material.dispose();
        }
    }

    function disposeObject3DSafe(root) {
        if (!root) return;

        root.traverse((node) => {
            if (node.geometry && typeof node.geometry.dispose === 'function') {
                node.geometry.dispose();
            }
            if (node.material) {
                disposeMaterialSafe(node.material);
            }
        });
    }

    function getCanvasSize() {
        return {
            width: Math.max(wrapEl.clientWidth || 320, 320),
            height: Math.max(wrapEl.clientHeight || 420, 320)
        };
    }

    function formatMeters(value) {
        return `${value.toFixed(1)} m`;
    }

    function formatSurface(value) {
        return `${value.toLocaleString('ro-RO', {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        })} m2`;
    }

    function formatLinear(value) {
        return `${value.toLocaleString('ro-RO', {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        })} ml`;
    }

    function formatEstimateQuantity(value, unit) {
        if (!Number.isFinite(value)) return `0 ${unit}`;
        if (unit === 'buc' || unit === 'kg') {
            return `${Math.round(value).toLocaleString('ro-RO')} ${unit}`;
        }

        return `${value.toLocaleString('ro-RO', {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        })} ${unit}`;
    }

    function roundEvenMeters(value) {
        if (!Number.isFinite(value) || value <= 0) return 0;
        const rounded = Math.ceil(value);
        return rounded % 2 === 0 ? rounded : rounded + 1;
    }

    function easeInOutSine(value) {
        return 0.5 - (0.5 * Math.cos(Math.PI * clamp(value, 0, 1)));
    }

    function getPreviewVisualBlend(now) {
        if (!drainagePreviewState) return 0;
        const duration = Math.max(DRAINAGE_PREVIEW_DURATION, 1);
        const remaining = Math.max(drainagePreviewState.activeUntil - now, 0);
        const linear = 1 - (remaining / duration);
        return Math.sin(easeInOutSine(linear) * Math.PI);
    }

    function applyPreviewAmbience(blend) {
        if (!scene || !renderer) return;

        const background = new THREE.Color(DEFAULT_SCENE_BG).lerp(new THREE.Color(PREVIEW_SCENE_BG), blend);
        const fogColor = new THREE.Color(DEFAULT_FOG).lerp(new THREE.Color(PREVIEW_FOG), blend);
        scene.background = background;

        if (scene.fog) {
            scene.fog.color.copy(fogColor);
            scene.fog.near = THREE.MathUtils.lerp(18, 14.5, blend);
            scene.fog.far = THREE.MathUtils.lerp(36, 28, blend);
        }

        renderer.toneMappingExposure = THREE.MathUtils.lerp(1.18, 0.93, blend);

        if (ambientLight) ambientLight.intensity = THREE.MathUtils.lerp(0.56, 0.4, blend);
        if (sunLight) {
            sunLight.intensity = THREE.MathUtils.lerp(0.95, 0.5, blend);
            sunLight.color.copy(new THREE.Color(0xffffff).lerp(new THREE.Color(0xcfd7e2), blend));
        }
        if (fillLight) {
            fillLight.intensity = THREE.MathUtils.lerp(0.34, 0.22, blend);
            fillLight.color.copy(new THREE.Color(0x9fc7eb).lerp(new THREE.Color(0x92a5bb), blend));
        }
        if (hemiLight) {
            hemiLight.intensity = THREE.MathUtils.lerp(0.36, 0.2, blend);
            hemiLight.color.copy(new THREE.Color(0xdcefff).lerp(new THREE.Color(0xaebdcf), blend));
            hemiLight.groundColor.copy(new THREE.Color(0x88a364).lerp(new THREE.Color(0x5e6a5f), blend));
        }
    }

    function getWeatherAudioContext() {
        const AudioCtor = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtor) return null;

        if (!weatherAudioState || !weatherAudioState.context) {
            weatherAudioState = {
                context: new AudioCtor(),
                activeNodes: []
            };
        }

        return weatherAudioState.context;
    }

    function getWeatherNoiseBuffer(context) {
        if (weatherNoiseBuffer && weatherNoiseBuffer.sampleRate === context.sampleRate) {
            return weatherNoiseBuffer;
        }

        const duration = 2.6;
        const buffer = context.createBuffer(1, Math.floor(context.sampleRate * duration), context.sampleRate);
        const channel = buffer.getChannelData(0);

        for (let index = 0; index < channel.length; index += 1) {
            channel[index] = (Math.random() * 2 - 1) * 0.9;
        }

        weatherNoiseBuffer = buffer;
        return buffer;
    }

    function stopWeatherAudioPreview() {
        if (!weatherAudioState?.activeNodes?.length) return;

        weatherAudioState.activeNodes.forEach((node) => {
            try {
                node.stop?.();
            } catch (error) {
                // noop
            }
            try {
                node.disconnect?.();
            } catch (error) {
                // noop
            }
        });

        weatherAudioState.activeNodes = [];
    }

    function startWeatherAudioPreview() {
        const context = getWeatherAudioContext();
        if (!context) return;

        stopWeatherAudioPreview();

        const noiseBuffer = getWeatherNoiseBuffer(context);
        const previewSeconds = Math.max(DRAINAGE_PREVIEW_DURATION / 1000, 0.6);
        const startAt = context.currentTime + 0.02;
        const endAt = startAt + previewSeconds;
        const thunderStart = startAt + Math.min(0.52, Math.max(previewSeconds * 0.18, 0.3));
        const thunderPeak = thunderStart + Math.min(0.2, Math.max(previewSeconds * 0.06, 0.12));

        const rainSource = context.createBufferSource();
        rainSource.buffer = noiseBuffer;
        rainSource.loop = true;

        const rainHighPass = context.createBiquadFilter();
        rainHighPass.type = 'highpass';
        rainHighPass.frequency.value = 680;

        const rainLowPass = context.createBiquadFilter();
        rainLowPass.type = 'lowpass';
        rainLowPass.frequency.value = 6200;

        const rainGain = context.createGain();
        rainGain.gain.setValueAtTime(0.0001, startAt);
        rainGain.gain.linearRampToValueAtTime(0.06, startAt + 0.12);
        rainGain.gain.linearRampToValueAtTime(0.04, Math.max(startAt + 0.35, endAt - 0.45));
        rainGain.gain.linearRampToValueAtTime(0.0001, endAt);

        rainSource.connect(rainHighPass);
        rainHighPass.connect(rainLowPass);
        rainLowPass.connect(rainGain);
        rainGain.connect(context.destination);

        const thunderSource = context.createBufferSource();
        thunderSource.buffer = noiseBuffer;

        const thunderLowPass = context.createBiquadFilter();
        thunderLowPass.type = 'lowpass';
        thunderLowPass.frequency.value = 180;

        const thunderGain = context.createGain();
        thunderGain.gain.setValueAtTime(0.0001, startAt);
        thunderGain.gain.linearRampToValueAtTime(0.0001, thunderStart - 0.02);
        thunderGain.gain.linearRampToValueAtTime(0.16, thunderPeak);
        thunderGain.gain.exponentialRampToValueAtTime(0.0002, endAt);

        thunderSource.connect(thunderLowPass);
        thunderLowPass.connect(thunderGain);
        thunderGain.connect(context.destination);

        const rumbleOsc = context.createOscillator();
        rumbleOsc.type = 'triangle';
        rumbleOsc.frequency.setValueAtTime(52, startAt);
        rumbleOsc.frequency.linearRampToValueAtTime(38, endAt);

        const rumbleGain = context.createGain();
        rumbleGain.gain.setValueAtTime(0.0001, startAt);
        rumbleGain.gain.linearRampToValueAtTime(0.018, thunderPeak + 0.04);
        rumbleGain.gain.exponentialRampToValueAtTime(0.0001, endAt);

        rumbleOsc.connect(rumbleGain);
        rumbleGain.connect(context.destination);

        if (context.state === 'suspended') {
            context.resume().catch(() => {});
        }

        rainSource.start(startAt);
        thunderSource.start(thunderStart);
        rumbleOsc.start(thunderStart);

        rainSource.stop(endAt + 0.03);
        thunderSource.stop(endAt + 0.03);
        rumbleOsc.stop(endAt + 0.03);

        weatherAudioState.activeNodes = [
            rainSource,
            rainHighPass,
            rainLowPass,
            rainGain,
            thunderSource,
            thunderLowPass,
            thunderGain,
            rumbleOsc,
            rumbleGain
        ];
    }

    function setPanelExpanded(section, expanded) {
        if (!section) return;
        section.classList.toggle('is-collapsed', !expanded);
        const toggleBtn = section.querySelector('[data-panel-toggle]');
        if (toggleBtn) {
            toggleBtn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
        }
    }

    function isCompactConfiguratorViewport() {
        return window.innerWidth <= 768;
    }

    function isRussianPage() {
        return (document.documentElement.getAttribute('lang') || '').toLowerCase().startsWith('ru');
    }

    function getPanelLabel(section) {
        const panelKey = section?.dataset?.panelKey || '';
        const labelMap = isRussianPage()
            ? {
                shape: 'Форма',
                dims: 'Размеры',
                material: 'Материал',
                drainage: 'Водосток',
                cost: 'Цена'
            }
            : {
                shape: 'Formă',
                dims: 'Dimensiuni',
                material: 'Material',
                drainage: 'Scurgere',
                cost: 'Preț'
            };

        return labelMap[panelKey] || panelKey;
    }

    function updateMobileStepperUI() {
        if (!mobileStepperEl) return;
        mobileStepperEl.querySelectorAll('[data-mobile-panel]').forEach((button) => {
            const isActive = button.dataset.mobilePanel === activeMobilePanelKey;
            button.classList.toggle('is-active', isActive);
            button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });
    }

    function updateMobilePanelLayout() {
        if (!panelSections.length) return;

        if (!isCompactConfiguratorViewport()) {
            panelSections.forEach((section) => {
                section.classList.remove('is-mobile-hidden');
            });
            if (mobileStepperEl) {
                mobileStepperEl.hidden = true;
            }
            return;
        }

        const activeSection = getPanelSection(activeMobilePanelKey) || panelSections[0];
        activeMobilePanelKey = activeSection?.dataset.panelKey || activeMobilePanelKey;

        panelSections.forEach((section) => {
            const isActiveSection = section === activeSection;
            section.classList.toggle('is-mobile-hidden', !isActiveSection);
            if (isActiveSection) {
                setPanelExpanded(section, true);
            }
        });

        if (mobileStepperEl) {
            mobileStepperEl.hidden = false;
            updateMobileStepperUI();
        }
    }

    function ensureMobileStepper() {
        if (!panelEl || mobileStepperEl) return;

        mobileStepperEl = document.createElement('div');
        mobileStepperEl.className = 'cfg__mobile-steps';
        mobileStepperEl.setAttribute('aria-label', isRussianPage() ? 'Шаги конфигуратора' : 'Pași configurator');

        panelSections.forEach((section) => {
            const key = section.dataset.panelKey;
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'cfg__mobile-step';
            button.dataset.mobilePanel = key;
            button.textContent = getPanelLabel(section);
            button.addEventListener('click', () => {
                activeMobilePanelKey = key;
                openPanel(key, true);
            });
            mobileStepperEl.appendChild(button);
        });

        panelEl.insertBefore(mobileStepperEl, panelEl.firstChild);
        updateMobilePanelLayout();
    }

    function collapseSiblingPanels(activeSection) {
        if (!isCompactConfiguratorViewport()) return;
        panelSections.forEach((section) => {
            if (section !== activeSection) {
                setPanelExpanded(section, false);
            }
        });
    }

    function getPanelSection(key) {
        return Array.from(panelSections).find((section) => section.dataset.panelKey === key) || null;
    }

    function openPanel(key, shouldScroll = false) {
        const section = getPanelSection(key);
        if (!section) return;
        activeMobilePanelKey = key;
        collapseSiblingPanels(section);
        setPanelExpanded(section, true);
        updateMobilePanelLayout();
        if (shouldScroll) {
            section.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    function advanceGuidedPanelFlow(key) {
        if (!guidedPanelFlowActive) return;
        openPanel(key, true);
    }

    function completeGuidedPanelFlow(finalKey) {
        if (guidedPanelFlowActive && finalKey) {
            openPanel(finalKey, true);
        }
        guidedPanelFlowActive = false;
    }

    function getActiveColorPalette(materialType = currentMaterialType, qualityKey = currentQualityKey) {
        const materialPalette = qualityColorPalettes[materialType] || {};
        return materialPalette[qualityKey] || materialPalette.standart || materialPalette.premium || materialPalette.vip || [];
    }

    function syncAutoColor(materialType = currentMaterialType) {
        const materialPalette = qualityColorPalettes[materialType] || {};
        const palette = materialPalette.standart || materialPalette.premium || materialPalette.vip || [];
        if (!palette.length) {
            currentColorLabel = 'Culoare standard';
            return;
        }

        const preferredHex = defaultProductColors[materialType] || palette[0].hex;
        const selectedEntry = palette.find((entry) => entry.hex.toLowerCase() === preferredHex.toLowerCase()) || palette[0];

        currentColor = selectedEntry.hex;
        currentColorLabel = selectedEntry.label;
    }

    function updatePanelSummaries(totalLabel) {
        const dims = getShapeDimensions(currentShapeType);

        if (shapeSummaryEl) {
            shapeSummaryEl.textContent = `${currentShapeLabel} - ${currentRoofLabel}`;
        }

        if (dimsSummaryEl) {
            if (currentShapeType === 'rect') {
                dimsSummaryEl.textContent = `${dims.mainWidth.toFixed(1)} x ${dims.mainDepth.toFixed(1)} m - streașină ${formatMeters(currentEaveOverhang)}`;
            } else {
                dimsSummaryEl.textContent = `${dims.mainWidth.toFixed(1)} x ${dims.mainDepth.toFixed(1)} m + aripa ${dims.wingWidth.toFixed(1)} x ${dims.wingDepth.toFixed(1)} m`;
            }
        }

        if (materialSummaryEl) {
            materialSummaryEl.textContent = currentName;
        }

        if (colorSummaryEl) {
            colorSummaryEl.textContent = currentColorLabel;
        }

        if (drainageSummaryEl) {
            drainageSummaryEl.textContent = currentDrainageLabel;
        }

        if (costSummaryEl) {
            costSummaryEl.textContent = totalLabel || 'Estimare actualizată';
        }

        if (colorCurrentEl) {
            colorCurrentEl.textContent = currentColorLabel;
        }
    }

    function renderColorPalette(materialType) {
        if (!colorPaletteEl) return;

        const palette = getActiveColorPalette(materialType, currentQualityKey);
        colorPaletteEl.innerHTML = '';

        palette.forEach((entry, index) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'cfg__swatch-btn';
            if (entry.hex.toLowerCase() === currentColor.toLowerCase()) {
                button.classList.add('is-active');
            }

            button.innerHTML = `
                <span class="cfg__swatch-chip" style="background:${entry.hex}"></span>
                <span class="cfg__swatch-meta">
                    <span class="cfg__swatch-name">${entry.label}</span>
                    <span class="cfg__swatch-code">${entry.code}</span>
                </span>
            `;

            button.addEventListener('click', () => {
                currentColor = entry.hex;
                currentColorLabel = entry.label;

                colorPaletteEl.querySelectorAll('.cfg__swatch-btn').forEach((item) => item.classList.remove('is-active'));
                button.classList.add('is-active');

                setRoofColor();
                triggerConfiguratorFeedback();
                updatePanelSummaries();
                updateCost();
                advanceGuidedPanelFlow('drainage');
            });

            colorPaletteEl.appendChild(button);

            if (index === 0 && !palette.some((item) => item.hex.toLowerCase() === currentColor.toLowerCase())) {
                currentColor = entry.hex;
                currentColorLabel = entry.label;
                button.classList.add('is-active');
            }
        });

        if (!palette.length) {
            currentColorLabel = 'Culoare standard';
        }

        updatePanelSummaries();
    }

    function applySelectedQualityOption() {
        if (!qualitySelect || !qualitySelect.options.length) return;

        const selectedOption = qualitySelect.options[qualitySelect.selectedIndex];
        currentQualityKey = selectedOption.value || 'standart';
        currentQualityLabel = selectedOption.dataset.label || selectedOption.textContent || 'Standart';
        currentPrice = parseInt(selectedOption.dataset.price || '0', 10) || currentPrice;
        currentQualityDiscount = parseFloat(selectedOption.dataset.discount || '0') || 0;
        currentQuality = 1;
        syncAutoColor(currentMaterialType, currentQualityKey);
        updatePanelSummaries();
    }

    function updateQualityOptions(materialType, preferredKey) {
        if (!qualitySelect) return;

        const qualityOptions = materialQualityOptions[materialType] || [];
        if (!qualityOptions.length) return;

        const desiredKey = preferredKey || currentQualityKey || qualityOptions[qualityOptions.length - 1].key;

        qualitySelect.innerHTML = qualityOptions.map((option) => {
            const selected = option.key === desiredKey ? ' selected' : '';
            return `<option value="${option.key}" data-label="${option.label}" data-price="${option.price}"${selected}>${option.label} - ${option.price} lei/m²</option>`;
        }).join('');

        qualityOptions.forEach((option, index) => {
            const selectOption = qualitySelect.options[index];
            if (!selectOption) return;
            selectOption.dataset.discount = String(option.discount || 0);
            selectOption.textContent = `${option.label} - ${option.price} lei/m²`;
        });

        if (!qualityOptions.some((option) => option.key === desiredKey)) {
            qualitySelect.selectedIndex = qualityOptions.length - 1;
        }

        applySelectedQualityOption();
    }

    function clampDimensionValue(key, value) {
        const numeric = parseFloat(value) || 0;

        switch (key) {
        case 'mainWidth':
            return clamp(numeric, 6, 12);
        case 'mainDepth':
            return clamp(numeric, 4, 8);
        case 'wingWidth':
            return clamp(numeric, 2.8, 6);
        case 'wingDepth':
            return clamp(numeric, 5.5, 11);
        default:
            return numeric;
        }
    }

    function getShapeDimensions(shapeType) {
        return shapeDimensionState[shapeType] || shapeDimensionState.rect;
    }

    function normalizeShapeDimensions(shapeType) {
        const dims = getShapeDimensions(shapeType);
        dims.mainWidth = clampDimensionValue('mainWidth', dims.mainWidth);
        dims.mainDepth = clampDimensionValue('mainDepth', dims.mainDepth);
        dims.wingWidth = clampDimensionValue('wingWidth', dims.wingWidth);
        dims.wingDepth = clampDimensionValue('wingDepth', dims.wingDepth);

        if (shapeType !== 'rect') {
            dims.wingWidth = Math.min(dims.wingWidth, dims.mainWidth - 0.6);
            dims.wingDepth = Math.max(dims.wingDepth, dims.mainDepth + 0.6);
        }
    }

    function updateDimensionControls() {
        normalizeShapeDimensions(currentShapeType);
        const dims = getShapeDimensions(currentShapeType);

        Object.keys(dimensionInputs).forEach((key) => {
            const input = dimensionInputs[key];
            const valueEl = dimensionValueEls[key];
            if (input) input.value = String(dims[key]);
            if (valueEl) valueEl.textContent = formatMeters(dims[key]);
        });

        const hasWing = currentShapeType !== 'rect';
        wingFieldEls.forEach((field) => {
            field.classList.toggle('is-hidden', !hasWing);
        });

        if (dimsNoteEl) {
            if (currentShapeType === 'rect') {
                dimsNoteEl.textContent = 'Forma simpla foloseste doar corpul principal. In sandbox, aceasta ramane referinta pentru comparatia cu geometriile in L si T.';
            } else if (currentShapeType === 'l-shape') {
                dimsNoteEl.textContent = 'Forma in L uneste corpul principal cu o aripa laterala. Aici apar o dolie si o intersectie de acoperis care trebuie urmarite atent in test.';
            } else {
                dimsNoteEl.textContent = 'Forma in T centreaza aripa secundara si genereaza doua dolii. Este cea mai sensibila combinatie pentru coame si intersectii in sandbox.';
            }
        }

        updatePanelSummaries();
    }

    function updateEaveControl() {
        currentEaveOverhang = clamp(currentEaveOverhang, 0.2, 0.9);
        if (eaveOverhangInput) eaveOverhangInput.value = currentEaveOverhang.toFixed(2);
        if (eaveOverhangValueEl) eaveOverhangValueEl.textContent = formatMeters(currentEaveOverhang);
        updatePanelSummaries();
    }

    function createRawShapeRects(shapeType, dims) {
        if (shapeType === 'l-shape') {
            return [
                {
                    id: 'main',
                    xMin: 0,
                    xMax: dims.mainWidth,
                    zMin: 0,
                    zMax: dims.mainDepth,
                    height: 3.26
                },
                {
                    id: 'wing',
                    xMin: dims.mainWidth - dims.wingWidth,
                    xMax: dims.mainWidth,
                    zMin: dims.mainDepth - dims.wingDepth,
                    zMax: dims.mainDepth,
                    height: 3.18
                }
            ];
        }

        if (shapeType === 't-shape') {
            return [
                {
                    id: 'cross',
                    xMin: 0,
                    xMax: dims.mainWidth,
                    zMin: 0,
                    zMax: dims.mainDepth,
                    height: 3.28
                },
                {
                    id: 'stem',
                    xMin: (dims.mainWidth - dims.wingWidth) / 2,
                    xMax: (dims.mainWidth + dims.wingWidth) / 2,
                    zMin: dims.mainDepth - dims.wingDepth,
                    zMax: dims.mainDepth,
                    height: 3.18
                }
            ];
        }

        return [
            {
                id: 'main',
                xMin: 0,
                xMax: dims.mainWidth,
                zMin: 0,
                zMax: dims.mainDepth,
                height: 3.4
            }
        ];
    }

    function centerRawRects(rawRects) {
        let minX = Infinity;
        let maxX = -Infinity;
        let minZ = Infinity;
        let maxZ = -Infinity;

        rawRects.forEach((rect) => {
            minX = Math.min(minX, rect.xMin);
            maxX = Math.max(maxX, rect.xMax);
            minZ = Math.min(minZ, rect.zMin);
            maxZ = Math.max(maxZ, rect.zMax);
        });

        const centerX = (minX + maxX) / 2;
        const centerZ = (minZ + maxZ) / 2;

        return rawRects.map((rect) => {
            const xMin = rect.xMin - centerX;
            const xMax = rect.xMax - centerX;
            const zMin = rect.zMin - centerZ;
            const zMax = rect.zMax - centerZ;

            return {
                id: rect.id,
                height: rect.height,
                xMin,
                xMax,
                zMin,
                zMax,
                width: xMax - xMin,
                depth: zMax - zMin,
                x: (xMin + xMax) / 2,
                z: (zMin + zMax) / 2
            };
        });
    }

    function computeUnionArea(rawRects) {
        const xBreaks = Array.from(new Set(rawRects.flatMap((rect) => [rect.xMin, rect.xMax]))).sort((a, b) => a - b);
        const zBreaks = Array.from(new Set(rawRects.flatMap((rect) => [rect.zMin, rect.zMax]))).sort((a, b) => a - b);
        let total = 0;

        for (let xi = 0; xi < xBreaks.length - 1; xi += 1) {
            for (let zi = 0; zi < zBreaks.length - 1; zi += 1) {
                const x0 = xBreaks[xi];
                const x1 = xBreaks[xi + 1];
                const z0 = zBreaks[zi];
                const z1 = zBreaks[zi + 1];
                const midX = (x0 + x1) / 2;
                const midZ = (z0 + z1) / 2;

                const covered = rawRects.some((rect) => (
                    midX >= rect.xMin &&
                    midX <= rect.xMax &&
                    midZ >= rect.zMin &&
                    midZ <= rect.zMax
                ));

                if (covered) {
                    total += (x1 - x0) * (z1 - z0);
                }
            }
        }

        return total;
    }

    function getPlanBounds(blocks) {
        return blocks.reduce((acc, block) => ({
            minX: Math.min(acc.minX, block.xMin),
            maxX: Math.max(acc.maxX, block.xMax),
            minZ: Math.min(acc.minZ, block.zMin),
            maxZ: Math.max(acc.maxZ, block.zMax)
        }), {
            minX: Infinity,
            maxX: -Infinity,
            minZ: Infinity,
            maxZ: -Infinity
        });
    }

    function computeGableRoofHeight(block, ridgeAlong) {
        const span = ridgeAlong === 'x' ? block.depth : block.width;
        return clamp(span * 0.26, 1.62, 2.42);
    }

    function computeHipRoofHeight(block) {
        return clamp(Math.min(block.width, block.depth) * 0.4, 1.55, 2.08);
    }

    function getRoofProfiles(shapeType, blocks) {
        const byId = Object.fromEntries(blocks.map((block) => [block.id, block]));
        const entries = [];

        if (shapeType === 'l-shape') {
            entries.push({ blockId: 'main', ridgeAlong: 'z' });
            entries.push({ blockId: 'wing', ridgeAlong: 'x' });
        } else if (shapeType === 't-shape') {
            entries.push({ blockId: 'cross', ridgeAlong: 'z' });
            entries.push({ blockId: 'stem', ridgeAlong: 'x' });
        } else {
            entries.push({ blockId: 'main', ridgeAlong: 'z' });
        }

        return entries.reduce((acc, entry) => {
            const block = byId[entry.blockId];
            if (!block) return acc;

            const resolvedRidgeAlong = currentRoofType === 'hip'
                ? (block.width >= block.depth ? 'x' : 'z')
                : (
                    shapeType === 'rect'
                        ? (block.width >= block.depth ? 'x' : 'z')
                        : entry.ridgeAlong
                );

            acc[entry.blockId] = {
                blockId: entry.blockId,
                ridgeAlong: resolvedRidgeAlong,
                roofHeight: currentRoofType === 'hip'
                    ? computeHipRoofHeight(block)
                    : computeGableRoofHeight(block, resolvedRidgeAlong)
            };

            return acc;
        }, {});
    }

    function getValleySegments(shapeType, byId, roofProfiles) {
        if (shapeType === 'l-shape') {
            const main = byId.main;
            const wing = byId.wing;
            const extension = Math.max(wing.depth - main.depth, wing.depth * 0.26);
            const valleyY = Math.max(
                main.height + roofProfiles.main.roofHeight,
                wing.height + roofProfiles.wing.roofHeight
            ) - (currentRoofType === 'hip' ? 0.18 : 0.12);
            const innerX = wing.xMin;
            const innerZ = main.zMin;

            return [
                {
                    start: { x: innerX + 0.16, y: valleyY, z: innerZ + 0.16 },
                    end: {
                        x: innerX + Math.max(0.95, wing.width * 0.46),
                        y: valleyY - 0.05,
                        z: innerZ - Math.max(0.9, extension * 0.56)
                    }
                }
            ];
        }

        if (shapeType === 't-shape') {
            const cross = byId.cross;
            const stem = byId.stem;
            const extension = Math.max(stem.depth - cross.depth, stem.depth * 0.28);
            const valleyY = Math.max(
                cross.height + roofProfiles.cross.roofHeight,
                stem.height + roofProfiles.stem.roofHeight
            ) - (currentRoofType === 'hip' ? 0.18 : 0.12);
            const innerZ = cross.zMin;
            const leftX = stem.xMin;
            const rightX = stem.xMax;

            return [
                {
                    start: { x: leftX + 0.12, y: valleyY, z: innerZ + 0.14 },
                    end: {
                        x: stem.x - (stem.width * 0.14),
                        y: valleyY - 0.05,
                        z: innerZ - Math.max(0.9, extension * 0.52)
                    }
                },
                {
                    start: { x: rightX - 0.12, y: valleyY, z: innerZ + 0.14 },
                    end: {
                        x: stem.x + (stem.width * 0.14),
                        y: valleyY - 0.05,
                        z: innerZ - Math.max(0.9, extension * 0.52)
                    }
                }
            ];
        }

        return [];
    }

    function estimateRoofArea(footprint, shapeType, dims) {
        const pitchFactor = currentRoofType === 'hip' ? 1.24 : 1.16;
        const geometryFactor = shapeType === 'rect'
            ? 1
            : (shapeType === 'l-shape' ? 1.06 : 1.08);
        const articulation = shapeType === 'rect'
            ? 1
            : 1 + clamp((dims.wingDepth - dims.mainDepth) * 0.015, 0.015, 0.09);

        return footprint * pitchFactor * geometryFactor * articulation;
    }

    function inflateRawRects(rawRects, amount) {
        return rawRects.map((rect) => ({
            ...rect,
            xMin: rect.xMin - amount,
            xMax: rect.xMax + amount,
            zMin: rect.zMin - amount,
            zMax: rect.zMax + amount
        }));
    }

    function pointKey(x, z) {
        return `${x.toFixed(4)}|${z.toFixed(4)}`;
    }

    function polygonSignedArea(points) {
        let total = 0;

        for (let i = 0; i < points.length; i += 1) {
            const current = points[i];
            const next = points[(i + 1) % points.length];
            total += (current.x * next.z) - (next.x * current.z);
        }

        return total / 2;
    }

    function removeCollinearPoints(points) {
        if (points.length <= 3) return points.slice();

        const cleaned = [];

        for (let i = 0; i < points.length; i += 1) {
            const prev = points[(i - 1 + points.length) % points.length];
            const curr = points[i];
            const next = points[(i + 1) % points.length];
            const cross = ((curr.x - prev.x) * (next.z - curr.z)) - ((curr.z - prev.z) * (next.x - curr.x));
            const isDuplicate = Math.abs(curr.x - next.x) < 1e-6 && Math.abs(curr.z - next.z) < 1e-6;

            if (isDuplicate) continue;
            if (Math.abs(cross) < 1e-6) continue;

            cleaned.push(curr);
        }

        return cleaned;
    }

    function normalizeFootprint(points) {
        const deduped = [];

        points.forEach((point) => {
            const prev = deduped[deduped.length - 1];
            if (!prev || Math.abs(prev.x - point.x) > 1e-6 || Math.abs(prev.z - point.z) > 1e-6) {
                deduped.push(point);
            }
        });

        const trimmed = removeCollinearPoints(deduped);
        if (trimmed.length < 3) return trimmed;

        if (polygonSignedArea(trimmed) > 0) {
            trimmed.reverse();
        }

        return trimmed;
    }

    function buildUnifiedFootprint(blocks) {
        const xBreaks = Array.from(new Set(blocks.flatMap((block) => [block.xMin, block.xMax]))).sort((a, b) => a - b);
        const zBreaks = Array.from(new Set(blocks.flatMap((block) => [block.zMin, block.zMax]))).sort((a, b) => a - b);
        const filled = new Map();
        const edges = [];

        for (let xi = 0; xi < xBreaks.length - 1; xi += 1) {
            for (let zi = 0; zi < zBreaks.length - 1; zi += 1) {
                const x0 = xBreaks[xi];
                const x1 = xBreaks[xi + 1];
                const z0 = zBreaks[zi];
                const z1 = zBreaks[zi + 1];
                const midX = (x0 + x1) / 2;
                const midZ = (z0 + z1) / 2;
                const covered = blocks.some((block) => isPointInsideBlock(block, midX, midZ, 0));
                if (!covered) continue;
                filled.set(`${xi}:${zi}`, { x0, x1, z0, z1 });
            }
        }

        filled.forEach((cell, key) => {
            const [xiString, ziString] = key.split(':');
            const xi = parseInt(xiString, 10);
            const zi = parseInt(ziString, 10);
            const northKey = `${xi}:${zi - 1}`;
            const eastKey = `${xi + 1}:${zi}`;
            const southKey = `${xi}:${zi + 1}`;
            const westKey = `${xi - 1}:${zi}`;

            if (!filled.has(northKey)) {
                edges.push([{ x: cell.x0, z: cell.z0 }, { x: cell.x1, z: cell.z0 }]);
            }
            if (!filled.has(eastKey)) {
                edges.push([{ x: cell.x1, z: cell.z0 }, { x: cell.x1, z: cell.z1 }]);
            }
            if (!filled.has(southKey)) {
                edges.push([{ x: cell.x1, z: cell.z1 }, { x: cell.x0, z: cell.z1 }]);
            }
            if (!filled.has(westKey)) {
                edges.push([{ x: cell.x0, z: cell.z1 }, { x: cell.x0, z: cell.z0 }]);
            }
        });

        if (!edges.length) return [];

        const nextMap = new Map();
        edges.forEach((edge) => {
            nextMap.set(pointKey(edge[0].x, edge[0].z), edge[1]);
        });

        const start = edges
            .map((edge) => edge[0])
            .sort((a, b) => (a.z - b.z) || (a.x - b.x))[0];

        const polygon = [];
        const startKey = pointKey(start.x, start.z);
        let current = start;
        let guard = 0;

        while (current && guard < 200) {
            polygon.push(current);
            const next = nextMap.get(pointKey(current.x, current.z));
            if (!next) break;
            if (pointKey(next.x, next.z) === startKey) break;
            current = next;
            guard += 1;
        }

        return normalizeFootprint(polygon);
    }

    function findConcaveCorners(points) {
        if (points.length < 4) return [];

        const orientation = polygonSignedArea(points) >= 0 ? 1 : -1;

        return points.reduce((acc, point, index) => {
            const prev = points[(index - 1 + points.length) % points.length];
            const next = points[(index + 1) % points.length];
            const cross = ((point.x - prev.x) * (next.z - point.z)) - ((point.z - prev.z) * (next.x - point.x));

            if ((cross * orientation) < 0) {
                acc.push({ ...point, index });
            }

            return acc;
        }, []);
    }

    function pointInPolygon(x, z, polygon) {
        let inside = false;

        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
            const xi = polygon[i].x;
            const zi = polygon[i].z;
            const xj = polygon[j].x;
            const zj = polygon[j].z;
            const intersects = ((zi > z) !== (zj > z)) && (x < (((xj - xi) * (z - zi)) / ((zj - zi) || 1e-9)) + xi);
            if (intersects) inside = !inside;
        }

        return inside;
    }

    function clipPolygonAgainstBoundary(points, isInside, intersect) {
        if (!points.length) return [];

        const output = [];
        let previous = points[points.length - 1];
        let previousInside = isInside(previous);

        points.forEach((current) => {
            const currentInside = isInside(current);

            if (currentInside) {
                if (!previousInside) {
                    output.push(intersect(previous, current));
                }
                output.push(current);
            } else if (previousInside) {
                output.push(intersect(previous, current));
            }

            previous = current;
            previousInside = currentInside;
        });

        return output;
    }

    function intersectSegmentWithVertical(a, b, x) {
        const dx = b.x - a.x;
        if (Math.abs(dx) < 1e-9) {
            return { x, z: a.z };
        }

        const t = (x - a.x) / dx;
        return {
            x,
            z: a.z + ((b.z - a.z) * t)
        };
    }

    function intersectSegmentWithHorizontal(a, b, z) {
        const dz = b.z - a.z;
        if (Math.abs(dz) < 1e-9) {
            return { x: a.x, z };
        }

        const t = (z - a.z) / dz;
        return {
            x: a.x + ((b.x - a.x) * t),
            z
        };
    }

    function clipFootprintToCell(footprint, xMin, xMax, zMin, zMax) {
        let clipped = footprint.slice();

        clipped = clipPolygonAgainstBoundary(
            clipped,
            (point) => point.x >= (xMin - 1e-6),
            (a, b) => intersectSegmentWithVertical(a, b, xMin)
        );
        clipped = clipPolygonAgainstBoundary(
            clipped,
            (point) => point.x <= (xMax + 1e-6),
            (a, b) => intersectSegmentWithVertical(a, b, xMax)
        );
        clipped = clipPolygonAgainstBoundary(
            clipped,
            (point) => point.z >= (zMin - 1e-6),
            (a, b) => intersectSegmentWithHorizontal(a, b, zMin)
        );
        clipped = clipPolygonAgainstBoundary(
            clipped,
            (point) => point.z <= (zMax + 1e-6),
            (a, b) => intersectSegmentWithHorizontal(a, b, zMax)
        );

        return normalizeFootprint(clipped);
    }

    function rectAxis(rect, orientation, id) {
        if (orientation === 'horizontal') {
            return {
                id,
                orientation,
                a: { x: rect.xMin, z: rect.z },
                b: { x: rect.xMax, z: rect.z }
            };
        }

        return {
            id,
            orientation: 'vertical',
            a: { x: rect.x, z: rect.zMin },
            b: { x: rect.x, z: rect.zMax }
        };
    }

    function axisPointAt(axis, t) {
        return {
            x: axis.a.x + ((axis.b.x - axis.a.x) * t),
            z: axis.a.z + ((axis.b.z - axis.a.z) * t)
        };
    }

    function pointDistance2D(a, b) {
        return Math.hypot(a.x - b.x, a.z - b.z);
    }

    function buildValleyRay(corner, footprint) {
        const directions = [
            { x: 1, z: 1 },
            { x: 1, z: -1 },
            { x: -1, z: 1 },
            { x: -1, z: -1 }
        ];

        for (const direction of directions) {
            const magnitude = Math.hypot(direction.x, direction.z);
            const normalized = {
                x: direction.x / magnitude,
                z: direction.z / magnitude
            };
            const testPoint = {
                x: corner.x + (normalized.x * 0.16),
                z: corner.z + (normalized.z * 0.16)
            };

            if (pointInPolygon(testPoint.x, testPoint.z, footprint)) {
                return {
                    start: { x: corner.x, z: corner.z },
                    dir: normalized
                };
            }
        }

        return null;
    }

    function cross2D(a, b) {
        return (a.x * b.z) - (a.z * b.x);
    }

    function intersectRayWithSegment(ray, axis) {
        const p = ray.start;
        const r = ray.dir;
        const q = axis.a;
        const s = {
            x: axis.b.x - axis.a.x,
            z: axis.b.z - axis.a.z
        };
        const denominator = cross2D(r, s);

        if (Math.abs(denominator) < 1e-8) return null;

        const qp = {
            x: q.x - p.x,
            z: q.z - p.z
        };
        const tRay = cross2D(qp, s) / denominator;
        const tAxis = cross2D(qp, r) / denominator;

        if (tRay < 0 || tAxis < 0 || tAxis > 1) {
            return null;
        }

        return {
            point: {
                x: p.x + (r.x * tRay),
                z: p.z + (r.z * tRay)
            },
            tRay,
            tAxis
        };
    }

    function dedupeAxisHits(hits) {
        const unique = [];

        hits
            .sort((a, b) => a.tAxis - b.tAxis)
            .forEach((hit) => {
                const previous = unique[unique.length - 1];
                if (!previous || Math.abs(previous.tAxis - hit.tAxis) > 1e-4) {
                    unique.push(hit);
                }
            });

        return unique;
    }

    function chooseAxisSegments(axis, hits, footprint, concaveCorners, shapeType) {
        if (!hits.length) {
            return [{ start: axis.a, end: axis.b, axisId: axis.id }];
        }

        const uniqueHits = dedupeAxisHits(hits);
        const breakpoints = [0, ...uniqueHits.map((hit) => hit.tAxis), 1];
        const candidateSegments = [];

        for (let index = 0; index < breakpoints.length - 1; index += 1) {
            const t0 = breakpoints[index];
            const t1 = breakpoints[index + 1];
            if ((t1 - t0) < 1e-4) continue;

            const start = axisPointAt(axis, t0);
            const end = axisPointAt(axis, t1);
            const midpoint = axisPointAt(axis, (t0 + t1) / 2);
            const inside = pointInPolygon(midpoint.x, midpoint.z, footprint);
            const nearestConcave = concaveCorners.length
                ? Math.min(...concaveCorners.map((corner) => pointDistance2D(midpoint, corner)))
                : 0;

            candidateSegments.push({
                start,
                end,
                midpoint,
                inside,
                length: pointDistance2D(start, end),
                score: nearestConcave
            });
        }

        const validSegments = candidateSegments.filter((segment) => segment.inside);
        if (!validSegments.length) return [];

        if (shapeType === 't-shape' && axis.id === 'cross-axis' && uniqueHits.length >= 2) {
            return [{
                start: axisPointAt(axis, uniqueHits[0].tAxis),
                end: axisPointAt(axis, uniqueHits[uniqueHits.length - 1].tAxis),
                axisId: axis.id
            }];
        }

        validSegments.sort((a, b) => {
            if (Math.abs(b.score - a.score) > 1e-4) {
                return b.score - a.score;
            }
            return b.length - a.length;
        });

        return [{
            start: validSegments[0].start,
            end: validSegments[0].end,
            axisId: axis.id
        }];
    }

    function buildRoofGraph(shapeType, byId, roofProfiles, footprint, concaveCorners) {
        const graph = {
            eaves: footprint,
            ridges: [],
            valleys: [],
            nodes: []
        };

        if (shapeType === 'rect') {
            const main = byId.main;
            const ridge = roofProfiles.main;
            if (currentRoofType === 'gable') {
                graph.ridges.push(
                    ridge.ridgeAlong === 'z'
                        ? { start: { x: main.x, z: main.zMin }, end: { x: main.x, z: main.zMax } }
                        : { start: { x: main.xMin, z: main.z }, end: { x: main.xMax, z: main.z } }
                );
            } else {
                graph.ridges.push(
                    ridge.ridgeAlong === 'z'
                        ? { start: { x: main.x, z: main.z - Math.max(main.depth * 0.18, 0.95) }, end: { x: main.x, z: main.z + Math.max(main.depth * 0.18, 0.95) } }
                        : { start: { x: main.x - Math.max(main.width * 0.18, 0.95), z: main.z }, end: { x: main.x + Math.max(main.width * 0.18, 0.95), z: main.z } }
                );
            }
            return graph;
        }

        if (shapeType === 'l-shape') {
            const main = byId.main;
            const wing = byId.wing;
            const axes = [
                rectAxis(main, 'horizontal', 'main-axis'),
                rectAxis(wing, 'vertical', 'wing-axis')
            ];
            const concave = concaveCorners[0] || { x: wing.xMin, z: main.zMin };
            const valleyRay = buildValleyRay(concave, footprint);
            const axisHits = new Map();

            graph.nodes.push(concave);

            axes.forEach((axis) => axisHits.set(axis.id, []));

            if (valleyRay) {
                const hits = axes
                    .map((axis) => {
                        const hit = intersectRayWithSegment(valleyRay, axis);
                        if (!hit) return null;
                        const enriched = { ...hit, axisId: axis.id };
                        axisHits.get(axis.id).push(enriched);
                        return enriched;
                    })
                    .filter(Boolean)
                    .sort((a, b) => a.tRay - b.tRay);

                if (hits.length) {
                    graph.valleys.push({
                        start: concave,
                        end: hits[0].point
                    });
                    graph.nodes.push(hits[0].point);
                }
            }

            axes.forEach((axis) => {
                const ridgeSegments = chooseAxisSegments(axis, axisHits.get(axis.id) || [], footprint, [concave], shapeType);
                ridgeSegments.forEach((segment) => graph.ridges.push(segment));
            });

            return graph;
        }

        if (shapeType === 't-shape') {
            const cross = byId.cross;
            const stem = byId.stem;
            const axes = [
                rectAxis(cross, 'horizontal', 'cross-axis'),
                rectAxis(stem, 'vertical', 'stem-axis')
            ];
            const sortedConcaves = concaveCorners.slice().sort((a, b) => a.x - b.x);
            const leftConcave = sortedConcaves[0] || { x: stem.xMin, z: cross.zMin };
            const rightConcave = sortedConcaves[1] || { x: stem.xMax, z: cross.zMin };
            const valleyRays = [
                buildValleyRay(leftConcave, footprint),
                buildValleyRay(rightConcave, footprint)
            ].filter(Boolean);
            const axisHits = new Map();

            graph.nodes.push(leftConcave, rightConcave);
            axes.forEach((axis) => axisHits.set(axis.id, []));

            valleyRays.forEach((ray, rayIndex) => {
                const originCorner = rayIndex === 0 ? leftConcave : rightConcave;
                const hits = axes
                    .map((axis) => {
                        const hit = intersectRayWithSegment(ray, axis);
                        if (!hit) return null;
                        const enriched = { ...hit, axisId: axis.id };
                        axisHits.get(axis.id).push(enriched);
                        return enriched;
                    })
                    .filter(Boolean)
                    .sort((a, b) => a.tRay - b.tRay);

                if (hits.length) {
                    graph.valleys.push({
                        start: originCorner,
                        end: hits[0].point
                    });
                    graph.nodes.push(hits[0].point);
                }
            });

            axes.forEach((axis) => {
                const ridgeSegments = chooseAxisSegments(axis, axisHits.get(axis.id) || [], footprint, [leftConcave, rightConcave], shapeType);
                ridgeSegments.forEach((segment) => graph.ridges.push(segment));
            });

            return graph;
        }

        return graph;
    }

    function getShapePlan(shapeType) {
        normalizeShapeDimensions(shapeType);
        const dims = { ...getShapeDimensions(shapeType) };
        const rawRects = createRawShapeRects(shapeType, dims);
        const roofRawRects = inflateRawRects(rawRects, currentEaveOverhang);
        const blocks = centerRawRects(rawRects);
        const roofBlocks = centerRawRects(roofRawRects);
        const byId = Object.fromEntries(blocks.map((block) => [block.id, block]));
        const roofById = Object.fromEntries(roofBlocks.map((block) => [block.id, block]));
        const roofProfiles = getRoofProfiles(shapeType, roofBlocks);
        const footprintPolygon = buildUnifiedFootprint(roofBlocks);
        const concaveCorners = findConcaveCorners(footprintPolygon);
        const roofGraph = buildRoofGraph(shapeType, byId, roofProfiles, footprintPolygon, concaveCorners);
        const footprint = computeUnionArea(rawRects);
        const roofEstimate = estimateRoofArea(computeUnionArea(roofRawRects), shapeType, dims);
        const valleys = getValleySegments(shapeType, roofById, roofProfiles);

        return {
            dims,
            rawRects,
            roofRawRects,
            blocks,
            roofBlocks,
            byId,
            roofById,
            roofProfiles,
            footprintPolygon,
            concaveCorners,
            roofGraph,
            footprint,
            roofEstimate,
            valleys
        };
    }

    function isPointInsideBlock(block, x, z, padding) {
        const inset = padding || 0;
        return (
            x >= (block.xMin + inset) &&
            x <= (block.xMax - inset) &&
            z >= (block.zMin + inset) &&
            z <= (block.zMax - inset)
        );
    }

    function getBlockRoofHeightAtPoint(block, roofProfile, x, z) {
        if (!isPointInsideBlock(block, x, z, 0)) return null;

        if (currentRoofType === 'gable') {
            const halfSpan = roofProfile.ridgeAlong === 'x' ? (block.depth / 2) : (block.width / 2);
            const distance = roofProfile.ridgeAlong === 'x'
                ? Math.abs(z - block.z)
                : Math.abs(x - block.x);
            const factor = Math.max(0, 1 - (distance / Math.max(halfSpan, 0.01)));
            return block.height + (roofProfile.roofHeight * factor);
        }

        const ridgeHalf = roofProfile.ridgeAlong === 'x'
            ? Math.max(block.width * 0.18, 0.95)
            : Math.max(block.depth * 0.18, 0.95);

        let spanFactor;
        let ridgeFactor;

        if (roofProfile.ridgeAlong === 'x') {
            const halfDepth = block.depth / 2;
            const halfWidth = block.width / 2;
            spanFactor = 1 - (Math.abs(z - block.z) / Math.max(halfDepth, 0.01));
            if (Math.abs(x - block.x) <= ridgeHalf) {
                ridgeFactor = 1;
            } else {
                ridgeFactor = 1 - ((Math.abs(x - block.x) - ridgeHalf) / Math.max(halfWidth - ridgeHalf, 0.01));
            }
        } else {
            const halfWidth = block.width / 2;
            const halfDepth = block.depth / 2;
            spanFactor = 1 - (Math.abs(x - block.x) / Math.max(halfWidth, 0.01));
            if (Math.abs(z - block.z) <= ridgeHalf) {
                ridgeFactor = 1;
            } else {
                ridgeFactor = 1 - ((Math.abs(z - block.z) - ridgeHalf) / Math.max(halfDepth - ridgeHalf, 0.01));
            }
        }

        const factor = Math.max(0, Math.min(spanFactor, ridgeFactor));
        return block.height + (roofProfile.roofHeight * factor);
    }

    function getCombinedRoofHeight(plan, x, z) {
        let maxHeight = null;

        plan.roofBlocks.forEach((block) => {
            const roofProfile = plan.roofProfiles[block.id];
            if (!roofProfile) return;

            const height = getBlockRoofHeightAtPoint(block, roofProfile, x, z);
            if (height === null) return;
            if (maxHeight === null || height > maxHeight) {
                maxHeight = height;
            }
        });

        return maxHeight;
    }

    function normalizeVector2D(x, z) {
        const length = Math.hypot(x, z) || 1;
        return {
            x: x / length,
            z: z / length
        };
    }

    function segmentLength2D(a, b) {
        return Math.hypot(b.x - a.x, b.z - a.z);
    }

    function getDrainageSystemConfig() {
        return DRAINAGE_SYSTEMS[currentDrainageKey] || DRAINAGE_SYSTEMS.none;
    }

    function getFootprintSegments(points) {
        if (!points || points.length < 2) return [];

        return points.map((point, index) => {
            const next = points[(index + 1) % points.length];
            return {
                index,
                a: point,
                b: next,
                length: segmentLength2D(point, next),
                horizontal: Math.abs(point.z - next.z) < 1e-6,
                vertical: Math.abs(point.x - next.x) < 1e-6
            };
        });
    }

    function getSegmentOutwardNormal(segment, polygon) {
        const direction = normalizeVector2D(segment.b.x - segment.a.x, segment.b.z - segment.a.z);
        const midpoint = {
            x: (segment.a.x + segment.b.x) / 2,
            z: (segment.a.z + segment.b.z) / 2
        };
        const candidateNormals = [
            { x: -direction.z, z: direction.x },
            { x: direction.z, z: -direction.x }
        ];

        for (const normal of candidateNormals) {
            const probe = {
                x: midpoint.x + (normal.x * 0.14),
                z: midpoint.z + (normal.z * 0.14)
            };
            if (!pointInPolygon(probe.x, probe.z, polygon)) {
                return normal;
            }
        }

        return candidateNormals[0];
    }

    function classifyDrainageCorners(points) {
        if (!points || points.length < 3) {
            return {
                exterior: 0,
                interior: 0,
                concaveKeys: new Set()
            };
        }

        const concaveCorners = findConcaveCorners(points);
        const concaveKeys = new Set(concaveCorners.map((corner) => pointKey(corner.x, corner.z)));

        return {
            exterior: Math.max(points.length - concaveCorners.length, 0),
            interior: concaveCorners.length,
            concaveKeys
        };
    }

    function shouldUseSegmentForDrainage(plan, segment) {
        if (!plan || !segment) return false;

        if (currentShapeType === 'rect' && currentRoofType === 'gable') {
            const ridgeAlong = plan.roofProfiles.main?.ridgeAlong || 'x';
            return ridgeAlong === 'x' ? segment.horizontal : segment.vertical;
        }

        return true;
    }

    function getDrainageRuns(segments) {
        if (!segments.length) return [];

        if (currentShapeType === 'rect' && currentRoofType === 'gable') {
            return segments.map((segment) => [segment]);
        }

        return [segments];
    }

    function buildDrainageAnchorCandidates(segments) {
        const candidateMap = new Map();

        const registerCandidate = (point, normal, isCorner) => {
            const key = pointKey(point.x, point.z);
            const entry = candidateMap.get(key) || {
                point: { x: point.x, z: point.z },
                normalX: 0,
                normalZ: 0,
                weight: 0,
                isCorner: false
            };
            entry.normalX += normal.x;
            entry.normalZ += normal.z;
            entry.weight += 1;
            entry.isCorner = entry.isCorner || Boolean(isCorner);
            candidateMap.set(key, entry);
        };

        segments.forEach((segment) => {
            registerCandidate(segment.a, segment.normal, true);
            registerCandidate(segment.b, segment.normal, true);

            if (segment.length > DRAINAGE_RULES.maxGutterPerDownspout * 0.75) {
                registerCandidate({
                    x: (segment.a.x + segment.b.x) / 2,
                    z: (segment.a.z + segment.b.z) / 2
                }, segment.normal, false);
            }
        });

        return Array.from(candidateMap.values()).map((entry) => {
            const normalized = normalizeVector2D(entry.normalX, entry.normalZ);
            return {
                point: entry.point,
                normal: normalized,
                isCorner: entry.isCorner
            };
        });
    }

    function selectPreferredDrainageAnchors(candidates, count) {
        if (!candidates.length || count <= 0) return [];

        const cornerCandidates = candidates.filter((candidate) => candidate.isCorner);
        const fallbackCandidates = candidates.filter((candidate) => !candidate.isCorner);

        if (cornerCandidates.length >= count) {
            return selectDistributedCandidates(cornerCandidates, count);
        }

        const selectedCorners = cornerCandidates.slice();
        const remaining = count - selectedCorners.length;
        const selectedFallbacks = selectDistributedCandidates(fallbackCandidates, remaining);
        return [...selectedCorners, ...selectedFallbacks];
    }

    function selectDistributedCandidates(candidates, count) {
        if (!candidates.length || count <= 0) return [];
        if (count >= candidates.length) return candidates.slice();

        const selected = [];
        const used = new Set();

        for (let index = 0; index < count; index += 1) {
            let candidateIndex = Math.floor((index * candidates.length) / count);

            while (used.has(candidateIndex)) {
                candidateIndex = (candidateIndex + 1) % candidates.length;
            }

            used.add(candidateIndex);
            selected.push(candidates[candidateIndex]);
        }

        return selected;
    }

    function createDrainageLineItem(product, quantity, note) {
        const totalBeforeDiscount = quantity * product.unitPrice;
        const discountValue = totalBeforeDiscount * product.discount;
        return {
            ...product,
            quantity,
            note: note || '',
            totalBeforeDiscount,
            discountValue,
            totalAfterDiscount: totalBeforeDiscount - discountValue
        };
    }

    function createEstimateLineItem(config) {
        const quantity = Number.isFinite(config.quantity) ? config.quantity : 0;
        const unitPrice = Number.isFinite(config.unitPrice) ? config.unitPrice : null;
        const discount = unitPrice !== null ? (config.discount || 0) : 0;
        const totalBeforeDiscount = unitPrice !== null ? quantity * unitPrice : 0;
        const discountValue = totalBeforeDiscount * discount;

        return {
            label: config.label,
            quantity,
            unit: config.unit,
            unitPrice,
            discount,
            note: config.note || '',
            totalBeforeDiscount,
            discountValue,
            totalAfterDiscount: totalBeforeDiscount - discountValue
        };
    }

    function sumSegmentLengths(segments) {
        return (segments || []).reduce((sum, segment) => {
            const start = segment.start || segment.a;
            const end = segment.end || segment.b;
            if (!start || !end) return sum;
            return sum + Math.hypot((end.x - start.x), (end.z - start.z));
        }, 0);
    }

    function resolveQualityUnitPrice(config, qualityKey, fallbackPrice = null) {
        if (!config) return fallbackPrice;

        if (Number.isFinite(config.unitPrice)) {
            return config.unitPrice;
        }

        if (config.unitPrice && typeof config.unitPrice === 'object') {
            const qualityPrice = config.unitPrice[qualityKey];
            if (Number.isFinite(qualityPrice)) {
                return qualityPrice;
            }
            if (Number.isFinite(config.unitPrice.standart)) {
                return config.unitPrice.standart;
            }
        }

        return fallbackPrice;
    }

    function buildBitumenRoofEstimate(plan, area, qualityOption) {
        if (!plan || currentMaterialType !== 'bitumen-shingle' || !qualityOption) return null;

        const footprintSegments = getFootprintSegments(plan.footprintPolygon || []);
        const eaveLength = footprintSegments
            .filter((segment) => shouldUseSegmentForDrainage(plan, segment))
            .reduce((sum, segment) => sum + segment.length, 0);
        const rakeLength = footprintSegments
            .filter((segment) => !shouldUseSegmentForDrainage(plan, segment))
            .reduce((sum, segment) => sum + segment.length, 0);
        const ridgeLength = Math.max(sumSegmentLengths(plan.roofGraph?.ridges || []), 0);
        const mainMaterialQuantity = area * BITUMEN_ESTIMATE_FACTORS.shinglesCoverage;
        const effectiveShinglePrice = qualityOption.price;
        const items = [
            createEstimateLineItem({
                label: qualityOption.label,
                quantity: mainMaterialQuantity,
                unit: 'mp',
                unitPrice: qualityOption.price,
                discount: 0,
                note: 'Suprafata x 1.025 pentru suprapuneri si pierderi uzuale'
            }),
            createEstimateLineItem({
                label: 'Coama Superglass 3TAB',
                quantity: ridgeLength,
                unit: 'ml',
                unitPrice: qualityOption.price,
                discount: 0,
                note: 'Estimare dupa lungimea totala a coamelor din geometria curenta'
            }),
            createEstimateLineItem({
                ...BITUMEN_PRICING.underlayment,
                quantity: area * BITUMEN_ESTIMATE_FACTORS.underlaymentCoverage,
                note: 'Membrana suport sub sindrila, calculata cu factor 1.15'
            }),
            createEstimateLineItem({
                ...BITUMEN_PRICING.nails,
                quantity: Math.max(1, Math.ceil(area / BITUMEN_ESTIMATE_FACTORS.nailsCoverage)),
                note: 'Consum estimat la aproximativ 1 kg / 16 mp'
            }),
            createEstimateLineItem({
                ...BITUMEN_PRICING.plasticBatten,
                quantity: Math.max(1, Math.ceil(ridgeLength / BITUMEN_ESTIMATE_FACTORS.battenCoverage) + 1),
                note: 'Elemente auxiliare pentru inchideri si zona de coama'
            }),
            createEstimateLineItem({
                ...BITUMEN_PRICING.aerator,
                quantity: Math.max(1, Math.round(area / BITUMEN_ESTIMATE_FACTORS.aeratorCoverage)),
                note: 'Estimare orientativa: 1 buc la 30-35 mp'
            }),
            createEstimateLineItem({
                ...BITUMEN_PRICING.osb12,
                quantity: Math.ceil(area / BITUMEN_ESTIMATE_FACTORS.osbSheetArea) + BITUMEN_ESTIMATE_FACTORS.extraOsbSheets,
                note: 'OSB 3 12 mm, calculat dupa formatul 2.5 x 1.25 m'
            }),
            createEstimateLineItem({
                ...BITUMEN_PRICING.gutterTrim,
                quantity: roundEvenMeters(eaveLength + BITUMEN_ESTIMATE_FACTORS.gutterTrimAllowance),
                note: 'Regleta de streașină cu rezerva de montaj'
            })
        ].filter((item) => item.quantity > 0.0001);

        const total = items.reduce((sum, item) => sum + item.totalAfterDiscount, 0);

        return {
            key: qualityOption.key,
            label: qualityOption.label,
            mainMaterialQuantity,
            effectiveShinglePrice,
            ridgeLength,
            eaveLength,
            items,
            total
        };
    }

    function buildBitumenRoofEstimate(plan, area, qualityOption) {
        if (!plan || currentMaterialType !== 'bitumen-shingle' || !qualityOption) return null;

        const footprintSegments = getFootprintSegments(plan.footprintPolygon || []);
        const eaveLength = footprintSegments
            .filter((segment) => shouldUseSegmentForDrainage(plan, segment))
            .reduce((sum, segment) => sum + segment.length, 0);
        const rakeLength = footprintSegments
            .filter((segment) => !shouldUseSegmentForDrainage(plan, segment))
            .reduce((sum, segment) => sum + segment.length, 0);
        const ridgeLength = Math.max(sumSegmentLengths(plan.roofGraph?.ridges || []), 0);
        const mainMaterialQuantity = area * BITUMEN_ESTIMATE_FACTORS.shinglesCoverage;
        const effectiveShinglePrice = qualityOption.price;
        const ridgeUnitPrice = resolveQualityUnitPrice(BITUMEN_PRICING.ridgeCaps, qualityOption.key, effectiveShinglePrice);
        const underlaymentUnitPrice = resolveQualityUnitPrice(BITUMEN_PRICING.underlayment, qualityOption.key, 82);
        const diffusionUnitPrice = resolveQualityUnitPrice(BITUMEN_PRICING.diffusionMembrane, qualityOption.key, 15);
        const battenUnitPrice = resolveQualityUnitPrice(BITUMEN_PRICING.plasticBatten, qualityOption.key, 95);
        const osbUnitPrice = resolveQualityUnitPrice(BITUMEN_PRICING.osb12, qualityOption.key, 295);
        const gutterTrimUnitPrice = resolveQualityUnitPrice(BITUMEN_PRICING.gutterTrim, qualityOption.key, 84);
        const frontonTrimUnitPrice = resolveQualityUnitPrice(BITUMEN_PRICING.frontonTrim, qualityOption.key, 114);
        const items = [
            createEstimateLineItem({
                label: qualityOption.label,
                quantity: mainMaterialQuantity,
                unit: 'mp',
                unitPrice: effectiveShinglePrice,
                discount: 0,
                note: 'Suprafata x 1.025 pentru suprapuneri si pierderi uzuale'
            }),
            createEstimateLineItem({
                label: BITUMEN_PRICING.ridgeCaps.label,
                quantity: ridgeLength,
                unit: BITUMEN_PRICING.ridgeCaps.unit,
                unitPrice: ridgeUnitPrice,
                discount: BITUMEN_PRICING.ridgeCaps.discount,
                note: 'Calcul dupa lungimea totala a coamelor din geometria curenta'
            }),
            createEstimateLineItem({
                label: BITUMEN_PRICING.underlayment.label,
                quantity: area * BITUMEN_ESTIMATE_FACTORS.underlaymentCoverage,
                unit: BITUMEN_PRICING.underlayment.unit,
                unitPrice: underlaymentUnitPrice,
                discount: BITUMEN_PRICING.underlayment.discount,
                note: 'Membrana suport sub sindrila, calculata cu factor 1.15'
            }),
            createEstimateLineItem({
                label: BITUMEN_PRICING.diffusionMembrane.label,
                quantity: area * BITUMEN_ESTIMATE_FACTORS.diffusionCoverage,
                unit: BITUMEN_PRICING.diffusionMembrane.unit,
                unitPrice: diffusionUnitPrice,
                discount: BITUMEN_PRICING.diffusionMembrane.discount,
                note: 'Membrana de difuzie, calculata cu factor 1.10'
            }),
            createEstimateLineItem({
                ...BITUMEN_PRICING.nails,
                quantity: Math.max(1, Math.ceil(area / BITUMEN_ESTIMATE_FACTORS.nailsCoverage)),
                note: 'Consum estimat la aproximativ 1 kg / 16 mp'
            }),
            createEstimateLineItem({
                label: BITUMEN_PRICING.plasticBatten.label,
                quantity: Math.max(1, Math.ceil(ridgeLength / BITUMEN_ESTIMATE_FACTORS.battenCoverage) + 1),
                unit: BITUMEN_PRICING.plasticBatten.unit,
                unitPrice: battenUnitPrice,
                discount: BITUMEN_PRICING.plasticBatten.discount,
                note: 'Elemente auxiliare pentru inchideri si zona de coama'
            }),
            createEstimateLineItem({
                ...BITUMEN_PRICING.aerator,
                quantity: Math.max(1, Math.round(area / BITUMEN_ESTIMATE_FACTORS.aeratorCoverage)),
                note: 'Estimare orientativa: 1 buc la 30-35 mp'
            }),
            createEstimateLineItem({
                label: BITUMEN_PRICING.osb12.label,
                quantity: Math.ceil(area / BITUMEN_ESTIMATE_FACTORS.osbSheetArea) + BITUMEN_ESTIMATE_FACTORS.extraOsbSheets,
                unit: BITUMEN_PRICING.osb12.unit,
                unitPrice: osbUnitPrice,
                discount: BITUMEN_PRICING.osb12.discount,
                note: 'OSB 3 12 mm, calculat dupa formatul 2.5 x 1.25 m'
            }),
            createEstimateLineItem({
                label: BITUMEN_PRICING.gutterTrim.label,
                quantity: roundEvenMeters(eaveLength + BITUMEN_ESTIMATE_FACTORS.gutterTrimAllowance),
                unit: BITUMEN_PRICING.gutterTrim.unit,
                unitPrice: gutterTrimUnitPrice,
                discount: BITUMEN_PRICING.gutterTrim.discount,
                note: 'Regletă de streașină cu rezervă de montaj'
            }),
            createEstimateLineItem({
                label: BITUMEN_PRICING.frontonTrim.label,
                quantity: roundEvenMeters(rakeLength),
                unit: BITUMEN_PRICING.frontonTrim.unit,
                unitPrice: frontonTrimUnitPrice,
                discount: BITUMEN_PRICING.frontonTrim.discount,
                note: 'Bordura fronton calculata pe muchiile fara jgheab'
            })
        ].filter((item) => item.quantity > 0.0001);

        const total = items.reduce((sum, item) => sum + item.totalAfterDiscount, 0);

        return {
            key: qualityOption.key,
            label: qualityOption.label,
            mainMaterialQuantity,
            effectiveShinglePrice,
            ridgeLength,
            eaveLength,
            rakeLength,
            items,
            total
        };
    }

    function buildModularRoofEstimate(plan, area, qualityOption) {
        if (!plan || currentMaterialType !== 'metal-modular' || !qualityOption) return null;

        const footprintSegments = getFootprintSegments(plan.footprintPolygon || []);
        const eaveLength = footprintSegments
            .filter((segment) => shouldUseSegmentForDrainage(plan, segment))
            .reduce((sum, segment) => sum + segment.length, 0);
        const rakeLength = footprintSegments
            .filter((segment) => !shouldUseSegmentForDrainage(plan, segment))
            .reduce((sum, segment) => sum + segment.length, 0);
        const ridgeSegments = plan.roofGraph?.ridges || [];
        const valleySegments = plan.roofGraph?.valleys || [];
        const ridgeLength = Math.max(sumSegmentLengths(ridgeSegments), 0);
        const valleyLength = Math.max(sumSegmentLengths(valleySegments), 0);
        const ridgeEndCaps = ridgeSegments.length ? ridgeSegments.length * 2 : 0;

        const ridgeUnitPrice = resolveQualityUnitPrice(MODULAR_PRICING.ridge, qualityOption.key, 149);
        const ridgeCapUnitPrice = resolveQualityUnitPrice(MODULAR_PRICING.ridgeCap, qualityOption.key, 144);
        const frontonUnitPrice = resolveQualityUnitPrice(MODULAR_PRICING.frontonTrim, qualityOption.key, 144);
        const dripEdgeUnitPrice = resolveQualityUnitPrice(MODULAR_PRICING.dripEdge, qualityOption.key, 35);
        const gutterTrimUnitPrice = resolveQualityUnitPrice(MODULAR_PRICING.gutterTrim, qualityOption.key, 89);
        const innerValleyUnitPrice = resolveQualityUnitPrice(MODULAR_PRICING.innerValley, qualityOption.key, 175);
        const diffusionUnitPrice = resolveQualityUnitPrice(MODULAR_PRICING.diffusionMembrane, qualityOption.key, 15);
        const ridgeTapeUnitPrice = resolveQualityUnitPrice(MODULAR_PRICING.ridgeTape, qualityOption.key, 279);
        const eaveCombUnitPrice = resolveQualityUnitPrice(MODULAR_PRICING.eaveComb, qualityOption.key, 57);
        const ventilationGridUnitPrice = resolveQualityUnitPrice(MODULAR_PRICING.ventilationGrid, qualityOption.key, 45);
        const screws35UnitPrice = resolveQualityUnitPrice(MODULAR_PRICING.screws35, qualityOption.key, 1.15);

        const items = [
            createEstimateLineItem({
                label: qualityOption.label,
                quantity: area,
                unit: 'mp',
                unitPrice: qualityOption.price,
                discount: 0,
                note: 'Produs principal pentru țigla metalică modulară'
            }),
            createEstimateLineItem({
                label: MODULAR_PRICING.ridge.label,
                quantity: ridgeLength,
                unit: MODULAR_PRICING.ridge.unit,
                unitPrice: ridgeUnitPrice,
                discount: MODULAR_PRICING.ridge.discount,
                note: 'Calculata dupa lungimea totala a coamelor'
            }),
            createEstimateLineItem({
                label: MODULAR_PRICING.ridgeCap.label,
                quantity: ridgeEndCaps,
                unit: MODULAR_PRICING.ridgeCap.unit,
                unitPrice: ridgeCapUnitPrice,
                discount: MODULAR_PRICING.ridgeCap.discount,
                note: 'Cate doua capace pentru fiecare tronson de coama'
            }),
            createEstimateLineItem({
                label: MODULAR_PRICING.frontonTrim.label,
                quantity: roundEvenMeters(rakeLength + (rakeLength > 0 ? MODULAR_ESTIMATE_FACTORS.frontonAllowance : 0)),
                unit: MODULAR_PRICING.frontonTrim.unit,
                unitPrice: frontonUnitPrice,
                discount: MODULAR_PRICING.frontonTrim.discount,
                note: 'Muchii de fronton rotunjite cu rezerva de montaj'
            }),
            createEstimateLineItem({
                label: MODULAR_PRICING.dripEdge.label,
                quantity: roundEvenMeters(eaveLength),
                unit: MODULAR_PRICING.dripEdge.unit,
                unitPrice: dripEdgeUnitPrice,
                discount: MODULAR_PRICING.dripEdge.discount,
                note: 'Picurător pe muchiile de streașină'
            }),
            createEstimateLineItem({
                label: MODULAR_PRICING.gutterTrim.label,
                quantity: roundEvenMeters(eaveLength + MODULAR_ESTIMATE_FACTORS.gutterAllowance),
                unit: MODULAR_PRICING.gutterTrim.unit,
                unitPrice: gutterTrimUnitPrice,
                discount: MODULAR_PRICING.gutterTrim.discount,
                note: 'Regleta de jgheab cu rezerva tehnica de montaj'
            }),
            createEstimateLineItem({
                label: MODULAR_PRICING.innerValley.label,
                quantity: roundEvenMeters(valleyLength),
                unit: MODULAR_PRICING.innerValley.unit,
                unitPrice: innerValleyUnitPrice,
                discount: MODULAR_PRICING.innerValley.discount,
                note: 'Lungimea doliilor interioare din geometria acoperisului'
            }),
            createEstimateLineItem({
                label: MODULAR_PRICING.diffusionMembrane.label,
                quantity: area * MODULAR_ESTIMATE_FACTORS.diffusionMembrane,
                unit: MODULAR_PRICING.diffusionMembrane.unit,
                unitPrice: diffusionUnitPrice,
                discount: MODULAR_PRICING.diffusionMembrane.discount,
                note: 'Membrana de difuzie calculata cu factor 1.10'
            }),
            createEstimateLineItem({
                label: MODULAR_PRICING.ridgeTape.label,
                quantity: Math.ceil(ridgeLength / MODULAR_ESTIMATE_FACTORS.ridgeTapeRollLength),
                unit: MODULAR_PRICING.ridgeTape.unit,
                unitPrice: ridgeTapeUnitPrice,
                discount: MODULAR_PRICING.ridgeTape.discount,
                note: 'Role necesare pentru etansarea coamei'
            }),
            createEstimateLineItem({
                label: MODULAR_PRICING.eaveComb.label,
                quantity: Math.ceil(eaveLength * MODULAR_ESTIMATE_FACTORS.eaveCombPerMeter),
                unit: MODULAR_PRICING.eaveComb.unit,
                unitPrice: eaveCombUnitPrice,
                discount: MODULAR_PRICING.eaveComb.discount,
                note: 'Piese pentru ventilarea și protecția streașinii'
            }),
            createEstimateLineItem({
                label: MODULAR_PRICING.ventilationGrid.label,
                quantity: roundEvenMeters(eaveLength),
                unit: MODULAR_PRICING.ventilationGrid.unit,
                unitPrice: ventilationGridUnitPrice,
                discount: MODULAR_PRICING.ventilationGrid.discount,
                note: 'Grilă de ventilare la streașină pe lungimile expuse'
            }),
            createEstimateLineItem({
                label: MODULAR_PRICING.screws35.label,
                quantity: Math.ceil(area * MODULAR_ESTIMATE_FACTORS.screws35PerSquareMeter),
                unit: MODULAR_PRICING.screws35.unit,
                unitPrice: screws35UnitPrice,
                discount: MODULAR_PRICING.screws35.discount,
                note: 'Consum tehnic estimat cu 8 buc / mp'
            })
        ].filter((item) => item.quantity > 0.0001);

        const total = items.reduce((sum, item) => sum + item.totalAfterDiscount, 0);

        return {
            key: qualityOption.key,
            label: qualityOption.label,
            ridgeLength,
            eaveLength,
            rakeLength,
            valleyLength,
            items,
            total
        };
    }

    function renderQualityOffers(offers) {
        if (!qualityOffersEl) return;

        if (!offers || !offers.length) {
            qualityOffersEl.innerHTML = '';
            return;
        }

        qualityOffersEl.innerHTML = offers.map((offer) => {
            const tierClass = `cfg__offer-card cfg__offer-card--${offer.key}`;
            const note = currentMaterialType === 'bitumen-shingle'
                ? offerTexts.noteBitumen
                : currentMaterialType === 'metal-modular'
                    ? offerTexts.noteModular
                    : offerTexts.noteGeneric;

            return `
                <article class="${tierClass}">
                    <div class="cfg__offer-head">
                        <strong>${offer.label}</strong>
                        <span>${offer.key.toUpperCase()}</span>
                    </div>
                    <div class="cfg__offer-total">${Math.round(offer.total).toLocaleString(numberLocale)} ${offerTexts.currency}</div>
                    <div class="cfg__offer-meta">
                        <div>${offerTexts.material}: ${Math.round(offer.materialTotal).toLocaleString(numberLocale)} ${offerTexts.currency}</div>
                        <div>${offerTexts.labor}: ${Math.round(offer.laborTotal).toLocaleString(numberLocale)} ${offerTexts.currency}</div>
                        <div>${offerTexts.drainage}: ${Math.round(offer.drainageCost).toLocaleString(numberLocale)} ${offerTexts.currency}</div>
                        <div>${offerTexts.drainageRates}</div>
                        <div>${note}</div>
                    </div>
                </article>
            `;
        }).join('');
    }

    function renderEstimateBreakdown(estimate, title = 'Deviz orientativ') {
        const container = document.getElementById('cfgEstimateBreakdown');
        if (!container) return;

        if (!estimate || !estimate.items || !estimate.items.length) {
            container.innerHTML = '';
            container.hidden = true;
            return;
        }

        const rows = estimate.items.map((item) => {
            const unitPriceText = item.unitPrice !== null
                ? `${Math.round(item.unitPrice).toLocaleString('ro-RO')} lei/${item.unit}`
                : 'tarif nealocat';
            const discountText = item.discount ? ` (-${Math.round(item.discount * 100)}%)` : '';

            return `
                <div class="cfg__estimate-line">
                    <div class="cfg__estimate-line-main">
                        <strong>${item.label}</strong>
                        <span>${formatEstimateQuantity(item.quantity, item.unit)} x ${unitPriceText}${discountText}</span>
                    </div>
                    <div class="cfg__estimate-line-value">${Math.round(item.totalAfterDiscount).toLocaleString('ro-RO')} lei</div>
                </div>
            `;
        }).join('');

        container.innerHTML = `
            <p class="cfg__estimate-title">${title}</p>
            ${rows}
        `;
        container.hidden = false;
    }

    function buildDrainageEstimate(plan) {
        const system = getDrainageSystemConfig();
        if (!plan || currentDrainageKey === 'none') return null;

        const rawSegments = getFootprintSegments(plan.footprintPolygon || []);
        const gutterSegments = rawSegments
            .filter((segment) => shouldUseSegmentForDrainage(plan, segment))
            .map((segment) => ({
                ...segment,
                normal: getSegmentOutwardNormal(segment, plan.footprintPolygon)
            }));

        if (!gutterSegments.length) return null;

        const runs = getDrainageRuns(gutterSegments);
        const gutterLength = gutterSegments.reduce((sum, segment) => sum + segment.length, 0);
        const cornerSummary = (currentShapeType === 'rect' && currentRoofType === 'gable')
            ? { exterior: 0, interior: 0 }
            : classifyDrainageCorners(plan.footprintPolygon);
        const minDownspouts = currentShapeType === 'rect' ? 2 : 3;
        const desiredDownspouts = Math.max(minDownspouts, Math.ceil(gutterLength / DRAINAGE_RULES.maxGutterPerDownspout));
        const anchorCandidates = buildDrainageAnchorCandidates(gutterSegments);
        const downspoutAnchors = selectPreferredDrainageAnchors(
            anchorCandidates,
            Math.min(desiredDownspouts, anchorCandidates.length || desiredDownspouts)
        );
        const downspouts = downspoutAnchors.length;
        const wallHeight = Math.max(...plan.blocks.map((block) => block.height));
        const downpipeHeight = wallHeight + DRAINAGE_RULES.downpipeOffset;

        let gutterPieces = 0;
        let gutterConnectors = 0;

        gutterSegments.forEach((segment) => {
            const pieceCount = Math.max(1, Math.ceil(segment.length / DRAINAGE_RULES.gutterPieceLength));
            gutterPieces += pieceCount;
            gutterConnectors += Math.max(0, pieceCount - 1);
        });

        const endCaps = currentShapeType === 'rect' && currentRoofType === 'gable'
            ? runs.length * 2
            : 0;
        const gutterHooks = Math.ceil(gutterLength / DRAINAGE_RULES.hookSpacing);
        const gutterOutlets = downspouts;
        const downpipeElbows = downspouts * 2;
        const dischargeElbows = downspouts;
        const downpipePiecesPerRun = Math.max(1, Math.floor(downpipeHeight / DRAINAGE_RULES.downpipePieceLength));
        const downpipePieces = downspouts * downpipePiecesPerRun;
        const extensionRemainder = Math.max(0, downpipeHeight - (downpipePiecesPerRun * DRAINAGE_RULES.downpipePieceLength));
        const downpipeExtensions = extensionRemainder > 0.02
            ? downspouts * Math.ceil(extensionRemainder / DRAINAGE_RULES.extensionPieceLength)
            : 0;
        const downpipeClamps = downspouts * Math.max(2, Math.ceil(downpipeHeight / DRAINAGE_RULES.clampSpacing));
        const items = [];

        if (system.products) {
            items.push(createDrainageLineItem(
                system.products.gutter,
                gutterPieces,
                `calculat din ${formatLinear(gutterLength)} / ${DRAINAGE_RULES.gutterPieceLength} m`
            ));
            items.push(createDrainageLineItem(
                system.products.gutterHook,
                gutterHooks,
                `pas estimativ de ${DRAINAGE_RULES.hookSpacing.toFixed(2)} m`
            ));
            items.push(createDrainageLineItem(
                system.products.gutterConnector,
                gutterConnectors,
                'imbinari intre tronsoanele de jgheab'
            ));
            items.push(createDrainageLineItem(
                system.products.endCap,
                endCaps,
                'capace pentru capetele deschise ale traseelor'
            ));
            items.push(createDrainageLineItem(
                system.products.exteriorCorner,
                cornerSummary.exterior,
                'colturi exterioare deduse din contur'
            ));
            items.push(createDrainageLineItem(
                system.products.interiorCorner,
                cornerSummary.interior,
                'colturi interioare deduse din contur'
            ));
            items.push(createDrainageLineItem(
                system.products.gutterOutlet,
                gutterOutlets,
                'cate un racord pentru fiecare burlan'
            ));
            items.push(createDrainageLineItem(
                system.products.downpipeElbow,
                downpipeElbows,
                'doua coturi pentru fiecare burlan'
            ));
            items.push(createDrainageLineItem(
                system.products.downpipe,
                downpipePieces,
                `${DRAINAGE_RULES.downpipePieceLength} m / bucata`
            ));
            items.push(createDrainageLineItem(
                system.products.downpipeExtension,
                downpipeExtensions,
                'completare pentru inaltimea utila'
            ));
            items.push(createDrainageLineItem(
                system.products.downpipeClamp,
                downpipeClamps,
                `fixare la ${DRAINAGE_RULES.clampSpacing.toFixed(1)} m`
            ));
            items.push(createDrainageLineItem(
                system.products.dischargeElbow,
                dischargeElbows,
                'evacuare la baza fiecarui burlan'
            ));
        }

        const pricedItems = items.filter((item) => item.quantity > 0);
        const total = pricedItems.reduce((sum, item) => sum + item.totalAfterDiscount, 0);
        const discountTotal = pricedItems.reduce((sum, item) => sum + item.discountValue, 0);

        return {
            system,
            pricingAvailable: Boolean(system.products),
            metrics: {
                gutterLength,
                gutterSegments,
                runCount: runs.length,
                exteriorCorners: cornerSummary.exterior,
                interiorCorners: cornerSummary.interior,
                downspouts,
                downspoutAnchors,
                downpipeHeight,
                gutterPieces,
                gutterConnectors,
                gutterHooks,
                endCaps,
                gutterOutlets,
                downpipeElbows,
                dischargeElbows,
                downpipePieces,
                downpipeExtensions,
                downpipeClamps
            },
            items,
            costs: {
                total,
                discountTotal
            }
        };
    }

    function buildAxisBreaks(min, max, step, anchors) {
        const points = [];
        let cursor = min;

        while (cursor < max) {
            points.push(Number(cursor.toFixed(4)));
            cursor += step;
        }

        points.push(Number(max.toFixed(4)));

        (anchors || []).forEach((anchor) => {
            if (anchor > min && anchor < max) {
                points.push(Number(anchor.toFixed(4)));
            }
        });

        return Array.from(new Set(points)).sort((a, b) => a - b);
    }

    function collectGraphAnchors(graph) {
        const anchors = [];

        function pushPoint(point) {
            if (!point) return;
            anchors.push(point);
        }

        (graph.eaves || []).forEach(pushPoint);
        (graph.nodes || []).forEach(pushPoint);
        (graph.ridges || []).forEach((segment) => {
            pushPoint(segment.start);
            pushPoint(segment.end);
        });
        (graph.valleys || []).forEach((segment) => {
            pushPoint(segment.start);
            pushPoint(segment.end);

            const length = Math.hypot(segment.end.x - segment.start.x, segment.end.z - segment.start.z);
            const steps = Math.max(1, Math.ceil(length / 0.35));
            for (let stepIndex = 1; stepIndex < steps; stepIndex += 1) {
                const t = stepIndex / steps;
                anchors.push({
                    x: segment.start.x + ((segment.end.x - segment.start.x) * t),
                    z: segment.start.z + ((segment.end.z - segment.start.z) * t)
                });
            }
        });

        return anchors;
    }

    function addUnifiedRoofSkin(parent, roofMaterial, plan) {
        const footprintPolygon = plan.footprintPolygon;
        if (!footprintPolygon || !footprintPolygon.length) return;

        const bounds = footprintPolygon.reduce((acc, point) => ({
            minX: Math.min(acc.minX, point.x),
            maxX: Math.max(acc.maxX, point.x),
            minZ: Math.min(acc.minZ, point.z),
            maxZ: Math.max(acc.maxZ, point.z)
        }), {
            minX: Infinity,
            maxX: -Infinity,
            minZ: Infinity,
            maxZ: -Infinity
        });

        const graphAnchors = collectGraphAnchors(plan.roofGraph || { eaves: footprintPolygon });
        const xAnchors = graphAnchors.map((point) => point.x);
        const zAnchors = graphAnchors.map((point) => point.z);
        const subdivisionStep = currentShapeType === 'rect' ? 0.62 : 0.34;
        const xBreaks = buildAxisBreaks(bounds.minX, bounds.maxX, subdivisionStep, xAnchors);
        const zBreaks = buildAxisBreaks(bounds.minZ, bounds.maxZ, subdivisionStep, zAnchors);
        const thickness = 0.12;
        const positions = [];
        const uvs = [];
        const topTriangles = [];

        for (let xi = 0; xi < xBreaks.length - 1; xi += 1) {
            for (let zi = 0; zi < zBreaks.length - 1; zi += 1) {
                const x0 = xBreaks[xi];
                const x1 = xBreaks[xi + 1];
                const z0 = zBreaks[zi];
                const z1 = zBreaks[zi + 1];
                const clippedPolygon = clipFootprintToCell(footprintPolygon, x0, x1, z0, z1);
                if (clippedPolygon.length < 3) continue;

                const lift = 0.035;
                const contour = clippedPolygon.map((point) => new THREE.Vector2(point.x, point.z));
                const triangulated = THREE.ShapeUtils.triangulateShape(contour, []);
                const triangles = triangulated.length ? triangulated : [[0, 1, 2]];

                triangles.forEach((triangle) => {
                    const triPoints = triangle.map((index) => clippedPolygon[index]);
                    const triHeights = triPoints.map((point) => getCombinedRoofHeight(plan, point.x, point.z));

                    if (triHeights.some((value) => value === null)) return;

                    triPoints.forEach((point, index) => {
                        positions.push(point.x, triHeights[index] + lift, point.z);
                        uvs.push(
                            (point.x - bounds.minX) / Math.max(bounds.maxX - bounds.minX, 0.01),
                            (point.z - bounds.minZ) / Math.max(bounds.maxZ - bounds.minZ, 0.01)
                        );
                    });

                    topTriangles.push([
                        { x: triPoints[0].x, y: triHeights[0] + lift, z: triPoints[0].z },
                        { x: triPoints[1].x, y: triHeights[1] + lift, z: triPoints[1].z },
                        { x: triPoints[2].x, y: triHeights[2] + lift, z: triPoints[2].z }
                    ]);
                });
            }
        }

        if (!positions.length) return;

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        geometry.computeVertexNormals();

        const skin = new THREE.Mesh(geometry, roofMaterial.clone());
        applyRoofFinish(skin.material);
        skin.castShadow = true;
        skin.receiveShadow = true;
        roofMeshes.push(skin);
        parent.add(skin);

        const shellPositions = [];
        const shellUvs = [];

        topTriangles.forEach((triangle) => {
            const a = triangle[0];
            const b = triangle[1];
            const c = triangle[2];
            shellPositions.push(
                a.x, a.y - thickness, a.z,
                c.x, c.y - thickness, c.z,
                b.x, b.y - thickness, b.z
            );

            shellUvs.push(
                0, 0,
                0, 1,
                1, 1
            );
        });

        for (let index = 0; index < footprintPolygon.length; index += 1) {
            const current = footprintPolygon[index];
            const next = footprintPolygon[(index + 1) % footprintPolygon.length];
            const topCurrent = getCombinedRoofHeight(plan, current.x, current.z);
            const topNext = getCombinedRoofHeight(plan, next.x, next.z);

            if (topCurrent === null || topNext === null) continue;

            shellPositions.push(
                current.x, topCurrent + 0.01, current.z,
                next.x, topNext + 0.01, next.z,
                next.x, topNext - thickness, next.z,
                current.x, topCurrent + 0.01, current.z,
                next.x, topNext - thickness, next.z,
                current.x, topCurrent - thickness, current.z
            );

            shellUvs.push(
                0, 0,
                1, 0,
                1, 1,
                0, 0,
                1, 1,
                0, 1
            );
        }

        if (shellPositions.length) {
            const shellGeometry = new THREE.BufferGeometry();
            shellGeometry.setAttribute('position', new THREE.Float32BufferAttribute(shellPositions, 3));
            shellGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(shellUvs, 2));
            shellGeometry.computeVertexNormals();

            const shellColor = new THREE.Color(currentColor).lerp(
                new THREE.Color(currentMaterialType === 'bitumen-shingle' ? 0x16181d : 0x2b1f17),
                currentMaterialType === 'bitumen-shingle' ? 0.46 : 0.34
            );
            const shellMesh = new THREE.Mesh(shellGeometry, new THREE.MeshStandardMaterial({
                color: shellColor,
                roughness: currentMaterialType === 'bitumen-shingle' ? 0.92 : 0.78,
                metalness: currentMaterialType === 'bitumen-shingle' ? 0.04 : 0.16,
                side: THREE.DoubleSide
            }));
            shellMesh.castShadow = true;
            shellMesh.receiveShadow = true;
            roofMeshes.push(shellMesh);
            parent.add(shellMesh);
        }

        (plan.roofGraph.ridges || []).forEach((ridge) => {
            const startHeight = getCombinedRoofHeight(plan, ridge.start.x, ridge.start.z);
            const endHeight = getCombinedRoofHeight(plan, ridge.end.x, ridge.end.z);
            if (startHeight === null || endHeight === null) return;

            const start = new THREE.Vector3(ridge.start.x, startHeight + 0.06, ridge.start.z);
            const end = new THREE.Vector3(ridge.end.x, endHeight + 0.06, ridge.end.z);
            addRidgeTrim(parent, start, end, (x, z) => getCombinedRoofHeight(plan, x, z));
        });
    }

    function getFallbackPalette() {
        if (currentMaterialType === 'bitumen-shingle') {
            return {
                wall: '#f2e5d7',
                trim: '#fff8ef',
                roofLight: currentColor,
                roofDark: '#2a2d36'
            };
        }

        if (currentMaterialType === 'metal-modular') {
            return {
                wall: '#efdfce',
                trim: '#fff8ef',
                roofLight: currentColor,
                roofDark: '#5a3f30'
            };
        }

        return {
            wall: '#f6e6d5',
            trim: '#fff7ef',
            roofLight: currentColor,
            roofDark: '#64361f'
        };
    }

    function drawFallbackHouse() {
        if (!fallbackCtx) return;

        const ctx = fallbackCtx;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const { width, height } = getCanvasSize();
        const palette = getFallbackPalette();
        const plan = getShapePlan(currentShapeType);
        const bounds = getPlanBounds(plan.roofBlocks);
        const planWidth = bounds.maxX - bounds.minX;
        const planDepth = bounds.maxZ - bounds.minZ;

        if (canvasEl.width !== width * dpr || canvasEl.height !== height * dpr) {
            canvasEl.width = width * dpr;
            canvasEl.height = height * dpr;
            canvasEl.style.width = `${width}px`;
            canvasEl.style.height = `${height}px`;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }

        ctx.clearRect(0, 0, width, height);
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        const sky = ctx.createLinearGradient(0, 0, 0, height);
        sky.addColorStop(0, '#fbfcfd');
        sky.addColorStop(0.58, '#eef3f8');
        sky.addColorStop(1, '#dce6ee');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, width, height);

        const glow = ctx.createRadialGradient(width * 0.5, height * 0.5, 20, width * 0.5, height * 0.5, width * 0.42);
        glow.addColorStop(0, 'rgba(255, 255, 255, 0.86)');
        glow.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, width, height);

        const scale = Math.min((width * 0.5) / planWidth, (height * 0.46) / planDepth);
        const originX = width * 0.5;
        const originY = height * 0.53;

        function toScreenPoint(point) {
            return {
                x: originX + (point.x * scale),
                y: originY + (point.z * scale)
            };
        }

        function toScreenRect(block, insetMeters) {
            const inset = Math.min(
                insetMeters,
                Math.max(0.06, (Math.min(block.width, block.depth) / 2) - 0.08)
            );

            return {
                x: originX + ((block.xMin + inset) * scale),
                y: originY + ((block.zMin + inset) * scale),
                w: Math.max(12, (block.width - (inset * 2)) * scale),
                h: Math.max(12, (block.depth - (inset * 2)) * scale)
            };
        }

        ctx.fillStyle = 'rgba(24, 31, 41, 0.1)';
        ctx.beginPath();
        ctx.ellipse(originX, originY + (planDepth * scale * 0.18), planWidth * scale * 0.37, planDepth * scale * 0.18, 0, 0, Math.PI * 2);
        ctx.fill();

        plan.blocks.forEach((block) => {
            const foundation = toScreenRect(block, -0.05);
            ctx.fillStyle = '#cbb59c';
            ctx.fillRect(foundation.x, foundation.y, foundation.w, foundation.h);

            const shell = toScreenRect(block, 0);
            ctx.fillStyle = palette.wall;
            ctx.fillRect(shell.x, shell.y, shell.w, shell.h);

            ctx.strokeStyle = 'rgba(63, 73, 86, 0.12)';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(shell.x + 0.5, shell.y + 0.5, shell.w - 1, shell.h - 1);
        });

        plan.roofBlocks.forEach((block) => {
            const roofProfile = plan.roofProfiles[block.id];
            if (!roofProfile) return;

            const roofRect = toScreenRect(block, 0.18);
            const gradient = roofProfile.ridgeAlong === 'z'
                ? ctx.createLinearGradient(roofRect.x, roofRect.y, roofRect.x + roofRect.w, roofRect.y)
                : ctx.createLinearGradient(roofRect.x, roofRect.y, roofRect.x, roofRect.y + roofRect.h);

            gradient.addColorStop(0, palette.roofDark);
            gradient.addColorStop(0.5, palette.roofLight);
            gradient.addColorStop(1, palette.roofDark);
            ctx.fillStyle = gradient;
            ctx.fillRect(roofRect.x, roofRect.y, roofRect.w, roofRect.h);

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
            ctx.lineWidth = 1;
            ctx.strokeRect(roofRect.x + 0.5, roofRect.y + 0.5, roofRect.w - 1, roofRect.h - 1);

            if (currentRoofType === 'gable') {
                ctx.strokeStyle = '#4b2817';
                ctx.lineWidth = 2.2;
                ctx.beginPath();

                if (roofProfile.ridgeAlong === 'z') {
                    ctx.moveTo(roofRect.x + (roofRect.w / 2), roofRect.y + 6);
                    ctx.lineTo(roofRect.x + (roofRect.w / 2), roofRect.y + roofRect.h - 6);
                } else {
                    ctx.moveTo(roofRect.x + 6, roofRect.y + (roofRect.h / 2));
                    ctx.lineTo(roofRect.x + roofRect.w - 6, roofRect.y + (roofRect.h / 2));
                }

                ctx.stroke();
                return;
            }

            const insetX = roofRect.x + (roofRect.w * 0.14);
            const insetY = roofRect.y + (roofRect.h * 0.14);
            const insetW = roofRect.w * 0.72;
            const insetH = roofRect.h * 0.72;

            ctx.strokeStyle = '#4b2817';
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.moveTo(roofRect.x, roofRect.y);
            ctx.lineTo(insetX, insetY);
            ctx.lineTo(insetX + insetW, insetY);
            ctx.lineTo(roofRect.x + roofRect.w, roofRect.y);
            ctx.moveTo(roofRect.x + roofRect.w, roofRect.y + roofRect.h);
            ctx.lineTo(insetX + insetW, insetY + insetH);
            ctx.lineTo(insetX, insetY + insetH);
            ctx.lineTo(roofRect.x, roofRect.y + roofRect.h);
            ctx.stroke();

            ctx.beginPath();
            if (roofProfile.ridgeAlong === 'x') {
                ctx.moveTo(insetX + 6, roofRect.y + (roofRect.h / 2));
                ctx.lineTo(insetX + insetW - 6, roofRect.y + (roofRect.h / 2));
            } else {
                ctx.moveTo(roofRect.x + (roofRect.w / 2), insetY + 6);
                ctx.lineTo(roofRect.x + (roofRect.w / 2), insetY + insetH - 6);
            }
            ctx.stroke();
        });

        if (plan.footprintPolygon && plan.footprintPolygon.length) {
            ctx.strokeStyle = '#202834';
            ctx.lineWidth = 2.4;
            ctx.beginPath();
            plan.footprintPolygon.forEach((point, index) => {
                const screen = toScreenPoint(point);
                if (index === 0) {
                    ctx.moveTo(screen.x, screen.y);
                } else {
                    ctx.lineTo(screen.x, screen.y);
                }
            });
            ctx.closePath();
            ctx.stroke();
        }

        const drainageEstimate = buildDrainageEstimate(plan);
        if (drainageEstimate && drainageEstimate.metrics) {
            const previewActive = drainagePreviewState && performance.now() < drainagePreviewState.activeUntil;
            ctx.strokeStyle = 'rgba(87, 96, 106, 0.95)';
            ctx.lineWidth = 4;
            drainageEstimate.metrics.gutterSegments.forEach((segment) => {
                const start = toScreenPoint({
                    x: segment.a.x + (segment.normal.x * 0.08),
                    z: segment.a.z + (segment.normal.z * 0.08)
                });
                const end = toScreenPoint({
                    x: segment.b.x + (segment.normal.x * 0.08),
                    z: segment.b.z + (segment.normal.z * 0.08)
                });
                ctx.beginPath();
                ctx.moveTo(start.x, start.y);
                ctx.lineTo(end.x, end.y);
                ctx.stroke();
            });

            ctx.fillStyle = previewActive ? 'rgba(102, 193, 255, 0.98)' : 'rgba(96, 105, 113, 0.98)';
            drainageEstimate.metrics.downspoutAnchors.forEach((anchor) => {
                const point = toScreenPoint({
                    x: anchor.point.x + (anchor.normal.x * 0.1),
                    z: anchor.point.z + (anchor.normal.z * 0.1)
                });
                ctx.beginPath();
                ctx.arc(point.x, point.y, 4.2, 0, Math.PI * 2);
                ctx.fill();
            });

            if (previewActive) {
                const bounds = getPlanBounds(plan.roofBlocks);
                ctx.strokeStyle = 'rgba(121, 200, 255, 0.45)';
                ctx.lineWidth = 1.25;
                for (let index = 0; index < 26; index += 1) {
                    const ratio = (((performance.now() * 0.0018) + (index * 0.11)) % 1);
                    const x = THREE.MathUtils.lerp(bounds.minX - 1, bounds.maxX + 1, (index % 13) / 12);
                    const z = THREE.MathUtils.lerp(bounds.minZ - 1, bounds.maxZ + 1, ratio);
                    const point = toScreenPoint({ x, z });
                    ctx.beginPath();
                    ctx.moveTo(point.x - 5, point.y - 18);
                    ctx.lineTo(point.x + 1, point.y - 5);
                    ctx.stroke();
                }
            }
        }

        const previewBlend = drainagePreviewState ? getPreviewVisualBlend(performance.now()) : 0;
        if (previewBlend > 0.01) {
            const overlay = ctx.createLinearGradient(0, 0, 0, height);
            overlay.addColorStop(0, `rgba(84, 100, 118, ${(0.18 * previewBlend).toFixed(3)})`);
            overlay.addColorStop(1, `rgba(40, 52, 63, ${(0.26 * previewBlend).toFixed(3)})`);
            ctx.fillStyle = overlay;
            ctx.fillRect(0, 0, width, height);
        }

        ctx.fillStyle = '#334150';
        ctx.font = '600 13px Montserrat, sans-serif';
        ctx.fillText(
            `${currentShapeLabel} • ${currentRoofLabel} • vedere 2D simplificata`,
            22,
            height - 24
        );
    }

    function initFallbackScene() {
        fallbackCtx = canvasEl.getContext('2d');
        useFallbackRenderer = true;

        if (hintEl) {
            hintEl.innerHTML = '<i class="fas fa-image"></i> Fallback 2D activ';
            hintEl.style.opacity = '1';
        }

        drawFallbackHouse();
    }

    function ensureRoofReferenceLoaded(materialType) {
        const source = roofReferenceSources[materialType];
        if (!source || roofReferenceStatus.get(materialType) === 'loading' || roofReferenceStatus.get(materialType) === 'loaded') {
            return;
        }

        roofReferenceStatus.set(materialType, 'loading');

        const image = new Image();
        image.onload = () => {
            roofReferenceImages.set(materialType, image);
            roofReferenceTiles.delete(materialType);
            roofReferenceStatus.set(materialType, 'loaded');

            if (currentMaterialType === materialType) {
                setRoofColor();
            }
        };
        image.onerror = () => {
            roofReferenceStatus.set(materialType, 'error');
        };
        image.src = source;
    }

    function getNonWhiteBounds(image, threshold) {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = image.naturalWidth || image.width;
        tempCanvas.height = image.naturalHeight || image.height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(image, 0, 0);

        const { data, width, height } = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        let minX = width;
        let maxX = 0;
        let minY = height;
        let maxY = 0;
        let found = false;

        for (let y = 0; y < height; y += 1) {
            for (let x = 0; x < width; x += 1) {
                const index = ((y * width) + x) * 4;
                const r = data[index];
                const g = data[index + 1];
                const b = data[index + 2];
                const a = data[index + 3];
                if (a < 16) continue;
                if (r > threshold && g > threshold && b > threshold) continue;

                found = true;
                minX = Math.min(minX, x);
                maxX = Math.max(maxX, x);
                minY = Math.min(minY, y);
                maxY = Math.max(maxY, y);
            }
        }

        if (!found) {
            return { x: 0, y: 0, width, height };
        }

        return {
            x: minX,
            y: minY,
            width: Math.max(maxX - minX + 1, 1),
            height: Math.max(maxY - minY + 1, 1)
        };
    }

    function buildRoofReferenceTile(materialType) {
        if (roofReferenceTiles.has(materialType)) {
            return roofReferenceTiles.get(materialType);
        }

        const image = roofReferenceImages.get(materialType);
        if (!image) return null;

        const tileCanvas = document.createElement('canvas');
        const bumpCanvas = document.createElement('canvas');
        tileCanvas.width = tileCanvas.height = 256;
        bumpCanvas.width = bumpCanvas.height = 256;
        const tileCtx = tileCanvas.getContext('2d');
        const bumpCtx = bumpCanvas.getContext('2d');

        tileCtx.clearRect(0, 0, 256, 256);
        bumpCtx.fillStyle = '#8a8a8a';
        bumpCtx.fillRect(0, 0, 256, 256);

        if (materialType === 'bitumen-shingle') {
            tileCtx.drawImage(image, 0, 0, 256, 256);
            bumpCtx.drawImage(image, 0, 0, 256, 256);
        } else {
            const bounds = getNonWhiteBounds(image, 242);
            const padding = materialType === 'metal-modular' ? 20 : 14;
            const targetWidth = 256 - (padding * 2);
            const targetHeight = 256 - (padding * 2);
            const aspect = bounds.width / Math.max(bounds.height, 1);

            let drawWidth = targetWidth;
            let drawHeight = drawWidth / Math.max(aspect, 0.01);

            if (drawHeight > targetHeight) {
                drawHeight = targetHeight;
                drawWidth = drawHeight * aspect;
            }

            const drawX = (256 - drawWidth) / 2;
            const drawY = (256 - drawHeight) / 2;

            tileCtx.drawImage(
                image,
                bounds.x, bounds.y, bounds.width, bounds.height,
                drawX, drawY, drawWidth, drawHeight
            );
            bumpCtx.drawImage(
                image,
                bounds.x, bounds.y, bounds.width, bounds.height,
                drawX, drawY, drawWidth, drawHeight
            );

            const tileData = tileCtx.getImageData(0, 0, 256, 256);
            const bumpData = bumpCtx.getImageData(0, 0, 256, 256);

            for (let index = 0; index < tileData.data.length; index += 4) {
                const r = tileData.data[index];
                const g = tileData.data[index + 1];
                const b = tileData.data[index + 2];
                const a = tileData.data[index + 3];
                const isBg = a < 12 || (r > 244 && g > 244 && b > 244);

                if (isBg) {
                    tileData.data[index + 3] = 0;
                    bumpData.data[index] = 138;
                    bumpData.data[index + 1] = 138;
                    bumpData.data[index + 2] = 138;
                    bumpData.data[index + 3] = 255;
                    continue;
                }

                const luma = Math.round((r * 0.299) + (g * 0.587) + (b * 0.114));
                bumpData.data[index] = luma;
                bumpData.data[index + 1] = luma;
                bumpData.data[index + 2] = luma;
                bumpData.data[index + 3] = 255;
            }

            tileCtx.putImageData(tileData, 0, 0);
            bumpCtx.putImageData(bumpData, 0, 0);
        }

        const tiles = { diffuse: tileCanvas, bump: bumpCanvas };
        roofReferenceTiles.set(materialType, tiles);
        return tiles;
    }

    function overlayRoofReference(diffuseCtx, bumpCtx, size, materialType) {
        if (materialType !== 'bitumen-shingle') return;

        const tiles = buildRoofReferenceTile(materialType);
        if (!tiles) return;

        const tileStep = 176;
        const rowStep = 144;

        diffuseCtx.save();
        diffuseCtx.globalAlpha = 0.92;
        diffuseCtx.globalCompositeOperation = 'source-over';

        bumpCtx.save();
        bumpCtx.globalAlpha = 0.82;

        for (let y = -rowStep; y < size + rowStep; y += rowStep) {
            for (let x = -tileStep; x < size + tileStep; x += tileStep) {
                diffuseCtx.drawImage(tiles.diffuse, x, y, tileStep, rowStep);
                bumpCtx.drawImage(tiles.bump, x, y, tileStep, rowStep);
            }
        }

        diffuseCtx.restore();
        bumpCtx.restore();
    }

    function drawClassicMetalTexture(diffuseCtx, bumpCtx, size, base, light, dark) {
        const moduleHeight = 182;
        const moduleWidth = 238;
        const crestCount = 5;
        const inset = 12;
        const topLip = 20;
        const overlapY = 96;
        const horizontalStep = moduleWidth - (inset * 2);
        const verticalStep = overlapY;
        const waveWidth = horizontalStep / crestCount;

        const drawScallopedLine = (ctx, startX, y, width, amplitude, lineWidth, strokeStyle) => {
            ctx.strokeStyle = strokeStyle;
            ctx.lineWidth = lineWidth;
            ctx.beginPath();
            ctx.moveTo(startX, y);

            for (let offset = 0; offset < width; offset += waveWidth) {
                ctx.bezierCurveTo(
                    startX + offset + (waveWidth * 0.2), y - amplitude,
                    startX + offset + (waveWidth * 0.32), y - amplitude,
                    startX + offset + (waveWidth * 0.5), y
                );
                ctx.bezierCurveTo(
                    startX + offset + (waveWidth * 0.68), y + amplitude,
                    startX + offset + (waveWidth * 0.8), y + amplitude,
                    startX + offset + waveWidth, y
                );
            }

            ctx.stroke();
        };

        diffuseCtx.fillStyle = base.getStyle();
        diffuseCtx.fillRect(0, 0, size, size);
        bumpCtx.fillStyle = '#8b8b8b';
        bumpCtx.fillRect(0, 0, size, size);

        for (let y = -topLip; y < size + moduleHeight; y += verticalStep) {
            for (let x = -inset; x < size + moduleWidth; x += horizontalStep) {
                const bodyX = x + inset;
                const bodyY = y + topLip;
                const bodyW = horizontalStep;
                const bodyH = moduleHeight - 28;

                diffuseCtx.fillStyle = dark;
                diffuseCtx.fillRect(bodyX, y + 6, bodyW, 11);
                bumpCtx.fillStyle = '#5f5f5f';
                bumpCtx.fillRect(bodyX, y + 6, bodyW, 8);

                for (let crest = 0; crest < crestCount; crest += 1) {
                    const crestX = bodyX + (crest * waveWidth);
                    const crestGradient = diffuseCtx.createLinearGradient(crestX, 0, crestX + waveWidth, 0);
                    crestGradient.addColorStop(0, 'rgba(0,0,0,0.18)');
                    crestGradient.addColorStop(0.22, dark);
                    crestGradient.addColorStop(0.5, light);
                    crestGradient.addColorStop(0.82, dark);
                    crestGradient.addColorStop(1, 'rgba(0,0,0,0.16)');
                    diffuseCtx.fillStyle = crestGradient;
                    diffuseCtx.fillRect(crestX, bodyY, waveWidth, bodyH - 10);

                    const bumpGradient = bumpCtx.createLinearGradient(crestX, 0, crestX + waveWidth, 0);
                    bumpGradient.addColorStop(0, '#616161');
                    bumpGradient.addColorStop(0.24, '#8b8b8b');
                    bumpGradient.addColorStop(0.5, '#e4e4e4');
                    bumpGradient.addColorStop(0.78, '#8b8b8b');
                    bumpGradient.addColorStop(1, '#616161');
                    bumpCtx.fillStyle = bumpGradient;
                    bumpCtx.fillRect(crestX, bodyY, waveWidth, bodyH - 10);

                    const grooveX = crestX + (waveWidth * 0.86);
                    diffuseCtx.fillStyle = 'rgba(255,255,255,0.08)';
                    diffuseCtx.fillRect(grooveX, bodyY + 8, 2, bodyH - 20);
                    diffuseCtx.fillStyle = 'rgba(0,0,0,0.16)';
                    diffuseCtx.fillRect(grooveX + 2, bodyY + 8, 1.5, bodyH - 20);

                    bumpCtx.fillStyle = '#cbcbcb';
                    bumpCtx.fillRect(grooveX, bodyY + 8, 1.5, bodyH - 20);
                    bumpCtx.fillStyle = '#6a6a6a';
                    bumpCtx.fillRect(grooveX + 1.5, bodyY + 8, 1.5, bodyH - 20);
                }

                drawScallopedLine(diffuseCtx, bodyX, y + topLip, bodyW, 8.8, 6.5, 'rgba(0,0,0,0.34)');
                drawScallopedLine(diffuseCtx, bodyX, y + topLip - 1.6, bodyW, 7.2, 1.8, 'rgba(255,255,255,0.18)');
                drawScallopedLine(bumpCtx, bodyX, y + topLip, bodyW, 7.8, 7, '#4f4f4f');

                diffuseCtx.fillStyle = 'rgba(0,0,0,0.28)';
                diffuseCtx.fillRect(bodyX, y + overlapY, bodyW, 8);
                diffuseCtx.fillStyle = 'rgba(255,255,255,0.08)';
                diffuseCtx.fillRect(bodyX, y + overlapY - 2, bodyW, 2);
                drawScallopedLine(diffuseCtx, bodyX, y + overlapY, bodyW, 8.2, 6.8, 'rgba(0,0,0,0.4)');
                drawScallopedLine(diffuseCtx, bodyX, y + overlapY - 1.5, bodyW, 6.8, 1.6, 'rgba(255,255,255,0.14)');

                bumpCtx.fillStyle = '#575757';
                bumpCtx.fillRect(bodyX, y + overlapY, bodyW, 6);
                drawScallopedLine(bumpCtx, bodyX, y + overlapY, bodyW, 7.4, 7.2, '#4a4a4a');

                diffuseCtx.strokeStyle = 'rgba(0,0,0,0.16)';
                diffuseCtx.lineWidth = 1.8;
                diffuseCtx.beginPath();
                diffuseCtx.moveTo(bodyX + bodyW - 1, bodyY + 8);
                diffuseCtx.lineTo(bodyX + bodyW - 1, y + moduleHeight - 10);
                diffuseCtx.stroke();
            }
        }
    }

    function drawModularMetalTexture(diffuseCtx, bumpCtx, size, base, light, dark) {
        const moduleHeight = 172;
        const moduleWidth = 212;
        const crestCount = 5;
        const inset = 10;
        const topLip = 18;
        const overlapY = 86;
        const waveWidth = (moduleWidth - (inset * 2)) / crestCount;
        const horizontalStep = moduleWidth - (inset * 2);
        const verticalStep = overlapY;

        const drawScallopedLine = (ctx, startX, y, width, amplitude, lineWidth, strokeStyle) => {
            ctx.strokeStyle = strokeStyle;
            ctx.lineWidth = lineWidth;
            ctx.beginPath();
            ctx.moveTo(startX, y);

            for (let offset = 0; offset < width; offset += waveWidth) {
                ctx.bezierCurveTo(
                    startX + offset + (waveWidth * 0.18), y - amplitude,
                    startX + offset + (waveWidth * 0.32), y - amplitude,
                    startX + offset + (waveWidth * 0.5), y
                );
                ctx.bezierCurveTo(
                    startX + offset + (waveWidth * 0.68), y + amplitude,
                    startX + offset + (waveWidth * 0.82), y + amplitude,
                    startX + offset + waveWidth, y
                );
            }

            ctx.stroke();
        };

        diffuseCtx.fillStyle = base.getStyle();
        diffuseCtx.fillRect(0, 0, size, size);
        bumpCtx.fillStyle = '#878787';
        bumpCtx.fillRect(0, 0, size, size);

        for (let y = -topLip; y < size + moduleHeight; y += verticalStep) {
            for (let x = -inset; x < size + moduleWidth; x += horizontalStep) {
                const bodyX = x + inset;
                const bodyY = y + topLip;
                const bodyW = moduleWidth - (inset * 2);
                const bodyH = moduleHeight - 26;

                diffuseCtx.fillStyle = dark;
                diffuseCtx.fillRect(bodyX, y + 6, bodyW, 10);
                bumpCtx.fillStyle = '#626262';
                bumpCtx.fillRect(bodyX, y + 6, bodyW, 8);

                for (let crest = 0; crest < crestCount; crest += 1) {
                    const crestX = bodyX + (crest * waveWidth);
                    const mainGradient = diffuseCtx.createLinearGradient(crestX, 0, crestX + waveWidth, 0);
                    mainGradient.addColorStop(0, 'rgba(0,0,0,0.26)');
                    mainGradient.addColorStop(0.18, dark);
                    mainGradient.addColorStop(0.52, light);
                    mainGradient.addColorStop(0.82, dark);
                    mainGradient.addColorStop(1, 'rgba(0,0,0,0.24)');
                    diffuseCtx.fillStyle = mainGradient;
                    diffuseCtx.fillRect(crestX, bodyY, waveWidth, bodyH - 8);

                    const bumpGradient = bumpCtx.createLinearGradient(crestX, 0, crestX + waveWidth, 0);
                    bumpGradient.addColorStop(0, '#5f5f5f');
                    bumpGradient.addColorStop(0.2, '#8d8d8d');
                    bumpGradient.addColorStop(0.5, '#ececec');
                    bumpGradient.addColorStop(0.8, '#8e8e8e');
                    bumpGradient.addColorStop(1, '#585858');
                    bumpCtx.fillStyle = bumpGradient;
                    bumpCtx.fillRect(crestX, bodyY, waveWidth, bodyH - 8);

                    const ribX = crestX + (waveWidth * 0.86);
                    diffuseCtx.fillStyle = 'rgba(255,255,255,0.12)';
                    diffuseCtx.fillRect(ribX, bodyY + 12, 2.5, bodyH - 22);
                    diffuseCtx.fillStyle = 'rgba(0,0,0,0.2)';
                    diffuseCtx.fillRect(ribX + 3, bodyY + 12, 1.5, bodyH - 22);

                    bumpCtx.fillStyle = '#dadada';
                    bumpCtx.fillRect(ribX, bodyY + 12, 2, bodyH - 22);
                    bumpCtx.fillStyle = '#686868';
                    bumpCtx.fillRect(ribX + 2.5, bodyY + 12, 1.5, bodyH - 22);
                }

                drawScallopedLine(diffuseCtx, bodyX, y + topLip, bodyW, 8.5, 7, 'rgba(0,0,0,0.34)');
                drawScallopedLine(diffuseCtx, bodyX, y + topLip - 2, bodyW, 7.2, 2, 'rgba(255,255,255,0.16)');
                drawScallopedLine(bumpCtx, bodyX, y + topLip, bodyW, 8, 8, '#4f4f4f');

                diffuseCtx.fillStyle = 'rgba(0,0,0,0.26)';
                diffuseCtx.fillRect(bodyX, y + overlapY, bodyW, 8);
                diffuseCtx.fillStyle = 'rgba(255,255,255,0.08)';
                diffuseCtx.fillRect(bodyX, y + overlapY - 2, bodyW, 2);
                drawScallopedLine(diffuseCtx, bodyX, y + overlapY, bodyW, 7.5, 6.5, 'rgba(0,0,0,0.42)');
                drawScallopedLine(diffuseCtx, bodyX, y + overlapY - 1.5, bodyW, 6.4, 1.8, 'rgba(255,255,255,0.14)');

                bumpCtx.fillStyle = '#5b5b5b';
                bumpCtx.fillRect(bodyX, y + overlapY, bodyW, 6);
                drawScallopedLine(bumpCtx, bodyX, y + overlapY, bodyW, 7, 7, '#4b4b4b');

                diffuseCtx.strokeStyle = 'rgba(0,0,0,0.22)';
                diffuseCtx.lineWidth = 2;
                diffuseCtx.beginPath();
                diffuseCtx.moveTo(bodyX + bodyW - 1.5, bodyY + 8);
                diffuseCtx.lineTo(bodyX + bodyW - 1.5, y + moduleHeight - 10);
                diffuseCtx.stroke();

                diffuseCtx.fillStyle = 'rgba(255,255,255,0.05)';
                diffuseCtx.fillRect(bodyX - 1, bodyY + 10, 2, bodyH - 24);
                diffuseCtx.fillRect(bodyX + bodyW - 2, bodyY + 10, 2, bodyH - 24);
            }
        }
    }

    function drawBitumenTexture(diffuseCtx, bumpCtx, size, light, dark) {
        diffuseCtx.fillStyle = dark;
        diffuseCtx.fillRect(0, 0, size, size);
        bumpCtx.fillStyle = '#7d7d7d';
        bumpCtx.fillRect(0, 0, size, size);

        const row = 68;
        const tabWidth = 82;
        const tabHeight = 26;

        for (let y = 0; y < size; y += row) {
            const offset = (Math.floor(y / row) % 2) * (tabWidth / 2);

            diffuseCtx.fillStyle = 'rgba(255,255,255,0.06)';
            diffuseCtx.fillRect(0, y, size, 8);
            bumpCtx.fillStyle = '#5d5d5d';
            bumpCtx.fillRect(0, y, size, 6);

            for (let x = -tabWidth; x < size + tabWidth; x += tabWidth) {
                const px = x + offset;
                diffuseCtx.fillStyle = (Math.floor((x + offset) / tabWidth) % 2 === 0) ? light : dark;
                diffuseCtx.beginPath();
                diffuseCtx.moveTo(px, y + 12);
                diffuseCtx.lineTo(px + tabWidth - 10, y + 12);
                diffuseCtx.lineTo(px + tabWidth - 18, y + 12 + tabHeight);
                diffuseCtx.lineTo(px + 8, y + 12 + tabHeight);
                diffuseCtx.closePath();
                diffuseCtx.fill();

                diffuseCtx.fillStyle = 'rgba(255,255,255,0.08)';
                diffuseCtx.fillRect(px + 6, y + 16, tabWidth - 24, 4);

                bumpCtx.fillStyle = '#bbbbbb';
                bumpCtx.beginPath();
                bumpCtx.moveTo(px, y + 12);
                bumpCtx.lineTo(px + tabWidth - 10, y + 12);
                bumpCtx.lineTo(px + tabWidth - 18, y + 12 + tabHeight);
                bumpCtx.lineTo(px + 8, y + 12 + tabHeight);
                bumpCtx.closePath();
                bumpCtx.fill();
            }
        }
    }

    function createStripeTexture(materialType, color) {
        const size = 512;
        const diffuseCanvas = document.createElement('canvas');
        const bumpCanvas = document.createElement('canvas');
        diffuseCanvas.width = diffuseCanvas.height = size;
        bumpCanvas.width = bumpCanvas.height = size;

        const diffuseCtx = diffuseCanvas.getContext('2d');
        const bumpCtx = bumpCanvas.getContext('2d');
        const base = new THREE.Color(color);
        const light = base.clone().lerp(new THREE.Color(0xffffff), 0.16).getStyle();
        const dark = base.clone().lerp(new THREE.Color(0x000000), 0.2).getStyle();

        if (materialType === 'metal-modular') {
            drawModularMetalTexture(diffuseCtx, bumpCtx, size, base, light, dark);
        } else if (materialType === 'bitumen-shingle') {
            drawBitumenTexture(diffuseCtx, bumpCtx, size, light, dark);
        } else {
            drawClassicMetalTexture(diffuseCtx, bumpCtx, size, base, light, dark);
        }

        overlayRoofReference(diffuseCtx, bumpCtx, size, materialType);

        const map = new THREE.CanvasTexture(diffuseCanvas);
        map.wrapS = THREE.RepeatWrapping;
        map.wrapT = THREE.RepeatWrapping;
        map.repeat.set(
            materialType === 'metal-modular' ? 1.62 : (materialType === 'bitumen-shingle' ? 2.2 : 1.48),
            materialType === 'metal-modular' ? 1.72 : (materialType === 'bitumen-shingle' ? 2.4 : 1.58)
        );

        const bumpMap = new THREE.CanvasTexture(bumpCanvas);
        bumpMap.wrapS = THREE.RepeatWrapping;
        bumpMap.wrapT = THREE.RepeatWrapping;
        bumpMap.repeat.copy(map.repeat);

        return { map, bumpMap };
    }

    function applyRoofFinish(material) {
        const textures = createStripeTexture(currentMaterialType, currentColor);
        const previousTextures = new Set([material.map, material.bumpMap]);

        material.color.set(currentColor);
        material.map = textures.map;
        material.bumpMap = textures.bumpMap;

        if (currentMaterialType === 'bitumen-shingle') {
            material.bumpScale = 0.12;
            material.roughness = 0.92;
            material.metalness = 0.03;
            material.clearcoat = 0.02;
            material.clearcoatRoughness = 0.9;
            material.reflectivity = 0.18;
        } else if (currentMaterialType === 'metal-modular') {
            material.bumpScale = 0.085;
            material.roughness = 0.42;
            material.metalness = 0.34;
            material.clearcoat = 0.58;
            material.clearcoatRoughness = 0.28;
            material.reflectivity = 0.72;
        } else {
            material.bumpScale = 0.075;
            material.roughness = 0.32;
            material.metalness = 0.42;
            material.clearcoat = 0.76;
            material.clearcoatRoughness = 0.18;
            material.reflectivity = 0.84;
        }

        if ('specularIntensity' in material) {
            material.specularIntensity = currentMaterialType === 'bitumen-shingle' ? 0.18 : (currentMaterialType === 'metal-modular' ? 0.72 : 0.88);
        }

        if ('specularColor' in material) {
            material.specularColor = new THREE.Color(currentMaterialType === 'bitumen-shingle' ? 0x8d8d8d : 0xffffff);
        }

        previousTextures.forEach((texture) => {
            if (!texture || texture === material.map || texture === material.bumpMap) return;
            disposeTextureSafe(texture);
        });

        material.needsUpdate = true;
    }

    function createMaterialSet() {
        const drainageSystem = getDrainageSystemConfig();
        const roofShellColor = new THREE.Color(currentColor).lerp(
            new THREE.Color(currentMaterialType === 'bitumen-shingle' ? 0x16181d : 0x2b1f17),
            currentMaterialType === 'bitumen-shingle' ? 0.46 : 0.34
        );
        const wallMat = new THREE.MeshStandardMaterial({
            color: 0xF4E5D3,
            roughness: 0.88
        });
        const trimMat = new THREE.MeshStandardMaterial({
            color: 0xF6EFE7,
            roughness: 0.75
        });
        const accentMat = new THREE.MeshStandardMaterial({
            color: 0x2E313E,
            roughness: 0.72,
            metalness: 0.12
        });
        const foundationMat = new THREE.MeshStandardMaterial({
            color: 0x8D8F93,
            roughness: 0.95
        });
        const glassMat = new THREE.MeshStandardMaterial({
            color: 0x89BFE0,
            roughness: 0.14,
            metalness: 0.08,
            transparent: true,
            opacity: 0.56
        });
        const chimneyMat = new THREE.MeshStandardMaterial({
            color: 0x997766,
            roughness: 0.86
        });
        const roofMat = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color(currentColor),
            roughness: 0.6,
            metalness: 0.22,
            side: THREE.DoubleSide
        });
        const roofClosureMat = new THREE.MeshStandardMaterial({
            color: roofShellColor,
            roughness: currentMaterialType === 'bitumen-shingle' ? 0.9 : 0.78,
            metalness: currentMaterialType === 'bitumen-shingle' ? 0.04 : 0.16,
            side: THREE.DoubleSide
        });
        const drainageMat = new THREE.MeshStandardMaterial({
            color: drainageSystem.color,
            roughness: 0.54,
            metalness: 0.44
        });
        const drainageAccentMat = new THREE.MeshStandardMaterial({
            color: drainageSystem.accent,
            roughness: 0.28,
            metalness: 0.34
        });
        applyRoofFinish(roofMat);

        return {
            wallMat,
            trimMat,
            accentMat,
            foundationMat,
            glassMat,
            chimneyMat,
            roofMat,
            roofClosureMat,
            drainageMat,
            drainageAccentMat
        };
    }

    function setupScene() {
        scene = new THREE.Scene();
        scene.background = new THREE.Color(DEFAULT_SCENE_BG);
        scene.fog = new THREE.Fog(DEFAULT_FOG, 18, 36);

        const { width, height } = getCanvasSize();
        camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
        camera.position.set(12.5, 8.3, 14.5);
        camera.lookAt(0.2, 2.3, 0);

        renderer = new THREE.WebGLRenderer({
            canvas: canvasEl,
            antialias: true,
            alpha: false
        });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.18;

        const OrbitControlsCtor = window.THREE.OrbitControls || window.OrbitControls;
        if (OrbitControlsCtor) {
            controls = new OrbitControlsCtor(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.08;
            controls.enablePan = false;
            controls.minDistance = 8;
            controls.maxDistance = 28;
            controls.minPolarAngle = 0.35;
            controls.maxPolarAngle = Math.PI / 2.06;
            controls.target.set(0.5, 2.1, 0);
            controls.update();

            controls.addEventListener('start', () => {
                if (hintEl) hintEl.style.opacity = '0';
            });
        }

        ambientLight = new THREE.AmbientLight(0xffffff, 0.56);
        scene.add(ambientLight);

        sunLight = new THREE.DirectionalLight(0xffffff, 0.95);
        sunLight.position.set(8, 11, 7);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 1024;
        sunLight.shadow.mapSize.height = 1024;
        sunLight.shadow.camera.near = 0.5;
        sunLight.shadow.camera.far = 36;
        sunLight.shadow.camera.left = -12;
        sunLight.shadow.camera.right = 12;
        sunLight.shadow.camera.top = 12;
        sunLight.shadow.camera.bottom = -12;
        sunLight.shadow.bias = -0.0008;
        scene.add(sunLight);

        fillLight = new THREE.DirectionalLight(0x9fc7eb, 0.34);
        fillLight.position.set(-7, 5, -3);
        scene.add(fillLight);

        hemiLight = new THREE.HemisphereLight(0xdcefff, 0x88a364, 0.36);
        scene.add(hemiLight);

        buildGround();
        buildHouse();
        animate();
    }

    function buildGround() {
        if (!scene) return;

        if (groundGroup) {
            scene.remove(groundGroup);
            disposeObject3DSafe(groundGroup);
            groundGroup.clear();
        }

        const plan = getShapePlan(currentShapeType);
        const bounds = getPlanBounds(plan.roofBlocks);
        const padWidth = Math.max(12, (bounds.maxX - bounds.minX) + 4.8);
        const padDepth = Math.max(8.5, (bounds.maxZ - bounds.minZ) + 4.2);
        const frontEdge = bounds.maxZ + 1.6;

        groundGroup = new THREE.Group();

        const ground = new THREE.Mesh(
            new THREE.PlaneGeometry(34, 34),
            new THREE.MeshStandardMaterial({ color: 0x7baa4f, roughness: 0.96 })
        );
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        groundGroup.add(ground);

        const pad = new THREE.Mesh(
            new THREE.PlaneGeometry(padWidth, padDepth),
            new THREE.MeshStandardMaterial({ color: 0xcab7a1, roughness: 0.92 })
        );
        pad.rotation.x = -Math.PI / 2;
        pad.position.set(0, 0.01, 0.2);
        pad.receiveShadow = true;
        groundGroup.add(pad);

        const path = new THREE.Mesh(
            new THREE.PlaneGeometry(1.6, Math.max(4.4, padDepth * 0.52)),
            new THREE.MeshStandardMaterial({ color: 0xbca58a, roughness: 0.94 })
        );
        path.rotation.x = -Math.PI / 2;
        path.position.set(0, 0.02, frontEdge + (path.geometry.parameters.height / 2) - 0.55);
        path.receiveShadow = true;
        groundGroup.add(path);

        scene.add(groundGroup);
    }

    function addBox(parent, dims, material) {
        const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(dims.width, dims.height, dims.depth),
            material
        );
        mesh.position.set(dims.x, dims.height / 2, dims.z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        parent.add(mesh);
    }

    function addFoundation(parent, dims, material) {
        const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(dims.width + 0.28, 0.24, dims.depth + 0.28),
            material
        );
        mesh.position.set(dims.x, 0.12, dims.z);
        mesh.receiveShadow = true;
        parent.add(mesh);
    }

    function addGableRoof(parent, roofMaterial, config) {
        const width = config.width;
        const depth = config.depth;
        const centerX = config.x;
        const centerZ = config.z;
        const wallHeight = config.wallHeight;
        const ridgeAlong = config.ridgeAlong || 'z';
        const overhang = config.overhang || 0.48;
        const roofHeight = config.roofHeight || 2.25;

        if (ridgeAlong === 'x') {
            const roofShape = new THREE.Shape();
            const halfDepth = (depth / 2) + overhang;
            roofShape.moveTo(-halfDepth, 0);
            roofShape.lineTo(0, roofHeight);
            roofShape.lineTo(halfDepth, 0);
            roofShape.lineTo(-halfDepth, 0);

            const roofGeo = new THREE.ExtrudeGeometry(roofShape, {
                depth: width + (overhang * 2),
                bevelEnabled: false
            });
            const roof = new THREE.Mesh(roofGeo, roofMaterial.clone());
            applyRoofFinish(roof.material);
            roof.rotation.y = Math.PI / 2;
            roof.position.set(centerX - (width / 2) - overhang, wallHeight, centerZ);
            roof.castShadow = true;
            roof.receiveShadow = true;
            roofMeshes.push(roof);
            parent.add(roof);

            return;
        }

        const roofShape = new THREE.Shape();
        const halfWidth = (width / 2) + overhang;
        roofShape.moveTo(-halfWidth, 0);
        roofShape.lineTo(0, roofHeight);
        roofShape.lineTo(halfWidth, 0);
        roofShape.lineTo(-halfWidth, 0);

        const roofGeo = new THREE.ExtrudeGeometry(roofShape, {
            depth: depth + (overhang * 2),
            bevelEnabled: false
        });
        const roof = new THREE.Mesh(roofGeo, roofMaterial.clone());
        applyRoofFinish(roof.material);
        roof.position.set(centerX, wallHeight, centerZ - ((depth + (overhang * 2)) / 2));
        roof.castShadow = true;
        roof.receiveShadow = true;
        roofMeshes.push(roof);
        parent.add(roof);

    }

    function addHipRoof(parent, roofMaterial, config) {
        const overhang = config.overhang || 0.42;
        const halfWidth = (config.width / 2) + overhang;
        const halfDepth = (config.depth / 2) + overhang;
        const roofHeight = config.roofHeight || 2.02;
        const ridgeAlong = config.ridgeAlong || (config.width >= config.depth ? 'x' : 'z');
        const ridgeHalf = Math.max((ridgeAlong === 'x' ? config.width : config.depth) * 0.18, 0.95);

        let positions;
        let indices;

        if (ridgeAlong === 'z') {
            positions = new Float32Array([
                -halfWidth, 0, halfDepth,
                halfWidth, 0, halfDepth,
                halfWidth, 0, -halfDepth,
                -halfWidth, 0, -halfDepth,
                0, roofHeight, halfDepth - ridgeHalf,
                0, roofHeight, -halfDepth + ridgeHalf
            ]);

            indices = [
                0, 1, 4,
                1, 2, 5,
                1, 5, 4,
                2, 3, 5,
                0, 4, 5,
                0, 5, 3
            ];
        } else {
            positions = new Float32Array([
                -halfWidth, 0, halfDepth,
                halfWidth, 0, halfDepth,
                halfWidth, 0, -halfDepth,
                -halfWidth, 0, -halfDepth,
                -halfWidth + ridgeHalf, roofHeight, 0,
                halfWidth - ridgeHalf, roofHeight, 0
            ]);

            indices = [
                0, 1, 5,
                0, 5, 4,
                3, 5, 2,
                3, 4, 5,
                0, 4, 3,
                1, 2, 5
            ];
        }

        const roofGeo = new THREE.BufferGeometry();
        roofGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        roofGeo.setIndex(indices);
        roofGeo.computeVertexNormals();

        const roof = new THREE.Mesh(roofGeo, roofMaterial.clone());
        applyRoofFinish(roof.material);
        roof.position.set(config.x, config.wallHeight, config.z);
        roof.castShadow = true;
        roof.receiveShadow = true;
        roofMeshes.push(roof);
        parent.add(roof);

    }

    function addRoofLineTrim(parent, start, end, options) {
        const settings = options || {};
        const width = settings.width || 0.22;
        const lift = settings.surfaceLift || 0.012;
        const resolveHeight = settings.heightResolver;
        const startPoint = start.clone();
        const endPoint = end.clone();
        const direction = endPoint.clone().sub(startPoint);
        const directionXZ = new THREE.Vector3(direction.x, 0, direction.z);

        if (directionXZ.lengthSq() < 1e-6) return;

        directionXZ.normalize();

        const perpendicular = new THREE.Vector3(-directionXZ.z, 0, directionXZ.x).multiplyScalar(width / 2);
        const startLeft = startPoint.clone().add(perpendicular);
        const startRight = startPoint.clone().sub(perpendicular);
        const endLeft = endPoint.clone().add(perpendicular);
        const endRight = endPoint.clone().sub(perpendicular);

        if (typeof resolveHeight === 'function') {
            const startLeftHeight = resolveHeight(startLeft.x, startLeft.z);
            const startRightHeight = resolveHeight(startRight.x, startRight.z);
            const endLeftHeight = resolveHeight(endLeft.x, endLeft.z);
            const endRightHeight = resolveHeight(endRight.x, endRight.z);

            startLeft.y = (startLeftHeight === null ? startPoint.y : startLeftHeight) + lift;
            startRight.y = (startRightHeight === null ? startPoint.y : startRightHeight) + lift;
            endLeft.y = (endLeftHeight === null ? endPoint.y : endLeftHeight) + lift;
            endRight.y = (endRightHeight === null ? endPoint.y : endRightHeight) + lift;
        } else {
            startLeft.y += lift;
            startRight.y += lift;
            endLeft.y += lift;
            endRight.y += lift;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute([
            startLeft.x, startLeft.y, startLeft.z,
            startRight.x, startRight.y, startRight.z,
            endRight.x, endRight.y, endRight.z,
            endLeft.x, endLeft.y, endLeft.z
        ], 3));
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute([
            0, 0,
            1, 0,
            1, 1,
            0, 1
        ], 2));
        geometry.setIndex([0, 1, 2, 0, 2, 3]);
        geometry.computeVertexNormals();

        const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({
            color: settings.color || 0x4c2d1f,
            roughness: settings.roughness || 0.78,
            metalness: settings.metalness || 0.12,
            side: THREE.DoubleSide,
            polygonOffset: true,
            polygonOffsetFactor: -1,
            polygonOffsetUnits: -1
        }));
        parent.add(mesh);
    }

    function addValleyTrim(parent, start, end, heightResolver) {
        return;
    }

    function addRidgeTrim(parent, start, end, heightResolver) {
        return;
    }

    function addChimney(parent, chimneyMat, x, y, z) {
        const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.58, 1.7, 0.58), chimneyMat);
        chimney.position.set(x, y, z);
        chimney.castShadow = true;
        parent.add(chimney);

        const cap = new THREE.Mesh(
            new THREE.BoxGeometry(0.8, 0.12, 0.8),
            new THREE.MeshStandardMaterial({ color: 0x745b4a, roughness: 0.9 })
        );
        cap.position.set(x, y + 0.92, z);
        parent.add(cap);
    }

    function addDoor(parent, trimMat, accentMat, x, z, frontOffset) {
        const door = new THREE.Mesh(
            new THREE.BoxGeometry(1.08, 2.14, 0.06),
            new THREE.MeshStandardMaterial({ color: 0x6B3A1A, roughness: 0.86 })
        );
        door.position.set(x, 1.07, z + frontOffset - 0.028);
        parent.add(door);

        const frameTop = new THREE.Mesh(new THREE.BoxGeometry(1.28, 0.12, 0.12), trimMat);
        frameTop.position.set(x, 2.16, z + frontOffset - 0.03);
        parent.add(frameTop);
    }

    function addWindow(parent, glassMat, trimMat, x, y, z, width, height, rotY) {
        const frameGroup = new THREE.Group();

        const outer = new THREE.Mesh(
            new THREE.BoxGeometry(width + 0.14, height + 0.14, 0.05),
            trimMat
        );
        outer.position.z = -0.018;
        frameGroup.add(outer);

        const glass = new THREE.Mesh(
            new THREE.BoxGeometry(width, height, 0.035),
            glassMat
        );
        glass.position.z = -0.028;
        frameGroup.add(glass);

        const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.06, height, 0.035), trimMat);
        mullion.position.z = -0.028;
        frameGroup.add(mullion);

        const transom = new THREE.Mesh(new THREE.BoxGeometry(width, 0.06, 0.035), trimMat);
        transom.position.z = -0.028;
        frameGroup.add(transom);

        frameGroup.position.set(x, y, z);
        frameGroup.rotation.y = rotY || 0;
        parent.add(frameGroup);
    }

    function buildBaseBlock(parent, materialSet, dims, options) {
        addBox(parent, dims, materialSet.wallMat);
        addFoundation(parent, dims, materialSet.foundationMat);

        if (!options || !options.windows) return;

        options.windows.forEach((windowConfig) => {
            addWindow(
                parent,
                materialSet.glassMat,
                materialSet.trimMat,
                windowConfig.x,
                windowConfig.y,
                windowConfig.z,
                windowConfig.width,
                windowConfig.height,
                windowConfig.rotY
            );
        });
    }

    function addGableFrontons(parent, block, roofProfile, closureMaterial) {
        if (!block || !roofProfile || !closureMaterial) return;

        const rise = roofProfile.roofHeight;
        const baseY = block.height;
        const ridgeY = baseY + rise;
        const offset = 0.03;

        const addFrontonFace = (points) => {
            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.Float32BufferAttribute([
                points[0].x, points[0].y, points[0].z,
                points[1].x, points[1].y, points[1].z,
                points[2].x, points[2].y, points[2].z
            ], 3));
            geometry.setIndex([0, 1, 2]);
            geometry.computeVertexNormals();

            const face = new THREE.Mesh(geometry, closureMaterial.clone());
            face.material.side = THREE.DoubleSide;
            face.castShadow = true;
            face.receiveShadow = true;
            parent.add(face);
        };

        if (roofProfile.ridgeAlong === 'x') {
            addFrontonFace([
                { x: block.xMin - offset, y: baseY, z: block.zMin },
                { x: block.xMin - offset, y: baseY, z: block.zMax },
                { x: block.xMin - offset, y: ridgeY, z: block.z }
            ]);

            addFrontonFace([
                { x: block.xMax + offset, y: baseY, z: block.zMax },
                { x: block.xMax + offset, y: baseY, z: block.zMin },
                { x: block.xMax + offset, y: ridgeY, z: block.z }
            ]);
            return;
        }

        addFrontonFace([
            { x: block.xMin, y: baseY, z: block.zMin - offset },
            { x: block.xMax, y: baseY, z: block.zMin - offset },
            { x: block.x, y: ridgeY, z: block.zMin - offset }
        ]);

        addFrontonFace([
            { x: block.xMax, y: baseY, z: block.zMax + offset },
            { x: block.xMin, y: baseY, z: block.zMax + offset },
            { x: block.x, y: ridgeY, z: block.zMax + offset }
        ]);
    }

    function createPipeSegment(a, b, radius, material) {
        const vector = new THREE.Vector3().subVectors(b, a);
        const length = vector.length();
        if (length < 0.01) return null;

        const mesh = new THREE.Mesh(
            new THREE.CylinderGeometry(radius, radius, length, 14),
            material
        );
        mesh.position.copy(a).lerp(b, 0.5);
        mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vector.clone().normalize());
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        return mesh;
    }

    function getDrainageWallInset() {
        return Math.max(currentEaveOverhang - DRAINAGE_RULES.wallClearance, 0.04);
    }

    function buildDrainageRenderData(plan, drainageEstimate) {
        if (!plan || !drainageEstimate || !drainageEstimate.metrics) return null;

        const system = drainageEstimate.system;
        const foundationTopY = 0.24;
        const wallInset = getDrainageWallInset();
        const gutterSegments = [];
        const downspoutPaths = [];

        drainageEstimate.metrics.gutterSegments.forEach((segment) => {
            const startHeight = getCombinedRoofHeight(plan, segment.a.x, segment.a.z);
            const endHeight = getCombinedRoofHeight(plan, segment.b.x, segment.b.z);
            if (startHeight === null || endHeight === null) return;

            gutterSegments.push({
                start: new THREE.Vector3(
                    segment.a.x + (segment.normal.x * DRAINAGE_RULES.gutterOutset),
                    startHeight - DRAINAGE_RULES.gutterDrop,
                    segment.a.z + (segment.normal.z * DRAINAGE_RULES.gutterOutset)
                ),
                end: new THREE.Vector3(
                    segment.b.x + (segment.normal.x * DRAINAGE_RULES.gutterOutset),
                    endHeight - DRAINAGE_RULES.gutterDrop,
                    segment.b.z + (segment.normal.z * DRAINAGE_RULES.gutterOutset)
                ),
                normal: segment.normal
            });
        });

        drainageEstimate.metrics.downspoutAnchors.forEach((anchor) => {
            const edgeHeight = getCombinedRoofHeight(plan, anchor.point.x, anchor.point.z);
            if (edgeHeight === null) return;

            const outlet = new THREE.Vector3(
                anchor.point.x + (anchor.normal.x * DRAINAGE_RULES.gutterOutset),
                edgeHeight - DRAINAGE_RULES.gutterDrop,
                anchor.point.z + (anchor.normal.z * DRAINAGE_RULES.gutterOutset)
            );
            const wallPoint = new THREE.Vector3(
                anchor.point.x - (anchor.normal.x * wallInset),
                edgeHeight - DRAINAGE_RULES.gutterDrop - DRAINAGE_RULES.outletDrop,
                anchor.point.z - (anchor.normal.z * wallInset)
            );
            const bottom = new THREE.Vector3(wallPoint.x, foundationTopY, wallPoint.z);
            const discharge = new THREE.Vector3(
                wallPoint.x + (anchor.normal.x * DRAINAGE_RULES.dischargeReach),
                foundationTopY + 0.05,
                wallPoint.z + (anchor.normal.z * DRAINAGE_RULES.dischargeReach)
            );

            downspoutPaths.push({
                outlet,
                wallPoint,
                bottom,
                discharge,
                normal: anchor.normal
            });
        });

        return {
            system,
            gutterRadius: Math.max(system.gutterDiameter * 0.28, 0.028),
            downpipeRadius: Math.max(system.downpipeDiameter * 0.32, 0.024),
            gutterSegments,
            downspoutPaths
        };
    }

    function addDrainageSystem(parent, materials, plan, drainageEstimate) {
        if (!drainageEstimate || !drainageEstimate.metrics) return;

        const renderData = buildDrainageRenderData(plan, drainageEstimate);
        if (!renderData) return;

        renderData.gutterSegments.forEach((segment) => {
            const gutterMesh = createPipeSegment(segment.start, segment.end, renderData.gutterRadius, materials.drainageMat);
            if (gutterMesh) {
                parent.add(gutterMesh);
            }
        });

        renderData.downspoutPaths.forEach((path) => {
            const outletPiece = createPipeSegment(path.outlet, path.wallPoint, renderData.downpipeRadius * 0.88, materials.drainageAccentMat);
            const downpipePiece = createPipeSegment(path.wallPoint, path.bottom, renderData.downpipeRadius, materials.drainageMat);
            const dischargePiece = createPipeSegment(path.bottom, path.discharge, renderData.downpipeRadius * 0.92, materials.drainageAccentMat);

            if (outletPiece) parent.add(outletPiece);
            if (downpipePiece) parent.add(downpipePiece);
            if (dischargePiece) parent.add(dischargePiece);
        });
    }

    function clearDrainagePreview() {
        drainagePreviewState = null;
        applyPreviewAmbience(0);
        stopWeatherAudioPreview();

        if (drainagePreviewGroup && scene) {
            scene.remove(drainagePreviewGroup);
            disposeObject3DSafe(drainagePreviewGroup);
            drainagePreviewGroup.clear();
        }

        drainagePreviewGroup = null;
    }

    function startDrainagePreview(plan, drainageEstimate) {
        clearDrainagePreview();

        if (!plan || !drainageEstimate || currentDrainageKey === 'none') return;

        const now = performance.now();
        const renderData = buildDrainageRenderData(plan, drainageEstimate);
        if (!renderData) return;

        drainagePreviewState = {
            activeUntil: now + DRAINAGE_PREVIEW_DURATION,
            renderData,
            rainDrops: [],
            rainPositions: null,
            rainGeometry: null,
            rainLines: null,
            waterDroplets: [],
            waterMeshes: []
        };

        applyPreviewAmbience(0.16);
        startWeatherAudioPreview();

        if (useFallbackRenderer || !scene) {
            drawFallbackHouse();
            return;
        }

        drainagePreviewGroup = new THREE.Group();
        scene.add(drainagePreviewGroup);

        const bounds = getPlanBounds(plan.roofBlocks);
        const topY = Math.max(...plan.roofBlocks.map((block) => {
            const profile = plan.roofProfiles[block.id];
            return block.height + (profile?.roofHeight || 0);
        }));
        const rainCount = clamp(Math.round((bounds.maxX - bounds.minX + bounds.maxZ - bounds.minZ) * 4.5), 28, 90);
        const rainPositions = new Float32Array(rainCount * 2 * 3);

        for (let index = 0; index < rainCount; index += 1) {
            drainagePreviewState.rainDrops.push({
                x: THREE.MathUtils.lerp(bounds.minX - 1.1, bounds.maxX + 1.1, Math.random()),
                z: THREE.MathUtils.lerp(bounds.minZ - 1.1, bounds.maxZ + 1.1, Math.random()),
                baseY: topY + 2.1 + (Math.random() * 1.5),
                dropRange: 3.1 + (Math.random() * 1.2),
                speed: 0.85 + (Math.random() * 0.55),
                phase: Math.random(),
                length: 0.38 + (Math.random() * 0.26)
            });
        }

        const rainGeometry = new THREE.BufferGeometry();
        rainGeometry.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
        const rainMaterial = new THREE.LineBasicMaterial({
            color: 0x9fd7ff,
            transparent: true,
            opacity: 0.52
        });
        const rainLines = new THREE.LineSegments(rainGeometry, rainMaterial);
        drainagePreviewGroup.add(rainLines);

        drainagePreviewState.rainPositions = rainPositions;
        drainagePreviewState.rainGeometry = rainGeometry;
        drainagePreviewState.rainLines = rainLines;

        renderData.gutterSegments.forEach((segment, index) => {
            const waterMesh = createPipeSegment(segment.start, segment.end, renderData.gutterRadius * 0.42, new THREE.MeshStandardMaterial({
                color: 0x73c4ff,
                emissive: 0x2f88cc,
                emissiveIntensity: 0.55,
                transparent: true,
                opacity: 0.45
            }));

            if (waterMesh) {
                drainagePreviewGroup.add(waterMesh);
                drainagePreviewState.waterMeshes.push(waterMesh);
            }

            const dropletCount = Math.max(1, Math.ceil(segment.start.distanceTo(segment.end) / 3.4));
            for (let dropletIndex = 0; dropletIndex < dropletCount; dropletIndex += 1) {
                const mesh = new THREE.Mesh(
                    new THREE.SphereGeometry(renderData.gutterRadius * 0.55, 10, 10),
                    new THREE.MeshStandardMaterial({
                        color: 0x86d4ff,
                        emissive: 0x2b86d1,
                        emissiveIntensity: 0.75
                    })
                );
                mesh.castShadow = false;
                mesh.receiveShadow = false;
                drainagePreviewGroup.add(mesh);
                drainagePreviewState.waterDroplets.push({
                    mesh,
                    phase: (dropletIndex / dropletCount) + (index * 0.17),
                    speed: 0.75,
                    path: [segment.start, segment.end]
                });
            }
        });

        renderData.downspoutPaths.forEach((path, index) => {
            for (let dropletIndex = 0; dropletIndex < 3; dropletIndex += 1) {
                const mesh = new THREE.Mesh(
                    new THREE.SphereGeometry(renderData.downpipeRadius * 0.5, 10, 10),
                    new THREE.MeshStandardMaterial({
                        color: 0x9adfff,
                        emissive: 0x2d86d0,
                        emissiveIntensity: 0.9
                    })
                );
                mesh.castShadow = false;
                mesh.receiveShadow = false;
                drainagePreviewGroup.add(mesh);
                drainagePreviewState.waterDroplets.push({
                    mesh,
                    phase: (dropletIndex / 3) + (index * 0.11),
                    speed: 0.92,
                    path: [path.outlet, path.wallPoint, path.bottom, path.discharge]
                });
            }
        });
    }

    function positionDropletOnPath(droplet, cyclePosition) {
        const points = droplet.path;
        if (!points || points.length < 2) return;

        const segmentLengths = [];
        let totalLength = 0;

        for (let index = 0; index < points.length - 1; index += 1) {
            const length = points[index].distanceTo(points[index + 1]);
            segmentLengths.push(length);
            totalLength += length;
        }

        if (totalLength < 1e-6) {
            droplet.mesh.position.copy(points[0]);
            return;
        }

        let distance = cyclePosition * totalLength;
        for (let index = 0; index < segmentLengths.length; index += 1) {
            const length = segmentLengths[index];
            if (distance <= length || index === segmentLengths.length - 1) {
                const t = length < 1e-6 ? 0 : distance / length;
                droplet.mesh.position.copy(points[index]).lerp(points[index + 1], clamp(t, 0, 1));
                return;
            }
            distance -= length;
        }
    }

    function updateDrainagePreview(now) {
        if (!drainagePreviewState) return;

        if (now >= drainagePreviewState.activeUntil) {
            clearDrainagePreview();
            if (useFallbackRenderer) {
                drawFallbackHouse();
            }
            return;
        }

        const progress = 1 - ((drainagePreviewState.activeUntil - now) / DRAINAGE_PREVIEW_DURATION);
        const visualBlend = getPreviewVisualBlend(now);
        applyPreviewAmbience(visualBlend);

        if (useFallbackRenderer) {
            drawFallbackHouse();
            return;
        }

        if (drainagePreviewState.rainPositions && drainagePreviewState.rainGeometry) {
            drainagePreviewState.rainDrops.forEach((drop, index) => {
                const cycle = (progress * drop.speed + drop.phase) % 1;
                const yTop = drop.baseY - (cycle * drop.dropRange);
                const offset = index * 6;
                drainagePreviewState.rainPositions[offset] = drop.x;
                drainagePreviewState.rainPositions[offset + 1] = yTop;
                drainagePreviewState.rainPositions[offset + 2] = drop.z;
                drainagePreviewState.rainPositions[offset + 3] = drop.x - 0.03;
                drainagePreviewState.rainPositions[offset + 4] = yTop - drop.length;
                drainagePreviewState.rainPositions[offset + 5] = drop.z - 0.03;
            });

            drainagePreviewState.rainGeometry.attributes.position.needsUpdate = true;
        }

        drainagePreviewState.waterMeshes.forEach((mesh, index) => {
            mesh.material.opacity = 0.22 + (0.18 * (0.5 + 0.5 * Math.sin((progress * 9) + index)));
        });

        drainagePreviewState.waterDroplets.forEach((droplet) => {
            const cycle = (progress * droplet.speed + droplet.phase) % 1;
            positionDropletOnPath(droplet, cycle);
        });
    }

    function buildRectHouse(parent, materials, plan) {
        const main = plan.byId.main;
        const roofBlock = plan.roofById.main;
        const roof = plan.roofProfiles.main;
        const frontZ = main.z + (main.depth / 2) + 0.03;
        const sideX = main.x - (main.width / 2) - 0.03;
        const frontWindowWidth = clamp(main.width * 0.18, 1.28, 1.62);

        buildBaseBlock(parent, materials, main, {
            windows: [
                { x: main.x - (main.width * 0.28), y: 1.86, z: frontZ, width: frontWindowWidth, height: 1.1 },
                { x: main.x + (main.width * 0.24), y: 1.86, z: frontZ, width: frontWindowWidth, height: 1.1 },
                { x: sideX, y: 1.9, z: main.z, width: clamp(main.depth * 0.23, 1.08, 1.28), height: 1.05, rotY: Math.PI / 2 }
            ]
        });

        if (currentRoofType === 'gable') {
            addGableFrontons(parent, roofBlock, roof, materials.roofClosureMat);
        }

        addUnifiedRoofSkin(parent, materials.roofMat, plan);

        addDoor(parent, materials.trimMat, materials.accentMat, main.x - 0.05, main.z, (main.depth / 2) + 0.04);
        addChimney(
            parent,
            materials.chimneyMat,
            main.x + (main.width * 0.25),
            (getCombinedRoofHeight(plan, main.x + (main.width * 0.25), main.z - (main.depth * 0.16)) || (main.height + roof.roofHeight)) + 0.55,
            main.z - (main.depth * 0.16)
        );
    }

    function buildLShapeHouse(parent, materials, plan) {
        const main = plan.byId.main;
        const wing = plan.byId.wing;
        const mainFrontZ = main.z + (main.depth / 2) + 0.03;
        const wingSideX = wing.x + (wing.width / 2) + 0.03;

        buildBaseBlock(parent, materials, main, {
            windows: [
                { x: main.x - (main.width * 0.24), y: 1.8, z: mainFrontZ, width: clamp(main.width * 0.17, 1.24, 1.48), height: 1.02 },
                { x: main.x + (main.width * 0.05), y: 1.8, z: mainFrontZ, width: clamp(main.width * 0.17, 1.24, 1.48), height: 1.02 }
            ]
        });

        buildBaseBlock(parent, materials, wing, {
            windows: [
                { x: wingSideX, y: 1.78, z: wing.z - (wing.depth * 0.18), width: clamp(wing.width * 0.27, 1.05, 1.24), height: 1, rotY: Math.PI / 2 },
                { x: wingSideX, y: 1.78, z: wing.z + (wing.depth * 0.16), width: clamp(wing.width * 0.27, 1.05, 1.24), height: 1, rotY: Math.PI / 2 }
            ]
        });

        addUnifiedRoofSkin(parent, materials.roofMat, plan);

        (plan.roofGraph.valleys || []).forEach((segment) => {
            const startHeight = getCombinedRoofHeight(plan, segment.start.x, segment.start.z);
            const endHeight = getCombinedRoofHeight(plan, segment.end.x, segment.end.z);
            if (startHeight === null || endHeight === null) return;

            addValleyTrim(
                parent,
                new THREE.Vector3(segment.start.x, startHeight - 0.05, segment.start.z),
                new THREE.Vector3(segment.end.x, endHeight - 0.05, segment.end.z),
                (x, z) => getCombinedRoofHeight(plan, x, z)
            );
        });

        addDoor(parent, materials.trimMat, materials.accentMat, main.x - (main.width * 0.18), main.z, (main.depth / 2) + 0.04);
        addChimney(
            parent,
            materials.chimneyMat,
            wing.x - (wing.width * 0.1),
            (getCombinedRoofHeight(plan, wing.x - (wing.width * 0.1), main.z + (main.depth * 0.04)) || (wing.height + 1.8)) + 0.54,
            main.z + (main.depth * 0.04)
        );
    }

    function buildTShapeHouse(parent, materials, plan) {
        const cross = plan.byId.cross;
        const stem = plan.byId.stem;
        const crossFrontZ = cross.z + (cross.depth / 2) + 0.03;
        const stemRightX = stem.x + (stem.width / 2) + 0.03;
        const stemLeftX = stem.x - (stem.width / 2) - 0.03;
        const stemBackZ = stem.z - (stem.depth / 2) - 0.03;

        buildBaseBlock(parent, materials, cross, {
            windows: [
                { x: cross.x - (cross.width * 0.32), y: 1.8, z: crossFrontZ, width: clamp(cross.width * 0.16, 1.28, 1.46), height: 1.02 },
                { x: cross.x + (cross.width * 0.32), y: 1.8, z: crossFrontZ, width: clamp(cross.width * 0.16, 1.28, 1.46), height: 1.02 }
            ]
        });

        buildBaseBlock(parent, materials, stem, {
            windows: [
                { x: stem.x, y: 1.8, z: stemBackZ, width: clamp(stem.width * 0.36, 1.32, 1.58), height: 1.05 },
                { x: stemRightX, y: 1.8, z: stem.z - (stem.depth * 0.06), width: clamp(stem.width * 0.22, 1.02, 1.16), height: 1, rotY: Math.PI / 2 },
                { x: stemLeftX, y: 1.8, z: stem.z - (stem.depth * 0.06), width: clamp(stem.width * 0.22, 1.02, 1.16), height: 1, rotY: Math.PI / 2 }
            ]
        });

        addUnifiedRoofSkin(parent, materials.roofMat, plan);

        (plan.roofGraph.valleys || []).forEach((segment) => {
            const startHeight = getCombinedRoofHeight(plan, segment.start.x, segment.start.z);
            const endHeight = getCombinedRoofHeight(plan, segment.end.x, segment.end.z);
            if (startHeight === null || endHeight === null) return;

            addValleyTrim(
                parent,
                new THREE.Vector3(segment.start.x, startHeight - 0.05, segment.start.z),
                new THREE.Vector3(segment.end.x, endHeight - 0.05, segment.end.z),
                (x, z) => getCombinedRoofHeight(plan, x, z)
            );
        });

        addDoor(parent, materials.trimMat, materials.accentMat, cross.x, cross.z, (cross.depth / 2) + 0.04);
        addChimney(
            parent,
            materials.chimneyMat,
            cross.x + (cross.width * 0.26),
            (getCombinedRoofHeight(plan, cross.x + (cross.width * 0.26), cross.z + (cross.depth * 0.02)) || (cross.height + 1.9)) + 0.56,
            cross.z + (cross.depth * 0.02)
        );
    }

    function buildHouse() {
        if (!scene) return;

        if (houseGroup) {
            scene.remove(houseGroup);
            disposeObject3DSafe(houseGroup);
            houseGroup.clear();
        }

        roofMeshes = [];
        houseGroup = new THREE.Group();

        const materials = createMaterialSet();
        const plan = getShapePlan(currentShapeType);
        const drainageEstimate = buildDrainageEstimate(plan);

        if (currentShapeType === 'l-shape') {
            buildLShapeHouse(houseGroup, materials, plan);
        } else if (currentShapeType === 't-shape') {
            buildTShapeHouse(houseGroup, materials, plan);
        } else {
            buildRectHouse(houseGroup, materials, plan);
        }

        addDrainageSystem(houseGroup, materials, plan, drainageEstimate);

        scene.add(houseGroup);
    }

    function setRoofColor() {
        if (useFallbackRenderer) {
            drawFallbackHouse();
            return;
        }

        roofMeshes.forEach((mesh) => {
            applyRoofFinish(mesh.material);
            mesh.material.color.set(currentColor);
        });
    }

    function refreshGeometry(shouldAnimateFeedback) {
        clearDrainagePreview();
        updateDimensionControls();
        updateEaveControl();

        if (useFallbackRenderer) {
            drawFallbackHouse();
        } else {
            buildGround();
            buildHouse();
        }

        setRoofColor();

        if (shouldAnimateFeedback) {
            triggerConfiguratorFeedback();
        }

        updateCost();
    }

    function updateCostLegacy() {
        const plan = getShapePlan(currentShapeType);
        const drainageEstimate = buildDrainageEstimate(plan);
        const area = Math.max(plan.roofEstimate || 0, 0);
        const totalComplexity = currentShapeComplexity * currentRoofComplexity;
        const bitumenEstimate = currentMaterialType === 'bitumen-shingle'
            ? buildBitumenRoofEstimate(plan, area)
            : null;
        const materialPrice = Math.round(currentPrice * totalComplexity);
        const laborPrice = Math.round(currentManopera * totalComplexity);
        const totalMaterial = bitumenEstimate ? bitumenEstimate.total : (area * materialPrice);
        const totalLabor = area * laborPrice;
        const drainageCost = drainageEstimate?.pricingAvailable ? drainageEstimate.costs.total : 0;
        const total = totalMaterial + totalLabor + drainageCost;
        const fmtInteger = (value) => value.toLocaleString('ro-RO');
        const fmtDecimal = (value) => value.toLocaleString('ro-RO', {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        });

        const setText = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        };

        if (areaInput) {
            areaInput.value = fmtDecimal(area);
        }

        setText('cShapeType', currentShapeLabel);
        setText('cRoofType', currentRoofLabel);
        setText('cMaterial', currentName);
        setText('cQuality', currentQualityLabel);
        setText('cDrainage', currentDrainageLabel);
        setText('cDrainageLength', drainageEstimate ? formatLinear(drainageEstimate.metrics.gutterLength) : '0.0 ml');
        setText('cDrainageDownspouts', drainageEstimate ? `${drainageEstimate.metrics.downspouts} buc` : '0 buc');
        setText(
            'cDrainageCost',
            drainageEstimate
                ? (drainageEstimate.pricingAvailable ? `${fmtInteger(Math.round(drainageCost))} lei` : 'Tarif în așteptare')
                : '0 lei'
        );
        setText('cEave', formatMeters(currentEaveOverhang));
        setText('cComplexity', `${totalComplexity.toFixed(2)}x`);
        setText('cFootprint', formatSurface(plan.footprint));
        setText('cRoofEstimate', formatSurface(plan.roofEstimate));
        setText('cArea', formatSurface(area));
        setText('cPriceMat', `${fmtInteger(Math.round(totalMaterial))} lei`);
        setText('cManopera', `${fmtInteger(Math.round(totalLabor))} lei`);
        setText('cTotal', `${fmtInteger(Math.round(total))} lei`);
        renderEstimateBreakdown(bitumenEstimate);

        if (costNoteEl) {
            if (bitumenEstimate) {
                costNoteEl.textContent = '* Pentru șindrila bituminoasă, devizul materialelor include produsul principal, coama, membrana, cuie, ventilație, OSB și regleta de streașină. Cantitățile sunt estimate automat din geometria curentă și pot diferi față de măsurătorile din șantier.';
            } else if (!drainageEstimate) {
                costNoteEl.textContent = '* Pagina este pentru test intern. Valorile sunt orientative și includ o ajustare pentru complexitatea geometriei. Sistemul de scurgere se calculează din conturul acoperișului și poate fi activat separat.';
            } else {
                costNoteEl.textContent = '* Pagina este pentru test intern. Valorile sunt orientative. Sistemul de scurgere folosește catalogul standard confirmat și este inclus în totalul estimat atunci când este selectat.';
            }
        }

        updatePanelSummaries(`${fmtInteger(Math.round(total))} lei estimativ`);
    }

    function buildQualityOffers(plan, area, drainageEstimate, totalComplexity) {
        const qualityOptions = materialQualityOptions[currentMaterialType] || [];
        const drainageCost = drainageEstimate?.pricingAvailable ? drainageEstimate.costs.total : 0;
        const laborPrice = Math.round(currentManopera * totalComplexity);

        return qualityOptions.map((option) => {
            const bitumenEstimate = currentMaterialType === 'bitumen-shingle'
                ? buildBitumenRoofEstimate(plan, area, option)
                : null;
            const modularEstimate = currentMaterialType === 'metal-modular'
                ? buildModularRoofEstimate(plan, area, option)
                : null;
            const materialPrice = Math.round(option.price * totalComplexity);
            const estimate = bitumenEstimate || modularEstimate;
            const materialTotal = estimate ? estimate.total : (area * materialPrice);
            const laborTotal = area * laborPrice;

            return {
                key: option.key,
                label: option.label,
                estimate,
                materialTotal,
                laborTotal,
                drainageCost,
                total: materialTotal + laborTotal + drainageCost
            };
        });
    }

    function updateCost() {
        const plan = getShapePlan(currentShapeType);
        const drainageEstimate = buildDrainageEstimate(plan);
        const area = Math.max(plan.roofEstimate || 0, 0);
        const totalComplexity = currentShapeComplexity * currentRoofComplexity;
        const qualityOffers = buildQualityOffers(plan, area, drainageEstimate, totalComplexity);
        const lowestOffer = qualityOffers.reduce((best, offer) => (!best || offer.total < best.total ? offer : best), null);
        const highestOffer = qualityOffers.reduce((best, offer) => (!best || offer.total > best.total ? offer : best), null);
        const fmtInteger = (value) => value.toLocaleString('ro-RO');
        const fmtDecimal = (value) => value.toLocaleString('ro-RO', {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        });

        const setText = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        };

        if (areaInput) {
            areaInput.value = fmtDecimal(area);
        }

        setText('cShapeType', currentShapeLabel);
        setText('cRoofType', currentRoofLabel);
        setText('cMaterial', currentName);
        setText('cDrainage', currentDrainageLabel);
        setText('cDrainageLength', drainageEstimate ? formatLinear(drainageEstimate.metrics.gutterLength) : '0.0 ml');
        setText('cDrainageDownspouts', drainageEstimate ? `${drainageEstimate.metrics.downspouts} buc` : '0 buc');
        setText(
            'cDrainageCost',
            drainageEstimate
                ? (drainageEstimate.pricingAvailable ? `${fmtInteger(Math.round(drainageEstimate.costs.total))} lei` : 'Tarif în așteptare')
                : '0 lei'
        );
        setText('cEave', formatMeters(currentEaveOverhang));
        setText('cComplexity', `${totalComplexity.toFixed(2)}x`);
        setText('cFootprint', formatSurface(plan.footprint));
        setText('cRoofEstimate', formatSurface(plan.roofEstimate));
        setText('cArea', formatSurface(area));
        renderQualityOffers(qualityOffers);
        renderEstimateBreakdown(
            drainageEstimate?.pricingAvailable ? drainageEstimate : null,
            'Deviz orientativ sistem de scurgere'
        );

        if (costNoteEl) {
            if (currentMaterialType === 'bitumen-shingle') {
                costNoteEl.textContent = '* Pentru șindrila bituminoasă, cele 3 prețuri sunt strict orientative și includ produsul principal, coama, membrana suport, membrana de difuzie, cuie, ventilație, OSB, regleta de jgheab, bordura fronton, manopera și sistemul de scurgere selectat. Calculul nu reflectă perfect realitatea din șantier; consumabilele generale, sistemele de fixare structurale și particularitățile proiectului se validează separat.';
            } else if (currentMaterialType === 'metal-modular') {
                costNoteEl.textContent = '* Pentru țigla metalică modulară, cele 3 prețuri sunt strict orientative și includ produsul principal, coama, capacele de coamă, bordura fronton, picurător, regleta de jgheab, dolia interioară, membrana de difuzie, lenta de coamă, pieptenele și grila de ventilare la streașină, șuruburile de 35 mm, manopera și sistemul de scurgere selectat. Calculul nu corespunde perfect cu realitatea finală; elementele speciale de perete, parazăpezile, consumabilele generale și particularitățile proiectului se validează separat.';
            } else {
                costNoteEl.textContent = isSandboxConfigurator
                    ? '* Pagina este pentru test intern. Valorile sunt orientative și includ o ajustare pentru complexitatea geometriei. Sistemul de scurgere se calculează din conturul acoperișului și poate fi activat separat.'
                    : '* Configuratorul oferă doar o estimare orientativă pe baza geometriei selectate și nu reflectă perfect prețul real din oferta finală. Prețul final se confirmă numai după verificarea proiectului, măsurători exacte și validarea tuturor detaliilor tehnice.';
            }
        }

        if (lowestOffer && highestOffer) {
            updatePanelSummaries(`${fmtInteger(Math.round(lowestOffer.total))} - ${fmtInteger(Math.round(highestOffer.total))} lei`);
        } else {
            updatePanelSummaries('Estimare actualizată');
        }
    }

    function animate(time) {
        requestAnimationFrame(animate);
        if (useFallbackRenderer) {
            if (drainagePreviewState) {
                updateDrainagePreview(time || performance.now());
            }
            return;
        }
        if (!renderer || !scene || !camera) return;
        if (controls) controls.update();
        if (drainagePreviewState) {
            updateDrainagePreview(time || performance.now());
        }
        renderer.render(scene, camera);
    }

    function onResize() {
        updateMobilePanelLayout();

        if (useFallbackRenderer) {
            drawFallbackHouse();
            return;
        }

        if (!renderer || !camera) return;
        const { width, height } = getCanvasSize();
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    }

    panelToggleBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
            const section = btn.closest('.cfg__panel-section');
            if (!section) return;
            const shouldExpand = section.classList.contains('is-collapsed');
            if (isCompactConfiguratorViewport() && !shouldExpand) {
                return;
            }
            if (shouldExpand) {
                collapseSiblingPanels(section);
            }
            setPanelExpanded(section, shouldExpand);
            if (shouldExpand) {
                activeMobilePanelKey = section.dataset.panelKey || activeMobilePanelKey;
            }
            updateMobilePanelLayout();
        });
    });

    shapeBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
            shapeBtns.forEach((item) => item.classList.remove('cfg__house-type-btn--active'));
            btn.classList.add('cfg__house-type-btn--active');

            currentShapeType = btn.dataset.shapeType || 'rect';
            currentShapeLabel = btn.dataset.shapeLabel || 'Casă simplă';
            currentShapeComplexity = parseFloat(btn.dataset.shapeComplexity || '1') || 1;
            currentRoofType = btn.dataset.roofType || 'gable';
            currentRoofLabel = btn.dataset.roofLabel || '2 pante';
            currentRoofComplexity = parseFloat(btn.dataset.roofComplexity || '1') || 1;

            updatePanelSummaries();
            refreshGeometry(true);
            advanceGuidedPanelFlow('dims');
        });
    });

        colorBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
            colorBtns.forEach((item) => item.classList.remove('cfg__color-btn--active'));
            btn.classList.add('cfg__color-btn--active');

            currentMaterialType = btn.dataset.materialType || 'metal-modular';
            currentManopera = parseInt(btn.dataset.manopera, 10) || 100;
            const strong = btn.querySelector('strong');
            currentName = strong ? strong.textContent : 'Material';

            updateQualityOptions(currentMaterialType, currentQualityKey);
            syncAutoColor(currentMaterialType);
            ensureRoofReferenceLoaded(currentMaterialType);
            setRoofColor();
            triggerConfiguratorFeedback();
            updatePanelSummaries();
            updateCost();
            advanceGuidedPanelFlow('drainage');
        });
    });

    Object.keys(dimensionInputs).forEach((key) => {
        const input = dimensionInputs[key];
        if (!input) return;

        input.addEventListener('input', () => {
            const dims = getShapeDimensions(currentShapeType);
            dims[key] = clampDimensionValue(key, input.value);
            normalizeShapeDimensions(currentShapeType);
            refreshGeometry(true);
        });

        input.addEventListener('change', () => {
            advanceGuidedPanelFlow('material');
        });
    });

    if (dimsResetBtn) {
        dimsResetBtn.addEventListener('click', () => {
            shapeDimensionState[currentShapeType] = { ...defaultShapeDimensions[currentShapeType] };
            currentEaveOverhang = 0.48;
            refreshGeometry(true);
        });
    }

    if (eaveOverhangInput) {
        eaveOverhangInput.addEventListener('input', () => {
            currentEaveOverhang = clamp(parseFloat(eaveOverhangInput.value) || 0.48, 0.2, 0.9);
            refreshGeometry(true);
        });

        eaveOverhangInput.addEventListener('change', () => {
            advanceGuidedPanelFlow('material');
        });
    }

    if (drainageSelect) {
        drainageSelect.addEventListener('change', () => {
            currentDrainageKey = drainageSelect.value || 'none';
            currentDrainageLabel = drainageSelect.options[drainageSelect.selectedIndex]?.textContent || 'Fără sistem de scurgere';
            refreshGeometry(true);
            const plan = getShapePlan(currentShapeType);
            const drainageEstimate = buildDrainageEstimate(plan);
            startDrainagePreview(plan, drainageEstimate);
            completeGuidedPanelFlow('cost');
        });
    }

    window.addEventListener('resize', onResize);

    try {
        setupScene();
    } catch (error) {
        console.warn('Sandbox fallback activated:', error);
        initFallbackScene();
    }

    Object.keys(roofReferenceSources).forEach((materialType) => ensureRoofReferenceLoaded(materialType));

    ensureMobileStepper();
    syncAutoColor(currentMaterialType);
    updateQualityOptions(currentMaterialType, currentQualityKey);
    setRoofColor();
    updateDimensionControls();
    updateEaveControl();
    updateCost();
    updateMobilePanelLayout();

    window.__cfgState = function () {
        const plan = getShapePlan(currentShapeType);
        const drainageEstimate = buildDrainageEstimate(plan);
        const area = Math.max(plan.roofEstimate || 0, 0);
        const totalComplexity = currentShapeComplexity * currentRoofComplexity;
        const offers = buildQualityOffers(plan, area, drainageEstimate, totalComplexity);
        const lowestOffer = offers.reduce((best, offer) => (!best || offer.total < best.total ? offer : best), null);
        const highestOffer = offers.reduce((best, offer) => (!best || offer.total > best.total ? offer : best), null);

        return {
            houseType: currentShapeType,
            houseLabel: `${currentShapeLabel} - ${currentRoofLabel}`,
            roofLabel: currentRoofLabel,
            name: currentName,
            materialType: currentMaterialType,
            price: currentPrice,
            quality: 1,
            qualityLabel: 'VIP / Premium / Standart',
            manopera: currentManopera,
            area: Math.round(area * 10) / 10,
            drainageLabel: currentDrainageLabel,
            offers: offers.map((offer) => ({
                key: offer.key,
                label: offer.label,
                total: Math.round(offer.total),
                materialTotal: Math.round(offer.materialTotal),
                laborTotal: Math.round(offer.laborTotal),
                drainageCost: Math.round(offer.drainageCost)
            })),
            lowestTotal: lowestOffer ? Math.round(lowestOffer.total) : 0,
            highestTotal: highestOffer ? Math.round(highestOffer.total) : 0
        };
    };
})();
