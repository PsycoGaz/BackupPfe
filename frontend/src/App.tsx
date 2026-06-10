import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { MyRequestsPage } from './pages/MyRequestsPage';
import { CreateRequestPage } from './pages/CreateRequestPage';
import { TeamRequestPage } from './pages/TeamRequestPage';
import { ManagerValidationPage } from './pages/ManagerValidationPage';
import { RhValidationPage } from './pages/RhValidationPage';
import { FormationsCatalogPage } from './pages/FormationsCatalogPage';
import { FormationsPage } from './pages/FormationsPage';
import { RequestDetailPage } from './pages/RequestDetailPage';
import { DomainsPage } from './pages/DomainsPage';
import { AnalyticsDashboardPage } from './pages/AnalyticsDashboardPage';
import { UserRole } from './types';

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />}
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <DashboardPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/my-requests"
        element={
          <ProtectedRoute>
            <Layout>
              <MyRequestsPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/create-request"
        element={
          <ProtectedRoute>
            <Layout>
              <CreateRequestPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/team-request"
        element={
          <ProtectedRoute roles={[UserRole.MANAGER]}>
            <Layout>
              <TeamRequestPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/manager-validation"
        element={
          <ProtectedRoute roles={[UserRole.MANAGER]}>
            <Layout>
              <ManagerValidationPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/rh-validation"
        element={
          <ProtectedRoute roles={[UserRole.RH]}>
            <Layout>
              <RhValidationPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/formations-catalog"
        element={
          <ProtectedRoute roles={[UserRole.RH, UserRole.ADMIN]}>
            <Layout>
              <FormationsCatalogPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/domains"
        element={
          <ProtectedRoute roles={[UserRole.RH, UserRole.ADMIN]}>
            <Layout>
              <DomainsPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/analytics"
        element={
          <ProtectedRoute roles={[UserRole.RH, UserRole.ADMIN]}>
            <Layout>
              <AnalyticsDashboardPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/requests/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <RequestDetailPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/formations"
        element={
          <ProtectedRoute>
            <Layout>
              <FormationsPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}

export default App;
