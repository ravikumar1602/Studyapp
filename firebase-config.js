// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyC7tdxFyTOWOqaAxJptAq5vZm92oz1v05M",
    authDomain: "study-portal-bef7a.firebaseapp.com",
    databaseURL: "https://study-portal-bef7a-default-rtdb.firebaseio.com",
    projectId: "study-portal-bef7a",
    storageBucket: "study-portal-bef7a.appspot.com",
    messagingSenderId: "335677529543",
    appId: "1:335677529543:web:0e95959d30b3b3daf4cde2"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get a reference to the database service
const database = firebase.database();

// Export the database reference
export { database };
