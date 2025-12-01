import { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { db, auth } from '../firebase/config';
import { collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc, doc, getDoc } from 'firebase/firestore';
import { message, Button, Card } from 'antd';

const MobileScanner = () => {
  const [scanResult, setScanResult] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [currentUserName, setCurrentUserName] = useState(''); // Lưu tên thật

  // 1. Lấy tên thật của người dùng ngay khi vào trang
  useEffect(() => {
    const fetchUserName = async () => {
      if (auth.currentUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
          if (userDoc.exists()) {
            setCurrentUserName(userDoc.data().name); // Lấy tên "Nguyễn Văn A"
          } else {
            setCurrentUserName(auth.currentUser.email); // Fallback nếu lỗi
          }
        } catch (e) {
          console.error("Lỗi lấy tên:", e);
        }
      }
    };
    fetchUserName();
  }, []);

  useEffect(() => {
    let scanner;
    if (isScanning) {
      scanner = new Html5QrcodeScanner(
        "reader", 
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );
      scanner.render(onScanSuccess, (err) => {});
    }
    return () => {
      if (scanner) scanner.clear().catch(e => console.error(e));
    };
  }, [isScanning]);

  // --- LOGIC QUAN TRỌNG NHẤT NẰM Ở ĐÂY ---
  const onScanSuccess = async (decodedText) => {
    setIsScanning(false);
    
    // Nếu chưa lấy được tên thì dùng tạm email
    const finalName = currentUserName || auth.currentUser?.email || "Unknown";

    try {
      // B1: Kiểm tra xem mã này đã tồn tại chưa
      const q = query(collection(db, "scan_logs"), where("barcode", "==", decodedText));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // --- TRƯỜNG HỢP 1: ĐÃ CÓ -> UPDATE ---
        const existingDoc = querySnapshot.docs[0]; // Lấy đơn đầu tiên tìm thấy
        await updateDoc(doc(db, "scan_logs", existingDoc.id), {
            scanned_by: auth.currentUser.uid,
            scanned_name: finalName, // Update tên người mới
            created_at: serverTimestamp() // Update giờ mới
        });
        message.info(`Đã cập nhật đơn cũ: ${decodedText}`);
      } else {
        // --- TRƯỜNG HỢP 2: CHƯA CÓ -> TẠO MỚI ---
        await addDoc(collection(db, "scan_logs"), {
          barcode: decodedText,
          scanned_by: auth.currentUser.uid,
          scanned_name: finalName, // Lưu tên thật
          created_at: serverTimestamp()
        });
        message.success(`Đã lưu mới: ${decodedText}`);
      }
      
      setScanResult(decodedText);
    } catch (error) {
      console.error(error);
      message.error("Lỗi xử lý đơn hàng!");
    }
  };

  return (
    <Card title={`Máy quét (Người dùng: ${currentUserName || '...'})`} style={{ marginTop: 20, textAlign: 'center' }}>
      {isScanning && <div id="reader"></div>}

      {scanResult && (
        <div style={{ color: 'green', fontWeight: 'bold', margin: '10px 0', fontSize: 16 }}>
          Vừa xử lý: {scanResult}
        </div>
      )}

      {!isScanning && (
        <Button type="primary" size="large" onClick={() => {
            setScanResult(null);
            setIsScanning(true);
        }}>
          {scanResult ? "Quét tiếp" : "Bật Camera"}
        </Button>
      )}
      
      {isScanning && (
        <Button danger style={{ marginTop: 10 }} onClick={() => setIsScanning(false)}>Tắt Camera</Button>
      )}
    </Card>
  );
};

export default MobileScanner;