import React from "react"
import {
  Box,
  Button,
  Text,
  Heading,
  Main,
  List,
  ResponsiveContext,
} from "grommet"
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
  people: [
    {
      name: "Luke Skywalker",
      relationships: {
        "Leia Organa": ["Brother", "Sister"],
        "Anakin Skywalker": ["Son", "Father"],
        "Padme Amidala": ["Son", "Mother"],
        "Ben Solo": ["Uncle", "Nephew"],
        "Han Solo": ["Brother-in-law", "Brother-in-law"],
        "Own Lars": ["Step-nephew", "Step-uncle"],
        "Beru Lars": ["Step-nephew", "Step-aunt"],
        "Shmi Skywalker": ["Grandson", "Grandmother"],
        "Cliegg Lars": ["Step-grandson", "Step-grandfather"],
      },
    },
    {
      name: "Leia Organa",
      relationships: {
        "Luke Skywalker": ["Sister", "Brother"],
        "Anakin Skywalker": ["Daughter", "Father"],
        "Padme Amidala": ["Daughter", "Mother"],
        "Ben Solo": ["Mother", "Son"],
        "Han Solo": ["Partner", "Partner"],
        "Own Lars": ["Step-niece", "Step-uncle"],
        "Beru Lars": ["Step-niece", "Step-aunt"],
        "Shmi Skywalker": ["Granddaughter", "Grandmother"],
        "Cliegg Lars": ["Step-granddaughter", "Step-grandfather"],
      },
    },
    {
      name: "Leia Organa",
      relationships: {
        "Luke Skywalker": ["Sister", "Brother"],
        "Anakin Skywalker": ["Daughter", "Father"],
        "Padme Amidala": ["Daughter", "Mother"],
        "Ben Solo": ["Mother", "Son"],
        "Han Solo": ["Partner", "Partner"],
        "Own Lars": ["Step-niece", "Step-uncle"],
        "Beru Lars": ["Step-niece", "Step-aunt"],
        "Shmi Skywalker": ["Granddaughter", "Grandmother"],
        "Cliegg Lars": ["Step-granddaughter", "Step-grandfather"],
      },
    },
    {
      name: "Leia Organa",
      relationships: {
        "Luke Skywalker": ["Sister", "Brother"],
        "Anakin Skywalker": ["Daughter", "Father"],
        "Padme Amidala": ["Daughter", "Mother"],
        "Ben Solo": ["Mother", "Son"],
        "Han Solo": ["Partner", "Partner"],
        "Own Lars": ["Step-niece", "Step-uncle"],
        "Beru Lars": ["Step-niece", "Step-aunt"],
        "Shmi Skywalker": ["Granddaughter", "Grandmother"],
        "Cliegg Lars": ["Step-granddaughter", "Step-grandfather"],
      },
    },
    {
      name: "Leia Organa",
      relationships: {
        "Luke Skywalker": ["Sister", "Brother"],
        "Anakin Skywalker": ["Daughter", "Father"],
        "Padme Amidala": ["Daughter", "Mother"],
        "Ben Solo": ["Mother", "Son"],
        "Han Solo": ["Partner", "Partner"],
        "Own Lars": ["Step-niece", "Step-uncle"],
        "Beru Lars": ["Step-niece", "Step-aunt"],
        "Shmi Skywalker": ["Granddaughter", "Grandmother"],
        "Cliegg Lars": ["Step-granddaughter", "Step-grandfather"],
      },
    },
  ],
}

const DashboardPage: React.FC<IProps> = (props: IProps) => {
  const size = React.useContext(ResponsiveContext)
  const isSmall = size === "xsmall" || size === "small"

  return (
    <React.Fragment>
      <Header title="Dashboard" />
      <Box
        direction={isSmall ? "column" : "row"}
        flex={{ grow: 1 }}
        style={{ height: `calc(100vh - ${HEADER_HEIGHT}px)` }}
        background="light-1"
      >
        <Box
          direction="column"
          width={{ min: "360px" }}
          pad={{ horizontal: "large" }}
          background="light-1"
          overflow={{ vertical: "auto" }}
        >
          <Heading level={3}>Network</Heading>
          <List data={dummyState.people} />
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
