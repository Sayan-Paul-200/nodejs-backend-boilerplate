import { db } from "../../db";
import { auditLogs } from "../../db/schema";

type AuditParams = {
  userId: string | null;
  organizationId?: string | null;
  action: string;
  resource?: string;
  metadata?: Record<string, any>;
  ip?: string;
  userAgent?: string;
};

export const logAudit = async (params: AuditParams) => {
  // ⚡ Performance Note: We deliberately do NOT await this function in controllers.
  // We want the API to return immediately, while this runs in the background.
  
  try {
    await db.insert(auditLogs).values({
      userId: params.userId,
      organizationId: params.organizationId,
      action: params.action,
      resource: params.resource,
      metadata: params.metadata,
      ipAddress: params.ip || "0.0.0.0",
      userAgent: params.userAgent || "unknown",
    });
  } catch (error) {
    // Silently fail or log to system console so we don't crash the main flow
    console.error("⚠️ Audit Log Failed:", error);
  }
};