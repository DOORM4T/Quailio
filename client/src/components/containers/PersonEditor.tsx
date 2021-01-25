import React from "react"
import { Editor } from "@tinymce/tinymce-react"
import { Editor as TinyMCEEditor } from "tinymce"
import { TINY_MCE_KEY } from "../../.tinyMCEKey"

console.log(TINY_MCE_KEY)

const PersonEditor: React.FC = () => {
  const [content, setContent] = React.useState("")
  const handleEditorChange = (newContent: string, editor: TinyMCEEditor) => {
    setContent(newContent)
  }

  React.useEffect(() => console.log("rerender"))

  return (
    <Editor
      apiKey={TINY_MCE_KEY}
      initialValue="<p>Initial editor content</p>"
      init={{
        min_height: 500,
        plugins: ["image"],
      }}
      onEditorChange={handleEditorChange}
      value={content}
    />
  )
}

export default PersonEditor
