import { IApplicationState } from "../../store"

export const getPersonContent = (state: IApplicationState) =>
  state.ui.personContent
