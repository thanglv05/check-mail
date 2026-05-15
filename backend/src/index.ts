import express from 'express';
import corsMiddleware from 'cors';
import checkEmailRoutes from './routes/checkEmail.routes';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(corsMiddleware());
app.use(express.json());

// Routes
app.use('/api/v1/check-email', checkEmailRoutes);

// Serve static frontend in production
import path from 'path';
const frontendPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Error Handling Middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: err.message || 'Internal Server Error'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
