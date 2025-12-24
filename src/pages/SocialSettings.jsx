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
        // {
        //     id: 'facebook',
        //     name: 'Facebook',
        //     icon: (
        //         <svg viewBox="0 0 24 24" fill="#1877F2">
        //             <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        //         </svg>
        //     )
        // },
        // {
        //     id: 'instagram',
        //     name: 'Instagram',
        //     icon: (
        //         <svg viewBox="0 0 24 24">
        //             <defs>
        //                 <linearGradient id="instagram-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
        //                     <stop offset="0%" style={{stopColor: '#FED373'}} />
        //                     <stop offset="15%" style={{stopColor: '#F15245'}} />
        //                     <stop offset="30%" style={{stopColor: '#D92E7F'}} />
        //                     <stop offset="50%" style={{stopColor: '#9B36B7'}} />
        //                     <stop offset="85%" style={{stopColor: '#515ECF'}} />
        //                 </linearGradient>
        //             </defs>
        //             <path fill="url(#instagram-gradient)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
        //         </svg>
        //     )
        // },
        {
            id: 'twitter',
            name: 'X',
            icon: (
                <svg viewBox="0 0 24 24" fill="#000000">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
            )
        },
        {
            id: 'linkedin',
            name: 'LinkedIn',
            icon: (
                <svg viewBox="0 0 24 24" fill="#0A66C2">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
            )
        },
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
                                        <div className="platform-icon">
                                            {platform.icon}
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
