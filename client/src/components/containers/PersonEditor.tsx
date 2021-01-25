import React from "react"
import { Editor } from "@tinymce/tinymce-react"
import { Editor as TinyMCEEditor } from "tinymce"

const PersonEditor: React.FC = () => {
  const handleEditorChange = (content: string, editor: TinyMCEEditor) => {
    console.log(content)
  }

  return (
    <Editor
      initialValue="<p>Initial editor content</p>"
      init={{
        min_height: 500,
        plugins: ["image"],
      }}
      onEditorChange={handleEditorChange}
    />
  )
}

export default PersonEditor
