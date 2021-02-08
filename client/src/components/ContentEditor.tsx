import { Editor } from "@tinymce/tinymce-react"
import { Text } from "grommet"
import React from "react"
import { Editor as TinyMCEEditor } from "tinymce"
import { TINY_MCE_KEY } from "../.tinyMCEKey"

const INITIAL_VALUE = "<p>Write anything!</p>"
const ContentEditor: React.FC<IProps> = (props) => {
  const [content, setContent] = React.useState(INITIAL_VALUE)
  const [isSaved, setIsSaved] = React.useState(true)

  const handleEditorChange = (newContent: string, editor: TinyMCEEditor) => {
    setContent(newContent)
    /* Content should be already saved outside of edit mode */
    if (props.editMode) setIsSaved(false)
  }

  const preventUnsavedChanges = (e: Event) => {
    e.preventDefault()
    e.returnValue = true
  }

  React.useEffect(() => {
    if (isSaved) {
      /* Safe to close the window. Remove the prevention listener, if there is one */
      window.removeEventListener("beforeunload", preventUnsavedChanges)
    } else {
      /* Prevent window closing if there are unsaved changes */
      window.addEventListener("beforeunload", preventUnsavedChanges)
    }

    return () => {
      /* Remove the prevention listener when this component unmounts */
      window.removeEventListener("beforeunload", preventUnsavedChanges)
    }
  }, [isSaved])

  /* Set content state when passed props change */
  React.useEffect(() => {
    setContent(props.content || INITIAL_VALUE)

    /* Loaded content doesn't need to be saved until the user changes it */
    setIsSaved(true)
  }, [props.content])

  React.useEffect(() => {
    if (isSaved || props.editMode) return

    /* Ask to save unsaved changes when exiting Edit Mode */
    const doSave = window.confirm(
      "You have unsaved changes. Save current changes before exiting Edit Mode?",
    )
    if (doSave) {
      handleSave()
    }
  }, [props.editMode])

  /* Call the save method from props */
  const handleSave = async () => {
    await props.handleSave(content)
    setIsSaved(true)
  }

  return (
    <article id={props.id} style={{ height: "100%" }}>
      {props.editMode ? (
        <React.Fragment>
          <Text
            className="content-editor-save-status"
            color={isSaved ? "status-success" : "status-critical"}
          >
            {isSaved ? "Saved" : "Unsaved Changes"}
          </Text>
          <Editor
            disabled={props.editMode ? false : true}
            apiKey={TINY_MCE_KEY}
            init={{
              min_height: 400,
              height: "90%",
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
            value={content}
          />
        </React.Fragment>
      ) : (
        <div dangerouslySetInnerHTML={{ __html: content }} />
      )}
    </article>
  )
}

interface IProps {
  id: string
  editMode: boolean
  content?: string
  handleSave: (content: string) => void
}

export default ContentEditor
