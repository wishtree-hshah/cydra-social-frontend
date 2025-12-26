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
    const [generatedContentByAgent, setGeneratedContentByAgent] = useState({});
    const [activeAgentTab, setActiveAgentTab] = useState(null);
    const [slideDirection, setSlideDirection] = useState('right');
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

            // Transform response to agent-centric structure
            if (response.success && response.generated) {
                const contentByAgent = {};

                // Get all platforms from response
                const platforms = Object.keys(response.generated);

                // Get agents from first platform (all platforms have same agents)
                const firstPlatform = platforms[0];
                if (firstPlatform && response.generated[firstPlatform].agent_outputs) {
                    const agents = response.generated[firstPlatform].agent_outputs;

                    // Reorganize by agent
                    agents.forEach(agentOutput => {
                        const agentName = agentOutput.agent_name;

                        if (!contentByAgent[agentName]) {
                            contentByAgent[agentName] = {
                                agent_id: agentOutput.agent_id,
                                agent_designation: agentOutput.agent_designation,
                                agent_description: agentOutput.agent_description,
                                platforms: {}
                            };
                        }

                        // Add content for each platform from this agent
                        platforms.forEach(platform => {
                            const platformData = response.generated[platform];
                            const agentData = platformData.agent_outputs.find(
                                a => a.agent_id === agentOutput.agent_id
                            );

                            if (agentData) {
                                contentByAgent[agentName].platforms[platform] = {
                                    text: agentData.text,
                                    token_usage: agentData.token_usage
                                };
                            }
                        });
                    });
                }

                setGeneratedContentByAgent(contentByAgent);

                // Set first agent as active tab
                const firstAgent = Object.keys(contentByAgent)[0];
                if (firstAgent) {
                    setActiveAgentTab(firstAgent);
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
        setGeneratedContentByAgent({});
        setActiveAgentTab(null);
        handleGenerateContent();
    };

    const handleGenerateImage = () => {
        // TODO: API integration for image generation
        console.log('Generate image clicked');
    };

    // Shared function to prepare platform data from current agent's content
    const preparePlatformData = () => {
        if (!activeAgentTab || !generatedContentByAgent[activeAgentTab]) {
            throw new Error('No agent content selected');
        }

        const agentData = generatedContentByAgent[activeAgentTab];
        const platforms = agentData.platforms;

        return Object.entries(platforms).map(([platform, data]) => {
            const account = connectedAccounts.find(acc => acc.platform.toLowerCase() === platform.toLowerCase());

            if (!account) {
                throw new Error(`No connected account found for ${platform}. Please connect it in Settings.`);
            }

            return {
                platform: platform.toLowerCase(),
                social_account_id: account.id,
                content: data.text,
                image_url: generatedImage || undefined,
            };
        });
    };

    const handleSaveAsDraft = async () => {
        try {
            // Validation
            if (Object.keys(generatedContentByAgent).length === 0) {
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
                setGeneratedContentByAgent({});
                setActiveAgentTab(null);
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
            if (Object.keys(generatedContentByAgent).length === 0) {
                setError('Please generate content before publishing');
                return;
            }

            setPublishing(true);
            setError(null);
            setSuccessMessage(null);

            // Build platforms array with account IDs
            const platformsData = preparePlatformData();

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
                setGeneratedContentByAgent({});
                setActiveAgentTab(null);
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
        if (Object.keys(generatedContentByAgent).length === 0) {
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
                setGeneratedContentByAgent({});
                setActiveAgentTab(null);
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
                                    disabled={loading || Object.keys(generatedContentByAgent).length === 0}
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

                        {/* Generated Output with Agent Tabs */}
                        <section className="form-section">
                            <h3 className="section-label">Generated Output</h3>

                            {/* Agent Tabs */}
                            {Object.keys(generatedContentByAgent).length > 0 && (
                                <>
                                    <div className="agent-tabs-container">
                                        {Object.keys(generatedContentByAgent).map((agentName, index, array) => (
                                            <button
                                                key={agentName}
                                                className={`agent-tab ${activeAgentTab === agentName ? 'active' : ''}`}
                                                onClick={() => {
                                                    const currentIndex = array.indexOf(activeAgentTab);
                                                    const newIndex = index;
                                                    const direction = newIndex > currentIndex ? 'right' : 'left';
                                                    setSlideDirection(direction);
                                                    setActiveAgentTab(agentName);
                                                }}
                                                title={agentName}
                                            >
                                                {agentName}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Platform Cards for Active Agent */}
                                    {activeAgentTab && generatedContentByAgent[activeAgentTab] && (
                                        <div className={`platform-cards-grid slide-${slideDirection}`} key={activeAgentTab}>
                                            {Object.entries(generatedContentByAgent[activeAgentTab].platforms).map(([platform, data]) => {
                                                // Platform icons with brand colors
                                                const platformIcons = {
                                                    twitter: (
                                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="#000000">
                                                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                                        </svg>
                                                    ),
                                                    linkedin: (
                                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="#0A66C2">
                                                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                                        </svg>
                                                    )
                                                };

                                                const platformNames = {
                                                    twitter: 'X',
                                                    linkedin: 'LinkedIn'
                                                };

                                                return (
                                                    <div
                                                        key={platform}
                                                        className="platform-card"
                                                    >
                                                        {/* Card Header */}
                                                        <div className="platform-card-header">
                                                            <div className="platform-card-icon">
                                                                {platformIcons[platform]}
                                                            </div>
                                                            <div className="platform-card-info">
                                                                <div className="platform-card-title">
                                                                    Write a post on {platformNames[platform] || platform}
                                                                </div>
                                                                <div className="platform-card-subtitle">
                                                                    {activeAgentTab}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Read-only Content */}
                                                        <div className="platform-card-content">
                                                            {data.text}
                                                        </div>

                                                        {/* Strategy Label */}
                                                        {/* <div style={{
                                                            fontSize: '0.75rem',
                                                            color: '#6366f1',
                                                            fontWeight: '500',
                                                            marginBottom: '1rem',
                                                            padding: '0.5rem',
                                                            background: '#eef2ff',
                                                            borderRadius: '6px'
                                                        }}> */}
                                                        {/* <strong>Strategy:</strong> {generatedContentByAgent[activeAgentTab].agent_description.slice(0, 100)}... */}
                                                        {/* </div> */}

                                                        {/* Action Buttons */}
                                                        <div className="platform-card-actions">
                                                            <button
                                                                onClick={async () => {
                                                                    // Save this specific agent's platform content as draft
                                                                    const prevAgent = activeAgentTab;
                                                                    const prevData = generatedContentByAgent;

                                                                    // Temporarily set this as the only content
                                                                    setGeneratedContentByAgent({
                                                                        [activeAgentTab]: {
                                                                            ...generatedContentByAgent[activeAgentTab],
                                                                            platforms: {
                                                                                [platform]: data
                                                                            }
                                                                        }
                                                                    });

                                                                    await handleSaveAsDraft();

                                                                    // Restore all content
                                                                    setGeneratedContentByAgent(prevData);
                                                                    setActiveAgentTab(prevAgent);
                                                                }}
                                                                disabled={savingDraft || publishing || scheduling}
                                                                className="btn-draft platform-card-btn"
                                                            >
                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                                </svg>
                                                                Save Draft
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    // Set this as active content and open schedule modal
                                                                    const prevData = generatedContentByAgent;
                                                                    setGeneratedContentByAgent({
                                                                        [activeAgentTab]: {
                                                                            ...generatedContentByAgent[activeAgentTab],
                                                                            platforms: {
                                                                                [platform]: data
                                                                            }
                                                                        }
                                                                    });
                                                                    setShowScheduleModal(true);
                                                                }}
                                                                disabled={savingDraft || publishing || scheduling}
                                                                className="btn-schedule platform-card-btn"
                                                            >
                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                </svg>
                                                                Schedule
                                                            </button>
                                                            <button
                                                                onClick={async () => {
                                                                    // Publish this specific agent's platform content
                                                                    const prevAgent = activeAgentTab;
                                                                    const prevData = generatedContentByAgent;

                                                                    // Temporarily set this as the only content
                                                                    setGeneratedContentByAgent({
                                                                        [activeAgentTab]: {
                                                                            ...generatedContentByAgent[activeAgentTab],
                                                                            platforms: {
                                                                                [platform]: data
                                                                            }
                                                                        }
                                                                    });

                                                                    await handlePublishNow();

                                                                    // Restore all content
                                                                    setGeneratedContentByAgent(prevData);
                                                                    setActiveAgentTab(prevAgent);
                                                                }}
                                                                disabled={savingDraft || publishing || scheduling}
                                                                className="btn-publish platform-card-btn"
                                                            >
                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                                                </svg>
                                                                Publish
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Generated Image Preview */}
                                    {generatedImage && (
                                        <div className="image-preview" style={{ marginTop: '1.5rem' }}>
                                            <img src={generatedImage} alt="Generated preview" />
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Placeholder when no content */}
                            {Object.keys(generatedContentByAgent).length === 0 && (
                                <div className="content-empty-state">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <p>Generated content will appear here...</p>
                                    <p>Select platforms, enter topic & tone, then click "Generate Content"</p>
                                </div>
                            )}
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
