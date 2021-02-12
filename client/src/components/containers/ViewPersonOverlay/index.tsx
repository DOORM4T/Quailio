import { Box, Grid, Tab, Tabs } from "grommet"
import React from "react"
import { useDispatch, useSelector } from "react-redux"
import { Dispatch } from "redux"
import { fireUnsavedChangeEvent } from "../../../helpers/unsavedChangeEvent"
import useSmallBreakpoint from "../../../hooks/useSmallBreakpoint"
import { getCurrentNetwork } from "../../../store/selectors/networks/getCurrentNetwork"
import { getPersonInFocus } from "../../../store/selectors/ui/getPersonInFocus"
import { togglePersonEditMenu } from "../../../store/ui/uiActions"
import Overlay from "../../Overlay"
import ContentPanel from "./ContentPanel"
import PersonHeader from "./PersonHeader"
import Relationships from "./Relationships"

interface IProps {
  id: string
}

const ViewPersonOverlay: React.FC<IProps> = (props) => {
  // -== GLOBAL STORE HOOKS ==- //
  const dispatch: Dispatch<any> = useDispatch()
  const isSmall = useSmallBreakpoint()

  /* Get the current network */
  const currentNetwork = useSelector(getCurrentNetwork)

  /* Get the current person in focus */
  const currentPerson = useSelector(getPersonInFocus)

  // -== LOCAL STATE & OTHER HOOKS ==- //
  const [isEditing, setIsEditing] = React.useState(false) // Whether the overlay is in edit mode or not

  /* Don't render if there is no selected Network or Person  */
  if (!currentNetwork || !currentPerson) return null

  // -== FUNCTIONS ==- //
  /**
   * Hide the person menu
   */
  const handleClose = () => {
    /* If there are unsaved changes, ask the user to confirm  */
    const doContinue = fireUnsavedChangeEvent()
    if (!doContinue) return

    /* Close overlay */
    dispatch(togglePersonEditMenu(false))
  }

  // -== REUSABLE COMPONENTS (Reused for different layouts) ==- //
  const PersonHeaderContainer: React.ReactNode = (
    <PersonHeader
      currentNetwork={currentNetwork}
      currentPerson={currentPerson}
      isEditing={isEditing}
      setIsEditing={setIsEditing}
    />
  )

  const RelationshipsContainer: React.ReactNode = (
    <Relationships
      currentNetwork={currentNetwork}
      currentPerson={currentPerson}
      isEditing={isEditing}
      setIsEditing={setIsEditing}
    />
  )

  const ContentContainer: React.ReactNode = (
    <ContentPanel
      id="person-content-editor"
      currentPersonId={currentPerson.id}
      isEditing={isEditing}
    />
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
      rows={["auto", "auto"]}
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
