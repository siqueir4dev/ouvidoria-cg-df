import React, { useState, useEffect } from 'react';
import { Search, Clock, FileText, ChevronRight, X, AlertCircle, Loader2 } from 'lucide-react';

interface ProtocolHistory {
    protocol: string;
    date: string;
    type: string;
}

interface ManifestationDetails {
    id: number;
    protocol: string;
    text: string;
    type: string;
    status: string;
    is_anonymous: boolean;
    name?: string;
    created_at: string;
    responses?: {
        message: string;
        created_at: string;
        is_admin: boolean | number;
    }[];
}

const ProtocolViewer: React.FC = () => {
    const [history, setHistory] = useState<ProtocolHistory[]>([]);
    const [searchProtocol, setSearchProtocol] = useState('');
    const [searchResult, setSearchResult] = useState<ManifestationDetails | null>(null);
    const [searching, setSearching] = useState(false);
    const [error, setError] = useState('');
    const [showDetails, setShowDetails] = useState(false);

    useEffect(() => {
        const savedHistory = localStorage.getItem('manifestationHeaderHistory');
        if (savedHistory) {
            setHistory(JSON.parse(savedHistory));
        }
    }, []);

    const searchByProtocol = async (protocol: string) => {
        if (!protocol.trim()) {
            setError('Digite um número de protocolo.');
            return;
        }

        setSearching(true);
        setError('');
        setSearchResult(null);

        try {
            const response = await fetch(`http://localhost:3000/api/v1/manifestations/${protocol}`);

            if (response.ok) {
                const data = await response.json();
                setSearchResult(data);
                setShowDetails(true);
            } else if (response.status === 404) {
                setError('Protocolo não encontrado.');
            } else {
                setError('Erro ao buscar protocolo.');
            }
        } catch (err) {
            setError('Erro ao conectar com o servidor.');
        } finally {
            setSearching(false);
        }
    };

    const handleHistoryClick = (protocol: string) => {
        setSearchProtocol(protocol);
        searchByProtocol(protocol);
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, { text: string, color: string }> = {
            'received': { text: 'Recebida', color: 'bg-blue-100 text-blue-700' },
            'in_analysis': { text: 'Em Análise', color: 'bg-yellow-100 text-yellow-700' }, // Map in_analysis
            'in_progress': { text: 'Em Análise', color: 'bg-yellow-100 text-yellow-700' },
            'resolved': { text: 'Resolvida', color: 'bg-green-100 text-green-700' },
            'archived': { text: 'Arquivada', color: 'bg-gray-100 text-gray-700' },
            'closed': { text: 'Encerrada', color: 'bg-gray-100 text-gray-700' }
        };
        return labels[status] || { text: status, color: 'bg-gray-100 text-gray-600' };
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 ring-1 ring-gray-100 dark:ring-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Consultar Protocolos
            </h2>

            {/* Search Field */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Buscar por número do protocolo
                </label>
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={searchProtocol}
                            onChange={(e) => setSearchProtocol(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && searchByProtocol(searchProtocol)}
                            placeholder="Ex: DF-2026-123456"
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                        />
                    </div>
                    <button
                        onClick={() => searchByProtocol(searchProtocol)}
                        disabled={searching}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {searching ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <Search className="w-5 h-5" />
                                Buscar
                            </>
                        )}
                    </button>
                </div>

                {error && (
                    <div className="mt-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-300 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        {error}
                    </div>
                )}
            </div>

            {/* History Section */}
            {history.length > 0 && (
                <div>
                    <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Enviados deste dispositivo
                    </h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {history.map((item, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleHistoryClick(item.protocol)}
                                className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors group text-left"
                            >
                                <div>
                                    <span className="font-mono text-sm font-semibold text-blue-600 dark:text-blue-400">
                                        {item.protocol}
                                    </span>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                        {item.type} • {formatDate(item.date)}
                                    </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {history.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                    Nenhum protocolo enviado deste dispositivo ainda.
                </p>
            )}

            {/* Details Modal */}
            {showDetails && searchResult && (
                <div role="dialog" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="bg-blue-600 p-5 text-white flex items-center justify-between sticky top-0">
                            <div>
                                <h3 className="text-lg font-semibold">Detalhes do Protocolo</h3>
                                <p className="font-mono text-blue-100 uppercase">{searchResult.protocol}</p>
                            </div>
                            <button
                                onClick={() => setShowDetails(false)}
                                className="text-white/70 hover:text-white hover:bg-white/10 p-2 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4 overflow-y-auto">
                            <div className="flex items-center gap-3">
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusLabel(searchResult.status).color}`}>
                                    {getStatusLabel(searchResult.status).text}
                                </span>
                                <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                                    {searchResult.type}
                                </span>
                            </div>

                            <div>
                                <label className="text-xs text-gray-500 uppercase font-semibold">Descrição</label>
                                <p className="text-gray-700 dark:text-gray-300 mt-1 bg-gray-50 dark:bg-gray-900 p-3 rounded-lg whitespace-pre-wrap">
                                    {searchResult.text}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-semibold">Data do Registro</label>
                                    <p className="text-gray-700 dark:text-gray-300 mt-1">
                                        {formatDate(searchResult.created_at)}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-semibold">Identificação</label>
                                    <p className="text-gray-700 dark:text-gray-300 mt-1">
                                        {searchResult.is_anonymous ? 'Anônimo' : (searchResult.name || 'Identificado')}
                                    </p>
                                </div>
                            </div>

                            {/* Conversation History */}
                            {searchResult.responses && searchResult.responses.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                    <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-3">Histórico de Atendimento</h4>
                                    <div className="space-y-3 pr-1">
                                        {searchResult.responses.map((res, idx) => (
                                            <div key={idx} className={`flex ${res.is_admin ? 'justify-start' : 'justify-end'}`}>
                                                <div className={`
                                                    rounded-2xl p-3 max-w-[90%] shadow-sm border text-sm
                                                    ${res.is_admin
                                                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800 rounded-tl-none mr-auto'
                                                        : 'bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600 rounded-tr-none ml-auto'} 
                                                `}>
                                                    <p className={`text-xs mb-1 font-semibold ${res.is_admin ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500'}`}>
                                                        {res.is_admin ? 'Ouvidoria' : 'Você'}
                                                    </p>
                                                    <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{res.message}</p>
                                                    <p className="text-[10px] text-gray-400 mt-1 text-right">
                                                        {new Date(res.created_at).toLocaleString([], { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                            <button
                                onClick={() => setShowDetails(false)}
                                className="w-full bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 font-semibold py-3 rounded-xl transition-colors"
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProtocolViewer;
