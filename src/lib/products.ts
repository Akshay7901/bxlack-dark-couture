import p1 from "@/assets/p1.jpg";
import p2 from "@/assets/p2.jpg";
import p3 from "@/assets/p3.jpg";
import p4 from "@/assets/p4.jpg";
import p5 from "@/assets/p5.jpg";
import venusModel from "@/assets/venus-tee-model.jpg";
import venusBackModel from "@/assets/venus-tee-model-back.jpg";

export type Product = {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
  backImage?: string;
  tag?: string;
};

export const products: Product[] = [
  { id: "venus-flytrap-tee", name: "Venus Flytrap Tee", price: 220, category: "Tshirt", image: venusModel, backImage: venusBackModel, tag: "SS26 / 000" },
  { id: "obsidian-coat", name: "Obsidian Overcoat", price: 890, category: "Shirt", image: p1, tag: "SS26 / 001" },
  { id: "void-cargo", name: "Void Cargo Trouser", price: 420, category: "Jeans", image: p2, tag: "SS26 / 002" },
  { id: "shadow-hood", name: "Shadow Hooded Anorak", price: 560, category: "Tshirt", image: p3, tag: "SS26 / 003" },
  { id: "onyx-biker", name: "Onyx Biker Jacket", price: 1240, category: "Shirt", image: p4, tag: "SS26 / 004" },
  { id: "eclipse-knit", name: "Eclipse Cable Knit", price: 380, category: "Tshirt", image: p5, tag: "SS26 / 005" },
];
