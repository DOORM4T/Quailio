import React, { Dispatch } from "react"
import { useDispatch } from "react-redux"
import { AnyAction } from "redux"
import { auth } from "../../firebase"
import { setUser } from "../../store/auth/authActions"
import useAuth from "./useAuth"

/* set user credentials in global state */
function useAuthChange() {
  const dispatch: Dispatch<AnyAction> = useDispatch()
  const { isAuthenticated } = useAuth()

  React.useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      const id = user ? user.uid : null
      try {
        await dispatch(setUser(id))
      } catch (error) {
        console.error(error)
      }
    })

    /* remove auth state listener upon unmount */
    return () => {
      unsubscribe()
    }
  }, [isAuthenticated])

  return { isAuthenticated }
}

export default useAuthChange
