// Catalog illustrations: drawItem(item, options) returns SVG markup for any catalog item.
// A photo in item.media replaces the drawing in the UI (see library/media.js); the data model does not change.
import { createArt, safeHex } from "./engine.js";
import { DRAWERS } from "./shapes/index.js";

// Natural colour of each material, used for frames, legs and finishes.
export const MATERIAL_COLOR = {
  oak: "#c49a6c", walnut: "#6b4a32", ash: "#d9c4a0", teak: "#a0703f", pine: "#d8b98a", bamboo: "#cfb47c",
  rattan: "#c9a56b", cane: "#d6b77d", jute: "#b99d6e",
  marble: "#ebe7e1", travertine: "#d8c8ad", granite: "#8a8682", terrazzo: "#e3dcd0", concrete: "#a29f99",
  linen: "#d9cfbf", cotton: "#ece7dd", boucle: "#efe9de", velvet: "#5d6b5a", wool: "#ddd3c3", leather: "#8a5a3b",
  brass: "#b8913f", "black-metal": "#2e2b28", chrome: "#c9ccd0", steel: "#a7a9ab",
  glass: "#dfe8ea", ceramic: "#efe9df", terracotta: "#b9603f", plaster: "#e7dfd2", lacquer: "#3b3a36", paper: "#f1ece2", paint: "#e9e3d8",
};
const KIND = {
  linen: "fabric", cotton: "fabric", boucle: "fabric", velvet: "fabric", wool: "fabric", leather: "fabric", jute: "fabric",
};
const isFabric = (m) => KIND[m] === "fabric";
const NATURAL = new Set(["oak", "walnut", "ash", "teak", "pine", "bamboo", "rattan", "cane", "marble", "travertine", "granite", "terrazzo", "concrete", "brass", "black-metal", "chrome", "steel"]);

const known = (list, value) => (value && list.includes(value) ? value : null);

// Resolves the colours and materials a drawer paints with, from the item and the user's choices.
export function palette(item, options = {}) {
  const colors = item.colors ?? [];
  const chosen = colors.find((c) => c.id === options.color) ?? colors[0];
  const color = safeHex(chosen?.hex ?? options.hex);
  const accent = safeHex(colors.find((c) => c !== chosen)?.hex ?? color);
  const materials = item.materials ?? [];
  const fabric = known(item.custom?.fabrics ?? [], options.fabric) ?? materials.find(isFabric) ?? null;
  const finish = known(item.custom?.finishes ?? [], options.finish) ?? materials.find((m) => !isFabric(m)) ?? null;
  const frameColor = MATERIAL_COLOR[finish] ?? accent;
  // Case goods take their body tint from an explicitly chosen natural finish (oak, marble, brass...).
  const solidColor = options.finish && NATURAL.has(finish) && !options.color ? MATERIAL_COLOR[finish] : color;
  return {
    color,
    accent,
    upholstery: { color, material: fabric ?? materials[0] },
    frame: { color: frameColor, material: finish ?? "oak" },
    solid: { color: solidColor, material: finish ?? materials[0] },
    second: { color: accent, material: materials[1] ?? materials[0] },
    materials,
    finish,
    fabric,
  };
}

const ORIENT = { front: 1, left: -1 };

// options: { color: colorId, fabric, finish, dims: {w,d,h}, view: "front" | "left" }
export function drawItem(item, options = {}) {
  const dims = { ...item.dims, ...(options.dims ?? {}) };
  const drawer = DRAWERS[item.subcategory] ?? DRAWERS.fallback;
  const pal = palette(item, options);
  const prefix = `${item.id}-${options.color ?? ""}-${options.fabric ?? ""}-${options.finish ?? ""}-${dims.w}-${dims.d}-${dims.h}`;
  const art = createArt({ prefix, dims: drawer.fit ? drawer.fit(dims, item) : dims, extra: drawer.extra?.(dims, item) });
  drawer.draw(art, { dims: drawer.fit ? drawer.fit(dims, item) : dims, real: dims, item, art: item.art ?? {}, pal });
  let markup = art.svg(item.name?.en);
  if (ORIENT[options.view] === -1) markup = markup.replace("<defs>", `<g transform="translate(400 0) scale(-1 1)"><defs>`).replace(/<\/svg>$/, "</g></svg>");
  return markup;
}

// Top view colour used to tint the item on the 2D plan.
export const planFill = (item, options = {}) => palette(item, options).color;
