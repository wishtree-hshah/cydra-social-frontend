import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import { postAPI, socialMediaAPI } from '../config/api';
import { useToast } from '../context/ToastContext';
import ConfirmationModal from '../components/ConfirmationModal';
import './ContentLibrary.css';

function ContentLibrary() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [user, setUser] = useState(null);
    const [posts, setPosts] = useState([]);
    const [selectedPost, setSelectedPost] = useState(null);
    const [editPost, setEditPost] = useState(null);
    const [editPostDetails, setEditPostDetails] = useState(null);
    const [editTopic, setEditTopic] = useState('');
    const [editTone, setEditTone] = useState('');
    const [editHashtag, setEditHashtag] = useState('');
    const [editScheduledAt, setEditScheduledAt] = useState('');
    const [editPlatforms, setEditPlatforms] = useState({});
    const [activePlatformTab, setActivePlatformTab] = useState(null);
    const [connectedAccounts, setConnectedAccounts] = useState([]);
    const [updating, setUpdating] = useState(false);
    const [canceling, setCanceling] = useState(false);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [schedulingPost, setSchedulingPost] = useState(null);
    const [scheduleDateTime, setScheduleDateTime] = useState('');
    const [publishing, setPublishing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [loadingPostDetails, setLoadingPostDetails] = useState(false);
    const [postDetails, setPostDetails] = useState(null);
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        action: null,
        post: null,
        message: ''
    });

    // Filters
    const [statusFilter, setStatusFilter] = useState('');
    const [platformFilter, setPlatformFilter] = useState('');
    const [limit] = useState(50);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);

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

        loadPosts();
        loadConnectedAccounts();
    }, [navigate, statusFilter, platformFilter, offset]);

    const loadConnectedAccounts = async () => {
        try {
            const accounts = await socialMediaAPI.getConnectedAccounts();
            setConnectedAccounts(accounts);
        } catch (err) {
            console.error('Error loading connected accounts:', err);
        }
    };

    const loadPosts = async () => {
        try {
            setLoading(true);
            setError(null);

            const params = {
                limit,
                offset,
            };

            if (statusFilter) params.status = statusFilter;
            if (platformFilter) params.platform = platformFilter;

            const data = await postAPI.getPosts(params);
            setPosts(data);
            setHasMore(data.length === limit);
        } catch (err) {
            console.error('Error loading posts:', err);
            setError('Failed to load posts. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const loadPostDetails = async (postId) => {
        try {
            setLoadingPostDetails(true);
            const details = await postAPI.getPostById(postId);
            setPostDetails(details);
        } catch (err) {
            console.error('Error loading post details:', err);
            showToast('Failed to load post details', 'error');
        } finally {
            setLoadingPostDetails(false);
        }
    };

    const handleViewPost = async (post) => {
        setSelectedPost(post);
        await loadPostDetails(post.id);
    };

    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('tokenType');
        localStorage.removeItem('user');
        localStorage.removeItem('workspace');
        navigate(ROUTES.LOGIN);
    };

    const handleFilterChange = (type, value) => {
        setOffset(0); // Reset pagination
        if (type === 'status') {
            setStatusFilter(value);
        } else if (type === 'platform') {
            setPlatformFilter(value);
        }
    };

    const handleNextPage = () => {
        setOffset(prev => prev + limit);
    };

    const handlePrevPage = () => {
        setOffset(prev => Math.max(0, prev - limit));
    };

    const getStatusBadgeClass = (status) => {
        const statusMap = {
            'completed': 'status-completed',
            'failed': 'status-failed',
            'in_progress': 'status-progress',
            'scheduled': 'status-scheduled',
            'draft': 'status-draft'
        };
        return statusMap[status] || 'status-default';
    };

    const handleEditPost = async (post) => {
        try {
            console.log(post);
            setEditPost(post);

            // Load full post details to get all fields including tone, hashtag, and platform content
            const details = await postAPI.getPostById(post.id);
            setEditPostDetails(details);

            // Set fields from detailed response
            setEditTopic(details.topic || '');
            setEditTone(details.tone || '');
            setEditHashtag(details.hashtag || '');
            setEditScheduledAt(details.scheduled_at ? new Date(details.scheduled_at).toISOString().slice(0, 16) : '');

            // Initialize platform content
            const platformContent = {};
            if (details.platforms && details.platforms.length > 0) {
                details.platforms.forEach(p => {
                    platformContent[p.platform] = {
                        content: p.content || '',
                        image_url: p.image_url || '',
                        social_account_id: p.social_account_id || null,
                    };
                });
                setActivePlatformTab(details.platforms[0].platform);
            }
            setEditPlatforms(platformContent);
        } catch (err) {
            console.error('Error loading post details:', err);
            showToast('Failed to load post details', 'error');
        }
    };

    const handleUpdatePost = async () => {
        try {
            setUpdating(true);
            setError(null);

            // Update post metadata (only scheduled_at is editable)
            if (editPost.status === 'scheduled' && editScheduledAt) {
                await postAPI.updatePost(editPost.id, {
                    scheduled_at: new Date(editScheduledAt).toISOString(),
                });
            }

            // Update platforms if any platforms are selected
            const selectedPlatforms = Object.keys(editPlatforms);
            if (selectedPlatforms.length > 0) {
                const platformsData = selectedPlatforms.map(platform => {
                    const platformData = editPlatforms[platform];

                    // Ensure we have a valid social_account_id
                    let accountId = platformData.social_account_id;
                    if (!accountId) {
                        const account = connectedAccounts.find(acc => acc.platform.toLowerCase() === platform.toLowerCase());
                        accountId = account?.id || null;
                    }

                    return {
                        platform: platform.toLowerCase(),
                        social_account_id: accountId,
                        content: platformData.content || '',
                        image_url: platformData.image_url || undefined,
                    };
                });

                await postAPI.updatePlatforms(editPost.id, platformsData);
            }

            // Refresh posts list
            await loadPosts();

            // Close edit modal
            setEditPost(null);
            setEditPostDetails(null);
            setEditTopic('');
            setEditTone('');
            setEditHashtag('');
            setEditScheduledAt('');
            setEditPlatforms({});
            setActivePlatformTab(null);

            showToast('Post updated successfully', 'success');

        } catch (err) {
            console.error('Error updating post:', err);
            const errorMessage = err.response?.data?.detail || 'Failed to update post. Please try again.';
            showToast(errorMessage, 'error');
        } finally {
            setUpdating(false);
        }
    };

    const openCancelModal = (post) => {
        const action = post.status === 'scheduled' ? 'convert to draft' : 'delete';
        const message = post.status === 'scheduled'
            ? 'Are you sure you want to cancel this scheduled post and convert it to a draft?'
            : 'Are you sure you want to delete this draft post? This action cannot be undone.';

        setConfirmModal({
            isOpen: true,
            action: 'cancel',
            post,
            message
        });
    };

    const handleCancelPost = async () => {
        const post = confirmModal.post;
        const action = post.status === 'scheduled' ? 'convert to draft' : 'delete';
        setConfirmModal({ isOpen: false, action: null, post: null, message: '' });

        try {
            setCanceling(true);
            setError(null);

            // Use deletePost for drafts, cancelPost for scheduled
            if (post.status === 'draft') {
                await postAPI.deletePost(post.id);
                showToast('Draft deleted successfully', 'success');
            } else {
                await postAPI.cancelPost(post.id);
                showToast('Scheduled post converted to draft', 'success');
            }

            // Refresh posts list
            await loadPosts();

        } catch (err) {
            console.error(`Error ${action === 'delete' ? 'deleting' : 'canceling'} post:`, err);
            const errorMessage = err.response?.data?.detail || `Failed to ${action} post. Please try again.`;
            showToast(errorMessage, 'error');
        } finally {
            setCanceling(false);
        }
    };

    const handleScheduleDraft = (post) => {
        setSchedulingPost(post);
        setShowScheduleModal(true);
    };

    const handleConfirmSchedule = async () => {
        try {
            if (!scheduleDateTime) {
                showToast('Please select a date and time for scheduling', 'error');
                return;
            }

            setPublishing(true);
            setError(null);
            setShowScheduleModal(false);

            // Publish draft with schedule mode
            await postAPI.publishDraft(
                schedulingPost.id,
                'schedule',
                new Date(scheduleDateTime).toISOString()
            );

            // Refresh posts list
            await loadPosts();

            setSchedulingPost(null);
            setScheduleDateTime('');

            showToast('Post scheduled successfully', 'success');

        } catch (err) {
            console.error('Error scheduling post:', err);
            const errorMessage = err.response?.data?.detail || 'Failed to schedule post. Please try again.';
            showToast(errorMessage, 'error');
        } finally {
            setPublishing(false);
        }
    };

    const openPublishModal = (post) => {
        setConfirmModal({
            isOpen: true,
            action: 'publish',
            post,
            message: 'Are you sure you want to publish this draft immediately? It will be posted to all selected platforms.'
        });
    };

    const handlePublishDraft = async () => {
        const post = confirmModal.post;
        setConfirmModal({ isOpen: false, action: null, post: null, message: '' });

        try {
            setPublishing(true);
            setError(null);

            // Publish draft with immediate mode
            await postAPI.publishDraft(post.id, 'immediate');

            // Refresh posts list
            await loadPosts();

            showToast('Post published successfully', 'success');

        } catch (err) {
            console.error('Error publishing post:', err);
            const errorMessage = err.response?.data?.detail || 'Failed to publish post. Please try again.';
            showToast(errorMessage, 'error');
        } finally {
            setPublishing(false);
        }
    };

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
                    <button className="nav-item active">
                        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        Content Library
                    </button>
                </nav>

                <div className="sidebar-footer">
                    <button className="nav-item" onClick={() => navigate(ROUTES.WORKSPACE_SETTINGS)}>
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
                        <h1>Content Library</h1>
                        <p className="header-subtitle">Manage and track your social media posts</p>
                    </div>
                    <div className="header-right">
                        <button onClick={handleLogout} className="btn-logout">
                            Logout
                        </button>
                    </div>
                </header>

                {/* Content Library */}
                <div className="content-library-page">
                    {/* Filters Bar */}
                    <div className="filters-bar">
                        <div className="filter-group">
                            <label htmlFor="status-filter">Status:</label>
                            <select
                                id="status-filter"
                                value={statusFilter}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value);
                                    setOffset(0);
                                }}
                            >
                                <option value="">All</option>
                                <option value="draft">Draft</option>
                                <option value="scheduled">Scheduled</option>
                                <option value="completed">Completed</option>
                                <option value="failed">Failed</option>
                                <option value="in_progress">In Progress</option>
                            </select>
                        </div>
                        <div className="filter-group">
                            <label htmlFor="platform-filter">Platform:</label>
                            <select
                                id="platform-filter"
                                value={platformFilter}
                                onChange={(e) => {
                                    setPlatformFilter(e.target.value);
                                    setOffset(0);
                                }}
                            >
                                <option value="">All</option>
                                {/* <option value="facebook">Facebook</option>
                                <option value="instagram">Instagram</option> */}
                                <option value="x">X</option>
                                <option value="linkedin">LinkedIn</option>
                            </select>
                        </div>
                        <button onClick={loadPosts} className="btn-refresh" title="Refresh">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="error-message">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {error}
                        </div>
                    )}

                    {/* Posts Table */}
                    {loading ? (
                        <div className="loading-container">
                            <div className="spinner-large"></div>
                            <p>Loading posts...</p>
                        </div>
                    ) : posts.length === 0 ? (
                        <div className="empty-state">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                            <h3>No posts found</h3>
                            <p>Start creating content to see it here</p>
                            <button className="btn-create" onClick={() => navigate(ROUTES.CREATE_POST)}>
                                Create Your First Post
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="table-container">
                                <table className="posts-table">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th className='content-cell'>Topic</th>
                                            <th>Status</th>
                                            <th>Platforms</th>
                                            <th>Completed</th>
                                            <th>Failed</th>
                                            <th>Created</th>
                                            <th>Scheduled</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {posts.map((post, index) => (
                                            <tr key={post.id} className="table-row">
                                                <td className="post-id-cell">#{offset + index + 1}</td>
                                                <td className="content-cell" onClick={() => handleViewPost(post)} style={{ cursor: 'pointer' }}>
                                                    {post.topic ? (post.topic.length > 40 ? post.topic.substring(0, 40) + '...' : post.topic) : '-'}
                                                </td>
                                                <td>
                                                    <span className={`status-badge ${getStatusBadgeClass(post.status)}`}>
                                                        {post.status}
                                                    </span>
                                                </td>
                                                <td className="center-cell">{post.platform_count}</td>
                                                <td className="center-cell success-text">{post.completed_count}</td>
                                                <td className="center-cell error-text">{post.failed_count}</td>
                                                <td className="date-cell">{new Date(post.created_at).toLocaleString()}</td>
                                                <td className="date-cell">
                                                    {post.scheduled_at ? (
                                                        new Date(post.scheduled_at).toLocaleString()
                                                    ) : (
                                                        post.status === 'draft' ? (
                                                            <button
                                                                className="btn-icon-action"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleScheduleDraft(post);
                                                                }}
                                                                disabled={publishing}
                                                                title="Schedule Post"
                                                            >
                                                                <svg viewBox="0 0 512 512" fill="currentColor">
                                                                    <path d="M464 256A208 208 0 1 1 48 256a208 208 0 1 1 416 0zM0 256a256 256 0 1 0 512 0A256 256 0 1 0 0 256zM232 120V256c0 8 4 15.5 10.7 20l96 64c11 7.4 25.9 4.4 33.3-6.7s4.4-25.9-6.7-33.3L280 243.2V120c0-13.3-10.7-24-24-24s-24 10.7-24 24z" />
                                                                </svg>
                                                            </button>
                                                        ) : '-'
                                                    )}
                                                </td>
                                                <td>
                                                    {post.status === 'draft' && (
                                                        <div className="action-buttons">
                                                            <button
                                                                className="btn-icon-action"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleEditPost(post);
                                                                }}
                                                                disabled={canceling || publishing}
                                                                title="Edit"
                                                            >
                                                                <svg viewBox="0 0 512 512" fill="currentColor">
                                                                    <path d="M471.6 21.7c-21.9-21.9-57.3-21.9-79.2 0L362.3 51.7l97.9 97.9 30.1-30.1c21.9-21.9 21.9-57.3 0-79.2L471.6 21.7zm-299.2 220c-6.1 6.1-10.8 13.6-13.5 21.9l-29.6 88.8c-2.9 8.6-.6 18.1 5.8 24.6s15.9 8.7 24.6 5.8l88.8-29.6c8.2-2.7 15.7-7.4 21.9-13.5L487.4 120.6 389.5 22.7 172.4 241.7zM96 64C43 64 0 107 0 160V416c0 53 43 96 96 96H352c53 0 96-43 96-96V320c0-17.7-14.3-32-32-32s-32 14.3-32 32v96c0 17.7-14.3 32-32 32H96c-17.7 0-32-14.3-32-32V160c0-17.7 14.3-32 32-32h96c17.7 0 32-14.3 32-32s-14.3-32-32-32H96z" />
                                                                </svg>
                                                            </button>
                                                            <button
                                                                className="btn-icon-action btn-icon-delete"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    openCancelModal(post);
                                                                }}
                                                                disabled={canceling || publishing}
                                                                title="Delete"
                                                            >
                                                                <svg viewBox="0 0 448 512" fill="currentColor">
                                                                    <path d="M170.5 51.6L151.5 80h145l-19-28.4c-1.5-2.2-4-3.6-6.7-3.6H177.1c-2.7 0-5.2 1.3-6.7 3.6zm147-26.6L354.2 80H368h48 8c13.3 0 24 10.7 24 24s-10.7 24-24 24h-8V432c0 44.2-35.8 80-80 80H112c-44.2 0-80-35.8-80-80V128H24c-13.3 0-24-10.7-24-24S10.7 80 24 80h8H80 93.8l36.7-55.1C140.9 9.4 158.4 0 177.1 0h93.7c18.7 0 36.2 9.4 46.6 24.9zM80 128V432c0 17.7 14.3 32 32 32H336c17.7 0 32-14.3 32-32V128H80zm80 64V400c0 8.8-7.2 16-16 16s-16-7.2-16-16V192c0-8.8 7.2-16 16-16s16 7.2 16 16zm80 0V400c0 8.8-7.2 16-16 16s-16-7.2-16-16V192c0-8.8 7.2-16 16-16s16 7.2 16 16zm80 0V400c0 8.8-7.2 16-16 16s-16-7.2-16-16V192c0-8.8 7.2-16 16-16s16 7.2 16 16z" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    )}
                                                    {post.status === 'scheduled' && (
                                                        <button
                                                            className="btn-icon-action btn-icon-schedule"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                openCancelModal(post);
                                                            }}
                                                            disabled={canceling}
                                                            title="Mark as Draft"
                                                        >
                                                            <svg viewBox="0 0 384 512" fill="currentColor">
                                                                <path d="M64 0C28.7 0 0 28.7 0 64V448c0 35.3 28.7 64 64 64H320c35.3 0 64-28.7 64-64V160H256c-17.7 0-32-14.3-32-32V0H64zM256 0V128H384L256 0zM112 256H272c8.8 0 16 7.2 16 16s-7.2 16-16 16H112c-8.8 0-16-7.2-16-16s7.2-16 16-16zm0 64H272c8.8 0 16 7.2 16 16s-7.2 16-16 16H112c-8.8 0-16-7.2-16-16s7.2-16 16-16zm0 64H272c8.8 0 16 7.2 16 16s-7.2 16-16 16H112c-8.8 0-16-7.2-16-16s7.2-16 16-16z" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="pagination">
                                <button
                                    className="btn-page"
                                    onClick={handlePrevPage}
                                    disabled={offset === 0}
                                >
                                    ← Previous
                                </button>
                                <span className="page-info">
                                    Showing {offset + 1} - {offset + posts.length}
                                </span>
                                <button
                                    className="btn-page"
                                    onClick={handleNextPage}
                                    disabled={!hasMore}
                                >
                                    Next →
                                </button>
                            </div>
                        </>
                    )}

                    {/* Post Detail Modal */}
                    {selectedPost && (
                        <div className="modal-overlay" onClick={() => { setSelectedPost(null); setPostDetails(null); }}>
                            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                                <div className="modal-header">
                                    <h2>Post Details</h2>
                                    <button className="modal-close" onClick={() => { setSelectedPost(null); setPostDetails(null); }}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="modal-body">
                                    {loadingPostDetails ? (
                                        <div className="loading-container">
                                            <div className="spinner-large"></div>
                                            <p>Loading post details...</p>
                                        </div>
                                    ) : postDetails ? (
                                        <>
                                            <div className="detail-section">
                                                <div className="detail-row">
                                                    <span className="detail-label">Post ID:</span>
                                                    <span className="detail-value">#{postDetails.id}</span>
                                                </div>
                                                <div className="detail-row">
                                                    <span className="detail-label">Status:</span>
                                                    <span className={`status-badge ${getStatusBadgeClass(postDetails.status)}`}>
                                                        {postDetails.status}
                                                    </span>
                                                </div>
                                                <div className="detail-row">
                                                    <span className="detail-label">Created:</span>
                                                    <span className="detail-value">{new Date(postDetails.created_at).toLocaleString()}</span>
                                                </div>
                                                {postDetails.scheduled_at && (
                                                    <div className="detail-row">
                                                        <span className="detail-label">Scheduled:</span>
                                                        <span className="detail-value">{new Date(postDetails.scheduled_at).toLocaleString()}</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="detail-section">
                                                <h3>Post Information</h3>
                                                {postDetails.topic && (
                                                    <div className="detail-row">
                                                        <span className="detail-label">Topic:</span>
                                                        <span className="detail-value">{postDetails.topic}</span>
                                                    </div>
                                                )}
                                                {postDetails.tone && (
                                                    <div className="detail-row">
                                                        <span className="detail-label">Tone:</span>
                                                        <span className="detail-value">{postDetails.tone}</span>
                                                    </div>
                                                )}
                                                {postDetails.hashtag && (
                                                    <div className="detail-row">
                                                        <span className="detail-label">Hashtag:</span>
                                                        <span className="detail-value">{postDetails.hashtag}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {postDetails.platforms && postDetails.platforms.length > 0 && (
                                                <div className="detail-section">
                                                    <h3>Platform Content</h3>
                                                    {postDetails.platforms.map((platform, index) => (
                                                        <div key={index} className="platform-detail">
                                                            <div className="detail-row">
                                                                <span className="detail-label">Platform:</span>
                                                                <span className="detail-value">{platform.platform} ({platform.account_name})</span>
                                                            </div>
                                                            <div className="detail-row">
                                                                <span className="detail-label">Status:</span>
                                                                <span className={`status-badge ${getStatusBadgeClass(platform.status)}`}>
                                                                    {platform.status}
                                                                </span>
                                                            </div>
                                                            {platform.content && (
                                                                <div className="content-box">
                                                                    {platform.content}
                                                                </div>
                                                            )}
                                                            {platform.image_url && (
                                                                <div className="modal-image">
                                                                    <img src={platform.image_url} alt={`${platform.platform} post`} />
                                                                </div>
                                                            )}
                                                            {platform.platform_url && (
                                                                <div className="detail-row">
                                                                    <span className="detail-label">Post URL:</span>
                                                                    <a href={platform.platform_url} target="_blank" rel="noopener noreferrer" className="detail-value">
                                                                        View on {platform.platform}
                                                                    </a>
                                                                </div>
                                                            )}
                                                            {platform.error && (
                                                                <div className="detail-row">
                                                                    <span className="detail-label">Error:</span>
                                                                    <span className="detail-value error-text">{platform.error}</span>
                                                                </div>
                                                            )}
                                                            {index < postDetails.platforms.length - 1 && <br />}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <p>Failed to load post details</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Edit Post Modal */}
                    {editPost && (
                        <div className="modal-overlay" onClick={() => setEditPost(null)}>
                            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                                <div className="modal-header">
                                    <h2>Edit Post</h2>
                                    <button className="modal-close" onClick={() => setEditPost(null)}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="modal-body">
                                    <div className="edit-form">
                                        {/* Compact Post Information Table */}
                                        {(editTopic || editTone || editHashtag) && (
                                            <div className="form-group" style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                                                <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Post Information</h3>

                                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                    <tbody>
                                                        {editTopic && (
                                                            <tr>
                                                                <td style={{ padding: '0.625rem 0.75rem', width: '120px', fontWeight: '600', fontSize: '0.875rem', color: '#475569', verticalAlign: 'top', borderBottom: '1px solid #e2e8f0' }}>
                                                                    Content
                                                                </td>
                                                                <td style={{ padding: '0.625rem 0.75rem', fontSize: '0.875rem', color: '#1e293b', borderBottom: '1px solid #e2e8f0' }}>
                                                                    {editTopic}
                                                                </td>
                                                            </tr>
                                                        )}
                                                        {editTone && (
                                                            <tr>
                                                                <td style={{ padding: '0.625rem 0.75rem', width: '120px', fontWeight: '600', fontSize: '0.875rem', color: '#475569', verticalAlign: 'top', borderBottom: '1px solid #e2e8f0' }}>
                                                                    Tone
                                                                </td>
                                                                <td style={{ padding: '0.625rem 0.75rem', fontSize: '0.875rem', color: '#1e293b', textTransform: 'capitalize', borderBottom: '1px solid #e2e8f0' }}>
                                                                    {editTone}
                                                                </td>
                                                            </tr>
                                                        )}
                                                        {editHashtag && (
                                                            <tr>
                                                                <td style={{ padding: '0.625rem 0.75rem', width: '120px', fontWeight: '600', fontSize: '0.875rem', color: '#475569', verticalAlign: 'top' }}>
                                                                    Hashtags
                                                                </td>
                                                                <td style={{ padding: '0.625rem 0.75rem', fontSize: '0.875rem', color: '#3b82f6' }}>
                                                                    {editHashtag}
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}

                                        {editPost.status === 'scheduled' && (
                                            <div className="form-group">
                                                <label className="edit-label">Scheduled Date & Time:</label>
                                                <input
                                                    type="datetime-local"
                                                    className="edit-input"
                                                    value={editScheduledAt}
                                                    onChange={(e) => setEditScheduledAt(e.target.value)}
                                                    min={new Date().toISOString().slice(0, 16)}
                                                />
                                            </div>
                                        )}

                                        {/* Platform Tabs - only for existing platforms */}
                                        {Object.keys(editPlatforms).length > 0 && (
                                            <div className="form-group">
                                                <label className="edit-label">Platform Content:</label>
                                                <div className="platform-tabs" style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                                    {Object.keys(editPlatforms).map(platform => {
                                                        // Platform icons
                                                        const platformIcons = {
                                                            twitter: (
                                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                                                </svg>
                                                            ),
                                                            linkedin: (
                                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                                                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                                                </svg>
                                                            )
                                                        };

                                                        return (
                                                            <button
                                                                key={platform}
                                                                type="button"
                                                                className={`platform-tab ${activePlatformTab === platform ? 'active' : ''}`}
                                                                onClick={() => setActivePlatformTab(platform)}
                                                                style={{
                                                                    padding: '0.625rem',
                                                                    border: activePlatformTab === platform ? '2px solid #3b82f6' : '1px solid #d1d5db',
                                                                    borderRadius: '6px',
                                                                    background: activePlatformTab === platform ? '#eff6ff' : 'white',
                                                                    color: activePlatformTab === platform ? '#1e40af' : '#6b7280',
                                                                    cursor: 'pointer',
                                                                    transition: 'all 0.2s',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    minWidth: '48px',
                                                                    minHeight: '48px'
                                                                }}
                                                                title={platform.charAt(0).toUpperCase() + platform.slice(1)}
                                                            >
                                                                {platformIcons[platform]}
                                                            </button>
                                                        );
                                                    })}
                                                </div>

                                                {activePlatformTab && editPlatforms[activePlatformTab] && (
                                                    <div>
                                                        <textarea
                                                            className="edit-input"
                                                            value={editPlatforms[activePlatformTab].content}
                                                            onChange={(e) => {
                                                                setEditPlatforms(prev => ({
                                                                    ...prev,
                                                                    [activePlatformTab]: {
                                                                        ...prev[activePlatformTab],
                                                                        content: e.target.value
                                                                    }
                                                                }));
                                                            }}
                                                            placeholder={`Enter content for ${activePlatformTab}...`}
                                                            rows={6}
                                                            style={{ marginBottom: '0.75rem' }}
                                                        />
                                                        <input
                                                            type="text"
                                                            className="edit-input"
                                                            value={editPlatforms[activePlatformTab].image_url}
                                                            onChange={(e) => {
                                                                setEditPlatforms(prev => ({
                                                                    ...prev,
                                                                    [activePlatformTab]: {
                                                                        ...prev[activePlatformTab],
                                                                        image_url: e.target.value
                                                                    }
                                                                }));
                                                            }}
                                                            placeholder="Image URL (optional)"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        )}


                                        <div className="modal-actions">
                                            <button
                                                className="btn-cancel"
                                                onClick={() => setEditPost(null)}
                                                disabled={updating}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                className="btn-confirm"
                                                onClick={handleUpdatePost}
                                                disabled={updating}
                                            >
                                                {updating ? 'Updating...' : 'Update Post'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Schedule Modal */}
                    {showScheduleModal && (
                        <div className="modal-overlay" onClick={() => setShowScheduleModal(false)}>
                            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                                <div className="modal-header">
                                    <h2>Schedule Post</h2>
                                    <button className="modal-close" onClick={() => setShowScheduleModal(false)}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="modal-body">
                                    <label className="schedule-label">Select Date and Time:</label>
                                    <input
                                        type="datetime-local"
                                        className="schedule-input"
                                        value={scheduleDateTime}
                                        onChange={(e) => setScheduleDateTime(e.target.value)}
                                        min={new Date().toISOString().slice(0, 16)}
                                    />
                                    <div className="modal-actions">
                                        <button className="btn-cancel" onClick={() => setShowScheduleModal(false)}>
                                            Cancel
                                        </button>
                                        <button
                                            className="btn-publish-now"
                                            onClick={() => {
                                                setShowScheduleModal(false);
                                                openPublishModal(schedulingPost);
                                            }}
                                        >
                                            Publish Now
                                        </button>
                                        <button className="btn-confirm" onClick={handleConfirmSchedule}>
                                            Schedule for Later
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Cancel/Delete Confirmation Modal */}
                    <ConfirmationModal
                        isOpen={confirmModal.isOpen && confirmModal.action === 'cancel'}
                        title={confirmModal.post?.status === 'scheduled' ? 'Cancel Scheduled Post' : 'Delete Draft'}
                        message={confirmModal.message}
                        confirmText={confirmModal.post?.status === 'scheduled' ? 'Convert to Draft' : 'Delete'}
                        cancelText="Cancel"
                        variant="danger"
                        onConfirm={handleCancelPost}
                        onCancel={() => setConfirmModal({ isOpen: false, action: null, post: null, message: '' })}
                    />

                    {/* Publish Confirmation Modal */}
                    <ConfirmationModal
                        isOpen={confirmModal.isOpen && confirmModal.action === 'publish'}
                        title="Publish Post Now"
                        message={confirmModal.message}
                        confirmText="Publish Now"
                        cancelText="Cancel"
                        variant="info"
                        onConfirm={handlePublishDraft}
                        onCancel={() => setConfirmModal({ isOpen: false, action: null, post: null, message: '' })}
                    />
                </div>
            </div>
        </div>
    );
}

export default ContentLibrary;
