import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authAPI } from '../config/api';
import { ROUTES } from '../constants/routes';
import './Auth.css';

function Register() {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);

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

        // Full name validation
        if (!formData.fullName.trim()) {
            newErrors.fullName = 'Full name is required';
        } else if (formData.fullName.trim().length < 2) {
            newErrors.fullName = 'Full name must be at least 2 characters';
        }

        // Email validation
        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email is invalid';
        }

        // Password validation
        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
            newErrors.password = 'Password must contain uppercase, lowercase, and number';
        }

        // Confirm password validation
        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
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
        // Clear any previous general errors
        setErrors(prev => ({ ...prev, general: '' }));

        try {
            // Real API call
            const data = await authAPI.signup({
                email: formData.email,
                fullName: formData.fullName,
                password: formData.password,
                confirmPassword: formData.confirmPassword,
            });

            // Success - Status 201
            console.log('Registration successful:', data);

            // Store user data in localStorage
            localStorage.setItem('user', JSON.stringify({
                id: data.id,
                email: data.email,
                fullName: data.full_name,
                isActive: data.is_active,
                workspace: data.workspace
            }));

            // Show success message
            toast.success('Account created successfully! Logging you in...');

            // Auto-login after successful registration
            try {
                const loginData = await authAPI.login({
                    email: formData.email,
                    password: formData.password,
                });

                // Store access token
                localStorage.setItem('accessToken', loginData.access_token);
                localStorage.setItem('tokenType', loginData.token_type);

                // Redirect to workspace check
                setTimeout(() => {
                    window.location.href = ROUTES.WORKSPACE_CHECK;
                }, 800);
            } catch (loginError) {
                console.error('Auto-login failed:', loginError);
                toast.error('Registration successful, but auto-login failed. Please login manually.');
                setTimeout(() => {
                    window.location.href = ROUTES.LOGIN;
                }, 2000);
            }

        } catch (error) {
            console.error('Registration error:', error);

            if (error.response) {
                // Server responded with error
                const { status, data } = error.response;

                if (status === 400) {
                    // Email already registered
                    setErrors({ general: data.detail || 'Registration failed' });
                } else if (status === 422) {
                    // Validation error
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
                    setErrors({ general: data.detail || 'Registration failed. Please try again.' });
                }
            } else if (error.request) {
                // Network error
                setErrors({ general: 'Network error. Please check your connection and try again.' });
            } else {
                setErrors({ general: 'An unexpected error occurred. Please try again.' });
            }
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <h1>Create Account</h1>
                    <p>Join Cyndra Social today</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    {errors.general && (
                        <div className="error-message general-error">
                            {errors.general}
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="fullName">Full Name</label>
                        <input
                            type="text"
                            id="fullName"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleChange}
                            className={errors.fullName ? 'error' : ''}
                            placeholder="Enter your full name"
                            autoComplete="name"
                        />
                        {errors.fullName && (
                            <span className="error-message">{errors.fullName}</span>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className={errors.email ? 'error' : ''}
                            placeholder="Enter your email"
                            autoComplete="email"
                        />
                        {errors.email && (
                            <span className="error-message">{errors.email}</span>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className={errors.password ? 'error' : ''}
                            placeholder="Create a password"
                            autoComplete="new-password"
                        />
                        {errors.password && (
                            <span className="error-message">{errors.password}</span>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            className={errors.confirmPassword ? 'error' : ''}
                            placeholder="Confirm your password"
                            autoComplete="new-password"
                        />
                        {errors.confirmPassword && (
                            <span className="error-message">{errors.confirmPassword}</span>
                        )}
                    </div>

                    <div className="terms-agreement">
                        <label className="checkbox-label">
                            <input type="checkbox" required />
                            <span>I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a></span>
                        </label>
                    </div>

                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>Already have an account? <Link to={ROUTES.LOGIN}>Sign In</Link></p>
                </div>
            </div>
        </div>
    );
}

export default Register;
