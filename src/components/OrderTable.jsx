import { useEffect, useState } from 'react';
import { db } from '../firebase/config';
import { collection, query, orderBy, limit, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { Table, Card, Tag, Button, Popconfirm, message, Tooltip } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';

const OrderTable = ({ isAdmin }) => {
  const [logs, setLogs] = useState([]);
  const [userMap, setUserMap] = useState({}); // Biến này để lưu danh sách tên mới nhất
  const [loading, setLoading] = useState(true);

  // 1. Lấy danh sách Scan Logs
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

  // 2. Lấy danh sách Users (Để cập nhật tên mới nhất)
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
        const users = {};
        snapshot.forEach(doc => {
            // Tạo một từ điển: ID -> Tên Mới
            users[doc.id] = doc.data().name;
        });
        setUserMap(users);
    });
    return () => unsubscribe();
  }, []);

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
      key: 'scanned_name', // Không dùng dataIndex trực tiếp
      render: (_, record) => {
          // Tìm tên trong danh sách user mới nhất (userMap) dựa vào ID (scanned_by)
          // Nếu tìm thấy -> Hiển thị tên mới
          // Nếu người đó bị xóa rồi -> Hiển thị tên cũ lưu trong log
          const latestName = userMap[record.scanned_by];
          const displayName = latestName || record.scanned_name || 'Không xác định';
          
          return <Tag color="blue">{displayName}</Tag>;
      }
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
    ...(isAdmin ? [{
        title: 'Hành động',
        key: 'action',
        align: 'center',
        width: 100,
        render: (_, record) => (
            <Tooltip title="Xóa lịch sử này">
                <Popconfirm 
                    title="Bạn chắc chắn muốn xóa?" 
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
      styles={{body: {padding:10}}}
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