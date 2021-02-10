import { IApplicationState } from "../../store"

export const getIsOverlayOpen = (state: IApplicationState): boolean =>
  state.ui.isPersonEditMenuOpen
