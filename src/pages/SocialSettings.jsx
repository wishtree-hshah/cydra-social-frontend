import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import { socialMediaAPI } from '../config/api';
import { useToast } from '../context/ToastContext';
import ConfirmationModal from '../components/ConfirmationModal';
import './SocialSettings.css';
function SocialSettings() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [user, setUser] = useState(null);
    const [connectedAccounts, setConnectedAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [error, setError] = useState(null);
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        platform: null
    });

    const platforms = [
        { id: 'facebook', name: 'Facebook', icon: '📘', color: '#1877F2' },
        { id: 'instagram', name: 'Instagram', icon: '📷', color: '#E4405F' },
        { id: 'twitter', name: 'Twitter', icon: '🐦', color: '#1DA1F2' },
        { id: 'linkedin', name: 'LinkedIn', icon: '💼', color: '#0A66C2' },
    ];

    useEffect(() => {
        // Get user data from localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }

        // Check if access token exists
        const token = localStorage.getItem('accessToken');
        if (!token) {
            navigate(ROUTES.LOGIN);
            return;
        }

        // Load connected accounts
        loadConnectedAccounts();
    }, [navigate]);

    const loadConnectedAccounts = async () => {
        try {
            setLoading(true);
            setError(null);
            const accounts = await socialMediaAPI.getConnectedAccounts();
            setConnectedAccounts(accounts);
        } catch (err) {
            console.error('Error loading connected accounts:', err);
            setError('Failed to load connected accounts');
        } finally {
            setLoading(false);
        }
    };

    const handleConnect = async (platform) => {
        try {
            setActionLoading(platform);
            setError(null);

            // Get authorization URL
            const { authorization_url } = await socialMediaAPI.getAuthorizationUrl(platform);

            // Open OAuth in a popup window
            const width = 600;
            const height = 700;
            const left = window.screen.width / 2 - width / 2;
            const top = window.screen.height / 2 - height / 2;

            const popup = window.open(
                authorization_url,
                `${platform}_oauth`,
                `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
            );

            // Check if popup was blocked
            if (!popup || popup.closed || typeof popup.closed === 'undefined') {
                throw new Error('Popup was blocked. Please allow popups for this site.');
            }

            // Monitor popup and reload accounts when it closes
            const popupInterval = setInterval(() => {
                if (popup.closed) {
                    clearInterval(popupInterval);
                    // Reload connected accounts after OAuth flow
                    loadConnectedAccounts();
                    setActionLoading(null);
                }
            }, 500);

        } catch (err) {
            console.error(`Error connecting ${platform}:`, err);
            setError(err.message || `Failed to connect ${platform}. Please try again.`);
            setActionLoading(null);
        }
    };

    const openDisconnectModal = (platform) => {
        setConfirmModal({
            isOpen: true,
            platform
        });
    };

    const closeDisconnectModal = () => {
        setConfirmModal({
            isOpen: false,
            platform: null
        });
    };

    const handleDisconnect = async () => {
        const platform = confirmModal.platform;
        closeDisconnectModal();

        try {
            setActionLoading(platform);
            setError(null);

            await socialMediaAPI.disconnectPlatform(platform);

            // Reload connected accounts
            await loadConnectedAccounts();
            setActionLoading(null);

            showToast(`${platform.charAt(0).toUpperCase() + platform.slice(1)} disconnected successfully`, 'success');
        } catch (err) {
            console.error(`Error disconnecting ${platform}:`, err);
            const errorMessage = err.response?.data?.detail || `Failed to disconnect ${platform}. Please try again.`;
            setError(errorMessage);
            showToast(errorMessage, 'error');
            setActionLoading(null);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('tokenType');
        localStorage.removeItem('user');
        localStorage.removeItem('workspace');
        navigate(ROUTES.LOGIN);
    };

    const isPlatformConnected = (platformId) => {
        return connectedAccounts.some(account => account.platform.toLowerCase() === platformId.toLowerCase());
    };

    const getConnectedAccount = (platformId) => {
        return connectedAccounts.find(account => account.platform.toLowerCase() === platformId.toLowerCase());
    };

    return (
        <div className="dashboard-layout">
            {/* Sidebar */}
            <aside className="dashboard-sidebar">
                <div className="sidebar-header">
                    <h2 className="sidebar-logo">CYNDRA Social</h2>
                </div>

                <nav className="sidebar-nav">
                    <button className="nav-item" onClick={() => navigate(ROUTES.DASHBOARD)}>
                        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        Dashboard
                    </button>
                    <button className="nav-item" onClick={() => navigate(ROUTES.CREATE_POST)}>
                        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Create Post
                    </button>
                    <button className="nav-item" onClick={() => navigate(ROUTES.CONTENT_LIBRARY)}>
                        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        Content Library
                    </button>
                    <button className="nav-item active">
                        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Settings
                    </button>
                </nav>
            </aside>

            {/* Main Content */}
            <div className="dashboard-main">
                {/* Header */}
                <header className="dashboard-header">
                    <div className="header-left">
                        <h1>Social Media Settings</h1>
                        <p className="header-subtitle">Connect and manage your social media accounts</p>
                    </div>
                    <div className="header-right">
                        <button onClick={handleLogout} className="btn-logout">
                            Logout
                        </button>
                    </div>
                </header>

                {/* Main Content Area */}
                <div className="social-settings-content">
                    {error && (
                        <div className="error-message">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {error}
                        </div>
                    )}

                    <div className="platforms-grid">
                        {platforms.map((platform) => {
                            const isConnected = isPlatformConnected(platform.id);
                            const account = getConnectedAccount(platform.id);
                            const isActionInProgress = actionLoading === platform.id;

                            return (
                                <div key={platform.id} className={`platform-card ${isConnected ? 'connected' : ''}`}>
                                    <div className="platform-header">
                                        <div className="platform-icon" style={{ backgroundColor: platform.color }}>
                                            <span>{platform.icon}</span>
                                        </div>
                                        <div className="platform-info">
                                            <h3>{platform.name}</h3>
                                            {isConnected && account && (
                                                <p className="platform-username">@{account.platform_username}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="platform-status">
                                        {isConnected ? (
                                            <>
                                                <span className="status-badge connected">
                                                    <span className="status-dot"></span>
                                                    Connected
                                                </span>
                                                {account && (
                                                    <p className="connection-date">
                                                        Connected on {new Date(account.created_at).toLocaleDateString()}
                                                    </p>
                                                )}
                                            </>
                                        ) : (
                                            <span className="status-badge disconnected">
                                                <span className="status-dot"></span>
                                                Not Connected
                                            </span>
                                        )}
                                    </div>

                                    <div className="platform-actions">
                                        {isConnected ? (
                                            <button
                                                className="btn-disconnect"
                                                onClick={() => openDisconnectModal(platform.id)}
                                                disabled={isActionInProgress}
                                            >
                                                {isActionInProgress ? (
                                                    <>
                                                        <span className="spinner"></span>
                                                        Disconnecting...
                                                    </>
                                                ) : (
                                                    'Disconnect'
                                                )}
                                            </button>
                                        ) : (
                                            <button
                                                className="btn-connect"
                                                onClick={() => handleConnect(platform.id)}
                                                disabled={isActionInProgress}
                                                style={{ backgroundColor: platform.color }}
                                            >
                                                {isActionInProgress ? (
                                                    <>
                                                        <span className="spinner"></span>
                                                        Connecting...
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                        </svg>
                                                        Connect {platform.name}
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {loading && (
                        <div className="loading-overlay">
                            <div className="spinner-large"></div>
                            <p>Loading connected accounts...</p>
                        </div>
                    )}
                </div>

                {/* Disconnect Confirmation Modal */}
                <ConfirmationModal
                    isOpen={confirmModal.isOpen}
                    title="Disconnect Platform"
                    message={`Are you sure you want to disconnect ${confirmModal.platform ? confirmModal.platform.charAt(0).toUpperCase() + confirmModal.platform.slice(1) : ''}? You can reconnect anytime.`}
                    confirmText="Disconnect"
                    cancelText="Cancel"
                    variant="danger"
                    onConfirm={handleDisconnect}
                    onCancel={closeDisconnectModal}
                />
            </div>
        </div>
    );
}

export default SocialSettings;
