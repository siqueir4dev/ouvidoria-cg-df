import React, { useState, type ChangeEvent, type FormEvent } from 'react';
import { useMediaRecorder } from '../hooks/useMediaRecorder';

import { Mic, Square, X, Image as ImageIcon, Video, Send, Shield, User, Sparkles, Bot, Check, ArrowRight, WifiOff } from 'lucide-react';
import { saveOfflineManifestation } from '../services/offlineStorage';

interface ManifestationFormProps {
    onSuccess?: (protocol: string) => void;
}

const ManifestationForm: React.FC<ManifestationFormProps> = ({ onSuccess }) => {
    const [text, setText] = useState('');
    const [selectedType, setSelectedType] = useState('Reclamação'); // Default
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [name, setName] = useState('');
    const [cpf, setCpf] = useState('');

    const [images, setImages] = useState<File[]>([]);
    const [video, setVideo] = useState<File | null>(null);
    const [videoPreview, setVideoPreview] = useState<string | null>(null);


    // Geo & Offline State

    const [isOnline, setIsOnline] = useState(navigator.onLine);

    // IZA AI State
    const [analyzing, setAnalyzing] = useState(false);
    const [izaSuggestion, setIzaSuggestion] = useState<{ suggestedType: string, reasoning: string } | null>(null);

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

    const formatCPF = (value: string) => {
        const numbers = value.replace(/\D/g, '');
        const limited = numbers.slice(0, 11);
        return limited
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})/, '$1-$2')
            .replace(/(-\d{2})\d+?$/, '$1');
    };

    const handleCpfChange = (e: ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value;
        const formatted = formatCPF(rawValue);
        setCpf(formatted);
    };

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

            // Append Files
            images.forEach(img => formData.append('files', img));
            if (video) formData.append('files', video);

            // In a real app we'd append the audio blob here
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
            // Override type if changed
            formData.set('type', finalType);

            // Append Audio if exists
            const audioBlob = await getAudioBlob();
            if (audioBlob) {
                formData.append('files', audioBlob, 'record.webm');
            }

            const response = await fetch('http://localhost:3000/api/v1/manifestations', {
                method: 'POST',
                // Content-Type header skipped so browser sets boundary
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                if (onSuccess) onSuccess(data.protocol);

                // Save to Local History
                const history = JSON.parse(localStorage.getItem('manifestationHeaderHistory') || '[]');
                history.unshift({ protocol: data.protocol, date: new Date().toISOString(), type: finalType });
                localStorage.setItem('manifestationHeaderHistory', JSON.stringify(history.slice(0, 10))); // Keep last 10

                // Reset form
                setText('');
                setSelectedType('Reclamação');
                setIzaSuggestion(null);
                setIsAnonymous(false);
                setName('');
                setCpf('');
                setImages([]);
                setVideo(null);
                setVideoPreview(null);
                setVideoPreview(null);
                clearRecording();
            } else {
                alert('Erro ao enviar manifestação. O servidor respondeu com erro.');
            }
        } catch (error) {
            console.error('Erro de conexão:', error);
            alert('Erro ao conectar com o servidor.');
        }
    }


    const saveOffline = async () => {
        try {
            await saveOfflineManifestation({
                text,
                type: selectedType,
                isAnonymous,
                name: !isAnonymous ? name : undefined,
                cpf: !isAnonymous ? cpf : undefined,

                // Files are tricky in IndexedDB for this demo, skipping for now or warned
            });
            alert('Você está offline. Sua manifestação foi salva no dispositivo e será enviada automaticamente quando a conexão retornar.');

            // Reset form
            setText('');
            setSelectedType('Reclamação');
            setIsAnonymous(false);
            setName('');
            setCpf('');

        } catch (e) {
            console.error(e);
            alert('Erro ao salvar offline.');
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (!isAnonymous && (!name || cpf.length < 14)) {
            alert('Por favor, preencha o Nome e um CPF válido (11 dígitos).');
            return;
        }

        if (text.length < 20) {
            alert('A descrição deve ter no mínimo 20 caracteres para que possamos entender melhor sua solicitação.');
            return;
        }

        // Offline Flow
        if (!isOnline) {
            await saveOffline();
            return;
        }

        // Step 1: Analyze with IZA
        setAnalyzing(true);
        try {
            const formData = new FormData();
            formData.append('analyzeOnly', 'true');
            formData.append('text', text);
            // We still set type in formData even for analysis, but backend might ignore prompt

            const response = await fetch('http://localhost:3000/api/v1/manifestations', {
                method: 'POST',
                body: formData
            });

            const analysis = await response.json();

            const suggested = analysis.suggestedType;
            const matches = suggested.toLowerCase() === selectedType.toLowerCase();

            // If mismatch and reasoning exists, interrupt
            if (analysis.status === 'analysis' && !matches && suggested) {
                setIzaSuggestion({
                    suggestedType: suggested,
                    reasoning: analysis.reasoning
                });
                setAnalyzing(false);
                return; // Stop submission to show modal
            }

            // If matches or error in analysis, proceed to save directly
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

            {/* IZA Intervention Modal */}
            {izaSuggestion && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
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

                {/* 1. Identification (Anonymous Toggle & User Info) */}
                <div className="space-y-4">
                    <div
                        onClick={() => setIsAnonymous(!isAnonymous)}
                        className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors ${isAnonymous
                            ? 'bg-blue-50 border-blue-500 dark:bg-blue-900/30 dark:border-blue-400'
                            : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-750'
                            }`}
                    >
                        <div className="flex flex-col">
                            <span className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                {isAnonymous ? <Shield className="w-5 h-5 text-blue-600" /> : <User className="w-5 h-5 text-gray-500" />}
                                Identificação
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                {isAnonymous ? 'Modo Anônimo Ativado' : 'Desejo me identificar'}
                            </span>
                        </div>

                        <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isAnonymous ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isAnonymous ? 'translate-x-6' : 'translate-x-1'}`}
                            />
                        </div>
                    </div>

                    {!isAnonymous && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in-up">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome Completo</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Seu Nome"
                                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 placeholder-gray-600 dark:placeholder-gray-400"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CPF</label>
                                <input
                                    type="text"
                                    value={cpf}
                                    onChange={handleCpfChange}
                                    placeholder="000.000.000-00"
                                    maxLength={14}
                                    inputMode="numeric"
                                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 placeholder-gray-600 dark:placeholder-gray-400"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* 2. Type Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Classificação</label>
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

                {/* 3. Text Area */}
                <div>
                    <label htmlFor="manifestation-text" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex justify-between">
                        <span>Descrição da Manifestação</span>
                        {!isOnline && <span className="text-yellow-600 flex items-center gap-1 text-xs font-bold"><WifiOff className="w-3 h-3" /> Modo Offline</span>}
                    </label>
                    <textarea
                        id="manifestation-text"
                        rows={5}
                        className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[150px] bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-600 dark:placeholder-gray-400 transition-all resize-none shadow-inner text-lg"
                        placeholder="Descreva sua manifestação com detalhes..."
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                    ></textarea>


                </div>

                {/* Audio Recording */}
                <div className="border border-gray-200 dark:border-gray-700 p-4 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Gravação de Áudio</label>
                    <div className="flex items-center gap-4">
                        {!isRecording ? (
                            <button
                                type="button"
                                onClick={startRecording}
                                className="flex items-center justify-center space-x-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300 px-4 py-2 rounded-full hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                            >
                                <Mic className="w-4 h-4 animate-pulse" />
                                <span>Gravar Áudio</span>
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={stopRecording}
                                className="flex items-center justify-center space-x-2 bg-gray-800 text-white px-4 py-2 rounded-full hover:bg-gray-700 transition-colors"
                            >
                                <Square className="w-4 h-4" />
                                <span>Parar Gravação</span>
                            </button>
                        )}

                        {audioUrl && (
                            <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg">
                                <audio src={audioUrl} controls className="h-8 w-48" />
                                <button
                                    type="button"
                                    onClick={clearRecording}
                                    className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded-full"
                                    aria-label="Remover áudio"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Attachments */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* Images */}
                    <div className="border border-gray-200 dark:border-gray-700 p-4 rounded-lg">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                            <ImageIcon className="w-4 h-4" /> Imagens
                        </label>
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImageChange}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        {images.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                                {images.map((img, idx) => (
                                    <div key={idx} className="relative group">
                                        <img
                                            src={URL.createObjectURL(img)}
                                            alt={`Preview ${idx}`}
                                            className="h-20 w-20 object-cover rounded-md border border-gray-300"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(idx)}
                                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Video */}
                    <div className="border border-gray-200 dark:border-gray-700 p-4 rounded-lg">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                            <Video className="w-4 h-4" /> Vídeo
                        </label>
                        <input
                            type="file"
                            accept="video/*"
                            onChange={handleVideoChange}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                        />
                        {videoPreview && (
                            <div className="mt-3 relative">
                                <video src={videoPreview} controls className="w-full max-h-40 rounded-lg bg-black"></video>
                                <button
                                    type="button"
                                    onClick={() => { setVideo(null); setVideoPreview(null); }}
                                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-600 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

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
                            Enviar Manifestação
                        </>
                    )}
                </button>
            </form>
        </div>
    );
};

export default ManifestationForm;
