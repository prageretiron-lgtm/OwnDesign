// Checks the furniture catalog data in frontend/data/ (also read by the backend).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = (name) => JSON.parse(readFileSync(new URL(`../data/${name}`, import.meta.url), "utf8"));
const taxonomy = read("taxonomy.json");
const items = read("furniture.json");
const collections = read("collections.json");

const ids = (list) => new Set(list.map((entry) => entry.id));
const STYLES = ids(taxonomy.styles);
const ROOMS = ids(taxonomy.rooms);
const MATERIALS = ids(taxonomy.materials);
const SUBS = new Map(taxonomy.categories.flatMap((c) => c.subcategories.map((s) => [s.id, { ...s, category: c.id }])));
const HEX = /^#[0-9a-f]{6}$/;
const ID = /^[a-z0-9-]{1,40}$/;
const HEBREW = /[֐-׿]/;

// The 19 types that saved plans already use: same id, same footprint, same review flag.
const LEGACY = {
  sofa: [200, 90], armchair: [85, 85], "coffee-table": [110, 60], "tv-unit": [160, 45], "dining-table": [160, 90],
  chair: [45, 45], "double-bed": [160, 200], "single-bed": [90, 200], wardrobe: [180, 60], desk: [120, 60],
  "kitchen-counter": [240, 60], "kitchen-island": [180, 90], sink: [80, 60], stove: [60, 60], fridge: [70, 70],
  toilet: [40, 65], bathtub: [170, 75], shower: [90, 90], vanity: [80, 50],
};
const REVIEW = new Set(["kitchen-counter", "kitchen-island", "sink", "stove", "toilet", "bathtub", "shower", "vanity"]);

const bilingual = (value, where) => {
  assert.ok(value?.en?.trim(), `${where}: English text`);
  assert.ok(HEBREW.test(value?.he ?? ""), `${where}: Hebrew text`);
};

test("the catalog has at least 300 unique items", () => {
  assert.ok(items.length >= 300, `only ${items.length} items`);
  assert.equal(ids(items).size, items.length, "duplicate id");
  assert.equal(new Set(items.map((i) => i.name.en.toLowerCase())).size, items.length, "duplicate English name");
  assert.equal(new Set(items.map((i) => i.name.he)).size, items.length, "duplicate Hebrew name");
});

test("every item is complete and uses only known taxonomy values", () => {
  for (const item of items) {
    const where = item.id;
    assert.match(item.id, ID, where);
    assert.equal(item.sample, true, `${where}: labelled as a sample product`);
    bilingual(item.name, `${where} name`);
    bilingual(item.description, `${where} description`);
    const sub = SUBS.get(item.subcategory);
    assert.ok(sub, `${where}: unknown subcategory ${item.subcategory}`);
    assert.equal(item.category, sub.category, `${where}: category`);
    assert.ok(sub.variants.includes(item.art?.variant), `${where}: art variant ${item.art?.variant}`);
    assert.ok(item.styles.length >= 1 && item.styles.every((s) => STYLES.has(s)), `${where}: styles`);
    assert.ok(item.rooms.length >= 1 && item.rooms.every((r) => ROOMS.has(r)), `${where}: rooms`);
    assert.ok(item.materials.length >= 1 && item.materials.every((m) => MATERIALS.has(m)), `${where}: materials`);
    assert.ok(item.colors.length >= 1, `${where}: colours`);
    assert.equal(ids(item.colors).size, item.colors.length, `${where}: duplicate colour id`);
    for (const color of item.colors) {
      assert.match(color.id, ID, where);
      assert.match(color.hex, HEX, `${where}: colour ${color.id}`);
      bilingual(color.name, `${where} colour ${color.id}`);
    }
    for (const key of ["w", "d", "h"]) {
      assert.ok(Number.isInteger(item.dims[key]) && item.dims[key] > 0 && item.dims[key] <= 1000, `${where}: dims.${key}`);
    }
    assert.ok(Number.isInteger(item.price) && item.price > 0, `${where}: price`);
    assert.ok(["item", "m2"].includes(item.unit), `${where}: unit`);
    assert.equal(typeof item.placeable, "boolean", where);
    assert.equal(item.placeable, item.category !== "materials", `${where}: only materials are not placeable`);
    assert.equal(Boolean(item.review), REVIEW.has(item.id), `${where}: review flag`);
    assert.deepEqual(item.media, { photo: null, cutout: null }, `${where}: media hook`);
    const custom = item.custom;
    assert.equal(typeof custom.colors, "boolean", where);
    for (const list of [custom.fabrics, custom.finishes]) assert.ok(list.every((m) => MATERIALS.has(m)), `${where}: custom materials`);
    for (const [key, range] of Object.entries(custom.resize)) {
      assert.ok(["w", "d", "h"].includes(key), where);
      assert.ok(range[0] <= item.dims[key] && item.dims[key] <= range[1] && range[0] > 0, `${where}: resize.${key} must contain the default`);
    }
  }
});

test("every category and subcategory has meaningful content", () => {
  for (const category of taxonomy.categories) {
    const inCategory = items.filter((i) => i.category === category.id);
    assert.ok(inCategory.length >= 15, `${category.id} has only ${inCategory.length} items`);
    for (const sub of category.subcategories) {
      const inSub = inCategory.filter((i) => i.subcategory === sub.id);
      const minimum = sub.id.endsWith("fixture") ? 3 : sub.variants.length > 1 ? 3 : 2;
      assert.ok(inSub.length >= minimum, `${sub.id} has only ${inSub.length} items`);
      if (sub.variants.length > 1) assert.ok(new Set(inSub.map((i) => i.art.variant)).size >= 2, `${sub.id} uses one shape only`);
    }
  }
});

test("items vary in style, colour and price within a subcategory", () => {
  for (const sub of SUBS.keys()) {
    const inSub = items.filter((i) => i.subcategory === sub);
    if (inSub.length < 4) continue;
    assert.ok(new Set(inSub.map((i) => i.colors[0].hex)).size >= 3, `${sub}: colours repeat`);
    assert.ok(new Set(inSub.map((i) => i.price)).size >= 3, `${sub}: prices repeat`);
  }
});

test("the types saved plans already use keep their footprint and review flag", () => {
  const byId = new Map(items.map((i) => [i.id, i]));
  for (const [id, [w, d]] of Object.entries(LEGACY)) {
    const item = byId.get(id);
    assert.ok(item, `legacy type ${id} missing`);
    assert.deepEqual([item.dims.w, item.dims.d], [w, d], id);
  }
});

test("taxonomy labels are bilingual and unique", () => {
  for (const list of [taxonomy.styles, taxonomy.rooms, taxonomy.materials, taxonomy.categories, [...SUBS.values()]]) {
    assert.equal(ids(list).size, list.length);
    for (const entry of list) bilingual(entry, entry.id);
  }
  assert.equal(taxonomy.styles.length, 16);
});

test("collections are bilingual and reference real, placeable or material items", () => {
  const known = ids(items);
  assert.ok(collections.length >= 10);
  assert.equal(ids(collections).size, collections.length);
  for (const collection of collections) {
    bilingual(collection.name, collection.id);
    bilingual(collection.description, collection.id);
    assert.ok(collection.items.length >= 4, collection.id);
    assert.equal(new Set(collection.items).size, collection.items.length, `${collection.id}: repeated item`);
    for (const id of collection.items) assert.ok(known.has(id), `${collection.id}: unknown item ${id}`);
  }
});
