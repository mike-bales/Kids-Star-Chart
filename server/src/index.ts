import express from 'express';
import cors from 'cors';
import path from 'path';

import authRoutes from './routes/auth';
import childrenRoutes from './routes/children';
import tasksRoutes from './routes/tasks';
import starsRoutes from './routes/stars';
import payoutsRoutes from './routes/payouts';
import settingsRoutes from './routes/settings';
import homeworkRoutes from './routes/homework';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/children', childrenRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/children', starsRoutes);
app.use('/api/children', payoutsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/children', homeworkRoutes);

// In production, serve the built client
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Star Chart server running on port ${PORT}`);
});
