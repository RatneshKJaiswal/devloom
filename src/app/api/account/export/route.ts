import { auth } from "@/lib/auth/config";
import { exportUserData } from "@/lib/dal/account";
import {
  notFoundResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/api-response";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const data = await exportUserData(session.user.id);
    if (!data) return notFoundResponse("User not found");

    const jsonString = JSON.stringify(data, null, 2);
    const filename = `devloom-export-${new Date().toISOString().split("T")[0]}.json`;

    return new NextResponse(jsonString, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
