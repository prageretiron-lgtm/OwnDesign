// Subcategory id -> drawer. Each drawer is { draw(art, ctx), extra?(dims, item), fit?(dims, item) }.
import { bed } from "./beds.js";
import { pendant } from "./lighting.js";
import { armchair, sectional, sofa } from "./seating.js";
import { coffeeTable } from "./tables.js";
import { rug } from "./textiles.js";

// Used until a subcategory has its own drawer: a shaded block in the item's colour and material.
const fallback = {
  draw(a, { dims, pal }) {
    a.shadow(0, 0, dims.w, dims.d);
    a.box(0, 0, 0, dims.w, dims.h, dims.d, pal.solid);
  },
};

export const DRAWERS = {
  fallback,
  sofa,
  sectional,
  armchair,
  "coffee-table": coffeeTable,
  bed,
  pendant,
  rug,
};
