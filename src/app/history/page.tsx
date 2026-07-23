'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Table,
  Typography,
  Tag,
  Space,
  Button,
  Empty,
  message,
} from 'antd';
import {
  HistoryOutlined,
  DeleteOutlined,
  ReloadOutlined,
  FileTextOutlined,
  RobotOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;

interface HistoryEntry {
  id: string;
  fileName: string;
  processedAt: string;
  status: string;
  channelCount: number;
  sampleRate: number;
  sampleCount: number;
  targetHand: string | null;
  exportLeRobot: boolean;
}

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/history');
      const data = await response.json();
      setHistory(data.history || []);
      setTotal(data.total || 0);
    } catch {
      message.error('获取历史记录失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const columns: ColumnsType<HistoryEntry> = [
    {
      title: '文件名',
      dataIndex: 'fileName',
      key: 'fileName',
      render: (text: string) => (
        <Space>
          <FileTextOutlined style={{ color: '#00b8d9' }} />
          <Text style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{text}</Text>
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'completed' ? 'green' : status === 'failed' ? 'red' : 'default'}>
          {status === 'completed' ? '完成' : status === 'failed' ? '失败' : status}
        </Tag>
      ),
    },
    {
      title: '通道数',
      dataIndex: 'channelCount',
      key: 'channelCount',
      render: (count: number) => <Tag color="cyan">{count}</Tag>,
    },
    {
      title: '采样率',
      dataIndex: 'sampleRate',
      key: 'sampleRate',
      render: (rate: number) => `${rate} Hz`,
    },
    {
      title: '采样点',
      dataIndex: 'sampleCount',
      key: 'sampleCount',
      render: (count: number) => count.toLocaleString(),
    },
    {
      title: '灵巧手映射',
      dataIndex: 'targetHand',
      key: 'targetHand',
      render: (hand: string | null) =>
        hand ? (
          <Space>
            <RobotOutlined style={{ color: '#f5a623' }} />
            <Text style={{ fontSize: 12 }}>{hand}</Text>
          </Space>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: 'LeRobot',
      dataIndex: 'exportLeRobot',
      key: 'exportLeRobot',
      render: (exported: boolean) =>
        exported ? <Tag color="green">已导出</Tag> : <Text type="secondary">-</Text>,
    },
    {
      title: '处理时间',
      dataIndex: 'processedAt',
      key: 'processedAt',
      render: (time: string) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {new Date(time).toLocaleString('zh-CN')}
        </Text>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0, fontWeight: 600 }}>
          <HistoryOutlined style={{ marginRight: 8 }} />
          处理历史
        </Title>
        <Space>
          <Text type="secondary">共 {total} 条记录</Text>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchHistory}
            loading={loading}
          >
            刷新
          </Button>
        </Space>
      </div>

      <Card>
        {history.length === 0 && !loading ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="暂无处理记录"
            style={{ padding: '48px 0' }}
          >
            <Button type="primary" href="/" style={{ background: '#00b8d9' }}>
              去上传数据
            </Button>
          </Empty>
        ) : (
          <Table
            columns={columns}
            dataSource={history}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (t) => `共 ${t} 条`,
            }}
            size="middle"
          />
        )}
      </Card>
    </div>
  );
}
