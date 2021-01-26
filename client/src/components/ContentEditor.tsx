import { Editor } from "@tinymce/tinymce-react"
import React from "react"
import { Editor as TinyMCEEditor } from "tinymce"
import { TINY_MCE_KEY } from "../.tinyMCEKey"
import { Text } from "grommet"

const INITIAL_VALUE = "<p>Write anything!</p>"
const ContentEditor: React.FC<IProps> = (props) => {
  const [content, setContent] = React.useState(INITIAL_VALUE)
  const [isSaved, setIsSaved] = React.useState(true)

  const handleEditorChange = (newContent: string, editor: TinyMCEEditor) => {
    setContent(newContent)
    setIsSaved(false)
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

  /* Call the save method from props */
  const handleSave = async () => {
    await props.handleSave(content)
    setIsSaved(true)
  }

  return (
    <React.Fragment>
      {isSaved ? (
        <Text color="status-success">Saved</Text>
      ) : (
        <Text color="status-critical">Unsaved Changes</Text>
      )}
      <Editor
        apiKey={TINY_MCE_KEY}
        init={{
          height: "100%",
          plugins: ["image", "save"],
          toolbar: ["save"],
          removed_menuitems: "newdocument visualaid",
          save_onsavecallback: () => {
            console.log("Saved.")
          },
        }}
        onSaveContent={handleSave}
        onEditorChange={handleEditorChange}
        value={content}
      />
    </React.Fragment>
  )
}

interface IProps {
  content?: string
  handleSave: (content: string) => void
}

export default ContentEditor
