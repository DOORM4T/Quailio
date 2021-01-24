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
const THUMBNAILS_PATH = "thumbnails" // Root file name for storing thumbnails
const storage = app.storage()

/**
 * Upload a thumbnail to Firebase storage
 * @param thumbnail File
 * @returns url to the uploaded thumbnail
 * @throws error if upload fails
 */
export async function uploadThumbnail(thumbnail: File): Promise<string | null> {
  try {
    /* Generate path */
    const path = generateThumbnailPath()
    if (!path) throw new Error("Failed to generate thumbnail path.")

    /* Upload the file to Firebase Storage */
    const ref = storage.ref(path)
    await ref.put(thumbnail)

    /* Get the resulting URL */
    const url = await ref.getDownloadURL()
    return url
  } catch (error) {
    /* Failed to upload thumbnail */
    throw error
  }
}

/**
 * Generate a thumbnail storage path based on the current logged in user's ID
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

/* Get the list of all thumbnail urls uploadaed by the current user  */
export async function getCurrentUserThumbnails() {
  try {
    if (!auth.currentUser) {
      throw new Error("You must be logged in to view uploaded thumbnails.")
    }

    const userId = auth.currentUser.uid
    const path = `${THUMBNAILS_PATH}/${userId}`
    const thumbnails = await storage.ref(path).list()
    const getUrls = thumbnails.items.map((item) => item.getDownloadURL())
    const results = await Promise.all(getUrls)
    return results
  } catch (error) {
    console.error(error)
    return []
  }
}
