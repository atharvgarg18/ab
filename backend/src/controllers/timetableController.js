const Timetable = require('../models/Timetable');
const { extractTimetable } = require('../services/geminiService');
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Upload and process timetable
 */
exports.uploadTimetable = async (req, res) => {
  let tempFilePath = null;
  
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { studentId } = req.body;
    
    if (!studentId) {
      return res.status(400).json({ error: 'Student ID is required' });
    }

    // Determine mime type
    const mimeType = req.file.mimetype;
    
    console.log(`Processing file: ${req.file.originalname}`);
    
    // For serverless/memory storage, write buffer to temp file
    let filePathToProcess;
    if (req.file.path) {
      // Disk storage (local development)
      filePathToProcess = req.file.path;
    } else if (req.file.buffer) {
      // Memory storage (Vercel serverless)
      tempFilePath = path.join(os.tmpdir(), `${Date.now()}-${req.file.originalname}`);
      fs.writeFileSync(tempFilePath, req.file.buffer);
      filePathToProcess = tempFilePath;
    } else {
      return res.status(400).json({ error: 'File processing error' });
    }
    
    // Extract timetable using Gemini
    const extractionResult = await extractTimetable(filePathToProcess, mimeType);
    
    if (!extractionResult.success) {
      return res.status(500).json({ 
        error: 'Failed to extract timetable',
        details: extractionResult.error 
      });
    }

    console.log('📊 Extracted data:', JSON.stringify(extractionResult.data, null, 2));

    // Create timetable document with flexible structure
    const timetable = new Timetable({
      studentId,
      metadata: extractionResult.data.metadata || {},
      structuredData: extractionResult.data.schedule || extractionResult.data,
      originalFileUrl: req.file.originalname,
      rawExtractedText: extractionResult.rawText
    });

    // Save to database
    await timetable.save();

    res.status(201).json({
      message: 'Timetable uploaded and processed successfully',
      timetableId: timetable._id,
      data: timetable
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  } finally {
    // Clean up temp file if created
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (e) {
        console.warn('Failed to delete temp file:', e.message);
      }
    }
  }
};

/**
 * Get all timetables for a student
 */
exports.getStudentTimetables = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const timetables = await Timetable.find({ studentId })
      .sort({ createdAt: -1 });
    
    res.json({ timetables });
  } catch (error) {
    console.error('Fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch timetables' });
  }
};

/**
 * Get specific timetable by ID
 */
exports.getTimetableById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const timetable = await Timetable.findById(id);
    
    if (!timetable) {
      return res.status(404).json({ error: 'Timetable not found' });
    }
    
    res.json({ timetable });
  } catch (error) {
    console.error('Fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch timetable' });
  }
};

/**
 * Delete timetable
 */
exports.deleteTimetable = async (req, res) => {
  try {
    const { id } = req.params;
    
    const timetable = await Timetable.findByIdAndDelete(id);
    
    if (!timetable) {
      return res.status(404).json({ error: 'Timetable not found' });
    }
    
    res.json({ message: 'Timetable deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete timetable' });
  }
};
