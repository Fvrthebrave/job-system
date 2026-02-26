import express from 'express';
import { testConnection, initDB, pool } from './db';
import { v4 as uuidv4 } from 'uuid';
import { CreateJobRequestSchema, JobResponseSchema, JobParamsSchema } from '@job-system/contracts';
import { redis } from './redis';

const app = express();
app.use(express.json());

app.get('/health', (_req, res)=> {
  res.json({ status: 'ok' });
});

app.post('/jobs', async (req, res) => {
  const parsed = CreateJobRequestSchema.safeParse(req.body);
  if(!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors});
  }

  const body = parsed.data;

  const jobId = uuidv4();

  await pool.query(`
      INSERT INTO jobs (id, type, payload, status)
      VALUES ($1, $2, $3, $4)
    `, [jobId, body.type, body.payload, 'queued']);

    await redis.lpush('job_queue', jobId);
    return res.status(201).json({ jobId });
});

app.get('/jobs/:id', async (req, res) => {
  const paramsParsed = JobParamsSchema.safeParse(req.params);
  if(!paramsParsed.success) {
    return res.status(400).json({ error: paramsParsed.error.errors});
  }

  const jobId = paramsParsed.data.id;

  const result = await pool.query(`
    SELECT id, type, payload, status, created_at, updated_at
    FROM jobs    
    WHERE id = $1
  `, [jobId]);

  if(result.rows.length === 0) {
    return res.status(404).json({ error: 'Job not found' });
  }
  
  const job = result.rows[0];

  const serializedJob = toJobResponse(job);

  const responseParsed = JobResponseSchema.safeParse(serializedJob);
  if(!responseParsed.success) {
    return res.status(500).json({ error: 'Invalid job data' });
  }
  
  return res.json(responseParsed.data);
});

const PORT = 3000;

app.listen(PORT, async () => {
  console.log('API is listening on PORT ', PORT);
  await testConnection();
  await initDB();
  console.log('DB initialized');
});

// Serialize Date objects to ISO strings for API response
function toJobResponse(job: any) {
  return {
    ...job,
    created_at: job.created_at.toISOString(),
    updated_at: job.updated_at.toISOString(),
  }
}