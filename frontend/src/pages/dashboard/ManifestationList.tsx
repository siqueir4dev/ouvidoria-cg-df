import React, { useEffect, useState } from 'react';
import { Loader2, Filter, CheckCircle, Clock, Archive } from 'lucide-react';

interface Manifestation {
    id: number;
    protocol: string;
    type: string;
    text: string;
    status: string;
    created_at: string;
    name?: string;
    cpf?: string;
}

const ManifestationList: React.FC = () => {
    const [manifestations, setManifestations] = useState<Manifestation[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filterStatus, setFilterStatus] = useState('');

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

    useEffect(() => {
        fetchManifestations();
    }, [page, filterStatus]);

    const updateStatus = async (id: number, newStatus: string) => {
        if (!confirm(`Confirmar mudança de status para: ${newStatus}?`)) return;

        const token = localStorage.getItem('adminToken');
        try {
            const response = await fetch(`http://localhost:3000/api/v1/admin/manifestations/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                fetchManifestations(); // Refresh
            }
        } catch (error) {
            alert('Erro ao atualizar status');
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: any = {
            'received': 'bg-yellow-100 text-yellow-800 border-yellow-200',
            'in_analysis': 'bg-blue-100 text-blue-800 border-blue-200',
            'resolved': 'bg-green-100 text-green-800 border-green-200',
            'archived': 'bg-gray-100 text-gray-800 border-gray-200',
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

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Gestão de Manifestações</h2>

                <div className="flex items-center gap-2">
                    <Filter className="w-5 h-5 text-gray-400" />
                    <select
                        value={filterStatus}
                        onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
                        className="bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
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
                                <th className="p-4 border-b dark:border-gray-700 w-1/3">Descrição (Resumo)</th>
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
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
                                    </td>
                                </tr>
                            ) : manifestations.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-gray-400">
                                        Nenhuma manifestação encontrada.
                                    </td>
                                </tr>
                            ) : (
                                manifestations.map((m) => (
                                    <tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                        <td className="p-4 font-mono text-xs">{m.protocol}</td>
                                        <td className="p-4 font-medium">{m.type}</td>
                                        <td className="p-4 truncate max-w-xs" title={m.text}>{m.text}</td>
                                        <td className="p-4">
                                            {m.name ? (
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{m.name}</span>
                                                    <span className="text-xs text-gray-400">{m.cpf}</span>
                                                </div>
                                            ) : (
                                                <span className="italic opacity-50">Anônimo</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-xs">{new Date(m.created_at).toLocaleDateString('pt-BR')}</td>
                                        <td className="p-4 text-center">{getStatusBadge(m.status)}</td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-1">
                                                {/* Simulating Actions - In real app use a Dropdown */}
                                                <button
                                                    title="Marcar como Em Análise"
                                                    onClick={() => updateStatus(m.id, 'in_analysis')}
                                                    className="p-1 hover:bg-blue-100 text-blue-600 rounded"
                                                >
                                                    <Clock className="w-4 h-4" />
                                                </button>
                                                <button
                                                    title="Marcar como Resolvido"
                                                    onClick={() => updateStatus(m.id, 'resolved')}
                                                    className="p-1 hover:bg-green-100 text-green-600 rounded"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                </button>
                                                <button
                                                    title="Arquivar"
                                                    onClick={() => updateStatus(m.id, 'archived')}
                                                    className="p-1 hover:bg-gray-200 text-gray-600 rounded"
                                                >
                                                    <Archive className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-4 py-2 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
                    >
                        Anterior
                    </button>
                    <span className="text-sm text-gray-500">Página {page} de {totalPages}</span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-4 py-2 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
                    >
                        Próxima
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ManifestationList;
