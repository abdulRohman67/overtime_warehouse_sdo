import { db } from "./firebase.js";

import {
    ref,
    onValue,
    set,
    remove,
    get
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-database.js";

import {
    requireLogin
} from "./nav.js";


// =====================================================
// CEK LOGIN
// =====================================================

const session = requireLogin();

if (!session || session.role !== "admin") {

    window.location.href = "dashboard.html";

}


// =====================================================
// ELEMENT HTML
// =====================================================

const form = document.getElementById("userForm");
const messageBox = document.getElementById("msg");

const sapIdInput = document.getElementById("sapId");
const nameInput = document.getElementById("name");
const passwordInput = document.getElementById("password");
const roleInput = document.getElementById("role");

const resetButton = document.getElementById("resetBtn");
const tableBody = document.getElementById("rows");


// =====================================================
// VARIABLE EDIT
// =====================================================

let editingSap = "";


// =====================================================
// PESAN
// =====================================================

function showMessage(text, type = "ok") {

    if (!messageBox) {
        return;
    }

    messageBox.textContent = text;

    messageBox.className =
        "message show " + type;

}


// =====================================================
// RESET FORM
// =====================================================

function resetForm() {

    editingSap = "";

    form.reset();

    sapIdInput.disabled = false;

    passwordInput.required = true;

    showMessage("", "ok");

    messageBox.className = "message";

}


// =====================================================
// TOMBOL RESET
// =====================================================

if (resetButton) {

    resetButton.addEventListener(
        "click",
        resetForm
    );

}


// =====================================================
// SIMPAN / EDIT AKUN
// =====================================================

if (form) {

    form.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const sapId =
                sapIdInput.value.trim();

            const nama =
                nameInput.value.trim();

            const password =
                passwordInput.value;

            const role =
                roleInput.value;


            // -----------------------------------------
            // VALIDASI SAP
            // -----------------------------------------

            if (sapId === "") {

                showMessage(
                    "SAP ID wajib diisi.",
                    "error"
                );

                sapIdInput.focus();

                return;
            }


            // -----------------------------------------
            // VALIDASI NAMA
            // -----------------------------------------

            if (nama === "") {

                showMessage(
                    "Nama wajib diisi.",
                    "error"
                );

                nameInput.focus();

                return;
            }


            // -----------------------------------------
            // VALIDASI ROLE
            // -----------------------------------------

            if (
                role !== "admin" &&
                role !== "user"
            ) {

                showMessage(
                    "Role harus admin atau user.",
                    "error"
                );

                return;
            }


            try {

                let passwordFinal =
                    password;


                // -------------------------------------
                // MODE EDIT
                // -------------------------------------

                if (editingSap) {

                    const oldSnapshot =
                        await get(
                            ref(
                                db,
                                "users/" + editingSap
                            )
                        );


                    if (oldSnapshot.exists()) {

                        const oldUser =
                            oldSnapshot.val();


                        /*
                         * Jika password dikosongkan
                         * ketika edit, gunakan password lama.
                         */

                        if (
                            passwordFinal === ""
                        ) {

                            passwordFinal =
                                oldUser.password || "";

                        }

                    }

                }


                // -------------------------------------
                // PASSWORD WAJIB
                // -------------------------------------

                if (passwordFinal === "") {

                    showMessage(
                        "Password wajib diisi.",
                        "error"
                    );

                    passwordInput.focus();

                    return;
                }


                // -------------------------------------
                // DATA USER
                // -------------------------------------

                const userData = {

                    name: nama,

                    password: passwordFinal,

                    role: role,

                    updatedAt: Date.now()

                };


                // -------------------------------------
                // SIMPAN USER
                // -------------------------------------

                await set(
                    ref(
                        db,
                        "users/" + sapId
                    ),
                    userData
                );


                // -------------------------------------
                // JIKA SAP DIUBAH
                // -------------------------------------

                if (
                    editingSap &&
                    editingSap !== sapId
                ) {

                    await remove(
                        ref(
                            db,
                            "users/" + editingSap
                        )
                    );

                }


                showMessage(
                    "Akun berhasil disimpan.",
                    "ok"
                );


                resetForm();


            } catch (error) {

                console.error(
                    "SAVE USER ERROR:",
                    error
                );


                showMessage(
                    "Gagal menyimpan akun: " +
                    error.message,
                    "error"
                );

            }

        }
    );

}


// =====================================================
// MENAMPILKAN DATA USER
// =====================================================

onValue(
    ref(db, "users"),
    function (snapshot) {

        tableBody.innerHTML = "";


        // -----------------------------------------
        // DATABASE KOSONG
        // -----------------------------------------

        if (!snapshot.exists()) {

            tableBody.innerHTML = `
                <tr>
                    <td
                        colspan="5"
                        class="empty"
                    >
                        Belum ada akun.
                    </td>
                </tr>
            `;

            return;
        }


        const users =
            snapshot.val();


        // -----------------------------------------
        // URUTKAN SAP
        // -----------------------------------------

        const userEntries =
            Object.entries(users).sort(
                ([sapA], [sapB]) =>
                    sapA.localeCompare(
                        sapB,
                        undefined,
                        {
                            numeric: true
                        }
                    )
            );


        // -----------------------------------------
        // TAMPILKAN
        // -----------------------------------------

        userEntries.forEach(
            ([sap, user]) => {

                const roleClass =
                    user.role === "admin"
                        ? "badge admin"
                        : "badge";


                const row =
                    document.createElement("tr");


                row.innerHTML = `

                    <td>
                        ${escapeHTML(sap)}
                    </td>

                    <td>
                        ${escapeHTML(
                            user.name || ""
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            user.password || ""
                        )}
                    </td>

                    <td>
                        <span class="${roleClass}">
                            ${escapeHTML(
                                user.role || ""
                            )}
                        </span>
                    </td>

                    <td class="actions">

                        <button
                            type="button"
                            data-edit="${escapeHTML(sap)}"
                        >
                            Edit
                        </button>

                        <button
                            type="button"
                            class="danger"
                            data-delete="${escapeHTML(sap)}"
                        >
                            Hapus
                        </button>

                    </td>

                `;


                tableBody.appendChild(row);

            }
        );

    }
);


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// =====================================================
// EDIT / HAPUS
// =====================================================

if (tableBody) {

    tableBody.addEventListener(
        "click",
        async function (event) {

            const editSap =
                event.target.dataset.edit;

            const deleteSap =
                event.target.dataset.delete;


            // =========================================
            // EDIT
            // =========================================

            if (editSap) {

                try {

                    const snapshot =
                        await get(
                            ref(
                                db,
                                "users/" + editSap
                            )
                        );


                    if (!snapshot.exists()) {

                        showMessage(
                            "Data akun tidak ditemukan.",
                            "error"
                        );

                        return;
                    }


                    const user =
                        snapshot.val();


                    editingSap =
                        editSap;


                    sapIdInput.value =
                        editSap;

                    sapIdInput.disabled =
                        true;


                    nameInput.value =
                        user.name || "";


                    passwordInput.value =
                        user.password || "";


                    roleInput.value =
                        user.role || "user";


                    /*
                     * Scroll ke form
                     */

                    window.scrollTo({

                        top: 0,

                        behavior: "smooth"

                    });


                    showMessage(
                        "Mode edit akun: " +
                        editSap,
                        "ok"
                    );


                } catch (error) {

                    console.error(
                        "EDIT USER ERROR:",
                        error
                    );


                    showMessage(
                        "Gagal mengambil data akun.",
                        "error"
                    );

                }

            }


            // =========================================
            // HAPUS
            // =========================================

            if (deleteSap) {

                /*
                 * Jangan hapus akun yang sedang login
                 */

                if (
                    deleteSap ===
                    session.sapId
                ) {

                    alert(
                        "Akun admin yang sedang login tidak boleh dihapus."
                    );

                    return;

                }


                const konfirmasi =
                    confirm(
                        "Apakah Anda yakin ingin menghapus akun " +
                        deleteSap +
                        "?"
                    );


                if (!konfirmasi) {

                    return;

                }


                try {

                    await remove(
                        ref(
                            db,
                            "users/" + deleteSap
                        )
                    );


                    showMessage(
                        "Akun " +
                        deleteSap +
                        " berhasil dihapus.",
                        "ok"
                    );


                } catch (error) {

                    console.error(
                        "DELETE USER ERROR:",
                        error
                    );


                    showMessage(
                        "Gagal menghapus akun: " +
                        error.message,
                        "error"
                    );

                }

            }

        }
    );

}