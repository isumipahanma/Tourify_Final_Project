// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBUIdng7K8A917v_ZaClDVTXd1sgPTwqMg",
  authDomain: "tourify-final.firebaseapp.com",
  projectId: "tourify-final",
  storageBucket: "tourify-final.appspot.com", // make sure .appspot.com
  messagingSenderId: "282684182135",
  appId: "1:282684182135:web:857a5a8c8c9627af6d4072",
  measurementId: "G-BRZBZT5ECE"
};

// ✅ Initialize Firebase app once
const app = initializeApp(firebaseConfig);

// ✅ Export initialized services
const auth = getAuth(app);
const firestore = getFirestore(app);
const storage = getStorage(app);

export { auth, firestore, storage };
