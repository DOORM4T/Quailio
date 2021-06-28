import admin from "firebase-admin"
import serviceAccount from "../../../serviceAccountKey.json"
import { Collections } from "./constants"

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
})

const db = admin.firestore()
export const networks = db.collection(Collections.NETWORKS)
export const people = db.collection(Collections.PEOPLE)
export const users = db.collection(Collections.USERS)
