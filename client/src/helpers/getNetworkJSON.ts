import { IPerson } from "../store/networks/networkTypes"
import { store } from "../store/store"

//
// Export network as JSON
//
/* The Current Network without the personIds array */
export interface INetworkJSON {
  id: string
  name: string
  people: IPerson[]
}

export async function getCurrentNetworkJSON(): Promise<INetworkJSON | null> {
  const currentNetwork = store.getState().networks.currentNetwork
  if (!currentNetwork) return null

  const { id, name, people } = currentNetwork

  const asNetworkJSON: INetworkJSON = {
    id,
    name,
    people,
  }

  return asNetworkJSON
}
