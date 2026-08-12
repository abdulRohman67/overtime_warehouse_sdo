export function getSession(){try{return JSON.parse(localStorage.getItem("overtimeSession")||"null")}catch{return null}}
export function setSession(v){localStorage.setItem("overtimeSession",JSON.stringify(v))}
export function logout(){localStorage.removeItem("overtimeSession");location.href="index.html"}
export function esc(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
export function today(){return new Date().toISOString().slice(0,10)}
export function showMsg(el,text,type="ok"){if(!el)return;el.textContent=text;el.className=`message show ${type}`}
