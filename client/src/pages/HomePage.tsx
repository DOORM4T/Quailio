import React from "react"
import { Box, Button, Text } from "grommet"
import * as Icons from "grommet-icons"

import Header from "../components/Header"
import { Link } from "react-router-dom"

interface IProps {}

const HomePage: React.FC<IProps> = (props: IProps) => {
  return (
    <React.Fragment>
      <Header title="Log in" />
      <Box direction="column" align="center" fill>
        <Text>Home</Text>

        <Box direction="row" gap="small">
          <Link to="/login">
            <Button primary label="Log in" />
          </Link>
          <Link to="/register">
            <Button secondary label="Register" />
          </Link>
        </Box>
      </Box>
    </React.Fragment>
  )
}

export default HomePage
