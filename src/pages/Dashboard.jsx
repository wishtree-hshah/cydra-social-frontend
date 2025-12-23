import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import { postAPI } from '../config/api';
import './Dashboard.css';

function Dashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [statsOverview, setStatsOverview] = useState(null);
    const [statsPlatforms, setStatsPlatforms] = useState([]);
    const [loading, setLoading] = useState(true);

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

        // Fetch statistics
        fetchStats();
    }, [navigate]);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const [overview, platforms] = await Promise.all([
                postAPI.getStatsOverview(),
                postAPI.getStatsPlatforms(),
            ]);
            setStatsOverview(overview);
            setStatsPlatforms(platforms);
        } catch (err) {
            console.error('Error fetching stats:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        // Clear all auth data
        localStorage.removeItem('accessToken');
        localStorage.removeItem('tokenType');
        localStorage.removeItem('user');
        localStorage.removeItem('workspace');

        // Redirect to login
        navigate(ROUTES.LOGIN);
    };

    return (
        <div className="dashboard-layout">
            {/* Sidebar */}
            <aside className="dashboard-sidebar">
                <div className="sidebar-header">
                    <h2 className="sidebar-logo">CYNDRA Social</h2>
                </div>

                <nav className="sidebar-nav">
                    <button className="nav-item active" onClick={() => navigate(ROUTES.DASHBOARD)}>
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
                    <button className="nav-item" onClick={() => navigate(ROUTES.SOCIAL_SETTINGS)}>
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
                        <h1>Dashboard</h1>
                        <p className="header-subtitle">Welcome back, {user?.fullName || user?.full_name || 'User'}</p>
                    </div>
                    <div className="header-right">
                        <button onClick={handleLogout} className="btn-logout">
                            Logout
                        </button>
                    </div>
                </header>

                {/* Main Content Area */}
                <div className="dashboard-content">
                    {/* Quick Actions Section */}
                    <div className="create-post-section">
                        <h2 className="section-title">Quick Actions</h2>
                        <p className="section-subtitle">Get started with your social media management</p>
                        <button className="btn-create-post" onClick={() => navigate(ROUTES.CREATE_POST)}>
                            <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Create New Post
                        </button>
                    </div>

                    {/* Statistics Section */}
                    {loading ? (
                        <div className="stats-loading">Loading statistics...</div>
                    ) : statsOverview && (
                        <>
                            {/* Overview Stats */}
                            <div className="stats-section">
                                <h2 className="section-title">Post Statistics Overview</h2>
                                <div className="stats-grid">
                                    <div className="stat-card">
                                        <div className="stat-icon total">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                        <div className="stat-info">
                                            <span className="stat-label">Total Posts</span>
                                            <span className="stat-value">{statsOverview.total_posts}</span>
                                        </div>
                                    </div>
                                    <div className="stat-card">
                                        <div className="stat-icon scheduled">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <div className="stat-info">
                                            <span className="stat-label">Scheduled</span>
                                            <span className="stat-value">{statsOverview.scheduled_posts}</span>
                                        </div>
                                    </div>
                                    <div className="stat-card">
                                        <div className="stat-icon success">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <div className="stat-info">
                                            <span className="stat-label">Published</span>
                                            <span className="stat-value">{statsOverview.published_posts}</span>
                                        </div>
                                    </div>
                                    <div className="stat-card">
                                        <div className="stat-icon failed">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <div className="stat-info">
                                            <span className="stat-label">Failed</span>
                                            <span className="stat-value">{statsOverview.failed_posts}</span>
                                        </div>
                                    </div>
                                    <div className="stat-card">
                                        <div className="stat-icon info">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <div className="stat-info">
                                            <span className="stat-label">Today</span>
                                            <span className="stat-value">{statsOverview.posts_today}</span>
                                        </div>
                                    </div>
                                    <div className="stat-card">
                                        <div className="stat-icon info">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <div className="stat-info">
                                            <span className="stat-label">This Week</span>
                                            <span className="stat-value">{statsOverview.posts_this_week}</span>
                                        </div>
                                    </div>
                                    <div className="stat-card">
                                        <div className="stat-icon info">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <div className="stat-info">
                                            <span className="stat-label">This Month</span>
                                            <span className="stat-value">{statsOverview.posts_this_month}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Platform Stats */}
                            {statsPlatforms.length > 0 && (
                                <div className="stats-section">
                                    <h2 className="section-title">Platform Statistics</h2>
                                    <div className="platform-stats">
                                        {statsPlatforms.map(platform => (
                                            <div key={platform.platform} className="platform-card">
                                                <div className="platform-header">
                                                    <h3>{platform.platform.charAt(0).toUpperCase() + platform.platform.slice(1)}</h3>
                                                    <span className="success-rate">{platform.success_rate.toFixed(1)}% success</span>
                                                </div>
                                                <div className="platform-stats-grid">
                                                    <div className="platform-stat">
                                                        <span className="platform-stat-label">Total</span>
                                                        <span className="platform-stat-value">{platform.total_posts}</span>
                                                    </div>
                                                    <div className="platform-stat success">
                                                        <span className="platform-stat-label">Completed</span>
                                                        <span className="platform-stat-value">{platform.completed}</span>
                                                    </div>
                                                    <div className="platform-stat failed">
                                                        <span className="platform-stat-label">Failed</span>
                                                        <span className="platform-stat-value">{platform.failed}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
