import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { workspaceAPI } from '../config/api';
import './WorkspaceSetup.css';

function WorkspaceSetup() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        businessName: '',
        industry: '',
        defaultTone: '',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
    });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);

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
        'E-commerce',
        'Other'
    ];

    const tones = [
        'Professional',
        'Casual',
        'Friendly',
        'Formal',
        'Creative',
        'Informative'
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

        if (!formData.businessName.trim()) {
            newErrors.businessName = 'Business name is required';
        } else if (formData.businessName.trim().length < 2) {
            newErrors.businessName = 'Business name must be at least 2 characters';
        }

        if (!formData.industry) {
            newErrors.industry = 'Please select an industry';
        }

        if (!formData.defaultTone) {
            newErrors.defaultTone = 'Please select a default tone';
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
                businessName: formData.businessName,
                industry: formData.industry,
                defaultTone: formData.defaultTone,
                timezone: formData.timezone,
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
                    <h1>Set Up Your Workspace</h1>
                    <p>Let's personalize your experience</p>
                </div>

                <form onSubmit={handleSubmit} className="workspace-form">
                    {errors.general && (
                        <div className="error-message general-error">
                            {errors.general}
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="businessName">
                            Business Name <span className="required">*</span>
                        </label>
                        <input
                            type="text"
                            id="businessName"
                            name="businessName"
                            value={formData.businessName}
                            onChange={handleChange}
                            className={errors.businessName ? 'error' : ''}
                            placeholder="Enter your business name"
                            autoFocus
                        />
                        {errors.businessName && (
                            <span className="error-message">{errors.businessName}</span>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="industry">
                            Industry/Persona <span className="required">*</span>
                        </label>
                        <select
                            id="industry"
                            name="industry"
                            value={formData.industry}
                            onChange={handleChange}
                            className={errors.industry ? 'error' : ''}
                        >
                            <option value="">Select your industry</option>
                            {industries.map(industry => (
                                <option key={industry} value={industry}>
                                    {industry}
                                </option>
                            ))}
                        </select>
                        {errors.industry && (
                            <span className="error-message">{errors.industry}</span>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="defaultTone">
                            Default Tone <span className="required">*</span>
                        </label>
                        <select
                            id="defaultTone"
                            name="defaultTone"
                            value={formData.defaultTone}
                            onChange={handleChange}
                            className={errors.defaultTone ? 'error' : ''}
                        >
                            <option value="">Select default tone</option>
                            {tones.map(tone => (
                                <option key={tone} value={tone}>
                                    {tone}
                                </option>
                            ))}
                        </select>
                        {errors.defaultTone && (
                            <span className="error-message">{errors.defaultTone}</span>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="timezone">
                            Timezone <span className="required">*</span>
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
