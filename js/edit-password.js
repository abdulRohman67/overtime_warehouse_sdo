// =====================================================
// EDIT PASSWORD
// USER DAN ADMIN DAPAT MENGGANTI PASSWORD SENDIRI
// =====================================================

import { db } from "./firebase.js";

import {
    get,
    update,
    ref
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-database.js";

import {
    getSession,
    showMsg
} from "./session.js";

import {
    requireLogin
} from "./nav.js";


// =====================================================
// REQUIRE LOGIN
// =====================================================

const session = requireLogin();


// =====================================================
// JIKA BELUM LOGIN
// =====================================================

if (!session) {

    throw new Error(
        "Session tidak ditemukan."
    );

}


// =====================================================
// ELEMENT
// =====================================================

const sapIdInput =
    document.getElementById("sapId");

const nameInput =
    document.getElementById("name");

const passwordForm =
    document.getElementById("passwordForm");

const oldPasswordInput =
    document.getElementById("oldPassword");

const newPasswordInput =
    document.getElementById("newPassword");

const confirmPasswordInput =
    document.getElementById("confirmPassword");

const passwordMsg =
    document.getElementById("passwordMsg");

const savePasswordButton =
    document.getElementById(
        "savePasswordButton"
    );


// =====================================================
// DATA SESSION
// =====================================================

const sapId =
    String(session.sapId || "").trim();

const sessionName =
    String(session.name || "").trim();


// =====================================================
// VALIDASI SESSION
// =====================================================

if (!sapId) {

    showMsg(
        passwordMsg,
        "Session SAP ID tidak ditemukan. Silakan login kembali.",
        "error"
    );

    if (savePasswordButton) {
        savePasswordButton.disabled = true;
    }

}


// =====================================================
// TAMPILKAN DATA USER
// =====================================================

if (sapIdInput) {

    sapIdInput.value =
        sapId;

}


if (nameInput) {

    nameInput.value =
        sessionName;

}


// =====================================================
// AMBIL DATA USER DARI FIREBASE
// =====================================================

let currentUser = null;


async function loadUser() {

    try {

        if (!sapId) {
            return;
        }


        const userRef =
            ref(
                db,
                "users/" + sapId
            );


        const snapshot =
            await get(userRef);


        if (!snapshot.exists()) {

            showMsg(
                passwordMsg,
                "Data akun tidak ditemukan.",
                "error"
            );

            if (savePasswordButton) {
                savePasswordButton.disabled = true;
            }

            return;
        }


        currentUser =
            snapshot.val();


        // ---------------------------------------------
        // Gunakan nama dari database
        // ---------------------------------------------

        if (nameInput) {

            nameInput.value =
                currentUser.name || sessionName;

        }


    } catch (error) {

        console.error(
            "LOAD USER ERROR:",
            error
        );


        showMsg(
            passwordMsg,
            "Gagal mengambil data akun.",
            "error"
        );

    }

}


// =====================================================
// LOAD USER
// =====================================================

loadUser();


// =====================================================
// TOGGLE PASSWORD
// =====================================================

document
    .querySelectorAll(".toggle-password")
    .forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    const targetId =
                        button.dataset.target;

                    const input =
                        document.getElementById(
                            targetId
                        );


                    if (!input) {
                        return;
                    }


                    const isPassword =
                        input.type === "password";


                    input.type =
                        isPassword
                            ? "text"
                            : "password";


                    button.textContent =
                        isPassword
                            ? "Sembunyikan"
                            : "Lihat";

                }
            );

        }
    );


// =====================================================
// SUBMIT FORM
// =====================================================

if (passwordForm) {

    passwordForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            // -----------------------------------------
            // RESET PESAN
            // -----------------------------------------

            passwordMsg.className =
                "message";

            passwordMsg.textContent =
                "";


            // -----------------------------------------
            // AMBIL INPUT
            // -----------------------------------------

            const oldPassword =
                oldPasswordInput.value;

            const newPassword =
                newPasswordInput.value;

            const confirmPassword =
                confirmPasswordInput.value;


            // -----------------------------------------
            // VALIDASI
            // -----------------------------------------

            if (!oldPassword) {

                showMsg(
                    passwordMsg,
                    "Password lama wajib diisi.",
                    "error"
                );

                oldPasswordInput.focus();

                return;

            }


            if (!newPassword) {

                showMsg(
                    passwordMsg,
                    "Password baru wajib diisi.",
                    "error"
                );

                newPasswordInput.focus();

                return;

            }


            if (!confirmPassword) {

                showMsg(
                    passwordMsg,
                    "Konfirmasi password baru wajib diisi.",
                    "error"
                );

                confirmPasswordInput.focus();

                return;

            }


            // -----------------------------------------
            // USER BELUM SELESAI DIMUAT
            // -----------------------------------------

            if (!currentUser) {

                showMsg(
                    passwordMsg,
                    "Data akun belum siap. Silakan coba lagi.",
                    "error"
                );

                return;

            }


            // -----------------------------------------
            // CEK PASSWORD LAMA
            // -----------------------------------------

            if (
                String(currentUser.password || "") !==
                String(oldPassword)
            ) {

                showMsg(
                    passwordMsg,
                    "Password lama salah.",
                    "error"
                );

                oldPasswordInput.focus();

                return;

            }


            // -----------------------------------------
            // PASSWORD BARU TIDAK BOLEH SAMA
            // -----------------------------------------

            if (
                String(oldPassword) ===
                String(newPassword)
            ) {

                showMsg(
                    passwordMsg,
                    "Password baru harus berbeda dari password lama.",
                    "error"
                );

                newPasswordInput.focus();

                return;

            }


            // -----------------------------------------
            // KONFIRMASI PASSWORD
            // -----------------------------------------

            if (
                String(newPassword) !==
                String(confirmPassword)
            ) {

                showMsg(
                    passwordMsg,
                    "Konfirmasi password baru tidak cocok.",
                    "error"
                );

                confirmPasswordInput.focus();

                return;

            }


            // -----------------------------------------
            // CEK PANJANG PASSWORD
            // -----------------------------------------

            if (newPassword.length < 6) {

                showMsg(
                    passwordMsg,
                    "Password baru minimal 6 karakter.",
                    "error"
                );

                newPasswordInput.focus();

                return;

            }


            // -----------------------------------------
            // DISABLE BUTTON
            // -----------------------------------------

            savePasswordButton.disabled =
                true;

            savePasswordButton.textContent =
                "Menyimpan...";


            try {

                // -------------------------------------
                // UPDATE PASSWORD SAJA
                // -------------------------------------

                const userRef =
                    ref(
                        db,
                        "users/" + sapId
                    );


                await update(
                    userRef,
                    {
                        password:
                            newPassword,

                        updatedAt:
                            Date.now()
                    }
                );


                // -------------------------------------
                // UPDATE DATA LOKAL
                // -------------------------------------

                currentUser.password =
                    newPassword;


                // -------------------------------------
                // RESET FORM
                // -------------------------------------

                passwordForm.reset();


                // Kembalikan SAP ID dan nama
                sapIdInput.value =
                    sapId;

                nameInput.value =
                    currentUser.name ||
                    sessionName;


                // -------------------------------------
                // PESAN BERHASIL
                // -------------------------------------

                showMsg(
                    passwordMsg,
                    "Password berhasil diubah.",
                    "ok"
                );


            } catch (error) {

                console.error(
                    "EDIT PASSWORD ERROR:",
                    error
                );


                showMsg(
                    passwordMsg,
                    "Gagal mengubah password: " +
                    error.message,
                    "error"
                );


            } finally {

                savePasswordButton.disabled =
                    false;

                savePasswordButton.textContent =
                    "Simpan Password";

            }

        }
    );

}