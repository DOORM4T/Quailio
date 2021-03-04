import { v4 as uuid } from "uuid"
import { storage, THUMBNAILS_PATH } from "./services"

/**
 * Upload a thumbnail to Firebase storage under a network
 * @param networkId
 * @param thumbnailFile File
 * @returns url to the uploaded thumbnail
 * @throws error if upload fails
 */

export async function uploadThumbnail(
  networkId: string,
  thumbnailFile: File,
): Promise<string | null> {
  try {
    /* Generate path */
    const path = generateThumbnailPath(networkId)

    /* Upload the file to Firebase Storage */
    const ref = storage.ref(path)
    await ref.put(thumbnailFile)

    /* Get the resulting URL */
    const url = await ref.getDownloadURL()
    return url
  } catch (error) {
    /* Failed to upload the thumbnail */
    throw error
  }
}
/**
 * Delete all thumbnails uploaded to a network
 * @param networkId
 * @throws error if deletion fails
 */

export async function deleteNetworkThumbnails(networkId: string) {
  try {
    /* Get the reference path to the thumbnail */
    const path = `${THUMBNAILS_PATH}/${networkId}/`

    /* No Firebase Storage API to delete entire folders? */
    /* Delete the each thumbnail in the folder from Firebase Storage. Firebase storage should automatically remove empty folders. */
    const list = await storage.ref(path).list()
    const deleteItems = list.items.map((item) => item.delete())
    await Promise.all(deleteItems)
  } catch (error) {
    /* Failed to delete the network thumbnails */
    throw error
  }
}
/**
 * Delete a thumbnail from Firebase storage under a network
 * @param networkId
 * @param thumbnailId
 * @throws error if deletion fails
 */
export async function deleteThumbnail(path: string) {
  try {
    /* Delete the file from Firebase Storage */
    const ref = storage.ref(path)
    await ref.delete()
  } catch (error) {
    /* Failed to delete the thumbnail */
    throw error
  }
}

/**
 * Generate a thumbnail storage path under a network's ID
 */

export function generateThumbnailPath(networkId: string) {
  const thumbnailId = uuid()
  const path = `${THUMBNAILS_PATH}/${networkId}/${thumbnailId}`
  return path
}
/**
 * Get the list of all thumbnail urls uploaded to a network
 * @param networkId
 * @returns array of thumbnail details (index 0: full paths in the storage bucket, index 1: full url)
 */

export async function getNetworkThumbnails(networkId: string) {
  try {
    const path = `${THUMBNAILS_PATH}/${networkId}`

    const thumbnails = await storage.ref(path).list()
    const getUrls = thumbnails.items.map((item) => item.getDownloadURL())
    const urls = await Promise.all(getUrls)

    const results: IThumbnailDetails[] = thumbnails.items.map((item, index) => {
      return { path: item.fullPath, url: urls[index] }
    })
    return results
  } catch (error) {
    console.error(error)
    return []
  }
}
export interface IThumbnailDetails {
  path: string
  url: string
}
