import { prisma } from "@/lib/prisma";

type AuditAction = "CREATE" | "UPDATE" | "DELETE";

export async function logAudit(entity: string, entityId: string, action: AuditAction, summary: string) {
  try {
    await prisma.auditLog.create({ data: { entity, entityId, action, summary } });
  } catch {
    // 감사 로그 기록 실패는 본 작업을 막지 않는다.
  }
}
