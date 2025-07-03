import React, { useEffect, useState } from 'react';
import { Keyboard, Command, Zap, Eye, EyeOff } from 'lucide-react';

interface KeyboardShortcut {
  key: string;
  description: string;
  action: () => void;
  category: 'navigation' | 'upload' | 'clips' | 'general';
  combination?: string[];
}

interface KeyboardShortcutsProps {
  onUpload?: () => void;
  onGenerateClips?: () => void;
  onToggleHelp?: () => void;
  onSettings?: () => void;
  onLogout?: () => void;
}

export default function KeyboardShortcuts({
  onUpload,
  onGenerateClips,
  onToggleHelp,
  onSettings,
  onLogout
}: KeyboardShortcutsProps) {
  const [isHelpVisible, setIsHelpVisible] = useState(false);
  const [lastPressed, setLastPressed] = useState<string>('');

  const shortcuts: KeyboardShortcut[] = [
    // Navigation
    {
      key: 'h',
      combination: ['ctrl', 'h'],
      description: 'Toggle keyboard shortcuts help',
      action: () => {
        setIsHelpVisible(!isHelpVisible);
        onToggleHelp?.();
      },
      category: 'navigation'
    },
    {
      key: ',',
      combination: ['ctrl', ','],
      description: 'Open settings',
      action: () => onSettings?.(),
      category: 'navigation'
    },
    
    // Upload
    {
      key: 'u',
      combination: ['ctrl', 'u'],
      description: 'Open file upload dialog',
      action: () => onUpload?.(),
      category: 'upload'
    },
    
    // Clips
    {
      key: 'g',
      combination: ['ctrl', 'g'],
      description: 'Generate clips from current video',
      action: () => onGenerateClips?.(),
      category: 'clips'
    },
    
    // General
    {
      key: 'Escape',
      description: 'Close modals/dialogs',
      action: () => setIsHelpVisible(false),
      category: 'general'
    },
    {
      key: '?',
      description: 'Show help (alternative)',
      action: () => setIsHelpVisible(!isHelpVisible),
      category: 'general'
    }
  ];

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const { key, ctrlKey, metaKey, altKey, shiftKey } = event;
      
      // Don't interfere with input fields
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
        return;
      }

      // Check for matching shortcuts
      const matchingShortcut = shortcuts.find(shortcut => {
        if (shortcut.combination) {
          const hasCtrl = shortcut.combination.includes('ctrl') && (ctrlKey || metaKey);
          const hasAlt = shortcut.combination.includes('alt') && altKey;
          const hasShift = shortcut.combination.includes('shift') && shiftKey;
          const keyMatches = shortcut.key.toLowerCase() === key.toLowerCase();
          
          return keyMatches && 
                 (shortcut.combination.includes('ctrl') ? hasCtrl : !ctrlKey && !metaKey) &&
                 (shortcut.combination.includes('alt') ? hasAlt : !altKey) &&
                 (shortcut.combination.includes('shift') ? hasShift : !shiftKey);
        } else {
          return shortcut.key === key && !ctrlKey && !metaKey && !altKey;
        }
      });

      if (matchingShortcut) {
        event.preventDefault();
        matchingShortcut.action();
        setLastPressed(formatShortcutDisplay(matchingShortcut));
        
        // Clear the last pressed indicator after 2 seconds
        setTimeout(() => setLastPressed(''), 2000);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, isHelpVisible]);

  const formatShortcutDisplay = (shortcut: KeyboardShortcut): string => {
    if (shortcut.combination) {
      const parts = shortcut.combination.map(part => {
        switch (part) {
          case 'ctrl': return navigator.platform.includes('Mac') ? '⌘' : 'Ctrl';
          case 'alt': return navigator.platform.includes('Mac') ? '⌥' : 'Alt';
          case 'shift': return '⇧';
          default: return part;
        }
      });
      return `${parts.join(' + ')} + ${shortcut.key.toUpperCase()}`;
    }
    return shortcut.key === 'Escape' ? 'Esc' : shortcut.key;
  };

  const groupedShortcuts = shortcuts.reduce((groups, shortcut) => {
    if (!groups[shortcut.category]) {
      groups[shortcut.category] = [];
    }
    groups[shortcut.category].push(shortcut);
    return groups;
  }, {} as Record<string, KeyboardShortcut[]>);

  const categoryLabels = {
    navigation: 'Navigation',
    upload: 'Upload',
    clips: 'Clips',
    general: 'General'
  };

  const categoryIcons = {
    navigation: Command,
    upload: Zap,
    clips: Eye,
    general: Keyboard
  };

  return (
    <>
      {/* Keyboard shortcut indicator */}
      {lastPressed && (
        <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg border border-gray-700">
          <div className="flex items-center space-x-2">
            <Keyboard className="w-4 h-4" />
            <span className="text-sm font-medium">{lastPressed}</span>
          </div>
        </div>
      )}

      {/* Help toggle button */}
      <button
        onClick={() => setIsHelpVisible(!isHelpVisible)}
        className="fixed bottom-4 right-4 z-40 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-colors"
        title="Toggle keyboard shortcuts (Ctrl+H)"
      >
        {isHelpVisible ? <EyeOff className="w-5 h-5" /> : <Keyboard className="w-5 h-5" />}
      </button>

      {/* Keyboard shortcuts help panel */}
      {isHelpVisible && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={() => setIsHelpVisible(false)}
          />
          
          {/* Panel */}
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-xl">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Keyboard className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Keyboard Shortcuts</h2>
                    <p className="text-sm text-gray-600">Speed up your workflow with these shortcuts</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsHelpVisible(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <EyeOff className="w-6 h-6" />
                </button>
              </div>
              
              {/* Content */}
              <div className="p-6 space-y-6">
                {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => {
                  const Icon = categoryIcons[category as keyof typeof categoryIcons];
                  
                  return (
                    <div key={category}>
                      <div className="flex items-center space-x-2 mb-3">
                        <Icon className="w-4 h-4 text-gray-600" />
                        <h3 className="font-medium text-gray-900">
                          {categoryLabels[category as keyof typeof categoryLabels]}
                        </h3>
                      </div>
                      
                      <div className="space-y-2">
                        {categoryShortcuts.map((shortcut, index) => (
                          <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-700">{shortcut.description}</span>
                            <div className="flex items-center space-x-1">
                              {shortcut.combination && shortcut.combination.map((part, i) => (
                                <React.Fragment key={part}>
                                  <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs font-medium text-gray-900 shadow-sm">
                                    {part === 'ctrl' 
                                      ? (navigator.platform.includes('Mac') ? '⌘' : 'Ctrl')
                                      : part === 'alt'
                                      ? (navigator.platform.includes('Mac') ? '⌥' : 'Alt')
                                      : part === 'shift'
                                      ? '⇧'
                                      : part
                                    }
                                  </kbd>
                                  {shortcut.combination && i < shortcut.combination.length - 1 && (
                                    <span className="text-gray-400 text-xs">+</span>
                                  )}
                                </React.Fragment>
                              ))}
                              {shortcut.combination && (
                                <span className="text-gray-400 text-xs">+</span>
                              )}
                              <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs font-medium text-gray-900 shadow-sm">
                                {shortcut.key === 'Escape' ? 'Esc' : shortcut.key.toUpperCase()}
                              </kbd>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="border-t bg-gray-50 px-6 py-4 rounded-b-lg">
                <p className="text-xs text-gray-600 text-center">
                  Press <kbd className="px-1 bg-white border rounded text-xs">Esc</kbd> or click outside to close
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
