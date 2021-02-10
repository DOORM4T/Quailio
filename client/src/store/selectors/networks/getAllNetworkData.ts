import { INetwork } from "../../networks/networkTypes"
import { IApplicationState } from "../../store"

export const getAllNetworkData = (state: IApplicationState): INetwork[] =>
  state.networks.networks
