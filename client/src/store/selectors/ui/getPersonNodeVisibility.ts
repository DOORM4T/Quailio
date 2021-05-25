import { IApplicationState } from "../../store"

export const getNodeVisibilityMap = (state: IApplicationState) =>
  state.ui.personNodeVisibility
