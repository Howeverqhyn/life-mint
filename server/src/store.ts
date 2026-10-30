import { composeReply } from "./reply.ts";
import {
  buildLifePack,
  extractReminder,
  HttpError,
  type CreateLifeInput,
  type LifePack,
} from "./schema.ts";

type Turn = {
  role: "user" | "assistant";
  text: string;
};

export type LifeStore = {
  create(input: CreateLifeInput): LifePack;
  get(id: string): LifePack | undefined;
  memory(id: string): { facts: LifePack["facts"]; diary: LifePack["diary"] };
  addFact(id: string, text: string, salience?: number): LifePack["facts"][number];
  clearMemory(id: string): { facts: LifePack["facts"]; diary: LifePack["diary"] };
  chat(id: string, message: string): Promise<{ reply: string }>;
};

function requirePack(lives: Map<string, LifePack>, id: string): LifePack {
  const pack = lives.get(id);
  if (!pack) throw new HttpError(404, "没有这位生命");
  return pack;
}

function touchDiary(pack: LifePack, line: string, now: Date) {
  const date = now.toISOString().slice(0, 10);
  const existing = pack.diary.find((entry) => entry.date === date);
  if (existing) {
    existing.text = `${existing.text}\n${line}`;
  } else {
    pack.diary.push({ id: crypto.randomUUID(), date, text: line });
  }
  pack.updatedAt = now.toISOString();
}

function pushFact(pack: LifePack, text: string, salience: number, now = new Date()) {
  const fact = {
    id: crypto.randomUUID(),
    text,
    salience,
    createdAt: now.toISOString(),
  };
  pack.facts.push(fact);
  touchDiary(pack, `记下：${text}`, now);
  return fact;
}

export function createLifeStore(): LifeStore {
  const lives = new Map<string, LifePack>();
  const transcripts = new Map<string, Turn[]>();

  return {
    create(input) {
      const pack = buildLifePack(input);
      lives.set(pack.id, pack);
      transcripts.set(pack.id, []);
      return pack;
    },
    get(id) {
      return lives.get(id);
    },
    memory(id) {
      const pack = requirePack(lives, id);
      return { facts: pack.facts, diary: pack.diary };
    },
    addFact(id, text, salience = 0.5) {
      const pack = requirePack(lives, id);
      return pushFact(pack, text, salience);
    },
    clearMemory(id) {
      const pack = requirePack(lives, id);
      pack.facts = [];
      pack.diary = [];
      pack.updatedAt = new Date().toISOString();
      transcripts.set(id, []);
      return { facts: pack.facts, diary: pack.diary };
    },
    async chat(id, message) {
      const pack = requirePack(lives, id);
      const history = transcripts.get(id) ?? [];
      const previous = [...history].reverse().find((turn) => turn.role === "user")?.text;
      const reminder = extractReminder(message);
      const blockedTopic = pack.memoryPolicy.forget.find(
        (item) => item && (message.includes(item) || (reminder?.includes(item) ?? false)),
      );
      const remembered = Boolean(reminder) && !blockedTopic;
      if (reminder && remembered) pushFact(pack, reminder, 0.7);

      const reply = await composeReply({
        pack,
        message,
        history,
        previous,
        remembered,
        blockedTopic,
      });
      const nextTurns: Turn[] = [
        ...history,
        { role: "user", text: message },
        { role: "assistant", text: reply },
      ];
      transcripts.set(id, nextTurns.slice(-16));
      pack.updatedAt = new Date().toISOString();
      return { reply };
    },
  };
}
