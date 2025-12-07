import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import RequireAdmin from './components/RequireAdmin';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminPage from './pages/AdminPage';
import SettingsPage from './pages/SettingsPage';
import TestCasesPage from './pages/TestCasesPage';
import PlansPage from './pages/PlansPage';
import CreatePlanPage from './pages/CreatePlanPage';
import PlanDetailPage from './pages/PlanDetailPage';
import DashboardPage from './pages/DashboardPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Routes with Layout */}
          <Route element={<Layout />}>
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <DashboardPage />
                </PrivateRoute>
              }
            />
            
            <Route
              path="/testcases"
              element={
                <PrivateRoute>
                  <TestCasesPage />
                </PrivateRoute>
              }
            />

            <Route
              path="/plans"
              element={
                <PrivateRoute>
                  <PlansPage />
                </PrivateRoute>
              }
            />
            
            <Route
              path="/plans/create"
              element={
                <PrivateRoute>
                  <CreatePlanPage />
                </PrivateRoute>
              }
            />
            
            <Route
              path="/plans/:planId"
              element={
                <PrivateRoute>
                  <PlanDetailPage />
                </PrivateRoute>
              }
            />

            <Route
              path="/admin"
              element={
                <PrivateRoute>
                  <RequireAdmin>
                    <AdminPage />
                  </RequireAdmin>
                </PrivateRoute>
              }
            />

            <Route
              path="/settings"
              element={
                <PrivateRoute>
                  <SettingsPage />
                </PrivateRoute>
              }
            />
          </Route>

          {/* 404 Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
