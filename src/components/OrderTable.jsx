import { useEffect, useState } from 'react';
import { db } from '../firebase/config';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { Table, Button, Popconfirm, message, Tag } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';

const OrderTable = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Tạo câu lệnh: Lấy bảng scan_logs, sắp xếp mới nhất lên đầu
    const q = query(collection(db, "scan_logs"), orderBy("created_at", "desc"));

    // Lắng nghe realtime (onSnapshot)
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOrders(data);
      setLoading(false);
    });

    // Hủy lắng nghe khi tắt trang
    return () => unsubscribe();
  }, []);

  // Hàm xóa (Chỉ Admin mới xóa được, User xóa sẽ bị chặn bởi Security Rules)
  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "scan_logs", id));
      message.success("Đã xóa thành công!");
    } catch (error) {
      message.error("Bạn không có quyền xóa (Chỉ Admin mới được xóa)!");
    }
  };

  const columns = [
    { title: 'Mã Đơn', dataIndex: 'barcode', key: 'barcode', render: (text) => <b>{text}</b> },
    { title: 'Người Quét', dataIndex: 'scanned_name', key: 'scanned_name' },
    { 
      title: 'Thời gian', 
      dataIndex: 'created_at', 
      key: 'created_at',
      render: (timestamp) => timestamp ? new Date(timestamp.seconds * 1000).toLocaleString('vi-VN') : ''
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Popconfirm title="Bạn chắc chắn muốn xóa?" onConfirm={() => handleDelete(record.id)}>
          <Button danger icon={<DeleteOutlined />} size="small">Xóa</Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <Table 
      dataSource={orders} 
      columns={columns} 
      rowKey="id" 
      loading={loading}
      pagination={{ pageSize: 5 }} // Mỗi trang hiện 5 dòng
    />
  );
};

export default OrderTable;