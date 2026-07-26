/**
 * KSP Intelligence Dashboard - Synthetic Mock Data
 * ⚠️ All data is entirely fictional and synthetically generated.
 * No real persons, cases, or events are represented.
 */

import type { FIR, Person, Vehicle, Evidence, Alert, Prediction, NetworkNode, NetworkEdge, KPIData, Officer, AuditLog } from '../types';

// Seeded pseudo-random number generator
function seededRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}
const rng = seededRng(0xdeadbeef);
function rand(min: number, max: number) { return Math.floor(rng() * (max - min + 1)) + min; }
function pick<T>(arr: T[]): T { return arr[rand(0, arr.length - 1)]; }
function pickN<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  const result: T[] = [];
  for (let i = 0; i < n && copy.length; i++) {
    const idx = rand(0, copy.length - 1);
    result.push(copy.splice(idx, 1)[0]);
  }
  return result;
}

const DISTRICTS = [
  'Bengaluru Urban', 'Bengaluru Rural', 'Mysuru', 'Mangaluru',
  'Hubballi-Dharwad', 'Belagavi', 'Kalaburagi', 'Shivamogga',
  'Tumakuru', 'Davangere',
];

const STATIONS = [
  'Cubbon Park PS', 'Sadashivanagar PS', 'Rajajinagar PS', 'Yeshwanthpur PS',
  'Whitefield PS', 'Electronic City PS', 'Hebbal PS', 'KR Puram PS',
  'Yelahanka PS', 'Koramangala PS', 'Indiranagar PS', 'Jayanagar PS',
  'Banashankari PS', 'JP Nagar PS', 'Silk Board PS', 'Madivala PS',
  'Bellandur PS', 'Marathahalli PS', 'HSR Layout PS', 'BTM Layout PS',
  'Basavanagudi PS', 'Malleswaram PS', 'Shivajinagar PS', 'Cottonpet PS',
  'Vijayanagar PS',
];

const CRIME_TYPES = [
  'Robbery', 'Vehicle Theft', 'Burglary', 'Assault', 'Cybercrime',
  'Drug Trafficking', 'Murder', 'Kidnapping', 'Extortion', 'Fraud',
  'Domestic Violence', 'Chain Snatching', 'Mob Violence', 'Arms Trafficking',
  'Human Trafficking', 'POCSO', 'Cheating', 'Forgery', 'Arson',
];

const WEAPONS = ['Knife', 'Firearm', 'Iron Rod', 'Machete', 'None', 'Unknown', 'Acid', 'Explosive Device'];
const MALE_NAMES = [
  'Arjun Sharma', 'Ravi Kumar', 'Manoj Nair', 'Vikram Singh', 'Suresh Gowda',
  'Kiran Patil', 'Pradeep Rao', 'Sanjay Reddy', 'Anil Verma', 'Deepak Hegde',
  'Ramesh Shetty', 'Ganesh Kulkarni', 'Naveen Murthy', 'Rohit Desai', 'Sunil Naik',
  'Ajay Bhat', 'Mahesh Kumar', 'Vinay Gowda', 'Shiva Prasad', 'Kartik Joshi',
];
const FEMALE_NAMES = [
  'Priya Sharma', 'Kavitha Nair', 'Sunita Rao', 'Meera Reddy', 'Ananya Gowda',
  'Lakshmi Patil', 'Divya Hegde', 'Rekha Shetty', 'Pooja Kulkarni', 'Nandini Murthy',
  'Sindhu Desai', 'Asha Naik', 'Bhavana Bhat', 'Swathi Kumar', 'Rashmi Gowda',
];
const ALL_NAMES = [...MALE_NAMES, ...FEMALE_NAMES];
const OFFICER_NAMES = [
  'SI Ramesh Kumar', 'PSI Kavitha Nair', 'SI Vikram Singh', 'DySP Suresh Rao',
  'SI Ananya Gowda', 'PSI Manoj Patil', 'SI Priya Reddy', 'Inspector Kiran Hegde',
  'SI Sunil Naik', 'PSI Deepak Shetty',
];

const LOCATIONS = [
  { name: 'MG Road', lat: 12.9756, lng: 77.6066 },
  { name: 'Koramangala', lat: 12.9352, lng: 77.6245 },
  { name: 'Whitefield', lat: 12.9698, lng: 77.7500 },
  { name: 'Jayanagar 4th Block', lat: 12.9254, lng: 77.5838 },
  { name: 'Marathahalli Bridge', lat: 12.9591, lng: 77.6974 },
  { name: 'Silk Board', lat: 12.9166, lng: 77.6234 },
  { name: 'Electronic City', lat: 12.8456, lng: 77.6603 },
  { name: 'Hebbal Flyover', lat: 13.0358, lng: 77.5970 },
  { name: 'KR Market', lat: 12.9716, lng: 77.5726 },
  { name: 'Yelahanka', lat: 13.1005, lng: 77.5963 },
  { name: 'BTM Layout', lat: 12.9166, lng: 77.6101 },
  { name: 'HSR Layout', lat: 12.9116, lng: 77.6389 },
  { name: 'Indiranagar 100ft Road', lat: 12.9784, lng: 77.6408 },
  { name: 'Malleshwaram Circle', lat: 13.0027, lng: 77.5681 },
  { name: 'Rajajinagar Main Road', lat: 12.9938, lng: 77.5527 },
];

const STATUSES: FIR['status'][] = ['Open', 'Under Investigation', 'Closed', 'Pending'];
const SEVERITIES: FIR['severity'][] = ['Critical', 'High', 'Medium', 'Low'];

function randDate(daysBack: number): string {
  const d = new Date();
  d.setDate(d.getDate() - rand(0, daysBack));
  d.setHours(rand(0, 23), rand(0, 59));
  return d.toISOString();
}

const KARNATAKA_DISTRICT_BOUNDS: Record<string, { latMin: number; latMax: number; lngMin: number; lngMax: number; locName: string }> = {
  'Bengaluru Urban':  { latMin: 12.830, latMax: 13.140, lngMin: 77.450, lngMax: 77.750, locName: 'MG Road' },
  'Bengaluru Rural':  { latMin: 13.080, latMax: 13.400, lngMin: 77.350, lngMax: 77.800, locName: 'Doddaballapura Circle' },
  'Mysuru':           { latMin: 12.100, latMax: 12.500, lngMin: 76.350, lngMax: 76.900, locName: 'Palace Road' },
  'Belagavi':         { latMin: 15.550, latMax: 16.200, lngMin: 74.200, lngMax: 74.850, locName: 'Tilakwadi' },
  'Hubballi-Dharwad': { latMin: 15.250, latMax: 15.650, lngMin: 74.900, lngMax: 75.250, locName: 'Unkal Lake' },
  'Mangaluru':        { latMin: 12.700, latMax: 13.100, lngMin: 74.800, lngMax: 75.300, locName: 'Hampankatta' },
  'Kalaburagi':       { latMin: 17.000, latMax: 17.600, lngMin: 76.450, lngMax: 77.150, locName: 'Super Market Circle' },
  'Shivamogga':       { latMin: 13.700, latMax: 14.200, lngMin: 75.200, lngMax: 75.850, locName: 'BH Road' },
  'Tumakuru':         { latMin: 13.150, latMax: 13.800, lngMin: 76.600, lngMax: 77.300, locName: 'BH Road Circle' },
  'Davangere':        { latMin: 14.250, latMax: 14.700, lngMin: 75.650, lngMax: 76.150, locName: 'PB Road' },
};

export const MOCK_FIRS: FIR[] = Array.from({ length: 520 }, (_, i) => {
  const district = pick(DISTRICTS);
  const distMeta = KARNATAKA_DISTRICT_BOUNDS[district] || KARNATAKA_DISTRICT_BOUNDS['Bengaluru Urban'];
  const crimeType = pick(CRIME_TYPES);
  const gender = rng() > 0.4 ? 'Male' : 'Female';
  const victimName = gender === 'Male' ? pick(MALE_NAMES) : pick(FEMALE_NAMES);
  const suspectGender = rng() > 0.3 ? 'Male' : 'Female';
  const suspectName = suspectGender === 'Male' ? pick(MALE_NAMES) : pick(FEMALE_NAMES);
  const station = pick(STATIONS);
  const officerName = pick(OFFICER_NAMES);
  const status = pick(STATUSES);
  const severity = pick(SEVERITIES);
  const dateReported = randDate(365);
  const dateOccurred = randDate(370);

  const latitude = distMeta.latMin + rng() * (distMeta.latMax - distMeta.latMin);
  const longitude = distMeta.lngMin + rng() * (distMeta.lngMax - distMeta.lngMin);

  return {
    id: `fir-${i + 1}`,
    firNumber: `KSP/${new Date(dateReported).getFullYear()}/${String(i + 1001).padStart(5, '0')}`,
    crimeType,
    description: `${crimeType} incident reported at ${distMeta.locName}. Case under investigation by ${station}.`,
    victimName,
    victimAge: rand(18, 75),
    victimGender: gender as 'Male' | 'Female',
    suspectName,
    suspectAge: rand(18, 60),
    officerName,
    officerId: `off-${rand(1, 10)}`,
    district,
    station,
    status,
    dateReported,
    dateOccurred,
    location: distMeta.locName,
    latitude,
    longitude,
    severity,
    weaponUsed: rng() > 0.5 ? pick(WEAPONS) : undefined,
    evidenceCount: rand(0, 8),
  };
});

// ─── Persons ────────────────────────────────────────────────────────────────
export const MOCK_PERSONS: Person[] = Array.from({ length: 55 }, (_, i) => {
  const gender = rng() > 0.35 ? 'Male' : 'Female';
  const name = gender === 'Male' ? pick(MALE_NAMES) : pick(FEMALE_NAMES);
  const role = pick(['Suspect', 'Victim', 'Witness', 'Associate'] as Person['role'][]);
  const linkedFIRs = pickN(MOCK_FIRS, rand(1, 5)).map(f => f.id);

  return {
    id: `person-${i + 1}`,
    name,
    age: rand(18, 65),
    gender: gender as 'Male' | 'Female',
    dob: `${rand(1960, 2003)}-${String(rand(1, 12)).padStart(2, '0')}-${String(rand(1, 28)).padStart(2, '0')}`,
    address: `${rand(1, 500)}, ${pick(LOCATIONS).name}, ${pick(DISTRICTS)}`,
    district: pick(DISTRICTS),
    phone: `+91 ${rand(7000000000, 9999999999)}`,
    aadhaarLast4: String(rand(1000, 9999)),
    role,
    riskScore: rand(10, 98),
    linkedFIRs,
    linkedPersons: [],
    notes: role === 'Suspect' ? `Known associate in ${pick(CRIME_TYPES)} cases.` : undefined,
  };
});

// Link persons to each other
MOCK_PERSONS.forEach((p, i) => {
  const others = pickN(MOCK_PERSONS, rand(1, 4))
    .filter(o => o.id !== p.id)
    .map(o => o.id);
  MOCK_PERSONS[i].linkedPersons = others;
});

// ─── Vehicles ────────────────────────────────────────────────────────────────
const CAR_MAKES = ['Maruti Suzuki', 'Hyundai', 'Honda', 'Toyota', 'Tata', 'Mahindra', 'KIA', 'Bajaj', 'Hero', 'TVS'];
const CAR_MODELS = ['Swift', 'i20', 'City', 'Innova', 'Nexon', 'Bolero', 'Seltos', 'Pulsar', 'Splendor', 'Apache'];
const COLORS = ['White', 'Black', 'Silver', 'Red', 'Blue', 'Grey', 'Green', 'Yellow'];
const VEHICLE_STATUSES: Vehicle['status'][] = ['Clear', 'Wanted', 'Stolen', 'Under Watch'];

export const MOCK_VEHICLES: Vehicle[] = Array.from({ length: 80 }, (_, i) => {
  const owner = pick(MOCK_PERSONS);
  return {
    id: `vehicle-${i + 1}`,
    registrationNumber: `KA ${String(rand(1, 99)).padStart(2, '0')} ${String.fromCharCode(65 + rand(0, 25))}${String.fromCharCode(65 + rand(0, 25))} ${String(rand(1000, 9999))}`,
    type: rng() > 0.4 ? 'Car' : 'Motorcycle',
    make: pick(CAR_MAKES),
    model: pick(CAR_MODELS),
    color: pick(COLORS),
    ownerId: owner.id,
    ownerName: owner.name,
    status: pick(VEHICLE_STATUSES),
    linkedFIRs: pickN(MOCK_FIRS, rand(0, 3)).map(f => f.id),
  };
});

// ─── Evidence ────────────────────────────────────────────────────────────────
const EV_TYPES: Evidence['type'][] = ['Image', 'Video', 'Audio', 'Document', 'Physical'];
const EV_NAMES = ['crime_scene.jpg', 'cctv_footage.mp4', 'witness_recording.mp3', 'fir_copy.pdf', 'forensic_report.pdf', 'suspect_photo.jpg', 'map_screenshot.png', 'phone_extract.pdf'];

export const MOCK_EVIDENCE: Evidence[] = Array.from({ length: 200 }, (_, i) => {
  const fir = pick(MOCK_FIRS);
  const type = pick(EV_TYPES);
  return {
    id: `ev-${i + 1}`,
    firId: fir.id,
    type,
    fileName: `${EV_NAMES[rand(0, EV_NAMES.length - 1)].replace('.', `_${i + 1}.`)}`,
    fileSize: rand(50000, 50000000),
    mimeType: type === 'Image' ? 'image/jpeg' : type === 'Video' ? 'video/mp4' : type === 'Audio' ? 'audio/mpeg' : 'application/pdf',
    uploadedBy: pick(OFFICER_NAMES),
    uploadedAt: randDate(180),
    description: `${type} evidence collected from ${fir.location} for FIR ${fir.firNumber}.`,
    tags: pickN(['forensic', 'cctv', 'physical', 'digital', 'witness', 'suspect'], rand(1, 3)),
  };
});

// ─── Alerts ──────────────────────────────────────────────────────────────────
const ALERT_TYPES: Alert['type'][] = ['Crime Spike', 'Repeat Offender Released', 'Vehicle Theft Alert', 'Cyber Attack', 'Gang Activity', 'High Risk Zone'];
const ALERT_SEVERITIES: Alert['severity'][] = ['Critical', 'High', 'Medium', 'Low'];

export const MOCK_ALERTS: Alert[] = Array.from({ length: 60 }, (_, i) => {
  const type = pick(ALERT_TYPES);
  const severity = pick(ALERT_SEVERITIES);
  const district = pick(DISTRICTS);
  const loc = pick(LOCATIONS);
  return {
    id: `alert-${i + 1}`,
    type,
    severity,
    title: `${type} - ${district}`,
    description: `${type} detected in ${loc.name}, ${district}. Immediate attention required. Estimated impact: ${rand(2, 25)} incidents within 24h.`,
    district,
    location: loc.name,
    timestamp: randDate(7),
    isRead: rng() > 0.6,
  };
});

// ─── Predictions ─────────────────────────────────────────────────────────────
export const MOCK_PREDICTIONS: Prediction[] = Array.from({ length: 40 }, (_, i) => {
  const type = pick(['Hotspot', 'Repeat Offender', 'Trend', 'Patrol'] as Prediction['type'][]);
  const loc = pick(LOCATIONS);
  const district = pick(DISTRICTS);
  return {
    id: `pred-${i + 1}`,
    type,
    district,
    location: loc.name,
    latitude: loc.lat + (rng() - 0.5) * 0.02,
    longitude: loc.lng + (rng() - 0.5) * 0.02,
    confidence: rand(55, 95),
    riskScore: rand(30, 99),
    description: `Model predicts elevated ${pick(CRIME_TYPES)} activity in ${loc.name} area based on historical patterns.`,
    recommendation: `Deploy ${rand(2, 6)} additional patrol units to ${loc.name}. Focus on ${pick(['evening', 'night', 'morning'])} hours.`,
    predictedDate: randDate(-7),
    crimeType: pick(CRIME_TYPES),
  };
});

// ─── Criminal Network ─────────────────────────────────────────────────────────
export const MOCK_NETWORK_NODES: NetworkNode[] = [
  ...MOCK_PERSONS.slice(0, 30).map(p => ({
    id: p.id,
    label: p.name,
    type: 'Person' as const,
    riskScore: p.riskScore,
    data: { ...p },
  })),
  ...MOCK_VEHICLES.slice(0, 10).map(v => ({
    id: v.id,
    label: v.registrationNumber,
    type: 'Vehicle' as const,
    data: { ...v },
  })),
  ...MOCK_FIRS.slice(0, 10).map(f => ({
    id: f.id,
    label: f.firNumber,
    type: 'Case' as const,
    data: { ...f },
  })),
  { id: 'org-1', label: 'Shadow Network KA', type: 'Organization', data: { description: 'Suspected organized crime group' } },
  { id: 'org-2', label: 'Eastern Cartel', type: 'Organization', data: { description: 'Drug trafficking network' } },
  { id: 'loc-1', label: 'Warehouse A - Yeshwanthpur', type: 'Location', data: { lat: 13.0227, lng: 77.5416 } },
  { id: 'phone-1', label: '+91-XXXXXXXX42', type: 'Phone', data: { carrier: 'Jio' } },
  { id: 'phone-2', label: '+91-XXXXXXXX17', type: 'Phone', data: { carrier: 'Airtel' } },
  { id: 'weapon-1', label: 'Country-made Pistol', type: 'Weapon', data: { caliber: '.32' } },
  { id: 'weapon-2', label: 'Machete (Exhibit A)', type: 'Weapon', data: {} },
];

const EDGE_TYPES: NetworkEdge['type'][] = ['Owns', 'Called', 'Visited', 'Associated', 'Arrested', 'Investigated', 'Linked'];
export const MOCK_NETWORK_EDGES: NetworkEdge[] = Array.from({ length: 60 }, (_, i) => {
  const nodes = MOCK_NETWORK_NODES;
  const src = pick(nodes);
  const tgt = pick(nodes.filter(n => n.id !== src.id));
  const type = pick(EDGE_TYPES);
  return {
    id: `edge-${i + 1}`,
    source: src.id,
    target: tgt.id,
    type,
    label: type,
  };
});

// ─── KPIs ────────────────────────────────────────────────────────────────────
export const MOCK_KPIS: KPIData = {
  totalFIRs: MOCK_FIRS.length,
  openCases: MOCK_FIRS.filter(f => f.status === 'Open').length,
  solvedCases: MOCK_FIRS.filter(f => f.status === 'Closed').length,
  todayCrimes: 14,
  todayArrests: 7,
  activeInvestigations: MOCK_FIRS.filter(f => f.status === 'Under Investigation').length,
  repeatOffenders: 23,
  crimeRiskScore: 72,
};

// ─── Officers ────────────────────────────────────────────────────────────────
const RANKS = ['Constable', 'Head Constable', 'ASI', 'SI', 'PSI', 'Inspector', 'DySP', 'SP', 'DIG', 'IG'];
export const MOCK_OFFICERS: Officer[] = Array.from({ length: 25 }, (_, i) => {
  const name = pick(ALL_NAMES);
  const district = pick(DISTRICTS);
  const station = pick(STATIONS);
  const role = i === 0 ? 'Admin' : i < 5 ? 'Analyst' : 'Officer';
  return {
    id: `off-${i + 1}`,
    name,
    rank: pick(RANKS),
    badgeNumber: `KSP${String(rand(10000, 99999))}`,
    district,
    station,
    role: role as Officer['role'],
    email: `${name.toLowerCase().replace(/\s+/, '.')}@ksp.gov.in`,
    phone: `+91 ${rand(7000000000, 9999999999)}`,
    assignedCases: rand(2, 25),
    closedCases: rand(1, 20),
    joinedDate: `${rand(2010, 2023)}-${String(rand(1, 12)).padStart(2, '0')}-${String(rand(1, 28)).padStart(2, '0')}`,
    status: rng() > 0.1 ? 'Active' : 'On Leave',
  };
});

// ─── Audit Logs ───────────────────────────────────────────────────────────────
const AUDIT_ACTIONS = ['Login', 'Logout', 'View FIR', 'Edit FIR', 'Create User', 'Delete User', 'Export Report', 'View Network', 'Search Records', 'Assign Case'];
export const MOCK_AUDIT_LOGS: AuditLog[] = Array.from({ length: 100 }, (_, i) => {
  const officer = pick(MOCK_OFFICERS);
  const action = pick(AUDIT_ACTIONS);
  return {
    id: `audit-${i + 1}`,
    action,
    performedBy: officer.name,
    targetUser: rng() > 0.5 ? pick(MOCK_OFFICERS).name : undefined,
    timestamp: randDate(30),
    details: `${action} performed by ${officer.name} from ${officer.station}.`,
    ipAddress: `192.168.${rand(1, 10)}.${rand(1, 254)}`,
  };
});

// ─── Analytics helpers ────────────────────────────────────────────────────────
export function getCrimeTrend() {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months.map(month => ({
    name: month,
    crimes: rand(30, 120),
    arrests: rand(10, 60),
    solved: rand(8, 50),
  }));
}

export function getHourlyTrend() {
  return Array.from({ length: 24 }, (_, h) => ({
    name: `${String(h).padStart(2, '0')}:00`,
    crimes: rand(0, 25),
  }));
}

export function getCrimeDistribution() {
  return CRIME_TYPES.slice(0, 8).map(type => ({
    name: type,
    value: rand(20, 150),
  }));
}

export function getDistrictComparison() {
  return DISTRICTS.map(d => ({
    name: d.split('-')[0].trim(),
    crimes: rand(20, 200),
    arrests: rand(10, 80),
    solved: rand(5, 60),
  }));
}

export function getWeaponAnalysis() {
  return WEAPONS.filter(w => w !== 'Unknown').map(w => ({
    name: w,
    value: rand(5, 80),
  }));
}

export function getAgeDistribution() {
  return [
    { name: '18-25', value: rand(80, 150) },
    { name: '26-35', value: rand(120, 200) },
    { name: '36-45', value: rand(80, 130) },
    { name: '46-55', value: rand(40, 90) },
    { name: '55+',   value: rand(10, 40) },
  ];
}

export function getGenderDistribution() {
  return [
    { name: 'Male',   value: rand(300, 420) },
    { name: 'Female', value: rand(80, 180) },
    { name: 'Other',  value: rand(5, 20) },
  ];
}

// ─── Activity Feed ────────────────────────────────────────────────────────────
export const LIVE_ACTIVITY_ITEMS = Array.from({ length: 30 }, (_, i) => {
  const fir = pick(MOCK_FIRS);
  const type = pick(['FIR Filed', 'Arrest Made', 'Case Updated', 'Alert Raised', 'Evidence Added', 'Case Closed']);
  const icons: Record<string, string> = {
    'FIR Filed': '📋', 'Arrest Made': '🚔', 'Case Updated': '📝',
    'Alert Raised': '🚨', 'Evidence Added': '🔍', 'Case Closed': '✅',
  };
  return {
    id: `activity-${i + 1}`,
    type,
    icon: icons[type],
    message: `${type}: ${fir.firNumber} — ${fir.crimeType} at ${fir.location}`,
    officer: pick(OFFICER_NAMES),
    timestamp: randDate(1),
    severity: fir.severity,
  };
});

export const AI_SUGGESTED_QUESTIONS = [
  'Summarize recent crime trends in Bengaluru Urban',
  'Who are the top repeat offenders in Koramangala?',
  'What is the predicted crime hotspot for next week?',
  'Show connections between suspects in Case KSP/2024/01007',
  'Analyze weapon usage patterns over the last 6 months',
  'List all open robbery cases in Whitefield',
  'What patrol recommendations does the model suggest for this weekend?',
  'Compare crime rates across districts this quarter',
];

export const MOCK_CHAT_RESPONSES = [
  {
    content: `Based on analysis of ${MOCK_FIRS.length} FIRs in the database, I've identified the following key trends:\n\n**Top Crime Categories:**\n• Vehicle Theft: 18% of total cases\n• Robbery: 15% of cases\n• Cybercrime: 12% of cases\n\n**High Risk Zones:**\n• MG Road corridor shows elevated activity (↑23% MoM)\n• Whitefield Industrial Area — 7 incidents last week\n\n**Recommendation:** Increase patrol density in Koramangala and BTM Layout during 20:00–02:00 hours.`,
    sources: [
      { title: 'FIR Database Analysis', confidence: 94, type: 'Database' },
      { title: 'Predictive Model v2.1', confidence: 87, type: 'ML Model' },
      { title: 'Historical Trend Report Q4', confidence: 91, type: 'Report' },
    ],
  },
  {
    content: `I found **3 high-risk individuals** with multiple FIR linkages in the specified area.\n\n**Arjun Sharma** (Risk Score: 89) — Linked to 4 FIRs, last seen Koramangala\n**Vikram Singh** (Risk Score: 82) — Linked to 3 FIRs, known vehicle thief\n**Ravi Kumar** (Risk Score: 77) — Linked to 2 FIRs, suspected drug network\n\nWould you like to view their full network graph or generate an intelligence report?`,
    sources: [
      { title: 'Person-of-Interest Registry', confidence: 96, type: 'Database' },
      { title: 'Network Analysis Engine', confidence: 83, type: 'Graph DB' },
    ],
  },
  {
    content: `The patrol recommendation model suggests the following deployment for the upcoming weekend:\n\n• **MG Road / Brigade Road**: 4 additional units, 18:00–03:00\n• **Whitefield IT Corridor**: 2 units focused on vehicle theft prevention\n• **KR Market**: 3 units, Saturday morning market hours\n• **Koramangala 5th Block**: 2 undercover units\n\n*Confidence: 88% based on 52-week historical data and upcoming event calendar.*`,
    sources: [
      { title: 'Patrol Optimization Model', confidence: 88, type: 'ML Model' },
      { title: 'Event Calendar Integration', confidence: 72, type: 'External' },
      { title: 'Officer Availability System', confidence: 95, type: 'Database' },
    ],
  },
];

export const DISTRICTS_LIST = DISTRICTS;
export const CRIME_TYPES_LIST = CRIME_TYPES;
export const STATIONS_LIST = STATIONS;
export const OFFICER_NAMES_LIST = OFFICER_NAMES;
