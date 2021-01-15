import { useSelector } from "react-redux"
import { IApplicationState } from "../../store/store"

/* get user authentication state */
function useAuth(): { isAuthenticated: AuthState } {
  /* true, false, or undefined. Undefined indicates the state has not loaded yet.  */
  const isAuthenticated = useSelector<IApplicationState, AuthState>((state) =>
    state.auth.userId === undefined ? undefined : Boolean(state.auth.userId),
  )

  return { isAuthenticated }
}

export default useAuth

type AuthState = boolean | undefined
