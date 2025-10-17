const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const timetableController = require('../controllers/timetableController');

// Upload timetable
router.post('/upload', upload.single('timetable'), timetableController.uploadTimetable);

// Get all timetables for a student
router.get('/student/:studentId', timetableController.getStudentTimetables);

// Get specific timetable
router.get('/:id', timetableController.getTimetableById);

// Delete timetable
router.delete('/:id', timetableController.deleteTimetable);

module.exports = router;
