import React from "react"
import { Box, Button, Text, Heading, Main } from "grommet"
import * as Icons from "grommet-icons"

import Header, { HEADER_HEIGHT } from "../components/Header"
import { Link } from "react-router-dom"
import Canvas from "../components/Canvas"

import {
  createNetworkSketch,
  INetworkSketchState,
} from "../sketches/networkSketch"

interface IProps {}

// TODO: delete when Redux + Firebase is implemented
const dummyState: INetworkSketchState = {
  offsetX: 0,
  offsetY: 0,
  scale: 1,
  people: [],
}

const DashboardPage: React.FC<IProps> = (props: IProps) => {
  return (
    <React.Fragment>
      <Header title="Dashboard" />
      <Box
        direction="row"
        flex={{ grow: 1 }}
        style={{ height: `calc(100vh - ${HEADER_HEIGHT}px)` }}
        background="light-1"
      >
        <Box
          direction="column"
          width={{ min: "240px" }}
          pad={{ horizontal: "large" }}
          background="light-1"
        >
          <Heading level={3}>Network</Heading>
          <ul>
            <li>Person 1</li>
            <li>Person 2</li>
            <li>Person 3</li>
            <li>Person 4</li>
            <li>Person 5</li>
          </ul>
        </Box>
        <Canvas
          id="network-sketch"
          createSketch={createNetworkSketch}
          state={dummyState}
        />
      </Box>
    </React.Fragment>
  )
}

export default DashboardPage
