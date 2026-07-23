import Papa from 'papaparse';
import { ParsedRawData } from './types';

/**
 * 解析 CSV 格式的触觉数据
 * 支持格式: timestamp, ch_0_0, ch_0_1, ..., ch_N_M, joint_1, ..., force_x, force_y, force_z
 */
export function parseCSV(content: string, fileName: string): ParsedRawData {
  const result = Papa.parse(content, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
  });

  if (result.errors.length > 0 && result.data.length === 0) {
    throw new Error(`CSV解析失败: ${result.errors[0].message}`);
  }

  const headers = result.meta.fields || [];
  const rows = result.data as Record<string, number>[];

  if (rows.length === 0) {
    throw new Error('CSV文件为空');
  }

  // 分类列
  const timestampCol = headers.find(h => h.toLowerCase().includes('time'));
  const channelCols = headers.filter(h => /^ch_\d+_\d+$/i.test(h));
  const jointCols = headers.filter(h => /^joint_\d+$/i.test(h) || /^joint\d+$/i.test(h));
  const forceCols = headers.filter(h => /^force_[xyz]$/i.test(h));

  // 如果没有命名通道列，尝试推断
  let detectedChannelCols = channelCols;
  let detectedRows = 0;
  let detectedCols = 0;

  if (channelCols.length > 0) {
    // 从列名提取行列信息
    const indices = channelCols.map(c => {
      const match = c.match(/ch_(\d+)_(\d+)/i);
      return match ? { row: parseInt(match[1]), col: parseInt(match[2]) } : null;
    }).filter(Boolean) as { row: number; col: number }[];

    detectedRows = Math.max(...indices.map(i => i.row)) + 1;
    detectedCols = Math.max(...indices.map(i => i.col)) + 1;
  } else {
    // 尝试推断通道数 - 排除时间戳、关节和力数据列
    const dataCols = headers.filter(h =>
      !h.toLowerCase().includes('time') &&
      !h.toLowerCase().includes('joint') &&
      !h.toLowerCase().includes('force')
    );

    detectedChannelCols = dataCols;
    const total = dataCols.length;
    // 尝试找到最接近的方阵
    const sqrt = Math.round(Math.sqrt(total));
    if (sqrt * sqrt === total) {
      detectedRows = sqrt;
      detectedCols = sqrt;
    } else {
      // 尝试常见阵列配置
      const configs = [
        [4, 4], [4, 8], [8, 8], [8, 16], [16, 16],
        [4, 16], [2, 10], [5, 5], [10, 10],
      ];
      const match = configs.find(([r, c]) => r * c === total);
      if (match) {
        [detectedRows, detectedCols] = match;
      } else {
        detectedRows = 1;
        detectedCols = total;
      }
    }
  }

  // 提取数据
  const timestamps: number[] = [];
  const channelData: number[][] = [];
  const jointData: number[][] = [];
  const forceData: number[][] = [];

  for (const row of rows) {
    // 时间戳
    const ts = timestampCol ? (row[timestampCol] as number) || 0 : timestamps.length * 0.01;
    timestamps.push(ts);

    // 通道数据
    const chValues = detectedChannelCols.map(c => {
      const val = row[c];
      return typeof val === 'number' ? val : 0;
    });
    channelData.push(chValues);

    // 关节数据
    const jValues = jointCols.map(c => {
      const val = row[c];
      return typeof val === 'number' ? val : 0;
    });
    jointData.push(jValues);

    // 力数据
    if (forceCols.length >= 3) {
      const fValues = forceCols.map(c => {
        const val = row[c];
        return typeof val === 'number' ? val : 0;
      });
      forceData.push(fValues);
    }
  }

  // 计算采样率
  let sampleRate = 100; // 默认100Hz
  if (timestamps.length > 1) {
    const dt = (timestamps[timestamps.length - 1] - timestamps[0]) / (timestamps.length - 1);
    if (dt > 0) {
      sampleRate = Math.round(1 / dt);
    }
  }

  return {
    timestamps,
    channelData,
    jointData,
    forceData,
    rows: detectedRows,
    cols: detectedCols,
    sampleRate,
    channelNames: detectedChannelCols,
  };
}

/**
 * 生成示例 CSV 数据用于测试
 */
export function generateSampleCSV(rows: number = 4, cols: number = 4, samples: number = 100): string {
  const headers: string[] = ['timestamp'];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      headers.push(`ch_${r}_${c}`);
    }
  }
  for (let j = 1; j <= 6; j++) {
    headers.push(`joint_${j}`);
  }
  headers.push('force_x', 'force_y', 'force_z');

  const dataRows: string[] = [headers.join(',')];

  for (let t = 0; t < samples; t++) {
    const timestamp = (t * 0.01).toFixed(4);
    const values: string[] = [timestamp];

    // 通道数据 - 模拟触觉模式
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const dist = Math.sqrt(
          Math.pow(r - rows / 2, 2) + Math.pow(c - cols / 2, 2)
        );
        const phase = t * 0.1 + dist * 0.5;
        const value = Math.max(0, Math.sin(phase) * 0.5 + 0.3 + Math.random() * 0.1);
        values.push(value.toFixed(4));
      }
    }

    // 关节数据
    for (let j = 0; j < 6; j++) {
      const angle = Math.sin(t * 0.05 + j * 0.3) * 30;
      values.push(angle.toFixed(2));
    }

    // 力数据
    const fx = (Math.sin(t * 0.08) * 2 + Math.random() * 0.5).toFixed(3);
    const fy = (Math.cos(t * 0.06) * 1.5 + Math.random() * 0.3).toFixed(3);
    const fz = (5 + Math.sin(t * 0.04) * 2 + Math.random() * 0.2).toFixed(3);
    values.push(fx, fy, fz);

    dataRows.push(values.join(','));
  }

  return dataRows.join('\n');
}
