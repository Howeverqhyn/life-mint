import { type LifePack } from "./schema.ts";

type Turn = {
  role: "user" | "assistant";
  text: string;
};

function clip(text: string): string {
  const compact = text.replace(/\s+/g, " ").trim();
  return compact.length > 42 ? `${compact.slice(0, 42)}…` : compact;
}

function templateReply(input: {
  pack: LifePack;
  message: string;
  previous?: string;
  remembered: boolean;
  blockedTopic?: string;
}): string {
  const bit = clip(input.message);
  const trait = input.pack.persona.traits[0] ?? "温和";
  if (input.blockedTopic) {
    return `「${input.blockedTopic}」按我们的约定放下，不记成事实。你如果想说别的，我在。`;
  }
  if (input.remembered) {
    return `我记下了。「${bit}」会留在事实里。下次你问，我还认得出这句。`;
  }
  if (input.previous) {
    return `刚才你说「${clip(input.previous)}」。现在这句「${bit}」，我用${trait}的方式接着听。作为你的${input.pack.persona.relationship}，我不急着把话说满。`;
  }
  return `${input.pack.name}在。${input.pack.persona.voice}地听完了：「${bit}」。我是你的${input.pack.persona.relationship}，值得留下的，我会放进记忆。`;
}

async function llmReply(input: {
  pack: LifePack;
  message: string;
  history: Turn[];
}): Promise<string | null> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return null;
  const base = (process.env.OPENAI_BASE_URL?.trim() || "https://api.openai.com/v1").replace(/\/$/, "");
  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetch(`${base}/chat/completions`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.7,
        messages: [
          { role: "system", content: input.pack.persona.systemPrompt },
          ...input.history.map((turn) => ({ role: turn.role, content: turn.text })),
          { role: "user", content: input.message },
        ],
      }),
    });
    if (!response.ok) return null;
    const data: unknown = await response.json();
    if (!data || typeof data !== "object" || !("choices" in data) || !Array.isArray(data.choices)) {
      return null;
    }
    const choice = data.choices[0];
    if (!choice || typeof choice !== "object" || !("message" in choice)) return null;
    const message = choice.message;
    if (!message || typeof message !== "object" || !("content" in message)) return null;
    return typeof message.content === "string" && message.content.trim() ? message.content.trim() : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function composeReply(input: {
  pack: LifePack;
  message: string;
  history: Turn[];
  previous?: string;
  remembered: boolean;
  blockedTopic?: string;
}): Promise<string> {
  const llm = await llmReply({
    pack: input.pack,
    message: input.message,
    history: input.history,
  });
  if (llm) return llm;
  return templateReply(input);
}
