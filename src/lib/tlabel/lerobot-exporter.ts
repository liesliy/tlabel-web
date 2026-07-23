import { TLabelData, SEMANTIC_FEATURE_NAMES } from './types';

/**
 * LeRobot 数据集格式定义
 * 参考 HuggingFace LeRobot 标准格式
 */
export interface LeRobotDataset {
  info: LeRobotInfo;
  episodes: LeRobotEpisode[];
  stats: Record<string, LeRobotStats>;
}

export interface LeRobotInfo {
  codebase_version: string;
  dataset_id: string;
  total_episodes: number;
  total_frames: number;
  total_tasks: number;
  fps: number;
  chunks_size: number;
  robot_type: string;
  features: Record<string, LeRobotFeature>;
}

export interface LeRobotFeature {
  dtype: string;
  shape: number[];
  names: string[] | null;
  video_info: null;
}

export interface LeRobotStats {
  mean: number[];
  std: number[];
  min: number[];
  max: number[];
}

export interface LeRobotEpisode {
  episode_id: number;
  tasks: string[];
  length: number;
}

/**
 * 将 TLabel 数据导出为 LeRobot 格式
 */
export function exportToLeRobot(
  tlabelData: TLabelData,
  datasetName: string = 'tlabel_dataset',
  robotType: string = 'custom'
): LeRobotDataset {
  const numSamples = tlabelData.timestamps.length;
  const totalChannels = tlabelData.channels.length;

  // 构建特征定义
  const features: Record<string, LeRobotFeature> = {
    'observation.timestamp': {
      dtype: 'float32',
      shape: [1],
      names: ['timestamp'],
      video_info: null,
    },
    'observation.tactile': {
      dtype: 'float32',
      shape: [totalChannels],
      names: tlabelData.channels.map(ch => `ch_${ch.row}_${ch.col}`),
      video_info: null,
    },
  };

  // 添加语义特征
  for (const featureName of SEMANTIC_FEATURE_NAMES) {
    features[`observation.semantic.${featureName}`] = {
      dtype: 'float32',
      shape: [totalChannels],
      names: tlabelData.channels.map(ch => `${featureName}_ch${ch.index}`),
      video_info: null,
    };
  }

  // 添加关节数据
  if (tlabelData.metadata.joint_count > 0) {
    features['observation.joints'] = {
      dtype: 'float32',
      shape: [tlabelData.metadata.joint_count],
      names: Array.from({ length: tlabelData.metadata.joint_count }, (_, i) => `joint_${i + 1}`),
      video_info: null,
    };
  }

  // 添加力数据
  if (tlabelData.metadata.has_force_data) {
    features['observation.force'] = {
      dtype: 'float32',
      shape: [3],
      names: ['force_x', 'force_y', 'force_z'],
      video_info: null,
    };
  }

  // action 特征 (关节作为动作空间)
  if (tlabelData.metadata.joint_count > 0) {
    features['action'] = {
      dtype: 'float32',
      shape: [tlabelData.metadata.joint_count],
      names: Array.from({ length: tlabelData.metadata.joint_count }, (_, i) => `action_joint_${i + 1}`),
      video_info: null,
    };
  }

  // 计算统计信息
  const stats: Record<string, LeRobotStats> = {};

  // 触觉数据统计
  const tactileStats = computeStats(tlabelData.data.pressure);
  stats['observation.tactile'] = tactileStats;

  // 时间戳统计
  stats['observation.timestamp'] = {
    mean: [tlabelData.timestamps.reduce((a, b) => a + b, 0) / numSamples],
    std: [computeStd(tlabelData.timestamps)],
    min: [tlabelData.timestamps[0] || 0],
    max: [tlabelData.timestamps[numSamples - 1] || 0],
  };

  // 语义特征统计
  for (const featureName of SEMANTIC_FEATURE_NAMES) {
    stats[`observation.semantic.${featureName}`] = computeStats(tlabelData.data[featureName]);
  }

  // 构建 episodes
  const episodes: LeRobotEpisode[] = [{
    episode_id: 0,
    tasks: ['tactile_data_collection'],
    length: numSamples,
  }];

  return {
    info: {
      codebase_version: '2.0',
      dataset_id: datasetName,
      total_episodes: 1,
      total_frames: numSamples,
      total_tasks: 1,
      fps: tlabelData.sample_rate,
      chunks_size: 1000,
      robot_type: robotType,
      features,
    },
    episodes,
    stats,
  };
}

/**
 * 生成 LeRobot 格式的数据文件内容 (JSON Lines)
 */
export function generateLeRobotDataLines(tlabelData: TLabelData): string {
  const lines: string[] = [];
  const numSamples = tlabelData.timestamps.length;
  const totalChannels = tlabelData.channels.length;

  for (let t = 0; t < numSamples; t++) {
    const frame: Record<string, unknown> = {
      'episode_index': 0,
      'frame_index': t,
      'timestamp': tlabelData.timestamps[t],
      // 使用原始通道数据（如果有），否则回退到 pressure
      'observation.tactile': tlabelData.rawChannelData?.[t] || tlabelData.data.pressure[t],
    };

    // 添加语义特征
    for (const featureName of SEMANTIC_FEATURE_NAMES) {
      frame[\`observation.semantic.\${featureName}\`] = tlabelData.data[featureName][t];
    }

    // 添加关节数据作为 observation
    if (tlabelData.jointData && tlabelData.jointData[t]) {
      frame['observation.joints'] = tlabelData.jointData[t];
      // action: 使用关节角度作为 target position（与 observation.joints 相同）
      frame['action'] = tlabelData.jointData[t];
    }

    // 添加力数据（如果有）
    if (tlabelData.metadata.has_force_data) {
      // 从 force_normal/shear 重构力数据
      const forceNormal = tlabelData.data.force_normal[t];
      const forceShearX = tlabelData.data.force_shear_x[t];
      const forceShearY = tlabelData.data.force_shear_y[t];
      // 取第一个通道的力值作为整体力估计
      const fx = forceShearX[0] || 0;
      const fy = forceShearY[0] || 0;
      const fz = forceNormal[0] || 0;
      frame['observation.force'] = [fx, fy, fz];
    }

    // 添加 index 和 next.done
    frame['index'] = t;
    frame['next.done'] = t === numSamples - 1;

    lines.push(JSON.stringify(frame));
  }

  return lines.join('\n');
}

/**
 * 生成 LeRobot 数据集的完整目录结构描述
 */
export function generateLeRobotStructure(datasetName: string): {
  files: Array<{ path: string; description: string }>;
} {
  return {
    files: [
      { path: `${datasetName}/meta/info.json`, description: '数据集元信息' },
      { path: `${datasetName}/meta/tasks.json`, description: '任务定义' },
      { path: `${datasetName}/meta/episodes.jsonl`, description: 'Episode 列表' },
      { path: `${datasetName}/meta/stats.json`, description: '数据统计信息' },
      { path: `${datasetName}/data/chunk-000/episode_000000.parquet`, description: '数据文件 (JSON Lines 替代)' },
    ],
  };
}

// Helper functions
function computeStats(data: number[][]): LeRobotStats {
  const numSamples = data.length;
  const numChannels = data[0]?.length || 0;

  if (numSamples === 0 || numChannels === 0) {
    return { mean: [0], std: [0], min: [0], max: [0] };
  }

  const mean: number[] = new Array(numChannels).fill(0);
  const min: number[] = new Array(numChannels).fill(Infinity);
  const max: number[] = new Array(numChannels).fill(-Infinity);

  for (let t = 0; t < numSamples; t++) {
    for (let c = 0; c < numChannels; c++) {
      const v = data[t][c] || 0;
      mean[c] += v;
      min[c] = Math.min(min[c], v);
      max[c] = Math.max(max[c], v);
    }
  }

  for (let c = 0; c < numChannels; c++) {
    mean[c] /= numSamples;
  }

  const std: number[] = new Array(numChannels).fill(0);
  for (let t = 0; t < numSamples; t++) {
    for (let c = 0; c < numChannels; c++) {
      std[c] += (data[t][c] - mean[c]) ** 2;
    }
  }
  for (let c = 0; c < numChannels; c++) {
    std[c] = Math.sqrt(std[c] / numSamples);
  }

  // 如果通道太多，只返回前10个通道的统计
  if (numChannels > 10) {
    return {
      mean: mean.slice(0, 10),
      std: std.slice(0, 10),
      min: min.slice(0, 10),
      max: max.slice(0, 10),
    };
  }

  return { mean, std, min, max };
}

function computeStd(values: number[]): number {
  const n = values.length;
  if (n === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
  return Math.sqrt(variance);
}
