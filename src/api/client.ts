import type { LifePack } from "@/types/life-pack";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export type CreateLifeInput = {
  name: string;
  persona?: Partial<LifePack["persona"]>;
  avatarUrl: string;
  memoryPolicy?: Partial<LifePack["memoryPolicy"]>;
  opening?: string;
};

export type LifeMemory = Pick<LifePack, "facts" | "diary">;

function errorMessage(data: unknown, status: number): string {
  if (data && typeof data === "object" && "error" in data && typeof data.error === "string") {
    return data.error;
  }
  return `请求没有成功（${status}）`;
}

async function request<T>(baseUrl: string, path: string, init?: RequestInit): Promise<T> {
  const root = baseUrl.trim().replace(/\/$/, "");
  let response: Response;
  try {
    response = await fetch(`${root}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
      },
    });
  } catch {
    throw new ApiError("连不上生命服务。请检查地址，并确认电脑上的 API 已启动。", 0);
  }

  const raw = await response.text();
  let data: unknown = null;
  if (raw) {
    try {
      data = JSON.parse(raw) as unknown;
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    throw new ApiError(errorMessage(data, response.status), response.status);
  }
  return data as T;
}

function assertLifePack(value: unknown): LifePack {
  if (!value || typeof value !== "object") {
    throw new ApiError("服务返回的生命不完整", 500);
  }
  const pack = value as LifePack;
  if (!pack.id || !pack.name || !pack.persona?.systemPrompt || typeof pack.opening !== "string") {
    throw new ApiError("服务返回的生命不完整", 500);
  }
  return pack;
}

export async function createLife(baseUrl: string, input: CreateLifeInput): Promise<LifePack> {
  const data = await request<unknown>(baseUrl, "/lives", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return assertLifePack(data);
}

export async function getLife(baseUrl: string, id: string): Promise<LifePack> {
  const data = await request<unknown>(baseUrl, `/lives/${encodeURIComponent(id)}`);
  return assertLifePack(data);
}

export async function sendChat(baseUrl: string, id: string, message: string): Promise<{ reply: string }> {
  const data = await request<unknown>(baseUrl, `/lives/${encodeURIComponent(id)}/chat`, {
    method: "POST",
    body: JSON.stringify({ message }),
  });
  if (!data || typeof data !== "object" || !("reply" in data) || typeof data.reply !== "string") {
    throw new ApiError("服务没有返回回复", 500);
  }
  return { reply: data.reply };
}

export async function getMemory(baseUrl: string, id: string): Promise<LifeMemory> {
  const data = await request<unknown>(baseUrl, `/lives/${encodeURIComponent(id)}/memory`);
  if (!data || typeof data !== "object" || !("facts" in data) || !("diary" in data)) {
    throw new ApiError("服务没有返回记忆", 500);
  }
  const memory = data as LifeMemory;
  return {
    facts: Array.isArray(memory.facts) ? memory.facts : [],
    diary: Array.isArray(memory.diary) ? memory.diary : [],
  };
}

export async function addFact(baseUrl: string, id: string, text: string): Promise<void> {
  await request(baseUrl, `/lives/${encodeURIComponent(id)}/memory/facts`, {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}

export async function clearMemory(baseUrl: string, id: string): Promise<void> {
  await request(baseUrl, `/lives/${encodeURIComponent(id)}/memory`, { method: "DELETE" });
}
