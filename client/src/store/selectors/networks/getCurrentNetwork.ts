import { createSelector } from "reselect"
import { ICurrentNetwork } from "../../networks/networkTypes"
import { IApplicationState } from "../../store"

export const getCurrentNetwork = (
  state: IApplicationState,
): ICurrentNetwork | null => state.networks.currentNetwork

/* Derived selectors */
const selectors = [getCurrentNetwork]

export const getCurrentNetworkId = createSelector(
  selectors,
  (network) => network?.id || null,
)

export const getCurrentNetworkPeople = createSelector(
  selectors,
  (network) => network?.people || [],
)
