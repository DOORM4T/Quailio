import React from "react"
import { useDispatch } from "react-redux"
import { Dispatch } from "redux"
import { getAllNetworks } from "../../store/networks/actions/getAllNetworks"
import useAuth from "../auth/useAuth"

/* Place all network data in global state for an authenticated user upon component mount */
function useGetNetworks(): { didGetNetworks: boolean } {
  const { isAuthenticated } = useAuth()
  const dispatch: Dispatch<any> = useDispatch()
  const [didGetNetworks, setDidGetNetworks] = React.useState(false)

  React.useEffect(() => {
    const getNetworks = async () => {
      try {
        await dispatch(getAllNetworks())
        setDidGetNetworks(true)
      } catch (error) {
        setDidGetNetworks(false)
        console.error(error)
      }
    }

    if (isAuthenticated) getNetworks()
  }, [])

  return { didGetNetworks }
}

export default useGetNetworks
