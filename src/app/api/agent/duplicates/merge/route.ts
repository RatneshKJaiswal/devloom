import { auth } from "@/lib/auth/config";
import { executeConfirmedMerge } from "@/lib/agent/duplicates";
import { z } from "zod";
import {
  badRequestResponse,
  jsonResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/api-response";

const mergeSchema = z.object({
  entityType: z.enum(["task", "bug", "learning"]),
  primaryId: z.string().uuid("Invalid primary item ID"),
  duplicateId: z.string().uuid("Invalid duplicate item ID"),
  confirmed: z.boolean().refine((val) => val === true, {
    message: "Destructive action: 'confirmed: true' is required.",
  }),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const body = await req.json();
    const parsed = mergeSchema.safeParse(body);
    if (!parsed.success) return badRequestResponse(parsed.error);

    const merged = await executeConfirmedMerge({
      userId: session.user.id,
      entityType: parsed.data.entityType,
      primaryId: parsed.data.primaryId,
      duplicateId: parsed.data.duplicateId,
      confirmed: parsed.data.confirmed,
    });

    return jsonResponse({
      message: "Duplicate items merged successfully.",
      mergedItem: merged,
    });
  } catch (error: any) {
    if (error.message?.includes("not found")) {
      return badRequestResponse(error.message);
    }
    return serverErrorResponse(error);
  }
}
