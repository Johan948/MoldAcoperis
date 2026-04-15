const viewer = document.querySelector("#viewer");
const houseSvg = document.querySelector("#houseSvg");
const secondaryWingGroup = document.querySelector("#secondaryWingGroup");
const thirdWingGroup = document.querySelector("#thirdWingGroup");
const bodyBCompoundSettings = document.querySelector("#bodyBCompoundSettings");

const controlsMap = {
  houseType: document.querySelector("#houseType"),
  widthA: document.querySelector("#widthA"),
  depthA: document.querySelector("#depthA"),
  widthB: document.querySelector("#widthB"),
  depthB: document.querySelector("#depthB"),
  widthC: document.querySelector("#widthC"),
  depthC: document.querySelector("#depthC"),
  bodyBEnabled: document.querySelector("#bodyBEnabled"),
  bodyBSide: document.querySelector("#bodyBSide"),
  bodyBAlign: document.querySelector("#bodyBAlign"),
  bodyCEnabled: document.querySelector("#bodyCEnabled"),
  bodyCSide: document.querySelector("#bodyCSide"),
  bodyCAlign: document.querySelector("#bodyCAlign"),
  wallHeight: document.querySelector("#wallHeight"),
  roofHeight: document.querySelector("#roofHeight"),
  eave: document.querySelector("#eave"),
  roofQuality: document.querySelector("#roofQuality"),
  roofMaterial: document.querySelector("#roofMaterial"),
  drainageEnabled: document.querySelector("#drainageEnabled"),
  lucarneCount: document.querySelector("#lucarneCount"),
  wallColor: document.querySelector("#wallColor"),
  roofColor: document.querySelector("#roofColor"),
  baseColor: document.querySelector("#baseColor"),
};

const outputs = {
  houseType: document.querySelector("#houseTypeValue"),
  widthA: document.querySelector("#widthAValue"),
  depthA: document.querySelector("#depthAValue"),
  widthB: document.querySelector("#widthBValue"),
  depthB: document.querySelector("#depthBValue"),
  widthC: document.querySelector("#widthCValue"),
  depthC: document.querySelector("#depthCValue"),
  wallHeight: document.querySelector("#wallHeightValue"),
  roofHeight: document.querySelector("#roofHeightValue"),
  eave: document.querySelector("#eaveValue"),
  roofMaterial: document.querySelector("#roofMaterialValue"),
  roofQuality: document.querySelector("#roofQualityValue"),
  roofProduct: document.querySelector("#roofProductValue"),
  footprint: document.querySelector("#footprintValue"),
  volume: document.querySelector("#volumeValue"),
  roofArea: document.querySelector("#roofAreaValue"),
  estimateTotal: document.querySelector("#estimateTotalValue"),
  estimateProduct: document.querySelector("#estimateProductValue"),
  estimateMaterialRate: document.querySelector("#estimateMaterialRateValue"),
  estimateMaterialCost: document.querySelector("#estimateMaterialCostValue"),
  estimateRidgeLength: document.querySelector("#estimateRidgeLengthValue"),
  estimateRidgeCost: document.querySelector("#estimateRidgeCostValue"),
  estimateEaveLength: document.querySelector("#estimateEaveLengthValue"),
  estimateEaveArea: document.querySelector("#estimateEaveAreaValue"),
  estimateEaveCost: document.querySelector("#estimateEaveCostValue"),
  estimateAccessoriesCost: document.querySelector("#estimateAccessoriesCostValue"),
  estimateDiscount: document.querySelector("#estimateDiscountValue"),
  estimateLineItems: document.querySelector("#estimateLineItems"),
  drainageCard: document.querySelector("#drainageCard"),
  drainageNote: document.querySelector("#drainageNote"),
  drainageTotal: document.querySelector("#drainageTotalValue"),
  drainageGutterLength: document.querySelector("#drainageGutterLengthValue"),
  drainageDownspouts: document.querySelector("#drainageDownspoutsValue"),
  drainageExteriorCorners: document.querySelector("#drainageExteriorCornersValue"),
  drainageInteriorCorners: document.querySelector("#drainageInteriorCornersValue"),
  drainageDiscount: document.querySelector("#drainageDiscountValue"),
  drainageGrandTotal: document.querySelector("#drainageGrandTotalValue"),
  drainageLineItems: document.querySelector("#drainageLineItems"),
};

const SVG_NS = "http://www.w3.org/2000/svg";
const LIGHT = normalize({ x: -0.55, y: 0.9, z: 0.35 });
const ROOF_QUALITIES = ["Standart", "Premium", "VIP"];
const ROOF_PRODUCTS = {
  eterna: {
    label: "Eterna",
    quality: "Standart",
    price: 171,
    discount: 0,
    material: "modular-tile",
  },
  katepal: {
    label: "Katepal",
    quality: "Standart",
    price: 330,
    discount: 0.25,
    material: "bitumen",
  },
  seah: {
    label: "Seah",
    quality: "Standart",
    price: 159,
    discount: 0.05,
    material: "metal-tile",
  },
  regalis: {
    label: "Regalis",
    quality: "Premium",
    price: 192,
    discount: 0,
    material: "modular-tile",
  },
  "cambridge-xpress": {
    label: "Cambridge Xpress",
    quality: "Premium",
    price: 345,
    discount: 0.25,
    material: "bitumen",
  },
  "arcelor-mittal": {
    label: "Arcelor Mittal",
    quality: "Premium",
    price: 229,
    discount: 0.05,
    material: "metal-tile",
  },
  enigma: {
    label: "Enigma",
    quality: "VIP",
    price: 289,
    discount: 0,
    material: "modular-tile",
  },
  "cambridge-xtreme": {
    label: "Cambridge Xtreme",
    quality: "VIP",
    price: 375,
    discount: 0.25,
    material: "bitumen",
  },
  voestalpine: {
    label: "Voestalpine",
    quality: "VIP",
    price: 250,
    discount: 0.05,
    material: "metal-tile",
  },
};
const PRODUCT_BY_QUALITY_AND_MATERIAL = {
  Standart: {
    bitumen: "katepal",
    "metal-tile": "seah",
    "modular-tile": "eterna",
  },
  Premium: {
    bitumen: "cambridge-xpress",
    "metal-tile": "arcelor-mittal",
    "modular-tile": "regalis",
  },
  VIP: {
    bitumen: "cambridge-xtreme",
    "metal-tile": "voestalpine",
    "modular-tile": "enigma",
  },
};
const QUALITY_PRICING = {
  Standart: {
    ridgePrice: 149,
    ridgeDiscount: 0.1,
    eavePrice: 171,
    eaveDiscount: 0.1,
  },
  Premium: {
    ridgePrice: 169,
    ridgeDiscount: 0.1,
    eavePrice: 199,
    eaveDiscount: 0.1,
  },
  VIP: {
    ridgePrice: 189,
    ridgeDiscount: 0.1,
    eavePrice: 279,
    eaveDiscount: 0.1,
  },
};
const EAVE_BAND = {
  effectiveWidth: 1.17,
  totalWidth: 1.21,
};
const BITUMEN_FACTORS = {
  shinglesCoverage: 1.025,
  waterproofLayer: 1.1,
  antiCondensationFilm: 1.1,
  osbSheetArea: 3.125,
  extraOsbSheets: 2,
};
const METAL_FACTORS = {
  membraneCoverage: 1.1,
  screwsPerSquareMeter: 8,
  frontonAllowance: 2,
  gutterAllowance: 2,
};
const MODULAR_FACTORS = {
  diffusionMembrane: 1.1,
  screws35PerSquareMeter: 8,
  ridgeTapeRollLength: 5,
};
const METAL_ACCESSORY_PRICING = {
  gutterTrim: 124,
  exteriorWallTrim: 177,
  exteriorValley: 177,
  interiorValley: 175,
  diffusionMembrane: 19.5,
  screws: 1.15,
};
const ACCESSORY_DISCOUNT = 0.1;
const DRAINAGE_RULES = {
  gutterPieceLength: 3,
  downpipePieceLength: 3,
  extensionPieceLength: 1,
  hookSpacing: 0.85,
  clampSpacing: 1.5,
  maxGutterPerDownspout: 12,
  downpipeOffset: 0.4,
  independentRunsByHouseType: {
    "rect-gable": 2,
    "rect-hip": 2,
    "l-shape": 3,
    "t-shape": 3,
    compound: 3,
  },
  minDownspoutsByHouseType: {
    "rect-gable": 2,
    "rect-hip": 2,
    "l-shape": 3,
    "t-shape": 3,
    compound: 3,
  },
};
const DRAINAGE_PRODUCTS = {
  gutter: {
    code: "JG",
    label: "Jgheab L3m",
    unit: "buc",
    unitPrice: 360,
    discount: 0.25,
  },
  gutterHook: {
    code: "CI",
    label: "Cirlig jgheab",
    unit: "buc",
    unitPrice: 84,
    discount: 0.25,
  },
  gutterConnector: {
    code: "BJ",
    label: "Bratara / conector jgheab",
    unit: "buc",
    unitPrice: 84,
    discount: 0.25,
  },
  endCap: {
    code: "CU",
    label: "Capac universal",
    unit: "buc",
    unitPrice: 74,
    discount: 0.25,
  },
  exteriorCorner: {
    code: "KE",
    label: "Koltar exterior 90",
    unit: "buc",
    unitPrice: 397.5,
    discount: 0.25,
  },
  interiorCorner: {
    code: "KI",
    label: "Koltar interior 90",
    unit: "buc",
    unitPrice: 397.5,
    discount: 0.25,
  },
  gutterOutlet: {
    code: "RA",
    label: "Racord jgheab",
    unit: "buc",
    unitPrice: 187,
    discount: 0.25,
  },
  downpipeElbow: {
    code: "CB",
    label: "Cot burlan",
    unit: "buc",
    unitPrice: 184,
    discount: 0.25,
  },
  downpipeExtension: {
    code: "PB",
    label: "Prelungitor burlan L1m",
    unit: "buc",
    unitPrice: 139,
    discount: 0.25,
  },
  downpipe: {
    code: "BU",
    label: "Burlan L3m",
    unit: "buc",
    unitPrice: 406,
    discount: 0.25,
  },
  downpipeClamp: {
    code: "BB",
    label: "Bratara burlan",
    unit: "buc",
    unitPrice: 79,
    discount: 0.25,
  },
  dischargeElbow: {
    code: "CE",
    label: "Cot evacuare",
    unit: "buc",
    unitPrice: 187,
    discount: 0.25,
  },
};

const state = {
  yaw: -34,
  pitch: 32,
  scale: 1,
  drag: false,
  lastX: 0,
  lastY: 0,
  activePointers: new Map(),
  pinchDistance: 0,
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getPointerDistance(points) {
  if (points.length < 2) {
    return 0;
  }

  const [first, second] = points;
  return Math.hypot(second.x - first.x, second.y - first.y);
}

function isRectHouseType(houseType) {
  return houseType === "rect-hip" || houseType === "rect-gable";
}

function isCompoundHouseType(houseType) {
  return houseType === "compound";
}

function getHouseTypeLabel(houseType) {
  if (houseType === "rect-gable") {
    return "Casa dreptunghiulara 2 pante";
  }

  if (houseType === "rect-hip") {
    return "Casa dreptunghiulara 4 pante";
  }

  if (houseType === "t-shape") {
    return "Casa tip T";
  }

  if (houseType === "compound") {
    return "Casa compusa";
  }

  return "Casa tip L";
}

function syncFootprintControls() {
  const houseType = controlsMap.houseType.value;
  const isRect = isRectHouseType(houseType);
  const isCompound = isCompoundHouseType(houseType);
  const bodyBActive = !isRect && (!isCompound || controlsMap.bodyBEnabled.checked);
  const bodyCActive = isCompound && controlsMap.bodyCEnabled.checked;

  bodyBCompoundSettings.classList.toggle("is-hidden", !isCompound);
  thirdWingGroup.classList.toggle("is-hidden", !isCompound);

  controlsMap.bodyBEnabled.disabled = !isCompound;
  controlsMap.bodyBSide.disabled = !isCompound || !controlsMap.bodyBEnabled.checked;
  controlsMap.bodyBAlign.disabled = !isCompound || !controlsMap.bodyBEnabled.checked;
  controlsMap.widthB.disabled = !bodyBActive;
  controlsMap.depthB.disabled = !bodyBActive;

  controlsMap.bodyCEnabled.disabled = !isCompound;
  controlsMap.bodyCSide.disabled = !bodyCActive;
  controlsMap.bodyCAlign.disabled = !bodyCActive;
  controlsMap.widthC.disabled = !bodyCActive;
  controlsMap.depthC.disabled = !bodyCActive;
  controlsMap.lucarneCount.disabled = isCompound;

  secondaryWingGroup.classList.toggle("is-disabled", !bodyBActive);
  thirdWingGroup.classList.toggle("is-disabled", !bodyCActive);
}

function syncOutputs() {
  const roofProduct = getSelectedRoofProductMeta();
  outputs.houseType.textContent = getHouseTypeLabel(controlsMap.houseType.value);
  outputs.widthA.textContent = `${controlsMap.widthA.value} m`;
  outputs.depthA.textContent = `${controlsMap.depthA.value} m`;
  outputs.widthB.textContent = `${controlsMap.widthB.value} m`;
  outputs.depthB.textContent = `${controlsMap.depthB.value} m`;
  outputs.widthC.textContent = `${controlsMap.widthC.value} m`;
  outputs.depthC.textContent = `${controlsMap.depthC.value} m`;
  outputs.wallHeight.textContent = `${controlsMap.wallHeight.value} m`;
  outputs.roofHeight.textContent = `${controlsMap.roofHeight.value} m`;
  outputs.eave.textContent = `${controlsMap.eave.value} m`;
  outputs.roofMaterial.textContent = getRoofMaterialLabel(controlsMap.roofMaterial.value);
  outputs.roofQuality.textContent = controlsMap.roofQuality.value;
  outputs.roofProduct.textContent = roofProduct.label;
  syncFootprintControls();
}

function getRoofMaterialLabel(material) {
  if (material === "metal-tile") {
    return "Tigla modulara";
  }

  if (material === "modular-tile") {
    return "Tigla metalica";
  }

  return "Sindrila Bituminoasa";
}

function getRoofProductMeta(productId) {
  return ROOF_PRODUCTS[productId] || ROOF_PRODUCTS.katepal;
}

function getSelectedRoofProductId() {
  const qualityProducts = PRODUCT_BY_QUALITY_AND_MATERIAL[controlsMap.roofQuality.value]
    || PRODUCT_BY_QUALITY_AND_MATERIAL.Standart;

  return qualityProducts[controlsMap.roofMaterial.value]
    || qualityProducts.bitumen
    || "katepal";
}

function getSelectedRoofProductMeta() {
  return getRoofProductMeta(getSelectedRoofProductId());
}

function getSelectedQualityPricing() {
  return QUALITY_PRICING[controlsMap.roofQuality.value] || QUALITY_PRICING.Standart;
}

function formatCurrency(value, suffix = "lei") {
  return `${value.toLocaleString("ro-RO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${suffix}`;
}

function formatMeasure(value, unit) {
  return `${value.toLocaleString("ro-RO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${unit}`;
}

function formatQuantity(value, unit) {
  const integerUnits = ["buc", "foi", "mod"];
  const decimals = integerUnits.includes(unit) ? 0 : 2;

  return `${value.toLocaleString("ro-RO", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })} ${unit}`;
}

function roundEvenMeters(value) {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }

  const rounded = Math.ceil(value);
  return rounded % 2 === 0 ? rounded : rounded + 1;
}

function createEstimateLineItem({
  code = "",
  label,
  quantity,
  unit,
  unitPrice = null,
  discount = 0,
  note = "",
  category = "technical",
}) {
  const normalizedQuantity = Number.isFinite(quantity) ? quantity : 0;
  const isPriced = Number.isFinite(unitPrice);
  const totalBeforeDiscount = isPriced ? normalizedQuantity * unitPrice : 0;
  const totalAfterDiscount = isPriced ? totalBeforeDiscount * (1 - discount) : 0;

  return {
    code,
    label,
    quantity: normalizedQuantity,
    unit,
    unitPrice: isPriced ? unitPrice : null,
    discount: isPriced ? discount : 0,
    totalBeforeDiscount,
    totalAfterDiscount,
    discountValue: isPriced ? totalBeforeDiscount - totalAfterDiscount : 0,
    note,
    category,
    isPriced,
  };
}

function pushEstimateLineItem(items, item) {
  if (item.quantity > 0.0001) {
    items.push(item);
  }
}

function polygonSignedArea2D(points) {
  let area = 0;

  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    area += current.x * next.z - next.x * current.z;
  }

  return area / 2;
}

function countPolygonCorners(points) {
  if (!points || points.length < 3) {
    return { exterior: 0, interior: 0 };
  }

  const orientation = Math.sign(polygonSignedArea2D(points)) || 1;
  let exterior = 0;
  let interior = 0;

  for (let index = 0; index < points.length; index += 1) {
    const previous = points[(index - 1 + points.length) % points.length];
    const current = points[index];
    const next = points[(index + 1) % points.length];
    const vectorA = { x: current.x - previous.x, z: current.z - previous.z };
    const vectorB = { x: next.x - current.x, z: next.z - current.z };
    const crossProduct = vectorA.x * vectorB.z - vectorA.z * vectorB.x;

    if (Math.abs(crossProduct) < 1e-8) {
      continue;
    }

    const isExterior = orientation > 0 ? crossProduct > 0 : crossProduct < 0;

    if (isExterior) {
      exterior += 1;
    } else {
      interior += 1;
    }
  }

  return { exterior, interior };
}

function getPolygonCornerData(points) {
  if (!points || points.length < 3) {
    return [];
  }

  const orientation = Math.sign(polygonSignedArea2D(points)) || 1;

  return points.map((current, index) => {
    const previous = points[(index - 1 + points.length) % points.length];
    const next = points[(index + 1) % points.length];
    const vectorA = { x: current.x - previous.x, z: current.z - previous.z };
    const vectorB = { x: next.x - current.x, z: next.z - current.z };
    const crossProduct = vectorA.x * vectorB.z - vectorA.z * vectorB.x;
    const isExterior = Math.abs(crossProduct) >= 1e-8
      ? (orientation > 0 ? crossProduct > 0 : crossProduct < 0)
      : false;

    return {
      index,
      point: current,
      isExterior,
    };
  });
}

function uniquePoints(points) {
  const seen = new Set();

  return points.filter((point) => {
    const key = `${point.x.toFixed(3)}:${point.z.toFixed(3)}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function selectDistributedPoints(points, count) {
  if (!points.length || count <= 0) {
    return [];
  }

  if (count >= points.length) {
    return points.slice(0, count);
  }

  const result = [];
  const used = new Set();

  for (let index = 0; index < count; index += 1) {
    const rawIndex = Math.floor((index * points.length) / count);
    let candidateIndex = rawIndex;

    while (used.has(candidateIndex)) {
      candidateIndex = (candidateIndex + 1) % points.length;
    }

    used.add(candidateIndex);
    result.push(points[candidateIndex]);
  }

  return result;
}

function getDrainageIndependentRuns(houseType) {
  return DRAINAGE_RULES.independentRunsByHouseType[houseType] || 2;
}

function getDrainageMinimumDownspouts(houseType) {
  return DRAINAGE_RULES.minDownspoutsByHouseType[houseType] || 2;
}

function createDrainageLineItem(productKey, quantity, note = "") {
  const product = DRAINAGE_PRODUCTS[productKey];

  return createEstimateLineItem({
    code: product.code,
    label: product.label,
    quantity,
    unit: product.unit,
    unitPrice: product.unitPrice,
    discount: product.discount,
    note,
    category: "drainage",
  });
}

function calculateDrainageMetrics(params, roofMetrics) {
  if (!roofMetrics || typeof RoofCalculator === "undefined") {
    return null;
  }

  const geometry = RoofCalculator.buildRoofGeometry(params);
  const eaveSegments = roofMetrics.segments.filter((segment) => segment.type === "eave");
  const gutterLength = roofMetrics.totals.eaveLength;
  const independentRuns = getDrainageIndependentRuns(params.houseType);
  const minimumDownspouts = getDrainageMinimumDownspouts(params.houseType);
  const roofFootprint = geometry.shapeSpec.roofFootprint;
  const corners = params.houseType === "rect-gable"
    ? { exterior: 0, interior: 0 }
    : countPolygonCorners(roofFootprint);
  const anchorCandidates = params.houseType === "rect-gable"
    ? roofFootprint.map((point) => ({ x: point.x, z: point.z }))
    : getPolygonCornerData(roofFootprint)
      .filter((corner) => corner.isExterior)
      .map((corner) => ({ x: corner.point.x, z: corner.point.z }));
  const downspouts = Math.max(
    minimumDownspouts,
    Math.ceil(gutterLength / DRAINAGE_RULES.maxGutterPerDownspout),
  );
  const downspoutAnchors = selectDistributedPoints(anchorCandidates, downspouts)
    .map((point) => ({ x: point.x, z: point.z }));
  const gutterPieces = Math.ceil(gutterLength / DRAINAGE_RULES.gutterPieceLength);
  const gutterConnectors = Math.max(0, gutterPieces - independentRuns);
  const gutterHooks = Math.ceil(gutterLength / DRAINAGE_RULES.hookSpacing);
  const endCaps = independentRuns * 2;
  const gutterOutlets = downspouts;
  const downpipeElbows = downspouts * 2;
  const dischargeElbows = downspouts;
  const downpipeHeight = params.wallHeight + DRAINAGE_RULES.downpipeOffset;
  const downpipePiecesPerRun = Math.floor(downpipeHeight / DRAINAGE_RULES.downpipePieceLength);
  const remainderPerRun = Math.max(0, downpipeHeight - downpipePiecesPerRun * DRAINAGE_RULES.downpipePieceLength);
  const downpipePieces = downspouts * downpipePiecesPerRun;
  const downpipeExtensions = remainderPerRun > 0
    ? downspouts * Math.ceil(remainderPerRun / DRAINAGE_RULES.extensionPieceLength)
    : 0;
  const downpipeClamps = downspouts * Math.max(2, Math.ceil(downpipeHeight / DRAINAGE_RULES.clampSpacing));

  return {
    gutterLength,
    independentRuns,
    eaveSegments,
    exteriorCorners: corners.exterior,
    interiorCorners: corners.interior,
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
    downpipeClamps,
  };
}

function buildDrainageEstimate(params, roofMetrics, roofEstimate) {
  const metrics = calculateDrainageMetrics(params, roofMetrics);

  if (!metrics) {
    return null;
  }

  const items = [];

  pushEstimateLineItem(items, createDrainageLineItem(
    "gutter",
    metrics.gutterPieces,
    `calculat din ${formatMeasure(metrics.gutterLength, "ml")} / ${DRAINAGE_RULES.gutterPieceLength} m`,
  ));
  pushEstimateLineItem(items, createDrainageLineItem(
    "gutterHook",
    metrics.gutterHooks,
    `pas standard calibrat la ${DRAINAGE_RULES.hookSpacing.toFixed(2)} m`,
  ));
  pushEstimateLineItem(items, createDrainageLineItem(
    "gutterConnector",
    metrics.gutterConnectors,
    "estimare pentru imbinarile dintre tronsoanele de jgheab",
  ));
  pushEstimateLineItem(items, createDrainageLineItem(
    "endCap",
    metrics.endCaps,
    `cate 2 capace pentru fiecare din cele ${metrics.independentRuns} tronsoane`,
  ));
  pushEstimateLineItem(items, createDrainageLineItem(
    "exteriorCorner",
    metrics.exteriorCorners,
    "colturi exterioare deduse din conturul acoperisului",
  ));
  pushEstimateLineItem(items, createDrainageLineItem(
    "interiorCorner",
    metrics.interiorCorners,
    "colturi interioare deduse din conturul acoperisului",
  ));
  pushEstimateLineItem(items, createDrainageLineItem(
    "gutterOutlet",
    metrics.gutterOutlets,
    "un racord pentru fiecare burlan estimat",
  ));
  pushEstimateLineItem(items, createDrainageLineItem(
    "downpipeElbow",
    metrics.downpipeElbows,
    "doua coturi de legatura pentru fiecare burlan",
  ));
  pushEstimateLineItem(items, createDrainageLineItem(
    "downpipe",
    metrics.downpipePieces,
    `cate ${DRAINAGE_RULES.downpipePieceLength} m per bucata`,
  ));
  pushEstimateLineItem(items, createDrainageLineItem(
    "downpipeExtension",
    metrics.downpipeExtensions,
    `completare pentru inaltimea utila de ${formatMeasure(metrics.downpipeHeight, "m")} per burlan`,
  ));
  pushEstimateLineItem(items, createDrainageLineItem(
    "downpipeClamp",
    metrics.downpipeClamps,
    `fixare la perete din ${DRAINAGE_RULES.clampSpacing.toFixed(1)} in ${DRAINAGE_RULES.clampSpacing.toFixed(1)} m`,
  ));
  pushEstimateLineItem(items, createDrainageLineItem(
    "dischargeElbow",
    metrics.dischargeElbows,
    "cate un cot de evacuare pentru fiecare burlan estimat",
  ));

  const pricedItems = items.filter((item) => item.isPriced);
  const total = pricedItems.reduce((sum, item) => sum + item.totalAfterDiscount, 0);
  const discountTotal = pricedItems.reduce((sum, item) => sum + item.discountValue, 0);
  const grandTotal = total + (roofEstimate ? roofEstimate.costs.total : 0);
  const unpricedItems = items.filter((item) => !item.isPriced);

  return {
    metrics,
    items,
    costs: {
      total,
      discountTotal,
      grandTotal,
    },
    unpricedItems,
  };
}

function getMaterialArticleCode(product) {
  if (product.material === "modular-tile") {
    return "TM";
  }

  if (product.material === "metal-tile") {
    return "TT";
  }

  return "SB";
}

function buildEstimateItems(roofMetrics, product, qualityPricing) {
  const items = [];
  const totals = roofMetrics.totals;
  const materialQuantity = product.material === "bitumen"
    ? totals.roofArea * BITUMEN_FACTORS.shinglesCoverage
    : totals.roofArea;
  const eaveArea = totals.eaveLength * EAVE_BAND.totalWidth;

  pushEstimateLineItem(items, createEstimateLineItem({
    code: getMaterialArticleCode(product),
    label: product.label,
    quantity: materialQuantity,
    unit: "mp",
    unitPrice: product.price,
    discount: product.discount,
    note: product.material === "bitumen"
      ? "suprafata x 1.025 pentru suprapuneri"
      : "material principal asociat automat",
    category: "material",
  }));

  pushEstimateLineItem(items, createEstimateLineItem({
    code: "CO",
    label: `Coama ${product.quality}`,
    quantity: totals.ridgeLength,
    unit: "ml",
    unitPrice: qualityPricing.ridgePrice,
    discount: qualityPricing.ridgeDiscount,
    note: "tarif liniar corelat cu selectorul de calitate",
    category: "accessory",
  }));

  pushEstimateLineItem(items, createEstimateLineItem({
    code: "STR",
    label: `Streasina ${product.quality}`,
    quantity: eaveArea,
    unit: "mp",
    unitPrice: qualityPricing.eavePrice,
    discount: qualityPricing.eaveDiscount,
    note: `calculata din ${formatMeasure(totals.eaveLength, "ml")} x ${EAVE_BAND.totalWidth.toFixed(2)} m`,
    category: "accessory",
  }));

  if (product.material === "bitumen") {
    pushEstimateLineItem(items, createEstimateLineItem({
      code: "HID",
      label: "Strat hidroizolare",
      quantity: totals.roofArea * BITUMEN_FACTORS.waterproofLayer,
      unit: "mp",
      note: "cantitate tehnica pe baza formulei Sup. x 1.10",
    }));
    pushEstimateLineItem(items, createEstimateLineItem({
      code: "PAC",
      label: "Pelicula anticondensat",
      quantity: totals.roofArea * BITUMEN_FACTORS.antiCondensationFilm,
      unit: "mp",
      note: "cantitate tehnica pe baza formulei Sup. x 1.10",
    }));
    pushEstimateLineItem(items, createEstimateLineItem({
      code: "OSB",
      label: "OSB suport",
      quantity: Math.ceil(totals.roofArea / BITUMEN_FACTORS.osbSheetArea) + BITUMEN_FACTORS.extraOsbSheets,
      unit: "foi",
      note: "foi necesare conform formulei Sup./3.125 + 2",
    }));
  }

  if (product.material === "metal-tile" || product.material === "modular-tile") {
    const frontonLength = roundEvenMeters(totals.rakeLength + (totals.rakeLength > 0 ? METAL_FACTORS.frontonAllowance : 0));
    const gutterLength = roundEvenMeters(totals.eaveLength + METAL_FACTORS.gutterAllowance);
    const innerValleyLength = roundEvenMeters(totals.valleyLength);
    const outerValleyLength = roundEvenMeters(totals.hipLength);
    const membraneLabel = "Membrana de difuzie";

    pushEstimateLineItem(items, createEstimateLineItem({
      code: product.material === "modular-tile" ? "RF" : "BF",
      label: product.material === "modular-tile" ? "Bordura fronton" : "Bordura fronton",
      quantity: frontonLength,
      unit: "ml",
      note: "cantitate tehnica rotunjita la multiplu par",
    }));
    pushEstimateLineItem(items, createEstimateLineItem({
      code: "RI",
      label: "Regleta jgheab",
      quantity: gutterLength,
      unit: "ml",
      unitPrice: METAL_ACCESSORY_PRICING.gutterTrim,
      discount: ACCESSORY_DISCOUNT,
      note: "lungime tehnica cu rezerva de 2 m si rotunjire para",
      category: "accessory",
    }));
    pushEstimateLineItem(items, createEstimateLineItem({
      code: "DE",
      label: "Dolie interioara",
      quantity: innerValleyLength,
      unit: "ml",
      unitPrice: METAL_ACCESSORY_PRICING.interiorValley,
      discount: ACCESSORY_DISCOUNT,
      note: "cantitate tehnica rotunjita la multiplu par",
      category: "accessory",
    }));
    pushEstimateLineItem(items, createEstimateLineItem({
      code: "DX",
      label: "Dolie exterioara",
      quantity: outerValleyLength,
      unit: "ml",
      unitPrice: METAL_ACCESSORY_PRICING.exteriorValley,
      discount: ACCESSORY_DISCOUNT,
      note: "corespunde muchiilor exterioare ale acoperisului",
      category: "accessory",
    }));
    pushEstimateLineItem(items, createEstimateLineItem({
      code: "MEM",
      label: membraneLabel,
      quantity: totals.roofArea * MODULAR_FACTORS.diffusionMembrane,
      unit: "mp",
      unitPrice: METAL_ACCESSORY_PRICING.diffusionMembrane,
      discount: ACCESSORY_DISCOUNT,
      note: "cantitate tehnica pe baza formulei Sup. x 1.10",
      category: "accessory",
    }));
    pushEstimateLineItem(items, createEstimateLineItem({
      code: "SB35",
      label: "Suruburi 35 mm",
      quantity: Math.ceil(totals.roofArea * MODULAR_FACTORS.screws35PerSquareMeter),
      unit: "buc",
      unitPrice: METAL_ACCESSORY_PRICING.screws,
      discount: ACCESSORY_DISCOUNT,
      note: "consum tehnic calculat cu 8 buc/mp",
      category: "accessory",
    }));

    if (product.material === "modular-tile") {
      pushEstimateLineItem(items, createEstimateLineItem({
        code: "LC",
        label: "Lenta coama 180 mm x 5 m",
        quantity: Math.ceil(totals.ridgeLength / MODULAR_FACTORS.ridgeTapeRollLength),
        unit: "buc",
        note: "role necesare pentru coama modulara",
      }));
    }
  }

  return {
    items,
    materialQuantity,
    eaveArea,
  };
}

function renderLineItems(target, items, emptyTitle, emptyMeta) {
  target.innerHTML = "";

  if (!items.length) {
    const row = document.createElement("div");
    row.className = "estimate-line";
    row.innerHTML = `
      <div>
        <span class="estimate-line__title">${emptyTitle}</span>
        <span class="estimate-line__meta">${emptyMeta}</span>
      </div>
      <div><strong>-</strong><span>Cantitate</span></div>
      <div><strong>-</strong><span>P.U.</span></div>
      <div><strong>-</strong><span>Total</span></div>
    `;
    target.append(row);
    return;
  }

  const fragment = document.createDocumentFragment();

  items.forEach((item) => {
    const row = document.createElement("div");
    row.className = "estimate-line";

    const articleCell = document.createElement("div");
    const articleTitle = document.createElement("span");
    articleTitle.className = "estimate-line__title";
    articleTitle.textContent = item.code ? `${item.code} ${item.label}` : item.label;
    articleCell.append(articleTitle);

    const metaParts = [];
    if (item.note) {
      metaParts.push(item.note);
    }
    if (item.isPriced && item.discount > 0) {
      metaParts.push(`reducere ${Math.round(item.discount * 100)}%`);
    }
    if (metaParts.length) {
      const meta = document.createElement("span");
      meta.className = "estimate-line__meta";
      meta.textContent = metaParts.join(" | ");
      articleCell.append(meta);
    }

    const quantityCell = document.createElement("div");
    quantityCell.innerHTML = `<strong>${formatQuantity(item.quantity, item.unit)}</strong><span>Cantitate</span>`;

    const unitPriceCell = document.createElement("div");
    const unitPriceLabel = item.isPriced ? formatCurrency(item.unitPrice, `lei/${item.unit}`) : "-";
    unitPriceCell.innerHTML = `<strong>${unitPriceLabel}</strong><span>${item.isPriced ? "Pret unitar" : "Tarif neconfigurat"}</span>`;

    const totalCell = document.createElement("div");
    totalCell.innerHTML = `<strong>${item.isPriced ? formatCurrency(item.totalAfterDiscount) : "-"}</strong><span>${item.isPriced ? "Total calculat" : "Cantitate tehnica"}</span>`;

    row.append(articleCell, quantityCell, unitPriceCell, totalCell);
    fragment.append(row);
  });

  target.append(fragment);
}

function renderEstimateLineItems(items) {
  renderLineItems(
    outputs.estimateLineItems,
    items,
    "Deviz indisponibil",
    "Completeaza parametrii casei pentru a genera liniile de calcul.",
  );
}

function renderDrainageLineItems(items) {
  renderLineItems(
    outputs.drainageLineItems,
    items,
    "Sistem de scurgere inactiv",
    "Bifeaza optiunea din panou pentru a genera devizul sistemului de scurgere.",
  );
}

function calculatePriceEstimate(roofMetrics) {
  if (!roofMetrics) {
    return null;
  }

  const product = getSelectedRoofProductMeta();
  const qualityPricing = getSelectedQualityPricing();
  const materialRate = product.price * (1 - product.discount);
  const ridgeRate = qualityPricing.ridgePrice * (1 - qualityPricing.ridgeDiscount);
  const eaveRate = qualityPricing.eavePrice * (1 - qualityPricing.eaveDiscount);
  const estimateData = buildEstimateItems(roofMetrics, product, qualityPricing);
  const pricedItems = estimateData.items.filter((item) => item.isPriced);
  const materialLine = estimateData.items.find((item) => item.category === "material");
  const ridgeLine = estimateData.items.find((item) => item.code === "CO");
  const eaveLine = estimateData.items.find((item) => item.code === "STR");
  const materialCost = materialLine ? materialLine.totalAfterDiscount : 0;
  const ridgeCost = ridgeLine ? ridgeLine.totalAfterDiscount : 0;
  const eaveCost = eaveLine ? eaveLine.totalAfterDiscount : 0;
  const accessoriesCost = pricedItems
    .filter((item) => item.category === "accessory")
    .reduce((sum, item) => sum + item.totalAfterDiscount, 0);
  const discountTotal = pricedItems.reduce((sum, item) => sum + item.discountValue, 0);
  const subtotalBeforeDiscount = pricedItems.reduce((sum, item) => sum + item.totalBeforeDiscount, 0);
  const total = pricedItems.reduce((sum, item) => sum + item.totalAfterDiscount, 0);

  return {
    product,
    rates: {
      materialRate,
      ridgeRate,
      eaveRate,
    },
    quantities: {
      roofArea: roofMetrics.totals.roofArea,
      materialQuantity: estimateData.materialQuantity,
      ridgeLength: roofMetrics.totals.ridgeLength,
      eaveLength: roofMetrics.totals.eaveLength,
      eaveArea: estimateData.eaveArea,
      rakeLength: roofMetrics.totals.rakeLength,
      valleyLength: roofMetrics.totals.valleyLength,
      hipLength: roofMetrics.totals.hipLength,
    },
    costs: {
      materialCost,
      ridgeCost,
      eaveCost,
      accessoriesCost,
      discountTotal,
      subtotalBeforeDiscount,
      total,
    },
    items: estimateData.items,
  };
}

function updateEstimateOutputs(estimate) {
  if (!estimate) {
    outputs.estimateTotal.textContent = "0.00 lei";
    outputs.estimateProduct.textContent = "-";
    outputs.estimateMaterialRate.textContent = "0.00 lei/mp";
    outputs.estimateMaterialCost.textContent = "0.00 lei";
    outputs.estimateRidgeLength.textContent = "0.00 ml";
    outputs.estimateRidgeCost.textContent = "0.00 lei";
    outputs.estimateEaveLength.textContent = "0.00 ml";
    outputs.estimateEaveArea.textContent = "0.00 mp";
    outputs.estimateEaveCost.textContent = "0.00 lei";
    outputs.estimateAccessoriesCost.textContent = "0.00 lei";
    outputs.estimateDiscount.textContent = "0.00 lei";
    renderEstimateLineItems([]);
    return;
  }

  outputs.estimateTotal.textContent = formatCurrency(estimate.costs.total);
  outputs.estimateProduct.textContent = `${estimate.product.label} - ${estimate.product.quality}`;
  outputs.estimateMaterialRate.textContent = formatCurrency(estimate.rates.materialRate, "lei/mp");
  outputs.estimateMaterialCost.textContent = formatCurrency(estimate.costs.materialCost);
  outputs.estimateRidgeLength.textContent = formatMeasure(estimate.quantities.ridgeLength, "ml");
  outputs.estimateRidgeCost.textContent = formatCurrency(estimate.costs.ridgeCost);
  outputs.estimateEaveLength.textContent = formatMeasure(estimate.quantities.eaveLength, "ml");
  outputs.estimateEaveArea.textContent = formatMeasure(estimate.quantities.eaveArea, "mp");
  outputs.estimateEaveCost.textContent = formatCurrency(estimate.costs.eaveCost);
  outputs.estimateAccessoriesCost.textContent = formatCurrency(estimate.costs.accessoriesCost);
  outputs.estimateDiscount.textContent = formatCurrency(estimate.costs.discountTotal);
  renderEstimateLineItems(estimate.items);
}

function updateDrainageOutputs(estimate, roofEstimate) {
  if (!controlsMap.drainageEnabled.checked || !estimate) {
    outputs.drainageCard.classList.add("is-inactive");
    outputs.drainageTotal.textContent = "0.00 lei";
    outputs.drainageGutterLength.textContent = "0.00 ml";
    outputs.drainageDownspouts.textContent = "0 buc";
    outputs.drainageExteriorCorners.textContent = "0 buc";
    outputs.drainageInteriorCorners.textContent = "0 buc";
    outputs.drainageDiscount.textContent = "0.00 lei";
    outputs.drainageGrandTotal.textContent = roofEstimate
      ? formatCurrency(roofEstimate.costs.total)
      : "0.00 lei";
    outputs.drainageNote.textContent = "Activati optiunea de sistem de scurgere daca doriti sa il includeti in costul final al configuratiei.";
    renderDrainageLineItems([]);
    return;
  }

  outputs.drainageCard.classList.remove("is-inactive");
  outputs.drainageTotal.textContent = formatCurrency(estimate.costs.total);
  outputs.drainageGutterLength.textContent = formatMeasure(estimate.metrics.gutterLength, "ml");
  outputs.drainageDownspouts.textContent = formatQuantity(estimate.metrics.downspouts, "buc");
  outputs.drainageExteriorCorners.textContent = formatQuantity(estimate.metrics.exteriorCorners, "buc");
  outputs.drainageInteriorCorners.textContent = formatQuantity(estimate.metrics.interiorCorners, "buc");
  outputs.drainageDiscount.textContent = formatCurrency(estimate.costs.discountTotal);
  outputs.drainageGrandTotal.textContent = formatCurrency(estimate.costs.grandTotal);
  outputs.drainageNote.textContent = estimate.unpricedItems.length
    ? "Cantitatile sunt estimate automat. Pozitiile fara tarif raman tehnice pana confirmam articolul exact din catalog."
    : "Cantitatile si costurile sistemului de scurgere sunt estimate automat si incluse in totalul configuratiei cat timp optiunea ramane activa.";
  renderDrainageLineItems(estimate.items);
}

function syncRoofSelection(source) {
  if (source === "quality") {
    if (!ROOF_QUALITIES.includes(controlsMap.roofQuality.value)) {
      controlsMap.roofQuality.value = "Standart";
    }
    return;
  }

  if (source === "material") {
    if (!ROOF_QUALITIES.includes(controlsMap.roofQuality.value)) {
      controlsMap.roofQuality.value = "Standart";
    }
  }
}

function shadeColor(hex, amount) {
  const normalized = hex.replace("#", "");
  const numeric = Number.parseInt(normalized, 16);
  const adjust = (shift) => clamp(((numeric >> shift) & 255) + amount, 0, 255);
  const r = adjust(16).toString(16).padStart(2, "0");
  const g = adjust(8).toString(16).padStart(2, "0");
  const b = adjust(0).toString(16).padStart(2, "0");
  return `#${r}${g}${b}`;
}

function hexToRgb(hex) {
  const normalized = hex.replace("#", "");
  const numeric = Number.parseInt(normalized, 16);
  return {
    r: (numeric >> 16) & 255,
    g: (numeric >> 8) & 255,
    b: numeric & 255,
  };
}

function rgbToHex({ r, g, b }) {
  return `#${clamp(Math.round(r), 0, 255).toString(16).padStart(2, "0")}${clamp(Math.round(g), 0, 255).toString(16).padStart(2, "0")}${clamp(Math.round(b), 0, 255).toString(16).padStart(2, "0")}`;
}

function hexToRgba(hex, alpha) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function shadeFromLight(hex, normal, extra = 0) {
  const rgb = hexToRgb(hex);
  const n = normalize(normal);
  const lit = dot(n, LIGHT);
  const factor = clamp(0.62 + lit * 0.42 + extra, 0.2, 1.12);
  return rgbToHex({
    r: rgb.r * factor,
    g: rgb.g * factor,
    b: rgb.b * factor,
  });
}

function add(a, b) {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

function scaleVector(vector, scalar) {
  return {
    x: vector.x * scalar,
    y: vector.y * scalar,
    z: vector.z * scalar,
  };
}

function subtract(a, b) {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

function cross(a, b) {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

function dot(a, b) {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function length(vector) {
  return Math.sqrt(dot(vector, vector));
}

function normalize(vector) {
  const len = length(vector) || 1;
  return {
    x: vector.x / len,
    y: vector.y / len,
    z: vector.z / len,
  };
}

function average(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function averagePoint3D(points) {
  if (!points.length) {
    return { x: 0, y: 0, z: 0 };
  }

  const total = points.reduce((sum, point) => add(sum, point), { x: 0, y: 0, z: 0 });
  return scaleVector(total, 1 / points.length);
}

function rotatePoint(point) {
  const yaw = state.yaw * (Math.PI / 180);
  const pitch = state.pitch * (Math.PI / 180);

  const x1 = point.x * Math.cos(yaw) - point.z * Math.sin(yaw);
  const z1 = point.x * Math.sin(yaw) + point.z * Math.cos(yaw);
  const y2 = point.y * Math.cos(pitch) - z1 * Math.sin(pitch);
  const z2 = point.y * Math.sin(pitch) + z1 * Math.cos(pitch);

  return { x: x1, y: y2, z: z2 };
}

function projectPoint(point, centerX, centerY, scale) {
  const rotated = rotatePoint(point);
  return {
    x: centerX + rotated.x * scale,
    y: centerY - rotated.y * scale,
    depth: rotated.z,
  };
}

function makePolygonElement(points, attrs = {}) {
  const polygon = document.createElementNS(SVG_NS, "polygon");
  polygon.setAttribute("points", points.map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(" "));
  if (attrs.fill) {
    polygon.setAttribute("fill", attrs.fill);
  }
  polygon.setAttribute("stroke", attrs.stroke || "rgba(60, 48, 40, 0.32)");
  polygon.setAttribute("stroke-width", attrs.strokeWidth || "1");
  polygon.setAttribute("stroke-linejoin", "round");
  return polygon;
}

function makePolylineElement(points, attrs = {}) {
  const line = document.createElementNS(SVG_NS, "polyline");
  line.setAttribute("points", points.map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(" "));
  line.setAttribute("fill", "none");
  line.setAttribute("stroke", attrs.stroke || "rgba(82, 66, 52, 0.56)");
  line.setAttribute("stroke-width", attrs.strokeWidth || "1.3");
  line.setAttribute("stroke-linejoin", "round");
  line.setAttribute("stroke-linecap", "round");
  return line;
}

function makeLineElement(a, b, attrs = {}) {
  const line = document.createElementNS(SVG_NS, "line");
  line.setAttribute("x1", a.x.toFixed(2));
  line.setAttribute("y1", a.y.toFixed(2));
  line.setAttribute("x2", b.x.toFixed(2));
  line.setAttribute("y2", b.y.toFixed(2));
  line.setAttribute("stroke", attrs.stroke || "rgba(82, 66, 52, 0.28)");
  line.setAttribute("stroke-width", attrs.strokeWidth || "1");
  line.setAttribute("stroke-linecap", "round");
  return line;
}

function makeCircleElement(point, radius, attrs = {}) {
  const circle = document.createElementNS(SVG_NS, "circle");
  circle.setAttribute("cx", point.x.toFixed(2));
  circle.setAttribute("cy", point.y.toFixed(2));
  circle.setAttribute("r", radius.toFixed(2));
  circle.setAttribute("fill", attrs.fill || "rgba(70, 84, 94, 0.92)");
  circle.setAttribute("stroke", attrs.stroke || "rgba(220, 228, 235, 0.72)");
  circle.setAttribute("stroke-width", attrs.strokeWidth || "0.9");
  return circle;
}

function createFace(points3d, baseColor, centerX, centerY, scale, options = {}) {
  const normal = cross(subtract(points3d[1], points3d[0]), subtract(points3d[2], points3d[0]));
  const projected = points3d.map((point) => projectPoint(point, centerX, centerY, scale));
  const shade = shadeFromLight(baseColor, normal, options.lightBoost || 0);
  const fill = options.fill || shade;
  const stroke = options.stroke || shadeColor(fill, -34);

  return {
    depth: average(projected.map((point) => point.depth)),
    element: makePolygonElement(projected, {
      fill,
      stroke,
      strokeWidth: options.strokeWidth || 1,
    }),
    shade,
  };
}

function createBoundaryLine(points3d, centerX, centerY, scale, attrs = {}) {
  const projected = points3d.map((point) => projectPoint(point, centerX, centerY, scale));
  return {
    depth: average(projected.map((point) => point.depth)) + 0.001,
    element: makePolylineElement(projected, attrs),
  };
}

function createSegmentLine(a3d, b3d, centerX, centerY, scale, attrs = {}) {
  const a = projectPoint(a3d, centerX, centerY, scale);
  const b = projectPoint(b3d, centerX, centerY, scale);
  return {
    depth: (a.depth + b.depth) / 2 + 0.002,
    element: makeLineElement(a, b, attrs),
  };
}

function interpolatePoint(a, b, t) {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    z: a.z + (b.z - a.z) * t,
  };
}

function createProjectedPolyline(points3d, centerX, centerY, scale, attrs = {}, depthOffset = 0.003) {
  const projected = points3d.map((point) => projectPoint(point, centerX, centerY, scale));
  return {
    depth: average(projected.map((point) => point.depth)) + depthOffset,
    element: makePolylineElement(projected, attrs),
  };
}

function createProjectedCircle(point3d, radius, centerX, centerY, scale, attrs = {}, depthOffset = 0.004) {
  const projected = projectPoint(point3d, centerX, centerY, scale);
  return {
    depth: projected.depth + depthOffset,
    element: makeCircleElement(projected, radius, attrs),
  };
}

function lineIntersection2D(pointA, dirA, pointB, dirB) {
  const denominator = dirA.x * dirB.z - dirA.z * dirB.x;
  if (Math.abs(denominator) < 1e-8) {
    return { x: pointA.x, z: pointA.z };
  }

  const diffX = pointB.x - pointA.x;
  const diffZ = pointB.z - pointA.z;
  const t = (diffX * dirB.z - diffZ * dirB.x) / denominator;

  return {
    x: pointA.x + dirA.x * t,
    z: pointA.z + dirA.z * t,
  };
}

function pointInPolygon(point, polygon) {
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const xi = polygon[i].x;
    const zi = polygon[i].z;
    const xj = polygon[j].x;
    const zj = polygon[j].z;

    const intersects = ((zi > point.z) !== (zj > point.z))
      && (point.x < ((xj - xi) * (point.z - zi)) / ((zj - zi) || 1e-8) + xi);

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
}

function polygonBounds(polygon) {
  return polygon.reduce((bounds, point) => ({
    minX: Math.min(bounds.minX, point.x),
    maxX: Math.max(bounds.maxX, point.x),
    minZ: Math.min(bounds.minZ, point.z),
    maxZ: Math.max(bounds.maxZ, point.z),
  }), {
    minX: Number.POSITIVE_INFINITY,
    maxX: Number.NEGATIVE_INFINITY,
    minZ: Number.POSITIVE_INFINITY,
    maxZ: Number.NEGATIVE_INFINITY,
  });
}

function offsetPolygon(polygon, offset) {
  if (offset <= 0) {
    return polygon.map((point) => ({ x: point.x, z: point.z }));
  }

  return polygon.map((current, index) => {
    const previous = polygon[(index - 1 + polygon.length) % polygon.length];
    const next = polygon[(index + 1) % polygon.length];

    const dirPrev = normalize({ x: current.x - previous.x, y: 0, z: current.z - previous.z });
    const dirNext = normalize({ x: next.x - current.x, y: 0, z: next.z - current.z });

    const normalPrev = { x: dirPrev.z, z: -dirPrev.x };
    const normalNext = { x: dirNext.z, z: -dirNext.x };

    const linePrevPoint = {
      x: current.x + normalPrev.x * offset,
      z: current.z + normalPrev.z * offset,
    };
    const lineNextPoint = {
      x: current.x + normalNext.x * offset,
      z: current.z + normalNext.z * offset,
    };

    return lineIntersection2D(
      linePrevPoint,
      { x: dirPrev.x, z: dirPrev.z },
      lineNextPoint,
      { x: dirNext.x, z: dirNext.z },
    );
  });
}

function getLFootprint(widthA, depthA, widthB, depthB) {
  const xOffset = widthA / 2;
  const zOffset = depthB / 2;

  return [
    { x: 0 - xOffset, z: 0 - zOffset },
    { x: widthA - xOffset, z: 0 - zOffset },
    { x: widthA - xOffset, z: depthA - zOffset },
    { x: widthB - xOffset, z: depthA - zOffset },
    { x: widthB - xOffset, z: depthB - zOffset },
    { x: 0 - xOffset, z: depthB - zOffset },
  ];
}

function getTFootprint(widthA, depthA, widthB, depthB) {
  const xOffset = widthA / 2;
  const zOffset = depthB / 2;
  const stemLeft = (widthA - widthB) / 2;
  const stemRight = stemLeft + widthB;

  return [
    { x: 0 - xOffset, z: 0 - zOffset },
    { x: widthA - xOffset, z: 0 - zOffset },
    { x: widthA - xOffset, z: depthA - zOffset },
    { x: stemRight - xOffset, z: depthA - zOffset },
    { x: stemRight - xOffset, z: depthB - zOffset },
    { x: stemLeft - xOffset, z: depthB - zOffset },
    { x: stemLeft - xOffset, z: depthA - zOffset },
    { x: 0 - xOffset, z: depthA - zOffset },
  ];
}

function getRectFootprint(widthA, depthA) {
  const xOffset = widthA / 2;
  const zOffset = depthA / 2;

  return [
    { x: 0 - xOffset, z: 0 - zOffset },
    { x: widthA - xOffset, z: 0 - zOffset },
    { x: widthA - xOffset, z: depthA - zOffset },
    { x: 0 - xOffset, z: depthA - zOffset },
  ];
}

function pointInAxisRect(point, rect) {
  return point.x >= rect.minX - 1e-8
    && point.x <= rect.maxX + 1e-8
    && point.z >= rect.minZ - 1e-8
    && point.z <= rect.maxZ + 1e-8;
}

function getAttachmentOffset(hostMin, hostLength, childLength, align) {
  if (align === "start") {
    return hostMin;
  }

  if (align === "end") {
    return hostMin + hostLength - childLength;
  }

  return hostMin + (hostLength - childLength) / 2;
}

function buildAttachedRect(mainRect, side, align, width, depth) {
  const hostWidth = mainRect.maxX - mainRect.minX;
  const hostDepth = mainRect.maxZ - mainRect.minZ;

  if (side === "left" || side === "right") {
    const minZ = getAttachmentOffset(mainRect.minZ, hostDepth, depth, align);
    return {
      minX: side === "left" ? mainRect.minX - width : mainRect.maxX,
      maxX: side === "left" ? mainRect.minX : mainRect.maxX + width,
      minZ,
      maxZ: minZ + depth,
    };
  }

  const minX = getAttachmentOffset(mainRect.minX, hostWidth, width, align);
  return {
    minX,
    maxX: minX + width,
    minZ: side === "front" ? mainRect.minZ - depth : mainRect.maxZ,
    maxZ: side === "front" ? mainRect.minZ : mainRect.maxZ + depth,
  };
}

function rectanglesOverlapArea(first, second) {
  const overlapX = Math.min(first.maxX, second.maxX) - Math.max(first.minX, second.minX);
  const overlapZ = Math.min(first.maxZ, second.maxZ) - Math.max(first.minZ, second.minZ);
  return overlapX > 1e-6 && overlapZ > 1e-6;
}

function getCompoundPlacementCandidates(side, align) {
  const sides = ["left", "right", "front", "back"];
  const aligns = ["start", "center", "end"];
  const preferred = [{ side, align }];
  const sameSide = aligns
    .filter((entry) => entry !== align)
    .map((entry) => ({ side, align: entry }));
  const sameAlignOtherSides = sides
    .filter((entry) => entry !== side)
    .map((entry) => ({ side: entry, align }));
  const remaining = [];

  sides.forEach((sideEntry) => {
    aligns.forEach((alignEntry) => {
      if (sideEntry === side && alignEntry === align) {
        return;
      }
      if (sideEntry === side && alignEntry !== align) {
        return;
      }
      if (sideEntry !== side && alignEntry === align) {
        return;
      }
      remaining.push({ side: sideEntry, align: alignEntry });
    });
  });

  return [...preferred, ...sameSide, ...sameAlignOtherSides, ...remaining];
}

function resolveCompoundAttachment(mainRect, existingRects, enabled, side, align, width, depth) {
  if (!enabled) {
    return null;
  }

  const candidates = getCompoundPlacementCandidates(side, align);
  for (const candidate of candidates) {
    const rect = buildAttachedRect(mainRect, candidate.side, candidate.align, width, depth);
    if (!existingRects.some((existingRect) => rectanglesOverlapArea(rect, existingRect))) {
      return {
        rect,
        side: candidate.side,
        align: candidate.align,
      };
    }
  }

  return null;
}

function axisPointKey(point) {
  return `${point.x.toFixed(6)}:${point.z.toFixed(6)}`;
}

function axisSegmentKey(a, b) {
  const first = axisPointKey(a);
  const second = axisPointKey(b);
  return first < second ? `${first}|${second}` : `${second}|${first}`;
}

function mergeCollinearAxisPoints(points) {
  if (points.length < 3) {
    return points.slice();
  }

  const merged = [];

  for (let index = 0; index < points.length; index += 1) {
    const previous = points[(index - 1 + points.length) % points.length];
    const current = points[index];
    const next = points[(index + 1) % points.length];
    const sameX = Math.abs(previous.x - current.x) < 1e-8 && Math.abs(current.x - next.x) < 1e-8;
    const sameZ = Math.abs(previous.z - current.z) < 1e-8 && Math.abs(current.z - next.z) < 1e-8;

    if (!sameX && !sameZ) {
      merged.push(current);
    }
  }

  return merged;
}

function buildCompoundFootprint(rectangles) {
  const xCoords = Array.from(new Set(rectangles.flatMap((rect) => [rect.minX, rect.maxX]))).sort((a, b) => a - b);
  const zCoords = Array.from(new Set(rectangles.flatMap((rect) => [rect.minZ, rect.maxZ]))).sort((a, b) => a - b);
  const edges = new Map();

  for (let xIndex = 0; xIndex < xCoords.length - 1; xIndex += 1) {
    for (let zIndex = 0; zIndex < zCoords.length - 1; zIndex += 1) {
      const minX = xCoords[xIndex];
      const maxX = xCoords[xIndex + 1];
      const minZ = zCoords[zIndex];
      const maxZ = zCoords[zIndex + 1];
      const center = {
        x: (minX + maxX) / 2,
        z: (minZ + maxZ) / 2,
      };

      if (!rectangles.some((rect) => pointInAxisRect(center, rect))) {
        continue;
      }

      const p0 = { x: minX, z: minZ };
      const p1 = { x: maxX, z: minZ };
      const p2 = { x: maxX, z: maxZ };
      const p3 = { x: minX, z: maxZ };
      const cellEdges = [
        { a: p0, b: p1 },
        { a: p1, b: p2 },
        { a: p2, b: p3 },
        { a: p3, b: p0 },
      ];

      cellEdges.forEach((edge) => {
        const key = axisSegmentKey(edge.a, edge.b);
        if (edges.has(key)) {
          edges.delete(key);
        } else {
          edges.set(key, edge);
        }
      });
    }
  }

  const remainingEdges = Array.from(edges.values());
  if (!remainingEdges.length) {
    return getRectFootprint(1, 1);
  }

  const outgoing = new Map();
  remainingEdges.forEach((edge) => {
    outgoing.set(axisPointKey(edge.a), edge);
  });

  const startEdge = remainingEdges.reduce((best, edge) => {
    if (!best) {
      return edge;
    }

    if (edge.a.z < best.a.z - 1e-8) {
      return edge;
    }

    if (Math.abs(edge.a.z - best.a.z) < 1e-8 && edge.a.x < best.a.x) {
      return edge;
    }

    return best;
  }, null);

  const polygon = [startEdge.a];
  let current = startEdge;
  let guard = 0;

  while (guard < remainingEdges.length + 8) {
    polygon.push(current.b);
    const nextKey = axisPointKey(current.b);
    if (nextKey === axisPointKey(startEdge.a)) {
      polygon.pop();
      break;
    }

    current = outgoing.get(nextKey);
    if (!current) {
      break;
    }
    guard += 1;
  }

  return mergeCollinearAxisPoints(polygon);
}

function getCompoundRectangles(params) {
  const mainRect = {
    minX: -params.widthA / 2,
    maxX: params.widthA / 2,
    minZ: -params.depthA / 2,
    maxZ: params.depthA / 2,
  };
  const rectangles = [mainRect];

  const bodyB = resolveCompoundAttachment(
    mainRect,
    rectangles,
    params.bodyBEnabled,
    params.bodyBSide,
    params.bodyBAlign,
    params.widthB,
    params.depthB,
  );
  if (bodyB) {
    rectangles.push(bodyB.rect);
  }

  const bodyC = resolveCompoundAttachment(
    mainRect,
    rectangles,
    params.bodyCEnabled,
    params.bodyCSide,
    params.bodyCAlign,
    params.widthC,
    params.depthC,
  );
  if (bodyC) {
    rectangles.push(bodyC.rect);
  }

  return rectangles;
}

function insideLShape(x, z, widthA, depthA, widthB, depthB) {
  const localX = x + widthA / 2;
  const localZ = z + depthB / 2;
  const insideTopBar = localX >= 0 && localX <= widthA && localZ >= 0 && localZ <= depthA;
  const insideLeg = localX >= 0 && localX <= widthB && localZ >= depthA && localZ <= depthB;
  return insideTopBar || insideLeg;
}

function insideTShape(x, z, widthA, depthA, widthB, depthB) {
  const localX = x + widthA / 2;
  const localZ = z + depthB / 2;
  const stemLeft = (widthA - widthB) / 2;
  const stemRight = stemLeft + widthB;
  const insideTopBar = localX >= 0 && localX <= widthA && localZ >= 0 && localZ <= depthA;
  const insideStem = localX >= stemLeft && localX <= stemRight && localZ >= depthA && localZ <= depthB;
  return insideTopBar || insideStem;
}

function insideRectShape(x, z, widthA, depthA) {
  return x >= -widthA / 2 && x <= widthA / 2 && z >= -depthA / 2 && z <= depthA / 2;
}

function getShapeSpec(houseType, widthA, depthA, widthB, depthB, eave, options = {}) {
  if (houseType === "rect-gable") {
    const footprint = getRectFootprint(widthA, depthA);
    const roofFootprint = widthA >= depthA
      ? [
        { x: -widthA / 2, z: -depthA / 2 - eave },
        { x: widthA / 2, z: -depthA / 2 - eave },
        { x: widthA / 2, z: depthA / 2 + eave },
        { x: -widthA / 2, z: depthA / 2 + eave },
      ]
      : [
        { x: -widthA / 2 - eave, z: -depthA / 2 },
        { x: widthA / 2 + eave, z: -depthA / 2 },
        { x: widthA / 2 + eave, z: depthA / 2 },
        { x: -widthA / 2 - eave, z: depthA / 2 },
      ];
    const roofBounds = polygonBounds(roofFootprint);
    return {
      minX: -widthA / 2,
      maxX: widthA / 2,
      minZ: -depthA / 2,
      maxZ: depthA / 2,
      roofMode: "gable",
      footprint,
      roofFootprint,
      roofBounds,
      inside(x, z) {
        return insideRectShape(x, z, widthA, depthA);
      },
      roofInside(x, z) {
        return pointInPolygon({ x, z }, roofFootprint);
      },
    };
  }

  if (houseType === "rect-hip") {
    const footprint = getRectFootprint(widthA, depthA);
    const roofFootprint = offsetPolygon(footprint, eave);
    const roofBounds = polygonBounds(roofFootprint);
    return {
      minX: -widthA / 2,
      maxX: widthA / 2,
      minZ: -depthA / 2,
      maxZ: depthA / 2,
      roofMode: "hip",
      footprint,
      roofFootprint,
      roofBounds,
      inside(x, z) {
        return insideRectShape(x, z, widthA, depthA);
      },
      roofInside(x, z) {
        return pointInPolygon({ x, z }, roofFootprint);
      },
    };
  }

  if (houseType === "compound") {
    const rectangles = getCompoundRectangles({
      widthA,
      depthA,
      widthB,
      depthB,
      widthC: options.widthC,
      depthC: options.depthC,
      bodyBEnabled: options.bodyBEnabled,
      bodyBSide: options.bodyBSide,
      bodyBAlign: options.bodyBAlign,
      bodyCEnabled: options.bodyCEnabled,
      bodyCSide: options.bodyCSide,
      bodyCAlign: options.bodyCAlign,
    });
    const footprint = buildCompoundFootprint(rectangles);
    const roofFootprint = offsetPolygon(footprint, eave);
    const footprintBounds = polygonBounds(footprint);
    const roofBounds = polygonBounds(roofFootprint);

    return {
      minX: footprintBounds.minX,
      maxX: footprintBounds.maxX,
      minZ: footprintBounds.minZ,
      maxZ: footprintBounds.maxZ,
      roofMode: "distance-field",
      footprint,
      roofFootprint,
      roofBounds,
      rectangles,
      inside(x, z) {
        return pointInPolygon({ x, z }, footprint);
      },
      roofInside(x, z) {
        return pointInPolygon({ x, z }, roofFootprint);
      },
    };
  }

  const footprint = houseType === "t-shape"
    ? getTFootprint(widthA, depthA, widthB, depthB)
    : getLFootprint(widthA, depthA, widthB, depthB);
  const roofFootprint = offsetPolygon(footprint, eave);
  const roofBounds = polygonBounds(roofFootprint);

  const baseSpec = {
    minX: -widthA / 2,
    maxX: widthA / 2,
    minZ: -depthB / 2,
    maxZ: depthB / 2,
    roofMode: "distance-field",
    footprint,
    roofFootprint,
    roofBounds,
    roofInside(x, z) {
      return pointInPolygon({ x, z }, roofFootprint);
    },
  };

  if (houseType === "t-shape") {
    return {
      ...baseSpec,
      inside(x, z) {
        return insideTShape(x, z, widthA, depthA, widthB, depthB);
      },
    };
  }

  return {
    ...baseSpec,
    inside(x, z) {
      return insideLShape(x, z, widthA, depthA, widthB, depthB);
    },
  };
}

function distanceToSegment2D(point, a, b) {
  const abx = b.x - a.x;
  const abz = b.z - a.z;
  const apx = point.x - a.x;
  const apz = point.z - a.z;
  const denominator = abx * abx + abz * abz || 1;
  const t = clamp((apx * abx + apz * abz) / denominator, 0, 1);
  const closestX = a.x + abx * t;
  const closestZ = a.z + abz * t;
  return Math.hypot(point.x - closestX, point.z - closestZ);
}

function getBoundarySegments(footprint) {
  return footprint.map((point, index) => [point, footprint[(index + 1) % footprint.length]]);
}

function computeMaxRoofDistance(shapeSpec, segments) {
  let maxDistance = 0.01;
  const step = 0.2;
  const { minX, maxX, minZ, maxZ } = shapeSpec;

  for (let x = minX; x <= maxX; x += step) {
    for (let z = minZ; z <= maxZ; z += step) {
      if (!shapeSpec.inside(x, z)) {
        continue;
      }

      const distance = Math.min(...segments.map(([a, b]) => distanceToSegment2D({ x, z }, a, b)));
      if (distance > maxDistance) {
        maxDistance = distance;
      }
    }
  }

  return maxDistance;
}

function createRoofHeightGetter(shapeSpec) {
  if (shapeSpec.roofMode === "hip") {
    const halfWidth = (shapeSpec.roofBounds.maxX - shapeSpec.roofBounds.minX) / 2 || 1;
    const halfDepth = (shapeSpec.roofBounds.maxZ - shapeSpec.roofBounds.minZ) / 2 || 1;
    return {
      footprint: shapeSpec.footprint,
      roofFootprint: shapeSpec.roofFootprint,
      getHeight(x, z, roofHeight) {
        if (!shapeSpec.roofInside(x, z)) {
          return 0;
        }

        const nx = Math.abs(x) / halfWidth;
        const nz = Math.abs(z) / halfDepth;
        return roofHeight * Math.max(0, 1 - Math.max(nx, nz));
      },
    };
  }

  const roofShapeSpec = {
    minX: shapeSpec.roofBounds.minX,
    maxX: shapeSpec.roofBounds.maxX,
    minZ: shapeSpec.roofBounds.minZ,
    maxZ: shapeSpec.roofBounds.maxZ,
    inside(x, z) {
      return shapeSpec.roofInside(x, z);
    },
  };
  const segments = getBoundarySegments(shapeSpec.roofFootprint);
  const maxDistance = computeMaxRoofDistance(roofShapeSpec, segments);

  return {
    footprint: shapeSpec.footprint,
    roofFootprint: shapeSpec.roofFootprint,
    getHeight(x, z, roofHeight) {
      if (!shapeSpec.roofInside(x, z)) {
        return 0;
      }

      const distance = Math.min(...segments.map(([a, b]) => distanceToSegment2D({ x, z }, a, b)));
      return roofHeight * (distance / maxDistance);
    },
  };
}

function pushWallFaces(collection, footprint, wallHeight, wallColor, centerX, centerY, scale) {
  const segments = getBoundarySegments(footprint);

  segments.forEach(([a, b]) => {
    const face = createFace([
      { x: a.x, y: 0, z: a.z },
      { x: b.x, y: 0, z: b.z },
      { x: b.x, y: wallHeight, z: b.z },
      { x: a.x, y: wallHeight, z: a.z },
    ], wallColor, centerX, centerY, scale, {
      strokeWidth: 1.15,
    });
    collection.push(face);
  });
}

function pushBaseFaces(collection, footprint, baseHeight, baseColor, centerX, centerY, scale) {
  const roofOutline = footprint.map((point) => ({ x: point.x, y: 0, z: point.z }));
  const baseOutline = footprint.map((point) => ({ x: point.x, y: -baseHeight, z: point.z }));

  for (let i = 0; i < footprint.length; i += 1) {
    const current = footprint[i];
    const next = footprint[(i + 1) % footprint.length];
    collection.push(createFace([
      { x: current.x, y: -baseHeight, z: current.z },
      { x: next.x, y: -baseHeight, z: next.z },
      { x: next.x, y: 0, z: next.z },
      { x: current.x, y: 0, z: current.z },
    ], baseColor, centerX, centerY, scale, {
      strokeWidth: 1,
      lightBoost: -0.04,
    }));
  }

  collection.push(createFace(roofOutline, baseColor, centerX, centerY, scale, {
    strokeWidth: 1,
    lightBoost: 0.04,
  }));

  collection.push(createFace(baseOutline, shadeColor(baseColor, -14), centerX, centerY, scale, {
    strokeWidth: 0.8,
    lightBoost: -0.08,
  }));
}

function pushRoofMesh(collection, params, roofColor, centerX, centerY, scale, options = {}) {
  const {
    wallHeight,
    roofHeight,
    getHeight,
    shapeSpec,
  } = params;

  const step = options.step || 0.58;
  const stroke = options.stroke || "rgba(96, 46, 35, 0.08)";
  const strokeWidth = options.strokeWidth ?? 0.18;
  const lightBoost = options.lightBoost ?? 0.02;
  const fill = options.fill;

  for (let x = shapeSpec.roofBounds.minX; x < shapeSpec.roofBounds.maxX - 0.001; x += step) {
    for (let z = shapeSpec.roofBounds.minZ; z < shapeSpec.roofBounds.maxZ - 0.001; z += step) {
      const centerPointX = x + step / 2;
      const centerPointZ = z + step / 2;
      if (!shapeSpec.roofInside(centerPointX, centerPointZ)) {
        continue;
      }

      const x2 = Math.min(x + step, shapeSpec.roofBounds.maxX);
      const z2 = Math.min(z + step, shapeSpec.roofBounds.maxZ);
      const points = [
        { x, y: wallHeight + getHeight(x, z, roofHeight), z },
        { x: x2, y: wallHeight + getHeight(x2, z, roofHeight), z },
        { x: x2, y: wallHeight + getHeight(x2, z2, roofHeight), z: z2 },
        { x, y: wallHeight + getHeight(x, z2, roofHeight), z: z2 },
      ];

      collection.push(createFace(points, roofColor, centerX, centerY, scale, {
        fill,
        stroke,
        strokeWidth,
        lightBoost,
      }));
    }
  }
}

function pushFrontonFace(collection, points, frontonColor, centerX, centerY, scale) {
  const polygon = sanitizePolygon(points);
  if (polygon.length < 3) {
    return;
  }

  const face = createFace(polygon, frontonColor, centerX, centerY, scale, {
    stroke: hexToRgba(shadeColor(frontonColor, -42), 0.68),
    strokeWidth: 1.3,
    lightBoost: 0.03,
  });
  face.depth += 0.012;
  collection.push(face);

  const outline = createBoundaryLine([...polygon, polygon[0]], centerX, centerY, scale, {
    stroke: hexToRgba(shadeColor(frontonColor, -54), 0.74),
    strokeWidth: 1.55,
  });
  outline.depth += 0.014;
  collection.push(outline);

  if (polygon.length !== 3) {
    return;
  }

  const apexIndex = polygon.reduce((bestIndex, point, index) => (
    point.y > polygon[bestIndex].y ? index : bestIndex
  ), 0);
  const apex = polygon[apexIndex];
  const basePoints = polygon.filter((_, index) => index !== apexIndex);

  [0.38, 0.68].forEach((t) => {
    const a = interpolatePoint(basePoints[0], apex, t);
    const b = interpolatePoint(basePoints[1], apex, t);
    const guide = createProjectedPolyline([a, b], centerX, centerY, scale, {
      stroke: hexToRgba(shadeColor(frontonColor, 8), 0.18),
      strokeWidth: 0.92,
    }, 0.013);
    collection.push(guide);
  });
}

function pushEdgeGuides(collection, params, centerX, centerY, scale) {
  const {
    houseType,
    footprint,
    roofFootprint,
    wallHeight,
    roofHeight,
    getHeight,
    widthA,
    depthA,
    widthB,
    depthB,
    shapeSpec,
  } = params;

  const wallStroke = "rgba(88, 68, 52, 0.72)";
  const roofStroke = "rgba(108, 54, 40, 0.84)";
  const valleyStroke = "rgba(136, 67, 50, 0.92)";
  const roofPoint = (x, z) => ({ x, y: wallHeight + getHeight(x, z, roofHeight), z });

  const wallTop = footprint
    .concat([footprint[0]])
    .map((point) => ({ x: point.x, y: wallHeight, z: point.z }));
  collection.push(createBoundaryLine(wallTop, centerX, centerY, scale, {
    stroke: wallStroke,
    strokeWidth: 1.9,
  }));

  footprint.forEach((point) => {
    collection.push(createSegmentLine(
      { x: point.x, y: 0, z: point.z },
      { x: point.x, y: wallHeight, z: point.z },
      centerX,
      centerY,
      scale,
      {
        stroke: wallStroke,
        strokeWidth: 1.45,
      },
    ));
  });

  const roofOutline = roofFootprint
    .concat([roofFootprint[0]])
    .map((point) => ({ x: point.x, y: wallHeight + getHeight(point.x, point.z, roofHeight), z: point.z }));
  collection.push(createBoundaryLine(roofOutline, centerX, centerY, scale, {
    stroke: roofStroke,
    strokeWidth: 2.2,
  }));

  if (houseType === "rect-hip") {
    const halfWidth = (shapeSpec.roofBounds.maxX - shapeSpec.roofBounds.minX) / 2;
    const halfDepth = (shapeSpec.roofBounds.maxZ - shapeSpec.roofBounds.minZ) / 2;
    const corners = roofFootprint;

    if (widthA >= depthA) {
      const ridgeHalf = Math.max(0, halfWidth - halfDepth);
      if (ridgeHalf > 0.01) {
        collection.push(createSegmentLine(
          roofPoint(-ridgeHalf, 0),
          roofPoint(ridgeHalf, 0),
          centerX,
          centerY,
          scale,
          { stroke: roofStroke, strokeWidth: 2.4 },
        ));
      }

      collection.push(createSegmentLine(
        roofPoint(corners[0].x, corners[0].z),
        roofPoint(-ridgeHalf, 0),
        centerX,
        centerY,
        scale,
        { stroke: valleyStroke, strokeWidth: 1.8 },
      ));
      collection.push(createSegmentLine(
        roofPoint(corners[1].x, corners[1].z),
        roofPoint(ridgeHalf, 0),
        centerX,
        centerY,
        scale,
        { stroke: valleyStroke, strokeWidth: 1.8 },
      ));
      collection.push(createSegmentLine(
        roofPoint(corners[3].x, corners[3].z),
        roofPoint(-ridgeHalf, 0),
        centerX,
        centerY,
        scale,
        { stroke: valleyStroke, strokeWidth: 1.8 },
      ));
      collection.push(createSegmentLine(
        roofPoint(corners[2].x, corners[2].z),
        roofPoint(ridgeHalf, 0),
        centerX,
        centerY,
        scale,
        { stroke: valleyStroke, strokeWidth: 1.8 },
      ));
    } else {
      const ridgeHalf = Math.max(0, halfDepth - halfWidth);
      if (ridgeHalf > 0.01) {
        collection.push(createSegmentLine(
          roofPoint(0, -ridgeHalf),
          roofPoint(0, ridgeHalf),
          centerX,
          centerY,
          scale,
          { stroke: roofStroke, strokeWidth: 2.4 },
        ));
      }

      collection.push(createSegmentLine(
        roofPoint(corners[0].x, corners[0].z),
        roofPoint(0, -ridgeHalf),
        centerX,
        centerY,
        scale,
        { stroke: valleyStroke, strokeWidth: 1.8 },
      ));
      collection.push(createSegmentLine(
        roofPoint(corners[3].x, corners[3].z),
        roofPoint(0, ridgeHalf),
        centerX,
        centerY,
        scale,
        { stroke: valleyStroke, strokeWidth: 1.8 },
      ));
      collection.push(createSegmentLine(
        roofPoint(corners[1].x, corners[1].z),
        roofPoint(0, -ridgeHalf),
        centerX,
        centerY,
        scale,
        { stroke: valleyStroke, strokeWidth: 1.8 },
      ));
      collection.push(createSegmentLine(
        roofPoint(corners[2].x, corners[2].z),
        roofPoint(0, ridgeHalf),
        centerX,
        centerY,
        scale,
        { stroke: valleyStroke, strokeWidth: 1.8 },
      ));
    }
    return;
  }

  if (houseType === "l-shape") {
    const roofInnerCorner = roofFootprint[3];
    const innerCorner = {
      x: -widthA / 2 + widthB,
      z: -depthB / 2 + depthA,
    };
    const topRidgeZ = -depthB / 2 + depthA * 0.5;
    const legRidgeX = -widthA / 2 + widthB * 0.5;
    const junction = {
      x: innerCorner.x - Math.min(widthB, depthA) * 0.5,
      z: innerCorner.z - Math.min(widthB, depthA) * 0.5,
    };
    const topRidgeEnd = {
      x: Math.max(junction.x + 0.3, widthA / 2 - depthA * 0.5),
      z: topRidgeZ,
    };
    const legRidgeEnd = {
      x: legRidgeX,
      z: Math.max(junction.z + 0.3, depthB / 2 - widthB * 0.5),
    };

    collection.push(createSegmentLine(
      roofPoint(roofInnerCorner.x, roofInnerCorner.z),
      roofPoint(junction.x, junction.z),
      centerX,
      centerY,
      scale,
      { stroke: valleyStroke, strokeWidth: 2.2 },
    ));
    collection.push(createSegmentLine(
      roofPoint(junction.x, junction.z),
      roofPoint(topRidgeEnd.x, topRidgeEnd.z),
      centerX,
      centerY,
      scale,
      { stroke: roofStroke, strokeWidth: 2.05 },
    ));
    collection.push(createSegmentLine(
      roofPoint(junction.x, junction.z),
      roofPoint(legRidgeEnd.x, legRidgeEnd.z),
      centerX,
      centerY,
      scale,
      { stroke: roofStroke, strokeWidth: 2.05 },
    ));
    return;
  }

  if (houseType === "t-shape") {
    const roofRightJunction = roofFootprint[3];
    const roofLeftJunction = roofFootprint[6];
    const stemLeft = -widthA / 2 + (widthA - widthB) / 2;
    const stemRight = stemLeft + widthB;
    const junctionZ = -depthB / 2 + depthA;
    const topRidgeHalf = Math.max(0.3, (widthA - depthA) * 0.5);
    const topRidgeLeft = {
      x: -topRidgeHalf,
      z: -depthB / 2 + depthA * 0.5,
    };
    const topRidgeRight = {
      x: topRidgeHalf,
      z: -depthB / 2 + depthA * 0.5,
    };
    const ridgeJunction = {
      x: 0,
      z: -depthB / 2 + depthA * 0.5,
    };
    const stemRidgeEnd = {
      x: 0,
      z: Math.max(ridgeJunction.z + 0.3, depthB / 2 - widthB * 0.5),
    };

    collection.push(createSegmentLine(
      roofPoint(topRidgeLeft.x, topRidgeLeft.z),
      roofPoint(topRidgeRight.x, topRidgeRight.z),
      centerX,
      centerY,
      scale,
      { stroke: roofStroke, strokeWidth: 2.05 },
    ));
    collection.push(createSegmentLine(
      roofPoint(ridgeJunction.x, ridgeJunction.z),
      roofPoint(stemRidgeEnd.x, stemRidgeEnd.z),
      centerX,
      centerY,
      scale,
      { stroke: roofStroke, strokeWidth: 2.05 },
    ));
    collection.push(createSegmentLine(
      roofPoint(roofRightJunction.x, roofRightJunction.z),
      roofPoint(ridgeJunction.x, ridgeJunction.z),
      centerX,
      centerY,
      scale,
      { stroke: valleyStroke, strokeWidth: 1.9 },
    ));
    collection.push(createSegmentLine(
      roofPoint(roofLeftJunction.x, roofLeftJunction.z),
      roofPoint(ridgeJunction.x, ridgeJunction.z),
      centerX,
      centerY,
      scale,
      { stroke: valleyStroke, strokeWidth: 1.9 },
    ));
  }
}

function pointsMatch(a, b) {
  return Math.abs(a.x - b.x) < 1e-6
    && Math.abs(a.y - b.y) < 1e-6
    && Math.abs(a.z - b.z) < 1e-6;
}

function sanitizePolygon(points) {
  const cleaned = [];

  points.forEach((point) => {
    if (!cleaned.length || !pointsMatch(cleaned[cleaned.length - 1], point)) {
      cleaned.push(point);
    }
  });

  if (cleaned.length > 1 && pointsMatch(cleaned[0], cleaned[cleaned.length - 1])) {
    cleaned.pop();
  }

  return cleaned;
}

function roofPeak(x, z, wallHeight, roofHeight) {
  return { x, y: wallHeight + roofHeight, z };
}

function pushRoofPlane(collection, points, roofColor, centerX, centerY, scale, options = {}) {
  const polygon = sanitizePolygon(points);
  if (polygon.length < 3) {
    return;
  }

  const normal = cross(subtract(polygon[1], polygon[0]), subtract(polygon[2], polygon[0]));
  if (length(normal) < 1e-6) {
    return;
  }

  const oriented = normal.y >= 0 ? polygon : [...polygon].reverse();
  const material = options.roofMaterial || "bitumen";
  const lightBoost = material === "bitumen"
    ? -0.01
    : material === "metal-tile"
      ? 0.13
      : 0.08;
  const faceStroke = options.stroke || "rgba(86, 58, 44, 0.09)";
  const roofFace = createFace(oriented, roofColor, centerX, centerY, scale, {
    stroke: faceStroke,
    strokeWidth: options.strokeWidth || 0.7,
    lightBoost: options.lightBoost ?? lightBoost,
  });
  collection.push(roofFace);
  pushRoofSurfaceTexture(
    collection,
    oriented,
    centerX,
    centerY,
    scale,
    roofFace.shade,
    material,
  );
}

function pushCompoundRoofFacet(collection, points, roofColor, centerX, centerY, scale, roofMaterial) {
  const polygon = sanitizePolygon(points);
  if (polygon.length < 3) {
    return;
  }

  const normal = cross(subtract(polygon[1], polygon[0]), subtract(polygon[2], polygon[0]));
  if (length(normal) < 1e-6) {
    return;
  }

  const oriented = normal.y >= 0 ? polygon : [...polygon].reverse();
  const material = roofMaterial || "bitumen";
  const lightBoost = material === "bitumen"
    ? -0.005
    : material === "metal-tile"
      ? 0.12
      : 0.075;
  const roofFace = createFace(oriented, roofColor, centerX, centerY, scale, {
    stroke: "rgba(0, 0, 0, 0)",
    strokeWidth: 0.01,
    lightBoost,
  });
  collection.push(roofFace);
}

function pushRoofSurfaceTexture(collection, polygon, centerX, centerY, scale, baseColor, material) {
  const polygonPoints = sanitizePolygon(polygon);
  if (polygonPoints.length < 3) {
    return;
  }

  const shadowColor = hexToRgba(shadeColor(baseColor, -38), 0.3);
  const lineColor = hexToRgba(shadeColor(baseColor, -28), 0.26);
  const softColor = hexToRgba(shadeColor(baseColor, -12), 0.18);
  const highlightColor = hexToRgba(shadeColor(baseColor, 14), 0.24);
  let leftStart;
  let leftEnd;
  let rightStart;
  let rightEnd;
  let rowCount;

  if (polygonPoints.length === 4) {
    leftStart = polygonPoints[0];
    leftEnd = polygonPoints[3];
    rightStart = polygonPoints[1];
    rightEnd = polygonPoints[2];
    rowCount = 6;
  } else {
    leftStart = polygonPoints[0];
    leftEnd = polygonPoints[2];
    rightStart = polygonPoints[1];
    rightEnd = polygonPoints[2];
    rowCount = 5;
  }

  const pointOnPlane = (s, t) => {
    const rowStart = interpolatePoint(leftStart, leftEnd, t);
    const rowEnd = interpolatePoint(rightStart, rightEnd, t);
    return interpolatePoint(rowStart, rowEnd, s);
  };

  const addRoofLine = (points3d, attrs = {}, depthOffset = 0.004) => {
    const entry = createProjectedPolyline(points3d, centerX, centerY, scale, {
      stroke: attrs.stroke || lineColor,
      strokeWidth: attrs.strokeWidth || 1,
    }, depthOffset);

    if (attrs.strokeDasharray) {
      entry.element.setAttribute("stroke-dasharray", attrs.strokeDasharray);
    }
    if (attrs.strokeDashoffset) {
      entry.element.setAttribute("stroke-dashoffset", attrs.strokeDashoffset);
    }
    if (attrs.strokeOpacity) {
      entry.element.setAttribute("stroke-opacity", attrs.strokeOpacity);
    }

    collection.push(entry);
  };

  const addLineByGrid = (s0, t0, s1, t1, attrs = {}, depthOffset = 0.004) => {
    addRoofLine(
      [pointOnPlane(s0, t0), pointOnPlane(s1, t1)],
      attrs,
      depthOffset,
    );
  };

  if (material === "bitumen") {
    rowCount = polygonPoints.length === 4 ? 7 : 6;

    for (let i = 1; i < rowCount; i += 1) {
      const t = i / rowCount;
      addLineByGrid(0, t, 1, t, {
        stroke: lineColor,
        strokeWidth: 0.88,
        strokeDasharray: i % 2 === 0 ? "18 8 14 10" : "14 10 18 8",
        strokeDashoffset: i % 2 === 0 ? "0" : "8",
        strokeOpacity: "1",
      });

      const grainT = Math.min(0.985, t + 0.022);
      addLineByGrid(0.03, grainT, 0.97, grainT, {
        stroke: highlightColor,
        strokeWidth: 0.34,
        strokeDasharray: "2 12",
        strokeDashoffset: String(i * 3),
        strokeOpacity: "1",
      }, 0.0045);
    }

    for (let band = 0; band < rowCount - 1; band += 1) {
      const t0 = band / rowCount + 0.012;
      const t1 = Math.min(0.99, t0 + 0.14);
      const offset = band % 2 === 0 ? 0 : 0.11;
      [0.12, 0.34, 0.56, 0.78].forEach((base) => {
        const s = clamp(base + offset, 0.08, 0.9);
        addLineByGrid(s, t0, s, t1, {
          stroke: softColor,
          strokeWidth: 0.56,
          strokeOpacity: "1",
        }, 0.0043);
      });
    }

    for (let band = 0; band < rowCount; band += 1) {
      const t = Math.min(0.985, band / rowCount + 0.045);
      addLineByGrid(0.04, t, 0.96, t, {
        stroke: hexToRgba(shadeColor(baseColor, 4), 0.12),
        strokeWidth: 0.28,
        strokeDasharray: "1.5 10",
        strokeDashoffset: String(band * 2),
        strokeOpacity: "1",
      }, 0.0045);
    }

    return;
  }

  if (material === "metal-tile") {
    rowCount = polygonPoints.length === 4 ? 6 : 5;
    const ribCount = polygonPoints.length === 4 ? 5 : 4;

    for (let i = 1; i < rowCount; i += 1) {
      const t = i / rowCount;
      const highlightT = Math.max(0.01, t - 0.02);
      const shadowT = Math.min(0.99, t + 0.014);
      addLineByGrid(0, highlightT, 1, highlightT, {
        stroke: highlightColor,
        strokeWidth: 0.48,
        strokeOpacity: "1",
      }, 0.0042);
      addLineByGrid(0, t, 1, t, {
        stroke: shadowColor,
        strokeWidth: 0.94,
        strokeOpacity: "1",
      });
      addLineByGrid(0.01, shadowT, 0.99, shadowT, {
        stroke: softColor,
        strokeWidth: 0.42,
        strokeOpacity: "1",
      });
    }

    for (let i = 1; i < ribCount; i += 1) {
      const s = i / ribCount;
      const highlightS = Math.min(0.98, s + 0.014);
      addLineByGrid(s, 0, s, 1, {
        stroke: lineColor,
        strokeWidth: 0.72,
        strokeOpacity: "1",
      });
      addLineByGrid(highlightS, 0.02, highlightS, 0.98, {
        stroke: highlightColor,
        strokeWidth: 0.32,
        strokeOpacity: "1",
      }, 0.0042);
    }

    return;
  }

  rowCount = polygonPoints.length === 4 ? 6 : 5;
  const ribCount = polygonPoints.length === 4 ? 4 : 3;

  for (let i = 1; i < rowCount; i += 1) {
    const t = i / rowCount;
    const boundary = i % 2 === 0;
    const highlightT = Math.max(0.01, t - 0.016);
    const lowerT = Math.min(0.99, t + 0.012);

    addLineByGrid(0, highlightT, 1, highlightT, {
      stroke: highlightColor,
      strokeWidth: boundary ? 0.56 : 0.38,
      strokeOpacity: "1",
    }, 0.0042);

    addLineByGrid(0, t, 1, t, {
      stroke: boundary ? shadowColor : lineColor,
      strokeWidth: boundary ? 0.98 : 0.74,
      strokeOpacity: "1",
    });

    if (boundary) {
      addLineByGrid(0.02, lowerT, 0.98, lowerT, {
        stroke: softColor,
        strokeWidth: 0.34,
        strokeOpacity: "1",
      });
    }
  }

  for (let module = 0; module < rowCount; module += 2) {
    const t0 = module / rowCount + 0.015;
    const t1 = Math.min(0.985, t0 + 0.3);
    for (let i = 1; i < ribCount; i += 1) {
      const s = i / ribCount;
      addLineByGrid(s, t0, s, t1, {
        stroke: lineColor,
        strokeWidth: 0.74,
        strokeOpacity: "1",
      });
      addLineByGrid(Math.min(0.98, s + 0.012), t0, Math.min(0.98, s + 0.012), t1, {
        stroke: highlightColor,
        strokeWidth: 0.28,
        strokeOpacity: "1",
      }, 0.0042);
    }
  }
}

function pushWallGuides(collection, footprint, wallHeight, centerX, centerY, scale) {
  const wallStroke = "rgba(88, 68, 52, 0.72)";
  const wallTop = footprint
    .concat([footprint[0]])
    .map((point) => ({ x: point.x, y: wallHeight, z: point.z }));

  collection.push(createBoundaryLine(wallTop, centerX, centerY, scale, {
    stroke: wallStroke,
    strokeWidth: 1.9,
  }));

  footprint.forEach((point) => {
    collection.push(createSegmentLine(
      { x: point.x, y: 0, z: point.z },
      { x: point.x, y: wallHeight, z: point.z },
      centerX,
      centerY,
      scale,
      {
        stroke: wallStroke,
        strokeWidth: 1.45,
      },
    ));
  });
}

function projectVectorOntoPlane(vector, normal) {
  return subtract(vector, scaleVector(normal, dot(vector, normal)));
}

function getRoofFaceBasis(points) {
  const polygon = sanitizePolygon(points);
  if (polygon.length < 3) {
    return null;
  }

  let normal = cross(subtract(polygon[1], polygon[0]), subtract(polygon[2], polygon[0]));
  if (length(normal) < 1e-6) {
    return null;
  }

  normal = normalize(normal);
  if (normal.y < 0) {
    normal = scaleVector(normal, -1);
  }

  let slopeUp = projectVectorOntoPlane({ x: 0, y: 1, z: 0 }, normal);
  if (length(slopeUp) < 1e-6) {
    return null;
  }
  slopeUp = normalize(slopeUp);

  let across = cross(slopeUp, normal);
  if (length(across) < 1e-6) {
    return null;
  }
  across = normalize(across);

  const origin = polygon[0];
  const localPolygon = polygon.map((point) => {
    const vector = subtract(point, origin);
    return {
      x: dot(vector, across),
      z: dot(vector, slopeUp),
    };
  });

  return {
    polygon,
    origin,
    normal,
    slopeUp,
    across,
    localPolygon,
    bounds: polygonBounds(localPolygon),
  };
}

function localPointToWorld(basis, u, v) {
  return add(
    basis.origin,
    add(
      scaleVector(basis.across, u),
      scaleVector(basis.slopeUp, v),
    ),
  );
}

function quadPoint(points, s, t) {
  const left = interpolatePoint(points[0], points[3], t);
  const right = interpolatePoint(points[1], points[2], t);
  return interpolatePoint(left, right, s);
}

function getLucarneFaceCandidates(roofMetrics) {
  if (!roofMetrics || !Array.isArray(roofMetrics.faces)) {
    return [];
  }

  const candidates = roofMetrics.faces
    .map((face) => {
      const basis = getRoofFaceBasis(face.points);
      if (!basis) {
        return null;
      }

      const spanU = basis.bounds.maxX - basis.bounds.minX;
      const spanV = basis.bounds.maxZ - basis.bounds.minZ;
      const centroid = averagePoint3D(face.points);
      const isQuad = face.points.length === 4;
      const frontBias = centroid.z > 0 ? 6 : centroid.z * 1.5;

      return {
        face,
        basis,
        spanU,
        spanV,
        centroid,
        score: face.area * 2.4 + frontBias + (isQuad ? 2.8 : 0) - Math.abs(centroid.x) * 0.18,
      };
    })
    .filter((candidate) => candidate && candidate.face.area > 4.5 && candidate.spanU > 1.9 && candidate.spanV > 1.3)
    .sort((a, b) => b.score - a.score);

  const frontCandidates = candidates.filter((candidate) => candidate.centroid.z >= -0.2);
  return frontCandidates.length ? frontCandidates : candidates;
}

function canFitLucarne(basis, centerU, frontV, width, depth) {
  const halfWidth = width / 2;
  const localCorners = [
    { x: centerU - halfWidth, z: frontV },
    { x: centerU + halfWidth, z: frontV },
    { x: centerU + halfWidth, z: frontV + depth },
    { x: centerU - halfWidth, z: frontV + depth },
  ];
  const probes = [
    ...localCorners,
    { x: centerU, z: frontV + depth * 0.5 },
    { x: centerU - halfWidth * 0.55, z: frontV + depth * 0.5 },
    { x: centerU + halfWidth * 0.55, z: frontV + depth * 0.5 },
    { x: centerU, z: frontV + depth * 0.15 },
    { x: centerU, z: frontV + depth * 0.85 },
  ];

  return probes.every((point) => pointInPolygon(point, basis.localPolygon));
}

function buildLucarnePlacement(faceCandidate, preferredOffset = 0) {
  const { basis, spanU, spanV } = faceCandidate;
  let width = clamp(spanU * 0.34, 1.45, 2.7);
  let depth = clamp(spanV * 0.24, 1.05, 1.75);

  while (width >= 1.1 && depth >= 0.9) {
    const frontMin = basis.bounds.minZ + Math.max(0.45, spanV * 0.16);
    const frontMax = basis.bounds.maxZ - depth - Math.max(0.24, spanV * 0.08);
    if (frontMax >= frontMin) {
      const middleU = (basis.bounds.minX + basis.bounds.maxX) / 2;
      const clampedCenter = clamp(
        middleU + preferredOffset,
        basis.bounds.minX + width / 2 + 0.06,
        basis.bounds.maxX - width / 2 - 0.06,
      );
      const centerCandidates = [
        clampedCenter,
        middleU,
        clampedCenter - 0.28,
        clampedCenter + 0.28,
        middleU - 0.48,
        middleU + 0.48,
      ]
        .map((value) => clamp(
          value,
          basis.bounds.minX + width / 2 + 0.06,
          basis.bounds.maxX - width / 2 - 0.06,
        ))
        .filter((value, index, values) => values.findIndex((entry) => Math.abs(entry - value) < 1e-4) === index);
      const frontCandidates = [
        frontMin,
        Math.min(frontMax, frontMin + 0.3),
        (frontMin + frontMax) / 2,
      ];

      for (const frontV of frontCandidates) {
        for (const centerU of centerCandidates) {
          if (!canFitLucarne(basis, centerU, frontV, width, depth)) {
            continue;
          }

          return {
            basis,
            centerU,
            frontV,
            width,
            depth,
            faceIndex: faceCandidate.face.index,
            centroid: faceCandidate.centroid,
            spanU,
            spanV,
          };
        }
      }
    }

    width -= 0.12;
    depth -= 0.05;
  }

  return null;
}

function getLucarnePlacements(roofMetrics, requestedCount) {
  if (requestedCount <= 0) {
    return [];
  }

  const candidates = getLucarneFaceCandidates(roofMetrics);
  if (!candidates.length) {
    return [];
  }

  if (requestedCount === 1) {
    for (const candidate of candidates) {
      const placement = buildLucarnePlacement(candidate, 0);
      if (placement) {
        return [placement];
      }
    }
    return [];
  }

  const primary = candidates[0];
  if (primary) {
    const offset = clamp(primary.spanU * 0.24, 0.95, 1.7);
    const leftPlacement = buildLucarnePlacement(primary, -offset);
    const rightPlacement = buildLucarnePlacement(primary, offset);
    if (
      leftPlacement
      && rightPlacement
      && Math.abs(leftPlacement.centerU - rightPlacement.centerU) > Math.max(leftPlacement.width, rightPlacement.width) * 1.15
    ) {
      return [leftPlacement, rightPlacement];
    }
  }

  const placements = [];
  for (const candidate of candidates) {
    const placement = buildLucarnePlacement(candidate, 0);
    if (!placement) {
      continue;
    }

    placements.push(placement);
    if (placements.length === requestedCount) {
      break;
    }
  }

  return placements;
}

function pushLucarneModel(collection, roofMetrics, wallColor, roofColor, roofMaterial, lucarneCount, centerX, centerY, scale) {
  const placements = getLucarnePlacements(roofMetrics, lucarneCount);
  if (!placements.length) {
    return;
  }

  const trimStroke = "rgba(88, 58, 44, 0.84)";
  const cheekStroke = hexToRgba(shadeColor(wallColor, -42), 0.72);
  const valleyStroke = "rgba(112, 58, 42, 0.92)";
  const ridgeStroke = "rgba(92, 48, 36, 0.96)";
  const gableStroke = hexToRgba(shadeColor(roofColor, -44), 0.74);
  const windowStroke = "rgba(200, 222, 238, 0.86)";

  placements.forEach((placement) => {
    const { basis, centerU, frontV, width, depth, spanV } = placement;
    const halfWidth = width / 2;
    const frontLeft = localPointToWorld(basis, centerU - halfWidth, frontV);
    const frontRight = localPointToWorld(basis, centerU + halfWidth, frontV);
    const valleyV = frontV + depth;
    const backRight = localPointToWorld(basis, centerU + halfWidth, valleyV);
    const backLeft = localPointToWorld(basis, centerU - halfWidth, valleyV);
    const backCenter = localPointToWorld(basis, centerU, valleyV);

    const cheekHeight = clamp(Math.min(1.02, spanV * 0.24), 0.72, 1.04);
    const gableRise = clamp(width * 0.28, 0.48, 0.94);
    const topFrontLeft = add(frontLeft, { x: 0, y: cheekHeight, z: 0 });
    const topFrontRight = add(frontRight, { x: 0, y: cheekHeight, z: 0 });
    const apexFront = add(interpolatePoint(topFrontLeft, topFrontRight, 0.5), { x: 0, y: gableRise, z: 0 });
    const apexBack = {
      x: backCenter.x,
      y: apexFront.y,
      z: backCenter.z,
    };

    const frontWall = [frontLeft, frontRight, topFrontRight, topFrontLeft];
    const frontGable = [topFrontLeft, topFrontRight, apexFront];
    const leftCheek = [frontLeft, backLeft, topFrontLeft];
    const rightCheek = [frontRight, topFrontRight, backRight];
    const leftRoofPlane = [topFrontLeft, apexFront, apexBack, backLeft];
    const rightRoofPlane = [topFrontRight, backRight, apexBack, apexFront];

    collection.push(createFace(frontWall, wallColor, centerX, centerY, scale, {
      stroke: cheekStroke,
      strokeWidth: 1.15,
      lightBoost: 0.05,
    }));
    collection.push(createFace(leftCheek, wallColor, centerX, centerY, scale, {
      stroke: cheekStroke,
      strokeWidth: 1.05,
      lightBoost: 0.03,
    }));
    collection.push(createFace(rightCheek, wallColor, centerX, centerY, scale, {
      stroke: cheekStroke,
      strokeWidth: 1.05,
      lightBoost: 0.03,
    }));
    collection.push(createFace(frontGable, roofColor, centerX, centerY, scale, {
      stroke: gableStroke,
      strokeWidth: 1.08,
      lightBoost: 0.04,
    }));
    pushRoofPlane(collection, leftRoofPlane, roofColor, centerX, centerY, scale, {
      roofMaterial,
      stroke: hexToRgba(shadeColor(roofColor, -28), 0.26),
      strokeWidth: 0.9,
      lightBoost: 0.09,
    });
    pushRoofPlane(collection, rightRoofPlane, roofColor, centerX, centerY, scale, {
      roofMaterial,
      stroke: hexToRgba(shadeColor(roofColor, -28), 0.26),
      strokeWidth: 0.9,
      lightBoost: 0.09,
    });

    collection.push(createSegmentLine(frontLeft, topFrontLeft, centerX, centerY, scale, {
      stroke: trimStroke,
      strokeWidth: 1.2,
    }));
    collection.push(createSegmentLine(frontRight, topFrontRight, centerX, centerY, scale, {
      stroke: trimStroke,
      strokeWidth: 1.2,
    }));
    collection.push(createSegmentLine(topFrontLeft, topFrontRight, centerX, centerY, scale, {
      stroke: trimStroke,
      strokeWidth: 1.35,
    }));
    collection.push(createSegmentLine(topFrontLeft, apexFront, centerX, centerY, scale, {
      stroke: gableStroke,
      strokeWidth: 1.28,
    }));
    collection.push(createSegmentLine(apexFront, topFrontRight, centerX, centerY, scale, {
      stroke: gableStroke,
      strokeWidth: 1.28,
    }));
    collection.push(createSegmentLine(apexFront, apexBack, centerX, centerY, scale, {
      stroke: ridgeStroke,
      strokeWidth: 1.46,
    }));
    collection.push(createSegmentLine(topFrontLeft, backLeft, centerX, centerY, scale, {
      stroke: valleyStroke,
      strokeWidth: 1.36,
    }));
    collection.push(createSegmentLine(topFrontRight, backRight, centerX, centerY, scale, {
      stroke: valleyStroke,
      strokeWidth: 1.36,
    }));

    const windowInset = [
      quadPoint(frontWall, 0.26, 0.26),
      quadPoint(frontWall, 0.74, 0.26),
      quadPoint(frontWall, 0.74, 0.76),
      quadPoint(frontWall, 0.26, 0.76),
    ];
    collection.push(createFace(windowInset, "#a8cbe5", centerX, centerY, scale, {
      stroke: windowStroke,
      strokeWidth: 0.95,
      lightBoost: 0.08,
    }));
    collection.push(createSegmentLine(
      quadPoint(windowInset, 0.5, 0),
      quadPoint(windowInset, 0.5, 1),
      centerX,
      centerY,
      scale,
      {
        stroke: windowStroke,
        strokeWidth: 0.82,
      },
    ));
    collection.push(createSegmentLine(
      quadPoint(windowInset, 0, 0.52),
      quadPoint(windowInset, 1, 0.52),
      centerX,
      centerY,
      scale,
      {
        stroke: windowStroke,
        strokeWidth: 0.82,
      },
    ));
  });
}

function mergeCompoundAxisSegments(segments) {
  if (!segments.length) {
    return [];
  }

  const groups = new Map();

  segments.forEach((segment) => {
    const horizontal = Math.abs(segment.a.z - segment.b.z) <= Math.abs(segment.a.x - segment.b.x);
    const orientation = horizontal ? "x" : "z";
    const start = horizontal
      ? (segment.a.x <= segment.b.x ? segment.a : segment.b)
      : (segment.a.z <= segment.b.z ? segment.a : segment.b);
    const end = start === segment.a ? segment.b : segment.a;
    const axisValue = horizontal ? (start.z + end.z) / 2 : (start.x + end.x) / 2;
    const level = (start.y + end.y) / 2;
    const key = `${orientation}:${axisValue.toFixed(2)}:${level.toFixed(2)}`;
    const list = groups.get(key) || [];

    list.push({ ...segment, a: start, b: end, orientation });
    groups.set(key, list);
  });

  const merged = [];
  groups.forEach((group) => {
    const orientation = group[0].orientation;
    const sorted = group.sort((left, right) => (
      orientation === "x" ? left.a.x - right.a.x : left.a.z - right.a.z
    ));

    let current = sorted[0];
    for (let index = 1; index < sorted.length; index += 1) {
      const next = sorted[index];
      const gap = orientation === "x" ? next.a.x - current.b.x : next.a.z - current.b.z;

      if (gap <= 0.42) {
        current = {
          ...current,
          b: next.b,
        };
        continue;
      }

      merged.push({
        type: current.type,
        a: current.a,
        b: current.b,
      });
      current = next;
    }

    merged.push({
      type: current.type,
      a: current.a,
      b: current.b,
    });
  });

  return merged;
}

function getRectFootprintFromBounds(rect) {
  return [
    { x: rect.minX, z: rect.minZ },
    { x: rect.maxX, z: rect.minZ },
    { x: rect.maxX, z: rect.maxZ },
    { x: rect.minX, z: rect.maxZ },
  ];
}

function pushRectHipRoofModel(collection, rect, wallHeight, roofHeight, eave, roofColor, roofMaterial, centerX, centerY, scale) {
  const footprint = getRectFootprintFromBounds(rect);
  const roofFootprint = offsetPolygon(footprint, eave);
  const eaves = roofFootprint.map((point) => ({ x: point.x, y: wallHeight, z: point.z }));
  const [p0, p1, p2, p3] = eaves;
  const width = p1.x - p0.x;
  const depth = p3.z - p0.z;
  const roofLine = createBoundaryLine([...eaves, eaves[0]], centerX, centerY, scale, {
    stroke: "rgba(92, 58, 44, 0.7)",
    strokeWidth: 1.48,
  });
  roofLine.depth += 0.004;
  collection.push(roofLine);

  if (width >= depth) {
    const inset = depth / 2;
    const ridgeLeft = roofPeak(p0.x + inset, (p0.z + p3.z) / 2, wallHeight, roofHeight);
    const ridgeRight = roofPeak(p1.x - inset, (p0.z + p3.z) / 2, wallHeight, roofHeight);

    pushRoofPlane(collection, [p0, p1, ridgeRight, ridgeLeft], roofColor, centerX, centerY, scale, {
      roofMaterial,
      textureSlope: "x",
      stroke: "rgba(86, 58, 44, 0.06)",
      strokeWidth: 0.52,
      lightBoost: 0.06,
    });
    pushRoofPlane(collection, [p1, p2, ridgeRight], roofColor, centerX, centerY, scale, {
      roofMaterial,
      textureSlope: "z",
      stroke: "rgba(86, 58, 44, 0.06)",
      strokeWidth: 0.52,
      lightBoost: 0.06,
    });
    pushRoofPlane(collection, [p3, ridgeLeft, ridgeRight, p2], roofColor, centerX, centerY, scale, {
      roofMaterial,
      textureSlope: "x",
      stroke: "rgba(86, 58, 44, 0.06)",
      strokeWidth: 0.52,
      lightBoost: 0.06,
    });
    pushRoofPlane(collection, [p0, ridgeLeft, p3], roofColor, centerX, centerY, scale, {
      roofMaterial,
      textureSlope: "z",
      stroke: "rgba(86, 58, 44, 0.06)",
      strokeWidth: 0.52,
      lightBoost: 0.06,
    });

    [
      { a: ridgeLeft, b: ridgeRight, stroke: "rgba(88, 46, 34, 0.98)", strokeWidth: 1.9 },
      { a: p0, b: ridgeLeft, stroke: "rgba(110, 68, 48, 0.82)", strokeWidth: 1.42 },
      { a: p3, b: ridgeLeft, stroke: "rgba(110, 68, 48, 0.82)", strokeWidth: 1.42 },
      { a: p1, b: ridgeRight, stroke: "rgba(110, 68, 48, 0.82)", strokeWidth: 1.42 },
      { a: p2, b: ridgeRight, stroke: "rgba(110, 68, 48, 0.82)", strokeWidth: 1.42 },
    ].forEach((segment) => {
      collection.push(createSegmentLine(segment.a, segment.b, centerX, centerY, scale, segment));
    });
    return;
  }

  const inset = width / 2;
  const ridgeTop = roofPeak((p0.x + p1.x) / 2, p0.z + inset, wallHeight, roofHeight);
  const ridgeBottom = roofPeak((p0.x + p1.x) / 2, p3.z - inset, wallHeight, roofHeight);

  pushRoofPlane(collection, [p0, p1, ridgeTop], roofColor, centerX, centerY, scale, {
    roofMaterial,
    textureSlope: "z",
    stroke: "rgba(86, 58, 44, 0.06)",
    strokeWidth: 0.52,
    lightBoost: 0.06,
  });
  pushRoofPlane(collection, [p1, p2, ridgeBottom, ridgeTop], roofColor, centerX, centerY, scale, {
    roofMaterial,
    textureSlope: "x",
    stroke: "rgba(86, 58, 44, 0.06)",
    strokeWidth: 0.52,
    lightBoost: 0.06,
  });
  pushRoofPlane(collection, [p3, ridgeBottom, p2], roofColor, centerX, centerY, scale, {
    roofMaterial,
    textureSlope: "z",
    stroke: "rgba(86, 58, 44, 0.06)",
    strokeWidth: 0.52,
    lightBoost: 0.06,
  });
  pushRoofPlane(collection, [p0, ridgeTop, ridgeBottom, p3], roofColor, centerX, centerY, scale, {
    roofMaterial,
    textureSlope: "x",
    stroke: "rgba(86, 58, 44, 0.06)",
    strokeWidth: 0.52,
    lightBoost: 0.06,
  });

  [
    { a: ridgeTop, b: ridgeBottom, stroke: "rgba(88, 46, 34, 0.98)", strokeWidth: 1.9 },
    { a: p0, b: ridgeTop, stroke: "rgba(110, 68, 48, 0.82)", strokeWidth: 1.42 },
    { a: p1, b: ridgeTop, stroke: "rgba(110, 68, 48, 0.82)", strokeWidth: 1.42 },
    { a: p2, b: ridgeBottom, stroke: "rgba(110, 68, 48, 0.82)", strokeWidth: 1.42 },
    { a: p3, b: ridgeBottom, stroke: "rgba(110, 68, 48, 0.82)", strokeWidth: 1.42 },
  ].forEach((segment) => {
    collection.push(createSegmentLine(segment.a, segment.b, centerX, centerY, scale, segment));
  });
}

function pushCompoundRoofModel(collection, params, roofMetrics, roofColor, centerX, centerY, scale) {
  const roofOutline = params.shapeSpec.roofFootprint
    .concat([params.shapeSpec.roofFootprint[0]])
    .map((point) => ({
      x: point.x,
      y: params.wallHeight,
      z: point.z,
    }));

  if (!roofMetrics) {
    const outline = createBoundaryLine(roofOutline, centerX, centerY, scale, {
      stroke: "rgba(86, 56, 42, 0.82)",
      strokeWidth: 2.08,
    });
    outline.depth += 0.004;
    collection.push(outline);
    return;
  }

  roofMetrics.faces.forEach((face) => {
    pushCompoundRoofFacet(collection, face.points, roofColor, centerX, centerY, scale, params.roofMaterial);
  });

  const outline = createBoundaryLine(roofOutline, centerX, centerY, scale, {
    stroke: "rgba(86, 56, 42, 0.82)",
    strokeWidth: 2.08,
  });
  outline.depth += 0.004;
  collection.push(outline);

  const ridgeSegments = roofMetrics.segments.filter((segment) => segment.type === "ridge" && segment.length > 0.42);
  const valleySegments = roofMetrics.segments.filter((segment) => segment.type === "valley" && segment.length > 0.52);
  const hipSegments = roofMetrics.segments.filter((segment) => segment.type === "hip" && segment.length > 0.52);

  ridgeSegments.forEach((segment) => {
    collection.push(createSegmentLine(segment.a, segment.b, centerX, centerY, scale, {
      stroke: "rgba(88, 46, 34, 0.98)",
      strokeWidth: 1.88,
    }));
  });

  valleySegments.forEach((segment) => {
    collection.push(createSegmentLine(segment.a, segment.b, centerX, centerY, scale, {
      stroke: "rgba(118, 56, 40, 0.94)",
      strokeWidth: 1.54,
    }));
  });

  hipSegments.forEach((segment) => {
    collection.push(createSegmentLine(segment.a, segment.b, centerX, centerY, scale, {
      stroke: "rgba(110, 68, 48, 0.76)",
      strokeWidth: 1.24,
    }));
  });
}

function pushDrainageModel(collection, params, drainageEstimate, centerX, centerY, scale) {
  if (!drainageEstimate) {
    return;
  }

  const gutterStroke = "rgba(76, 86, 96, 0.98)";
  const gutterHighlight = "rgba(202, 212, 220, 0.92)";
  const pipeStroke = "rgba(74, 84, 94, 0.96)";
  const pipeHighlight = "rgba(210, 220, 228, 0.84)";
  const gutterDrop = 0.08;
  const pipeBottom = -0.08;

  drainageEstimate.metrics.eaveSegments.forEach((segment) => {
    const a = { x: segment.a.x, y: segment.a.y - gutterDrop, z: segment.a.z };
    const b = { x: segment.b.x, y: segment.b.y - gutterDrop, z: segment.b.z };

    collection.push(createSegmentLine(a, b, centerX, centerY, scale, {
      stroke: gutterStroke,
      strokeWidth: 3.9,
    }));
    collection.push(createSegmentLine(a, b, centerX, centerY, scale, {
      stroke: gutterHighlight,
      strokeWidth: 1.45,
    }));
  });

  drainageEstimate.metrics.downspoutAnchors.forEach((anchor) => {
    const top = {
      x: anchor.x,
      y: params.wallHeight - gutterDrop,
      z: anchor.z,
    };
    const bottom = {
      x: anchor.x,
      y: pipeBottom,
      z: anchor.z,
    };

    collection.push(createProjectedCircle(top, 2.3, centerX, centerY, scale, {
      fill: gutterStroke,
      stroke: gutterHighlight,
      strokeWidth: 0.9,
    }));
    collection.push(createSegmentLine(top, bottom, centerX, centerY, scale, {
      stroke: pipeStroke,
      strokeWidth: 3.3,
    }));
    collection.push(createSegmentLine(top, bottom, centerX, centerY, scale, {
      stroke: pipeHighlight,
      strokeWidth: 1.2,
    }));
  });
}

function pushExactRoofModel(collection, params, roofColor, centerX, centerY, scale) {
  const { houseType, shapeSpec, wallHeight, roofHeight, widthA, depthA, widthB, roofMaterial } = params;
  const eaveStroke = "rgba(82, 54, 40, 0.76)";
  const ridgeStroke = "rgba(86, 46, 34, 0.94)";
  const hipStroke = "rgba(114, 69, 52, 0.64)";
  const valleyStroke = "rgba(118, 58, 42, 0.82)";
  const rakeStroke = "rgba(104, 66, 50, 0.84)";
  const eaves = shapeSpec.roofFootprint.map((point) => ({ x: point.x, y: wallHeight, z: point.z }));

  const roofOutline = eaves
    .concat([eaves[0]]);
  collection.push(createBoundaryLine(roofOutline, centerX, centerY, scale, {
    stroke: eaveStroke,
    strokeWidth: 2.15,
  }));

  if (houseType === "rect-gable") {
    const [p0, p1, p2, p3] = eaves;
    const [f0, f1, f2, f3] = shapeSpec.footprint;
    const width = p1.x - p0.x;
    const depth = p3.z - p0.z;

    if (width >= depth) {
      const ridgeLeft = roofPeak(f0.x, 0, wallHeight, roofHeight);
      const ridgeRight = roofPeak(f1.x, 0, wallHeight, roofHeight);
      const leftApex = roofPeak(f0.x, 0, wallHeight, roofHeight);
      const rightApex = roofPeak(f1.x, 0, wallHeight, roofHeight);

      pushRoofPlane(collection, [p0, p1, ridgeRight, ridgeLeft], roofColor, centerX, centerY, scale, { roofMaterial, textureSlope: "x" });
      pushRoofPlane(collection, [p3, ridgeLeft, ridgeRight, p2], roofColor, centerX, centerY, scale, { roofMaterial, textureSlope: "x" });

      pushFrontonFace(collection, [
        { x: f0.x, y: wallHeight, z: f0.z },
        { x: f3.x, y: wallHeight, z: f3.z },
        leftApex,
      ], roofColor, centerX, centerY, scale);
      pushFrontonFace(collection, [
        { x: f1.x, y: wallHeight, z: f1.z },
        rightApex,
        { x: f2.x, y: wallHeight, z: f2.z },
      ], roofColor, centerX, centerY, scale);

      collection.push(createSegmentLine(ridgeLeft, ridgeRight, centerX, centerY, scale, {
        stroke: ridgeStroke,
        strokeWidth: 2.3,
      }));
      collection.push(createSegmentLine(p0, ridgeLeft, centerX, centerY, scale, {
        stroke: rakeStroke,
        strokeWidth: 1.6,
      }));
      collection.push(createSegmentLine(p3, ridgeLeft, centerX, centerY, scale, {
        stroke: rakeStroke,
        strokeWidth: 1.6,
      }));
      collection.push(createSegmentLine(p1, ridgeRight, centerX, centerY, scale, {
        stroke: rakeStroke,
        strokeWidth: 1.6,
      }));
      collection.push(createSegmentLine(p2, ridgeRight, centerX, centerY, scale, {
        stroke: rakeStroke,
        strokeWidth: 1.6,
      }));
      collection.push(createSegmentLine(
        { x: f0.x, y: wallHeight, z: f0.z },
        leftApex,
        centerX,
        centerY,
        scale,
        { stroke: eaveStroke, strokeWidth: 1.45 },
      ));
      collection.push(createSegmentLine(
        { x: f3.x, y: wallHeight, z: f3.z },
        leftApex,
        centerX,
        centerY,
        scale,
        { stroke: eaveStroke, strokeWidth: 1.45 },
      ));
      collection.push(createSegmentLine(
        { x: f1.x, y: wallHeight, z: f1.z },
        rightApex,
        centerX,
        centerY,
        scale,
        { stroke: eaveStroke, strokeWidth: 1.45 },
      ));
      collection.push(createSegmentLine(
        { x: f2.x, y: wallHeight, z: f2.z },
        rightApex,
        centerX,
        centerY,
        scale,
        { stroke: eaveStroke, strokeWidth: 1.45 },
      ));
    } else {
      const ridgeTop = roofPeak(0, f0.z, wallHeight, roofHeight);
      const ridgeBottom = roofPeak(0, f3.z, wallHeight, roofHeight);
      const topApex = roofPeak(0, f0.z, wallHeight, roofHeight);
      const bottomApex = roofPeak(0, f3.z, wallHeight, roofHeight);

      pushRoofPlane(collection, [p1, p2, ridgeBottom, ridgeTop], roofColor, centerX, centerY, scale, { roofMaterial, textureSlope: "z" });
      pushRoofPlane(collection, [p0, ridgeTop, ridgeBottom, p3], roofColor, centerX, centerY, scale, { roofMaterial, textureSlope: "z" });

      pushFrontonFace(collection, [
        { x: f0.x, y: wallHeight, z: f0.z },
        topApex,
        { x: f1.x, y: wallHeight, z: f1.z },
      ], roofColor, centerX, centerY, scale);
      pushFrontonFace(collection, [
        { x: f3.x, y: wallHeight, z: f3.z },
        { x: f2.x, y: wallHeight, z: f2.z },
        bottomApex,
      ], roofColor, centerX, centerY, scale);

      collection.push(createSegmentLine(ridgeTop, ridgeBottom, centerX, centerY, scale, {
        stroke: ridgeStroke,
        strokeWidth: 2.3,
      }));
      collection.push(createSegmentLine(p0, ridgeTop, centerX, centerY, scale, {
        stroke: rakeStroke,
        strokeWidth: 1.6,
      }));
      collection.push(createSegmentLine(p1, ridgeTop, centerX, centerY, scale, {
        stroke: rakeStroke,
        strokeWidth: 1.6,
      }));
      collection.push(createSegmentLine(p2, ridgeBottom, centerX, centerY, scale, {
        stroke: rakeStroke,
        strokeWidth: 1.6,
      }));
      collection.push(createSegmentLine(p3, ridgeBottom, centerX, centerY, scale, {
        stroke: rakeStroke,
        strokeWidth: 1.6,
      }));
      collection.push(createSegmentLine(
        { x: f0.x, y: wallHeight, z: f0.z },
        topApex,
        centerX,
        centerY,
        scale,
        { stroke: eaveStroke, strokeWidth: 1.45 },
      ));
      collection.push(createSegmentLine(
        { x: f1.x, y: wallHeight, z: f1.z },
        topApex,
        centerX,
        centerY,
        scale,
        { stroke: eaveStroke, strokeWidth: 1.45 },
      ));
      collection.push(createSegmentLine(
        { x: f3.x, y: wallHeight, z: f3.z },
        bottomApex,
        centerX,
        centerY,
        scale,
        { stroke: eaveStroke, strokeWidth: 1.45 },
      ));
      collection.push(createSegmentLine(
        { x: f2.x, y: wallHeight, z: f2.z },
        bottomApex,
        centerX,
        centerY,
        scale,
        { stroke: eaveStroke, strokeWidth: 1.45 },
      ));
    }

    return;
  }

  if (houseType === "rect-hip") {
    const [p0, p1, p2, p3] = eaves;
    const width = p1.x - p0.x;
    const depth = p3.z - p0.z;

    if (width >= depth) {
      const inset = depth / 2;
      const ridgeLeft = roofPeak(p0.x + inset, 0, wallHeight, roofHeight);
      const ridgeRight = roofPeak(p1.x - inset, 0, wallHeight, roofHeight);

      pushRoofPlane(collection, [p0, p1, ridgeRight, ridgeLeft], roofColor, centerX, centerY, scale, { roofMaterial, textureSlope: "x" });
      pushRoofPlane(collection, [p1, p2, ridgeRight], roofColor, centerX, centerY, scale, { roofMaterial, textureSlope: "z" });
      pushRoofPlane(collection, [p3, ridgeLeft, ridgeRight, p2], roofColor, centerX, centerY, scale, { roofMaterial, textureSlope: "x" });
      pushRoofPlane(collection, [p0, ridgeLeft, p3], roofColor, centerX, centerY, scale, { roofMaterial, textureSlope: "z" });

      collection.push(createSegmentLine(ridgeLeft, ridgeRight, centerX, centerY, scale, {
        stroke: ridgeStroke,
        strokeWidth: 2.35,
      }));
      collection.push(createSegmentLine(p0, ridgeLeft, centerX, centerY, scale, {
        stroke: hipStroke,
        strokeWidth: 1.58,
      }));
      collection.push(createSegmentLine(p3, ridgeLeft, centerX, centerY, scale, {
        stroke: hipStroke,
        strokeWidth: 1.58,
      }));
      collection.push(createSegmentLine(p1, ridgeRight, centerX, centerY, scale, {
        stroke: hipStroke,
        strokeWidth: 1.58,
      }));
      collection.push(createSegmentLine(p2, ridgeRight, centerX, centerY, scale, {
        stroke: hipStroke,
        strokeWidth: 1.58,
      }));
    } else {
      const inset = width / 2;
      const ridgeTop = roofPeak(0, p0.z + inset, wallHeight, roofHeight);
      const ridgeBottom = roofPeak(0, p3.z - inset, wallHeight, roofHeight);

      pushRoofPlane(collection, [p0, p1, ridgeTop], roofColor, centerX, centerY, scale, { roofMaterial, textureSlope: "z" });
      pushRoofPlane(collection, [p1, p2, ridgeBottom, ridgeTop], roofColor, centerX, centerY, scale, { roofMaterial, textureSlope: "x" });
      pushRoofPlane(collection, [p3, ridgeBottom, p2], roofColor, centerX, centerY, scale, { roofMaterial, textureSlope: "z" });
      pushRoofPlane(collection, [p0, ridgeTop, ridgeBottom, p3], roofColor, centerX, centerY, scale, { roofMaterial, textureSlope: "x" });

      collection.push(createSegmentLine(ridgeTop, ridgeBottom, centerX, centerY, scale, {
        stroke: ridgeStroke,
        strokeWidth: 2.35,
      }));
      collection.push(createSegmentLine(p0, ridgeTop, centerX, centerY, scale, {
        stroke: hipStroke,
        strokeWidth: 1.58,
      }));
      collection.push(createSegmentLine(p1, ridgeTop, centerX, centerY, scale, {
        stroke: hipStroke,
        strokeWidth: 1.58,
      }));
      collection.push(createSegmentLine(p2, ridgeBottom, centerX, centerY, scale, {
        stroke: hipStroke,
        strokeWidth: 1.58,
      }));
      collection.push(createSegmentLine(p3, ridgeBottom, centerX, centerY, scale, {
        stroke: hipStroke,
        strokeWidth: 1.58,
      }));
    }

    return;
  }

  if (houseType === "l-shape") {
    const [p0, p1, p2, p3, p4, p5] = eaves;
    const topDepth = p2.z - p0.z;
    const legWidth = p3.x - p5.x;
    const junction = roofPeak((p5.x + p3.x) / 2, (p0.z + p2.z) / 2, wallHeight, roofHeight);
    const topRidgeEnd = roofPeak(Math.max(junction.x, p1.x - topDepth / 2), junction.z, wallHeight, roofHeight);
    const legRidgeEnd = roofPeak(junction.x, Math.max(junction.z, p4.z - legWidth / 2), wallHeight, roofHeight);

    pushRoofPlane(collection, [p0, p1, topRidgeEnd, junction], roofColor, centerX, centerY, scale, { roofMaterial, textureSlope: "x" });
    pushRoofPlane(collection, [p1, p2, topRidgeEnd], roofColor, centerX, centerY, scale, { roofMaterial, textureSlope: "z" });
    pushRoofPlane(collection, [p2, p3, junction, topRidgeEnd], roofColor, centerX, centerY, scale, { roofMaterial, textureSlope: "x" });
    pushRoofPlane(collection, [p3, p4, legRidgeEnd, junction], roofColor, centerX, centerY, scale, { roofMaterial, textureSlope: "z" });
    pushRoofPlane(collection, [p5, legRidgeEnd, p4], roofColor, centerX, centerY, scale, { roofMaterial, textureSlope: "x" });
    pushRoofPlane(collection, [p0, junction, legRidgeEnd, p5], roofColor, centerX, centerY, scale, { roofMaterial, textureSlope: "z" });

    collection.push(createSegmentLine(p3, junction, centerX, centerY, scale, {
      stroke: valleyStroke,
      strokeWidth: 2.05,
    }));
    collection.push(createSegmentLine(junction, topRidgeEnd, centerX, centerY, scale, {
      stroke: ridgeStroke,
      strokeWidth: 2.25,
    }));
    collection.push(createSegmentLine(junction, legRidgeEnd, centerX, centerY, scale, {
      stroke: ridgeStroke,
      strokeWidth: 2.25,
    }));
    collection.push(createSegmentLine(p1, topRidgeEnd, centerX, centerY, scale, {
      stroke: hipStroke,
      strokeWidth: 1.56,
    }));
    collection.push(createSegmentLine(p2, topRidgeEnd, centerX, centerY, scale, {
      stroke: hipStroke,
      strokeWidth: 1.56,
    }));
    collection.push(createSegmentLine(p4, legRidgeEnd, centerX, centerY, scale, {
      stroke: hipStroke,
      strokeWidth: 1.56,
    }));
    collection.push(createSegmentLine(p0, junction, centerX, centerY, scale, {
      stroke: hipStroke,
      strokeWidth: 1.56,
    }));
    collection.push(createSegmentLine(p5, legRidgeEnd, centerX, centerY, scale, {
      stroke: hipStroke,
      strokeWidth: 1.56,
    }));

    return;
  }

  if (houseType === "t-shape") {
    const [p0, p1, p2, p3, p4, p5, p6, p7] = eaves;
    const topDepth = p2.z - p0.z;
    const stemWidth = p3.x - p6.x;
    const ridgeLeft = roofPeak(p0.x + topDepth / 2, (p0.z + p2.z) / 2, wallHeight, roofHeight);
    const ridgeRight = roofPeak(p1.x - topDepth / 2, (p0.z + p2.z) / 2, wallHeight, roofHeight);
    const ridgeJunction = roofPeak((p6.x + p3.x) / 2, (p0.z + p2.z) / 2, wallHeight, roofHeight);
    const stemRidgeEnd = roofPeak(ridgeJunction.x, Math.max(ridgeJunction.z, p4.z - stemWidth / 2), wallHeight, roofHeight);

    pushRoofPlane(collection, [p0, p1, ridgeRight, ridgeLeft], roofColor, centerX, centerY, scale, { roofMaterial, textureSlope: "x" });
    pushRoofPlane(collection, [p1, p2, ridgeRight], roofColor, centerX, centerY, scale, { roofMaterial, textureSlope: "z" });
    pushRoofPlane(collection, [p7, p0, ridgeLeft], roofColor, centerX, centerY, scale, { roofMaterial, textureSlope: "z" });
    pushRoofPlane(collection, [p2, p3, ridgeJunction, ridgeRight], roofColor, centerX, centerY, scale, { roofMaterial, textureSlope: "x" });
    pushRoofPlane(collection, [p7, ridgeLeft, ridgeJunction, p6], roofColor, centerX, centerY, scale, { roofMaterial, textureSlope: "x" });
    pushRoofPlane(collection, [p3, p4, stemRidgeEnd, ridgeJunction], roofColor, centerX, centerY, scale, { roofMaterial, textureSlope: "z" });
    pushRoofPlane(collection, [p6, ridgeJunction, stemRidgeEnd, p5], roofColor, centerX, centerY, scale, { roofMaterial, textureSlope: "z" });
    pushRoofPlane(collection, [p5, stemRidgeEnd, p4], roofColor, centerX, centerY, scale, { roofMaterial, textureSlope: "x" });

    collection.push(createSegmentLine(ridgeLeft, ridgeRight, centerX, centerY, scale, {
      stroke: ridgeStroke,
      strokeWidth: 2.2,
    }));
    collection.push(createSegmentLine(ridgeJunction, stemRidgeEnd, centerX, centerY, scale, {
      stroke: ridgeStroke,
      strokeWidth: 2.2,
    }));
    collection.push(createSegmentLine(p3, ridgeJunction, centerX, centerY, scale, {
      stroke: valleyStroke,
      strokeWidth: 2,
    }));
    collection.push(createSegmentLine(p6, ridgeJunction, centerX, centerY, scale, {
      stroke: valleyStroke,
      strokeWidth: 2,
    }));
    collection.push(createSegmentLine(p0, ridgeLeft, centerX, centerY, scale, {
      stroke: hipStroke,
      strokeWidth: 1.56,
    }));
    collection.push(createSegmentLine(p1, ridgeRight, centerX, centerY, scale, {
      stroke: hipStroke,
      strokeWidth: 1.56,
    }));
    collection.push(createSegmentLine(p2, ridgeRight, centerX, centerY, scale, {
      stroke: hipStroke,
      strokeWidth: 1.56,
    }));
    collection.push(createSegmentLine(p7, ridgeLeft, centerX, centerY, scale, {
      stroke: hipStroke,
      strokeWidth: 1.56,
    }));
    collection.push(createSegmentLine(p4, stemRidgeEnd, centerX, centerY, scale, {
      stroke: hipStroke,
      strokeWidth: 1.56,
    }));
    collection.push(createSegmentLine(p5, stemRidgeEnd, centerX, centerY, scale, {
      stroke: hipStroke,
      strokeWidth: 1.56,
    }));
  }
}

function pushWindows(collection, params, centerX, centerY, scale) {
  const { houseType, widthA, depthA, widthB, depthB, wallHeight } = params;
  if (houseType === "compound") {
    return;
  }

  const stemLeft = -widthA / 2 + (widthA - widthB) / 2;
  const stemRight = stemLeft + widthB;
  const wingRight = -widthA / 2 + widthB;
  let windows;

  if (houseType === "rect-hip" || houseType === "rect-gable") {
    windows = [
      [
        { x: -widthA / 2 + widthA * 0.2, y: wallHeight * 0.42, z: depthA / 2 + 0.01 },
        { x: -widthA / 2 + widthA * 0.2 + 1.05, y: wallHeight * 0.42, z: depthA / 2 + 0.01 },
        { x: -widthA / 2 + widthA * 0.2 + 1.05, y: wallHeight * 0.77, z: depthA / 2 + 0.01 },
        { x: -widthA / 2 + widthA * 0.2, y: wallHeight * 0.77, z: depthA / 2 + 0.01 },
      ],
      [
        { x: -widthA / 2 + widthA * 0.62, y: wallHeight * 0.42, z: depthA / 2 + 0.01 },
        { x: -widthA / 2 + widthA * 0.62 + 1.05, y: wallHeight * 0.42, z: depthA / 2 + 0.01 },
        { x: -widthA / 2 + widthA * 0.62 + 1.05, y: wallHeight * 0.77, z: depthA / 2 + 0.01 },
        { x: -widthA / 2 + widthA * 0.62, y: wallHeight * 0.77, z: depthA / 2 + 0.01 },
      ],
      [
        { x: widthA / 2 + 0.01, y: wallHeight * 0.42, z: -depthA / 2 + depthA * 0.24 },
        { x: widthA / 2 + 0.01, y: wallHeight * 0.42, z: -depthA / 2 + depthA * 0.24 + 1.05 },
        { x: widthA / 2 + 0.01, y: wallHeight * 0.77, z: -depthA / 2 + depthA * 0.24 + 1.05 },
        { x: widthA / 2 + 0.01, y: wallHeight * 0.77, z: -depthA / 2 + depthA * 0.24 },
      ],
      [
        { x: -widthA / 2 + 0.01, y: wallHeight * 0.42, z: -depthA / 2 + depthA * 0.58 },
        { x: -widthA / 2 + 0.01, y: wallHeight * 0.42, z: -depthA / 2 + depthA * 0.58 + 1.05 },
        { x: -widthA / 2 + 0.01, y: wallHeight * 0.77, z: -depthA / 2 + depthA * 0.58 + 1.05 },
        { x: -widthA / 2 + 0.01, y: wallHeight * 0.77, z: -depthA / 2 + depthA * 0.58 },
      ],
    ];
  } else if (houseType === "t-shape") {
    windows = [
      [
        { x: -widthA / 2 + widthA * 0.18, y: wallHeight * 0.42, z: -depthB / 2 + depthA + 0.01 },
        { x: -widthA / 2 + widthA * 0.18 + 1.05, y: wallHeight * 0.42, z: -depthB / 2 + depthA + 0.01 },
        { x: -widthA / 2 + widthA * 0.18 + 1.05, y: wallHeight * 0.77, z: -depthB / 2 + depthA + 0.01 },
        { x: -widthA / 2 + widthA * 0.18, y: wallHeight * 0.77, z: -depthB / 2 + depthA + 0.01 },
      ],
      [
        { x: -widthA / 2 + widthA * 0.64, y: wallHeight * 0.42, z: -depthB / 2 + depthA + 0.01 },
        { x: -widthA / 2 + widthA * 0.64 + 1.05, y: wallHeight * 0.42, z: -depthB / 2 + depthA + 0.01 },
        { x: -widthA / 2 + widthA * 0.64 + 1.05, y: wallHeight * 0.77, z: -depthB / 2 + depthA + 0.01 },
        { x: -widthA / 2 + widthA * 0.64, y: wallHeight * 0.77, z: -depthB / 2 + depthA + 0.01 },
      ],
      [
        { x: stemLeft + widthB * 0.22, y: wallHeight * 0.42, z: depthB / 2 + 0.01 },
        { x: stemLeft + widthB * 0.22 + 1.05, y: wallHeight * 0.42, z: depthB / 2 + 0.01 },
        { x: stemLeft + widthB * 0.22 + 1.05, y: wallHeight * 0.77, z: depthB / 2 + 0.01 },
        { x: stemLeft + widthB * 0.22, y: wallHeight * 0.77, z: depthB / 2 + 0.01 },
      ],
      [
        { x: widthA / 2 + 0.01, y: wallHeight * 0.42, z: -depthB / 2 + depthA * 0.28 },
        { x: widthA / 2 + 0.01, y: wallHeight * 0.42, z: -depthB / 2 + depthA * 0.28 + 1.05 },
        { x: widthA / 2 + 0.01, y: wallHeight * 0.77, z: -depthB / 2 + depthA * 0.28 + 1.05 },
        { x: widthA / 2 + 0.01, y: wallHeight * 0.77, z: -depthB / 2 + depthA * 0.28 },
      ],
    ];
  } else {
    windows = [
      [
        { x: -widthA / 2 + widthA * 0.18, y: wallHeight * 0.42, z: -depthB / 2 + depthA + 0.01 },
        { x: -widthA / 2 + widthA * 0.18 + 1.05, y: wallHeight * 0.42, z: -depthB / 2 + depthA + 0.01 },
        { x: -widthA / 2 + widthA * 0.18 + 1.05, y: wallHeight * 0.77, z: -depthB / 2 + depthA + 0.01 },
        { x: -widthA / 2 + widthA * 0.18, y: wallHeight * 0.77, z: -depthB / 2 + depthA + 0.01 },
      ],
      [
        { x: -widthA / 2 + widthA * 0.58, y: wallHeight * 0.42, z: -depthB / 2 + depthA + 0.01 },
        { x: -widthA / 2 + widthA * 0.58 + 1.05, y: wallHeight * 0.42, z: -depthB / 2 + depthA + 0.01 },
        { x: -widthA / 2 + widthA * 0.58 + 1.05, y: wallHeight * 0.77, z: -depthB / 2 + depthA + 0.01 },
        { x: -widthA / 2 + widthA * 0.58, y: wallHeight * 0.77, z: -depthB / 2 + depthA + 0.01 },
      ],
      [
        { x: -widthA / 2 + 0.01, y: wallHeight * 0.42, z: depthB / 2 - 1.7 },
        { x: -widthA / 2 + 0.01, y: wallHeight * 0.42, z: depthB / 2 - 0.65 },
        { x: -widthA / 2 + 0.01, y: wallHeight * 0.77, z: depthB / 2 - 0.65 },
        { x: -widthA / 2 + 0.01, y: wallHeight * 0.77, z: depthB / 2 - 1.7 },
      ],
      [
        { x: -widthA / 2 + widthB * 0.28, y: wallHeight * 0.42, z: depthB / 2 + 0.01 },
        { x: -widthA / 2 + widthB * 0.28 + 1.05, y: wallHeight * 0.42, z: depthB / 2 + 0.01 },
        { x: -widthA / 2 + widthB * 0.28 + 1.05, y: wallHeight * 0.77, z: depthB / 2 + 0.01 },
        { x: -widthA / 2 + widthB * 0.28, y: wallHeight * 0.77, z: depthB / 2 + 0.01 },
      ],
      [
        { x: widthA / 2 + 0.01, y: wallHeight * 0.42, z: -depthB / 2 + depthA * 0.34 },
        { x: widthA / 2 + 0.01, y: wallHeight * 0.42, z: -depthB / 2 + depthA * 0.34 + 1.05 },
        { x: widthA / 2 + 0.01, y: wallHeight * 0.77, z: -depthB / 2 + depthA * 0.34 + 1.05 },
        { x: widthA / 2 + 0.01, y: wallHeight * 0.77, z: -depthB / 2 + depthA * 0.34 },
      ],
      [
        { x: wingRight + 0.01, y: wallHeight * 0.42, z: -depthB / 2 + depthA + (depthB - depthA) * 0.22 },
        { x: wingRight + 0.01, y: wallHeight * 0.42, z: -depthB / 2 + depthA + (depthB - depthA) * 0.22 + 1.05 },
        { x: wingRight + 0.01, y: wallHeight * 0.77, z: -depthB / 2 + depthA + (depthB - depthA) * 0.22 + 1.05 },
        { x: wingRight + 0.01, y: wallHeight * 0.77, z: -depthB / 2 + depthA + (depthB - depthA) * 0.22 },
      ],
    ];
  }

  windows.forEach((points) => {
    collection.push(createFace(points, "#a8cbe5", centerX, centerY, scale, {
      fill: "#a8cbe5",
      stroke: "rgba(247, 250, 252, 0.96)",
      strokeWidth: 1.1,
    }));
  });
}

function renderGround(centerX, centerY, scale) {
  const group = document.createElementNS(SVG_NS, "g");
  const size = 22;

  const planePoints = [
    { x: -size, y: 0, z: -size },
    { x: size, y: 0, z: -size },
    { x: size, y: 0, z: size },
    { x: -size, y: 0, z: size },
  ].map((point) => projectPoint(point, centerX, centerY, scale));

  group.append(makePolygonElement(planePoints, {
    fill: "rgba(191, 209, 182, 0.72)",
    stroke: "rgba(134, 157, 126, 0.22)",
    strokeWidth: 1,
  }));

  for (let i = -size; i <= size; i += 1) {
    const lineA = projectPoint({ x: -size, y: 0, z: i }, centerX, centerY, scale);
    const lineB = projectPoint({ x: size, y: 0, z: i }, centerX, centerY, scale);
    group.append(makeLineElement(lineA, lineB, {
      stroke: "rgba(103, 129, 94, 0.16)",
      strokeWidth: 1,
    }));
  }

  for (let i = -size; i <= size; i += 1) {
    const lineA = projectPoint({ x: i, y: 0, z: -size }, centerX, centerY, scale);
    const lineB = projectPoint({ x: i, y: 0, z: size }, centerX, centerY, scale);
    group.append(makeLineElement(lineA, lineB, {
      stroke: "rgba(103, 129, 94, 0.16)",
      strokeWidth: 1,
    }));
  }

  return group;
}

function buildHouse() {
  const houseType = controlsMap.houseType.value;
  const widthA = Number(controlsMap.widthA.value);
  const depthA = Number(controlsMap.depthA.value);
  const isCompound = isCompoundHouseType(houseType);
  const widthBRaw = Number(controlsMap.widthB.value);
  const depthBRaw = Number(controlsMap.depthB.value);
  const widthB = isCompound ? widthBRaw : Math.min(widthBRaw, widthA - 1);
  const depthB = isCompound ? depthBRaw : Math.max(depthBRaw, depthA + 1.5);
  const widthC = Number(controlsMap.widthC.value);
  const depthC = Number(controlsMap.depthC.value);
  const bodyBEnabled = isCompound ? controlsMap.bodyBEnabled.checked : !isRectHouseType(houseType);
  const bodyCEnabled = isCompound ? controlsMap.bodyCEnabled.checked : false;
  const bodyBSide = controlsMap.bodyBSide.value;
  const bodyBAlign = controlsMap.bodyBAlign.value;
  const bodyCSide = controlsMap.bodyCSide.value;
  const bodyCAlign = controlsMap.bodyCAlign.value;
  const wallHeight = Number(controlsMap.wallHeight.value);
  const roofHeight = Number(controlsMap.roofHeight.value);
  const eave = Number(controlsMap.eave.value);
  const lucarneCount = Number(controlsMap.lucarneCount.value);

  if (houseType !== "rect-hip" && houseType !== "rect-gable" && !isCompound) {
    controlsMap.widthB.value = String(widthB);
    controlsMap.depthB.value = String(depthB);
  }
  syncOutputs();

  const wallColor = controlsMap.wallColor.value;
  const roofColor = controlsMap.roofColor.value;
  const roofMaterial = controlsMap.roofMaterial.value;
  const baseColor = controlsMap.baseColor.value;
  const shapeSpec = getShapeSpec(houseType, widthA, depthA, widthB, depthB, eave, {
    widthC,
    depthC,
    bodyBEnabled,
    bodyBSide,
    bodyBAlign,
    bodyCEnabled,
    bodyCSide,
    bodyCAlign,
  });

  const area = Math.abs(polygonSignedArea2D(shapeSpec.footprint));
  const volume = area * wallHeight;
  const geometryInput = {
    houseType,
    widthA,
    depthA,
    widthB,
    depthB,
    widthC,
    depthC,
    bodyBEnabled,
    bodyBSide,
    bodyBAlign,
    bodyCEnabled,
    bodyCSide,
    bodyCAlign,
    wallHeight,
    roofHeight,
    eave,
  };
  const roofMetrics = typeof RoofCalculator !== "undefined"
    ? RoofCalculator.calculateRoofMetrics(geometryInput)
    : null;
  const priceEstimate = calculatePriceEstimate(roofMetrics);
  const drainageEstimate = controlsMap.drainageEnabled.checked
    ? buildDrainageEstimate(geometryInput, roofMetrics, priceEstimate)
    : null;
  outputs.footprint.textContent = `${area.toFixed(1)} mp`;
  outputs.volume.textContent = `${volume.toFixed(1)} mc`;
  outputs.roofArea.textContent = roofMetrics
    ? `${roofMetrics.totals.roofArea.toFixed(1)} mp`
    : "0 mp";
  updateEstimateOutputs(priceEstimate);
  updateDrainageOutputs(drainageEstimate, priceEstimate);

  const centerX = 440;
  const centerY = 352;
  const scale = 25 * state.scale;

  houseSvg.innerHTML = "";
  houseSvg.append(renderGround(centerX, centerY + 26, scale));

  const footprint = shapeSpec.footprint;
  const faces = [];

  pushBaseFaces(faces, footprint, 0.18, baseColor, centerX, centerY, scale);
  pushWallFaces(faces, footprint, wallHeight, wallColor, centerX, centerY, scale);
  pushWindows(faces, { houseType, widthA, depthA, widthB, depthB, wallHeight }, centerX, centerY, scale);
  pushWallGuides(faces, footprint, wallHeight, centerX, centerY, scale);
  if (houseType === "compound") {
    pushCompoundRoofModel(faces, {
      houseType,
      shapeSpec,
      wallHeight,
      roofHeight,
      eave,
      widthA,
      depthA,
      widthB,
      depthB,
      roofMaterial,
    }, roofMetrics, roofColor, centerX, centerY, scale);
  } else {
    pushExactRoofModel(faces, {
      houseType,
      shapeSpec,
      wallHeight,
      roofHeight,
      widthA,
      depthA,
      widthB,
      roofMaterial,
    }, roofColor, centerX, centerY, scale);
  }
  if (houseType !== "compound") {
    pushLucarneModel(faces, roofMetrics, wallColor, roofColor, roofMaterial, lucarneCount, centerX, centerY, scale);
  }
  if (controlsMap.drainageEnabled.checked && drainageEstimate) {
    pushDrainageModel(faces, geometryInput, drainageEstimate, centerX, centerY, scale);
  }

  faces.sort((a, b) => a.depth - b.depth);
  faces.forEach((face) => houseSvg.append(face.element));
}

Object.entries(controlsMap).forEach(([key, element]) => {
  element.addEventListener("input", () => {
    if (key === "roofQuality") {
      syncRoofSelection("quality");
    } else if (key === "roofMaterial") {
      syncRoofSelection("material");
    }

    buildHouse();
  });
});

viewer.addEventListener("pointerdown", (event) => {
  state.activePointers.set(event.pointerId, {
    x: event.clientX,
    y: event.clientY,
  });
  viewer.setPointerCapture(event.pointerId);

  if (state.activePointers.size === 1) {
    state.drag = true;
    state.lastX = event.clientX;
    state.lastY = event.clientY;
    state.pinchDistance = 0;
    return;
  }

  if (state.activePointers.size === 2) {
    state.drag = false;
    state.pinchDistance = getPointerDistance(Array.from(state.activePointers.values()));
  }
});

viewer.addEventListener("pointermove", (event) => {
  if (!state.activePointers.has(event.pointerId)) {
    return;
  }

  state.activePointers.set(event.pointerId, {
    x: event.clientX,
    y: event.clientY,
  });

  if (state.activePointers.size >= 2) {
    const nextDistance = getPointerDistance(Array.from(state.activePointers.values()));

    if (state.pinchDistance > 0 && nextDistance > 0) {
      const nextScale = clamp(state.scale * (nextDistance / state.pinchDistance), 0.75, 1.45);

      if (Math.abs(nextScale - state.scale) > 0.001) {
        state.scale = nextScale;
        buildHouse();
      }
    }

    state.pinchDistance = nextDistance;
    return;
  }

  if (!state.drag) {
    return;
  }

  const deltaX = event.clientX - state.lastX;
  const deltaY = event.clientY - state.lastY;
  state.lastX = event.clientX;
  state.lastY = event.clientY;
  state.yaw = clamp(state.yaw + deltaX * 0.28, -90, 45);
  state.pitch = clamp(state.pitch + deltaY * 0.18, 18, 56);
  buildHouse();
});

function releaseViewerPointer(event) {
  state.activePointers.delete(event.pointerId);

  if (viewer.hasPointerCapture(event.pointerId)) {
    viewer.releasePointerCapture(event.pointerId);
  }

  state.drag = false;
  state.pinchDistance = 0;

  if (state.activePointers.size === 1) {
    const [remainingPointer] = state.activePointers.values();
    state.drag = true;
    state.lastX = remainingPointer.x;
    state.lastY = remainingPointer.y;
  }
}

viewer.addEventListener("pointerup", releaseViewerPointer);
viewer.addEventListener("pointercancel", releaseViewerPointer);

viewer.addEventListener("wheel", (event) => {
  event.preventDefault();
  state.scale = clamp(state.scale - event.deltaY * 0.001, 0.75, 1.45);
  buildHouse();
}, { passive: false });

syncRoofSelection("quality");
syncOutputs();
buildHouse();
