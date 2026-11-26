// Upholstered seating: sofas, sectionals, armchairs.

const LEG_H = { tapered: 14, turned: 13, hairpin: 16, block: 7, sled: 10, cross: 12, plinth: 0, none: 0 };

function legs(a, x0, x1, z0, z1, h, frame, kind) {
  if (!h) return;
  const inset = 6;
  const t = kind === "block" ? 7 : 4.5;
  if (kind === "sled") {
    for (const x of [x0 + inset, x1 - inset]) {
      a.box(x - 1.5, 0, z0 + inset, 3, 2.2, z1 - z0 - 2 * inset, frame);
      a.box(x - 1.5, 0, z0 + inset, 3, h, 3, frame);
    }
    return;
  }
  // Back legs first (painter's order), then front.
  a.leg(x0 + inset, z1 - inset, h, frame, kind, t);
  a.leg(x1 - inset, z1 - inset, h, frame, kind, t);
  a.leg(x0 + inset, z0 + inset, h, frame, kind, t);
  a.leg(x1 - inset, z0 + inset, h, frame, kind, t);
}

function details(a, art, x0, x1, y0, y1, z, up) {
  const color = a.shade(up.color, -0.35);
  if (art.detail === "tufted") {
    const cols = Math.max(3, Math.round((x1 - x0) / 22));
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < cols; c++) {
        const [x, y] = a.P(x0 + ((c + 0.5 + (r % 2) * 0.5) * (x1 - x0)) / (cols + 0.5), y0 + ((r + 1) * (y1 - y0)) / 3, z);
        a.raw(`<circle cx="${a.n(x)}" cy="${a.n(y)}" r="${a.n(Math.max(1, 1.4 * a.s))}" fill="${color}" fill-opacity=".7"/>`);
      }
    }
  } else if (art.detail === "channel") {
    const cols = Math.max(3, Math.round((x1 - x0) / 16));
    for (let c = 1; c < cols; c++) {
      const x = x0 + (c * (x1 - x0)) / cols;
      a.line(a.P(x, y0 + 3, z), a.P(x, y1 - 3, z), color, 1.1, 0.5);
    }
  } else if (art.detail === "piping") {
    a.line(a.P(x0 + 2, y1 - 1, z), a.P(x1 - 2, y1 - 1, z), a.shade(up.color, -0.4), 1.4, 0.55);
  }
}

// Sofa and armchair share one builder; the variant changes the arms, back and cushions.
function upholstered(a, { dims, art, pal }, seats) {
  const { w, d, h } = dims;
  const v = art.variant;
  const up = pal.upholstery;
  const frame = pal.frame;
  const legKind = art.legs ?? (v === "chesterfield" ? "turned" : v === "low-modular" ? "plinth" : "tapered");
  const legH = Math.min(LEG_H[legKind] ?? 12, h * 0.2);
  const seatTop = Math.max(legH + 18, h * 0.5);
  const armless = v === "slipper";
  const armW = armless ? 0 : v === "track-arm" || v === "lounge" ? Math.min(18, w * 0.11) : v === "rolled-arm" || v === "chesterfield" ? Math.min(22, w * 0.13) : Math.min(16, w * 0.1);
  const armH = v === "chesterfield" || v === "wingback" ? h * 0.92 : v === "low-modular" ? seatTop + 6 : v === "barrel" ? h * 0.82 : seatTop + (h - seatTop) * 0.45;
  const backD = Math.min(22, d * 0.24);
  const backH = v === "wingback" ? h : v === "low-modular" ? seatTop + (h - seatTop) * 0.7 : h;
  const r = v === "track-arm" ? 3 : v === "curved" || v === "barrel" ? 14 : 7;

  a.shadow(0, 0, w, d);
  if (legKind === "plinth") a.box(2, 0, 2, w - 4, legH || 6, d - 4, { color: a.shade(up.color, -0.25), material: "none" }, { top: false });
  else legs(a, 0, w, 0, d, legH, frame, legKind);

  const base = legKind === "plinth" ? 6 : legH;
  // Left arm (its side face is hidden by the seat), back, seat, then the right arm last.
  if (armW) a.soft(0, base, 0, armW, armH - base, d, up, r);
  a.soft(armW * 0.6, base, d - backD, w - armW * 1.2, backH - base, backD, up, v === "curved" || v === "barrel" ? 18 : r);
  // Back cushions sit in front of the frame back.
  const inner = w - 2 * armW;
  if (v !== "chesterfield" && v !== "sling") {
    const n = seats;
    const cw = inner / n;
    for (let i = 0; i < n; i++) {
      a.soft(armW + i * cw + 1, seatTop - 2, d - backD - 14, cw - 2, (backH - seatTop) * 0.82, 16, up, 8);
    }
    details(a, art, armW, w - armW, seatTop, seatTop + (backH - seatTop) * 0.8, d - backD - 14, up);
  } else {
    details(a, art, armW, w - armW, seatTop, backH - 4, d - backD, up);
  }
  // Seat base and seat cushions.
  a.box(armW, base, 0, inner, seatTop - base - 9, d - backD, up, { top: false, side: false });
  const n = v === "chesterfield" ? Math.max(1, seats - 1) : seats;
  const cw = inner / n;
  for (let i = 0; i < n; i++) a.soft(armW + i * cw + 0.5, seatTop - 11, 0, cw - 1, 11, d - backD - 4, up, 5);
  if (armW) {
    a.soft(w - armW, base, 0, armW, armH - base, d, up, r);
    if (v === "rolled-arm" || v === "chesterfield") {
      // Scrolled arm fronts.
      for (const x of [armW / 2, w - armW / 2]) {
        const [cx, cy] = a.P(x, armH - armW * 0.45, 0);
        a.raw(`<ellipse cx="${a.n(cx)}" cy="${a.n(cy)}" rx="${a.n(armW * 0.42 * a.s)}" ry="${a.n(armW * 0.36 * a.s)}" fill="${a.shade(up.color, -0.12)}"/>`);
      }
    }
  }
  if (v === "wingback") {
    // Wings: tall side panels at the top of the back.
    for (const x of [0, w - armW]) a.soft(x, armH - 10, d - backD - 10, armW, backH - armH + 10, backD + 10, up, 6);
  }
}

function sling(a, { dims, pal }) {
  const { w, d, h } = dims;
  const frame = pal.frame;
  a.shadow(0, 0, w, d);
  const t = 4;
  // Frame: two side profiles (front leg, back raked leg, arm rail), then the fabric sling and a cushion.
  for (const x of [0, w - t]) {
    a.box(x, 0, 2, t, h * 0.62, t, frame);
    a.box(x, 0, d - 8, t, h, t, frame);
    a.box(x, h * 0.6, 0, t, t, d - 4, frame);
  }
  const [p0] = [a.P(t, h * 0.92, d - 6)];
  const p1 = a.P(w - t, h * 0.92, d - 6), p2 = a.P(w - t, h * 0.25, d * 0.45), p3 = a.P(t, h * 0.25, d * 0.45);
  a.shape(`M${a.n(p0[0])} ${a.n(p0[1])} L${a.n(p1[0])} ${a.n(p1[1])} Q${a.n(p2[0] + 4)} ${a.n(p2[1] + 18)} ${a.n(p2[0])} ${a.n(p2[1])} L${a.n(a.P(w - t, h * 0.32, 4)[0])} ${a.n(a.P(w - t, h * 0.32, 4)[1])} L${a.n(a.P(t, h * 0.32, 4)[0])} ${a.n(a.P(t, h * 0.32, 4)[1])} L${a.n(p3[0])} ${a.n(p3[1])} Q${a.n(p3[0] - 4)} ${a.n(p3[1] + 18)} ${a.n(p0[0])} ${a.n(p0[1])} Z`, pal.upholstery);
  a.soft(t + 2, h * 0.3, 6, w - 2 * t - 4, 9, d * 0.5, pal.upholstery, 4);
}

function barrel(a, ctx) {
  const { w, d, h } = ctx.dims;
  const up = ctx.pal.upholstery;
  a.shadowRound(w / 2, d / 2, w / 2);
  const legH = ctx.art.legs === "plinth" ? 0 : 9;
  if (legH) for (const [x, z] of [[w * 0.2, d * 0.8], [w * 0.8, d * 0.8], [w * 0.2, d * 0.2], [w * 0.8, d * 0.2]]) a.leg(x, z, legH, ctx.pal.frame, ctx.art.legs ?? "tapered", 4);
  // Wrapped back: a wide rounded tub drawn as a curved band, then the seat cushion inside it.
  const L = a.P(0, legH, d * 0.5), R = a.P(w, legH, d * 0.5), TL = a.P(0, h * 0.85, d * 0.55), TR = a.P(w, h * 0.85, d * 0.55);
  const backTop = a.P(w / 2, h, d);
  a.shape(`M${a.n(L[0])} ${a.n(L[1])} L${a.n(TL[0])} ${a.n(TL[1])} Q${a.n(TL[0] + 6)} ${a.n(backTop[1] - 6)} ${a.n(backTop[0])} ${a.n(backTop[1])} Q${a.n(TR[0] - 6)} ${a.n(backTop[1] - 6)} ${a.n(TR[0])} ${a.n(TR[1])} L${a.n(R[0])} ${a.n(R[1])} Z`, up, -0.08);
  a.soft(w * 0.12, legH, 0, w * 0.76, h * 0.46 - legH, d * 0.8, up, 12);
  a.soft(w * 0.14, h * 0.4, 2, w * 0.72, 11, d * 0.62, up, 6);
  const fl = a.P(0, legH, d * 0.35), fr = a.P(w, legH, d * 0.35), tl = a.P(0, h * 0.7, d * 0.4), tr = a.P(w, h * 0.7, d * 0.4);
  // Front arm rolls.
  a.shape(`M${a.n(fl[0])} ${a.n(fl[1])} L${a.n(tl[0])} ${a.n(tl[1])} Q${a.n(tl[0] + 10 * a.s)} ${a.n(tl[1] - 6)} ${a.n(tl[0] + 16 * a.s)} ${a.n(tl[1] + 4)} L${a.n(fl[0] + 16 * a.s)} ${a.n(fl[1])} Z`, up, 0.04);
  a.shape(`M${a.n(fr[0])} ${a.n(fr[1])} L${a.n(tr[0])} ${a.n(tr[1])} Q${a.n(tr[0] - 10 * a.s)} ${a.n(tr[1] - 6)} ${a.n(tr[0] - 16 * a.s)} ${a.n(tr[1] + 4)} L${a.n(fr[0] - 16 * a.s)} ${a.n(fr[1])} Z`, up, -0.06);
}

const seatsFor = (w) => (w < 120 ? 1 : w < 175 ? 2 : w < 260 ? 3 : 4);

export const sofa = { draw: (a, ctx) => upholstered(a, ctx, seatsFor(ctx.dims.w)) };

export const armchair = {
  draw(a, ctx) {
    if (ctx.art.variant === "sling") return sling(a, ctx);
    if (ctx.art.variant === "barrel") return barrel(a, ctx);
    return upholstered(a, ctx, 1);
  },
};

// Sectionals: the main run plus a return (L, U or chaise) drawn as a second upholstered block in front.
export const sectional = {
  extra: () => ({ x: 0, y: 0 }),
  draw(a, ctx) {
    const { w, d, h } = ctx.dims;
    const v = ctx.art.variant;
    const up = ctx.pal.upholstery;
    const depth = Math.min(d, 100);
    const ctxMain = { ...ctx, dims: { w, d, h }, art: { ...ctx.art, variant: v === "modular" ? "low-modular" : "track-arm" } };
    a.shadow(0, 0, w, d);
    if (v === "modular") {
      upholstered(a, ctxMain, seatsFor(w));
      return;
    }
    // Back run along the full width at the rear, returns come forward.
    const seatTop = h * 0.5;
    const back = 22;
    a.soft(0, 6, d - back, w, h - 6, back, up, 7);
    const runD = depth - back;
    const cw = (w - 36) / seatsFor(w);
    for (let i = 0; i < seatsFor(w); i++) a.soft(18 + i * cw, seatTop - 2, d - back - 14, cw - 2, (h - seatTop) * 0.8, 15, up, 8);
    a.box(0, 0, d - depth, w, 6, depth, { color: a.shade(up.color, -0.3), material: "none" }, { top: false });
    a.soft(0, 6, d - depth, 18, h * 0.62, depth, up, 6);
    for (let i = 0; i < seatsFor(w); i++) a.soft(18 + i * cw, 6, d - depth, cw - 1, seatTop - 6, runD, up, 5);
    // Return(s) towards the viewer.
    const retW = v === "chaise" ? Math.min(85, w * 0.32) : Math.min(95, w * 0.34);
    const sides = v === "u-shape" ? [0, w - retW] : [w - retW];
    for (const x of sides) {
      a.box(x, 0, 0, retW, 6, d - depth, { color: a.shade(up.color, -0.3), material: "none" }, { top: false });
      a.soft(x, 6, 0, retW, seatTop - 6, d - depth + 2, up, 6);
      if (v !== "chaise") a.soft(x === 0 ? 0 : x + retW - 18, 6, 0, 18, h * 0.62, d - depth, up, 6);
    }
    a.soft(w - 18, 6, d - depth, 18, h * 0.62, depth, up, 6);
  },
};
