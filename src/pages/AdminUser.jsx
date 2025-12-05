import { useEffect, useState } from 'react';
import { db, firebaseConfig } from '../firebase/config';
import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore'; 
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail } from 'firebase/auth';
import { Table, Tag, Card, Button, Modal, Form, Input, message, Select, Popconfirm, Tooltip } from 'antd';
import { UserAddOutlined, DeleteOutlined, MailOutlined, EditOutlined } from '@ant-design/icons';

const AdminUser = () => {
  const [users, setUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm] = Form.useForm();

  // 1. Lấy danh sách nhân viên Realtime
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(data);
    });
    return () => unsubscribe();
  }, []);

  // 2. Tạo nhân viên (Dùng Secondary App để Admin không bị out)
  const handleCreateUser = async (values) => {
    setLoading(true);
    let secondaryApp = null;
    try {
      // Tạo kết nối phụ để tạo user mà không logout admin
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
      
      message.success(`Đã tạo tài khoản: ${values.name}`);
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

  const openEditModal = (user) => {
    setEditingUser(user);
    editForm.setFieldsValue({
        name: user.name,
        email: user.email,
        role: user.role
    });
    setIsEditModalOpen(true);
  };
  const handleUpdateUser = async (values) => {
    if (!editingUser) return;
    try {
        await updateDoc(doc(db, "users", editingUser.id), {
            name: values.name, // Cho phép sửa tên (nếu họ muốn đổi nghệ danh :D)
            role: values.role
            // KHÔNG update email ở đây
        });
        message.success("Đã cập nhật thông tin!");
        setIsEditModalOpen(false);
    } catch (error) {
        message.error("Lỗi: " + error.message);
    }
  };

  // 3. Xóa nhân viên
  const handleDeleteUser = async (userId) => {
    try {
        await deleteDoc(doc(db, "users", userId));
        message.success("Đã xóa nhân viên!");
    } catch (error) {
        message.error("Lỗi: " + error.message);
    }
  };

  // 4. Gửi mail Reset Password
  const handleSendResetEmail = async (email) => {
    try {
        const auth = getAuth(); // Dùng auth hiện tại của Admin
        await sendPasswordResetEmail(auth, email);
        message.success(`Đã gửi mail đổi mật khẩu tới: ${email}`);
    } catch (error) {
        message.error("Lỗi: " + error.message);
    }
  };

  const columns = [
    { 
        title: 'Email', dataIndex: 'email', key: 'email', width: 220 
    },
    { 
        title: 'Tên hiển thị', dataIndex: 'name', key: 'name', render: t => <b>{t}</b>, width: 180 
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
        title: 'Hành động',
        key: 'action',
        width: 100,
        fixed: 'right',
        align: 'center',
        render: (_, record) => (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <Tooltip title="Sửa thông tin">
                    <Button 
                        icon={<EditOutlined />} 
                        size="small" 
                        type="primary" 
                        ghost
                        onClick={() => openEditModal(record)} 
                    />
                </Tooltip>
                <Tooltip title="Gửi mail Reset Password">
                    <Popconfirm 
                        title="Gửi mail đặt lại mật khẩu?" 
                        description={`Gửi tới ${record.email}?`}
                        onConfirm={() => handleSendResetEmail(record.email)}
                    >
                        <Button icon={<MailOutlined />} size="small" style={{ borderColor: '#faad14', color: '#faad14' }} />
                    </Popconfirm>
                </Tooltip>

                <Tooltip title="Xóa nhân viên">
                    <Popconfirm 
                        title="Xóa nhân viên này?" 
                        onConfirm={() => handleDeleteUser(record.id)}
                        okText="Xóa" cancelText="Hủy"
                    >
                        <Button danger icon={<DeleteOutlined />} size="small" />
                    </Popconfirm>
                </Tooltip>
            </div>
        )
    }
  ];

  return (
    <Card 
        title="Quản lý nhân viên" 
        extra={<Button type="primary" icon={<UserAddOutlined />} onClick={() => setIsModalOpen(true)}>Thêm nhân viên</Button>}
        style={{ body: { padding: 10 } }}
    >
      <Table 
        dataSource={users} 
        columns={columns} 
        rowKey="id" 
        pagination={{ pageSize: 5 }} 
        scroll={{ x: 750 }} // Cho phép trượt ngang trên mobile
        size="middle"
      />
      
      <Modal title="Tạo nhân viên mới" open={isModalOpen} onCancel={() => setIsModalOpen(false)} footer={null}>
        <Form form={form} layout="vertical" onFinish={handleCreateUser}>
          <Form.Item label="Tên hiển thị" name="name" rules={[{ required: true }]}><Input placeholder="VD: Nguyễn Văn A" /></Form.Item>
          <Form.Item label="Email" name="email" rules={[{ required: true, type: 'email' }]}><Input placeholder="email@congty.com" /></Form.Item>
          <Form.Item label="Mật khẩu" name="password" rules={[{ required: true, min: 6, message: 'Mật khẩu phải từ 6 ký tự' }]} hasFeedback>
            <Input.Password placeholder="Nhập mật khẩu..." />
          </Form.Item>
          <Form.Item name="confirm" label="Xác nhận mật khẩu"dependencies={['password']} hasFeedback // Phụ thuộc vào ô password bên trên 
            rules={[
              { required: true, message: 'Vui lòng xác nhận lại mật khẩu!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  // Logic so sánh: Nếu chưa nhập hoặc khớp với ô password thì OK
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  // Nếu không khớp thì báo lỗi
                  return Promise.reject(new Error('Hai mật khẩu không khớp!'));
                },
              }),
            ]}>
              <Input.Password placeholder="Nhập lại mật khẩu" />
          </Form.Item>
          

          {/* Mặc định tạo Staff, nhưng Admin vẫn có thể chọn nếu cần */}
          <Form.Item label="Quyền hạn" name="role" initialValue="staff">
             <Select>
                <Select.Option value="staff">Nhân viên kho (Staff)</Select.Option>
                <Select.Option value="admin">Quản trị viên (Admin)</Select.Option>
             </Select>
          </Form.Item>
          
          <Button type="primary" htmlType="submit" loading={loading} block>Tạo tài khoản</Button>
        </Form>
      </Modal>
      <Modal title="Cập nhật thông tin" 
        open={isEditModalOpen} 
        onCancel={() => setIsEditModalOpen(false)} 
        footer={null}
      >
        <Form form={editForm} layout="vertical" onFinish={handleUpdateUser}>
            {/* Email bị khóa - Readonly */}
            <Form.Item label="Email (Không thể sửa)" name="email">
                <Input disabled style={{ color: '#000', cursor: 'default', background: '#f5f5f5' }} />
            </Form.Item>

            {/* Tên cho phép sửa (cập nhật lại tên hiển thị cho tương lai) */}
            <Form.Item 
                label="Tên hiển thị" 
                name="name" 
                rules={[{ required: true, message: 'Không được để trống tên' }]}
            >
                <Input placeholder="Nhập tên mới..." />
            </Form.Item>

            <Form.Item label="Quyền hạn" name="role">
                <Select>
                    <Select.Option value="staff">Nhân viên kho (Staff)</Select.Option>
                    <Select.Option value="admin">Quản trị viên (Admin)</Select.Option>
                </Select>
            </Form.Item>

            <Button type="primary" htmlType="submit" block>Lưu thay đổi</Button>
            
            <div style={{ marginTop: 15, fontSize: 12, color: '#888', fontStyle: 'italic', textAlign: 'center' }}>
                * Nếu muốn đổi Email, vui lòng xóa nhân viên này và tạo mới.
            </div>
        </Form>
      </Modal>
    </Card>
  );
};

export default AdminUser;