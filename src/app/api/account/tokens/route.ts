import { getAuthenticatedUser } from "@/lib/auth/api-auth";
import { listPersonalAccessTokens, createPersonalAccessToken } from "@/lib/dal/tokens";
import {
  badRequestResponse,
  jsonResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/api-response";
import { z } from "zod";

const createTokenSchema = z.object({
  name: z.string().trim().min(1, "Token name is required").max(64, "Token name cannot exceed 64 characters"),
  expiresInDays: z.number().int().min(1).max(365).nullable().optional(),
});

export async function GET(req: Request) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const tokens = await listPersonalAccessTokens(user.id);
    return jsonResponse(tokens);
  } catch (error) {
    return serverErrorResponse(error);
  }
}

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const body = await req.json();
    const parsed = createTokenSchema.safeParse(body);
    if (!parsed.success) return badRequestResponse(parsed.error);

    const { name, expiresInDays } = parsed.data;
    const token = await createPersonalAccessToken(user.id, name, expiresInDays);

    return jsonResponse(token, 201);
  } catch (error) {
    return serverErrorResponse(error);
  }
}
