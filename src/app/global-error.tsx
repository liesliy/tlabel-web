'use client';

export default function GlobalError() {
  return (
    <html>
      <body>
        <div style={{ padding: "20px", textAlign: "center" }}>
          <h2>出错了</h2>
          <p>应用遇到了意外错误，请刷新页面重试。</p>
        </div>
      </body>
    </html>
  );
}
