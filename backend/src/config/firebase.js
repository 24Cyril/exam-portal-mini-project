import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Firebase Admin SDK
// Ideally, the user should provide a service account JSON file.
// I'll create a placeholder check.
try {
  let serviceAccount;
  const saKeyPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || join(__dirname, '../../serviceAccountKey.json');
  
  if (saKeyPath) {
    serviceAccount = JSON.parse(readFileSync(saKeyPath, 'utf8'));
  }

  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('Firebase Admin SDK initialized successfully');
  } else {
    // Falls back to Google Application Default Credentials if running on GCP
    admin.initializeApp();
    console.log('Firebase Admin SDK initialized with default credentials');
  }
} catch (error) {
  console.log('Firebase Admin SDK initialization skipped or failed:', error.message);
  console.log('Falling back to local simulation mode if needed.');
}

export const db = admin.firestore();
export const auth = admin.auth();
export default admin;
