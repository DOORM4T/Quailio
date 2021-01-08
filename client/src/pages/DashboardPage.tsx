import React from "react"
import { Box, Button, Text, Heading } from "grommet"
import * as Icons from "grommet-icons"

import Header from "../components/Header"
import { Link } from "react-router-dom"

interface IProps {}

const DashboardPage: React.FC<IProps> = (props: IProps) => {
  return (
    <React.Fragment>
      <Header title="Dashboard" />
      <Box direction="column" align="center" fill>
        <Heading>My Networks</Heading>
        <Text>Home</Text>

        <Box direction="row" gap="small">
          The P5 Canvas goes here
        </Box>
      </Box>
    </React.Fragment>
  )
}

export default DashboardPage
