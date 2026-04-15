(function setupRoofCalculator(root, factory) {
  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.RoofCalculator = api;
}(typeof globalThis !== "undefined" ? globalThis : this, function buildRoofCalculator() {
  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function normalize2D(vector) {
    const length = Math.hypot(vector.x, vector.z) || 1;
    return {
      x: vector.x / length,
      z: vector.z / length,
    };
  }

  function subtract(a, b) {
    return {
      x: a.x - b.x,
      y: a.y - b.y,
      z: a.z - b.z,
    };
  }

  function cross(a, b) {
    return {
      x: a.y * b.z - a.z * b.y,
      y: a.z * b.x - a.x * b.z,
      z: a.x * b.y - a.y * b.x,
    };
  }

  function vectorLength(vector) {
    return Math.sqrt(vector.x * vector.x + vector.y * vector.y + vector.z * vector.z);
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

  function offsetPolygon(polygon, offset) {
    if (offset <= 0) {
      return polygon.map((point) => ({ x: point.x, z: point.z }));
    }

    return polygon.map((current, index) => {
      const previous = polygon[(index - 1 + polygon.length) % polygon.length];
      const next = polygon[(index + 1) % polygon.length];

      const dirPrev = normalize2D({ x: current.x - previous.x, z: current.z - previous.z });
      const dirNext = normalize2D({ x: next.x - current.x, z: next.z - current.z });

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

  function getRectFootprint(widthA, depthA) {
    const xOffset = widthA / 2;
    const zOffset = depthA / 2;

    return [
      { x: -xOffset, z: -zOffset },
      { x: widthA - xOffset, z: -zOffset },
      { x: widthA - xOffset, z: depthA - zOffset },
      { x: -xOffset, z: depthA - zOffset },
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

  function getLFootprint(widthA, depthA, widthB, depthB) {
    const xOffset = widthA / 2;
    const zOffset = depthB / 2;

    return [
      { x: -xOffset, z: -zOffset },
      { x: widthA - xOffset, z: -zOffset },
      { x: widthA - xOffset, z: depthA - zOffset },
      { x: widthB - xOffset, z: depthA - zOffset },
      { x: widthB - xOffset, z: depthB - zOffset },
      { x: -xOffset, z: depthB - zOffset },
    ];
  }

  function getTFootprint(widthA, depthA, widthB, depthB) {
    const xOffset = widthA / 2;
    const zOffset = depthB / 2;
    const stemLeft = (widthA - widthB) / 2;
    const stemRight = stemLeft + widthB;

    return [
      { x: -xOffset, z: -zOffset },
      { x: widthA - xOffset, z: -zOffset },
      { x: widthA - xOffset, z: depthA - zOffset },
      { x: stemRight - xOffset, z: depthA - zOffset },
      { x: stemRight - xOffset, z: depthB - zOffset },
      { x: stemLeft - xOffset, z: depthB - zOffset },
      { x: stemLeft - xOffset, z: depthA - zOffset },
      { x: -xOffset, z: depthA - zOffset },
    ];
  }

  function getShapeSpec(
    houseType,
    widthA,
    depthA,
    widthB,
    depthB,
    eave,
    widthC,
    depthC,
    bodyBEnabled,
    bodyBSide,
    bodyBAlign,
    bodyCEnabled,
    bodyCSide,
    bodyCAlign,
  ) {
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

      return {
        footprint,
        roofFootprint,
        roofBounds: polygonBounds(roofFootprint),
      };
    }

    if (houseType === "rect-hip") {
      const footprint = getRectFootprint(widthA, depthA);
      const roofFootprint = offsetPolygon(footprint, eave);
      return {
        footprint,
        roofFootprint,
        roofBounds: polygonBounds(roofFootprint),
      };
    }

    if (houseType === "compound") {
      const rectangles = getCompoundRectangles({
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
      });
      const footprint = buildCompoundFootprint(rectangles);
      const roofFootprint = offsetPolygon(footprint, eave);
      return {
        footprint,
        roofFootprint,
        roofBounds: polygonBounds(roofFootprint),
        rectangles,
      };
    }

    const footprint = houseType === "t-shape"
      ? getTFootprint(widthA, depthA, widthB, depthB)
      : getLFootprint(widthA, depthA, widthB, depthB);
    const roofFootprint = offsetPolygon(footprint, eave);

    return {
      footprint,
      roofFootprint,
      roofBounds: polygonBounds(roofFootprint),
    };
  }

  function roofPeak(x, z, wallHeight, roofHeight) {
    return {
      x,
      y: wallHeight + roofHeight,
      z,
    };
  }

  function normalizeParams(params) {
    const widthA = Number(params.widthA);
    const depthA = Number(params.depthA);
    const widthB = Math.min(Number(params.widthB ?? 7), widthA - 1);
    const depthB = Math.max(Number(params.depthB ?? 14), depthA + 1.5);

    return {
      houseType: params.houseType || "rect-hip",
      widthA,
      depthA,
      widthB,
      depthB,
      widthC: Number(params.widthC ?? 6),
      depthC: Number(params.depthC ?? 8),
      bodyBEnabled: params.bodyBEnabled !== undefined ? Boolean(params.bodyBEnabled) : true,
      bodyBSide: params.bodyBSide || "left",
      bodyBAlign: params.bodyBAlign || "start",
      bodyCEnabled: Boolean(params.bodyCEnabled),
      bodyCSide: params.bodyCSide || "back",
      bodyCAlign: params.bodyCAlign || "end",
      wallHeight: Number(params.wallHeight),
      roofHeight: Number(params.roofHeight),
      eave: Number(params.eave),
    };
  }

  function polygonArea3D(points) {
    if (points.length < 3) {
      return 0;
    }

    let area = 0;
    for (let index = 1; index < points.length - 1; index += 1) {
      const a = subtract(points[index], points[0]);
      const b = subtract(points[index + 1], points[0]);
      area += vectorLength(cross(a, b)) * 0.5;
    }

    return area;
  }

  function segmentLength3D(a, b) {
    return Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
  }

  function addOutlineSegments(segments, points, type) {
    for (let index = 0; index < points.length; index += 1) {
      segments.push({
        type,
        a: points[index],
        b: points[(index + 1) % points.length],
      });
    }
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

  function createRoofHeightGetter(shapeSpec) {
    const roofSegments = shapeSpec.roofFootprint.map((point, index) => ({
      index,
      a: point,
      b: shapeSpec.roofFootprint[(index + 1) % shapeSpec.roofFootprint.length],
    }));
    const bounds = shapeSpec.roofBounds;
    let maxDistance = 0.01;
    const step = 0.18;

    for (let x = bounds.minX; x <= bounds.maxX; x += step) {
      for (let z = bounds.minZ; z <= bounds.maxZ; z += step) {
        if (!pointInPolygon({ x, z }, shapeSpec.roofFootprint)) {
          continue;
        }

        const distance = Math.min(...roofSegments.map((segment) => distanceToSegment2D({ x, z }, segment.a, segment.b)));
        if (distance > maxDistance) {
          maxDistance = distance;
        }
      }
    }

    return {
      roofSegments,
      maxDistance,
      getHeight(x, z, roofHeight) {
        if (!pointInPolygon({ x, z }, shapeSpec.roofFootprint)) {
          return 0;
        }

        const distance = Math.min(...roofSegments.map((segment) => distanceToSegment2D({ x, z }, segment.a, segment.b)));
        return roofHeight * (distance / maxDistance);
      },
    };
  }

  function sampleCompoundRoofFaces(shapeSpec, wallHeight, roofHeight, heightGetter) {
    const faces = [];
    const step = 0.58;

    for (let x = shapeSpec.roofBounds.minX; x < shapeSpec.roofBounds.maxX - 0.001; x += step) {
      for (let z = shapeSpec.roofBounds.minZ; z < shapeSpec.roofBounds.maxZ - 0.001; z += step) {
        const x2 = Math.min(x + step, shapeSpec.roofBounds.maxX);
        const z2 = Math.min(z + step, shapeSpec.roofBounds.maxZ);
        const center = { x: (x + x2) / 2, z: (z + z2) / 2 };

        if (!pointInPolygon(center, shapeSpec.roofFootprint)) {
          continue;
        }

        faces.push([
          { x, y: wallHeight + heightGetter.getHeight(x, z, roofHeight), z },
          { x: x2, y: wallHeight + heightGetter.getHeight(x2, z, roofHeight), z },
          { x: x2, y: wallHeight + heightGetter.getHeight(x2, z2, roofHeight), z: z2 },
          { x, y: wallHeight + heightGetter.getHeight(x, z2, roofHeight), z: z2 },
        ]);
      }
    }

    return faces;
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

  function classifyPolygonCorners(points) {
    const orientation = Math.sign(polygonSignedArea2D(points)) || 1;

    return points.map((current, index) => {
      const previous = points[(index - 1 + points.length) % points.length];
      const next = points[(index + 1) % points.length];
      const vectorA = { x: current.x - previous.x, z: current.z - previous.z };
      const vectorB = { x: next.x - current.x, z: next.z - current.z };
      const crossProduct = vectorA.x * vectorB.z - vectorA.z * vectorB.x;
      const isConvex = orientation > 0 ? crossProduct > 0 : crossProduct < 0;

      return {
        index,
        point: current,
        previous,
        next,
        isConvex,
      };
    });
  }

  function getCornerBisectorDirection(point, roofFootprint) {
    const diagonalDirections = [
      { x: 1, z: 1 },
      { x: 1, z: -1 },
      { x: -1, z: 1 },
      { x: -1, z: -1 },
    ];
    const probeDistance = 0.18;

    return diagonalDirections
      .map((direction) => {
        const normalized = normalize2D(direction);
        const probe = {
          x: point.x + normalized.x * probeDistance,
          z: point.z + normalized.z * probeDistance,
        };

        return {
          direction: normalized,
          inside: pointInPolygon(probe, roofFootprint),
        };
      })
      .filter((candidate) => candidate.inside)
      .map((candidate) => ({
        ...candidate,
        score: candidate.direction.x + candidate.direction.z * 0.001,
      }))
      .sort((a, b) => a.score - b.score)[0]?.direction || normalize2D({ x: 1, z: 1 });
  }

  function traceCornerSegment(corner, roofFootprint, roofSegments, heightGetter, wallHeight, roofHeight) {
    const adjacentIndices = new Set([
      (corner.index - 1 + roofSegments.length) % roofSegments.length,
      corner.index,
    ]);
    const direction = getCornerBisectorDirection(corner.point, roofFootprint);
    const step = 0.18;
    let lastPoint = null;

    for (let distance = step; distance <= heightGetter.maxDistance * 3.2; distance += step) {
      const candidate = {
        x: corner.point.x + direction.x * distance,
        z: corner.point.z + direction.z * distance,
      };

      if (!pointInPolygon(candidate, roofFootprint)) {
        break;
      }

      const nearest = roofSegments
        .map((segment) => ({
          index: segment.index,
          distance: distanceToSegment2D(candidate, segment.a, segment.b),
        }))
        .sort((a, b) => a.distance - b.distance);
      const nearestPair = nearest.slice(0, 2);
      if (!nearestPair.every((entry) => adjacentIndices.has(entry.index))) {
        break;
      }

      lastPoint = candidate;
    }

    if (!lastPoint) {
      return null;
    }

    const cornerPoint = {
      x: corner.point.x,
      y: wallHeight,
      z: corner.point.z,
    };
    const roofPoint = {
      x: lastPoint.x,
      y: wallHeight + heightGetter.getHeight(lastPoint.x, lastPoint.z, roofHeight),
      z: lastPoint.z,
    };

    return {
      type: corner.isConvex ? "hip" : "valley",
      a: cornerPoint,
      b: roofPoint,
    };
  }

  function approximateRidgeSegments(shapeSpec, wallHeight, roofHeight, heightGetter) {
    const step = 0.34;
    const threshold = heightGetter.maxDistance * 0.9;
    const points = [];
    const segments = [];
    const segmentKeys = new Set();

    for (let x = shapeSpec.roofBounds.minX; x <= shapeSpec.roofBounds.maxX; x += step) {
      for (let z = shapeSpec.roofBounds.minZ; z <= shapeSpec.roofBounds.maxZ; z += step) {
        if (!pointInPolygon({ x, z }, shapeSpec.roofFootprint)) {
          continue;
        }

        const distance = Math.min(...heightGetter.roofSegments.map((segment) => distanceToSegment2D({ x, z }, segment.a, segment.b)));
        if (distance >= threshold) {
          points.push({ x, z });
        }
      }
    }

    points.forEach((point) => {
      const neighbors = [
        { x: point.x + step, z: point.z },
        { x: point.x, z: point.z + step },
      ];

      neighbors.forEach((neighbor) => {
        const hasNeighbor = points.some((candidate) => Math.abs(candidate.x - neighbor.x) < step * 0.45 && Math.abs(candidate.z - neighbor.z) < step * 0.45);
        if (!hasNeighbor) {
          return;
        }

        const a = {
          x: point.x,
          y: wallHeight + heightGetter.getHeight(point.x, point.z, roofHeight),
          z: point.z,
        };
        const b = {
          x: neighbor.x,
          y: wallHeight + heightGetter.getHeight(neighbor.x, neighbor.z, roofHeight),
          z: neighbor.z,
        };
        const key = axisSegmentKey(a, b);
        if (segmentKeys.has(key)) {
          return;
        }

        segmentKeys.add(key);
        segments.push({
          type: "ridge",
          a,
          b,
        });
      });
    });

    return segments;
  }

  function getLineThroughPoints(a, b) {
    return {
      a: a.z - b.z,
      b: b.x - a.x,
      c: a.x * b.z - b.x * a.z,
    };
  }

  function normalizeLine2D(line) {
    const length = Math.hypot(line.a, line.b) || 1;
    let normalized = {
      a: line.a / length,
      b: line.b / length,
      c: line.c / length,
    };

    if (normalized.a < -1e-8 || (Math.abs(normalized.a) < 1e-8 && normalized.b < -1e-8)) {
      normalized = {
        a: -normalized.a,
        b: -normalized.b,
        c: -normalized.c,
      };
    }

    return normalized;
  }

  function lineKey2D(line) {
    const normalized = normalizeLine2D(line);
    return [
      Math.round(normalized.a * 100000),
      Math.round(normalized.b * 100000),
      Math.round(normalized.c * 100000),
    ].join(":");
  }

  function lineValue2D(point, line) {
    return line.a * point.x + line.b * point.z + line.c;
  }

  function intersectSegmentWithLine2D(a, b, line) {
    const valueA = lineValue2D(a, line);
    const valueB = lineValue2D(b, line);
    const denominator = valueA - valueB;

    if (Math.abs(denominator) < 1e-8) {
      return {
        x: (a.x + b.x) / 2,
        z: (a.z + b.z) / 2,
      };
    }

    const t = valueA / denominator;
    return {
      x: a.x + (b.x - a.x) * t,
      z: a.z + (b.z - a.z) * t,
    };
  }

  function clipConvexPolygonByHalfPlane(polygon, line, keepPositive) {
    if (!polygon.length) {
      return [];
    }

    const clipped = [];

    for (let index = 0; index < polygon.length; index += 1) {
      const current = polygon[index];
      const next = polygon[(index + 1) % polygon.length];
      const currentValue = lineValue2D(current, line);
      const nextValue = lineValue2D(next, line);
      const currentInside = keepPositive ? currentValue >= -1e-7 : currentValue <= 1e-7;
      const nextInside = keepPositive ? nextValue >= -1e-7 : nextValue <= 1e-7;

      if (currentInside && nextInside) {
        clipped.push(next);
      } else if (currentInside && !nextInside) {
        clipped.push(intersectSegmentWithLine2D(current, next, line));
      } else if (!currentInside && nextInside) {
        clipped.push(intersectSegmentWithLine2D(current, next, line));
        clipped.push(next);
      }
    }

    return clipped;
  }

  function splitConvexPolygonByLine(polygon, line) {
    const positive = clipConvexPolygonByHalfPlane(polygon, line, true);
    const negative = clipConvexPolygonByHalfPlane(polygon, line, false);

    if (Math.abs(polygonSignedArea2D(positive)) < 1e-6 || Math.abs(polygonSignedArea2D(negative)) < 1e-6) {
      return [polygon];
    }

    return [positive, negative];
  }

  function getConvexClipLine(edgeStart, edgeEnd, orientation) {
    const edgeVector = {
      x: edgeEnd.x - edgeStart.x,
      z: edgeEnd.z - edgeStart.z,
    };

    return {
      a: -edgeVector.z * orientation,
      b: edgeVector.x * orientation,
      c: (edgeVector.z * edgeStart.x - edgeVector.x * edgeStart.z) * orientation,
    };
  }

  function intersectConvexPolygons(subject, clipPolygon) {
    if (!subject.length || !clipPolygon.length) {
      return [];
    }

    const orientation = Math.sign(polygonSignedArea2D(clipPolygon)) || 1;
    let output = subject.map((point) => ({ x: point.x, z: point.z }));

    for (let index = 0; index < clipPolygon.length; index += 1) {
      const current = clipPolygon[index];
      const next = clipPolygon[(index + 1) % clipPolygon.length];
      const line = getConvexClipLine(current, next, orientation);
      output = clipConvexPolygonByHalfPlane(output, line, true);
      if (output.length < 3) {
        return [];
      }
    }

    return output;
  }

  function polygonCentroid2D(points) {
    const signedArea = polygonSignedArea2D(points);

    if (Math.abs(signedArea) < 1e-8) {
      const sum = points.reduce((accumulator, point) => ({
        x: accumulator.x + point.x,
        z: accumulator.z + point.z,
      }), { x: 0, z: 0 });

      return {
        x: sum.x / points.length,
        z: sum.z / points.length,
      };
    }

    let x = 0;
    let z = 0;

    for (let index = 0; index < points.length; index += 1) {
      const current = points[index];
      const next = points[(index + 1) % points.length];
      const factor = current.x * next.z - next.x * current.z;
      x += (current.x + next.x) * factor;
      z += (current.z + next.z) * factor;
    }

    return {
      x: x / (6 * signedArea),
      z: z / (6 * signedArea),
    };
  }

  function buildPlaneEquation(points) {
    if (points.length < 3) {
      return null;
    }

    const normal = cross(subtract(points[1], points[0]), subtract(points[2], points[0]));
    if (Math.abs(normal.y) < 1e-8) {
      return null;
    }

    const d = -(normal.x * points[0].x + normal.y * points[0].y + normal.z * points[0].z);
    const ax = -normal.x / normal.y;
    const bz = -normal.z / normal.y;
    const c = -d / normal.y;

    return {
      ax,
      bz,
      c,
      evaluate(x, z) {
        return ax * x + bz * z + c;
      },
    };
  }

  function getRectAbsoluteFootprint(rect) {
    return [
      { x: rect.minX, z: rect.minZ },
      { x: rect.maxX, z: rect.minZ },
      { x: rect.maxX, z: rect.maxZ },
      { x: rect.minX, z: rect.maxZ },
    ];
  }

  function buildRectHipRoofFaces(rect, wallHeight, roofHeight, eave, rectIndex) {
    const footprint = getRectAbsoluteFootprint(rect);
    const roofFootprint = offsetPolygon(footprint, eave);
    const eaves = roofFootprint.map((point) => ({ x: point.x, y: wallHeight, z: point.z }));
    const [p0, p1, p2, p3] = eaves;
    const width = p1.x - p0.x;
    const depth = p3.z - p0.z;
    const centerZ = (p0.z + p3.z) / 2;
    const centerX = (p0.x + p1.x) / 2;
    const faces = [];

    const pushFace = (label, points) => {
      const plane = buildPlaneEquation(points);
      if (!plane) {
        return;
      }

      faces.push({
        id: `compound-${rectIndex}-${label}`,
        rectIndex,
        label,
        points,
        polygon2D: points.map((point) => ({ x: point.x, z: point.z })),
        plane,
      });
    };

    if (width >= depth) {
      const ridgeLeft = roofPeak(p0.x + depth / 2, centerZ, wallHeight, roofHeight);
      const ridgeRight = roofPeak(p1.x - depth / 2, centerZ, wallHeight, roofHeight);

      pushFace("north", [p0, p1, ridgeRight, ridgeLeft]);
      pushFace("east", [p1, p2, ridgeRight]);
      pushFace("south", [p3, ridgeLeft, ridgeRight, p2]);
      pushFace("west", [p0, ridgeLeft, p3]);
    } else {
      const ridgeTop = roofPeak(centerX, p0.z + width / 2, wallHeight, roofHeight);
      const ridgeBottom = roofPeak(centerX, p3.z - width / 2, wallHeight, roofHeight);

      pushFace("north", [p0, p1, ridgeTop]);
      pushFace("east", [p1, p2, ridgeBottom, ridgeTop]);
      pushFace("south", [p3, ridgeBottom, p2]);
      pushFace("west", [p0, ridgeTop, ridgeBottom, p3]);
    }

    return faces;
  }

  function verticalDecomposeOrthogonalPolygon(polygon) {
    const uniqueX = Array.from(new Set(
      polygon.map((point) => Math.round(point.x * 100000) / 100000),
    )).sort((a, b) => a - b);
    const pieces = [];

    for (let index = 0; index < uniqueX.length - 1; index += 1) {
      const x0 = uniqueX[index];
      const x1 = uniqueX[index + 1];

      if (x1 - x0 < 1e-6) {
        continue;
      }

      const sampleX = (x0 + x1) / 2;
      const zHits = [];

      for (let edgeIndex = 0; edgeIndex < polygon.length; edgeIndex += 1) {
        const current = polygon[edgeIndex];
        const next = polygon[(edgeIndex + 1) % polygon.length];

        if (Math.abs(current.z - next.z) > 1e-8) {
          continue;
        }

        const minX = Math.min(current.x, next.x);
        const maxX = Math.max(current.x, next.x);
        if (sampleX > minX + 1e-7 && sampleX < maxX - 1e-7) {
          zHits.push(current.z);
        }
      }

      zHits.sort((a, b) => a - b);

      for (let hitIndex = 0; hitIndex + 1 < zHits.length; hitIndex += 2) {
        const z0 = zHits[hitIndex];
        const z1 = zHits[hitIndex + 1];
        if (z1 - z0 < 1e-6) {
          continue;
        }

        const sample = { x: sampleX, z: (z0 + z1) / 2 };
        if (!pointInPolygon(sample, polygon)) {
          continue;
        }

        pieces.push([
          { x: x0, z: z0 },
          { x: x1, z: z0 },
          { x: x1, z: z1 },
          { x: x0, z: z1 },
        ]);
      }
    }

    return pieces;
  }

  function pieceEdgeKey(a, b) {
    const first = a.x < b.x - 1e-6 || (Math.abs(a.x - b.x) < 1e-6 && a.z <= b.z)
      ? a
      : b;
    const second = first === a ? b : a;

    return [
      Math.round(first.x * 100000),
      Math.round(first.z * 100000),
      Math.round(second.x * 100000),
      Math.round(second.z * 100000),
    ].join(":");
  }

  function mergeCollinearRoofSegments(segments) {
    const grouped = new Map();

    segments.forEach((segment) => {
      const dx = segment.b.x - segment.a.x;
      const dz = segment.b.z - segment.a.z;
      const horizontalLength = Math.hypot(dx, dz);
      if (horizontalLength < 1e-6) {
        return;
      }

      let dir = {
        x: dx / horizontalLength,
        z: dz / horizontalLength,
      };
      const slope = (segment.b.y - segment.a.y) / horizontalLength;

      if (dir.x < -1e-8 || (Math.abs(dir.x) < 1e-8 && dir.z < -1e-8)) {
        dir = {
          x: -dir.x,
          z: -dir.z,
        };
      }

      const normal = {
        x: -dir.z,
        z: dir.x,
      };
      const offset = segment.a.x * normal.x + segment.a.z * normal.z;
      const intercept = segment.a.y - slope * (segment.a.x * dir.x + segment.a.z * dir.z);
      const signature = [
        segment.type,
        Math.round(dir.x * 100000),
        Math.round(dir.z * 100000),
        Math.round(slope * 100000),
        Math.round(offset * 100000),
        Math.round(intercept * 100000),
      ].join(":");

      const t0 = segment.a.x * dir.x + segment.a.z * dir.z;
      const t1 = segment.b.x * dir.x + segment.b.z * dir.z;
      const interval = {
        min: Math.min(t0, t1),
        max: Math.max(t0, t1),
        dir,
        normal,
        slope,
        offset,
        intercept,
      };

      if (!grouped.has(signature)) {
        grouped.set(signature, []);
      }
      grouped.get(signature).push(interval);
    });

    const merged = [];

    grouped.forEach((intervals, signature) => {
      intervals.sort((left, right) => left.min - right.min);
      let current = { ...intervals[0] };
      const [type] = signature.split(":");

      const flush = () => {
        merged.push({
          type,
          a: {
            x: current.dir.x * current.min + current.normal.x * current.offset,
            y: current.slope * current.min + current.intercept,
            z: current.dir.z * current.min + current.normal.z * current.offset,
          },
          b: {
            x: current.dir.x * current.max + current.normal.x * current.offset,
            y: current.slope * current.max + current.intercept,
            z: current.dir.z * current.max + current.normal.z * current.offset,
          },
        });
      };

      for (let index = 1; index < intervals.length; index += 1) {
        const next = intervals[index];
        if (next.min <= current.max + 1e-4) {
          current.max = Math.max(current.max, next.max);
        } else {
          flush();
          current = { ...next };
        }
      }

      flush();
    });

    return merged;
  }

  function buildCompoundRoofGeometry(shapeSpec, wallHeight, roofHeight, eave) {
    const candidateFaces = shapeSpec.rectangles.flatMap((rect, index) => (
      buildRectHipRoofFaces(rect, wallHeight, roofHeight, eave, index)
    ));
    const splitLines = new Map();

    candidateFaces.forEach((face) => {
      face.polygon2D.forEach((point, index) => {
        const next = face.polygon2D[(index + 1) % face.polygon2D.length];
        const line = getLineThroughPoints(point, next);
        splitLines.set(lineKey2D(line), line);
      });
    });

    for (let index = 0; index < candidateFaces.length; index += 1) {
      for (let compareIndex = index + 1; compareIndex < candidateFaces.length; compareIndex += 1) {
        const overlap = intersectConvexPolygons(candidateFaces[index].polygon2D, candidateFaces[compareIndex].polygon2D);
        if (Math.abs(polygonSignedArea2D(overlap)) < 1e-5) {
          continue;
        }

        const line = {
          a: candidateFaces[index].plane.ax - candidateFaces[compareIndex].plane.ax,
          b: candidateFaces[index].plane.bz - candidateFaces[compareIndex].plane.bz,
          c: candidateFaces[index].plane.c - candidateFaces[compareIndex].plane.c,
        };

        if (Math.hypot(line.a, line.b) < 1e-7) {
          continue;
        }

        splitLines.set(lineKey2D(line), line);
      }
    }

    let pieces = verticalDecomposeOrthogonalPolygon(shapeSpec.roofFootprint);
    Array.from(splitLines.values()).forEach((line) => {
      pieces = pieces.flatMap((piece) => splitConvexPolygonByLine(piece, line))
        .filter((piece) => Math.abs(polygonSignedArea2D(piece)) > 1e-5);
    });

    const roofFaces = [];
    const facePieces = [];

    pieces.forEach((piece) => {
      const centroid = polygonCentroid2D(piece);
      const activeFaces = candidateFaces.filter((face) => pointInPolygon(centroid, face.polygon2D));

      if (!activeFaces.length) {
        return;
      }

      const topFace = activeFaces.reduce((best, face) => {
        if (!best) {
          return face;
        }

        const bestHeight = best.plane.evaluate(centroid.x, centroid.z);
        const nextHeight = face.plane.evaluate(centroid.x, centroid.z);
        return nextHeight > bestHeight + 1e-7 ? face : best;
      }, null);

      if (!topFace) {
        return;
      }

      const clippedPiece = intersectConvexPolygons(piece, topFace.polygon2D);
      if (Math.abs(polygonSignedArea2D(clippedPiece)) < 1e-5) {
        return;
      }

      const clippedCentroid = polygonCentroid2D(clippedPiece);
      const points = clippedPiece.map((point) => ({
        x: point.x,
        y: topFace.plane.evaluate(point.x, point.z),
        z: point.z,
      }));

      roofFaces.push(points);
      facePieces.push({
        plane: topFace.plane,
        planeId: topFace.id,
        centroid: clippedCentroid,
        points,
        polygon2D: clippedPiece,
      });
    });

    const rawSegments = [];
    const edgeMap = new Map();

    facePieces.forEach((piece, pieceIndex) => {
      piece.points.forEach((point, index) => {
        const next = piece.points[(index + 1) % piece.points.length];
        const key = pieceEdgeKey(point, next);

        if (!edgeMap.has(key)) {
          edgeMap.set(key, []);
        }

        edgeMap.get(key).push({
          pieceIndex,
          a: point,
          b: next,
        });
      });
    });

    edgeMap.forEach((entries) => {
      if (entries.length !== 2) {
        return;
      }

      const firstPiece = facePieces[entries[0].pieceIndex];
      const secondPiece = facePieces[entries[1].pieceIndex];

      if (firstPiece.planeId === secondPiece.planeId) {
        return;
      }

      const midpoint = {
        x: (entries[0].a.x + entries[0].b.x) / 2,
        z: (entries[0].a.z + entries[0].b.z) / 2,
      };
      const edgeMinY = Math.min(entries[0].a.y, entries[0].b.y);
      const edgeMaxY = Math.max(entries[0].a.y, entries[0].b.y);
      const directionA = normalize2D({
        x: firstPiece.centroid.x - midpoint.x,
        z: firstPiece.centroid.z - midpoint.z,
      });
      const directionB = normalize2D({
        x: secondPiece.centroid.x - midpoint.x,
        z: secondPiece.centroid.z - midpoint.z,
      });
      const slopeA = firstPiece.plane.ax * directionA.x + firstPiece.plane.bz * directionA.z;
      const slopeB = secondPiece.plane.ax * directionB.x + secondPiece.plane.bz * directionB.z;

      let type = null;
      if (edgeMinY <= wallHeight + 1e-5 && edgeMaxY > wallHeight + 1e-4) {
        type = "hip";
      } else if (slopeA < -1e-5 && slopeB < -1e-5) {
        type = "ridge";
      } else if (slopeA > 1e-5 && slopeB > 1e-5) {
        type = "valley";
      }

      if (!type) {
        return;
      }

      rawSegments.push({
        type,
        a: entries[0].a,
        b: entries[0].b,
      });
    });

    return {
      roofFaces,
      segments: mergeCollinearRoofSegments(rawSegments),
    };
  }

  function buildRoofGeometry(input) {
    const params = normalizeParams(input);
    const {
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
    } = params;
    const shapeSpec = getShapeSpec(
      houseType,
      widthA,
      depthA,
      widthB,
      depthB,
      eave,
      widthC,
      depthC,
      bodyBEnabled,
      bodyBSide,
      bodyBAlign,
      bodyCEnabled,
      bodyCSide,
      bodyCAlign,
    );
    const eaves = shapeSpec.roofFootprint.map((point) => ({ x: point.x, y: wallHeight, z: point.z }));
    const roofFaces = [];
    const frontonFaces = [];
    const segments = [];

    if (houseType === "rect-gable") {
      const [p0, p1, p2, p3] = eaves;
      const [f0, f1, f2, f3] = shapeSpec.footprint;
      const width = p1.x - p0.x;
      const depth = p3.z - p0.z;

      if (width >= depth) {
        const ridgeLeft = roofPeak(f0.x, 0, wallHeight, roofHeight);
        const ridgeRight = roofPeak(f1.x, 0, wallHeight, roofHeight);

        roofFaces.push(
          [p0, p1, ridgeRight, ridgeLeft],
          [p3, ridgeLeft, ridgeRight, p2],
        );
        frontonFaces.push(
          [
            { x: f0.x, y: wallHeight, z: f0.z },
            { x: f3.x, y: wallHeight, z: f3.z },
            ridgeLeft,
          ],
          [
            { x: f1.x, y: wallHeight, z: f1.z },
            ridgeRight,
            { x: f2.x, y: wallHeight, z: f2.z },
          ],
        );

        segments.push(
          { type: "ridge", a: ridgeLeft, b: ridgeRight },
          { type: "eave", a: p0, b: p1 },
          { type: "eave", a: p3, b: p2 },
          { type: "rake", a: p0, b: ridgeLeft },
          { type: "rake", a: p3, b: ridgeLeft },
          { type: "rake", a: p1, b: ridgeRight },
          { type: "rake", a: p2, b: ridgeRight },
        );
      } else {
        const ridgeTop = roofPeak(0, f0.z, wallHeight, roofHeight);
        const ridgeBottom = roofPeak(0, f3.z, wallHeight, roofHeight);

        roofFaces.push(
          [p1, p2, ridgeBottom, ridgeTop],
          [p0, ridgeTop, ridgeBottom, p3],
        );
        frontonFaces.push(
          [
            { x: f0.x, y: wallHeight, z: f0.z },
            ridgeTop,
            { x: f1.x, y: wallHeight, z: f1.z },
          ],
          [
            { x: f3.x, y: wallHeight, z: f3.z },
            { x: f2.x, y: wallHeight, z: f2.z },
            ridgeBottom,
          ],
        );

        segments.push(
          { type: "ridge", a: ridgeTop, b: ridgeBottom },
          { type: "eave", a: p0, b: p3 },
          { type: "eave", a: p1, b: p2 },
          { type: "rake", a: p0, b: ridgeTop },
          { type: "rake", a: p1, b: ridgeTop },
          { type: "rake", a: p2, b: ridgeBottom },
          { type: "rake", a: p3, b: ridgeBottom },
        );
      }

      return {
        params,
        shapeSpec,
        roofFaces,
        frontonFaces,
        segments,
      };
    }

    addOutlineSegments(segments, eaves, "eave");

    if (houseType === "rect-hip") {
      const [p0, p1, p2, p3] = eaves;
      const width = p1.x - p0.x;
      const depth = p3.z - p0.z;

      if (width >= depth) {
        const inset = depth / 2;
        const ridgeLeft = roofPeak(p0.x + inset, 0, wallHeight, roofHeight);
        const ridgeRight = roofPeak(p1.x - inset, 0, wallHeight, roofHeight);

        roofFaces.push(
          [p0, p1, ridgeRight, ridgeLeft],
          [p1, p2, ridgeRight],
          [p3, ridgeLeft, ridgeRight, p2],
          [p0, ridgeLeft, p3],
        );
        segments.push(
          { type: "ridge", a: ridgeLeft, b: ridgeRight },
          { type: "hip", a: p0, b: ridgeLeft },
          { type: "hip", a: p3, b: ridgeLeft },
          { type: "hip", a: p1, b: ridgeRight },
          { type: "hip", a: p2, b: ridgeRight },
        );
      } else {
        const inset = width / 2;
        const ridgeTop = roofPeak(0, p0.z + inset, wallHeight, roofHeight);
        const ridgeBottom = roofPeak(0, p3.z - inset, wallHeight, roofHeight);

        roofFaces.push(
          [p0, p1, ridgeTop],
          [p1, p2, ridgeBottom, ridgeTop],
          [p3, ridgeBottom, p2],
          [p0, ridgeTop, ridgeBottom, p3],
        );
        segments.push(
          { type: "ridge", a: ridgeTop, b: ridgeBottom },
          { type: "hip", a: p0, b: ridgeTop },
          { type: "hip", a: p1, b: ridgeTop },
          { type: "hip", a: p2, b: ridgeBottom },
          { type: "hip", a: p3, b: ridgeBottom },
        );
      }

      return {
        params,
        shapeSpec,
        roofFaces,
        frontonFaces,
        segments,
      };
    }

    if (houseType === "compound") {
      const compoundGeometry = buildCompoundRoofGeometry(shapeSpec, wallHeight, roofHeight, eave);
      roofFaces.push(...compoundGeometry.roofFaces);
      segments.push(...compoundGeometry.segments);

      return {
        params,
        shapeSpec,
        roofFaces,
        frontonFaces,
        segments,
      };
    }

    if (houseType === "l-shape") {
      const [p0, p1, p2, p3, p4, p5] = eaves;
      const topDepth = p2.z - p0.z;
      const legWidth = p3.x - p5.x;
      const junction = roofPeak((p5.x + p3.x) / 2, (p0.z + p2.z) / 2, wallHeight, roofHeight);
      const topRidgeEnd = roofPeak(Math.max(junction.x, p1.x - topDepth / 2), junction.z, wallHeight, roofHeight);
      const legRidgeEnd = roofPeak(junction.x, Math.max(junction.z, p4.z - legWidth / 2), wallHeight, roofHeight);

      roofFaces.push(
        [p0, p1, topRidgeEnd, junction],
        [p1, p2, topRidgeEnd],
        [p2, p3, junction, topRidgeEnd],
        [p3, p4, legRidgeEnd, junction],
        [p5, legRidgeEnd, p4],
        [p0, junction, legRidgeEnd, p5],
      );
      segments.push(
        { type: "valley", a: p3, b: junction },
        { type: "ridge", a: junction, b: topRidgeEnd },
        { type: "ridge", a: junction, b: legRidgeEnd },
        { type: "hip", a: p1, b: topRidgeEnd },
        { type: "hip", a: p2, b: topRidgeEnd },
        { type: "hip", a: p4, b: legRidgeEnd },
        { type: "hip", a: p0, b: junction },
        { type: "hip", a: p5, b: legRidgeEnd },
      );

      return {
        params,
        shapeSpec,
        roofFaces,
        frontonFaces,
        segments,
      };
    }

    if (houseType === "t-shape") {
      const [p0, p1, p2, p3, p4, p5, p6, p7] = eaves;
      const topDepth = p2.z - p0.z;
      const stemWidth = p3.x - p6.x;
      const ridgeLeft = roofPeak(p0.x + topDepth / 2, (p0.z + p2.z) / 2, wallHeight, roofHeight);
      const ridgeRight = roofPeak(p1.x - topDepth / 2, (p0.z + p2.z) / 2, wallHeight, roofHeight);
      const ridgeJunction = roofPeak((p6.x + p3.x) / 2, (p0.z + p2.z) / 2, wallHeight, roofHeight);
      const stemRidgeEnd = roofPeak(ridgeJunction.x, Math.max(ridgeJunction.z, p4.z - stemWidth / 2), wallHeight, roofHeight);

      roofFaces.push(
        [p0, p1, ridgeRight, ridgeLeft],
        [p1, p2, ridgeRight],
        [p7, p0, ridgeLeft],
        [p2, p3, ridgeJunction, ridgeRight],
        [p7, ridgeLeft, ridgeJunction, p6],
        [p3, p4, stemRidgeEnd, ridgeJunction],
        [p6, ridgeJunction, stemRidgeEnd, p5],
        [p5, stemRidgeEnd, p4],
      );
      segments.push(
        { type: "ridge", a: ridgeLeft, b: ridgeRight },
        { type: "ridge", a: ridgeJunction, b: stemRidgeEnd },
        { type: "valley", a: p3, b: ridgeJunction },
        { type: "valley", a: p6, b: ridgeJunction },
        { type: "hip", a: p0, b: ridgeLeft },
        { type: "hip", a: p1, b: ridgeRight },
        { type: "hip", a: p2, b: ridgeRight },
        { type: "hip", a: p7, b: ridgeLeft },
        { type: "hip", a: p4, b: stemRidgeEnd },
        { type: "hip", a: p5, b: stemRidgeEnd },
      );
    }

    return {
      params,
      shapeSpec,
      roofFaces,
      frontonFaces,
      segments,
    };
  }

  function roundMetric(value) {
    return Math.round(value * 1000) / 1000;
  }

  function calculateRoofMetrics(input) {
    const geometry = buildRoofGeometry(input);
    const roofFaceAreas = geometry.roofFaces.map((points, index) => ({
      index,
      area: roundMetric(polygonArea3D(points)),
      points,
    }));
    const frontonFaceAreas = geometry.frontonFaces.map((points, index) => ({
      index,
      area: roundMetric(polygonArea3D(points)),
      points,
    }));
    const lineTotals = {
      ridgeLength: 0,
      valleyLength: 0,
      hipLength: 0,
      eaveLength: 0,
      rakeLength: 0,
    };
    const segments = geometry.segments.map((segment) => {
      const length = segmentLength3D(segment.a, segment.b);
      if (segment.type === "ridge") {
        lineTotals.ridgeLength += length;
      } else if (segment.type === "valley") {
        lineTotals.valleyLength += length;
      } else if (segment.type === "hip") {
        lineTotals.hipLength += length;
      } else if (segment.type === "eave") {
        lineTotals.eaveLength += length;
      } else if (segment.type === "rake") {
        lineTotals.rakeLength += length;
      }

      return {
        type: segment.type,
        length: roundMetric(length),
        a: segment.a,
        b: segment.b,
      };
    });

    const roofArea = roofFaceAreas.reduce((sum, face) => sum + face.area, 0);
    const frontonArea = frontonFaceAreas.reduce((sum, face) => sum + face.area, 0);

    return {
      input: geometry.params,
      faces: roofFaceAreas,
      frontons: frontonFaceAreas,
      segments,
      totals: {
        roofArea: roundMetric(roofArea),
        frontonArea: roundMetric(frontonArea),
        ridgeLength: roundMetric(lineTotals.ridgeLength),
        valleyLength: roundMetric(lineTotals.valleyLength),
        hipLength: roundMetric(lineTotals.hipLength),
        eaveLength: roundMetric(lineTotals.eaveLength),
        rakeLength: roundMetric(lineTotals.rakeLength),
      },
    };
  }

  return {
    buildRoofGeometry,
    calculateRoofMetrics,
  };
}));
