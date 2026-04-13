// Comprehensive train operator database with aliases
// Covers major operators worldwide

export const TRAIN_OPERATORS: Record<string, string> = {
  // North America
  "AMTK": "Amtrak",
  "VIA": "VIA Rail Canada",
  "BRTL": "Brightline",

  // UK
  "LNER": "LNER",
  "GWR": "Great Western Railway",
  "AVNT": "Avanti West Coast",
  "XCTRY": "CrossCountry",
  "SCOT": "ScotRail",
  "SEST": "Southeastern",
  "THML": "Thameslink",
  "STHN": "Southern Railway",
  "NRTH": "Northern Trains",
  "EMRL": "East Midlands Railway",
  "CHLT": "Chiltern Railways",
  "TPEX": "TransPennine Express",
  "CALE": "Caledonian Sleeper",
  "ELIZ": "Elizabeth Line",

  // France
  "SNCF": "SNCF",
  "TGV": "TGV (SNCF)",
  "OUIG": "Ouigo",
  "TERI": "TER (SNCF Regional)",

  // Germany
  "DB": "Deutsche Bahn",
  "ICE": "ICE (Deutsche Bahn)",
  "FLTX": "Flixtrain",

  // Italy
  "TREN": "Trenitalia",
  "ITAL": "Italo",
  "FREC": "Frecciarossa (Trenitalia)",

  // Spain
  "RENF": "Renfe",
  "AVE": "AVE (Renfe)",

  // Sweden
  "SJ": "SJ (Sweden)",
  "MTRT": "Mälartåg",
  "SNLT": "SL (Stockholm)",

  // Netherlands
  "NS": "NS (Dutch Railways)",
  "THLY": "Thalys",

  // Belgium
  "SNCB": "SNCB/NMBS",

  // Austria
  "OBB": "ÖBB (Austrian Federal Railways)",
  "RAIL": "Railjet (ÖBB)",

  // Switzerland
  "SBB": "SBB/CFF/FFS",
  "GLAC": "Glacier Express",
  "BERN": "BLS (Bern-Lötschberg-Simplon)",

  // International
  "EURO": "Eurostar",
  "NIGH": "Nightjet (ÖBB)",

  // Poland
  "PKP": "PKP Intercity",
  "PEND": "Pendolino (PKP)",

  // Czech Republic
  "CD": "České dráhy",
  "RJET": "RegioJet",
  "LEO": "Leo Express",

  // Portugal
  "CP": "Comboios de Portugal",

  // Denmark
  "DSB": "DSB (Danish State Railways)",

  // Norway
  "VY": "Vy (Norway)",

  // Finland
  "VR": "VR (Finnish Railways)",

  // Hungary
  "MAV": "MÁV (Hungarian State Railways)",

  // Romania
  "CFR": "CFR (Romanian Railways)",

  // Croatia
  "HZPP": "HŽPP (Croatian Railways)",

  // Greece
  "TRAI": "Trainose",

  // Ireland
  "IE": "Iarnród Éireann (Irish Rail)",

  // Japan
  "JR": "JR (Japan Rail)",
  "JRCE": "JR Central",
  "JRWE": "JR West",
  "JREA": "JR East",
  "SHIN": "Shinkansen (JR)",

  // South Korea
  "KTX": "KTX (Korea Train Express)",
  "KORA": "Korail",

  // Taiwan
  "THSR": "THSR (Taiwan High Speed Rail)",
  "TRA": "TRA (Taiwan Railways)",

  // China
  "CR": "China Railway",
  "CRH": "CRH (China Railway High-speed)",

  // India
  "IR": "Indian Railways",
  "VAND": "Vande Bharat Express",

  // Russia
  "RZD": "RZD (Russian Railways)",
  "SAPS": "Sapsan",

  // Australia
  "GTSN": "Great Southern",
  "INDI": "Indian Pacific",
  "GHAN": "The Ghan",
  "NSWT": "NSW TrainLink",
  "VLIN": "V/Line",

  // Morocco
  "ONCF": "ONCF (Moroccan Railways)",
  "ALBR": "Al Boraq",

  // South Africa
  "PRSA": "PRASA",
  "BLTQ": "Blue Train",
  "ROVO": "Rovos Rail",
};

/** Common aliases/abbreviations people use for train operators */
const TRAIN_ALIASES: Record<string, string> = {
  "AMTRAK": "AMTK",
  "VIA RAIL": "VIA",
  "DEUTSCHE BAHN": "DB",
  "GERMAN RAIL": "DB",
  "FRENCH RAIL": "SNCF",
  "FRENCH RAILWAYS": "SNCF",
  "DUTCH RAIL": "NS",
  "DUTCH RAILWAYS": "NS",
  "BELGIAN RAIL": "SNCB",
  "BELGIAN RAILWAYS": "SNCB",
  "AUSTRIAN RAIL": "OBB",
  "AUSTRIAN RAILWAYS": "OBB",
  "SWISS RAIL": "SBB",
  "SWISS RAILWAYS": "SBB",
  "SWISS FEDERAL": "SBB",
  "EUROSTAR": "EURO",
  "TRENITALIA": "TREN",
  "ITALO": "ITAL",
  "FRECCIAROSSA": "FREC",
  "FRECCE": "FREC",
  "RENFE": "RENF",
  "FLIXTRAIN": "FLTX",
  "FLIXBUS": "FLTX",
  "THALYS": "THLY",
  "NIGHTJET": "NIGH",
  "OBB": "OBB",
  "ÖBB": "OBB",
  "RAILJET": "RAIL",
  "REGIOJET": "RJET",
  "LEO EXPRESS": "LEO",
  "OUIGO": "OUIG",
  "SHINKANSEN": "SHIN",
  "JAPAN RAIL": "JR",
  "KORAIL": "KORA",
  "KOREA TRAIN": "KTX",
  "TAIWAN HIGH SPEED": "THSR",
  "CHINA RAILWAY": "CR",
  "INDIAN RAILWAYS": "IR",
  "IRISH RAIL": "IE",
  "BRIGHTLINE": "BRTL",
  "SCOTRAIL": "SCOT",
  "SOUTHEASTERN": "SEST",
  "THAMESLINK": "THML",
  "CROSSCOUNTRY": "XCTRY",
  "AVANTI": "AVNT",
  "GREAT WESTERN": "GWR",
  "CALEDONIAN": "CALE",
  "TRANSPENNINE": "TPEX",
  "GLACIER EXPRESS": "GLAC",
  "PKP": "PKP",
  "PENDOLINO": "PEND",
  "DANISH RAIL": "DSB",
  "DANISH RAILWAYS": "DSB",
  "NORWEGIAN RAIL": "VY",
  "FINNISH RAIL": "VR",
  "FINNISH RAILWAYS": "VR",
  "SAPSAN": "SAPS",
  "BLUE TRAIN": "BLTQ",
  "ROVOS RAIL": "ROVO",
  "AL BORAQ": "ALBR",
  "VANDE BHARAT": "VAND",
  "THE GHAN": "GHAN",
  "INDIAN PACIFIC": "INDI",
};

export interface TrainOperatorMatch {
  code: string;
  name: string;
}

/**
 * Search train operators by name, alias, or code.
 * Returns up to `limit` matches sorted by relevance.
 */
export function searchTrainOperators(query: string, limit = 8): TrainOperatorMatch[] {
  const q = query.trim().toUpperCase();
  if (!q) return [];

  const results: TrainOperatorMatch[] = [];
  const seen = new Set<string>();

  // 1. Exact code match
  if (TRAIN_OPERATORS[q]) {
    results.push({ code: q, name: TRAIN_OPERATORS[q] });
    seen.add(q);
  }

  // 2. Exact alias match
  const aliasCode = TRAIN_ALIASES[q];
  if (aliasCode && !seen.has(aliasCode)) {
    results.push({ code: aliasCode, name: TRAIN_OPERATORS[aliasCode] });
    seen.add(aliasCode);
  }

  // 3. Partial alias match
  for (const [alias, code] of Object.entries(TRAIN_ALIASES)) {
    if (seen.has(code)) continue;
    if (alias.startsWith(q) || q.startsWith(alias)) {
      results.push({ code, name: TRAIN_OPERATORS[code] });
      seen.add(code);
    }
    if (results.length >= limit) return results;
  }

  // 4. Name starts with query
  for (const [code, name] of Object.entries(TRAIN_OPERATORS)) {
    if (seen.has(code)) continue;
    if (name.toUpperCase().startsWith(q)) {
      results.push({ code, name });
      seen.add(code);
    }
    if (results.length >= limit) return results;
  }

  // 5. Name contains query
  for (const [code, name] of Object.entries(TRAIN_OPERATORS)) {
    if (seen.has(code)) continue;
    if (name.toUpperCase().includes(q)) {
      results.push({ code, name });
      seen.add(code);
    }
    if (results.length >= limit) return results;
  }

  // 6. Code starts with query
  for (const [code, name] of Object.entries(TRAIN_OPERATORS)) {
    if (seen.has(code)) continue;
    if (code.startsWith(q)) {
      results.push({ code, name });
      seen.add(code);
    }
    if (results.length >= limit) return results;
  }

  return results;
}
