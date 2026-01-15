// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyABcd8PIcjwIvDqFaLlNHpb8j-TE2Hi9YA",
    authDomain: "thanbeeh-e61d9.firebaseapp.com",
    projectId: "thanbeeh-e61d9",
    storageBucket: "thanbeeh-e61d9.appspot.com",
    messagingSenderId: "1072993385928",
    appId: "1:1072993385928:web:7279146f96c0410dd5d4fd",
    measurementId: "G-N00QZBX79E"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
