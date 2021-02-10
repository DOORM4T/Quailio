import { IApplicationState } from "../../store"
import { IPersonInFocus } from "../../ui/uiTypes"

export const getPersonInFocus = (
  state: IApplicationState,
): IPersonInFocus | null => state.ui.personInFocus
