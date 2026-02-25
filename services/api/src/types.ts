export type JobStatys =
  | 'queueed'
  | 'processing'
  | 'succeeded'
  | 'failed';

  export interface CreateJobRequest {
    type: string,
    payload: unknown;
  }