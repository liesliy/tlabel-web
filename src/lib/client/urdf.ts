import { HAND_CONFIGS } from '@/lib/tlabel/urdf-mapper';

export interface HandInfo {
  id: string;
  name: string;
  manufacturer: string;
  fingerCount: number;
  jointsPerFinger: number;
  totalTactelCount: number;
  zones: Array<{
    fingerName: string;
    rows: number;
    cols: number;
  }>;
}

export interface URDFParseResult {
  success: boolean;
  urdfInfo: {
    jointCount: number;
    linkCount: number;
    joints: Array<{ name: string; type: string }>;
    matchedHand: { id: string; name: string } | null;
  };
}

export function getHandConfigs(): HandInfo[] {
  return Object.values(HAND_CONFIGS).map(h => ({
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
  }));
}

export function parseURDF(urdfContent: string): URDFParseResult {
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

  return {
    success: true,
    urdfInfo: {
      jointCount: joints.length,
      linkCount: links.length,
      joints: joints.slice(0, 50),
      matchedHand,
    },
  };
}
