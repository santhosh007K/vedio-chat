# Video Chat App with Enhanced AI Integration

A real-time video chat application with advanced AI-powered features for video analysis and conversational assistance.

## 🚀 Features

### Core Features
- **Real-time Video Streaming**: Upload and stream videos with synchronized playback
- **Live Chat**: Real-time messaging between users
- **User Management**: See who's online and their status
- **Video Library**: Organize and manage uploaded videos

### Enhanced AI Features
- **Smart Raise Hand Function**: 
  - Capture video frames when raising hand
  - AI-powered analysis of current video content
  - Conversational context awareness
  - Maintains conversation history for better responses

- **Conversational AI Chat**:
  - Context-aware responses using conversation history
  - Sends last 2 messages to Azure OpenAI for better context
  - Multimodal analysis with video screenshots
  - Conversation history management
  - Clear conversation history functionality

- **Image Analysis**:
  - Automatic screenshot capture during raise hand
  - AI analysis of video frames
  - Visual content understanding
  - Contextual responses based on video content

## 🛠️ Technology Stack

- **Backend**: Node.js, Express.js, Socket.IO
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **AI Integration**: Azure OpenAI (GPT-4 Vision)
- **File Handling**: Multer, fs-extra
- **Real-time Communication**: Socket.IO

## 📋 Prerequisites

- Node.js (v14 or higher)
- Azure OpenAI account with API access
- Environment variables configured

## 🔧 Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd video-chat-app
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Create a `.env` file in the root directory:
   ```env
   AZURE_OPENAI_API_KEY=your_azure_openai_api_key
   AZURE_OPENAI_ENDPOINT=your_azure_openai_endpoint
   AZURE_OPENAI_DEPLOYMENT_NAME=your_deployment_name
   AZURE_OPENAI_API_VERSION=2024-08-01-preview
   PORT=3000
   UPLOAD_PATH=./uploads
   MAX_FILE_SIZE=100000000
   ALLOWED_VIDEO_TYPES=mp4,webm,avi,mov,mkv
   ```

4. **Run the application**:
   ```bash
   npm start
   ```

5. **Access the application**:
   Open your browser and navigate to `http://localhost:3000`

## 🎯 How to Use

### Basic Usage
1. **Upload Videos**: Drag and drop video files or click to browse
2. **Watch Videos**: Select videos from the library to start watching
3. **Chat**: Use the live chat to communicate with other users
4. **Raise Hand**: Click the "Raise Hand" button to get AI assistance

### AI Features

#### Raise Hand Function
- Click the "Raise Hand" button while watching a video
- The system automatically captures the current video frame
- AI analyzes the frame and provides contextual information
- Responses consider previous conversation history

#### AI Chat
- Click the "AI Chat" button to open the AI assistant modal
- Ask questions about the current video content
- AI maintains conversation context for better responses
- Use the trash icon to clear conversation history

#### Conversation History
- AI remembers the last 10 messages in your conversation
- Sends the last 2 messages to Azure OpenAI for context
- Conversation indicator shows message count
- Clear history anytime with the trash button

## 🔍 AI Integration Details

### Azure OpenAI Configuration
- Uses GPT-4 Vision for multimodal analysis
- Maintains conversation context across interactions
- Optimized prompts for video content analysis
- Error handling for API failures

### Conversation Management
- Server-side conversation history storage
- Automatic cleanup on user disconnect
- Context window management (last 10 messages)
- Real-time conversation updates

### Image Analysis
- Automatic video frame capture
- Base64 encoding for API transmission
- Quality optimization for analysis
- Fallback handling for capture failures

## 🎨 UI/UX Features

- **Modern Design**: Clean, responsive interface
- **Real-time Updates**: Live status indicators
- **Visual Feedback**: Animations and transitions
- **Accessibility**: Keyboard shortcuts and screen reader support
- **Mobile Responsive**: Works on various screen sizes

## 🔧 Configuration Options

### Environment Variables
- `AZURE_OPENAI_API_KEY`: Your Azure OpenAI API key
- `AZURE_OPENAI_ENDPOINT`: Azure OpenAI endpoint URL
- `AZURE_OPENAI_DEPLOYMENT_NAME`: Model deployment name
- `AZURE_OPENAI_API_VERSION`: API version (default: 2024-08-01-preview)
- `PORT`: Server port (default: 3000)
- `UPLOAD_PATH`: Video upload directory (default: ./uploads)
- `MAX_FILE_SIZE`: Maximum file size in bytes (default: 100MB)
- `ALLOWED_VIDEO_TYPES`: Comma-separated list of allowed video formats

### File Upload Settings
- Maximum file size: 100MB
- Supported formats: MP4, WebM, AVI, MOV, MKV
- Automatic file naming with UUID
- Progress tracking and error handling

## 🚀 Deployment

### Local Development
```bash
npm run dev  # Uses nodemon for auto-restart
```

### Production
```bash
npm start
```

### Docker (Optional)
```bash
docker build -t video-chat-app .
docker run -p 3000:3000 video-chat-app
```

## 🔒 Security Considerations

- File type validation
- File size limits
- CORS configuration
- Environment variable protection
- Input sanitization
- Error handling

## 🐛 Troubleshooting

### Common Issues

1. **AI not responding**:
   - Check Azure OpenAI credentials in `.env`
   - Verify API endpoint and deployment name
   - Check network connectivity

2. **Video upload fails**:
   - Verify file size is under 100MB
   - Check file format is supported
   - Ensure uploads directory has write permissions

3. **Socket connection issues**:
   - Check if server is running
   - Verify port configuration
   - Check firewall settings

### Debug Mode
Enable debug logging by setting `NODE_ENV=development` in your environment.

## 📝 API Endpoints

- `GET /`: Main application page
- `POST /upload`: Upload video files
- `GET /videos`: Get list of uploaded videos
- `POST /videos/current`: Set current video
- `POST /ai-chat`: AI chat endpoint (with conversation history)
- WebSocket events for real-time communication

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Azure OpenAI for AI capabilities
- Socket.IO for real-time communication
- Font Awesome for icons
- Express.js community for the framework

---

**Note**: This application requires Azure OpenAI API access. Please ensure you have proper credentials and API access before running the application.
