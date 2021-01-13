import { useSelector } from "react-redux"
import { IApplicationState } from "../../store/store"

/* get user authentication state */
function useAuth(): { isAuthenticated: boolean } {
  const isAuthenticated = useSelector<IApplicationState, boolean>((state) =>
    Boolean(state.auth.userId),
  )

  return { isAuthenticated }
}

export default useAuth
