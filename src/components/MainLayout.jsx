import { useState } from 'react';
import { Layout, Menu, Button, Avatar } from 'antd';
import { 
  BarcodeOutlined, 
  UserOutlined, 
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined
} from '@ant-design/icons';

const { Header, Sider, Content } = Layout;

const MainLayout = ({ children, userRole, onMenuClick, onLogout, activeKey }) => {
  const [collapsed, setCollapsed] = useState(false);

  const items = [
    { key: 'scan', icon: <BarcodeOutlined />, label: 'Quét & Danh sách' },
    // Chỉ hiện menu Admin nếu role là admin
    ...(userRole === 'admin' ? [{ key: 'users', icon: <UserOutlined />, label: 'Quản lý nhân viên' }] : []),
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed} 
        theme="light"
        style={{ 
          boxShadow: '2px 0 8px 0 rgba(29,35,41,.05)', 
          zIndex: 10,
          position: 'relative' // Để đặt nút logout tuyệt đối
        }}
      >
        {/* Logo */}
        <div style={{ 
            height: 64, 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            background: '#001529',
            color: 'white',
            fontWeight: 'bold',
            fontSize: collapsed ? '14px' : '18px',
            whiteSpace: 'nowrap',
            overflow: 'hidden'
        }}>
            {collapsed ? 'KHO' : 'KHO HÀNG'}
        </div>

        {/* Menu */}
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[activeKey]}
          onClick={(e) => onMenuClick(e.key)}
          items={items}
          style={{ borderRight: 0 }}
        />

        {/* Nút Đăng Xuất (Luôn nằm dưới đáy) */}
        <div style={{ 
            position: 'absolute', 
            bottom: 0, 
            width: '100%', 
            padding: '20px', 
            borderTop: '1px solid #f0f0f0',
            background: '#fff'
        }}>
            <Button 
                type="primary" 
                danger 
                icon={<LogoutOutlined />} 
                block={!collapsed} // Nếu mở menu thì nút dài ra, đóng thì nút tròn
                shape={collapsed ? "circle" : "default"}
                onClick={onLogout}
                title="Đăng xuất"
            >
                {!collapsed && "Đăng xuất"}
            </Button>
        </div>
      </Sider>

      <Layout className="site-layout">
        <Header style={{ padding: '0 16px', background: '#fff', display: 'flex', alignItems: 'center', boxShadow: '0 1px 4px rgba(0,21,41,.08)' }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: '16px', width: 64, height: 64 }}
          />
          <span style={{ fontSize: 18, fontWeight: 500 }}>Hệ Thống Quản Lý</span>
        </Header>
        
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: 280,
            background: '#f0f2f5', // Màu nền xám nhẹ cho toàn trang
            display: 'flex',       // Bật flexbox
            justifyContent: 'center', // Căn giữa theo chiều ngang
            alignItems: 'flex-start'  // Căn lên trên cùng
          }}
        >
          {/* Hộp chứa nội dung chính - Sẽ luôn ở giữa */}
          <div style={{ 
              width: '100%', 
              maxWidth: '1000px', // Giới hạn chiều rộng tối đa
              background: '#fff', // Nền trắng cho nội dung
              padding: '24px',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            {children}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;