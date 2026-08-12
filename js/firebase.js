import {initializeApp} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import {getDatabase} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-database.js";
const firebaseConfig={
apiKey: "AIzaSyAqe-poLVovvPn3GAkQIZiewf5WBEog9Eo",
    authDomain: "akunsdo.firebaseapp.com",
    databaseURL: "https://akunsdo-default-rtdb.firebaseio.com",
    projectId: "akunsdo",
    storageBucket: "akunsdo.firebasestorage.app",
    messagingSenderId: "305267524401",
    appId: "1:305267524401:web:58876acf9a48fb625ce610"
};
export const app=initializeApp(firebaseConfig);
export const db=getDatabase(app);
