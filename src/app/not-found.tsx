'use client';

export default function NotFound() {
  return (
    <div style={{ padding: "40px", textAlign: "center" }}>
      <h2>404 - 页面不存在</h2>
      <p>你访问的页面不存在，请检查链接是否正确。</p>
      <a href="/" style={{ color: "#1890ff", marginTop: "16px", display: "inline-block" }}>
        返回首页
      </a>
    </div>
  );
}
