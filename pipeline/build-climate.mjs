// Builds app/src/v4/climate/climate.json: for each city, the typical daily minimum and maximum air temperature and
// mean relative humidity per calendar month, averaged over 2015–2024 from ERA5-based reanalysis served by
// Open-Meteo (archive API). The page cannot fetch live weather (claude.ai pages may not call outside servers),
// so it uses these real climate normals for today's month.
// Run: node pipeline/build-climate.mjs   (needs internet; ~2 requests per city, polite delay)
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';

const CITIES = [
  // Croatia
  ['Zagreb', 'HR'], ['Split', 'HR'], ['Rijeka', 'HR'], ['Osijek', 'HR'], ['Zadar', 'HR'], ['Pula', 'HR'], ['Dubrovnik', 'HR'],
  ['Varaždin', 'HR'], ['Slavonski Brod', 'HR'], ['Šibenik', 'HR'], ['Karlovac', 'HR'], ['Sisak', 'HR'], ['Velika Gorica', 'HR'],
  ['Vinkovci', 'HR'], ['Vukovar', 'HR'], ['Bjelovar', 'HR'], ['Koprivnica', 'HR'], ['Čakovec', 'HR'], ['Požega', 'HR'],
  ['Makarska', 'HR'], ['Gospić', 'HR'], ['Knin', 'HR'], ['Poreč', 'HR'], ['Rovinj', 'HR'], ['Krk', 'HR'], ['Hvar', 'HR'],
  ['Korčula', 'HR'], ['Samobor', 'HR'], ['Virovitica', 'HR'], ['Đakovo', 'HR'], ['Trogir', 'HR'], ['Opatija', 'HR'],
  // Region
  ['Ljubljana', 'SI'], ['Maribor', 'SI'], ['Sarajevo', 'BA'], ['Mostar', 'BA'], ['Banja Luka', 'BA'], ['Tuzla', 'BA'],
  ['Belgrade', 'RS'], ['Novi Sad', 'RS'], ['Niš', 'RS'], ['Podgorica', 'ME'], ['Budva', 'ME'], ['Skopje', 'MK'], ['Tirana', 'AL'],
  ['Budapest', 'HU'], ['Vienna', 'AT'], ['Graz', 'AT'], ['Salzburg', 'AT'], ['Munich', 'DE'], ['Trieste', 'IT'], ['Venice', 'IT'],
  ['Sofia', 'BG'], ['Bucharest', 'RO'], ['Bratislava', 'SK'], ['Prague', 'CZ'], ['Warsaw', 'PL'], ['Krakow', 'PL'],
  // Europe
  ['London', 'GB'], ['Manchester', 'GB'], ['Dublin', 'IE'], ['Paris', 'FR'], ['Marseille', 'FR'], ['Nice', 'FR'], ['Berlin', 'DE'],
  ['Hamburg', 'DE'], ['Frankfurt', 'DE'], ['Stuttgart', 'DE'], ['Cologne', 'DE'], ['Zurich', 'CH'], ['Geneva', 'CH'],
  ['Amsterdam', 'NL'], ['Brussels', 'BE'], ['Copenhagen', 'DK'], ['Stockholm', 'SE'], ['Oslo', 'NO'], ['Helsinki', 'FI'],
  ['Reykjavik', 'IS'], ['Madrid', 'ES'], ['Barcelona', 'ES'], ['Seville', 'ES'], ['Valencia', 'ES'], ['Lisbon', 'PT'],
  ['Porto', 'PT'], ['Rome', 'IT'], ['Milan', 'IT'], ['Naples', 'IT'], ['Palermo', 'IT'], ['Athens', 'GR'], ['Thessaloniki', 'GR'],
  ['Istanbul', 'TR'], ['Ankara', 'TR'], ['Antalya', 'TR'], ['Kyiv', 'UA'], ['Moscow', 'RU'], ['Valletta', 'MT'], ['Nicosia', 'CY'],
  // Americas
  ['New York', 'US'], ['Los Angeles', 'US'], ['San Francisco', 'US'], ['Austin', 'US'], ['Houston', 'US'], ['Dallas', 'US'],
  ['Miami', 'US'], ['Chicago', 'US'], ['Seattle', 'US'], ['Boston', 'US'], ['Washington', 'US'], ['Las Vegas', 'US'],
  ['Phoenix', 'US'], ['Denver', 'US'], ['Atlanta', 'US'], ['Orlando', 'US'], ['Brownsville', 'US'], ['Toronto', 'CA'],
  ['Vancouver', 'CA'], ['Montreal', 'CA'], ['Mexico City', 'MX'], ['Cancún', 'MX'], ['Havana', 'CU'], ['Bogotá', 'CO'],
  ['Lima', 'PE'], ['Santiago', 'CL'], ['Buenos Aires', 'AR'], ['São Paulo', 'BR'], ['Rio de Janeiro', 'BR'],
  // Asia, Middle East, Africa, Oceania
  ['Dubai', 'AE'], ['Abu Dhabi', 'AE'], ['Doha', 'QA'], ['Riyadh', 'SA'], ['Tel Aviv', 'IL'], ['Cairo', 'EG'], ['Marrakesh', 'MA'],
  ['Tunis', 'TN'], ['Lagos', 'NG'], ['Nairobi', 'KE'], ['Cape Town', 'ZA'], ['Johannesburg', 'ZA'], ['Mumbai', 'IN'],
  ['Delhi', 'IN'], ['Bangalore', 'IN'], ['Karachi', 'PK'], ['Bangkok', 'TH'], ['Singapore', 'SG'], ['Kuala Lumpur', 'MY'],
  ['Jakarta', 'ID'], ['Bali', 'ID'], ['Manila', 'PH'], ['Ho Chi Minh City', 'VN'], ['Hanoi', 'VN'], ['Hong Kong', 'HK'],
  ['Shanghai', 'CN'], ['Beijing', 'CN'], ['Seoul', 'KR'], ['Tokyo', 'JP'], ['Osaka', 'JP'], ['Taipei', 'TW'],
  ['Sydney', 'AU'], ['Melbourne', 'AU'], ['Perth', 'AU'], ['Auckland', 'NZ'],
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function getJson(url, tries = 8) {
  for (let i = 0; i < tries; i++) {
    const res = await fetch(url);
    if (res.ok) return res.json();
    console.warn('HTTP', res.status, '— waiting', 15 * (i + 1), 's');
    await sleep(15000 * (i + 1)); // the archive API counts 10 years as many calls: back off generously
  }
  throw new Error(`failed: ${url}`);
}

// resumable: each finished city is kept in a cache file
const CACHE = 'pipeline/.climate-cache.json';
const cache = existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, 'utf8')) : {};
const out = [];
for (const [name, cc] of CITIES) {
  const key = `${name}|${cc}`;
  if (cache[key]) { out.push(cache[key]); continue; }
  const geo = await getJson(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=10&language=en&format=json`);
  const hit = (geo.results ?? []).find((r) => r.country_code === cc);
  if (!hit) { console.warn('no geocode', name, cc); continue; }
  if (process.argv.includes('--nasa')) {
    // Fallback when the Open-Meteo archive quota is used up: NASA POWER monthly climatology (MERRA-2, coarser grid),
    // mean 2-m air temperature and mean daily temperature range per month. One request per city.
    const n = await getJson(`https://power.larc.nasa.gov/api/temporal/climatology/point?parameters=T2M,T2M_RANGE,RH2M&community=RE&longitude=${hit.longitude}&latitude=${hit.latitude}&format=JSON`);
    const P = n.properties.parameter, K = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const r1n = (v) => Math.round(v * 10) / 10;
    out.push({ name: hit.name, country: hit.country, cc, lat: r1n(hit.latitude), lon: r1n(hit.longitude), admin: hit.admin1 ?? '', src: 'NASA POWER climatology',
      // T2M_MAX/MIN climatology are monthly extremes; the typical day = mean +/- half the mean daily range
      m: K.map((k) => [r1n(P.T2M[k] - P.T2M_RANGE[k] / 2), r1n(P.T2M[k] + P.T2M_RANGE[k] / 2), Math.round(P.RH2M[k])]) });
    cache[key] = out.at(-1); writeFileSync(CACHE, JSON.stringify(cache));
    console.log(name, 'NASA', out.at(-1).m[6], out.at(-1).m[0]);
    await sleep(1500);
    continue;
  }
  const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${hit.latitude}&longitude=${hit.longitude}` +
    '&start_date=2015-01-01&end_date=2024-12-31&daily=temperature_2m_max,temperature_2m_min&timezone=auto';
  const d = await getJson(url);
  const acc = Array.from({ length: 12 }, () => ({ tmax: 0, tmin: 0, rh: 0, n: 0, nrh: 0 }));
  d.daily.time.forEach((day, i) => {
    const m = Number(day.slice(5, 7)) - 1;
    const tx = d.daily.temperature_2m_max[i], tn = d.daily.temperature_2m_min[i], rh = d.daily.relative_humidity_2m_mean?.[i];
    if (tx == null || tn == null) return;
    acc[m].tmax += tx; acc[m].tmin += tn; acc[m].n++;
    if (rh != null) { acc[m].rh += rh; acc[m].nrh++; }
  });
  const r1 = (v) => Math.round(v * 10) / 10;
  out.push({
    name: hit.name, country: hit.country, cc, lat: r1(hit.latitude), lon: r1(hit.longitude), admin: hit.admin1 ?? '',
    // per month: [mean daily min °C, mean daily max °C, mean relative humidity % (null for cities fetched without it; not used by the model)]
    m: acc.map((a) => [r1(a.tmin / a.n), r1(a.tmax / a.n), a.nrh ? Math.round(a.rh / a.nrh) : null]),
  });
  cache[key] = out.at(-1);
  writeFileSync(CACHE, JSON.stringify(cache));
  console.log(name, out.at(-1).m[6], out.at(-1).m[0]);
  await sleep(6000);
}
mkdirSync('app/src/v4/climate', { recursive: true });
writeFileSync('app/src/v4/climate/climate.json', JSON.stringify({ source: 'Open-Meteo Historical Weather API (ERA5 / ERA5-Land reanalysis), daily 2015-01-01..2024-12-31, monthly means; cities marked src = NASA POWER monthly climatology (MERRA-2)', cities: out }));
console.log('cities', out.length);
