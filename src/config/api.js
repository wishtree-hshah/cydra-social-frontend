/**
 * API Configuration and Services
 */

import axios from 'axios';
import { ENDPOINTS } from '../api/endpoints';

// API Configuration
export const API_CONFIG = {
    BASE_URL: 'http://localhost:8000/api/v1',
};

// Create axios instance (no timeout for AI content generation)
const apiClient = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: 0, // No timeout - allows long-running AI requests
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
        // Handle 401 Unauthorized - Auto logout
        if (error.response && error.response.status === 401) {
            console.log('Unauthorized access - logging out');

            // Clear all auth data
            localStorage.removeItem('accessToken');
            localStorage.removeItem('tokenType');
            localStorage.removeItem('user');
            localStorage.removeItem('workspace');

            // Redirect to login
            window.location.href = '/login';

            return Promise.reject(error);
        }

        // Handle other errors
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

// Social Media API
export const socialMediaAPI = {
    // Get authorization URL for a platform
    getAuthorizationUrl: async (platform) => {
        const response = await apiClient.get(ENDPOINTS.OAUTH.AUTHORIZE(platform));
        return response.data;
    },

    // Disconnect a platform
    disconnectPlatform: async (platform) => {
        const response = await apiClient.delete(ENDPOINTS.OAUTH.DISCONNECT(platform));
        return response.data;
    },

    // Get all connected social accounts
    getConnectedAccounts: async () => {
        const response = await apiClient.get(ENDPOINTS.SOCIAL_ACCOUNTS.GET_ALL);
        return response.data;
    },

    // Get specific social account by ID
    getAccountById: async (accountId) => {
        const response = await apiClient.get(ENDPOINTS.SOCIAL_ACCOUNTS.GET_BY_ID(accountId));
        return response.data;
    },
};

// Post API
export const postAPI = {
    // Generate content for platforms
    generateContent: async (data) => {
        const response = await apiClient.post(ENDPOINTS.POST.GENERATE_CONTENT, {
            topic: data.topic,
            tone: data.tone,
            hashtag: data.hashtag,
            platforms: data.platforms,
        });
        return response.data;
    },

    // Publish to multiple platforms
    publishPost: async (data) => {
        const response = await apiClient.post(ENDPOINTS.POST.PUBLISH_MULTI, {
            content: data.content,
            image_url: data.image_url,
            platforms: data.platforms,
            status: data.status || 'immediate',
            scheduled_at: data.scheduled_at,
        });
        return response.data;
    },

    // Get user's posts with filters
    getPosts: async (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.status) queryParams.append('status', params.status);
        if (params.platform) queryParams.append('platform', params.platform);
        if (params.limit) queryParams.append('limit', params.limit);
        if (params.offset !== undefined) queryParams.append('offset', params.offset);

        const response = await apiClient.get(`${ENDPOINTS.POST.GET_POSTS}?${queryParams}`);
        return response.data;
    },

    // Update a post (drafts and scheduled posts only)
    updatePost: async (postId, data) => {
        const response = await apiClient.patch(ENDPOINTS.POST.UPDATE_POST(postId), {
            content: data.content,
            image_url: data.image_url,
            scheduled_at: data.scheduled_at,
        });
        return response.data;
    },

    // Cancel scheduled post (marks as draft) or delete draft
    cancelPost: async (postId) => {
        const response = await apiClient.post(ENDPOINTS.POST.CANCEL_POST(postId));
        return response.data;
    },

    // Delete a post permanently
    deletePost: async (postId) => {
        const response = await apiClient.delete(ENDPOINTS.POST.DELETE_POST(postId));
        return response.data;
    },

    // Publish a draft post (immediate or scheduled)
    publishDraft: async (postId, mode, scheduledAt = null) => {
        const response = await apiClient.post(ENDPOINTS.POST.PUBLISH_DRAFT(postId), {
            mode: mode,
            scheduled_at: scheduledAt,
        });
        return response.data;
    },

    // Get post statistics overview
    getStatsOverview: async () => {
        const response = await apiClient.get(ENDPOINTS.POST.STATS_OVERVIEW);
        return response.data;
    },

    // Get platform-specific statistics
    getStatsPlatforms: async () => {
        const response = await apiClient.get(ENDPOINTS.POST.STATS_PLATFORMS);
        return response.data;
    },
};
