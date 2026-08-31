export type SizeRow = {
  size: string;
  /** cm */
  chest?: number;
  /** cm — garment length (tee/shirt) */
  length?: number;
  /** cm */
  shoulder?: number;
  /** cm — sleeve length (tee/shirt) */
  sleeve?: number;
  /** cm — waistband (denim) */
  waist?: number;
  /** cm — waistband to crotch (denim) */
  rise?: number;
  /** cm — crotch to hem (denim) */
  inseam?: number;
};

export const SIZE_ROWS: SizeRow[] = [
  { size: "S", chest: 104, length: 70, shoulder: 48, waist: 76, rise: 28, inseam: 76 },
  { size: "M", chest: 110, length: 72, shoulder: 50, waist: 81, rise: 29, inseam: 77 },
  { size: "L", chest: 116, length: 74, shoulder: 52, waist: 86, rise: 30, inseam: 78 },
  { size: "XL", chest: 122, length: 76, shoulder: 54, waist: 91, rise: 31, inseam: 79 },
  { size: "XXL", chest: 128, length: 78, shoulder: 56, waist: 96, rise: 32, inseam: 80 },
];

/**
 * Techpack-accurate measurement specs for specific styles, keyed by product slug.
 * Values come from each style's POM (points-of-measure) sheet. Any product not
 * listed here falls back to the generic SIZE_ROWS reference chart.
 */
export const PRODUCT_SIZE_ROWS: Record<string, SizeRow[]> = {
  // BXK-TS-002 — Shipwreck Tee, POM sheet (chest = full, doubled from the
  // sheet's half-chest reading; sizes graded XS–XL per techpack, no XXL).
  "shipwreck-tee": [
    { size: "XS", chest: 96, length: 65, shoulder: 44.5, sleeve: 22 },
    { size: "S", chest: 100, length: 67, shoulder: 46, sleeve: 23 },
    { size: "M", chest: 104, length: 69, shoulder: 47.5, sleeve: 24 },
    { size: "L", chest: 108, length: 71, shoulder: 49, sleeve: 25 },
    { size: "XL", chest: 112, length: 73, shoulder: 50.5, sleeve: 26 },
  ],
};

export function sizeRowsFor(productId?: string): SizeRow[] {
  return (productId && PRODUCT_SIZE_ROWS[productId]) || SIZE_ROWS;
}

export function sizesFor(productId?: string): string[] {
  return sizeRowsFor(productId).map((r) => r.size);
}

export type Unit = "cm" | "in";

export function formatMeasurement(cm: number, unit: Unit): string {
  if (unit === "cm") return `${cm} cm`;
  return `${(cm / 2.54).toFixed(1)}"`;
}

/** Denim uses a different diagram/measurement set than tees & shirts. */
export function garmentKindFor(category: string): "denim" | "top" {
  return category === "Jeans" ? "denim" : "top";
}
