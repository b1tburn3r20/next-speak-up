export type PricingTier = {
  name: string;
  price: string;
  perks: string[];
  for: string;
};
export const pricingTiers = [
  {
    name: "Member",
    price: "Free",
    perks: [
      "All bill functionality",
      "All legislator functionality",
      "5 TTS readings per",
      "15 chatbot messages",
    ],
    for: "Everyone",
  },
  {
    name: "Supporter",
    price: "$3/month",
    perks: [
      "Everything in member",
      "30 TTS readings per",
      "70 chatbot messages",
      "Supporter badge",
    ],
    for: "People really invested in understanding politics",
  },
  {
    name: "Enterprise",
    price: "$500/month",
    perks: [
      "Everything in member",
      "unlimited TTS readings per",
      "unlimted chatbot messages",
      "Enterprise badge",
      "Contact with the developers to suggest potential features tailored to your needs.",
    ],
    for: "Corperations or interested parties in need of tailored softwares",
  },
];
