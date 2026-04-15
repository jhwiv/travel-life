/**
 * Convert a 2-letter ISO country code to its emoji flag.
 * Each letter maps to a Regional Indicator Symbol: A=🇦, B=🇧, etc.
 */
export function codeToFlag(code: string): string {
  if (!code || code.length < 2) return "\u{1F3F3}\u{FE0F}";
  const upper = code.toUpperCase().slice(0, 2);
  return String.fromCodePoint(
    ...upper.split("").map((c) => 0x1f1e5 + c.charCodeAt(0) - 64)
  );
}

/**
 * Map of full country names (and common aliases) to 2-letter ISO codes.
 * Used to convert country names from trip data into flag codes.
 */
const NAME_TO_CODE: Record<string, string> = {
  "United States": "US", US: "US", USA: "US",
  "United Kingdom": "GB", UK: "GB", England: "GB",
  France: "FR", Germany: "DE", Italy: "IT", Spain: "ES",
  Netherlands: "NL", Belgium: "BE", Switzerland: "CH",
  Austria: "AT", Portugal: "PT", Ireland: "IE",
  Sweden: "SE", Norway: "NO", Denmark: "DK", Finland: "FI",
  Poland: "PL", "Czech Republic": "CZ", Czechia: "CZ",
  Greece: "GR", Turkey: "TR", Japan: "JP",
  "South Korea": "KR", China: "CN", India: "IN",
  Australia: "AU", "New Zealand": "NZ", Canada: "CA", Mexico: "MX",
  Brazil: "BR", Argentina: "AR", Colombia: "CO", Chile: "CL", Peru: "PE",
  Morocco: "MA", Egypt: "EG", "South Africa": "ZA",
  UAE: "AE", "United Arab Emirates": "AE", Thailand: "TH",
  Singapore: "SG", Malaysia: "MY", Indonesia: "ID",
  Philippines: "PH", Vietnam: "VN", Taiwan: "TW",
  "Hong Kong": "HK", Iceland: "IS", Hungary: "HU",
  Croatia: "HR", Romania: "RO", Luxembourg: "LU",
  Monaco: "MC", Malta: "MT", Cyprus: "CY",
  "Dominican Republic": "DO", Jamaica: "JM", "Costa Rica": "CR",
  Panama: "PA", "Puerto Rico": "PR", Bahamas: "BS",
  Bermuda: "BM", Aruba: "AW", Barbados: "BB",
  "St. Martin": "SX", "Cayman Islands": "KY", Cuba: "CU",
  Israel: "IL", "Saudi Arabia": "SA", Qatar: "QA",
  Scotland: "GB", Wales: "GB",
};

/**
 * Get the emoji flag for a country name or 2-letter code.
 * - If input is a 2-letter code (e.g. "US", "AW", "DK"), converts directly to flag
 * - If input is a country name (e.g. "Aruba", "Denmark"), looks up the code first
 * - Returns white flag for unknown inputs
 */
export function getFlag(country: string): string {
  if (!country) return "\u{1F3F3}\u{FE0F}";

  // If it's a 2-letter code, convert directly
  const trimmed = country.trim();
  if (trimmed.length === 2 && /^[A-Z]{2}$/i.test(trimmed)) {
    return codeToFlag(trimmed.toUpperCase());
  }

  // Look up by name
  const code = NAME_TO_CODE[trimmed];
  if (code) return codeToFlag(code);

  // Fallback: white flag
  return "\u{1F3F3}\u{FE0F}";
}

/**
 * Get flag + code label for display (e.g. "🇺🇸 US")
 */
export function getFlagWithCode(country: string): { flag: string; code: string } {
  if (!country) return { flag: "\u{1F3F3}\u{FE0F}", code: "" };

  const trimmed = country.trim();
  if (trimmed.length === 2 && /^[A-Z]{2}$/i.test(trimmed)) {
    const upper = trimmed.toUpperCase();
    return { flag: codeToFlag(upper), code: upper };
  }

  const code = NAME_TO_CODE[trimmed];
  if (code) return { flag: codeToFlag(code), code };

  return { flag: "\u{1F3F3}\u{FE0F}", code: trimmed.slice(0, 2).toUpperCase() };
}
