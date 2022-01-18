import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyCdJYKAFdG7-K9kxDL-NPOjp3GJ6HgSh6M',
  authDomain: 'webrtc-react-types.firebaseapp.com',
  projectId: 'webrtc-react-types',
  storageBucket: 'webrtc-react-types.appspot.com',
  messagingSenderId: '841325280444',
  appId: '1:841325280444:web:474673c7ebdbce21b8a4b9',
  measurementId: 'G-27GZNQW7KF',
};

export const initFirebase = () => {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore();
  return db;
};
