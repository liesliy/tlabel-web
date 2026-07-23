'use client';

import React, { useState, useCallback } from 'react';
import {
  Card,
  Upload,
  Button,
  Steps,
  Typography,
  Space,
  Tag,
  Alert,
  Divider,
  Select,
  Switch,
  Input,
  message,
  Descriptions,
  Progress,
  Collapse,
} from 'antd';
import {
  InboxOutlined,
  FileTextOutlined,
  ThunderboltOutlined,
  RobotOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
  ExperimentOutlined,
} from '@ant-design/icons';
import JSZip from 'jszip';
import { processTLabelData, type ProcessResult } from '@/lib/client/process';
import { addHistoryEntry } from '@/lib/client/history';

const { Title, Text, Paragraph } = Typography;
const { Dragger } = Upload;
const { Panel } = Collapse;

export default function UploadPage() {
  const [fileContent, setFileContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [targetHand, setTargetHand] = useState<string>('none');
  const [exportLeRobot, setExportLeRobot] = useState(true);
  const [datasetName, setDatasetName] = useState('tlabel_dataset');
  const [currentStep, setCurrentStep] = useState(0);

  const handleFileUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setFileContent(content);
      setFileName(file.name);
      setResult(null);
      setCurrentStep(0);
    };
    reader.readAsText(file);
    return false; // prevent default upload
  }, []);

  const handleDownloadSample = useCallback(() => {
    // 从 public 目录下载示例文件
    const link = document.createElement('a');
    link.href = '/sample_tactile_4x4.csv';
    link.download = 'sample_tactile_4x4.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    message.success('示例文件已下载');
  }, []);

  const handleProcess = useCallback(async () => {
    if (!fileContent) {
      message.warning('请先上传数据文件');
      return;
    }

    setProcessing(true);
    setResult(null);
    setCurrentStep(1);

    try {
      // 模拟步骤进度
      const stepTimer = setTimeout(() => setCurrentStep(2), 800);

      // 使用客户端处理函数
      const data = processTLabelData(fileName, fileContent, {
        targetHand: targetHand !== 'none' ? targetHand : undefined,
        exportLeRobot,
        datasetName,
      });

      clearTimeout(stepTimer);
      setCurrentStep(3);

      if (data.success) {
        setResult(data);
        setCurrentStep(4);
        message.success('数据处理完成');

        // 记录到历史
        addHistoryEntry({
          fileName,
          status: 'completed',
          channelCount: data.tlabel.channelCount,
          sampleRate: data.tlabel.sampleRate,
          sampleCount: data.tlabel.sampleCount,
          targetHand: targetHand !== 'none' ? targetHand : null,
          exportLeRobot,
        });
      } else {
        setResult(data);
      }
    } catch (err) {
      message.error(`处理出错: ${err instanceof Error ? err.message : '未知错误'}`);
    } finally {
      setProcessing(false);
    }
  }, [fileContent, fileName, targetHand, exportLeRobot, datasetName]);

  const handleDownloadTLabel = useCallback(() => {
    if (!result?.tlabel?.json) return;
    const blob = new Blob([result.tlabel.json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName.replace(/\.[^.]+$/, '')}_tlabel.json`;
    a.click();
    URL.revokeObjectURL(url);
    message.success('TLabel JSON 已下载');
  }, [result, fileName]);

  const handleDownloadLeRobot = useCallback(async () => {
    if (!result?.lerobot?.dataLines) return;
    
    try {
      const zip = new JSZip();
      const dsName = datasetName || 'tlabel_dataset';
      
      // meta 文件
      zip.folder('meta')!.file('info.json', JSON.stringify(result.lerobot.info, null, 2));
      zip.folder('meta')!.file('stats.json', JSON.stringify(result.lerobot.stats, null, 2));
      const tasks = { tasks: [{ task: 'tactile_data_collection', task_index: 0 }] };
      zip.folder('meta')!.file('tasks.json', JSON.stringify(tasks, null, 2));
      const episodes = [{ episode_index: 0, tasks: [0], length: result.lerobot.info.total_frames }];
      zip.folder('meta')!.file('episodes.jsonl', episodes.map(e => JSON.stringify(e)).join('\n'));
      
      // 数据文件
      zip.folder('data')!.folder('chunk-000')!.file('episode_000000.jsonl', result.lerobot.dataLines);
      
      // 打包下载
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${dsName}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      message.success('LeRobot 完整数据集已下载（含 meta 文件）');
    } catch (err) {
      console.error('ZIP 打包失败:', err);
      const blob = new Blob([result!.lerobot!.dataLines], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${datasetName}_data.jsonl`;
      a.click();
      URL.revokeObjectURL(url);
      message.warning('ZIP 打包失败，已降级为仅下载数据文件');
    }
  }, [result, datasetName]);

  const steps = [
    { title: '上传文件', icon: <InboxOutlined /> },
    { title: '数据解析', icon: <FileTextOutlined /> },
    { title: '格式转换', icon: <ThunderboltOutlined /> },
    { title: '导出结果', icon: <DownloadOutlined /> },
  ];

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24, fontWeight: 600 }}>
        数据上传与处理
      </Title>

      <Steps
        current={currentStep}
        items={steps.map((item, idx) => ({
          key: idx,
          title: item.title,
          icon: processing && idx === currentStep ? <LoadingOutlined /> : item.icon,
        }))}
        style={{ marginBottom: 32 }}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* 左侧 - 上传区域 */}
        <div>
          <Card
            title={
              <Space>
                <InboxOutlined style={{ color: '#00b8d9' }} />
                <span>触觉数据文件</span>
              </Space>
            }
            style={{ marginBottom: 16 }}
          >
            <Dragger
              accept=".csv,.txt"
              showUploadList={false}
              beforeUpload={handleFileUpload}
              disabled={processing}
              className="upload-zone"
              style={{ padding: '24px 0' }}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined style={{ fontSize: 40, color: '#00b8d9' }} />
              </p>
              <p className="ant-upload-text" style={{ fontSize: 15, fontWeight: 500 }}>
                点击或拖拽文件到此区域
              </p>
              <p className="ant-upload-hint">
                支持 CSV 格式触觉数据 (NxM阵列 + 关节 + 力数据)
              </p>
            </Dragger>

            {fileName && (
              <div style={{ marginTop: 16 }}>
                <Tag color="cyan" icon={<FileTextOutlined />}>
                  {fileName}
                </Tag>
                <Text type="secondary" style={{ marginLeft: 8 }}>
                  {(fileContent.length / 1024).toFixed(1)} KB
                </Text>
              </div>
            )}

            <div style={{ marginTop: 16 }}>
              <Button
                type="link"
                icon={<ExperimentOutlined />}
                onClick={handleDownloadSample}
                style={{ padding: 0 }}
              >
                下载示例数据文件
              </Button>
            </div>
          </Card>

          {/* 处理选项 */}
          <Card
            title={
              <Space>
                <ThunderboltOutlined style={{ color: '#f5a623' }} />
                <span>处理选项</span>
              </Space>
            }
          >
            <Space orientation="vertical" style={{ width: '100%' }} size="middle">
              <div>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>
                  灵巧手 URDF 映射
                </Text>
                <Select
                  value={targetHand}
                  onChange={setTargetHand}
                  style={{ width: '100%' }}
                  options={[
                    { value: 'none', label: '不映射 (保持原始阵列)' },
                    { value: 'unitree_g1', label: 'Unitree G1 灵巧手 (44 tactels)' },
                    { value: 'inspire_robotics', label: '因时机器人灵巧手 (33 tactels)' },
                    { value: 'allegro_hand', label: 'Allegro Hand (48 tactels)' },
                  ]}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text strong>导出 LeRobot 格式</Text>
                  <Switch checked={exportLeRobot} onChange={setExportLeRobot} />
                </div>
                {exportLeRobot && (
                  <div style={{ marginTop: 8 }}>
                    <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                      数据集名称
                    </Text>
                    <Input
                      value={datasetName}
                      onChange={e => setDatasetName(e.target.value)}
                      placeholder="tlabel_dataset"
                    />
                  </div>
                )}
              </div>

              <Divider style={{ margin: '8px 0' }} />

              <Button
                type="primary"
                size="large"
                block
                icon={processing ? <LoadingOutlined /> : <ThunderboltOutlined />}
                onClick={handleProcess}
                disabled={!fileContent || processing}
                style={{
                  background: processing ? undefined : '#00b8d9',
                  height: 48,
                  fontWeight: 600,
                  fontSize: 15,
                }}
              >
                {processing ? '处理中...' : '开始处理'}
              </Button>
            </Space>
          </Card>
        </div>

        {/* 右侧 - 结果展示 */}
        <div>
          {!result && !processing && (
            <Card
              style={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 400,
              }}
            >
              <div style={{ textAlign: 'center', color: '#a0a6b1' }}>
                <RobotOutlined style={{ fontSize: 64, marginBottom: 16, opacity: 0.3 }} />
                <Paragraph type="secondary">
                  上传触觉数据文件并点击处理
                  <br />
                  结果将在此处展示
                </Paragraph>
              </div>
            </Card>
          )}

          {processing && (
            <Card style={{ minHeight: 400 }}>
              <div style={{ textAlign: 'center', padding: '48px 0' }}>
                <LoadingOutlined style={{ fontSize: 48, color: '#00b8d9', marginBottom: 24 }} />
                <Title level={5} type="secondary">
                  正在处理数据...
                </Title>
                <Progress
                  percent={Math.min(currentStep * 25, 90)}
                  strokeColor="#00b8d9"
                  style={{ maxWidth: 300, margin: '0 auto' }}
                />
              </div>
            </Card>
          )}

          {result && !processing && (
            <>
              {/* 处理步骤 */}
              <Card
                title={
                  <Space>
                    <CheckCircleOutlined style={{ color: '#36b37e' }} />
                    <span>处理结果</span>
                  </Space>
                }
                style={{ marginBottom: 16 }}
              >
                {result.steps.map((step, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '8px 0',
                      borderBottom: idx < result.steps.length - 1 ? '1px solid #f0f2f5' : 'none',
                    }}
                  >
                    {step.status === 'completed' && (
                      <CheckCircleOutlined style={{ color: '#36b37e', fontSize: 16 }} />
                    )}
                    {step.status === 'error' && (
                      <Tag color="red">{step.status}</Tag>
                    )}
                    {step.status === 'skipped' && (
                      <Tag color="default">{step.status}</Tag>
                    )}
                    <div>
                      <Text strong>{step.name}</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {step.detail}
                      </Text>
                    </div>
                  </div>
                ))}
              </Card>

              {/* 数据概览 */}
              <Card
                title={
                  <Space>
                    <FileTextOutlined style={{ color: '#00b8d9' }} />
                    <span>TLabel 数据概览</span>
                  </Space>
                }
                style={{ marginBottom: 16 }}
              >
                <Descriptions column={2} size="small" bordered>
                  <Descriptions.Item label="阵列规格">
                    {result.tlabel.rows} x {result.tlabel.cols}
                  </Descriptions.Item>
                  <Descriptions.Item label="通道数">
                    <Tag color="cyan">{result.tlabel.channelCount}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="采样点数">
                    {result.tlabel.sampleCount}
                  </Descriptions.Item>
                  <Descriptions.Item label="采样率">
                    {result.tlabel.sampleRate} Hz
                  </Descriptions.Item>
                  <Descriptions.Item label="语义特征">
                    <Tag color="purple">{result.tlabel.featureCount} 维</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="数据时长">
                    {((result.tlabel.sampleCount / result.tlabel.sampleRate)).toFixed(2)}s
                  </Descriptions.Item>
                </Descriptions>

                <Space style={{ marginTop: 16 }}>
                  <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={handleDownloadTLabel}
                    style={{ background: '#00b8d9' }}
                  >
                    下载 TLabel JSON
                  </Button>
                </Space>
              </Card>

              {/* URDF 映射结果 */}
              {result.urdfMapping && (
                <Card
                  title={
                    <Space>
                      <RobotOutlined style={{ color: '#f5a623' }} />
                      <span>灵巧手映射</span>
                    </Space>
                  }
                  style={{ marginBottom: 16 }}
                >
                  <Alert
                    title={`已映射到 ${result.urdfMapping.targetHand}`}
                    description={`目标触觉通道: ${result.urdfMapping.targetChannels} 个`}
                    type="success"
                    showIcon
                    style={{ marginBottom: 12 }}
                  />
                </Card>
              )}

              {/* LeRobot 导出 */}
              {result.lerobot && (
                <Card
                  title={
                    <Space>
                      <DownloadOutlined style={{ color: '#36b37e' }} />
                      <span>LeRobot 数据集</span>
                    </Space>
                  }
                >
                  <Collapse ghost>
                    <Panel header="数据集结构" key="1">
                      {result.lerobot.structure.files.map((f, idx) => (
                        <div key={idx} style={{ padding: '4px 0' }}>
                          <Text code style={{ fontSize: 12 }}>{f.path}</Text>
                          <br />
                          <Text type="secondary" style={{ fontSize: 12 }}>{f.description}</Text>
                        </div>
                      ))}
                    </Panel>
                    <Panel header="数据集信息" key="2">
                      <Descriptions column={1} size="small">
                        <Descriptions.Item label="数据集ID">
                          {String(result.lerobot.info.dataset_id)}
                        </Descriptions.Item>
                        <Descriptions.Item label="总帧数">
                          {String(result.lerobot.info.total_frames)}
                        </Descriptions.Item>
                        <Descriptions.Item label="FPS">
                          {String(result.lerobot.info.fps)}
                        </Descriptions.Item>
                        <Descriptions.Item label="机器人类型">
                          {String(result.lerobot.info.robot_type)}
                        </Descriptions.Item>
                      </Descriptions>
                    </Panel>
                  </Collapse>

                  <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={handleDownloadLeRobot}
                    style={{ marginTop: 12, background: '#36b37e' }}
                  >
                    下载 LeRobot 数据
                  </Button>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
