import deepEqual from "deep-equal"
import { Box, Button, Text } from "grommet"
import React from "react"
import ReactQuill from "react-quill"
import "react-quill/dist/quill.snow.css"
import { useDispatch, useSelector } from "react-redux"
import { Dispatch } from "redux"
import {
  addUnsavedChangeListener,
  removeUnsavedChangeListener,
} from "../../../helpers/unsavedChangeEvent"
import { updatePersonContent } from "../../../store/networks/actions/"
import {
  getPersonInFocusData,
  getPersonInFocusId,
} from "../../../store/selectors/ui/getPersonInFocusData"
import * as Icons from "grommet-icons"

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

  React.useEffect(() => {
    setEditorContent(initialContent || "")
  }, [initialContent])

  // Update saved state when editorContent state changes
  React.useEffect(() => {
    // QuillJS uses these tags to denote the first, empty line -- this is the same as having no content
    const isEmpty = editorContent === "<p><br></p>"

    // Check if the user updated content (replace newline chars and trim to remove extraneous changes (such as newlines) from the QuillJS editor)
    const editorContentWithoutBreaks = editorContent
      .replace(/<p><br><\/p>/g, "")
      .replaceAll("\n", "")
      .trim()
    const initialWithoutBreaks =
      initialContent
        ?.replace(/<p><br><\/p>/g, "")
        .replaceAll("\n", "")
        .trim() || ""

    const didChange = editorContentWithoutBreaks !== initialWithoutBreaks
    if (!isEmpty && didChange) setSaved(false)
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
  const handleEditorChange = (content: string) => {
    setEditorContent(content)
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

  // Save upon CTRL+S
  const handleSaveKeyCombo = (e: KeyboardEvent) => {
    if (e.ctrlKey && e.key === "s") {
      e.preventDefault()
      e.stopPropagation()

      handleSave()
    }
  }

  return (
    <article id={props.id} style={{ height: "100%" }}>
      {props.isEditing ? (
        <Box direction="column" fill>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "0.5rem",
            }}
          >
            <Button
              icon={<Icons.StatusGood color="brand" />}
              aria-label="Save content"
              style={{ marginRight: "0.2rem", padding: 0 }}
              hoverIndicator
              onClick={handleSave}
            />
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
          </div>
          <Box height="100vh">
            <ReactQuill
              onChange={handleEditorChange}
              value={editorContent}
              onKeyDown={handleSaveKeyCombo}
              modules={{
                toolbar: [
                  [{ header: [1, 2, 3, 4, 5, 6, false] }],
                  [{ font: [] }],

                  ["bold", "italic", "underline", "strike"],

                  [{ list: "ordered" }, { list: "bullet" }],
                  [{ script: "sub" }, { script: "super" }],

                  [{ color: [] }, { background: [] }],
                  [{ align: [] }],

                  ["clean"], // remove formatting button

                  ["image", "link"],
                ],
              }}
              style={{ height: "100%", maxHeight: 500 }}
            />
          </Box>
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
