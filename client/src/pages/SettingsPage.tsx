import {
  Accordion,
  AccordionPanel,
  Box,
  Button,
  Heading,
  Text,
  TextInput,
} from "grommet"
import * as Icons from "grommet-icons"
import React, { FormEvent } from "react"
import { Helmet } from "react-helmet"
import { useDispatch } from "react-redux"
import { useHistory } from "react-router-dom"
import { ActionCreator, AnyAction } from "redux"
import { auth } from "../firebase/services"
import { handlePasswordReset } from "../helpers/handlePasswordReset"
import useAuth from "../hooks/auth/useAuth"
import { deleteAccount } from "../store/auth/authActions"
import { resetLocalNetworks } from "../store/networks/actions"

const SettingsPage: React.FC = () => {
  const dispatch: ActionCreator<AnyAction> = useDispatch()
  const history = useHistory()

  const isAuthenticated = useAuth()

  // This page shouldn't render if the user isn't authenticated
  if (!isAuthenticated) return null

  const handleDeleteAccount = async (e: FormEvent) => {
    e.preventDefault()

    const email = (e.currentTarget as HTMLFormElement)["email"].value

    // Stop if the email is invalid
    if (email !== auth.currentUser?.email) {
      window.alert("Invalid email")
      return
    }

    const doDelete = window.confirm(
      "Are you sure you want to delete your account? This action cannot be reversed.",
    )

    if (!doDelete) return

    try {
      await dispatch(deleteAccount())
      dispatch(resetLocalNetworks())
      history.push("/")
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <React.Fragment>
      <Helmet>
        <title>Settings</title>
      </Helmet>
      <Box
        align="center"
        justify="start"
        direction="column"
        fill="horizontal"
        pad="xlarge"
      >
        <Box align="center" justify="center">
          <Heading level={2}>General Settings</Heading>
          <Box pad="large">
            <Accordion width="large">
              <AccordionPanel
                label={
                  <Heading level={3}>
                    <Icons.Lock />
                    <span style={{ marginLeft: "1rem" }}>Reset Password</span>
                  </Heading>
                }
              >
                <Box pad={{ bottom: "large", horizontal: "large" }}>
                  <Box style={{ textAlign: "right" }}>
                    <Button
                      onClick={handlePasswordReset}
                      type="submit"
                      label={
                        <Text style={{ fontWeight: "bold" }}>
                          Reset Password
                        </Text>
                      }
                      id="change-password-button"
                      margin={{ left: "auto", top: "medium" }}
                    />
                  </Box>
                </Box>
              </AccordionPanel>
              <AccordionPanel
                label={
                  <Heading level={3} color="status-critical">
                    <Icons.Alert color="status-critical" size="medium" />
                    <span style={{ marginLeft: "1rem" }}>Delete Account</span>
                  </Heading>
                }
              >
                <Box pad={{ bottom: "large", horizontal: "large" }}>
                  <Text color="status-critical">
                    Please enter your email address below to confirm.
                  </Text>
                  <form
                    onSubmit={handleDeleteAccount}
                    style={{ textAlign: "right" }}
                  >
                    <TextInput
                      name="email"
                      type="email"
                      placeholder={auth.currentUser?.email || ""}
                    />
                    <Button
                      type="submit"
                      label={
                        <Text
                          color="status-critical"
                          style={{ fontWeight: "bold" }}
                        >
                          Delete Account
                        </Text>
                      }
                      color="status-critical"
                      id="delete-account-button"
                      margin={{ left: "auto", top: "medium" }}
                    />
                  </form>
                </Box>
              </AccordionPanel>
            </Accordion>
          </Box>
        </Box>
      </Box>
    </React.Fragment>
  )
}

export default SettingsPage
