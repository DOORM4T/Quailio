import { createSelector } from "reselect"
import { IApplicationState } from "../store"

/* Individual selectors */
export const getAuthLoading = (state: IApplicationState): boolean =>
  state.auth.isLoading
export const getNetworkLoading = (state: IApplicationState): boolean =>
  state.networks.isLoading
export const getUILoading = (state: IApplicationState): boolean =>
  state.ui.isLoading
const selectors = [getAuthLoading, getNetworkLoading, getUILoading]

/* Whether any single state is loading or not */
const transformation = (
  isAuthLoading: boolean,
  isNetworkLoading: boolean,
  isUILoading: boolean,
) => isAuthLoading || isNetworkLoading || isUILoading

const getIsLoading = createSelector(selectors, transformation)

export default getIsLoading
