import { Anchor, Box, Grid, Image, List, Text, TextArea } from "grommet"
import * as Icons from "grommet-icons"
import React, { useRef, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { Dispatch } from "redux"
import { fireUnsavedChangeEvent } from "../../helpers/unsavedChangeEvent"
import useSmallBreakpoint from "../../hooks/useSmallBreakpoint"
import { updateRelationshipReason } from "../../store/networks/actions"
import { getPathContent } from "../../store/selectors/ui/getPathContent"
import {
  setPathOverlayContent,
  setPersonInFocus,
  togglePersonOverlay,
} from "../../store/ui/uiActions"
import { IPathContent, IPathContentItem } from "../../store/ui/uiTypes"
import Overlay from "../Overlay"
import ToolTipButton from "../ToolTipButton"

function PathsOverlay() {
  const isSmall = useSmallBreakpoint()
  const dispatch: Dispatch<any> = useDispatch()
  const pathContent = useSelector(getPathContent)

  const [isEditing, setEditing] = useState(false)
  const toggleEditing = () => {
    setEditing((latest) => !latest)
  }

  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const scrollTopRef = useRef<number | null>(null)

  if (!pathContent) return null
  const { person1, person2, paths } = pathContent

  // Update path content in global state
  // Example usage: updated a path description -- without this, descriptions would flicker to previous descriptions, not reflecting the latest changes
  const updatePathContent = (
    pathIndex: number,
    pathItemIndex: number,
    updatedContent: IPathContentItem,
  ) => {
    const updatedPaths = [...pathContent.paths]
    updatedPaths[pathIndex][pathItemIndex] = updatedContent
    const updatedPathContent: IPathContent = {
      ...pathContent,
      paths: updatedPaths,
    }

    dispatch(setPathOverlayContent(updatedPathContent))
    scrollContainerRef.current?.scroll({ top: scrollTopRef.current || 0 })
  }

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

  const Controls = (
    <Box
      direction="row"
      height={{ min: "48px" }}
      style={{ position: "sticky", top: 0 }}
      background="light-1"
    >
      <ToolTipButton
        tooltip={
          isEditing ? "Click to enter View Mode" : "Click to enter Edit Mode"
        }
        icon={
          isEditing ? (
            <Icons.Edit color="neutral-3" />
          ) : (
            <Icons.View color="neutral-1" />
          )
        }
        onClick={toggleEditing}
      />
    </Box>
  )

  const Paths = paths.map((path, index) => (
    <List
      key={index}
      data={path}
      margin={{ bottom: "small" }}
      background="light-3"
    >
      {(pathItem: IPathContentItem, i: number) => {
        const prevItemId = i > 0 ? path[i - 1].id : null

        const handleUpdateDescription = async (description: string) => {
          if (description === pathItem.description) return
          if (prevItemId === null) return

          try {
            // Save current scroll position (updating rel reason will reset the scroll position)
            scrollTopRef.current = scrollContainerRef.current?.scrollTop || null

            // Update in global state
            await dispatch(
              updateRelationshipReason(pathItem.id, prevItemId, description),
            )

            // Update path overlay content to immediately reflect changes
            const updatedItem: IPathContentItem = { ...pathItem, description }
            updatePathContent(index, i, updatedItem)
          } catch (error) {
            console.error(error)
          }
        }

        return (
          <Box align="start">
            <Anchor onClick={navigateToPerson(pathItem.id)}>
              {i + 1}. {pathItem.name}
            </Anchor>
            {i > 0 && (
              <React.Fragment>
                {isEditing && (
                  <DescriptionEditor
                    initialDescription={pathItem.description}
                    handleUpdateDescription={handleUpdateDescription}
                  />
                )}
                {!isEditing && <Text>{pathItem.description}</Text>}
              </React.Fragment>
            )}
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
      <Box
        height="auto"
        overflow={{ vertical: "auto" }}
        ref={scrollContainerRef}
      >
        {Controls}
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
        fill
        overflow={{ vertical: "auto" }}
        ref={scrollContainerRef}
      >
        {Controls}
        <Box pad="medium">{Paths}</Box>
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

interface IDescriptionEditorProps {
  initialDescription: string
  handleUpdateDescription: (description: string) => void
}

// Editor for the description/relationship reason between two nodes in the path
function DescriptionEditor({
  initialDescription,
  handleUpdateDescription,
}: IDescriptionEditorProps) {
  const [description, setDescription] = useState(initialDescription)
  const handleChange = (e: React.FormEvent<HTMLTextAreaElement>) => {
    setDescription(e.currentTarget.value)
  }

  const handleSave = () => {
    handleUpdateDescription(description)
  }

  return (
    <TextArea
      value={description}
      onChange={handleChange}
      onBlur={handleSave}
      resize="vertical"
    />
  )
}
