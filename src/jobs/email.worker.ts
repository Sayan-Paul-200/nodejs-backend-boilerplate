import { Worker, Job } from "bullmq";
import { redisConfig, EMAIL_QUEUE_NAME } from "./connection"; // 👈 Import from connection
import { emailService } from "../services/email.service";
import logger from "../config/logger";

// Define how to process the jobs
const processor = async (job: Job) => {
  const { type, to, payload } = job.data;
  logger.info(`📧 Processing Email Job: ${type} for ${to}`);

  try {
    switch (type) {
      case "WELCOME":
        // await emailService.sendVerification(to, payload.token);
        break;
        
      case "RESET_PASSWORD":
        await emailService.sendPasswordReset(to, payload.token);
        break;

      case "INVITE":
        await emailService.sendInvite(to, payload.token, payload.orgName);
        break;
    }
  } catch (error) {
    logger.error(`❌ Email Job Failed: ${job.id}`, error);
    throw error; // Throwing triggers the BullMQ retry mechanism
  }
};

// Start the Worker
export const emailWorker = new Worker(EMAIL_QUEUE_NAME, processor, {
  connection: redisConfig, // 👈 Pass config object
});

emailWorker.on("completed", (job) => {
  logger.info(`✅ Email Job Completed: ${job.id}`);
});

emailWorker.on("failed", (job, err) => {
  logger.error(`🔥 Email Job Failed: ${job?.id} has failed with ${err.message}`);
});