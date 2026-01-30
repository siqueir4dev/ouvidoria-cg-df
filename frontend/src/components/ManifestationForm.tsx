import React, { useState, type ChangeEvent, type FormEvent } from 'react';
import { useMediaRecorder } from '../hooks/useMediaRecorder';

import { Mic, Square, X, Image as ImageIcon, Video, Send, Shield, Sparkles, Bot, Check, ArrowRight, WifiOff, FileText, Info, ChevronDown, ChevronUp, Edit3, Lightbulb, User, UserCheck } from 'lucide-react';
import { saveOfflineManifestation } from '../services/offlineStorage';

interface ManifestationFormProps {
    onSuccess?: (protocol: string) => void;
}

const ManifestationForm: React.FC<ManifestationFormProps> = ({ onSuccess }) => {
    const [text, setText] = useState('');
    const [selectedType, setSelectedType] = useState('Reclamação');

    // Identify State
    const [isAnonymous, setIsAnonymous] = useState(true);
    const [name, setName] = useState('');
    const [cpf, setCpf] = useState('');

    const [images, setImages] = useState<File[]>([]);
    const [video, setVideo] = useState<File | null>(null);
    const [videoPreview, setVideoPreview] = useState<string | null>(null);

    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [showOrientations, setShowOrientations] = useState(true);

    // IZA AI State
    const [analyzing, setAnalyzing] = useState(false);
    const [izaSuggestion, setIzaSuggestion] = useState<{ suggestedType: string, reasoning: string } | null>(null);

    // Terms Agreement State
    const [agreedToTerms, setAgreedToTerms] = useState(false);

    // Terms/Privacy Modals
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [showPrivacyModal, setShowPrivacyModal] = useState(false);

    // Monitor Online Status
    React.useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const manifestationTypes = ['Denúncia', 'Reclamação', 'Sugestão', 'Elogio', 'Informação'];

    const {
        isRecording,
        mediaUrl: audioUrl,
        startRecording,
        stopRecording,
        clearRecording
    } = useMediaRecorder();

    const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newImages = Array.from(e.target.files);
            setImages(prev => [...prev, ...newImages]);
        }
    };

    const handleVideoChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const vid = e.target.files[0];
            setVideo(vid);
            setVideoPreview(URL.createObjectURL(vid));
        }
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const formatCPF = (value: string) => {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})/, '$1-$2')
            .replace(/(-\d{2})\d+?$/, '$1');
    };

    const handleCpfChange = (e: ChangeEvent<HTMLInputElement>) => {
        setCpf(formatCPF(e.target.value));
    };

    const createFormData = (analyticsOnly: boolean = false) => {
        const formData = new FormData();

        formData.append('text', text);
        formData.append('type', selectedType);

        if (analyticsOnly) {
            formData.append('analyzeOnly', 'true');
        } else {
            formData.append('isAnonymous', String(isAnonymous));
            if (!isAnonymous) {
                formData.append('name', name);
                formData.append('cpf', cpf);
            }

            images.forEach(img => formData.append('files', img));
            if (video) formData.append('files', video);
        }
        return formData;
    };

    const getAudioBlob = async (): Promise<Blob | null> => {
        if (!audioUrl) return null;
        try {
            const response = await fetch(audioUrl);
            return await response.blob();
        } catch {
            return null;
        }
    };

    const sendManifestation = async (finalType: string) => {
        try {
            const formData = createFormData(false);
            formData.set('type', finalType);

            const audioBlob = await getAudioBlob();
            if (audioBlob) {
                formData.append('files', audioBlob, 'record.webm');
            }

            const response = await fetch('http://localhost:3000/api/v1/manifestations', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                if (onSuccess) onSuccess(data.protocol);

                const history = JSON.parse(localStorage.getItem('manifestationHeaderHistory') || '[]');
                history.unshift({ protocol: data.protocol, date: new Date().toISOString(), type: finalType });
                localStorage.setItem('manifestationHeaderHistory', JSON.stringify(history.slice(0, 10)));

                setText('');
                setSelectedType('Reclamação');
                setIzaSuggestion(null);
                setImages([]);
                setVideo(null);
                setVideoPreview(null);
                clearRecording();
                setAgreedToTerms(false);
                setIsAnonymous(true);
                setName('');
                setCpf('');
            } else {
                alert('Erro ao enviar manifestação. O servidor respondeu com erro.');
            }
        } catch (error) {
            console.error('Erro de conexão:', error);
            alert('Erro ao conectar com o servidor.');
        }
    };

    const saveOffline = async () => {
        try {
            await saveOfflineManifestation({
                text,
                type: selectedType,
                isAnonymous: isAnonymous,
                // store name/cpf offline if needed ideally, skipping for now to keep interface simple
            });
            alert('Você está offline. Sua manifestação foi salva no dispositivo e será enviada automaticamente quando a conexão retornar.');
            setText('');
            setSelectedType('Reclamação');
        } catch (e) {
            console.error(e);
            alert('Erro ao salvar offline.');
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (text.length < 20) {
            alert('A descrição deve ter no mínimo 20 caracteres.');
            return;
        }

        if (!isAnonymous) {
            if (name.length < 3) {
                alert('Por favor, informe seu nome completo.');
                return;
            }
            if (cpf.length < 14) {
                alert('Por favor, informe um CPF válido.');
                return;
            }
        }

        if (!agreedToTerms) {
            alert('Você precisa concordar com os Termos de Uso.');
            return;
        }

        if (!isOnline) {
            await saveOffline();
            return;
        }

        setAnalyzing(true);
        try {
            const formData = new FormData();
            formData.append('analyzeOnly', 'true');
            formData.append('text', text);

            const response = await fetch('http://localhost:3000/api/v1/manifestations', {
                method: 'POST',
                body: formData
            });

            const analysis = await response.json();

            const suggested = analysis.suggestedType;
            const matches = suggested.toLowerCase() === selectedType.toLowerCase();

            if (analysis.status === 'analysis' && !matches && suggested) {
                setIzaSuggestion({
                    suggestedType: suggested,
                    reasoning: analysis.reasoning
                });
                setAnalyzing(false);
                return;
            }

            await sendManifestation(selectedType);

        } catch (e) {
            console.error("AI Analysis failed, proceeding anyway", e);
            await sendManifestation(selectedType);
        } finally {
            setAnalyzing(false);
        }
    };

    return (
        <div className="space-y-6 relative">

            {/* Terms Modal */}
            {showTermsModal && (
                <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-lg w-full overflow-hidden border border-gray-200 dark:border-gray-700 focus:outline-none">
                        <div className="bg-gray-100 dark:bg-gray-900 p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
                            <h3 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                                <FileText className="w-5 h-5" /> Termos de Uso
                            </h3>
                            <button autoFocus onClick={() => setShowTermsModal(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 max-h-80 overflow-y-auto text-sm text-gray-700 dark:text-gray-300 space-y-4">
                            <p><strong>1. Natureza do Serviço</strong></p>
                            <p>Esta plataforma é um projeto demonstrativo e educacional. Não possui vínculo oficial com órgãos públicos do Distrito Federal ou qualquer outra entidade governamental.</p>

                            <p><strong>2. Uso da Plataforma</strong></p>
                            <p>O usuário concorda em utilizar a plataforma de forma responsável, não enviando conteúdo falso, difamatório ou ilegal.</p>

                            <p><strong>3. Armazenamento de Dados</strong></p>
                            <p>As manifestações são armazenadas em banco de dados para fins de demonstração. Nenhum dado pessoal é coletado.</p>

                            <p><strong>4. IZA - Assistente Virtual</strong></p>
                            <p>A IZA utiliza inteligência artificial para sugerir classificações. As sugestões são automáticas e podem não refletir a classificação ideal.</p>

                            <p><strong>5. Responsabilidade</strong></p>
                            <p>Os desenvolvedores não se responsabilizam pelo uso indevido da plataforma ou por expectativas de resposta oficial.</p>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                            <button onClick={() => setShowTermsModal(false)} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium">
                                Entendi
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Privacy Modal */}
            {showPrivacyModal && (
                <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-lg w-full overflow-hidden border border-gray-200 dark:border-gray-700 focus:outline-none">
                        <div className="bg-gray-100 dark:bg-gray-900 p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
                            <h3 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                                <Shield className="w-5 h-5" /> Política de Privacidade
                            </h3>
                            <button autoFocus onClick={() => setShowPrivacyModal(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 max-h-80 overflow-y-auto text-sm text-gray-700 dark:text-gray-300 space-y-4">
                            <p><strong>1. Anonimato e Identificação</strong></p>
                            <p>O usuário pode escolher se identificar ou realizar uma manifestação 100% anônima. Caso opte pelo anonimato, nenhum dado pessoal será solicitado ou armazenado.</p>

                            <p><strong>2. Dados Coletados</strong></p>
                            <p>Coletamos apenas: texto da manifestação, tipo selecionado, arquivos anexados. Se identificado: Nome e CPF.</p>

                            <p><strong>3. Proteção ao Denunciante</strong></p>
                            <p>Seguindo os princípios da LGPD e do Decreto nº 36.462/2015, garantimos sigilo. Suas informações são utilizadas apenas para o processamento da demanda.</p>

                            <p><strong>4. Segurança</strong></p>
                            <p>Os dados são armazenados em servidor seguro. Não compartilhamos informações com terceiros sem autorização legal.</p>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                            <button onClick={() => setShowPrivacyModal(false)} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium">
                                Entendi
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Orientations Section */}
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                <button
                    type="button"
                    onClick={() => setShowOrientations(!showOrientations)}
                    className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="bg-gray-600 dark:bg-gray-500 p-2 rounded-lg">
                            <Info className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800 dark:text-gray-100">Orientações Importantes</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Leia antes de fazer seu registro</p>
                        </div>
                    </div>
                    {showOrientations ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
                </button>

                {showOrientations && (
                    <div className="px-4 pb-4 space-y-4 text-sm text-gray-700 dark:text-gray-300">
                        {/* Anonymous Info */}
                        <div className="bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-2 mb-2">
                                <Shield className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                <span className="font-bold text-gray-800 dark:text-gray-200">Anonimato ou Identificação</span>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400">
                                Você pode escolher se identificar para acompanhar melhor sua solicitação ou permanecer <strong>totalmente anônimo</strong>.
                            </p>
                        </div>

                        {/* Tips */}
                        <div className="space-y-2">
                            <p className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                                <Edit3 className="w-4 h-4" /> Dicas para um bom registro:
                            </p>
                            <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 ml-2">
                                <li><strong>O quê</strong>: Descreva o que ocorreu ou está ocorrendo</li>
                                <li><strong>Quem</strong>: Pessoas envolvidas (nomes, apelidos)</li>
                                <li><strong>Quando</strong>: Data, horário, frequência</li>
                                <li><strong>Onde</strong>: Local com máximo de detalhes</li>
                                <li><strong>Como</strong>: Você presenciou ou terceiros relataram?</li>
                            </ul>
                        </div>

                        <p className="text-gray-500 dark:text-gray-400 text-xs border-t border-gray-200 dark:border-gray-700 pt-3 flex items-center gap-2">
                            <Lightbulb className="w-3 h-3" /> Cada registro deve conter apenas <strong>1 assunto</strong>. Para múltiplos assuntos, faça registros separados.
                        </p>
                    </div>
                )}
            </div>

            {/* IZA Intervention Modal */}
            {izaSuggestion && (
                <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-lg w-full overflow-hidden border border-gray-200 dark:border-gray-700 animate-scale-in">
                        <div className="bg-blue-600 p-5 text-white flex items-center gap-3">
                            <div className="bg-white/10 p-2 rounded-lg">
                                <Bot className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold tracking-wide">Assistente Virtual IZA</h3>
                                <p className="text-blue-100 text-xs uppercase tracking-wider font-medium">Recomendação de Classificação</p>
                            </div>
                            <button onClick={() => setIzaSuggestion(null)} className="ml-auto text-white/70 hover:text-white hover:bg-white/10 p-1 rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="flex items-start gap-4 mb-6">
                                <div className="flex-1">
                                    <p className="text-gray-700 dark:text-gray-300 text-base leading-relaxed">
                                        "{izaSuggestion.reasoning}"
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-4 rounded-lg flex flex-col items-center justify-center text-center opacity-75">
                                    <span className="text-xs text-gray-500 uppercase font-semibold mb-1">Sua Escolha</span>
                                    <span className="text-gray-500 font-medium line-through decoration-red-500 decoration-2">{selectedType}</span>
                                </div>
                                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg flex flex-col items-center justify-center text-center ring-2 ring-blue-500/20">
                                    <span className="text-xs text-blue-600 dark:text-blue-400 uppercase font-bold mb-1 flex items-center gap-1">
                                        <Sparkles className="w-3 h-3" /> Sugestão
                                    </span>
                                    <span className="text-blue-700 dark:text-blue-300 font-bold text-lg">{izaSuggestion.suggestedType}</span>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                                <button
                                    onClick={() => {
                                        const newType = izaSuggestion.suggestedType;
                                        setIzaSuggestion(null);
                                        sendManifestation(newType);
                                    }}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-semibold transition-all shadow-sm flex items-center justify-center gap-2"
                                >
                                    <Check className="w-4 h-4" />
                                    Aceitar Sugestão
                                </button>
                                <button
                                    onClick={() => {
                                        setIzaSuggestion(null);
                                        sendManifestation(selectedType);
                                    }}
                                    className="flex-1 bg-white hover:bg-gray-50 text-gray-600 border border-gray-300 py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    Manter Seleção
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6" aria-label="Formulário de Manifestação">

                {/* Identification Selection */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">Como você deseja se identificar?</label>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => setIsAnonymous(true)}
                            className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-2 transition-all ${isAnonymous
                                ? 'bg-gray-700 text-white border-gray-700 dark:bg-gray-600 dark:border-gray-500 ring-2 ring-gray-300 dark:ring-gray-600'
                                : 'bg-gray-50 dark:bg-gray-900 text-gray-500 border-gray-200 dark:border-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            <Shield className="w-5 h-5" />
                            <span className="text-sm font-bold">Anônimo</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsAnonymous(false)}
                            className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-2 transition-all ${!isAnonymous
                                ? 'bg-blue-600 text-white border-blue-600 ring-2 ring-blue-200 dark:ring-blue-900'
                                : 'bg-gray-50 dark:bg-gray-900 text-gray-500 border-gray-200 dark:border-gray-700 hover:bg-blue-50 hover:text-blue-600'
                                }`}
                        >
                            <UserCheck className="w-5 h-5" />
                            <span className="text-sm font-bold">Identificado</span>
                        </button>
                    </div>

                    {!isAnonymous && (
                        <div className="mt-4 space-y-3 animate-fade-in-up">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome Completo</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        id="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full pl-10 p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Seu nome completo"
                                    />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="cpf" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CPF</label>
                                <div className="relative">
                                    <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        id="cpf"
                                        value={cpf}
                                        onChange={handleCpfChange}
                                        maxLength={14}
                                        className="w-full pl-10 p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="000.000.000-00"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* 1. Text Area - Primary Focus */}
                <div>
                    <label htmlFor="manifestation-text" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex justify-between">
                        <span className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            1º Passo: Escreva seu relato
                        </span>
                        {!isOnline && <span className="text-yellow-600 flex items-center gap-1 text-xs font-bold"><WifiOff className="w-3 h-3" /> Modo Offline</span>}
                    </label>
                    <textarea
                        id="manifestation-text"
                        rows={6}
                        className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[180px] bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all resize-none shadow-inner text-lg"
                        placeholder="Descreva com detalhes o que aconteceu, onde, quando e quem estava envolvido..."
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                    ></textarea>
                    <p className="text-xs text-gray-500 mt-1">Mínimo 20 caracteres • {text.length} digitados</p>
                </div>

                {/* 2. Type Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        2º Passo: Escolha a classificação (a IZA pode sugerir outra)
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {manifestationTypes.map(type => (
                            <button
                                key={type}
                                type="button"
                                onClick={() => setSelectedType(type)}
                                className={`p-3 rounded-lg border text-sm font-medium transition-all ${selectedType === type
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-[1.02]'
                                    : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-blue-400'
                                    }`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 3. Attachments */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                        <ImageIcon className="w-4 h-4" />
                        3º Passo: Anexar arquivos (opcional)
                    </label>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Audio Recording */}
                        <div className="border border-gray-200 dark:border-gray-700 p-4 rounded-lg bg-white dark:bg-gray-800">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                                <Mic className="w-4 h-4" /> Gravar Áudio
                            </label>
                            <div className="flex items-center gap-4">
                                {!isRecording ? (
                                    <button
                                        type="button"
                                        onClick={startRecording}
                                        className="flex items-center justify-center space-x-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                    >
                                        <Mic className="w-4 h-4" />
                                        <span>Gravar</span>
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={stopRecording}
                                        className="flex items-center justify-center space-x-2 bg-gray-800 text-white px-4 py-2 rounded-full hover:bg-gray-700 transition-colors"
                                    >
                                        <Square className="w-4 h-4" />
                                        <span>Parar</span>
                                    </button>
                                )}

                                {audioUrl && (
                                    <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 p-2 rounded-lg">
                                        <audio src={audioUrl} controls className="h-8 w-32" />
                                        <button
                                            type="button"
                                            onClick={clearRecording}
                                            className="text-gray-500 hover:text-gray-700 p-1 hover:bg-gray-100 rounded-full"
                                            aria-label="Remover áudio"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Images */}
                        <div className="border border-gray-200 dark:border-gray-700 p-4 rounded-lg bg-white dark:bg-gray-800">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                                <ImageIcon className="w-4 h-4" /> Imagens
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleImageChange}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                            />
                            {images.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {images.map((img, idx) => (
                                        <div key={idx} className="relative group">
                                            <img
                                                src={URL.createObjectURL(img)}
                                                alt={`Preview ${idx}`}
                                                className="h-16 w-16 object-cover rounded-md border border-gray-300"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeImage(idx)}
                                                className="absolute -top-1 -right-1 bg-gray-600 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Video */}
                        <div className="border border-gray-200 dark:border-gray-700 p-4 rounded-lg bg-white dark:bg-gray-800 md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                                <Video className="w-4 h-4" /> Vídeo
                            </label>
                            <input
                                type="file"
                                accept="video/*"
                                onChange={handleVideoChange}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                            />
                            {videoPreview && (
                                <div className="mt-3 relative">
                                    <video src={videoPreview} controls className="w-full max-h-40 rounded-lg bg-black"></video>
                                    <button
                                        type="button"
                                        onClick={() => { setVideo(null); setVideoPreview(null); }}
                                        className="absolute top-2 right-2 bg-gray-600 text-white rounded-full p-1 shadow hover:bg-gray-700 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Limite: 25MB por arquivo • Formatos: pdf, png, jpg, jpeg, mp3, mp4</p>
                </div>

                {/* 4. Terms of Service Checkbox */}
                <div className="border border-gray-200 dark:border-gray-700 p-4 rounded-lg bg-gray-50 dark:bg-gray-900">
                    <label className="flex items-start gap-3 cursor-pointer group">
                        <div className="relative mt-0.5">
                            <input
                                type="checkbox"
                                checked={agreedToTerms}
                                onChange={(e) => setAgreedToTerms(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-all ${agreedToTerms
                                ? 'bg-blue-600 border-blue-600'
                                : 'border-gray-300 dark:border-gray-600 group-hover:border-blue-400'
                                }`}>
                                {agreedToTerms && <Check className="w-3 h-3 text-white" />}
                            </div>
                        </div>
                        <div className="flex-1">
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                                4º Passo: Li e concordo com os{' '}
                                <button
                                    type="button"
                                    onClick={() => setShowTermsModal(true)}
                                    className="text-blue-600 hover:text-blue-700 underline font-medium"
                                >
                                    Termos de Uso
                                </button>
                                {' '}e a{' '}
                                <button
                                    type="button"
                                    onClick={() => setShowPrivacyModal(true)}
                                    className="text-blue-600 hover:text-blue-700 underline font-medium"
                                >
                                    Política de Privacidade
                                </button>
                            </span>
                        </div>
                    </label>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={analyzing}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-4 px-6 rounded-full transition-all shadow-lg hover:shadow-blue-500/30 flex items-center justify-center gap-2 group text-lg"
                >
                    {analyzing ? (
                        <>
                            <Sparkles className="w-5 h-5 animate-spin" />
                            A IZA está analisando...
                        </>
                    ) : (
                        <>
                            <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            Confirmar e Enviar
                        </>
                    )}
                </button>
            </form>
        </div>
    );
};

export default ManifestationForm;
