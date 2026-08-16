export type SizeRow = {
  size: string;
  /** cm */
  chest: number;
  /** cm — garment length (tee/shirt) */
  length: number;
  /** cm */
  shoulder: number;
  /** cm — waistband (denim) */
  waist: number;
  /** cm — waistband to crotch (denim) */
  rise: number;
  /** cm — crotch to hem (denim) */
  inseam: number;
};

export const SIZE_ROWS: SizeRow[] = [
  { size: "S", chest: 104, length: 70, shoulder: 48, waist: 76, rise: 28, inseam: 76 },
  { size: "M", chest: 110, length: 72, shoulder: 50, waist: 81, rise: 29, inseam: 77 },
  { size: "L", chest: 116, length: 74, shoulder: 52, waist: 86, rise: 30, inseam: 78 },
  { size: "XL", chest: 122, length: 76, shoulder: 54, waist: 91, rise: 31, inseam: 79 },
  { size: "XXL", chest: 128, length: 78, shoulder: 56, waist: 96, rise: 32, inseam: 80 },
];

export type Unit = "cm" | "in";

export function formatMeasurement(cm: number, unit: Unit): string {
  if (unit === "cm") return `${cm} cm`;
  return `${(cm / 2.54).toFixed(1)}"`;
}

/** Denim uses a different diagram/measurement set than tees & shirts. */
export function garmentKindFor(category: string): "denim" | "top" {
  return category === "Jeans" ? "denim" : "top";
}
