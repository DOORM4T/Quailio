import { Box, Header, Text, TextInput } from "grommet"
import * as Icons from "grommet-icons"
import React, { CSSProperties } from "react"
import { useDispatch, useSelector } from "react-redux"
import { Dispatch } from "redux"
import {
  disconnectPeople,
  updatePersonName,
} from "../../../store/networks/actions"
import {
  getCurrentNetworkId,
  getCurrentNetworkPeople,
} from "../../../store/selectors/networks/getCurrentNetwork"
import { getPersonInFocusData } from "../../../store/selectors/ui/getPersonInFocusData"
import Badge from "../../Badge"
import OverlayButtons from "./OverlayButtons"
import PersonThumbnail from "./PersonThumbnail"

interface IProps {
  isEditing: boolean
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>
}

const PersonHeader: React.FC<IProps> = (props) => {
  const dispatch: Dispatch<any> = useDispatch()
  const person = useSelector(getPersonInFocusData)
  const currentNetworkId = useSelector(getCurrentNetworkId)
  const people = useSelector(getCurrentNetworkPeople)
  const groups = people.filter((p) => p.isGroup)

  const [personName, setPersonName] = React.useState<string>("")

  React.useEffect(() => {
    if (!person) return
    setPersonName(person.name || "")
  }, [person])

  if (!currentNetworkId || !person) return null

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPersonName(e.currentTarget.value)
  }

  const handleUpdateName = async () => {
    // Skip updating if the name didn't change
    if (personName === person.name) return

    try {
      /* Dispatch the name change to the global store */
      await dispatch(updatePersonName(person.id, personName))
    } catch (error) {
      console.error(error)
    }
  }

  const GroupBadges: React.ReactNode = (
    <Box
      direction="row"
      overflow={{ horizontal: "auto", vertical: "hidden" }}
      margin={{ top: "1rem" }}
    >
      {groups
        .filter((group) => group.relationships[person.id] !== undefined)
        .map((group, index) => {
          const removeFromGroup = async () => {
            try {
              await dispatch(
                disconnectPeople(currentNetworkId, {
                  p1Id: person.id,
                  p2Id: group.id,
                }),
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
              backgroundColor={group.backgroundColor || "white"}
              textColor={group.textColor || "black"}
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
          style={{
            backgroundColor: person.backgroundColor
              ? person.backgroundColor
              : "white",
            color: person.textColor ? person.textColor : "black",
          }}
        />
      ) : (
        <h1 aria-label="Name" style={headerStyles}>
          {personName}
        </h1>
      )}
      {person.isGroup && <Text>&nbsp;(group)&nbsp;</Text>}
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
