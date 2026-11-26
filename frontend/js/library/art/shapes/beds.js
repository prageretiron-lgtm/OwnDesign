// Beds: frame, mattress, duvet, pillows and a headboard that changes with the variant.
import { luminance } from "../engine.js";

export const bed = {
  draw(a, { dims, art, pal }) {
    const { w, d, h } = dims;
    const v = art.variant;
    const frame = v === "upholstered" ? pal.upholstery : pal.solid;
    const linen = { color: "#f4f0e8", material: "cotton" };
    const accent = pal.accent === pal.color ? a.shade(pal.color, 0.35) : pal.accent;
    // Keep the throw a textile tone: very dark accents are lifted so the bed does not read as a black block.
    const throwStyle = { color: luminance(accent) < 0.18 ? a.shade(accent, 0.3) : accent, material: "wool" };
    const baseH = v === "platform" ? 18 : 30;
    const legH = v === "platform" ? 0 : art.legs === "plinth" ? 0 : 10;
    const mattress = 22;
    // A canopy's height is the posts; its headboard stays at normal height.
    const headH = Math.max(v === "canopy" ? Math.min(h, 105) : h, baseH + mattress + 30);
    const headD = v === "upholstered" ? 12 : 6;

    a.shadow(0, 0, w, d);
    if (v === "canopy") {
      // Rear posts behind everything.
      for (const x of [0, w - 5]) a.box(x, 0, d - 5, 5, h, 5, frame);
    }
    // Headboard at the back.
    if (v === "upholstered") {
      a.soft(-4, legH, d - headD, w + 8, headH - legH, headD, frame, 14);
      if (art.detail !== "tufted") for (let i = 1; i < 9; i++) a.line(a.P(-4 + (i * (w + 8)) / 9, legH + 30, d - headD), a.P(-4 + (i * (w + 8)) / 9, headH - 8, d - headD), a.shade(frame.color, -0.3), 1, 0.45);
    } else if (v === "slatted") {
      const n = Math.max(7, Math.round(w / 14));
      a.box(0, legH, d - headD, w, baseH - legH, headD, frame);
      for (let i = 0; i < n; i++) a.box((i * w) / n + 1.5, baseH, d - headD + 1, w / n - 3, headH - baseH - 6, headD - 2, frame);
      a.box(0, headH - 6, d - headD, w, 6, headD, frame);
    } else if (v === "platform") {
      a.box(-6, 0, d - headD, w + 12, Math.min(headH, 75), headD, frame);
    } else {
      a.box(0, legH, d - headD, w, headH - legH, headD, frame);
      a.box(4, baseH + mattress, d - headD - 0.2, w - 8, headH - baseH - mattress - 8, 0.2, { color: a.shade(frame.color, -0.08), material: frame.material }, { top: false, side: false });
    }
    // Legs and frame.
    if (legH) for (const [x, z] of [[5, d - headD - 5], [w - 5, d - headD - 5], [5, 5], [w - 5, 5]]) a.leg(x, z, legH, pal.frame, art.legs === "turned" ? "turned" : "block", 6);
    const frameX = v === "platform" ? -10 : 0, frameW = v === "platform" ? w + 20 : w;
    a.box(frameX, legH, 0, frameW, baseH - legH, d - headD, frame);
    // Mattress, pillows, duvet and a folded throw.
    a.soft(3, baseH, 2, w - 6, mattress, d - headD - 4, linen, 5);
    const pw = w > 120 ? (w - 16) / 2 : w - 12;
    for (let i = 0; i < (w > 120 ? 2 : 1); i++) a.soft(6 + i * (pw + 4), baseH + mattress - 2, d - headD - 36, pw, 16, 30, { color: "#fbf8f3", material: "linen" }, 7);
    a.soft(2, baseH + 6, 0, w - 4, mattress + 4, d - headD - 42, { color: a.shade(pal.color, 0.55), material: "linen" }, 5);
    a.soft(1, baseH + 10, 6, w - 2, mattress + 2, d * 0.22, throwStyle, 4);
    if (v === "canopy") {
      for (const x of [0, w - 5]) a.box(x, 0, 0, 5, h, 5, frame);
      a.box(0, h - 5, 0, 5, 5, d, frame);
      a.box(w - 5, h - 5, 0, 5, 5, d, frame);
      a.box(0, h - 5, 0, w, 5, 5, frame);
    }
  },
};
