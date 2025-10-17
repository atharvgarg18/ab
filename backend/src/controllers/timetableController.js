const Timetable = require('../models/Timetable');
const { extractTimetable } = require('../services/geminiService');

/**
 * Upload and process timetable
 */
exports.uploadTimetable = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { studentId } = req.body;
    
    if (!studentId) {
      return res.status(400).json({ error: 'Student ID is required' });
    }

    console.log(`Processing file: ${req.file.originalname}`);
    
    // Extract timetable using Gemini with file buffer (works on Vercel)
    const extractionResult = await extractTimetable(req.file.buffer, req.file.mimetype);
    
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
  }
};

/**
 * Get all timetables for a student
 */
exports.getStudentTimetables = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    if (!studentId) {
      return res.status(400).json({ error: 'Student ID is required' });
    }
    
    console.log(`[Timetable] Fetching timetables for student: ${studentId}`);
    
    const timetables = await Timetable.find({ studentId })
      .sort({ createdAt: -1 });
    
    console.log(`[Timetable] Found ${timetables.length} timetables`);
    
    res.json({ 
      success: true,
      timetables,
      count: timetables.length
    });
  } catch (error) {
    console.error('[Timetable] Fetch error:', error.message, error.stack);
    res.status(500).json({ 
      error: 'Failed to fetch timetables',
      details: error.message,
      studentId: req.params.studentId
    });
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
