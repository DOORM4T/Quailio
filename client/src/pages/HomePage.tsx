import React from "react"
import {
  Accordion,
  AccordionPanel,
  Avatar,
  Box,
  Button,
  Footer,
  Heading,
  Text,
  Header as GrommetHeader,
  Image,
  Stack,
} from "grommet"

import Header from "../components/Header"
import { Link } from "react-router-dom"

import Logo from "../assets/logo.png"
import { useSelector } from "react-redux"
import { IApplicationState } from "../store/store"
import { auth } from "../firebase"
import { dummyState } from "../assets/dummyState"
import ForceGraphCanvas from "../components/containers/ForceGraphCanvas"

interface IProps {}

const APP_NAME = "Quailio"

const HomePage: React.FC<IProps> = (props: IProps) => {
  const isLoggedIn = useSelector<IApplicationState>(
    (state) => state.auth.userId,
  )

  return (
    <React.Fragment>
      <Header title={APP_NAME} />

      <Box align="center" justify="start" direction="column" fill="horizontal">
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
            size="xlarge"
            background={{ color: "accent-1" }}
            src={Logo}
          />
        </GrommetHeader>
        <Box align="center" justify="center">
          <Box align="center" justify="center" pad="large" fill="horizontal" />
          <Box
            align="center"
            justify="center"
            direction="row"
            gap="medium"
            fill="horizontal"
            pad={{ bottom: "xlarge" }}
          >
            {isLoggedIn ? (
              <Box direction="column" align="center">
                {auth.currentUser?.email && (
                  <Heading level={3}>
                    Welcome back,{" "}
                    <Text color="brand">{auth.currentUser.email}</Text>
                  </Heading>
                )}
                <Link to="/dashboard">
                  <Button label="Dashboard" />
                </Link>
              </Box>
            ) : (
              <React.Fragment>
                <Link to="/login">
                  <Button label="Sign In" />
                </Link>
                <Link to="/register">
                  <Button label="Register" />
                </Link>
              </React.Fragment>
            )}
          </Box>

          <Text size="xxlarge">Make a connection</Text>
          <Box align="stretch">
            <Accordion width="large">
              <AccordionPanel label="Connecting Families (Coming Soon!)">
                <Box pad="medium">
                  <Text>
                    Create family trees to share with family and watch your
                    branches grow!
                  </Text>
                </Box>
              </AccordionPanel>
              <AccordionPanel label="Organizational Hierarchy">
                <Box pad="medium">
                  <Text>
                    Whether you're a part of a project team or a social club,
                    {APP_NAME} is great for school organizations!
                  </Text>
                </Box>
              </AccordionPanel>
              <AccordionPanel label="Writers and Fandoms">
                <Box pad="medium">
                  <Text>
                    Now it's easier to see your characters, their relationships,
                    and affiliations.
                  </Text>
                </Box>
              </AccordionPanel>
            </Accordion>
          </Box>
          <Box align="center" justify="center" />
          <Box align="center" justify="center" fill="horizontal" pad="xsmall">
            <Text size="xlarge">Get started now!</Text>
          </Box>
          <Box align="center" justify="center" margin={{ top: "xlarge" }}>
            <Text size="xxlarge">Try it out!</Text>
            <Box pad="large" width="large" height="large">
              <ForceGraphCanvas
                id="network-sketch"
                state={dummyState}
                style={{ overflow: "hidden", backgroundColor: "#DDD" }}
                disconnected={true}
              />
            </Box>
          </Box>
          <Footer
            align="center"
            direction="row"
            flex={false}
            justify="between"
            gap="medium"
          />
        </Box>
      </Box>
    </React.Fragment>
  )
}

export default HomePage
