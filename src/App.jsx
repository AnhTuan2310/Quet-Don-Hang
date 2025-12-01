import { useState, useEffect } from 'react';
import { db, auth } from './firebase/config';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
// Thêm setDoc, serverTimestamp để tự tạo user
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'; 
import { Button, Input, Form, message, Card, Spin } from 'antd';
import MainLayout from './components/MainLayout';
import MobileScanner from './components/MobileScanner';
import OrderTable from './components/OrderTable';
import AdminUser from './pages/AdminUser';

function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null); // 'admin' hoặc 'staff'
  const [currentView, setCurrentView] = useState('scan');
  const [loading, setLoading] = useState(true); // Thêm trạng thái loading khi đang check quyền

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        
        // --- LOGIC TỰ ĐỘNG ĐỒNG BỘ ---
        const userRef = doc(db, "users", currentUser.uid);
        try {
            const userDoc = await getDoc(userRef);
            
            if (userDoc.exists()) {
                // Trường hợp 1: Đã có hồ sơ -> Lấy quyền từ DB
                setRole(userDoc.data().role);
            } else {
                // Trường hợp 2: Chưa có hồ sơ (Nick mới tạo bên Auth) -> TỰ ĐỘNG TẠO
                console.log("Đang khởi tạo hồ sơ lần đầu...");
                const newUserData = {
                    email: currentUser.email,
                    name: currentUser.email.split('@')[0], // Lấy tên tạm từ email
                    role: 'staff', // Mặc định là nhân viên
                    created_at: serverTimestamp()
                };
                
                // Lưu vào Firestore (Nhờ Rules vừa sửa nên mới lưu được)
                await setDoc(userRef, newUserData);
                
                setRole('staff'); // Gán quyền luôn để vào app
                message.success("Chào mừng nhân viên mới! Đã tạo hồ sơ thành công.");
            }
        } catch (e) {
            console.error("Lỗi đồng bộ user:", e);
            // Fallback an toàn nếu lỗi mạng
            setRole('staff'); 
        }
        // -----------------------------
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const onLogin = async (values) => {
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      message.success("Đăng nhập thành công!");
    } catch (error) {
      message.error("Sai email hoặc mật khẩu!");
    }
  };

  // Màn hình chờ khi đang check quyền
  if (loading) {
    return <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><Spin size="large" tip="Đang tải dữ liệu..." /></div>;
  }

  // Màn hình Đăng nhập
  if (!user) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f2f5' }}>
        <Card title="Đăng Nhập Kho Hàng" style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <Form onFinish={onLogin}>
            <Form.Item name="email" rules={[{ required: true }]}><Input placeholder="Email" /></Form.Item>
            <Form.Item name="password" rules={[{ required: true }]}><Input.Password placeholder="Mật khẩu" /></Form.Item>
            <Button type="primary" htmlType="submit" block>Đăng nhập</Button>
          </Form>
        </Card>
      </div>
    );
  }

  // Màn hình Chính
  return (
    <MainLayout 
        userRole={role} 
        onMenuClick={setCurrentView} 
        activeKey={currentView}
        onLogout={() => signOut(auth)}
    >
        {/* LOGIC CHUYỂN TRANG */}
        {currentView === 'scan' && (
            <>
                <MobileScanner />
                <div style={{ height: 20 }}></div>
                <OrderTable isAdmin={role === 'admin'} />
            </>
        )}

        {/* Chỉ Admin mới xem được trang quản lý nhân viên */}
        {currentView === 'users' && role === 'admin' && (
            <AdminUser />
        )}
    </MainLayout>
  );
}

export default App;