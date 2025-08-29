// Global variables
let socket;
let currentUser = null;
let videos = [];
let currentVideo = null;
let isHandRaised = false;
let conversationHistory = []; // Store conversation history for current user

// DOM elements
const videoPlayer = document.getElementById('videoPlayer');
const uploadForm = document.getElementById('uploadForm');
const uploadArea = document.getElementById('uploadArea');
const videoFile = document.getElementById('videoFile');
const uploadBtn = document.getElementById('uploadBtn');
const uploadProgress = document.getElementById('uploadProgress');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const videoList = document.getElementById('videoList');
const chatMessages = document.getElementById('chatMessages');
const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');
const usersList = document.getElementById('usersList');
const raiseHandBtn = document.getElementById('raiseHandBtn');
const aiChatBtn = document.getElementById('aiChatBtn');
const aiChatModal = document.getElementById('aiChatModal');
const closeAiModal = document.getElementById('closeAiModal');
const aiChatForm = document.getElementById('aiChatForm');
const aiChatInput = document.getElementById('aiChatInput');
const aiChatMessages = document.getElementById('aiChatMessages');
const screenshotCanvas = document.getElementById('screenshotCanvas');
const loadingOverlay = document.getElementById('loadingOverlay');
const username = document.getElementById('username');
const connectionStatus = document.getElementById('connectionStatus');

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    initializeSocket();
    setupEventListeners();
    loadVideos();
    
    // Add a placeholder message to video player
    if (videoPlayer) {
        videoPlayer.addEventListener('loadstart', () => {
            console.log('Video loading started');
        });
        
        videoPlayer.addEventListener('canplay', () => {
            console.log('Video can start playing');
        });
        
        // Show a message when no video is loaded
        if (!videoPlayer.src) {
            const placeholder = document.createElement('div');
            placeholder.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                color: white;
                font-size: 1.2rem;
                text-align: center;
                z-index: 10;
            `;
            placeholder.innerHTML = `
                <i class="fas fa-play-circle" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
                <p>Upload a video or select one from the library to start watching</p>
            `;
            videoPlayer.parentElement.appendChild(placeholder);
        }
    }
});

// Socket.IO initialization
function initializeSocket() {
    socket = io();
    
    socket.on('connect', () => {
        console.log('Connected to server');
        updateConnectionStatus(true);
        socket.emit('joinRoom', { room: 'default' });
    });
    
    socket.on('disconnect', () => {
        console.log('Disconnected from server');
        updateConnectionStatus(false);
    });
    
    socket.on('joinedRoom', (data) => {
        console.log('Joined room:', data);
        currentUser = {
            id: socket.id,
            username: `User-${socket.id.substring(0, 6)}`
        };
        username.textContent = currentUser.username;
    });
    
    socket.on('roomState', (room) => {
        console.log('Room state received:', room);
        videos = room.videos || [];
        currentVideo = room.currentVideo;
        updateVideoList();
        if (currentVideo) {
            loadVideo(currentVideo);
        }
    });
    
    socket.on('userList', (users) => {
        updateUsersList(users);
    });
    
    socket.on('newMessage', (message) => {
        console.log('📨 New message received:', message);
        addChatMessage(message);
    });
    
    socket.on('handRaised', (data) => {
        handleHandRaised(data);
    });
    
    socket.on('videoChanged', (data) => {
        if (data.videoId !== currentVideo) {
            currentVideo = data.videoId;
            loadVideo(data.videoId);
        }
    });
    
    socket.on('videoControl', (data) => {
        handleVideoControl(data);
    });
    
    socket.on('conversationHistory', (history) => {
        console.log('📚 Received conversation history from server:', history);
        conversationHistory = history;
        updateConversationIndicator();
        
        // Update the AI chat modal if it's open
        if (!aiChatModal.classList.contains('hidden')) {
            aiChatMessages.innerHTML = '';
            if (conversationHistory.length > 0) {
                conversationHistory.forEach(msg => {
                    addAiMessage(msg.content, msg.role === 'user' ? 'user' : 'ai');
                });
            } else {
                // Add welcome message if no conversation history
                const welcomeMessage = document.createElement('div');
                welcomeMessage.className = 'ai-message';
                welcomeMessage.innerHTML = `
                    <i class="fas fa-robot"></i>
                    <p>Hello! I can help you understand what's happening in this video frame. What would you like to know?</p>
                `;
                aiChatMessages.appendChild(welcomeMessage);
            }
        }
    });
    
    socket.on('conversationUpdate', (data) => {
        console.log('🔄 Received conversation update:', data);
        
        // Update conversation history from server
        conversationHistory = data.conversationHistory;
        updateConversationIndicator();
        
        // If AI chat modal is open, only add the AI response (user message already added)
        if (!aiChatModal.classList.contains('hidden')) {
            // Add AI response
            addAiMessage(data.aiResponse, 'ai');
        }
    });
}

// Event listeners setup
function setupEventListeners() {
    // Upload functionality
    uploadArea.addEventListener('click', () => videoFile.click());
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    videoFile.addEventListener('change', handleFileSelect);
    uploadForm.addEventListener('submit', handleUpload);
    
    // Chat functionality
    chatForm.addEventListener('submit', handleChatSubmit);
    
    // Video controls
    raiseHandBtn.addEventListener('click', handleRaiseHand);
    aiChatBtn.addEventListener('click', openAiChatModal);
    closeAiModal.addEventListener('click', closeAiChatModal);
    aiChatForm.addEventListener('submit', handleAiChatSubmit);
    
    // Clear history button
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', clearConversationHistory);
    }
    
    // Video player events
    videoPlayer.addEventListener('loadedmetadata', () => {
        console.log('Video metadata loaded');
    });
    
    videoPlayer.addEventListener('error', (e) => {
        console.error('Video error:', e);
        showNotification('Error loading video', 'error');
    });
    
    // Custom video controls
    const playPauseBtn = document.getElementById('playPauseBtn');
    const muteBtn = document.getElementById('muteBtn');
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    
    if (playPauseBtn) {
        playPauseBtn.addEventListener('click', () => {
            if (videoPlayer.paused) {
                videoPlayer.play();
                playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
            } else {
                videoPlayer.pause();
                playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
            }
        });
    }
    
    if (muteBtn) {
        muteBtn.addEventListener('click', () => {
            videoPlayer.muted = !videoPlayer.muted;
            muteBtn.innerHTML = videoPlayer.muted ? 
                '<i class="fas fa-volume-mute"></i>' : 
                '<i class="fas fa-volume-up"></i>';
        });
    }
    
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', () => {
            if (videoPlayer.requestFullscreen) {
                videoPlayer.requestFullscreen();
            } else if (videoPlayer.webkitRequestFullscreen) {
                videoPlayer.webkitRequestFullscreen();
            } else if (videoPlayer.msRequestFullscreen) {
                videoPlayer.msRequestFullscreen();
            }
        });
    }
    
    // Modal close on outside click
    aiChatModal.addEventListener('click', (e) => {
        if (e.target === aiChatModal) {
            closeAiChatModal();
        }
    });
}

// Upload functionality
function handleDragOver(e) {
    e.preventDefault();
    uploadArea.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        videoFile.files = files;
        handleFileSelect();
    }
}

function handleFileSelect() {
    const file = videoFile.files[0];
    if (file) {
        uploadBtn.disabled = false;
        uploadArea.querySelector('p').textContent = `Selected: ${file.name}`;
    }
}

async function handleUpload(e) {
    e.preventDefault();
    
    const formData = new FormData();
    const file = videoFile.files[0];
    
    if (!file) {
        showNotification('Please select a video file', 'error');
        return;
    }
    
    // Check file size (100MB limit)
    const maxSize = 100 * 1024 * 1024; // 100MB in bytes
    if (file.size > maxSize) {
        showNotification('File size too large. Maximum size is 100MB.', 'error');
        return;
    }
    
    // Check file type
    const allowedTypes = ['video/mp4', 'video/webm', 'video/avi', 'video/mov', 'video/mkv'];
    if (!allowedTypes.includes(file.type)) {
        showNotification('Invalid file type. Please select a video file (MP4, WebM, AVI, MOV, MKV).', 'error');
        return;
    }
    
    formData.append('video', file);
    
    try {
        showLoading(true);
        uploadProgress.classList.remove('hidden');
        
        // Show upload progress
        uploadArea.querySelector('p').textContent = `Uploading: ${file.name}...`;
        
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Video uploaded successfully!', 'success');
            videos.push(result.video);
            updateVideoList();
            resetUploadForm();
        } else {
            showNotification(result.error || 'Upload failed', 'error');
        }
    } catch (error) {
        console.error('Upload error:', error);
        showNotification(`Upload failed: ${error.message}`, 'error');
    } finally {
        showLoading(false);
        uploadProgress.classList.add('hidden');
    }
}

function resetUploadForm() {
    uploadForm.reset();
    uploadBtn.disabled = true;
    uploadArea.querySelector('p').textContent = 'Drag & drop video files here or click to browse';
}

// Video functionality
async function loadVideos() {
    try {
        const response = await fetch('/videos');
        videos = await response.json();
        updateVideoList();
    } catch (error) {
        console.error('Error loading videos:', error);
    }
}

function updateVideoList() {
    if (videos.length === 0) {
        videoList.innerHTML = '<p class="no-videos">No videos uploaded yet</p>';
        return;
    }
    
    videoList.innerHTML = videos.map(video => `
        <div class="video-item ${video.id === currentVideo ? 'active' : ''}" 
             onclick="selectVideo('${video.id}')" 
             title="Click to play ${video.originalName}">
            <i class="fas ${video.id === currentVideo ? 'fa-play' : 'fa-play-circle'}"></i>
            <div class="video-info">
                <div class="video-title">${video.originalName}</div>
                <div class="video-meta">
                    ${formatFileSize(video.size)} • ${formatDate(video.uploadedAt)}
                    ${video.id === currentVideo ? ' • <span style="color: #ff0000;">Now Playing</span>' : ''}
                </div>
            </div>
        </div>
    `).join('');
}

function selectVideo(videoId) {
    currentVideo = videoId;
    loadVideo(videoId);
    
    // Update server
    fetch('/videos/current', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ videoId })
    });
    
    updateVideoList();
    
    // Emit video change to other users
    if (socket) {
        socket.emit('videoControl', { action: 'videoChanged', videoId });
    }
}

function loadVideo(videoId) {
    const video = videos.find(v => v.id === videoId);
    if (video) {
        console.log('Loading video:', video);
        
        // Remove placeholder if it exists
        const placeholder = videoPlayer.parentElement.querySelector('div[style*="position: absolute"]');
        if (placeholder) {
            placeholder.remove();
        }
        
        videoPlayer.src = video.url;
        videoPlayer.load();
        
        // Add event listeners for debugging
        videoPlayer.addEventListener('loadeddata', () => {
            console.log('Video data loaded successfully');
            showNotification(`Now playing: ${video.originalName}`, 'info');
        });
        
        videoPlayer.addEventListener('error', (e) => {
            console.error('Video loading error:', e);
            showNotification(`Error loading video: ${video.originalName}`, 'error');
        });
        
        // Try to play the video
        videoPlayer.play().catch(error => {
            console.error('Video play error:', error);
            showNotification(`Cannot play video: ${error.message}`, 'error');
        });
    } else {
        console.error('Video not found:', videoId);
        showNotification('Video not found', 'error');
    }
}

function handleVideoControl(data) {
    // Handle remote video controls
    switch (data.action) {
        case 'play':
            videoPlayer.play();
            // Update play/pause button if it exists
            const playPauseBtn = document.getElementById('playPauseBtn');
            if (playPauseBtn) {
                playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
            }
            break;
        case 'pause':
            videoPlayer.pause();
            // Update play/pause button if it exists
            const pauseBtn = document.getElementById('playPauseBtn');
            if (pauseBtn) {
                pauseBtn.innerHTML = '<i class="fas fa-play"></i>';
            }
            break;
        case 'seek':
            videoPlayer.currentTime = data.time;
            break;
        case 'volume':
            videoPlayer.volume = data.volume;
            break;
    }
    
    // Show notification for hand raise/lower events
    if (data.reason === 'hand_raised' && data.userId !== socket.id) {
        showNotification('Video paused - someone raised their hand for conversation', 'info');
    } else if (data.reason === 'hand_lowered' && data.userId !== socket.id) {
        showNotification('Video resumed - conversation ended', 'success');
    }
}

// Chat functionality
function handleChatSubmit(e) {
    e.preventDefault();
    
    const message = chatInput.value.trim();
    if (!message) return;
    
    socket.emit('chatMessage', { message });
    chatInput.value = '';
}

// Enhanced chat message handling to support AI responses
function addChatMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.className = `message ${message.userId === socket.id ? 'own' : ''} ${message.type || ''}`;
    
    const time = new Date(message.timestamp).toLocaleTimeString();
    
    // Special handling for AI responses
    if (message.type === 'ai-response') {
        messageElement.innerHTML = `
            <div class="message-header">
                <span class="message-username">
                    <i class="fas fa-robot" style="color: #667eea; margin-right: 5px;"></i>
                    ${message.username}
                </span>
                <span class="message-time">${time}</span>
            </div>
            <div class="message-content ai-response">${escapeHtml(message.message)}</div>
        `;
        
        // Always show AI responses in the main chat
        // Update conversation indicator if it's related to current user
        if (message.relatedTo === socket.id) {
            updateConversationIndicator();
            
            // If AI chat modal is open, also add the response to the modal
            if (!aiChatModal.classList.contains('hidden')) {
                addAiMessage(message.message, 'ai');
            }
        }
    } else {
        messageElement.innerHTML = `
            <div class="message-header">
                <span class="message-username">${message.username}</span>
                <span class="message-time">${time}</span>
            </div>
            <div class="message-content">${escapeHtml(message.message)}</div>
        `;
    }
    
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Remove welcome message if it exists
    const welcomeMessage = chatMessages.querySelector('.welcome-message');
    if (welcomeMessage) {
        welcomeMessage.remove();
    }
}

// Raise hand functionality
async function handleRaiseHand() {
    console.log('🔍 Raise hand clicked');
    isHandRaised = !isHandRaised;
    
    // Take screenshot of current video frame
    let screenshot = null;
    if (isHandRaised && !videoPlayer.paused && !videoPlayer.ended) {
        console.log('📸 Capturing video frame...');
        screenshot = await captureVideoFrame();
        console.log('📸 Screenshot captured:', screenshot ? 'Success' : 'Failed');
    } else if (isHandRaised) {
        console.log('⚠️ Cannot capture screenshot - video is paused or ended');
    }
    
    // Auto-pause video when raising hand
    if (isHandRaised && !videoPlayer.paused) {
        console.log('⏸️ Auto-pausing video for conversation');
        videoPlayer.pause();
        // Update play/pause button if it exists
        const playPauseBtn = document.getElementById('playPauseBtn');
        if (playPauseBtn) {
            playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        }
        // Show notification about auto-pause
        showNotification('Video paused for conversation. Lower hand to resume.', 'info');
        
        // Automatically open AI chat modal for conversation
        setTimeout(() => {
            if (isHandRaised) {
                console.log('🤖 Auto-opening AI chat modal for conversation');
                openAiChatModal();
            }
        }, 1000); // Small delay to ensure hand raise is processed
    }
    
    // Auto-play video when lowering hand
    if (!isHandRaised && videoPlayer.paused) {
        console.log('▶️ Auto-playing video after conversation');
        videoPlayer.play().catch(error => {
            console.error('Error auto-playing video:', error);
        });
        // Update play/pause button if it exists
        const playPauseBtn = document.getElementById('playPauseBtn');
        if (playPauseBtn) {
            playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
        }
        // Show notification about auto-play
        showNotification('Video resumed. Conversation ended.', 'success');
        
        // Automatically close AI chat modal when hand is lowered
        if (!aiChatModal.classList.contains('hidden')) {
            console.log('🤖 Auto-closing AI chat modal after conversation');
            closeAiChatModal();
        }
    }
    
    console.log('📤 Sending raise hand event to server');
    socket.emit('raiseHand', { screenshot });
    
    // Update button state
    raiseHandBtn.classList.toggle('raised', isHandRaised);
    raiseHandBtn.innerHTML = isHandRaised ? 
        '<i class="fas fa-hand-paper"></i><span>Lower Hand</span>' :
        '<i class="fas fa-hand-paper"></i><span>Raise Hand</span>';
    
    console.log('✅ Raise hand state updated:', isHandRaised);
}

function handleHandRaised(data) {
    // Update user list to show raised hand
    const userElements = usersList.querySelectorAll('.user-item');
    userElements.forEach(element => {
        if (element.dataset.userId === data.userId) {
            element.classList.toggle('raised', data.isHandRaised);
        }
    });
    
    // Show notification
    if (data.isHandRaised) {
        showNotification(`${data.username} raised their hand`, 'info');
    }
}

async function captureVideoFrame() {
    try {
        // Check if video is ready
        if (videoPlayer.readyState < 2) {
            console.error('Video not ready for capture');
            return null;
        }
        
        // Check if video has valid dimensions
        if (videoPlayer.videoWidth === 0 || videoPlayer.videoHeight === 0) {
            console.error('Video dimensions are zero');
            return null;
        }
        
        console.log(`📐 Video dimensions: ${videoPlayer.videoWidth}x${videoPlayer.videoHeight}`);
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas dimensions to match video
        canvas.width = videoPlayer.videoWidth;
        canvas.height = videoPlayer.videoHeight;
        
        // Draw the current video frame to canvas
        ctx.drawImage(videoPlayer, 0, 0, canvas.width, canvas.height);
        
        // Check if the canvas has content (not completely black)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        let hasContent = false;
        
        // Check if any pixel is not black (simple check)
        for (let i = 0; i < data.length; i += 4) {
            if (data[i] > 10 || data[i + 1] > 10 || data[i + 2] > 10) {
                hasContent = true;
                break;
            }
        }
        
        if (!hasContent) {
            console.error('Captured frame appears to be black');
            return null;
        }
        
        console.log('✅ Video frame captured successfully');
        return canvas.toDataURL('image/jpeg', 0.8);
    } catch (error) {
        console.error('Error capturing video frame:', error);
        return null;
    }
}

// AI Chat functionality
function openAiChatModal() {
    aiChatModal.classList.remove('hidden');
    
    // Always clear conversation history for new chat
    console.log('🔄 Clearing conversation history for new chat');
    conversationHistory = [];
    
    // Clear conversation history on server
    if (socket) {
        socket.emit('clearConversationHistory');
    }
    
    // Clear previous conversation display
    aiChatMessages.innerHTML = '';
    
    // Add welcome message for new conversation
    const welcomeMessage = document.createElement('div');
    welcomeMessage.className = 'ai-message';
    welcomeMessage.innerHTML = `
        <i class="fas fa-robot"></i>
        <p>Hello! I can help you understand what's happening in this video frame. What would you like to know?</p>
    `;
    aiChatMessages.appendChild(welcomeMessage);
    
    // Update conversation indicator
    updateConversationIndicator();
    
    // Capture fresh screenshot for new conversation (with delay to ensure modal is open)
    setTimeout(() => {
        console.log('📸 Capturing fresh screenshot for new conversation');
        captureScreenshotForAi();
    }, 100);
}

function closeAiChatModal() {
    aiChatModal.classList.add('hidden');
    aiChatInput.value = '';
}

async function captureScreenshotForAi() {
    console.log('📸 Starting screenshot capture for AI...');
    
    // Check if video is playing and has content
    if (videoPlayer.paused || videoPlayer.ended) {
        console.log('⚠️ Video is paused or ended, cannot capture frame');
        showNotification('Please play the video to capture a frame', 'warning');
        return;
    }
    
    if (videoPlayer.readyState < 2) {
        console.log('⚠️ Video not ready for capture');
        showNotification('Please wait for video to load completely', 'warning');
        return;
    }
    
    const screenshot = await captureVideoFrame();
    if (screenshot) {
        console.log('✅ Screenshot captured, updating preview...');
        
        // Update the hidden canvas for AI processing
        const img = new Image();
        img.onload = () => {
            const ctx = screenshotCanvas.getContext('2d');
            ctx.drawImage(img, 0, 0, screenshotCanvas.width, screenshotCanvas.height);
            console.log('✅ Screenshot preview updated');
        };
        img.src = screenshot;
        
        // Show screenshot preview in the modal
        showScreenshotPreview(screenshot);
    } else {
        console.error('❌ Failed to capture screenshot');
        showNotification('Failed to capture video frame. Please try again.', 'error');
    }
}

function showScreenshotPreview(screenshotDataUrl) {
    // Create or update screenshot preview in the AI chat modal
    let previewContainer = document.getElementById('screenshotPreview');
    
    if (!previewContainer) {
        previewContainer = document.createElement('div');
        previewContainer.id = 'screenshotPreview';
        previewContainer.className = 'screenshot-preview';
        previewContainer.innerHTML = `
            <h4><i class="fas fa-camera"></i> Captured Frame Preview</h4>
            <img src="" alt="Video frame preview" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
            <p style="font-size: 0.9rem; color: #666; margin-top: 8px;">
                <i class="fas fa-info-circle"></i> This is the frame that will be analyzed by AI
            </p>
        `;
        
        // Insert the preview at the top of the AI chat modal
        const aiChatContent = document.querySelector('.ai-chat-content');
        if (aiChatContent) {
            aiChatContent.insertBefore(previewContainer, aiChatContent.firstChild);
        }
    }
    
    // Update the image source
    const previewImg = previewContainer.querySelector('img');
    if (previewImg) {
        previewImg.src = screenshotDataUrl;
    }
}

async function handleAiChatSubmit(e) {
    e.preventDefault();
    
    const message = aiChatInput.value.trim();
    if (!message) return;
    
    console.log('🤖 AI Chat message sent:', message);
    
    // Add user message to AI chat display immediately
    addAiMessage(message, 'user');
    
    // Clear input immediately
    aiChatInput.value = '';
    
    try {
        showLoading(true);
        
        // Check if we have a valid screenshot
        const screenshot = screenshotCanvas.toDataURL('image/jpeg', 0.8);
        
        // Verify the screenshot is not completely black
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            let hasContent = false;
            
            // Check if any pixel is not black
            for (let i = 0; i < data.length; i += 4) {
                if (data[i] > 10 || data[i + 1] > 10 || data[i + 2] > 10) {
                    hasContent = true;
                    break;
                }
            }
            
            if (!hasContent) {
                console.error('❌ Screenshot appears to be black, recapturing...');
                showNotification('Screenshot is black, recapturing video frame...', 'warning');
                
                // Try to recapture the screenshot
                setTimeout(async () => {
                    await captureScreenshotForAi();
                    showNotification('Please try sending your message again', 'info');
                }, 1000);
                
                showLoading(false);
                return;
            }
            
            console.log('✅ Screenshot verified, sending to AI...');
            
            // Use the new socket-based AI chat for better conversation handling
            socket.emit('aiChatMessage', { 
                message,
                screenshot: screenshot,
                userId: socket.id,
                isFirstMessage: true // Always true since we clear history
            });
            
            showLoading(false);
        };
        
        img.onerror = () => {
            console.error('❌ Failed to load screenshot for verification');
            showNotification('Failed to verify screenshot. Please try again.', 'error');
            showLoading(false);
        };
        
        img.src = screenshot;
        
    } catch (error) {
        console.error('AI chat error:', error);
        addAiMessage('Sorry, I encountered an error. Please try again.', 'ai');
        showLoading(false);
    }
}

// Enhanced AI message display for modal
function addAiMessage(message, sender) {
    const messageElement = document.createElement('div');
    messageElement.className = 'ai-message';
    
    const icon = sender === 'ai' ? 'fas fa-robot' : 'fas fa-user';
    const color = sender === 'ai' ? '#667eea' : '#4caf50';
    
    messageElement.innerHTML = `
        <i class="${icon}" style="color: ${color}"></i>
        <p>${escapeHtml(message)}</p>
    `;
    
    aiChatMessages.appendChild(messageElement);
    aiChatMessages.scrollTop = aiChatMessages.scrollHeight;
    
    // Note: Conversation history is now handled in handleAiChatSubmit and addChatMessage
    // This function only displays messages in the AI chat modal
}

// Add a function to clear conversation history
function clearConversationHistory() {
    conversationHistory = [];
    if (socket) {
        // Notify server to clear history
        socket.emit('clearConversationHistory');
    }
    
    // Clear the AI chat messages display
    aiChatMessages.innerHTML = '';
    
    // Add a welcome message back
    const welcomeMessage = document.createElement('div');
    welcomeMessage.className = 'ai-message';
    welcomeMessage.innerHTML = `
        <i class="fas fa-robot"></i>
        <p>Hello! I can help you understand what's happening in this video frame. What would you like to know?</p>
    `;
    aiChatMessages.appendChild(welcomeMessage);
    
    // Update conversation indicator
    updateConversationIndicator();
    
    // Show notification
    showNotification('Conversation history cleared', 'info');
}

// Add conversation history indicator
function updateConversationIndicator() {
    const indicator = document.getElementById('conversationIndicator');
    if (indicator) {
        if (conversationHistory.length > 0) {
            indicator.style.display = 'block';
            const span = indicator.querySelector('span');
            if (span) {
                span.textContent = `${conversationHistory.length} messages in conversation`;
            }
        } else {
            indicator.style.display = 'none';
        }
    }
}

// Users list functionality
function updateUsersList(users) {
    usersList.innerHTML = users.map(user => `
        <div class="user-item ${user.isHandRaised ? 'raised' : ''}" data-user-id="${user.id}">
            <i class="fas fa-circle"></i>
            <span>${user.username}</span>
            ${user.isHandRaised ? '<i class="fas fa-hand-paper" style="color: #ff6b6b;"></i>' : ''}
        </div>
    `).join('');
}

// Utility functions
function updateConnectionStatus(connected) {
    const icon = connectionStatus.querySelector('i');
    icon.style.color = connected ? '#4CAF50' : '#f44336';
    icon.style.animation = connected ? 'pulse 2s infinite' : 'none';
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? '#f44336' : type === 'success' ? '#4CAF50' : '#2196F3'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 3000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

function showLoading(show) {
    loadingOverlay.classList.toggle('hidden', !show);
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Space bar to play/pause video
    if (e.code === 'Space' && document.activeElement !== chatInput && document.activeElement !== aiChatInput) {
        e.preventDefault();
        if (videoPlayer.paused) {
            videoPlayer.play();
        } else {
            videoPlayer.pause();
        }
    }
    
    // Escape to close modal
    if (e.code === 'Escape' && !aiChatModal.classList.contains('hidden')) {
        closeAiChatModal();
    }
    
    // Ctrl+Enter to send chat message
    if (e.ctrlKey && e.code === 'Enter' && document.activeElement === chatInput) {
        handleChatSubmit(e);
    }
});

// Video player keyboard controls
videoPlayer.addEventListener('keydown', (e) => {
    switch (e.code) {
        case 'ArrowLeft':
            e.preventDefault();
            videoPlayer.currentTime = Math.max(0, videoPlayer.currentTime - 10);
            break;
        case 'ArrowRight':
            e.preventDefault();
            videoPlayer.currentTime = Math.min(videoPlayer.duration, videoPlayer.currentTime + 10);
            break;
        case 'ArrowUp':
            e.preventDefault();
            videoPlayer.volume = Math.min(1, videoPlayer.volume + 0.1);
            break;
        case 'ArrowDown':
            e.preventDefault();
            videoPlayer.volume = Math.max(0, videoPlayer.volume - 0.1);
            break;
    }
});
