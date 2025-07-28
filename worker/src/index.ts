export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // 示例：简单 API（命中 run_worker_first）
    if (url.pathname.startsWith("/api/health")) {
      return new Response(JSON.stringify({ ok: true, ts: Date.now() }), {
        headers: { "content-type": "application/json; charset=utf-8" },
      });
    }

    // 否则尝试回落到静态资源（ASSETS）
    // 这里可统一处理 Cache-Control：对带 hash 的文件设置长缓存
    const res = await env.ASSETS.fetch(request);
    const hdr = new Headers(res.headers);
    const path = url.pathname;

    // 简单约定：文件名包含 .[hash]. 的静态资源长缓存
    if (/\.[a-f0-9]{8,}\./i.test(path)) {
      hdr.set("Cache-Control", "public, max-age=31536000, immutable");
    } else if (path.endsWith(".html")) {
      hdr.set("Cache-Control", "public, max-age=60"); // HTML 短缓存
    }

    return new Response(res.body, { status: res.status, headers: hdr });
  },
};

interface Env {
  ASSETS: Fetcher;
}