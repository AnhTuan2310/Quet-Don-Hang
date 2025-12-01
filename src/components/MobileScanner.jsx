import { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
// Nếu dòng dưới bị gạch đỏ thì cứ kệ nó, tí mình sửa sau
import { db, auth } from '../firebase/config'; 
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { message, Button, Card } from 'antd';

const MobileScanner = () => {
  const [scanResult, setScanResult] = useState(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    let scanner;
    if (isScanning) {
      // Cấu hình camera
      scanner = new Html5QrcodeScanner(
        "reader", 
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );
      
      // Xử lý khi quét thành công và thất bại
      scanner.render(onScanSuccess, (err) => {
        // Lỗi quét thì bỏ qua, không cần log
      });
    }

    // Dọn dẹp khi tắt
    return () => {
      if (scanner) {
        scanner.clear().catch(e => console.error(e));
      }
    };
  }, [isScanning]);

  const onScanSuccess = async (decodedText) => {
    setIsScanning(false); // Tắt camera ngay
    try {
      // Kiểm tra xem đã đăng nhập chưa
      const user = auth.currentUser;
      if (!user) {
        message.error("Vui lòng đăng nhập trước!");
        return;
      }

      // Lưu vào Firebase
      await addDoc(collection(db, "scan_logs"), {
        barcode: decodedText,
        scanned_by: user.uid,
        scanned_name: user.displayName || user.email,
        created_at: serverTimestamp()
      });
      
      setScanResult(decodedText);
      message.success(`Đã lưu mã: ${decodedText}`);
    } catch (error) {
      console.error(error);
      message.error("Lỗi khi lưu dữ liệu!");
    }
  };

  return (
    <Card title="Quét bằng Camera ĐT" style={{ marginTop: 20, textAlign: 'center' }}>
      {isScanning && <div id="reader"></div>}

      {scanResult && (
        <div style={{ color: 'green', fontWeight: 'bold', margin: '10px 0' }}>
          Vừa quét: {scanResult}
        </div>
      )}

      {!isScanning && (
        <Button type="primary" onClick={() => {
            setScanResult(null);
            setIsScanning(true);
        }}>
          {scanResult ? "Quét tiếp" : "Bật Camera"}
        </Button>
      )}
      
      {isScanning && (
        <Button danger style={{ marginTop: 10 }} onClick={() => setIsScanning(false)}>
          Tắt Camera
        </Button>
      )}
    </Card>
  );
};

export default MobileScanner;