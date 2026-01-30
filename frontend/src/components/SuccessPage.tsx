import React, { useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { CheckCircle, Download, Home, FileText } from 'lucide-react';

interface SuccessPageProps {
    protocol: string;
    // You could pass more data here if needed for the PDF (e.g., date, limited info)
    onBack: () => void;
}

const SuccessPage: React.FC<SuccessPageProps> = ({ protocol, onBack }) => {

    // Auto-scroll to top when mounted
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const generatePDF = () => {
        const doc = new jsPDF();
        const now = new Date();
        const dateStr = now.toLocaleDateString('pt-BR');
        const timeStr = now.toLocaleTimeString('pt-BR');

        // -- Colors --
        // primary blue
        const primaryColor = '#2563EB';
        // dark text
        const textColor = '#1F2937';
        // light gray background for header
        const headerBg = '#F3F4F6';

        // -- Header --
        doc.setFillColor(headerBg);
        doc.rect(0, 0, 210, 40, 'F'); // A4 width is 210mm

        doc.setFontSize(22);
        doc.setTextColor(primaryColor);
        doc.setFont('helvetica', 'bold');
        doc.text('Participa DF', 105, 20, { align: 'center' });

        doc.setFontSize(12);
        doc.setTextColor(textColor);
        doc.setFont('helvetica', 'normal');
        doc.text('Comprovante de Manifestação', 105, 30, { align: 'center' });

        // -- Protocol Box --
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.rect(20, 50, 170, 40, 'S'); // x, y, w, h

        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text('NÚMERO DO PROTOCOLO', 105, 60, { align: 'center' });

        doc.setFontSize(24);
        doc.setTextColor(primaryColor);
        doc.setFont('courier', 'bold'); // Monospaced for protocol
        doc.text(protocol, 105, 75, { align: 'center' });

        // -- Details --
        let yPos = 110;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(textColor);
        doc.setFontSize(12);

        doc.text('Detalhes do Registro:', 20, yPos);
        yPos += 10;

        // Helper to add line
        const addLine = (label: string, value: string) => {
            doc.setFont('helvetica', 'bold');
            doc.text(`${label}:`, 20, yPos);
            doc.setFont('helvetica', 'normal');
            doc.text(value, 60, yPos);
            yPos += 10;
        };

        addLine('Data:', dateStr);
        addLine('Hora:', timeStr);
        addLine('Status:', 'Recebido com Sucesso');
        addLine('Canal:', 'Web / Mobile PWA');

        // -- Footer --
        const pageHeight = doc.internal.pageSize.height;
        doc.setFontSize(10);
        doc.setTextColor(150, 150, 150);
        doc.text('Ouvidoria Geral do Distrito Federal', 105, pageHeight - 20, { align: 'center' });
        doc.text('Este documento comprova o envio da sua manifestação.', 105, pageHeight - 15, { align: 'center' });

        // Auto download
        doc.save(`Comprovante-ParticipaDF-${protocol}.pdf`);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-6 animate-fade-in-up">

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg p-8 text-center border border-gray-100 dark:border-gray-700">

                {/* Success Icon */}
                <div className="bg-green-100 dark:bg-green-900/30 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
                </div>

                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
                    Manifestação Recebida!
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mb-8">
                    Sua voz é muito importante para nós. Acompanhe o andamento usando o protocolo abaixo.
                </p>

                {/* Protocol Card */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 mb-8 relative group">
                    <p className="text-xs uppercase tracking-widest text-blue-600 dark:text-blue-400 font-semibold mb-2">
                        Seu Protocolo
                    </p>
                    <p className="text-4xl font-mono font-bold text-gray-800 dark:text-gray-100 tracking-wider">
                        {protocol}
                    </p>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <FileText className="w-4 h-4 text-blue-400" />
                    </div>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                    <button
                        onClick={generatePDF}
                        className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-lg transition-all shadow-lg hover:shadow-blue-500/30 text-lg"
                    >
                        <Download className="w-6 h-6" />
                        Baixar Comprovante (PDF)
                    </button>

                    <button
                        onClick={onBack}
                        className="w-full flex items-center justify-center gap-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-semibold py-3 px-6 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                    >
                        <Home className="w-5 h-5" />
                        Voltar ao Início
                    </button>
                </div>
            </div>

            {/* Footer Note */}
            <p className="mt-8 text-center text-sm text-gray-400 dark:text-gray-500">
                Participa DF • Ouvidoria Geral
            </p>
        </div>
    );
};

export default SuccessPage;
