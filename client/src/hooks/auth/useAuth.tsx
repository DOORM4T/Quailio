import { useSelector } from "react-redux"
import { getIsAuthenticated } from "../../store/selectors/auth/getIsAuthenticated"

/* get user authentication state */
function useAuth(): { isAuthenticated: boolean | undefined } {
  /* true, false, or undefined. Undefined indicates the state has not loaded yet.  */
  const isAuthenticated = useSelector(getIsAuthenticated)

  return { isAuthenticated }
}

export default useAuth
