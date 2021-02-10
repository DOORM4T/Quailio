import { ICurrentNetwork } from "../../networks/networkTypes"
import { IApplicationState } from "../../store"

export const getCurrentNetwork = (
  state: IApplicationState,
): ICurrentNetwork | null => state.networks.currentNetwork
