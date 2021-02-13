import {
  Accordion,
  AccordionPanel,
  Box,
  Button,
  CheckBoxGroup,
  Heading,
  List,
  Text,
  TextInput,
} from "grommet"
import React from "react"
import { useDispatch } from "react-redux"
import { useHistory } from "react-router-dom"
import { ActionCreator, AnyAction } from "redux"
import { deleteAccount } from "../store/auth/authActions"
import { resetLocalNetworks } from "../store/networks/actions/resetLocalNetworks"

const SettingsPage: React.FC = () => {
  const dispatch: ActionCreator<AnyAction> = useDispatch()
  const history = useHistory()

  const handleDeleteAccount = async () => {
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
      <Box
        align="center"
        justify="start"
        direction="column"
        fill="horizontal"
        pad="xlarge"
      >
        <Box align="center" justify="center">
          <Heading level={2}>General Settings</Heading>
          <Accordion width="large" multiple={false}>
            <AccordionPanel label="My Information">
              <Box
                align="center"
                justify="start"
                direction="row"
                gap="xsmall"
                pad="xsmall"
                fill={false}
              >
                <Text>Email:</Text>
                <TextInput size="small" defaultValue="user's email" />
              </Box>
              <Box
                align="stretch"
                justify="start"
                direction="column"
                gap="xsmall"
                pad="xsmall"
                fill={false}
              >
                <Text>
                  My Token Information (Check to show in family trees)
                </Text>
                <CheckBoxGroup
                  options={[
                    { label: "Name: User's Name" },
                    { label: "Birthday: User's Birthday" },
                    { label: "Hometown: User's Hometown" },
                  ]}
                />
              </Box>
            </AccordionPanel>
            <AccordionPanel label="Manage My Account" id="manage-accordion">
              <Text size="xlarge">My Trees</Text>
              <List
                data={[
                  { name: "Eric", count: 5 },
                  { name: "Shimi", count: 7 },
                ]}
              />
              <Text size="xlarge" margin={{ top: "medium" }}>
                Delete Account
              </Text>
              <Text size="medium" margin={{ top: "xsmall" }}>
                Enter your email address then press the Delete button to
                confirm. Deleting your account will not delete trees for active
                collaborators.
              </Text>
              <TextInput />
              <Box pad="large">
                <Button
                  label="Delete Account"
                  onClick={handleDeleteAccount}
                  id="delete-account-button"
                />
              </Box>
            </AccordionPanel>
            <Box align="center" justify="center" pad="medium" />
            <Button label="Log out" />
          </Accordion>
        </Box>
      </Box>
    </React.Fragment>
  )
}

export default SettingsPage
