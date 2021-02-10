import { Editor } from "@tinymce/tinymce-react"
import { Text } from "grommet"
import React from "react"
import { useDispatch, useSelector } from "react-redux"
import { Dispatch } from "redux"
import { Editor as TinyMCEEditor } from "tinymce"
import { TINY_MCE_KEY } from "../../../.tinyMCEKey"
import {
  addUnsavedChangeListener,
  removeUnsavedChangeListener,
} from "../../../helpers/unsavedChangeEvent"
import { getPersonContent } from "../../../store/selectors/ui/getPersonContent"
import { setPersonContent } from "../../../store/ui/uiActions"

const DEFAULT_CONTENT = "<p>Write anything!</p>"

interface IProps {
  id: string
  currentPersonId: string
  isEditing: boolean
}

const ContentPanel: React.FC<IProps> = (props) => {
  const dispatch: Dispatch<any> = useDispatch()
  const content = useSelector(getPersonContent)
  const [editorContent, setEditorContent] = React.useState(
    content || DEFAULT_CONTENT,
  )
  const [isSaved, setIsSaved] = React.useState(true)

  React.useEffect(() => {
    console.log("rerender")
    console.log(editorContent)
  }, [props.currentPersonId])

  // Handle controlled input changes
  const handleEditorChange = (newContent: string, editor: TinyMCEEditor) => {
    setEditorContent(newContent)
    setIsSaved(false)
  }

  // Save to global state
  const handleSave = async () => {
    await dispatch(setPersonContent(props.currentPersonId, editorContent))
    setIsSaved(true)
  }

  // Manage listener events to prevent unsaved changes
  const preventUnsavedChanges = (e: Event) => {
    if (isSaved) return

    /* Exit confirmation when closing the window */
    if (e.type === "beforeunload") {
      e.returnValue = true
      return
    }

    /* Exit confirmation from UI interactions */
    const doExit = window.confirm(
      "You have unsaved changes. Are you sure you want to exit?",
    )

    if (doExit) return

    e.preventDefault()
  }

  React.useEffect(() => {
    if (isSaved) {
      /* Safe to close the window. Remove the prevention listener, if there is one */
      removeUnsavedChangeListener(preventUnsavedChanges)
    } else {
      /* Prevent window closing if there are unsaved changes */
      addUnsavedChangeListener(preventUnsavedChanges)
    }

    return () => {
      /* Remove the prevention listener when this component unmounts */
      removeUnsavedChangeListener(preventUnsavedChanges)
    }
  }, [isSaved])

  return (
    <article id={props.id} style={{ height: "100%" }}>
      {props.isEditing ? (
        <React.Fragment>
          <Text
            className="content-editor-save-status"
            color={isSaved ? "status-success" : "status-critical"}
          >
            {isSaved ? "Saved" : "Unsaved Changes"}
          </Text>
          <Editor
            apiKey={TINY_MCE_KEY}
            init={{
              min_height: 400,
              plugins: ["image", "save"],
              toolbar: ["save"],
              removed_menuitems: "newdocument visualaid",
              save_onsavecallback: () => {
                console.log("Saved.")
              },
              auto_focus: true,
            }}
            onSaveContent={handleSave}
            onEditorChange={handleEditorChange}
            value={editorContent}
          />
        </React.Fragment>
      ) : (
        <div
          dangerouslySetInnerHTML={{
            __html: content || "Write anything!",
          }}
        />
      )}
    </article>
  )
}

export default ContentPanel
