import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Typography from '@tiptap/extension-typography';
import CharacterCount from '@tiptap/extension-character-count';
import Highlight from '@tiptap/extension-highlight';
import { TextStyle } from '@tiptap/extension-text-style';
import useBookNotesStore from '../store/bookNotesStore';

import {
  ArrowLeft,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Highlighter,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Minus,
  Undo2,
  Redo2,
  ChevronDown,
  Check,
  Type,
  Save,
} from 'lucide-react';

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatFullDate(isoString) {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

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
  return formatFullDate(isoString);
}

// ─── Toolbar Button ──────────────────────────────────────────────────────────

function ToolbarBtn({ onClick, active, title, children, disabled }) {
  return (
    <button
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
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

// ─── Divider ────────────────────────────────────────────────────────────────

function ToolbarDivider() {
  return <div className="w-px h-5 bg-border-default mx-1 flex-shrink-0" />;
}

// ─── Heading Dropdown ────────────────────────────────────────────────────────

const HEADING_OPTIONS = [
  { label: 'Paragraph', icon: Type, level: 0 },
  { label: 'Heading 1', icon: Heading1, level: 1 },
  { label: 'Heading 2', icon: Heading2, level: 2 },
  { label: 'Heading 3', icon: Heading3, level: 3 },
];

function HeadingDropdown({ editor }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const current = HEADING_OPTIONS.find((o) => {
    if (o.level === 0) return editor?.isActive('paragraph');
    return editor?.isActive('heading', { level: o.level });
  }) || HEADING_OPTIONS[0];

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onMouseDown={(e) => { e.preventDefault(); setOpen((p) => !p); }}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold text-text-secondary hover:text-text-primary hover:bg-bg-subtle transition-all"
      >
        <current.icon size={14} />
        <span className="hidden sm:inline">{current.label}</span>
        <ChevronDown size={12} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 bg-bg-elevated border border-border-default rounded-xl shadow-xl overflow-hidden min-w-[160px]">
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
                  if (opt.level === 0) {
                    editor?.chain().focus().setParagraph().run();
                  } else {
                    editor?.chain().focus().toggleHeading({ level: opt.level }).run();
                  }
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-all ${
                  isActive
                    ? 'bg-accent-primary/10 text-accent-primary'
                    : 'text-text-primary hover:bg-bg-subtle'
                }`}
              >
                <Icon size={16} />
                <span className="font-medium">{opt.label}</span>
                {isActive && <Check size={14} className="ml-auto" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main Editor Page ────────────────────────────────────────────────────────

function NoteEditorPage() {
  const { bookId, noteId } = useParams();
  const navigate = useNavigate();
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
  // Tracks whether we've already seeded state for the current noteId so that
  // setting localId (UUID) doesn't re-trigger the load effect infinitely.
  const initializedRef = useRef(false);

  // TipTap editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true },
      }),
      Placeholder.configure({
        placeholder: "Start writing your note…",
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Typography,
      CharacterCount,
      Highlight.configure({ multicolor: false }),
      TextStyle,
    ],
    content: '',
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      contentRef.current = json;

      if (isInitialLoad) return;

      const words = editor.storage.characterCount.words();
      setWordCount(words);
      setSaved(false);

      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(async () => {
        await handleAutoSave();
      }, 1500);
    },
  });

  // Load existing note — runs only once per (noteId, editor) combination.
  // IMPORTANT: `localId` must NOT be in the dependency array. Setting it inside
  // initNewNote() would otherwise trigger an infinite re-initialization loop
  // that resets the title on every render and breaks navigation.
  useEffect(() => {
    if (!editor) return;
    // Reset the guard whenever the target note changes so switching routes works.
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
          editor.commands.setContent(existing.content);
          setTimeout(() => setIsInitialLoad(false), 100);
        } else {
          initNewNote();
        }
      } else {
        initNewNote();
      }
    };

    loadNote();
  }, [noteId, editor, getNoteByLocalId]);

  const handleAutoSave = async () => {
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
      
      if (noteId === 'new') {
        navigate(`/notes/${bookId}/${localId}`, { replace: true });
      }
    } catch (error) {
      console.error('[NoteEditorPage] auto-save failed:', error);
    }
  };

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    titleRef.current = newTitle;
    setSaved(false);
    
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      await handleAutoSave();
    }, 1500);
  };

  // Clean up
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  if (!editor) return null;

  return (
    <div className="min-h-screen bg-bg-elevated flex flex-col">

      {/* ── Top bar ───────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-50 bg-card-glass backdrop-blur-xl border-b border-border-default">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          {/* Back */}
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-bg-subtle text-text-secondary rounded-xl transition-all group flex-shrink-0"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          </button>

          {/* Save status */}
          <div className="flex items-center gap-2 text-xs text-text-tertiary">
            {saved ? (
              <span className="flex items-center gap-1.5">
                <Check size={12} className="text-emerald-500" /> Saved
              </span>
            ) : (
              <span className="flex items-center gap-1.5 animate-pulse">
                <div className="w-1.5 h-1.5 rounded-full bg-accent-primary" />
                Saving…
              </span>
            )}
          </div>

          {/* Spacer */}
          <div className="w-8" />
        </div>
      </div>

      {/* ── Editor area ───────────────────────────────────────────────────── */}
      <div className="flex-1 max-w-4xl w-full mx-auto px-6 md:px-16 py-10 md:py-16 flex flex-col gap-0">

        {/* Title */}
        <textarea
          value={title}
          onChange={handleTitleChange}
          placeholder="Untitled"
          rows={1}
          spellCheck
          className="w-full resize-none bg-transparent text-text-primary font-display font-bold text-4xl md:text-5xl leading-tight placeholder:text-text-placeholder focus:outline-none overflow-hidden"
          style={{ height: 'auto' }}
          onInput={(e) => {
            e.target.style.height = 'auto';
            e.target.style.height = e.target.scrollHeight + 'px';
          }}
        />

        {/* ── Properties panel ─────────────────────────────────────────── */}
        <div className="mt-6 mb-8 flex flex-col gap-1.5">
          <div className="flex items-center gap-0">
            <span className="text-xs text-text-tertiary w-32 flex-shrink-0">Last edited</span>
            <span className="text-xs text-text-secondary font-medium">
              {formatRelative(lastEdited)}
            </span>
          </div>

          <div className="flex items-center gap-0">
            <span className="text-xs text-text-tertiary w-32 flex-shrink-0">Created at</span>
            <span className="text-xs text-text-secondary font-medium">
              {formatFullDate(createdAt)}
            </span>
          </div>

          <div className="flex items-center gap-0">
            <span className="text-xs text-text-tertiary w-32 flex-shrink-0">Word count</span>
            <span className="text-xs text-text-secondary font-medium">
              {wordCount} {wordCount === 1 ? 'word' : 'words'}
            </span>
          </div>
        </div>

        {/* ── Separator ────────────────────────────────────────────────── */}
        <div className="border-t border-border-default mb-6" />

        {/* ── Floating Toolbar ─────────────────────────────────────────── */}
        <div className="sticky top-[61px] z-40 mb-4 -mx-2">
          <div className="bg-bg-elevated/95 backdrop-blur-xl border border-border-default rounded-2xl shadow-lg px-3 py-2 flex items-center gap-0.5 flex-nowrap overflow-x-auto no-scrollbar">

            <HeadingDropdown editor={editor} />
            <ToolbarDivider />

            <ToolbarBtn
              onClick={() => editor.chain().focus().toggleBold().run()}
              active={editor.isActive('bold')}
              title="Bold"
            >
              <Bold size={15} />
            </ToolbarBtn>
            <ToolbarBtn
              onClick={() => editor.chain().focus().toggleItalic().run()}
              active={editor.isActive('italic')}
              title="Italic"
            >
              <Italic size={15} />
            </ToolbarBtn>
            <ToolbarBtn
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              active={editor.isActive('underline')}
              title="Underline"
            >
              <UnderlineIcon size={15} />
            </ToolbarBtn>
            <ToolbarBtn
              onClick={() => editor.chain().focus().toggleStrike().run()}
              active={editor.isActive('strike')}
              title="Strikethrough"
            >
              <Strikethrough size={15} />
            </ToolbarBtn>
            <ToolbarBtn
              onClick={() => editor.chain().focus().toggleHighlight().run()}
              active={editor.isActive('highlight')}
              title="Highlight"
            >
              <Highlighter size={15} />
            </ToolbarBtn>

            <ToolbarDivider />

            <ToolbarBtn
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              active={editor.isActive({ textAlign: 'left' })}
              title="Align Left"
            >
              <AlignLeft size={15} />
            </ToolbarBtn>
            <ToolbarBtn
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              active={editor.isActive({ textAlign: 'center' })}
              title="Align Center"
            >
              <AlignCenter size={15} />
            </ToolbarBtn>
            <ToolbarBtn
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              active={editor.isActive({ textAlign: 'right' })}
              title="Align Right"
            >
              <AlignRight size={15} />
            </ToolbarBtn>

            <ToolbarDivider />

            <ToolbarBtn
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              active={editor.isActive('bulletList')}
              title="Bullet List"
            >
              <List size={15} />
            </ToolbarBtn>
            <ToolbarBtn
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              active={editor.isActive('orderedList')}
              title="Numbered List"
            >
              <ListOrdered size={15} />
            </ToolbarBtn>
            <ToolbarBtn
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              active={editor.isActive('blockquote')}
              title="Blockquote"
            >
              <Quote size={15} />
            </ToolbarBtn>

            <ToolbarDivider />

            <ToolbarBtn
              onClick={() => editor.chain().focus().undo().run()}
              active={false}
              disabled={!editor.can().undo()}
              title="Undo"
            >
              <Undo2 size={15} />
            </ToolbarBtn>
            <ToolbarBtn
              onClick={() => editor.chain().focus().redo().run()}
              active={false}
              disabled={!editor.can().redo()}
              title="Redo"
            >
              <Redo2 size={15} />
            </ToolbarBtn>
          </div>
        </div>

        {/* ── TipTap Editor Content ─────────────────────────────────────── */}
        <EditorContent
          editor={editor}
          className="tiptap-editor flex-1 min-h-[400px] focus:outline-none"
        />
      </div>
    </div>
  );
}

export default NoteEditorPage;
