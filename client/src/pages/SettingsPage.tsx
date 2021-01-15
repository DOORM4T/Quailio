import {
  Accordion,
  AccordionPanel,
  Avatar,
  Box,
  Button,
  CheckBoxGroup,
  DropButton,
  Header as GrommetHeader,
  Heading,
  List,
  RadioButtonGroup,
  Tab,
  Tabs,
  Text,
  TextInput,
} from "grommet"
import { SettingsOption, TreeOption } from "grommet-icons"
import React from "react"

const SettingsPage: React.FC = () => {
  return (
    <React.Fragment>
      <GrommetHeader
        align="center"
        direction="row"
        flex={false}
        justify="center"
        gap="medium"
        fill="horizontal"
        background={{ color: "light-2" }}
        pad="small"
      >
        <Avatar
          align="center"
          flex={false}
          justify="center"
          overflow="hidden"
          round="full"
          size="large"
          background={{ color: "accent-1" }}
        />
        <DropButton
          label="Change Tree"
          dropAlign={{ top: "bottom" }}
          open={false}
          dropContent={<Box align="center" justify="center" pad="medium" />}
        />
      </GrommetHeader>
      <Box
        align="center"
        justify="start"
        direction="column"
        fill="horizontal"
        pad="xlarge"
      >
        <Box align="center" justify="center" fill="horizontal" direction="row">
          <Tabs justify="center">
            <Tab title="Tree" icon={<TreeOption />}>
              <Box
                align="stretch"
                justify="start"
                fill="horizontal"
                direction="column"
              >
                <Heading level={2}>Tree Name 1</Heading>
                <Accordion width="large" multiple={false}>
                  <AccordionPanel label="Permissions">
                    <Text>Edit access granted to:</Text>
                    <Box
                      align="center"
                      justify="start"
                      direction="row"
                      fill={false}
                      gap="small"
                    >
                      <Text margin={{ left: "medium" }}>First1 Last1</Text>
                      <DropButton
                        label="Drop Button"
                        dropAlign={{ top: "bottom" }}
                        open={false}
                        dropContent={
                          <Box align="center" justify="center" pad="medium" />
                        }
                      />
                    </Box>
                    <Box
                      align="center"
                      justify="start"
                      direction="row"
                      fill={false}
                      gap="small"
                    >
                      <Text margin={{ left: "medium" }}>First1 Last1</Text>
                      <DropButton
                        label="Drop Button"
                        dropAlign={{ top: "bottom" }}
                        open={false}
                        dropContent={
                          <Box align="center" justify="center" pad="medium" />
                        }
                      />
                    </Box>
                    <Box
                      align="center"
                      justify="start"
                      direction="row"
                      fill={false}
                      gap="small"
                    >
                      <Text margin={{ left: "medium" }}>First1 Last1</Text>
                      <DropButton
                        label="Drop Button"
                        dropAlign={{ top: "bottom" }}
                        open={false}
                        dropContent={
                          <Box align="center" justify="center" pad="medium" />
                        }
                      />
                    </Box>
                  </AccordionPanel>
                  <AccordionPanel label="Invite Collaborator">
                    <Text>Email</Text>
                    <TextInput />
                    <Text>Access level</Text>
                    <RadioButtonGroup
                      name="access-level"
                      options={[
                        { label: "Edit", value: 1 },
                        { label: "Suggest / Comment", value: 2 },
                        { label: "View", value: 3 },
                      ]}
                    />
                    <Button label="Add" />
                  </AccordionPanel>
                  <AccordionPanel label="Visibility">
                    <Text>Make my token and information visible to:</Text>
                    <RadioButtonGroup
                      name="visibility"
                      options={[
                        { label: "1st degree connections", value: 1 },
                        { label: "2nd degree connections", value: 2 },
                        { label: "Anyone with access", value: 3 },
                        { label: "No one", value: 4 },
                      ]}
                    />
                  </AccordionPanel>
                  <AccordionPanel label="Data Categories">
                    <CheckBoxGroup
                      options={[
                        { label: "Name" },
                        { label: "Birthday" },
                        { label: "Hometown" },
                        { label: "Last updated" },
                      ]}
                      direction="column"
                    />
                    <Text>Add new category (Press Enter to add)</Text>
                    <TextInput />
                  </AccordionPanel>
                  <AccordionPanel label="Delete This Tree">
                    <Text>
                      Collaborators will be notified that this tree will be
                      deleted and will have the option to save a copy within 7
                      days. Please type in the tree's name and press the button
                      below to confirm.
                    </Text>
                    <TextInput />
                    <Button label="Delete this tree" />
                  </AccordionPanel>
                </Accordion>
              </Box>
            </Tab>
            <Tab title="Settings" icon={<SettingsOption />}>
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
                <AccordionPanel label="Manage My Account">
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
                    confirm. Deleting your account will not delete trees for
                    active collaborators.
                  </Text>
                  <TextInput />
                  <Box pad="large">
                    <Button label="Delete Account" />
                  </Box>
                </AccordionPanel>
                <Box align="center" justify="center" pad="medium" />
                <Button label="Log out" />
              </Accordion>
            </Tab>
          </Tabs>
        </Box>
      </Box>
    </React.Fragment>
  )
}

export default SettingsPage
