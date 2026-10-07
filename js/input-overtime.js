import {
    db
} from "./firebase.js";

import {
    ref,
    onValue,
    push,
    set,
    remove,
    get
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-database.js";

import {
    requireLogin
} from "./nav.js";

import {
    showMsg,
    esc
} from "./session.js";


/* =====================================================
   SESSION
===================================================== */

const s = requireLogin();

if (
    !s ||
    String(s.role || "").toLowerCase() !== "admin"
) {

    location.href = "dashboard.html";

    throw new Error(
        "Akses hanya untuk administrator."
    );

}


/* =====================================================
   DATA
===================================================== */

let all = [];

let users = {};


/* =====================================================
   MODE FORM
===================================================== */

let isEditMode = false;


/* =====================================================
   ELEMENT
===================================================== */

const category =
    document.getElementById("category");

const start =
    document.getElementById("start");

const end =
    document.getElementById("end");

const hours =
    document.getElementById("hours");

const conversionHours =
    document.getElementById("conversionHours");

const date =
    document.getElementById("date");

const userSap =
    document.getElementById("userSap");

const note =
    document.getElementById("note");

const search =
    document.getElementById("search");

const rows =
    document.getElementById("rows");

const otForm =
    document.getElementById("otForm");

const editId =
    document.getElementById("editId");

const resetBtn =
    document.getElementById("resetBtn");

const msg =
    document.getElementById("msg");


/* =====================================================
   ELEMENT EXCEL
===================================================== */

const excelFile =
    document.getElementById("excelFile");

const uploadExcelBtn =
    document.getElementById("uploadExcelBtn");

const downloadTemplateBtn =
    document.getElementById("downloadTemplateBtn");

const excelMsg =
    document.getElementById("excelMsg");


/* =====================================================
   CHECKBOX
===================================================== */

const selectAll =
    document.getElementById("selectAll");

const deleteSelectedBtn =
    document.getElementById("deleteSelectedBtn");

const selectedCount =
    document.getElementById("selectedCount");


/* =====================================================
   KATEGORI OVERTIME
===================================================== */

const overtimeCategory = {

    IOR1: {
        start: "13:00",
        end: "15:00",
        hours: 2
    },

    IOR2: {
        start: "21:00",
        end: "23:00",
        hours: 2
    },

    IOR3: {
        start: "05:00",
        end: "07:00",
        hours: 2
    },

    IPN1: {
        start: "19:00",
        end: "23:00",
        hours: 4
    },

    IPM1: {
        start: "15:00",
        end: "19:00",
        hours: 4
    }

};


/* =====================================================
   NORMALISASI ANGKA
===================================================== */

function normalizeNumber(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return 0;

    }


    if (
        typeof value === "number"
    ) {

        return Number.isFinite(value)
            ? value
            : 0;

    }


    let text =
        String(value)
            .trim();


    /*
     * Dukungan angka Indonesia:
     *
     * 0,5
     * 1,5
     * 2,5
     */

    text =
        text.replace(",", ".");


    const number =
        Number(text);


    return Number.isFinite(number)
        ? number
        : 0;

}


/* =====================================================
   FORMAT ANGKA
===================================================== */

function formatNumber(value) {

    const number =
        normalizeNumber(value);


    if (
        Number.isInteger(number)
    ) {

        return String(number);

    }


    return String(
        Number(
            number.toFixed(2)
        )
    );

}


/* =====================================================
   HITUNG JAM
===================================================== */

function calculateHours(value) {

    const number =
        normalizeNumber(value);


    /*
     * Aturan lama tetap dipertahankan.
     *
     * 4 jam  -> 3,5 jam
     * 11 jam -> 10,5 jam
     */

    if (number === 4) {

        return 3.5;

    }


    if (number === 11) {

        return 10.5;

    }


    return number;

}


/* =====================================================
   HITUNG KONVERSI
===================================================== */

function calculateConversionHours(value) {

    const number =
        normalizeNumber(value);


    const conversionMap = {

        0.5: 0.75,

        1: 1.5,

        1.5: 2.5,

        2: 3.5,

        3: 5.5,

        3.5: 6.5,

        4: 7.5,

        5: 9.5,

        6: 11.5,

        7: 14,

        8: 17

    };


    if (
        Object.prototype.hasOwnProperty.call(
            conversionMap,
            number
        )
    ) {

        return conversionMap[number];

    }


    return 0;

}


/* =====================================================
   HITUNG NILAI OVERTIME
===================================================== */

function calculateOvertimeValues(value) {

    const inputHours =
        normalizeNumber(value);


    const calculatedHours =
        calculateHours(inputHours);


    const calculatedConversion =
        calculateConversionHours(
            calculatedHours
        );


    return {

        hours:
            calculatedHours,

        conversionHours:
            calculatedConversion

    };

}


/* =====================================================
   GET CONVERSION
===================================================== */

/*
 * PENTING:
 *
 * Fungsi ini TIDAK lagi menghitung ulang
 * conversionHours berdasarkan hours.
 *
 * Nilai conversionHours diambil langsung
 * dari data Firebase.
 *
 * Ini diperlukan agar saat EDIT,
 * conversionHours bisa bebas diubah.
 */

function getConversionHours(x) {

    return normalizeNumber(
        x?.conversionHours
    );

}


/* =====================================================
   FORMAT WAKTU
===================================================== */

function formatTime(value) {

    if (!value) {

        return "";

    }


    const text =
        String(value)
            .trim();


    if (
        /^\d{2}:\d{2}$/.test(text)
    ) {

        return text;

    }


    const match =
        text.match(
            /^(\d{1,2}):(\d{1,2})/
        );


    if (!match) {

        return text;

    }


    const h =
        String(
            Number(match[1])
        ).padStart(2, "0");


    const m =
        String(
            Number(match[2])
        ).padStart(2, "0");


    return `${h}:${m}`;

}


/* =====================================================
   FORMAT TANGGAL
===================================================== */

function formatDate(value) {

    if (!value) {

        return "";

    }


    const text =
        String(value)
            .trim();


    if (
        /^\d{4}-\d{2}-\d{2}$/.test(text)
    ) {

        return text;

    }


    const dateObject =
        new Date(value);


    if (
        Number.isNaN(
            dateObject.getTime()
        )
    ) {

        return text;

    }


    const year =
        dateObject.getFullYear();


    const month =
        String(
            dateObject.getMonth() + 1
        ).padStart(2, "0");


    const day =
        String(
            dateObject.getDate()
        ).padStart(2, "0");


    return `${year}-${month}-${day}`;

}

hours.addEventListener(
    "input",
    () => {

        /*
         * Saat INPUT BARU:
         * conversion otomatis mengikuti hours.
         */

        if (!isEditMode) {

            const result =
                calculateOvertimeValues(
                    hours.value
                );


            conversionHours.value =
                formatNumber(
                    result.conversionHours
                );

        }

        /*
         * Saat EDIT:
         * jangan sentuh conversionHours.
         *
         * User bebas mengisi conversion.
         */

    }
);

conversionHours.value =
    formatNumber(
        normalizeNumber(
            x?.conversionHours
        )
    );

if (isEditMode) {

    inputHours =
        rawHours;

    inputConversion =
        normalizeNumber(
            conversionHours?.value
        );

} else {

    const overtime =
        calculateOvertimeValues(
            rawHours
        );

    inputHours =
        overtime.hours;

    inputConversion =
        overtime.conversionHours;

}
