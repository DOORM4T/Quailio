import { IApplicationState } from "../../store"

export const getFilterGroups = (state: IApplicationState) =>
  state.ui.filteredGroups
