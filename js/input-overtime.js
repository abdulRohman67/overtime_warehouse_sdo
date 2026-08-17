import{db}from"./firebase.js";
import{ref,onValue,push,set,remove,get}from"https://www.gstatic.com/firebasejs/12.17.1/firebase-database.js";
import{requireLogin}from"./nav.js";
import{showMsg,esc}from"./session.js";


const s=requireLogin();

if(!s||s.role!=="admin"){
    location.href="dashboard.html";
}


let all=[],users={};


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
   HITUNG POTONGAN
===================================================== */

function calculateHours(value){

    const total=Number(value)||0;

    if(total===4){
        return 3.5;
    }

    if(total===11){
        return 10.5;
    }

    return total;

}


/* =====================================================
   KATEGORI DIPILIH
===================================================== */

category.onchange=()=>{

    const x=overtimeCategory[category.value];


    if(!x){

        start.value="";
        end.value="";
        hours.value="";

        return;

    }


    start.value=x.start;

    end.value=x.end;

    hours.value=calculateHours(x.hours);

};


/* =====================================================
   DATA USER
===================================================== */

onValue(ref(db,"users"),snap=>{

    users=snap.exists()?snap.val():{};

    userSap.innerHTML=
        '<option value="">Pilih user</option>';

    Object.entries(users)
        .filter(([k,u])=>u.role==="user")
        .sort()
        .forEach(([k,u])=>

            userSap.insertAdjacentHTML(
                "beforeend",
                `<option value="${esc(k)}">${esc(k)} - ${esc(u.name)}</option>`
            )

        );

    render();

});


/* =====================================================
   DATA OVERTIME
===================================================== */

onValue(ref(db,"overtime"),snap=>{

    all=snap.exists()
        ?Object.entries(snap.val()).map(
            ([id,x])=>({id,...x})
        )
        :[];

    render();

});


/* =====================================================
   RENDER
===================================================== */

function render(){

    const q=(search.value||"").toLowerCase();

    const d=all
        .filter(x=>
            !q||
            `${x.userSap} ${users[x.userSap]?.name||""} ${x.date} ${x.note||""}`
            .toLowerCase()
            .includes(q)
        )
        .sort((a,b)=>
            (b.date||"").localeCompare(a.date||"")
        );


    rows.innerHTML=d.length

        ?d.map(x=>`

            <tr>

                <td>${esc(x.date)}</td>

                <td>${esc(x.userSap)}</td>

                <td>${esc(users[x.userSap]?.name||"")}</td>

                <td>${esc(x.start)}</td>

                <td>${esc(x.end)}</td>

                <td>${x.hours||0}</td>

                <td>${esc(x.note||"")}</td>

                <td class="actions">

                    <button
                        data-edit="${x.id}"
                    >
                        Edit
                    </button>

                    <button
                        class="danger"
                        data-del="${x.id}"
                    >
                        Hapus
                    </button>

                </td>

            </tr>

        `).join("")

        :`

            <tr>

                <td
                    colspan="8"
                    class="empty"
                >
                    Belum ada data.
                </td>

            </tr>

        `;

}


search.oninput=render;


/* =====================================================
   SIMPAN
===================================================== */

otForm.onsubmit=async e=>{

    e.preventDefault();


    let totalHours=Number(hours.value);


    if(totalHours<0){
        return;
    }


    /*
     * 4 jam  -> 3.5
     * 11 jam -> 10.5
     */

    totalHours=calculateHours(totalHours);


    const data={

        date:date.value,

        start:start.value,

        end:end.value,

        hours:totalHours,

        userSap:userSap.value,

        category:category.value,

        note:note.value.trim(),

        updatedAt:Date.now()

    };


    const id=
        editId.value||
        push(ref(db,"overtime")).key;


    await set(
        ref(db,"overtime/"+id),
        data
    );


    showMsg(
        msg,
        "Data overtime berhasil disimpan.",
        "ok"
    );


    reset();

};


/* =====================================================
   RESET
===================================================== */

function reset(){

    otForm.reset();

    editId.value="";

}


resetBtn.onclick=reset;


/* =====================================================
   EDIT / HAPUS
===================================================== */

rows.onclick=async e=>{

    const ed=e.target.dataset.edit;
    const del=e.target.dataset.del;


    /* =================================================
       HAPUS
    ================================================== */

    if(del){

        if(
            confirm(
                "Hapus data overtime ini?"
            )
        ){

            await remove(
                ref(db,"overtime/"+del)
            );

        }

        return;

    }


    /* =================================================
       EDIT
    ================================================== */

    if(ed){

        const x=(
            await get(
                ref(db,"overtime/"+ed)
            )
        ).val();


        editId.value=ed;

        date.value=x.date||"";

        userSap.value=x.userSap||"";

        category.value=x.category||"";

        start.value=x.start||"";

        end.value=x.end||"";

        hours.value=x.hours||0;

        note.value=x.note||"";


        window.scrollTo({
            top:0,
            behavior:"smooth"
        });

    }

};
