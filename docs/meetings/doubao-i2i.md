# Doubao 图生图 API 调用文档

## 接口信息

- **接口地址**: `POST https://ark.cn-beijing.volces.com/api/v3/images/generations`
- **鉴权方式**: Bearer Token
- **模型**: `doubao-seedream-5-0-260128`（Seedream 5.0 pro）

## 请求头

| Header | Value |
|--------|-------|
| Content-Type | application/json |
| Authorization | Bearer `<api_key>` |

## 请求体

```json
{
  "model": "doubao-seedream-5-0-260128",
  "prompt": "生成狗狗趴在草地上的近景画面",
  "image": "https://ark-project.tos-cn-beijing.volces.com/doc_image/seedream4_imageToimage.png",
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
| `model` | string | 是 | 模型名称 |
| `prompt` | string | 是 | 图片描述提示词 |
| `image` | string | 否 | 参考图片 URL 或 Base64（单图生图） |
| `sequential_image_generation` | string | 否 | `auto` / `disabled`，默认 `disabled` |
| `response_format` | string | 否 | `url` 或 `b64_json` |
| `size` | string | 否 | 图片尺寸，如 `2K` |
| `stream` | bool | 否 | 是否流式 |
| `watermark` | bool | 否 | 是否添加水印 |

## curl 示例

```bash
curl -X POST https://ark.cn-beijing.volces.com/api/v3/images/generations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key-here" \
  -d '{
    "model": "doubao-seedream-5-0-260128",
    "prompt": "生成狗狗趴在草地上的近景画面",
    "image": "https://ark-project.tos-cn-beijing.volces.com/doc_image/seedream4_imageToimage.png",
    "sequential_image_generation": "disabled",
    "response_format": "url",
    "size": "2K",
    "stream": false,
    "watermark": true
  }'
```
