// =====================================================
// IMPORT FIREBASE
// =====================================================

import { db } from "./firebase.js";

import {
    ref,
    onValue,
    push,
    set
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-database.js";

import {
    requireLogin,
    esc
} from "./nav.js";


// =====================================================
// SESSION LOGIN
// =====================================================

const s = requireLogin();


// =====================================================
// JIKA BELUM LOGIN
// =====================================================

if (!s) {
    window.location.href = "index.html";
}


// =====================================================
// ELEMENT HTML
// =====================================================

const userInfo =
    document.getElementById("userInfo");

const userSelect =
    document.getElementById("userSelect");

const adminSelectWrap =
    document.getElementById("adminSelectWrap");

const chatBox =
    document.getElementById("chatBox");

const chatForm =
    document.getElementById("chatForm");

const message =
    document.getElementById("message");


// =====================================================
// TAMPILKAN INFORMASI USER
// =====================================================

if (userInfo && s) {

    userInfo.innerHTML = `
        <strong>
            ${esc(
                s.name ||
                "User"
            )}
        </strong>

        <br>

        SAP ID:
        ${esc(
            s.sapId ||
            "-"
        )}
    `;

}


// =====================================================
// VARIABEL
// =====================================================

let selectedUser = "";

let unsubscribeChat = null;


// =====================================================
// ROLE
// =====================================================

const role =
    String(
        s.role || ""
    )
    .trim()
    .toLowerCase();


const sapId =
    String(
        s.sapId || ""
    )
    .trim();


// =====================================================
// VALIDASI SESSION
// =====================================================

if (!sapId) {

    if (chatBox) {

        chatBox.innerHTML = `
            <div class="empty">
                SAP ID tidak ditemukan pada session login.
            </div>
        `;

    }

}


// =====================================================
// FUNGSI EMPTY
// =====================================================

function showEmpty(text) {

    if (!chatBox) {
        return;
    }

    chatBox.innerHTML = `
        <div class="empty">
            ${esc(text)}
        </div>
    `;

}


// =====================================================
// ADMIN
// ADMIN BISA MEMILIH USER / OPERATOR
// =====================================================

if (role === "admin") {

    // =================================================
    // TAMPILKAN DROPDOWN USER
    // =================================================

    if (adminSelectWrap) {

        adminSelectWrap.style.display =
            "block";

    }


    // =================================================
    // LOAD USER
    // =================================================

    if (userSelect) {

        onValue(
            ref(db, "users"),

            (snapshot) => {

                userSelect.innerHTML = "";

                // =====================================
                // DATABASE USER KOSONG
                // =====================================

                if (!snapshot.exists()) {

                    userSelect.innerHTML = `
                        <option value="">
                            Tidak ada user/operator
                        </option>
                    `;

                    selectedUser = "";

                    showEmpty(
                        "Belum ada user/operator."
                    );

                    return;
                }


                const users =
                    snapshot.val();


                // =====================================
                // AMBIL USER / OPERATOR
                // =====================================

                const userList =
                    Object.entries(users)
                    .filter(
                        ([id, user]) => {

                            if (!user) {
                                return false;
                            }

                            const userRole =
                                String(
                                    user.role || ""
                                )
                                .trim()
                                .toLowerCase();

                            return (
                                userRole === "user" ||
                                userRole === "operator"
                            );

                        }
                    )
                    .sort(
                        (a, b) =>
                            String(a[0])
                                .localeCompare(
                                    String(b[0])
                                )
                    );


                // =====================================
                // TIDAK ADA USER
                // =====================================

                if (
                    userList.length === 0
                ) {

                    userSelect.innerHTML = `
                        <option value="">
                            Tidak ada user/operator
                        </option>
                    `;

                    selectedUser = "";

                    showEmpty(
                        "Tidak ada user/operator yang tersedia."
                    );

                    return;
                }


                // =====================================
                // MASUKKAN KE DROPDOWN
                // =====================================

                userList.forEach(
                    ([id, user]) => {

                        const option =
                            document.createElement(
                                "option"
                            );

                        option.value =
                            String(id);

                        option.textContent =
                            `${id} - ${
                                user.name ||
                                "User"
                            }`;

                        userSelect.appendChild(
                            option
                        );

                    }
                );


                // =====================================
                // PILIH USER PERTAMA
                // =====================================

                selectedUser =
                    String(
                        userSelect.value ||
                        ""
                    ).trim();


                // =====================================
                // TAMPILKAN CHAT
                // =====================================

                listenChat();

            },

            (error) => {

                console.error(
                    "Gagal membaca users:",
                    error
                );

                showEmpty(
                    "Gagal mengambil daftar user."
                );

            }
        );


        // =================================================
        // ADMIN GANTI USER
        // =================================================

        userSelect.addEventListener(
            "change",
            () => {

                selectedUser =
                    String(
                        userSelect.value ||
                        ""
                    ).trim();

                listenChat();

            }
        );

    }

}


// =====================================================
// USER / OPERATOR
// HANYA CHAT KE ADMIN
// =====================================================

else {

    // =================================================
    // SEMBUNYIKAN PILIHAN USER
    // =================================================

    if (adminSelectWrap) {

        adminSelectWrap.style.display =
            "none";

    }


    // =================================================
    // USER MENGGUNAKAN CHAT BERDASARKAN SAP ID SENDIRI
    //
    // Admin akan membuka chats/{SAP_ID_USER}
    // =================================================

    selectedUser =
        sapId;


    if (!selectedUser) {

        showEmpty(
            "SAP ID user tidak ditemukan."
        );

    } else {

        listenChat();

    }

}


// =====================================================
// LISTEN CHAT
// =====================================================

function listenChat() {

    // =================================================
    // VALIDASI TUJUAN
    // =================================================

    if (!selectedUser) {

        showEmpty(
            role === "admin"
                ? "Silakan pilih user/operator."
                : "SAP ID tidak ditemukan."
        );

        return;
    }


    // =================================================
    // HENTIKAN LISTENER SEBELUMNYA
    // =================================================

    if (
        typeof unsubscribeChat ===
        "function"
    ) {

        unsubscribeChat();

        unsubscribeChat =
            null;

    }


    // =================================================
    // PATH CHAT
    // =================================================

    const chatPath =
        `chats/${selectedUser}`;


    const chatRef =
        ref(
            db,
            chatPath
        );


    // =================================================
    // REALTIME CHAT
    // =================================================

    unsubscribeChat =
        onValue(
            chatRef,

            (snapshot) => {

                if (!chatBox) {
                    return;
                }


                chatBox.innerHTML = "";


                // =====================================
                // BELUM ADA CHAT
                // =====================================

                if (!snapshot.exists()) {

                    showEmpty(
                        "Belum ada percakapan."
                    );

                    return;
                }


                // =====================================
                // DATA CHAT
                // =====================================

                const data =
                    snapshot.val();


                const messages =
                    Object.entries(data)
                    .map(
                        ([id, value]) => ({

                            id,

                            ...(value || {})

                        })
                    );


                // =====================================
                // URUTKAN
                // =====================================

                messages.sort(
                    (a, b) =>
                        Number(
                            a.createdAt || 0
                        ) -
                        Number(
                            b.createdAt || 0
                        )
                );


                // =====================================
                // TAMPILKAN PESAN
                // =====================================

                messages.forEach(
                    (m) => {

                        const from =
                            String(
                                m.from || ""
                            ).trim();


                        const mine =
                            from === sapId;


                        const div =
                            document.createElement(
                                "div"
                            );


                        div.className =
                            mine
                                ? "chat-msg mine"
                                : "chat-msg";


                        const senderName =
                            m.name ||
                            m.from ||
                            "User";


                        const text =
                            m.message ||
                            "";


                        let time = "";


                        if (
                            m.createdAt
                        ) {

                            time =
                                new Date(
                                    Number(
                                        m.createdAt
                                    )
                                )
                                .toLocaleString(
                                    "id-ID"
                                );

                        }


                        div.innerHTML = `
                            <b>
                                ${esc(
                                    senderName
                                )}
                            </b>

                            <div>
                                ${esc(
                                    text
                                )}
                            </div>

                            <small>
                                ${esc(
                                    time
                                )}
                            </small>
                        `;


                        chatBox.appendChild(
                            div
                        );

                    }
                );


                // =====================================
                // SCROLL BAWAH
                // =====================================

                chatBox.scrollTop =
                    chatBox.scrollHeight;

            },

            (error) => {

                console.error(
                    "CHAT FIREBASE ERROR:",
                    error
                );


                showEmpty(
                    "Gagal membaca chat. Periksa Firebase Database Rules."
                );

            }
        );

}


// =====================================================
// KIRIM PESAN
// =====================================================

if (chatForm) {

    chatForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            // =================================================
            // AMBIL PESAN
            // =================================================

            const text =
                String(
                    message?.value || ""
                ).trim();


            if (!text) {
                return;
            }


            // =================================================
            // VALIDASI SAP ID
            // =================================================

            if (!sapId) {

                alert(
                    "SAP ID login tidak ditemukan."
                );

                return;
            }


            // =================================================
            // VALIDASI TUJUAN
            // =================================================

            if (!selectedUser) {

                alert(
                    role === "admin"
                        ? "Silakan pilih user terlebih dahulu."
                        : "SAP ID user tidak ditemukan."
                );

                return;
            }


            try {

                // =============================================
                // PATH
                // =============================================

                const chatPath =
                    `chats/${selectedUser}`;


                const chatRef =
                    ref(
                        db,
                        chatPath
                    );


                // =============================================
                // BUAT MESSAGE ID
                // =============================================

                const newMessage =
                    push(chatRef);


                // =============================================
                // DATA PESAN
                // =============================================

                const chatData = {

                    from:
                        sapId,

                    name:
                        s.name ||
                        "User",

                    message:
                        text,

                    createdAt:
                        Date.now(),

                    role:
                        role

                };


                // =============================================
                // SIMPAN
                // =============================================

                await set(
                    newMessage,
                    chatData
                );


                // =============================================
                // RESET INPUT
                // =============================================

                if (message) {

                    message.value =
                        "";

                    message.focus();

                }


            } catch (error) {

                console.error(
                    "GAGAL KIRIM CHAT:",
                    error
                );


                alert(
                    "Pesan gagal dikirim.\n\n" +
                    error.message
                );

            }

        }
    );

}