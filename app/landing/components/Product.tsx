import { Separator } from "@/components/ui/separator";
import { pricingTiers, PricingTier } from "@/lib/constants/landing";

const Product = () => {
  interface PricingCardProps {
    pricingTier: PricingTier;
    index: number;
  }

  const getCardStyling = (index: number) => {
    switch (index) {
      case 0: // Free tier
        return "border hover:border-muted-foreground/50";
      case 1: // Supporter tier
        return "border-2 border-primary shadow-lg relative";
      case 2: // Enterprise tier
        return "border-2 border-muted hover:border-foreground/50";
      default:
        return "border";
    }
  };

  const PricingCard = ({ pricingTier, index }: PricingCardProps) => {
    const isSupporter = index === 1;

    return (
      <div
        className={`p-8 hover:scale-105 transition-all duration-300 w-[350px] rounded-2xl ${getCardStyling(
          index
        )}`}
      >
        {isSupporter && (
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-bold">
            Recommended
          </div>
        )}
        <div className="flex flex-col h-full justify-between space-y-6">
          {/* Header Section */}
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-3xl font-bold">{pricingTier.name}</h3>
              <div className="text-3xl font-bold text-primary">
                {pricingTier.price}
              </div>
            </div>
            <Separator className="my-4" />
            {/* Features Section */}
            <div className="space-y-4">
              <h4 className="text-xl font-semibold">This tier includes:</h4>
              <ul className="space-y-2">
                {pricingTier.perks.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start">
                    <span className="text-primary mr-3 mt-1">•</span>
                    <span className="text-base leading-relaxed">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          {/* Bottom Section */}
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="text-lg font-semibold">Who is this for?</h4>
              <p className="leading-relaxed">{pricingTier.for}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="flex items-stretch justify-center gap-8 py-8">
        {pricingTiers.map((tier, index) => (
          <PricingCard pricingTier={tier} index={index} key={index} />
        ))}
      </div>
      <div className="flex justify-center text-center">
        <p className="text-sm text-muted-foreground italic border-t pt-4 max-w-md">
          All prices are on a monthly recurring basis.
        </p>
      </div>
    </div>
  );
};

export default Product;
