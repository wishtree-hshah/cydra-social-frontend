import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { workspaceAPI } from '../config/api';
import { ROUTES } from '../constants/routes';

/**
 * Component that checks workspace status and redirects accordingly
 * - If workspace exists: redirect to dashboard
 * - If workspace doesn't exist: redirect to workspace setup
 */
function WorkspaceCheck() {
    const navigate = useNavigate();
    const [isChecking, setIsChecking] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const checkWorkspace = async () => {
            try {
                // Check if user has access token
                const token = localStorage.getItem('accessToken');
                if (!token) {
                    navigate(ROUTES.LOGIN);
                    return;
                }

                // Call workspace API to check if workspace exists
                const workspaceData = await workspaceAPI.getWorkspace();

                // If workspace data exists, redirect to dashboard
                if (workspaceData && workspaceData.id) {
                    console.log('Workspace exists:', workspaceData);
                    localStorage.setItem('workspace', JSON.stringify(workspaceData));
                    navigate(ROUTES.DASHBOARD);
                } else {
                    // No workspace found, redirect to setup
                    navigate(ROUTES.WORKSPACE_SETUP);
                }
            } catch (error) {
                console.error('Error checking workspace:', error);

                if (error.response) {
                    const { status } = error.response;

                    if (status === 401) {
                        // Unauthorized - clear tokens and redirect to login
                        localStorage.removeItem('accessToken');
                        localStorage.removeItem('tokenType');
                        localStorage.removeItem('user');
                        navigate(ROUTES.LOGIN);
                    } else if (status === 404) {
                        // Workspace not found - redirect to setup
                        navigate(ROUTES.WORKSPACE_SETUP);
                    } else {
                        setError('Failed to check workspace. Please try again.');
                    }
                } else {
                    setError('Network error. Please check your connection.');
                }
            } finally {
                setIsChecking(false);
            }
        };

        checkWorkspace();
    }, [navigate]);

    if (error) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                backgroundColor: '#ffffff',
                flexDirection: 'column',
                padding: '20px'
            }}>
                <div style={{
                    textAlign: 'center',
                    color: '#e53e3e',
                    marginBottom: '20px'
                }}>
                    <p style={{ margin: 0, fontSize: '15px', fontWeight: 500 }}>
                        {error}
                    </p>
                </div>
                <button
                    onClick={() => navigate(ROUTES.LOGIN)}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#4299e1',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 600
                    }}
                >
                    Back to Login
                </button>
            </div>
        );
    }

    if (isChecking) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                backgroundColor: '#ffffff'
            }}>
                <div style={{
                    textAlign: 'center',
                    color: '#4a5568'
                }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        border: '4px solid #e2e8f0',
                        borderTopColor: '#4299e1',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                        margin: '0 auto 16px'
                    }}></div>
                    <p style={{ margin: 0, fontSize: '15px', fontWeight: 500 }}>
                        Loading your workspace...
                    </p>
                    <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
                </div>
            </div>
        );
    }

    return null;
}

export default WorkspaceCheck;
