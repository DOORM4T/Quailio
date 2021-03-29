import { Box, Grid, Tab, Tabs } from "grommet"
import React from "react"
import { useDispatch, useSelector } from "react-redux"
import { Dispatch } from "redux"
import { fireUnsavedChangeEvent } from "../../../helpers/unsavedChangeEvent"
import useSmallBreakpoint from "../../../hooks/useSmallBreakpoint"
import { getIsOverlayOpen } from "../../../store/selectors/ui/getIsOverlayOpen"
import { togglePersonOverlay } from "../../../store/ui/uiActions"
import Overlay from "../../Overlay"
import ContentPanel from "./ContentPanel"
import PersonHeader from "./PersonHeader"
import Relationships from "./Relationships"

interface IProps {
  id: string
}

const ViewPersonOverlay: React.FC<IProps> = (props) => {
  const dispatch: Dispatch<any> = useDispatch()
  const isOverlayOpen = useSelector(getIsOverlayOpen)
  const isSmall = useSmallBreakpoint()
  const [isEditing, setIsEditing] = React.useState(false) // Whether the overlay is in edit mode or not

  // Do not render if the overlay shouldn't be open
  if (!isOverlayOpen) return null

  // -== FUNCTIONS ==- //
  /**
   * Hide the person menu
   */
  const handleClose = () => {
    /* If there are unsaved changes, ask the user to confirm  */
    const doContinue = fireUnsavedChangeEvent()
    if (!doContinue) return

    /* Close overlay */
    dispatch(togglePersonOverlay(false))
  }

  // -== REUSABLE COMPONENTS (Reused for different layouts) ==- //
  const PersonHeaderContainer: React.ReactNode = (
    <PersonHeader isEditing={isEditing} setIsEditing={setIsEditing} />
  )

  const RelationshipsContainer: React.ReactNode = (
    <Relationships isEditing={isEditing} setIsEditing={setIsEditing} />
  )

  const ContentContainer: React.ReactNode = (
    <ContentPanel id="person-content-editor" isEditing={isEditing} />
  )

  // -== LAYOUTS ==- //
  const SmallScreenLayout: React.FC = () => (
    <Box fill>
      {PersonHeaderContainer}
      <Box direction="column" background="dark-1" pad="medium" fill>
        <Tabs>
          <Tab title="Content">
            <Box
              background="light-2"
              pad="medium"
              style={{ borderRadius: "2px" }}
              overflow={{ vertical: "auto" }}
              fill
            >
              {ContentContainer}
            </Box>
          </Tab>
          <Tab title="Relationships">
            <Box overflow={{ vertical: "auto" }} background="dark-1" fill>
              {RelationshipsContainer}
            </Box>
          </Tab>
        </Tabs>
      </Box>
    </Box>
  )

  const LargeScreenLayout: React.FC = () => (
    <Grid
      fill
      rows={["auto", "medium"]}
      columns={["medium", "auto"]}
      areas={[
        { name: "header", start: [0, 0], end: [0, 0] },
        { name: "relationships", start: [0, 1], end: [0, 1] },
        { name: "contentEditor", start: [1, 0], end: [1, 1] },
      ]}
    >
      {PersonHeaderContainer}
      <Box
        gridArea="relationships"
        overflow={{ vertical: "auto" }}
        background="dark-1"
        fill
      >
        {RelationshipsContainer}
      </Box>
      <Box
        gridArea="contentEditor"
        background="light-2"
        pad="medium"
        fill
        overflow={{ vertical: "auto" }}
      >
        {ContentContainer}
      </Box>
    </Grid>
  )

  return (
    <Overlay id={props.id} handleClose={handleClose}>
      {isSmall ? <SmallScreenLayout /> : <LargeScreenLayout />}
    </Overlay>
  )
}

export default ViewPersonOverlay
