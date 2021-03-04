import firebase from "firebase"
import "firebase/auth"
import "firebase/firestore"
import "firebase/storage"
import { firebaseConfig } from "../.firebaseConfig"

// ==- INITIALIZATION -== //
const app = firebase.initializeApp(firebaseConfig)

// ==- FIRESTORE (DATABASE) -== //
export const db = firebase.firestore()

/* Collection Types */
enum firebaseCollections {
  USERS = "users",
  NETWORKS = "networks",
  PEOPLE = "people",
}

export const usersCollection = db.collection(firebaseCollections.USERS)
export const networksCollection = db.collection(firebaseCollections.NETWORKS)
export const peopleCollection = db.collection(firebaseCollections.PEOPLE)

// ==- AUTHENTICATION -== //
export const auth = app.auth()

// ==- STORAGE -== //
export const THUMBNAILS_PATH = "thumbnails" // Root file name for storing thumbnails
export const storage = app.storage()
