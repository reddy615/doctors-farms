export type Room = {
  name: string;
  description: string;
  pricePerNight: number;
  features: string[];
  image: string;
  gallery?: string[];
};

export const HERITAGE_COTTAGE_PRICE = 15000;

export const rooms: Room[] = [
  {
    name: "Heritage Cottage",
    description:
      "Cozy cottage surrounded by fruit trees, with a private patio and organic breakfast included.",
    pricePerNight: HERITAGE_COTTAGE_PRICE,
    features: ["Private terrace", "Natural materials", "Garden view"],
    image: "/heritage-cottage.jpeg",
    gallery: [
      "/heritage-cottage.jpeg",
      "/heritage-cottage-entrance.jpeg",
      "/heritage-cottage-bedroom1.jpeg",
      "/heritage-cottage-bedroom2.jpeg",
    ],
  },
];

export function formatINR(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}
