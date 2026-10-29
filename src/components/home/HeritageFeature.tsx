import heritageImage from "@/assets/heritage-shirt-fuji.webp";
import { FeatureSection } from "./FeatureSection";

export function HeritageFeature() {
  return (
    <FeatureSection
      image={heritageImage}
      alt="BXLACK embroidered camp-collar shirt worn at sunrise before a snow-capped mountain"
      width={1920}
      height={1281}
      title={["Shirt", "Drops"]}
      type="Shirt"
    />
  );
}
