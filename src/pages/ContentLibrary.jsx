import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import { postAPI } from '../config/api';
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
    const [editContent, setEditContent] = useState('');
    const [editImageUrl, setEditImageUrl] = useState('');
    const [editScheduledAt, setEditScheduledAt] = useState('');
    const [updating, setUpdating] = useState(false);
    const [canceling, setCanceling] = useState(false);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [schedulingPost, setSchedulingPost] = useState(null);
    const [scheduleDateTime, setScheduleDateTime] = useState('');
    const [publishing, setPublishing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
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
    }, [navigate, statusFilter, platformFilter, offset]);

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

    const handleEditPost = (post) => {
        setEditPost(post);
        setEditContent(post.content);
        setEditImageUrl(post.image_url || '');
        setEditScheduledAt(post.scheduled_at ? new Date(post.scheduled_at).toISOString().slice(0, 16) : '');
    };

    const handleUpdatePost = async () => {
        try {
            if (!editContent.trim()) {
                showToast('Content cannot be empty', 'error');
                return;
            }

            setUpdating(true);
            setError(null);

            await postAPI.updatePost(editPost.id, {
                content: editContent,
                image_url: editImageUrl || undefined,
                scheduled_at: editScheduledAt ? new Date(editScheduledAt).toISOString() : undefined,
            });

            // Refresh posts list
            await loadPosts();

            // Close edit modal
            setEditPost(null);
            setEditContent('');
            setEditImageUrl('');
            setEditScheduledAt('');

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
                        <h1>Content Library</h1>
                        <p className="header-subtitle">Your post history and analytics</p>
                    </div>
                    <div className="header-right">
                        <button onClick={handleLogout} className="btn-logout">
                            Logout
                        </button>
                    </div>
                </header>

                {/* Content Library */}
                <div className="content-library-page">
                    {/* Filters */}
                    <div className="filters-bar">
                        <div className="filter-group">
                            <label>Status:</label>
                            <select value={statusFilter} onChange={(e) => handleFilterChange('status', e.target.value)}>
                                <option value="">All</option>
                                <option value="scheduled">Scheduled</option>
                                <option value="completed">Completed</option>
                                <option value="failed">Failed</option>
                                <option value="in_progress">In Progress</option>
                                <option value="draft">Draft</option>
                            </select>
                        </div>
                        <div className="filter-group">
                            <label>Platform:</label>
                            <select value={platformFilter} onChange={(e) => handleFilterChange('platform', e.target.value)}>
                                <option value="">All</option>
                                <option value="facebook">Facebook</option>
                                <option value="instagram">Instagram</option>
                                <option value="twitter">Twitter</option>
                                <option value="linkedin">LinkedIn</option>
                            </select>
                        </div>
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
                                            <th className='content-cell'>Content</th>
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
                                                <td className="content-cell" onClick={() => setSelectedPost(post)} style={{ cursor: 'pointer' }}>
                                                    {post.content.length > 40 ? post.content.substring(0, 40) + '...' : post.content}
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
                                                                className="btn-schedule-inline"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleScheduleDraft(post);
                                                                }}
                                                                disabled={publishing}
                                                            >
                                                                Schedule
                                                            </button>
                                                        ) : '-'
                                                    )}
                                                </td>
                                                <td>
                                                    {post.status === 'draft' && (
                                                        <div className="action-buttons">
                                                            <button
                                                                className="btn-edit-small"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleEditPost(post);
                                                                }}
                                                                disabled={canceling || publishing}
                                                            >
                                                                Edit
                                                            </button>
                                                            <button
                                                                className="btn-delete-small"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    openCancelModal(post);
                                                                }}
                                                                disabled={canceling || publishing}
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
                                                    )}
                                                    {post.status === 'scheduled' && (
                                                        <button
                                                            className="btn-cancel-small"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                openCancelModal(post);
                                                            }}
                                                            disabled={canceling}
                                                        >
                                                            Mark as Draft
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
                        <div className="modal-overlay" onClick={() => setSelectedPost(null)}>
                            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                                <div className="modal-header">
                                    <h2>Post Details</h2>
                                    <button className="modal-close" onClick={() => setSelectedPost(null)}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="modal-body">
                                    <div className="detail-section">
                                        <div className="detail-row">
                                            <span className="detail-label">Post ID:</span>
                                            <span className="detail-value">#{selectedPost.id}</span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="detail-label">Status:</span>
                                            <span className={`status-badge ${getStatusBadgeClass(selectedPost.status)}`}>
                                                {selectedPost.status}
                                            </span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="detail-label">Created:</span>
                                            <span className="detail-value">{new Date(selectedPost.created_at).toLocaleString()}</span>
                                        </div>
                                        {selectedPost.scheduled_at && (
                                            <div className="detail-row">
                                                <span className="detail-label">Scheduled:</span>
                                                <span className="detail-value">{new Date(selectedPost.scheduled_at).toLocaleString()}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="detail-section">
                                        <h3>Content</h3>
                                        <div className="content-box">
                                            {selectedPost.content}
                                        </div>
                                    </div>

                                    {selectedPost.image_url && (
                                        <div className="detail-section">
                                            <h3>Image</h3>
                                            <div className="modal-image">
                                                <img src={selectedPost.image_url} alt="Post" />
                                            </div>
                                        </div>
                                    )}

                                    <div className="detail-section">
                                        <h3>Platform Statistics</h3>
                                        <div className="stats-grid">
                                            <div className="stat-card">
                                                <span className="stat-label">Total Platforms</span>
                                                <span className="stat-value">{selectedPost.platform_count}</span>
                                            </div>
                                            <div className="stat-card success">
                                                <span className="stat-label">Completed</span>
                                                <span className="stat-value">{selectedPost.completed_count}</span>
                                            </div>
                                            <div className="stat-card error">
                                                <span className="stat-label">Failed</span>
                                                <span className="stat-value">{selectedPost.failed_count}</span>
                                            </div>
                                            <div className="stat-card info">
                                                <span className="stat-label">In Progress</span>
                                                <span className="stat-value">{selectedPost.in_progress_count || 0}</span>
                                            </div>
                                        </div>
                                    </div>
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
                                        <div className="form-group">
                                            <label className="edit-label">Content:</label>
                                            <textarea
                                                className="edit-textarea"
                                                value={editContent}
                                                onChange={(e) => setEditContent(e.target.value)}
                                                rows={6}
                                                placeholder="Enter post content..."
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label className="edit-label">Image URL (optional):</label>
                                            <input
                                                type="text"
                                                className="edit-input"
                                                value={editImageUrl}
                                                onChange={(e) => setEditImageUrl(e.target.value)}
                                                placeholder="https://example.com/image.jpg"
                                            />
                                        </div>

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
