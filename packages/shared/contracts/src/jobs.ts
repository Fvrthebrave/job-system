import { z } from 'zod';

export const JobStatusSchema = z.enum([
  'queued', 
  'processing', 
  'succeeded', 
  'failed'
]);

export const JobResponseSchema = z.object({
  id: z.string(),
  type: z.string(),
  payload: z.record(z.string(), z.any()),
  status: JobStatusSchema,
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const JobParamsSchema = z.object({
  id: z.string(),
});

export const CreateJobRequestSchema = z.object({
  type: z.string(),
  payload: z.record(z.string(), z.any()),
});

export type JobStatus = z.infer<typeof JobStatusSchema>;
export type CreateJobRequest = z.infer<typeof CreateJobRequestSchema>;
export type JobResponse = z.infer<typeof JobResponseSchema>;
export type JobParams = z.infer<typeof JobParamsSchema>;