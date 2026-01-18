
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './features/auth/AuthProvider';
import { Toaster } from 'sonner'; // <--- Import Toaster


// Route Guards
import { ApplicantRoute } from './routes/ApplicantRoute';
import { StaffRoute } from './routes/StaffRoute';
import { AdminRoute } from './routes/AdminRoute';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './features/auth/LoginPage';
import SignupPage from './features/auth/SignupPage';
import ForgotPasswordPage from './features/auth/ForgotPasswordPage';
import UpdatePasswordPage from './features/auth/UpdatePasswordPage';
import ApplicationWizard from './features/application/ApplicationWizard';
import UnderwriterDashboard from './features/underwriter/UnderwriterDashboard';
import ApplicationDetail from './features/underwriter/ApplicationDetail'; // Ensure this import exists
import AdminDashboard from './features/admin/AdminDashboard';
import CreateUnderwriterPage from './features/admin/CreateUnderwriterPage';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
                    <Toaster position="top-right" richColors closeButton />

          <Routes>
            {/* Public */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/update-password" element={<UpdatePasswordPage />} />

            {/* Applicant - Now at /dashboard */}
            <Route path="/dashboard" element={
              <ApplicantRoute>
                <ApplicationWizard />
              </ApplicantRoute>
            } />

            {/* Staff (Underwriter + Admin) */}
            <Route path="/underwriter" element={
              <StaffRoute>
                <UnderwriterDashboard />
              </StaffRoute>
            } />
            
            {/* MISSING ROUTE FIX: Application Detail View for Staff */}
            <Route path="/applications/:id" element={
              <StaffRoute>
                <ApplicationDetail />
              </StaffRoute>
            } />

            {/* Admin Only */}
            <Route path="/admin" element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } />
            <Route path="/admin/create-user" element={
              <AdminRoute>
                <CreateUnderwriterPage />
              </AdminRoute>
            } />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;