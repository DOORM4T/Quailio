import { IApplicationState } from "../../store"

export const getIsAuthenticated = (
  state: IApplicationState,
): boolean | undefined =>
  state.auth.userId === undefined ? undefined : Boolean(state.auth.userId)
