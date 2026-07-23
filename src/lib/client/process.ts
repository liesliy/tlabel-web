import { parseCSV } from '@/lib/tlabel/csv-parser';
import { convertToTLabel, serializeTLabel } from '@/lib/tlabel/converter';
import { mapToDexterousHand, HAND_CONFIGS } from '@/lib/tlabel/urdf-mapper';
import { exportToLeRobot, generateLeRobotDataLines, generateLeRobotStructure, type LeRobotInfo, type LeRobotStats } from '@/lib/tlabel/lerobot-exporter';

export interface ProcessOptions {
  targetHand?: string;
  exportLeRobot?: boolean;
  datasetName?: string;
  robotType?: string;
}

export interface ProcessStep {
  name: string;
  status: 'completed' | 'error' | 'skipped';
  detail: string;
}

export interface ProcessResult {
  success: boolean;
  steps: ProcessStep[];
  tlabel: {
    json: string;
    metadata: {
      source_format: string;
      source_file: string;
      created_at: string;
      total_samples: number;
      duration_seconds: number;
      raw_channel_count: number;
      joint_count: number;
      has_force_data: boolean;
    };
    channelCount: number;
    rows: number;
    cols: number;
    sampleCount: number;
    sampleRate: number;
    featureCount: number;
  };
  urdfMapping: {
    targetHand: string;
    targetChannels: number;
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
  } | null;
  lerobot: {
    info: LeRobotInfo;
    stats: Record<string, LeRobotStats>;
    dataLines: string;
    structure: {
      files: Array<{ path: string; description: string }>;
    };
  } | null;
  processedAt: string;
}

export function processTLabelData(
  fileName: string,
  fileContent: string,
  options: ProcessOptions = {}
): ProcessResult {
  const steps: ProcessStep[] = [];

  // Step 1: 解析原始数据
  let rawData;
  try {
    rawData = parseCSV(fileContent, fileName);
    steps.push({
      name: '数据解析',
      status: 'completed',
      detail: `识别到 ${rawData.rows}x${rawData.cols} 阵列, ${rawData.timestamps.length} 个采样点, 采样率 ${rawData.sampleRate}Hz`,
    });
  } catch (err) {
    steps.push({
      name: '数据解析',
      status: 'error',
      detail: `解析失败: ${err instanceof Error ? err.message : '未知错误'}`,
    });
    throw new Error('数据解析失败: ' + (err instanceof Error ? err.message : '未知错误'));
  }

  // Step 2: 转换为 TLabel 标准格式
  let tlabelData;
  try {
    tlabelData = convertToTLabel(rawData, fileName);
    steps.push({
      name: 'TLabel 标准化',
      status: 'completed',
      detail: `已转换为 22 维语义特征, ${tlabelData.channels.length} 个通道`,
    });
  } catch (err) {
    steps.push({
      name: 'TLabel 标准化',
      status: 'error',
      detail: `转换失败: ${err instanceof Error ? err.message : '未知错误'}`,
    });
    throw new Error('TLabel转换失败: ' + (err instanceof Error ? err.message : '未知错误'));
  }

  // Step 3: 可选 - 灵巧手映射
  let mappedResult = null;
  if (options.targetHand && options.targetHand !== 'none') {
    try {
      mappedResult = mapToDexterousHand(tlabelData, options.targetHand);
      const handConfig = HAND_CONFIGS[options.targetHand];
      steps.push({
        name: '灵巧手映射',
        status: 'completed',
        detail: `已映射到 ${handConfig?.name || options.targetHand}, ${mappedResult.mappingInfo.total_target_channels} 个触觉通道`,
      });
    } catch (err) {
      steps.push({
        name: '灵巧手映射',
        status: 'error',
        detail: `映射失败: ${err instanceof Error ? err.message : '未知错误'}`,
      });
    }
  } else {
    steps.push({
      name: '灵巧手映射',
      status: 'skipped',
      detail: '未选择目标灵巧手，跳过映射',
    });
  }

  // Step 4: 可选 - LeRobot 导出
  let lerobotData = null;
  let lerobotLines = null;
  let lerobotStructure = null;
  if (options.exportLeRobot) {
    try {
      const sourceData = mappedResult ? mappedResult.mappedData : tlabelData;
      lerobotData = exportToLeRobot(sourceData, options.datasetName || 'tlabel_export', options.robotType || 'custom');
      lerobotLines = generateLeRobotDataLines(sourceData);
      lerobotStructure = generateLeRobotStructure(options.datasetName || 'tlabel_export');
      steps.push({
        name: 'LeRobot 导出',
        status: 'completed',
        detail: `已生成 LeRobot 数据集, ${lerobotData.info.total_frames} 帧数据`,
      });
    } catch (err) {
      steps.push({
        name: 'LeRobot 导出',
        status: 'error',
        detail: `导出失败: ${err instanceof Error ? err.message : '未知错误'}`,
      });
    }
  } else {
    steps.push({
      name: 'LeRobot 导出',
      status: 'skipped',
      detail: '未启用 LeRobot 导出',
    });
  }

  // 构建响应
  return {
    success: true,
    steps,
    tlabel: {
      json: serializeTLabel(tlabelData),
      metadata: tlabelData.metadata,
      channelCount: tlabelData.channels.length,
      rows: tlabelData.rows,
      cols: tlabelData.cols,
      sampleCount: tlabelData.timestamps.length,
      sampleRate: tlabelData.sample_rate,
      featureCount: 22,
    },
    urdfMapping: mappedResult ? {
      targetHand: mappedResult.targetConfig.name,
      targetChannels: mappedResult.mappingInfo.total_target_channels,
      mappingInfo: mappedResult.mappingInfo,
    } : null,
    lerobot: lerobotData ? {
      info: lerobotData.info,
      stats: lerobotData.stats,
      dataLines: lerobotLines || '',
      structure: lerobotStructure || { files: [] },
    } : null,
    processedAt: new Date().toISOString(),
  };
}
