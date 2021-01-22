import firebase from "firebase"
import "firebase/auth"
import "firebase/firestore"
import "firebase/storage"
import { v4 as uuid } from "uuid"
import { firebaseConfig } from "./.firebaseConfig"

// ==- INITIALIZATION -== //
const app = firebase.initializeApp(firebaseConfig)

// ==- FIRESTORE (DATABASE) -== //
const db = firebase.firestore()

/* Collection Types */
enum firebaseCollections {
  USERS = "users",
  NETWORKS = "networks",
  PEOPLE = "people",
}

export const usersCollection = db.collection(firebaseCollections.USERS)
export const networksCollection = db.collection(firebaseCollections.NETWORKS)
export const peopleCollection = db.collection(firebaseCollections.PEOPLE)

/* Document Type Definitions */
export interface IFirebaseUser {
  id: string
  email: string
  networkIds: string[] // IDs of networks belonging to the user
}

// ==- AUTHENTICATION -== //
export const auth = app.auth()

// ==- STORAGE -== //
const THUMBNAILS_PATH = "thumbnails"
const storage = app.storage()

/**
 * Upload a thumbnail to Firebase storage
 * @param thumbnail File or external link to the thumbnail
 */
export async function uploadThumbnail(thumbnail: File | string) {
  const path = generateThumbnailPath()
  if (!path) return

  const ref = storage.ref(path)

  if (typeof thumbnail === "string") {
    const result = await ref.putString(thumbnail)
    console.log(result)
    console.log("Saved link.")
  } else {
    const result = await ref.put(thumbnail)
    console.log(result)
    console.log("Uploaded link.")
  }

  const url = await ref.getDownloadURL()
  // TODO: return result
  console.log(url)
}

/**
 * Generate a thumbnail storage path based on the current logged in user's id
 */
export function generateThumbnailPath(): string | null {
  if (!auth.currentUser) {
    console.error("You must be logged in to upload thumbnails.")
    return null
  }

  const userId = auth.currentUser.uid
  const thumbnailId = uuid()
  const path = `${THUMBNAILS_PATH}/${userId}/${thumbnailId}`
  return path
}

/* get the list of all thumbnail urls uploadaed by the current user  */
// TODO: return results
export async function getCurrentUserThumbnails() {
  if (!auth.currentUser) {
    console.error("You must be logged in to view uploaded thumbnails.")
    return
  }

  const userId = auth.currentUser.uid
  const path = `${THUMBNAILS_PATH}/${userId}`
  const thumbnails = await storage.ref(path).list()
  const urls = thumbnails.items.map((item) => item.getDownloadURL())
  const results = await Promise.all(urls)
  console.log(results)
}
