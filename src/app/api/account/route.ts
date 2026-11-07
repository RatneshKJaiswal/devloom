import { auth } from "@/lib/auth/config";
import { deleteUserAccount, getUserProfile, updateUserProfile } from "@/lib/dal/account";
import {
  jsonResponse,
  notFoundResponse,
  serverErrorResponse,
  unauthorizedResponse,
  badRequestResponse,
} from "@/lib/api-response";
import { z } from "zod";

const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  image: z.string().optional().nullable(),
  organization: z.string().max(100).optional().nullable(),
  role: z.string().max(100).optional().nullable(),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const profile = await getUserProfile(session.user.id);
    if (!profile) return notFoundResponse("User not found");

    return jsonResponse(profile);
  } catch (error) {
    return serverErrorResponse(error);
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const body = await req.json().catch(() => ({}));
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) {
      return badRequestResponse(parsed.error);
    }

    const updated = await updateUserProfile(session.user.id, {
      name: parsed.data.name,
      image: parsed.data.image ?? undefined,
      organization: parsed.data.organization ?? undefined,
      role: parsed.data.role ?? undefined,
    });

    if (!updated) return notFoundResponse("User not found");

    return jsonResponse(updated);
  } catch (error) {
    return serverErrorResponse(error);
  }
}

export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const deleted = await deleteUserAccount(session.user.id);
    if (!deleted) return notFoundResponse("User not found");

    return jsonResponse({ message: "Account and all associated data permanently deleted" });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
