// FILE: OrderTable.jsx
import { useEffect, useState } from 'react';
import { db } from '../firebase/config';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { Table, Card, Tag } from 'antd';

const OrderTable = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Lấy 50 mã quét gần nhất, sắp xếp mới nhất lên đầu
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
        // Chuyển đổi timestamp của Firebase sang giờ Việt Nam
        return new Date(timestamp.seconds * 1000).toLocaleString('vi-VN');
      }
    }
  ];

  return (
    <Card 
      title="Lịch sử quét gần đây" 
      style={{ width: '100%', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
      bodyStyle={{ padding: 0 }}
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