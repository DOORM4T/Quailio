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
  const initialContent = useSelector(getPersonContent)
  const [editorContent, setEditorContent] = React.useState(
    initialContent || DEFAULT_CONTENT,
  )
  const [isSaved, setSaved] = React.useState(true)
  const [isSaving, setSaving] = React.useState(false)

  // Handle controlled input changes
  const handleEditorChange = (newContent: string, editor: TinyMCEEditor) => {
    setEditorContent(newContent)
    setSaved(false)
  }

  // Save to global state
  const handleSave = async () => {
    // Stop if nothing changed
    if (editorContent === initialContent) return

    setSaving(true)
    try {
      await dispatch(setPersonContent(props.currentPersonId, editorContent))
      setSaved(true)
    } catch (error) {
      console.error(error)
      alert("Failed to save content. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  // Manage listener events to prevent unsaved changes
  const preventUnsavedChanges = async (e: Event) => {
    if (isSaved) return

    /* Exit confirmation when closing the window */
    if (e.type === "beforeunload") {
      e.returnValue = true
      return
    }

    /* Exit confirmation from UI interactions */
    const doExit = window.confirm(
      "There are unsaved changes to this panel's content. Are you sure you want to exit?",
    )

    if (doExit) {
      return
    }

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
            color={
              isSaving
                ? "status-warning"
                : isSaved
                ? "status-success"
                : "status-critical"
            }
          >
            {isSaving ? "Saving..." : isSaved ? "Saved" : "Unsaved Changes"}
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
            onBlur={handleSave}
            value={editorContent}
          />
        </React.Fragment>
      ) : (
        <div
          dangerouslySetInnerHTML={{
            __html: initialContent || "Write anything!",
          }}
        />
      )}
    </article>
  )
}

export default ContentPanel
