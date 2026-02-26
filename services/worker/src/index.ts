import { redis } from './redis';
import { pool } from './db';

console.log("Worker started...");

// Worker continuously polls Redis for new jobs to process
async function processJobs() {
  // Infinite loop: worker continuously waits for jobs
  while (true) {

    // Block until a job ID is available in Redis queue
    const jobResult = await redis.brpop('job_queue', 0);
    if (!jobResult) continue;

    // Redis BRPOP returns [queueName, jobId]
    const [, id] = jobResult;

    console.log(`Processing job: ${id}`);

    try {
      /**
       * STEP 1: Claim the job
       * 
       * Only transition job from 'queued' -> 'processing'
       * This prevents:
       * - Double processing
       * - Illegal state transitions
       * - Race conditions with multiple workers
       */
      const claim = await pool.query(`
        UPDATE jobs
        SET status = 'processing',
            processing_started_at = NOW(),
            updated_at = NOW()
        WHERE id = $1
        AND status = 'queued'
        RETURNING id, attempts, max_attempts
      `, [id]);

      // If no rows updated, job is not eligible for processing
      if (claim.rowCount === 0) {
        console.log(`Job ${id} is not eligible for processing.`);
        continue;
      }

      /**
       * STEP 2: Simulate doing actual work
       * Replace this with real logic (sending email, processing file, etc.)
       */
      await new Promise(res => setTimeout(res, 2000));

      /**
       * STEP 3: Mark job as succeeded
       * 
       * Only happens if no error was thrown.
       */
      await pool.query(`
        UPDATE jobs
        SET status = 'succeeded',
            processed_at = NOW(),
            updated_at = NOW()
        WHERE id = $1
      `, [id]);

      console.log(`Job completed: ${id}`);

    } catch (err: any) {
      console.log(`Error processing job ${id}:`, err);

      /**
       * STEP 4: Increment attempt counter on failure
       */
      const retry = await pool.query(`
        UPDATE jobs
        SET attempts = attempts + 1,
            last_error = $2,
            updated_at = NOW()
        WHERE id = $1
        RETURNING attempts, max_attempts
      `, [id, err?.message ?? 'Unknown error']);

      if (retry.rowCount === 0) continue;

      const { attempts, max_attempts } = retry.rows[0];

      /**
       * STEP 5: Decide whether to retry or permanently fail
       */
      if (attempts < max_attempts) {
        console.log(`Retrying job ${id} (attempt ${attempts}/${max_attempts})`);

        // Move job back to queued state
        await pool.query(`
          UPDATE jobs
          SET status = 'queued',
              updated_at = NOW()
          WHERE id = $1
        `, [id]);

        // Push job back onto Redis queue
        await redis.lpush('job_queue', id);

      } else {
        console.log(`Job ${id} permanently failed.`);

        await pool.query(`
          UPDATE jobs
          SET status = 'failed',
              updated_at = NOW()
          WHERE id = $1
        `, [id]);
      }
    }
  }
}

// Start processing jobs
processJobs();

// Reload jobs stuck in 'processing' state every minute (e.g. due to worker crash)
setInterval(async () => {
  await pool.query(`
    UPDATE jobs
    SET status = 'queued',
        updated_at = NOW()
    WHERE status = 'processing'
    AND processing_started_at < NOW() - INTERVAL '5 minutes'
  `);
}, 60000);