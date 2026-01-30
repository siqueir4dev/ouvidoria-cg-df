import React, { useState, useEffect } from 'react';
import { useAccessibility } from '../contexts/AccessibilityContext';
import { Accessibility, X, Type, BookOpen, RotateCcw } from 'lucide-react';

const AccessibilityMenu: React.FC = () => {
    const {
        fontSize,
        highContrast,
        readingMode,
        increaseFont,
        decreaseFont,
        toggleHighContrast,
        toggleReadingMode,
        resetSettings // Fix: Add missing destructuring
    } = useAccessibility();

    const [isOpen, setIsOpen] = useState(false);

    // Keyboard shortcut Alt+A to toggle
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.altKey && e.key.toLowerCase() === 'a') {
                setIsOpen(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <div className="fixed left-4 bottom-12 z-50 flex flex-col-reverse items-start gap-3">
            {isOpen && (
                <div className="bg-white p-4 rounded-lg shadow-2xl mb-2 flex flex-col gap-3 w-72 border border-gray-200 animate-fade-in-up origin-bottom-left">
                    <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Accessibility className="w-6 h-6 text-blue-600" /> Acessibilidade
                        </h3>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
                            aria-label="Fechar menu de acessibilidade"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-gray-50 p-3 rounded-md">
                            <span className="text-sm font-semibold block mb-2 text-gray-700 flex items-center gap-2">
                                <Type className="w-4 h-4" /> Tamanho da Fonte ({fontSize}%)
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={decreaseFont}
                                    className="flex-1 py-2 rounded bg-white border border-gray-300 hover:bg-blue-50 font-bold text-lg shadow-sm transition-colors text-gray-700"
                                    aria-label="Diminuir fonte"
                                >
                                    A-
                                </button>
                                <button
                                    onClick={increaseFont}
                                    className="flex-1 py-2 rounded bg-white border border-gray-300 hover:bg-blue-50 font-bold text-lg shadow-sm transition-colors text-gray-700"
                                    aria-label="Aumentar fonte"
                                >
                                    A+
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={toggleHighContrast}
                            className={`w-full p-3 rounded-md text-left flex justify-between items-center transition-all ${highContrast
                                ? 'bg-yellow-400 text-black font-bold border-2 border-black shadow-md'
                                : 'bg-white border border-gray-300 hover:bg-gray-50 text-gray-700'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <span className="font-bold border border-current rounded px-1 text-xs">HC</span>
                                <span>Alto Contraste</span>
                            </div>
                            {highContrast && <span className="text-xs bg-black text-white px-2 py-0.5 rounded-full">ON</span>}
                        </button>

                        <button
                            onClick={toggleReadingMode}
                            className={`w-full p-3 rounded-md text-left flex justify-between items-center transition-all ${readingMode
                                ? 'bg-blue-100 text-blue-900 border-2 border-blue-400 shadow-md'
                                : 'bg-white border border-gray-300 hover:bg-gray-50 text-gray-700'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <BookOpen className="w-5 h-5" />
                                <span>Modo Leitura</span>
                            </div>
                            {readingMode && <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">ON</span>}
                        </button>
                    </div>

                    <div className="pt-3 border-t border-gray-200 flex justify-between items-center text-xs">
                        <span className="text-gray-500">Atalho: Alt + A</span>
                        <button
                            onClick={resetSettings}
                            className="flex items-center gap-1 text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                        >
                            <RotateCcw className="w-3 h-3" /> Restaurar
                        </button>
                    </div>
                </div>
            )}

            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-r-2xl shadow-xl flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all transform hover:scale-110 active:scale-95 z-50 overflow-hidden"
                aria-label="Abrir menu de acessibilidade (Alt + A)"
                aria-expanded={isOpen}
                title="Acessibilidade (Alt + A)"
            >
                <div className="relative w-full h-full flex items-center justify-center">
                    <Accessibility className="w-8 h-8" strokeWidth={1.5} />
                </div>
            </button>
        </div>
    );
};

export default AccessibilityMenu;
