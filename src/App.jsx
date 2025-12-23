import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
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
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#4ade80',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
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
    </>
  );
}

export default App;
