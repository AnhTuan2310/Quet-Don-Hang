import { useState, useEffect } from 'react';
import { Layout, Menu, Button, Grid, Drawer } from 'antd'; 
import { 
  BarcodeOutlined, 
  UserOutlined, 
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined
} from '@ant-design/icons';

const { Header, Content, Sider } = Layout;
const { useBreakpoint } = Grid;

const MainLayout = ({ children, userRole, onMenuClick, onLogout, activeKey }) => {
  const [collapsed, setCollapsed] = useState(false);
  const screens = useBreakpoint(); 

  // Logic mới: Trên Mobile mặc định là ĐÓNG (collapsed = true)
  // Trên PC mặc định là MỞ (collapsed = false)
  useEffect(() => {
    // Nếu màn hình nhỏ (Mobile/Tablet) -> Đóng menu
    if (screens.xs || (screens.sm && !screens.md)) {
      setCollapsed(true);
    } else {
      setCollapsed(false);
    }
  }, [screens.xs, screens.sm, screens.md]);

  const items = [
    { key: 'scan', icon: <BarcodeOutlined />, label: 'Quét & Danh sách' },
    // Kiểm tra kỹ role admin
    ...(userRole === 'admin' ? [{ key: 'users', icon: <UserOutlined />, label: 'Quản lý nhân viên' }] : []),
  ];

  // Hàm render Menu (Dùng chung cho cả PC và Mobile)
  const renderMenuContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo */}
      <div style={{ 
          height: 64, flexShrink: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', 
          background: '#001529', color: 'white', fontWeight: 'bold', fontSize: '18px'
      }}>
          {collapsed && !screens.xs ? 'KHO' : 'KHO HÀNG'}
      </div>

      {/* Danh sách Menu (Chiếm phần giữa) */}
      <Menu
        theme="light"
        mode="inline"
        selectedKeys={[activeKey]}
        items={items}
        onClick={(e) => {
            onMenuClick(e.key);
            // Nếu là mobile thì chọn xong tự đóng
            if (screens.xs) setCollapsed(true);
        }}
        style={{ flex: 1, borderRight: 0 }}
      />

      {/* Nút Đăng Xuất (Đẩy lên cao khỏi đáy) */}
      <div style={{ 
          padding: '20px', 
          borderTop: '1px solid #f0f0f0',
          // Quan trọng: Thêm padding đáy lớn để tránh thanh URL Safari
          paddingBottom: screens.xs ? '80px' : '20px' 
      }}>
          <Button 
            type="primary" 
            danger 
            icon={<LogoutOutlined />} 
            block 
            onClick={onLogout}
            size="large" // Nút to cho dễ bấm
          >
            Đăng xuất
          </Button>
      </div>
    </div>
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      
      {/* 1. SIDEBAR CHO PC (Ẩn khi ở Mobile) */}
      {!screens.xs && (
        <Sider trigger={null} collapsible collapsed={collapsed} theme="light">
          {renderMenuContent()}
        </Sider>
      )}

      {/* 2. DRAWER CHO MOBILE (Thay thế Sidebar cũ) */}
      {screens.xs && (
        <Drawer
          placement="left"
          onClose={() => setCollapsed(true)}
          open={!collapsed} // Logic ngược: collapsed=true là đóng, open=false
          styles={{ body: { padding: 0 } }}
          width={260} // Độ rộng vừa phải
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
          <span style={{ fontSize: 18, fontWeight: 500 }}>Hệ Thống Kho</span>
        </Header>
        
        <Content
          style={{
            margin: screens.xs ? '10px' : '24px',
            padding: screens.xs ? 0 : 24, // Mobile bỏ padding ngoài cho rộng
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