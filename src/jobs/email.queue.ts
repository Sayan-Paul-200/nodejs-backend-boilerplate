import { Queue } from "bullmq";
import { redisConfig, EMAIL_QUEUE_NAME } from "./connection"; // 👈 Import from connection

// 1. Define the Queue
export const emailQueue = new Queue(EMAIL_QUEUE_NAME, {
  connection: redisConfig, // 👈 Pass config object, not instance
  defaultJobOptions: {
    attempts: 3, // Retry 3 times if email fails
    backoff: {
      type: "exponential",
      delay: 1000, // Wait 1s, then 2s, then 4s...
    },
    removeOnComplete: true, // Don't clog Redis with finished jobs
  },
});

// 2. Helper to Add Jobs
type EmailJobData = {
  type: "WELCOME" | "RESET_PASSWORD" | "INVITE";
  to: string;
  payload: any; // e.g., token, name
};

export const addEmailJob = async (data: EmailJobData) => {
  return await emailQueue.add(data.type, data);
};