'use client';

import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { useRef, useState, useEffect } from 'react';

const ResizableImageComponent = ({ node, updateAttributes, selected }: NodeViewProps) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [startSize, setStartSize] = useState({ width: 0, height: 0 });

  const handleMouseDown = (e: React.MouseEvent, corner: string) => {
    e.preventDefault();
    e.stopPropagation();

    setIsResizing(true);
    setStartPos({ x: e.clientX, y: e.clientY });

    const img = imgRef.current;
    if (img) {
      setStartSize({
        width: img.offsetWidth,
        height: img.offsetHeight,
      });
    }
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startPos.x;
      const deltaY = e.clientY - startPos.y;

      const newWidth = Math.max(100, startSize.width + deltaX);
      const aspectRatio = startSize.width / startSize.height;
      const newHeight = newWidth / aspectRatio;

      updateAttributes({
        width: newWidth,
        height: newHeight,
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, startPos, startSize, updateAttributes]);

  const attrs = node.attrs as {
    src: string;
    alt?: string;
    title?: string;
    width?: number;
    height?: number;
    align?: string;
  };

  const width = attrs.width || 'auto';
  const height = attrs.height || 'auto';
  const align = attrs.align || 'left';

  // Determinar classes de alinhamento
  const getAlignmentClasses = () => {
    switch (align) {
      case 'center':
        return 'mx-auto';
      case 'right':
        return 'ml-auto';
      default:
        return 'mr-auto';
    }
  };

  const getWrapperAlignment = () => {
    switch (align) {
      case 'center':
        return 'flex justify-center';
      case 'right':
        return 'flex justify-end';
      default:
        return 'flex justify-start';
    }
  };

  return (
    <NodeViewWrapper className={`relative group my-2 ${getWrapperAlignment()}`} data-align={align}>
      <div className="relative inline-block">
        <img
          ref={imgRef}
          src={attrs.src}
          alt={attrs.alt || ''}
          title={attrs.title || ''}
          style={{
            width: typeof width === 'number' ? `${width}px` : width,
            height: typeof height === 'number' ? `${height}px` : height,
            maxWidth: '100%',
            borderRadius: '0.5rem',
            cursor: isDragging ? 'grabbing' : 'grab',
            userSelect: 'none',
            display: 'block',
          }}
          className={`${selected ? 'ring-2 ring-green-500' : ''} ${getAlignmentClasses()}`}
          draggable={false}
        />

        {selected && (
          <>
            {/* Resize handle - canto inferior direito */}
            <div
              onMouseDown={(e) => handleMouseDown(e, 'se')}
              className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full cursor-nwse-resize z-10"
              style={{
                transform: 'translate(50%, 50%)',
              }}
            />

            {/* Resize handle - canto inferior esquerdo */}
            <div
              onMouseDown={(e) => handleMouseDown(e, 'sw')}
              className="absolute bottom-0 left-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full cursor-nesw-resize z-10"
              style={{
                transform: 'translate(-50%, 50%)',
              }}
            />

            {/* Resize handle - canto superior direito */}
            <div
              onMouseDown={(e) => handleMouseDown(e, 'ne')}
              className="absolute top-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full cursor-nesw-resize z-10"
              style={{
                transform: 'translate(50%, -50%)',
              }}
            />

            {/* Resize handle - canto superior esquerdo */}
            <div
              onMouseDown={(e) => handleMouseDown(e, 'nw')}
              className="absolute top-0 left-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full cursor-nwse-resize z-10"
              style={{
                transform: 'translate(-50%, -50%)',
              }}
            />
          </>
        )}
      </div>
    </NodeViewWrapper>
  );
};

export const ResizableImage = Node.create({
  name: 'resizableImage',
  group: 'block',
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      alt: {
        default: null,
      },
      title: {
        default: null,
      },
      width: {
        default: null,
        parseHTML: (element) => {
          const width = element.getAttribute('width');
          return width ? parseInt(width) : null;
        },
      },
      height: {
        default: null,
        parseHTML: (element) => {
          const height = element.getAttribute('height');
          return height ? parseInt(height) : null;
        },
      },
      align: {
        default: 'left',
        parseHTML: (element) => {
          return element.getAttribute('data-align') || 'left';
        },
        renderHTML: (attributes) => {
          return {
            'data-align': attributes.align,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'img[src]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['img', mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageComponent);
  },
});
