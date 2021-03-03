import { Header, TextInput } from "grommet"
import React, { CSSProperties } from "react"
import { useDispatch, useSelector } from "react-redux"
import { Dispatch } from "redux"
import { updatePersonName } from "../../../store/networks/actions"
import { getCurrentNetworkId } from "../../../store/selectors/networks/getCurrentNetwork"
import {
  getPersonInFocusId,
  getPersonInFocusName,
} from "../../../store/selectors/ui/getPersonInFocusData"
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

  return (
    <Header direction="column" background="brand" pad="medium" justify="start">
      <PersonThumbnail isEditing={props.isEditing} />
      {props.isEditing ? (
        <TextInput
          value={personName}
          textAlign="center"
          onClick={(e) => e.currentTarget.select()}
          onChange={handleNameChange}
          onKeyDown={(e) => {
            /* Trigger save when Escape or Enter are pressed */
            if (/(Enter|Escape)/.test(e.key)) e.currentTarget.blur()
          }}
          onBlur={handleUpdateName}
        />
      ) : (
        <h1 aria-label="Name" style={headerStyles}>
          {personName}
        </h1>
      )}
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
