import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import AccessibilityMenu from './components/AccessibilityMenu';
import ManifestationForm from './components/ManifestationForm';
import SuccessPage from './components/SuccessPage';
import AdminLogin from './pages/AdminLogin';
import DashboardLayout from './layouts/DashboardLayout';
import DashboardHome from './pages/dashboard/DashboardHome';
import ManifestationList from './pages/dashboard/ManifestationList';
import VLibras from './components/VLibras';
import { AccessibilityProvider } from './contexts/AccessibilityContext';

function App() {
  return (
    <AccessibilityProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200">
          <VLibras />
          <AccessibilityMenu />

          <Routes>
            {/* Public Routes */}
            <Route path="/" element={
              <>
                <Navbar />
                <main className="container mx-auto px-4 py-8">
                  <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-10 space-y-2">
                      <h1 className="text-4xl font-extrabold text-blue-900 dark:text-blue-100 tracking-tight">
                        Ouvidoria Participa DF
                      </h1>
                      <p className="text-lg text-blue-600 dark:text-blue-300 font-medium max-w-2xl mx-auto">
                        Sua voz transforma nossa cidade. Manifeste-se de forma segura, transparente e inclusiva.
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
            <Route path="/success/:protocol" element={<SuccessPage />} />

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
