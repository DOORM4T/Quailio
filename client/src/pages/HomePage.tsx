import {
  Accordion,
  AccordionPanel,
  Avatar,
  Box,
  Button,
  Header as GrommetHeader,
  Heading,
  Text,
} from "grommet"
import React from "react"
import { Helmet } from "react-helmet"
import { useSelector } from "react-redux"
import { Link } from "react-router-dom"
import Logo from "../assets/logo.png"
import { auth } from "../firebase/services"
import { routeNames } from "../Routes"
import { getIsAuthenticated } from "../store/selectors/auth/getIsAuthenticated"

const APP_NAME = "Quailio"

const HomePage: React.FC = () => {
  const isLoggedIn = useSelector(getIsAuthenticated)

  return (
    <Box height="xxlarge" background="light-1">
      <Helmet>
        <title>Home</title>
      </Helmet>
      <Box align="center" justify="start" direction="column">
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
            margin={{ top: "medium" }}
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
                <Link to={routeNames.DASHBOARD}>
                  <Button label="Dashboard" />
                </Link>
              </Box>
            ) : (
              <Box direction="column" gap="small">
                <Link to={routeNames.DASHBOARD}>
                  <Button label="Zero-login dashboard" />
                </Link>
                <Box direction="row" gap="small">
                  <Link to={routeNames.LOGIN}>
                    <Button label="Sign in" id="sign-in-button" />
                  </Link>
                  <Link to={routeNames.REGISTER}>
                    <Button label="Register" id="register-button" />
                  </Link>
                </Box>
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
        </Box>
      </Box>

      <Box
        background="dark-1"
        pad="large"
        width="large"
        height="large"
        margin={{ horizontal: "auto", vertical: "large" }}
        align="center"
        justify="center"
      >
        Coming Soon:
        <ul>
          <li>Group renaming and custom group colors</li>
          <li>A shiny UI redesign</li>
          <li>GIF demos</li>
        </ul>
      </Box>
    </Box>
  )
}

export default HomePage
