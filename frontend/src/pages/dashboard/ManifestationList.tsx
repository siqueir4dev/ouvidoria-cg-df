import React, { useEffect, useState, useRef } from 'react';
import { Loader2, Filter, CheckCircle, Clock, Archive, Eye, X, User, FileText, Image, Video, Mic, Calendar, Hash, Tag, Download, Send, MessageSquare } from 'lucide-react';

interface Manifestation {
    id: number;
    protocol: string;
    type: string;
    text: string;
    status: string;
    created_at: string;
    name?: string;
    cpf?: string;
    attachments?: Attachment[];
    responses?: Response[];
}

interface Attachment {
    id: number;
    file_path: string;
    file_type: string;
    original_name: string;
}

interface Response {
    id?: number;
    message: string;
    created_at: string;
    is_admin: boolean | number; // MySQL might return 0/1
}

// Component to Render Secure Images
const SecureImage: React.FC<{ url: string, alt: string, className?: string, onClick?: () => void }> = ({ url, alt, className, onClick }) => {
    const [src, setSrc] = useState<string | null>(null);

    useEffect(() => {
        const fetchImage = async () => {
            const token = localStorage.getItem('adminToken');
            try {
                const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
                if (res.ok) {
                    const blob = await res.blob();
                    setSrc(URL.createObjectURL(blob));
                }
            } catch (e) { console.error('Error fetching image', e); }
        };
        fetchImage();
    }, [url]);

    if (!src) return <div className="w-full h-full bg-gray-200 animate-pulse flex items-center justify-center"><Image className="text-gray-400" /></div>;

    return <img src={src} alt={alt} className={className} onClick={onClick} />;
};


const ManifestationList: React.FC = () => {
    const [manifestations, setManifestations] = useState<Manifestation[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filterStatus, setFilterStatus] = useState('');

    // Modal State
    const [actionModalOpen, setActionModalOpen] = useState(false);
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);

    // Selection State
    const [selectedManifestation, setSelectedManifestation] = useState<Manifestation | null>(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    // Chat State
    const [replyText, setReplyText] = useState('');
    const [sendingReply, setSendingReply] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Action State
    const [selectedActionAction, setSelectedActionAction] = useState<{ id: number, status: string, title: string } | null>(null);

    const fetchManifestations = async () => {
        setLoading(true);
        const token = localStorage.getItem('adminToken');
        try {
            const params = new URLSearchParams({ page: String(page), limit: '10' });
            if (filterStatus) params.append('status', filterStatus);

            const response = await fetch(`http://localhost:3000/api/v1/admin/manifestations?${params}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            setManifestations(data.data);
            setTotalPages(data.totalPages);
        } catch (error) {
            console.error("Failed to fetch manifestations");
        } finally {
            setLoading(false);
        }
    };

    const fetchDetails = async (id: number) => {
        setLoadingDetails(true);
        const token = localStorage.getItem('adminToken');
        try {
            const response = await fetch(`http://localhost:3000/api/v1/admin/manifestations/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            setSelectedManifestation(data);
            setDetailsModalOpen(true);
            setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 300);
        } catch (error) {
            alert('Erro ao carregar detalhes');
        } finally {
            setLoadingDetails(false);
        }
    };

    const sendReply = async () => {
        if (!selectedManifestation || !replyText.trim()) return;
        setSendingReply(true);
        const token = localStorage.getItem('adminToken');

        try {
            const response = await fetch(`http://localhost:3000/api/v1/admin/manifestations/${selectedManifestation.id}/reply`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ message: replyText })
            });

            if (response.ok) {
                // Refresh Details
                const updatedResponse = await fetch(`http://localhost:3000/api/v1/admin/manifestations/${selectedManifestation.id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const updatedData = await updatedResponse.json();
                setSelectedManifestation(updatedData);
                setReplyText('');
                setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
            } else {
                alert('Erro ao enviar resposta.');
            }
        } catch (e) {
            alert('Erro de conexão.');
        } finally {
            setSendingReply(false);
        }
    };

    useEffect(() => {
        fetchManifestations();
    }, [page, filterStatus]);

    const initiateAction = (id: number, status: string, title: string) => {
        setSelectedActionAction({ id, status, title });
        setActionModalOpen(true);
    };

    const confirmAction = async () => {
        if (!selectedActionAction) return;

        const token = localStorage.getItem('adminToken');
        try {
            const response = await fetch(`http://localhost:3000/api/v1/admin/manifestations/${selectedActionAction.id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ status: selectedActionAction.status })
            });

            if (response.ok) {
                fetchManifestations(); // Refresh list
                if (selectedManifestation && selectedManifestation.id === selectedActionAction.id) {
                    // Update details modal if open
                    setSelectedManifestation(prev => prev ? { ...prev, status: selectedActionAction.status } : null);
                }
                setActionModalOpen(false);
                setSelectedActionAction(null);
            } else {
                alert('Erro ao atualizar status');
            }
        } catch (error) {
            alert('Erro de conexão');
        }
    };

    // Make download auth token handling
    const handleDownload = async (attachment: Attachment) => {
        const token = localStorage.getItem('adminToken');
        try {
            const response = await fetch(`http://localhost:3000/api/v1/admin/attachments/${attachment.id}/file`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = attachment.original_name;
                document.body.appendChild(a);
                a.click();
                a.remove();
            } else {
                alert('Erro ao baixar arquivo. Nível de acesso insuficiente?');
            }
        } catch (e) {
            alert('Erro de conexão ao baixar.');
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: any = {
            'received': 'bg-gray-100 text-gray-800 border-gray-200',
            'in_analysis': 'bg-gray-200 text-gray-800 border-gray-300',
            'resolved': 'bg-green-50 text-green-700 border-green-200',
            'archived': 'bg-gray-50 text-gray-500 border-gray-200',
        };
        const labels: any = {
            'received': 'Recebido',
            'in_analysis': 'Em Análise',
            'resolved': 'Resolvido',
            'archived': 'Arquivado'
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${styles[status] || styles['received']}`}>
                {labels[status] || status}
            </span>
        );
    };

    const getFileIcon = (type: string) => {
        if (type.startsWith('image/')) return <Image className="w-5 h-5 text-gray-600" />;
        if (type.startsWith('video/')) return <Video className="w-5 h-5 text-gray-600" />;
        if (type.startsWith('audio/')) return <Mic className="w-5 h-5 text-gray-600" />;
        return <FileText className="w-5 h-5 text-gray-600" />;
    };

    return (
        <div className="space-y-6 relative">
            {/* Details Modal - Neutral Colors */}
            {detailsModalOpen && selectedManifestation && (
                <div role="dialog" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in overflow-y-auto">
                    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full my-8 flex flex-col border border-gray-200 dark:border-gray-800 animate-scale-in max-h-[90vh]">
                        {/* Header */}
                        <div className="bg-white dark:bg-gray-900 p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-start sticky top-0 z-10 rounded-t-lg">
                            <div>
                                <div className="flex flex-wrap items-center gap-3 mb-2">
                                    <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                        <Hash className="w-5 h-5 text-gray-400" />
                                        {selectedManifestation.protocol}
                                    </h2>
                                    {getStatusBadge(selectedManifestation.status)}
                                </div>
                                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                    <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {new Date(selectedManifestation.created_at).toLocaleString('pt-BR')}</span>
                                    <span className="flex items-center gap-1"><Tag className="w-4 h-4" /> {selectedManifestation.type}</span>
                                </div>
                            </div>
                            <button onClick={() => setDetailsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Body - Scrollable */}
                        <div className="p-6 md:p-8 space-y-8 overflow-y-auto flex-1">

                            {/* Identificação - Neutral Style */}
                            <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-lg border border-gray-100 dark:border-gray-700">
                                <h3 className="text-xs uppercase font-bold text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-2 tracking-wider">
                                    <User className="w-4 h-4" /> Identificação
                                </h3>
                                {selectedManifestation.name ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-gray-400 dark:text-gray-500 font-semibold uppercase mb-1">Nome</p>
                                            <p className="text-gray-900 dark:text-gray-100 font-medium">{selectedManifestation.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 dark:text-gray-500 font-semibold uppercase mb-1">CPF</p>
                                            <p className="text-gray-900 dark:text-gray-100 font-mono">{selectedManifestation.cpf}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="flex items-center gap-2 text-gray-600 dark:text-gray-400 italic">
                                        <CheckCircle className="w-4 h-4 text-gray-400" /> Anônimo
                                    </p>
                                )}
                            </div>

                            {/* Conteúdo */}
                            <section>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-gray-400" /> Relato
                                </h3>
                                <div className="bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-300 leading-relaxed whitespace-pre-wrap text-base">
                                    {selectedManifestation.text}
                                </div>
                            </section>

                            {/* Anexos */}
                            <section>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                                    <Download className="w-5 h-5 text-gray-400" /> Anexos ({selectedManifestation.attachments?.length || 0})
                                </h3>

                                {selectedManifestation.attachments && selectedManifestation.attachments.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {selectedManifestation.attachments.map(att => (
                                            <div key={att.id} className="group border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:border-gray-300 dark:hover:border-gray-600 transition-all bg-white dark:bg-gray-800">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                                        {getFileIcon(att.file_type)}
                                                    </div>
                                                    <div className="overflow-hidden flex-1">
                                                        <p className="text-sm font-medium truncate text-gray-700 dark:text-gray-300" title={att.original_name}>
                                                            {att.original_name}
                                                        </p>
                                                        <p className="text-xs text-gray-400 uppercase">{att.file_type.split('/')[1]}</p>
                                                    </div>
                                                </div>

                                                {/* Secured Preview */}
                                                <div className="bg-gray-100 dark:bg-gray-900 rounded overflow-hidden flex items-center justify-center h-40 relative group-hover:bg-gray-200 transition-colors">
                                                    {att.file_type.startsWith('image/') ? (
                                                        <SecureImage
                                                            url={`http://localhost:3000/api/v1/admin/attachments/${att.id}/file`}
                                                            alt={att.original_name}
                                                            className="w-full h-full object-contain cursor-pointer"
                                                            onClick={() => window.open(URL.createObjectURL(new Blob()), '_blank')}
                                                        />
                                                    ) : att.file_type.startsWith('video/') ? (
                                                        <div className="text-center p-2">
                                                            <Video className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                                            <span className="text-xs text-gray-500">Vídeo (Baixar para ver)</span>
                                                        </div>
                                                    ) : (
                                                        <div className="text-center p-2">
                                                            <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                                            <span className="text-xs text-gray-500">Arquivo</span>
                                                        </div>
                                                    )}

                                                    {/* Download Overlay */}
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                        <button
                                                            onClick={() => handleDownload(att)}
                                                            className="bg-white text-gray-900 px-4 py-2 rounded-full font-bold text-sm hover:bg-gray-100 flex items-center gap-2"
                                                        >
                                                            <Download className="w-4 h-4" /> Baixar
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 dark:text-gray-400 italic text-sm">Nenhum anexo disponível.</p>
                                )}
                            </section>

                            {/* Chat / Histórico de Atendimento */}
                            <section className="border-t border-gray-200 dark:border-gray-800 pt-6">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                                    <MessageSquare className="w-5 h-5 text-gray-400" /> Histórico de Atendimento
                                </h3>

                                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 min-h-[200px] flex flex-col">
                                    {/* Messages Display */}
                                    <div className="flex-1 space-y-4 mb-4">
                                        {/* Original Message Fake Bubble */}
                                        <div className="flex justify-start">
                                            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-tl-none p-3 max-w-[85%] shadow-sm">
                                                <p className="text-xs text-gray-400 mb-1 font-semibold">Cidadão (Relato Inicial)</p>
                                                <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap">{selectedManifestation.text}</p>
                                                <p className="text-[10px] text-gray-400 mt-2 text-right">{new Date(selectedManifestation.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                            </div>
                                        </div>

                                        {/* Responses */}
                                        {selectedManifestation.responses && selectedManifestation.responses.map((res, idx) => (
                                            <div key={idx} className={`flex ${res.is_admin ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`
                                                    rounded-2xl p-3 max-w-[85%] shadow-sm border
                                                    ${res.is_admin
                                                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800 rounded-tr-none'
                                                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-tl-none'}
                                                `}>
                                                    <p className={`text-xs mb-1 font-semibold ${res.is_admin ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}>
                                                        {res.is_admin ? 'Ouvidoria (Você)' : 'Cidadão'}
                                                    </p>
                                                    <p className="text-gray-800 dark:text-gray-200 text-sm whitespace-pre-wrap">{res.message}</p>
                                                    <p className="text-[10px] text-gray-400/80 mt-1 text-right">
                                                        {new Date(res.created_at).toLocaleString([], { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                        <div ref={chatEndRef} />
                                    </div>

                                    {/* Input Area */}
                                    <div className="mt-2 flex gap-2">
                                        <textarea
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                            placeholder="Escreva uma resposta ou atualização para o cidadão..."
                                            className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-gray-300 outline-none resize-none h-20"
                                        />
                                        <button
                                            onClick={sendReply}
                                            disabled={!replyText.trim() || sendingReply}
                                            className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg px-4 flex items-center justify-center hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                        >
                                            {sendingReply ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>
                            </section>

                        </div>

                        {/* Footer Actions */}
                        <div className="bg-gray-50 dark:bg-gray-800/50 p-5 border-t border-gray-200 dark:border-gray-800 flex flex-wrap justify-end gap-3 sticky bottom-0 rounded-b-lg">
                            <button
                                onClick={() => initiateAction(selectedManifestation.id, 'in_analysis', 'Iniciar Análise')}
                                className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm"
                            >
                                <Clock className="w-4 h-4" /> Em Análise
                            </button>
                            <button
                                onClick={() => initiateAction(selectedManifestation.id, 'resolved', 'Resolver')}
                                className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm"
                            >
                                <CheckCircle className="w-4 h-4" /> Resolver
                            </button>
                            <button
                                onClick={() => initiateAction(selectedManifestation.id, 'archived', 'Arquivar')}
                                className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500 rounded-lg font-medium transition-colors flex items-center gap-2"
                            >
                                <Archive className="w-4 h-4" /> Arquivar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Action Confirmation Modal */}
            {actionModalOpen && selectedActionAction && (
                <div role="dialog" className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-sm w-full p-6 animate-scale-in border border-gray-200 dark:border-gray-700">
                        <div className="flex flex-col items-center text-center gap-4">
                            <div className={`p-4 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300`}>
                                {selectedActionAction.status === 'resolved' ? <CheckCircle className="w-8 h-8" /> :
                                    selectedActionAction.status === 'archived' ? <Archive className="w-8 h-8" /> :
                                        <Clock className="w-8 h-8" />}
                            </div>

                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{selectedActionAction.title}</h3>
                                <p className="text-gray-500 dark:text-gray-400 text-sm">
                                    Confirma a atualização de status?
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3 w-full mt-2">
                                <button
                                    onClick={() => setActionModalOpen(false)}
                                    className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmAction}
                                    className="px-4 py-2 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:opacity-90 font-bold transition-transform active:scale-95"
                                >
                                    Confirmar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Simple Main List Header */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Gestão de Manifestações</h2>

                <div className="flex items-center gap-2">
                    <Filter className="w-5 h-5 text-gray-400" />
                    <select
                        value={filterStatus}
                        onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
                        className="bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gray-500 outline-none"
                    >
                        <option value="">Todos os Status</option>
                        <option value="received">Recebidos</option>
                        <option value="in_analysis">Em Análise</option>
                        <option value="resolved">Resolvidos</option>
                        <option value="archived">Arquivados</option>
                    </select>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
                        <thead className="bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-200 font-semibold uppercase tracking-wider text-xs">
                            <tr>
                                <th className="p-4 border-b dark:border-gray-700">Protocolo</th>
                                <th className="p-4 border-b dark:border-gray-700">Tipo</th>
                                <th className="p-4 border-b dark:border-gray-700 w-1/3">Descrição</th>
                                <th className="p-4 border-b dark:border-gray-700">Identificação</th>
                                <th className="p-4 border-b dark:border-gray-700">Data</th>
                                <th className="p-4 border-b dark:border-gray-700 text-center">Status</th>
                                <th className="p-4 border-b dark:border-gray-700 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-600" />
                                    </td>
                                </tr>
                            )
                                : (
                                    Array.isArray(manifestations) && manifestations.length > 0 ? (
                                        manifestations.map((m) => (
                                            <tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                                <td className="p-4 font-mono text-xs font-semibold">{m.protocol}</td>
                                                <td className="p-4 font-medium">{m.type}</td>
                                                <td className="p-4 truncate max-w-xs text-gray-500" title={m.text}>{m.text}</td>
                                                <td className="p-4">
                                                    {m.name ? (
                                                        <div className="flex flex-col">
                                                            <span className="font-medium inline-block max-w-[120px] truncate" title={m.name}>{m.name}</span>
                                                            <span className="text-xs text-gray-400">{m.cpf}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="italic opacity-50 text-xs">Anônimo</span>
                                                    )}
                                                </td>
                                                <td className="p-4 text-xs tabular-nums">{new Date(m.created_at).toLocaleDateString('pt-BR')}</td>
                                                <td className="p-4 text-center">{getStatusBadge(m.status)}</td>
                                                <td className="p-4 text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <button
                                                            onClick={() => fetchDetails(m.id)}
                                                            title="Ver Detalhes/Responder"
                                                            className="p-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors mr-2 flex items-center gap-1"
                                                        >
                                                            {loadingDetails && selectedManifestation?.id === m.id ? (
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                            ) : (
                                                                <>
                                                                    <Eye className="w-4 h-4" />
                                                                    {m.responses && m.responses.length > 0 && (
                                                                        <span className="bg-blue-600 w-2 h-2 rounded-full block"></span>
                                                                    )}
                                                                </>
                                                            )}
                                                        </button>
                                                        {/* Simplified Actions in Row */}
                                                        <button
                                                            onClick={() => initiateAction(m.id, 'resolved', 'Resolver')}
                                                            title="Resolver"
                                                            className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                                                        >
                                                            <CheckCircle className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={7} className="p-8 text-center text-gray-400">
                                                Nenhuma manifestação encontrada.
                                            </td>
                                        </tr>
                                    )
                                )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-4 py-2 text-sm border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 text-gray-600"
                    >
                        Anterior
                    </button>
                    <span className="text-sm text-gray-500">Página {page} de {totalPages}</span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-4 py-2 text-sm border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 text-gray-600"
                    >
                        Próxima
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ManifestationList;
