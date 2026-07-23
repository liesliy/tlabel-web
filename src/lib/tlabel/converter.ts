import {
  TLabelData,
  TLabelSemanticFeatures,
  TLabelChannel,
  ParsedRawData,
  SEMANTIC_FEATURE_NAMES,
} from './types';

/**
 * 将原始 NxM 通道数据转换为 TLabel 22维语义特征
 */
export function convertToTLabel(
  rawData: ParsedRawData,
  sourceFile: string
): TLabelData {
  const { timestamps, channelData, rows, cols, sampleRate, forceData } = rawData;
  const totalChannels = rows * cols;
  const numSamples = timestamps.length;

  // 构建通道列表
  const channels: TLabelChannel[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      channels.push({
        row: r,
        col: c,
        index: r * cols + c,
      });
    }
  }

  // 初始化22维特征
  const data: TLabelSemanticFeatures = {} as TLabelSemanticFeatures;
  for (const name of SEMANTIC_FEATURE_NAMES) {
    data[name] = Array.from({ length: numSamples }, () =>
      new Array(totalChannels).fill(0)
    );
  }

  // 计算每个特征的数值
  for (let t = 0; t < numSamples; t++) {
    const rawFrame = channelData[t] || [];
    const prevFrame = t > 0 ? channelData[t - 1] : rawFrame;

    // 归一化到 [0, 1]
    const maxVal = Math.max(...rawFrame.map(Math.abs), 1);
    const normalized = rawFrame.map(v => Math.max(0, Math.min(1, v / maxVal)));

    for (let ch = 0; ch < totalChannels; ch++) {
      const raw = rawFrame[ch] || 0;
      const prev = prevFrame[ch] || 0;
      const norm = normalized[ch];

      // 1. contact: 接触状态 (阈值化)
      data.contact[t][ch] = norm > 0.15 ? 1.0 : norm / 0.15;

      // 2. slip: 滑动检测 (时间差分)
      const diff = Math.abs(raw - prev);
      data.slip[t][ch] = Math.min(1, diff / (maxVal * 0.3));

      // 3. texture: 纹理特征 (高频成分估计)
      const highFreq = t >= 2
        ? Math.abs(rawFrame[ch] - 2 * (prevFrame[ch] || 0) + (channelData[t - 2]?.[ch] || 0))
        : 0;
      data.texture[t][ch] = Math.min(1, highFreq / (maxVal * 0.5));

      // 4. pressure: 压力分布 (归一化原始值)
      data.pressure[t][ch] = norm;

      // 5. temperature_delta: 温度变化 (低频漂移)
      const windowSize = Math.min(10, t + 1);
      let avg = 0;
      for (let w = 0; w < windowSize; w++) {
        avg += (channelData[t - w]?.[ch] || 0);
      }
      avg /= windowSize;
      data.temperature_delta[t][ch] = (raw - avg) * 0.1;

      // 6-8. 力数据 (如果有外部力传感器)
      if (forceData.length > t && forceData[t].length >= 3) {
        const totalForce = Math.sqrt(
          forceData[t][0] ** 2 + forceData[t][1] ** 2 + forceData[t][2] ** 2
        );
        const weight = norm / Math.max(totalChannels, 1);
        data.force_normal[t][ch] = forceData[t][2] * weight;
        data.force_shear_x[t][ch] = forceData[t][0] * weight;
        data.force_shear_y[t][ch] = forceData[t][1] * weight;
      } else {
        data.force_normal[t][ch] = raw * 0.5;
        data.force_shear_x[t][ch] = diff * 0.2;
        data.force_shear_y[t][ch] = diff * 0.15;
      }

      // 9. contact_area: 接触面积 (邻域激活比例)
      let activeNeighbors = 0;
      const r = Math.floor(ch / cols);
      const c = ch % cols;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
            const nIdx = nr * cols + nc;
            if (normalized[nIdx] > 0.15) activeNeighbors++;
          }
        }
      }
      data.contact_area[t][ch] = activeNeighbors / 9;

      // 10-11. centroid: 接触中心
      data.centroid_x[t][ch] = (c / Math.max(cols - 1, 1)) * norm;
      data.centroid_y[t][ch] = (r / Math.max(rows - 1, 1)) * norm;

      // 12. curvature: 曲率 (二阶空间导数)
      let laplacian = 0;
      let count = 0;
      for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
          laplacian += normalized[nr * cols + nc];
          count++;
        }
      }
      data.curvature[t][ch] = count > 0
        ? Math.abs(normalized[ch] - laplacian / count) * 2
        : 0;

      // 13-14. vibration: 振动特征
      if (t >= 4) {
        const window = [t - 4, t - 3, t - 2, t - 1, t].map(i => channelData[i]?.[ch] || 0);
        const mean = window.reduce((a, b) => a + b, 0) / window.length;
        const variance = window.reduce((a, b) => a + (b - mean) ** 2, 0) / window.length;
        data.vibration_freq[t][ch] = Math.min(1000, Math.sqrt(variance) * sampleRate * 0.1);
        data.vibration_amplitude[t][ch] = Math.min(1, Math.sqrt(variance) / maxVal);
      }

      // 15. strain_rate: 应变率
      data.strain_rate[t][ch] = (raw - prev) * sampleRate;

      // 16-18. stress tensor
      data.stress_xx[t][ch] = data.force_normal[t][ch] * 0.8;
      data.stress_yy[t][ch] = data.force_normal[t][ch] * 0.6;
      data.stress_xy[t][ch] = data.force_shear_x[t][ch] * 0.5;

      // 19. moisture: 湿度 (从低频信号估计)
      data.moisture[t][ch] = Math.max(0, Math.min(1, norm * 0.3 + 0.1));

      // 20. hardness: 硬度估计 (压力/形变比)
      data.hardness[t][ch] = Math.min(1, norm / Math.max(data.deformation[t]?.[ch] || 0.1, 0.01));

      // 21. deformation: 形变量
      data.deformation[t][ch] = norm * 2.0; // mm

      // 22. confidence: 置信度
      data.confidence[t][ch] = norm > 0.05 ? Math.min(1, norm * 1.5) : norm * 2;
    }
  }

  // 构建输出
  const duration = timestamps.length > 0
    ? timestamps[timestamps.length - 1] - timestamps[0]
    : 0;

  const tlabelData: TLabelData = {
    version: '1.0',
    sensor_type: 'high_density_array',
    channels,
    rows,
    cols,
    timestamps,
    sample_rate: sampleRate,
    data,
    metadata: {
      source_format: 'csv',
      source_file: sourceFile,
      created_at: new Date().toISOString(),
      total_samples: numSamples,
      duration_seconds: duration,
      raw_channel_count: totalChannels,
      joint_count: rawData.jointData[0]?.length || 0,
      has_force_data: forceData.length > 0,
    },
  };

  return tlabelData;
}

/**
 * 将 TLabel 数据序列化为 JSON 字符串
 */
export function serializeTLabel(data: TLabelData): string {
  return JSON.stringify(data, null, 2);
}
