import { useEffect, useState } from 'react';
import { db } from '../firebase/config';
import { collection, query, orderBy, limit, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { Table, Card, Tag, Button, Popconfirm, message, Tooltip } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';

const OrderTable = ({ isAdmin }) => { // Nhận prop isAdmin từ App.jsx truyền vào
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "scan_logs"),
      orderBy("created_at", "desc"),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setLogs(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Hàm xóa lịch sử quét
  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "scan_logs", id));
      message.success("Đã xóa bản ghi!");
    } catch (error) {
      message.error("Lỗi xóa: " + error.message);
    }
  };

  const columns = [
    {
      title: 'Mã Barcode',
      dataIndex: 'barcode',
      key: 'barcode',
      render: (text) => <b style={{ fontSize: 16, color: '#1890ff' }}>{text}</b>
    },
    {
      title: 'Người quét',
      dataIndex: 'scanned_name',
      key: 'scanned_name',
      render: (name) => <Tag color="blue">{name}</Tag>
    },
    {
      title: 'Thời gian',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (timestamp) => {
        if (!timestamp) return '';
        return new Date(timestamp.seconds * 1000).toLocaleString('vi-VN');
      }
    },
    // Logic: Nếu là Admin thì mới thêm cột Hành động vào cuối mảng columns
    ...(isAdmin ? [{
        title: 'Hành động',
        key: 'action',
        align: 'center',
        width: 100,
        render: (_, record) => (
            <Tooltip title="Xóa lịch sử này">
                <Popconfirm 
                    title="Bạn chắc chắn muốn xóa?" 
                    description="Hành động này không thể hoàn tác"
                    onConfirm={() => handleDelete(record.id)}
                    okText="Xóa"
                    cancelText="Hủy"
                >
                    <Button danger icon={<DeleteOutlined />} size="small" />
                </Popconfirm>
            </Tooltip>
        )
    }] : [])
  ];

  return (
    <Card 
      title="Lịch sử quét gần đây" 
      style={{ width: '100%', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
      styles={{ body:{padding: 10}} }
    >
      <Table 
        dataSource={logs} 
        columns={columns} 
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 600 }}
      />
    </Card>
  );
};

export default OrderTable;