import { uiClasses } from "../utils/presentation";
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { EditorContent, useEditor } from '@tiptap/react';
import TextAlign from '@tiptap/extension-text-align';
interface RichTextEditorProps {
    content: string;
    onChange: (value: string) => void;
    placeholder?: string;
}
export default function RichTextEditor({ onChange, placeholder }: RichTextEditorProps) {
    const editor = useEditor({
        editorProps: {
            attributes: {
                class: [
                    "ProseMirror",
                    "min-h-[120px]",
                    "rounded-lg",
                    "border",
                    "border-slate-500",
                    "bg-slate-600",
                    "px-3",
                    "py-2",
                    "text-white",
                    "focus:outline-none",
                    "prose",
                    "prose-invert",
                    "max-w-none"
                ].join(' '),
            },
        },
        extensions: [
            StarterKit.configure({
                bulletList: {
                    keepMarks: true,
                    keepAttributes: false,
                },
                orderedList: {
                    keepMarks: true,
                    keepAttributes: false,
                },
            }),
            Link.configure({
                openOnClick: false,
                autolink: true,
                defaultProtocol: 'https',
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            Placeholder.configure({
                placeholder: placeholder || 'Start typing...',
            }),
        ],
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
    });
    if (!editor)
        return null;
    return (<div>
            
            <div className="flex flex-wrap gap-2">

            
            <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={uiClasses(`px-2 py-1 rounded text-sm ${editor.isActive('bold')
        ? 'bg-blue-600 text-white'
        : 'bg-slate-600 text-slate-300'}`)}>
                Bold
            </button>

            
            <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={uiClasses(`px-2 py-1 rounded text-sm ${editor.isActive('italic')
        ? 'bg-blue-600 text-white'
        : 'bg-slate-600 text-slate-300'}`)}>
                Italic
            </button>

            
            <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={uiClasses(`px-2 py-1 rounded text-sm ${editor.isActive('bulletList')
        ? 'bg-blue-600 text-white'
        : 'bg-slate-600 text-slate-300'}`)}>
                • List
            </button>

            
            <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={uiClasses(`px-2 py-1 rounded text-sm ${editor.isActive('orderedList')
        ? 'bg-blue-600 text-white'
        : 'bg-slate-600 text-slate-300'}`)}>
                1. List
            </button>

            
            <button type="button" onClick={() => editor.chain().focus().setTextAlign('left').run()} className={uiClasses(`px-2 py-1 rounded text-sm ${editor.isActive({ textAlign: 'left' })
        ? 'bg-blue-600 text-white'
        : 'bg-slate-600 text-slate-300'}`)}>
                Left
            </button>

            
            <button type="button" onClick={() => editor.chain().focus().setTextAlign('center').run()} className={uiClasses(`px-2 py-1 rounded text-sm ${editor.isActive({ textAlign: 'center' })
        ? 'bg-blue-600 text-white'
        : 'bg-slate-600 text-slate-300'}`)}>
                Center
            </button>

            
            <button type="button" onClick={() => editor.chain().focus().setTextAlign('right').run()} className={uiClasses(`px-2 py-1 rounded text-sm ${editor.isActive({ textAlign: 'right' })
        ? 'bg-blue-600 text-white'
        : 'bg-slate-600 text-slate-300'}`)}>
                Right
            </button>

            
            <button type="button" onClick={() => {
            const url = window.prompt('Enter URL');
            if (url) {
                editor.chain().focus().setLink({ href: url }).run();
            }
        }} className={uiClasses(`px-2 py-1 rounded text-sm ${editor.isActive('link')
        ? 'bg-blue-600 text-white'
        : 'bg-slate-600 text-slate-300'}`)}>
                Link
            </button>
            </div>

            <EditorContent editor={editor}/>
        </div>);
}
