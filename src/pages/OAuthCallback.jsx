import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function OAuthCallback() {
    const navigate = useNavigate();
    const location = useLocation();
    const [platform, setPlatform] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    const platformIcons = {
        facebook: '📘',
        instagram: '📷',
        twitter: '🐦',
        linkedin: '💼'
    };

    useEffect(() => {
        // Get the current URL parameters
        const urlParams = new URLSearchParams(location.search);
        const platformParam = urlParams.get('platform');
        const success = urlParams.get('success');
        const error = urlParams.get('error');

        if (platformParam) {
            setPlatform(platformParam);
        }

        // Check if this is the success route
        const isSuccessRoute = location.pathname.includes('/oauth/success');

        if (isSuccessRoute || success === 'true' || !error) {
            setIsSuccess(true);

            // Close popup after showing success message
            setTimeout(() => {
                if (window.opener) {
                    window.close();
                } else {
                    navigate('/social-settings');
                }
            }, 2000);
        } else {
            // If there was an error, close after brief delay
            setTimeout(() => {
                if (window.opener) {
                    window.close();
                } else {
                    navigate('/social-settings');
                }
            }, 2000);
        }
    }, [navigate, location]);

    const platformName = platform.charAt(0).toUpperCase() + platform.slice(1);
    const platformIcon = platformIcons[platform] || '🔗';

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            textAlign: 'center',
            padding: '2rem'
        }}>
            <div style={{
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                padding: '3rem 4rem',
                borderRadius: '20px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
            }}>
                {isSuccess ? (
                    <>
                        <div style={{
                            width: '100px',
                            height: '100px',
                            margin: '0 auto 1.5rem',
                            background: 'rgba(16, 185, 129, 0.2)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '3rem',
                            animation: 'scaleIn 0.3s ease-out'
                        }}>
                            ✓
                        </div>
                        <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.75rem', fontWeight: '700' }}>
                            {platformIcon} {platformName} Connected!
                        </h2>
                        <p style={{ margin: 0, fontSize: '1rem', opacity: 0.9 }}>
                            Your {platformName} account has been successfully connected
                        </p>
                        <p style={{ margin: '1rem 0 0 0', fontSize: '0.875rem', opacity: 0.7 }}>
                            This window will close automatically...
                        </p>
                    </>
                ) : (
                    <>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            margin: '0 auto 1.5rem',
                            border: '4px solid white',
                            borderTopColor: 'transparent',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                        }}></div>
                        <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.5rem' }}>
                            Connecting Account...
                        </h2>
                        <p style={{ margin: 0, fontSize: '1rem', opacity: 0.9 }}>
                            This window will close automatically
                        </p>
                    </>
                )}
            </div>
            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                @keyframes scaleIn {
                    from {
                        transform: scale(0);
                        opacity: 0;
                    }
                    to {
                        transform: scale(1);
                        opacity: 1;
                    }
                }
            `}</style>
        </div>
    );
}

export default OAuthCallback;
