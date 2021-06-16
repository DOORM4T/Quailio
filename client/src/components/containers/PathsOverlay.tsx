import { Anchor, Box, Grid, Image, List, Text } from "grommet"
import React from "react"
import { useDispatch, useSelector } from "react-redux"
import { Dispatch } from "redux"
import { fireUnsavedChangeEvent } from "../../helpers/unsavedChangeEvent"
import useSmallBreakpoint from "../../hooks/useSmallBreakpoint"
import { getPathContent } from "../../store/selectors/ui/getPathContent"
import {
  setPathOverlayContent,
  setPersonInFocus,
  togglePersonOverlay,
} from "../../store/ui/uiActions"
import { IPathContentItem } from "../../store/ui/uiTypes"
import Overlay from "../Overlay"
function PathsOverlay() {
  const isSmall = useSmallBreakpoint()
  const dispatch: Dispatch<any> = useDispatch()
  const bfsPath = useSelector(getPathContent)
  if (!bfsPath) return null
  const { person1, person2, paths } = bfsPath

  const p1Colors = {
    bg: person1.backgroundColor ? person1.backgroundColor : "brand",
    text: person1.textColor ? person1.textColor : "accent-1",
  }

  const p2Colors = {
    bg: person2.backgroundColor ? person2.backgroundColor : "dark-1",
    text: person2.textColor ? person2.textColor : "accent-1",
  }

  const handleClose = () => {
    const doContinue = fireUnsavedChangeEvent() // Trigger a listener if there is an active unsaved change event listener
    if (!doContinue) return
    dispatch(setPathOverlayContent(null))
  }

  const navigateToPerson = (personId: string) => {
    return () => {
      dispatch(setPersonInFocus(personId))
      dispatch(togglePersonOverlay(true))
      dispatch(setPathOverlayContent(null))
    }
  }

  const Person1Content = (
    <React.Fragment>
      {person1.thumbnailUrl && (
        <Image src={person1.thumbnailUrl} width={128} height={128} />
      )}
      <Anchor color={p1Colors.text} onClick={navigateToPerson(person1.id)}>
        {person1.name}
      </Anchor>
    </React.Fragment>
  )

  const Person2Content = (
    <React.Fragment>
      {person2.thumbnailUrl && (
        <Image src={person2.thumbnailUrl} width={128} height={128} />
      )}
      <Anchor color={p2Colors.text} onClick={navigateToPerson(person2.id)}>
        {person2.name}
      </Anchor>
    </React.Fragment>
  )

  const Paths = paths.map((path, index) => (
    <List
      key={index}
      data={path}
      margin={{ bottom: "small" }}
      background="light-3"
    >
      {(pathItem: IPathContentItem, i: number) => {
        return (
          <Box align="start">
            <Anchor onClick={navigateToPerson(pathItem.id)}>
              {i + 1}. {pathItem.name}
            </Anchor>
            <Text>{pathItem.description}</Text>
          </Box>
        )
      }}
    </List>
  ))

  const SmallScreenLayout: React.FC = () => (
    <Box fill direction="column">
      <Box direction="row" width="100%" height={{ min: "128px" }}>
        <Box
          background={p1Colors.bg}
          width="50%"
          align="center"
          justify="center"
        >
          {Person1Content}
        </Box>
        <Box
          background={p2Colors.bg}
          width="50%"
          align="center"
          justify="center"
        >
          {Person2Content}
        </Box>
      </Box>
      <Box height="auto" overflow={{ vertical: "auto" }}>
        {Paths}
      </Box>
    </Box>
  )

  const LargeScreenLayout = () => (
    <Grid
      fill
      rows={["auto", "medium"]}
      columns={["medium", "auto"]}
      areas={[
        { name: "person1", start: [0, 0], end: [0, 0] },
        { name: "person2", start: [0, 1], end: [0, 1] },
        { name: "paths", start: [1, 0], end: [1, 1] },
      ]}
    >
      <Box
        gridArea="person1"
        overflow={{ vertical: "auto" }}
        background={p1Colors.bg}
        fill
        align="center"
        justify="center"
      >
        {Person1Content}
      </Box>
      <Box
        gridArea="person2"
        overflow={{ vertical: "auto" }}
        background={p2Colors.bg}
        fill
        align="center"
        justify="center"
      >
        {Person2Content}
      </Box>
      <Box
        gridArea="paths"
        background="light-1"
        pad="medium"
        fill
        overflow={{ vertical: "auto" }}
      >
        {Paths}
      </Box>
    </Grid>
  )

  return (
    <Overlay handleClose={handleClose}>
      {isSmall ? <SmallScreenLayout /> : <LargeScreenLayout />}
    </Overlay>
  )
}

export default PathsOverlay
