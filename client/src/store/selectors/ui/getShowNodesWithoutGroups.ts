import { IApplicationState } from "../../store"

export const getShowNodesWithoutGroups = (state: IApplicationState) =>
  state.ui.doShowNodesWithoutGroups
