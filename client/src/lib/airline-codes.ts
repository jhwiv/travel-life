// Comprehensive IATA 2-letter airline code → airline name mapping
// Covers all major global airlines and most regional carriers

export const AIRLINE_CODES: Record<string, string> = {
  // Major US carriers
  "AA": "American Airlines",
  "DL": "Delta Air Lines",
  "UA": "United Airlines",
  "WN": "Southwest Airlines",
  "B6": "JetBlue Airways",
  "AS": "Alaska Airlines",
  "NK": "Spirit Airlines",
  "F9": "Frontier Airlines",
  "G4": "Allegiant Air",
  "HA": "Hawaiian Airlines",
  "SY": "Sun Country Airlines",
  "MX": "Breeze Airways",

  // Major European carriers
  "BA": "British Airways",
  "LH": "Lufthansa",
  "AF": "Air France",
  "KL": "KLM Royal Dutch Airlines",
  "IB": "Iberia",
  "AZ": "ITA Airways",
  "SK": "Scandinavian Airlines",
  "AY": "Finnair",
  "LX": "Swiss International Air Lines",
  "OS": "Austrian Airlines",
  "SN": "Brussels Airlines",
  "TP": "TAP Air Portugal",
  "EI": "Aer Lingus",
  "LO": "LOT Polish Airlines",
  "OK": "Czech Airlines",
  "RO": "TAROM",
  "BT": "airBaltic",
  "OU": "Croatia Airlines",
  "JP": "Adria Airways",
  "FI": "Icelandair",
  "DY": "Norwegian Air Shuttle",
  "D8": "Norwegian Air International",
  "W6": "Wizz Air",

  // European low-cost
  "FR": "Ryanair",
  "U2": "easyJet",
  "VY": "Vueling",
  "PC": "Pegasus Airlines",
  "W9": "Wizz Air UK",
  "LS": "Jet2.com",
  "TO": "Transavia France",
  "HV": "Transavia",
  "EW": "Eurowings",
  "EN": "Air Dolomiti",

  // Middle Eastern carriers
  "EK": "Emirates",
  "QR": "Qatar Airways",
  "EY": "Etihad Airways",
  "TK": "Turkish Airlines",
  "SV": "Saudia",
  "GF": "Gulf Air",
  "WY": "Oman Air",
  "RJ": "Royal Jordanian",
  "ME": "Middle East Airlines",
  "MS": "EgyptAir",
  "FZ": "flydubai",
  "G9": "Air Arabia",
  "XY": "flynas",

  // Asian carriers
  "CX": "Cathay Pacific",
  "SQ": "Singapore Airlines",
  "NH": "All Nippon Airways",
  "JL": "Japan Airlines",
  "KE": "Korean Air",
  "OZ": "Asiana Airlines",
  "TG": "Thai Airways",
  "MH": "Malaysia Airlines",
  "GA": "Garuda Indonesia",
  "CI": "China Airlines",
  "BR": "EVA Air",
  "VN": "Vietnam Airlines",
  "PR": "Philippine Airlines",
  "AI": "Air India",
  "6E": "IndiGo",
  "SG": "SpiceJet",
  "AK": "AirAsia",
  "FD": "Thai AirAsia",
  "QZ": "Indonesia AirAsia",
  "D7": "AirAsia X",
  "TR": "Scoot",
  "3K": "Jetstar Asia",
  "JQ": "Jetstar Airways",
  "MM": "Peach Aviation",
  "7C": "Jeju Air",
  "TW": "T'way Air",
  "LJ": "Jin Air",
  "BX": "Air Busan",
  "ZE": "Eastar Jet",
  "HO": "Juneyao Airlines",
  "9C": "Spring Airlines",
  "MU": "China Eastern Airlines",
  "CA": "Air China",
  "CZ": "China Southern Airlines",
  "HU": "Hainan Airlines",
  "3U": "Sichuan Airlines",
  "FM": "Shanghai Airlines",
  "ZH": "Shenzhen Airlines",
  "SC": "Shandong Airlines",
  "GJ": "Zhejiang Loong Airlines",

  // Oceania
  "QF": "Qantas",
  "VA": "Virgin Australia",
  "NZ": "Air New Zealand",
  "FJ": "Fiji Airways",

  // Latin America
  "LA": "LATAM Airlines",
  "CM": "Copa Airlines",
  "AV": "Avianca",
  "AM": "Aeromexico",
  "AR": "Aerolineas Argentinas",
  "G3": "Gol Transportes Aéreos",
  "AD": "Azul Brazilian Airlines",
  "JA": "JetSMART",
  "VB": "VivaAerobus",
  "4O": "Interjet",

  // African carriers
  "ET": "Ethiopian Airlines",
  "SA": "South African Airways",
  "KQ": "Kenya Airways",
  "AT": "Royal Air Maroc",
  "W3": "Arik Air",
  "HF": "Air Côte d'Ivoire",

  // Canadian
  "AC": "Air Canada",
  "WS": "WestJet",
  "PD": "Porter Airlines",
  "TS": "Air Transat",

  // European rail operators (for train compatibility)
  "9B": "Eurostar",

  // US regional
  "MQ": "Envoy Air",
  "OH": "PSA Airlines",
  "YX": "Republic Airways",
  "OO": "SkyWest Airlines",
  "9E": "Endeavor Air",
  "QX": "Horizon Air",
  "YV": "Mesa Airlines",
  "CP": "Compass Airlines",
  "ZW": "Air Wisconsin",
};

/**
 * Extract the airline code from a flight number string.
 * Handles formats like "UA123", "UA 123", "ua123"
 */
export function extractAirlineCode(flightNumber: string): string | null {
  const cleaned = flightNumber.trim().toUpperCase().replace(/\s+/g, "");
  // Match 2-letter or 1-letter+digit airline code at the start
  const match = cleaned.match(/^([A-Z\d]{2})/);
  if (match) {
    return match[1];
  }
  return null;
}

/**
 * Get airline name from a flight number
 */
export function getAirlineFromFlightNumber(flightNumber: string): string | null {
  const code = extractAirlineCode(flightNumber);
  if (code && AIRLINE_CODES[code]) {
    return AIRLINE_CODES[code];
  }
  return null;
}

/**
 * Parse a flight number into airline code and numeric part
 */
export function parseFlightNumber(flightNumber: string): { airlineCode: string; number: string } | null {
  const cleaned = flightNumber.trim().toUpperCase().replace(/\s+/g, "");
  const match = cleaned.match(/^([A-Z\d]{2})(\d+)$/);
  if (match) {
    return { airlineCode: match[1], number: match[2] };
  }
  return null;
}
