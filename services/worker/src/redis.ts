import Redis from 'ioredis';

if(!process.env.REDIS_HOST) {
  throw new Error("REDIS_HOST not defined");
}

export const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: 6379,
});