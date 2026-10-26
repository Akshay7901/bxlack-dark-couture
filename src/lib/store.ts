/**
 * Store details printed on shipping labels, packing slips and invoices.
 * Fill in the return address so couriers know where undeliverable parcels go.
 */
export const STORE = {
  name: "BXLACK",
  email: "clients@bxlack.com",
  phone: "",
  /** Return / pickup address, one line per entry, e.g. ["12 Example Road", "Mumbai, Maharashtra 400001", "India"]. */
  returnAddress: [] as string[],
};
