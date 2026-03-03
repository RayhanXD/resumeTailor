import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { ChatOpenAI } from "@langchain/openai";

export function getResumeModel(): BaseChatModel {
  const provider = process.env.LLM_PROVIDER ?? "openai";
  const modelName = process.env.OPENAI_MODEL ?? "gpt-4o";
  const temperature = parseFloat(process.env.LLM_TEMPERATURE ?? "0.2") || 0.2;

  if (provider === "openai") {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error(
        "OPENAI_API_KEY is required when LLM_PROVIDER=openai",
      );
    }

    return new ChatOpenAI({
      modelName,
      temperature,
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  throw new Error(
    `Unsupported LLM_PROVIDER: ${provider}. Supported: openai`,
  );
}
