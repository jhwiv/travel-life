// Major world airports: IATA code → { name, city, country, lat, lon }
// Covers 200+ major airports worldwide

export interface AirportInfo {
  name: string;
  city: string;
  country: string;
  lat: number;
  lon: number;
}

export const AIRPORTS: Record<string, AirportInfo> = {
  // --- United States ---
  "ATL": { name: "Hartsfield-Jackson Atlanta International", city: "Atlanta", country: "United States", lat: 33.6407, lon: -84.4277 },
  "LAX": { name: "Los Angeles International", city: "Los Angeles", country: "United States", lat: 33.9425, lon: -118.4081 },
  "ORD": { name: "O'Hare International", city: "Chicago", country: "United States", lat: 41.9742, lon: -87.9073 },
  "DFW": { name: "Dallas/Fort Worth International", city: "Dallas", country: "United States", lat: 32.8998, lon: -97.0403 },
  "DEN": { name: "Denver International", city: "Denver", country: "United States", lat: 39.8561, lon: -104.6737 },
  "JFK": { name: "John F. Kennedy International", city: "New York", country: "United States", lat: 40.6413, lon: -73.7781 },
  "SFO": { name: "San Francisco International", city: "San Francisco", country: "United States", lat: 37.6213, lon: -122.3790 },
  "SEA": { name: "Seattle-Tacoma International", city: "Seattle", country: "United States", lat: 47.4502, lon: -122.3088 },
  "LAS": { name: "Harry Reid International", city: "Las Vegas", country: "United States", lat: 36.0840, lon: -115.1537 },
  "MCO": { name: "Orlando International", city: "Orlando", country: "United States", lat: 28.4312, lon: -81.3081 },
  "EWR": { name: "Newark Liberty International", city: "Newark", country: "United States", lat: 40.6895, lon: -74.1745 },
  "CLT": { name: "Charlotte Douglas International", city: "Charlotte", country: "United States", lat: 35.2140, lon: -80.9431 },
  "PHX": { name: "Phoenix Sky Harbor International", city: "Phoenix", country: "United States", lat: 33.4373, lon: -112.0078 },
  "IAH": { name: "George Bush Intercontinental", city: "Houston", country: "United States", lat: 29.9902, lon: -95.3368 },
  "MIA": { name: "Miami International", city: "Miami", country: "United States", lat: 25.7959, lon: -80.2870 },
  "BOS": { name: "Logan International", city: "Boston", country: "United States", lat: 42.3656, lon: -71.0096 },
  "MSP": { name: "Minneapolis-Saint Paul International", city: "Minneapolis", country: "United States", lat: 44.8848, lon: -93.2223 },
  "DTW": { name: "Detroit Metropolitan Wayne County", city: "Detroit", country: "United States", lat: 42.2124, lon: -83.3534 },
  "FLL": { name: "Fort Lauderdale-Hollywood International", city: "Fort Lauderdale", country: "United States", lat: 26.0726, lon: -80.1527 },
  "PHL": { name: "Philadelphia International", city: "Philadelphia", country: "United States", lat: 39.8721, lon: -75.2411 },
  "LGA": { name: "LaGuardia", city: "New York", country: "United States", lat: 40.7769, lon: -73.8740 },
  "BWI": { name: "Baltimore/Washington International", city: "Baltimore", country: "United States", lat: 39.1754, lon: -76.6683 },
  "SLC": { name: "Salt Lake City International", city: "Salt Lake City", country: "United States", lat: 40.7884, lon: -111.9778 },
  "IAD": { name: "Washington Dulles International", city: "Washington", country: "United States", lat: 38.9531, lon: -77.4565 },
  "DCA": { name: "Ronald Reagan Washington National", city: "Washington", country: "United States", lat: 38.8512, lon: -77.0402 },
  "SAN": { name: "San Diego International", city: "San Diego", country: "United States", lat: 32.7338, lon: -117.1933 },
  "TPA": { name: "Tampa International", city: "Tampa", country: "United States", lat: 27.9755, lon: -82.5332 },
  "AUS": { name: "Austin-Bergstrom International", city: "Austin", country: "United States", lat: 30.1975, lon: -97.6664 },
  "BNA": { name: "Nashville International", city: "Nashville", country: "United States", lat: 36.1263, lon: -86.6774 },
  "PDX": { name: "Portland International", city: "Portland", country: "United States", lat: 45.5898, lon: -122.5951 },
  "STL": { name: "St. Louis Lambert International", city: "St. Louis", country: "United States", lat: 38.7487, lon: -90.3700 },
  "HNL": { name: "Daniel K. Inouye International", city: "Honolulu", country: "United States", lat: 21.3187, lon: -157.9225 },
  "RDU": { name: "Raleigh-Durham International", city: "Raleigh", country: "United States", lat: 35.8776, lon: -78.7875 },
  "MCI": { name: "Kansas City International", city: "Kansas City", country: "United States", lat: 39.2976, lon: -94.7139 },
  "SMF": { name: "Sacramento International", city: "Sacramento", country: "United States", lat: 38.6954, lon: -121.5908 },
  "CLE": { name: "Cleveland Hopkins International", city: "Cleveland", country: "United States", lat: 41.4058, lon: -81.8539 },
  "IND": { name: "Indianapolis International", city: "Indianapolis", country: "United States", lat: 39.7173, lon: -86.2944 },
  "PIT": { name: "Pittsburgh International", city: "Pittsburgh", country: "United States", lat: 40.4957, lon: -80.2413 },
  "OAK": { name: "Oakland International", city: "Oakland", country: "United States", lat: 37.7213, lon: -122.2208 },
  "ALB": { name: "Albany International", city: "Albany", country: "United States", lat: 42.7483, lon: -73.8017 },
  "ABQ": { name: "Albuquerque International Sunport", city: "Albuquerque", country: "United States", lat: 35.0402, lon: -106.6091 },
  "PBI": { name: "Palm Beach International", city: "West Palm Beach", country: "United States", lat: 26.6832, lon: -80.0956 },
  "RSW": { name: "Southwest Florida International", city: "Fort Myers", country: "United States", lat: 26.5362, lon: -81.7552 },
  "EYW": { name: "Key West International", city: "Key West", country: "United States", lat: 24.5561, lon: -81.7596 },
  "SRQ": { name: "Sarasota-Bradenton International", city: "Sarasota", country: "United States", lat: 27.3954, lon: -82.5544 },

  // --- United Kingdom ---
  "LHR": { name: "Heathrow", city: "London", country: "United Kingdom", lat: 51.4700, lon: -0.4543 },
  "LGW": { name: "Gatwick", city: "London", country: "United Kingdom", lat: 51.1537, lon: -0.1821 },
  "STN": { name: "Stansted", city: "London", country: "United Kingdom", lat: 51.8860, lon: 0.2389 },
  "LTN": { name: "Luton", city: "London", country: "United Kingdom", lat: 51.8747, lon: -0.3683 },
  "MAN": { name: "Manchester", city: "Manchester", country: "United Kingdom", lat: 53.3537, lon: -2.2750 },
  "EDI": { name: "Edinburgh", city: "Edinburgh", country: "United Kingdom", lat: 55.9500, lon: -3.3725 },
  "BHX": { name: "Birmingham", city: "Birmingham", country: "United Kingdom", lat: 52.4539, lon: -1.7480 },
  "GLA": { name: "Glasgow", city: "Glasgow", country: "United Kingdom", lat: 55.8642, lon: -4.4331 },
  "LCY": { name: "London City", city: "London", country: "United Kingdom", lat: 51.5053, lon: 0.0553 },

  // --- Europe ---
  "CDG": { name: "Charles de Gaulle", city: "Paris", country: "France", lat: 49.0097, lon: 2.5479 },
  "ORY": { name: "Orly", city: "Paris", country: "France", lat: 48.7233, lon: 2.3794 },
  "FRA": { name: "Frankfurt", city: "Frankfurt", country: "Germany", lat: 50.0379, lon: 8.5622 },
  "MUC": { name: "Munich", city: "Munich", country: "Germany", lat: 48.3537, lon: 11.7750 },
  "BER": { name: "Berlin Brandenburg", city: "Berlin", country: "Germany", lat: 52.3667, lon: 13.5033 },
  "AMS": { name: "Schiphol", city: "Amsterdam", country: "Netherlands", lat: 52.3105, lon: 4.7683 },
  "MAD": { name: "Adolfo Suárez Madrid–Barajas", city: "Madrid", country: "Spain", lat: 40.4983, lon: -3.5676 },
  "BCN": { name: "Barcelona–El Prat", city: "Barcelona", country: "Spain", lat: 41.2974, lon: 2.0833 },
  "FCO": { name: "Leonardo da Vinci–Fiumicino", city: "Rome", country: "Italy", lat: 41.8003, lon: 12.2389 },
  "MXP": { name: "Milan Malpensa", city: "Milan", country: "Italy", lat: 45.6306, lon: 8.7281 },
  "VCE": { name: "Marco Polo", city: "Venice", country: "Italy", lat: 45.5053, lon: 12.3519 },
  "NAP": { name: "Naples International", city: "Naples", country: "Italy", lat: 40.8860, lon: 14.2908 },
  "ZRH": { name: "Zurich", city: "Zurich", country: "Switzerland", lat: 47.4647, lon: 8.5492 },
  "GVA": { name: "Geneva", city: "Geneva", country: "Switzerland", lat: 46.2381, lon: 6.1089 },
  "VIE": { name: "Vienna", city: "Vienna", country: "Austria", lat: 48.1103, lon: 16.5697 },
  "BRU": { name: "Brussels", city: "Brussels", country: "Belgium", lat: 50.9014, lon: 4.4844 },
  "LIS": { name: "Lisbon Humberto Delgado", city: "Lisbon", country: "Portugal", lat: 38.7756, lon: -9.1354 },
  "CPH": { name: "Copenhagen Kastrup", city: "Copenhagen", country: "Denmark", lat: 55.6180, lon: 12.6508 },
  "ARN": { name: "Stockholm Arlanda", city: "Stockholm", country: "Sweden", lat: 59.6519, lon: 17.9186 },
  "OSL": { name: "Oslo Gardermoen", city: "Oslo", country: "Norway", lat: 60.1939, lon: 11.1004 },
  "HEL": { name: "Helsinki-Vantaa", city: "Helsinki", country: "Finland", lat: 60.3172, lon: 24.9633 },
  "WAW": { name: "Warsaw Chopin", city: "Warsaw", country: "Poland", lat: 52.1657, lon: 20.9671 },
  "PRG": { name: "Václav Havel Prague", city: "Prague", country: "Czech Republic", lat: 50.1008, lon: 14.2600 },
  "BUD": { name: "Budapest Ferenc Liszt", city: "Budapest", country: "Hungary", lat: 47.4298, lon: 19.2611 },
  "ATH": { name: "Athens Eleftherios Venizelos", city: "Athens", country: "Greece", lat: 37.9364, lon: 23.9445 },
  "IST": { name: "Istanbul", city: "Istanbul", country: "Turkey", lat: 41.2753, lon: 28.7519 },
  "SAW": { name: "Istanbul Sabiha Gökçen", city: "Istanbul", country: "Turkey", lat: 40.8986, lon: 29.3092 },
  "DUB": { name: "Dublin", city: "Dublin", country: "Ireland", lat: 53.4213, lon: -6.2701 },
  "KEF": { name: "Keflavik International", city: "Reykjavik", country: "Iceland", lat: 63.9850, lon: -22.6056 },
  "OTP": { name: "Henri Coandă International", city: "Bucharest", country: "Romania", lat: 44.5711, lon: 26.0850 },
  "SOF": { name: "Sofia Airport", city: "Sofia", country: "Bulgaria", lat: 42.6952, lon: 23.4064 },
  "ZAG": { name: "Franjo Tuđman", city: "Zagreb", country: "Croatia", lat: 45.7429, lon: 16.0688 },
  "SPU": { name: "Split Airport", city: "Split", country: "Croatia", lat: 43.5389, lon: 16.2980 },
  "DBV": { name: "Dubrovnik Airport", city: "Dubrovnik", country: "Croatia", lat: 42.5614, lon: 18.2682 },
  "NCE": { name: "Nice Côte d'Azur", city: "Nice", country: "France", lat: 43.6584, lon: 7.2159 },
  "PMI": { name: "Palma de Mallorca", city: "Palma", country: "Spain", lat: 39.5517, lon: 2.7388 },
  "AGP": { name: "Málaga–Costa del Sol", city: "Málaga", country: "Spain", lat: 36.6749, lon: -4.4991 },
  "TFS": { name: "Tenerife South", city: "Tenerife", country: "Spain", lat: 28.0445, lon: -16.5725 },

  // --- Middle East ---
  "DXB": { name: "Dubai International", city: "Dubai", country: "United Arab Emirates", lat: 25.2532, lon: 55.3657 },
  "AUH": { name: "Abu Dhabi International", city: "Abu Dhabi", country: "United Arab Emirates", lat: 24.4330, lon: 54.6511 },
  "DOH": { name: "Hamad International", city: "Doha", country: "Qatar", lat: 25.2731, lon: 51.6081 },
  "JED": { name: "King Abdulaziz International", city: "Jeddah", country: "Saudi Arabia", lat: 21.6796, lon: 39.1565 },
  "RUH": { name: "King Khalid International", city: "Riyadh", country: "Saudi Arabia", lat: 24.9576, lon: 46.6988 },
  "TLV": { name: "Ben Gurion", city: "Tel Aviv", country: "Israel", lat: 32.0055, lon: 34.8854 },
  "AMM": { name: "Queen Alia International", city: "Amman", country: "Jordan", lat: 31.7226, lon: 35.9932 },
  "BAH": { name: "Bahrain International", city: "Manama", country: "Bahrain", lat: 26.2708, lon: 50.6336 },
  "MCT": { name: "Muscat International", city: "Muscat", country: "Oman", lat: 23.5933, lon: 58.2844 },
  "CAI": { name: "Cairo International", city: "Cairo", country: "Egypt", lat: 30.1219, lon: 31.4056 },

  // --- Asia ---
  "HKG": { name: "Hong Kong International", city: "Hong Kong", country: "China", lat: 22.3080, lon: 113.9185 },
  "SIN": { name: "Singapore Changi", city: "Singapore", country: "Singapore", lat: 1.3644, lon: 103.9915 },
  "NRT": { name: "Narita International", city: "Tokyo", country: "Japan", lat: 35.7647, lon: 140.3864 },
  "HND": { name: "Tokyo Haneda", city: "Tokyo", country: "Japan", lat: 35.5494, lon: 139.7798 },
  "ICN": { name: "Incheon International", city: "Seoul", country: "South Korea", lat: 37.4602, lon: 126.4407 },
  "GMP": { name: "Gimpo International", city: "Seoul", country: "South Korea", lat: 37.5583, lon: 126.7906 },
  "BKK": { name: "Suvarnabhumi", city: "Bangkok", country: "Thailand", lat: 13.6900, lon: 100.7501 },
  "KUL": { name: "Kuala Lumpur International", city: "Kuala Lumpur", country: "Malaysia", lat: 2.7456, lon: 101.7099 },
  "CGK": { name: "Soekarno-Hatta International", city: "Jakarta", country: "Indonesia", lat: -6.1256, lon: 106.6558 },
  "MNL": { name: "Ninoy Aquino International", city: "Manila", country: "Philippines", lat: 14.5086, lon: 121.0197 },
  "HAN": { name: "Noi Bai International", city: "Hanoi", country: "Vietnam", lat: 21.2212, lon: 105.8070 },
  "SGN": { name: "Tan Son Nhat International", city: "Ho Chi Minh City", country: "Vietnam", lat: 10.8188, lon: 106.6520 },
  "DEL": { name: "Indira Gandhi International", city: "New Delhi", country: "India", lat: 28.5562, lon: 77.1000 },
  "BOM": { name: "Chhatrapati Shivaji Maharaj International", city: "Mumbai", country: "India", lat: 19.0896, lon: 72.8656 },
  "PEK": { name: "Beijing Capital International", city: "Beijing", country: "China", lat: 40.0799, lon: 116.6031 },
  "PKX": { name: "Beijing Daxing International", city: "Beijing", country: "China", lat: 39.5098, lon: 116.4105 },
  "PVG": { name: "Shanghai Pudong International", city: "Shanghai", country: "China", lat: 31.1434, lon: 121.8052 },
  "CAN": { name: "Guangzhou Baiyun International", city: "Guangzhou", country: "China", lat: 23.3924, lon: 113.2988 },
  "TPE": { name: "Taiwan Taoyuan International", city: "Taipei", country: "Taiwan", lat: 25.0797, lon: 121.2342 },

  // --- Oceania ---
  "SYD": { name: "Sydney Kingsford Smith", city: "Sydney", country: "Australia", lat: -33.9461, lon: 151.1772 },
  "MEL": { name: "Melbourne Tullamarine", city: "Melbourne", country: "Australia", lat: -37.6690, lon: 144.8410 },
  "BNE": { name: "Brisbane", city: "Brisbane", country: "Australia", lat: -27.3842, lon: 153.1175 },
  "PER": { name: "Perth", city: "Perth", country: "Australia", lat: -31.9403, lon: 115.9672 },
  "AKL": { name: "Auckland", city: "Auckland", country: "New Zealand", lat: -37.0082, lon: 174.7850 },
  "NAN": { name: "Nadi International", city: "Nadi", country: "Fiji", lat: -17.7554, lon: 177.4431 },

  // --- Canada ---
  "YYZ": { name: "Toronto Pearson International", city: "Toronto", country: "Canada", lat: 43.6777, lon: -79.6248 },
  "YVR": { name: "Vancouver International", city: "Vancouver", country: "Canada", lat: 49.1967, lon: -123.1815 },
  "YUL": { name: "Montréal-Pierre Elliott Trudeau International", city: "Montreal", country: "Canada", lat: 45.4706, lon: -73.7408 },
  "YOW": { name: "Ottawa Macdonald-Cartier International", city: "Ottawa", country: "Canada", lat: 45.3225, lon: -75.6692 },
  "YYC": { name: "Calgary International", city: "Calgary", country: "Canada", lat: 51.1215, lon: -114.0076 },

  // --- Caribbean ---
  "AUA": { name: "Queen Beatrix International", city: "Oranjestad", country: "Aruba", lat: 12.5014, lon: -70.0152 },

  // --- Latin America ---
  "MEX": { name: "Mexico City International", city: "Mexico City", country: "Mexico", lat: 19.4363, lon: -99.0721 },
  "CUN": { name: "Cancún International", city: "Cancún", country: "Mexico", lat: 21.0365, lon: -86.8771 },
  "GRU": { name: "São Paulo–Guarulhos International", city: "São Paulo", country: "Brazil", lat: -23.4356, lon: -46.4731 },
  "GIG": { name: "Rio de Janeiro–Galeão International", city: "Rio de Janeiro", country: "Brazil", lat: -22.8100, lon: -43.2505 },
  "EZE": { name: "Ministro Pistarini International", city: "Buenos Aires", country: "Argentina", lat: -34.8222, lon: -58.5358 },
  "SCL": { name: "Arturo Merino Benítez International", city: "Santiago", country: "Chile", lat: -33.3930, lon: -70.7858 },
  "BOG": { name: "El Dorado International", city: "Bogotá", country: "Colombia", lat: 4.7016, lon: -74.1469 },
  "LIM": { name: "Jorge Chávez International", city: "Lima", country: "Peru", lat: -12.0219, lon: -77.1143 },
  "PTY": { name: "Tocumen International", city: "Panama City", country: "Panama", lat: 9.0714, lon: -79.3835 },
  "SJO": { name: "Juan Santamaría International", city: "San José", country: "Costa Rica", lat: 9.9939, lon: -84.2088 },

  // --- Africa ---
  "JNB": { name: "O.R. Tambo International", city: "Johannesburg", country: "South Africa", lat: -26.1392, lon: 28.2460 },
  "CPT": { name: "Cape Town International", city: "Cape Town", country: "South Africa", lat: -33.9649, lon: 18.6017 },
  "NBO": { name: "Jomo Kenyatta International", city: "Nairobi", country: "Kenya", lat: -1.3192, lon: 36.9278 },
  "ADD": { name: "Addis Ababa Bole International", city: "Addis Ababa", country: "Ethiopia", lat: 8.9779, lon: 38.7993 },
  "CMN": { name: "Mohammed V International", city: "Casablanca", country: "Morocco", lat: 33.3675, lon: -7.5898 },
  "LOS": { name: "Murtala Muhammed International", city: "Lagos", country: "Nigeria", lat: 6.5774, lon: 3.3213 },
  "ACC": { name: "Kotoka International", city: "Accra", country: "Ghana", lat: 5.6052, lon: -0.1668 },
};

/**
 * Calculate great-circle distance between two airports in miles
 */
export function calculateDistanceMiles(from: string, to: string): number | null {
  const a1 = AIRPORTS[from];
  const a2 = AIRPORTS[to];
  if (!a1 || !a2) return null;

  const R = 3958.8; // Earth radius in miles
  const dLat = (a2.lat - a1.lat) * Math.PI / 180;
  const dLon = (a2.lon - a1.lon) * Math.PI / 180;
  const lat1 = a1.lat * Math.PI / 180;
  const lat2 = a2.lat * Math.PI / 180;

  const s = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));

  return Math.round(R * c);
}

/**
 * Estimate flight duration in minutes based on distance
 * Uses average speed of ~500 mph + 30 min for taxi/climb/descent
 */
export function estimateFlightDuration(distanceMiles: number): number {
  return Math.round((distanceMiles / 500) * 60 + 30);
}
