import React from "react"
import { Editor } from "@tinymce/tinymce-react"
import { Editor as TinyMCEEditor } from "tinymce"
import { TINY_MCE_KEY } from "../../.tinyMCEKey"

const INITIAL_VALUE = "<p>Write anything!</p>"
const PersonEditor: React.FC<IProps> = (props) => {
  const [content, setContent] = React.useState(props.content || INITIAL_VALUE)
  const handleEditorChange = (newContent: string, editor: TinyMCEEditor) => {
    setContent(newContent)
  }

  return (
    <Editor
      apiKey={TINY_MCE_KEY}
      init={{
        height: "100%",
        plugins: ["image"],
      }}
      onEditorChange={handleEditorChange}
      value={content}
    />
  )
}

interface IProps {
  content?: string
}

export default PersonEditor
