const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Ensure uploads directory exists
fs.ensureDirSync(process.env.UPLOAD_PATH || './uploads');

// Configure multer for video uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.UPLOAD_PATH || './uploads');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 100000000 // 100MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = (process.env.ALLOWED_VIDEO_TYPES || 'mp4,webm,avi,mov,mkv').split(',');
    const fileExtension = path.extname(file.originalname).toLowerCase().substring(1);
    
    if (allowedTypes.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only video files are allowed.'), false);
    }
  }
});

// Azure OpenAI Configuration
const { OpenAI } = require('openai');

// Debug environment variables
console.log('🔍 Environment variables check:');
console.log('AZURE_OPENAI_API_KEY:', process.env.AZURE_OPENAI_API_KEY ? 'Set' : 'Not set');
console.log('AZURE_OPENAI_ENDPOINT:', process.env.AZURE_OPENAI_ENDPOINT ? 'Set' : 'Not set');
console.log('AZURE_OPENAI_DEPLOYMENT_NAME:', process.env.AZURE_OPENAI_DEPLOYMENT_NAME ? 'Set' : 'Not set');
console.log('AZURE_OPENAI_API_VERSION:', process.env.AZURE_OPENAI_API_VERSION ? 'Set' : 'Not set');

let openai = null;
if (process.env.AZURE_OPENAI_API_KEY && process.env.AZURE_OPENAI_ENDPOINT && process.env.AZURE_OPENAI_DEPLOYMENT_NAME) {
  console.log('✅ All Azure OpenAI credentials found, initializing...');
  openai = new OpenAI({
    apiKey: process.env.AZURE_OPENAI_API_KEY,
    baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT_NAME}`,
    defaultQuery: { 'api-version': process.env.AZURE_OPENAI_API_VERSION || '2024-08-01-preview' },
    defaultHeaders: { 'api-key': process.env.AZURE_OPENAI_API_KEY }
  });
  console.log('✅ Azure OpenAI client initialized successfully');
} else {
  console.log('⚠️  Azure OpenAI credentials not configured. AI features will be disabled.');
}

// Store connected users and their states
const connectedUsers = new Map();
const videoRooms = new Map();

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Upload video endpoint
app.post('/upload', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file uploaded' });
    }

    const videoInfo = {
      id: uuidv4(),
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: req.file.path,
      size: req.file.size,
      uploadedAt: new Date(),
      url: `/uploads/${req.file.filename}`
    };

    // Store video info (in a real app, you'd save to database)
    if (!videoRooms.has('default')) {
      videoRooms.set('default', { videos: [], currentVideo: null });
    }
    videoRooms.get('default').videos.push(videoInfo);

    res.json({
      success: true,
      video: videoInfo,
      message: 'Video uploaded successfully'
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed', details: error.message });
  }
});

// Get all videos
app.get('/videos', (req, res) => {
  const room = videoRooms.get('default') || { videos: [], currentVideo: null };
  res.json(room.videos);
});

// Set current video
app.post('/videos/current', (req, res) => {
  const { videoId } = req.body;
  if (!videoRooms.has('default')) {
    videoRooms.set('default', { videos: [], currentVideo: null });
  }
  
  const room = videoRooms.get('default');
  room.currentVideo = videoId;
  
  // Notify all connected clients about the video change
  io.emit('videoChanged', { videoId, room: 'default' });
  
  res.json({ success: true, currentVideo: videoId });
});

// AI Chat endpoint
app.post('/ai-chat', async (req, res) => {
  try {
    const { message, screenshot } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!openai) {
      return res.status(503).json({ 
        error: 'AI service not configured', 
        details: 'Please configure Azure OpenAI credentials in your .env file' 
      });
    }

    let messages = [
      {
        role: "system",
        content: "You are a helpful AI assistant that can analyze video content and answer questions about what's happening in the video. Provide clear, concise, and relevant answers."
      }
    ];

    // If screenshot is provided, use multimodal analysis
    if (screenshot) {
      messages.push({
        role: "user",
        content: [
          {
            type: "text", 
            text: `Based on this video screenshot and the user's question: "${message}", please provide a helpful and relevant answer. The screenshot shows the current frame of the video being watched.`
          },
          {
            type: "image_url",
            image_url: {
              url: screenshot
            }
          }
        ]
      });
    } else {
      messages.push({
        role: "user",
        content: message
      });
    }

    const completion = await openai.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
      messages: messages,
      max_tokens: 500,
      temperature: 0.7
    });

    const aiResponse = completion.choices[0].message.content;
    
    res.json({
      success: true,
      response: aiResponse,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('AI Chat error:', error);
    res.status(500).json({ 
      error: 'AI chat failed', 
      details: error.message 
    });
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Add user to connected users
  connectedUsers.set(socket.id, {
    id: socket.id,
    username: `User-${socket.id.substring(0, 6)}`,
    isHandRaised: false,
    joinedAt: new Date()
  });

  // Send current room state to new user
  const room = videoRooms.get('default') || { videos: [], currentVideo: null };
  socket.emit('roomState', room);
  socket.emit('userList', Array.from(connectedUsers.values()));

  // Handle user joining
  socket.on('joinRoom', (data) => {
    socket.join('default');
    socket.emit('joinedRoom', { room: 'default', users: Array.from(connectedUsers.values()) });
  });

  // Handle chat messages
  socket.on('chatMessage', (data) => {
    const user = connectedUsers.get(socket.id);
    if (user) {
      const messageData = {
        id: uuidv4(),
        userId: socket.id,
        username: user.username,
        message: data.message,
        timestamp: new Date(),
        type: 'chat'
      };
      
      io.to('default').emit('newMessage', messageData);
    }
  });

  // Handle raise hand
  socket.on('raiseHand', async (data) => {
    console.log('🤚 Raise hand event received from:', socket.id);
    const user = connectedUsers.get(socket.id);
    if (user) {
      user.isHandRaised = !user.isHandRaised;
      console.log('🤚 User hand raised:', user.isHandRaised);
      
      const handRaiseData = {
        userId: socket.id,
        username: user.username,
        isHandRaised: user.isHandRaised,
        timestamp: new Date(),
        screenshot: data.screenshot // Base64 screenshot data
      };
      
      console.log('📤 Broadcasting hand raised event');
      io.to('default').emit('handRaised', handRaiseData);
      
      // If hand is raised and screenshot is provided, send to AI
      if (user.isHandRaised && data.screenshot && openai) {
        console.log('🤖 AI analysis requested for user:', user.username);
        try {
          const aiResponse = await openai.chat.completions.create({
            model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
            messages: [
              {
                role: "system",
                content: "You are a helpful AI assistant analyzing a video frame. A user has raised their hand and wants to know about what's happening in this video frame. Provide a brief, helpful explanation."
              },
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: "Please analyze this video frame and provide a brief explanation of what's happening:"
                  },
                  {
                    type: "image_url",
                    image_url: {
                      url: data.screenshot
                    }
                  }
                ]
              }
            ],
            max_tokens: 200,
            temperature: 0.7
          });

          const aiMessage = {
            id: uuidv4(),
            userId: 'ai-assistant',
            username: 'AI Assistant',
            message: aiResponse.choices[0].message.content,
            timestamp: new Date(),
            type: 'ai-response',
            relatedTo: socket.id
          };
          
          console.log('🤖 AI response generated:', aiResponse.choices[0].message.content.substring(0, 50) + '...');
          io.to('default').emit('newMessage', aiMessage);
        } catch (error) {
          console.error('AI analysis error:', error);
        }
      } else if (user.isHandRaised && !openai) {
        // Send a message indicating AI is not configured
        const aiMessage = {
          id: uuidv4(),
          userId: 'ai-assistant',
          username: 'AI Assistant',
          message: 'AI service is not configured. Please set up Azure OpenAI credentials to enable AI features.',
          timestamp: new Date(),
          type: 'ai-response',
          relatedTo: socket.id
        };
        
        io.to('default').emit('newMessage', aiMessage);
      }
    }
  });

  // Handle video control events
  socket.on('videoControl', (data) => {
    io.to('default').emit('videoControl', {
      ...data,
      userId: socket.id,
      timestamp: new Date()
    });
  });

  // Handle user disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    connectedUsers.delete(socket.id);
    io.to('default').emit('userList', Array.from(connectedUsers.values()));
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to access the application`);
});
