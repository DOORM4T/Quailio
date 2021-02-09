import { Editor } from "@tinymce/tinymce-react"
import { Text } from "grommet"
import React from "react"
import { Editor as TinyMCEEditor } from "tinymce"
import { TINY_MCE_KEY } from "../.tinyMCEKey"
import {
  addUnsavedChangeListener,
  removeUnsavedChangeListener,
} from "../helpers/unsavedChangeEvent"

const INITIAL_VALUE = "<p>Write anything!</p>"
const ContentEditor: React.FC<IProps> = (props) => {
  const [editorContent, setEditorContent] = React.useState(
    props.content || INITIAL_VALUE,
  )

  const [isSaved, setIsSaved] = React.useState(true)

  const handleEditorChange = (newContent: string, editor: TinyMCEEditor) => {
    setEditorContent(newContent)
    setIsSaved(false)
  }

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

  /* Call the save method from props */
  const handleSave = async () => {
    await props.handleSave(editorContent)
    setIsSaved(true)
  }

  return (
    <article id={props.id} style={{ height: "100%" }}>
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
          }}
          onSaveContent={handleSave}
          onEditorChange={handleEditorChange}
          value={editorContent}
        />
      </React.Fragment>
    </article>
  )
}

interface IProps {
  id: string
  content?: string
  handleSave: (content: string) => void
}

export default ContentEditor
