import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Typography from '@tiptap/extension-typography';
import CharacterCount from '@tiptap/extension-character-count';
import Highlight from '@tiptap/extension-highlight';
import { TextStyle } from '@tiptap/extension-text-style';
import useBookNotesStore from '../../../../store/bookNotesStore';

import {
  ArrowLeft, Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Highlighter, AlignLeft, AlignCenter, AlignRight, List, ListOrdered,
  Quote, Undo2, Redo2, ChevronDown, Check, Type, Heading1, Heading2, Heading3,
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRelative(isoString) {
  if (!isoString) return '—';
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay === 1) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatFullDate(isoString) {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ─── Toolbar ──────────────────────────────────────────────────────────────────

function ToolbarBtn({ onClick, active, title, children, disabled }) {
  return (
    <button
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded-lg transition-all duration-150 ${
        active
          ? 'bg-accent-primary text-white shadow-sm'
          : 'text-text-secondary hover:text-text-primary hover:bg-bg-subtle'
      } ${disabled ? 'opacity-30 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <div className="w-px h-4 bg-border-default mx-0.5 flex-shrink-0" />;
}

const HEADING_OPTIONS = [
  { label: 'Paragraph', icon: Type, level: 0 },
  { label: 'H1', icon: Heading1, level: 1 },
  { label: 'H2', icon: Heading2, level: 2 },
  { label: 'H3', icon: Heading3, level: 3 },
];

function HeadingDropdown({ editor }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const current = HEADING_OPTIONS.find((o) => {
    if (o.level === 0) return editor?.isActive('paragraph');
    return editor?.isActive('heading', { level: o.level });
  }) || HEADING_OPTIONS[0];

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onMouseDown={(e) => { e.preventDefault(); setOpen((p) => !p); }}
        className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold text-text-secondary hover:text-text-primary hover:bg-bg-subtle transition-all"
      >
        <current.icon size={13} />
        <ChevronDown size={10} />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 bg-bg-elevated border border-border-default rounded-xl shadow-xl overflow-hidden min-w-[130px]">
          {HEADING_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isActive = opt.level === 0
              ? editor?.isActive('paragraph')
              : editor?.isActive('heading', { level: opt.level });
            return (
              <button
                key={opt.level}
                onMouseDown={(e) => {
                  e.preventDefault();
                  if (opt.level === 0) editor?.chain().focus().setParagraph().run();
                  else editor?.chain().focus().toggleHeading({ level: opt.level }).run();
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-all ${
                  isActive ? 'bg-accent-primary/10 text-accent-primary' : 'text-text-primary hover:bg-bg-subtle'
                }`}
              >
                <Icon size={14} />
                <span className="font-medium">{opt.label}</span>
                {isActive && <Check size={12} className="ml-auto" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

/**
 * ReaderNoteEditor
 * Props:
 *   bookId       – numeric book ID
 *   noteId       – local_id of existing note, or 'new'
 *   onClose      – callback to close the panel (returns to notebook panel or reader)
 */
function ReaderNoteEditor({ bookId, noteId, onClose }) {
  const { saveNote, getNoteByLocalId } = useBookNotesStore();

  const [localId, setLocalId] = useState(null);
  const [title, setTitle] = useState('Untitled');
  const [createdAt, setCreatedAt] = useState(null);
  const [lastEdited, setLastEdited] = useState(null);
  const [wordCount, setWordCount] = useState(0);
  const [saved, setSaved] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const saveTimerRef = useRef(null);
  const titleRef = useRef('Untitled');
  const contentRef = useRef(null);
  const initializedRef = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true },
      }),
      Placeholder.configure({ placeholder: 'Start writing your note…' }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Typography,
      CharacterCount,
      Highlight.configure({ multicolor: false }),
      TextStyle,
      Underline,
    ],
    content: '',
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      contentRef.current = json;
      if (isInitialLoad) return;
      setWordCount(editor.storage.characterCount.words());
      setSaved(false);
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => handleAutoSave(), 1500);
    },
  });

  // Reset init guard when noteId changes
  useEffect(() => {
    if (!editor) return;
    initializedRef.current = false;
  }, [noteId]);

  useEffect(() => {
    if (!editor) return;
    if (initializedRef.current) return;
    initializedRef.current = true;

    const initNewNote = () => {
      const now = new Date().toISOString();
      const newId = crypto.randomUUID();
      setLocalId(newId);
      setCreatedAt(now);
      setLastEdited(now);
      setTitle('Untitled');
      titleRef.current = 'Untitled';
      editor.commands.setContent('');
      setIsInitialLoad(false);
    };

    const loadNote = async () => {
      if (noteId && noteId !== 'new') {
        const existing = await getNoteByLocalId(noteId);
        if (existing) {
          setLocalId(existing.local_id);
          setTitle(existing.title);
          titleRef.current = existing.title;
          setCreatedAt(existing.createdAt);
          setLastEdited(existing.updatedAt);
          setWordCount(existing.word_count || 0);
          contentRef.current = existing.content;
          editor.commands.setContent(existing.content || '');
          setTimeout(() => setIsInitialLoad(false), 100);
          return;
        }
      }
      initNewNote();
    };

    loadNote();
  }, [noteId, editor, getNoteByLocalId]);

  const handleAutoSave = useCallback(async () => {
    if (!localId) return;
    try {
      const noteData = {
        local_id: localId,
        bookId: Number(bookId),
        title: titleRef.current,
        content: contentRef.current || (editor ? editor.getJSON() : null),
        word_count: editor ? editor.storage.characterCount.words() : wordCount,
        createdAt,
      };
      const result = await saveNote(noteData);
      setLastEdited(result.updatedAt);
      setSaved(true);
    } catch (err) {
      console.error('[ReaderNoteEditor] auto-save failed:', err);
    }
  }, [localId, bookId, editor, wordCount, createdAt, saveNote]);

  const handleTitleChange = (e) => {
    const val = e.target.value;
    setTitle(val);
    titleRef.current = val;
    setSaved(false);
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => handleAutoSave(), 1500);
  };

  // Flush on unmount
  useEffect(() => {
    return () => { clearTimeout(saveTimerRef.current); };
  }, []);

  if (!editor) return null;

  return (
    <aside
      className="flex flex-col absolute inset-0 z-[210] bg-bg-elevated lg:relative lg:inset-auto lg:w-[400px] lg:h-full lg:border-r lg:border-border-default lg:shrink-0 shadow-2xl lg:shadow-none animate-in slide-in-from-left duration-300 font-sans"
      onClick={(e) => e.stopPropagation()}
    >
      {/* ── Top bar ── */}
      <div className="sticky top-0 z-50 bg-bg-elevated/95 backdrop-blur-xl border-b border-border-default shrink-0">
        <div className="px-4 py-3 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="p-2 hover:bg-bg-subtle text-text-secondary rounded-xl transition-all group flex-shrink-0"
            title="Back to notebook"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          </button>

          <div className="flex-1 text-center">
            <p className="text-[10px] text-text-tertiary font-bold uppercase tracking-widest">
              {noteId === 'new' ? 'New Note' : 'Edit Note'}
            </p>
          </div>

          {/* Save status */}
          <div className="flex items-center gap-1.5 text-[10px] text-text-tertiary flex-shrink-0">
            {saved ? (
              <span className="flex items-center gap-1">
                <Check size={10} className="text-emerald-500" /> Saved
              </span>
            ) : (
              <span className="flex items-center gap-1 animate-pulse">
                <div className="w-1.5 h-1.5 rounded-full bg-accent-primary" /> Saving…
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Editor area ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-6 flex flex-col gap-0">
        {/* Title */}
        <textarea
          value={title}
          onChange={handleTitleChange}
          placeholder="Untitled"
          rows={1}
          spellCheck
          className="w-full resize-none bg-transparent text-text-primary font-display font-bold text-2xl leading-tight placeholder:text-text-placeholder focus:outline-none overflow-hidden mb-4"
          style={{ height: 'auto' }}
          onInput={(e) => {
            e.target.style.height = 'auto';
            e.target.style.height = e.target.scrollHeight + 'px';
          }}
        />

        {/* Meta */}
        <div className="flex flex-col gap-1 mb-5">
          <div className="flex items-center gap-0">
            <span className="text-[10px] text-text-tertiary w-24 flex-shrink-0">Last edited</span>
            <span className="text-[10px] text-text-secondary font-medium">{formatRelative(lastEdited)}</span>
          </div>
          <div className="flex items-center gap-0">
            <span className="text-[10px] text-text-tertiary w-24 flex-shrink-0">Created</span>
            <span className="text-[10px] text-text-secondary font-medium">{formatFullDate(createdAt)}</span>
          </div>
          <div className="flex items-center gap-0">
            <span className="text-[10px] text-text-tertiary w-24 flex-shrink-0">Words</span>
            <span className="text-[10px] text-text-secondary font-medium">{wordCount}</span>
          </div>
        </div>

        {/* Separator */}
        <div className="border-t border-border-default mb-6" />

        {/* Sticky Floating Toolbar */}
        <div className="sticky top-0 z-30 mb-4 -mx-1">
          <div className="bg-bg-elevated/95 backdrop-blur-xl border border-border-default rounded-2xl shadow-lg px-2 py-1.5 flex items-center gap-0.5 flex-nowrap overflow-x-auto no-scrollbar">
            <HeadingDropdown editor={editor} />
            <ToolbarDivider />
            <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold"><Bold size={13} /></ToolbarBtn>
            <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic"><Italic size={13} /></ToolbarBtn>
            <ToolbarBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline"><UnderlineIcon size={13} /></ToolbarBtn>
            <ToolbarBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough"><Strikethrough size={13} /></ToolbarBtn>
            <ToolbarBtn onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive('highlight')} title="Highlight"><Highlighter size={13} /></ToolbarBtn>
            <ToolbarDivider />
            <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Align Left"><AlignLeft size={13} /></ToolbarBtn>
            <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Center"><AlignCenter size={13} /></ToolbarBtn>
            <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Align Right"><AlignRight size={13} /></ToolbarBtn>
            <ToolbarDivider />
            <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet List"><List size={13} /></ToolbarBtn>
            <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered List"><ListOrdered size={13} /></ToolbarBtn>
            <ToolbarBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Quote"><Quote size={13} /></ToolbarBtn>
            <ToolbarDivider />
            <ToolbarBtn onClick={() => editor.chain().focus().undo().run()} active={false} disabled={!editor.can().undo()} title="Undo"><Undo2 size={13} /></ToolbarBtn>
            <ToolbarBtn onClick={() => editor.chain().focus().redo().run()} active={false} disabled={!editor.can().redo()} title="Redo"><Redo2 size={13} /></ToolbarBtn>
          </div>
        </div>

        {/* TipTap */}
        <EditorContent
          editor={editor}
          className="tiptap-editor flex-1 min-h-[300px] focus:outline-none text-sm"
        />
      </div>
    </aside>
  );
}

export default ReaderNoteEditor;
