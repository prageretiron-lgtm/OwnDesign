// Drawing engine for catalog illustrations: a small oblique 3/4 projection with shaded faces, material
// textures and a soft contact shadow. Output is an SVG string built only from numbers, validated hex colours
// and a sanitised id prefix, so it is safe to insert as markup.
//
// Coordinates are centimetres in item space: x to the right (0..w), y up (0..h), z away from the viewer (0..d).

export const VIEW_W = 400;
export const VIEW_H = 300;
const KX = 0.42; // receding axis, horizontal share per cm of depth
const KY = 0.26; // receding axis, vertical share per cm of depth
const MARGIN = 26;

const HEX = /^#[0-9a-f]{6}$/;
export const safeHex = (hex, fallback = "#b9a58c") => (HEX.test(hex ?? "") ? hex : fallback);

const toRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const toHex = (rgb) => `#${rgb.map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0")).join("")}`;
export const mix = (a, b, t) => toHex(toRgb(safeHex(a)).map((v, i) => v + (toRgb(safeHex(b))[i] - v) * t));
// amount > 0 lightens towards white, < 0 darkens towards a warm near-black (reads as shadow, not grey).
export const shade = (hex, amount) => (amount >= 0 ? mix(hex, "#ffffff", amount) : mix(hex, "#1d1712", -amount));
export const luminance = (hex) => {
  const [r, g, b] = toRgb(safeHex(hex)).map((v) => v / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const n = (value) => (Math.round(value * 10) / 10).toString();
const pts = (list) => list.map(([x, y]) => `${n(x)},${n(y)}`).join(" ");

// Material kinds share one texture each; the tint comes from the chosen colour.
const TEXTURE = {
  oak: "grain", walnut: "grain", ash: "grain", teak: "grain", pine: "grain", bamboo: "grain",
  rattan: "weave", cane: "cane", jute: "weave",
  marble: "veins", travertine: "pores", granite: "speckle", terrazzo: "terrazzo", concrete: "speckle",
  linen: "linen", cotton: "linen", boucle: "boucle", velvet: "velvet", wool: "linen", leather: "leather",
  brass: "metal", "black-metal": "metal", chrome: "metal", steel: "metal",
  glass: "glass", ceramic: "glaze", terracotta: "pores", plaster: "pores", lacquer: "glaze", paper: "linen", paint: "none",
};
export const textureOf = (material) => TEXTURE[material] ?? "none";

export function createArt({ prefix, dims, extra = { x: 0, y: 0 } }) {
  const id = String(prefix).toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 60) || "art";
  const w = Math.max(1, dims.w), h = Math.max(1, dims.h), d = Math.max(1, dims.d);
  // Fit the projected bounding box (plus any overhang the drawer declares) into the view.
  const spanX = w + d * KX + extra.x;
  const spanY = h + d * KY + extra.y;
  const s = Math.min((VIEW_W - 2 * MARGIN) / spanX, (VIEW_H - 2 * MARGIN - 12) / spanY);
  const ox = (VIEW_W - spanX * s) / 2 + (extra.x > 0 ? (extra.x / 2) * s : 0);
  const oy = VIEW_H - MARGIN - 10 - ((VIEW_H - 2 * MARGIN - 12 - spanY * s) / 2);
  const defs = new Map();
  const body = [];

  const P = (x, y, z) => [ox + (x + z * KX) * s, oy - (y + z * KY) * s];
  // A definition's markup may use __ID__ for its own id.
  const def = (key, markup) => {
    if (!defs.has(key)) defs.set(key, markup.replaceAll("__ID__", `${id}-${key}`));
    return `${id}-${key}`;
  };
  const ref = (key) => `url(#${id}-${key})`;

  // Vertical soft-light gradient laid over front faces: gives volume without an outline.
  const sheen = def("sheen", `<linearGradient id="${id}-sheen" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".12"/></linearGradient>`);
  const blur = def("blur", `<filter id="${id}-blur" x="-30%" y="-80%" width="160%" height="260%"><feGaussianBlur stdDeviation="7"/></filter>`);
  const soft = def("soft", `<filter id="${id}-soft" x="-30%" y="-80%" width="160%" height="260%"><feGaussianBlur stdDeviation="2.2"/></filter>`);
  void sheen; void blur; void soft;

  function texture(kind, color) {
    const c = safeHex(color);
    const dark = shade(c, -0.28), light = shade(c, 0.22);
    const key = `t-${kind}-${c.slice(1)}`;
    const tile = (size, inner, extraAttrs = "") =>
      def(key, `<pattern id="${id}-${key}" width="${size}" height="${size}" patternUnits="userSpaceOnUse"${extraAttrs}>${inner}</pattern>`);
    switch (kind) {
      case "grain":
        return tile(46, `<path d="M0 6 Q12 3 23 7 T46 6 M0 17 Q14 20 25 15 T46 18 M0 29 Q10 26 22 30 T46 28 M0 40 Q16 43 28 38 T46 41" fill="none" stroke="${dark}" stroke-opacity=".32" stroke-width="1.1"/><ellipse cx="31" cy="23" rx="4.5" ry="1.8" fill="none" stroke="${dark}" stroke-opacity=".3"/>`, ` patternTransform="scale(1.4 .55)"`);
      case "weave":
        return tile(10, `<path d="M0 2.5h10M0 7.5h10" stroke="${light}" stroke-opacity=".55" stroke-width="2.4"/><path d="M2.5 0v10M7.5 0v10" stroke="${dark}" stroke-opacity=".35" stroke-width="1.4"/>`, ` patternTransform="rotate(45)"`);
      case "cane":
        return tile(12, `<circle cx="6" cy="6" r="2.6" fill="none" stroke="${dark}" stroke-opacity=".45" stroke-width=".9"/><path d="M0 0L12 12M12 0L0 12M6 0v12M0 6h12" stroke="${light}" stroke-opacity=".5" stroke-width=".8"/>`);
      case "veins":
        return tile(120, `<path d="M-5 30 C25 22 40 48 70 38 S110 18 125 26 M10 95 C35 80 55 102 80 88 S115 70 130 78 M60 0 C66 22 52 40 62 60" fill="none" stroke="${dark}" stroke-opacity=".28" stroke-width="1.3"/><path d="M0 60 C30 66 50 52 90 64" fill="none" stroke="${dark}" stroke-opacity=".16" stroke-width="3"/>`);
      case "pores":
        return tile(26, `<ellipse cx="5" cy="7" rx="2.2" ry=".9" fill="${dark}" fill-opacity=".25"/><ellipse cx="18" cy="15" rx="3" ry="1" fill="${dark}" fill-opacity=".2"/><ellipse cx="10" cy="22" rx="1.6" ry=".7" fill="${dark}" fill-opacity=".22"/>`);
      case "speckle":
        return tile(18, `<circle cx="3" cy="4" r=".9" fill="${dark}" fill-opacity=".4"/><circle cx="12" cy="9" r=".7" fill="${light}" fill-opacity=".6"/><circle cx="7" cy="15" r="1" fill="${dark}" fill-opacity=".3"/><circle cx="15" cy="2" r=".6" fill="${dark}" fill-opacity=".35"/>`);
      case "terrazzo":
        return tile(40, `<path d="M5 6l5 -2 2 4 -4 3z" fill="${dark}" fill-opacity=".45"/><path d="M24 12l6 1 -1 5 -6 -1z" fill="#b7553b" fill-opacity=".45"/><path d="M14 28l4 -3 3 3 -3 4z" fill="#56706a" fill-opacity=".45"/><path d="M32 30l4 1 -2 4z" fill="${dark}" fill-opacity=".5"/><circle cx="8" cy="34" r="1.6" fill="${light}"/>`);
      case "linen":
        return tile(6, `<path d="M0 1.5h6M0 4.5h6" stroke="${light}" stroke-opacity=".35" stroke-width=".8"/><path d="M1.5 0v6M4.5 0v6" stroke="${dark}" stroke-opacity=".18" stroke-width=".8"/>`);
      case "boucle":
        return tile(9, `<circle cx="2.2" cy="2.4" r="1.6" fill="${light}" fill-opacity=".55"/><circle cx="6.8" cy="6.6" r="1.7" fill="${light}" fill-opacity=".5"/><circle cx="6.6" cy="2" r=".9" fill="${dark}" fill-opacity=".2"/><circle cx="2" cy="7" r="1" fill="${dark}" fill-opacity=".18"/>`);
      case "velvet":
        return def(key, `<linearGradient id="${id}-${key}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${light}" stop-opacity=".5"/><stop offset=".45" stop-color="${c}" stop-opacity="0"/><stop offset="1" stop-color="${dark}" stop-opacity=".45"/></linearGradient>`);
      case "leather":
        return def(key, `<radialGradient id="${id}-${key}" cx=".3" cy=".25" r=".9"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".2"/></radialGradient>`);
      case "metal":
        return def(key, `<linearGradient id="${id}-${key}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${dark}" stop-opacity=".5"/><stop offset=".35" stop-color="#fff" stop-opacity=".55"/><stop offset=".55" stop-color="${c}" stop-opacity="0"/><stop offset="1" stop-color="${dark}" stop-opacity=".45"/></linearGradient>`);
      case "glass":
        return def(key, `<linearGradient id="${id}-${key}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".7"/><stop offset=".3" stop-color="#fff" stop-opacity="0"/><stop offset=".7" stop-color="#fff" stop-opacity=".12"/><stop offset="1" stop-color="#fff" stop-opacity=".35"/></linearGradient>`);
      case "glaze":
        return def(key, `<radialGradient id="${id}-${key}" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".45"/><stop offset=".4" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".15"/></radialGradient>`);
      default:
        return null;
    }
  }

  // A surface style: { color, material, opacity }. Paints a polygon or path with tint, texture and sheen.
  function paint(shapeMarkup, style, tone = 0, { glow = true } = {}) {
    const color = shade(safeHex(style.color), tone);
    const op = style.opacity != null ? ` fill-opacity="${n(style.opacity)}"` : "";
    const kind = textureOf(style.material);
    const tex = kind === "none" ? null : texture(kind, color);
    body.push(shapeMarkup.replace("FILL", `fill="${color}"${op}`));
    if (tex) body.push(shapeMarkup.replace("FILL", `fill="url(#${tex})"`));
    if (glow) body.push(shapeMarkup.replace("FILL", `fill="${ref("sheen")}"`));
  }
  const poly = (points) => `<polygon points="${pts(points)}" FILL/>`;
  const pathOf = (dAttr) => `<path d="${dAttr}" FILL/>`;

  const api = {
    s, P, n, pts, shade, mix,
    // Soft floor shadow under a footprint (x, z rectangle) plus a darker contact line.
    shadow(x = 0, z = 0, fw = w, fd = d, strength = 1) {
      const a = P(x - 4, 0, z - 2), b = P(x + fw + 4, 0, z - 2), c = P(x + fw + 4, 0, z + fd + 2), e = P(x - 4, 0, z + fd + 2);
      body.push(`<polygon points="${pts([a, b, c, e])}" fill="#2a2018" fill-opacity="${n(0.22 * strength)}" filter="${ref("blur")}"/>`);
      const f = P(x, 0, z), g = P(x + fw, 0, z);
      body.push(`<line x1="${n(f[0])}" y1="${n(f[1] + 1)}" x2="${n(g[0])}" y2="${n(g[1] + 1)}" stroke="#2a2018" stroke-opacity="${n(0.25 * strength)}" stroke-width="3" filter="${ref("soft")}"/>`);
    },
    // Round floor shadow centred at (cx, cz).
    shadowRound(cx, cz, r, strength = 1) {
      const [x, y] = P(cx, 0, cz);
      body.push(`<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n((r + 6) * s)}" ry="${n((r + 6) * s * 0.36)}" fill="#2a2018" fill-opacity="${n(0.24 * strength)}" filter="${ref("blur")}"/>`);
    },
    // Axis-aligned box: front, right side and top faces, shaded.
    box(x, y, z, bw, bh, bd, style, { top = true, side = true } = {}) {
      const f = [P(x, y, z), P(x + bw, y, z), P(x + bw, y + bh, z), P(x, y + bh, z)];
      if (side) paint(poly([P(x + bw, y, z), P(x + bw, y, z + bd), P(x + bw, y + bh, z + bd), P(x + bw, y + bh, z)]), style, -0.2, { glow: false });
      if (top) paint(poly([P(x, y + bh, z), P(x + bw, y + bh, z), P(x + bw, y + bh, z + bd), P(x, y + bh, z + bd)]), style, 0.14, { glow: false });
      paint(poly(f), style, 0);
    },
    // Upholstered block: a box whose front and top edges are rounded by r cm. Used for cushions, arms, seats.
    soft(x, y, z, bw, bh, bd, style, r = 6) {
      r = Math.min(r, bw / 2, bh / 2, bd / 2);
      const [x0, y0] = P(x, y, z), [x1] = P(x + bw, y, z), [, y1] = P(x, y + bh, z);
      const R = r * s;
      const dx = bd * KX * s, dy = bd * KY * s;
      // side
      paint(pathOf(`M${n(x1)} ${n(y0 - R)} L${n(x1 + dx)} ${n(y0 - dy - R)} L${n(x1 + dx)} ${n(y1 - dy + R)} Q${n(x1 + dx)} ${n(y1 - dy)} ${n(x1 + dx - R * 0.6)} ${n(y1 - dy)} L${n(x1 - R)} ${n(y1)} Z`), style, -0.2, { glow: false });
      // top: square at the front edge so neighbouring cushions meet without gaps
      paint(pathOf(`M${n(x0)} ${n(y1 + R)} L${n(x1)} ${n(y1 + R)} L${n(x1 + dx - R * 0.6)} ${n(y1 - dy)} L${n(x0 + dx + R * 0.6)} ${n(y1 - dy)} Q${n(x0 + dx)} ${n(y1 - dy)} ${n(x0 + dx * 0.4)} ${n(y1 - dy * 0.6)} Z`), style, 0.12, { glow: false });
      // front, rounded corners
      paint(pathOf(`M${n(x0 + R)} ${n(y0)} L${n(x1 - R)} ${n(y0)} Q${n(x1)} ${n(y0)} ${n(x1)} ${n(y0 - R)} L${n(x1)} ${n(y1 + R)} Q${n(x1)} ${n(y1)} ${n(x1 - R)} ${n(y1)} L${n(x0 + R)} ${n(y1)} Q${n(x0)} ${n(y1)} ${n(x0)} ${n(y1 + R)} L${n(x0)} ${n(y0 - R)} Q${n(x0)} ${n(y0)} ${n(x0 + R)} ${n(y0)} Z`), style, 0);
    },
    // Vertical cylinder standing at (cx, y, cz): body plus elliptical top.
    cylinder(cx, y, cz, r, ch, style, { top = true, taper = 1 } = {}) {
      const [bx, by] = P(cx, y, cz), [, ty] = P(cx, y + ch, cz);
      const rx = r * s, ry = r * s * 0.34, trx = rx * taper, try_ = ry * taper;
      const c = safeHex(style.color);
      const id2 = def(`cyl-${c.slice(1)}`, `<linearGradient id="__ID__" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${shade(c, -0.22)}"/><stop offset=".38" stop-color="${shade(c, 0.12)}"/><stop offset="1" stop-color="${shade(c, -0.3)}"/></linearGradient>`);
      const bodyPath = `M${n(bx - rx)} ${n(by)} A${n(rx)} ${n(ry)} 0 0 0 ${n(bx + rx)} ${n(by)} L${n(bx + trx)} ${n(ty)} L${n(bx - trx)} ${n(ty)} Z`;
      paint(pathOf(bodyPath), style, 0, { glow: false });
      body.push(`<path d="${bodyPath}" fill="url(#${id2})" fill-opacity=".75"/>`);
      if (top) paint(`<ellipse cx="${n(bx)}" cy="${n(ty)}" rx="${n(trx)}" ry="${n(try_)}" FILL/>`, style, 0.16, { glow: false });
    },
    // Flat horizontal ellipse (table top, rug, tray) at height y, centred (cx, cz), radii in cm.
    disc(cx, y, cz, rx, rz, thick, style) {
      const [x, yy] = P(cx, y, cz);
      const RX = rx * s + rz * KX * s * 0.15, RY = rz * s * KY * 1.3 + rx * s * 0.02;
      if (thick > 0) {
        const t = thick * s;
        paint(pathOf(`M${n(x - RX)} ${n(yy)} A${n(RX)} ${n(RY)} 0 0 0 ${n(x + RX)} ${n(yy)} L${n(x + RX)} ${n(yy - t)} L${n(x - RX)} ${n(yy - t)} Z`), style, -0.16, { glow: false });
      }
      paint(`<ellipse cx="${n(x)}" cy="${n(yy - thick * s)}" rx="${n(RX)}" ry="${n(RY)}" FILL/>`, style, 0.1, { glow: false });
    },
    // A straight leg from the floor to height lh at (x, z); styles: tapered, turned, hairpin, block, sled, cross.
    leg(x, z, lh, style, kind = "tapered", thick = 4) {
      const [bx, by] = P(x, 0, z), [, ty] = P(x, lh, z);
      const t = thick * s;
      const c = safeHex(style.color);
      if (kind === "hairpin") {
        body.push(`<path d="M${n(bx - t)} ${n(ty)} L${n(bx)} ${n(by)} L${n(bx + t)} ${n(ty)}" fill="none" stroke="${shade(c, -0.35)}" stroke-width="${n(Math.max(1.2, t * 0.25))}" stroke-linecap="round"/>`);
        return;
      }
      if (kind === "turned") {
        paint(pathOf(`M${n(bx - t * 0.3)} ${n(by)} L${n(bx + t * 0.3)} ${n(by)} L${n(bx + t * 0.5)} ${n(by - (by - ty) * 0.45)} Q${n(bx + t * 0.9)} ${n(by - (by - ty) * 0.55)} ${n(bx + t * 0.5)} ${n(by - (by - ty) * 0.65)} L${n(bx + t * 0.55)} ${n(ty)} L${n(bx - t * 0.55)} ${n(ty)} L${n(bx - t * 0.5)} ${n(by - (by - ty) * 0.65)} Q${n(bx - t * 0.9)} ${n(by - (by - ty) * 0.55)} ${n(bx - t * 0.5)} ${n(by - (by - ty) * 0.45)} Z`), style, -0.05);
        return;
      }
      const bottom = kind === "tapered" ? t * 0.28 : t * 0.5;
      paint(poly([[bx - bottom, by], [bx + bottom, by], [bx + t * 0.5, ty], [bx - t * 0.5, ty]]), style, -0.08);
    },
    line(a, b, color, width = 1.5, opacity = 1) {
      body.push(`<line x1="${n(a[0])}" y1="${n(a[1])}" x2="${n(b[0])}" y2="${n(b[1])}" stroke="${safeHex(color)}" stroke-opacity="${n(opacity)}" stroke-width="${n(width)}" stroke-linecap="round"/>`);
    },
    curve(dAttr, color, width = 1.5, opacity = 1) {
      body.push(`<path d="${dAttr}" fill="none" stroke="${safeHex(color)}" stroke-opacity="${n(opacity)}" stroke-width="${n(width)}" stroke-linecap="round"/>`);
    },
    shape(dAttr, style, tone = 0, glow = true) {
      paint(pathOf(dAttr), style, tone, { glow });
    },
    polygon(points, style, tone = 0, glow = true) {
      paint(poly(points), style, tone, { glow });
    },
    // raw, curve, shape and defs take markup as given: drawers must pass only numbers through n(),
    // colours through safeHex/shade, and fixed strings. Never item text.
    raw(markup) {
      body.push(markup);
    },
    defs: def,
    url: ref,
    svg(title) {
      const label = String(title ?? "").replace(/[<>&"]/g, "");
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEW_W} ${VIEW_H}" role="img" aria-label="${label}"><defs>${[...defs.values()].join("")}</defs>${body.join("")}</svg>`;
    },
  };
  return api;
}
