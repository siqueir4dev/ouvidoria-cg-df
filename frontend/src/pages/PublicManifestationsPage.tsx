import { useEffect, useState } from 'react';
import { ArrowLeft, MessageSquare, AlertTriangle, Lightbulb, ThumbsUp, Info, UserPen } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

interface PublicManifestation {
    id: number;
    text: string;
    type: string;
    created_at: string;
    was_edited: boolean;
}

const PublicManifestationsPage = () => {
    const [manifestations, setManifestations] = useState<PublicManifestation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('http://localhost:3000/api/v1/manifestations/public')
            .then(res => res.json())
            .then(data => {
                setManifestations(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const getTypeIcon = (type: string) => {
        switch (type.toLowerCase()) {
            case 'denúncia': return <AlertTriangle className="w-5 h-5 text-red-500" />;
            case 'reclamação': return <MessageSquare className="w-5 h-5 text-orange-500" />;
            case 'sugestão': return <Lightbulb className="w-5 h-5 text-yellow-500" />;
            case 'elogio': return <ThumbsUp className="w-5 h-5 text-green-500" />;
            default: return <Info className="w-5 h-5 text-blue-500" />;
        }
    };

    const getTypeBadgeColor = () => {
        // Estilo unificado clean: Fundo branco, borda suave, texto neutro.
        return 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 shadow-sm';
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans">
            <Navbar />

            <main className="container mx-auto px-4 py-12">
                <div className="max-w-3xl mx-auto">
                    <div className="mb-10 text-center">
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3 tracking-tight">
                            Transparência Pública
                        </h1>
                        <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
                            Acompanhe em tempo real as manifestações e o impacto da Ouvidoria na nossa comunidade.
                        </p>

                        <div className="mt-6 flex justify-center">
                            <Link to="/" className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 transition-colors">
                                <ArrowLeft className="w-4 h-4 mr-1" />
                                Voltar para o Início
                            </Link>
                        </div>
                    </div>

                    {loading ? (
                        <div className="space-y-6">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 animate-pulse h-40"></div>
                            ))}
                        </div>
                    ) : manifestations.length === 0 ? (
                        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                            <div className="w-16 h-16 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                                <MessageSquare className="w-8 h-8 text-gray-300 dark:text-gray-500" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Nenhuma manifestação pública</h3>
                            <p className="text-gray-500 dark:text-gray-400">Seja o primeiro a contribuir de forma transparente!</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {manifestations.map(m => (
                                <div key={m.id} className="group bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-8 border border-gray-100 dark:border-gray-800 hover:shadow-lg hover:border-blue-100 dark:hover:border-blue-900 transition-all duration-300 relative overflow-hidden">
                                    {/* Decorative gradient opacity on hover */}
                                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                                    <div className="flex items-center justify-between mb-5">
                                        <div className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 ${getTypeBadgeColor()}`}>
                                            {getTypeIcon(m.type)}
                                            <span className="uppercase tracking-wider text-[10px]">{m.type}</span>
                                        </div>
                                        <span className="text-xs font-medium text-gray-400 dark:text-gray-500 flex items-center gap-1">
                                            {new Date(m.created_at).toLocaleDateString()}
                                        </span>
                                    </div>

                                    <p className="text-gray-700 dark:text-gray-300 text-base leading-7 whitespace-pre-wrap font-medium">
                                        "{m.text}"
                                    </p>

                                    <div className="mt-6 pt-5 border-t border-gray-50 dark:border-gray-700/50 flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                                            <div className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                                <UserPen className="w-3 h-3 text-gray-400" />
                                            </div>
                                            <span>Anônimo</span>
                                        </div>

                                        {!!m.was_edited && (
                                            <span className="text-[10px] uppercase tracking-widest text-gray-300 dark:text-gray-600 font-bold flex items-center gap-1.5" title="Texto ajustado para remover dados pessoais">
                                                Editado
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default PublicManifestationsPage;
