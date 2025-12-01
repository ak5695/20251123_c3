import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { session } from "@/lib/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  const currentSession = await auth.api.getSession({
    headers: await headers(),
  });

  if (!currentSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 删除该用户的其他所有会话，只保留当前会话
    const result = await db
      .delete(session)
      .where(
        and(
          eq(session.userId, currentSession.user.id),
          ne(session.id, currentSession.session.id)
        )
      );

    console.log(
      `[Auth] Revoked other sessions for user ${currentSession.user.id}`
    );

    return NextResponse.json({
      success: true,
      message: "Other sessions revoked",
    });
  } catch (error) {
    console.error("[Auth] Error revoking other sessions:", error);
    return NextResponse.json(
      { error: "Failed to revoke sessions" },
      { status: 500 }
    );
  }
}
