// Lightweight types for static build (no drizzle dependency)
export interface Trip {
  id: number;
  type: string;
  airline: string | null;
  flightNumber: string | null;
  trainOperator: string | null;
  trainNumber: string | null;
  trainClass: string | null;
  departureCity: string;
  departureCode: string;
  departureCountry: string;
  arrivalCity: string;
  arrivalCode: string;
  arrivalCountry: string;
  departureDate: string;
  arrivalDate: string;
  departureTime: string;
  arrivalTime: string;
  duration: number;
  distance: number | null;
  status: string;
  notes: string | null;
}

export interface InsertTrip {
  type: "flight" | "train";
  airline?: string | null;
  flightNumber?: string | null;
  trainOperator?: string | null;
  trainNumber?: string | null;
  trainClass?: string | null;
  departureCity: string;
  departureCode: string;
  departureCountry: string;
  arrivalCity: string;
  arrivalCode: string;
  arrivalCountry: string;
  departureDate: string;
  arrivalDate: string;
  departureTime: string;
  arrivalTime: string;
  duration: number;
  distance?: number | null;
  status?: string;
  notes?: string | null;
}
