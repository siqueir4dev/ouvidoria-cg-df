import React from 'react';
import Navbar from '../components/Navbar';
import ProtocolViewer from '../components/ProtocolViewer';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ProtocolsPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="bg-blue-700 text-white">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="font-medium">Voltar</span>
                    </button>
                    <h1 className="text-lg font-bold">Consultar Protocolos</h1>
                    <Navbar />
                </div>
            </div>

            {/* Content */}
            <main className="container mx-auto px-4 py-8">
                <div className="max-w-2xl mx-auto">
                    <ProtocolViewer />
                </div>
            </main>
        </div>
    );
};

export default ProtocolsPage;
