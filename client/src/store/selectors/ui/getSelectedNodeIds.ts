import { IApplicationState } from "../../store"

export const getSelectedNodeIds = (state: IApplicationState) =>
  state.ui.selectedNodeIds
