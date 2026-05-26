import { DateTime } from "luxon";

// Internal time unit: a 15-minute slot. Storage and overlap math operate on these.
// Each visual cell in the grid is 30 min = 2 slots — that lets users pick half-hour
// start times (8:30 PM EDT aligns with 6:00 AM IST, etc.) without needing 96 rows/day.
// 15-min granularity internally is enough to align any real-world IANA timezone
// (Nepal = UTC+5:45, Chatham = UTC+12:45).
export const SLOT_MS = 15 * 60 * 1000; // 900_000
export const SLOTS_PER_HOUR = 4;
export const SLOTS_PER_CELL = 2;      // 30-min visual cell
export const CELLS_PER_DAY = 48;
export const HOUR_MS = 60 * 60 * 1000;

/** The first 15-min slot covered by visual cell `cellIndex` (0..47) on `dayIndex` (0..6). */
export function startSlotForCell(
  weekStartDate: string,
  dayIndex: number,
  cellIndex: number,
  timezone: string
): number {
  const dt = DateTime.fromISO(weekStartDate, { zone: timezone }).plus({
    days: dayIndex,
    minutes: cellIndex * 30
  });
  return Math.floor(dt.toMillis() / SLOT_MS);
}

/** Both 15-min slots covered by a 30-min cell. */
export function slotsForCell(
  weekStartDate: string,
  dayIndex: number,
  cellIndex: number,
  timezone: string
): [number, number] {
  const s = startSlotForCell(weekStartDate, dayIndex, cellIndex, timezone);
  return [s, s + 1];
}

/** Convert a slot number to a DateTime in the given zone (representing slot START). */
export function localFromSlot(slot: number, timezone: string): DateTime {
  return DateTime.fromMillis(slot * SLOT_MS, { zone: timezone });
}

/** Build the 7-day × 48-cell grid for a participant's local week. */
export function buildWeekGrid(weekStartDate: string, timezone: string) {
  const days: {
    dayIndex: number;
    date: DateTime;
    cells: {
      cellIndex: number;
      hour: number;          // 0..23
      minute: number;        // 0 or 30
      startSlot: number;
      slots: [number, number];
    }[];
  }[] = [];
  for (let d = 0; d < 7; d++) {
    const dayStart = DateTime.fromISO(weekStartDate, { zone: timezone }).plus({ days: d });
    const cells: {
      cellIndex: number;
      hour: number;
      minute: number;
      startSlot: number;
      slots: [number, number];
    }[] = [];
    for (let c = 0; c < CELLS_PER_DAY; c++) {
      const slots = slotsForCell(weekStartDate, d, c, timezone);
      cells.push({
        cellIndex: c,
        hour: Math.floor(c / 2),
        minute: (c % 2) * 30,
        startSlot: slots[0],
        slots
      });
    }
    days.push({ dayIndex: d, date: dayStart, cells });
  }
  return days;
}

/** Get THIS week's Monday (YYYY-MM-DD) in a given zone — handy default for new events.
 *  If today is Monday, returns today; otherwise returns the Monday that just passed,
 *  so the week being planned includes today.
 */
export function currentWeekMondayISO(timezone: string): string {
  const now = DateTime.now().setZone(timezone);
  // Luxon: weekday is 1 (Mon) .. 7 (Sun)
  return now.minus({ days: now.weekday - 1 }).toFormat("yyyy-LL-dd");
}

/** Validate an IANA zone name. */
export function isValidZone(zone: string): boolean {
  return DateTime.now().setZone(zone).isValid;
}

/* Country/region label for searchability — appended to city name so users can
 * search by either "Colombo" or "Sri Lanka". Only zones missing from this map
 * fall back to "City (Region)" labels — those are still searchable by city. */
const ZONE_COUNTRY: Record<string, string> = {
  // Asia
  "Asia/Kabul": "Afghanistan",
  "Asia/Yerevan": "Armenia",
  "Asia/Baku": "Azerbaijan",
  "Asia/Bahrain": "Bahrain",
  "Asia/Dhaka": "Bangladesh",
  "Asia/Thimphu": "Bhutan",
  "Asia/Brunei": "Brunei",
  "Asia/Phnom_Penh": "Cambodia",
  "Asia/Shanghai": "China",
  "Asia/Urumqi": "China",
  "Asia/Hong_Kong": "Hong Kong",
  "Asia/Macau": "Macau",
  "Asia/Tbilisi": "Georgia",
  "Asia/Kolkata": "India",
  "Asia/Jakarta": "Indonesia",
  "Asia/Makassar": "Indonesia",
  "Asia/Jayapura": "Indonesia",
  "Asia/Pontianak": "Indonesia",
  "Asia/Tehran": "Iran",
  "Asia/Baghdad": "Iraq",
  "Asia/Jerusalem": "Israel",
  "Asia/Tokyo": "Japan",
  "Asia/Amman": "Jordan",
  "Asia/Almaty": "Kazakhstan",
  "Asia/Aqtau": "Kazakhstan",
  "Asia/Aqtobe": "Kazakhstan",
  "Asia/Bishkek": "Kyrgyzstan",
  "Asia/Vientiane": "Laos",
  "Asia/Beirut": "Lebanon",
  "Asia/Kuala_Lumpur": "Malaysia",
  "Asia/Kuching": "Malaysia",
  "Asia/Ulaanbaatar": "Mongolia",
  "Asia/Yangon": "Myanmar",
  "Asia/Kathmandu": "Nepal",
  "Asia/Pyongyang": "North Korea",
  "Asia/Muscat": "Oman",
  "Asia/Karachi": "Pakistan",
  "Asia/Manila": "Philippines",
  "Asia/Qatar": "Qatar",
  "Asia/Riyadh": "Saudi Arabia",
  "Asia/Singapore": "Singapore",
  "Asia/Seoul": "South Korea",
  "Asia/Colombo": "Sri Lanka",
  "Asia/Taipei": "Taiwan",
  "Asia/Damascus": "Syria",
  "Asia/Dushanbe": "Tajikistan",
  "Asia/Bangkok": "Thailand",
  "Asia/Ashgabat": "Turkmenistan",
  "Asia/Dubai": "UAE",
  "Asia/Tashkent": "Uzbekistan",
  "Asia/Samarkand": "Uzbekistan",
  "Asia/Ho_Chi_Minh": "Vietnam",
  "Asia/Kuwait": "Kuwait",
  // Russia
  "Europe/Moscow": "Russia",
  "Europe/Kaliningrad": "Russia",
  "Europe/Samara": "Russia",
  "Asia/Yekaterinburg": "Russia",
  "Asia/Omsk": "Russia",
  "Asia/Novosibirsk": "Russia",
  "Asia/Krasnoyarsk": "Russia",
  "Asia/Irkutsk": "Russia",
  "Asia/Yakutsk": "Russia",
  "Asia/Vladivostok": "Russia",
  "Asia/Magadan": "Russia",
  "Asia/Kamchatka": "Russia",
  // Europe
  "Europe/London": "UK",
  "Europe/Dublin": "Ireland",
  "Europe/Paris": "France",
  "Europe/Berlin": "Germany",
  "Europe/Madrid": "Spain",
  "Europe/Rome": "Italy",
  "Europe/Amsterdam": "Netherlands",
  "Europe/Brussels": "Belgium",
  "Europe/Luxembourg": "Luxembourg",
  "Europe/Vienna": "Austria",
  "Europe/Zurich": "Switzerland",
  "Europe/Prague": "Czechia",
  "Europe/Warsaw": "Poland",
  "Europe/Budapest": "Hungary",
  "Europe/Bucharest": "Romania",
  "Europe/Sofia": "Bulgaria",
  "Europe/Belgrade": "Serbia",
  "Europe/Zagreb": "Croatia",
  "Europe/Ljubljana": "Slovenia",
  "Europe/Bratislava": "Slovakia",
  "Europe/Athens": "Greece",
  "Europe/Istanbul": "Turkey",
  "Europe/Stockholm": "Sweden",
  "Europe/Oslo": "Norway",
  "Europe/Copenhagen": "Denmark",
  "Europe/Helsinki": "Finland",
  "Europe/Tallinn": "Estonia",
  "Europe/Riga": "Latvia",
  "Europe/Vilnius": "Lithuania",
  "Europe/Kyiv": "Ukraine",
  "Europe/Kiev": "Ukraine",
  "Europe/Minsk": "Belarus",
  "Europe/Chisinau": "Moldova",
  "Europe/Lisbon": "Portugal",
  "Atlantic/Reykjavik": "Iceland",
  "Atlantic/Azores": "Portugal",
  "Atlantic/Canary": "Spain",
  // Americas — USA
  "America/New_York": "USA",
  "America/Chicago": "USA",
  "America/Denver": "USA",
  "America/Los_Angeles": "USA",
  "America/Phoenix": "USA",
  "America/Anchorage": "USA",
  "America/Detroit": "USA",
  "America/Indianapolis": "USA",
  "America/Indiana/Indianapolis": "USA",
  "America/Boise": "USA",
  "America/Juneau": "USA",
  "America/Adak": "USA",
  "Pacific/Honolulu": "USA",
  // Canada
  "America/Toronto": "Canada",
  "America/Vancouver": "Canada",
  "America/Edmonton": "Canada",
  "America/Winnipeg": "Canada",
  "America/Halifax": "Canada",
  "America/St_Johns": "Canada",
  "America/Regina": "Canada",
  // Latin America
  "America/Mexico_City": "Mexico",
  "America/Cancun": "Mexico",
  "America/Tijuana": "Mexico",
  "America/Monterrey": "Mexico",
  "America/Bogota": "Colombia",
  "America/Lima": "Peru",
  "America/La_Paz": "Bolivia",
  "America/Santiago": "Chile",
  "America/Sao_Paulo": "Brazil",
  "America/Manaus": "Brazil",
  "America/Recife": "Brazil",
  "America/Fortaleza": "Brazil",
  "America/Argentina/Buenos_Aires": "Argentina",
  "America/Argentina/Cordoba": "Argentina",
  "America/Caracas": "Venezuela",
  "America/Asuncion": "Paraguay",
  "America/Montevideo": "Uruguay",
  "America/Guayaquil": "Ecuador",
  "America/Panama": "Panama",
  "America/Costa_Rica": "Costa Rica",
  "America/Havana": "Cuba",
  "America/Jamaica": "Jamaica",
  "America/Port-au-Prince": "Haiti",
  "America/Santo_Domingo": "Dominican Republic",
  "America/Puerto_Rico": "Puerto Rico",
  // Africa
  "Africa/Cairo": "Egypt",
  "Africa/Lagos": "Nigeria",
  "Africa/Johannesburg": "South Africa",
  "Africa/Nairobi": "Kenya",
  "Africa/Algiers": "Algeria",
  "Africa/Tunis": "Tunisia",
  "Africa/Casablanca": "Morocco",
  "Africa/Addis_Ababa": "Ethiopia",
  "Africa/Accra": "Ghana",
  "Africa/Dakar": "Senegal",
  "Africa/Abidjan": "Ivory Coast",
  "Africa/Khartoum": "Sudan",
  "Africa/Kampala": "Uganda",
  "Africa/Dar_es_Salaam": "Tanzania",
  "Africa/Kigali": "Rwanda",
  "Africa/Tripoli": "Libya",
  "Africa/Harare": "Zimbabwe",
  "Africa/Lusaka": "Zambia",
  // Australia / Pacific
  "Australia/Sydney": "Australia",
  "Australia/Melbourne": "Australia",
  "Australia/Brisbane": "Australia",
  "Australia/Perth": "Australia",
  "Australia/Adelaide": "Australia",
  "Australia/Hobart": "Australia",
  "Australia/Darwin": "Australia",
  "Pacific/Auckland": "New Zealand",
  "Pacific/Chatham": "New Zealand",
  "Pacific/Fiji": "Fiji",
  "Pacific/Guam": "Guam",
  "Pacific/Port_Moresby": "Papua New Guinea",
  "Pacific/Tahiti": "French Polynesia",
  "Pacific/Samoa": "Samoa",
  "Pacific/Apia": "Samoa",
  "Pacific/Tongatapu": "Tonga"
};

/* Extra search aliases — extra labels pointing to the same IANA zone, so e.g.
 * "Mumbai" finds Asia/Kolkata, "Beijing" finds Asia/Shanghai. */
const ALIASES: { label: string; zone: string }[] = [
  { label: "Mumbai, India", zone: "Asia/Kolkata" },
  { label: "New Delhi, India", zone: "Asia/Kolkata" },
  { label: "Bangalore, India", zone: "Asia/Kolkata" },
  { label: "Bengaluru, India", zone: "Asia/Kolkata" },
  { label: "Hyderabad, India", zone: "Asia/Kolkata" },
  { label: "Chennai, India", zone: "Asia/Kolkata" },
  { label: "Pune, India", zone: "Asia/Kolkata" },
  { label: "Beijing, China", zone: "Asia/Shanghai" },
  { label: "Guangzhou, China", zone: "Asia/Shanghai" },
  { label: "Shenzhen, China", zone: "Asia/Shanghai" },
  { label: "Birmingham, UK", zone: "Europe/London" },
  { label: "Manchester, UK", zone: "Europe/London" },
  { label: "Edinburgh, UK", zone: "Europe/London" },
  { label: "Munich, Germany", zone: "Europe/Berlin" },
  { label: "Frankfurt, Germany", zone: "Europe/Berlin" },
  { label: "Hamburg, Germany", zone: "Europe/Berlin" },
  { label: "Barcelona, Spain", zone: "Europe/Madrid" },
  { label: "Milan, Italy", zone: "Europe/Rome" },
  { label: "Lyon, France", zone: "Europe/Paris" },
  { label: "Marseille, France", zone: "Europe/Paris" },
  { label: "San Francisco, USA", zone: "America/Los_Angeles" },
  { label: "Seattle, USA", zone: "America/Los_Angeles" },
  { label: "Portland, USA", zone: "America/Los_Angeles" },
  { label: "San Diego, USA", zone: "America/Los_Angeles" },
  { label: "Las Vegas, USA", zone: "America/Los_Angeles" },
  { label: "Boston, USA", zone: "America/New_York" },
  { label: "Washington DC, USA", zone: "America/New_York" },
  { label: "Miami, USA", zone: "America/New_York" },
  { label: "Atlanta, USA", zone: "America/New_York" },
  { label: "Philadelphia, USA", zone: "America/New_York" },
  { label: "Pittsburgh, USA", zone: "America/New_York" },
  { label: "Dallas, USA", zone: "America/Chicago" },
  { label: "Houston, USA", zone: "America/Chicago" },
  { label: "Austin, USA", zone: "America/Chicago" },
  { label: "Minneapolis, USA", zone: "America/Chicago" },
  { label: "Salt Lake City, USA", zone: "America/Denver" },
  { label: "Cape Town, South Africa", zone: "Africa/Johannesburg" },
  { label: "Durban, South Africa", zone: "Africa/Johannesburg" },
  { label: "Abu Dhabi, UAE", zone: "Asia/Dubai" },
  { label: "Doha, Qatar", zone: "Asia/Qatar" },
  { label: "Geneva, Switzerland", zone: "Europe/Zurich" },
  { label: "Rotterdam, Netherlands", zone: "Europe/Amsterdam" }
];

function formatCity(zone: string): string {
  const parts = zone.split("/");
  return parts[parts.length - 1].replace(/_/g, " ");
}

function buildTimezoneOptions(): { label: string; zone: string }[] {
  let zones: string[] = [];
  try {
    // Available in Node 18+ and every modern browser. Returns ~440 IANA zones.
    const supportedValuesOf = (
      Intl as unknown as { supportedValuesOf?: (key: string) => string[] }
    ).supportedValuesOf;
    if (typeof supportedValuesOf === "function") {
      zones = supportedValuesOf("timeZone");
    }
  } catch {
    zones = [];
  }

  const out: { label: string; zone: string }[] = [];

  for (const zone of zones) {
    if (zone === "Etc/UTC") {
      out.push({ label: "UTC", zone });
      continue;
    }
    // Skip "Etc/GMT+5", "Etc/GMT-3" — confusing & inverted, and rarely what users want
    if (zone.startsWith("Etc/")) continue;
    const city = formatCity(zone);
    const country = ZONE_COUNTRY[zone];
    // Label: "City, Country" when we know the country, else "City (Region)"
    const region = zone.split("/")[0];
    const label = country ? `${city}, ${country}` : `${city} (${region})`;
    out.push({ label, zone });
  }

  // Add city-aliases (same IANA zone, alternate searchable label)
  for (const a of ALIASES) out.push(a);

  // UTC pinned to the top; everything else alphabetical
  out.sort((a, b) => {
    if (a.zone === "Etc/UTC") return -1;
    if (b.zone === "Etc/UTC") return 1;
    return a.label.localeCompare(b.label);
  });

  return out;
}

/** Full IANA timezone list (~440 zones) with friendly labels.
 *  Search by city ("Colombo"), country ("Sri Lanka"), or IANA name ("Asia/Colombo"). */
export const TIMEZONE_OPTIONS: { label: string; zone: string }[] = buildTimezoneOptions();
