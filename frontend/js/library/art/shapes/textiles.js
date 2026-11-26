// Rugs: drawn flat in their own rectangle, then laid onto the floor plane with a perspective-like skew.
import { safeHex } from "../engine.js";

const VIEW_W = 400, VIEW_H = 300;

function floor(a, w, d, inner) {
  // Fit the rug's w x d into a box, then skew it onto the floor plane.
  const maxW = 300, maxD = 250;
  const k = Math.min(maxW / w, maxD / d);
  const W = w * k, D = d * k;
  const sy = 0.5, skew = -0.42;
  const ox = (VIEW_W - W - D * skew * -1 * 0) / 2 + D * 0.21, oy = (VIEW_H - D * sy) / 2;
  a.raw(`<g transform="matrix(1 0 ${skew} ${sy} ${a.n(ox)} ${a.n(oy)})">`);
  a.raw(`<rect x="-6" y="10" width="${a.n(W + 12)}" height="${a.n(D + 6)}" rx="8" fill="#2a2018" fill-opacity=".18" filter="url(#${a.defs("blur", "")})"/>`);
  inner(W, D);
  a.raw("</g>");
}

const stripes = (a, W, D, colors, n, vertical = false) => {
  for (let i = 0; i < n; i++) {
    const c = colors[i % colors.length];
    a.raw(vertical
      ? `<rect x="${a.n((i * W) / n)}" y="0" width="${a.n(W / n / 2)}" height="${a.n(D)}" fill="${c}" fill-opacity=".85"/>`
      : `<rect x="0" y="${a.n((i * D) / n)}" width="${a.n(W)}" height="${a.n(D / n / 2.4)}" fill="${c}" fill-opacity=".85"/>`);
  }
};

function fringe(a, W, D, color) {
  for (let x = 4; x < W; x += 5) {
    a.raw(`<line x1="${a.n(x)}" y1="0" x2="${a.n(x)}" y2="-7" stroke="${color}" stroke-width="1.2"/><line x1="${a.n(x)}" y1="${a.n(D)}" x2="${a.n(x)}" y2="${a.n(D + 7)}" stroke="${color}" stroke-width="1.2"/>`);
  }
}

export const rug = {
  draw(a, { dims, art, item }) {
    const colors = (item.colors ?? []).map((c) => safeHex(c.hex));
    const base = colors[0] ?? "#d9cbb3";
    const pat = colors.slice(1).length ? colors.slice(1) : [a.shade(base, -0.3)];
    const v = art.variant;
    const tex = a.defs(`rugtex-${base.slice(1)}`, `<pattern id="__ID__" width="5" height="5" patternUnits="userSpaceOnUse"><rect width="5" height="5" fill="${base}"/><path d="M0 2.5h5M2.5 0v5" stroke="${a.shade(base, -0.12)}" stroke-width=".7" stroke-opacity=".6"/></pattern>`);
    if (v === "round") {
      const r = 120;
      a.raw(`<ellipse cx="200" cy="176" rx="${r + 10}" ry="${(r + 10) * 0.48}" fill="#2a2018" fill-opacity=".18" filter="url(#${a.defs("blur", "")})"/>`);
      a.raw(`<g transform="translate(200 168) scale(1 .46)">`);
      a.raw(`<circle r="${r}" fill="url(#${tex})"/>`);
      pat.forEach((c, i) => a.raw(`<circle r="${a.n(r * (0.86 - i * 0.22))}" fill="none" stroke="${c}" stroke-width="${a.n(10 - i * 2)}" stroke-opacity=".85"/>`));
      a.raw(`<circle r="${a.n(r * 0.16)}" fill="${pat[0]}" fill-opacity=".8"/>`);
      a.raw(`</g>`);
      return;
    }
    // A runner is drawn lengthwise whichever way its data is oriented.
    const w = v === "runner" ? Math.max(dims.w, dims.d) : dims.w;
    const d = v === "runner" ? Math.max(Math.min(dims.w, dims.d), Math.max(dims.w, dims.d) / 4) : dims.d;
    floor(a, w, d, (W, D) => {
      a.raw(`<rect width="${a.n(W)}" height="${a.n(D)}" rx="3" fill="url(#${tex})"/>`);
      if (v === "striped") stripes(a, W, D, pat, 9);
      else if (v === "geometric") {
        const n = Math.max(4, Math.round(W / 48));
        const cw = W / n, rows = Math.max(2, Math.round(D / cw));
        const ch = D / rows;
        for (let i = 0; i < n; i++) for (let j = 0; j < rows; j++) {
          const cx = (i + 0.5) * cw, cy = (j + 0.5) * ch;
          a.raw(`<path d="M${a.n(cx)} ${a.n(cy - ch * 0.38)} L${a.n(cx + cw * 0.38)} ${a.n(cy)} L${a.n(cx)} ${a.n(cy + ch * 0.38)} L${a.n(cx - cw * 0.38)} ${a.n(cy)} Z" fill="none" stroke="${pat[(i + j) % pat.length]}" stroke-width="3" stroke-opacity=".85"/>`);
        }
      } else if (v === "persian" || v === "runner") {
        const b = Math.min(W, D) * 0.09;
        a.raw(`<rect x="${a.n(b * 0.4)}" y="${a.n(b * 0.4)}" width="${a.n(W - b * 0.8)}" height="${a.n(D - b * 0.8)}" fill="none" stroke="${pat[0]}" stroke-width="${a.n(b * 0.55)}"/>`);
        a.raw(`<rect x="${a.n(b * 1.2)}" y="${a.n(b * 1.2)}" width="${a.n(W - b * 2.4)}" height="${a.n(D - b * 2.4)}" fill="none" stroke="${pat[1 % pat.length]}" stroke-width="2" stroke-dasharray="6 4"/>`);
        const medals = v === "runner" ? 3 : 1;
        for (let m = 0; m < medals; m++) {
          const cx = (W * (m + 0.5)) / medals, cy = D / 2, r = Math.min(W / medals, D) * 0.26;
          a.raw(`<path d="M${a.n(cx)} ${a.n(cy - r)} L${a.n(cx + r * 1.4)} ${a.n(cy)} L${a.n(cx)} ${a.n(cy + r)} L${a.n(cx - r * 1.4)} ${a.n(cy)} Z" fill="${pat[0]}" fill-opacity=".75"/>`);
          a.raw(`<circle cx="${a.n(cx)}" cy="${a.n(cy)}" r="${a.n(r * 0.42)}" fill="${pat[1 % pat.length]}" fill-opacity=".9"/>`);
          for (const [dx, dy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) a.raw(`<path d="M${a.n(dx > 0 ? W - b * 1.2 : b * 1.2)} ${a.n(dy > 0 ? D - b * 1.2 : b * 1.2)} l${a.n(-dx * r * 0.7)} 0 l${a.n(dx * r * 0.7)} ${a.n(-dy * r * 0.45)} z" fill="${pat[0]}" fill-opacity=".55"/>`);
        }
        fringe(a, W, D, a.shade(base, 0.2));
      } else {
        // Plain: a soft border and a subtle tone-on-tone weave.
        a.raw(`<rect x="8" y="8" width="${a.n(W - 16)}" height="${a.n(D - 16)}" rx="2" fill="none" stroke="${pat[0]}" stroke-width="3" stroke-opacity=".55"/>`);
      }
      const sheenId = a.defs("rugsheen", `<linearGradient id="__ID__" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".18"/><stop offset="1" stop-color="#000" stop-opacity=".12"/></linearGradient>`);
      a.raw(`<rect width="${a.n(W)}" height="${a.n(D)}" rx="3" fill="url(#${sheenId})"/>`);
    });
  },
};
