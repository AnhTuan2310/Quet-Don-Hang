// Import các hàm cần thiết của Firebase
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// --- DÁN ĐOẠN MÃ CỦA BẠN VÀO DƯỚI ĐÂY ---
// (Cái đoạn bắt đầu bằng: const firebaseConfig = ... )
// Import the functions you need from the SDKs you need
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyDOWgNdGh46EtxysLiYSeZU_KcEb52P8wc",
  authDomain: "khohang-234.firebaseapp.com",
  projectId: "khohang-234",
  storageBucket: "khohang-234.firebasestorage.app",
  messagingSenderId: "940318740336",
  appId: "1:940318740336:web:18be2df1b9a7eee38cc9b5"
};

// Khởi tạo kết nối
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Xuất ra để các file khác dùng
export { db, auth };