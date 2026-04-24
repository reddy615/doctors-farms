export type Room = {
  name: string;
  description: string;
  pricePerNight: number;
  features: string[];
  image: string;
};

export const rooms: Room[] = [
  {
    name: "Heritage Cottage",
    description:
      "Cozy cottage surrounded by fruit trees, with a private patio and organic breakfast included.",
    pricePerNight: 20000,
    features: ["Private terrace", "Natural materials", "Garden view"],
    image: "/heritage-cottage.jpg",
  },
];

export function formatINR(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}
