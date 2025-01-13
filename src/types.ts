export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Location {
  id: string;
  name: string;
  coordinates: Coordinates;
}

export interface PriceSettings {
  id: string;
  from: Location;
  to: Location;
  peakPrice: number;
  offPeakPrice: number;
  createdAt?: string;
}

export interface FareTransaction {
  id: string;
  from_location: string;
  to_location: string;
  amount: number;
  is_peak: boolean;
  created_at: string;
}

export interface FareHistory {
  id: string;
  timestamp: string;
  totalAmount: number;
  seatCount: number;
}

export interface SeatStatus {
  id: number;
  occupied: boolean;
  disconnected: boolean;
}