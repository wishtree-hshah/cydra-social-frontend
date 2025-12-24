import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreatePost from './pages/CreatePost';
import ContentLibrary from './pages/ContentLibrary';
import SocialSettings from './pages/SocialSettings';
import WorkspaceSetup from './pages/WorkspaceSetup';
import WorkspaceCheck from './components/WorkspaceCheck';
import OAuthCallback from './pages/OAuthCallback';

function App() {
  return (
    <ToastProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Workspace check - determines next route */}
          <Route path="/workspace-check" element={<WorkspaceCheck />} />

          {/* Protected routes */}
          <Route path="/workspace-setup" element={<WorkspaceSetup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/create-post" element={<CreatePost />} />
          <Route path="/content-library" element={<ContentLibrary />} />
          <Route path="/social-settings" element={<SocialSettings />} />
          <Route path="/oauth/callback" element={<OAuthCallback />} />
          <Route path="/oauth/success" element={<OAuthCallback />} />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </ToastProvider>
  );
}

export default App;
