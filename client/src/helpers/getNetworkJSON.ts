import { IPerson, IRelationshipGroups } from "../store/networks/networkTypes"
import { store } from "../store/store"

//
// Export network as JSON
//
/* The Current Network without the personIds array */
export interface INetworkJSON {
  id: string
  name: string
  people: IPerson[]
  relationshipGroups: IRelationshipGroups
}

export async function getCurrentNetworkJSON(): Promise<INetworkJSON | null> {
  const currentNetwork = store.getState().networks.currentNetwork
  if (!currentNetwork) return null

  const { id, name, people, relationshipGroups } = currentNetwork

  const asNetworkJSON: INetworkJSON = {
    id,
    name,
    people,
    relationshipGroups,
  }

  return asNetworkJSON
}
