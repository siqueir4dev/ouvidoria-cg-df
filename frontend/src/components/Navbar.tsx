import React, { useState } from 'react';
import { Menu, X, ExternalLink, Home, FileText } from 'lucide-react';


const Navbar: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <nav className="relative z-50">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-white hover:bg-blue-600 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-white"
                aria-label="Menu Principal"
            >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={`fixed top-0 right-0 h-full w-64 bg-white dark:bg-gray-800 shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <h2 className="font-bold text-lg text-gray-800 dark:text-gray-100">Menu</h2>
                    <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    <div className="space-y-2">
                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Navegação</h3>

                        <a href="#" className="flex items-center gap-3 p-2 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors">
                            <Home className="w-5 h-5" /> Início
                        </a>
                        <a href="#form-heading" onClick={() => setIsOpen(false)} className="flex items-center gap-3 p-2 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors">
                            <FileText className="w-5 h-5" /> Nova Manifestação
                        </a>
                    </div>

                    <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Links Externos</h3>
                        <a
                            href="https://www.cg.df.gov.br/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-2 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors group"
                        >
                            <ExternalLink className="w-5 h-5 text-blue-500" />
                            <span>Controladoria-Geral DF</span>
                        </a>
                    </div>

                </div>

                <div className="absolute bottom-0 w-full p-4 bg-gray-50 dark:bg-gray-900 text-center text-xs text-gray-500 border-t border-gray-200 dark:border-gray-700">
                    Versão 1.0.0 (Alpha)
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
