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
  { id: "venus-flytrap-tee", name: "Venus Flytrap Tee", price: 4999, compareAt: 6499, badge: "New Arrival", category: "Tshirt", image: venusModel, backImage: venusBackModel, tag: "SS26 / 000" },
  { id: "shadow-tee", name: "Shadow Jersey Tee", price: 5499, compareAt: 6999, badge: "New Arrival", category: "Tshirt", image: p3, tag: "SS26 / 001" },
  { id: "obsidian-shirt", name: "Obsidian Camp Shirt", price: 6499, compareAt: 7999, badge: "Best Seller", category: "Shirt", image: p1, tag: "SS26 / 002" },
  { id: "void-denim", name: "Void Raw Denim", price: 6999, category: "Jeans", image: p2, tag: "SS26 / 003" },
  { id: "onyx-denim", name: "Onyx Washed Denim", price: 7999, compareAt: 8999, badge: "Hot Selling", category: "Jeans", image: p4, tag: "SS26 / 004" },
];
