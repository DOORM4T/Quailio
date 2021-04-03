import { IApplicationState } from "../../store"

export const getIsPersonOverlayOpen = (state: IApplicationState): boolean =>
  state.ui.isPersonEditMenuOpen
