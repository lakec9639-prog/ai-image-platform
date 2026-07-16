/**
 * Doubao 文生文 API 测试脚本
 * 基于 docs/meetings/doubao-t2t.md 实现（/api/v3/responses 接口）
 *
 * 用法:
 *   npx ts-node test/gentext.ts                                  # 默认文本对话
 *   npx ts-node test/gentext.ts --prompt "你的问题"               # 自定义提问
 *   npx ts-node test/gentext.ts --image <url>                    # 带图片
 *   npx ts-node test/gentext.ts --image <url> --prompt "描述这"   # 图片+提问
 */

require("dotenv").config();

const API_URL = "https://ark.cn-beijing.volces.com/api/v3/responses";
const DEFAULT_KEY = "your-api-key-here";
const DEFAULT_MODEL = "doubao-seed-2-0-pro-260215";

/* ====== 类型定义 ====== */

interface ContentBlock {
  type: "input_text" | "input_image";
  text?: string;
  image_url?: string;
}

interface InputMessage {
  role: "user" | "assistant";
  content: ContentBlock[];
}

interface RequestBody {
  model: string;
  input: InputMessage[];
}

/* ====== 工具函数 ====== */

function getApiKey(): string {
  return process.env.ARK_API_KEY || DEFAULT_KEY;
}

function buildTextOnly(prompt: string): RequestBody {
  return {
    model: DEFAULT_MODEL,
    input: [
      {
        role: "user",
        content: [{ type: "input_text", text: prompt }],
      },
    ],
  };
}

function buildWithImage(prompt: string, imageUrl: string): RequestBody {
  const content: ContentBlock[] = [
    { type: "input_image", image_url: imageUrl },
  ];
  if (prompt) {
    content.push({ type: "input_text", text: prompt });
  }
  return {
    model: DEFAULT_MODEL,
    input: [{ role: "user", content }],
  };
}

function maskKey(key: string): string {
  if (key.length > 12) return key.slice(0, 8) + "..." + key.slice(-4);
  return key;
}

function printUsage(): void {
  console.log(`
用法: npx ts-node test/gentext.ts [选项]

选项:
  --prompt <text>     提问内容（默认: "请介绍一下阿克苏苹果的特点"）
  --image <url>       图片 URL（若不传则纯文本对话）
  -h, --help           显示帮助
  `);
}

/* ====== API 调用 ====== */

async function callApi(body: RequestBody): Promise<void> {
  const key = getApiKey();

  console.log(`\n[请求] POST ${API_URL}`);
  console.log(`[请求] model=${body.model}`);
  console.log(`[请求] Authorization: Bearer ${maskKey(key)}`);
  console.log(`[请求] body: ${JSON.stringify(body, null, 2)}\n`);

  const resp = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`HTTP ${resp.status}: ${text}`);
  }

  const data = await resp.json();
  const content = extractText(data);
  const usage = data.usage || {};

  console.log(`[响应] id=${data.id || "-"}`);
  console.log(`[响应] model=${data.model || "-"}`);
  console.log(`[响应] stop_reason=${data.stop_reason || "-"}`);
  console.log(`[用量] input_tokens=${usage.input_tokens ?? "-"}, output_tokens=${usage.output_tokens ?? "-"}`);
  console.log(`\n--- 输出 ---\n${content}\n`);
}

/** 从响应中提取文本内容 */
function extractText(data: any): string {
  // 兼容两种响应格式
  const content = data.content || data.message?.content || "";
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .filter((b: any) => b.type === "text")
      .map((b: any) => b.text)
      .join("\n");
  }
  // fallback: choices[0]（兼容 chat completions 格式）
  return data.choices?.[0]?.message?.content || JSON.stringify(data);
}

/* ====== 入口 ====== */

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes("-h") || args.includes("--help")) {
    printUsage();
    return;
  }

  const idxPrompt = args.indexOf("--prompt");
  const prompt = idxPrompt !== -1 ? args[idxPrompt + 1] : "请介绍一下阿克苏苹果的特点。";

  const idxImage = args.indexOf("--image");
  const imageUrl = idxImage !== -1 ? args[idxImage + 1] : null;

  const body = imageUrl ? buildWithImage(prompt, imageUrl) : buildTextOnly(prompt);

  try {
    await callApi(body);
  } catch (err) {
    console.error(`\n[错误] ${err instanceof Error ? err.message : err}`);
    process.exit(1);
  }
}

main();

export {};
