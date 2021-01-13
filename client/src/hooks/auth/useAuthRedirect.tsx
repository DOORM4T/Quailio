import React from "react"
import { useSelector } from "react-redux"
import { useHistory } from "react-router-dom"
import { IApplicationState, store } from "../../store/store"

/* Redirect the user to another page if they are or aren't authenticated */
function useAuthRedirect({ whenAuth = true, destination = "/" }: IParams) {
  const history = useHistory()
  const isAuthenticated = useSelector<IApplicationState, boolean>((state) =>
    Boolean(state.auth.userId),
  )

  /* when auth state changes.. */
  React.useEffect(() => {
    /* redirect when the auth state matches the required auth state */
    if (isAuthenticated === whenAuth) history.push(destination)
  }, [isAuthenticated])

  return { didRedirect: isAuthenticated }
}

export default useAuthRedirect

interface IParams {
  whenAuth?: boolean
  destination?: string
}
