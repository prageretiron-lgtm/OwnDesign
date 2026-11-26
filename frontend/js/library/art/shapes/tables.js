// Tables: coffee tables (and shared helpers for other table types).

export function fourLegs(a, w, d, lh, style, kind = "tapered", t = 4.5, inset = 5) {
  a.leg(inset, d - inset, lh, style, kind, t);
  a.leg(w - inset, d - inset, lh, style, kind, t);
  a.leg(inset, inset, lh, style, kind, t);
  a.leg(w - inset, inset, lh, style, kind, t);
}

export function rectTable(a, { w, d, h }, top, legStyle, kind = "tapered", thick = 4) {
  a.shadow(0, 0, w, d);
  if (kind === "plinth") a.box(w * 0.15, 0, d * 0.2, w * 0.7, h - thick, d * 0.6, legStyle);
  else fourLegs(a, w, d, h - thick, legStyle, kind, Math.max(3.5, Math.min(7, w / 25)));
  a.box(0, h - thick, 0, w, thick, d, top);
}

export function roundTable(a, { w, d, h }, top, base, kind = "pedestal", thick = 4) {
  const r = w / 2;
  a.shadowRound(r, d / 2, r * 0.9);
  if (kind === "pedestal") {
    a.disc(r, 0, d / 2, r * 0.45, d * 0.22, 2, base);
    a.cylinder(r, 0, d / 2, Math.max(4, r * 0.12), h - thick, base, { top: false, taper: 0.8 });
  } else if (kind === "drum") {
    a.cylinder(r, 0, d / 2, r * 0.92, h - thick, base);
  } else {
    for (const [x, z] of [[r * 0.35, d * 0.75], [r * 1.65, d * 0.75], [r * 0.4, d * 0.28], [r * 1.6, d * 0.28]]) a.leg(x, z, h - thick, base, kind, 4);
  }
  a.disc(r, h - thick, d / 2, r, d / 2, thick, top);
}

export const coffeeTable = {
  draw(a, { dims, art, pal }) {
    const { w, d, h } = dims;
    const top = pal.solid, base = pal.frame.material === pal.solid.material ? { ...pal.solid, color: a.shade(pal.solid.color, -0.12) } : pal.frame;
    switch (art.variant) {
      case "round":
        return roundTable(a, dims, top, base, art.legs === "block" ? "drum" : art.legs && art.legs !== "none" ? art.legs : "pedestal", 4);
      case "oval": {
        a.shadowRound(w / 2, d / 2, w / 2);
        // Two splayed plinth feet under an oval top.
        a.box(w * 0.22, 0, d * 0.3, 8, h - 4, d * 0.4, base);
        a.box(w * 0.7, 0, d * 0.3, 8, h - 4, d * 0.4, base);
        a.disc(w / 2, h - 4, d / 2, w / 2, d / 2, 4, top);
        return;
      }
      case "nesting": {
        // Large table at the back, a smaller one pulled out in front and to the right.
        const big = { w: w * 0.72, d: d * 0.9, h };
        a.shadow(0, d * 0.1, big.w, big.d);
        a.raw("");
        const ox = 0, oz = d * 0.1;
        for (const [x, z] of [[ox + 4, oz + big.d - 4], [ox + big.w - 4, oz + big.d - 4], [ox + 4, oz + 4], [ox + big.w - 4, oz + 4]]) a.leg(x, z, h - 3, base, art.legs === "hairpin" ? "hairpin" : "block", 3.5);
        a.box(ox, h - 3, oz, big.w, 3, big.d, top);
        const sw = w * 0.5, sd = d * 0.6, sh = h * 0.78, sx = w * 0.5;
        a.shadow(sx, 0, sw, sd, 0.8);
        for (const [x, z] of [[sx + 4, sd - 4], [sx + sw - 4, sd - 4], [sx + 4, 4], [sx + sw - 4, 4]]) a.leg(x, z, sh - 3, base, art.legs === "hairpin" ? "hairpin" : "block", 3.5);
        a.box(sx, sh - 3, 0, sw, 3, sd, { ...top, color: a.shade(top.color, -0.06) });
        return;
      }
      case "trunk": {
        a.shadow(0, 0, w, d);
        a.box(0, 0, 0, w, h, d, top);
        // Lid seam, strap and corner hardware.
        a.line(a.P(0, h * 0.82, 0), a.P(w, h * 0.82, 0), a.shade(top.color, -0.4), 1.3, 0.6);
        for (const x of [w * 0.25, w * 0.75]) a.box(x - 2.5, 0, -0.5, 5, h, 0.5, { color: a.shade(pal.accent, -0.2), material: "leather" }, { top: false, side: false });
        return;
      }
      default:
        return rectTable(a, dims, top, base, art.legs ?? "tapered", art.legs === "plinth" ? 6 : 4);
    }
  },
};
