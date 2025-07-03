import { useState, useEffect } from 'react';
import { Keyboard, X, Command } from 'lucide-react';

interface KeyboardShortcutsProps {
  onClose: () => void;
}

const KeyboardShortcuts = ({ onClose }: KeyboardShortcutsProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const shortcuts = [
    { key: '/', description: 'Search clips', category: 'Navigation' },
    { key: 'Esc', description: 'Close modals/menus', category: 'Navigation' },
    { key: 'Space', description: 'Play/pause video preview', category: 'Video' },
    { key: 'G', description: 'Switch to grid view', category: 'View' },
    { key: 'L', description: 'Switch to list view', category: 'View' },
    { key: 'N', description: 'New upload', category: 'Actions' },
    { key: 'D', description: 'Download selected', category: 'Actions' },
    { key: '?', description: 'Show keyboard shortcuts', category: 'Help' },
  ];

  const categories = [...new Set(shortcuts.map(s => s.category))];

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div 
        className={`bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden transform transition-all duration-300 ${
          isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Keyboard className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Keyboard Shortcuts</h2>
                <p className="text-blue-100 text-sm">Boost your productivity</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {categories.map(category => (
            <div key={category} className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <span className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mr-3"></span>
                {category}
              </h3>
              <div className="space-y-2">
                {shortcuts
                  .filter(shortcut => shortcut.category === category)
                  .map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <span className="text-gray-700">{shortcut.description}</span>
                      <div className="flex items-center space-x-1">
                        {shortcut.key === 'Space' ? (
                          <kbd className="px-3 py-1 bg-white border border-gray-300 rounded-lg text-xs font-mono text-gray-600 shadow-sm">
                            Space
                          </kbd>
                        ) : shortcut.key === 'Esc' ? (
                          <kbd className="px-3 py-1 bg-white border border-gray-300 rounded-lg text-xs font-mono text-gray-600 shadow-sm">
                            Esc
                          </kbd>
                        ) : (
                          <>
                            {navigator.platform.includes('Mac') && (
                              <kbd className="px-2 py-1 bg-white border border-gray-300 rounded-lg text-xs font-mono text-gray-600 shadow-sm flex items-center">
                                <Command className="w-3 h-3" />
                              </kbd>
                            )}
                            {!navigator.platform.includes('Mac') && shortcut.key !== '/' && shortcut.key !== '?' && (
                              <kbd className="px-2 py-1 bg-white border border-gray-300 rounded-lg text-xs font-mono text-gray-600 shadow-sm">
                                Ctrl
                              </kbd>
                            )}
                            <span className="text-gray-400">+</span>
                            <kbd className="px-2 py-1 bg-white border border-gray-300 rounded-lg text-xs font-mono text-gray-600 shadow-sm">
                              {shortcut.key}
                            </kbd>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-6 py-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>💡</span>
              <span>Tip: Most shortcuts work anywhere in the app</span>
            </div>
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 text-sm font-medium"
            >
              Got it!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcuts;
