/**
 * API Configuration and Services
 */

import axios from 'axios';
import { ENDPOINTS } from '../api/endpoints';

// API Configuration
export const API_CONFIG = {
    BASE_URL: 'https://db42dc2f562d.ngrok-free.app/api/v1',
    TIMEOUT: 10000,
};

// Create axios instance
const apiClient = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
    },
});

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - Handle errors
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            console.error('API Error:', error.response.data);
        } else if (error.request) {
            console.error('Network Error:', error.message);
        } else {
            console.error('Error:', error.message);
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    signup: async (userData) => {
        const response = await apiClient.post(ENDPOINTS.AUTH.SIGNUP, {
            email: userData.email,
            full_name: userData.fullName,
            password: userData.password,
            confirm_password: userData.confirmPassword,
        });
        return response.data;
    },

    login: async (credentials) => {
        const response = await apiClient.post(ENDPOINTS.AUTH.LOGIN, {
            email: credentials.email,
            password: credentials.password,
        });
        return response.data;
    },
};

// Workspace API
export const workspaceAPI = {
    getWorkspace: async () => {
        const response = await apiClient.get(ENDPOINTS.WORKSPACE.GET);
        return response.data;
    },

    createWorkspace: async (workspaceData) => {
        const response = await apiClient.post(ENDPOINTS.WORKSPACE.CREATE, {
            business_name: workspaceData.businessName,
            industry: workspaceData.industry,
            default_tone: workspaceData.defaultTone,
            timezone: workspaceData.timezone,
        });
        return response.data;
    },
};
