import express from 'express';
import { testConnection, initDB, pool } from './db';
import { v4 as uuidv4 } from 'uuid';
import { CreateJobRequest } from './types';
import { redis } from './redis';

const app = express();
app.use(express.json());

app.get('/health', (_req, res)=> {
  res.json({ status: 'ok' });
});

app.post('/jobs', async (req, res) => {
  const body: CreateJobRequest = req.body;

  if(!body.type || !body.payload) {
    return res.status(400).json({ error: 'type and payload are required' });
  }

  const jobId = uuidv4();

  await pool.query(`
      INSERT INTO jobs (id, type, payload, status)
      VALUES ($1, $2, $3, $4)
    `,[jobId, body.type, body.payload, 'queued']);

    await redis.lpush('job_queue', jobId);
    return res.status(201).json({ jobId });
});

const PORT = 3000;

app.listen(PORT, async () => {
  console.log('API is listening on PORT ', PORT);
  await testConnection();
  await initDB();
  console.log('DB initialized');
});