'use client';

import React, { useState } from 'react';
import { Layout, Menu } from 'antd';
import {
  UploadOutlined,
  ThunderboltOutlined,
  HistoryOutlined,
  SettingOutlined,
  RobotOutlined,
} from '@ant-design/icons';
import { usePathname, useRouter } from 'next/navigation';

const { Sider, Content } = Layout;

const menuItems = [
  {
    key: '/',
    icon: <UploadOutlined />,
    label: '数据上传',
  },
  {
    key: '/process',
    icon: <ThunderboltOutlined />,
    label: '数据处理',
  },
  {
    key: '/history',
    icon: <HistoryOutlined />,
    label: '处理历史',
  },
  {
    key: '/settings',
    icon: <SettingOutlined />,
    label: '系统设置',
  },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={240}
        style={{
          background: '#1a1d23',
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
        }}
        trigger={null}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? 0 : '0 20px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <RobotOutlined style={{ fontSize: 24, color: '#00b8d9' }} />
          {!collapsed && (
            <span
              style={{
                marginLeft: 12,
                fontSize: 18,
                fontWeight: 700,
                color: '#ffffff',
                letterSpacing: '0.02em',
              }}
            >
              TLabel
            </span>
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[pathname]}
          items={menuItems}
          onClick={({ key }) => router.push(key)}
          style={{
            background: 'transparent',
            borderRight: 0,
            marginTop: 8,
          }}
        />
      </Sider>
      <Layout
        style={{
          marginLeft: collapsed ? 80 : 240,
          transition: 'margin-left 200ms ease-out',
        }}
      >
        <header
          style={{
            height: 56,
            background: '#ffffff',
            borderBottom: '1px solid #e4e8ee',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            position: 'sticky',
            top: 0,
            zIndex: 99,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              onClick={() => setCollapsed(!collapsed)}
              style={{
                cursor: 'pointer',
                fontSize: 18,
                color: '#6b7280',
                padding: '4px 8px',
                borderRadius: 4,
              }}
            >
              {collapsed ? '→' : '←'}
            </div>
            <span style={{ fontSize: 15, fontWeight: 500, color: '#1a1d23' }}>
              触觉数据标准化平台
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span
              style={{
                fontSize: 12,
                color: '#6b7280',
                background: '#f0f2f5',
                padding: '2px 8px',
                borderRadius: 4,
                fontFamily: 'var(--font-mono)',
              }}
            >
              v1.0.0-MVP
            </span>
          </div>
        </header>
        <Content
          style={{
            padding: 24,
            minHeight: 'calc(100vh - 56px)',
          }}
        >
          <div style={{ maxWidth: 1400, margin: '0 auto' }}>{children}</div>
        </Content>
      </Layout>
    </Layout>
  );
}
