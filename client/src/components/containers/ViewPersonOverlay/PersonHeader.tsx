import { Box, Header, TextInput } from "grommet"
import * as Icons from "grommet-icons"
import React, { CSSProperties } from "react"
import { useDispatch, useSelector } from "react-redux"
import { Dispatch } from "redux"
import { updatePersonName } from "../../../store/networks/actions"
import { togglePersonInGroup } from "../../../store/networks/actions/togglePersonInGroup"
import {
  getCurrentNetworkGroups,
  getCurrentNetworkId,
} from "../../../store/selectors/networks/getCurrentNetwork"
import {
  getPersonInFocusId,
  getPersonInFocusName,
} from "../../../store/selectors/ui/getPersonInFocusData"
import Badge from "../../Badge"
import OverlayButtons from "./OverlayButtons"
import PersonThumbnail from "./PersonThumbnail"

interface IProps {
  isEditing: boolean
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>
}

const PersonHeader: React.FC<IProps> = (props) => {
  const dispatch: Dispatch<any> = useDispatch()
  const currentNetworkId = useSelector(getCurrentNetworkId)
  const currentPersonId = useSelector(getPersonInFocusId)
  const currentPersonName = useSelector(getPersonInFocusName)
  const currentNetworkGroups = useSelector(getCurrentNetworkGroups)

  const [personName, setPersonName] = React.useState<string>(
    currentPersonName || "",
  )

  // Person in focus changed? Update state with the new name
  React.useEffect(() => {
    setPersonName(currentPersonName || "")
  }, [currentPersonName])

  /* Do not render if no network or person is selected */
  if (!currentNetworkId || !currentPersonId) return null

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPersonName(e.currentTarget.value)
  }

  const handleUpdateName = async () => {
    /* Skip updating if the name didn't change */
    if (personName === currentPersonName) return

    try {
      /* Dispatch the name change to the global store */
      await dispatch(updatePersonName(currentPersonId, personName))
    } catch (error) {
      console.error(error)
    }
  }

  const GroupBadges: React.ReactNode = (
    <Box direction="row" overflow={{ horizontal: "auto", vertical: "hidden" }}>
      {Object.entries(currentNetworkGroups)
        .filter((entry) => entry[1].personIds.includes(currentPersonId))
        .map((entry, index) => {
          const [groupId, group] = entry

          // FUNCTION | Remove the current person from this group
          const removeFromGroup = async () => {
            try {
              await dispatch(
                togglePersonInGroup(
                  currentNetworkId,
                  groupId,
                  currentPersonId,
                  false,
                ),
              )
            } catch (error) {
              console.error(error)
            }
          }

          // FUNCTION | Function passed as render props to render badge content for this group
          const renderGroupBadge = (groupName: string) => {
            return (
              <React.Fragment>
                {/* Group name */}
                <span>{groupName}</span>

                {/* In edit mode? Show a "remove group" icon/button */}
                {props.isEditing && (
                  <Icons.FormClose
                    aria-label="Remove from group"
                    onClick={removeFromGroup}
                    style={{ cursor: "pointer" }}
                  />
                )}
              </React.Fragment>
            )
          }

          return (
            <Badge
              key={`${group.name}-badge-${index}`}
              name={group.name}
              backgroundColor={group.backgroundColor}
              textColor={group.textColor}
              render={renderGroupBadge}
            />
          )
        })}
    </Box>
  )

  return (
    <Header
      direction="column"
      background="brand"
      pad="medium"
      justify="start"
      gap="xsmall"
    >
      <PersonThumbnail isEditing={props.isEditing} />
      {props.isEditing ? (
        <TextInput
          value={personName}
          textAlign="center"
          onClick={(e) => {
            e.currentTarget.select()
          }}
          onChange={handleNameChange}
          onKeyDown={(e) => {
            // Trigger save when Escape or Enter are pressed
            // Use target instead of current target since currentTarget might be the document, which doesn't have a .blur() method
            if (/(Enter|Escape)/.test(e.key))
              (e.target as HTMLInputElement).blur()
          }}
          onBlur={handleUpdateName}
        />
      ) : (
        <h1 aria-label="Name" style={headerStyles}>
          {personName}
        </h1>
      )}

      {GroupBadges}

      <OverlayButtons
        isEditing={props.isEditing}
        setIsEditing={props.setIsEditing}
      />
    </Header>
  )
}

const headerStyles: CSSProperties = {
  padding: "1rem",
  margin: 0,
  lineHeight: "2rem",
  whiteSpace: "break-spaces",
  wordWrap: "break-word",
  wordBreak: "break-all",
  overflow: "auto",
  height: "4rem",
}

export default PersonHeader
