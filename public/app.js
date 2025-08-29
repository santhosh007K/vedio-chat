// Global variables
let socket;
let currentUser = null;
let videos = [];
let currentVideo = null;
let isHandRaised = false;

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
            break;
        case 'pause':
            videoPlayer.pause();
            break;
        case 'seek':
            videoPlayer.currentTime = data.time;
            break;
        case 'volume':
            videoPlayer.volume = data.volume;
            break;
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

function addChatMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.className = `message ${message.userId === socket.id ? 'own' : ''} ${message.type || ''}`;
    
    const time = new Date(message.timestamp).toLocaleTimeString();
    
    messageElement.innerHTML = `
        <div class="message-header">
            <span class="message-username">${message.username}</span>
            <span class="message-time">${time}</span>
        </div>
        <div class="message-content">${escapeHtml(message.message)}</div>
    `;
    
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
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = videoPlayer.videoWidth;
        canvas.height = videoPlayer.videoHeight;
        
        ctx.drawImage(videoPlayer, 0, 0, canvas.width, canvas.height);
        
        return canvas.toDataURL('image/jpeg', 0.8);
    } catch (error) {
        console.error('Error capturing video frame:', error);
        return null;
    }
}

// AI Chat functionality
function openAiChatModal() {
    aiChatModal.classList.remove('hidden');
    captureScreenshotForAi();
}

function closeAiChatModal() {
    aiChatModal.classList.add('hidden');
    aiChatInput.value = '';
}

async function captureScreenshotForAi() {
    if (!videoPlayer.paused && !videoPlayer.ended) {
        const screenshot = await captureVideoFrame();
        if (screenshot) {
            const img = new Image();
            img.onload = () => {
                const ctx = screenshotCanvas.getContext('2d');
                ctx.drawImage(img, 0, 0, screenshotCanvas.width, screenshotCanvas.height);
            };
            img.src = screenshot;
        }
    }
}

async function handleAiChatSubmit(e) {
    e.preventDefault();
    
    const message = aiChatInput.value.trim();
    if (!message) return;
    
    // Add user message to AI chat
    addAiMessage(message, 'user');
    aiChatInput.value = '';
    
    try {
        showLoading(true);
        
        const response = await fetch('/ai-chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                message,
                screenshot: screenshotCanvas.toDataURL('image/jpeg', 0.8)
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            addAiMessage(result.response, 'ai');
        } else {
            addAiMessage('Sorry, I encountered an error. Please try again.', 'ai');
        }
    } catch (error) {
        console.error('AI chat error:', error);
        addAiMessage('Sorry, I encountered an error. Please try again.', 'ai');
    } finally {
        showLoading(false);
    }
}

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
