import { redis } from './redis';
import { pool } from './db'

console.log("Worker started...");

async function processJobs() {
  while(true) {
    const jobId = await redis.brpop('job_queue', 0);

    if(!jobId) continue;

    const id = jobId[1];
    console.log(`Processing job: ${id}`);

    await pool.query(`
        UPDATE jobs
        SET status = 'processing' ,
            updated_at = NOW()
        WHERE id = $1
      `, [id]);

      await new Promise(res => setTimeout(res, 2000));

      await pool.query(`
          UPDATE jobs
          SET status = 'succeeded',
              processed_at = NOW(),
              updated_at = NOW()
          WHERE id = $1
        `, [id]);

        console.log(`Job completed: ${id}`);
  }
}

processJobs();