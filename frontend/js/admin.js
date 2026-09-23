import { API_URL } from "./config.js?v=runtime-api-2";

const ADMIN_LOGIN_PAGE = "login.html";
const ADMIN_ACCOUNT_PAGE = "account.html";

function getAdminToken() {
  return localStorage.getItem("snapup_token") || "";
}

function setGateError(message) {
  const title = document.getElementById("adminAuthGateTitle");
  const detail = document.getElementById("adminAuthGateMessage");
  const retry = document.getElementById("adminAuthRetry");

  if (title) title.textContent = "Admin access could not be verified";
  if (detail) detail.textContent = message;
  if (retry) retry.hidden = false;
}

function redirectToLogin() {
  sessionStorage.setItem("snapup_after_login", "admin.html");
  window.location.replace(ADMIN_LOGIN_PAGE);
}

async function verifyAdminAccess() {
  const token = getAdminToken();

  if (!token || token === "cookie") {
    localStorage.removeItem("snapup_token");
    redirectToLogin();
    return null;
  }

  try {
    const response = await fetch(`${API_URL}/api/admin/me`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    const data = await response.json().catch(() => ({}));

    if (response.status === 401) {
      localStorage.removeItem("snapup_token");
      localStorage.removeItem("snapup_user");
      redirectToLogin();
      return null;
    }

    if (response.status === 403) {
      window.location.replace(ADMIN_ACCOUNT_PAGE);
      return null;
    }

    if (!response.ok || !data.success || !data.admin) {
      throw new Error(data.message || "Admin verification failed.");
    }

    localStorage.setItem(
      "snapup_user",
      JSON.stringify({
        ...(JSON.parse(localStorage.getItem("snapup_user") || "{}")),
        ...data.admin,
      }),
    );

    return data.admin;
  } catch (error) {
    console.error("Admin access verification error:", error);
    setGateError(
      "The admin API could not be reached. Your admin panel remains locked until verification succeeds.",
    );
    return null;
  }
}

document.getElementById("adminAuthRetry")?.addEventListener("click", () => {
  window.location.reload();
});

const currentAdmin = await verifyAdminAccess();

if (!currentAdmin) {
  throw new Error("ADMIN_ACCESS_NOT_VERIFIED");
}

document.documentElement.dataset.adminReady = "true";

const adminName = document.getElementById("currentAdminName");
const adminRole = document.getElementById("currentAdminRole");
const adminAvatar = document.getElementById("currentAdminAvatar");

if (adminName) {
  adminName.textContent = currentAdmin.user_name || currentAdmin.user_mail || "Admin";
}

if (adminRole) {
  adminRole.textContent =
    currentAdmin.user_role === "super_admin" ? "Super Admin" : "Admin";
}

if (adminAvatar) {
  const source = currentAdmin.user_name || currentAdmin.user_mail || "A";
  adminAvatar.textContent = source.trim().charAt(0).toUpperCase();
}


const state = {
  users: [
    {id:1,name:"Melih Gülhan",email:"melih@example.com",phone:"+90 551 000 00 00",plan:"Premium",events:3,storage:"12.8 GB",status:"Active",joined:"22 Sep 2026",verified:true},
    {id:2,name:"Ayşe Demir",email:"ayse@example.com",phone:"+90 532 000 00 00",plan:"Plus",events:2,storage:"6.4 GB",status:"Active",joined:"20 Sep 2026",verified:true},
    {id:3,name:"Emre Kaya",email:"emre@example.com",phone:"+90 533 000 00 00",plan:"Free",events:1,storage:"182 MB",status:"Unverified",joined:"19 Sep 2026",verified:false},
    {id:4,name:"Sude Aydın",email:"sude@example.com",phone:"+90 534 000 00 00",plan:"Mini",events:2,storage:"3.1 GB",status:"Suspended",joined:"14 Sep 2026",verified:true},
    {id:5,name:"Mert Yılmaz",email:"mert@example.com",phone:"+90 535 000 00 00",plan:"Premium",events:2,storage:"17.6 GB",status:"Active",joined:"11 Sep 2026",verified:true},
    {id:6,name:"Zeynep Arslan",email:"zeynep@example.com",phone:"+90 536 000 00 00",plan:"Plus",events:1,storage:"5.7 GB",status:"Active",joined:"09 Sep 2026",verified:true}
  ],
  events: [
    {id:1,ownerId:1,name:"Melih & Elif Wedding",createdAt:"2026-09-22T17:42:00+03:00",code:"485291",plan:"Premium",date:"2026-10-12",location:"İstanbul",status:"Active",guests:142,photos:683,videos:37,messages:54,storage:"8.6 GB",approval:"Required",video:"Allowed",archiveUntil:"2027-01-12"},
    {id:2,ownerId:2,name:"Graduation Party",createdAt:"2026-09-22T14:10:00+03:00",code:"932144",plan:"Plus",date:"2026-10-20",location:"Ankara",status:"Active",guests:86,photos:314,videos:18,messages:31,storage:"3.9 GB",approval:"Required",video:"Allowed",archiveUntil:"2027-01-20"},
    {id:3,ownerId:3,name:"Birthday Night",createdAt:"2026-08-28T11:20:00+03:00",code:"681205",plan:"Free",date:"2026-09-01",location:"Bursa",status:"Expired",guests:51,photos:81,videos:2,messages:12,storage:"182 MB",approval:"Not required",video:"Disabled",archiveUntil:"2026-12-01"},
    {id:4,ownerId:1,name:"Company Launch",createdAt:"2026-09-21T19:05:00+03:00",code:"370824",plan:"Plus",date:"2026-11-04",location:"Kütahya",status:"Active",guests:64,photos:205,videos:9,messages:18,storage:"2.4 GB",approval:"Required",video:"Allowed",archiveUntil:"2027-02-04"},
    {id:5,ownerId:4,name:"Engagement Night",createdAt:"2026-09-18T09:30:00+03:00",code:"514308",plan:"Mini",date:"2026-10-03",location:"Eskişehir",status:"Suspended",guests:71,photos:188,videos:5,messages:22,storage:"1.8 GB",approval:"Required",video:"Allowed",archiveUntil:"2027-01-03"},
    {id:6,ownerId:5,name:"Mert & Selin Wedding",createdAt:"2026-09-22T18:28:00+03:00",code:"843902",plan:"Premium",date:"2026-10-28",location:"İzmir",status:"Active",guests:211,photos:922,videos:63,messages:87,storage:"14.1 GB",approval:"Required",video:"Allowed",archiveUntil:"2027-01-28"},
    {id:7,ownerId:6,name:"Design Team Offsite",createdAt:"2026-09-20T16:45:00+03:00",code:"220671",plan:"Plus",date:"2026-11-11",location:"Antalya",status:"Active",guests:46,photos:133,videos:11,messages:16,storage:"2.7 GB",approval:"Not required",video:"Allowed",archiveUntil:"2027-02-11"}
  ],
  logs: [
    {id:"AUD-260922-1742",type:"USER",category:"USER",title:"Changed user package",text:"Ayşe Demir changed from Mini to Plus.",time:"Today, 17:42",timestamp:"2026-09-22T17:42:00+03:00",admin:"melih@snapupevents.com",adminRole:"Super Admin",target:"ayse@example.com",targetMeta:"User account",ip:"88.231.42.17",requestId:"req_7fa91c2e",change:"Plan: Mini → Plus"},
    {id:"AUD-260922-1618",type:"EVENT",category:"EVENT",title:"Created event for user",text:"Company Launch was created for melih@example.com.",time:"Today, 16:18",timestamp:"2026-09-22T16:18:00+03:00",admin:"melih@snapupevents.com",adminRole:"Super Admin",target:"#370824",targetMeta:"Company Launch",ip:"88.231.42.17",requestId:"req_b271aa4c",change:"Event created · Owner: melih@example.com · Package: Plus"},
    {id:"AUD-260922-1433",type:"EVENT",category:"SECURITY",title:"Suspended event",text:"Engagement Night (#514308) was suspended by admin.",time:"Today, 14:33",timestamp:"2026-09-22T14:33:00+03:00",admin:"melih@snapupevents.com",adminRole:"Super Admin",target:"#514308",targetMeta:"Engagement Night",ip:"88.231.42.17",requestId:"req_8c102d91",change:"Status: Active → Suspended"},
    {id:"AUD-260922-1306",type:"USER",category:"STORAGE",title:"Applied storage override",text:"mert@example.com received a temporary 25 GB limit.",time:"Today, 13:06",timestamp:"2026-09-22T13:06:00+03:00",admin:"melih@snapupevents.com",adminRole:"Super Admin",target:"mert@example.com",targetMeta:"User account",ip:"88.231.42.17",requestId:"req_91e6a23b",change:"Storage override: 20 GB → 25 GB"},
    {id:"AUD-260921-2103",type:"USER",category:"SECURITY",title:"User account reactivated",text:"sude@example.com was reactivated after review.",time:"Yesterday, 21:03",timestamp:"2026-09-21T21:03:00+03:00",admin:"melih@snapupevents.com",adminRole:"Super Admin",target:"sude@example.com",targetMeta:"User account",ip:"88.231.42.17",requestId:"req_34d11a8f",change:"Status: Suspended → Active"},
    {id:"AUD-260918-1140",type:"EVENT",category:"EVENT",title:"Extended event archive",text:"Wedding Celebration archive duration was extended.",time:"18 Sep, 11:40",timestamp:"2026-09-18T11:40:00+03:00",admin:"melih@snapupevents.com",adminRole:"Super Admin",target:"#485291",targetMeta:"Melih & Elif Wedding",ip:"88.231.42.17",requestId:"req_bf21a4d7",change:"Archive: +90 days"},
    {id:"AUD-260910-0935",type:"USER",category:"USER",title:"Created user account",text:"A new Plus user account was created manually.",time:"10 Sep, 09:35",timestamp:"2026-09-10T09:35:00+03:00",admin:"melih@snapupevents.com",adminRole:"Super Admin",target:"zeynep@example.com",targetMeta:"User account",ip:"88.231.42.17",requestId:"req_29c147af",change:"Account created · Plan: Plus"}
  ],
  currentUserId:null,
  currentEventId:null,
  eventPeriod:"all",
  auditPeriod:"all"
};

const views = {
  dashboard:["Dashboard","Operate and monitor your SnapUp Events platform."],
  analytics:["Analytics","Visualize growth, revenue, storage and usage trends."],
  users:["Users","Create, inspect and manage customer accounts."],
  events:["Events","Create and operate events on behalf of customers."],
  storage:["Storage","Track platform usage and custom limits."],
  logs:["Admin Logs","Review sensitive administrative actions."]
};

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

function planClass(plan){ return String(plan).toLowerCase(); }
function statusClass(status){ return String(status).toLowerCase(); }
function initials(name){ return name.split(/\s+/).map(x=>x[0]).slice(0,2).join("").toUpperCase(); }
function ownerName(id){ return state.users.find(u=>u.id===id)?.name || "Unknown"; }
function ownerEmail(id){ return state.users.find(u=>u.id===id)?.email || "-"; }
function randomCode(){ return String(Math.floor(100000 + Math.random()*900000)); }
function todayLabel(){ return new Intl.DateTimeFormat("en-GB",{day:"2-digit",month:"short",year:"numeric"}).format(new Date()); }

function showToast(msg){
  const t=$("#toast"); t.textContent=msg; t.classList.add("show");
  clearTimeout(showToast.timer); showToast.timer=setTimeout(()=>t.classList.remove("show"),2200);
}

function inferAuditCategory(type,title=""){
  const value=String(title).toLowerCase();
  if(value.includes("storage")) return "STORAGE";
  if(value.includes("suspend") || value.includes("reactivat")) return "SECURITY";
  return type==="EVENT" ? "EVENT" : "USER";
}

function inferAuditTarget(text=""){
  const code=String(text).match(/#\d{6}/)?.[0];
  if(code) return code;
  const email=String(text).match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
  return email || "Platform";
}

function addLog(type,title,text){
  const now=new Date();
  state.logs.unshift({
    id:`AUD-${now.getTime()}`,
    type,
    category:inferAuditCategory(type,title),
    title,
    text,
    time:"Just now",
    timestamp:now.toISOString(),
    admin:currentAdmin.user_mail,
    adminRole:currentAdmin.user_role === "super_admin" ? "Super Admin" : "Admin",
    target:inferAuditTarget(text),
    targetMeta:type==="EVENT" ? "Event" : "User account",
    ip:"127.0.0.1",
    requestId:`req_${Math.random().toString(16).slice(2,10)}`,
    change:text
  });
  renderLogs();
  renderRecent();
}

function switchView(name){
  $$(".view").forEach(v=>v.classList.remove("active"));
  $(`#${name}View`)?.classList.add("active");
  $$(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.view===name));
  $("#pageTitle").textContent=views[name][0];
  $("#pageSubtitle").textContent=views[name][1];
  $("#sidebar").classList.remove("open"); $("#overlay").classList.remove("show");
  window.scrollTo({top:0,behavior:"smooth"}); if(typeof renderCharts==="function") setTimeout(renderCharts,0);
}

function renderUsers(){
  const q=$("#userSearch")?.value.trim().toLowerCase() || "";
  const filter=$("#userStatusFilter")?.value || "all";
  const rows=state.users.filter(u=>{
    const matches=[u.name,u.email,u.plan,u.status].join(" ").toLowerCase().includes(q);
    const status=filter==="all" || u.status===filter;
    return matches && status;
  });
  $("#usersTableBody").innerHTML=rows.map(u=>`
    <tr>
      <td><div class="user-cell"><div class="avatar small">${initials(u.name)}</div><div><b>${u.name}</b><span>${u.email}</span></div></div></td>
      <td><span class="plan ${planClass(u.plan)}">${u.plan}</span></td>
      <td>${u.events}</td><td>${u.storage}</td>
      <td><span class="badge ${statusClass(u.status)}">${u.status}</span></td>
      <td>${u.joined}</td>
      <td><button class="open-btn" data-open-user="${u.id}">Manage</button></td>
    </tr>`).join("");
  $$("[data-open-user]").forEach(b=>b.onclick=()=>openUser(Number(b.dataset.openUser)));
}

function parseStorageMb(value){
  const text=String(value||"0").trim().toUpperCase();
  const num=parseFloat(text)||0;
  if(text.includes("GB")) return num*1024;
  if(text.includes("TB")) return num*1024*1024;
  return num;
}

function startOfWeek(date){
  const d=new Date(date);
  const day=(d.getDay()+6)%7;
  d.setHours(0,0,0,0);
  d.setDate(d.getDate()-day);
  return d;
}

function matchesEventPeriod(event,period){
  if(period==="all") return true;
  const created=new Date(event.createdAt || event.date || Date.now());
  const now=new Date("2026-09-22T19:03:00+03:00");
  if(period==="day"){
    return created.getFullYear()===now.getFullYear() &&
      created.getMonth()===now.getMonth() &&
      created.getDate()===now.getDate();
  }
  if(period==="week"){
    const start=startOfWeek(now), end=new Date(start);
    end.setDate(end.getDate()+7);
    return created>=start && created<end;
  }
  if(period==="month"){
    return created.getFullYear()===now.getFullYear() && created.getMonth()===now.getMonth();
  }
  return true;
}

function formatCreatedAt(value){
  const d=new Date(value);
  if(Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("en-GB",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"}).format(d);
}

function formatEventDate(value){
  const d=new Date(value+"T12:00:00");
  if(Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("en-GB",{day:"2-digit",month:"short",year:"numeric"}).format(d);
}

function renderEvents(){
  const root=$("#eventList"); if(!root) return;
  const query=$("#eventSearch")?.value.trim().toLowerCase() || "";
  const status=$("#eventStatusFilter")?.value || "all";
  const sort=$("#eventSort")?.value || "newest";
  const period=state.eventPeriod || "all";

  let events=state.events.filter(e=>{
    const owner=ownerName(e.ownerId);
    const ownerMail=ownerEmail(e.ownerId);
    const haystack=[e.name,e.code,e.location,e.plan,e.status,owner,ownerMail].join(" ").toLowerCase();
    return haystack.includes(query) &&
      (status==="all" || e.status===status) &&
      matchesEventPeriod(e,period);
  });

  events.sort((a,b)=>{
    if(sort==="oldest") return new Date(a.createdAt||0)-new Date(b.createdAt||0);
    if(sort==="name-asc") return a.name.localeCompare(b.name);
    if(sort==="name-desc") return b.name.localeCompare(a.name);
    if(sort==="storage-desc") return parseStorageMb(b.storage)-parseStorageMb(a.storage);
    if(sort==="guests-desc") return (b.guests||0)-(a.guests||0);
    return new Date(b.createdAt||0)-new Date(a.createdAt||0);
  });

  $("#eventResultCount").textContent=`${events.length} event${events.length===1?"":"s"}`;

  if(!events.length){
    root.innerHTML=`<div class="event-empty"><strong>No events found</strong><span>Try changing your search, status or time filter.</span></div>`;
    return;
  }

  root.innerHTML=events.map((e,i)=>`
    <div class="event-row" data-open-event="${e.id}">
      <div class="event-main">
        <div class="event-list-icon ${i%3===1?"alt1":i%3===2?"alt2":""}">${String(e.name||"E").charAt(0).toUpperCase()}</div>
        <div class="event-main-copy">
          <b>${e.name}</b>
          <span>#${e.code} · ${e.location || "No location"} · ${e.plan}</span>
        </div>
      </div>
      <div class="event-owner-cell">
        <b>${ownerName(e.ownerId)}</b>
        <span>${ownerEmail(e.ownerId)}</span>
      </div>
      <div class="event-date-cell">${formatCreatedAt(e.createdAt)}</div>
      <div class="event-date-cell">${formatEventDate(e.date)}</div>
      <div class="event-usage">
        <span><b>${e.guests||0}</b>Guests</span>
        <span><b>${(e.photos||0)+(e.videos||0)}</b>Media</span>
        <span><b>${e.storage}</b>Storage</span>
      </div>
      <div><span class="badge ${e.status==="Active"?"active":e.status==="Suspended"?"suspended":"unverified"}">${e.status}</span></div>
      <div class="event-row-actions"><button class="event-manage-btn" data-event-button="${e.id}" aria-label="Manage event">›</button></div>
    </div>`).join("");

  $$("[data-open-event]").forEach(row=>row.onclick=()=>openEvent(Number(row.dataset.openEvent)));
  $$("[data-event-button]").forEach(btn=>btn.onclick=(ev)=>{ev.stopPropagation();openEvent(Number(btn.dataset.eventButton));});
}

function renderRecent(){
  $("#recentUsers").innerHTML=state.users.slice(0,3).map(u=>`
    <div class="mini-row"><div class="avatar small">${initials(u.name)}</div><div class="mini-copy"><b>${u.name}</b><span>${u.email} · ${u.plan}</span></div><button class="open-btn" data-recent-user="${u.id}">Manage</button></div>`).join("");
  $$("[data-recent-user]").forEach(b=>b.onclick=()=>openUser(Number(b.dataset.recentUser)));

  $("#recentEvents").innerHTML=[...state.events].sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0)).slice(0,3).map(e=>`
    <div class="mini-row"><div class="mini-copy"><b>${e.name}</b><span>#${e.code} · ${ownerName(e.ownerId)}</span></div><button class="open-btn" data-recent-event="${e.id}">Manage</button></div>`).join("");
  $$("[data-recent-event]").forEach(b=>b.onclick=()=>openEvent(Number(b.dataset.recentEvent)));

  $("#recentLogs").innerHTML=state.logs.slice(0,3).map(l=>`
    <div class="mini-row"><div class="mini-copy"><b>${l.title}</b><span>${l.time} · ${l.type}</span></div></div>`).join("");
}

function auditNow(){
  return new Date("2026-09-22T19:40:00+03:00");
}

function auditStartOfWeek(date){
  const d=new Date(date);
  const day=(d.getDay()+6)%7;
  d.setHours(0,0,0,0);
  d.setDate(d.getDate()-day);
  return d;
}

function auditMatchesPeriod(log){
  const period=state.auditPeriod || "all";
  if(period==="all") return true;
  const value=new Date(log.timestamp);
  if(Number.isNaN(value.getTime())) return true;
  const now=auditNow();

  if(period==="today"){
    return value.getFullYear()===now.getFullYear() &&
      value.getMonth()===now.getMonth() &&
      value.getDate()===now.getDate();
  }

  if(period==="week"){
    const start=auditStartOfWeek(now);
    const end=new Date(start);
    end.setDate(end.getDate()+7);
    return value>=start && value<end;
  }

  if(period==="month"){
    return value.getFullYear()===now.getFullYear() &&
      value.getMonth()===now.getMonth();
  }

  if(period==="custom"){
    const fromValue=$("#auditDateFrom")?.value;
    const toValue=$("#auditDateTo")?.value;
    if(!fromValue || !toValue) return true;
    const from=new Date(`${fromValue}T00:00:00+03:00`);
    const to=new Date(`${toValue}T23:59:59+03:00`);
    return value>=from && value<=to;
  }

  return true;
}

function formatAuditTimestamp(value){
  const date=new Date(value);
  if(Number.isNaN(date.getTime())) return {date:"-",time:"-"};
  return {
    date:new Intl.DateTimeFormat("en-GB",{day:"2-digit",month:"short",year:"numeric"}).format(date),
    time:new Intl.DateTimeFormat("en-GB",{hour:"2-digit",minute:"2-digit",second:"2-digit"}).format(date)
  };
}

function filteredAuditLogs(){
  const search=$("#auditSearch")?.value.trim().toLowerCase() || "";
  const category=$("#auditCategoryFilter")?.value || "ALL";

  return [...state.logs]
    .filter(log=>{
      const haystack=[
        log.id,log.title,log.text,log.admin,log.adminRole,log.target,log.targetMeta,
        log.category,log.ip,log.requestId,log.change
      ].join(" ").toLowerCase();

      return (!search || haystack.includes(search)) &&
        (category==="ALL" || log.category===category) &&
        auditMatchesPeriod(log);
    })
    .sort((a,b)=>new Date(b.timestamp||0)-new Date(a.timestamp||0));
}

function renderAuditSummary(){
  $("#auditTotalCount").textContent=state.logs.length;
  $("#auditUserCount").textContent=state.logs.filter(x=>x.category==="USER").length;
  $("#auditEventCount").textContent=state.logs.filter(x=>x.category==="EVENT").length;
  $("#auditSecurityCount").textContent=state.logs.filter(x=>x.category==="SECURITY").length;
}

function renderLogs(){
  const root=$("#logsList");
  if(!root) return;

  renderAuditSummary();
  const logs=filteredAuditLogs();
  $("#auditResultCount").textContent=`${logs.length} record${logs.length===1?"":"s"}`;

  if(!logs.length){
    root.innerHTML=`<div class="audit-empty"><strong>No audit records found</strong><span>Try changing your filters or date range.</span></div>`;
    return;
  }

  root.innerHTML=logs.map(log=>{
    const stamp=formatAuditTimestamp(log.timestamp);
    return `
      <div class="audit-row">
        <div class="audit-time"><strong>${stamp.date}</strong><span>${stamp.time}</span></div>
        <div class="audit-admin"><strong>${log.admin || "-"}</strong><span>${log.adminRole || "Admin"}</span></div>
        <div class="audit-action"><strong>${log.title}</strong><span>${log.text}</span></div>
        <div class="audit-target"><strong>${log.target || "-"}</strong><span>${log.targetMeta || "-"}</span></div>
        <div><span class="audit-category ${String(log.category||"USER").toLowerCase()}">${log.category || "USER"}</span></div>
        <div class="audit-ip">${log.ip || "-"}</div>
        <div><button class="audit-view-btn" data-audit-id="${log.id}" aria-label="View audit details">›</button></div>
      </div>`;
  }).join("");

  $$("[data-audit-id]").forEach(button=>{
    button.addEventListener("click",()=>openAuditDetail(button.dataset.auditId));
  });
}


function openAuditDetail(id){
  const log=state.logs.find(item=>String(item.id)===String(id));
  if(!log) return;
  const stamp=formatAuditTimestamp(log.timestamp);

  $("#auditDetailTitle").textContent=log.title;
  $("#auditDetailAdmin").textContent=`${log.admin || "-"} · ${log.adminRole || "Admin"}`;
  $("#auditDetailCategory").textContent=log.category || "-";
  $("#auditDetailTarget").textContent=`${log.target || "-"}${log.targetMeta ? ` · ${log.targetMeta}` : ""}`;
  $("#auditDetailTime").textContent=`${stamp.date} ${stamp.time}`;
  $("#auditDetailIp").textContent=log.ip || "-";
  $("#auditDetailRequest").textContent=log.requestId || "-";
  $("#auditDetailText").textContent=log.text || "-";
  $("#auditDetailChange").textContent=log.change || log.text || "-";

  showModal("#auditDetailModal");
}

function csvEscape(value){
  const text=String(value ?? "");
  return `"${text.replaceAll('"','""')}"`;
}

function exportAuditCsv(){
  const rows=filteredAuditLogs();
  const columns=["Timestamp","Administrator","Role","Category","Action","Target","Description","IP Address","Request ID","Change Summary"];
  const csv=[
    columns.map(csvEscape).join(","),
    ...rows.map(log=>[
      log.timestamp,log.admin,log.adminRole,log.category,log.title,log.target,
      log.text,log.ip,log.requestId,log.change
    ].map(csvEscape).join(","))
  ].join("\r\n");

  const blob=new Blob([csv],{type:"text/csv;charset=utf-8"});
  const url=URL.createObjectURL(blob);
  const link=document.createElement("a");
  link.href=url;
  link.download="snapup-admin-audit-log.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast(`${rows.length} audit records exported.`);
}

function renderStorage(){
  const sorted=[...state.users].sort((a,b)=>parseFloat(b.storage)-parseFloat(a.storage));
  $("#storageRanking").innerHTML=sorted.map((u,i)=>`
    <div class="rank-row"><span class="rank-num">${String(i+1).padStart(2,"0")}</span><div class="rank-copy"><b>${u.name}</b><span>${u.plan} · ${u.events} events</span></div><strong>${u.storage}</strong></div>`).join("");
}

function refreshCounts(){
  // Dashboard KPIs represent platform-wide demo totals.
  // The tables intentionally show a smaller realistic sample dataset.
}

function populateOwnerSelect(selectedId=null){
  $("#eventOwnerSelect").innerHTML=state.users.map(u=>`<option value="${u.id}" ${u.id===selectedId?"selected":""}>${u.name} — ${u.email}</option>`).join("");
}

function openUser(id){
  state.currentUserId=id;
  const u=state.users.find(x=>x.id===id); if(!u) return;
  $("#drawerUserName").textContent=u.name; $("#drawerUserEmail").textContent=u.email; $("#drawerAvatar").textContent=initials(u.name);
  $("#drawerStatus").textContent=u.status; $("#drawerStatus").className=`badge ${statusClass(u.status)}`;
  $("#drawerPlan").textContent=u.plan; $("#drawerPlan").className=`plan ${planClass(u.plan)}`;
  $("#drawerEventsCount").textContent=u.events; $("#drawerStorage").textContent=u.storage; $("#drawerJoined").textContent=u.joined;
  $("#drawerToggleStatus").textContent=u.status==="Suspended"?"Reactivate User":"Suspend User";
  const events=state.events.filter(e=>e.ownerId===id);
  $("#drawerEventsList").innerHTML=events.length?events.map(e=>`<div class="drawer-event"><b>${e.name}</b><span>#${e.code} · ${e.plan} · ${e.status}</span></div>`).join(""):`<div class="drawer-event"><span>No events yet.</span></div>`;
  $("#userDrawer").classList.add("open"); $("#drawerBackdrop").classList.add("show");
}

function closeDrawer(){ $("#userDrawer").classList.remove("open"); $("#drawerBackdrop").classList.remove("show"); }

function showModal(id){
  $$(".modal").forEach(m=>m.classList.remove("show"));
  $("#modalBackdrop").classList.add("show"); $(id).classList.add("show");
}
function closeModals(){ $$(".modal").forEach(m=>m.classList.remove("show")); $("#modalBackdrop").classList.remove("show"); }

function openCreateEvent(ownerId=null){
  populateOwnerSelect(ownerId);
  showModal("#createEventModal");
}

function rerenderAll(){
  renderUsers(); renderEvents(); renderRecent(); renderLogs(); renderStorage(); refreshCounts();
}

$$(".nav-item").forEach(b=>b.onclick=()=>switchView(b.dataset.view));
$$("[data-jump]").forEach(b=>b.onclick=()=>switchView(b.dataset.jump));
$("#menuBtn").onclick=()=>{$("#sidebar").classList.toggle("open");$("#overlay").classList.toggle("show")};
$("#overlay").onclick=()=>{$("#sidebar").classList.remove("open");$("#overlay").classList.remove("show")};
$("#themeBtn").onclick=()=>{const h=document.documentElement;h.dataset.theme=h.dataset.theme==="dark"?"light":"dark";localStorage.setItem("snapup-admin-theme",h.dataset.theme)};
const savedTheme=localStorage.getItem("snapup-admin-theme"); if(savedTheme) document.documentElement.dataset.theme=savedTheme;

["#quickCreateUser","#heroCreateUser","#opCreateUser","#createUserBtn"].forEach(s=>$(s).onclick=()=>showModal("#createUserModal"));
["#quickCreateEvent","#heroCreateEvent","#opCreateEvent","#createEventBtn"].forEach(s=>$(s).onclick=()=>openCreateEvent());
$("#opFindUser").onclick=()=>switchView("users");

$("#closeDrawer").onclick=closeDrawer; $("#drawerBackdrop").onclick=closeDrawer;
$("#modalBackdrop").onclick=closeModals; $$("[data-close-modal]").forEach(b=>b.onclick=closeModals);

$("#userSearch").addEventListener("input",renderUsers); $("#userStatusFilter").addEventListener("change",renderUsers);

$("#eventSearch")?.addEventListener("input",renderEvents);
$("#eventStatusFilter")?.addEventListener("change",renderEvents);
$("#eventSort")?.addEventListener("change",renderEvents);
$$("[data-period]").forEach(button=>{
  button.addEventListener("click",()=>{
    state.eventPeriod=button.dataset.period;
    $$("[data-period]").forEach(b=>b.classList.toggle("active",b===button));
    renderEvents();
  });
});


$("#auditSearch")?.addEventListener("input",renderLogs);
$("#auditCategoryFilter")?.addEventListener("change",renderLogs);

$$("[data-audit-period]").forEach(button=>{
  button.addEventListener("click",()=>{
    state.auditPeriod=button.dataset.auditPeriod;
    $$("[data-audit-period]").forEach(b=>b.classList.toggle("active",b===button));
    $("#auditCustomRange").hidden=state.auditPeriod!=="custom";
    if(state.auditPeriod!=="custom") renderLogs();
  });
});

$("#applyAuditRange")?.addEventListener("click",renderLogs);


$("#createUserForm").addEventListener("submit",e=>{
  e.preventDefault();
  const f=new FormData(e.currentTarget);
  const user={id:Date.now(),name:f.get("name"),email:f.get("email"),phone:f.get("phone"),plan:f.get("plan"),events:0,storage:"0 MB",status:f.get("status"),joined:todayLabel()};
  state.users.unshift(user);
  addLog("USER","Created user account",`${user.name} (${user.email}) was created with ${user.plan} plan.`);
  e.currentTarget.reset(); closeModals(); rerenderAll(); showToast("User created successfully.");
  setTimeout(()=>openUser(user.id),250);
});

$("#createEventForm").addEventListener("submit",e=>{
  e.preventDefault();
  const f=new FormData(e.currentTarget), ownerId=Number(f.get("owner"));
  const event={id:Date.now(),ownerId,name:f.get("name"),code:randomCode(),plan:f.get("plan"),date:f.get("date"),createdAt:new Date().toISOString(),location:f.get("location"),status:"Active",guests:0,photos:0,videos:0,messages:0,storage:"0 MB",approval:f.get("approval"),video:f.get("video"),archiveUntil:"3 months after event"};
  state.events.unshift(event);
  const u=state.users.find(x=>x.id===ownerId); if(u) u.events+=1;
  addLog("EVENT","Created event for user",`${event.name} was created for ${ownerEmail(ownerId)} with ${event.plan} package.`);
  e.currentTarget.reset(); closeModals(); rerenderAll(); showToast(`Event #${event.code} created.`);
  if(state.currentUserId===ownerId) openUser(ownerId);
});

$("#drawerCreateEvent").onclick=()=>openCreateEvent(state.currentUserId);
$("#drawerChangePlan").onclick=()=>{
  const u=state.users.find(x=>x.id===state.currentUserId); if(!u)return;
  $("#planSelect").value=u.plan; showModal("#planModal");
};
$("#planForm").addEventListener("submit",e=>{
  e.preventDefault(); const u=state.users.find(x=>x.id===state.currentUserId); if(!u)return;
  const old=u.plan, next=$("#planSelect").value; u.plan=next;
  addLog("USER","Changed user package",`${u.email} changed from ${old} to ${next}.`);
  closeModals(); rerenderAll(); openUser(u.id); showToast("User plan updated.");
});
$("#drawerToggleStatus").onclick=()=>{
  const u=state.users.find(x=>x.id===state.currentUserId); if(!u)return;
  const old=u.status; u.status=u.status==="Suspended"?"Active":"Suspended";
  addLog("USER",u.status==="Suspended"?"Suspended user":"Reactivated user",`${u.email} changed from ${old} to ${u.status}.`);
  rerenderAll(); openUser(u.id); showToast(`User is now ${u.status}.`);
};
$("#drawerStorageOverride").onclick=()=>showModal("#storageModal");
$("#storageForm").addEventListener("submit",e=>{
  e.preventDefault(); const u=state.users.find(x=>x.id===state.currentUserId); if(!u)return;
  const value=$("#storageLimitInput").value, unit=$("#storageUnit").value;
  addLog("USER","Applied storage override",`${u.email} received a custom storage limit of ${value} ${unit}.`);
  closeModals(); renderLogs(); renderRecent(); showToast(`Custom storage limit: ${value} ${unit}.`);
});

$("#exportLogsBtn").onclick=exportAuditCsv;
$("#logoutDemo").onclick=async()=>{
  const token = getAdminToken();

  try {
    await fetch(`${API_URL}/api/auth/logout`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  } catch (error) {
    console.warn("Logout request failed:", error);
  } finally {
    localStorage.removeItem("snapup_token");
    localStorage.removeItem("snapup_user");
    sessionStorage.removeItem("snapup_after_login");
    window.location.replace("login.html");
  }
};

rerenderAll();


const demoCharts = {
  revenue: [142,156,171,168,194,209,221,248],
  users: [910,955,1004,1060,1118,1172,1225,1284],
  eventGrowth: [280,301,325,344,369,392,415,438],
  storageGrowth: [119,128,139,147,158,169,177,184.7],
  media: [
    {label:"Mon",photo:610,video:94},{label:"Tue",photo:720,video:121},{label:"Wed",photo:660,video:102},
    {label:"Thu",photo:840,video:148},{label:"Fri",photo:910,video:167},{label:"Sat",photo:1080,video:204},{label:"Sun",photo:930,video:181}
  ],
  eventsByWeek:[31,38,35,44,48,52,61,67]
};

function svgLineChart(targetId, series, labels, secondary=null, opts={}){
  const root=document.getElementById(targetId); if(!root) return;
  const width=760,height=250,padL=42,padR=16,padT=18,padB=34;
  const all=secondary?[...series,...secondary]:series;
  const min=opts.zero?0:Math.min(...all)*0.88, max=Math.max(...all)*1.06;
  const x=i=>padL+(i*(width-padL-padR)/(series.length-1));
  const y=v=>padT+(max-v)*(height-padT-padB)/(max-min || 1);
  const path=arr=>arr.map((v,i)=>`${i?"L":"M"} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const area=`${path(series)} L ${x(series.length-1)} ${height-padB} L ${x(0)} ${height-padB} Z`;
  const grid=[0,.25,.5,.75,1].map(t=>{
    const yy=padT+t*(height-padT-padB);
    const val=max-t*(max-min);
    return `<line class="chart-gridline" x1="${padL}" x2="${width-padR}" y1="${yy}" y2="${yy}"/><text class="chart-axis-label" x="2" y="${yy+3}">${Math.round(val)}</text>`;
  }).join("");
  const xlabels=labels.map((l,i)=>`<text class="chart-axis-label" text-anchor="middle" x="${x(i)}" y="${height-9}">${l}</text>`).join("");
  const pts=series.map((v,i)=>`<circle class="chart-point-primary" cx="${x(i)}" cy="${y(v)}" r="4"><title>${labels[i]}: ${v}</title></circle>`).join("");
  const secondaryMarkup=secondary?`<path class="chart-path-secondary" d="${path(secondary)}"/>${secondary.map((v,i)=>`<circle class="chart-point-secondary" cx="${x(i)}" cy="${y(v)}" r="3.5"><title>${labels[i]}: ${v}</title></circle>`).join("")}`:"";
  root.innerHTML=`<svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none"><defs><linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#6d5dfc" stop-opacity=".28"/><stop offset="100%" stop-color="#6d5dfc" stop-opacity="0"/></linearGradient></defs>${grid}<path class="chart-area" d="${area}"/><path class="chart-path-primary" d="${path(series)}"/>${secondaryMarkup}${pts}${xlabels}</svg>`;
}

function renderBarChart(targetId,data,mode="media"){
  const root=document.getElementById(targetId); if(!root) return;
  const max=mode==="media"?Math.max(...data.flatMap(d=>[d.photo,d.video])):Math.max(...data);
  if(mode==="media"){
    root.innerHTML=data.map(d=>`<div class="bar-group"><span class="bar-tooltip">${d.photo+d.video}</span><div class="bar-stack"><div class="bar video" style="height:${(d.video/max)*100}%"><title>Videos: ${d.video}</title></div><div class="bar photo" style="height:${(d.photo/max)*100}%"><title>Photos: ${d.photo}</title></div></div><label>${d.label}</label></div>`).join("");
  } else {
    const labels=["W1","W2","W3","W4","W5","W6","W7","W8"];
    root.innerHTML=data.map((v,i)=>`<div class="bar-group"><span class="bar-tooltip">${v}</span><div class="bar-stack"><div class="bar eventbar" style="height:${(v/max)*100}%"></div></div><label>${labels[i]}</label></div>`).join("");
  }
}

function setLegend(targetId,items){
  const root=document.getElementById(targetId); if(!root) return;
  root.innerHTML=items.map((x,i)=>`<div class="legend-row"><i style="background:${x.color}"></i><span>${x.label}</span><b>${x.value}</b></div>`).join("");
}

function renderEventTypes(){
  const root=document.getElementById("eventTypeBars"); if(!root) return;
  const rows=[["Wedding",38],["Birthday",24],["Graduation",17],["Corporate",13],["Other",8]];
  root.innerHTML=rows.map(([name,val])=>`<div class="hbar-row"><span>${name}</span><div class="hbar-track"><div class="hbar-fill" style="width:${val}%"></div></div><b>${val}%</b></div>`).join("");
}

function renderCharts(){
  const months=["Feb","Mar","Apr","May","Jun","Jul","Aug","Sep"];
  const weeks=["W1","W2","W3","W4","W5","W6","W7","W8"];
  svgLineChart("revenueChart",demoCharts.revenue,months);
  svgLineChart("growthChart",demoCharts.users,weeks,demoCharts.eventGrowth);
  svgLineChart("analyticsRevenueChart",demoCharts.revenue,months,demoCharts.users);
  svgLineChart("storageGrowthChart",demoCharts.storageGrowth,weeks);
  renderBarChart("mediaBarChart",demoCharts.media,"media");
  renderBarChart("eventsBarChart",demoCharts.eventsByWeek,"events");
  setLegend("planLegend",[
    {label:"Premium",value:"40%",color:"#6d5dfc"},{label:"Plus",value:"28%",color:"#2563eb"},
    {label:"Mini",value:"18%",color:"#f59e0b"},{label:"Free",value:"14%",color:"#94a3b8"}
  ]);
  const storageLegend=[
    {label:"Images",value:"102 GB",color:"#6d5dfc"},
    {label:"Videos",value:"81 GB",color:"#14b8a6"},
    {label:"Other",value:"1.7 GB",color:"#f59e0b"}
  ];
  setLegend("storageLegend",storageLegend); setLegend("storagePageLegend",storageLegend);
  renderEventTypes();
}

renderCharts();


function openEvent(id){
  state.currentEventId=id;
  const e=state.events.find(x=>x.id===id); if(!e) return;
  $("#eventDrawerName").textContent=e.name;
  $("#eventDrawerCode").textContent=`#${e.code}`;
  $("#eventDrawerStatus").textContent=e.status;
  $("#eventDrawerStatus").className=`badge ${e.status==="Active"?"active":e.status==="Suspended"?"suspended":"unverified"}`;
  $("#eventDrawerPlan").textContent=e.plan;
  $("#eventDrawerPlan").className=`plan ${planClass(e.plan)}`;
  $("#eventDrawerGuests").textContent=e.guests;
  $("#eventDrawerMedia").textContent=(e.photos||0)+(e.videos||0)+(e.messages||0);
  $("#eventDrawerStorage").textContent=e.storage;
  $("#eventDrawerOwner").textContent=`${ownerName(e.ownerId)} (${ownerEmail(e.ownerId)})`;
  $("#eventDrawerDate").textContent=e.date || "-";
  $("#eventDrawerLocation").textContent=e.location || "-";
  $("#eventDrawerApproval").textContent=e.approval || "Required";
  $("#eventDrawerVideo").textContent=e.video || "Allowed";
  $("#eventToggleStatus").textContent=e.status==="Suspended"?"Reactivate Event":"Suspend Event";
  const activities=[
    `${e.photos||0} photos uploaded`,
    `${e.videos||0} videos uploaded`,
    `${e.messages||0} guest messages`,
    `Archive until: ${e.archiveUntil || "Not set"}`
  ];
  $("#eventActivityList").innerHTML=activities.map(a=>`<div class="drawer-event"><span>${a}</span></div>`).join("");
  $("#eventDrawer").classList.add("open");
  $("#eventDrawerBackdrop").classList.add("show");
}

function closeEventDrawer(){
  $("#eventDrawer").classList.remove("open");
  $("#eventDrawerBackdrop").classList.remove("show");
}

$("#closeEventDrawer").onclick=closeEventDrawer;
$("#eventDrawerBackdrop").onclick=closeEventDrawer;

$("#eventToggleStatus").onclick=()=>{
  const e=state.events.find(x=>x.id===state.currentEventId); if(!e)return;
  const old=e.status;
  e.status=e.status==="Suspended"?"Active":"Suspended";
  addLog("EVENT",e.status==="Suspended"?"Suspended event":"Reactivated event",`${e.name} (#${e.code}) changed from ${old} to ${e.status}.`);
  renderEvents(); renderRecent(); openEvent(e.id); showToast(`Event is now ${e.status}.`);
};

$("#eventChangePlan").onclick=()=>{
  const e=state.events.find(x=>x.id===state.currentEventId); if(!e)return;
  $("#eventPlanSelect").value=e.plan;
  showModal("#eventPlanModal");
};

$("#eventPlanForm").addEventListener("submit",ev=>{
  ev.preventDefault();
  const e=state.events.find(x=>x.id===state.currentEventId); if(!e)return;
  const old=e.plan, next=$("#eventPlanSelect").value;
  e.plan=next;
  addLog("EVENT","Changed event package",`${e.name} (#${e.code}) changed from ${old} to ${next}.`);
  closeModals(); renderEvents(); renderRecent(); openEvent(e.id); showToast("Event package updated.");
});

$("#eventExtendArchive").onclick=()=>{
  const e=state.events.find(x=>x.id===state.currentEventId); if(!e)return;
  e.archiveUntil="Extended +90 days";
  addLog("EVENT","Extended event archive",`${e.name} (#${e.code}) archive was extended by 90 days.`);
  openEvent(e.id); showToast("Archive extended by 90 days.");
};

$("#eventChangeOwner").onclick=()=>{
  const e=state.events.find(x=>x.id===state.currentEventId); if(!e)return;
  $("#eventOwnerChangeSelect").innerHTML=state.users.map(u=>`<option value="${u.id}" ${u.id===e.ownerId?"selected":""}>${u.name} — ${u.email}</option>`).join("");
  showModal("#eventOwnerModal");
};

$("#eventOwnerForm").addEventListener("submit",ev=>{
  ev.preventDefault();
  const e=state.events.find(x=>x.id===state.currentEventId); if(!e)return;
  const oldOwner=e.ownerId, newOwner=Number($("#eventOwnerChangeSelect").value);
  if(oldOwner!==newOwner){
    const oldUser=state.users.find(u=>u.id===oldOwner), newUser=state.users.find(u=>u.id===newOwner);
    if(oldUser) oldUser.events=Math.max(0,oldUser.events-1);
    if(newUser) newUser.events+=1;
    e.ownerId=newOwner;
    addLog("EVENT","Transferred event ownership",`${e.name} (#${e.code}) moved from ${ownerEmail(oldOwner)} to ${ownerEmail(newOwner)}.`);
  }
  closeModals(); rerenderAll(); openEvent(e.id); showToast("Event owner updated.");
});

