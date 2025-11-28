export interface Seat {
  id: string;
  x: number;
  y: number;
  sold: boolean;
  zone: string;
  price: number;
}

export interface SeatZone {
  zone: string;
  price: number;
  rows: number;
  seatsPerSide: number;
  startY: number;
}

export const seatData: SeatZone[] = [
  {
    zone: "VIP",
    price: 150000,
    rows: 2,
    seatsPerSide: 6,
    startY: 120,
  },
  {
    zone: "R",
    price: 110000,
    rows: 3,
    seatsPerSide: 7,
    startY: 220,
  },
  {
    zone: "S",
    price: 88000,
    rows: 3,
    seatsPerSide: 8,
    startY: 340,
  },
  {
    zone: "A",
    price: 66000,
    rows: 4,
    seatsPerSide: 9,
    startY: 470,
  },
];
