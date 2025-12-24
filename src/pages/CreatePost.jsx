import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import { postAPI, socialMediaAPI } from '../config/api';
import './CreatePost.css';

function CreatePost() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    // Form state
    const [selectedPlatforms, setSelectedPlatforms] = useState([]);
    const [postTopic, setPostTopic] = useState('');
    const [tone, setTone] = useState('');
    const [keywords, setKeywords] = useState('');
    const [generatedContentByPlatform, setGeneratedContentByPlatform] = useState({});
    const [activePlatformTab, setActivePlatformTab] = useState(null);
    const [generatedImage, setGeneratedImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [savingDraft, setSavingDraft] = useState(false);
    const [scheduling, setScheduling] = useState(false);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [scheduledDateTime, setScheduledDateTime] = useState('');
    const [connectedAccounts, setConnectedAccounts] = useState([]);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

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

        // Load connected accounts for publishing
        loadConnectedAccounts();
    }, [navigate]);

    const loadConnectedAccounts = async () => {
        try {
            const accounts = await socialMediaAPI.getConnectedAccounts();
            setConnectedAccounts(accounts);
        } catch (err) {
            console.error('Error loading connected accounts:', err);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('tokenType');
        localStorage.removeItem('user');
        localStorage.removeItem('workspace');
        navigate(ROUTES.LOGIN);
    };

    const togglePlatform = (platform) => {
        setSelectedPlatforms(prev =>
            prev.includes(platform)
                ? prev.filter(p => p !== platform)
                : [...prev, platform]
        );
    };

    const handleGenerateContent = async () => {
        try {
            // Validation
            if (selectedPlatforms.length === 0) {
                setError('Please select at least one platform');
                return;
            }
            if (!postTopic.trim()) {
                setError('Please enter a post topic');
                return;
            }
            if (!tone) {
                setError('Please select a tone');
                return;
            }

            setLoading(true);
            setError(null);

            // Call API
            const response = await postAPI.generateContent({
                topic: postTopic,
                tone: tone,
                hashtag: keywords,
                platforms: selectedPlatforms,
            });

            // Store generated content by platform
            if (response.success && response.generated) {
                const contentByPlatform = {};
                Object.entries(response.generated).forEach(([platform, data]) => {
                    contentByPlatform[platform] = data.content;
                });
                setGeneratedContentByPlatform(contentByPlatform);

                // Set first platform as active tab
                const firstPlatform = Object.keys(contentByPlatform)[0];
                if (firstPlatform) {
                    setActivePlatformTab(firstPlatform);
                }
            }
        } catch (err) {
            console.error('Error generating content:', err);
            setError(err.response?.data?.detail || 'Failed to generate content. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleRegenerate = () => {
        // Clear current content and regenerate
        setGeneratedContentByPlatform({});
        setActivePlatformTab(null);
        handleGenerateContent();
    };

    const handleGenerateImage = () => {
        // TODO: API integration for image generation
        console.log('Generate image clicked');
    };

    // Shared function to prepare platform data
    const preparePlatformData = () => {
        return Object.entries(generatedContentByPlatform).map(([platform, content]) => {
            const account = connectedAccounts.find(acc => acc.platform.toLowerCase() === platform.toLowerCase());

            if (!account) {
                throw new Error(`No connected account found for ${platform}. Please connect it in Settings.`);
            }

            return {
                platform: platform.toLowerCase(),
                social_account_id: account.id,
                content: content,
                image_url: generatedImage || undefined,
            };
        });
    };

    const handleSaveAsDraft = async () => {
        try {
            // Validation
            if (Object.keys(generatedContentByPlatform).length === 0) {
                setError('Please generate content before saving as draft');
                return;
            }

            setSavingDraft(true);
            setError(null);
            setSuccessMessage(null);

            // Build platforms array with account IDs (required even for drafts)
            const platformsData = preparePlatformData();

            // Save as draft
            const response = await postAPI.publishPost({
                content: generatedContentByPlatform[activePlatformTab] || Object.values(generatedContentByPlatform)[0],
                image_url: generatedImage,
                platforms: platformsData,
                status: 'draft',
            });

            // Show success message
            setSuccessMessage(`Draft saved successfully! Post ID: ${response.id}`);

            // Clear form after successful save
            setTimeout(() => {
                setGeneratedContentByPlatform({});
                setActivePlatformTab(null);
                setPostTopic('');
                setKeywords('');
                setSelectedPlatforms([]);
                setSuccessMessage(null);
            }, 3000);

        } catch (err) {
            console.error('Error saving draft:', err);
            setError(err.message || err.response?.data?.detail || 'Failed to save draft. Please try again.');
        } finally {
            setSavingDraft(false);
        }
    };

    const handlePublishNow = async () => {
        try {
            // Validation
            if (Object.keys(generatedContentByPlatform).length === 0) {
                setError('Please generate content before publishing');
                return;
            }

            setPublishing(true);
            setError(null);
            setSuccessMessage(null);

            // Build platforms array with account IDs
            const platformsData = Object.entries(generatedContentByPlatform).map(([platform, content]) => {
                const account = connectedAccounts.find(acc => acc.platform.toLowerCase() === platform.toLowerCase());

                if (!account) {
                    throw new Error(`No connected account found for ${platform}. Please connect it in Settings.`);
                }

                return {
                    platform: platform.toLowerCase(),
                    social_account_id: account.id,
                    content: content,
                    image_url: generatedImage || undefined,
                };
            });

            // Publish to platforms
            const response = await postAPI.publishPost({
                content: generatedContentByPlatform[activePlatformTab] || Object.values(generatedContentByPlatform)[0],
                image_url: generatedImage,
                platforms: platformsData,
                status: 'immediate',
            });

            // Show success message
            setSuccessMessage(`Post published successfully! Post ID: ${response.id}`);

            // Clear form after successful publish
            setTimeout(() => {
                setGeneratedContentByPlatform({});
                setActivePlatformTab(null);
                setPostTopic('');
                setKeywords('');
                setSelectedPlatforms([]);
                setSuccessMessage(null);
            }, 3000);

        } catch (err) {
            console.error('Error publishing post:', err);
            setError(err.message || err.response?.data?.detail || 'Failed to publish post. Please try again.');
        } finally {
            setPublishing(false);
        }
    };

    const handleSchedulePost = () => {
        // Validation
        if (Object.keys(generatedContentByPlatform).length === 0) {
            setError('Please generate content before scheduling');
            return;
        }
        setShowScheduleModal(true);
    };

    const handleConfirmSchedule = async () => {
        try {
            if (!scheduledDateTime) {
                setError('Please select a date and time for scheduling');
                return;
            }

            setScheduling(true);
            setError(null);
            setSuccessMessage(null);
            setShowScheduleModal(false);

            // Build platforms array with account IDs
            const platformsData = preparePlatformData();

            // Schedule post
            const response = await postAPI.publishPost({
                content: generatedContentByPlatform[activePlatformTab] || Object.values(generatedContentByPlatform)[0],
                image_url: generatedImage,
                platforms: platformsData,
                status: 'scheduled',
                scheduled_at: new Date(scheduledDateTime).toISOString(),
            });

            // Show success message
            setSuccessMessage(`Post scheduled successfully for ${new Date(scheduledDateTime).toLocaleString()}! Post ID: ${response.id}`);

            // Clear form after successful schedule
            setTimeout(() => {
                setGeneratedContentByPlatform({});
                setActivePlatformTab(null);
                setPostTopic('');
                setKeywords('');
                setSelectedPlatforms([]);
                setScheduledDateTime('');
                setSuccessMessage(null);
            }, 3000);

        } catch (err) {
            console.error('Error scheduling post:', err);
            setError(err.message || err.response?.data?.detail || 'Failed to schedule post. Please try again.');
        } finally {
            setScheduling(false);
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
                    <button className="nav-item active">
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
                        <h1>Create Post</h1>
                    </div>
                    <div className="header-right">
                        <button onClick={handleSchedulePost} className="btn-schedule">
                            Schedule Post
                        </button>
                        <button onClick={handleLogout} className="btn-logout">
                            Logout
                        </button>
                    </div>
                </header>

                {/* Create Post Content */}
                <div className="create-post-content">
                    <div className="create-post-form">
                        {/* Platform Selection */}
                        <section className="form-section">
                            <h3 className="section-label">Platform <span className="required">*</span></h3>
                            <div className="platform-checkboxes">
                                {/* <label className="checkbox-item">
                                    <input
                                        type="checkbox"
                                        checked={selectedPlatforms.includes('facebook')}
                                        onChange={() => togglePlatform('facebook')}
                                    />
                                    <span>Facebook</span>
                                </label> */}
                                {/* <label className="checkbox-item">
                                    <input
                                        type="checkbox"
                                        checked={selectedPlatforms.includes('instagram')}
                                        onChange={() => togglePlatform('instagram')}
                                    />
                                    <span>Instagram</span>
                                </label> */}
                                <label className="checkbox-item">
                                    <input
                                        type="checkbox"
                                        checked={selectedPlatforms.includes('twitter')}
                                        onChange={() => togglePlatform('twitter')}
                                    />
                                    <span>X</span>
                                </label>
                                <label className="checkbox-item">
                                    <input
                                        type="checkbox"
                                        checked={selectedPlatforms.includes('linkedin')}
                                        onChange={() => togglePlatform('linkedin')}
                                    />
                                    <span>LinkedIn</span>
                                </label>
                            </div>
                        </section>

                        {/* Content Section */}
                        <section className="form-section">
                            <div className="label-with-tooltip">
                                <h3 className="section-label">Content <span className="required">*</span></h3>
                                <div className="tooltip-container">
                                    <svg className="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <circle cx="12" cy="12" r="10" strokeWidth="2" />
                                        <path d="M12 16v-4M12 8h.01" strokeLinecap="round" strokeWidth="2" />
                                    </svg>
                                    <span className="tooltip-text">Brief description or main topic of your post</span>
                                </div>
                            </div>
                            <textarea
                                className="textarea-field"
                                placeholder="Example: Launch announcement for our new eco-friendly product line"
                                value={postTopic}
                                onChange={(e) => setPostTopic(e.target.value)}
                                rows={5}
                            />
                        </section>

                        {/* Tone Selection */}
                        <section className="form-section">
                            <div className="label-with-tooltip">
                                <h3 className="section-label">Tone <span className="required">*</span></h3>
                                <div className="tooltip-container">
                                    <svg className="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <circle cx="12" cy="12" r="10" strokeWidth="2" />
                                        <path d="M12 16v-4M12 8h.01" strokeLinecap="round" strokeWidth="2" />
                                    </svg>
                                    <span className="tooltip-text">Select the writing style for your post content</span>
                                </div>
                            </div>
                            <select
                                className="select-field"
                                value={tone}
                                onChange={(e) => setTone(e.target.value)}
                            >
                                <option value="">Select tone...</option>
                                <option value="professional">Professional</option>
                                <option value="casual">Casual</option>
                                <option value="friendly">Friendly</option>
                                <option value="formal">Formal</option>
                                <option value="humorous">Humorous</option>
                            </select>
                        </section>

                        {/* Keywords Section */}
                        <section className="form-section">
                            <input
                                type="text"
                                className="input-field"
                                placeholder="Keywords/Hashtags (Optional)"
                                value={keywords}
                                onChange={(e) => setKeywords(e.target.value)}
                            />
                        </section>

                        {/* Error Message */}
                        {error && (
                            <div className="error-message" style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '1rem 1.25rem',
                                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.05))',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                borderRadius: '12px',
                                color: '#dc2626',
                                marginBottom: '1rem'
                            }}>
                                <svg style={{ width: '24px', height: '24px', flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {error}
                            </div>
                        )}

                        {/* AI Actions */}
                        <section className="form-section">
                            <h3 className="section-label">AI Actions</h3>
                            <div className="ai-action-buttons">
                                <button
                                    className="btn-primary"
                                    onClick={handleGenerateContent}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            {/* <span className="spinner" style={{
                                                width: '16px',
                                                height: '16px',
                                                border: '2px solid rgba(255, 255, 255, 0.3)',
                                                borderTopColor: 'white',
                                                borderRadius: '50%',
                                                animation: 'spin 0.8s linear infinite',
                                                display: 'inline-block',
                                                marginRight: '0.5rem'
                                            }}></span> */}
                                            Generating...
                                        </>
                                    ) : (
                                        'Generate Content'
                                    )}
                                </button>
                                <button
                                    className="btn-secondary"
                                    onClick={handleRegenerate}
                                    disabled={loading || Object.keys(generatedContentByPlatform).length === 0}
                                >
                                    Regenerate
                                </button>
                            </div>
                            <button
                                className="btn-image-generate"
                                onClick={handleGenerateImage}
                            >
                                Generate Image (Optional)
                            </button>
                        </section>

                        {/* Generated Output with Tabs */}
                        <section className="form-section">
                            <h3 className="section-label">Generated Output</h3>

                            {Object.keys(generatedContentByPlatform).length > 0 && (
                                <div className="platform-tabs">
                                    {Object.keys(generatedContentByPlatform).map(platform => {
                                        const platformIcons = {
                                            // facebook: '📘',
                                            // instagram: '📷',
                                            twitter: '🐦',
                                            linkedin: '💼'
                                        };

                                        return (
                                            <button
                                                key={platform}
                                                className={`platform-tab ${activePlatformTab === platform ? 'active' : ''}`}
                                                onClick={() => setActivePlatformTab(platform)}
                                            >
                                                <span className="tab-icon">{platformIcons[platform] || '📄'}</span>
                                                <span className="tab-name">{platform.charAt(0).toUpperCase() + platform.slice(1)}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            <div className="generated-output">
                                <textarea
                                    className="textarea-field"
                                    placeholder="Generated content will appear here..."
                                    value={activePlatformTab ? generatedContentByPlatform[activePlatformTab] : ''}
                                    onChange={(e) => {
                                        if (activePlatformTab) {
                                            setGeneratedContentByPlatform(prev => ({
                                                ...prev,
                                                [activePlatformTab]: e.target.value
                                            }));
                                        }
                                    }}
                                    rows={8}
                                />

                                {/* Generated Image Preview */}
                                {generatedImage && (
                                    <div className="image-preview">
                                        <img src={generatedImage} alt="Generated preview" />
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Success Message */}
                        {successMessage && (
                            <div className="success-message" style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '1rem 1.25rem',
                                background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(22, 163, 74, 0.05))',
                                border: '1px solid rgba(34, 197, 94, 0.3)',
                                borderRadius: '12px',
                                color: '#16a34a',
                                marginTop: '1rem'
                            }}>
                                <svg style={{ width: '24px', height: '24px', flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {successMessage}
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="form-actions">
                            <button
                                className="btn-draft"
                                onClick={handleSaveAsDraft}
                                disabled={savingDraft || publishing || scheduling}
                            >
                                {savingDraft ? 'Saving...' : 'Save as Draft'}
                            </button>
                            <button
                                className="btn-schedule"
                                onClick={handleSchedulePost}
                                disabled={savingDraft || publishing || scheduling}
                            >
                                {scheduling ? 'Scheduling...' : 'Schedule Post'}
                            </button>
                            <button
                                className="btn-publish"
                                onClick={handlePublishNow}
                                disabled={publishing || savingDraft || scheduling || Object.keys(generatedContentByPlatform).length === 0}
                            >
                                {publishing ? (
                                    <>
                                        <span className="spinner" style={{
                                            width: '16px',
                                            height: '16px',
                                            border: '2px solid rgba(255, 255, 255, 0.3)',
                                            borderTopColor: 'white',
                                            borderRadius: '50%',
                                            animation: 'spin 0.8s linear infinite',
                                            display: 'inline-block',
                                            marginRight: '0.5rem'
                                        }}></span>
                                        Publishing...
                                    </>
                                ) : (
                                    'Publish Now'
                                )}
                            </button>
                        </div>

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
                                            value={scheduledDateTime}
                                            onChange={(e) => setScheduledDateTime(e.target.value)}
                                            min={new Date().toISOString().slice(0, 16)}
                                        />
                                        <div className="modal-actions">
                                            <button className="btn-cancel" onClick={() => setShowScheduleModal(false)}>
                                                Cancel
                                            </button>
                                            <button className="btn-confirm" onClick={handleConfirmSchedule}>
                                                Confirm Schedule
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CreatePost;
