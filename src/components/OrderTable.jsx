import { useEffect, useState } from 'react';
import { db } from '../firebase/config';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { Table, Button, Popconfirm, message, Input, Dropdown } from 'antd';
import { DeleteOutlined, DownloadOutlined, SearchOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';

const OrderTable = ({ isAdmin }) => {
  const [orders, setOrders] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [filteredData, setFilteredData] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "scan_logs"), orderBy("created_at", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(data);
      setFilteredData(data);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const lowerText = searchText.toLowerCase();
    const result = orders.filter(item => 
      item.barcode?.toLowerCase().includes(lowerText) || 
      item.scanned_name?.toLowerCase().includes(lowerText)
    );
    setFilteredData(result);
  }, [searchText, orders]);

  // --- HÀM XUẤT EXCEL ĐÃ SỬA ---
  const handleExport = (type) => {
    let dataToExport = [...filteredData];
    const now = new Date();
    
    // Lấy chuỗi ngày tháng năm: VD 12-01-2025
    // toLocaleDateString('vi-VN') trả về 12/01/2025 -> Cần đổi dấu / thành - để đặt tên file
    const dateStr = now.toLocaleDateString('vi-VN').replaceAll('/', '-');

    if (type === 'today') {
       dataToExport = dataToExport.filter(item => {
          if (!item.created_at) return false;
          const itemDate = new Date(item.created_at.seconds * 1000);
          return itemDate.getDate() === now.getDate() && 
                 itemDate.getMonth() === now.getMonth() && 
                 itemDate.getFullYear() === now.getFullYear();
       });
    }

    // Nếu không có dữ liệu thì báo lỗi
    if (dataToExport.length === 0) {
        message.warning("Không có dữ liệu nào để xuất!");
        return;
    }

    const ws = XLSX.utils.json_to_sheet(dataToExport.map((item, index) => ({
        "STT": index + 1,
        "Mã đơn hàng": item.barcode,
        "Người quét": item.scanned_name,
        "Thời gian": item.created_at ? new Date(item.created_at.seconds * 1000).toLocaleString('vi-VN') : ''
    })));

    // Chỉnh độ rộng cột cho đẹp
    const wscols = [
        {wch: 5},  // STT
        {wch: 20}, // Mã đơn
        {wch: 25}, // Người quét
        {wch: 25}  // Thời gian
    ];
    ws['!cols'] = wscols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "DanhSach");
    
    // Đặt tên file theo yêu cầu
    const fileName = type === 'today' 
        ? `BaoCao_Ngay_${dateStr}.xlsx` 
        : `BaoCao_Tong_${dateStr}.xlsx`;

    XLSX.writeFile(wb, fileName);
  };

  const exportItems = [
    { key: 'today', label: 'Xuất Hôm Nay', onClick: () => handleExport('today') },
    { key: 'all', label: 'Xuất Tất Cả', onClick: () => handleExport('all') },
  ];

  const columns = [
    { title: 'STT', key: 'index', render: (_, __, index) => index + 1, width: 60 },
    { title: 'Mã Đơn', dataIndex: 'barcode', key: 'barcode', render: t => <b>{t}</b> },
    { title: 'Người Quét', dataIndex: 'scanned_name', key: 'scanned_name' },
    { title: 'Thời gian', dataIndex: 'created_at', key: 'created_at', render: (t) => t ? new Date(t.seconds * 1000).toLocaleString('vi-VN') : '' },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => isAdmin ? (
        <Popconfirm title="Xóa bản ghi này?" onConfirm={async () => await deleteDoc(doc(db, "scan_logs", record.id))}>
          <Button danger icon={<DeleteOutlined />} size="small" />
        </Popconfirm>
      ) : null,
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, gap: 10 }}>
        <Input 
          placeholder=" Tìm mã đơn, tên nhân viên..." 
          prefix={<SearchOutlined />} 
          style={{ flex: 1 }} // Input tự co giãn
          onChange={e => setSearchText(e.target.value)}
        />
        <Dropdown menu={{ items: exportItems }}>
          <Button type="primary" icon={<DownloadOutlined />} style={{ backgroundColor: '#107c41', borderColor: '#107c41' }}>
            Xuất Excel
          </Button>
        </Dropdown>
      </div>
      <Table 
        dataSource={filteredData} 
        columns={columns} 
        rowKey="id" 
        pagination={{ pageSize: 10, size: "small" }} // size small cho mobile gọn hơn
        scroll={{ x: 500 }} // QUAN TRỌNG: Cho phép trượt ngang nếu màn hình nhỏ hơn 500px
        size="middle" // Kích thước dòng vừa phải
      />
    </div>
  );
};

export default OrderTable;