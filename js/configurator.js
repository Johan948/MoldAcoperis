/* ============================================
   MoldAcoperis - 3D Roof Configurator
   Built with Three.js r128

   HOW TO REPLACE PLACEHOLDER HOUSE WITH REAL MODEL:
   1. Place your .glb/.gltf file in /images/ folder
   2. Add GLTFLoader script in HTML:
      <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js"></script>
   3. In initScene(), replace buildProceduralHouse() call with:
      const loader = new THREE.GLTFLoader();
      loader.load('images/house.glb', (gltf) => {
          const model = gltf.scene;
          // Find the roof mesh by name (set in Blender/3D editor)
          roofMesh = model.getObjectByName('Roof');
          scene.add(model);
      });
   4. Make sure the roof mesh in your 3D model has a separate
      material so it can be changed independently.

   HOW TO ADD MORE ROOF COLORS:
   Add a new <button> in #cfgColors in index.html:
     <button class="cfg__color-btn" data-color="verde" data-hex="#2E7D32"
             data-price="300" data-manopera="130">
       <span class="cfg__color-swatch" style="background:#2E7D32"></span>
       <span class="cfg__color-info">
         <strong>Tigla Verde</strong>
         <small>Verde ~300 lei/m²</small>
       </span>
     </button>
   The JS will pick it up automatically.
   ============================================ */

(function () {
    'use strict';

    // --- Elements ---
    const canvasEl = document.getElementById('cfgCanvas');
    const wrapEl = document.getElementById('cfgCanvasWrap');
    const hintEl = document.getElementById('cfgCanvasHint');
    const houseTypeBtns = document.querySelectorAll('.cfg__house-type-btn');
    const colorBtns = document.querySelectorAll('.cfg__color-btn');
    const qualitySelect = document.getElementById('cfgQuality');
    const panelSections = document.querySelectorAll('.cfg__panel-section');
    const costEl = document.querySelector('.cfg__cost');
    const areaInput = document.getElementById('cfgArea');
    const areaSlider = document.getElementById('cfgSlider');
    const locale = document.documentElement.lang === 'ru' ? 'ru-RU' : 'ro-RO';

    if (!canvasEl || !wrapEl) return;

    // --- Three.js globals ---
    let scene, camera, renderer, controls;
    let houseGroup;
    let roofMeshes = []; // Array of roof meshes to change color
    let fallbackCtx = null;
    let useFallbackRenderer = false;
    let renderFrame = null;
    let sceneIsVisible = true;

    // --- Default state ---
    let currentHouseType = 'gable';
    let currentHouseLabel = '2 pante';
    let currentColor = '#C54B30';
    let currentMaterialType = 'metal-classic';
    let currentPrice = 200;
    let currentManopera = 100;
    let currentName = 'Tigla Metalica';
    let currentQuality = 1;
    let currentQualityLabel = 'Standard';

    function loadExternalScript(src) {
        return new Promise((resolve, reject) => {
            const existing = Array.from(document.querySelectorAll('script[src]')).find((script) => script.src === src);
            if (existing) {
                if (existing.dataset.loaded === 'true') {
                    resolve();
                    return;
                }
                existing.addEventListener('load', () => {
                    existing.dataset.loaded = 'true';
                    resolve();
                }, { once: true });
                existing.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)), { once: true });
                return;
            }

            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            script.onload = () => {
                script.dataset.loaded = 'true';
                resolve();
            };
            script.onerror = () => reject(new Error(`Failed to load ${src}`));
            document.head.appendChild(script);
        });
    }

    async function ensureThreeDependencies() {
        if (typeof window.THREE === 'undefined') {
            try {
                await loadExternalScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js');
            } catch (err) {
                await loadExternalScript('https://unpkg.com/three@0.128.0/build/three.min.js');
            }
        }

        if (!window.THREE || typeof window.THREE.OrbitControls === 'undefined') {
            try {
                await loadExternalScript('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js');
            } catch (err) {
                await loadExternalScript('https://unpkg.com/three@0.128.0/examples/js/controls/OrbitControls.js');
            }
        }

        if (typeof window.THREE === 'undefined') {
            throw new Error('Three.js core is not available');
        }
    }

    function getCanvasDimensions() {
        const width = Math.max(Math.floor(wrapEl.clientWidth || 640), 320);
        const height = Math.max(Math.floor(wrapEl.clientHeight || (width * 0.75)), 240);

        return { width, height };
    }

    function getFallbackMaterialPalette() {
        if (currentMaterialType === 'bitumen-shingle') {
            return {
                wall: '#f3e5d2',
                roofShadow: '#2f2f39',
                roofHighlight: currentColor,
                trim: '#f7f0e6'
            };
        }

        if (currentMaterialType === 'metal-modular') {
            return {
                wall: '#f2e1cf',
                roofShadow: '#59412f',
                roofHighlight: currentColor,
                trim: '#fff7ee'
            };
        }

        return {
            wall: '#f6e7d5',
            roofShadow: '#623a26',
            roofHighlight: currentColor,
            trim: '#fff9f1'
        };
    }

    function drawFallbackHouse() {
        if (!fallbackCtx) return;

        const ctx = fallbackCtx;
        const { width, height } = getCanvasDimensions();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const palette = getFallbackMaterialPalette();

        if (canvasEl.width !== width * dpr || canvasEl.height !== height * dpr) {
            canvasEl.width = width * dpr;
            canvasEl.height = height * dpr;
            canvasEl.style.width = `${width}px`;
            canvasEl.style.height = `${height}px`;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }

        ctx.clearRect(0, 0, width, height);

        const sky = ctx.createLinearGradient(0, 0, 0, height);
        sky.addColorStop(0, '#fdfefe');
        sky.addColorStop(0.55, '#eef2f6');
        sky.addColorStop(1, '#dde3ea');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, width, height);

        const groundY = height * 0.78;
        const ground = ctx.createLinearGradient(0, groundY, 0, height);
        ground.addColorStop(0, '#91ba5a');
        ground.addColorStop(1, '#6f9741');
        ctx.fillStyle = ground;
        ctx.fillRect(0, groundY, width, height - groundY);

        const houseWidth = width * 0.32;
        const houseHeight = height * 0.25;
        const annexWidth = width * 0.16;
        const annexHeight = height * 0.19;
        const houseX = width * 0.28;
        const houseY = groundY - houseHeight;
        const annexX = houseX + houseWidth - width * 0.02;
        const annexY = groundY - annexHeight;
        const roofPeak = currentHouseType === 'hip' ? height * 0.10 : height * 0.085;

        ctx.fillStyle = '#b7a38f';
        ctx.fillRect(houseX - 10, groundY - 4, houseWidth + annexWidth + 30, 10);

        ctx.fillStyle = palette.wall;
        ctx.fillRect(houseX, houseY, houseWidth, houseHeight);
        ctx.fillRect(annexX, annexY, annexWidth, annexHeight);

        ctx.fillStyle = palette.trim;
        ctx.fillRect(houseX - 6, houseY + 8, 8, houseHeight - 8);
        ctx.fillRect(houseX + houseWidth - 2, houseY + 8, 8, houseHeight - 8);

        ctx.fillStyle = palette.roofShadow;
        if (currentHouseType === 'hip') {
            ctx.beginPath();
            ctx.moveTo(houseX - 6, houseY + 10);
            ctx.lineTo(houseX + houseWidth * 0.18, houseY - roofPeak);
            ctx.lineTo(houseX + houseWidth * 0.82, houseY - roofPeak);
            ctx.lineTo(houseX + houseWidth + 8, houseY + 10);
            ctx.lineTo(houseX + houseWidth - 12, houseY + 24);
            ctx.lineTo(houseX + 12, houseY + 24);
            ctx.closePath();
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.moveTo(houseX - 10, houseY + 12);
            ctx.lineTo(houseX + houseWidth / 2, houseY - roofPeak);
            ctx.lineTo(houseX + houseWidth + 10, houseY + 12);
            ctx.closePath();
            ctx.fill();
        }

        ctx.fillStyle = palette.roofHighlight;
        if (currentHouseType === 'hip') {
            ctx.beginPath();
            ctx.moveTo(houseX + 8, houseY + 24);
            ctx.lineTo(houseX + houseWidth * 0.24, houseY - roofPeak + 10);
            ctx.lineTo(houseX + houseWidth * 0.76, houseY - roofPeak + 10);
            ctx.lineTo(houseX + houseWidth - 8, houseY + 24);
            ctx.closePath();
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.moveTo(houseX + 4, houseY + 22);
            ctx.lineTo(houseX + houseWidth / 2, houseY - roofPeak + 12);
            ctx.lineTo(houseX + houseWidth - 4, houseY + 22);
            ctx.closePath();
            ctx.fill();
        }

        ctx.fillStyle = currentColor;
        ctx.fillRect(annexX - 4, annexY - 10, annexWidth + 10, 16);

        ctx.fillStyle = '#6c3b1b';
        ctx.fillRect(houseX + houseWidth * 0.18, houseY + houseHeight * 0.36, houseWidth * 0.18, houseHeight * 0.64);
        ctx.fillStyle = '#b9d9ea';
        ctx.fillRect(houseX + houseWidth * 0.56, houseY + houseHeight * 0.24, houseWidth * 0.22, houseHeight * 0.28);
        ctx.fillRect(annexX + annexWidth * 0.2, annexY + annexHeight * 0.25, annexWidth * 0.56, annexHeight * 0.28);

        ctx.strokeStyle = 'rgba(255,255,255,0.45)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 5; i += 1) {
            const roofLineY = houseY + 18 + i * 9;
            ctx.beginPath();
            ctx.moveTo(houseX + 12, roofLineY);
            ctx.lineTo(houseX + houseWidth - 12, roofLineY);
            ctx.stroke();
        }

        ctx.fillStyle = 'rgba(26,26,46,0.08)';
        ctx.beginPath();
        ctx.ellipse(width * 0.52, groundY + 12, width * 0.26, 18, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    function initFallbackScene() {
        fallbackCtx = canvasEl.getContext('2d');
        useFallbackRenderer = true;

        if (hintEl) {
            hintEl.innerHTML = '<i class="fas fa-arrows-rotate"></i> Previzualizare interactiva activa';
            hintEl.style.opacity = '1';
        }

        drawFallbackHouse();
    }

    function buildRoofFinish(materialType, hexColor) {
        const diffuseCanvas = document.createElement('canvas');
        const bumpCanvas = document.createElement('canvas');
        const roughnessCanvas = document.createElement('canvas');
        diffuseCanvas.width = bumpCanvas.width = roughnessCanvas.width = 1024;
        diffuseCanvas.height = bumpCanvas.height = roughnessCanvas.height = 1024;

        const diffuseCtx = diffuseCanvas.getContext('2d');
        const bumpCtx = bumpCanvas.getContext('2d');
        const roughnessCtx = roughnessCanvas.getContext('2d');
        const baseColor = new THREE.Color(hexColor);
        const lightColor = baseColor.clone().lerp(new THREE.Color(0xffffff), 0.22).getStyle();
        const darkColor = baseColor.clone().lerp(new THREE.Color(0x000000), 0.28).getStyle();
        const midColor = baseColor.clone().lerp(new THREE.Color(0xffffff), 0.08).getStyle();

        diffuseCtx.fillStyle = baseColor.getStyle();
        diffuseCtx.fillRect(0, 0, 1024, 1024);

        bumpCtx.fillStyle = 'rgb(132,132,132)';
        bumpCtx.fillRect(0, 0, 1024, 1024);

        roughnessCtx.fillStyle = 'rgb(150,150,150)';
        roughnessCtx.fillRect(0, 0, 1024, 1024);

        if (materialType === 'metal-classic') {
            drawClassicMetal(diffuseCtx, bumpCtx, roughnessCtx, lightColor, darkColor, midColor);
        } else if (materialType === 'metal-modular') {
            drawModularMetal(diffuseCtx, bumpCtx, roughnessCtx, lightColor, darkColor, midColor);
        } else {
            drawBitumenShingles(diffuseCtx, bumpCtx, roughnessCtx, lightColor, darkColor, midColor);
        }

        addCommonSurfaceVariation(diffuseCtx, roughnessCtx, materialType);

        const map = new THREE.CanvasTexture(diffuseCanvas);
        const bumpMap = new THREE.CanvasTexture(bumpCanvas);
        const roughnessMap = new THREE.CanvasTexture(roughnessCanvas);
        const profile = getMaterialProfile(materialType);

        [map, bumpMap, roughnessMap].forEach((texture) => {
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(profile.repeatX, profile.repeatY);
            texture.anisotropy = renderer ? renderer.capabilities.getMaxAnisotropy() : 1;
        });

        return {
            map,
            bumpMap,
            roughnessMap,
            profile
        };
    }

    function getMaterialProfile(materialType) {
        if (materialType === 'metal-classic') {
            return {
                repeatX: 1.55,
                repeatY: 1.8,
                roughness: 0.46,
                metalness: 0.38,
                bumpScale: 0.11,
                clearcoat: 0.36,
                clearcoatRoughness: 0.42
            };
        }

        if (materialType === 'metal-modular') {
            return {
                repeatX: 1.4,
                repeatY: 1.5,
                roughness: 0.55,
                metalness: 0.28,
                bumpScale: 0.08,
                clearcoat: 0.24,
                clearcoatRoughness: 0.5
            };
        }

        return {
            repeatX: 2.2,
            repeatY: 2.4,
            roughness: 0.88,
            metalness: 0.04,
            bumpScale: 0.05,
            clearcoat: 0.02,
            clearcoatRoughness: 1
        };
    }

    function drawClassicMetal(diffuseCtx, bumpCtx, roughnessCtx, lightColor, darkColor, midColor) {
        const tileH = 128;
        const tileW = 170;

        for (let y = 0; y < 1024; y += tileH) {
            diffuseCtx.fillStyle = darkColor;
            diffuseCtx.fillRect(0, y, 1024, 10);

            bumpCtx.fillStyle = 'rgb(88,88,88)';
            bumpCtx.fillRect(0, y, 1024, 14);

            roughnessCtx.fillStyle = 'rgb(126,126,126)';
            roughnessCtx.fillRect(0, y, 1024, tileH);
            roughnessCtx.fillStyle = 'rgb(176,176,176)';
            roughnessCtx.fillRect(0, y, 1024, 12);

            for (let x = 0; x < 1024 + tileW; x += tileW) {
                diffuseCtx.strokeStyle = lightColor;
                diffuseCtx.lineWidth = 7;
                diffuseCtx.beginPath();
                diffuseCtx.moveTo(x - tileW * 0.5, y + tileH * 0.26);
                diffuseCtx.quadraticCurveTo(x, y + tileH * 0.03, x + tileW * 0.5, y + tileH * 0.26);
                diffuseCtx.stroke();

                diffuseCtx.strokeStyle = midColor;
                diffuseCtx.lineWidth = 6;
                diffuseCtx.beginPath();
                diffuseCtx.moveTo(x - tileW * 0.5, y + tileH * 0.62);
                diffuseCtx.quadraticCurveTo(x, y + tileH * 0.42, x + tileW * 0.5, y + tileH * 0.62);
                diffuseCtx.stroke();

                diffuseCtx.strokeStyle = 'rgba(0,0,0,0.18)';
                diffuseCtx.lineWidth = 3;
                diffuseCtx.beginPath();
                diffuseCtx.moveTo(x - tileW * 0.5, y + tileH * 0.74);
                diffuseCtx.quadraticCurveTo(x, y + tileH * 0.56, x + tileW * 0.5, y + tileH * 0.74);
                diffuseCtx.stroke();

                bumpCtx.strokeStyle = 'rgb(185,185,185)';
                bumpCtx.lineWidth = 12;
                bumpCtx.beginPath();
                bumpCtx.moveTo(x - tileW * 0.5, y + tileH * 0.26);
                bumpCtx.quadraticCurveTo(x, y, x + tileW * 0.5, y + tileH * 0.26);
                bumpCtx.stroke();

                bumpCtx.strokeStyle = 'rgb(76,76,76)';
                bumpCtx.lineWidth = 11;
                bumpCtx.beginPath();
                bumpCtx.moveTo(x - tileW * 0.5, y + tileH * 0.68);
                bumpCtx.quadraticCurveTo(x, y + tileH * 0.48, x + tileW * 0.5, y + tileH * 0.68);
                bumpCtx.stroke();

                roughnessCtx.strokeStyle = 'rgb(96,96,96)';
                roughnessCtx.lineWidth = 6;
                roughnessCtx.beginPath();
                roughnessCtx.moveTo(x - tileW * 0.5, y + tileH * 0.24);
                roughnessCtx.quadraticCurveTo(x, y + tileH * 0.02, x + tileW * 0.5, y + tileH * 0.24);
                roughnessCtx.stroke();
            }
        }

        addBrushedReflection(diffuseCtx, roughnessCtx, 0.08, 0.08);
    }

    function drawModularMetal(diffuseCtx, bumpCtx, roughnessCtx, lightColor, darkColor, midColor) {
        const moduleW = 210;
        const moduleH = 160;

        for (let y = 0; y < 1024; y += moduleH) {
            for (let x = 0; x < 1024; x += moduleW) {
                diffuseCtx.fillStyle = midColor;
                diffuseCtx.fillRect(x + 10, y + 12, moduleW - 20, moduleH - 24);

                diffuseCtx.strokeStyle = lightColor;
                diffuseCtx.lineWidth = 5;
                diffuseCtx.strokeRect(x + 12, y + 14, moduleW - 24, moduleH - 28);

                diffuseCtx.strokeStyle = 'rgba(0,0,0,0.22)';
                diffuseCtx.lineWidth = 4;
                diffuseCtx.beginPath();
                diffuseCtx.moveTo(x + 16, y + moduleH - 18);
                diffuseCtx.lineTo(x + moduleW - 16, y + moduleH - 18);
                diffuseCtx.stroke();

                diffuseCtx.fillStyle = 'rgba(255,255,255,0.12)';
                diffuseCtx.fillRect(x + 18, y + 18, moduleW - 36, 18);

                bumpCtx.fillStyle = 'rgb(170,170,170)';
                bumpCtx.fillRect(x + 8, y + 8, moduleW - 16, moduleH - 16);
                bumpCtx.fillStyle = 'rgb(92,92,92)';
                bumpCtx.fillRect(x + 8, y + moduleH - 18, moduleW - 16, 10);
                bumpCtx.fillStyle = 'rgb(192,192,192)';
                bumpCtx.fillRect(x + 8, y + 8, moduleW - 16, 8);

                roughnessCtx.fillStyle = 'rgb(134,134,134)';
                roughnessCtx.fillRect(x + 8, y + 8, moduleW - 16, moduleH - 16);
                roughnessCtx.fillStyle = 'rgb(96,96,96)';
                roughnessCtx.fillRect(x + 10, y + 10, moduleW - 20, 10);
                roughnessCtx.fillStyle = 'rgb(172,172,172)';
                roughnessCtx.fillRect(x + 10, y + moduleH - 16, moduleW - 20, 6);
            }

            diffuseCtx.fillStyle = darkColor;
            diffuseCtx.fillRect(0, y, 1024, 7);
            bumpCtx.fillStyle = 'rgb(82,82,82)';
            bumpCtx.fillRect(0, y, 1024, 8);
            roughnessCtx.fillStyle = 'rgb(182,182,182)';
            roughnessCtx.fillRect(0, y, 1024, 8);
        }

        addBrushedReflection(diffuseCtx, roughnessCtx, 0.06, 0.06);
    }

    function drawBitumenShingles(diffuseCtx, bumpCtx, roughnessCtx, lightColor, darkColor, midColor) {
        const rowH = 110;
        const shingleW = 122;

        for (let y = 0; y < 1024; y += rowH) {
            const offset = Math.floor((y / rowH) % 2) * (shingleW / 2);

            diffuseCtx.fillStyle = darkColor;
            diffuseCtx.fillRect(0, y, 1024, 9);

            for (let x = -offset; x < 1024 + shingleW; x += shingleW) {
                diffuseCtx.fillStyle = midColor;
                diffuseCtx.fillRect(x + 4, y + 12, shingleW - 8, rowH - 18);

                diffuseCtx.fillStyle = 'rgba(255,255,255,0.08)';
                diffuseCtx.fillRect(x + 8, y + 16, shingleW - 16, 10);

                diffuseCtx.strokeStyle = 'rgba(0,0,0,0.22)';
                diffuseCtx.lineWidth = 3;
                diffuseCtx.strokeRect(x + 4, y + 12, shingleW - 8, rowH - 18);

                diffuseCtx.fillStyle = 'rgba(255,255,255,0.035)';
                for (let i = 0; i < 42; i += 1) {
                    diffuseCtx.fillRect(x + 8 + ((i * 17) % (shingleW - 18)), y + 18 + ((i * 11) % (rowH - 32)), 3, 3);
                }

                bumpCtx.fillStyle = 'rgb(162,162,162)';
                bumpCtx.fillRect(x + 6, y + 14, shingleW - 12, rowH - 22);
                bumpCtx.fillStyle = 'rgb(90,90,90)';
                bumpCtx.fillRect(x + 6, y + rowH - 14, shingleW - 12, 8);

                roughnessCtx.fillStyle = 'rgb(214,214,214)';
                roughnessCtx.fillRect(x + 6, y + 14, shingleW - 12, rowH - 22);
                roughnessCtx.fillStyle = 'rgb(236,236,236)';
                for (let i = 0; i < 24; i += 1) {
                    const px = x + 10 + ((i * 19) % (shingleW - 20));
                    const py = y + 18 + ((i * 13) % (rowH - 30));
                    roughnessCtx.fillRect(px, py, 4, 4);
                }
            }

            bumpCtx.fillStyle = 'rgb(78,78,78)';
            bumpCtx.fillRect(0, y, 1024, 10);
            roughnessCtx.fillStyle = 'rgb(242,242,242)';
            roughnessCtx.fillRect(0, y, 1024, 10);
        }
    }

    function addCommonSurfaceVariation(diffuseCtx, roughnessCtx, materialType) {
        const density = materialType === 'bitumen-shingle' ? 700 : 360;
        const alpha = materialType === 'bitumen-shingle' ? 0.05 : 0.035;

        diffuseCtx.fillStyle = `rgba(255,255,255,${alpha})`;
        for (let i = 0; i < density; i += 1) {
            const x = (i * 83) % 1024;
            const y = (i * 197) % 1024;
            const size = materialType === 'bitumen-shingle' ? ((i % 3) + 1) : 1;
            diffuseCtx.fillRect(x, y, size, size);
        }

        roughnessCtx.fillStyle = materialType === 'bitumen-shingle' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)';
        for (let i = 0; i < density; i += 1) {
            const x = (i * 61) % 1024;
            const y = (i * 149) % 1024;
            roughnessCtx.fillRect(x, y, 2, 2);
        }
    }

    function addBrushedReflection(diffuseCtx, roughnessCtx, alpha, roughnessAlpha) {
        for (let y = 0; y < 1024; y += 48) {
            diffuseCtx.fillStyle = `rgba(255,255,255,${alpha})`;
            diffuseCtx.fillRect(0, y, 1024, 6);
            roughnessCtx.fillStyle = `rgba(0,0,0,${roughnessAlpha})`;
            roughnessCtx.fillRect(0, y, 1024, 4);
        }
    }

    function applyRoofFinish(material, materialType, hexColor) {
        const finish = buildRoofFinish(materialType, hexColor);
        material.color.set(hexColor);
        material.map = finish.map;
        material.bumpMap = finish.bumpMap;
        material.roughnessMap = finish.roughnessMap;
        material.bumpScale = finish.profile.bumpScale;
        material.roughness = finish.profile.roughness;
        material.metalness = finish.profile.metalness;
        if ('clearcoat' in material) {
            material.clearcoat = finish.profile.clearcoat;
            material.clearcoatRoughness = finish.profile.clearcoatRoughness;
        }
        material.needsUpdate = true;
    }

    function renderScene() {
        if (useFallbackRenderer) {
            drawFallbackHouse();
            return;
        }

        if (!renderer || !scene || !camera || !sceneIsVisible || document.hidden) return;
        renderer.render(scene, camera);
    }

    function queueRender() {
        if (useFallbackRenderer) {
            drawFallbackHouse();
            return;
        }

        if (!renderer || !scene || !camera || !sceneIsVisible || document.hidden) return;
        if (renderFrame !== null) return;

        renderFrame = requestAnimationFrame(() => {
            renderFrame = null;
            renderScene();
        });
    }

    function setupSceneVisibilityObserver() {
        if (!('IntersectionObserver' in window) || !wrapEl) return;

        const observer = new IntersectionObserver((entries) => {
            const entry = entries[0];
            sceneIsVisible = !entry || entry.isIntersecting;
            if (sceneIsVisible) {
                queueRender();
            }
        }, {
            rootMargin: '240px 0px'
        });

        observer.observe(wrapEl);
    }

    // ========== INIT SCENE ==========
    function initScene() {
        // Scene
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf7f7f9);

        // Camera
        const aspect = wrapEl.clientWidth / wrapEl.clientHeight;
        camera = new THREE.PerspectiveCamera(40, aspect, 0.1, 100);
        camera.position.set(11, 7.2, 13.5);
        camera.lookAt(0.8, 1.9, 0);

        // Renderer
        renderer = new THREE.WebGLRenderer({
            canvas: canvasEl,
            antialias: true,
            alpha: false,
            powerPreference: 'high-performance'
        });
        renderer.setSize(wrapEl.clientWidth, wrapEl.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.2;

        // Controls - orbit with mouse (optional)
        const OrbitControlsCtor = (window.THREE && window.THREE.OrbitControls) || window.OrbitControls;
        if (OrbitControlsCtor) {
            controls = new OrbitControlsCtor(camera, renderer.domElement);
            controls.enableDamping = false;
            controls.enablePan = false;
            controls.minDistance = 8;
            controls.maxDistance = 26;
            controls.minPolarAngle = 0.3;
            controls.maxPolarAngle = Math.PI / 2.1;
            controls.target.set(0.8, 1.9, 0);
            controls.update();

            // Hide hint after first interaction
            controls.addEventListener('start', () => {
                if (hintEl) hintEl.style.opacity = '0';
            });
            controls.addEventListener('change', queueRender);
        } else {
            controls = null;
            if (hintEl) {
                hintEl.innerHTML = '<i class="fas fa-cube"></i> Previzualizare 3D activa';
                hintEl.style.opacity = '1';
            }
        }

        // Lighting
        setupLighting();

        // Build house
        buildProceduralHouse();

        // Ground
        buildGround();

        setupSceneVisibilityObserver();
        queueRender();
    }

    // ========== LIGHTING ==========
    function setupLighting() {
        // Ambient
        const ambient = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambient);

        // Main directional (sun)
        const sun = new THREE.DirectionalLight(0xffffff, 0.9);
        sun.position.set(5, 8, 4);
        sun.castShadow = true;
        sun.shadow.mapSize.width = 1024;
        sun.shadow.mapSize.height = 1024;
        sun.shadow.camera.near = 0.5;
        sun.shadow.camera.far = 25;
        sun.shadow.camera.left = -8;
        sun.shadow.camera.right = 8;
        sun.shadow.camera.top = 8;
        sun.shadow.camera.bottom = -8;
        sun.shadow.bias = -0.001;
        scene.add(sun);

        // Fill light (softer, from opposite side)
        const fill = new THREE.DirectionalLight(0x8ecae6, 0.3);
        fill.position.set(-3, 4, -2);
        scene.add(fill);

        // Hemisphere sky light
        const hemi = new THREE.HemisphereLight(0x87CEEB, 0x98B06F, 0.3);
        scene.add(hemi);
    }

    // ========== PROCEDURAL HOUSE ==========
    function buildProceduralHouse() {
        if (houseGroup) {
            scene.remove(houseGroup);
        }

        roofMeshes = [];
        houseGroup = new THREE.Group();
        const mainCenterX = -0.9;
        const mainWidth = 8.4;
        const mainHeight = 3.35;
        const mainDepth = 4.8;
        const annexCenterX = 5.05;
        const annexWidth = 3.5;
        const annexHeight = 2.95;
        const annexDepth = 4.3;
        const frontZ = (mainDepth / 2) + 0.03;

        // --- Materials ---
        const wallMat = new THREE.MeshStandardMaterial({
            color: 0xF5E6D3,
            roughness: 0.85,
            metalness: 0.0
        });

        const roofMat = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color(currentColor),
            roughness: 0.55,
            metalness: 0.25
        });
        applyRoofFinish(roofMat, currentMaterialType, currentColor);

        const woodMat = new THREE.MeshStandardMaterial({
            color: 0x6B3A1A,
            roughness: 0.9,
            metalness: 0.0
        });

        const glassMat = new THREE.MeshStandardMaterial({
            color: 0x87CEEB,
            roughness: 0.1,
            metalness: 0.1,
            transparent: true,
            opacity: 0.5
        });

        const foundationMat = new THREE.MeshStandardMaterial({
            color: 0x888888,
            roughness: 0.9,
            metalness: 0.0
        });

        const chimneyMat = new THREE.MeshStandardMaterial({
            color: 0x9E7B65,
            roughness: 0.85,
            metalness: 0.0
        });

        const trimMat = new THREE.MeshStandardMaterial({
            color: 0xEFE7DC,
            roughness: 0.72,
            metalness: 0.02
        });

        const accentMat = new THREE.MeshStandardMaterial({
            color: 0x2E313E,
            roughness: 0.74,
            metalness: 0.08
        });

        // --- Walls (main body) ---
        const wallsGeo = new THREE.BoxGeometry(mainWidth, mainHeight, mainDepth);
        const walls = new THREE.Mesh(wallsGeo, wallMat);
        walls.position.set(mainCenterX, mainHeight / 2, 0);
        walls.castShadow = true;
        walls.receiveShadow = true;
        houseGroup.add(walls);

        const annexGeo = new THREE.BoxGeometry(annexWidth, annexHeight, annexDepth);
        const annex = new THREE.Mesh(annexGeo, wallMat);
        annex.position.set(annexCenterX, annexHeight / 2, 0.1);
        annex.castShadow = true;
        annex.receiveShadow = true;
        houseGroup.add(annex);

        // --- Foundation ---
        const foundGeo = new THREE.BoxGeometry(mainWidth + 0.32, 0.28, mainDepth + 0.34);
        const foundation = new THREE.Mesh(foundGeo, foundationMat);
        foundation.position.set(mainCenterX, 0.14, 0);
        foundation.receiveShadow = true;
        houseGroup.add(foundation);

        const annexFoundation = new THREE.Mesh(
            new THREE.BoxGeometry(annexWidth + 0.28, 0.26, annexDepth + 0.28),
            foundationMat
        );
        annexFoundation.position.set(annexCenterX, 0.13, 0.1);
        annexFoundation.receiveShadow = true;
        houseGroup.add(annexFoundation);

        const annexRoof = new THREE.Mesh(
            new THREE.BoxGeometry(annexWidth + 0.3, 0.18, annexDepth + 0.32),
            accentMat
        );
        annexRoof.position.set(annexCenterX, annexHeight + 0.09, 0.1);
        annexRoof.castShadow = true;
        houseGroup.add(annexRoof);

        if (currentHouseType === 'hip') {
            addHipRoof(houseGroup, roofMat, mainCenterX, mainWidth, mainDepth, mainHeight);
        } else {
            addGableRoof(houseGroup, roofMat, mainCenterX, mainWidth, mainDepth, mainHeight);
        }

        // --- Chimney ---
        const chimGeo = new THREE.BoxGeometry(0.6, 1.8, 0.6);
        const chimney = new THREE.Mesh(chimGeo, chimneyMat);
        chimney.position.set(mainCenterX + 2.15, currentHouseType === 'hip' ? 4.8 : 5.22, -0.95);
        chimney.castShadow = true;
        houseGroup.add(chimney);

        const chimTopGeo = new THREE.BoxGeometry(0.8, 0.15, 0.8);
        const chimTop = new THREE.Mesh(chimTopGeo, new THREE.MeshStandardMaterial({ color: 0x7A5C48 }));
        chimTop.position.set(mainCenterX + 2.15, currentHouseType === 'hip' ? 5.72 : 6.07, -0.95);
        houseGroup.add(chimTop);

        // --- Door ---
        const doorGeo = new THREE.BoxGeometry(1.12, 2.15, 0.08);
        const door = new THREE.Mesh(doorGeo, woodMat);
        door.position.set(mainCenterX - 1.25, 1.08, frontZ);
        houseGroup.add(door);

        // Door frame
        const frameMat = new THREE.MeshStandardMaterial({ color: 0x4A2410 });
        const doorFrameTop = new THREE.Mesh(new THREE.BoxGeometry(1.34, 0.12, 0.14), frameMat);
        doorFrameTop.position.set(mainCenterX - 1.25, 2.17, frontZ + 0.01);
        houseGroup.add(doorFrameTop);

        const doorFrameLeft = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.26, 0.12), frameMat);
        doorFrameLeft.position.set(mainCenterX - 1.86, 1.08, frontZ + 0.01);
        houseGroup.add(doorFrameLeft);

        const doorFrameRight = doorFrameLeft.clone();
        doorFrameRight.position.set(mainCenterX - 0.64, 1.08, frontZ + 0.01);
        houseGroup.add(doorFrameRight);

        // Door knob
        const knobGeo = new THREE.SphereGeometry(0.05, 8, 8);
        const knob = new THREE.Mesh(knobGeo, new THREE.MeshStandardMaterial({
            color: 0xD4AA70,
            metalness: 0.8,
            roughness: 0.2
        }));
        knob.position.set(mainCenterX - 0.9, 1.06, frontZ + 0.05);
        houseGroup.add(knob);

        addModernEntrance(houseGroup, trimMat, accentMat, mainCenterX - 1.25, frontZ);

        addGarageDoor(houseGroup, accentMat, trimMat, annexCenterX, (annexDepth / 2) + 0.13, annexHeight);

        // --- Windows (front) ---
        createWideWindow(houseGroup, glassMat, trimMat, mainCenterX - 3.1, 1.95, frontZ, 1.9, 1.25);
        createWideWindow(houseGroup, glassMat, trimMat, mainCenterX + 1.85, 1.95, frontZ, 1.75, 1.2);
        createWideWindow(houseGroup, glassMat, trimMat, annexCenterX, 1.85, (annexDepth / 2) + 0.12, 1.2, 1.05);

        // --- Windows (sides) ---
        createWideWindow(houseGroup, glassMat, trimMat, mainCenterX - (mainWidth / 2) - 0.04, 1.95, -1.15, 1.45, 1.05, Math.PI / 2);
        createWideWindow(houseGroup, glassMat, trimMat, mainCenterX - (mainWidth / 2) - 0.04, 1.95, 1.15, 1.45, 1.05, Math.PI / 2);
        createWideWindow(houseGroup, glassMat, trimMat, annexCenterX + (annexWidth / 2) + 0.04, 1.8, 0.15, 1.15, 1, Math.PI / 2);

        // --- Window on back ---
        createWideWindow(houseGroup, glassMat, trimMat, mainCenterX - 2.8, 1.9, -(mainDepth / 2) - 0.03, 1.75, 1.18);
        createWideWindow(houseGroup, glassMat, trimMat, mainCenterX + 0.2, 1.9, -(mainDepth / 2) - 0.03, 1.75, 1.18);
        createWideWindow(houseGroup, glassMat, trimMat, annexCenterX, 1.75, -(annexDepth / 2) - 0.03, 1.25, 1.02);

        scene.add(houseGroup);
        queueRender();
    }

    function addGableRoof(parent, roofMat, centerX, width, depth, wallHeight) {
        const roofShape = new THREE.Shape();
        const overhang = 0.52;
        const halfWidth = (width / 2) + overhang;
        const roofHeight = 2.5;
        roofShape.moveTo(-halfWidth, 0);
        roofShape.lineTo(0, roofHeight);
        roofShape.lineTo(halfWidth, 0);
        roofShape.lineTo(-halfWidth, 0);

        const roofGeo = new THREE.ExtrudeGeometry(roofShape, {
            depth: depth + 0.62,
            bevelEnabled: false
        });

        const roof = new THREE.Mesh(roofGeo, roofMat);
        roof.position.set(centerX, wallHeight, -((depth + 0.62) / 2));
        roof.castShadow = true;
        roof.receiveShadow = true;
        roofMeshes.push(roof);
        parent.add(roof);

        const ridgeGeo = new THREE.BoxGeometry(0.14, 0.14, depth + 0.82);
        const ridge = new THREE.Mesh(ridgeGeo, new THREE.MeshStandardMaterial({
            color: 0x5A2E14,
            roughness: 0.7,
            metalness: 0.1
        }));
        ridge.position.set(centerX, wallHeight + roofHeight, 0);
        parent.add(ridge);
    }

    function addHipRoof(parent, roofMat, centerX, width, depth, wallHeight) {
        const overhang = 0.42;
        const halfWidth = (width / 2) + overhang;
        const halfDepth = (depth / 2) + overhang;
        const roofHeight = 2.02;
        const ridgeHalf = Math.max(width * 0.18, 0.95);
        const roofGeo = new THREE.BufferGeometry();
        const positions = new Float32Array([
            -halfWidth, 0, halfDepth,
            halfWidth, 0, halfDepth,
            halfWidth, 0, -halfDepth,
            -halfWidth, 0, -halfDepth,
            -ridgeHalf, roofHeight, 0,
            ridgeHalf, roofHeight, 0
        ]);
        const uvs = new Float32Array([
            0, 1,
            1, 1,
            1, 0,
            0, 0,
            0.28, 0.5,
            0.72, 0.5
        ]);

        roofGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        roofGeo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
        roofGeo.setIndex([
            0, 1, 5,
            0, 5, 4,
            3, 5, 2,
            3, 4, 5,
            0, 4, 3,
            1, 2, 5
        ]);
        roofGeo.computeVertexNormals();

        const roof = new THREE.Mesh(roofGeo, roofMat.clone());
        applyRoofFinish(roof.material, currentMaterialType, currentColor);
        roof.position.set(centerX, wallHeight, 0);
        roof.castShadow = true;
        roof.receiveShadow = true;
        roofMeshes.push(roof);
        parent.add(roof);

        const ridge = new THREE.Mesh(
            new THREE.BoxGeometry((ridgeHalf * 2) + 0.28, 0.12, 0.16),
            new THREE.MeshStandardMaterial({
                color: 0x5A2E14,
                roughness: 0.72,
                metalness: 0.08
            })
        );
        ridge.position.set(centerX, wallHeight + roofHeight, 0);
        parent.add(ridge);
    }

    function addModernEntrance(parent, trimMat, accentMat, centerX, frontZ) {
        const canopy = new THREE.Mesh(
            new THREE.BoxGeometry(2.5, 0.14, 1.35),
            accentMat
        );
        canopy.position.set(centerX, 2.62, frontZ + 0.55);
        canopy.castShadow = true;
        parent.add(canopy);

        const postLeft = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.05, 0.12), trimMat);
        postLeft.position.set(centerX - 1, 1.04, frontZ + 0.52);
        parent.add(postLeft);

        const postRight = postLeft.clone();
        postRight.position.set(centerX + 1, 1.04, frontZ + 0.52);
        parent.add(postRight);

        const steps = new THREE.Mesh(
            new THREE.BoxGeometry(2.6, 0.16, 1.7),
            new THREE.MeshStandardMaterial({ color: 0xC9B59C, roughness: 0.92, metalness: 0 })
        );
        steps.position.set(centerX, 0.1, frontZ + 0.68);
        steps.receiveShadow = true;
        parent.add(steps);
    }

    function addGarageDoor(parent, accentMat, trimMat, centerX, frontZ, wallHeight) {
        const garageFrame = new THREE.Mesh(
            new THREE.BoxGeometry(2.4, 2.05, 0.08),
            trimMat
        );
        garageFrame.position.set(centerX, 1.08, frontZ);
        parent.add(garageFrame);

        const garageDoor = new THREE.Mesh(
            new THREE.BoxGeometry(2.16, 1.86, 0.1),
            accentMat
        );
        garageDoor.position.set(centerX, 1.02, frontZ + 0.02);
        parent.add(garageDoor);

        for (let i = -3; i <= 3; i += 1) {
            const slat = new THREE.Mesh(
                new THREE.BoxGeometry(2, 0.03, 0.04),
                new THREE.MeshStandardMaterial({ color: 0x4A4F63, roughness: 0.55, metalness: 0.18 })
            );
            slat.position.set(centerX, 0.78 + i * 0.22, frontZ + 0.08);
            parent.add(slat);
        }

        const clerestory = new THREE.Mesh(
            new THREE.BoxGeometry(2.28, 0.28, 0.08),
            trimMat
        );
        clerestory.position.set(centerX, wallHeight - 0.42, frontZ + 0.02);
        parent.add(clerestory);
    }

    function createWideWindow(parent, glassMat, frameMat, x, y, z, width, height, rotY) {
        const frameGroup = new THREE.Group();
        const glass = new THREE.Mesh(new THREE.PlaneGeometry(width, height), glassMat);
        glass.position.set(0, 0, 0.01);
        frameGroup.add(glass);

        const topBar = new THREE.Mesh(new THREE.BoxGeometry(width + 0.16, 0.06, 0.05), frameMat);
        topBar.position.set(0, (height / 2) + 0.05, 0);
        frameGroup.add(topBar);

        const bottomBar = topBar.clone();
        bottomBar.position.set(0, -(height / 2) - 0.05, 0);
        frameGroup.add(bottomBar);

        const sideBar = new THREE.Mesh(new THREE.BoxGeometry(0.06, height + 0.16, 0.05), frameMat);
        sideBar.position.set(-(width / 2) - 0.05, 0, 0);
        frameGroup.add(sideBar);

        const sideBarRight = sideBar.clone();
        sideBarRight.position.set((width / 2) + 0.05, 0, 0);
        frameGroup.add(sideBarRight);

        const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.04, height + 0.04, 0.04), frameMat);
        frameGroup.add(mullion);

        if (width > 1.45) {
            const mullionLeft = mullion.clone();
            mullionLeft.position.x = -width * 0.22;
            frameGroup.add(mullionLeft);

            const mullionRight = mullion.clone();
            mullionRight.position.x = width * 0.22;
            frameGroup.add(mullionRight);
        }

        frameGroup.position.set(x, y, z);
        frameGroup.rotation.y = rotY || 0;
        parent.add(frameGroup);
    }

    // Helper: create a window on front/back wall
    function createWindow(parent, glassMat, frameMat, x, y, z) {
        const frameGroup = new THREE.Group();

        // Glass pane
        const glassGeo = new THREE.PlaneGeometry(0.7, 0.7);
        const glass = new THREE.Mesh(glassGeo, glassMat);
        glass.position.set(0, 0, 0.01);
        frameGroup.add(glass);

        // Frame (4 sides)
        const matFrame = new THREE.MeshStandardMaterial({ color: 0xD4C4B0, roughness: 0.8 });
        const barH = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.06, 0.06), matFrame);
        const barH2 = barH.clone();
        barH.position.set(0, 0.38, 0);
        barH2.position.set(0, -0.38, 0);
        frameGroup.add(barH, barH2);

        const barV = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.85, 0.06), matFrame);
        const barV2 = barV.clone();
        barV.position.set(-0.38, 0, 0);
        barV2.position.set(0.38, 0, 0);
        frameGroup.add(barV, barV2);

        // Cross bars
        const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.03, 0.04), matFrame);
        frameGroup.add(crossH);
        const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.76, 0.04), matFrame);
        frameGroup.add(crossV);

        // Sill
        const sill = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.06, 0.12), matFrame);
        sill.position.set(0, -0.41, 0.03);
        frameGroup.add(sill);

        frameGroup.position.set(x, y, z);
        parent.add(frameGroup);
    }

    // Helper: create a window on side wall
    function createWindowSide(parent, glassMat, frameMat, x, y, z, rotY) {
        const frameGroup = new THREE.Group();

        const glassGeo = new THREE.PlaneGeometry(0.6, 0.6);
        const glass = new THREE.Mesh(glassGeo, glassMat);
        frameGroup.add(glass);

        const matFrame = new THREE.MeshStandardMaterial({ color: 0xD4C4B0, roughness: 0.8 });
        const barH = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.05, 0.05), matFrame);
        const barH2 = barH.clone();
        barH.position.y = 0.33;
        barH2.position.y = -0.33;
        frameGroup.add(barH, barH2);

        const barV = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.7, 0.05), matFrame);
        const barV2 = barV.clone();
        barV.position.x = -0.33;
        barV2.position.x = 0.33;
        frameGroup.add(barV, barV2);

        frameGroup.position.set(x, y, z);
        frameGroup.rotation.y = rotY;
        parent.add(frameGroup);
    }

    // ========== GROUND ==========
    function buildGround() {
        // Grass plane
        const groundGeo = new THREE.PlaneGeometry(30, 30);
        const groundMat = new THREE.MeshStandardMaterial({
            color: 0x7BAF4C,
            roughness: 0.95,
            metalness: 0.0
        });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = 0;
        ground.receiveShadow = true;
        scene.add(ground);

        // Path to door
        const pathGeo = new THREE.PlaneGeometry(1.2, 3);
        const pathMat = new THREE.MeshStandardMaterial({
            color: 0xC4B5A0,
            roughness: 0.9
        });
        const path = new THREE.Mesh(pathGeo, pathMat);
        path.rotation.x = -Math.PI / 2;
        path.position.set(0, 0.01, 3.5);
        path.receiveShadow = true;
        scene.add(path);
    }

    // ========== CHANGE ROOF COLOR ==========
    function setRoofColor(hexColor, materialType) {
        if (useFallbackRenderer) {
            currentColor = hexColor;
            currentMaterialType = materialType;
            drawFallbackHouse();
            return;
        }

        const color = new THREE.Color(hexColor);
        roofMeshes.forEach(mesh => {
            applyRoofFinish(mesh.material, materialType, hexColor);
            mesh.material.color.copy(color);
        });
        queueRender();
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

    // ========== COST CALCULATOR ==========
    function updateCost() {
        const area = parseFloat(areaInput.value) || 0;
        const materialPrice = Math.round(currentPrice * currentQuality);
        const pMat = area * materialPrice;
        const pMan = area * currentManopera;
        const total = pMat + pMan;
        const fmt = (n) => n.toLocaleString(locale);

        const el = (id) => document.getElementById(id);
        if (el('cHouseType')) el('cHouseType').textContent = currentHouseLabel;
        if (el('cMaterial')) el('cMaterial').textContent = currentName;
        if (el('cQuality')) el('cQuality').textContent = currentQualityLabel;
        if (el('cArea')) el('cArea').textContent = fmt(area) + ' m\u00B2';
        if (el('cPriceMat')) el('cPriceMat').textContent = fmt(pMat) + ' lei';
        if (el('cManopera')) el('cManopera').textContent = fmt(pMan) + ' lei';
        if (el('cTotal')) {
            el('cTotal').textContent = fmt(total) + ' lei';
            el('cTotal').style.transform = 'scale(1.05)';
            setTimeout(() => { el('cTotal').style.transform = 'scale(1)'; }, 200);
        }
    }

    // ========== RESIZE HANDLER ==========
    function onResize() {
        if (useFallbackRenderer) {
            drawFallbackHouse();
            return;
        }

        if (!wrapEl || !camera || !renderer) return;
        const w = wrapEl.clientWidth;
        const h = wrapEl.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        queueRender();
    }

    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            queueRender();
        }
    });

    // ========== UI EVENTS ==========

    houseTypeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            houseTypeBtns.forEach(item => item.classList.remove('cfg__house-type-btn--active'));
            btn.classList.add('cfg__house-type-btn--active');

            currentHouseType = btn.dataset.houseType || 'gable';
            currentHouseLabel = btn.dataset.houseLabel || '2 pante';
            if (useFallbackRenderer) {
                drawFallbackHouse();
            } else {
                buildProceduralHouse();
            }
            setRoofColor(currentColor, currentMaterialType);
            triggerConfiguratorFeedback();
            updateCost();
        });
    });

    // Color buttons
    colorBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active state
            colorBtns.forEach(b => b.classList.remove('cfg__color-btn--active'));
            btn.classList.add('cfg__color-btn--active');

            // Update roof
            currentColor = btn.dataset.hex;
            currentMaterialType = btn.dataset.materialType || 'metal-classic';
            currentPrice = parseInt(btn.dataset.price, 10);
            currentManopera = parseInt(btn.dataset.manopera, 10);
            currentName = btn.querySelector('strong').textContent;

            setRoofColor(currentColor, currentMaterialType);
            triggerConfiguratorFeedback();
            updateCost();
        });
    });

    // Area input + slider sync
    if (areaInput && areaSlider) {
        areaInput.addEventListener('input', () => {
            let v = parseInt(areaInput.value) || 10;
            if (v > 2000) { v = 2000; areaInput.value = 2000; }
            areaSlider.value = Math.min(v, 500);
            updateCost();
        });
        areaSlider.addEventListener('input', () => {
            areaInput.value = areaSlider.value;
            updateCost();
        });
    }

    if (qualitySelect) {
        qualitySelect.addEventListener('change', () => {
            currentQuality = parseFloat(qualitySelect.value) || 1;
            currentQualityLabel = qualitySelect.options[qualitySelect.selectedIndex].dataset.label || 'Standard';
            triggerConfiguratorFeedback();
            updateCost();
        });
    }

    // ========== BOOT ==========
    ensureThreeDependencies()
        .then(() => {
            initScene();
        })
        .catch((error) => {
            console.warn('Configurator fallback activated:', error);
            initFallbackScene();
        });

    if (qualitySelect) {
        currentQuality = parseFloat(qualitySelect.value) || 1;
        currentQualityLabel = qualitySelect.options[qualitySelect.selectedIndex].dataset.label || 'Standard';
    }
    updateCost();

    // Expose state for the modal (in main.js)
    window.__cfgState = function () {
        return {
            houseType: currentHouseType,
            houseLabel: currentHouseLabel,
            name: currentName,
            materialType: currentMaterialType,
            price: currentPrice,
            quality: currentQuality,
            qualityLabel: currentQualityLabel,
            manopera: currentManopera,
            area: parseInt(areaInput.value) || 0
        };
    };

})();
