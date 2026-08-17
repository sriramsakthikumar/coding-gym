require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');
const seedQuestions = require('./db/seedQuestions');

const problemsRouter = require('./routes/problems');
const executeRouter = require('./routes/execute');
const submissionsRouter = require('./routes/submissions');
const revisionRouter = require('./routes/revision');
const progressRouter = require('./routes/progress');
const pathsRouter = require('./routes/paths');
const roadmapsRouter = require('./routes/roadmaps');
const plannerRouter = require('./routes/planner');
const aiRouter = require('./routes/ai');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'CodeGym Backend is running offline with Gemini AI Support',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/problems', problemsRouter);
app.use('/api/execute', executeRouter);
app.use('/api/submissions', submissionsRouter);
app.use('/api/revision', revisionRouter);
app.use('/api/progress', progressRouter);
app.use('/api/paths', pathsRouter);
app.use('/api/roadmaps', roadmapsRouter);
app.use('/api/planner', plannerRouter);
app.use('/api/ai', aiRouter);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ success: false, error: err.message || 'Internal Server Error' });
});

// Auto seed if problems table is empty
try {
  const count = db.prepare('SELECT COUNT(*) as c FROM problems').get().c;
  if (count === 0) {
    console.log('Database empty, auto-seeding 300 questions...');
    seedQuestions();
  }
} catch (e) {
  console.error('Failed to verify problem count:', e);
}

app.listen(PORT, () => {
  console.log(`🚀 CodeGym Backend running at http://localhost:${PORT}`);
});
