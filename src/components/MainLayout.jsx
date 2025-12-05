import { useState, useEffect } from 'react';
import { Layout, Menu, Button, Grid, Drawer } from 'antd'; 
import { 
  BarcodeOutlined, UserOutlined, LogoutOutlined, 
  MenuFoldOutlined, MenuUnfoldOutlined 
} from '@ant-design/icons';

const { Header, Content, Sider } = Layout;
const { useBreakpoint } = Grid;

const MainLayout = ({ children, userRole, onMenuClick, onLogout, activeKey }) => {
  const [collapsed, setCollapsed] = useState(false);
  const screens = useBreakpoint(); 

  useEffect(() => {
    // Mobile/Tablet mặc định đóng menu
    if (screens.xs || (screens.sm && !screens.md)) {
      setCollapsed(true);
    } else {
      setCollapsed(false);
    }
  }, [screens.xs, screens.sm, screens.md]);

  const items = [
    { key: 'scan', icon: <BarcodeOutlined />, label: 'Quét & Danh sách' },
    ...(userRole === 'admin' ? [{ key: 'users', icon: <UserOutlined />, label: 'Quản lý nhân viên' }] : []),
  ];

  const renderMenuContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ 
          height: 64, flexShrink: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', 
          background: '#001529', color: 'white', fontWeight: 'bold', fontSize: '18px' 
      }}>
          {collapsed && !screens.xs ? 'KHO' : 'KHO SCAN'}
      </div>

      <Menu
        theme="light"
        mode="inline"
        selectedKeys={[activeKey]}
        items={items}
        onClick={(e) => {
            onMenuClick(e.key);
            if (screens.xs) setCollapsed(true);
        }}
        style={{ flex: 1, borderRight: 0 }}
      />

      {/* Nút Đăng Xuất đã Fix UI */}
      <div style={{ 
          padding: '20px', 
          borderTop: '1px solid #f0f0f0',
          paddingBottom: screens.xs ? '80px' : '20px', 
          display: 'flex', justifyContent: 'center'
      }}>
          <Button 
            type="primary" 
            danger 
            icon={<LogoutOutlined />} 
            block={screens.xs || !collapsed} 
            shape={(!screens.xs && collapsed) ? "circle" : "default"}
            onClick={onLogout}
            size="large" 
            title="Đăng xuất"
          >
            {(screens.xs || !collapsed) ? "Đăng xuất" : null}
          </Button>
      </div>
    </div>
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {!screens.xs && (
        <Sider trigger={null} collapsible collapsed={collapsed} theme="light">
          {renderMenuContent()}
        </Sider>
      )}

      {screens.xs && (
        <Drawer
          placement="left"
          onClose={() => setCollapsed(true)}
          open={!collapsed}
          styles={{ body: { padding: 0 } }}
          width={260}
          zIndex={1000}
        >
          {renderMenuContent()}
        </Drawer>
      )}

      <Layout>
        <Header style={{ padding: 0, background: '#fff', display: 'flex', alignItems: 'center', position: 'sticky', top: 0, zIndex: 99, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: '16px', width: 64, height: 64 }}
          />
          <span style={{ fontSize: 18, fontWeight: 500 }}>Hệ thống check đơn</span>
        </Header>
        
        <Content
          style={{
            margin: screens.xs ? '10px' : '24px',
            padding: screens.xs ? 0 : 24,
            minHeight: 280,
            overflowX: 'hidden'
          }}
        >
             <div style={{ 
              background: '#fff', 
              padding: screens.xs ? '15px' : '24px',
              borderRadius: '8px',
              minHeight: '80vh'
          }}>
            {children}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;