import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import projectRoutes from './routes/project.routes';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);

app.get('/', (req, res) => {
  res.send('API is working 🚀');
});


export default app;
