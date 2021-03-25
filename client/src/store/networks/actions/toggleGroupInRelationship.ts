import { setNetworkLoading } from "."
import { AppThunk } from "../../store"
import { IToggleGroupAction, NetworkActionTypes } from "../networkTypes"
import { connectPeople } from "./connectPeople"
import { disconnectPeople } from "./disconnectPeople"

export const toggleGroupInRelationship = (
  groupId: string,
  p1Id: string,
  p2Id: string,
  toggleOn: boolean,
): AppThunk => {
  return async (dispatch, getState) => {
    dispatch(setNetworkLoading(true))
    try {
      const currentNetwork = getState().networks.currentNetwork
      if (!currentNetwork) throw new Error("No network is currently selected")

      // TODO: Firestore operations

      // Get each person
      const p1 = currentNetwork.people.find((p) => p.id === p1Id)
      const p2 = currentNetwork.people.find((p) => p.id === p2Id)
      if (!p1 || !p2)
        throw new Error(
          "One or both person(s) don't exist in the current network",
        )

      // Toggling to true
      if (toggleOn) {
        // Connect each person if they aren't already connected
        const areP1P2Connected = Boolean(p1.relationships[p2Id])
        if (!areP1P2Connected) {
          console.log("connecting")
          await dispatch(connectPeople(currentNetwork.id, { p1Id, p2Id }))
        }
      } else {
        // Toggling to false
        // Disconnect each person when toggling off the last group connecting each person
        const groups = p1.relationships[p2Id].groups

        const isGroupOn = groups[groupId]

        const isLastGroup = Object.keys(groups)
          .filter((gid) => gid !== groupId)
          .every((gid) => !groups[gid])
        console.log(isLastGroup)

        if (isGroupOn && isLastGroup) {
          console.log("disconnecting")

          await dispatch(disconnectPeople(currentNetwork.id, { p1Id, p2Id }))
          // tslint:disable-next-line:no-string-throw
          throw "Toggled off the last group. Disconnecting each person." // Not an error
        }
      }

      const action: IToggleGroupAction = {
        type: NetworkActionTypes.TOGGLE_GROUP_IN_RELATIONSHIP,
        groupId,
        p1Id,
        p2Id,
        toggleTo: toggleOn,
      }

      return dispatch(action)
    } catch (error) {
      dispatch(setNetworkLoading(false))
      throw error
    }
  }
}
