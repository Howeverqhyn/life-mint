import assert from "node:assert/strict";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import test from "node:test";

import { createApp } from "./app.ts";

async function withServer(run: (base: string) => Promise<void>) {
  delete process.env.OPENAI_API_KEY;
  const server = createApp().listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address() as AddressInfo;
  try {
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function json(base: string, path: string, init?: RequestInit) {
  const response = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  const body: unknown = await response.json();
  return { status: response.status, body };
}

test("creates a life, chats, and stores memory", async () => {
  await withServer(async (base) => {
    const created = await json(base, "/lives", {
      method: "POST",
      body: JSON.stringify({
        name: "林间",
        avatarUrl: "https://example.com/lin.png",
        persona: { relationship: "朋友", voice: "温和，慢慢说", traits: ["耐心"] },
      }),
    });
    assert.equal(created.status, 201);
    const pack = created.body as {
      id: string;
      name: string;
      opening: string;
      persona: { systemPrompt: string; relationship: string };
      facts: { text: string }[];
      diary: { text: string }[];
      memoryPolicy: { remember: string[]; decayDays: number };
    };
    assert.equal(pack.name, "林间");
    assert.equal(pack.persona.relationship, "朋友");
    assert.match(pack.persona.systemPrompt, /林间/);
    assert.match(pack.opening, /林间/);
    assert.equal(pack.facts.length, 1);
    assert.equal(pack.diary.length, 1);
    assert.equal(pack.memoryPolicy.decayDays, 30);
    assert.ok(pack.memoryPolicy.remember.includes("名字"));

    const first = await json(base, `/lives/${pack.id}/chat`, {
      method: "POST",
      body: JSON.stringify({ message: "今天有点安静" }),
    });
    assert.equal(first.status, 200);
    const firstReply = (first.body as { reply: string }).reply;
    assert.match(firstReply, /林间/);
    assert.match(firstReply, /今天有点安静/);

    const second = await json(base, `/lives/${pack.id}/chat`, {
      method: "POST",
      body: JSON.stringify({ message: "我想接着说" }),
    });
    assert.match((second.body as { reply: string }).reply, /刚才/);

    const remembered = await json(base, `/lives/${pack.id}/chat`, {
      method: "POST",
      body: JSON.stringify({ message: "请记住我喜欢下雨天走路" }),
    });
    assert.match((remembered.body as { reply: string }).reply, /记下了/);

    const memory = await json(base, `/lives/${pack.id}/memory`);
    const facts = (memory.body as { facts: { text: string }[]; diary: { text: string }[] }).facts;
    assert.ok(facts.some((fact) => fact.text === "我喜欢下雨天走路"));

    const added = await json(base, `/lives/${pack.id}/memory/facts`, {
      method: "POST",
      body: JSON.stringify({ text: "家里有一盆薄荷" }),
    });
    assert.equal(added.status, 201);

    const after = await json(base, `/lives/${pack.id}/memory`);
    const afterBody = after.body as { facts: { text: string }[]; diary: { text: string }[] };
    assert.ok(afterBody.facts.some((fact) => fact.text === "家里有一盆薄荷"));
    assert.match(afterBody.diary.map((entry) => entry.text).join("\n"), /薄荷/);

    const cleared = await json(base, `/lives/${pack.id}/memory`, { method: "DELETE" });
    assert.deepEqual(cleared.body, { facts: [], diary: [] });

    const fetched = await json(base, `/lives/${pack.id}`);
    assert.equal((fetched.body as { id: string }).id, pack.id);
  });
});

test("rejects a missing life and a bad body", async () => {
  await withServer(async (base) => {
    const missing = await json(base, "/lives/nope");
    assert.equal(missing.status, 404);

    const bad = await json(base, "/lives", {
      method: "POST",
      body: JSON.stringify({ name: "没有脸" }),
    });
    assert.equal(bad.status, 400);

    const taboo = await json(base, "/lives", {
      method: "POST",
      body: JSON.stringify({
        name: "南风",
        avatarUrl: "https://example.com/nan.png",
        persona: { taboos: ["工作"], relationship: "导师" },
      }),
    });
    const id = (taboo.body as { id: string }).id;
    const reply = await json(base, `/lives/${id}/chat`, {
      method: "POST",
      body: JSON.stringify({ message: "请记住我的工作计划" }),
    });
    assert.match((reply.body as { reply: string }).reply, /放下/);
    const memory = await json(base, `/lives/${id}/memory`);
    const facts = (memory.body as { facts: { text: string }[] }).facts;
    assert.equal(facts.length, 1);
    assert.equal(facts.some((fact) => fact.text.includes("工作计划")), false);
  });
});
