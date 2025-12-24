import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { workspaceAPI } from '../config/api';
import { ROUTES } from '../constants/routes';
import './WorkspaceSetup.css'; // Reusing the workspace setup styles

function WorkspaceSettings() {
    const navigate = useNavigate();
    const [workspace, setWorkspace] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        type: '',
        industry: '',
        timezone: '',
        description: '',
        address: ''
    });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);

    const businessTypes = [
        'Sole Proprietorship',
        'Partnership',
        'LLC',
        'Corporation',
        'Non-Profit',
        'Other'
    ];

    const timezones = [
        'America/New_York',
        'America/Chicago',
        'America/Denver',
        'America/Los_Angeles',
        'America/Phoenix',
        'Europe/London',
        'Europe/Paris',
        'Europe/Berlin',
        'Asia/Tokyo',
        'Asia/Shanghai',
        'Asia/Dubai',
        'Asia/Kolkata',
        'Australia/Sydney',
        'Pacific/Auckland',
        'UTC'
    ];

    useEffect(() => {
        loadWorkspace();
    }, []);

    const loadWorkspace = async () => {
        try {
            setIsLoading(true);
            const data = await workspaceAPI.getWorkspace();
            setWorkspace(data);
            setFormData({
                name: data.name || '',
                type: data.type || '',
                industry: data.industry || '',
                timezone: data.timezone || '',
                description: data.description || '',
                address: data.address || ''
            });
        } catch (error) {
            console.error('Error loading workspace:', error);
            toast.error('Failed to load workspace settings');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Business name is required';
        }

        if (!formData.type) {
            newErrors.type = 'Please select a business type';
        }

        if (!formData.industry) {
            newErrors.industry = 'Industry is required';
        }

        if (!formData.timezone) {
            newErrors.timezone = 'Please select a timezone';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsUpdating(true);
        setErrors(prev => ({ ...prev, general: '' }));

        try {
            await workspaceAPI.updateWorkspace(formData);
            toast.success('Workspace updated successfully!');
            await loadWorkspace();
        } catch (error) {
            console.error('Workspace update error:', error);
            if (error.response) {
                const { status, data } = error.response;
                if (status === 422) {
                    if (data.detail && Array.isArray(data.detail)) {
                        const validationErrors = {};
                        data.detail.forEach(err => {
                            const field = err.loc[err.loc.length - 1];
                            validationErrors[field] = err.msg;
                        });
                        setErrors(validationErrors);
                    } else {
                        setErrors({ general: 'Validation failed. Please check your input.' });
                    }
                } else {
                    setErrors({ general: data.detail || 'Failed to update workspace. Please try again.' });
                }
            } else {
                setErrors({ general: 'An unexpected error occurred. Please try again.' });
            }
        } finally {
            setIsUpdating(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('tokenType');
        localStorage.removeItem('user');
        localStorage.removeItem('workspace');
        navigate(ROUTES.LOGIN);
    };

    if (isLoading) {
        return (
            <div className="workspace-container">
                <div className="workspace-card">
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <div className="spinner" style={{
                            width: '40px',
                            height: '40px',
                            border: '4px solid #e2e8f0',
                            borderTopColor: '#4299e1',
                            borderRadius: '50%',
                            animation: 'spin 0.8s linear infinite',
                            margin: '0 auto 16px'
                        }}></div>
                        <p>Loading workspace settings...</p>
                    </div>
                </div>
            </div>
        );
    }

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
                </nav>

                <div className="sidebar-footer">
                    <button className="nav-item active">
                        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Workspace
                    </button>
                    <button className="nav-item" onClick={() => navigate(ROUTES.SOCIAL_SETTINGS)}>
                        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Settings
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="dashboard-main">
                {/* Header */}
                <header className="dashboard-header">
                    <div className="header-left">
                        <h1>Workspace Settings</h1>
                        <p className="header-subtitle">Manage your business information</p>
                    </div>
                    <div className="header-right">
                        <button onClick={handleLogout} className="btn-logout">
                            Logout
                        </button>
                    </div>
                </header>

                {/* Workspace Settings Form */}
                <div className="dashboard-content">
                    <div className="workspace-card" style={{ maxWidth: '100%', margin: '0' }}>
                        <form onSubmit={handleSubmit} className="workspace-form">
                            {errors.general && (
                                <div className="error-message general-error">
                                    {errors.general}
                                </div>
                            )}

                            <div className="form-group">
                                <label htmlFor="name">
                                    Business Legal Name <span className="required">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className={errors.name ? 'error' : ''}
                                    placeholder="Enter your business legal name"
                                />
                                {errors.name && (
                                    <span className="error-message">{errors.name}</span>
                                )}
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="type">
                                        Business Type <span className="required">*</span>
                                    </label>
                                    <select
                                        id="type"
                                        name="type"
                                        value={formData.type}
                                        onChange={handleChange}
                                        className={errors.type ? 'error' : ''}
                                    >
                                        <option value="">Select Type</option>
                                        {businessTypes.map(type => (
                                            <option key={type} value={type}>
                                                {type}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.type && (
                                        <span className="error-message">{errors.type}</span>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label htmlFor="timezone">
                                        Business Timezone <span className="required">*</span>
                                    </label>
                                    <select
                                        id="timezone"
                                        name="timezone"
                                        value={formData.timezone}
                                        onChange={handleChange}
                                        className={errors.timezone ? 'error' : ''}
                                    >
                                        <option value="">Select timezone</option>
                                        {timezones.map(tz => (
                                            <option key={tz} value={tz}>
                                                {tz.replace(/_/g, ' ')}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.timezone && (
                                        <span className="error-message">{errors.timezone}</span>
                                    )}
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="industry">
                                    Industry / Practice Area <span className="required">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="industry"
                                    name="industry"
                                    value={formData.industry}
                                    onChange={handleChange}
                                    className={errors.industry ? 'error' : ''}
                                    placeholder="e.g., Employment Law, HR Consulting, Real Estate"
                                />
                                <small className="field-hint">Separate multiple areas with commas</small>
                                {errors.industry && (
                                    <span className="error-message">{errors.industry}</span>
                                )}
                            </div>

                            <div className="form-group">
                                <label htmlFor="description">
                                    Business Description
                                </label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    className={errors.description ? 'error' : ''}
                                    placeholder="e.g., Boutique employment law firm serving SMBs in Maryland"
                                    rows="3"
                                />
                                {errors.description && (
                                    <span className="error-message">{errors.description}</span>
                                )}
                            </div>

                            <div className="form-group">
                                <label htmlFor="address">
                                    Business Address
                                </label>
                                <textarea
                                    id="address"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    className={errors.address ? 'error' : ''}
                                    placeholder="123 Main Street, Suite 100&#10;Baltimore, MD 21201"
                                    rows="2"
                                />
                                {errors.address && (
                                    <span className="error-message">{errors.address}</span>
                                )}
                            </div>

                            <button
                                type="submit"
                                className="btn-primary"
                                disabled={isUpdating}
                            >
                                {isUpdating ? 'Updating...' : 'Update Workspace'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default WorkspaceSettings;
