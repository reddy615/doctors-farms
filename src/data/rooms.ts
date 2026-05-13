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
    image: "/heritage-cottage.jpg",
    gallery: [
      "/heritage-cottage.jpg",
      "/heritage-cottage-entrance.jpg",
      "/heritage-cottage-bedroom1.jpg",
      "/heritage-cottage-bedroom2.jpg",
    ],
  },
];

export function formatINR(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}
