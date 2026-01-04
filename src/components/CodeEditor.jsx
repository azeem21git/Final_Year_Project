import { useRef, useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { useAuthStore } from '../store/authStore';
import { useCodeSessionStore } from '../store/codeSessionStore';
import { Save, Download, Eye, GitFork, GitMerge, Lock, Sparkles, Zap, Bug, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import { aiService } from '../services/aiService';

export default function CodeEditor({ session, readOnly = false, onFork, onMergeRequest, showForkButton = false }) {
  const { user } = useAuthStore();
  const { updateCode, updateCursorPosition, updateSelection } = useCodeSessionStore();
  const editorRef = useRef(null);
  const [code, setCode] = useState(session.code);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const saveTimeoutRef = useRef(null);
  const suggestTimeoutRef = useRef(null);
  const [suggestion, setSuggestion] = useState(null);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const [showAIMenu, setShowAIMenu] = useState(false);
  
  // Check if current user owns this session
  const isOwner = session.userId === user.$id;
  const effectiveReadOnly = readOnly || !isOwner;

  useEffect(() => {
    setCode(session.code);
    setHasUnsavedChanges(false);
  }, [session.$id]);

  // Update code from real-time changes
  useEffect(() => {
    if (session.code !== code && !hasUnsavedChanges) {
      setCode(session.code);
    }
  }, [session.code]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      if (suggestTimeoutRef.current) clearTimeout(suggestTimeoutRef.current);
    };
  }, []);

  const handleEditorDidMount = (editor, monaco) => {                                                                              
    editorRef.current = editor;

    // Only track cursor/selection if user owns the session
    if (isOwner && !readOnly) {
      // Track cursor position changes
      editor.onDidChangeCursorPosition((e) => {
        const position = {
          lineNumber: e.position.lineNumber,
          column: e.position.column,
        };
        updateCursorPosition(session.$id, user.$id, position);
      });

      // Track selection changes
      editor.onDidChangeCursorSelection((e) => {
        const selection = {
          startLineNumber: e.selection.startLineNumber,
          startColumn: e.selection.startColumn,
          endLineNumber: e.selection.endLineNumber,
          endColumn: e.selection.endColumn,
        };
        updateSelection(session.$id, user.$id, selection);
      });
    }

    // Render other users' cursors and selections
    renderRemoteCursorsAndSelections(editor, monaco);
  };

  const renderRemoteCursorsAndSelections = (editor, monaco) => {
    // This would need more sophisticated implementation with decorations
    // For now, this is a placeholder for the concept
    const decorations = [];
    
    Object.entries(session.cursorPositions || {}).forEach(([userId, position]) => {
      if (userId !== user.$id) {
        decorations.push({
          range: new monaco.Range(
            position.lineNumber,
            position.column,
            position.lineNumber,
            position.column
          ),
          options: {
            className: 'remote-cursor',
            glyphMarginClassName: 'remote-cursor-glyph',
          },
        });
      }
    });

    if (editorRef.current) {
      editorRef.current.deltaDecorations([], decorations);
    }
  };

  const handleCodeChange = (value) => {
    if (effectiveReadOnly) return; // Don't allow changes if not owner or in watch mode
    setCode(value);
    setHasUnsavedChanges(true);
    setSuggestion(null); // Clear suggestion when code changes

    // Auto-save after 1 second of inactivity
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      handleSave(value);
    }, 1000);

    // Get AI suggestion after typing (debounced)
    if (suggestTimeoutRef.current) {
      clearTimeout(suggestTimeoutRef.current);
    }

    suggestTimeoutRef.current = setTimeout(() => {
      handleAutoSuggest(value);
    }, 1500);
  };

  const handleAutoSuggest = async (codeToAnalyze) => {
    if (effectiveReadOnly || !codeToAnalyze || !codeToAnalyze.trim()) {
      setSuggestion(null);
      return;
    }

    // Avoid calling API for very small inputs
    if (codeToAnalyze.trim().length < 3) {
      setSuggestion(null);
      return;
    }

    setLoadingSuggestion(true);
    try {
      const currentLine = editorRef.current?.getPosition()?.lineNumber || 1;
      const startLine = Math.max(0, currentLine - 5);
      const endLine = currentLine + 5;
      const linesToAnalyze = codeToAnalyze.split('\n').slice(startLine, endLine).join('\n');

      // Debug logs to help troubleshoot connectivity / prompt issues
      console.debug('[AI] Requesting suggestion', { language: session.language, currentLine, startLine, endLine });
      console.debug('[AI] Context preview:', linesToAnalyze.slice(0, 400));

      const suggestion = await aiService.getCodeSuggestion(
        linesToAnalyze,
        session.language,
        currentLine,
        'Provide intelligent code completion suggestions'
      );

      if (suggestion && suggestion.length > 0 && suggestion.length < 500) {
        setSuggestion(suggestion);
      } else {
        setSuggestion(null);
      }
    } catch (error) {
      console.error('Error getting suggestion:', error);
      setSuggestion(null);
      try {
        // Provide lightweight user feedback while keeping console error for debugging
        toast.error('AI suggestion failed — check console for details');
      } catch (e) {}
    } finally {
      setLoadingSuggestion(false);
    }
  };

  const handleAcceptSuggestion = () => {
    if (!suggestion || !editorRef.current) return;
    
    const editor = editorRef.current;
    const position = editor.getPosition();
    const lineContent = editor.getModel().getLineContent(position.lineNumber);
    
    editor.executeEdits('ai-suggestion', [
      {
        range: {
          startLineNumber: position.lineNumber,
          startColumn: lineContent.length + 1,
          endLineNumber: position.lineNumber,
          endColumn: lineContent.length + 1,
        },
        text: ' ' + suggestion,
      },
    ]);
    
    setSuggestion(null);
    toast.success('Suggestion applied!');
  };

  const handleExplainCode = async () => {
    if (!editorRef.current) return;
    
    setLoadingSuggestion(true);
    try {
      const selectedText = editorRef.current.getModel().getValueInRange(
        editorRef.current.getSelection()
      ) || code.substring(0, 500);
      
      const explanation = await aiService.explainCode(selectedText, session.language);
      
      if (explanation) {
        toast.success(explanation);
      }
    } catch {
      toast.error('Failed to explain code');
    } finally {
      setLoadingSuggestion(false);
    }
  };

  const handleOptimizeCode = async () => {
    if (!editorRef.current) return;
    
    setLoadingSuggestion(true);
    try {
      const selectedText = editorRef.current.getModel().getValueInRange(
        editorRef.current.getSelection()
      ) || code.substring(0, 500);
      
      const suggestions = await aiService.optimizeCode(selectedText, session.language);
      
      if (suggestions) {
        toast.success(suggestions);
      }
    } catch {
      toast.error('Failed to optimize code');
    } finally {
      setLoadingSuggestion(false);
    }
  };

  const handleDebugCode = async () => {
    if (!editorRef.current) return;
    
    setLoadingSuggestion(true);
    try {
      const selectedText = editorRef.current.getModel().getValueInRange(
        editorRef.current.getSelection()
      ) || code.substring(0, 500);
      
      const debugSuggestions = await aiService.debugCode(selectedText, session.language);
      
      if (debugSuggestions) {
        toast.success(debugSuggestions);
      }
    } catch {
      toast.error('Failed to debug code');
    } finally {
      setLoadingSuggestion(false);
    }
  };

  const handleSave = async (codeToSave = code) => {
    try {
      await updateCode(session.$id, codeToSave);
      setHasUnsavedChanges(false);
      toast.success('Code saved!');
    } catch (error) {
      toast.error('Failed to save code');
    }
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([code], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${session.title}.${getFileExtension(session.language)}`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success('Code downloaded!');
  };

  const getFileExtension = (language) => {
    const extensions = {
      javascript: 'js',
      typescript: 'ts',
      python: 'py',
      java: 'java',
      cpp: 'cpp',
      go: 'go',
      rust: 'rs',
      html: 'html',
      css: 'css',
    };
    return extensions[language] || 'txt';
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Editor Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
        <div>
          <h3 className="font-medium flex items-center gap-2">
            {readOnly && <Eye className="w-4 h-4 text-green-400" />}
            {!isOwner && !readOnly && <Lock className="w-4 h-4 text-orange-400" />}
            {session.title}
          </h3>
          <p className="text-xs text-gray-400">
            {session.language} • Created by {session.userName}
            {readOnly && <span className="ml-2 text-green-400">• Watch Mode</span>}
            {!isOwner && !readOnly && <span className="ml-2 text-orange-400">• Read Only (Not Your Session)</span>}
            {isOwner && !readOnly && hasUnsavedChanges && <span className="ml-2 text-yellow-500">• Unsaved changes</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* AI Menu */}
          {isOwner && !readOnly && (
            <div className="relative">
              <button
                onClick={() => setShowAIMenu(!showAIMenu)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded transition-colors text-sm ${
                  loadingSuggestion 
                    ? 'bg-yellow-600 hover:bg-yellow-700' 
                    : 'bg-cyan-600 hover:bg-cyan-700'
                }`}
                title="AI Assistant Features"
              >
                <Sparkles className="w-4 h-4" />
                AI
              </button>
              
              {showAIMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-700 rounded shadow-lg z-50">
                  <button
                    onClick={() => {
                      handleExplainCode();
                      setShowAIMenu(false);
                    }}
                    disabled={loadingSuggestion}
                    className="w-full text-left px-4 py-2 hover:bg-gray-800 flex items-center gap-2 text-sm disabled:opacity-50"
                  >
                    <BookOpen className="w-4 h-4" />
                    Explain Code
                  </button>
                  <button
                    onClick={() => {
                      handleOptimizeCode();
                      setShowAIMenu(false);
                    }}
                    disabled={loadingSuggestion}
                    className="w-full text-left px-4 py-2 hover:bg-gray-800 flex items-center gap-2 text-sm disabled:opacity-50"
                  >
                    <Zap className="w-4 h-4" />
                    Optimize
                  </button>
                  <button
                    onClick={() => {
                      handleDebugCode();
                      setShowAIMenu(false);
                    }}
                    disabled={loadingSuggestion}
                    className="w-full text-left px-4 py-2 hover:bg-gray-800 flex items-center gap-2 text-sm disabled:opacity-50 border-t border-gray-700"
                  >
                    <Bug className="w-4 h-4" />
                    Debug Code
                  </button>
                </div>
              )}
            </div>
          )}
          
          {/* Fork button - shown when viewing someone else's session */}
          {!isOwner && showForkButton && onFork && (
            <button
              onClick={onFork}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded transition-colors text-sm"
              title="Fork this session to your own editor"
            >
              <GitFork className="w-4 h-4" />
              Fork
            </button>
          )}
          
          {/* Merge Request button - shown when you have a forked session */}
          {!isOwner && !showForkButton && onMergeRequest && (
            <button
              onClick={onMergeRequest}
              className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded transition-colors text-sm"
              title="Request to merge your changes"
            >
              <GitMerge className="w-4 h-4" />
              Merge Request
            </button>
          )}
          
          {/* Owner controls */}
          {isOwner && !readOnly && (
            <>
              <button
                onClick={() => handleSave()}
                className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 rounded transition-colors text-sm"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded transition-colors text-sm"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </>
          )}
        </div>
      </div>

      {/* AI Suggestion Display */}
      {suggestion && !effectiveReadOnly && (
        <div className="bg-gradient-to-r from-cyan-900 to-blue-900 border-b border-cyan-700 px-4 py-3 flex items-center justify-between">
          <div className="flex items-start gap-3 flex-1">
            <Sparkles className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-cyan-200 font-medium">AI Suggestion</p>
              <p className="text-xs text-cyan-100 mt-1 break-words">{suggestion}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-4 flex-shrink-0">
            <button
              onClick={handleAcceptSuggestion}
              className="px-3 py-1 bg-cyan-600 hover:bg-cyan-700 rounded text-xs font-medium transition-colors"
            >
              Accept
            </button>
            <button
              onClick={() => setSuggestion(null)}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs font-medium transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Loading indicator */}
      {loadingSuggestion && !suggestion && (
        <div className="bg-yellow-900 border-b border-yellow-700 px-4 py-2">
          <p className="text-xs text-yellow-200">🤖 AI is thinking...</p>
        </div>
      )}

      {/* Monaco Editor */}
      <div className="flex-1">
        <Editor
          height="100%"
          language={session.language}
          value={code}
          onChange={handleCodeChange}
          onMount={handleEditorDidMount}
          theme="vs-dark"
          options={{
            fontSize: 14,
            minimap: { enabled: true },
            lineNumbers: 'on',
            roundedSelection: true,
            scrollBeyondLastLine: false,
            readOnly: effectiveReadOnly,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
          }}
        />
      </div>
    </div>
  );
}
