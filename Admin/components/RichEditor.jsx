'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import Youtube from '@tiptap/extension-youtube'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Bold, Italic, List, ListOrdered, Quote, Heading1, Heading2, Heading3, Link as LinkIcon, Image as ImageIcon, Youtube as YT, Undo, Redo, Code } from 'lucide-react'

export default function RichEditor({ value, onChange, placeholder = 'Start writing your news story... (paste from WhatsApp supported)' }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-red-500 underline' } }),
      Image.configure({ HTMLAttributes: { class: 'rounded-lg max-w-full' } }),
      Youtube.configure({ controls: true, nocookie: true, HTMLAttributes: { class: 'rounded-lg w-full aspect-video' } }),
      Placeholder.configure({ placeholder })
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      onChange?.({ html: editor.getHTML(), text: editor.getText() })
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-sm sm:prose-base max-w-none focus:outline-none min-h-[250px] px-4 py-3 text-white'
      }
    },
    immediatelyRender: false
  })

  useEffect(() => {
    if (editor && value && !editor.getHTML().includes(value.slice(0, 50))) {
      editor.commands.setContent(value)
    }
  }, [editor])

  if (!editor) return <div className="min-h-[280px] bg-zinc-900 rounded-lg animate-pulse" />

  const addImage = () => {
    const url = window.prompt('Image URL:')
    if (url) editor.chain().focus().setImage({ src: url }).run()
  }
  const addLink = () => {
    const url = window.prompt('URL:')
    if (url) editor.chain().focus().setLink({ href: url }).run()
  }
  const addYT = () => {
    const url = window.prompt('YouTube URL:')
    if (url) editor.chain().focus().setYoutubeVideo({ src: url }).run()
  }

  const btn = (active) => `h-8 w-8 p-0 ${active ? 'bg-red-600 text-white hover:bg-red-700' : 'text-zinc-300 hover:bg-zinc-800'}`

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
      <div className="flex flex-wrap gap-1 p-2 border-b border-zinc-800 bg-zinc-950 sticky top-0 z-10">
        <Button type="button" size="sm" variant="ghost" className={btn(editor.isActive('heading', { level: 1 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}><Heading1 className="h-4 w-4" /></Button>
        <Button type="button" size="sm" variant="ghost" className={btn(editor.isActive('heading', { level: 2 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 className="h-4 w-4" /></Button>
        <Button type="button" size="sm" variant="ghost" className={btn(editor.isActive('heading', { level: 3 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 className="h-4 w-4" /></Button>
        <div className="w-px bg-zinc-800 mx-1" />
        <Button type="button" size="sm" variant="ghost" className={btn(editor.isActive('bold'))} onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="h-4 w-4" /></Button>
        <Button type="button" size="sm" variant="ghost" className={btn(editor.isActive('italic'))} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="h-4 w-4" /></Button>
        <Button type="button" size="sm" variant="ghost" className={btn(editor.isActive('code'))} onClick={() => editor.chain().focus().toggleCode().run()}><Code className="h-4 w-4" /></Button>
        <div className="w-px bg-zinc-800 mx-1" />
        <Button type="button" size="sm" variant="ghost" className={btn(editor.isActive('bulletList'))} onClick={() => editor.chain().focus().toggleBulletList().run()}><List className="h-4 w-4" /></Button>
        <Button type="button" size="sm" variant="ghost" className={btn(editor.isActive('orderedList'))} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="h-4 w-4" /></Button>
        <Button type="button" size="sm" variant="ghost" className={btn(editor.isActive('blockquote'))} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote className="h-4 w-4" /></Button>
        <div className="w-px bg-zinc-800 mx-1" />
        <Button type="button" size="sm" variant="ghost" className={btn(editor.isActive('link'))} onClick={addLink}><LinkIcon className="h-4 w-4" /></Button>
        <Button type="button" size="sm" variant="ghost" className="h-8 w-8 p-0 text-zinc-300 hover:bg-zinc-800" onClick={addImage}><ImageIcon className="h-4 w-4" /></Button>
        <Button type="button" size="sm" variant="ghost" className="h-8 w-8 p-0 text-zinc-300 hover:bg-zinc-800" onClick={addYT}><YT className="h-4 w-4" /></Button>
        <div className="w-px bg-zinc-800 mx-1" />
        <Button type="button" size="sm" variant="ghost" className="h-8 w-8 p-0 text-zinc-300 hover:bg-zinc-800" onClick={() => editor.chain().focus().undo().run()}><Undo className="h-4 w-4" /></Button>
        <Button type="button" size="sm" variant="ghost" className="h-8 w-8 p-0 text-zinc-300 hover:bg-zinc-800" onClick={() => editor.chain().focus().redo().run()}><Redo className="h-4 w-4" /></Button>
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}
