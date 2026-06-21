import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Layout from './components/Layout';
import Overview from './pages/Overview';
import Users from './pages/Users';
import UserDetail from './pages/UserDetail';
import AiAnalytics from './pages/AiAnalytics';
import ContentAnalytics from './pages/ContentAnalytics';
import EngagementAnalytics from './pages/EngagementAnalytics';

function ProtectedRoute({ children }) {
  const secret = localStorage.getItem('adminSecret');
  if (!secret) return <Navigate to="/" replace />;
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route path="overview" element={<Overview />} />
          <Route path="users" element={<Users />} />
          <Route path="users/:id" element={<UserDetail />} />
          <Route path="ai-analytics" element={<AiAnalytics />} />
          <Route path="content-analytics" element={<ContentAnalytics />} />
          <Route path="engagement" element={<EngagementAnalytics />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
