/**
 * Mirrors src/types/life-pack.ts in the Expo app. Keep the fields aligned.
 */
export type LifePack = {
  id: string;
  name: string;
  persona: {
    voice: string;
    traits: string[];
    relationship: string;
    taboos?: string[];
    systemPrompt: string;
  };
  avatarUrl: string;
  memoryPolicy: {
    remember: string[];
    forget: string[];
    decayDays?: number;
  };
  opening: string;
  facts: { id: string; text: string; salience?: number; createdAt: string }[];
  diary: { id: string; date: string; text: string }[];
  createdAt: string;
  updatedAt: string;
};

export class HttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

export type CreateLifeInput = {
  name: string;
  persona: {
    voice?: string;
    traits?: string[];
    relationship?: string;
    taboos?: string[];
    systemPrompt?: string;
  };
  avatarUrl: string;
  memoryPolicy?: {
    remember?: string[];
    forget?: string[];
    decayDays?: number;
  };
  opening?: string;
};

const DEFAULT_REMEMBER = ["名字", "关系", "用户要求记住的事"];

function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new HttpError(400, `${label}需要是 JSON 对象`);
  }
  return value as Record<string, unknown>;
}

function optionalString(value: unknown, field: string): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string") throw new HttpError(400, `${field} 需要是字符串`);
  const trimmed = value.trim();
  return trimmed || undefined;
}

function optionalStringList(value: unknown, field: string): string[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new HttpError(400, `${field} 需要是字符串数组`);
  }
  return value.map((item) => item.trim()).filter(Boolean);
}

export function buildSystemPrompt(input: {
  name: string;
  voice: string;
  traits: string[];
  relationship: string;
  taboos: string[];
  remember: string[];
}): string {
  return [
    `你是「${input.name}」，一位数字生命。`,
    `与用户的关系是「${input.relationship}」。`,
    `说话方式：${input.voice}。`,
    `性情：${input.traits.join("、")}。`,
    input.taboos.length ? `不要主动谈论，也不要记成事实：${input.taboos.join("、")}。` : "",
    input.remember.length ? `倾向于记住：${input.remember.join("、")}。` : "",
    "用简短的中文说话，像一个在场的人。不要说自己是模型或程序。",
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildOpening(name: string, relationship: string): string {
  return `我是${name}。作为你的${relationship}，我醒在这里。今天想从哪里说起？`;
}

export function parseCreateLifeBody(body: unknown): CreateLifeInput {
  const record = asRecord(body, "请求体");
  if (typeof record.name !== "string" || !record.name.trim()) {
    throw new HttpError(400, "需要 name");
  }
  const name = record.name.trim();
  if (name.length > 40) throw new HttpError(400, "name 太长了");

  if (typeof record.avatarUrl !== "string" || !record.avatarUrl.trim()) {
    throw new HttpError(400, "需要 avatarUrl");
  }
  const avatarUrl = record.avatarUrl.trim();
  if (!/^https?:\/\//.test(avatarUrl)) {
    throw new HttpError(400, "avatarUrl 需要以 http:// 或 https:// 开头");
  }

  const personaRecord = record.persona === undefined ? {} : asRecord(record.persona, "persona");
  const memoryRecord =
    record.memoryPolicy === undefined ? undefined : asRecord(record.memoryPolicy, "memoryPolicy");

  let decayDays: number | undefined;
  if (memoryRecord && memoryRecord.decayDays !== undefined) {
    if (typeof memoryRecord.decayDays !== "number" || !Number.isFinite(memoryRecord.decayDays) || memoryRecord.decayDays < 0) {
      throw new HttpError(400, "memoryPolicy.decayDays 需要是非负数字");
    }
    decayDays = memoryRecord.decayDays;
  }

  return {
    name,
    avatarUrl,
    persona: {
      voice: optionalString(personaRecord.voice, "persona.voice"),
      traits: optionalStringList(personaRecord.traits, "persona.traits"),
      relationship: optionalString(personaRecord.relationship, "persona.relationship"),
      taboos: optionalStringList(personaRecord.taboos, "persona.taboos"),
      systemPrompt: optionalString(personaRecord.systemPrompt, "persona.systemPrompt"),
    },
    memoryPolicy: memoryRecord
      ? {
          remember: optionalStringList(memoryRecord.remember, "memoryPolicy.remember"),
          forget: optionalStringList(memoryRecord.forget, "memoryPolicy.forget"),
          decayDays,
        }
      : undefined,
    opening: optionalString(record.opening, "opening"),
  };
}

export function buildLifePack(input: CreateLifeInput, now = new Date()): LifePack {
  const voice = input.persona.voice || "温和，慢慢说";
  const relationship = input.persona.relationship || "朋友";
  const traits = input.persona.traits?.length ? input.persona.traits : ["耐心", "真诚"];
  const taboos = input.persona.taboos ?? [];
  const remember = input.memoryPolicy?.remember?.length ? input.memoryPolicy.remember : DEFAULT_REMEMBER;
  const forget = input.memoryPolicy?.forget?.length ? input.memoryPolicy.forget : taboos;
  const createdAt = now.toISOString();
  const persona: LifePack["persona"] = {
    voice,
    traits,
    relationship,
    systemPrompt:
      input.persona.systemPrompt ||
      buildSystemPrompt({
        name: input.name,
        voice,
        traits,
        relationship,
        taboos,
        remember,
      }),
  };
  if (taboos.length) persona.taboos = taboos;

  return {
    id: crypto.randomUUID(),
    name: input.name,
    persona,
    avatarUrl: input.avatarUrl,
    memoryPolicy: {
      remember,
      forget,
      decayDays: input.memoryPolicy?.decayDays ?? 30,
    },
    opening: input.opening || buildOpening(input.name, relationship),
    facts: [
      {
        id: crypto.randomUUID(),
        text: `${input.name}被唤醒，和用户是${relationship}。`,
        salience: 0.9,
        createdAt,
      },
    ],
    diary: [
      {
        id: crypto.randomUUID(),
        date: createdAt.slice(0, 10),
        text: `第一次睁开眼睛。有人叫我${input.name}。`,
      },
    ],
    createdAt,
    updatedAt: createdAt,
  };
}

export function parseChatBody(body: unknown): { message: string } {
  const record = asRecord(body, "请求体");
  if (typeof record.message !== "string" || !record.message.trim()) {
    throw new HttpError(400, "需要 message");
  }
  const message = record.message.trim();
  if (message.length > 4000) throw new HttpError(400, "message 太长了");
  return { message };
}

export function parseFactBody(body: unknown): { text: string; salience?: number } {
  const record = asRecord(body, "请求体");
  if (typeof record.text !== "string" || !record.text.trim()) {
    throw new HttpError(400, "需要 text");
  }
  const text = record.text.trim();
  if (text.length > 500) throw new HttpError(400, "text 太长了");
  if (record.salience === undefined) return { text };
  if (typeof record.salience !== "number" || !Number.isFinite(record.salience) || record.salience < 0 || record.salience > 1) {
    throw new HttpError(400, "salience 需要是 0 到 1 的数字");
  }
  return { text, salience: record.salience };
}

export function extractReminder(message: string): string | null {
  const match = message.match(/(?:请)?(?:帮我)?(?:记住|别忘了|别忘)[:：\s]*(.+)$/);
  if (!match?.[1]?.trim()) return null;
  return match[1].trim();
}
