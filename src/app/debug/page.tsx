"use client";

import { useEffect, useState } from "react";

export default function DebugPage() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/debug")
      .then((res) => res.json())
      .then((data) => {
        setStatus(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-cyan-400 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">系统状态检查</h1>
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-cyan-400 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">系统状态检查</h1>

        {status?.success ? (
          <div className="space-y-6">
            {/* Vector Stores */}
            <div className="bg-slate-900 border border-cyan-500/20 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">向量存储</h2>
              <div className="space-y-2">
                <p>
                  <span className="text-cyan-400/70">数量:</span>{" "}
                  <span className="text-white">{status.data.vectorStores.count}</span>
                </p>
                <p>
                  <span className="text-cyan-400/70">IDs:</span>
                </p>
                {status.data.vectorStores.ids.length > 0 ? (
                  <ul className="list-disc list-inside pl-4 space-y-1">
                    {status.data.vectorStores.ids.map((id: string) => (
                      <li key={id} className="text-sm text-cyan-300 font-mono">
                        {id}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-red-400 text-sm pl-4">⚠️ 没有向量存储！</p>
                )}
              </div>
            </div>

            {/* Environment */}
            <div className="bg-slate-900 border border-cyan-500/20 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">环境配置</h2>
              <div className="space-y-2">
                <p>
                  <span className="text-cyan-400/70">Alibaba API Key:</span>{" "}
                  <span className={status.data.environment.hasAlibabaKey ? "text-green-400" : "text-red-400"}>
                    {status.data.environment.hasAlibabaKey ? "✓ 已配置" : "✗ 未配置"}
                  </span>
                </p>
                <p>
                  <span className="text-cyan-400/70">Qwen API Key:</span>{" "}
                  <span className={status.data.environment.hasQwenKey ? "text-green-400" : "text-red-400"}>
                    {status.data.environment.hasQwenKey ? "✓ 已配置" : "✗ 未配置"}
                  </span>
                </p>
                <p>
                  <span className="text-cyan-400/70">环境:</span>{" "}
                  <span className="text-white">{status.data.environment.nodeEnv}</span>
                </p>
              </div>
            </div>

            {/* Timestamp */}
            <div className="bg-slate-900 border border-cyan-500/20 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">时间戳</h2>
              <p className="text-sm text-cyan-300">{status.data.timestamp}</p>
            </div>

            {/* Diagnosis */}
            <div className="bg-slate-900 border border-cyan-500/20 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">诊断</h2>
              <div className="space-y-2 text-sm">
                {status.data.vectorStores.count === 0 && (
                  <div className="text-yellow-400">
                    <p className="font-semibold">⚠️ 没有向量存储</p>
                    <p className="mt-2">可能原因：</p>
                    <ul className="list-disc list-inside pl-4 mt-1 space-y-1">
                      <li>PDF 解析失败</li>
                      <li>向量存储创建失败（检查 API Key）</li>
                      <li>服务器重启导致内存清空</li>
                    </ul>
                    <p className="mt-2">解决方案：</p>
                    <ul className="list-disc list-inside pl-4 mt-1 space-y-1">
                      <li>重新上传 PDF 文件</li>
                      <li>检查服务器日志中的错误信息</li>
                      <li>确认 API Key 配置正确</li>
                    </ul>
                  </div>
                )}
                {!status.data.environment.hasAlibabaKey && !status.data.environment.hasQwenKey && (
                  <div className="text-red-400">
                    <p className="font-semibold">✗ API Key 未配置</p>
                    <p className="mt-2">
                      请在 .env.local 文件中配置 ALIBABA_API_KEY 或 QWEN_API_KEY
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-6">
            <p className="text-red-400">加载失败</p>
          </div>
        )}

        <div className="mt-8">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-slate-900 rounded-lg transition-colors"
          >
            刷新状态
          </button>
          <a
            href="/"
            className="ml-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-lg transition-colors inline-block"
          >
            返回主页
          </a>
        </div>
      </div>
    </div>
  );
}
