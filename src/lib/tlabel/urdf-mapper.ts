import { TLabelData, TLabelSemanticFeatures, SEMANTIC_FEATURE_NAMES } from './types';

/**
 * 灵巧手构型定义
 */
export interface DexterousHandConfig {
  id: string;
  name: string;
  manufacturer: string;
  fingerCount: number;
  jointsPerFinger: number;
  tactileZones: TactileZone[];
  totalTactelCount: number;
}

export interface TactileZone {
  fingerId: string;
  fingerName: string;
  rows: number;
  cols: number;
  channelOffset: number;
}

/**
 * 预定义的灵巧手构型
 */
export const HAND_CONFIGS: Record<string, DexterousHandConfig> = {
  'unitree_g1': {
    id: 'unitree_g1',
    name: 'Unitree G1 灵巧手',
    manufacturer: '宇树科技',
    fingerCount: 5,
    jointsPerFinger: 4,
    tactileZones: [
      { fingerId: 'thumb', fingerName: '拇指', rows: 4, cols: 3, channelOffset: 0 },
      { fingerId: 'index', fingerName: '食指', rows: 4, cols: 2, channelOffset: 12 },
      { fingerId: 'middle', fingerName: '中指', rows: 4, cols: 2, channelOffset: 20 },
      { fingerId: 'ring', fingerName: '无名指', rows: 4, cols: 2, channelOffset: 28 },
      { fingerId: 'pinky', fingerName: '小指', rows: 3, cols: 2, channelOffset: 36 },
    ],
    totalTactelCount: 44,
  },
  'inspire_robotics': {
    id: 'inspire_robotics',
    name: '因时机器人灵巧手',
    manufacturer: '因时机器人',
    fingerCount: 5,
    jointsPerFinger: 3,
    tactileZones: [
      { fingerId: 'thumb', fingerName: '拇指', rows: 3, cols: 3, channelOffset: 0 },
      { fingerId: 'index', fingerName: '食指', rows: 3, cols: 2, channelOffset: 9 },
      { fingerId: 'middle', fingerName: '中指', rows: 3, cols: 2, channelOffset: 15 },
      { fingerId: 'ring', fingerName: '无名指', rows: 3, cols: 2, channelOffset: 21 },
      { fingerId: 'pinky', fingerName: '小指', rows: 3, cols: 2, channelOffset: 27 },
    ],
    totalTactelCount: 33,
  },
  'allegro_hand': {
    id: 'allegro_hand',
    name: 'Allegro Hand',
    manufacturer: 'Wonik Robotics',
    fingerCount: 4,
    jointsPerFinger: 4,
    tactileZones: [
      { fingerId: 'index', fingerName: '食指', rows: 4, cols: 3, channelOffset: 0 },
      { fingerId: 'middle', fingerName: '中指', rows: 4, cols: 3, channelOffset: 12 },
      { fingerId: 'ring', fingerName: '无名指', rows: 4, cols: 3, channelOffset: 24 },
      { fingerId: 'pinky', fingerName: '小指', rows: 4, cols: 3, channelOffset: 36 },
    ],
    totalTactelCount: 48,
  },
};

/**
 * URDF 映射元数据
 */
export interface URDFMappingResult {
  sourceHand: string;
  targetHand: string;
  targetConfig: DexterousHandConfig;
  mappedData: TLabelData;
  mappingInfo: {
    interpolation_method: string;
    channel_mapping: Array<{
      source: [number, number];
      target: [number, number];
      finger: string;
    }>;
    total_source_channels: number;
    total_target_channels: number;
  };
}

/**
 * 将 TLabel 数据映射到目标灵巧手构型
 * 使用双线性插值进行通道映射
 */
export function mapToDexterousHand(
  sourceData: TLabelData,
  targetHandId: string
): URDFMappingResult {
  const targetConfig = HAND_CONFIGS[targetHandId];
  if (!targetConfig) {
    throw new Error(`不支持的灵巧手类型: ${targetHandId}`);
  }

  const sourceRows = sourceData.rows;
  const sourceCols = sourceData.cols;
  const numSamples = sourceData.timestamps.length;

  // 计算目标总通道数
  const targetTotalChannels = targetConfig.totalTactelCount;

  // 为每个语义特征创建映射后的数据
  const mappedData: TLabelSemanticFeatures = {} as TLabelSemanticFeatures;
  for (const name of SEMANTIC_FEATURE_NAMES) {
    mappedData[name] = Array.from({ length: numSamples }, () =>
      new Array(targetTotalChannels).fill(0)
    );
  }

  // 通道映射 - 将源阵列分区映射到各手指区域
  const channelMapping: Array<{
    source: [number, number];
    target: [number, number];
    finger: string;
  }> = [];

  // 将源数据均匀分配到各手指区域
  const sourceTotalChannels = sourceRows * sourceCols;
  const channelsPerFinger = Math.floor(sourceTotalChannels / targetConfig.fingerCount);

  for (let fi = 0; fi < targetConfig.tactileZones.length; fi++) {
    const zone = targetConfig.tactileZones[fi];
    const zoneChannels = zone.rows * zone.cols;

    // 源区域（从源阵列中均匀采样）
    const sourceStart = fi * channelsPerFinger;
    const sourceEnd = fi === targetConfig.tactileZones.length - 1
      ? sourceTotalChannels
      : (fi + 1) * channelsPerFinger;
    const sourceCount = sourceEnd - sourceStart;

    // 双线性插值映射
    for (let t = 0; t < numSamples; t++) {
      for (let zc = 0; zc < zoneChannels; zc++) {
        const targetRow = Math.floor(zc / zone.cols);
        const targetCol = zc % zone.cols;

        // 归一化目标坐标 [0, 1]
        const normR = zone.rows > 1 ? targetRow / (zone.rows - 1) : 0.5;
        const normC = zone.cols > 1 ? targetCol / (zone.cols - 1) : 0.5;

        // 映射到源坐标
        const sourceR = normR * (sourceRows - 1);
        const sourceC = normC * (sourceCols - 1);

        // 双线性插值
        const r0 = Math.floor(sourceR);
        const r1 = Math.min(r0 + 1, sourceRows - 1);
        const c0 = Math.floor(sourceC);
        const c1 = Math.min(c0 + 1, sourceCols - 1);

        const dr = sourceR - r0;
        const dc = sourceC - c0;

        for (const name of SEMANTIC_FEATURE_NAMES) {
          const srcData = sourceData.data[name][t];
          const v00 = srcData[r0 * sourceCols + c0] || 0;
          const v01 = srcData[r0 * sourceCols + c1] || 0;
          const v10 = srcData[r1 * sourceCols + c0] || 0;
          const v11 = srcData[r1 * sourceCols + c1] || 0;

          const value = v00 * (1 - dr) * (1 - dc)
            + v01 * (1 - dr) * dc
            + v10 * dr * (1 - dc)
            + v11 * dr * dc;

          mappedData[name][t][zone.channelOffset + zc] = value;
        }

        // 记录映射关系（只记录第一个时间步）
        if (t === 0) {
          const srcIdx = Math.floor(sourceStart + (zc / zoneChannels) * sourceCount);
          const srcRow = Math.floor(srcIdx / sourceCols);
          const srcCol = srcIdx % sourceCols;
          channelMapping.push({
            source: [srcRow, srcCol],
            target: [targetRow + Math.floor(zone.channelOffset / zone.cols), targetCol + zone.channelOffset % zone.cols],
            finger: zone.fingerName,
          });
        }
      }
    }
  }

  // 构建映射后的通道列表
  const mappedChannels = [];
  for (const zone of targetConfig.tactileZones) {
    for (let r = 0; r < zone.rows; r++) {
      for (let c = 0; c < zone.cols; c++) {
        mappedChannels.push({
          row: r,
          col: c,
          index: zone.channelOffset + r * zone.cols + c,
        });
      }
    }
  }

  // 构建输出
  const result: TLabelData = {
    version: sourceData.version,
    sensor_type: `dexterous_hand_${targetHandId}`,
    channels: mappedChannels,
    rows: targetConfig.tactileZones[0]?.rows || sourceData.rows,
    cols: targetTotalChannels,
    timestamps: sourceData.timestamps,
    sample_rate: sourceData.sample_rate,
    data: mappedData,
    metadata: {
      ...sourceData.metadata,
      source_format: `tlabel_mapped_from_${sourceData.metadata.source_format}`,
      raw_channel_count: targetTotalChannels,
    },
  };

  return {
    sourceHand: 'generic_array',
    targetHand: targetHandId,
    targetConfig,
    mappedData: result,
    mappingInfo: {
      interpolation_method: 'bilinear',
      channel_mapping: channelMapping.slice(0, 50), // 限制大小
      total_source_channels: sourceTotalChannels,
      total_target_channels: targetTotalChannels,
    },
  };
}

/**
 * 解析 URDF 文件提取关节信息
 */
export function parseURDFInfo(urdfContent: string): {
  jointCount: number;
  linkCount: number;
  joints: Array<{ name: string; type: string }>;
} {
  // 简单的 URDF 解析 - 提取关节和链接信息
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

  return {
    jointCount: joints.length,
    linkCount: links.length,
    joints,
  };
}
