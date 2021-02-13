import { Header, TextInput } from "grommet"
import React, { CSSProperties } from "react"
import { useDispatch } from "react-redux"
import { Dispatch } from "redux"
import { updatePersonName } from "../../../store/networks/actions"
import { ICurrentNetwork } from "../../../store/networks/networkTypes"
import { setPersonInFocus } from "../../../store/ui/uiActions"
import { IPersonInFocus } from "../../../store/ui/uiTypes"
import OverlayButtons from "./OverlayButtons"
import UploadPersonThumbnail from "./UploadPersonThumbnail"

interface IProps {
  currentNetwork: ICurrentNetwork
  currentPerson: IPersonInFocus
  isEditing: boolean
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>
}

const PersonHeader: React.FC<IProps> = (props) => {
  const dispatch: Dispatch<any> = useDispatch()
  const [personName, setPersonName] = React.useState(props.currentPerson.name)

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPersonName(e.currentTarget.value)
  }

  const handleUpdateName = async () => {
    /* Skip updating if the name didn't change */
    if (personName === props.currentPerson.name) return

    try {
      /* Dispatch the name change to the global store */
      await dispatch(updatePersonName(props.currentPerson.id, personName))

      /* Re-focus on the current person to see the updated name */
      await dispatch(setPersonInFocus(props.currentPerson.id))
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <Header direction="column" background="brand" pad="medium" justify="start">
      <UploadPersonThumbnail
        currentNetwork={props.currentNetwork}
        currentPerson={props.currentPerson}
      />
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
        currentNetwork={props.currentNetwork}
        currentPerson={props.currentPerson}
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
