'use client';

import React from 'react';
import {
  Card,
  Typography,
  Descriptions,
  Tag,
  Space,
  Divider,
  Alert,
} from 'antd';
import {
  SettingOutlined,
  DatabaseOutlined,
  RobotOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

export default function SettingsPage() {
  return (
    <div>
      <Title level={3} style={{ marginBottom: 24, fontWeight: 600 }}>
        <SettingOutlined style={{ marginRight: 8 }} />
        系统设置
      </Title>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <Card
          title={
            <Space>
              <InfoCircleOutlined style={{ color: '#00b8d9' }} />
              <span>系统信息</span>
            </Space>
          }
        >
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="系统名称">TLabel Web</Descriptions.Item>
            <Descriptions.Item label="版本">
              <Tag color="cyan">v1.0.0-MVP</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="TLabel 规范版本">
              <Tag>v1.0</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="语义特征维度">
              <Tag color="purple">22 维</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="支持格式">CSV, HDF5 (元数据)</Descriptions.Item>
            <Descriptions.Item label="导出格式">TLabel JSON, LeRobot</Descriptions.Item>
          </Descriptions>
        </Card>

        <Card
          title={
            <Space>
              <RobotOutlined style={{ color: '#f5a623' }} />
              <span>支持的灵巧手</span>
            </Space>
          }
        >
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="Unitree G1">
              <Space>
                <Tag color="green">5 指</Tag>
                <Tag>44 tactels</Tag>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="因时机器人">
              <Space>
                <Tag color="green">5 指</Tag>
                <Tag>33 tactels</Tag>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Allegro Hand">
              <Space>
                <Tag color="green">4 指</Tag>
                <Tag>48 tactels</Tag>
              </Space>
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <Card
          title={
            <Space>
              <DatabaseOutlined style={{ color: '#36b37e' }} />
              <span>TLabel 22维语义特征</span>
            </Space>
          }
          style={{ gridColumn: '1 / -1' }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {[
              { name: 'contact', desc: '接触状态' },
              { name: 'slip', desc: '滑动检测' },
              { name: 'texture', desc: '纹理特征' },
              { name: 'pressure', desc: '压力分布' },
              { name: 'temperature_delta', desc: '温度变化' },
              { name: 'force_normal', desc: '法向力' },
              { name: 'force_shear_x', desc: '切向力 X' },
              { name: 'force_shear_y', desc: '切向力 Y' },
              { name: 'contact_area', desc: '接触面积' },
              { name: 'centroid_x', desc: '接触中心 X' },
              { name: 'centroid_y', desc: '接触中心 Y' },
              { name: 'curvature', desc: '曲率半径' },
              { name: 'vibration_freq', desc: '振动频率' },
              { name: 'vibration_amplitude', desc: '振动幅度' },
              { name: 'strain_rate', desc: '应变率' },
              { name: 'stress_xx', desc: '应力张量 XX' },
              { name: 'stress_yy', desc: '应力张量 YY' },
              { name: 'stress_xy', desc: '应力张量 XY' },
              { name: 'moisture', desc: '湿度' },
              { name: 'hardness', desc: '硬度估计' },
              { name: 'deformation', desc: '形变量' },
              { name: 'confidence', desc: '置信度' },
            ].map((feature) => (
              <div
                key={feature.name}
                style={{
                  padding: '8px 12px',
                  background: '#f5f7fa',
                  borderRadius: 6,
                  border: '1px solid #e4e8ee',
                }}
              >
                <Text
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    color: '#00b8d9',
                    display: 'block',
                  }}
                >
                  {feature.name}
                </Text>
                <Text style={{ fontSize: 12 }}>{feature.desc}</Text>
              </div>
            ))}
          </div>
        </Card>

        <Card style={{ gridColumn: '1 / -1' }}>
          <Alert
            message="关于 TLabel"
            description={
              <Paragraph style={{ margin: 0 }}>
                TLabel 是触觉数据标准化中间件/通用格式标准层，旨在为不同类型的触觉传感器和灵巧手提供统一的数据表示格式。
                通过 22 维语义特征 schema，TLabel 实现了触觉数据的跨平台互操作性，支持从高密度阵列到灵巧手构型的数据映射和转换。
                本 Web 平台是 TLabel 的 MVP 版本，提供数据上传、标准化转换、灵巧手映射和 LeRobot 格式导出等核心功能。
              </Paragraph>
            }
            type="info"
            showIcon
          />
        </Card>
      </div>
    </div>
  );
}
