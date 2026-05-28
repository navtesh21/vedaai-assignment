import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Assignment } from '../models/Assignment';
import { getGenerationQueue } from '../config/queue';
import { cacheGet, paperCacheKey } from '../services/cache';

const router = Router();

// Multer setup for file uploads
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['.pdf', '.txt', '.png', '.jpg', '.jpeg'];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  },
});

// POST /api/assignments — Create assignment and queue job
router.post('/', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      title,
      subject,
      className,
      school,
      dueDate,
      questionConfigs,
      difficulty,
      instructions,
      timeDuration,
    } = req.body;

    // Validation
    if (!title || !subject || !className || !dueDate) {
      res.status(400).json({ error: 'title, subject, class, and dueDate are required' });
      return;
    }

    let parsedConfigs: any[] = [];
    try {
      if (typeof questionConfigs === 'string') {
        parsedConfigs = JSON.parse(questionConfigs);
      } else {
        parsedConfigs = questionConfigs;
      }
    } catch (e) {
      res.status(400).json({ error: 'Invalid questionConfigs format' });
      return;
    }

    if (!Array.isArray(parsedConfigs) || parsedConfigs.length === 0) {
      res.status(400).json({ error: 'At least one question configuration is required' });
      return;
    }

    // Extract text from PDF if uploaded
    let extractedText: string | undefined;
    let fileUrl: string | undefined;

    if (req.file) {
      fileUrl = `/uploads/${req.file.filename}`;
      if (req.file.mimetype === 'application/pdf') {
        try {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const pdfParseModule = await eval("import('pdf-parse')");
          const pdfParse = pdfParseModule.default || pdfParseModule;
          const buffer = fs.readFileSync(req.file.path);
          const pdfData = await pdfParse(buffer);
          extractedText = pdfData.text.substring(0, 5000);
        } catch (pdfErr) {
          console.warn('PDF parsing failed:', pdfErr);
        }
      }
    }

    // Create assignment in DB
    const assignment = await Assignment.create({
      title,
      subject,
      class: className,
      school: school || 'VedaAI School',
      dueDate: new Date(dueDate),
      questionConfigs: parsedConfigs,
      difficulty: difficulty || 'medium',
      instructions: instructions || '',
      timeDuration: timeDuration || '',
      fileUrl,
      extractedText,
      status: 'pending',
    });

    // Enqueue generation job
    const queue = getGenerationQueue();
    const job = await queue.add('generate', { assignmentId: assignment._id.toString() });

    // Update with job ID
    await Assignment.findByIdAndUpdate(assignment._id, { jobId: String(job.id ?? '') });

    res.status(201).json({
      success: true,
      assignmentId: assignment._id,
      jobId: job.id,
      status: 'pending',
    });
  } catch (err) {
    console.error('Create assignment error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/assignments/:id — Get assignment with result
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Try Redis cache first
    const cached = await cacheGet(paperCacheKey(id));
    if (cached) {
      const assignment = await Assignment.findById(id).select('-result -extractedText');
      res.json({
        success: true,
        assignment,
        result: JSON.parse(cached as string),
        fromCache: true,
      });
      return;
    }

    const assignment = await Assignment.findById(id);
    if (!assignment) {
      res.status(404).json({ error: 'Assignment not found' });
      return;
    }

    res.json({
      success: true,
      assignment: {
        _id: assignment._id,
        title: assignment.title,
        subject: assignment.subject,
        class: assignment.class,
        school: assignment.school,
        dueDate: assignment.dueDate,
        status: assignment.status,
        createdAt: assignment.createdAt,
      },
      result: assignment.result || null,
    });
  } catch (err) {
    console.error('Get assignment error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/assignments — List all assignments
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const assignments = await Assignment.find()
      .select('-result -extractedText')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ success: true, assignments });
  } catch (err) {
    console.error('List assignments error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/assignments/:id — Delete assignment
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    await Assignment.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
