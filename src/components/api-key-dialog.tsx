import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { storage } from "@/lib/storage";
import { Eye, EyeOff, Server, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { ApiConfig } from "@/lib/env-api-config";

interface ApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ApiKeyDialog({ open, onOpenChange }: ApiKeyDialogProps) {
  const [key, setKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [errors, setErrors] = useState<{ key?: string; baseUrl?: string }>({});
  const [envConfigs, setEnvConfigs] = useState<ApiConfig[]>([]);
  const [loadingEnvConfigs, setLoadingEnvConfigs] = useState(false);

  useEffect(() => {
    const loadConfig = async () => {
      const config = await storage.getApiConfig();
      if (config) {
        setKey(config.key);
        setBaseUrl(config.baseUrl);
      }
    };

    const loadEnvConfigs = async () => {
      setLoadingEnvConfigs(true);
      try {
        const response = await fetch('/api/config/env-apis');
        if (response.ok) {
          const data = await response.json();
          setEnvConfigs(data.data.configs || []);
        }
      } catch (error) {
        console.error('加载环境变量配置失败:', error);
      } finally {
        setLoadingEnvConfigs(false);
      }
    };

    if (open) {
      loadConfig();
      loadEnvConfigs();
    }
  }, [open]);

  const validateInputs = () => {
    const newErrors: { key?: string; baseUrl?: string } = {};
    if (!key.trim()) {
      newErrors.key = "请输入 API Key";
    }
    if (!baseUrl.trim()) {
      newErrors.baseUrl = "请输入API基础地址";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateInputs()) return;

    // 确保使用HTTPS协议
    let secureUrl = baseUrl.trim();

    // 检查URL是否以#结尾（特殊处理标记）
    const endsWithHash = secureUrl.endsWith("#");

    if (secureUrl.startsWith("http:") && !endsWithHash) {
      secureUrl = secureUrl.replace("http:", "https:");
      toast.info("为确保安全，已自动将HTTP协议转换为HTTPS");
    }

    await storage.setApiConfig(key.trim(), secureUrl);
    toast.success("保存成功");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>API 配置</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {/* 环境变量配置显示 */}
          {envConfigs.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-green-600" />
                <h3 className="text-sm font-medium text-green-600">
                  检测到环境变量配置 ({envConfigs.length} 个)
                </h3>
              </div>
              <div className="space-y-2">
                {envConfigs.map((config, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">
                          {config.name}
                        </span>
                      </div>
                      <p className="text-xs text-green-600 mt-1">
                        {config.description}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        API Key: {config.apiKey} | 地址: {config.baseUrl}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded border border-blue-200">
                <AlertCircle className="h-3 w-3 inline mr-1" />
                环境变量配置会自动生效，无需手动设置。如果您手动配置了相同类型的API，手动配置将优先使用。
              </div>
            </div>
          )}

          {/* 手动配置部分 */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">
              手动配置 API
            </h3>
            <div className="space-y-2">
              <div>
                <Input
                  placeholder="请输入API基础地址，如需使用完整URL，请在末尾添加#符号"
                  value={baseUrl}
                  onChange={(e) => {
                    setBaseUrl(e.target.value);
                    setErrors((prev) => ({ ...prev, baseUrl: undefined }));
                  }}
                  className={errors.baseUrl ? "border-red-500" : ""}
                />
                {errors.baseUrl && (
                  <p className="text-sm text-red-500 mt-1">{errors.baseUrl}</p>
                )}
                <div className="flex flex-col gap-1 mt-1">
                  <p className="text-xs text-amber-500">
                    注意：在HTTPS网站中使用HTTP接口可能会被浏览器阻止，建议使用HTTPS协议
                  </p>
                  <p className="text-xs text-gray-500">
                    默认添加API路径（如/v1/chat/completions），若URL以#结尾则使用完整输入地址
                  </p>
                </div>
              </div>
              <div className="relative">
                <Input
                  type={showKey ? "text" : "password"}
                  placeholder="请输入您的 API Key"
                  value={key}
                  onChange={(e) => {
                    setKey(e.target.value);
                    setErrors((prev) => ({ ...prev, key: undefined }));
                  }}
                  className={`pr-10 ${errors.key ? "border-red-500" : ""}`}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
                {errors.key && (
                  <p className="text-sm text-red-500 mt-1">{errors.key}</p>
                )}
              </div>
              <p className="text-xs text-gray-500">
                API 配置将安全地存储在您的浏览器中，不会上传到服务器
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button onClick={handleSave}>保存</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
