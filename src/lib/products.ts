import p1 from "@/assets/p1.jpg";
import p2 from "@/assets/p2.jpg";
import p3 from "@/assets/p3.jpg";
import p4 from "@/assets/p4.jpg";
import p5 from "@/assets/p5.jpg";

export type Product = {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
  tag?: string;
};

export const products: Product[] = [
  { id: "obsidian-coat", name: "Obsidian Overcoat", price: 890, category: "Outerwear", image: p1, tag: "SS26 / 001" },
  { id: "void-cargo", name: "Void Cargo Trouser", price: 420, category: "Bottoms", image: p2, tag: "SS26 / 002" },
  { id: "shadow-hood", name: "Shadow Hooded Anorak", price: 560, category: "Tops", image: p3, tag: "SS26 / 003" },
  { id: "onyx-biker", name: "Onyx Biker Jacket", price: 1240, category: "Outerwear", image: p4, tag: "SS26 / 004" },
  { id: "eclipse-knit", name: "Eclipse Cable Knit", price: 380, category: "Knitwear", image: p5, tag: "SS26 / 005" },
];