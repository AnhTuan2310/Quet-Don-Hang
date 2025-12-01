import { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { db, auth } from '../firebase/config';
import { collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc, doc, getDoc } from 'firebase/firestore';
import { message, Button, Card, Input } from 'antd';
import { ScanOutlined } from '@ant-design/icons';

const MobileScanner = () => {
  const [lastScannedCode, setLastScannedCode] = useState(null); // Lưu mã vừa quét để chống spam
  const [isScanning, setIsScanning] = useState(false);
  const [currentUserName, setCurrentUserName] = useState('');
  const [processing, setProcessing] = useState(false); // Trạng thái đang xử lý
  
  // Ref cho ô input máy quét tay
  const inputRef = useRef(null);

  // 1. Lấy tên người dùng & Focus vào ô input cho máy quét tay
  useEffect(() => {
    const init = async () => {
      if (auth.currentUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
          if (userDoc.exists()) setCurrentUserName(userDoc.data().name);
          else setCurrentUserName(auth.currentUser.email);
        } catch(e) {}
      }
      // Luôn focus vào ô input để sẵn sàng cho máy quét tay
      inputRef.current?.focus();
    };
    init();
  }, []);

  // 2. Cấu hình Camera
  useEffect(() => {
    let scanner;
    if (isScanning) {
      scanner = new Html5QrcodeScanner(
        "reader", 
        { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          rememberLastUsedCamera: true // Nhớ camera sau/trước
        },
        false
      );
      
      // QUAN TRỌNG: Quét xong KHÔNG tắt cam, chỉ gọi hàm xử lý
      scanner.render(onCameraScan, (err) => {});
    }
    return () => {
      if (scanner) scanner.clear().catch(e => console.error(e));
    };
  }, [isScanning]);

  // --- HÀM XỬ LÝ CHUNG (Cho cả Camera và Máy quét tay) ---
  const handleProcessCode = async (code) => {
    if (!code) return;
    if (processing) return; // Đang lưu dở thì chặn
    
    // CHỐNG SPAM: Nếu mã này trùng mã vừa quét cách đây < 3 giây thì bỏ qua
    // Trừ khi muốn update liên tục thì bỏ đoạn check này đi
    if (code === lastScannedCode) {
        message.warning("Mã này vừa mới quét xong!");
        return;
    }

    setProcessing(true);
    const finalName = currentUserName || auth.currentUser?.email || "Unknown";

    try {
      // B1: Tìm xem có chưa
      const q = query(collection(db, "scan_logs"), where("barcode", "==", code));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // UPDATE (Cần sửa Security Rules thành allow update: if true)
        const existingDoc = querySnapshot.docs[0];
        await updateDoc(doc(db, "scan_logs", existingDoc.id), {
            scanned_by: auth.currentUser.uid,
            scanned_name: finalName,
            created_at: serverTimestamp()
        });
        message.success(`Đã cập nhật: ${code}`);
      } else {
        // CREATE NEW
        await addDoc(collection(db, "scan_logs"), {
          barcode: code,
          scanned_by: auth.currentUser.uid,
          scanned_name: finalName,
          created_at: serverTimestamp()
        });
        message.success(`Mới tinh: ${code}`);
      }
      
      setLastScannedCode(code);
      // Reset biến chống spam sau 3 giây (để sau 3s có thể quét lại mã đó)
      setTimeout(() => setLastScannedCode(null), 3000);

    } catch (error) {
      console.error(error);
      message.error("Lỗi xử lý! Kiểm tra lại mạng hoặc quyền Admin.");
    } finally {
      setProcessing(false);
      // Focus lại vào ô input sau khi xử lý xong (cho máy quét tay)
      inputRef.current?.focus();
    }
  };

  // Xử lý khi Camera bắt được hình
  const onCameraScan = (decodedText) => {
     handleProcessCode(decodedText);
  };

  // Xử lý khi Máy quét tay bắn xong (Nhấn Enter)
  const onManualScan = (e) => {
    if (e.key === 'Enter') {
        const code = e.target.value.trim();
        if (code) {
            handleProcessCode(code);
            e.target.value = ''; // Xóa ô input
        }
    }
  };

  // Logic tự động Focus lại nếu lỡ bấm ra ngoài (Dành cho máy quét tay)
  const keepFocus = () => {
     setTimeout(() => inputRef.current?.focus(), 100);
  }

  return (
    <Card 
        title={`Máy quét: ${currentUserName || '...'}`} 
        style={{ marginTop: 10, textAlign: 'center', width: '100%' }}
        bodyStyle={{ padding: '10px' }}
    >
      {/* Ô Input ẩn dành cho máy quét tay (Luôn luôn lắng nghe) */}
      <Input 
        ref={inputRef}
        placeholder="Đang chờ máy quét tay..." 
        onKeyDown={onManualScan}
        onBlur={keepFocus} // Mất focus là kéo lại ngay
        autoFocus
        style={{ opacity: 0.5, marginBottom: 10 }} // Để mờ mờ cho biết là đang chờ
      />

      {isScanning && (
        <div id="reader" style={{ width: '100%', minHeight: '300px' }}></div>
      )}

      {!isScanning ? (
        <Button 
            type="primary" 
            size="large" 
            icon={<ScanOutlined />}
            onClick={() => setIsScanning(true)}
        >
          Quét đơn (Bật Camera)
        </Button>
      ) : (
        <Button danger style={{ marginTop: 10 }} onClick={() => setIsScanning(false)}>
            Tắt Camera
        </Button>
      )}

      {processing && <p style={{color: 'blue', marginTop: 5}}>⏳ Đang xử lý...</p>}
    </Card>
  );
};

export default MobileScanner;