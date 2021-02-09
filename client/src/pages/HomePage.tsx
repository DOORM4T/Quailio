import {
  Accordion,
  AccordionPanel,
  Avatar,
  Box,
  Button,
  Footer,
  Header as GrommetHeader,
  Heading,
  Text,
} from "grommet"
import React from "react"
import { useSelector } from "react-redux"
import { Link } from "react-router-dom"
import Logo from "../assets/logo.png"
import { auth } from "../firebase"
import { IApplicationState } from "../store/store"

const APP_NAME = "Quailio"

const HomePage: React.FC = () => {
  const isLoggedIn = useSelector<IApplicationState>(
    (state) => state.auth.userId,
  )

  return (
    <Box fill background="light-1">
      <Box align="center" justify="start" direction="column" fill="horizontal">
        <GrommetHeader
          align="center"
          direction="row"
          justify="center"
          fill="horizontal"
          background={{ color: "dark-1" }}
        >
          <Avatar
            align="center"
            flex={false}
            justify="center"
            src={Logo}
            style={{
              width: "256px",
              height: "256px",
            }}
            animation={{ type: "zoomIn" }}
          />
        </GrommetHeader>
        <Box align="center" justify="center" fill>
          <Box
            align="center"
            justify="center"
            direction="row"
            gap="medium"
            fill="horizontal"
            pad={{ bottom: "xlarge" }}
            animation={{ type: "fadeIn", delay: 500 }}
            style={{ height: "250px" }}
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
              <Box direction="row" gap="small">
                <Link to="/login">
                  <Button label="Sign In" id="sign-in-button" />
                </Link>
                <Link to="/register">
                  <Button label="Register" id="register-button" />
                </Link>
              </Box>
            )}
          </Box>

          <Text size="xxlarge">Make a connection</Text>
          <Box align="stretch" pad={{ bottom: "xlarge" }}>
            <Accordion width="large">
              <AccordionPanel label="Connecting Families">
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
                    Whether you're a part of a project team or a social club,{" "}
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

          {/* TODO: replace legacy demo with zero-login demo */}
          {/* <Box
            align="center"
            justify="center"
            margin={{ top: "xlarge" }}
            pad="large"
            width="large"
            height="large"
          >
            <Text size="xxlarge" margin={{ top: "xlarge" }}>
              Try it out!
            </Text>
            <ForceGraphCanvas
              id="network-sketch"
              state={dummyState}
              style={{
                overflow: "hidden",
                backgroundColor: "#DDD",
                width: "500px",
                height: "500px",
              }}
              disconnected={true}
            />
          </Box> */}
          <Box
            width="large"
            height="large"
            background="dark-1"
            align="center"
            justify="center"
            margin={{ vertical: "xlarge" }}
          >
            <i>Zero-login demo coming soon!</i>
          </Box>
        </Box>
      </Box>
      <Footer
        direction="row"
        height="xsmall"
        background="brand"
        align="center"
        justify="end"
        gap="medium"
      >
        🦅
      </Footer>
    </Box>
  )
}

export default HomePage
