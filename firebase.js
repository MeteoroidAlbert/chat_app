// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD6R_VsEe3eQO6EPJkTJaoSRtWEoqBL9rI",
  authDomain: "chat-app-92e31.firebaseapp.com",
  projectId: "chat-app-92e31",
  storageBucket: "chat-app-92e31.appspot.com",
  messagingSenderId: "74048390849",
  appId: "1:74048390849:web:bc5abb375f1c20941c3640",
  measurementId: "G-QK9SS0S5HY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

export default storage;
