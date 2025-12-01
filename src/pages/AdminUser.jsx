import { useEffect, useState } from 'react';
import { db, firebaseConfig } from '../firebase/config';
import { collection, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'; // Thêm deleteDoc
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { Table, Tag, Card, Button, Modal, Form, Input, message, Select, Popconfirm } from 'antd';
import { UserAddOutlined, DeleteOutlined } from '@ant-design/icons';

const AdminUser = () => {
  const [users, setUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  // 1. Lấy danh sách
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(data);
    });
    return () => unsubscribe();
  }, []);

  // 2. Hàm Tạo (Giữ nguyên logic cũ)
  const handleCreateUser = async (values) => {
    setLoading(true);
    let secondaryApp = null;
    try {
      secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
      const secondaryAuth = getAuth(secondaryApp);
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, values.email, values.password);
      
      await setDoc(doc(db, "users", userCredential.user.uid), {
        email: values.email,
        name: values.name,
        role: values.role || 'staff',
        created_at: serverTimestamp(),
        created_by_admin: true
      });

      await signOut(secondaryAuth);
      deleteApp(secondaryApp);
      message.success(`Đã tạo: ${values.name}`);
      setIsModalOpen(false);
      form.resetFields();
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        message.error("Email này đã tồn tại!");
      } else {
        message.error("Lỗi: " + error.message);
      }
    } finally {
      if (secondaryApp) try { deleteApp(secondaryApp); } catch(e){}
      setLoading(false);
    }
  };

  // 3. Hàm Xóa (Mới thêm)
  const handleDeleteUser = async (userId) => {
    try {
        // Xóa document trong Firestore
        await deleteDoc(doc(db, "users", userId));
        message.success("Đã xóa nhân viên khỏi hệ thống!");
        message.warning("Lưu ý: Hãy xóa cả Email trong Firebase Authentication nếu muốn chặn triệt để.");
    } catch (error) {
        message.error("Lỗi khi xóa: " + error.message);
    }
  };

  const columns = [
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Tên hiển thị', dataIndex: 'name', key: 'name', render: t => <b>{t}</b> },
    { 
      title: 'Quyền', 
      dataIndex: 'role', 
      key: 'role',
      render: (role) => <Tag color={role === 'admin' ? 'red' : 'blue'}>{role?.toUpperCase()}</Tag>
    },
    { 
        title: 'Ngày tạo', 
        dataIndex: 'created_at', 
        render: (t) => t ? new Date(t.seconds * 1000).toLocaleDateString('vi-VN') : '' 
    },
    // Cột Hành động mới
    {
        title: 'Hành động',
        key: 'action',
        render: (_, record) => (
            <Popconfirm 
                title="Xóa nhân viên này?" 
                description="Họ sẽ mất quyền truy cập vào app."
                onConfirm={() => handleDeleteUser(record.id)}
                okText="Xóa luôn"
                cancelText="Hủy"
            >
                <Button danger icon={<DeleteOutlined />} size="small">Xóa</Button>
            </Popconfirm>
        )
    }
  ];

  return (
    <Card 
        title="Quản lý nhân viên" 
        extra={<Button type="primary" icon={<UserAddOutlined />} onClick={() => setIsModalOpen(true)}>Thêm nhân viên</Button>}
    >
      <Table dataSource={users} columns={columns} rowKey="id" pagination={{ pageSize: 5 }} />
      
      <Modal title="Tạo nhân viên mới" open={isModalOpen} onCancel={() => setIsModalOpen(false)} footer={null}>
        <Form form={form} layout="vertical" onFinish={handleCreateUser}>
          <Form.Item label="Tên hiển thị" name="name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item label="Email" name="email" rules={[{ required: true, type: 'email' }]}><Input /></Form.Item>
          <Form.Item label="Mật khẩu" name="password" rules={[{ required: true, min: 6 }]}><Input.Password /></Form.Item>
          <Form.Item label="Quyền hạn" name="role" initialValue="staff">
            <Select><Select.Option value="staff">Staff</Select.Option><Select.Option value="admin">Admin</Select.Option></Select>
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>Tạo tài khoản</Button>
        </Form>
      </Modal>
    </Card>
  );
};

export default AdminUser;