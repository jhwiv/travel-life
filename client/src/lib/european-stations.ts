export interface TrainStation {
  code: string;
  name: string;
  city: string;
  country: string;
}

/** Curated list of major European train stations */
export const EUROPEAN_STATIONS: TrainStation[] = [
  // France
  { code: "PLY", name: "Paris Gare de Lyon", city: "Paris", country: "France" },
  { code: "PNO", name: "Paris Gare du Nord", city: "Paris", country: "France" },
  { code: "PMO", name: "Paris Montparnasse", city: "Paris", country: "France" },
  { code: "PES", name: "Paris Est", city: "Paris", country: "France" },
  { code: "PSL", name: "Paris Saint-Lazare", city: "Paris", country: "France" },
  { code: "LYP", name: "Lyon Part-Dieu", city: "Lyon", country: "France" },
  { code: "LYN", name: "Lyon Perrache", city: "Lyon", country: "France" },
  { code: "MRS", name: "Marseille Saint-Charles", city: "Marseille", country: "France" },
  { code: "BDX", name: "Bordeaux Saint-Jean", city: "Bordeaux", country: "France" },
  { code: "LIL", name: "Lille Europe", city: "Lille", country: "France" },
  { code: "STR", name: "Strasbourg", city: "Strasbourg", country: "France" },
  { code: "NIC", name: "Nice Ville", city: "Nice", country: "France" },
  { code: "TLS", name: "Toulouse Matabiau", city: "Toulouse", country: "France" },
  { code: "NAN", name: "Nantes", city: "Nantes", country: "France" },
  { code: "REN", name: "Rennes", city: "Rennes", country: "France" },
  { code: "AVI", name: "Avignon TGV", city: "Avignon", country: "France" },

  // United Kingdom
  { code: "STP", name: "London St Pancras", city: "London", country: "United Kingdom" },
  { code: "KGX", name: "London King's Cross", city: "London", country: "United Kingdom" },
  { code: "PAD", name: "London Paddington", city: "London", country: "United Kingdom" },
  { code: "EUS", name: "London Euston", city: "London", country: "United Kingdom" },
  { code: "VIC", name: "London Victoria", city: "London", country: "United Kingdom" },
  { code: "WAT", name: "London Waterloo", city: "London", country: "United Kingdom" },
  { code: "MAN", name: "Manchester Piccadilly", city: "Manchester", country: "United Kingdom" },
  { code: "BHM", name: "Birmingham New Street", city: "Birmingham", country: "United Kingdom" },
  { code: "EDB", name: "Edinburgh Waverley", city: "Edinburgh", country: "United Kingdom" },
  { code: "GLC", name: "Glasgow Central", city: "Glasgow", country: "United Kingdom" },
  { code: "LDS", name: "Leeds", city: "Leeds", country: "United Kingdom" },
  { code: "BRI", name: "Bristol Temple Meads", city: "Bristol", country: "United Kingdom" },

  // Germany
  { code: "BER", name: "Berlin Hauptbahnhof", city: "Berlin", country: "Germany" },
  { code: "MUC", name: "München Hauptbahnhof", city: "Munich", country: "Germany" },
  { code: "FRA", name: "Frankfurt Hauptbahnhof", city: "Frankfurt", country: "Germany" },
  { code: "HAM", name: "Hamburg Hauptbahnhof", city: "Hamburg", country: "Germany" },
  { code: "CGN", name: "Köln Hauptbahnhof", city: "Cologne", country: "Germany" },
  { code: "DUS", name: "Düsseldorf Hauptbahnhof", city: "Düsseldorf", country: "Germany" },
  { code: "STU", name: "Stuttgart Hauptbahnhof", city: "Stuttgart", country: "Germany" },
  { code: "NUE", name: "Nürnberg Hauptbahnhof", city: "Nuremberg", country: "Germany" },
  { code: "HAN", name: "Hannover Hauptbahnhof", city: "Hannover", country: "Germany" },
  { code: "DRE", name: "Dresden Hauptbahnhof", city: "Dresden", country: "Germany" },
  { code: "LEJ", name: "Leipzig Hauptbahnhof", city: "Leipzig", country: "Germany" },

  // Netherlands
  { code: "AMS", name: "Amsterdam Centraal", city: "Amsterdam", country: "Netherlands" },
  { code: "RTD", name: "Rotterdam Centraal", city: "Rotterdam", country: "Netherlands" },
  { code: "UTR", name: "Utrecht Centraal", city: "Utrecht", country: "Netherlands" },
  { code: "DHA", name: "Den Haag Centraal", city: "The Hague", country: "Netherlands" },
  { code: "EHV", name: "Eindhoven", city: "Eindhoven", country: "Netherlands" },

  // Belgium
  { code: "BRU", name: "Bruxelles-Midi", city: "Brussels", country: "Belgium" },
  { code: "ANT", name: "Antwerpen-Centraal", city: "Antwerp", country: "Belgium" },
  { code: "GHE", name: "Gent-Sint-Pieters", city: "Ghent", country: "Belgium" },
  { code: "BRG", name: "Brugge", city: "Bruges", country: "Belgium" },
  { code: "LIE", name: "Liège-Guillemins", city: "Liège", country: "Belgium" },

  // Spain
  { code: "MAD", name: "Madrid Atocha", city: "Madrid", country: "Spain" },
  { code: "BCN", name: "Barcelona Sants", city: "Barcelona", country: "Spain" },
  { code: "SVQ", name: "Sevilla Santa Justa", city: "Seville", country: "Spain" },
  { code: "VLC", name: "Valencia Joaquín Sorolla", city: "Valencia", country: "Spain" },
  { code: "MLG", name: "Málaga María Zambrano", city: "Málaga", country: "Spain" },
  { code: "ZAR", name: "Zaragoza Delicias", city: "Zaragoza", country: "Spain" },
  { code: "BIO", name: "Bilbao Abando", city: "Bilbao", country: "Spain" },

  // Italy
  { code: "ROM", name: "Roma Termini", city: "Rome", country: "Italy" },
  { code: "MIL", name: "Milano Centrale", city: "Milan", country: "Italy" },
  { code: "FLR", name: "Firenze Santa Maria Novella", city: "Florence", country: "Italy" },
  { code: "VCE", name: "Venezia Santa Lucia", city: "Venice", country: "Italy" },
  { code: "NAP", name: "Napoli Centrale", city: "Naples", country: "Italy" },
  { code: "TRN", name: "Torino Porta Nuova", city: "Turin", country: "Italy" },
  { code: "BOL", name: "Bologna Centrale", city: "Bologna", country: "Italy" },
  { code: "VRN", name: "Verona Porta Nuova", city: "Verona", country: "Italy" },

  // Switzerland
  { code: "ZRH", name: "Zürich Hauptbahnhof", city: "Zürich", country: "Switzerland" },
  { code: "GVA", name: "Genève-Cornavin", city: "Geneva", country: "Switzerland" },
  { code: "BSL", name: "Basel SBB", city: "Basel", country: "Switzerland" },
  { code: "BRN", name: "Bern", city: "Bern", country: "Switzerland" },
  { code: "LUZ", name: "Luzern", city: "Lucerne", country: "Switzerland" },
  { code: "INT", name: "Interlaken Ost", city: "Interlaken", country: "Switzerland" },

  // Austria
  { code: "VIE", name: "Wien Hauptbahnhof", city: "Vienna", country: "Austria" },
  { code: "SBG", name: "Salzburg Hauptbahnhof", city: "Salzburg", country: "Austria" },
  { code: "IBK", name: "Innsbruck Hauptbahnhof", city: "Innsbruck", country: "Austria" },
  { code: "GRZ", name: "Graz Hauptbahnhof", city: "Graz", country: "Austria" },

  // Portugal
  { code: "LSB", name: "Lisboa Santa Apolónia", city: "Lisbon", country: "Portugal" },
  { code: "OPO", name: "Porto São Bento", city: "Porto", country: "Portugal" },
  { code: "LOR", name: "Lisboa Oriente", city: "Lisbon", country: "Portugal" },

  // Scandinavia
  { code: "CPH", name: "København Hovedbanegård", city: "Copenhagen", country: "Denmark" },
  { code: "OSL", name: "Oslo Sentralstasjon", city: "Oslo", country: "Norway" },
  { code: "STO", name: "Stockholm Centralstation", city: "Stockholm", country: "Sweden" },
  { code: "GOT", name: "Göteborg Centralstation", city: "Gothenburg", country: "Sweden" },
  { code: "HEL", name: "Helsinki Central", city: "Helsinki", country: "Finland" },
  { code: "MAL", name: "Malmö Centralstation", city: "Malmö", country: "Sweden" },

  // Central & Eastern Europe
  { code: "PRG", name: "Praha hlavní nádraží", city: "Prague", country: "Czech Republic" },
  { code: "BUD", name: "Budapest Keleti", city: "Budapest", country: "Hungary" },
  { code: "WAR", name: "Warszawa Centralna", city: "Warsaw", country: "Poland" },
  { code: "KRK", name: "Kraków Główny", city: "Kraków", country: "Poland" },
  { code: "BTS", name: "Bratislava hlavná stanica", city: "Bratislava", country: "Slovakia" },
  { code: "LJU", name: "Ljubljana", city: "Ljubljana", country: "Slovenia" },
  { code: "ZAG", name: "Zagreb Glavni", city: "Zagreb", country: "Croatia" },
  { code: "BUC", name: "București Nord", city: "Bucharest", country: "Romania" },
  { code: "SOF", name: "Sofia Central", city: "Sofia", country: "Bulgaria" },

  // Greece & Turkey
  { code: "ATH", name: "Athína (Athens)", city: "Athens", country: "Greece" },
  { code: "THK", name: "Thessaloníki", city: "Thessaloniki", country: "Greece" },
  { code: "IST", name: "İstanbul Halkalı", city: "Istanbul", country: "Turkey" },
  { code: "ANK", name: "Ankara", city: "Ankara", country: "Turkey" },

  // Ireland
  { code: "DUB", name: "Dublin Heuston", city: "Dublin", country: "Ireland" },
  { code: "DPC", name: "Dublin Connolly", city: "Dublin", country: "Ireland" },

  // Luxembourg
  { code: "LUX", name: "Luxembourg Gare", city: "Luxembourg", country: "Luxembourg" },
];

/** Search stations by query — matches code, name, city, or country */
export function searchStations(query: string, limit = 8): TrainStation[] {
  if (!query || query.length < 1) return [];
  const q = query.toLowerCase();
  return EUROPEAN_STATIONS
    .filter(
      (s) =>
        s.code.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.city.toLowerCase().includes(q) ||
        s.country.toLowerCase().includes(q)
    )
    .slice(0, limit);
}
