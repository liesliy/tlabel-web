'use client';

import React, { useState, useCallback } from 'react';
import {
  Card,
  Upload,
  Button,
  Typography,
  Space,
  Tag,
  Descriptions,
  message,
  Alert,
  Divider,
} from 'antd';
import {
  FileTextOutlined,
  RobotOutlined,
  UploadOutlined,
  CodeOutlined,
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Dragger } = Upload;

interface URDFInfo {
  jointCount: number;
  linkCount: number;
  joints: Array<{ name: string; type: string }>;
  matchedHand: { id: string; name: string } | null;
}

export default function ProcessPage() {
  const [urdfContent, setUrdfContent] = useState<string>('');
  const [urdfFileName, setUrdfFileName] = useState<string>('');
  const [urdfInfo, setUrdfInfo] = useState<URDFInfo | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const handleURDFUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setUrdfContent(content);
      setUrdfFileName(file.name);
      setUrdfInfo(null);
    };
    reader.readAsText(file);
    return false;
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!urdfContent) {
      message.warning('请先上传 URDF 文件');
      return;
    }

    setAnalyzing(true);
    try {
      const response = await fetch('/api/urdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urdfContent }),
      });

      const data = await response.json();
      if (data.success) {
        setUrdfInfo(data.urdfInfo);
        message.success('URDF 分析完成');
      } else {
        message.error(data.error || '分析失败');
      }
    } catch {
      message.error('分析出错');
    } finally {
      setAnalyzing(false);
    }
  }, [urdfContent]);

  const sampleURDF = `<?xml version="1.0"?>
<robot name="dexterous_hand">
  <link name="palm"/>
  <link name="thumb_proximal"/>
  <link name="thumb_distal"/>
  <link name="index_proximal"/>
  <link name="index_middle"/>
  <link name="index_distal"/>
  <joint name="thumb_joint1" type="revolute">
    <parent link="palm"/>
    <child link="thumb_proximal"/>
  </joint>
  <joint name="thumb_joint2" type="revolute">
    <parent link="thumb_proximal"/>
    <child link="thumb_distal"/>
  </joint>
  <joint name="index_joint1" type="revolute">
    <parent link="palm"/>
    <child link="index_proximal"/>
  </joint>
  <joint name="index_joint2" type="revolute">
    <parent link="index_proximal"/>
    <child link="index_middle"/>
  </joint>
  <joint name="index_joint3" type="revolute">
    <parent link="index_middle"/>
    <child link="index_distal"/>
  </joint>
</robot>`;

  const handleLoadSample = useCallback(() => {
    setUrdfContent(sampleURDF);
    setUrdfFileName('sample_hand.urdf');
    setUrdfInfo(null);
  }, []);

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24, fontWeight: 600 }}>
        灵巧手 URDF 映射
      </Title>

      <Alert
        title="URDF 映射功能"
        description="上传灵巧手的 URDF 模型文件，系统将自动识别关节和链接信息，并将触觉数据映射到对应的灵巧手构型。支持 Unitree G1、因时机器人等常见灵巧手。"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* 左侧 - URDF 上传 */}
        <div>
          <Card
            title={
              <Space>
                <CodeOutlined style={{ color: '#00b8d9' }} />
                <span>URDF 模型文件</span>
              </Space>
            }
          >
            <Dragger
              accept=".urdf,.xml"
              showUploadList={false}
              beforeUpload={handleURDFUpload}
              disabled={analyzing}
              className="upload-zone"
              style={{ padding: '24px 0' }}
            >
              <p className="ant-upload-drag-icon">
                <RobotOutlined style={{ fontSize: 40, color: '#f5a623' }} />
              </p>
              <p className="ant-upload-text" style={{ fontSize: 15, fontWeight: 500 }}>
                上传 URDF 文件
              </p>
              <p className="ant-upload-hint">
                支持 .urdf / .xml 格式的机器人描述文件
              </p>
            </Dragger>

            {urdfFileName && (
              <div style={{ marginTop: 16 }}>
                <Tag color="orange" icon={<FileTextOutlined />}>
                  {urdfFileName}
                </Tag>
              </div>
            )}

            <Divider style={{ margin: '16px 0' }} />

            <Space orientation="vertical" style={{ width: '100%' }}>
              <Button
                type="link"
                onClick={handleLoadSample}
                style={{ padding: 0 }}
              >
                加载示例 URDF
              </Button>

              <Button
                type="primary"
                block
                icon={<FileTextOutlined />}
                onClick={handleAnalyze}
                loading={analyzing}
                disabled={!urdfContent}
                style={{ background: '#00b8d9' }}
              >
                分析 URDF
              </Button>
            </Space>
          </Card>
        </div>

        {/* 右侧 - 分析结果 */}
        <div>
          {!urdfInfo && (
            <Card style={{ minHeight: 300 }}>
              <div style={{ textAlign: 'center', padding: '48px 0', color: '#a0a6b1' }}>
                <RobotOutlined style={{ fontSize: 64, marginBottom: 16, opacity: 0.3 }} />
                <Paragraph type="secondary">
                  上传 URDF 文件后点击分析
                  <br />
                  将显示关节信息和灵巧手匹配结果
                </Paragraph>
              </div>
            </Card>
          )}

          {urdfInfo && (
            <>
              <Card
                title={
                  <Space>
                    <FileTextOutlined style={{ color: '#36b37e' }} />
                    <span>URDF 分析结果</span>
                  </Space>
                }
                style={{ marginBottom: 16 }}
              >
                <Descriptions column={2} size="small" bordered>
                  <Descriptions.Item label="关节数量">
                    <Tag color="cyan">{urdfInfo.jointCount}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="链接数量">
                    <Tag color="cyan">{urdfInfo.linkCount}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="匹配灵巧手" span={2}>
                    {urdfInfo.matchedHand ? (
                      <Tag color="green">{urdfInfo.matchedHand.name}</Tag>
                    ) : (
                      <Text type="secondary">未匹配到已知灵巧手构型</Text>
                    )}
                  </Descriptions.Item>
                </Descriptions>
              </Card>

              <Card
                title={
                  <Space>
                    <UploadOutlined style={{ color: '#f5a623' }} />
                    <span>关节列表</span>
                  </Space>
                }
              >
                <div style={{ maxHeight: 300, overflow: 'auto' }}>
                  {urdfInfo.joints.map((joint, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '6px 0',
                        borderBottom: idx < urdfInfo.joints.length - 1 ? '1px solid #f0f2f5' : 'none',
                      }}
                    >
                      <Text style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                        {joint.name}
                      </Text>
                      <Tag
                        color={joint.type === 'revolute' ? 'blue' : joint.type === 'prismatic' ? 'green' : 'default'}
                      >
                        {joint.type}
                      </Tag>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
