import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBUIdng7K8A917v_ZaClDVTXd1sgPTwqMg",
  authDomain: "tourify-final.firebaseapp.com",
  projectId: "tourify-final",
  storageBucket: "tourify-final.firebasestorage.app",
  messagingSenderId: "282684182135",
  appId: "1:282684182135:web:857a5a8c8c9627af6d4072",
  measurementId: "G-BRZBZT5ECE"
};

const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});
const firestore = getFirestore(app);
const storage = getStorage(app);

export { auth, firestore, storage };
