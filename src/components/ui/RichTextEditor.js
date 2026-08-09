'use client';
/**
 * RichTextEditor
 * src/components/ui/RichTextEditor.js
 *
 * A what-you-see-is-what-you-get editor: headings, bold/italic/underline,
 * lists with indent and outdent, alignment, links, images, quotes and code.
 *
 * Markdown could not express half of this — it has no indent, no alignment and
 * no underline — which is why the stored format is HTML rather than markdown.
 *
 * NEVER import this directly into a page. Import RichTextEditorLoader instead,
 * which loads it on demand: Tiptap is ~150KB, and shipping that to every
 * visitor who only wants to READ the site would undo the loading work.
 *
 * Typing markdown shortcuts still works — `## ` makes a heading, `- ` starts a
 * list, `> ` a quote — so muscle memory carries over.
 */

import Highlight from '@tiptap/extension-highlight';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  AlignCenter, AlignJustify, AlignLeft, AlignRight,
  Bold, Code, Eraser, Heading1, Heading2, Heading3,
  Highlighter, ImagePlus, Indent, Italic, Link2, Link2Off,
  List, ListOrdered, Minus, Outdent, Quote, Redo2,
  Strikethrough, Underline as UnderlineIcon, Undo2,
} from 'lucide-react';
import { useCallback, useEffect } from 'react';
import { PROSE_CLASSES } from './RichContent';

function Btn({ onClick, active, disabled, title, children }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active || undefined}
      disabled={disabled}
      // Editors lose their selection when a button steals focus, so the
      // mousedown default must be prevented before the click lands.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`p-1.5 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${active
          ? 'bg-[var(--accent)] text-[var(--accent-contrast)]'
          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
        }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="w-px h-5 bg-[var(--border)] mx-0.5 shrink-0" aria-hidden="true" />;
}

export default function RichTextEditor({
  value = '',
  onChange,
  placeholder = 'Start writing…',
  minHeight = 160,
  autoFocus = false,
  onImageRequest,
}) {
  const editor = useEditor({
    immediatelyRender: false, // required in Next: avoids an SSR hydration mismatch
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: { HTMLAttributes: { class: 'rounded-lg' } },
      }),
      Underline,
      Highlight,
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder }),
      Image.configure({ HTMLAttributes: { class: 'rounded-xl' } }),
    ],
    content: value || '',
    editorProps: {
      attributes: {
        class: `${PROSE_CLASSES} focus:outline-none`.replace(/\s+/g, ' ').trim(),
        style: `min-height:${minHeight}px`,
      },
    },
    onUpdate: ({ editor: e }) => {
      const html = e.getHTML();
      // Tiptap represents "empty" as an empty paragraph; report it as ''.
      onChange?.(html === '<p></p>' ? '' : html);
    },
    autofocus: autoFocus ? 'end' : false,
  });

  // Sync when the parent replaces the value (switching to a different field),
  // but never while the user is typing — that would fight their cursor.
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    const next = value || '';
    if (next !== current && !editor.isFocused) {
      editor.commands.setContent(next, false);
    }
  }, [value, editor]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const previous = editor.getAttributes('link').href;
    const url = window.prompt('Link URL (leave empty to remove)', previous || 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const addImage = useCallback(async () => {
    if (!editor) return;
    if (onImageRequest) {
      const url = await onImageRequest();
      if (url) editor.chain().focus().setImage({ src: url }).run();
      return;
    }
    const url = window.prompt('Image URL');
    if (url) editor.chain().focus().setImage({ src: url }).run();
  }, [editor, onImageRequest]);

  if (!editor) {
    return (
      <div
        className="rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] animate-pulse"
        style={{ minHeight: minHeight + 44 }}
      />
    );
  }

  const inList = editor.isActive('bulletList') || editor.isActive('orderedList');

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] overflow-hidden focus-within:border-[var(--accent)] transition-colors">
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
        <Btn title="Heading 1" active={editor.isActive('heading', { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
          <Heading1 size={15} />
        </Btn>
        <Btn title="Heading 2" active={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 size={15} />
        </Btn>
        <Btn title="Heading 3" active={editor.isActive('heading', { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          <Heading3 size={15} />
        </Btn>

        <Divider />

        <Btn title="Bold (Ctrl+B)" active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold size={15} />
        </Btn>
        <Btn title="Italic (Ctrl+I)" active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic size={15} />
        </Btn>
        <Btn title="Underline (Ctrl+U)" active={editor.isActive('underline')}
          onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <UnderlineIcon size={15} />
        </Btn>
        <Btn title="Strikethrough" active={editor.isActive('strike')}
          onClick={() => editor.chain().focus().toggleStrike().run()}>
          <Strikethrough size={15} />
        </Btn>
        <Btn title="Highlight" active={editor.isActive('highlight')}
          onClick={() => editor.chain().focus().toggleHighlight().run()}>
          <Highlighter size={15} />
        </Btn>

        <Divider />

        <Btn title="Bullet list" active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List size={15} />
        </Btn>
        <Btn title="Numbered list" active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered size={15} />
        </Btn>
        {/* Indent only has meaning inside a list — disabled elsewhere rather
            than silently doing nothing. */}
        <Btn title="Indent (Tab)" disabled={!inList}
          onClick={() => editor.chain().focus().sinkListItem('listItem').run()}>
          <Indent size={15} />
        </Btn>
        <Btn title="Outdent (Shift+Tab)" disabled={!inList}
          onClick={() => editor.chain().focus().liftListItem('listItem').run()}>
          <Outdent size={15} />
        </Btn>

        <Divider />

        <Btn title="Align left" active={editor.isActive({ textAlign: 'left' })}
          onClick={() => editor.chain().focus().setTextAlign('left').run()}>
          <AlignLeft size={15} />
        </Btn>
        <Btn title="Align centre" active={editor.isActive({ textAlign: 'center' })}
          onClick={() => editor.chain().focus().setTextAlign('center').run()}>
          <AlignCenter size={15} />
        </Btn>
        <Btn title="Align right" active={editor.isActive({ textAlign: 'right' })}
          onClick={() => editor.chain().focus().setTextAlign('right').run()}>
          <AlignRight size={15} />
        </Btn>
        <Btn title="Justify" active={editor.isActive({ textAlign: 'justify' })}
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}>
          <AlignJustify size={15} />
        </Btn>

        <Divider />

        <Btn title="Link" active={editor.isActive('link')} onClick={setLink}>
          <Link2 size={15} />
        </Btn>
        <Btn title="Remove link" disabled={!editor.isActive('link')}
          onClick={() => editor.chain().focus().unsetLink().run()}>
          <Link2Off size={15} />
        </Btn>
        <Btn title="Image" onClick={addImage}>
          <ImagePlus size={15} />
        </Btn>
        <Btn title="Quote" active={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <Quote size={15} />
        </Btn>
        <Btn title="Code block" active={editor.isActive('codeBlock')}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
          <Code size={15} />
        </Btn>
        <Btn title="Divider" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
          <Minus size={15} />
        </Btn>

        <Divider />

        <Btn title="Clear formatting"
          onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}>
          <Eraser size={15} />
        </Btn>
        <Btn title="Undo (Ctrl+Z)" disabled={!editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}>
          <Undo2 size={15} />
        </Btn>
        <Btn title="Redo (Ctrl+Y)" disabled={!editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}>
          <Redo2 size={15} />
        </Btn>
      </div>

      <div className="px-4 py-3">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}