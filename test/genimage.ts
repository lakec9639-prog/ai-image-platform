/**
 * Doubao 文生图 / 图生图 API 测试脚本
 * 基于 docs/meetings/doubao-image-api.md + doubao-i2i.md
 *
 * 用法:
 *   npx ts-node test/genimage.ts                                           # 默认文生图
 *   npx ts-node test/genimage.ts --image <url>                             # 参考图 URL
 *   npx ts-node test/genimage.ts --image-file ./puppy.jpg                  # 本地图片 → base64
 *   npx ts-node test/genimage.ts --image-file ./puppy.jpg --prompt "动画风格" # 图生图
 *   npx ts-node test/genimage.ts --model doubao-seedream-5-0-lite          # 切换模型
 *   npx ts-node test/genimage.ts --size "2048x1024"                        # 精确像素
 *   npx ts-node test/genimage.ts --format png                              # PNG 输出
 *   npx ts-node test/genimage.ts --b64                                     # Base64 返回
 *   npx ts-node test/genimage.ts --save ./output                           # 下载到目录
 *   npx ts-node test/genimage.ts --optimize fast                           # 快速优化
 *   npx ts-node test/genimage.ts --web-search                              # 联网搜索 (lite)
 *   npx ts-node test/genimage.ts --stream                                  # 流式输出 (lite/4.x)
 *   npx ts-node test/genimage.ts --sequential auto --max-images 5          # 组图 (lite/4.x)
 */

require("dotenv").config();

const fs = require("fs");
const path = require("path");
const API_URL = "https://ark.cn-beijing.volces.com/api/v3/images/generations";
const DEFAULT_KEY = "your-api-key-here";
const DEFAULT_MODEL = "doubao-seedream-5-0-260128";

/* ====== 类型定义 ====== */

interface RequestBody {
  model: string;
  prompt: string;
  image?: string | string[];
  size?: string;
  optimize_prompt_options?: { mode: "standard" | "fast" };
  output_format?: "png" | "jpeg";
  response_format?: "url" | "b64_json";
  sequential_image_generation?: "auto" | "disabled";
  sequential_image_generation_options?: { max_images: number };
  stream?: boolean;
  tools?: { type: "web_search" }[];
  watermark?: boolean;
}

interface ResponseData {
  created: number;
  model?: string;
  data: {
    url?: string;
    b64_json?: string;
    size?: string;
    output_format?: string;
    error?: { code: string; message: string };
  }[];
  error?: { code: string; message: string };
  usage?: {
    generated_images?: number;
    input_images?: number;
    output_tokens?: number;
    total_tokens?: number;
    tool_usage?: { web_search?: number };
  };
  tools?: { type: string }[];
}

/* ====== 工具函数 ====== */

function getApiKey(): string {
  return process.env.ARK_API_KEY || DEFAULT_KEY;
}

function maskKey(key: string): string {
  if (key.length > 12) return key.slice(0, 8) + "..." + key.slice(-4);
  return key;
}

function printUsage(): void {
  console.log(`
用法: npx ts-node test/genimage.ts [选项]

选项:
  --prompt <text>        图片描述提示词
  --image <url>          参考图片 URL（可多次：--image u1 --image u2）
  --image-file <path>    本地图片文件路径（自动转为 base64）
  --model <name>         模型
  --size <size>          尺寸: 1K/2K/3K/4K 或 宽x高（默认 2K）
  --format <fmt>         png / jpeg（仅 5.0 pro/lite）
  --b64                  返回 Base64 而非 URL
  --optimize <mode>      提示词优化: standard / fast
  --sequential <mode>    组图模式: auto / disabled（lite/4.x）
  --max-images <n>       组图最大张数 1-15
  --stream               流式输出（lite/4.x）
  --web-search           联网搜索（lite）
  --no-watermark         关闭水印
  --save <dir>           下载图片到本地目录
  -h, --help             显示帮助
  `);
}

/** 读取本地图片并转为 base64 data URL */
function imageFileToBase64(filePath: string): string {
  const resolved = path.resolve(filePath);
  const ext = path.extname(resolved).toLowerCase().replace(".", "");
  // 映射后缀到 MIME
  const mimeMap: Record<string, string> = {
    jpg: "jpeg",
    jpeg: "jpeg",
    png: "png",
    webp: "webp",
    bmp: "bmp",
    tiff: "tiff",
    tif: "tiff",
    gif: "gif",
    heic: "heic",
    heif: "heif",
  };
  const mime = mimeMap[ext] || "jpeg";
  const buffer = fs.readFileSync(resolved);
  const b64 = buffer.toString("base64");
  return `data:image/${mime};base64,${b64}`;
}

/* ====== API 调用 ====== */

async function callApi(body: RequestBody): Promise<ResponseData> {
  const key = getApiKey();

  const promptPreview = body.prompt.length > 60
    ? body.prompt.slice(0, 60) + "..."
    : body.prompt;

  console.log(`\n[请求] POST ${API_URL}`);
  console.log(`[请求] model=${body.model}  size=${body.size || "2K"}  stream=${body.stream || false}`);
  console.log(`[请求] Authorization: Bearer ${maskKey(key)}`);
  console.log(`[请求] prompt: "${promptPreview}"`);
  if (body.image) {
    const images = Array.isArray(body.image) ? body.image : [body.image];
    console.log(`[请求] 参考图: ${images.length} 张`);
    images.forEach((u, i) => {
      const display = u.startsWith("data:") ? u.slice(0, 50) + "..." : u;
      console.log(`        图${i + 1}: ${display}`);
    });
  }
  console.log("");

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

  return resp.json() as Promise<ResponseData>;
}

/** 流式响应 */
async function callApiStream(body: RequestBody): Promise<void> {
  const key = getApiKey();

  console.log(`\n[请求] POST ${API_URL} (stream)`);
  console.log(`[请求] model=${body.model}  size=${body.size || "2K"}`);
  console.log(`[请求] Authorization: Bearer ${maskKey(key)}`);
  console.log(`[请求] prompt: "${body.prompt.slice(0, 60)}..."\n`);

  const resp = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({ ...body, stream: true }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`HTTP ${resp.status}: ${text}`);
  }

  const reader = resp.body?.getReader();
  if (!reader) throw new Error("响应体不可读");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed === "data: [DONE]") continue;
      if (!trimmed.startsWith("data: ")) continue;

      try {
        const parsed = JSON.parse(trimmed.slice(6));
        const content = parsed.data?.[0]?.url || parsed.data?.[0]?.b64_json;
        if (content) {
          console.log(`[流式] ${parsed.data[0].url ? "URL: " + parsed.data[0].url : "b64_json: ..."}`);
        }
      } catch {
        // skip
      }
    }
  }
}

/** 下载图片 */
async function downloadImage(url: string, filePath: string): Promise<void> {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`下载失败 HTTP ${resp.status}`);
  const buffer = Buffer.from(await resp.arrayBuffer());
  fs.writeFileSync(filePath, buffer);
}

/** 保存 Base64 图片 */
function saveBase64Image(b64: string, filePath: string): void {
  const data = b64.includes("base64,") ? b64.split("base64,")[1] : b64;
  fs.writeFileSync(filePath, Buffer.from(data, "base64"));
}

/* ====== 入口 ====== */

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes("-h") || args.includes("--help")) {
    printUsage();
    return;
  }

  // --- 解析参数 ---

  const idxModel = args.indexOf("--model");
  const model = idxModel !== -1 ? args[idxModel + 1] : DEFAULT_MODEL;

  const idxPrompt = args.indexOf("--prompt");
  const prompt =
    idxPrompt !== -1
      ? args[idxPrompt + 1]
      : "星际穿越，黑洞，黑洞里冲出一辆快支离破碎的复古列车，抢视觉冲击力，电影大片，末日既视感，动感，对比色，oc渲染，光线追踪，动态模糊，景深，超现实主义，深蓝，画面通过细腻的丰富的色彩层次塑造主体与场景，质感真实，暗黑风背景的光影效果营造出氛围，整体兼具艺术幻想感，夸张的广角透视效果，耀光，反射，极致的光影，强引力，吞噬";

  const idxSize = args.indexOf("--size");
  const size = idxSize !== -1 ? args[idxSize + 1] : "2K";

  const idxFormat = args.indexOf("--format");
  const outputFormat = idxFormat !== -1
    ? (args[idxFormat + 1] as "png" | "jpeg")
    : undefined;

  const idxOptimize = args.indexOf("--optimize");
  const optimizeMode = idxOptimize !== -1
    ? (args[idxOptimize + 1] as "standard" | "fast")
    : undefined;

  const idxSeq = args.indexOf("--sequential");
  const sequentialMode = idxSeq !== -1
    ? (args[idxSeq + 1] as "auto" | "disabled")
    : undefined;

  const idxMax = args.indexOf("--max-images");
  const maxImages = idxMax !== -1 ? parseInt(args[idxMax + 1], 10) || 15 : undefined;

  const idxSave = args.indexOf("--save");
  const saveDir = idxSave !== -1 ? args[idxSave + 1] : null;

  const useB64 = args.includes("--b64");
  const useStream = args.includes("--stream");
  const useWebSearch = args.includes("--web-search");
  const noWatermark = args.includes("--no-watermark");

  // --- 收集参考图片：URL 方式 ---
  const images: string[] = [];
  args.forEach((arg, i) => {
    if (arg === "--image" && args[i + 1]) images.push(args[i + 1]);
  });

  // --- 收集参考图片：本地文件 → base64 ---
  args.forEach((arg, i) => {
    if (arg === "--image-file" && args[i + 1]) {
      const b64 = imageFileToBase64(args[i + 1]);
      images.push(b64);
    }
  });

  // --- 构建请求体 ---

  const body: RequestBody = {
    model,
    prompt,
  };

  if (images.length > 0) {
    body.image = images.length === 1 ? images[0] : images;
  }

  if (size) body.size = size;
  if (outputFormat) body.output_format = outputFormat;
  if (optimizeMode) body.optimize_prompt_options = { mode: optimizeMode };
  if (sequentialMode) body.sequential_image_generation = sequentialMode;
  if (maxImages !== undefined) {
    body.sequential_image_generation_options = { max_images: maxImages };
  }
  body.response_format = useB64 ? "b64_json" : "url";
  if (useWebSearch) body.tools = [{ type: "web_search" }];
  body.watermark = !noWatermark;
  if (useStream) body.stream = true;

  // --- 发起请求 ---

  try {
    if (useStream) {
      await callApiStream(body);
      return;
    }

    const result = await callApi(body);

    if (result.error) {
      console.log(`[错误] ${result.error.code}: ${result.error.message}\n`);
      return;
    }

    if (result.usage) {
      console.log(`[用量] generated_images=${result.usage.generated_images ?? "-"}  ` +
        `input_images=${result.usage.input_images ?? "-"}  ` +
        `output_tokens=${result.usage.output_tokens ?? "-"}  ` +
        `total_tokens=${result.usage.total_tokens ?? "-"}`);
      if (result.usage.tool_usage?.web_search !== undefined) {
        console.log(`[用量] web_search_calls=${result.usage.tool_usage.web_search}`);
      }
    }

    console.log(`[响应] created=${result.created}  model=${result.model || "-"}  ` +
      `图片数=${result.data?.length || 0}\n`);

    if (!result.data || result.data.length === 0) {
      console.log("  无返回图片数据\n");
      return;
    }

    for (let i = 0; i < result.data.length; i++) {
      const item = result.data[i];

      if (item.error) {
        console.log(`  [${i + 1}] 生成失败: ${item.error.code} - ${item.error.message}`);
        continue;
      }

      const url = item.url;
      const b64 = item.b64_json;
      const imgSize = item.size || "-";
      const fmt = item.output_format || "-";

      console.log(`  [${i + 1}] size=${imgSize}  format=${fmt}`);

      if (url) {
        console.log(`       URL: ${url}`);

        if (saveDir) {
          if (!fs.existsSync(saveDir)) fs.mkdirSync(saveDir, { recursive: true });

          const ext = outputFormat === "png" ? ".png" : ".jpg";
          const filename = `genimage_${Date.now()}_${i}${ext}`;
          const filePath = path.join(saveDir, filename);

          process.stdout.write(`       → 下载中...`);
          await downloadImage(url, filePath);
          console.log(` 已保存: ${filePath}`);
        }
      } else if (b64) {
        console.log(`       b64_json: ${b64.slice(0, 60)}...`);

        if (saveDir) {
          if (!fs.existsSync(saveDir)) fs.mkdirSync(saveDir, { recursive: true });

          const ext = outputFormat === "png" ? ".png" : ".jpg";
          const filename = `genimage_${Date.now()}_${i}${ext}`;
          const filePath = path.join(saveDir, filename);

          saveBase64Image(b64, filePath);
          console.log(`       → 已保存: ${filePath}`);
        }
      }
    }

    if (result.tools?.length) {
      console.log(`\n[工具] ${result.tools.map((t) => t.type).join(", ")}`);
    }

    console.log();
  } catch (err) {
    console.error(`\n[错误] ${err instanceof Error ? err.message : err}`);
    process.exit(1);
  }
}

main();
