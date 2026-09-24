import { API_URL } from "./config.js?v=runtime-api-2";
import {
  getAdminDashboard,
  getAdminUsers,
  getAdminEvents,
  getAdminEvent,
  createAdminUser,
  createAdminEventForUser,
  getAdminLogs,
  deleteAdminUser,
} from "./admin-api.js?v=admin-delete-user-1";

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
  users: [],
  events: [],
  logs: [],
  dashboard: null,
  currentUserId: null,
  currentEventId: null,
  eventPeriod: "all",
  auditPeriod: "all",
};

const views = {
  dashboard:["Dashboard","Operate and monitor your SnapUp Events platform."],
  analytics:["Analytics","Visualize growth, revenue, storage and usage trends."],
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
  const sorted=[...state.users].sort((a,b)=>(b.storage_bytes||0)-(a.storage_bytes||0));
  $("#storageRanking").innerHTML=sorted.map((u,i)=>`
    <div class="rank-row"><span class="rank-num">${String(i+1).padStart(2,"0")}</span><div class="rank-copy"><b>${escapeHtml(u.name)}</b><span>${escapeHtml(u.plan)} · ${u.events} events</span></div><strong>${escapeHtml(u.storage)}</strong></div>`).join("");
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

function openUser(id){
  state.currentUserId=id;
  const u=state.users.find(x=>x.id===id); if(!u) return;
  $("#drawerUserName").textContent=u.name; $("#drawerUserEmail").textContent=u.email; $("#drawerAvatar").textContent=initials(u.name);
  $("#drawerStatus").textContent=u.status; $("#drawerStatus").className=`badge ${statusClass(u.status)}`;
  $("#drawerPlan").textContent=u.plan; $("#drawerPlan").className=`plan ${planClass(u.plan)}`;
  $("#drawerEventsCount").textContent=u.events; $("#drawerStorage").textContent=u.storage; $("#drawerJoined").textContent=formatJoined(u.joined_at);
  $("#drawerToggleStatus").textContent=u.status==="Suspended"?"Reactivate User":"Suspend User";
  const deleteButton=$("#drawerDeleteAccount");
  if(deleteButton){
    deleteButton.hidden=!(
      currentAdmin.user_role==="super_admin" &&
      u.role==="user" &&
      u.id!==currentAdmin.user_id
    );
  }
  const events=state.events.filter(e=>e.ownerId===id);
  $("#drawerEventsList").innerHTML=events.length?events.map(e=>`<div class="drawer-event"><b>${escapeHtml(e.name)}</b><span>#${e.code} · ${e.plan} · ${escapeHtml(e.status)}</span></div>`).join(""):`<div class="drawer-event"><span>No events yet.</span></div>`;
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
    "drawerChangePlan","drawerToggleStatus","drawerStorageOverride",
    "eventToggleStatus","eventChangePlan","eventExtendArchive","eventChangeOwner"
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
  "drawerChangePlan","drawerToggleStatus","drawerStorageOverride",
  "eventToggleStatus","eventChangePlan","eventExtendArchive","eventChangeOwner"
].forEach(id=>{
  const element=document.getElementById(id);
  if(element) element.onclick=()=>showToast("This admin action will be connected in the next phase.");
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

// Analytics charts stay disabled until the analytics API is connected.


async function openEvent(id){
  state.currentEventId=id;
  const cached=state.events.find(x=>x.id===id);
  if(!cached) return;

  const renderDrawer=(e)=>{
    $("#eventDrawerName").textContent=e.name;
    $("#eventDrawerCode").textContent=`#${e.code}`;
    $("#eventDrawerStatus").textContent=e.status;
    $("#eventDrawerStatus").className=`badge ${e.status==="Active"?"active":"unverified"}`;
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
    $("#eventToggleStatus").textContent=e.status==="Inactive"?"Reactivate Event":"Deactivate Event";

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

