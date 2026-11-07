import { getLearningById } from "@/lib/dal/learnings";
import { checkUserQuota, recordAgentUsage } from "./quota";
import { buildQuizPrompt, QuizOutput } from "./prompts/quiz";
import { agentClient } from "./client";

export interface GenerateQuizRequest {
  userId: string;
  learningId: string;
}

export async function generateLearningQuiz({
  userId,
  learningId,
}: GenerateQuizRequest): Promise<{
  success: boolean;
  data?: QuizOutput;
  error?: { code: string; message: string };
}> {
  // 1. Fetch learning scoped to user
  const learning = await getLearningById(userId, learningId);
  if (!learning) {
    return {
      success: false,
      error: { code: "NOT_FOUND", message: "Learning item not found." },
    };
  }

  // 2. Check quota
  const quotaError = await checkUserQuota(userId);
  if (quotaError) {
    return { success: false, error: quotaError };
  }

  // 3. Build prompt
  const promptConfig = buildQuizPrompt({
    title: learning.title,
    content: learning.content,
    reviewBox: learning.reviewBox,
  });

  // 4. Call Gemini
  const result = await agentClient.generate(promptConfig);
  if (!result.success) {
    return { success: false, error: result.error };
  }

  // 5. Record usage
  await recordAgentUsage(userId, {
    inputTokens: result.usage.inputTokens,
    outputTokens: result.usage.outputTokens,
  });

  return {
    success: true,
    data: result.data,
  };
}
