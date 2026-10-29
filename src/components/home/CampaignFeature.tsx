import campaignImage from "@/assets/campaign-studio.webp";
import { FeatureSection } from "./FeatureSection";

export function CampaignFeature() {
  return (
    <FeatureSection
      image={campaignImage}
      alt="BXLACK model in an oversized graphic tee and wide-leg denim, studio shot against a concrete backdrop"
      width={1920}
      height={1080}
      title={["Jeans", "Drop"]}
      type="Jeans"
    />
  );
}
