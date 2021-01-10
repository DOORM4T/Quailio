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
} from "grommet"
import * as Icons from "grommet-icons"

import Header from "../components/Header"
import { Link } from "react-router-dom"

interface IProps {}

const HomePage: React.FC<IProps> = (props: IProps) => {
  return (
    <React.Fragment>
      <Header title="Log in" />

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
            size="large"
            background={{ color: "accent-1" }}
          />
        </GrommetHeader>
        <Box align="center" justify="center">
          <Heading>welcome to app</Heading>
          <Box align="center" justify="center" pad="large" fill="horizontal" />
          <Text size="xxlarge">Make a connection</Text>
          <Box align="stretch">
            <Accordion>
              <AccordionPanel label="Connecting Families (Coming Soon!)">
                <Text>
                  Create family trees to share with family and watch your
                  branches grow!
                </Text>
              </AccordionPanel>
              <AccordionPanel label="Organizational Hierarchy">
                <Text>
                  Whether you're a part of a project team or a social club,
                  appname is great for school organizations!
                </Text>
              </AccordionPanel>
              <AccordionPanel label="Writers and Fandoms">
                <Text>
                  Now it's easier to see your characters, their relationships,
                  and affiliations.
                </Text>
              </AccordionPanel>
            </Accordion>
          </Box>
          <Box align="center" justify="center" />
          <Box align="center" justify="center" fill="horizontal" pad="xsmall">
            <Text size="xlarge">Get started now!</Text>
          </Box>
          <Box
            align="center"
            justify="center"
            direction="row"
            gap="medium"
            fill="horizontal"
          >
            <Link to="/login">
              <Button label="Sign In" />
            </Link>
            <Link to="/register">
              <Button label="Register" />
            </Link>
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
