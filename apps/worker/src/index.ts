import { Worker } from "bullmq";
import Redis from "ioredis";

const connection = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null
});

const worker = new Worker(
  "ocr-jobs",
  async (job) => {
    console.log("[worker] processing OCR job", job.id, job.data);
    return {
      status: "processed",
      ocr: {
        businessName: "Mock Cafe",
        amount: 150,
        issuedAt: new Date().toISOString()
      }
    };
  },
  { connection }
);

worker.on("completed", (job) => {
  console.log("[worker] job completed", job.id);
});

worker.on("failed", (job, err) => {
  console.error("[worker] job failed", job?.id, err);
});

console.log("[worker] OCR worker started");
