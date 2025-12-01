import { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { db, auth } from '../firebase/config';
import { collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc, doc, getDoc } from 'firebase/firestore';
import { message, Button, Card, Input } from 'antd';
import { ScanOutlined, AimOutlined } from '@ant-design/icons';

const MobileScanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [currentUserName, setCurrentUserName] = useState('');
  const [lastCodeDisplay, setLastCodeDisplay] = useState(null);
  const [isInputFocused, setIsInputFocused] = useState(true); // Để đổi màu input cho đẹp

  // Ref chống spam
  const lastScanRef = useRef({ code: null, lastTime: 0 });
  
  const inputRef = useRef(null);
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
      // Focus lần đầu thôi, không cưỡng ép sau này
      inputRef.current?.focus();
    };
    init();
  }, []);

  useEffect(() => {
    if (isScanning) {
      const scanner = new Html5QrcodeScanner(
        "reader", 
        { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          rememberLastUsedCamera: true, // Nhớ camera lần trước
          // --- CẤU HÌNH CAMERA SAU ---
          videoConstraints: {
            facingMode: { ideal: "environment" } // Ưu tiên Camera sau
          }
        },
        false
      );
      
      scannerRef.current = scanner;

      scanner.render((decodedText) => {
          handleProcessCode(decodedText);
      }, (err) => {});
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(e => console.error(e));
        scannerRef.current = null;
      }
    };
  }, [isScanning]);

  const handleProcessCode = async (code) => {
    if (!code) return;

    // Logic Chặn Spam 3 giây
    const now = Date.now();
    const { code: lastCode, lastTime } = lastScanRef.current;
    if (code === lastCode && (now - lastTime < 3000)) return;

    lastScanRef.current = { code: code, lastTime: now };
    setLastCodeDisplay(code);
    message.destroy(); 

    const finalName = currentUserName || auth.currentUser?.email || "Unknown";

    try {
      const q = query(collection(db, "scan_logs"), where("barcode", "==", code));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const existingDoc = querySnapshot.docs[0];
        await updateDoc(doc(db, "scan_logs", existingDoc.id), {
            scanned_by: auth.currentUser.uid,
            scanned_name: finalName,
            created_at: serverTimestamp()
        });
        message.success(`Đã cập nhật: ${code}`);
      } else {
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
      message.error("Lỗi xử lý!");
    }
    // Không auto focus lại ở đây để tránh giật khi đang copy
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

  // Hàm thủ công để lấy lại focus cho súng bắn
  const focusInput = () => {
    inputRef.current?.focus();
  };

  return (
    <Card 
        title={lastCodeDisplay ? <span style={{color: 'green', fontSize: 18}}>Vừa quét: {lastCodeDisplay}</span> : `Tên người dùng: ${currentUserName}`} 
        style={{ marginTop: 10, textAlign: 'center', width: '100%' }}
        bodyStyle={{ padding: '10px' }}
    >
      {/* Ô Input thông minh: Đổi màu để biết trạng thái */}
      <div 
        onClick={focusInput} 
        style={{ 
            border: isInputFocused ? '2px solid #1890ff' : '1px dashed #ccc',
            borderRadius: 6,
            padding: 5,
            marginBottom: 10,
            cursor: 'text',
            backgroundColor: isInputFocused ? '#e6f7ff' : '#fafafa',
            transition: 'all 0.3s'
        }}
      >
          <Input 
            ref={inputRef}
            placeholder={isInputFocused ? "Máy scan sẵn sàng..." : "Nhấn vào đây để dùng máy scan"} 
            onKeyDown={onManualScan}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)} // Bỏ logic setTimeout focus
            autoFocus
            bordered={false} // Bỏ viền input mặc định
            style={{ textAlign: 'center', background: 'transparent' }}
          />
          {!isInputFocused && <div style={{fontSize: 12, color: '#999'}}>(Đang chọn văn bản - Nhấn lại để quét)</div>}
      </div>

      {isScanning ? (
        <div style={{ position: 'relative' }}>
            <div id="reader" style={{ width: '100%', minHeight: '300px' }}></div>
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
          Bật Camera
        </Button>
      )}
    </Card>
  );
};

export default MobileScanner;