import { useEffect, useState } from 'react';
import { db, firebaseConfig } from '../firebase/config';
import { collection, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'; 
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { Table, Tag, Card, Button, Modal, Form, Input, message, Select, Popconfirm } from 'antd';
import { UserAddOutlined, DeleteOutlined } from '@ant-design/icons';

const AdminUser = () => {
  const [users, setUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(data);
    });
    return () => unsubscribe();
  }, []);

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
        role: 'staff',
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

  const handleDeleteUser = async (userId) => {
    try {
        await deleteDoc(doc(db, "users", userId));
        message.success("Đã xóa nhân viên!");
    } catch (error) {
        message.error("Lỗi: " + error.message);
    }
  };

  // --- CẤU HÌNH CỘT ĐỂ TRƯỢT NGANG ---
  const columns = [
    { 
        title: 'Email', 
        dataIndex: 'email', 
        key: 'email',
        width: 220, // Rộng để chứa email dài
    },
    { 
        title: 'Tên hiển thị', 
        dataIndex: 'name', 
        key: 'name', 
        render: t => <b>{t}</b>,
        width: 180, 
    },
    { 
      title: 'Quyền', 
      dataIndex: 'role', 
      key: 'role',
      render: (role) => <Tag color={role === 'admin' ? 'red' : 'blue'}>{role?.toUpperCase()}</Tag>,
      width: 100,
    },
    { 
        title: 'Ngày tạo', 
        dataIndex: 'created_at', 
        render: (t) => t ? new Date(t.seconds * 1000).toLocaleDateString('vi-VN') : '',
        width: 120,
    },
    {
        title: 'Xóa',
        key: 'action',
        width: 80,
        fixed: 'right', // Ghim nút xóa sang bên phải
        align: 'center',
        render: (_, record) => (
            <Popconfirm 
                title="Xóa nhân viên?" 
                onConfirm={() => handleDeleteUser(record.id)}
                okText="Yes" cancelText="No"
            >
                <Button danger icon={<DeleteOutlined />} size="small" />
            </Popconfirm>
        )
    }
  ];

  return (
    <Card 
        title="Quản lý nhân viên" 
        extra={<Button type="primary" icon={<UserAddOutlined />} onClick={() => setIsModalOpen(true)}>Thêm</Button>}
        bodyStyle={{ padding: '10px' }} // Giảm padding card trên mobile
    >
      <Table 
        dataSource={users} 
        columns={columns} 
        rowKey="id" 
        pagination={{ pageSize: 5 }} 
        // --- KÍCH HOẠT TRƯỢT NGANG ---
        scroll={{ x: 700 }} 
        size="middle"
      />
      
      {/* Phần Modal giữ nguyên */}
      <Modal title="Tạo nhân viên mới" open={isModalOpen} onCancel={() => setIsModalOpen(false)} footer={null}>
        <Form form={form} layout="vertical" onFinish={handleCreateUser}>
          <Form.Item label="Tên hiển thị" name="name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item label="Email" name="email" rules={[{ required: true, type: 'email' }]}><Input /></Form.Item>
          <Form.Item label="Mật khẩu" name="password" rules={[{ required: true, min: 6 }]}><Input.Password /></Form.Item>
          <Form.Item label="Quyền hạn" name="role" initialValue="Nhân viên kho"></Form.Item>
            {/*<Select><Select.Option value="staff">Staff</Select.Option><Select.Option value="admin">Admin</Select.Option></Select>*/}
          <Button type="primary" htmlType="submit" loading={loading} block>Tạo tài khoản</Button>
        </Form>
      </Modal>
    </Card>
  );
};

export default AdminUser;