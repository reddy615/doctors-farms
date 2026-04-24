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
  {
    name: "Wellness Villa",
    description:
      "A spacious villa designed for wellness stays, with an open sitting area and a yoga corner.",
    pricePerNight: 11200,
    features: ["Yoga nook", "Large windows", "Indoor fireplace"],
    image: "/wellness-villa.jpg",
  },
  {
    name: "Farm Suite",
    description:
      "Modern suite with farm views and a private kitchenette, perfect for longer stays.",
    pricePerNight: 9300,
    features: ["Kitchenette", "River view", "Spacious layout"],
    image: "/farm-suite.jpg",
  },
];

export function formatINR(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}
