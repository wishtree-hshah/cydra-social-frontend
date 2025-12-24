import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { workspaceAPI } from '../config/api';
import './WorkspaceSetup.css';

function WorkspaceSetup() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: '',
        type: '',
        industry: '',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        description: '',
        address: ''
    });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    const businessTypes = [
        'Sole Proprietorship',
        'Partnership',
        'LLC',
        'Corporation',
        'Non-Profit',
        'Other'
    ];

    const industries = [
        'Technology',
        'Healthcare',
        'Finance',
        'Education',
        'Retail',
        'Manufacturing',
        'Real Estate',
        'Marketing & Advertising',
        'Consulting',
        'Legal Services',
        'HR Consulting',
        'Employment Law',
        'E-commerce',
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

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error when user starts typing
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
        } else if (formData.name.trim().length < 2) {
            newErrors.name = 'Business name must be at least 2 characters';
        }

        if (!formData.type) {
            newErrors.type = 'Please select a business type';
        }

        if (!formData.industry) {
            newErrors.industry = 'Please select an industry';
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

        setIsLoading(true);
        setErrors(prev => ({ ...prev, general: '' }));

        try {
            const data = await workspaceAPI.createWorkspace({
                name: formData.name,
                type: formData.type,
                industry: formData.industry,
                timezone: formData.timezone,
                description: formData.description,
                address: formData.address,
            });

            console.log('Workspace created:', data);

            // Store workspace data
            localStorage.setItem('workspace', JSON.stringify(data));

            // Show success and redirect
            toast.success('Workspace created successfully!');
            setTimeout(() => {
                navigate('/dashboard');
            }, 500);

        } catch (error) {
            console.error('Workspace creation error:', error);

            if (error.response) {
                const { status, data } = error.response;

                if (status === 401) {
                    setErrors({ general: 'Authentication failed. Please login again.' });
                    setTimeout(() => navigate('/login'), 2000);
                } else if (status === 422) {
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
                    setErrors({ general: data.detail || 'Failed to create workspace. Please try again.' });
                }
            } else if (error.request) {
                setErrors({ general: 'Network error. Please check your connection and try again.' });
            } else {
                setErrors({ general: 'An unexpected error occurred. Please try again.' });
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="workspace-container">
            <div className="workspace-card">
                <div className="workspace-header">
                    <div className="step-indicator">
                        <span className="step-badge">Step 1 of 1</span>
                    </div>
                    <h1>Business Information</h1>
                    <p>Core details about your business</p>
                </div>

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
                            autoFocus
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
                        disabled={isLoading}
                    >
                        {isLoading ? 'Saving...' : 'Save and Continue'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default WorkspaceSetup;
