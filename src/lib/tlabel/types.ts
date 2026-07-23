/**
 * TLabel 标准格式定义
 * 22维语义特征 Schema
 */

export interface TLabelChannel {
  row: number;
  col: number;
  index: number;
}

export interface TLabelSemanticFeatures {
  /** 接触状态 [0-1] */
  contact: number[][];
  /** 滑动检测 [0-1] */
  slip: number[][];
  /** 纹理特征 [0-1] */
  texture: number[][];
  /** 压力分布 (归一化) [0-1] */
  pressure: number[][];
  /** 温度变化 (delta) */
  temperature_delta: number[][];
  /** 法向力 (N) */
  force_normal: number[][];
  /** 切向力 X (N) */
  force_shear_x: number[][];
  /** 切向力 Y (N) */
  force_shear_y: number[][];
  /** 接触面积 (mm²) */
  contact_area: number[][];
  /** 接触中心 X (mm) */
  centroid_x: number[][];
  /** 接触中心 Y (mm) */
  centroid_y: number[][];
  /** 曲率半径 (mm) */
  curvature: number[][];
  /** 振动频率 (Hz) */
  vibration_freq: number[][];
  /** 振动幅度 */
  vibration_amplitude: number[][];
  /** 应变率 */
  strain_rate: number[][];
  /** 应力张量 xx */
  stress_xx: number[][];
  /** 应力张量 yy */
  stress_yy: number[][];
  /** 应力张量 xy */
  stress_xy: number[][];
  /** 湿度 [0-1] */
  moisture: number[][];
  /** 硬度估计 [0-1] */
  hardness: number[][];
  /** 形变量 (mm) */
  deformation: number[][];
  /** 置信度 [0-1] */
  confidence: number[][];
}

export interface TLabelData {
  version: string;
  sensor_type: string;
  channels: TLabelChannel[];
  rows: number;
  cols: number;
  timestamps: number[];
  sample_rate: number;
  data: TLabelSemanticFeatures;
  /** 原始关节数据 [time][joint] - 用于 LeRobot action 生成 */
  jointData?: number[][];
  /** 原始通道数据 [time][channel] - 用于 LeRobot observation.tactile */
  rawChannelData?: number[][];
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
}

export interface ParsedRawData {
  timestamps: number[];
  channelData: number[][]; // [time][channel]
  jointData: number[][];   // [time][joint]
  forceData: number[][];   // [time][3] (fx, fy, fz) or empty
  rows: number;
  cols: number;
  sampleRate: number;
  channelNames: string[];
}

export const SEMANTIC_FEATURE_NAMES: (keyof TLabelSemanticFeatures)[] = [
  'contact', 'slip', 'texture', 'pressure', 'temperature_delta',
  'force_normal', 'force_shear_x', 'force_shear_y', 'contact_area',
  'centroid_x', 'centroid_y', 'curvature', 'vibration_freq',
  'vibration_amplitude', 'strain_rate', 'stress_xx', 'stress_yy',
  'stress_xy', 'moisture', 'hardness', 'deformation', 'confidence',
];
