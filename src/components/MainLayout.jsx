import { useState, useEffect } from 'react';
import { Layout, Menu, Button, Grid } from 'antd'; // Thêm Grid
import { 
  BarcodeOutlined, 
  UserOutlined, 
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined
} from '@ant-design/icons';

const { Header, Sider, Content } = Layout;
const { useBreakpoint } = Grid; // Hook để check xem đang dùng PC hay Mobile

const MainLayout = ({ children, userRole, onMenuClick, onLogout, activeKey }) => {
  const [collapsed, setCollapsed] = useState(false);
  const screens = useBreakpoint(); // Lấy kích thước màn hình hiện tại

  // Tự động thu gọn menu khi vào bằng điện thoại (khi màn hình < lg)
  useEffect(() => {
    if (!screens.lg) {
      setCollapsed(true);
    }
  }, [screens.lg]);

  const items = [
    { key: 'scan', icon: <BarcodeOutlined />, label: 'Quét & Danh sách' },
    ...(userRole === 'admin' ? [{ key: 'users', icon: <UserOutlined />, label: 'Quản lý nhân viên' }] : []),
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        breakpoint="lg" 
        collapsedWidth="0" // TRÊN MOBILE: Thu gọn bằng 0 (biến mất luôn)
        onBreakpoint={(broken) => {
            setCollapsed(broken);
        }}
        style={{ 
          zIndex: 100, // Đè lên trên để không bị che
          height: '100vh',
          position: !screens.lg ? 'fixed' : 'relative', // Mobile thì menu nổi lên trên
          left: 0,
        }}
        theme="light"
      >
        <div style={{ 
            height: 64, display: 'flex', justifyContent: 'center', alignItems: 'center', 
            background: '#001529', color: 'white', fontWeight: 'bold', fontSize: '18px'
        }}>
            {collapsed ? '' : 'KHO HÀNG'}
        </div>

        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[activeKey]}
          onClick={(e) => {
              onMenuClick(e.key);
              if (!screens.lg) setCollapsed(true); // Mobile: Chọn xong tự đóng menu
          }}
          items={items}
        />

        {!collapsed && (
            <div style={{ position: 'absolute', bottom: 0, width: '100%', padding: '20px', borderTop: '1px solid #f0f0f0' }}>
                <Button type="primary" danger icon={<LogoutOutlined />} block onClick={onLogout}>Đăng xuất</Button>
            </div>
        )}
      </Sider>

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
            margin: screens.lg ? '24px' : '10px', // Mobile: lề 10px, PC: lề 24px
            padding: screens.lg ? 24 : 12,        // Mobile: đệm trong 12px cho rộng chỗ
            background: '#f0f2f5',
            minHeight: 280,
            overflowX: 'hidden' // Chặn trượt ngang cả trang
          }}
        >
             <div style={{ 
              width: '100%', 
              background: '#fff', 
              padding: screens.lg ? '24px' : '15px', // Mobile giảm padding thẻ nội dung
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