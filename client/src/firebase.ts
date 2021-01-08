import firebase from "firebase"
import "firebase/auth"
import "firebase/firestore"

// ==- INITIALIZATION -== //
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
}

const app = firebase.initializeApp(firebaseConfig)

// ==- FIRESTORE (DATABASE) SETUP -== //
export const db = firebase.firestore()

// ==- AUTHENTICATION SETUP -== //
export const auth = app.auth()
