import { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { db, auth } from '../firebase/config';
import { collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc, doc, getDoc } from 'firebase/firestore';
import { message, Button, Card, Input } from 'antd';
import { ScanOutlined } from '@ant-design/icons';

const MobileScanner = () => {
  const [lastScannedCode, setLastScannedCode] = useState(null); // Biến chống spam quét trùng liên tục
  const [isScanning, setIsScanning] = useState(false);
  const [currentUserName, setCurrentUserName] = useState('');
  
  // Ref cho ô input máy quét tay
  const inputRef = useRef(null);
  // Biến giữ scanner để clear khi unmount
  const scannerRef = useRef(null);

  useEffect(() => {
    const init = async () => {
      if (auth.currentUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
          if (userDoc.exists()) setCurrentUserName(userDoc.data().name);
          else setCurrentUserName(auth.currentUser.email);
        } catch(e) {}
      }
      inputRef.current?.focus();
    };
    init();
  }, []);

  useEffect(() => {
    if (isScanning) {
      // Khởi tạo Camera
      const scanner = new Html5QrcodeScanner(
        "reader", 
        { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          rememberLastUsedCamera: true
        },
        false
      );
      
      scannerRef.current = scanner;

      // QUAN TRỌNG: Callback khi quét thành công
      scanner.render((decodedText) => {
          // KHÔNG ĐƯỢC GỌI scanner.clear() Ở ĐÂY -> Để camera vẫn chạy
          handleProcessCode(decodedText);
      }, (err) => {});
    }

    // Cleanup khi tắt component hoặc tắt camera thủ công
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(e => console.error("Clear error", e));
        scannerRef.current = null;
      }
    };
  }, [isScanning]);

  const handleProcessCode = async (code) => {
    if (!code) return;
    
    // CHỐNG QUÉT TRÙNG (Debounce):
    // Nếu mã này giống hệt mã vừa quét cách đây 2 giây -> Bỏ qua (để camera khỏi bắt 1 mã 10 lần)
    if (code === lastScannedCode) return;

    // Lưu tạm mã này lại để chặn spam
    setLastScannedCode(code);
    setTimeout(() => setLastScannedCode(null), 3000); // Sau 3 giây mới cho quét lại mã đó

    const finalName = currentUserName || auth.currentUser?.email || "Unknown";

    try {
      // 1. Kiểm tra tồn tại
      const q = query(collection(db, "scan_logs"), where("barcode", "==", code));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // 2. UPDATE (Nếu đã mở quyền Rules)
        const existingDoc = querySnapshot.docs[0];
        await updateDoc(doc(db, "scan_logs", existingDoc.id), {
            scanned_by: auth.currentUser.uid,
            scanned_name: finalName,
            created_at: serverTimestamp() // Cập nhật giờ mới
        });
        message.success(`Đã cập nhật giờ: ${code}`); // Thông báo xanh
      } else {
        // 3. CREATE
        await addDoc(collection(db, "scan_logs"), {
          barcode: code,
          scanned_by: auth.currentUser.uid,
          scanned_name: finalName,
          created_at: serverTimestamp()
        });
        message.success(`Mới tinh: ${code}`);
      }
    } catch (error) {
      console.error(error);
      message.error("Lỗi! Hãy chắc chắn bạn đã sửa Security Rules.");
    } finally {
      inputRef.current?.focus();
    }
  };

  const onManualScan = (e) => {
    if (e.key === 'Enter') {
        const code = e.target.value.trim();
        if (code) {
            handleProcessCode(code);
            e.target.value = '';
        }
    }
  };

  return (
    <Card 
        // Tiêu đề hiển thị mã vừa quét gần nhất
        title={lastScannedCode ? <span style={{color: 'green'}}>Vừa quét: {lastScannedCode}</span> : `Máy quét: ${currentUserName}`} 
        style={{ marginTop: 10, textAlign: 'center', width: '100%' }}
        bodyStyle={{ padding: '10px' }}
    >
      <Input 
        ref={inputRef}
        placeholder="Nhập tay hoặc dùng súng bắn..." 
        onKeyDown={onManualScan}
        onBlur={() => setTimeout(() => inputRef.current?.focus(), 100)}
        autoFocus
        style={{ opacity: 0.6, marginBottom: 10 }}
      />

      {isScanning ? (
        <div style={{ position: 'relative' }}>
            {/* Khung Camera */}
            <div id="reader" style={{ width: '100%', minHeight: '300px' }}></div>
            
            {/* Nút tắt camera nằm dưới */}
            <Button danger style={{ marginTop: 10, width: '100%' }} onClick={() => setIsScanning(false)}>
                Dừng Camera
            </Button>
        </div>
      ) : (
        <Button 
            type="primary" 
            size="large" 
            icon={<ScanOutlined />}
            block
            onClick={() => setIsScanning(true)}
            style={{ height: 50, fontSize: 18 }}
        >
          Bật Camera (Quét liên tục)
        </Button>
      )}
    </Card>
  );
};

export default MobileScanner;