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
import { dummyState } from "../assets/dummyState.ts.DISABLED"
import Logo from "../assets/logo.png"
import ForceGraphCanvas from "../components/containers/ForceGraphCanvas"
import { auth } from "../firebase"
import { IApplicationState } from "../store/store"

interface IProps {}

const APP_NAME = "Quailio"

const HomePage: React.FC<IProps> = (props: IProps) => {
  const isLoggedIn = useSelector<IApplicationState>(
    (state) => state.auth.userId,
  )

  return (
    <React.Fragment>
      <Box align="center" justify="start" direction="column" fill="horizontal">
        <GrommetHeader
          align="center"
          direction="row"
          justify="center"
          fill="horizontal"
          background={{ color: "accent-1" }}
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
        <Box align="center" justify="center">
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
                  <Button label="Sign In" />
                </Link>
                <Link to="/register">
                  <Button label="Register" />
                </Link>
              </Box>
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
