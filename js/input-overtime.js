import{db}from"./firebase.js";
import{ref,onValue,push,set,remove,get}from"https://www.gstatic.com/firebasejs/12.17.1/firebase-database.js";
import{requireLogin}from"./nav.js";
import{showMsg,esc}from"./session.js";


/* =====================================================
   SESSION
===================================================== */

const s=requireLogin();


if(
    !s ||
    String(s.role||"").toLowerCase()!=="admin"
){

    location.href="dashboard.html";

    throw new Error(
        "Akses hanya untuk administrator."
    );

}


/* =====================================================
   DATA
===================================================== */

let all=[];

let users={};


/* =====================================================
   ELEMENT
===================================================== */

const category=
    document.getElementById("category");

const start=
    document.getElementById("start");

const end=
    document.getElementById("end");

const hours=
    document.getElementById("hours");

const conversionHours=
    document.getElementById("conversionHours");

const date=
    document.getElementById("date");

const userSap=
    document.getElementById("userSap");

const note=
    document.getElementById("note");

const search=
    document.getElementById("search");

const rows=
    document.getElementById("rows");

const otForm=
    document.getElementById("otForm");

const editId=
    document.getElementById("editId");

const resetBtn=
    document.getElementById("resetBtn");

const msg=
    document.getElementById("msg");


/* =====================================================
   KATEGORI OVERTIME
===================================================== */

const overtimeCategory={

    IOR1:{
        start:"13:00",
        end:"15:00",
        hours:2
    },

    IOR2:{
        start:"21:00",
        end:"23:00",
        hours:2
    },

    IOR3:{
        start:"05:00",
        end:"07:00",
        hours:2
    },

    IPN1:{
        start:"19:00",
        end:"23:00",
        hours:4
    },

    IPM1:{
        start:"15:00",
        end:"19:00",
        hours:4
    }

};


/* =====================================================
   HITUNG JAM OVERTIME
=====================================================

   ATURAN:

   4 jam  -> 3.5 jam
   11 jam -> 10.5 jam

   Selain itu tetap.

===================================================== */

function calculateHours(value){

    const total=
        Number(value)||0;


    /* -----------------------------------------------
       4 JAM POTONG 0.5
    ------------------------------------------------ */

    if(total===4){

        return 3.5;

    }


    /* -----------------------------------------------
       11 JAM POTONG 0.5
    ------------------------------------------------ */

    if(total===11){

        return 10.5;

    }


    return total;

}


/* =====================================================
   HITUNG KONVERSI LEMBUR
=====================================================

   JAM OVERTIME -> KONVERSI

   1   -> 1.5
   2   -> 3.5
   3   -> 5.5
   3.5 -> 6.5
   4   -> 7.5
   5   -> 9.5
   6   -> 11.5
   7   -> 14
   8   -> 16

===================================================== */

function calculateConversionHours(value){

    const total=
        Number(value)||0;


    const conversion={

        1:1.5,

        2:3.5,

        3:5.5,

        3.5:6.5,

        4:7.5,

        5:9.5,

        6:11.5,

        7:14,

         8: 16,

        3.5: 6.5,

        1.5 : 2.5

    };


    return conversion[total]!==undefined

        ?conversion[total]

        :total;

}


/* =====================================================
   AMBIL KONVERSI DATA
=====================================================

   DATA BARU:
   menggunakan conversionHours dari Firebase.

   DATA LAMA:
   dihitung ulang dari hours.

===================================================== */

function getConversionHours(x){

    if(

        x &&

        x.conversionHours!==undefined &&

        x.conversionHours!==null &&

        x.conversionHours!==""

    ){

        const value=
            Number(x.conversionHours);


        if(Number.isFinite(value)){

            return value;

        }

    }


    return calculateConversionHours(
        x?.hours||0
    );

}


/* =====================================================
   FORMAT ANGKA
===================================================== */

function formatNumber(value){

    const number=
        Number(value)||0;


    return Number(
        number.toFixed(2)
    ).toString();

}


/* =====================================================
   KATEGORI DIPILIH
===================================================== */

if(category){

    category.onchange=()=>{


        const x=
            overtimeCategory[
                category.value
            ];


        if(!x){

            start.value="";

            end.value="";

            hours.value="";

            conversionHours.value="";

            return;

        }


        /* -------------------------------------------
           JAM MULAI
        -------------------------------------------- */

        start.value=
            x.start;


        /* -------------------------------------------
           JAM SELESAI
        -------------------------------------------- */

        end.value=
            x.end;


        /* -------------------------------------------
           JAM OVERTIME
           
           4 JAM:
           4 -> 3.5
        -------------------------------------------- */

        hours.value=
            calculateHours(
                x.hours
            );


        /* -------------------------------------------
           KONVERSI
        -------------------------------------------- */

        conversionHours.value=
            calculateConversionHours(
                hours.value
            );

    };

}


/* =====================================================
   JUMLAH JAM BERUBAH
===================================================== */

if(hours){

    hours.oninput=()=>{


        const inputHours=
            Number(
                hours.value
            )||0;


        /*
         * Preview konversi mengikuti
         * jam yang dimasukkan.
         */

        const totalHours=
            calculateHours(
                inputHours
            );


        conversionHours.value=
            calculateConversionHours(
                totalHours
            );

    };

}


/* =====================================================
   LOAD USER
===================================================== */

onValue(

    ref(
        db,
        "users"
    ),

    snap=>{


        users=

            snap.exists()

                ?

            snap.val()

                :

            {};


        if(userSap){

            userSap.innerHTML=
                '<option value="">Pilih user</option>';


            Object.entries(users)

                .filter(
                    ([k,u])=>

                        String(
                            u?.role||""
                        ).toLowerCase()==="user"

                )

                .sort(
                    ([a],[b])=>

                        String(a)
                            .localeCompare(
                                String(b)
                            )

                )

                .forEach(
                    ([k,u])=>{

                        userSap.insertAdjacentHTML(

                            "beforeend",

                            `<option value="${esc(k)}">${esc(k)} - ${esc(u?.name||"")}</option>`

                        );

                    }

                );

        }


        render();

    }

);


/* =====================================================
   LOAD OVERTIME
===================================================== */

onValue(

    ref(
        db,
        "overtime"
    ),

    snap=>{


        all=

            snap.exists()

                ?

            Object.entries(
                snap.val()
            )

            .map(
                ([id,x])=>({

                    id,

                    ...(x||{})

                })
            )

                :

            [];


        render();

    }

);


/* =====================================================
   RENDER DATA
===================================================== */

function render(){

    if(!rows){

        return;

    }


    const q=

        String(
            search?.value||""
        )
        .toLowerCase()
        .trim();


    const d=

        all

            .filter(
                x=>{

                    const text=

                        `${x?.userSap||""} `+

                        `${users[
                            x?.userSap
                        ]?.name||""} `+

                        `${x?.date||""} `+

                        `${x?.category||""} `+

                        `${x?.note||""}`;


                    return(

                        !q ||

                        text
                            .toLowerCase()
                            .includes(q)

                    );

                }

            )

            .sort(
                (a,b)=>

                    String(
                        b?.date||""
                    )
                    .localeCompare(

                        String(
                            a?.date||""
                        )

                    )

            );


    if(!d.length){

        rows.innerHTML=`

            <tr>

                <td
                    colspan="9"
                    class="empty"
                >

                    Belum ada data.

                </td>

            </tr>

        `;

        return;

    }


    rows.innerHTML=

        d

            .map(
                x=>{

                    const conversion=
                        getConversionHours(x);


                    return`

                        <tr>

                            <td>
                                ${esc(
                                    x?.date||""
                                )}
                            </td>

                            <td>
                                ${esc(
                                    x?.userSap||""
                                )}
                            </td>

                            <td>
                                ${esc(
                                    users[
                                        x?.userSap
                                    ]?.name||""
                                )}
                            </td>

                            <td>
                                ${esc(
                                    x?.start||""
                                )}
                            </td>

                            <td>
                                ${esc(
                                    x?.end||""
                                )}
                            </td>

                            <td>
                                ${formatNumber(
                                    x?.hours||0
                                )}
                            </td>

                            <td>
                                ${formatNumber(
                                    conversion
                                )}
                            </td>

                            <td>
                                ${esc(
                                    x?.note||""
                                )}
                            </td>

                            <td class="actions">

                                <button
                                    type="button"
                                    data-edit="${esc(
                                        x.id
                                    )}"
                                >
                                    Edit
                                </button>

                                <button
                                    type="button"
                                    class="danger"
                                    data-del="${esc(
                                        x.id
                                    )}"
                                >
                                    Hapus
                                </button>

                            </td>

                        </tr>

                    `;

                }

            )

            .join("");

}


if(search){

    search.oninput=
        render;

}


/* =====================================================
   SIMPAN DATA
===================================================== */

if(otForm){

    otForm.onsubmit=
        async e=>{


            e.preventDefault();


            /* =========================================
               JAM INPUT
            ========================================== */

            const inputHours=

                Number(
                    hours?.value
                )||0;


            if(inputHours<=0){

                alert(
                    "Jumlah jam overtime harus lebih dari 0."
                );

                return;

            }


            /* =========================================
               HITUNG JAM SETELAH POTONGAN
               
               4  -> 3.5
               11 -> 10.5
            ========================================== */

            const totalHours=

                calculateHours(
                    inputHours
                );


            /* =========================================
               HITUNG KONVERSI
               
               Berdasarkan total jam setelah potongan
            ========================================== */

            const totalConversionHours=

                calculateConversionHours(
                    totalHours
                );


            /* =========================================
               DATA
            ========================================== */

            const data={

                date:
                    date?.value||"",

                start:
                    start?.value||"",

                end:
                    end?.value||"",

                /*
                 * JAM SETELAH POTONGAN
                 */

                hours:
                    totalHours,

                /*
                 * KONVERSI
                 */

                conversionHours:
                    totalConversionHours,

                /*
                 * USER
                 */

                userSap:
                    userSap?.value||"",

                /*
                 * KATEGORI
                 */

                category:
                    category?.value||"",

                /*
                 * KETERANGAN
                 */

                note:
                    note?.value.trim()||"",

                updatedAt:
                    Date.now()

            };


            /* =========================================
               ID
            ========================================== */

            const id=

                editId?.value

                    ?

                editId.value

                    :

                push(
                    ref(
                        db,
                        "overtime"
                    )
                ).key;


            /* =========================================
               SIMPAN FIREBASE
            ========================================== */

            await set(

                ref(
                    db,
                    "overtime/"+id
                ),

                data

            );


            /* =========================================
               PESAN
            ========================================== */

            if(msg){

                showMsg(

                    msg,

                    "Data overtime berhasil disimpan.",

                    "ok"

                );

            }


            reset();

        };

}


/* =====================================================
   RESET
===================================================== */

function reset(){

    if(otForm){

        otForm.reset();

    }


    if(editId){

        editId.value="";

    }


    if(conversionHours){

        conversionHours.value="";

    }

}


if(resetBtn){

    resetBtn.onclick=
        reset;

}


/* =====================================================
   EDIT / HAPUS
===================================================== */

if(rows){

    rows.onclick=
        async e=>{


            const ed=
                e.target.dataset.edit;


            const del=
                e.target.dataset.del;


            /* =========================================
               HAPUS
            ========================================== */

            if(del){

                if(

                    confirm(
                        "Hapus data overtime ini?"
                    )

                ){

                    await remove(

                        ref(
                            db,
                            "overtime/"+del
                        )

                    );

                }

                return;

            }


            /* =========================================
               EDIT
            ========================================== */

            if(ed){

                const snapshot=

                    await get(

                        ref(
                            db,
                            "overtime/"+ed
                        )

                    );


                if(!snapshot.exists()){

                    alert(
                        "Data overtime tidak ditemukan."
                    );

                    return;

                }


                const x=
                    snapshot.val();


                /* -------------------------------------
                   ID
                -------------------------------------- */

                if(editId){

                    editId.value=
                        ed;

                }


                /* -------------------------------------
                   TANGGAL
                -------------------------------------- */

                if(date){

                    date.value=
                        x?.date||"";

                }


                /* -------------------------------------
                   USER
                -------------------------------------- */

                if(userSap){

                    userSap.value=
                        x?.userSap||"";

                }


                /* -------------------------------------
                   KATEGORI
                -------------------------------------- */

                if(category){

                    category.value=
                        x?.category||"";

                }


                /* -------------------------------------
                   START
                -------------------------------------- */

                if(start){

                    start.value=
                        x?.start||"";

                }


                /* -------------------------------------
                   END
                -------------------------------------- */

                if(end){

                    end.value=
                        x?.end||"";

                }


                /* -------------------------------------
                   HOURS
                   
                   Data Firebase digunakan apa adanya.
                -------------------------------------- */

                if(hours){

                    hours.value=
                        x?.hours||0;

                }


                /* -------------------------------------
                   CONVERSION
                -------------------------------------- */

                if(conversionHours){

                    conversionHours.value=

                        getConversionHours(
                            x
                        );

                }


                /* -------------------------------------
                   NOTE
                -------------------------------------- */

                if(note){

                    note.value=
                        x?.note||"";

                }


                window.scrollTo({

                    top:0,

                    behavior:"smooth"

                });

            }

        };

}
