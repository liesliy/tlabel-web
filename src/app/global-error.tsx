'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h2>出错了</h2>
          <p>{error.message || '发生未知错误'}</p>
          <button onClick={reset} style={{ marginTop: '10px', padding: '8px 16px' }}>
            重试
          </button>
        </div>
      </body>
    </html>
  );
}
