const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const ffmpeg = require('fluent-ffmpeg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 9999;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use('/clips', express.static('clips'));

// Ensure directories exist
fs.ensureDirSync('./uploads');
fs.ensureDirSync('./clips');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB limit
  },
  fileFilter: (req, file, cb) => {
    console.log('File upload attempt:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });
    
    const allowedExtensions = /\.(mp4|mov|avi|mkv|webm)$/i;
    const allowedMimeTypes = /^video\/|^application\/octet-stream$/; // Plus permissif pour les types MIME
    
    const extname = allowedExtensions.test(file.originalname);
    const mimetype = allowedMimeTypes.test(file.mimetype);
    
    // Accepter si l'extension est correcte ET (type MIME vidéo OU octet-stream)
    if (extname && mimetype) {
      console.log('File accepted:', file.originalname);
      return cb(null, true);
    } else {
      console.log('File rejected:', {
        extension: extname,
        mimetype: mimetype,
        actualMimetype: file.mimetype,
        filename: file.originalname
      });
      cb(new Error('Only video files are allowed! Please upload .mp4, .mov, .avi, .mkv, or .webm files.'));
    }
  }
});

// Store for tracking jobs and clips
let jobs = new Map();
let clips = new Map();

// Helper function to get video duration
const getVideoDuration = (videoPath) => {
  return new Promise((resolve, reject) => {
    try {
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) {
          console.error('FFprobe error:', err);
          // Return a default duration if ffprobe fails
          resolve(60); // Default to 60 seconds
        } else {
          resolve(metadata.format.duration);
        }
      });
    } catch (error) {
      console.error('FFmpeg not available:', error);
      // Return a default duration if ffmpeg is not available
      resolve(60); // Default to 60 seconds
    }
  });
};

// Helper function to generate clips
const generateClip = (inputPath, outputPath, startTime, duration, aspectRatio) => {
  return new Promise((resolve, reject) => {
    let command = ffmpeg(inputPath)
      .seekInput(startTime)
      .duration(duration)
      .output(outputPath);

    // Apply aspect ratio filters
    if (aspectRatio === '9:16') {
      command = command.videoFilters([
        'scale=1080:1920:force_original_aspect_ratio=increase',
        'crop=1080:1920'
      ]);
    } else if (aspectRatio === '1:1') {
      command = command.videoFilters([
        'scale=1080:1080:force_original_aspect_ratio=increase',
        'crop=1080:1080'
      ]);
    } else if (aspectRatio === '16:9') {
      command = command.videoFilters([
        'scale=1920:1080:force_original_aspect_ratio=increase',
        'crop=1920:1080'
      ]);
    }

    command
      .on('end', () => resolve(outputPath))
      .on('error', (err) => reject(err))
      .run();
  });
};

// Routes

// Upload video
app.post('/api/upload', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file uploaded' });
    }

    const jobId = uuidv4();
    const videoPath = req.file.path;
    
    // Get video duration (with fallback)
    let duration;
    try {
      duration = await getVideoDuration(videoPath);
      console.log(`Video duration detected: ${duration} seconds`);
    } catch (error) {
      console.log('Could not detect video duration, using default:', error.message);
      duration = 60; // Default fallback
    }
    
    jobs.set(jobId, {
      id: jobId,
      filename: req.file.originalname,
      path: videoPath,
      duration: duration,
      status: 'uploaded',
      createdAt: new Date()
    });

    res.json({
      jobId: jobId,
      filename: req.file.originalname,
      duration: duration,
      message: 'Video uploaded successfully'
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload video' });
  }
});

// Generate clips
app.post('/api/generate-clips', async (req, res) => {
  try {
    const { jobId, options } = req.body;
    const {
      clipDurations = [30],
      aspectRatio = '16:9',
      numberOfClips = 1,
      enableSubtitles = false
    } = options;

    const job = jobs.get(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    job.status = 'processing';
    jobs.set(jobId, job);

    const generatedClips = [];
    const videoDuration = job.duration;

    for (let i = 0; i < numberOfClips; i++) {
      const clipDuration = Array.isArray(clipDurations) ? clipDurations[0] : clipDurations;
      const maxStartTime = Math.max(0, videoDuration - clipDuration);
      const startTime = Math.random() * maxStartTime;
      
      const clipId = uuidv4();
      const clipFilename = `clip-${clipId}-${i + 1}.mp4`;
      const clipPath = path.join('./clips', clipFilename);

      try {
        await generateClip(job.path, clipPath, startTime, clipDuration, aspectRatio);
        
        const clipData = {
          id: clipId,
          jobId: jobId,
          filename: clipFilename,
          path: clipPath,
          duration: clipDuration,
          startTime: startTime,
          aspectRatio: aspectRatio,
          hasSubtitles: enableSubtitles,
          createdAt: new Date(),
          downloadUrl: `/clips/${clipFilename}`
        };
        
        clips.set(clipId, clipData);
        generatedClips.push(clipData);
      } catch (error) {
        console.error(`Error generating clip ${i + 1}:`, error);
      }
    }

    job.status = 'completed';
    job.clips = generatedClips.map(clip => clip.id);
    jobs.set(jobId, job);

    res.json({
      message: 'Clips generated successfully',
      clips: generatedClips
    });
  } catch (error) {
    console.error('Clip generation error:', error);
    res.status(500).json({ error: 'Failed to generate clips' });
  }
});

// Get job status
app.get('/api/job/:jobId', (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  res.json(job);
});

// Get all clips for a job
app.get('/api/job/:jobId/clips', (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  const jobClips = Array.from(clips.values()).filter(clip => clip.jobId === req.params.jobId);
  res.json(jobClips);
});

// Delete clip
app.delete('/api/clip/:clipId', async (req, res) => {
  try {
    const clip = clips.get(req.params.clipId);
    if (!clip) {
      return res.status(404).json({ error: 'Clip not found' });
    }

    // Delete file
    await fs.remove(clip.path);
    clips.delete(req.params.clipId);

    res.json({ message: 'Clip deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete clip' });
  }
});

// Get all jobs
app.get('/api/jobs', (req, res) => {
  const allJobs = Array.from(jobs.values()).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(allJobs);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Short Clip Generator API is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 Short Clip Generator server running on port ${PORT}`);
  console.log(`📁 Uploads directory: ${path.resolve('./uploads')}`);
  console.log(`🎬 Clips directory: ${path.resolve('./clips')}`);
});
