import type { BoundingBox, Finding } from "../types";

// Anatomical region keyword → approximate normalized bounding box
// (origin = top-left, values 0–1, x/y = center, w/h = size)
const REGION_PRESETS: { keywords: string[]; bbox: BoundingBox }[] = [
  { keywords: ["right lower lobe", "right lower", "rll"], bbox: { x: 0.30, y: 0.62, w: 0.22, h: 0.20 } },
  { keywords: ["left lower lobe", "left lower", "lll"], bbox: { x: 0.70, y: 0.62, w: 0.22, h: 0.20 } },
  { keywords: ["right upper lobe", "right upper", "rul"], bbox: { x: 0.30, y: 0.30, w: 0.22, h: 0.20 } },
  { keywords: ["left upper lobe", "left upper", "lul"], bbox: { x: 0.70, y: 0.30, w: 0.22, h: 0.20 } },
  { keywords: ["right middle", "rml"], bbox: { x: 0.32, y: 0.48, w: 0.20, h: 0.18 } },
  { keywords: ["bilateral lung", "lung fields", "lungs", "perihilar"], bbox: { x: 0.50, y: 0.46, w: 0.62, h: 0.36 } },
  { keywords: ["pleura", "pleural"], bbox: { x: 0.28, y: 0.66, w: 0.18, h: 0.16 } },
  { keywords: ["cardiac", "heart", "cardiomediastinal", "mediastinum", "cardiac silhouette"], bbox: { x: 0.50, y: 0.55, w: 0.30, h: 0.26 } },
  { keywords: ["liver", "hepato"], bbox: { x: 0.32, y: 0.52, w: 0.30, h: 0.26 } },
  { keywords: ["gallbladder", "biliary"], bbox: { x: 0.38, y: 0.58, w: 0.16, h: 0.14 } },
  { keywords: ["kidney", "renal"], bbox: { x: 0.30, y: 0.58, w: 0.16, h: 0.20 } },
  { keywords: ["mca", "middle cerebral", "frontal", "parietal"], bbox: { x: 0.36, y: 0.42, w: 0.24, h: 0.24 } },
  { keywords: ["temporal", "right temporal", "left temporal"], bbox: { x: 0.68, y: 0.50, w: 0.20, h: 0.20 } },
  { keywords: ["periventricular", "ventricle", "white matter"], bbox: { x: 0.50, y: 0.46, w: 0.26, h: 0.22 } },
  { keywords: ["cortical", "sulci"], bbox: { x: 0.50, y: 0.30, w: 0.50, h: 0.18 } },
  { keywords: ["l4", "l5", "lumbar", "thecal", "spine", "disc"], bbox: { x: 0.50, y: 0.60, w: 0.18, h: 0.30 } },
];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// Fallback: pick a stable but varied position per region name
function fallbackBox(region: string): BoundingBox {
  const h = hashString(region);
  const cols = 3;
  const rows = 3;
  const col = h % cols;
  const row = Math.floor(h / cols) % rows;
  return {
    x: 0.22 + col * 0.28,
    y: 0.24 + row * 0.24,
    w: 0.20,
    h: 0.18,
  };
}

export function getRegionBox(region: string): BoundingBox {
  const lower = region.toLowerCase();
  for (const preset of REGION_PRESETS) {
    if (preset.keywords.some((k) => lower.includes(k))) return preset.bbox;
  }
  return fallbackBox(region);
}

export function ensureBoxes(findings: Finding[]): (Finding & { bbox: BoundingBox })[] {
  return findings.map((f) => ({
    ...f,
    bbox: f.bbox ?? getRegionBox(f.region),
  }));
}