import React, { useEffect, useState } from 'react';
import { Doughnut, Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement,
    Filler
} from 'chart.js';
import { Loader2, FileText, CheckCircle, Clock } from 'lucide-react';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement,
    Filler
);

const DashboardHome: React.FC = () => {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            const token = localStorage.getItem('adminToken');
            try {
                const response = await fetch('http://localhost:3000/api/v1/admin/stats', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setStats(data);
                }
            } catch (error) {
                console.error("Failed to fetch stats");
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
    }

    if (!stats) return <div>Erro ao carregar dados.</div>;

    // Data Preparation - Safety Checks
    const typeLabels = stats.byType ? stats.byType.map((t: any) => t.type) : [];
    const typeData = stats.byType ? stats.byType.map((t: any) => t.count) : [];

    const trendLabels = stats.trend ? stats.trend.map((t: any) => new Date(t.date).toLocaleDateString('pt-BR')) : [];
    const trendData = stats.trend ? stats.trend.map((t: any) => t.count) : [];

    const doughnutData = {
        labels: typeLabels,
        datasets: [
            {
                data: typeData,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 206, 86, 0.6)',
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(153, 102, 255, 0.6)',
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                ],
                borderWidth: 1,
            },
        ],
    };

    const lineData = {
        labels: trendLabels,
        datasets: [
            {
                label: 'Novas Manifestações',
                data: trendData,
                fill: true,
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                borderColor: 'rgba(59, 130, 246, 1)',
                tension: 0.4
            },
        ],
    };

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4">
                    <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                        <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Total Manifestações</p>
                        <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</h3>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4">
                    <div className="p-4 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl">
                        <Clock className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Pedentes</p>
                        <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{stats.pending}</h3>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4">
                    <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-xl">
                        <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Resolvidas</p>
                        <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total - stats.pending}</h3>
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Tendência (7 dias)</h3>
                    <Line data={lineData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Distribuição por Tipo</h3>
                    <div className="max-h-64 flex justify-center">
                        <Doughnut data={doughnutData} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardHome;
