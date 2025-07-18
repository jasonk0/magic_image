import { storage } from "./storage";
import { getEnvApiConfigs } from "./env-api-config";
import {
  GenerationModel,
  AspectRatio,
  ImageSize,
  DalleImageData,
  ModelType,
} from "@/types";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";

export interface GenerateImageRequest {
  prompt: string;
  model: GenerationModel;
  modelType?: ModelType;
  sourceImage?: string;
  isImageToImage?: boolean;
  aspectRatio?: AspectRatio;
  size?: ImageSize;
  n?: number;
  quality?: "high" | "medium" | "low" | "hd" | "standard" | "auto";
  mask?: string;
  sourceImages?: string[];
}

export interface StreamCallback {
  onMessage: (content: string) => void;
  onComplete: (imageUrl: string) => void;
  onError: (error: string) => void;
}

export interface DalleImageResponse {
  data: Array<DalleImageData>;
  created: number;
}

const showErrorToast = (message: string) => {
  toast.error(message, {
    style: { color: "#EF4444" }, // text-red-500
    duration: 5000,
  });
};

// 辅助函数，构建请求URL
const buildRequestUrl = (baseUrl: string, endpoint: string): string => {
  // 如果URL以#结尾，则使用完整的baseUrl，不添加后缀
  if (baseUrl.endsWith("#")) {
    return baseUrl.slice(0, -1); // 移除#号
  }
  // 否则按常规方式拼接endpoint
  return `${baseUrl}${endpoint}`;
};

// 获取有效的API配置（优先使用用户手动配置）
async function getEffectiveApiConfig() {
  // 首先检查本地存储的手动配置
  const localConfig = await storage.getApiConfig();
  if (localConfig) {
    return {
      key: localConfig.key,
      baseUrl: localConfig.baseUrl,
      source: "local",
    };
  }

  // 如果没有手动配置，再使用环境变量配置
  // 在客户端环境中，通过API获取环境变量配置
  if (typeof window !== "undefined") {
    try {
      const response = await fetch("/api/config/env-apis");
      if (response.ok) {
        const data = await response.json();
        const envConfigs = data.data.configs || [];

        if (envConfigs.length > 0) {
          // 优先使用第一个OpenAI类型的配置
          const openaiEnvConfig = envConfigs.find(
            (config: any) => config.type === "openai"
          );
          if (openaiEnvConfig) {
            // 需要获取完整的API Key（不是隐藏版本）
            const fullConfig = await getFullEnvConfig(openaiEnvConfig.type);
            if (fullConfig) {
              return {
                key: fullConfig.apiKey,
                baseUrl: fullConfig.baseUrl,
                source: "environment",
              };
            }
          }

          // 如果没有OpenAI配置，使用第一个可用的配置
          const firstConfig = envConfigs[0];
          const fullConfig = await getFullEnvConfig(firstConfig.type);
          if (fullConfig) {
            return {
              key: fullConfig.apiKey,
              baseUrl: fullConfig.baseUrl,
              source: "environment",
            };
          }
        }
      }
    } catch (error) {
      console.error("获取环境变量配置失败:", error);
    }
  } else {
    // 在服务器端环境中，直接使用环境变量
    const envConfigs = getEnvApiConfigs();

    // 如果有环境变量配置，优先使用第一个OpenAI类型的配置
    const openaiEnvConfig = envConfigs.find(
      (config) => config.type === "openai"
    );
    if (openaiEnvConfig) {
      return {
        key: openaiEnvConfig.apiKey,
        baseUrl: openaiEnvConfig.baseUrl,
        source: "environment",
      };
    }

    // 如果没有OpenAI环境变量配置，使用第一个可用的环境变量配置
    if (envConfigs.length > 0) {
      const firstConfig = envConfigs[0];
      return {
        key: firstConfig.apiKey,
        baseUrl: firstConfig.baseUrl,
        source: "environment",
      };
    }
  }

  return null;
}

// 获取完整的环境变量配置（包含完整的API Key）
async function getFullEnvConfig(type: string) {
  if (typeof window === "undefined") {
    // 服务器端直接返回环境变量配置
    const envConfigs = getEnvApiConfigs();
    return envConfigs.find((config) => config.type === type) || null;
  }

  // 客户端需要通过API获取完整配置
  try {
    const response = await fetch("/api/config/env-apis/full", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ type }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.data || null;
    }
  } catch (error) {
    console.error("获取完整环境变量配置失败:", error);
  }

  return null;
}

export const api = {
  generateDalleImage: async (
    request: GenerateImageRequest
  ): Promise<DalleImageResponse> => {
    const config = await getEffectiveApiConfig();
    if (!config) {
      showErrorToast("请先设置 API 配置");
      throw new Error("请先设置 API 配置");
    }

    if (!config.key || !config.baseUrl) {
      showErrorToast("API 配置不完整，请检查 API Key 和基础地址");
      throw new Error("API 配置不完整");
    }

    // 添加配置来源的调试信息
    console.log(
      `使用 ${
        config.source === "environment" ? "环境变量" : "本地存储"
      } API 配置`
    );
    console.log(`API 地址: ${config.baseUrl}`);

    // 根据模型类型构建不同的请求URL
    const modelType = request.modelType || ModelType.DALLE;
    const endpoint =
      modelType === ModelType.DALLE
        ? "/v1/images/generations"
        : "/v1/images/generations";

    const requestUrl = buildRequestUrl(config.baseUrl, endpoint);

    const response = await fetch(requestUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.key}`,
      },
      body: JSON.stringify({
        model: request.model,
        prompt: request.prompt,
        size: request.size || "auto",
        n: request.n || 1,
        quality: request.quality,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage =
        errorData.message || errorData.error?.message || "生成图片失败";
      const errorCode = errorData.code || errorData.error?.code;
      const fullError = `${errorMessage}${
        errorCode ? `\n错误代码: ${errorCode}` : ""
      }`;
      showErrorToast(fullError);
      throw new Error(fullError);
    }

    return response.json();
  },

  editDalleImage: async (
    request: GenerateImageRequest
  ): Promise<DalleImageResponse> => {
    const config = await getEffectiveApiConfig();
    if (!config) {
      showErrorToast("请先设置 API 配置");
      throw new Error("请先设置 API 配置");
    }

    if (!config.key || !config.baseUrl) {
      showErrorToast("API 配置不完整，请检查 API Key 和基础地址");
      throw new Error("API 配置不完整");
    }

    if (!request.sourceImage) {
      showErrorToast("请先上传图片");
      throw new Error("请先上传图片");
    }

    try {
      // 根据模型类型构建不同的请求URL
      const modelType = request.modelType || ModelType.DALLE;
      const endpoint =
        modelType === ModelType.DALLE ? "/v1/images/edits" : "/v1/images/edits";

      // 创建 FormData
      const formData = new FormData();
      formData.append("prompt", request.prompt);
      console.log(request.sourceImage);
      // 处理源图片
      const sourceImageResponse = await fetch(request.sourceImage);
      if (!sourceImageResponse.ok) {
        throw new Error("获取源图片失败");
      }
      const sourceImageBlob = await sourceImageResponse.blob();
      formData.append("image", sourceImageBlob, "image.png");

      // 处理遮罩图片
      if (request.mask) {
        console.log(request.mask);
        const maskResponse = await fetch(request.mask);
        if (!maskResponse.ok) {
          throw new Error("获取遮罩图片失败");
        }
        const maskBlob = await maskResponse.blob();
        formData.append("mask", maskBlob, "mask.png");
      }

      formData.append("model", request.model);
      if (request.size) formData.append("size", request.size);
      if (request.n) formData.append("n", request.n.toString());
      if (request.quality) formData.append("quality", request.quality);

      const requestUrl = buildRequestUrl(config.baseUrl, endpoint);

      const response = await fetch(requestUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.key}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage =
          errorData.message || errorData.error?.message || "编辑图片失败";
        const errorCode = errorData.code || errorData.error?.code;
        const fullError = `${errorMessage}${
          errorCode ? `\n错误代码: ${errorCode}` : ""
        }`;
        showErrorToast(fullError);
        throw new Error(fullError);
      }

      return response.json();
    } catch (error) {
      if (error instanceof Error) {
        showErrorToast(error.message);
        throw error;
      }
      const errorMessage = "编辑图片失败";
      showErrorToast(errorMessage);
      throw new Error(errorMessage);
    }
  },

  generateStreamImage: async (
    request: GenerateImageRequest,
    callbacks: StreamCallback
  ) => {
    const config = await getEffectiveApiConfig();
    if (!config) {
      const error = "请先设置 API 配置";
      showErrorToast(error);
      callbacks.onError(error);
      return;
    }

    if (!config.key || !config.baseUrl) {
      const error = "API 配置不完整，请检查 API Key 和基础地址";
      showErrorToast(error);
      callbacks.onError(error);
      return;
    }

    // 多图片支持：修改消息构建逻辑
    const messages = request.isImageToImage
      ? [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: request.prompt,
              },
              // 如果有sourceImages数组，使用所有图片
              ...(Array.isArray(request.sourceImages)
                ? request.sourceImages.map((imgUrl) => ({
                    type: "image_url",
                    image_url: { url: imgUrl },
                  }))
                : // 兼容旧代码，如果只有单张图片
                request.sourceImage
                ? [
                    {
                      type: "image_url",
                      image_url: { url: request.sourceImage },
                    },
                  ]
                : []),
            ],
          },
        ]
      : [
          {
            role: "user",
            content: request.prompt,
          },
        ];

    // 根据模型类型构建不同的请求URL
    const modelType = request.modelType || ModelType.OPENAI;
    const endpoint =
      modelType === ModelType.DALLE
        ? "/v1/images/generations"
        : "/v1/chat/completions";

    // 根据模型类型构建不同的请求体
    const requestBody =
      modelType === ModelType.DALLE
        ? {
            model: request.model,
            prompt: request.prompt,
            size:
              request.aspectRatio === "1:1"
                ? "1024x1024"
                : request.aspectRatio === "16:9"
                ? "1792x1024"
                : "1024x1792",
            n: 1,
          }
        : {
            model: request.model,
            messages,
            stream: true,
          };

    const requestUrl = buildRequestUrl(config.baseUrl, endpoint);

    const response = await fetch(requestUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.key}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      try {
        const errorData = await response.json();
        const errorMessage =
          errorData.message || errorData.error?.message || "生成图片失败";
        const errorCode = errorData.code || errorData.error?.code;
        const fullError = `${errorMessage}${
          errorCode ? `\n错误代码: ${errorCode}` : ""
        }`;
        callbacks.onError(fullError);
        showErrorToast(fullError);
      } catch {
        const error = "生成图片失败";
        callbacks.onError(error);
        showErrorToast(error);
      }
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      callbacks.onError("读取响应失败");
      return;
    }

    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || trimmedLine === "data: [DONE]") continue;

          try {
            const jsonStr = trimmedLine.replace(/^data: /, "");
            const data = JSON.parse(jsonStr);

            if (data.choices?.[0]?.delta?.content) {
              const content = data.choices[0].delta.content;
              callbacks.onMessage(content);

              const urlMatch = content.match(/\[.*?\]\((.*?)\)/);
              if (urlMatch && urlMatch[1]) {
                callbacks.onComplete(urlMatch[1]);
                return;
              }
            }
          } catch (e) {
            console.warn("解析数据行失败:", e);
          }
        }
      }

      if (buffer.trim()) {
        try {
          const jsonStr = buffer.trim().replace(/^data: /, "");
          const data = JSON.parse(jsonStr);
          if (data.choices?.[0]?.delta?.content) {
            const content = data.choices[0].delta.content;
            callbacks.onMessage(content);

            const urlMatch = content.match(/\[.*?\]\((.*?)\)/);
            if (urlMatch && urlMatch[1]) {
              callbacks.onComplete(urlMatch[1]);
            }
          }
        } catch (e) {
          console.warn("解析最后的数据失败:", e);
        }
      }
    } catch (error) {
      console.error("处理流数据失败:", error);
      callbacks.onError("处理响应数据失败");
    }
    reader.releaseLock();
  },
};
