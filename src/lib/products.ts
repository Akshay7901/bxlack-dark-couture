import p1 from "@/assets/p1.jpg";
import p2 from "@/assets/p2.jpg";
import p3 from "@/assets/p3.jpg";
import p4 from "@/assets/p4.jpg";
import venusModel from "@/assets/venus-tee-model.png";
import venusBackModel from "@/assets/venus-tee-model-back.png";

export type Product = {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
  backImage?: string;
  gallery?: string[];
  tag?: string;
  compareAt?: number;
  badge?: string;
};

export const products: Product[] = [
  { id: "shipwreck-tee", name: "Shipwreck Tee", price: 4999, compareAt: 6499, badge: "New Arrival", category: "Tshirt", image: venusModel, backImage: venusBackModel, tag: "BXK-TS-002 / FW25" },
  { id: "stone-logo-tee", name: "Stone Logo Tee", price: 4499, compareAt: 5999, badge: "New Arrival", category: "Tshirt", image: p3, tag: "BXK-TS-003 / FW25" },
  { id: "floral-camp-shirt", name: "Floral Camp Shirt", price: 6499, compareAt: 7999, badge: "Best Seller", category: "Shirt", image: p1, tag: "BXK-SH-001 / FW25" },
  { id: "balloon-panel-jeans", name: "Balloon Panel Jeans", price: 6999, compareAt: 8499, category: "Jeans", image: p2, tag: "BXK-PT-001 / FW25" },
  { id: "washed-carpenter-jeans", name: "Washed Carpenter Jeans", price: 7999, compareAt: 8999, badge: "Hot Selling", category: "Jeans", image: p4, tag: "BXK-PT-002 / FW25" },
];
