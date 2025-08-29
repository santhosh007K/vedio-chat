# Video Chat App

A YouTube-like web application with video upload functionality, real-time chat, and AI-powered video analysis using Azure OpenAI.

## Features

### 🎥 Video Player
- YouTube-like video player interface
- Support for multiple video formats (MP4, WebM, AVI, MOV, MKV)
- Drag & drop video upload
- Video library management
- Synchronized video playback across users

### 💬 Real-time Chat
- Live chat with all connected users
- User presence indicators
- Message history
- Real-time notifications

### 🤖 AI Integration
- Azure OpenAI integration for video analysis
- "Raise Hand" feature with automatic screenshot capture
- AI-powered video content analysis
- Curated answers based on video frames

### 🎯 Interactive Features
- Raise hand functionality with visual indicators
- Screenshot capture of current video frame
- AI chat modal for detailed video analysis
- Keyboard shortcuts for video controls

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Azure OpenAI service account

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd video-chat-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit the `.env` file with your Azure OpenAI credentials:
   ```env
   # Server Configuration
   PORT=3001
   NODE_ENV=development

   # Azure OpenAI Configuration
   AZURE_OPENAI_API_KEY=your_azure_openai_api_key_here
   AZURE_OPENAI_ENDPOINT=https://your-resource-name.openai.azure.com/
   AZURE_OPENAI_DEPLOYMENT_NAME=your-deployment-name

   # File Upload Configuration
   MAX_FILE_SIZE=100000000
   UPLOAD_PATH=./uploads
   ALLOWED_VIDEO_TYPES=mp4,webm,avi,mov,mkv
   ```

4. **Create uploads directory**
   ```bash
   mkdir uploads
   ```

## Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The application will be available at `http://localhost:3001`

## Azure OpenAI Setup

1. **Create an Azure OpenAI resource**
   - Go to Azure Portal
   - Create a new Azure OpenAI resource
   - Note down the endpoint URL and API key

2. **Deploy a model**
   - In your Azure OpenAI resource, go to "Model deployments"
   - Deploy a model (e.g., GPT-4, GPT-3.5-turbo)
   - Note down the deployment name

3. **Update environment variables**
   - Set `AZURE_OPENAI_API_KEY` to your API key
   - Set `AZURE_OPENAI_ENDPOINT` to your endpoint URL
   - Set `AZURE_OPENAI_DEPLOYMENT_NAME` to your deployment name

## Usage

### Uploading Videos
1. Click on the upload area or drag & drop video files
2. Select a video file (supported formats: MP4, WebM, AVI, MOV, MKV)
3. Click "Upload Video"
4. The video will appear in the video library

### Watching Videos
1. Select a video from the video library
2. The video will start playing in the main player
3. All connected users will see the same video

### Using Chat
1. Type your message in the chat input
2. Press Enter or click the send button
3. Messages appear in real-time for all users

### Raise Hand Feature
1. Click the "Raise Hand" button
2. A screenshot of the current video frame is captured
3. The AI analyzes the frame and provides insights
4. Other users can see who has raised their hand

### AI Chat
1. Click the "AI Chat" button
2. A modal opens with the current video frame
3. Ask questions about the video content
4. Get AI-powered responses based on the video frame

## Keyboard Shortcuts

- **Space**: Play/Pause video
- **Arrow Left/Right**: Seek backward/forward 10 seconds
- **Arrow Up/Down**: Increase/decrease volume
- **Escape**: Close AI chat modal
- **Ctrl+Enter**: Send chat message

## API Endpoints

### Video Management
- `POST /upload` - Upload a video file
- `GET /videos` - Get all uploaded videos
- `POST /videos/current` - Set current video

### AI Chat
- `POST /ai-chat` - Send message to AI with optional screenshot

### WebSocket Events
- `joinRoom` - Join video chat room
- `chatMessage` - Send chat message
- `raiseHand` - Raise/lower hand with screenshot
- `videoControl` - Control video playback
- `videoChanged` - Video selection changed

## File Structure

```
video-chat-app/
├── public/
│   ├── index.html      # Main HTML file
│   ├── styles.css      # CSS styles
│   └── app.js          # Frontend JavaScript
├── uploads/            # Video upload directory
├── server.js           # Express server
├── package.json        # Dependencies
├── env.example         # Environment variables template
└── README.md           # This file
```

## Technologies Used

- **Backend**: Node.js, Express.js, Socket.IO
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **AI**: Azure OpenAI API
- **File Upload**: Multer
- **Real-time Communication**: Socket.IO

## Configuration Options

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3001 |
| `NODE_ENV` | Environment mode | development |
| `AZURE_OPENAI_API_KEY` | Azure OpenAI API key | - |
| `AZURE_OPENAI_ENDPOINT` | Azure OpenAI endpoint | - |
| `AZURE_OPENAI_DEPLOYMENT_NAME` | Model deployment name | - |
| `MAX_FILE_SIZE` | Maximum file upload size | 100MB |
| `UPLOAD_PATH` | Upload directory path | ./uploads |
| `ALLOWED_VIDEO_TYPES` | Allowed video formats | mp4,webm,avi,mov,mkv |

## Troubleshooting

### Common Issues

1. **Video upload fails**
   - Check file size (max 100MB by default)
   - Ensure file format is supported
   - Verify uploads directory exists and is writable

2. **AI chat not working**
   - Verify Azure OpenAI credentials in .env file
   - Check if the model deployment is active
   - Ensure API key has proper permissions

3. **Socket connection issues**
   - Check if server is running
   - Verify firewall settings
   - Check browser console for errors

4. **Video playback issues**
   - Ensure video format is supported by browser
   - Check if video file is corrupted
   - Try different video formats

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the API documentation

## Future Enhancements

- User authentication and profiles
- Video playlists and categories
- Advanced video controls
- Screen sharing capabilities
- Mobile app version
- Database integration for persistent storage
- Video transcoding for better compatibility
- Analytics and usage statistics
