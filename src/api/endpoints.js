/**
 * API Endpoints
 * Centralized endpoint definitions
 */

export const ENDPOINTS = {
    // Authentication
    AUTH: {
        SIGNUP: '/auth/signup',
        LOGIN: '/auth/login',
    },

    // Workspace
    WORKSPACE: {
        GET: '/workspaces/',
        CREATE: '/workspaces/',
    },

    // OAuth - Social Media Authorization
    OAUTH: {
        AUTHORIZE: (platform) => `/oauth/${platform}/authorize`,
        DISCONNECT: (platform) => `/oauth/${platform}/disconnect`,
    },

    // Social Accounts
    SOCIAL_ACCOUNTS: {
        GET_ALL: '/social-accounts/',
        GET_BY_ID: (accountId) => `/social-accounts/${accountId}`,
    },

    // Post Generation
    POST: {
        GENERATE_CONTENT: '/post/generate/content',
        PUBLISH_MULTI: '/post/multi',
        GET_POSTS: '/posts/',
        GET_POST_BY_ID: (postId) => `/posts/${postId}`,
        UPDATE_POST: (postId) => `/posts/${postId}`,
        UPDATE_PLATFORMS: (postId) => `/posts/${postId}/platforms`,
        CANCEL_POST: (postId) => `/posts/${postId}/cancel`,
        DELETE_POST: (postId) => `/posts/${postId}`,
        PUBLISH_DRAFT: (postId) => `/posts/${postId}/publish`,
        STATS_OVERVIEW: '/posts/stats/overview',
        STATS_PLATFORMS: '/posts/stats/platforms',
    },
};
