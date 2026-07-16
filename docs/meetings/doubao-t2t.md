# Doubao 文生文 API 调用文档

## 接口信息

- **接口地址**: `POST https://ark.cn-beijing.volces.com/api/v3/responses`
- **鉴权方式**: Bearer Token
- **模型**: `doubao-seed-2-0-pro-260215`（支持多模态输入）

## 请求头

| Header | Value |
|--------|-------|
| Content-Type | application/json |
| Authorization | Bearer `<api_key>` |

## 请求体

```json
{
  "model": "doubao-seed-2-0-pro-260215",
  "input": [
    {
      "role": "user",
      "content": [
        {
          "type": "input_image",
          "image_url": "https://example.com/image.png"
        },
        {
          "type": "input_text",
          "text": "你看见了什么？"
        }
      ]
    }
  ]
}
```

## 参数说明

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `model` | string | 是 | 模型名称 |
| `input` | array | 是 | 输入消息列表 |
| `input[].role` | string | 是 | `user` / `assistant` |
| `input[].content` | array | 是 | 内容块列表（可混合文本和图片） |
| `input[].content[].type` | string | 是 | `input_text` 或 `input_image` |
| `input[].content[].text` | string | 当 type=input_text 时必填 | 文本内容 |
| `input[].content[].image_url` | string | 当 type=input_image 时必填 | 图片 URL |

## curl 示例

```bash
curl https://ark.cn-beijing.volces.com/api/v3/responses \
  -H "Authorization: Bearer your-api-key-here" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "doubao-seed-2-0-pro-260215",
    "input": [
      {
        "role": "user",
        "content": [
          {
            "type": "input_image",
            "image_url": "https://ark-project.tos-cn-beijing.volces.com/doc_image/ark_demo_img_1.png"
          },
          {
            "type": "input_text",
            "text": "你看见了什么？"
          }
        ]
      }
    ]
  }'
```

## 文本对话示例

```bash
curl https://ark.cn-beijing.volces.com/api/v3/responses \
  -H "Authorization: Bearer your-api-key-here" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "doubao-seed-2-0-pro-260215",
    "input": [
      {
        "role": "user",
        "content": [
          {
            "type": "input_text",
            "text": "请介绍一下阿克苏苹果的特点。"
          }
        ]
      }
    ]
  }'
```

---

# Doubao 文生图 API 调用文档

## 接口信息

- **接口地址**: `POST https://ark.cn-beijing.volces.com/api/v3/images/generations`
- **鉴权方式**: Bearer Token
- **模型**: `doubao-seedream-5-0-260128`

## 请求头

| Header | Value |
|--------|-------|
| Content-Type | application/json |
| Authorization | Bearer `<api_key>` |

## 请求体

```json
{
  "model": "doubao-seedream-5-0-260128",
  "prompt": "星际穿越，黑洞，黑洞里冲出一辆快支离破碎的复古列车",
  "sequential_image_generation": "disabled",
  "response_format": "url",
  "size": "2K",
  "stream": false,
  "watermark": true
}
```

## 参数说明

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `model` | string | 是 | 模型名称，如 `doubao-seedream-5-0-260128` |
| `prompt` | string | 是 | 图片描述提示词 |
| `sequential_image_generation` | string | 否 | 是否开启连续图片生成，`enabled` / `disabled` |
| `response_format` | string | 否 | 返回格式，`url` 或 `b64_json` |
| `size` | string | 否 | 图片尺寸，如 `2K`、`1K` |
| `stream` | bool | 否 | 是否流式，默认 `false` |
| `watermark` | bool | 否 | 是否添加水印，默认 `true` |

## curl 示例

```bash
curl -X POST https://ark.cn-beijing.volces.com/api/v3/images/generations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key-here" \
  -d '{
    "model": "doubao-seedream-5-0-260128",
    "prompt": "星际穿越，黑洞，黑洞里冲出一辆快支离破碎的复古列车，抢视觉冲击力，电影大片，末日既视感，动感，对比色，oc渲染，光线追踪，动态模糊，景深，超现实主义，深蓝，画面通过细腻的丰富的色彩层次塑造主体与场景，质感真实，暗黑风背景的光影效果营造出氛围，整体兼具艺术幻想感，夸张的广角透视效果，耀光，反射，极致的光影，强引力，吞噬",
    "sequential_image_generation": "disabled",
    "response_format": "url",
    "size": "2K",
    "stream": false,
    "watermark": true
  }'
```
