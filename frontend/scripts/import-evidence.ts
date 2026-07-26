import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

let SUPABASE_URL = '';
let SUPABASE_SERVICE_KEY = '';

const envPaths = [
  path.resolve(process.cwd(), 'frontend/.env'),
  path.resolve(process.cwd(), 'backend/.env'),
  path.resolve(process.cwd(), '.env'),
];

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    const envText = fs.readFileSync(envPath, 'utf-8');
    envText.split('\n').forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        value = value.replace(/^['"]|['"]$/g, '').trim();
        if (key === 'SUPABASE_URL' || key === 'VITE_SUPABASE_URL') {
          if (!SUPABASE_URL) SUPABASE_URL = value;
        }
        if (key === 'SUPABASE_SERVICE_KEY') {
          if (!SUPABASE_SERVICE_KEY) SUPABASE_SERVICE_KEY = value;
        }
      }
    });
  }
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ ERROR: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in your .env file.');
  console.error('Create a backend/.env with: SUPABASE_URL=... and SUPABASE_SERVICE_KEY=...');
  process.exit(1);
}

console.log(`[INIT] Supabase URL: ${SUPABASE_URL}`);
console.log(`[INIT] Using Admin Service Key: ${SUPABASE_SERVICE_KEY.substring(0, 12)}...`);

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false }
});

const BUCKET_NAME = 'evidence-files';

const POLICE_OFFICERS = [
  'Insp. Ramesh Gowda',
  'Insp. Manjunath Patil',
  'SI Savitha Bhat',
  'Insp. Venkatesh Rao',
  'Sub-Insp. Prakash Shetty',
  'Insp. Anand Kumar',
  'SI Deepa Hegde',
  'Insp. Rajesh Nayak',
  'SI Sunita Kulkarni',
];

const DISTRICTS = [
  'Bengaluru City',
  'Mysuru City',
  'Mangaluru City',
  'Hubballi-Dharwad',
  'Belagavi',
  'Kalaburagi',
  'Tumakuru',
  'Udupi',
  'Shivamogga',
];

const CRIME_TYPES: Record<string, string[]> = {
  'Crime Scene': ['Homicide', 'Burglary', 'Aggravated Assault', 'Robbery', 'Vandalism'],
  'Weapons': ['Illegal Firearm Possession', 'Armed Robbery', 'Assault with Weapon', 'Contraband Recovery'],
  'Vehicles': ['Vehicle Theft', 'Hit and Run', 'Illegal Drag Racing', 'Vehicle Smuggling'],
  'Fingerprints': ['Latent Print Identification', 'AFIS Match Search', 'Burglary Forensics'],
  'CCTV': ['Commercial Burglary', 'Shoplifting', 'Public Nuisance', 'Street Assault', 'Surveillance Footage'],
  'Documents': ['Forgery', 'Fraud', 'Identity Theft', 'Document Counterfeiting', 'Financial Crime'],
  'Audio': ['Wiretap Recording', 'Emergency Call', 'Witness Voice Recording'],
  'Video': ['Traffic Surveillance', 'Dashcam Recording', 'Police Bodycam'],
};

const LOCATIONS = [
  'MG Road Crossing, Bengaluru',
  'KSRTC Main Bus Stand, Mysuru',
  'Hampankatta Market, Mangaluru',
  'CBT Square, Hubballi',
  'Club Road Junction, Belagavi',
  'Station Road, Kalaburagi',
  'Town Hall Complex, Tumakuru',
  'Kapooth Court Precinct, Udupi',
];

function getMimeType(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  switch (ext) {
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.png': return 'image/png';
    case '.webp': return 'image/webp';
    case '.bmp': return 'image/bmp';
    case '.mp4': return 'video/mp4';
    case '.avi': return 'video/x-msvideo';
    case '.mov': return 'video/quicktime';
    case '.mp3': return 'audio/mpeg';
    case '.wav': return 'audio/wav';
    case '.pdf': return 'application/pdf';
    case '.docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case '.txt': return 'text/plain';
    default: return 'application/octet-stream';
  }
}

function getCategoryAndFolder(fileName: string): { category: string; folder: string; evidenceType: string } {
  const lower = fileName.toLowerCase();
  const baseName = path.basename(fileName, path.extname(fileName)).toUpperCase();
  const ext = path.extname(fileName).toLowerCase();

  if (['.mp4', '.avi', '.mov'].includes(ext)) {
    return { category: 'Video', folder: 'video', evidenceType: 'Video' };
  }
  if (['.mp3', '.wav'].includes(ext)) {
    return { category: 'Audio', folder: 'audio', evidenceType: 'Audio' };
  }
  if (['.pdf', '.docx', '.txt'].includes(ext)) {
    return { category: 'Documents', folder: 'documents', evidenceType: 'Document' };
  }

  if (lower.includes('weapon') || lower.includes('gun') || lower.includes('knife') || baseName.startsWith('E')) {
    return { category: 'Weapons', folder: 'weapons', evidenceType: 'Image' };
  }
  if (lower.includes('vehicle') || lower.includes('car') || lower.includes('auto') || baseName.startsWith('C')) {
    return { category: 'Vehicles', folder: 'vehicles', evidenceType: 'Image' };
  }
  if (lower.includes('fingerprint') || lower.includes('print') || lower.includes('latent') || baseName.startsWith('F')) {
    return { category: 'Fingerprints', folder: 'fingerprints', evidenceType: 'Image' };
  }
  if (lower.includes('cctv') || lower.includes('cam') || lower.includes('surveillance') || lower.includes('still') || baseName.startsWith('B')) {
    return { category: 'CCTV', folder: 'cctv', evidenceType: 'Image' };
  }
  if (lower.includes('doc') || lower.includes('fir') || lower.includes('scan') || lower.includes('statement') || baseName.startsWith('D')) {
    return { category: 'Documents', folder: 'documents', evidenceType: 'Document' };
  }

  return { category: 'Crime Scene', folder: 'crime-scenes', evidenceType: 'Image' };
}

function generateTitle(fileName: string, category: string): string {
  const cleanName = path.basename(fileName, path.extname(fileName)).replace(/[-_]/g, ' ');
  return `${category} Evidence - ${cleanName}`;
}

async function main() {
  console.log('=========================================================');
  console.log('  KSP Evidence Explorer — Kaggle Dataset Automated Import');
  console.log('=========================================================\n');

  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketNames = (buckets || []).map(b => b.name);
    if (!bucketNames.includes(BUCKET_NAME)) {
      console.log(`[STORAGE] Creating bucket "${BUCKET_NAME}"...`);
      await supabase.storage.createBucket(BUCKET_NAME, { public: true });
      console.log(`[STORAGE] Bucket "${BUCKET_NAME}" created successfully.`);
    } else {
      console.log(`[STORAGE] Bucket "${BUCKET_NAME}" exists.`);
    }
  } catch (err: any) {
    console.warn(`[STORAGE WARNING] Bucket check: ${err.message}`);
  }

  const customPath = process.argv[2];
  const candidatePaths = [
    customPath,
    path.resolve(process.cwd(), 'dataset'),
    path.resolve(process.cwd(), '../dataset'),
    'C:\\Users\\yuvar\\Downloads\\crim\\UCF Image Dataset\\UCF Image Dataset',
  ].filter(Boolean) as string[];

  let datasetDir = '';
  for (const p of candidatePaths) {
    if (fs.existsSync(p) && fs.statSync(p).isDirectory()) {
      datasetDir = p;
      break;
    }
  }

  if (!datasetDir) {
    console.error('❌ ERROR: Could not locate dataset folder!');
    console.error('Please specify the path: npx tsx scripts/import-evidence.ts <path_to_dataset_folder>');
    process.exit(1);
  }

  console.log(`📁 Source Dataset Folder: ${datasetDir}\n`);

  const supportedExts = ['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.mp4', '.avi', '.mov', '.mp3', '.wav', '.pdf', '.docx', '.txt'];
  const allFiles = fs.readdirSync(datasetDir).filter(file => {
    const ext = path.extname(file).toLowerCase();
    return supportedExts.includes(ext) && fs.statSync(path.join(datasetDir, file)).isFile();
  });

  console.log(`🔍 Found ${allFiles.length} evidence files to process.\n`);

  if (allFiles.length === 0) {
    console.log('No supported media files found in dataset folder.');
    return;
  }

  const { data: existingRecords } = await supabase.from('evidence').select('file_name, storage_path');
  const existingFileNames = new Set((existingRecords || []).map(r => r.file_name));
  const existingStoragePaths = new Set((existingRecords || []).map(r => r.storage_path));

  let importedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  for (let i = 0; i < allFiles.length; i++) {
    const fileName = allFiles[i];
    const filePath = path.join(datasetDir, fileName);
    const indexStr = `[${i + 1}/${allFiles.length}]`;

    if (existingFileNames.has(fileName)) {
      console.log(`${indexStr} ⏭️  Skipped duplicate file: "${fileName}"`);
      skippedCount++;
      continue;
    }

    try {
      const fileBuffer = fs.readFileSync(filePath);
      const stats = fs.statSync(filePath);
      const mimeType = getMimeType(fileName);
      const { category, folder, evidenceType } = getCategoryAndFolder(fileName);
      const storagePath = `${folder}/${fileName}`;

      if (existingStoragePaths.has(storagePath)) {
        console.log(`${indexStr} ⏭️  Skipped duplicate storage path: "${storagePath}"`);
        skippedCount++;
        continue;
      }

      process.stdout.write(`${indexStr} 📤 Uploading "${fileName}" to bucket "${BUCKET_NAME}/${folder}"... `);
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(storagePath, fileBuffer, {
          contentType: mimeType,
          upsert: true,
        });

      if (uploadError) {
        console.log(`❌ FAIL: ${uploadError.message}`);
        failedCount++;
        continue;
      }

      const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(storagePath);
      const publicUrl = urlData.publicUrl;

      const officer = POLICE_OFFICERS[i % POLICE_OFFICERS.length];
      const district = DISTRICTS[i % DISTRICTS.length];
      const possibleCrimes = CRIME_TYPES[category] || CRIME_TYPES['Crime Scene'];
      const crimeType = possibleCrimes[i % possibleCrimes.length];
      const location = LOCATIONS[i % LOCATIONS.length];
      const title = generateTitle(fileName, category);
      const firNo = `FIR-2024-${1000 + i}`;
      const lat = 12.91 + (i % 20) * 0.01;
      const lng = 77.52 + (i % 20) * 0.01;

      const tags = [
        category.toLowerCase().replace(/\s+/g, '-'),
        evidenceType.toLowerCase(),
        district.toLowerCase().replace(/\s+/g, '-'),
        'kaggle-import',
      ];

      const fullMetadata = {
        title,
        description: `${category} evidence item imported from Kaggle forensic dataset. Verified for case ${firNo}.`,
        category,
        crime_type: crimeType,
        district,
        location,
        linked_fir: firNo,
        officer,
        evidence_type: evidenceType,
        file_name: fileName,
        storage_path: storagePath,
        public_url: publicUrl,
        thumbnail_url: publicUrl,
        file_size: stats.size,
        mime_type: mimeType,
        captured_date: stats.mtime.toISOString(),
        uploaded_at: new Date().toISOString(),
        uploaded_by: 1,
        tags,
        status: 'Secured',
        notes: `Imported automatically by import-evidence script. File hash/size: ${stats.size} bytes.`,
        latitude: lat,
        longitude: lng,
      };

      let insertSuccess = false;
      const { error: insertErr } = await supabase.from('evidence').insert(fullMetadata);

      if (!insertErr) {
        insertSuccess = true;
      } else {
        const fallbackRecord = {
          file_name: fileName,
          file_size: stats.size,
          mime_type: mimeType,
          storage_path: storagePath,
          public_url: publicUrl,
          uploaded_by: 1,
          description: fullMetadata.description,
          tags,
          ai_analysis: JSON.stringify(fullMetadata),
          is_sample: false,
        };

        const { error: fallbackErr } = await supabase.from('evidence').insert(fallbackRecord);
        if (!fallbackErr) {
          insertSuccess = true;
        } else {
          console.log(`❌ DB INSERT FAIL: ${fallbackErr.message}`);
          failedCount++;
          continue;
        }
      }

      if (insertSuccess) {
        console.log(`✅ SUCCESS`);
        importedCount++;
        existingFileNames.add(fileName);
        existingStoragePaths.add(storagePath);
      }
    } catch (err: any) {
      console.log(`❌ FAIL: ${err.message || err}`);
      failedCount++;
    }
  }

  console.log('\n=========================================================');
  console.log('  IMPORT PROCESS COMPLETED - SUMMARY REPORT');
  console.log('=========================================================');
  console.log(`  • Storage Bucket Created/Used : ${BUCKET_NAME}`);
  console.log(`  • Database Table Used        : evidence`);
  console.log(`  • Dataset Directory          : ${datasetDir}`);
  console.log(`  • Total Files Found          : ${allFiles.length}`);
  console.log(`  • Number of Imported Images  : ${importedCount}`);
  console.log(`  • Number of Skipped (Dupes)  : ${skippedCount}`);
  console.log(`  • Number of Failed Uploads   : ${failedCount}`);
  console.log('=========================================================\n');
}

main().catch(err => {
  console.error('Fatal script error:', err);
  process.exit(1);
});
