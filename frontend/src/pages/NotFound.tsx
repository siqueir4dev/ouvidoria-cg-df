import React from 'react';
import { Link } from 'react-router-dom';
import { Home, AlertTriangle } from 'lucide-react';

const NotFound: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4 text-center">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl max-w-md w-full border border-gray-200 dark:border-gray-700">
                <div className="bg-yellow-100 dark:bg-yellow-900/30 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                    <AlertTriangle className="w-10 h-10 text-yellow-600 dark:text-yellow-500" />
                </div>

                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">404</h1>
                <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">Página não encontrada</h2>

                <p className="text-gray-500 dark:text-gray-400 mb-8">
                    Ops! A página que você está procurando não existe ou foi movida.
                </p>

                <Link
                    to="/"
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors w-full justify-center"
                >
                    <Home className="w-5 h-5" />
                    Voltar ao Início
                </Link>
            </div>
        </div>
    );
};

export default NotFound;
