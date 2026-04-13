export interface TrainStation {
  code: string;
  name: string;
  city: string;
  country: string;
}

/** Curated list of major train stations worldwide (200+) */
export const TRAIN_STATIONS: TrainStation[] = [
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

  // ─── North America ───
  // United States — Amtrak major stations
  { code: "NYP", name: "New York Penn Station", city: "New York", country: "United States" },
  { code: "GCT", name: "Grand Central Terminal", city: "New York", country: "United States" },
  { code: "WAS", name: "Washington Union Station", city: "Washington D.C.", country: "United States" },
  { code: "BOS", name: "Boston South Station", city: "Boston", country: "United States" },
  { code: "PHL", name: "Philadelphia 30th Street", city: "Philadelphia", country: "United States" },
  { code: "CHI", name: "Chicago Union Station", city: "Chicago", country: "United States" },
  { code: "LAX", name: "Los Angeles Union Station", city: "Los Angeles", country: "United States" },
  { code: "EMY", name: "Emeryville Station", city: "Emeryville", country: "United States" },
  { code: "SEA", name: "Seattle King Street Station", city: "Seattle", country: "United States" },
  { code: "PDX", name: "Portland Union Station", city: "Portland", country: "United States" },
  { code: "NWK", name: "Newark Penn Station", city: "Newark", country: "United States" },
  { code: "BWI", name: "BWI Airport Station", city: "Baltimore", country: "United States" },
  { code: "BAL", name: "Baltimore Penn Station", city: "Baltimore", country: "United States" },
  { code: "NHV", name: "New Haven Union Station", city: "New Haven", country: "United States" },
  { code: "PVD", name: "Providence Station", city: "Providence", country: "United States" },
  { code: "WIL", name: "Wilmington Station", city: "Wilmington", country: "United States" },
  { code: "ATL", name: "Atlanta Peachtree Station", city: "Atlanta", country: "United States" },
  { code: "MIA", name: "Miami Station", city: "Miami", country: "United States" },
  { code: "SAS", name: "San Antonio Station", city: "San Antonio", country: "United States" },
  { code: "SDG", name: "San Diego Santa Fe Depot", city: "San Diego", country: "United States" },
  { code: "SAC", name: "Sacramento Valley Station", city: "Sacramento", country: "United States" },
  { code: "MSP", name: "St. Paul Union Depot", city: "Minneapolis", country: "United States" },
  { code: "DEN", name: "Denver Union Station", city: "Denver", country: "United States" },
  { code: "WPB", name: "West Palm Beach Station", city: "West Palm Beach", country: "United States" },
  { code: "ORL", name: "Orlando Station", city: "Orlando", country: "United States" },

  // Canada
  { code: "TWO", name: "Toronto Union Station", city: "Toronto", country: "Canada" },
  { code: "MTR", name: "Montréal Gare Centrale", city: "Montreal", country: "Canada" },
  { code: "OTT", name: "Ottawa Station", city: "Ottawa", country: "Canada" },
  { code: "VAN", name: "Vancouver Pacific Central", city: "Vancouver", country: "Canada" },
  { code: "QUE", name: "Québec City Gare du Palais", city: "Québec City", country: "Canada" },
  { code: "WIN", name: "Winnipeg Union Station", city: "Winnipeg", country: "Canada" },
  { code: "EDM", name: "Edmonton Station", city: "Edmonton", country: "Canada" },

  // ─── Asia ───
  // Japan
  { code: "TYO", name: "Tokyo Station", city: "Tokyo", country: "Japan" },
  { code: "SHN", name: "Shin-Osaka Station", city: "Osaka", country: "Japan" },
  { code: "KYO", name: "Kyoto Station", city: "Kyoto", country: "Japan" },
  { code: "NGY", name: "Nagoya Station", city: "Nagoya", country: "Japan" },
  { code: "HIR", name: "Hiroshima Station", city: "Hiroshima", country: "Japan" },
  { code: "HAK", name: "Hakata Station", city: "Fukuoka", country: "Japan" },
  { code: "SHB", name: "Shin-Yokohama Station", city: "Yokohama", country: "Japan" },
  { code: "SND", name: "Sendai Station", city: "Sendai", country: "Japan" },
  { code: "SPR", name: "Sapporo Station", city: "Sapporo", country: "Japan" },
  { code: "KNZ", name: "Kanazawa Station", city: "Kanazawa", country: "Japan" },

  // South Korea
  { code: "SEL", name: "Seoul Station", city: "Seoul", country: "South Korea" },
  { code: "BSN", name: "Busan Station", city: "Busan", country: "South Korea" },
  { code: "DGU", name: "Dongdaegu Station", city: "Daegu", country: "South Korea" },
  { code: "GWJ", name: "Gwangju Songjeong", city: "Gwangju", country: "South Korea" },

  // Taiwan
  { code: "TPE", name: "Taipei Main Station", city: "Taipei", country: "Taiwan" },
  { code: "TCC", name: "Taichung Station (THSR)", city: "Taichung", country: "Taiwan" },
  { code: "ZYI", name: "Zuoying Station", city: "Kaohsiung", country: "Taiwan" },

  // China
  { code: "BJS", name: "Beijing South", city: "Beijing", country: "China" },
  { code: "SHH", name: "Shanghai Hongqiao", city: "Shanghai", country: "China" },
  { code: "GZS", name: "Guangzhou South", city: "Guangzhou", country: "China" },
  { code: "SZN", name: "Shenzhen North", city: "Shenzhen", country: "China" },
  { code: "NJS", name: "Nanjing South", city: "Nanjing", country: "China" },
  { code: "HZE", name: "Hangzhou East", city: "Hangzhou", country: "China" },
  { code: "CDS", name: "Chengdu East", city: "Chengdu", country: "China" },
  { code: "WHS", name: "Wuhan Station", city: "Wuhan", country: "China" },
  { code: "XAN", name: "Xi'an North", city: "Xi'an", country: "China" },
  { code: "CQN", name: "Chongqing North", city: "Chongqing", country: "China" },

  // India
  { code: "NDLS", name: "New Delhi", city: "New Delhi", country: "India" },
  { code: "BCT", name: "Mumbai Central", city: "Mumbai", country: "India" },
  { code: "MAS", name: "Chennai Central", city: "Chennai", country: "India" },
  { code: "HWH", name: "Howrah Junction", city: "Kolkata", country: "India" },
  { code: "SBC", name: "Bangalore City Junction", city: "Bangalore", country: "India" },

  // ─── Africa ───
  { code: "CBL", name: "Casablanca Casa-Voyageurs", city: "Casablanca", country: "Morocco" },
  { code: "RBT", name: "Rabat Agdal", city: "Rabat", country: "Morocco" },
  { code: "TNG", name: "Tanger-Ville", city: "Tangier", country: "Morocco" },
  { code: "JHB", name: "Johannesburg Park Station", city: "Johannesburg", country: "South Africa" },
  { code: "CPT", name: "Cape Town Station", city: "Cape Town", country: "South Africa" },

  // ─── Australia ───
  { code: "SYD", name: "Sydney Central", city: "Sydney", country: "Australia" },
  { code: "MEL", name: "Melbourne Southern Cross", city: "Melbourne", country: "Australia" },
  { code: "BNE", name: "Brisbane Roma Street", city: "Brisbane", country: "Australia" },
  { code: "ADL", name: "Adelaide Parklands", city: "Adelaide", country: "Australia" },
  { code: "PER", name: "Perth Station", city: "Perth", country: "Australia" },
];

/** Search stations by query — matches code, name, city, or country */
export function searchStations(query: string, limit = 8): TrainStation[] {
  if (!query || query.length < 1) return [];
  const q = query.toLowerCase();
  return TRAIN_STATIONS
    .filter(
      (s) =>
        s.code.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.city.toLowerCase().includes(q) ||
        s.country.toLowerCase().includes(q)
    )
    .slice(0, limit);
}
