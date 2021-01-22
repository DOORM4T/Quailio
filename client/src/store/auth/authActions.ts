import { ActionCreator, AnyAction, Dispatch } from "redux"
import { ThunkAction } from "redux-thunk"
import {
  auth,
  IFirebaseUser,
  networksCollection,
  peopleCollection,
  usersCollection,
} from "../../firebase"
import { resetLocalNetworks } from "../networks/networksActions"
import { INetwork } from "../networks/networkTypes"
import {
  AuthActionTypes,
  IAuthCreateAccountAction,
  IAuthDeleteAccountAction,
  IAuthLoading,
  IAuthLoginAction,
  IAuthLogoutAction,
  IAuthSetUserAction,
  IAuthState,
} from "./authTypes"

// -== ACTION CREATORS ==- //
/* Set isLoading state. Used by asynchronous auth action. */
const setAuthLoading: ActionCreator<IAuthLoading> = (isLoading: boolean) => ({
  type: AuthActionTypes.LOADING,
  isLoading,
})

/**
 * Create a new user account in the authentication system and users collection
 * @param email
 * @param password
 */
export const createAccount: ActionCreator<
  ThunkAction<Promise<AnyAction>, IAuthState, null, IAuthCreateAccountAction>
> = (email: string, password: string) => {
  return async (dispatch: Dispatch) => {
    dispatch(setAuthLoading(true))

    try {
      const credentials = await auth.createUserWithEmailAndPassword(
        email,
        password,
      )

      if (!credentials.user) throw new Error("Failed to get credentials.")

      const id = credentials.user.uid
      if (!id) throw new Error("Failed to get the new user's id.")

      /* Initialize the user's "users" collection document */
      const userDocument: IFirebaseUser = {
        id: credentials.user.uid,
        email,
        networkIds: [],
      }

      /* Save the user document */
      await usersCollection.doc(credentials.user.uid).set(userDocument)

      return dispatch({
        type: AuthActionTypes.CREATE_ACCOUNT,
        id,
      })
    } catch (error) {
      dispatch(setAuthLoading(false))
      throw error
    }
  }
}

/**
 * Log in an existing user
 * @param email
 * @param password
 */
export const login: ActionCreator<
  ThunkAction<Promise<AnyAction>, IAuthState, null, IAuthLoginAction>
> = (email: string, password: string) => {
  return async (dispatch: Dispatch) => {
    dispatch(setAuthLoading(true))

    try {
      const credentials = await auth.signInWithEmailAndPassword(email, password)
      if (!credentials.user) throw new Error("Failed to get credentials.")

      const id = credentials.user.uid
      if (!id) throw new Error("Failed to get the user's id.")

      return dispatch({
        type: AuthActionTypes.LOGIN,
        id,
      })
    } catch (error) {
      dispatch(setAuthLoading(false))
      throw error
    }
  }
}

/**
 * Sign out the currently authenticated user
 */
export const logout: ActionCreator<
  ThunkAction<Promise<AnyAction>, IAuthState, null, IAuthLogoutAction>
> = () => {
  return async (dispatch: Dispatch) => {
    dispatch(setAuthLoading(true))

    try {
      await auth.signOut()
      dispatch(resetLocalNetworks())
    } catch (error) {
      dispatch(setAuthLoading(false))
      throw error
    }

    return dispatch({
      type: AuthActionTypes.LOGOUT,
    })
  }
}

/**
 * Delete the currently authenticated user account, along with their related network documents
 */
export const deleteAccount: ActionCreator<
  ThunkAction<Promise<AnyAction>, IAuthState, null, IAuthDeleteAccountAction>
> = () => {
  return async (dispatch: Dispatch) => {
    dispatch(setAuthLoading(true))

    try {
      if (!auth.currentUser) throw new Error("No user is currently logged in.")
      const userId = auth.currentUser.uid

      /* Delete the current user from Firebase Auth */
      await auth.currentUser.delete()

      /* Access the user's Firebase document */
      const userDoc = usersCollection.doc(userId)
      const userData: IFirebaseUser = (
        await userDoc.get()
      ).data() as IFirebaseUser

      /* Delete all network documents created by the user */
      userData.networkIds.forEach(async (networkId) => {
        const networkDoc = networksCollection.doc(networkId)
        const networkData = (await networkDoc.get()).data() as INetwork

        /* delete all person documents belonging to the network */
        networkData.personIds.forEach(
          async (personId) => await peopleCollection.doc(personId).delete(),
        )

        /* delete this network document */
        await networkDoc.delete()
      })

      /* Delete the user document */
      await userDoc.delete()

      /* Update state */
      return dispatch({
        type: AuthActionTypes.DELETE_ACCOUNT,
      })
    } catch (error) {
      /* Failed to delete the user */
      dispatch(setAuthLoading(false))
      throw error
    }
  }
}

/**
 * Set the current logged in user
 * @param userId ID of the currently authenticated user
 */
export const setUser: ActionCreator<IAuthSetUserAction> = (userId: string) => ({
  type: AuthActionTypes.SET_USER,
  userId,
})
