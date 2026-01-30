import React, { type ReactNode } from 'react';
import AccessibilityMenu from './AccessibilityMenu';
import VLibras from './VLibras';
import Navbar from './Navbar';

interface LayoutProps {
    children: ReactNode;
    title: string;
}

const Layout: React.FC<LayoutProps> = ({ children, title }) => {
    return (
        <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300 selection:bg-blue-500 selection:text-white">
            <header className="bg-blue-700 text-white p-4 shadow-md dark:bg-blue-900 sticky top-0 z-40">
                <div className="container mx-auto flex items-center justify-between">
                    <h1 className="text-xl md:text-2xl font-bold" tabIndex={0}>
                        {title}
                    </h1>
                    {/* Placeholder for Nav or Profile */}
                    {/* Navbar */}
                    <Navbar />
                </div>
            </header>

            <main
                id="main-content"
                className="flex-grow w-full mx-auto p-4 md:p-6 animate-fade-in"
                role="main"
            >
                {children}
            </main>

            <footer className="bg-gray-200 dark:bg-gray-800 p-6 text-center text-sm text-gray-600 dark:text-gray-400 mt-auto border-t border-gray-300 dark:border-gray-700">
                <p>© 2026 Ouvidoria do Distrito Federal</p>
                <p className="mt-1 text-xs">Acessibilidade WCAG 2.1 AA | PWA Habilitado</p>
            </footer>

            <AccessibilityMenu />
            <VLibras />
        </div>
    );
};

export default Layout;
