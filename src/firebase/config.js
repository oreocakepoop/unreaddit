import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { 
  getAuth, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile
} from 'firebase/auth';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDpStMZFm5J3825VlL58Ic7FNjwSmV2u8A",
  authDomain: "campus-confessions-1042f.firebaseapp.com",
  databaseURL: "https://campus-confessions-1042f-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "campus-confessions-1042f",
  storageBucket: "campus-confessions-1042f.firebasestorage.app",
  messagingSenderId: "399761218573",
  appId: "1:399761218573:web:b4c91544e2b2d4a0b5c7a7",
  measurementId: "G-QXWCGPP6BF"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
let analytics = null;
if (typeof window !== 'undefined') {
  isSupported().then(yes => yes && (analytics = getAnalytics(app)));
}
const provider = new GoogleAuthProvider();

export {
  auth,
  db,
  storage,
  provider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile
};

export default app;
