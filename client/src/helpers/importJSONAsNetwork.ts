import { importNetwork } from "../store/networks/actions"
import { store } from "../store/store"

export async function importJSONAsNetwork(files: FileList | null) {
  try {
    if (!files) throw new Error("No files were imported.")

    const fileVals = Object.values(files)
    const getParsedJSON = fileVals.map(async (file) => {
      let result
      try {
        result = JSON.parse(await file.text())
      } catch {
        window.alert(
          `Failed to import [${file.name}]. Is it a valid Quailio JSON file?`,
        )
      }

      return result
    })

    const data = await Promise.all(getParsedJSON)

    // Import the JSON to global state
    const dispatchImportFunctions = data.map(async (parsedJSON) => {
      return await store.dispatch<any>(importNetwork(parsedJSON))
    })

    await Promise.all(dispatchImportFunctions)
  } catch (error) {
    console.error(error)
  }
}
