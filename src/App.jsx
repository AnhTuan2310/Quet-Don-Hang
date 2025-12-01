import { useState, useEffect } from 'react';
import { db, auth } from './firebase/config';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { Button, Input, Form, message, Card, Layout } from 'antd';
import MobileScanner from './components/MobileScanner';
import OrderTable from './components/OrderTable';

const { Header, Content } = Layout;

function App() {
  const [user, setUser] = useState(null);

  // Kiểm tra xem đã đăng nhập chưa
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Xử lý Đăng nhập
  const onLogin = async (values) => {
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      message.success("Đăng nhập thành công!");
    } catch (error) {
      message.error("Sai email hoặc mật khẩu!");
    }
  };

  // Nếu CHƯA đăng nhập -> Hiện Form Login
  if (!user) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 100 }}>
        <Card title="Đăng Nhập Hệ Thống" style={{ width: 400 }}>
          <Form onFinish={onLogin}>
            <Form.Item name="email" rules={[{ required: true }]}>
              <Input placeholder="Email" />
            </Form.Item>
            <Form.Item name="password" rules={[{ required: true }]}>
              <Input.Password placeholder="Mật khẩu" />
            </Form.Item>
            <Button type="primary" htmlType="submit" block>Đăng nhập</Button>
          </Form>
        </Card>
      </div>
    );
  }

  // Nếu ĐÃ đăng nhập -> Hiện Web Quét
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ color: 'white', margin: 0 }}>Kho Hàng Scan</h2>
        <div>
          <span style={{ color: 'white', marginRight: 15 }}>Xin chào, {user.email}</span>
          <Button onClick={() => signOut(auth)}>Đăng xuất</Button>
        </div>
      </Header>
      
      <Content style={{ padding: '20px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          
          {/* Khu vực Quét */}
          <MobileScanner />
          
          <div style={{ margin: '20px 0' }}></div>

          {/* Khu vực Bảng */}
          <Card title="Danh sách đơn hàng vừa quét">
            <OrderTable />
          </Card>

        </div>
      </Content>
    </Layout>
  );
}

export default App;