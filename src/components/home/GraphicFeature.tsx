import stoneTeeImage from "@/assets/stone-tee-back.webp";
import { FeatureSection } from "./FeatureSection";

export function GraphicFeature() {
  return (
    <FeatureSection
      image={stoneTeeImage}
      alt="BXLACK Stone Logo Tee shot from behind, model standing in a concrete corridor"
      width={1448}
      height={1086}
      title={["T-Shirt", "Drops"]}
      type="Tshirt"
    />
  );
}
