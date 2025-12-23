import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authAPI } from '../config/api';
import { ROUTES } from '../constants/routes';
import './Auth.css';

function Login() {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
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

        // Email validation
        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email is invalid';
        }

        // Password validation
        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
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
            const data = await authAPI.login({
                email: formData.email,
                password: formData.password,
            });

            // Success - Status 200
            console.log('Login successful:', data);

            // Store access token in localStorage
            localStorage.setItem('accessToken', data.access_token);
            localStorage.setItem('tokenType', data.token_type);

            // Show success message
            toast.success('Login successful!');

            // Redirect to workspace check
            setTimeout(() => {
                window.location.href = '/workspace-check';
            }, 500);

        } catch (error) {
            console.error('Login error:', error);

            if (error.response) {
                // Server responded with error
                const { status, data } = error.response;

                if (status === 401) {
                    // Incorrect credentials
                    setErrors({ general: data.detail || 'Incorrect email or password' });
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
                    setErrors({ general: data.detail || 'Login failed. Please try again.' });
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
                    <h1>Welcome Back</h1>
                    <p>Sign in to continue to Cyndra Social</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    {errors.general && (
                        <div className="error-message general-error">
                            {errors.general}
                        </div>
                    )}

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
                            placeholder="Enter your password"
                            autoComplete="current-password"
                        />
                        {errors.password && (
                            <span className="error-message">{errors.password}</span>
                        )}
                    </div>

                    {/* <div className="form-footer">
                        <label className="checkbox-label">
                            <input type="checkbox" />
                            <span>Remember me</span>
                        </label>
                        <a href="#" className="forgot-link">Forgot password?</a>
                    </div> */}

                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Signing in...' : 'Login'}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>Don't have an account? <Link to={ROUTES.REGISTER}>Create Account</Link></p>
                </div>
            </div>
        </div>
    );
}

export default Login;
