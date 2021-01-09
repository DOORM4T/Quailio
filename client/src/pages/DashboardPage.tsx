import React from "react"
import { Box, Heading, List, ResponsiveContext } from "grommet"

import Header, { HEADER_HEIGHT } from "../components/Header"

import ForceGraphCanvas from "../components/containers/ForceGraphCanvas"
import { INetworkSketchState } from "../network"

// TODO: delete when Redux + Firebase is implemented

const dummyState: INetworkSketchState = {
  people: [
    {
      name: "Luke Skywalker",
      thumbnail_url:
        "https://static.wikia.nocookie.net/starwars/images/3/3d/LukeSkywalker.png/revision/latest/scale-to-width-down/499?cb=20201218190434",
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
      thumbnail_url:
        "https://static.wikia.nocookie.net/starwars/images/f/f1/Leia_Organa_TROS.png/revision/latest/scale-to-width-down/500?cb=20200102034101",
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
      name: "Anakin Skywalker",
      thumbnail_url:
        "https://static.wikia.nocookie.net/starwars/images/6/6f/Anakin_Skywalker_RotS.png/revision/latest/scale-to-width-down/500?cb=20130621175844",
      relationships: {
        "Luke Skywalker": ["Sister", "Brother"],
        "Leia Organa": ["Father", "Daughter"],
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
      name: "Nute Gunray",
      relationships: {
        "Lott Dodd": ["Associate", "Associate"],
      },
    },
    {
      name: "Lott Dodd",
      relationships: {
        "Nute Gunray": ["Associate", "Associate"],
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
          pad={{ horizontal: "large", bottom: "large" }}
          background="light-1"
          overflow={{ vertical: "auto" }}
        >
          <Heading level={3}>Network</Heading>
          <List data={dummyState.people} margin={{ bottom: "medium" }} />
        </Box>
        <ForceGraphCanvas
          id="network-sketch"
          state={dummyState}
          style={{ overflow: "hidden", backgroundColor: "#DDD" }}
        />
      </Box>
    </React.Fragment>
  )
}

export default DashboardPage

interface IProps {}
