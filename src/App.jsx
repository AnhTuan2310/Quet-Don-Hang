import { useState, useEffect } from 'react';
import { db, auth } from './firebase/config';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'; 
// Đã thêm Modal vào dòng import dưới đây
import { Button, Input, Form, message, Card, Spin, Modal } from 'antd';
import MainLayout from './components/MainLayout';
import MobileScanner from './components/MobileScanner';
import OrderTable from './components/OrderTable';
import AdminUser from './pages/AdminUser';

function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [currentView, setCurrentView] = useState('scan');
  const [loading, setLoading] = useState(true);
  
  // State cho Modal Quên mật khẩu
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  // 1. Lắng nghe trạng thái đăng nhập & Tự động tạo hồ sơ
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        
        const userRef = doc(db, "users", currentUser.uid);
        try {
            const userDoc = await getDoc(userRef);
            
            if (userDoc.exists()) {
                // Case 1: Đã có hồ sơ -> Lấy quyền từ DB
                setRole(userDoc.data().role);
            } else {
                // Case 2: Chưa có hồ sơ (Nick mới tạo bên Auth) -> Tự động tạo
                console.log("Đang khởi tạo hồ sơ lần đầu...");
                const newUserData = {
                    email: currentUser.email,
                    name: currentUser.email.split('@')[0], // Tên tạm
                    role: 'staff', // Mặc định là nhân viên
                    created_at: serverTimestamp()
                };
                
                // Lưu vào Firestore
                await setDoc(userRef, newUserData);
                setRole('staff'); 
                message.success("Chào mừng nhân viên mới! Đã tạo hồ sơ thành công.");
            }
        } catch (e) {
            console.error("Lỗi đồng bộ user:", e);
            // Fallback an toàn nếu lỗi mạng
            setRole('staff'); 
        }
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Xử lý Đăng nhập
  const onLogin = async (values) => {
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      message.success("Đăng nhập thành công!");
    } catch (error) {
      message.error("Sai email hoặc mật khẩu!");
    }
  };

  // 3. Xử lý Quên mật khẩu
  const onResetPassword = async (values) => {
    setResetLoading(true);
    try {
        await sendPasswordResetEmail(auth, values.email);
        message.success("Đã gửi link đổi mật khẩu vào email của bạn!");
        setIsResetModalOpen(false);
    } catch (error) {
        if (error.code === 'auth/user-not-found') {
            message.error("Email này chưa đăng ký tài khoản!");
        } else {
            message.error("Lỗi: " + error.message);
        }
    } finally {
        setResetLoading(false);
    }
  };

  // Màn hình chờ khi đang tải dữ liệu
  if (loading) {
    return <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><Spin size="large" tip="Đang tải dữ liệu..." /></div>;
  }

  // --- GIAO DIỆN ĐĂNG NHẬP ---
  if (!user) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f2f5' }}>
        <Card title="Đăng Nhập Kho Hàng" style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <Form onFinish={onLogin}>
            <Form.Item name="email" rules={[{ required: true, message: 'Vui lòng nhập email' }]}><Input placeholder="Email" /></Form.Item>
            <Form.Item name="password" rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}><Input.Password placeholder="Mật khẩu" /></Form.Item>
            
            <Button type="primary" htmlType="submit" block style={{marginBottom: 10}}>Đăng nhập</Button>
            
            <div style={{ textAlign: 'center' }}>
                <a onClick={() => setIsResetModalOpen(true)} style={{ color: '#1890ff', cursor: 'pointer' }}>Quên mật khẩu?</a>
            </div>
          </Form>
        </Card>

        {/* Modal Quên mật khẩu */}
        
        <Modal 
            title="Khôi phục mật khẩu" 
            open={isResetModalOpen} 
            onCancel={() => setIsResetModalOpen(false)}
            footer={null}
        >
            <p>Nhập email của bạn, hệ thống sẽ gửi link để đặt lại mật khẩu mới.</p>
            <Form onFinish={onResetPassword}>
                <Form.Item name="email" rules={[{ required: true, type: 'email', message: 'Email không hợp lệ' }]}>
                    <Input placeholder="Nhập email đăng ký..." />
                </Form.Item>
                <Button type="primary" htmlType="submit" loading={resetLoading} block>Gửi yêu cầu</Button>
            </Form>
        </Modal>
      </div>
    );
  }

  // --- GIAO DIỆN CHÍNH (SAU KHI ĐĂNG NHẬP) ---
  return (
    <MainLayout 
        userRole={role} 
        onMenuClick={setCurrentView} 
        activeKey={currentView}
        onLogout={() => signOut(auth)}
    >
        {/* VIEW 1: QUÉT & DANH SÁCH */}
        {currentView === 'scan' && (
            <>
                {/* Đảm bảo MobileScanner chỉ được gọi 1 lần ở đây */}
                <MobileScanner />
                <div style={{ height: 20 }}></div>
                <OrderTable isAdmin={role === 'admin'} />
            </>
        )}

        {/* VIEW 2: QUẢN LÝ NHÂN VIÊN (Chỉ Admin thấy) */}
        {currentView === 'users' && role === 'admin' && (
            <AdminUser />
        )}
    </MainLayout>
  );
}

export default App;