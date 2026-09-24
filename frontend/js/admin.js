import { API_URL } from "./config.js?v=runtime-api-2";
import {
  getAdminDashboard,
  getAdminAnalytics,
  getAdminStorage,
  getAdminUsers,
  getAdminUser,
  getAdminEvents,
  getAdminEvent,
  createAdminUser,
  createAdminEventForUser,
  getAdminLogs,
  deleteAdminUser,
  setAdminUserActiveStatus,
  setAdminEventSuspension,
  changeAdminEventPackage,
  setAdminEventStorageOverride,
} from "./admin-api.js?v=admin-event-ops-1";

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
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 12000);

    let response;

    try {
      response = await fetch(`${API_URL}/api/admin/me`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
        signal: controller.signal,
      });
    } finally {
      window.clearTimeout(timeoutId);
    }

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

    const isTimeout = error?.name === "AbortError";

    setGateError(
      isTimeout
        ? "Admin verification timed out. Check the backend and try again."
        : "The admin API could not be reached. Your admin panel remains locked until verification succeeds.",
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
  users: [],
  events: [],
  logs: [],
  dashboard: null,
  analytics: null,
  analyticsDays: 30,
  analyticsLoading: false,
  storage: null,
  storageLoading: false,
  currentUserId: null,
  currentEventId: null,
  eventPeriod: "all",
  auditPeriod: "all",
};

const views = {
  dashboard:["Dashboard","Operate and monitor your SnapUp Events platform."],
  analytics:["Analytics","Live growth, media, package and storage analytics."],
  users:["Users","Create and inspect live customer accounts."],
  events:["Events","Create and inspect events on behalf of customers."],
  storage:["Storage","Track platform usage and custom limits."],
  logs:["Admin Logs","Review persisted privileged administrative actions."]
};

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

function planClass(plan){ return String(plan).toLowerCase(); }
function statusClass(status){ return String(status).toLowerCase(); }
function initials(name){ return String(name||"").split(/\s+/).filter(Boolean).map(x=>x[0]).slice(0,2).join("").toUpperCase() || "U"; }
function escapeHtml(value){
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  })[character]);
}
function escapeAttr(value){ return escapeHtml(value); }
function ownerName(id){ return state.users.find(u=>u.id===id)?.name || "Unknown"; }
function ownerEmail(id){ return state.users.find(u=>u.id===id)?.email || "-"; }
function randomCode(){ return String(Math.floor(100000 + Math.random()*900000)); }
function todayLabel(){ return new Intl.DateTimeFormat("en-GB",{day:"2-digit",month:"short",year:"numeric"}).format(new Date()); }
function formatJoined(value){
  const d=new Date(value);
  if(Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("en-GB",{day:"2-digit",month:"short",year:"numeric"}).format(d);
}

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
  window.scrollTo({top:0,behavior:"smooth"});

  if(name==="analytics"){
    loadAnalytics(state.analyticsDays);
  }

  if(name==="storage"){
    loadStorage();
  }
}

function renderUsers(){
  const q=$("#userSearch")?.value.trim().toLowerCase() || "";
  const filter=$("#userStatusFilter")?.value || "all";
  const rows=state.users.filter(u=>{
    const matches=[u.name,u.email,u.plan,u.status].join(" ").toLowerCase().includes(q);
    const status=filter==="all" || u.status===filter;
    return matches && status;
  });
  $("#usersTableBody").innerHTML=rows.length ? rows.map(u=>`
    <tr>
      <td><div class="user-cell"><div class="avatar small">${escapeHtml(initials(u.name))}</div><div><b>${escapeHtml(u.name)}</b><span>${escapeHtml(u.email)}</span></div></div></td>
      <td><span class="plan ${planClass(u.plan)}">${escapeHtml(u.plan)}</span></td>
      <td>${u.events}</td><td>${escapeHtml(u.storage)}</td>
      <td><span class="badge ${statusClass(u.status)}">${escapeHtml(u.status)}</span></td>
      <td>${formatJoined(u.joined_at)}</td>
      <td><button class="open-btn" data-open-user="${escapeAttr(u.id)}">Manage</button></td>
    </tr>`).join("") : `<tr><td colspan="7"><div class="event-empty"><strong>No users found</strong><span>Try changing your search or status filter.</span></div></td></tr>`;
  $$("[data-open-user]").forEach(b=>b.onclick=()=>openUser(b.dataset.openUser));
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
  const now=new Date();
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
    <div class="event-row" data-open-event="${escapeAttr(e.id)}">
      <div class="event-main">
        <div class="event-list-icon ${i%3===1?"alt1":i%3===2?"alt2":""}">${escapeHtml(String(e.name||"E").charAt(0).toUpperCase())}</div>
        <div class="event-main-copy">
          <b>${escapeHtml(e.name)}</b>
          <span>#${escapeHtml(e.code)} · ${escapeHtml(e.location || "No location")} · ${escapeHtml(e.plan)}</span>
        </div>
      </div>
      <div class="event-owner-cell">
        <b>${escapeHtml(ownerName(e.ownerId))}</b>
        <span>${escapeHtml(ownerEmail(e.ownerId))}</span>
      </div>
      <div class="event-date-cell">${formatCreatedAt(e.createdAt)}</div>
      <div class="event-date-cell">${formatEventDate(e.date)}</div>
      <div class="event-usage">
        <span><b>${e.guests ?? "—"}</b>Guests</span>
        <span><b>${e.photos == null ? "—" : (e.photos||0)+(e.videos||0)+(e.messages||0)}</b>Media</span>
        <span><b>${escapeHtml(e.storage)}</b>Storage</span>
      </div>
      <div><span class="badge ${e.status==="Active"?"active":"unverified"}">${escapeHtml(e.status)}</span></div>
      <div class="event-row-actions"><button class="event-manage-btn" data-event-button="${escapeAttr(e.id)}" aria-label="Manage event">›</button></div>
    </div>`).join("");

  $$("[data-open-event]").forEach(row=>row.onclick=()=>openEvent(row.dataset.openEvent));
  $$("[data-event-button]").forEach(btn=>btn.onclick=(ev)=>{ev.stopPropagation();openEvent(btn.dataset.eventButton);});
}

function renderRecent(){
  const recentUsers=state.users.slice(0,3);
  $("#recentUsers").innerHTML=recentUsers.length ? recentUsers.map(u=>`
    <div class="mini-row"><div class="avatar small">${escapeHtml(initials(u.name))}</div><div class="mini-copy"><b>${escapeHtml(u.name)}</b><span>${escapeHtml(u.email)} · ${escapeHtml(u.plan)}</span></div><button class="open-btn" data-recent-user="${escapeAttr(u.id)}">Manage</button></div>`).join("") : `<div class="mini-row"><div class="mini-copy"><b>No users yet</b><span>Live data is connected.</span></div></div>`;
  $$("[data-recent-user]").forEach(b=>b.onclick=()=>openUser(b.dataset.recentUser));

  const recentEvents=[...state.events].sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0)).slice(0,3);
  $("#recentEvents").innerHTML=recentEvents.length ? recentEvents.map(e=>`
    <div class="mini-row"><div class="mini-copy"><b>${escapeHtml(e.name)}</b><span>#${escapeHtml(e.code)} · ${escapeHtml(ownerName(e.ownerId))}</span></div><button class="open-btn" data-recent-event="${escapeAttr(e.id)}">Manage</button></div>`).join("") : `<div class="mini-row"><div class="mini-copy"><b>No events yet</b><span>Live data is connected.</span></div></div>`;
  $$("[data-recent-event]").forEach(b=>b.onclick=()=>openEvent(b.dataset.recentEvent));

  const recentLogs=state.logs.slice(0,3);
  $("#recentLogs").innerHTML=recentLogs.length ? recentLogs.map(log=>`
    <div class="mini-row"><div class="mini-copy"><b>${escapeHtml(log.title)}</b><span>${escapeHtml(log.text)}</span></div><span class="audit-category ${String(log.category||"USER").toLowerCase()}">${escapeHtml(log.category||"USER")}</span></div>`).join("") : `<div class="mini-row"><div class="mini-copy"><b>No admin actions yet</b><span>Privileged actions will appear here.</span></div></div>`;
}

function auditNow(){
  return new Date();
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
        <div class="audit-admin"><strong>${escapeHtml(log.admin || "-")}</strong><span>${escapeHtml(log.adminRole || "Admin")}</span></div>
        <div class="audit-action"><strong>${escapeHtml(log.title)}</strong><span>${escapeHtml(log.text)}</span></div>
        <div class="audit-target"><strong>${escapeHtml(log.target || "-")}</strong><span>${escapeHtml(log.targetMeta || "-")}</span></div>
        <div><span class="audit-category ${String(log.category||"USER").toLowerCase()}">${escapeHtml(log.category || "USER")}</span></div>
        <div class="audit-ip">${escapeHtml(log.ip || "-")}</div>
        <div><button class="audit-view-btn" data-audit-id="${escapeAttr(log.id)}" aria-label="View audit details">›</button></div>
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

  const reasonBlock=$("#auditDetailReasonBlock");
  const statusBlock=$("#auditDetailStatusBlock");

  if(reasonBlock){
    const hasReason=Boolean(String(log.reason||"").trim());
    reasonBlock.hidden=!hasReason;
    $("#auditDetailReason").textContent=hasReason ? log.reason : "-";
  }

  if(statusBlock){
    const hasStatusChange=Boolean(log.previousStatus || log.newStatus);
    statusBlock.hidden=!hasStatusChange;
    $("#auditDetailPreviousStatus").textContent=log.previousStatus || "-";
    $("#auditDetailNewStatus").textContent=log.newStatus || "-";
  }

  showModal("#auditDetailModal");
}

function csvEscape(value){
  const text=String(value ?? "");
  return `"${text.replaceAll('"','""')}"`;
}

function exportAuditCsv(){
  const rows=filteredAuditLogs();
  const columns=["Timestamp","Administrator","Role","Category","Action","Target","Description","Reason","Previous Status","New Status","IP Address","Request ID","Change Summary"];
  const csv=[
    columns.map(csvEscape).join(","),
    ...rows.map(log=>[
      log.timestamp,log.admin,log.adminRole,log.category,log.title,log.target,
      log.text,log.reason||"",log.previousStatus||"",log.newStatus||"",
      log.ip,log.requestId,log.change
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

function formatLiveTime(value){
  const date=new Date(value);
  if(Number.isNaN(date.getTime())) return "Live database";

  return `Live database · updated ${new Intl.DateTimeFormat("en-GB",{
    hour:"2-digit",
    minute:"2-digit",
    second:"2-digit"
  }).format(date)}`;
}

function renderStorage(){
  const storage=state.storage;
  if(!storage) return;

  $("#storageConsumed").textContent=storage.total_consumed_display || "0 B";
  $("#storageCurrentMedia").textContent=storage.current_media_display || "0 B";
  $("#storageAllocated").textContent=storage.total_allocated_display || "0 B";
  $("#storageUtilization").textContent=
    `${Number(storage.utilization_percentage||0).toFixed(2)}%`;

  $("#storageCurrentMediaMeta").textContent=
    `${storage.quota_gap_display || "0 B"} consumed quota is not present in current media rows`;
  $("#storageAllocatedMeta").textContent=
    `${Number(storage.total_events||0).toLocaleString()} current events`;
  $("#storageUtilizationMeta").textContent=
    `${storage.total_consumed_display || "0 B"} of ${storage.total_allocated_display || "0 B"}`;

  const liveStatus=$("#storageLiveStatus");
  if(liveStatus){
    liveStatus.textContent=formatLiveTime(storage.generated_at);
  }

  const mediaValues=[
    {
      key:"image",
      label:"Images",
      bytes:Number(storage.media_by_type?.image?.bytes||0),
      display:storage.media_by_type?.image?.display||"0 B",
      count:Number(storage.media_by_type?.image?.count||0),
      color:"#6d5dfc"
    },
    {
      key:"video",
      label:"Videos",
      bytes:Number(storage.media_by_type?.video?.bytes||0),
      display:storage.media_by_type?.video?.display||"0 B",
      count:Number(storage.media_by_type?.video?.count||0),
      color:"#2563eb"
    },
    {
      key:"message",
      label:"Messages",
      bytes:Number(storage.media_by_type?.message?.bytes||0),
      display:storage.media_by_type?.message?.display||"0 B",
      count:Number(storage.media_by_type?.message?.count||0),
      color:"#f59e0b"
    },
    {
      key:"other",
      label:"Other",
      bytes:Number(storage.media_by_type?.other?.bytes||0),
      display:storage.media_by_type?.other?.display||"0 B",
      count:Number(storage.media_by_type?.other?.count||0),
      color:"#94a3b8"
    }
  ];

  const mediaTotal=mediaValues.reduce((sum,item)=>sum+item.bytes,0);
  $("#storageMediaTotal").textContent=storage.current_media_display || "0 B";

  const donut=$("#storagePageDonut");
  const legend=$("#storagePageLegend");

  if(donut && legend){
    if(mediaTotal<=0){
      donut.style.background="conic-gradient(#e5e7eb 0 100%)";
      legend.innerHTML=`<div class="legend-row"><span>No media storage yet</span></div>`;
    }else{
      let cursor=0;
      const stops=mediaValues.map(item=>{
        const start=cursor;
        cursor+=(item.bytes/mediaTotal)*100;
        return `${item.color} ${start.toFixed(2)}% ${cursor.toFixed(2)}%`;
      });

      donut.style.background=`conic-gradient(${stops.join(",")})`;

      legend.innerHTML=mediaValues.map(item=>{
        const pct=mediaTotal>0 ? ((item.bytes/mediaTotal)*100).toFixed(1) : "0.0";
        return `<div class="legend-row">
          <i style="background:${item.color}"></i>
          <span>${escapeHtml(item.label)}</span>
          <b>${escapeHtml(item.display)} · ${pct}% · ${item.count} items</b>
        </div>`;
      }).join("");
    }
  }

  const packageRoot=$("#storagePackageUsage");
  const packages=Array.isArray(storage.package_usage)
    ? storage.package_usage
    : [];

  if(packageRoot){
    packageRoot.innerHTML=packages.length
      ? packages.map(item=>`
        <div class="hbar-row">
          <span>${escapeHtml(item.package_name)} · ${Number(item.event_count||0)} events</span>
          <div class="hbar-track">
            <div class="hbar-fill" style="width:${Math.max(0,Math.min(100,Number(item.percentage||0)))}%"></div>
          </div>
          <b>${escapeHtml(item.consumed_display)} / ${escapeHtml(item.allocated_display)}</b>
        </div>`).join("")
      : `<div class="event-empty"><strong>No package storage yet</strong><span>Create an event to allocate storage.</span></div>`;
  }

  const eventRanking=$("#storageEventRanking");
  const topEvents=Array.isArray(storage.top_events) ? storage.top_events : [];

  if(eventRanking){
    eventRanking.innerHTML=topEvents.length
      ? topEvents.map((event,index)=>`
        <div class="rank-row">
          <span class="rank-num">${String(index+1).padStart(2,"0")}</span>
          <div class="rank-copy">
            <b>${escapeHtml(event.event_name)}</b>
            <span>#${escapeHtml(event.event_code||"—")} · ${escapeHtml(String(event.package_key||"free").toUpperCase())}</span>
          </div>
          <strong>${escapeHtml(event.consumed_display||"0 B")}</strong>
        </div>`).join("")
      : `<div class="event-empty"><strong>No event storage yet</strong><span>No event has consumed quota.</span></div>`;
  }

  const userRanking=$("#storageRanking");
  const topUsers=Array.isArray(storage.top_users) ? storage.top_users : [];

  if(userRanking){
    userRanking.innerHTML=topUsers.length
      ? topUsers.map((user,index)=>`
        <div class="rank-row">
          <span class="rank-num">${String(index+1).padStart(2,"0")}</span>
          <div class="rank-copy">
            <b>${escapeHtml(user.user_name)}</b>
            <span>${escapeHtml(user.user_mail)} · ${Number(user.event_count||0)} events</span>
          </div>
          <strong>${escapeHtml(user.consumed_display||"0 B")}</strong>
        </div>`).join("")
      : `<div class="event-empty"><strong>No user storage yet</strong><span>No user has consumed quota.</span></div>`;
  }
}

async function loadStorage(){
  if(state.storageLoading) return;
  state.storageLoading=true;

  const liveStatus=$("#storageLiveStatus");
  if(liveStatus){
    liveStatus.textContent="Live database · loading…";
  }

  try{
    const response=await getAdminStorage();
    state.storage=response.storage || null;
    renderStorage();
  }catch(error){
    console.error("Admin storage load failed:",error);
    state.storage=null;

    if(liveStatus){
      liveStatus.textContent="Live database · load failed";
    }

    ["storagePackageUsage","storageEventRanking","storageRanking"].forEach(id=>{
      const root=document.getElementById(id);
      if(root){
        root.innerHTML=`<div class="event-empty"><strong>Storage data unavailable</strong><span>${escapeHtml(error.message||"Storage data could not be loaded.")}</span></div>`;
      }
    });

    showToast(error.message || "Storage data could not be loaded.");
  }finally{
    state.storageLoading=false;
  }
}

function refreshCounts(){
  const d=state.dashboard;
  if(!d) return;

  $("#statUsers").textContent=Number(d.total_users||0).toLocaleString();
  $("#statEvents").textContent=Number(d.total_events||0).toLocaleString();
  $("#statStorage").textContent=d.storage_used_display || "0 B";
  $("#statMedia").textContent=Number(d.total_media||0).toLocaleString();

  $("#statUsersMeta").textContent=`${Number(d.new_users_today||0).toLocaleString()} new today`;
  $("#statEventsMeta").textContent=`${Number(d.active_events||0).toLocaleString()} currently active`;
  $("#statStorageMeta").textContent="Cumulative event storage usage";
  $("#statMediaMeta").textContent=`${Number(d.pending_media||0).toLocaleString()} pending approval`;

  $("#opsNewUsers").textContent=Number(d.new_users_today||0).toLocaleString();
  $("#opsNewEvents").textContent=Number(d.events_created_today||0).toLocaleString();
  $("#opsMediaToday").textContent=Number(d.media_uploaded_today||0).toLocaleString();
  $("#opsPending").textContent=Number(d.pending_media||0).toLocaleString();
  $("#opsActiveEvents").textContent=Number(d.active_events||0).toLocaleString();
}

function populateOwnerSelect(selectedId=null){
  const eligibleUsers=state.users.filter(u=>u.active!==false);
  const select=$("#eventOwnerSelect");

  if(!eligibleUsers.length){
    select.innerHTML=`<option value="">No active users available</option>`;
    select.disabled=true;
    return;
  }

  select.disabled=false;
  select.innerHTML=eligibleUsers.map(u=>`<option value="${escapeAttr(u.id)}" ${u.id===selectedId?"selected":""}>${escapeHtml(u.name)} — ${escapeHtml(u.email)}${u.verified?"":" · Unverified"}</option>`).join("");
}

async function openUser(id){
  state.currentUserId=id;
  const u=state.users.find(x=>x.id===id);
  if(!u) return;

  $("#drawerUserName").textContent=u.name;
  $("#drawerUserEmail").textContent=u.email;
  $("#drawerAvatar").textContent=initials(u.name);
  $("#drawerStatus").textContent=u.status;
  $("#drawerStatus").className=`badge ${statusClass(u.status)}`;
  $("#drawerPlan").textContent=u.plan;
  $("#drawerPlan").className=`plan ${planClass(u.plan)}`;
  $("#drawerEventsCount").textContent=u.events;
  $("#drawerStorage").textContent=u.storage;
  $("#drawerJoined").textContent=formatJoined(u.joined_at);

  const suspensionInfo=$("#drawerSuspensionInfo");
  if(suspensionInfo){
    suspensionInfo.hidden=true;
    $("#drawerSuspensionReason").textContent="-";
    $("#drawerSuspensionMeta").textContent="-";
  }

  const statusButton=$("#drawerToggleStatus");
  if(statusButton){
    statusButton.textContent=u.status==="Suspended"?"Reactivate User":"Suspend User";

    const canManageStatus=
      u.role==="user" &&
      u.id!==currentAdmin.user_id;

    statusButton.disabled=!canManageStatus;
    statusButton.title=canManageStatus
      ? ""
      : "Admin accounts cannot be managed from this customer status flow.";
  }

  const deleteButton=$("#drawerDeleteAccount");
  if(deleteButton){
    deleteButton.hidden=!(
      currentAdmin.user_role==="super_admin" &&
      u.role==="user" &&
      u.id!==currentAdmin.user_id
    );
  }

  const events=state.events.filter(e=>e.ownerId===id);
  $("#drawerEventsList").innerHTML=events.length
    ? events.map(e=>`<div class="drawer-event"><b>${escapeHtml(e.name)}</b><span>#${escapeHtml(e.code)} · ${escapeHtml(e.plan)} · ${escapeHtml(e.status)}</span></div>`).join("")
    : `<div class="drawer-event"><span>No events yet.</span></div>`;

  $("#userDrawer").classList.add("open");
  $("#drawerBackdrop").classList.add("show");

  try{
    const detailResponse=await getAdminUser(id);
    const detailUser=detailResponse?.user;

    if(
      !detailUser ||
      String(state.currentUserId)!==String(id)
    ){
      return;
    }

    const reason=String(detailUser.last_suspension_reason||"").trim();

    if(reason && suspensionInfo){
      $("#drawerSuspensionTitle").textContent=
        detailUser.status==="Suspended"
          ? "Suspension reason"
          : "Last suspension reason";
      $("#drawerSuspensionReason").textContent=reason;

      const stamp=detailUser.last_suspension_at
        ? formatAuditTimestamp(detailUser.last_suspension_at)
        : null;

      $("#drawerSuspensionMeta").textContent=stamp
        ? `Suspended on ${stamp.date} at ${stamp.time}`
        : "Previous suspension";
      suspensionInfo.hidden=false;
    }
  }catch(error){
    console.error("User suspension detail load failed:",error);
  }
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


async function loadLiveAdminData(){
  const subtitle=$("#pageSubtitle");
  if(subtitle) subtitle.textContent="Loading live SnapUp data…";

  try{
    const [dashboardResponse,usersResponse,eventsResponse,logsResponse]=await Promise.all([
      getAdminDashboard(),
      getAdminUsers(),
      getAdminEvents(),
      getAdminLogs(),
    ]);

    state.dashboard=dashboardResponse.dashboard || null;
    state.users=Array.isArray(usersResponse.users) ? usersResponse.users : [];
    state.events=Array.isArray(eventsResponse.events) ? eventsResponse.events : [];
    state.logs=Array.isArray(logsResponse.logs) ? logsResponse.logs : [];

    if(subtitle) subtitle.textContent="Live SnapUp platform data — secure admin operations enabled.";
  }catch(error){
    console.error("Live admin data load failed:",error);
    if(subtitle) subtitle.textContent="Live admin data could not be loaded.";
    showToast(error.message || "Admin data could not be loaded.");
  }
}

function lockRemainingActions(){
  const ids=[
    "drawerChangePlan","drawerStorageOverride",
    "eventExtendArchive"
  ];

  ids.forEach(id=>{
    const element=document.getElementById(id);
    if(!element) return;
    element.disabled=true;
    element.title="This admin action will be connected in the next phase.";
  });
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

["#quickCreateUser","#heroCreateUser","#opCreateUser","#createUserBtn"].forEach(s=>{
  const el=$(s);
  if(el) el.onclick=()=>{
    $("#createUserForm").reset();
    showModal("#createUserModal");
  };
});

["#quickCreateEvent","#heroCreateEvent","#opCreateEvent","#createEventBtn"].forEach(s=>{
  const el=$(s);
  if(el) el.onclick=()=>openCreateEvent();
});

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

$("#closeEventDrawer").onclick=closeEventDrawer;
$("#eventDrawerBackdrop").onclick=closeEventDrawer;

$("#drawerCreateEvent").onclick=()=>{
  const ownerId=state.currentUserId;
  closeDrawer();
  openCreateEvent(ownerId);
};

$("#drawerToggleStatus").onclick=()=>{
  const user=state.users.find(item=>item.id===state.currentUserId);
  if(!user) return;

  if(user.role!=="user" || user.id===currentAdmin.user_id){
    showToast("Admin accounts cannot be managed from this customer status flow.");
    return;
  }

  const willReactivate=user.status==="Suspended";

  $("#userStatusForm").reset();
  $("#userStatusName").textContent=user.name;
  $("#userStatusEmail").textContent=user.email;
  $("#userStatusCurrent").textContent=user.status;
  $("#userStatusModalTitle").textContent=willReactivate
    ? "Reactivate User"
    : "Suspend User";
  $("#userStatusSubmit").textContent=willReactivate
    ? "Reactivate User"
    : "Suspend User";
  $("#userStatusNote").textContent=willReactivate
    ? "Reactivating allows the user to sign in again. Previously issued sessions stay invalid, so the user must log in again."
    : "Suspending immediately invalidates existing sessions and blocks new logins until the account is reactivated.";

  showModal("#userStatusModal");
};

$("#drawerDeleteAccount").onclick=()=>{
  const user=state.users.find(item=>item.id===state.currentUserId);
  if(!user) return;

  if(currentAdmin.user_role!=="super_admin" || user.role!=="user"){
    showToast("Only a super admin can delete customer accounts.");
    return;
  }

  $("#deleteUserForm").reset();
  $("#deleteUserName").textContent=user.name;
  $("#deleteUserEmail").textContent=user.email;
  $("#deleteUserEvents").textContent=user.events;
  $("#deleteUserStorage").textContent=user.storage;
  showModal("#deleteUserModal");
};


[
  "drawerChangePlan","drawerStorageOverride",
  "eventExtendArchive"
].forEach(id=>{
  const element=document.getElementById(id);
  if(element) element.onclick=()=>showToast("This admin action will be connected in the next phase.");
});


$("#userStatusForm").addEventListener("submit",async event=>{
  event.preventDefault();

  const user=state.users.find(item=>item.id===state.currentUserId);
  if(!user){
    showToast("Selected user could not be found.");
    return;
  }

  if(user.role!=="user"){
    showToast("Admin accounts cannot be managed from this customer status flow.");
    return;
  }

  const form=event.currentTarget;
  const fields=new FormData(form);
  const reason=String(fields.get("reason")||"").trim();
  const willReactivate=user.status==="Suspended";
  const submit=$("#userStatusSubmit");

  if(reason.length<3){
    showToast("Enter a reason of at least 3 characters.");
    return;
  }

  submit.disabled=true;
  const originalText=submit.textContent;
  submit.textContent=willReactivate ? "Reactivating…" : "Suspending…";

  try{
    await setAdminUserActiveStatus(user.id,{
      active:willReactivate,
      reason,
    });

    closeModals();

    await loadLiveAdminData();
    rerenderAll();

    const updatedUser=state.users.find(item=>item.id===user.id);
    if(updatedUser){
      openUser(updatedUser.id);
    }

    showToast(
      willReactivate
        ? "User account reactivated. The user can sign in again."
        : "User account suspended. Existing sessions were invalidated."
    );
  }catch(error){
    console.error("Admin user status change failed:",error);
    showToast(error.message || "User account status could not be changed.");
  }finally{
    submit.disabled=false;
    submit.textContent=originalText;
  }
});

$("#deleteUserForm").addEventListener("submit",async event=>{
  event.preventDefault();

  const user=state.users.find(item=>item.id===state.currentUserId);
  if(!user){
    showToast("Selected user could not be found.");
    return;
  }

  const form=event.currentTarget;
  const fields=new FormData(form);
  const confirmationEmail=String(fields.get("confirmation_email")||"").trim();
  const currentPassword=String(fields.get("current_password")||"");
  const submit=$("#deleteUserSubmit");

  if(confirmationEmail.toLowerCase()!==String(user.email||"").trim().toLowerCase()){
    showToast("The confirmation email does not match the selected user.");
    return;
  }

  if(!currentPassword){
    showToast("Enter your current super-admin password.");
    return;
  }

  submit.disabled=true;
  const originalText=submit.textContent;
  submit.textContent="Deleting…";

  try{
    const result=await deleteAdminUser(user.id,{
      confirmation_email:confirmationEmail,
      current_password:currentPassword,
    });

    form.reset();
    closeModals();
    closeDrawer();

    state.currentUserId=null;

    await loadLiveAdminData();
    rerenderAll();
    switchView("users");

    const deletedEvents=Number(result.deleted?.events||0);
    showToast(`Account permanently deleted${deletedEvents ? ` · ${deletedEvents} event${deletedEvents===1?"":"s"} removed` : ""}.`);
  }catch(error){
    console.error("Delete admin user failed:",error);
    showToast(error.message || "User account could not be deleted.");
  }finally{
    submit.disabled=false;
    submit.textContent=originalText;
  }
});

$("#createUserForm").addEventListener("submit",async event=>{
  event.preventDefault();
  const form=event.currentTarget;
  const submit=$("#createUserSubmit");
  const fields=new FormData(form);

  const password=String(fields.get("password")||"");
  const confirmPassword=String(fields.get("confirm_password")||"");

  if(password!==confirmPassword){
    showToast("Passwords do not match.");
    return;
  }

  if(password.length<6){
    showToast("Password must be at least 6 characters.");
    return;
  }

  submit.disabled=true;
  const originalText=submit.textContent;
  submit.textContent="Creating…";

  try{
    await createAdminUser({
      name:String(fields.get("name")||"").trim(),
      email:String(fields.get("email")||"").trim(),
      phone:String(fields.get("phone")||"").trim() || null,
      password,
    });

    closeModals();
    form.reset();
    await loadLiveAdminData();
    rerenderAll();
    switchView("users");

    showToast("Verified user created successfully.");
  }catch(error){
    console.error("Create admin user failed:",error);
    showToast(error.message || "User could not be created.");
  }finally{
    submit.disabled=false;
    submit.textContent=originalText;
  }
});

$("#createEventForm").addEventListener("submit",async event=>{
  event.preventDefault();
  const form=event.currentTarget;
  const submit=$("#createEventSubmit");
  const fields=new FormData(form);
  const ownerId=String(fields.get("owner")||"").trim();

  if(!ownerId){
    showToast("Select an event owner.");
    return;
  }

  submit.disabled=true;
  const originalText=submit.textContent;
  submit.textContent="Creating…";

  try{
    await createAdminEventForUser(ownerId,{
      name:String(fields.get("name")||"").trim(),
      date:String(fields.get("date")||"").trim(),
      location:String(fields.get("location")||"").trim() || null,
      plan:String(fields.get("plan")||"Free").toLowerCase(),
      approval:String(fields.get("approval")||"Required"),
    });

    closeModals();
    form.reset();
    await loadLiveAdminData();
    rerenderAll();
    switchView("events");
    showToast("Event created for user.");
  }catch(error){
    console.error("Create admin event failed:",error);
    showToast(error.message || "Event could not be created.");
  }finally{
    submit.disabled=false;
    submit.textContent=originalText;
  }
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

lockRemainingActions();
await loadLiveAdminData();
rerenderAll();



function analyticsNumber(value){
  return Number(value||0).toLocaleString();
}

function analyticsPercent(value){
  return `${Number(value||0).toFixed(1)}%`;
}

function chartEmpty(root,message){
  if(!root) return;
  root.innerHTML=`<div class="event-empty"><strong>No data yet</strong><span>${escapeHtml(message)}</span></div>`;
}

function analyticsLineChart(targetId,primary,secondary,labels){
  const root=document.getElementById(targetId);
  if(!root) return;

  if(!labels.length){
    chartEmpty(root,"No growth data exists for this period.");
    return;
  }

  const width=760,height=250,padL=44,padR=16,padT=18,padB=38;
  const max=Math.max(1,...primary,...secondary);
  const x=i=>{
    if(labels.length===1) return (padL+width-padR)/2;
    return padL+(i*(width-padL-padR)/(labels.length-1));
  };
  const y=v=>padT+(max-v)*(height-padT-padB)/max;
  const path=arr=>arr.map((v,i)=>`${i?"L":"M"} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");

  const grid=[0,.25,.5,.75,1].map(t=>{
    const yy=padT+t*(height-padT-padB);
    const val=Math.round(max*(1-t));
    return `<line class="chart-gridline" x1="${padL}" x2="${width-padR}" y1="${yy}" y2="${yy}"/><text class="chart-axis-label" x="2" y="${yy+3}">${val}</text>`;
  }).join("");

  const labelStep=Math.max(1,Math.ceil(labels.length/8));
  const xlabels=labels.map((label,index)=>{
    if(index%labelStep!==0 && index!==labels.length-1) return "";
    return `<text class="chart-axis-label" text-anchor="middle" x="${x(index)}" y="${height-9}">${escapeHtml(label)}</text>`;
  }).join("");

  root.innerHTML=`
    <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
      ${grid}
      <path class="chart-path-primary" d="${path(primary)}"/>
      <path class="chart-path-secondary" d="${path(secondary)}"/>
      ${primary.map((value,index)=>`<circle class="chart-point-primary" cx="${x(index)}" cy="${y(value)}" r="4"><title>${escapeHtml(labels[index])} · Users: ${value}</title></circle>`).join("")}
      ${secondary.map((value,index)=>`<circle class="chart-point-secondary" cx="${x(index)}" cy="${y(value)}" r="3.5"><title>${escapeHtml(labels[index])} · Events: ${value}</title></circle>`).join("")}
      ${xlabels}
    </svg>`;
}

function analyticsMediaBars(targetId,timeline){
  const root=document.getElementById(targetId);
  if(!root) return;

  if(!timeline.length){
    chartEmpty(root,"No media was uploaded in this period.");
    return;
  }

  const totals=timeline.map(item=>
    Number(item.images||0)+Number(item.videos||0)+Number(item.messages||0)
  );
  const max=Math.max(1,...totals);
  const labelStep=Math.max(1,Math.ceil(timeline.length/8));

  root.innerHTML=timeline.map((item,index)=>{
    const images=Number(item.images||0);
    const videos=Number(item.videos||0);
    const messages=Number(item.messages||0);
    const total=images+videos+messages;

    const imageHeight=(images/max)*100;
    const videoHeight=(videos/max)*100;
    const messageHeight=(messages/max)*100;
    const label=(index%labelStep===0 || index===timeline.length-1)
      ? escapeHtml(item.label)
      : "";

    return `<div class="bar-group">
      <span class="bar-tooltip">${total}</span>
      <div class="bar-stack">
        <div class="bar" style="height:${messageHeight}%;background:#f59e0b"><title>Messages: ${messages}</title></div>
        <div class="bar video" style="height:${videoHeight}%"><title>Videos: ${videos}</title></div>
        <div class="bar photo" style="height:${imageHeight}%"><title>Images: ${images}</title></div>
      </div>
      <label>${label}</label>
    </div>`;
  }).join("");
}

function analyticsPackageDonut(mix){
  const donut=$("#analyticsPackageDonut");
  const legend=$("#analyticsPackageLegend");
  if(!donut || !legend) return;

  const values=[
    {key:"premium",label:"Premium",value:Number(mix?.premium||0),color:"#6d5dfc"},
    {key:"plus",label:"Plus",value:Number(mix?.plus||0),color:"#2563eb"},
    {key:"mini",label:"Mini",value:Number(mix?.mini||0),color:"#f59e0b"},
    {key:"free",label:"Free",value:Number(mix?.free||0),color:"#94a3b8"},
  ];

  const total=values.reduce((sum,item)=>sum+item.value,0);
  $("#analyticsPackageTotal").textContent=analyticsNumber(total);

  if(!total){
    donut.style.background="conic-gradient(#e5e7eb 0 100%)";
    legend.innerHTML=`<div class="legend-row"><span>No events yet</span></div>`;
    return;
  }

  let cursor=0;
  const stops=values.map(item=>{
    const start=cursor;
    cursor+=(item.value/total)*100;
    return `${item.color} ${start.toFixed(2)}% ${cursor.toFixed(2)}%`;
  });

  donut.style.background=`conic-gradient(${stops.join(",")})`;
  legend.innerHTML=values.map(item=>{
    const percent=((item.value/total)*100).toFixed(1);
    return `<div class="legend-row"><i style="background:${item.color}"></i><span>${escapeHtml(item.label)}</span><b>${item.value} · ${percent}%</b></div>`;
  }).join("");
}

function analyticsTopStorage(events){
  const root=$("#analyticsTopStorageBars");
  if(!root) return;

  if(!events?.length){
    chartEmpty(root,"No event storage has been consumed yet.");
    return;
  }

  const max=Math.max(1,...events.map(item=>Number(item.storage_bytes||0)));

  root.innerHTML=events.map(item=>{
    const value=Number(item.storage_bytes||0);
    const width=Math.max(value>0?2:0,(value/max)*100);

    return `<div class="hbar-row">
      <span title="${escapeAttr(item.event_name)}">#${escapeHtml(item.event_code||"—")}</span>
      <div class="hbar-track"><div class="hbar-fill" style="width:${width}%"></div></div>
      <b title="${escapeAttr(item.event_name)}">${escapeHtml(item.storage_display||"0 B")}</b>
    </div>`;
  }).join("");
}

function renderAnalytics(){
  const analytics=state.analytics;
  if(!analytics) return;

  const kpis=analytics.kpis || {};
  const timeline=Array.isArray(analytics.timeline) ? analytics.timeline : [];

  $("#analyticsNewUsers").textContent=analyticsNumber(kpis.new_users);
  $("#analyticsNewEvents").textContent=analyticsNumber(kpis.new_events);
  $("#analyticsMediaUploads").textContent=analyticsNumber(kpis.media_uploads);
  $("#analyticsAvgStorage").textContent=
    kpis.average_storage_per_active_event_display || "0 B";

  $("#analyticsNewUsersMeta").textContent=`Last ${analytics.period_days} days`;
  $("#analyticsNewEventsMeta").textContent=
    `${analyticsNumber(kpis.active_events)} active events now`;
  $("#analyticsMediaUploadsMeta").textContent=
    `${analyticsNumber(analytics.media_by_type?.image)} images · ${analyticsNumber(analytics.media_by_type?.video)} videos · ${analyticsNumber(analytics.media_by_type?.message)} messages`;
  $("#analyticsAvgStorageMeta").textContent=
    `${kpis.total_storage_display || "0 B"} total consumed`;

  $("#analyticsGrowthSubtitle").textContent=
    `New users and events · last ${analytics.period_days} days`;
  $("#analyticsMediaSubtitle").textContent=
    `Images, videos and messages · last ${analytics.period_days} days`;
  $("#analyticsPackageSubtitle").textContent=
    `${analyticsPercent(kpis.paid_event_share)} of events are on paid packages`;
  $("#analyticsStorageSubtitle").textContent=
    `${kpis.total_storage_display || "0 B"} total cumulative event storage`;

  analyticsLineChart(
    "analyticsGrowthChart",
    timeline.map(item=>Number(item.users||0)),
    timeline.map(item=>Number(item.events||0)),
    timeline.map(item=>item.label),
  );

  analyticsMediaBars("analyticsMediaChart",timeline);
  analyticsPackageDonut(analytics.package_mix || {});
  analyticsTopStorage(analytics.top_storage_events || []);
}

async function loadAnalytics(days=30){
  const normalized=[7,30,90,365].includes(Number(days))
    ? Number(days)
    : 30;

  state.analyticsDays=normalized;

  if(state.analyticsLoading) return;
  state.analyticsLoading=true;

  const select=$("#analyticsPeriod");
  if(select) select.value=String(normalized);

  ["analyticsGrowthChart","analyticsMediaChart","analyticsTopStorageBars"].forEach(id=>{
    const root=document.getElementById(id);
    if(root) root.innerHTML=`<div class="event-empty"><strong>Loading analytics…</strong><span>Reading live SnapUp data.</span></div>`;
  });

  try{
    const response=await getAdminAnalytics(normalized);
    state.analytics=response.analytics || null;
    renderAnalytics();
  }catch(error){
    console.error("Admin analytics load failed:",error);
    state.analytics=null;
    ["analyticsGrowthChart","analyticsMediaChart","analyticsTopStorageBars"].forEach(id=>{
      chartEmpty(document.getElementById(id),"Analytics data could not be loaded.");
    });
    showToast(error.message || "Analytics data could not be loaded.");
  }finally{
    state.analyticsLoading=false;
  }
}

$("#analyticsPeriod")?.addEventListener("change",event=>{
  loadAnalytics(Number(event.currentTarget.value));
});



async function openEvent(id){
  state.currentEventId=id;
  const cached=state.events.find(x=>x.id===id);
  if(!cached) return;

  const renderDrawer=(e)=>{
    $("#eventDrawerName").textContent=e.name;
    $("#eventDrawerCode").textContent=`#${e.code}`;
    $("#eventDrawerStatus").textContent=e.status;
    $("#eventDrawerStatus").className=`badge ${statusClass(e.status)}`;
    $("#eventDrawerPlan").textContent=e.plan;
    $("#eventDrawerPlan").className=`plan ${planClass(e.plan)}`;
    $("#eventDrawerGuests").textContent=e.guests ?? "—";
    $("#eventDrawerMedia").textContent=e.photos == null ? "—" : (e.photos||0)+(e.videos||0)+(e.messages||0);
    $("#eventDrawerStorage").textContent=e.storage;
    $("#eventDrawerOwner").textContent=`${e.ownerName || ownerName(e.ownerId)} (${e.ownerEmail || ownerEmail(e.ownerId)})`;
    $("#eventDrawerDate").textContent=e.date || "-";
    $("#eventDrawerLocation").textContent=e.location || "-";
    $("#eventDrawerApproval").textContent=e.approval || "-";
    $("#eventDrawerVideo").textContent=e.video || "Allowed";
    $("#eventDrawerStorageLimit").textContent=e.storage_limit_display || "-";
    $("#eventDrawerStorageOverride").textContent=
      e.storage_limit_override_display || "None";
    $("#eventToggleStatus").textContent=
      e.status==="Suspended" ? "Reactivate Event" : "Suspend Event";

    const suspensionInfo=$("#eventSuspensionInfo");
    if(suspensionInfo){
      const hasReason=Boolean(String(e.last_suspension_reason||"").trim());
      suspensionInfo.hidden=!hasReason;
      if(hasReason){
        $("#eventSuspensionTitle").textContent=
          e.status==="Suspended"
            ? "Suspension reason"
            : "Last suspension reason";
        $("#eventSuspensionReason").textContent=e.last_suspension_reason;

        const stamp=e.last_suspension_at
          ? formatAuditTimestamp(e.last_suspension_at)
          : null;

        $("#eventSuspensionMeta").textContent=stamp
          ? `Suspended on ${stamp.date} at ${stamp.time}`
          : "Previous admin suspension";
      }
    }

    const activities=[
      `${e.photos ?? "—"} photos`,
      `${e.videos ?? "—"} videos`,
      `${e.messages ?? "—"} messages`,
      `Created: ${formatCreatedAt(e.createdAt)}`
    ];
    $("#eventActivityList").innerHTML=activities.map(a=>`<div class="drawer-event"><span>${escapeHtml(a)}</span></div>`).join("");
  };

  renderDrawer(cached);
  $("#eventDrawer").classList.add("open");
  $("#eventDrawerBackdrop").classList.add("show");

  try{
    const data=await getAdminEvent(id);
    const detail=data.event;
    const index=state.events.findIndex(x=>x.id===id);
    if(index>=0) state.events[index]={...state.events[index],...detail};
    renderDrawer({...cached,...detail});
    renderEvents();
  }catch(error){
    console.error("Admin event detail load failed:",error);
    showToast("Event usage details could not be loaded.");
  }
}

function closeEventDrawer(){
  $("#eventDrawer").classList.remove("open");
  $("#eventDrawerBackdrop").classList.remove("show");
}

$("#closeEventDrawer").onclick=closeEventDrawer;
$("#eventDrawerBackdrop").onclick=closeEventDrawer;

$("#eventToggleStatus").onclick=()=>{
  const event=state.events.find(item=>item.id===state.currentEventId);
  if(!event) return;

  const willReactivate=event.status==="Suspended";

  $("#eventStatusForm").reset();
  $("#eventStatusName").textContent=event.name;
  $("#eventStatusCode").textContent=`#${event.code}`;
  $("#eventStatusCurrent").textContent=event.status;
  $("#eventStatusModalTitle").textContent=
    willReactivate ? "Reactivate Event" : "Suspend Event";
  $("#eventStatusSubmit").textContent=
    willReactivate ? "Reactivate Event" : "Suspend Event";
  $("#eventStatusNote").textContent=willReactivate
    ? "Removing the admin suspension restores the event's previous active/inactive state."
    : "Suspending blocks guest join and upload access. The event owner cannot reactivate an admin-suspended event.";

  showModal("#eventStatusModal");
};

$("#eventStatusForm").addEventListener("submit",async event=>{
  event.preventDefault();

  const target=state.events.find(item=>item.id===state.currentEventId);
  if(!target) return;

  const reason=String($("#eventStatusReason").value||"").trim();
  if(reason.length<3){
    showToast("Enter a reason of at least 3 characters.");
    return;
  }

  const willReactivate=target.status==="Suspended";
  const submit=$("#eventStatusSubmit");
  submit.disabled=true;
  const original=submit.textContent;
  submit.textContent=willReactivate ? "Reactivating…" : "Suspending…";

  try{
    await setAdminEventSuspension(target.id,{
      suspended:!willReactivate,
      reason,
    });

    closeModals();
    state.storage=null;
    await loadLiveAdminData();
    rerenderAll();
    await openEvent(target.id);

    showToast(
      willReactivate
        ? "Event admin suspension removed."
        : "Event suspended. Join and uploads are blocked."
    );
  }catch(error){
    console.error("Event suspension change failed:",error);
    showToast(error.message || "Event suspension could not be changed.");
  }finally{
    submit.disabled=false;
    submit.textContent=original;
  }
});

$("#eventChangePlan").onclick=()=>{
  const event=state.events.find(item=>item.id===state.currentEventId);
  if(!event) return;

  $("#eventPlanForm").reset();
  $("#eventPlanCurrent").textContent=event.plan || "-";
  $("#eventPlanConsumed").textContent=event.storage || "0 B";
  $("#eventPlanOverride").textContent=
    event.storage_limit_override_display || "None";
  $("#eventPlanSelect").value=String(event.plan||"Free").toLowerCase();

  showModal("#eventPlanModal");
};

$("#eventPlanForm").addEventListener("submit",async event=>{
  event.preventDefault();

  const target=state.events.find(item=>item.id===state.currentEventId);
  if(!target) return;

  const packageKey=String($("#eventPlanSelect").value||"").toLowerCase();
  const reason=String($("#eventPlanReason").value||"").trim();
  const submit=$("#eventPlanSubmit");

  if(reason.length<3){
    showToast("Enter a reason of at least 3 characters.");
    return;
  }

  submit.disabled=true;
  const original=submit.textContent;
  submit.textContent="Updating…";

  try{
    await changeAdminEventPackage(target.id,{
      package_key:packageKey,
      reason,
    });

    closeModals();
    state.storage=null;
    await loadLiveAdminData();
    rerenderAll();
    await openEvent(target.id);

    showToast("Event package updated.");
  }catch(error){
    console.error("Event package change failed:",error);
    showToast(error.message || "Event package could not be changed.");
  }finally{
    submit.disabled=false;
    submit.textContent=original;
  }
});

$("#eventStorageOverride").onclick=()=>{
  const event=state.events.find(item=>item.id===state.currentEventId);
  if(!event) return;

  $("#eventStorageOverrideForm").reset();
  $("#eventStoragePackageLimit").textContent=
    event.package_storage_limit_display || "-";
  $("#eventStorageEffectiveLimit").textContent=
    event.storage_limit_display || "-";
  $("#eventStorageConsumed").textContent=event.storage || "0 B";

  if(event.storage_limit_override_bytes){
    $("#eventStorageLimitGb").value=
      (Number(event.storage_limit_override_bytes)/(1024**3)).toFixed(2);
  }

  $("#eventStorageClear").disabled=!event.storage_limit_override_bytes;
  showModal("#eventStorageOverrideModal");
};

$("#eventStorageOverrideForm").addEventListener("submit",async event=>{
  event.preventDefault();

  const target=state.events.find(item=>item.id===state.currentEventId);
  if(!target) return;

  const limitGb=Number($("#eventStorageLimitGb").value);
  const reason=String($("#eventStorageReason").value||"").trim();
  const submit=$("#eventStorageSubmit");

  if(!Number.isFinite(limitGb) || limitGb<0.1 || limitGb>1024){
    showToast("Enter a custom limit between 0.1 GB and 1024 GB.");
    return;
  }

  if(reason.length<3){
    showToast("Enter a reason of at least 3 characters.");
    return;
  }

  submit.disabled=true;
  const original=submit.textContent;
  submit.textContent="Applying…";

  try{
    await setAdminEventStorageOverride(target.id,{
      limit_gb:limitGb,
      reason,
    });

    closeModals();
    state.storage=null;
    await loadLiveAdminData();
    rerenderAll();
    await openEvent(target.id);

    showToast("Custom event storage limit applied.");
  }catch(error){
    console.error("Event storage override failed:",error);
    showToast(error.message || "Storage override could not be changed.");
  }finally{
    submit.disabled=false;
    submit.textContent=original;
  }
});

$("#eventStorageClear").onclick=async()=>{
  const target=state.events.find(item=>item.id===state.currentEventId);
  if(!target) return;

  const reason=String($("#eventStorageReason").value||"").trim();

  if(reason.length<3){
    showToast("Enter a reason before removing the override.");
    return;
  }

  const button=$("#eventStorageClear");
  button.disabled=true;
  const original=button.textContent;
  button.textContent="Removing…";

  try{
    await setAdminEventStorageOverride(target.id,{
      limit_gb:null,
      reason,
    });

    closeModals();
    state.storage=null;
    await loadLiveAdminData();
    rerenderAll();
    await openEvent(target.id);

    showToast("Storage override removed. Package limit restored.");
  }catch(error){
    console.error("Storage override removal failed:",error);
    showToast(error.message || "Storage override could not be removed.");
  }finally{
    button.disabled=false;
    button.textContent=original;
  }
};

$("#eventExtendArchive").onclick=()=>{
  showToast("Archive extension is not connected yet.");
};

