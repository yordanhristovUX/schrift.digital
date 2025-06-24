import React, { useState, useRef } from 'react';
import { Bold, Italic, List, Type, Undo, Redo } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isEditorFocused, setIsEditorFocused] = useState(false);

  const executeCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  };

  const formatButtons = [
    { command: 'bold', icon: Bold, title: 'Bold (Ctrl+B)' },
    { command: 'italic', icon: Italic, title: 'Italic (Ctrl+I)' },
    { command: 'insertUnorderedList', icon: List, title: 'Bullet List' },
  ];

  const sizeButtons = [
    { command: 'fontSize', value: '1', label: 'Small', title: 'Small Text' },
    { command: 'fontSize', value: '3', label: 'Normal', title: 'Normal Text' },
    { command: 'fontSize', value: '5', label: 'Large', title: 'Large Text' },
  ];

  return (
    <div className="border border-gray-300 rounded-md overflow-hidden">
      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-gray-200 p-2 flex items-center space-x-1">
        {/* Format buttons */}
        {formatButtons.map(({ command, icon: Icon, title }) => (
          <button
            key={command}
            type="button"
            onClick={() => executeCommand(command)}
            className="p-2 rounded hover:bg-gray-200 transition-colors"
            title={title}
          >
            <Icon size={16} />
          </button>
        ))}
        
        <div className="w-px h-6 bg-gray-300 mx-2" />
        
        {/* Size buttons */}
        <div className="flex items-center space-x-1">
          <Type size={16} className="text-gray-500" />
          {sizeButtons.map(({ command, value, label, title }) => (
            <button
              key={`${command}-${value}`}
              type="button"
              onClick={() => executeCommand(command, value)}
              className="px-2 py-1 text-xs rounded hover:bg-gray-200 transition-colors"
              title={title}
            >
              {label}
            </button>
          ))}
        </div>
        
        <div className="w-px h-6 bg-gray-300 mx-2" />
        
        {/* Undo/Redo */}
        <button
          type="button"
          onClick={() => executeCommand('undo')}
          className="p-2 rounded hover:bg-gray-200 transition-colors"
          title="Undo (Ctrl+Z)"
        >
          <Undo size={16} />
        </button>
        <button
          type="button"
          onClick={() => executeCommand('redo')}
          className="p-2 rounded hover:bg-gray-200 transition-colors"
          title="Redo (Ctrl+Y)"
        >
          <Redo size={16} />
        </button>
      </div>
      
      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onPaste={handlePaste}
        onFocus={() => setIsEditorFocused(true)}
        onBlur={() => setIsEditorFocused(false)}
        className={`p-3 min-h-[120px] max-h-[300px] overflow-y-auto focus:outline-none ${
          isEditorFocused ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
        }`}
        dangerouslySetInnerHTML={{ __html: value }}
        style={{ 
          fontSize: '14px',
          lineHeight: '1.5'
        }}
        data-placeholder={placeholder}
      />
      
      {/* Placeholder styling */}
      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;