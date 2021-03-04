import React, { Dispatch } from "react"
import { useDispatch } from "react-redux"
import { AnyAction } from "redux"
import { auth } from "../../firebase/services"
import { setUser } from "../../store/auth/authActions"

/* Set user credentials in global state */
function useAuthChange() {
  const dispatch: Dispatch<AnyAction> = useDispatch()

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
  }, [])
}

export default useAuthChange
