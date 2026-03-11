import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Replace these values with your Firebase Project Configuration from the Firebase Console
// (Project Settings -> General -> Your apps -> Web App)
const firebaseConfig = {
  apiKey: "AIzaSyDVMKxf6KoLbm3-bJRUhOUug8NR0t05JBk",
  authDomain: "mini-project-aeed5.firebaseapp.com",
 projectId: "mini-project-aeed5",
  storageBucket: "mini-project-aeed5.firebasestorage.app",
  messagingSenderId: "29997608561",
  appId: "1:29997608561:web:5037cd5679f6b9aaf4f5d0",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
