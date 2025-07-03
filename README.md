# 🎬 Short Clip Generator

A modern web application for generating short video clips from uploaded videos with customizable durations, aspect ratios, and captions.

![Short Clip Generator](https://via.placeholder.com/800x400/3B82F6/FFFFFF?text=Short+Clip+Generator)

## ✨ Features

### 📤 **Video Upload**
- Drag & drop interface for easy file uploads
- Support for multiple video formats (MP4, MOV, AVI, MKV, WebM)
- Configurable file size limit (default: 500MB)
- Real-time upload progress tracking

### ⚙️ **Customizable Clip Generation**
- **Duration Options**: 15s, 30s, 1m, 2m, 3m, or custom
- **Aspect Ratios**: 
  - 16:9 (Landscape) - Perfect for YouTube, Desktop
  - 9:16 (Portrait) - Ideal for TikTok, Instagram Stories
  - 1:1 (Square) - Great for Instagram Posts
- **Multiple Clips**: Generate 1-8 clips from a single video
- **Automatic Subtitles**: Optional caption generation with Whisper

### 🎯 **Clip Management Dashboard**
- Live video previews with hover effects
- One-click download functionality
- Individual clip editing options
- Delete unwanted clips
- Batch operations for multiple clips
- Share links generation

### 🎨 **Modern UI/UX**
- Beautiful gradient backgrounds
- Responsive design for all devices
- Smooth animations and transitions
- Glass morphism effects
- Professional color scheme
- Intuitive user interface

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- FFmpeg installed on your system
- npm or yarn package manager

### Installation

1. **Clone and setup the project:**
```bash
# Install all dependencies (root, server, and client)
npm run install-all
```

2. **Install FFmpeg** (if not already installed):

**macOS:**
```bash
brew install ffmpeg
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install ffmpeg
```

**Windows:**
Download from [https://ffmpeg.org/download.html](https://ffmpeg.org/download.html)

3. **Start the development servers:**
```bash
# Start both backend and frontend concurrently
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

## 📁 Project Structure

```
short-clip-generator/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   ├── Header.tsx
│   │   │   ├── UploadSection.tsx
│   │   │   ├── OptionsPanel.tsx
│   │   │   ├── ClipsManager.tsx
│   │   │   └── LoadingOverlay.tsx
│   │   ├── App.tsx         # Main application component
│   │   ├── main.tsx        # Application entry point
│   │   └── index.css       # Global styles with Tailwind
│   ├── package.json
│   └── vite.config.ts
├── server/                 # Node.js backend
│   ├── index.js           # Express server with FFmpeg processing
│   ├── uploads/           # Uploaded video files
│   ├── clips/             # Generated clip files
│   ├── package.json
│   └── .env               # Environment configuration
├── package.json           # Root package.json for scripts
└── README.md
```

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for modern styling
- **Lucide React** for beautiful icons
- **React Dropzone** for file upload handling
- **Axios** for API communication

### Backend
- **Node.js** with Express
- **Multer** for file upload handling
- **Fluent-FFmpeg** for video processing
- **CORS** for cross-origin requests
- **UUID** for unique identifiers

## 📋 Available Scripts

### Root Level
- `npm run dev` - Start both frontend and backend
- `npm run install-all` - Install all dependencies
- `npm run build` - Build the frontend for production
- `npm start` - Start the production server

### Frontend (client/)
- `npm run dev` - Start development server (port 3000)
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Backend (server/)
- `npm run dev` - Start development server with nodemon (port 5000)
- `npm start` - Start production server

## 🔧 Configuration

### Environment Variables (server/.env)
```env
PORT=5000
NODE_ENV=development
UPLOAD_LIMIT=500MB
CLIPS_DIR=./clips
UPLOADS_DIR=./uploads
```

## 🚦 Usage Guide

1. **Upload Video**: Drag and drop or click to select a video file
2. **Configure Options**: 
   - Choose clip duration (15s, 30s, 1m, 2m, 3m)
   - Select aspect ratio (16:9, 9:16, 1:1)
   - Set number of clips (1-8)
   - Enable/disable subtitles
3. **Generate Clips**: Click "Generate Clips" button
4. **Manage Results**: 
   - Preview clips with hover effects
   - Download individual clips
   - Edit clip settings
   - Delete unwanted clips
   - Share or batch download

---

**Made with ❤️ for content creators and video enthusiasts**

*Transform your long videos into engaging short clips with just a few clicks!*