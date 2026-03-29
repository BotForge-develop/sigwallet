/**
 * SigWallet Pattern Codec
 * 
 * Encodes a 6-digit pairing code into deterministic dot positions on concentric rings.
 * The iPhone camera captures these dots and decodes the code back.
 * 
 * Layout:
 * - 3 ANCHOR dots at fixed positions (0°, 120°, 240°) on outer ring — always present, larger
 * - 20 DATA positions on 2 inner rings (10 per ring, 36° apart)
 *   - Ring 1: radius 0.40, angles 0°, 36°, 72° ... 324°
 *   - Ring 2: radius 0.60, angles 18°, 54°, 90° ... 342° (offset by 18°)
 * - Bit = 1 → dot present, Bit = 0 → no dot
 * - 20 bits → max 1,048,575 → covers 000000–999999
 */

export interface PatternDot {
  x: number; // -1..1 relative
  y: number;
  type: 'anchor' | 'data';
  ring: number;
  index: number;
}

// Fixed constants
const ANCHOR_RADIUS = 0.82;
const ANCHOR_ANGLES_DEG = [0, 120, 240];
const DATA_RING_1_RADIUS = 0.38;
const DATA_RING_2_RADIUS = 0.58;
const POSITIONS_PER_RING = 10;
const RING_1_OFFSET_DEG = 0;
const RING_2_OFFSET_DEG = 18;

function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Encode a 6-digit numeric code into dot positions.
 */
export function encodePattern(code: number): PatternDot[] {
  const dots: PatternDot[] = [];

  // Always add 3 anchor dots
  for (let i = 0; i < 3; i++) {
    const angle = degToRad(ANCHOR_ANGLES_DEG[i]);
    dots.push({
      x: Math.cos(angle) * ANCHOR_RADIUS,
      y: Math.sin(angle) * ANCHOR_RADIUS,
      type: 'anchor',
      ring: 0,
      index: i,
    });
  }

  // Convert code to 20-bit binary
  const clamped = Math.max(0, Math.min(999999, Math.floor(code)));
  const bits = clamped.toString(2).padStart(20, '0');

  // Ring 1: bits 0-9
  for (let i = 0; i < POSITIONS_PER_RING; i++) {
    if (bits[i] === '1') {
      const angle = degToRad(RING_1_OFFSET_DEG + i * 36);
      dots.push({
        x: Math.cos(angle) * DATA_RING_1_RADIUS,
        y: Math.sin(angle) * DATA_RING_1_RADIUS,
        type: 'data',
        ring: 1,
        index: i,
      });
    }
  }

  // Ring 2: bits 10-19
  for (let i = 0; i < POSITIONS_PER_RING; i++) {
    if (bits[10 + i] === '1') {
      const angle = degToRad(RING_2_OFFSET_DEG + i * 36);
      dots.push({
        x: Math.cos(angle) * DATA_RING_2_RADIUS,
        y: Math.sin(angle) * DATA_RING_2_RADIUS,
        type: 'data',
        ring: 2,
        index: i,
      });
    }
  }

  return dots;
}

/**
 * All possible data positions (for the decoder to check).
 */
export function getAllDataPositions(): { x: number; y: number; ring: number; index: number }[] {
  const positions: { x: number; y: number; ring: number; index: number }[] = [];

  for (let i = 0; i < POSITIONS_PER_RING; i++) {
    const angle = degToRad(RING_1_OFFSET_DEG + i * 36);
    positions.push({
      x: Math.cos(angle) * DATA_RING_1_RADIUS,
      y: Math.sin(angle) * DATA_RING_1_RADIUS,
      ring: 1,
      index: i,
    });
  }

  for (let i = 0; i < POSITIONS_PER_RING; i++) {
    const angle = degToRad(RING_2_OFFSET_DEG + i * 36);
    positions.push({
      x: Math.cos(angle) * DATA_RING_2_RADIUS,
      y: Math.sin(angle) * DATA_RING_2_RADIUS,
      ring: 2,
      index: i,
    });
  }

  return positions;
}

/**
 * Get anchor positions (for the decoder to find orientation).
 */
export function getAnchorPositions(): { x: number; y: number }[] {
  return ANCHOR_ANGLES_DEG.map(deg => {
    const angle = degToRad(deg);
    return {
      x: Math.cos(angle) * ANCHOR_RADIUS,
      y: Math.sin(angle) * ANCHOR_RADIUS,
    };
  });
}

// ─── DECODER ───────────────────────────────────────────────

interface Blob {
  cx: number;
  cy: number;
  area: number;
}

/**
 * Detect blue-ish blobs from a canvas ImageData.
 * Returns center positions and sizes of all detected blue clusters.
 */
function detectBlueBlobs(imageData: ImageData, width: number, height: number): Blob[] {
  const { data } = imageData;
  const mask = new Uint8Array(width * height);

  // Step 1: Threshold for blue-ish pixels
  for (let i = 0; i < width * height; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];

    // Blue detection: high blue, lower red/green
    // Also accept bright blue-white (for anchor glow)
    const isBlue =
      b > 100 &&
      b > r * 1.3 &&
      b > g * 1.1 &&
      (b - r) > 30;

    mask[i] = isBlue ? 1 : 0;
  }

  // Step 2: Connected component labeling (simple flood fill)
  const labels = new Int32Array(width * height);
  const blobs: Blob[] = [];
  let nextLabel = 1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (mask[idx] === 1 && labels[idx] === 0) {
        // Flood fill
        const queue: number[] = [idx];
        labels[idx] = nextLabel;
        let sumX = 0, sumY = 0, count = 0;

        while (queue.length > 0) {
          const ci = queue.pop()!;
          const cx = ci % width;
          const cy = Math.floor(ci / width);
          sumX += cx;
          sumY += cy;
          count++;

          // 4-connected neighbors
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const nx = cx + dx;
            const ny = cy + dy;
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const ni = ny * width + nx;
              if (mask[ni] === 1 && labels[ni] === 0) {
                labels[ni] = nextLabel;
                queue.push(ni);
              }
            }
          }
        }

        if (count >= 4) { // Minimum blob size
          blobs.push({
            cx: sumX / count,
            cy: sumY / count,
            area: count,
          });
        }
        nextLabel++;
      }
    }
  }

  return blobs;
}

/**
 * Find the 3 anchor blobs from detected blobs.
 * Anchors are the 3 largest blobs forming roughly an equilateral triangle.
 */
function findAnchors(blobs: Blob[]): Blob[] | null {
  if (blobs.length < 3) return null;

  // Sort by area, take top candidates
  const sorted = [...blobs].sort((a, b) => b.area - a.area);
  const candidates = sorted.slice(0, Math.min(8, sorted.length));

  // Try all triplets, find the one closest to equilateral
  let bestTriplet: Blob[] | null = null;
  let bestScore = Infinity;

  for (let i = 0; i < candidates.length - 2; i++) {
    for (let j = i + 1; j < candidates.length - 1; j++) {
      for (let k = j + 1; k < candidates.length; k++) {
        const tri = [candidates[i], candidates[j], candidates[k]];
        const d01 = Math.hypot(tri[0].cx - tri[1].cx, tri[0].cy - tri[1].cy);
        const d12 = Math.hypot(tri[1].cx - tri[2].cx, tri[1].cy - tri[2].cy);
        const d02 = Math.hypot(tri[0].cx - tri[2].cx, tri[0].cy - tri[2].cy);
        const sides = [d01, d12, d02].sort((a, b) => a - b);

        // Check if roughly equilateral (all sides similar length)
        const ratio = sides[2] / sides[0];
        if (ratio < 1.4) {
          const score = ratio + (1 / (tri[0].area + tri[1].area + tri[2].area));
          if (score < bestScore) {
            bestScore = score;
            bestTriplet = tri;
          }
        }
      }
    }
  }

  return bestTriplet;
}

/**
 * Decode a pattern from a camera frame.
 * Returns the decoded 6-digit code or null if detection failed.
 */
export function decodePattern(
  imageData: ImageData,
  width: number,
  height: number
): number | null {
  const blobs = detectBlueBlobs(imageData, width, height);
  if (blobs.length < 3) return null;

  const anchors = findAnchors(blobs);
  if (!anchors) return null;

  // Calculate center of the pattern
  const centerX = (anchors[0].cx + anchors[1].cx + anchors[2].cx) / 3;
  const centerY = (anchors[0].cy + anchors[1].cy + anchors[2].cy) / 3;

  // Calculate average anchor distance from center = pattern radius
  const anchorDists = anchors.map(a => Math.hypot(a.cx - centerX, a.cy - centerY));
  const patternRadius = anchorDists.reduce((s, d) => s + d, 0) / 3;

  // Calculate rotation: find which anchor is closest to the expected 0° position
  const anchorAngles = anchors.map(a => Math.atan2(a.cy - centerY, a.cx - centerX));
  
  // Find the rotation offset (anchors should be at 0°, 120°, 240°)
  // Try each anchor as the 0° reference
  let bestRotation = 0;
  let bestRotErr = Infinity;

  for (let ai = 0; ai < 3; ai++) {
    const rotation = anchorAngles[ai] - degToRad(ANCHOR_ANGLES_DEG[0]);
    let totalErr = 0;
    for (let bi = 0; bi < 3; bi++) {
      let expectedAngle = degToRad(ANCHOR_ANGLES_DEG[bi]) + rotation;
      // Find closest anchor
      let minDist = Infinity;
      for (let ci = 0; ci < 3; ci++) {
        let diff = Math.abs(normalizeAngle(anchorAngles[ci] - expectedAngle));
        if (diff < minDist) minDist = diff;
      }
      totalErr += minDist;
    }
    if (totalErr < bestRotErr) {
      bestRotErr = totalErr;
      bestRotation = rotation;
    }
  }

  // Now check each data position
  const allPositions = getAllDataPositions();
  let bits = '';

  for (const pos of allPositions) {
    // Transform position to image coordinates
    const angle = Math.atan2(pos.y, pos.x) + bestRotation;
    const radius = Math.hypot(pos.x, pos.y) * (patternRadius / ANCHOR_RADIUS);
    const imgX = centerX + Math.cos(angle) * radius;
    const imgY = centerY + Math.sin(angle) * radius;

    // Check if any blob is near this position
    const threshold = patternRadius * 0.08; // tolerance
    const found = blobs.some(b => Math.hypot(b.cx - imgX, b.cy - imgY) < threshold);
    bits += found ? '1' : '0';
  }

  const code = parseInt(bits, 2);
  if (code >= 0 && code <= 999999) {
    return code;
  }
  return null;
}

function normalizeAngle(a: number): number {
  while (a > Math.PI) a -= 2 * Math.PI;
  while (a < -Math.PI) a += 2 * Math.PI;
  return a;
}
