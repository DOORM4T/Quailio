import { Editor } from "@tinymce/tinymce-react"
import deepEqual from "deep-equal"
import { Box, Text } from "grommet"
import React from "react"
import { useDispatch, useSelector } from "react-redux"
import { Dispatch } from "redux"
import { Editor as TinyMCEEditor } from "tinymce"
import { TINY_MCE_KEY } from "../../../.tinyMCEKey"
import {
  addUnsavedChangeListener,
  removeUnsavedChangeListener,
} from "../../../helpers/unsavedChangeEvent"
import { updatePersonContent } from "../../../store/networks/actions/"
import {
  getPersonInFocusData,
  getPersonInFocusId,
} from "../../../store/selectors/ui/getPersonInFocusData"

/* Content on the view panel when the user has no content */
const DEFAULT_VIEW_CONTENT = "<p>Write anything!</p>"

interface IProps {
  id: string
  isEditing: boolean
}

const ContentPanel: React.FC<IProps> = (props) => {
  const dispatch: Dispatch<any> = useDispatch()
  const currentPersonId = useSelector(getPersonInFocusId)
  const initialContent = useSelector(getPersonInFocusData)?.content
  const [editorContent, setEditorContent] = React.useState(initialContent || "")
  const [isSaved, setSaved] = React.useState(true)
  const [isSaving, setSaving] = React.useState(false)

  // Initial editor content changed? Update state--the person in focus changed
  React.useEffect(() => {
    setEditorContent(initialContent || "")
  }, [initialContent])

  // Update saved state when editorContent state changes
  React.useEffect(() => {
    /* Unsaved changes if the new content is different from the initial content */
    const hasContent = initialContent !== undefined
    const didChange = editorContent !== initialContent
    if (hasContent && didChange) setSaved(false)
    else setSaved(true)
  }, [editorContent])

  // Prevent leaving with unsaved changes
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

  /* Do not render if no person is selected */
  if (!currentPersonId) return null

  // Handle controlled input changes
  const handleEditorChange = (newContent: string, editor: TinyMCEEditor) => {
    setEditorContent(newContent)
  }

  // Save to global state
  const handleSave = async () => {
    // Stop if nothing changed
    if (editorContent === initialContent) return

    setSaving(true)
    try {
      await dispatch(updatePersonContent(currentPersonId, editorContent))
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

  return (
    <article id={props.id} style={{ height: "100%" }}>
      {props.isEditing ? (
        <Box direction="column">
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
            value={editorContent}
          />
        </Box>
      ) : (
        <div
          dangerouslySetInnerHTML={{
            __html: initialContent || DEFAULT_VIEW_CONTENT,
          }}
        />
      )}
    </article>
  )
}

export default React.memo(ContentPanel, (props, nextProps) => {
  const skipRerender = deepEqual(props, nextProps)
  return skipRerender
})
