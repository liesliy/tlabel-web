import { NextRequest, NextResponse } from 'next/server';
import { HAND_CONFIGS } from '@/lib/tlabel/urdf-mapper';

export async function GET() {
  return NextResponse.json({
    hands: Object.values(HAND_CONFIGS).map(h => ({
      id: h.id,
      name: h.name,
      manufacturer: h.manufacturer,
      fingerCount: h.fingerCount,
      jointsPerFinger: h.jointsPerFinger,
      totalTactelCount: h.totalTactelCount,
      zones: h.tactileZones.map(z => ({
        fingerName: z.fingerName,
        rows: z.rows,
        cols: z.cols,
      })),
    })),
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { urdfContent } = body;

    if (!urdfContent) {
      return NextResponse.json({ error: '缺少URDF内容' }, { status: 400 });
    }

    // 简单解析 URDF
    const jointRegex = /<joint\s+name="([^"]+)"[^>]*type="([^"]+)"/g;
    const linkRegex = /<link\s+name="([^"]+)"/g;

    const joints: Array<{ name: string; type: string }> = [];
    const links: string[] = [];

    let match;
    while ((match = jointRegex.exec(urdfContent)) !== null) {
      joints.push({ name: match[1], type: match[2] });
    }
    while ((match = linkRegex.exec(urdfContent)) !== null) {
      links.push(match[1]);
    }

    // 尝试匹配已知的灵巧手
    let matchedHand = null;
    const lowerContent = urdfContent.toLowerCase();
    for (const [id, config] of Object.entries(HAND_CONFIGS)) {
      if (lowerContent.includes(id.toLowerCase()) ||
          lowerContent.includes(config.manufacturer.toLowerCase())) {
        matchedHand = { id, name: config.name };
        break;
      }
    }

    return NextResponse.json({
      success: true,
      urdfInfo: {
        jointCount: joints.length,
        linkCount: links.length,
        joints: joints.slice(0, 50),
        matchedHand,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: `URDF解析失败: ${err instanceof Error ? err.message : '未知错误'}` },
      { status: 500 }
    );
  }
}
