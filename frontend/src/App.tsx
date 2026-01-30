
import { BrowserRouter, Routes, Route, Navigate, useParams, useNavigate, Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import Navbar from './components/Navbar';
import AccessibilityMenu from './components/AccessibilityMenu';
import ManifestationForm from './components/ManifestationForm';
import SuccessPage from './components/SuccessPage';
import AdminLogin from './pages/AdminLogin';
import ProtocolsPage from './pages/ProtocolsPage';
import DashboardLayout from './layouts/DashboardLayout';
import DashboardHome from './pages/dashboard/DashboardHome';
import ManifestationList from './pages/dashboard/ManifestationList';
import NotFound from './pages/NotFound';
import { AccessibilityProvider } from './contexts/AccessibilityContext';

// Helper Wrapper to extract params and pass to SuccessPage
const SuccessPageWrapper = () => {
  const { protocol } = useParams<{ protocol: string }>();
  const navigate = useNavigate();
  // Pass empty string if undefined to satisfy type, or handle error
  return <SuccessPage protocol={protocol || ''} onBack={() => navigate('/')} />;
};

import { useEffect } from 'react';
import { getPendingManifestations, deleteManifestation } from './services/offlineStorage';

function App() {

  useEffect(() => {
    const syncOfflineData = async () => {
      try {
        if (!navigator.onLine) return;

        const pending = await getPendingManifestations();
        if (pending.length === 0) return;

        console.log(`Syncing ${pending.length} offline manifestations...`);
        let syncedCount = 0;

        for (const item of pending) {
          try {
            const formData = new FormData();
            formData.append('text', item.text);
            formData.append('type', item.type);
            formData.append('isAnonymous', String(item.isAnonymous));

            // Re-attach stored blobs if they were successfully saved
            // Note: DB storage for blobs is experimental in this MVP, might be missing if browser cleared it.
            if (item.images && item.images.length > 0) {
              item.images.forEach(img => formData.append('files', img));
            }
            if (item.video) formData.append('files', item.video);
            if (item.audio) formData.append('files', item.audio, 'record.webm');

            // If we had name/cpf stored (which we decided to skip for now in form but good to handle if expanded)
            // formData.append('name', item.name || ''); 
            // formData.append('cpf', item.cpf || '');

            const response = await fetch('http://localhost:3000/api/v1/manifestations', {
              method: 'POST',
              body: formData
            });

            if (response.ok) {
              const data = await response.json();
              await deleteManifestation(item.id!);
              syncedCount++;

              // Add to local history so user sees it in "Consultar"
              const history = JSON.parse(localStorage.getItem('manifestationHeaderHistory') || '[]');
              history.unshift({ protocol: data.protocol, date: new Date().toISOString(), type: item.type });
              localStorage.setItem('manifestationHeaderHistory', JSON.stringify(history.slice(0, 10)));
            }
          } catch (err) {
            console.error('Failed to sync item:', item.id, err);
          }
        }

        if (syncedCount > 0) {
          alert(`${syncedCount} manifestação(ões) salva(s) offline foi(ram) enviada(s) com sucesso!`);
        }
      } catch (error) {
        console.error('Error during offline sync:', error);
      }
    };

    // Try to sync on mount if online
    syncOfflineData();

    // Listen for online event
    window.addEventListener('online', syncOfflineData);

    return () => {
      window.removeEventListener('online', syncOfflineData);
    };
  }, []);

  return (
    <AccessibilityProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200">
          {/* VLibras is now loaded directly in index.html */}
          <AccessibilityMenu />

          <Routes>
            {/* Public Routes */}
            <Route path="/" element={
              <>
                <Navbar />
                <main className="container mx-auto px-4 py-8">
                  <div className="max-w-4xl mx-auto">
                    {/* Consultar Protocolo Button - Top */}
                    <div className="mb-6">
                      <Link
                        to="/protocolos"
                        className="inline-flex items-center gap-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors font-medium text-sm"
                      >
                        <Search className="w-4 h-4" />
                        Consultar Protocolo
                      </Link>
                    </div>

                    <div className="text-center mb-10 space-y-2">
                      <h1 className="text-4xl font-extrabold text-blue-900 dark:text-blue-100 tracking-tight">
                        Ouvidoria Participa DF
                      </h1>
                      <p className="text-lg text-blue-600 dark:text-blue-300 font-medium max-w-2xl mx-auto">
                        Sua voz transforma nossa cidade. Manifeste-se de forma segura, transparente e inclusiva.
                      </p>
                      <p className="text-sm text-gray-500 font-medium bg-gray-100 dark:bg-gray-800 py-1 px-3 rounded-full inline-block mt-2 border border-gray-200 dark:border-gray-700">
                        Este site não possui vínculo oficial com a administração pública.
                      </p>
                    </div>

                    <div className="grid gap-8">
                      <div id="manifest-form" className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8 ring-1 ring-gray-100 dark:ring-gray-700">
                        <ManifestationForm onSuccess={(protocol) => window.location.href = `/success/${protocol}`} />
                      </div>
                    </div>
                  </div>
                </main>
              </>
            } />
            <Route path="/protocolos" element={<ProtocolsPage />} />
            <Route path="/success/:protocol" element={<SuccessPageWrapper />} />

            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />

            <Route path="/admin" element={<DashboardLayout />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardHome />} />
              <Route path="manifestations" element={<ManifestationList />} />
            </Route>

            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />

          </Routes>
        </div>
      </BrowserRouter>
    </AccessibilityProvider>
  );
}

export default App;
