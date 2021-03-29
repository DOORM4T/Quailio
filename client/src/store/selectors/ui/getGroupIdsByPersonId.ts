import { IApplicationState } from "../../store"

export const getGroupIdsByPersonId = (state: IApplicationState) =>
  state.ui.activeGroupsByPersonId
