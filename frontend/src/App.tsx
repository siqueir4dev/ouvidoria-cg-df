
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
import { AccessibilityProvider } from './contexts/AccessibilityContext';

// Helper Wrapper to extract params and pass to SuccessPage
const SuccessPageWrapper = () => {
  const { protocol } = useParams<{ protocol: string }>();
  const navigate = useNavigate();
  // Pass empty string if undefined to satisfy type, or handle error
  return <SuccessPage protocol={protocol || ''} onBack={() => navigate('/')} />;
};

function App() {
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

          </Routes>
        </div>
      </BrowserRouter>
    </AccessibilityProvider>
  );
}

export default App;
