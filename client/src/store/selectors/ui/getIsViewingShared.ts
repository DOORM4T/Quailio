import { IApplicationState } from "../../store"

export const getIsViewingShared = (state: IApplicationState) =>
  state.ui.isViewingShared
