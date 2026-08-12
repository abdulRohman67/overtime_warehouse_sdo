import { db } from "./firebase.js";

import {
  ref,
  get
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-database.js";

import {
  setSession,
  showMsg
} from "./session.js";


const loginForm = document.getElementById("loginForm");
const sapIdInput = document.getElementById("sapId");
const passwordInput = document.getElementById("password");
const loginMsg = document.getElementById("loginMsg");
const loginButton = document.getElementById("loginButton");


if (loginForm) {

  loginForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const sapId = sapIdInput.value.trim();
    const password = passwordInput.value;

    /*
     * Validasi input
     */
    if (!sapId) {
      showMsg(
        loginMsg,
        "SAP ID wajib diisi.",
        "error"
      );

      sapIdInput.focus();
      return;
    }

    if (!password) {
      showMsg(
        loginMsg,
        "Password wajib diisi.",
        "error"
      );

      passwordInput.focus();
      return;
    }


    /*
     * Disable tombol selama proses login
     */
    if (loginButton) {
      loginButton.disabled = true;
      loginButton.textContent = "Memeriksa...";
    }

    loginMsg.className = "message";
    loginMsg.textContent = "Memeriksa akun...";


    try {

      /*
       * Mengambil data akun berdasarkan SAP ID
       *
       * Struktur Firebase:
       *
       * users
       *   └── SAP_ID
       *        ├── name
       *        ├── password
       *        └── role
       */

      const userRef = ref(
        db,
        "users/" + sapId
      );

      const snapshot = await get(userRef);


      /*
       * SAP tidak ditemukan
       */
      if (!snapshot.exists()) {

        showMsg(
          loginMsg,
          "SAP ID tidak ditemukan.",
          "error"
        );

        return;
      }


      const user = snapshot.val();


      /*
       * Password
       */
      if (
        user.password === undefined ||
        user.password === null
      ) {

        showMsg(
          loginMsg,
          "Password akun belum tersedia di Firebase.",
          "error"
        );

        return;
      }


      if (String(user.password) !== String(password)) {

        showMsg(
          loginMsg,
          "Password salah.",
          "error"
        );

        passwordInput.focus();

        return;
      }


      /*
       * Role
       */
      const role = String(user.role || "")
        .trim()
        .toLowerCase();


      if (role !== "admin" && role !== "user") {

        showMsg(
          loginMsg,
          "Role akun tidak valid. Gunakan admin atau user.",
          "error"
        );

        return;
      }


      /*
       * Nama user
       */
      const name = String(
        user.name || sapId
      ).trim();


      /*
       * Simpan session
       */
      setSession({
        sapId: sapId,
        name: name,
        role: role
      });


      /*
       * Login berhasil
       */
      showMsg(
        loginMsg,
        "Login berhasil. Mengarahkan ke dashboard...",
        "ok"
      );


      /*
       * Beri sedikit waktu agar pesan berhasil terlihat
       */
      setTimeout(() => {

        window.location.href = "dashboard.html";

      }, 300);


    } catch (error) {

      console.error(
        "LOGIN ERROR:",
        error
      );

      showMsg(
        loginMsg,
        "Login gagal. Periksa koneksi Firebase dan konfigurasi firebase.js.",
        "error"
      );

    } finally {

      if (loginButton) {
        loginButton.disabled = false;
        loginButton.textContent = "Login";
      }

    }

  });

}