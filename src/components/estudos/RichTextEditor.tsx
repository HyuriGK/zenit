'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import { Extension } from '@tiptap/core';
import { ResizableImage } from './ResizableImage';
import DOMPurify from 'dompurify';
import { upload } from '@vercel/blob/client';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo,
  Highlighter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// Configuração de sanitização para prevenir XSS
const DOMPURIFY_CONFIG = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike',
    'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre',
    'img', 'a', 'span', 'div', 'mark', 'hr', 'sub', 'sup',
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
    'figure', 'figcaption', 'details', 'summary'
  ],
  ALLOWED_ATTR: [
    'href', 'src', 'alt', 'class', 'style', 'target', 'rel',
    'data-width', 'data-height', 'data-align', 'width', 'height',
    'colspan', 'rowspan', 'scope', 'open'
  ],
  FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
  ALLOW_DATA_ATTR: true,
};

// Função para sanitizar HTML
function sanitizeHTML(html: string): string {
  return DOMPurify.sanitize(html, DOMPURIFY_CONFIG);
}

// Extensão customizada para indentação com Tab e comportamento de Backspace em listas
const ListKeyboardShortcuts = Extension.create({
  name: 'listKeyboardShortcuts',

  addKeyboardShortcuts() {
    return {
      Tab: ({ editor }) => {
        // Se estiver em uma lista, aumenta a indentação do item
        if (editor.isActive('listItem')) {
          // Tenta criar lista aninhada (sink)
          const sinkResult = editor.chain().focus().sinkListItem('listItem').run();
          if (sinkResult) return true;
        }

        // Caso contrário, insere 4 espaços (indentação estilo VS Code)
        editor.chain().focus().insertContent('    ').run();
        return true;
      },
      'Shift-Tab': ({ editor }) => {
        // Se estiver em uma lista, diminui a indentação
        if (editor.isActive('listItem')) {
          return editor.chain().focus().liftListItem('listItem').run();
        }
        return false;
      },
      Backspace: ({ editor }) => {
        // Verifica se estamos em um item de lista
        if (!editor.isActive('listItem')) {
          return false; // Deixa o comportamento padrão
        }

        const { selection } = editor.state;
        const { $from } = selection;

        // Verifica se o cursor está no início do item de lista
        // e se o item está vazio ou o cursor está na posição 0 do texto
        const isAtStart = $from.parentOffset === 0;

        if (isAtStart) {
          // Primeiro tenta diminuir a indentação (lift)
          const liftResult = editor.chain().focus().liftListItem('listItem').run();

          // Se não conseguiu fazer lift (já está no nível mais externo),
          // converte para parágrafo normal
          if (!liftResult) {
            // Verifica se é bulletList ou orderedList e remove
            if (editor.isActive('bulletList')) {
              editor.chain().focus().toggleBulletList().run();
              return true;
            }
            if (editor.isActive('orderedList')) {
              editor.chain().focus().toggleOrderedList().run();
              return true;
            }
          }
          return true;
        }

        return false; // Deixa o comportamento padrão do Backspace
      },
    };
  },
});

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        // Habilita bulletList com inputRules para * e -
        bulletList: {
          keepMarks: true,
          keepAttributes: true,
        },
        listItem: {
          HTMLAttributes: {
            class: 'text-zinc-300',
          },
        },
      }),
      TextStyle,
      Color,
      Underline,
      Highlight.configure({
        multicolor: true,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      ResizableImage,
      ListKeyboardShortcuts,
    ],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      // Sanitizar HTML antes de enviar para prevenir XSS
      const html = editor.getHTML();
      const sanitizedHtml = sanitizeHTML(html);
      onChange(sanitizedHtml);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none min-h-[200px] focus:outline-none px-4 py-3',
      },
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;

        for (let i = 0; i < items.length; i++) {
          const item = items[i];

          // Verifica se é uma imagem
          if (item.type.indexOf('image') !== -1) {
            event.preventDefault();

            const file = item.getAsFile();
            if (!file) continue;

            void (async () => {
              try {
                if (!navigator.onLine) throw new Error('offline');
                const extension = file.type.split('/')[1] || 'png';
                const blob = await upload(
                  `anotacoes/${crypto.randomUUID()}/${crypto.randomUUID()}.${extension}`,
                  file,
                  {
                    access: 'public',
                    handleUploadUrl: '/api/estudos/anotacoes/imagens/upload',
                    multipart: file.size > 4 * 1024 * 1024,
                  },
                );
                const node = view.state.schema.nodes.resizableImage;
                if (node) {
                  view.dispatch(view.state.tr.replaceSelectionWith(node.create({ src: blob.url })));
                }
              } catch (error) {
                console.error('Erro ao enviar imagem:', error);
                const reader = new FileReader();
                reader.onload = () => {
                  const node = view.state.schema.nodes.resizableImage;
                  if (node && typeof reader.result === 'string') {
                    view.dispatch(view.state.tr.replaceSelectionWith(node.create({ src: reader.result })));
                  }
                };
                reader.readAsDataURL(file);
              }
            })();

            return true;
          }
        }

        return false;
      },
    },
  });

  if (!editor) {
    return null;
  }

  // Função helper para verificar se há algo realmente selecionado/ativo
  const hasActiveSelection = () => {
    const { from, to } = editor.state.selection;
    // Verifica apenas se há uma seleção de texto ou um nó de imagem selecionado
    return from !== to || editor.isActive('resizableImage');
  };

  const ToolbarButton = ({
    onClick,
    isActive,
    icon: Icon,
    title
  }: {
    onClick: () => void;
    isActive?: boolean;
    icon: typeof Bold;
    title: string;
  }) => (
    <Button
      type="button"
      onClick={onClick}
      variant="ghost"
      size="sm"
      className={`h-8 w-8 p-0 ${
        isActive ? 'bg-green-600 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-700'
      }`}
      title={title}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );

  const ColorButton = ({ color, title }: { color: string; title: string }) => {
    const isActive = editor.isActive('textStyle', { color });
    return (
      <Button
        type="button"
        onClick={() => editor.chain().focus().setColor(color).run()}
        variant="ghost"
        size="sm"
        className={`h-8 w-8 p-0 ${
          isActive ? 'ring-2 ring-green-600 ring-offset-2 ring-offset-zinc-800' : ''
        }`}
        title={title}
      >
        <div className="w-4 h-4 rounded shadow-sm border border-zinc-700/50" style={{ backgroundColor: color }} />
      </Button>
    );
  };

  const HighlightButton = ({ color, title }: { color: string; title: string }) => (
    <Button
      type="button"
      onClick={() => editor.chain().focus().toggleHighlight({ color }).run()}
      variant="ghost"
      size="sm"
      className={`h-8 w-8 p-0 ${
        editor.isActive('highlight', { color }) ? 'ring-2 ring-green-600 ring-offset-2 ring-offset-zinc-800' : ''
      }`}
      title={title}
    >
      <div className="flex items-center justify-center w-5 h-5 rounded shadow-sm border border-zinc-700/50" style={{ backgroundColor: color }}>
        <Highlighter className="h-3 w-3 text-zinc-900" />
      </div>
    </Button>
  );

  return (
    <div className="border border-zinc-700 rounded-lg bg-zinc-900">
      <style jsx global>{`
        .ProseMirror img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          cursor: pointer;
          user-select: none;
          transition: all 0.2s ease;
        }

        .ProseMirror img:hover {
          box-shadow: 0 0 0 2px rgba(168, 85, 247, 0.4);
        }

        .ProseMirror img.ProseMirror-selectednode {
          outline: 2px solid rgb(168, 85, 247);
          outline-offset: 2px;
        }

        .ProseMirror img[data-resize] {
          resize: both;
          overflow: hidden;
        }

        /* Estilos para bullet points */
        .ProseMirror ul {
          list-style-type: disc;
          padding-left: 1.5em;
          margin: 0.5em 0;
        }

        .ProseMirror ul li {
          color: #d4d4d8;
        }

        .ProseMirror ul li::marker {
          color: #a78bfa;
        }

        .ProseMirror ol {
          list-style-type: decimal;
          padding-left: 1.5em;
          margin: 0.5em 0;
        }

        .ProseMirror ol li::marker {
          color: #a78bfa;
        }

        /* Listas aninhadas */
        .ProseMirror ul ul,
        .ProseMirror ol ul {
          list-style-type: circle;
        }

        .ProseMirror ul ul ul,
        .ProseMirror ol ul ul,
        .ProseMirror ul ol ul,
        .ProseMirror ol ol ul {
          list-style-type: square;
        }

        /* Indentação consistente para listas aninhadas */
        .ProseMirror li > ul,
        .ProseMirror li > ol {
          margin-top: 0.25em;
          margin-bottom: 0.25em;
        }
      `}</style>
      {/* Toolbar */}
      <div className="sticky top-0 z-30 border-b border-zinc-700 bg-zinc-900/95 backdrop-blur-md p-2 flex flex-wrap gap-1 shadow-sm transition-all duration-300">
        {/* Undo/Redo */}
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          icon={Undo}
          title="Desfazer"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          icon={Redo}
          title="Refazer"
        />

        <div className="w-px h-8 bg-zinc-700 mx-1" />

        {/* Headings */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={hasActiveSelection() && editor.isActive('heading', { level: 1 })}
          icon={Heading1}
          title="Título 1"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={hasActiveSelection() && editor.isActive('heading', { level: 2 })}
          icon={Heading2}
          title="Título 2"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={hasActiveSelection() && editor.isActive('heading', { level: 3 })}
          icon={Heading3}
          title="Título 3"
        />

        <div className="w-px h-8 bg-zinc-700 mx-1" />

        {/* Text formatting */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={hasActiveSelection() && editor.isActive('bold')}
          icon={Bold}
          title="Negrito"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={hasActiveSelection() && editor.isActive('italic')}
          icon={Italic}
          title="Itálico"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={hasActiveSelection() && editor.isActive('underline')}
          icon={UnderlineIcon}
          title="Sublinhado"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={hasActiveSelection() && editor.isActive('strike')}
          icon={Strikethrough}
          title="Riscado"
        />

        <div className="w-px h-8 bg-zinc-700 mx-1" />

        {/* Lists */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={hasActiveSelection() && editor.isActive('bulletList')}
          icon={List}
          title="Lista"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={hasActiveSelection() && editor.isActive('orderedList')}
          icon={ListOrdered}
          title="Lista numerada"
        />

        <div className="w-px h-8 bg-zinc-700 mx-1" />

        {/* Alignment */}
        <ToolbarButton
          onClick={() => {
            if (editor.isActive('resizableImage')) {
              editor.chain().focus().updateAttributes('resizableImage', { align: 'left' }).run();
            } else {
              editor.chain().focus().setTextAlign('left').run();
            }
          }}
          isActive={
            hasActiveSelection() && (
              (editor.isActive('resizableImage') && editor.isActive('resizableImage', { align: 'left' })) ||
              (!editor.isActive('resizableImage') && editor.isActive({ textAlign: 'left' }))
            )
          }
          icon={AlignLeft}
          title="Alinhar à esquerda"
        />
        <ToolbarButton
          onClick={() => {
            if (editor.isActive('resizableImage')) {
              editor.chain().focus().updateAttributes('resizableImage', { align: 'center' }).run();
            } else {
              editor.chain().focus().setTextAlign('center').run();
            }
          }}
          isActive={
            hasActiveSelection() && (
              (editor.isActive('resizableImage') && editor.isActive('resizableImage', { align: 'center' })) ||
              (!editor.isActive('resizableImage') && editor.isActive({ textAlign: 'center' }))
            )
          }
          icon={AlignCenter}
          title="Centralizar"
        />
        <ToolbarButton
          onClick={() => {
            if (editor.isActive('resizableImage')) {
              editor.chain().focus().updateAttributes('resizableImage', { align: 'right' }).run();
            } else {
              editor.chain().focus().setTextAlign('right').run();
            }
          }}
          isActive={
            hasActiveSelection() && (
              (editor.isActive('resizableImage') && editor.isActive('resizableImage', { align: 'right' })) ||
              (!editor.isActive('resizableImage') && editor.isActive({ textAlign: 'right' }))
            )
          }
          icon={AlignRight}
          title="Alinhar à direita"
        />

        <div className="w-px h-8 bg-zinc-700 mx-1" />

        {/* Text Colors */}
        <ColorButton color="#FFFFFF" title="Branco" />
        <ColorButton color="#EF4444" title="Vermelho" />
        <ColorButton color="#F59E0B" title="Laranja" />
        <ColorButton color="#10B981" title="Verde" />
        <ColorButton color="#3B82F6" title="Azul" />
        <ColorButton color="#8B5CF6" title="Roxo" />

        <div className="w-px h-8 bg-zinc-700 mx-1" />

        {/* Highlight Colors */}
        <HighlightButton color="#FEF3C7" title="Destaque Amarelo" />
        <HighlightButton color="#DBEAFE" title="Destaque Azul" />
        <HighlightButton color="#D1FAE5" title="Destaque Verde" />
        <HighlightButton color="#FCE7F3" title="Destaque Rosa" />
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />
    </div>
  );
}
