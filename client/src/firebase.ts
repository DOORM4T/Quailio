import firebase from "firebase"
import "firebase/auth"
import "firebase/firestore"
import { firebaseConfig } from "./.firebaseConfig"

// ==- INITIALIZATION -== //
const app = firebase.initializeApp(firebaseConfig)

// ==- FIRESTORE (DATABASE) SETUP -== //
export const db = firebase.firestore()

// ==- AUTHENTICATION SETUP -== //
export const auth = app.auth()
