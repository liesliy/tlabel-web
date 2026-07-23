import { NextRequest, NextResponse } from 'next/server';

// 存储处理历史（内存存储，MVP阶段）
const processingHistory: Array<{
  id: string;
  fileName: string;
  processedAt: string;
  status: string;
  channelCount: number;
  sampleRate: number;
  sampleCount: number;
  targetHand: string | null;
  exportLeRobot: boolean;
}> = [];

export async function GET() {
  return NextResponse.json({
    history: processingHistory.sort((a, b) =>
      new Date(b.processedAt).getTime() - new Date(a.processedAt).getTime()
    ),
    total: processingHistory.length,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const entry = {
      id: `proc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      fileName: body.fileName || 'unknown',
      processedAt: new Date().toISOString(),
      status: body.status || 'completed',
      channelCount: body.channelCount || 0,
      sampleRate: body.sampleRate || 0,
      sampleCount: body.sampleCount || 0,
      targetHand: body.targetHand || null,
      exportLeRobot: body.exportLeRobot || false,
    };

    processingHistory.push(entry);

    // 限制历史记录数量
    if (processingHistory.length > 100) {
      processingHistory.splice(0, processingHistory.length - 100);
    }

    return NextResponse.json({ success: true, entry });
  } catch (err) {
    return NextResponse.json(
      { error: `记录失败: ${err instanceof Error ? err.message : '未知错误'}` },
      { status: 500 }
    );
  }
}
