import { IApplicationState } from "../../store"

export const getIsShareOverlayOpen = (state: IApplicationState): boolean =>
  state.ui.isShareMenuOpen
