import { IApplicationState } from "../../store"
import { IPersonWithContent } from "../../ui/uiTypes"

export const getPersonInFocus = (
  state: IApplicationState,
): IPersonWithContent | null => state.ui.personInFocus
