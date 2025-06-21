// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyC7tdxFyTOWOqaAxJptAq5vZm92oz1v05M",
    authDomain: "study-portal-bef7a.firebaseapp.com",
    projectId: "study-portal-bef7a",
    storageBucket: "study-portal-bef7a.appspot.com",
    messagingSenderId: "335677529543",
    appId: "1:335677529543:web:0e95959d30b3b3daf4cde2"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firestore
db = firebase.firestore();

// Initialize Storage
const storage = firebase.storage();

// Enable offline data persistence
db.enablePersistence()
  .catch((err) => {
      if (err.code === 'failed-precondition') {
          console.warn('Offline persistence can only be enabled in one tab at a time.');
      } else if (err.code === 'unimplemented') {
          console.warn('The current browser does not support offline persistence.');
      }
  });

// Set Firestore settings
db.settings({
    cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
});

// Export Firebase services
export { db, storage, firebase as default };
