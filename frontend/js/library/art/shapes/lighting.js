// Lighting: hanging pendants (with a warm glow) — other lighting types reuse these helpers.

export function glow(a, x, y, r, strength = 1) {
  const g = a.defs("glow", `<radialGradient id="__ID__"><stop offset="0" stop-color="#ffe6b0" stop-opacity=".85"/><stop offset=".45" stop-color="#ffd98f" stop-opacity=".28"/><stop offset="1" stop-color="#ffd98f" stop-opacity="0"/></radialGradient>`);
  a.raw(`<circle cx="${a.n(x)}" cy="${a.n(y)}" r="${a.n(r)}" fill="url(#${g})" fill-opacity="${a.n(strength)}"/>`);
}

const CABLE = 60;

export const pendant = {
  extra: (dims) => ({ x: 0, y: CABLE }),
  draw(a, { dims, art, pal }) {
    const { w, d, h } = dims;
    const shadeStyle = { color: pal.color, material: pal.materials[0] };
    const metal = { color: pal.frame.color, material: pal.finish ?? "brass" };
    const cx = w / 2, cz = d / 2;
    const drop = (x, yTop, yBottom) => a.line(a.P(x, yTop, cz), a.P(x, yBottom, cz), "#2b2622", 1.2, 0.9);
    a.box(cx - 6, h + CABLE - 2, cz - 6, 12, 2, 12, metal); // ceiling canopy
    switch (art.variant) {
      case "globe": {
        drop(cx, h + CABLE - 2, h);
        const [x, y] = a.P(cx, h / 2, cz);
        const r = (w / 2) * a.s;
        glow(a, x, y + r * 0.1, r * 2.1);
        a.raw(`<circle cx="${a.n(x)}" cy="${a.n(y)}" r="${a.n(r)}" fill="${shadeStyle.color}" fill-opacity=".92"/>`);
        a.raw(`<circle cx="${a.n(x)}" cy="${a.n(y)}" r="${a.n(r)}" fill="url(#${a.defs(`gl-${shadeStyle.color.slice(1)}`, `<radialGradient id="__ID__" cx=".38" cy=".32" r=".75"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset=".5" stop-color="#fff8e8" stop-opacity=".15"/><stop offset="1" stop-color="#000" stop-opacity=".18"/></radialGradient>`)})"/>`);
        a.box(cx - 3, h - 2, cz - 3, 6, 4, 6, metal);
        break;
      }
      case "cluster": {
        const balls = [[cx - w * 0.28, h * 0.55, w * 0.2], [cx + w * 0.22, h * 0.75, w * 0.17], [cx + w * 0.02, h * 0.25, w * 0.22], [cx - w * 0.05, h * 0.9, w * 0.12]];
        for (const [x, y, r] of balls) drop(x, h + CABLE - 2, y + r);
        for (const [x, y, r] of balls) {
          const [px, py] = a.P(x, y, cz);
          glow(a, px, py, r * a.s * 2.2, 0.7);
          a.raw(`<circle cx="${a.n(px)}" cy="${a.n(py)}" r="${a.n(r * a.s)}" fill="${shadeStyle.color}" fill-opacity=".85"/>`);
          a.raw(`<circle cx="${a.n(px - r * a.s * 0.35)}" cy="${a.n(py - r * a.s * 0.35)}" r="${a.n(r * a.s * 0.25)}" fill="#fff" fill-opacity=".6"/>`);
        }
        break;
      }
      case "linear": {
        for (const x of [w * 0.15, w * 0.85]) drop(x, h + CABLE - 2, h);
        a.box(0, h * 0.4, cz - d / 2, w, h * 0.6, d, metal);
        const [x0, y0] = a.P(0, h * 0.4, cz), [x1] = a.P(w, h * 0.4, cz);
        a.raw(`<rect x="${a.n(x0)}" y="${a.n(y0)}" width="${a.n(x1 - x0)}" height="${a.n(30 * a.s)}" fill="url(#${a.defs("down", `<linearGradient id="__ID__" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe2a6" stop-opacity=".55"/><stop offset="1" stop-color="#ffe2a6" stop-opacity="0"/></linearGradient>`)})"/>`);
        break;
      }
      default: {
        // Dome: a flared shade, darker inside, with light falling from the open bottom.
        drop(cx, h + CABLE - 2, h);
        const [x, yTop] = a.P(cx, h, cz), [, yBot] = a.P(cx, 0, cz);
        const R = (w / 2) * a.s, ry = R * 0.24, neck = R * 0.16;
        const bottomGlow = a.defs("down", `<linearGradient id="__ID__" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe2a6" stop-opacity=".6"/><stop offset="1" stop-color="#ffe2a6" stop-opacity="0"/></linearGradient>`);
        a.raw(`<path d="M${a.n(x - R * 1.15)} ${a.n(yBot + 48)} L${a.n(x - R)} ${a.n(yBot)} L${a.n(x + R)} ${a.n(yBot)} L${a.n(x + R * 1.15)} ${a.n(yBot + 48)} Z" fill="url(#${bottomGlow})"/>`);
        a.raw(`<ellipse cx="${a.n(x)}" cy="${a.n(yBot)}" rx="${a.n(R)}" ry="${a.n(ry)}" fill="#fff4d6"/>`);
        a.shape(`M${a.n(x - neck)} ${a.n(yTop)} C${a.n(x - R * 0.5)} ${a.n(yTop + (yBot - yTop) * 0.15)} ${a.n(x - R)} ${a.n(yTop + (yBot - yTop) * 0.5)} ${a.n(x - R)} ${a.n(yBot)} A${a.n(R)} ${a.n(ry)} 0 0 0 ${a.n(x + R)} ${a.n(yBot)} C${a.n(x + R)} ${a.n(yTop + (yBot - yTop) * 0.5)} ${a.n(x + R * 0.5)} ${a.n(yTop + (yBot - yTop) * 0.15)} ${a.n(x + neck)} ${a.n(yTop)} Z`, shadeStyle);
        if (art.detail === "brass-trim") a.raw(`<path d="M${a.n(x - R)} ${a.n(yBot)} A${a.n(R)} ${a.n(ry)} 0 0 0 ${a.n(x + R)} ${a.n(yBot)}" fill="none" stroke="${pal.frame.color}" stroke-width="2.2"/>`);
      }
    }
  },
};
