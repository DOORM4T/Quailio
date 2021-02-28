import React from "react"
import { useDispatch, useSelector } from "react-redux"
import { Dispatch } from "redux"
import { setAuthLoading } from "../../store/auth/authActions"
import { getIsAuthenticated } from "../../store/selectors/auth/getIsAuthenticated"

/* Get user authentication status */
function useAuth(): { isAuthenticated: boolean } {
  const dispatch: Dispatch<any> = useDispatch()

  /* true, false, or undefined. Undefined indicates the state has not loaded yet.  */
  const authState = useSelector(getIsAuthenticated)

  /* Auth state that this hook will return  */
  const [isAuthenticated, setAuthenticated] = React.useState<boolean>(false)

  React.useEffect(() => {
    if (isAuthenticated === undefined) {
      //  Auth state is loading
      dispatch(setAuthLoading(true))
      setAuthenticated(false)
    } else {
      // Done getting auth state
      dispatch(setAuthLoading(false))
      setAuthenticated(Boolean(authState))
    }
  }, [authState])

  return { isAuthenticated }
}

export default useAuth
