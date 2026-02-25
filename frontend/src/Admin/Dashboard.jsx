import React,{ useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";

const BASE = "https://readly-in.onrender.com/api/v1/user"; // ✅ vi — backend app.use("/api/vi/user") se match

const API = {
  // User
  getProfile    : (id) => `${BASE}/user/profile/${id}`,   // GET
  updateProfile : (id) => `${BASE}/user/profile/${id}`,   // PUT  multipart/form-data { Username, email, bio, profileImg? }
  dashboardStats: (id) => `${BASE}/user/stats/${id}`,     // GET  → { totalBlogs, totalViews, totalLikes, totalComments }

  
  // ✅ Updated API URLs
  getAllBlogs : ()   => `${BASE}/user/blog/all`,
  getMyBlogs : (id) => `${BASE}/user/blog/user/${id}`,
  createBlog : ()   => `${BASE}/user/blog/create`,
  deleteBlog : (id) => `${BASE}/user/blog/${id}`,
  updateBlog : (id) => `${BASE}/user/blog/${id}`,      
  // PUT
};

// ─── Helpers ─────────────────────────────────────────────────
const getToken = () => localStorage.getItem("token") || "";
const getUser  = () => { try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; } };

async function apiFetch(url, opts = {}) {
  try {
    const res  = await fetch(url, {
      ...opts,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getToken()}`,
        ...(opts.headers || {}),
      },
    });
    const data = await res.json();
    return { ok: res.ok, data, status: res.status };
  } catch {
    return { ok: false, data: { message: "Server se connect nahi ho raha" }, status: 0 };
  }
}

// Multipart fetch — NO Content-Type header (browser sets multipart boundary automatically)
// Backend ek hi PUT endpoint mein image + text fields dono handle karta hai
async function apiFetchFormData(url, formData, method = "PUT") {
  try {
    const res = await fetch(url, {
      method,
      headers: {
        "Authorization": `Bearer ${getToken()}`,
        // ⚠️ Content-Type bilkul mat dena — multer ka multipart/form-data boundary auto-set hota hai
      },
      body: formData,
    });

    // Server kabhi kabhi JSON nahi bhejta (HTML error page, empty body, crash)
    // Safe tarike se parse karo
    const text = await res.text();
    let data = {};
    try {
      data = JSON.parse(text);
    } catch {
      // Non-JSON response — readable error dikhao
      console.error("Non-JSON response from server:", text.slice(0, 300));
      data = {
        message: res.ok
          ? "Server response parse nahi ho saka"
          : `Server error ${res.status}: Route pe upload.single("profileImg") middleware check karo`,
      };
    }

    return { ok: res.ok, data, status: res.status };
  } catch (err) {
    console.error("apiFetchFormData network error:", err);
    return { ok: false, data: { message: "Server se connect nahi ho raha" }, status: 0 };
  }
}

// ─── Constants ──────────────────────────────────────────────
const CATEGORIES = ["Technology","Design","Science","Culture","Philosophy"];
const CAT = {
  Technology : { bg:"rgba(99,102,241,.14)",  text:"#a5b4fc" },
  Design     : { bg:"rgba(236,72,153,.14)",  text:"#f9a8d4" },
  Science    : { bg:"rgba(6,182,212,.14)",   text:"#67e8f9" },
  Culture    : { bg:"rgba(245,158,11,.14)",  text:"#fcd34d" },
  Philosophy : { bg:"rgba(139,92,246,.14)",  text:"#c4b5fd" },
};
const fmt = (n=0) => n>=1000 ? (n/1000).toFixed(1)+"k" : String(n);

// ════════════════════════════════════════════════════
// MINI COMPONENTS
// ════════════════════════════════════════════════════
function Spin() {
  return <div className="w-4 h-4 border-2 border-white/25 border-t-white rounded-full animate-spin inline-block"/>;
}

function Toast({ msg, type, onClose }) {
  useEffect(()=>{ const t=setTimeout(onClose,3500); return ()=>clearTimeout(t); },[]);
  return (
    <div className={`fixed bottom-6 right-6 z-[200] flex items-center gap-3 px-5 py-3 rounded-2xl border text-sm font-medium shadow-2xl
      ${type==="success"?"bg-green-900/60 border-green-500/30 text-green-200":"bg-red-900/60 border-red-500/30 text-red-200"}`}
      style={{backdropFilter:"blur(16px)",animation:"toastIn .25s ease"}}>
      <span>{type==="success"?"✓":"✕"}</span>
      <span>{msg}</span>
      <button onClick={onClose} className="ml-2 opacity-50 hover:opacity-100 text-xs">✕</button>
    </div>
  );
}

function Ava({ src, initials, cls="w-9 h-9", txt="text-sm" }) {
  const [err,setErr] = useState(false);
  if (src && !err)
    return <img src={src} alt="" onError={()=>setErr(true)}
      className={`${cls} rounded-xl object-cover border-2 border-indigo-500/30 flex-shrink-0`}/>;
  return (
    <div className={`${cls} rounded-xl flex items-center justify-center ${txt} font-bold text-white flex-shrink-0`}
      style={{background:"linear-gradient(135deg,#6366f1,#ec4899)"}}>
      {initials}
    </div>
  );
}

// ════════════════════════════════════════════════════
// SIDEBAR
// ════════════════════════════════════════════════════
const NAV = [
  { id:"overview",  label:"Overview",
    ic:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>},
  { id:"create",    label:"Create Blog",
    ic:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>},
  { id:"allblogs",  label:"All Blogs",
    ic:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/></svg>},
  { id:"profile",   label:"Profile",
    ic:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>},
];

function Sidebar({ active, setActive, dark, setDark, col, setCol }) {
  const navigate = useNavigate();
  const u        = getUser();
  const img      = u?.Profile_Img || u?.profileImg || "";
  const name     = u?.Username || u?.name || "User";
  const email    = u?.email || "";
  const init     = name.slice(0,2).toUpperCase();

  // theme tokens
  const T = {
    bg     : dark ? "#0a0a13" : "#ffffff",
    bdr    : dark ? "#18182a" : "#ededf5",
    txt    : dark ? "#e8e8ff" : "#0f0f1a",
    sub    : dark ? "#55556e" : "#9999b0",
    actBg  : dark ? "rgba(99,102,241,.18)" : "rgba(99,102,241,.09)",
    actTx  : dark ? "#a5b4fc" : "#4338ca",
    hov    : dark ? "rgba(255,255,255,.04)" : "rgba(0,0,0,.03)",
  };

  const logout = () => { localStorage.clear(); navigate("/auth"); };

  return (
    <aside className="fixed left-0 top-0 h-screen flex flex-col z-40 transition-all duration-300"
      style={{width:col?72:240, background:T.bg, borderRight:`1px solid ${T.bdr}`}}>

      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5" style={{borderBottom:`1px solid ${T.bdr}`}}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{background:"linear-gradient(135deg,#6366f1,#ec4899)"}}>
          <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
            <path d="M4 4h16v2H4V4zm0 4h10v2H4V8zm0 4h16v2H4v-2zm0 4h10v2H4v-2z" fill="white"/>
          </svg>
        </div>
        {!col && <span className="font-bold text-lg tracking-tight whitespace-nowrap" style={{color:T.txt,fontFamily:"'Playfair Display',serif"}}>Readly.in</span>}
        <button onClick={()=>setCol(!col)} className="ml-auto p-1.5 rounded-lg" style={{color:T.sub}}
          onMouseEnter={e=>e.currentTarget.style.background=T.hov}
          onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"
            style={{transform:col?"rotate(180deg)":"none",transition:"transform .3s"}}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(item=>{
          const on = active===item.id;
          return (
            <button key={item.id} onClick={()=>setActive(item.id)} title={col?item.label:""}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left"
              style={{background:on?T.actBg:"transparent", color:on?T.actTx:T.sub}}
              onMouseEnter={e=>{ if(!on) e.currentTarget.style.background=T.hov; }}
              onMouseLeave={e=>{ if(!on) e.currentTarget.style.background="transparent"; }}>
              <span className="flex-shrink-0">{item.ic}</span>
              {!col && <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>}
              {on && !col && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400"/>}
            </button>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 space-y-1" style={{borderTop:`1px solid ${T.bdr}`}}>
        {/* Dark mode toggle */}
        <button onClick={()=>setDark(!dark)} title={col?"Toggle theme":""} 
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left"
          style={{color:T.sub}}
          onMouseEnter={e=>e.currentTarget.style.background=T.hov}
          onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
          <span className="flex-shrink-0">
            {dark
              ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><circle cx="12" cy="12" r="5"/><path strokeLinecap="round" d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
              : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><path strokeLinecap="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
            }
          </span>
          {!col && (
            <div className="flex items-center justify-between flex-1">
              <span className="text-sm font-medium">{dark?"Light":"Dark"} Mode</span>
              <div className="w-9 h-5 rounded-full flex items-center px-0.5 transition-all duration-300"
                style={{background:dark?"#6366f1":"#d1d5db"}}>
                <div className="w-4 h-4 rounded-full bg-white shadow transition-all duration-300"
                  style={{transform:dark?"translateX(16px)":"translateX(0)"}}/>
              </div>
            </div>
          )}
        </button>

        {/* User card */}
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl"
          style={{background:dark?"rgba(255,255,255,.03)":"rgba(0,0,0,.02)"}}>
          <Ava src={img} initials={init} cls="w-8 h-8" txt="text-xs"/>
          {!col && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate" style={{color:T.txt}}>{name}</p>
              <p className="text-xs truncate" style={{color:T.sub}}>{email}</p>
            </div>
          )}
        </div>

        {/* Logout */}
        <button onClick={logout} title={col?"Logout":""}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left text-red-400 hover:text-red-300"
          onMouseEnter={e=>e.currentTarget.style.background="rgba(239,68,68,.08)"}
          onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5 flex-shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
          </svg>
          {!col && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>
    </aside>
  );
}

// ════════════════════════════════════════════════════
// OVERVIEW
// ════════════════════════════════════════════════════
function Overview({ dark, setActive }) {
  const u  = getUser();
  const id = u?.id || u?._id || "";
  const [stats,setStats] = useState({totalBlogs:0,totalViews:0,totalLikes:0,totalComments:0});
  const [blogs,setBlogs] = useState([]);
  const [load,setLoad]   = useState(true);

  useEffect(()=>{
    (async()=>{
      setLoad(true);
      const [s,b] = await Promise.all([
        id ? apiFetch(API.dashboardStats(id)) : {ok:false},
        id ? apiFetch(API.getMyBlogs(id))     : apiFetch(API.getAllBlogs()),
      ]);
      if (s.ok) setStats(s.data?.stats || s.data || {});
      if (b.ok) setBlogs(Array.isArray(b.data) ? b.data : b.data?.blogs || []);
      setLoad(false);
    })();
  },[id]);

  const C = dark
    ? {bg:"#0e0e1a",bdr:"#18182a",txt:"#e8e8ff",sub:"#55556e"}
    : {bg:"#ffffff",bdr:"#ededf5",txt:"#0f0f1a",sub:"#9999b0"};

  const cards = [
    {label:"Stories",  val:fmt(stats.totalBlogs   || blogs.length), icon:"📖", dot:"#6366f1"},
    {label:"Views",    val:fmt(stats.totalViews    || 0),            icon:"👁️", dot:"#06b6d4"},
    {label:"Likes",    val:fmt(stats.totalLikes    || 0),            icon:"❤️", dot:"#ec4899"},
    {label:"Comments", val:fmt(stats.totalComments || 0),            icon:"💬", dot:"#f59e0b"},
  ];

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-2xl font-bold" style={{color:C.txt,fontFamily:"'Playfair Display',serif"}}>Dashboard</h1>
        <p className="text-sm mt-1" style={{color:C.sub}}>Overview Of recent Storys</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(c=>(
          <div key={c.label} className="rounded-2xl border p-5 transition-all hover:-translate-y-0.5"
            style={{background:C.bg,borderColor:C.bdr}}>
            <div className="flex justify-between items-start mb-3">
              <span className="text-2xl">{c.icon}</span>
              <div className="w-2 h-2 rounded-full mt-1" style={{background:c.dot}}/>
            </div>
            {load
              ? <div className="h-7 w-14 rounded-lg animate-pulse" style={{background:dark?"#1e1e30":"#e5e7eb"}}/>
              : <p className="text-2xl font-bold" style={{color:C.txt}}>{c.val}</p>}
            <p className="text-xs mt-1" style={{color:C.sub}}>{c.label}</p>
          </div>
        ))}
      </div>

      {/* Recent table */}
      <div className="rounded-2xl border overflow-hidden" style={{background:C.bg,borderColor:C.bdr}}>
        <div className="flex items-center justify-between px-6 py-4" style={{borderBottom:`1px solid ${C.bdr}`}}>
          <p className="text-sm font-semibold" style={{color:C.txt}}>Recent Stories</p>
          <button onClick={()=>setActive("allblogs")} className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">View all →</button>
        </div>
        {load ? (
          <div className="p-6 space-y-3">{[1,2,3].map(i=><div key={i} className="h-12 rounded-xl animate-pulse" style={{background:dark?"#1e1e30":"#f3f4f6"}}/>)}</div>
        ) : blogs.length===0 ? (
          <div className="py-14 text-center" style={{color:C.sub}}>
            <p className="text-3xl mb-2">📭</p>
            <p className="text-xl">No stories found</p>
            <button onClick={()=>setActive("create")} className="mt-2 text-md text-indigo-400">Write Your First Story</button>
          </div>
        ) : blogs.slice(0,5).map((b,i)=>{
          const c=CAT[b.category]||CAT.Technology;
          return (
            <div key={b._id||i} className="flex items-center gap-4 px-6 py-3.5 transition-all"
              style={{borderBottom:i<4?`1px solid ${C.bdr}`:"none"}}
              onMouseEnter={e=>e.currentTarget.style.background=dark?"rgba(255,255,255,.025)":"rgba(0,0,0,.02)"}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{color:C.txt}}>{b.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{background:c.bg,color:c.text}}>{b.category}</span>
                  <span className="text-xs" style={{color:C.sub}}>{(b.createdAt||b.date||"").slice(0,10)}</span>
                </div>
              </div>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${(b.status||"published")==="published"?"text-green-400":"text-yellow-400"}`}
                style={{background:(b.status||"published")==="published"?"rgba(34,197,94,.1)":"rgba(234,179,8,.1)"}}>
                {b.status||"published"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════
// CREATE BLOG — with cover image upload
// ════════════════════════════════════════════════════
function CreateBlog({ dark, toast }) {
  const [step,setStep] = useState(1);
  const [load,setLoad] = useState(false);
  const [form,setForm] = useState({title:"",excerpt:"",content:"",category:"Technology",tags:"",status:"published"});
  const set = k => e => setForm({...form,[k]:e.target.value});
  const wc  = form.content.trim().split(/\s+/).filter(Boolean).length;
  const rt  = Math.max(1,Math.ceil(wc/200));

  // ── Cover image ──────────────────────────────────
  const [coverFile, setCoverFile] = useState(null);
  const [coverPrev, setCoverPrev] = useState("");
  const coverRef = useRef(null);

  const handleCover = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast("Sirf image files allowed hain","error"); return; }
    if (file.size > 5*1024*1024)         { toast("Image 5MB se chhoti honi chahiye","error"); return; }
    setCoverFile(file);
    if (coverPrev) URL.revokeObjectURL(coverPrev);
    setCoverPrev(URL.createObjectURL(file));
  };

  const removeCover = () => {
    if (coverPrev) URL.revokeObjectURL(coverPrev);
    setCoverFile(null); setCoverPrev("");
    if (coverRef.current) coverRef.current.value = "";
  };

  useEffect(()=>()=>{ if(coverPrev) URL.revokeObjectURL(coverPrev); },[]);

  const C = dark
    ? {bg:"#0e0e1a",bdr:"#18182a",txt:"#e8e8ff",sub:"#55556e",lbl:"#77778a",
       inp:"border-[#18182a] bg-white/[.04] text-white placeholder-[#40404e] focus:border-indigo-500/60"}
    : {bg:"#ffffff",bdr:"#ededf5",txt:"#0f0f1a",sub:"#9999b0",lbl:"#666677",
       inp:"border-[#e5e5f0] bg-gray-50 text-gray-900 placeholder-gray-400 focus:border-indigo-400 focus:bg-white"};

  const reset = () => {
    setForm({title:"",excerpt:"",content:"",category:"Technology",tags:"",status:"published"});
    removeCover(); setStep(1);
  };

  const publish = async () => {
    if (!form.title||!form.content) { toast("Title aur content zaroori hai","error"); return; }
    setLoad(true);
    const fd = new FormData();
    fd.append("title",    form.title);
    fd.append("excerpt",  form.excerpt);
    fd.append("content",  form.content);
    fd.append("category", form.category);
    fd.append("status",   form.status);
    fd.append("tags", JSON.stringify(form.tags.split(",").map(t=>t.trim()).filter(Boolean)));
    if (coverFile) fd.append("coverImage", coverFile);
    const r = await apiFetchFormData(API.createBlog(), fd, "POST");
    setLoad(false);
    if (r.ok) { toast("Story publish ho gayi! 🎉","success"); reset(); }
    else toast(r.data?.message||"Publish fail ho gayi","error");
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold" style={{color:C.txt,fontFamily:"'Playfair Display',serif"}}>Create Story</h1>
        <p className="text-sm mt-1" style={{color:C.sub}}>Apni ideas share karein</p>
      </div>

      {/* Step bar */}
      <div className="flex items-center gap-2">
        {["Details","Content","Preview"].map((l,i)=>{
          const n=i+1,done=step>n,act=step===n;
          return (
            <div key={l} className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white transition-all"
                style={{background:done?"#22c55e":act?"linear-gradient(135deg,#6366f1,#ec4899)":dark?"#1e1e30":"#ddd"}}>
                {done?"✓":n}
              </div>
              <span className="text-xs font-medium hidden sm:block" style={{color:act?C.txt:C.sub}}>{l}</span>
              {i<2 && <div className="w-6 h-px" style={{background:step>n?"#22c55e":dark?"#1e1e30":"#ddd"}}/>}
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border p-6 space-y-5" style={{background:C.bg,borderColor:C.bdr}}>

        {/* ── STEP 1: Details + Cover Image ── */}
        {step===1 && (<>
          <Field label="Title *" dark={dark}>
            <input value={form.title} onChange={set("title")} placeholder="Story ka headline..."
              className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none transition-all ${C.inp}`}/>
          </Field>

          <Field label="Excerpt" dark={dark}>
            <textarea value={form.excerpt} onChange={set("excerpt")} rows={2} placeholder="Ek compelling summary..."
              className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none transition-all resize-none ${C.inp}`}/>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Category" dark={dark}>
              <select value={form.category} onChange={set("category")}
                className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none transition-all ${C.inp}`}
                style={{background:dark?"rgba(255,255,255,.04)":"#f9fafb"}}>
                {CATEGORIES.map(c=><option key={c} style={{background:dark?"#0e0e1a":"white"}}>{c}</option>)}
              </select>
            </Field>
            <Field label="Status" dark={dark}>
              <select value={form.status} onChange={set("status")}
                className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none transition-all ${C.inp}`}
                style={{background:dark?"rgba(255,255,255,.04)":"#f9fafb"}}>
                <option value="published" style={{background:dark?"#0e0e1a":"white"}}>Published</option>
                <option value="draft"     style={{background:dark?"#0e0e1a":"white"}}>Draft</option>
              </select>
            </Field>
          </div>

          <Field label="Tags (comma separated)" dark={dark}>
            <input value={form.tags} onChange={set("tags")} placeholder="AI, Design, Future"
              className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none transition-all ${C.inp}`}/>
          </Field>

          {/* Cover Image Upload */}
          <Field label="Cover Image (optional)" dark={dark}>
            <input ref={coverRef} type="file" accept="image/jpeg,image/png,image/webp"
              onChange={handleCover} className="hidden"/>
            {!coverPrev ? (
              <div onClick={()=>coverRef.current?.click()}
                className="border-2 border-dashed rounded-xl p-6 flex flex-col items-center gap-2 cursor-pointer transition-all"
                style={{borderColor:dark?"#2a2a42":"#d8d8e8"}}
                onMouseEnter={e=>e.currentTarget.style.borderColor="#6366f1"}
                onMouseLeave={e=>e.currentTarget.style.borderColor=dark?"#2a2a42":"#d8d8e8"}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{background:"rgba(99,102,241,.12)"}}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth={1.8} className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                </div>
                <p className="text-sm font-medium" style={{color:dark?"#a5b4fc":"#4338ca"}}>Click karke cover image upload karein</p>
                <p className="text-xs" style={{color:C.sub}}>JPG, PNG, WebP · Max 5MB</p>
              </div>
            ) : (
              <div className="relative rounded-xl overflow-hidden border" style={{borderColor:C.bdr}}>
                <img src={coverPrev} alt="cover preview" className="w-full h-48 object-cover"/>
                <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 hover:opacity-100 transition-opacity"
                  style={{background:"rgba(0,0,0,.6)"}}>
                  <button onClick={()=>coverRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                    style={{background:"rgba(99,102,241,.85)"}}>Change</button>
                  <button onClick={removeCover}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-red-500/80">Remove</button>
                </div>
                <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
                  style={{background:"rgba(0,0,0,.7)",color:"#fbbf24"}}>
                  📎 {coverFile?.name?.length>20 ? coverFile.name.slice(0,20)+"…" : coverFile?.name}
                  <span className="opacity-60">· {(coverFile?.size/1024).toFixed(0)}KB</span>
                </div>
              </div>
            )}
          </Field>

          <Btn onClick={()=>setStep(2)} disabled={!form.title}>Content likhein →</Btn>
        </>)}

        {/* ── STEP 2: Content ── */}
        {step===2 && (<>
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-xs uppercase tracking-wider font-medium" style={{color:C.lbl}}>Content *</span>
              <span className="text-xs" style={{color:C.sub}}>{wc} words · ~{rt} min read</span>
            </div>
            <textarea value={form.content} onChange={set("content")} rows={16}
              placeholder={"Apni story likhein...\n\nDouble line break se paragraphs alag karein."}
              className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none transition-all resize-none leading-7 ${C.inp}`}/>
          </div>
          <div className="flex gap-3">
            <OutBtn onClick={()=>setStep(1)} dark={dark}>← Back</OutBtn>
            <Btn onClick={()=>setStep(3)} disabled={!form.content}>Preview →</Btn>
          </div>
        </>)}

        {/* ── STEP 3: Preview ── */}
        {step===3 && (<>
          <div className="rounded-xl border overflow-hidden" style={{borderColor:C.bdr}}>
            {coverPrev && <img src={coverPrev} alt="cover" className="w-full h-44 object-cover"/>}
            <div className="p-5 space-y-3" style={{background:dark?"rgba(255,255,255,.03)":"#f8f8fc"}}>
              <div className="flex items-center gap-2 flex-wrap">
                {(()=>{const c=CAT[form.category]||CAT.Technology;
                  return <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{background:c.bg,color:c.text}}>{form.category}</span>;
                })()}
                <span className="text-xs" style={{color:C.sub}}>{rt} min read</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${form.status==="published"?"text-green-400":"text-yellow-400"}`}
                  style={{background:form.status==="published"?"rgba(34,197,94,.1)":"rgba(234,179,8,.1)"}}>
                  {form.status}
                </span>
                {!coverPrev && <span className="text-xs" style={{color:C.sub}}>📷 No cover image</span>}
              </div>
              <h3 className="font-bold text-lg" style={{color:C.txt,fontFamily:"'Playfair Display',serif"}}>{form.title}</h3>
              {form.excerpt && <p className="text-sm" style={{color:C.sub}}>{form.excerpt}</p>}
              <div className="text-sm leading-7 max-h-36 overflow-y-auto" style={{color:C.sub}}>
                {form.content.split("\n\n").map((p,i)=><p key={i} className="mb-2">{p}</p>)}
              </div>
              {form.tags && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {form.tags.split(",").filter(t=>t.trim()).map((t,i)=>(
                    <span key={i} className="text-xs px-2 py-0.5 rounded-full"
                      style={{background:dark?"rgba(255,255,255,.06)":"rgba(0,0,0,.05)",color:C.sub}}>
                      #{t.trim()}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <OutBtn onClick={()=>setStep(2)} dark={dark}>← Edit</OutBtn>
            <Btn onClick={publish} loading={load}>
              {load ? <><Spin/> {coverFile?"Uploading & Publishing…":"Publishing…"}</> : "Publish Story ✓"}
            </Btn>
          </div>
        </>)}
      </div>
    </div>
  );
}


// helpers for CreateBlog
function Field({ label, children, dark }) {
  const lbl = dark?"#77778a":"#666677";
  return <div><label className="text-xs uppercase tracking-wider font-medium block mb-1.5" style={{color:lbl}}>{label}</label>{children}</div>;
}
function Btn({ onClick, disabled, loading, children }) {
  return (
    <button onClick={onClick} disabled={disabled||loading}
      className="flex-1 w-full py-3 rounded-xl font-semibold text-white text-sm disabled:opacity-40 transition-all hover:opacity-90 flex items-center justify-center gap-2"
      style={{background:"linear-gradient(135deg,#6366f1,#ec4899)"}}>
      {children}
    </button>
  );
}
function OutBtn({ onClick, dark, children }) {
  return (
    <button onClick={onClick}
      className="py-3 px-5 rounded-xl font-medium text-sm border transition-all"
      style={{borderColor:dark?"#18182a":"#e5e5f0",color:dark?"#888":"#666"}}>
      {children}
    </button>
  );
}

// ════════════════════════════════════════════════════
// ALL BLOGS
// ════════════════════════════════════════════════════
function AllBlogs({ dark, toast, setActive }) {
  const u  = getUser();
  const id = u?.id || u?._id || "";
  const [blogs,setBlogs] = useState([]);
  const [load,setLoad]   = useState(true);
  const [search,setSrch] = useState("");
  const [filt,setFilt]   = useState("All");
  const [delId,setDelId] = useState(null);
  const [dLoad,setDLoad] = useState(false);

  const fetch_ = async () => {
    setLoad(true);
    const r = await apiFetch(id ? API.getMyBlogs(id) : API.getAllBlogs());
    if (r.ok) setBlogs(Array.isArray(r.data) ? r.data : r.data?.blogs || []);
    else toast(r.data?.message||"Blogs load nahi hue","error");
    setLoad(false);
  };
  useEffect(()=>{ fetch_(); },[id]);

  const del_ = async () => {
    setDLoad(true);
    const r = await apiFetch(API.deleteBlog(delId),{method:"DELETE"});
    setDLoad(false);
    if (r.ok) { setBlogs(p=>p.filter(b=>(b._id||b.id)!==delId)); toast("Story delete ho gayi","success"); }
    else toast(r.data?.message||"Delete fail ho gayi","error");
    setDelId(null);
  };

  const C = dark
    ? {bg:"#0e0e1a",bdr:"#18182a",txt:"#e8e8ff",sub:"#55556e",
       inp:"border-[#18182a] bg-white/[.04] text-white placeholder-[#40404e] focus:border-indigo-500/60"}
    : {bg:"#ffffff",bdr:"#ededf5",txt:"#0f0f1a",sub:"#9999b0",
       inp:"border-[#e5e5f0] bg-gray-50 text-gray-900 placeholder-gray-400 focus:border-indigo-400"};

  const shown = blogs.filter(b=>{
    const q=search.toLowerCase();
    return (b.title?.toLowerCase().includes(q)||b.category?.toLowerCase().includes(q)) &&
      (filt==="All"||b.status===filt||b.category===filt);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{color:C.txt,fontFamily:"'Playfair Display',serif"}}>All Stories</h1>
          <p className="text-sm mt-1" style={{color:C.sub}}>{blogs.length} stories</p>
        </div>
        <button onClick={()=>setActive("create")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
          style={{background:"linear-gradient(135deg,#6366f1,#ec4899)"}}>
          + New Story
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" fill="none" stroke={C.sub} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input value={search} onChange={e=>setSrch(e.target.value)} placeholder="Search..."
            className={`w-full border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none transition-all ${C.inp}`}/>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {["All","published","draft",...CATEGORIES.slice(0,3)].map(f=>(
            <button key={f} onClick={()=>setFilt(f)}
              className="px-3 py-2 rounded-xl text-xs font-medium capitalize transition-all"
              style={filt===f?{background:"rgba(99,102,241,.18)",color:"#a5b4fc"}:{color:C.sub}}
              onMouseEnter={e=>{ if(filt!==f) e.currentTarget.style.background=dark?"rgba(255,255,255,.04)":"rgba(0,0,0,.04)"; }}
              onMouseLeave={e=>{ if(filt!==f) e.currentTarget.style.background="transparent"; }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border overflow-hidden" style={{background:C.bg,borderColor:C.bdr}}>
        {/* Header row */}
        <div className="grid px-6 py-3 text-xs font-semibold uppercase tracking-wider"
          style={{gridTemplateColumns:"1fr 110px 70px 70px 90px",color:C.sub,borderBottom:`1px solid ${C.bdr}`}}>
          <div>Title</div>
          <div className="hidden sm:block">Category</div>
          <div className="hidden md:block text-center">Views</div>
          <div className="hidden md:block text-center">Likes</div>
          <div className="text-center">Action</div>
        </div>

        {load ? (
          <div className="p-6 space-y-3">{[1,2,3,4].map(i=><div key={i} className="h-14 rounded-xl animate-pulse" style={{background:dark?"#1e1e30":"#f3f4f6"}}/>)}</div>
        ) : shown.length===0 ? (
          <div className="py-14 text-center" style={{color:C.sub}}><p className="text-3xl mb-2">📭</p><p className="text-xl">No stories found</p></div>
        ) : shown.map((b,i)=>{
          const cc=CAT[b.category]||CAT.Technology, bid=b._id||b.id;
          return (
            <div key={bid||i} className="grid px-6 py-4 items-center transition-all"
              style={{gridTemplateColumns:"1fr 110px 70px 70px 90px",borderBottom:i<shown.length-1?`1px solid ${C.bdr}`:"none"}}
              onMouseEnter={e=>e.currentTarget.style.background=dark?"rgba(255,255,255,.025)":"rgba(0,0,0,.02)"}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <div className="min-w-0 pr-3">
                <p className="text-sm font-medium truncate" style={{color:C.txt}}>{b.title}</p>
                <p className="text-xs mt-0.5" style={{color:C.sub}}>{(b.createdAt||b.date||"").slice(0,10)}</p>
              </div>
              <div className="hidden sm:block"><span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{background:cc.bg,color:cc.text}}>{b.category}</span></div>
              <div className="hidden md:block text-center text-sm font-semibold" style={{color:C.txt}}>{fmt(b.views||0)}</div>
              <div className="hidden md:block text-center text-sm" style={{color:C.sub}}>{fmt(b.likes||0)}</div>
              <div className="flex items-center justify-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${(b.status||"published")==="published"?"text-green-400":"text-yellow-400"}`}
                  style={{background:(b.status||"published")==="published"?"rgba(34,197,94,.1)":"rgba(234,179,8,.1)"}}>
                  {b.status||"pub"}
                </span>
                <button onClick={()=>setDelId(bid)} className="text-red-400 hover:text-red-300 p-1 transition-colors">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete modal */}
      {delId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:"rgba(0,0,0,.75)",backdropFilter:"blur(12px)"}}>
          <div className="rounded-2xl p-6 w-full max-w-sm text-center border" style={{background:dark?"#0e0e1a":"white",borderColor:"rgba(239,68,68,.3)"}}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{background:"rgba(239,68,68,.1)"}}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth={2} className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
            </div>
            <h3 className="font-bold mb-1" style={{color:dark?"white":"#111"}}>Delete karein?</h3>
            <p className="text-sm mb-5" style={{color:dark?"#666":"#999"}}>Yeh permanent hai.</p>
            <div className="flex gap-3">
              <button onClick={()=>setDelId(null)} className="flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all" style={{borderColor:dark?"#18182a":"#e5e5f0",color:dark?"#aaa":"#666"}}>Cancel</button>
              <button onClick={del_} disabled={dLoad} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-all flex items-center justify-center gap-2">
                {dLoad?<Spin/>:"Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════
// PROFILE — PUT /api/vi/user/profile/:id
// Backend: multer + cloudinary, ek hi endpoint mein
// image + text fields dono handle karta hai (multipart/form-data)
// ════════════════════════════════════════════════════
function Profile({ dark, toast }) {
  const u    = getUser();
  const id   = u?.id || u?._id || "";

  // ── Avatar state ──────────────────────────────────
  const [imgSrc,  setImgSrc]  = useState(u?.profileImg || u?.Profile_Img || "");
  const [imgFile, setImgFile] = useState(null);   // selected File object
  const [imgPrev, setImgPrev] = useState("");     // local blob preview URL
  const fileRef = useRef(null);

  // ── Profile form ──────────────────────────────────
  const [form,setForm]     = useState({ Username:u?.Username||u?.name||"", email:u?.email||"", bio:"" });
  const [load,setLoad]     = useState(false);
  const [fetching,setFetch]= useState(true);

  const init = (form.Username||"U").slice(0,2).toUpperCase();

  // GET current profile
  useEffect(()=>{
    if (!id) { setFetch(false); return; }
    apiFetch(API.getProfile(id)).then(r=>{
      if (r.ok) {
        const d = r.data?.user || r.data;
        setForm({ Username:d.Username||d.name||"", email:d.email||"", bio:d.bio||"" });
        const srv = d.profileImg || d.Profile_Img || "";
        if (srv) setImgSrc(srv);
      }
      setFetch(false);
    });
  },[id]);

  const set = k => e => setForm({...form,[k]:e.target.value});

  // ── File pick & local preview ─────────────────────
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast("Sirf image files allowed hain","error"); return; }
    if (file.size > 5*1024*1024)         { toast("Image 5MB se chhoti honi chahiye","error"); return; }
    setImgFile(file);
    if (imgPrev) URL.revokeObjectURL(imgPrev);
    setImgPrev(URL.createObjectURL(file));
  };

  const cancelImg = () => {
    if (imgPrev) URL.revokeObjectURL(imgPrev);
    setImgFile(null); setImgPrev("");
    if (fileRef.current) fileRef.current.value = "";
  };

  useEffect(()=>()=>{ if(imgPrev) URL.revokeObjectURL(imgPrev); },[]);

  // ── Save — single PUT multipart/form-data call ────
  // Backend ka multer memoryStorage + same controller handles it
  const save = async () => {
    if (!id) { toast("User ID nahi mili","error"); return; }
    setLoad(true);

    const fd = new FormData();
    fd.append("Username", form.Username);
    fd.append("email",    form.email);
    fd.append("bio",      form.bio);
    // Agar nai image select ki hai toh attach karo
    // Backend ka multer field name "profileImg" expect karta hai
    if (imgFile) fd.append("profileImg", imgFile);

    const r = await apiFetchFormData(API.updateProfile(id), fd, "PUT");
    setLoad(false);

    if (r.ok) {
      const updUser = r.data?.user || r.data;
      const newImg  = updUser?.profileImg || updUser?.Profile_Img || imgPrev || imgSrc;
      // Update imgSrc with cloudinary URL
      if (newImg && newImg !== imgPrev) setImgSrc(newImg);
      // Clean up local preview
      cancelImg();
      // Sync localStorage
      localStorage.setItem("user", JSON.stringify({
        ...getUser(),
        Username : form.Username,
        email    : form.email,
        bio      : form.bio,
        profileImg : newImg,
        Profile_Img: newImg,
      }));
      toast("Profile save ho gayi ✓","success");
    } else {
      toast(r.data?.message || "Save fail ho gayi","error");
    }
  };

  const C = dark
    ? {bg:"#0e0e1a",bdr:"#18182a",txt:"#e8e8ff",sub:"#55556e",lbl:"#77778a",
       inp:"border-[#18182a] bg-white/[.04] text-white placeholder-[#40404e] focus:border-indigo-500/60"}
    : {bg:"#ffffff",bdr:"#ededf5",txt:"#0f0f1a",sub:"#9999b0",lbl:"#666677",
       inp:"border-[#e5e5f0] bg-gray-50 text-gray-900 placeholder-gray-400 focus:border-indigo-400 focus:bg-white"};

  const displayImg = imgPrev || imgSrc;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold" style={{color:C.txt,fontFamily:"'Playfair Display',serif"}}>Profile</h1>
        <p className="text-sm mt-1 font-bold" style={{color:C.sub}}>Manage And Update Your Profile</p>
      </div>

      <div className="rounded-2xl border p-6 space-y-6" style={{background:C.bg,borderColor:C.bdr}}>

        {/* ── Avatar row ── */}
        <div className="flex items-start gap-5">

          {/* Avatar — click to pick */}
          <div className="relative group flex-shrink-0 cursor-pointer" onClick={()=>fileRef.current?.click()}>
            <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-indigo-500/30">
              {displayImg
                ? <img src={displayImg} alt="avatar" className="w-full h-full object-cover"
                    onError={()=>{ setImgSrc(""); if(imgPrev){URL.revokeObjectURL(imgPrev);setImgPrev("");} }}/>
                : <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-white"
                    style={{background:"linear-gradient(135deg,#6366f1,#ec4899)"}}>{init}</div>
              }
            </div>
            {/* Hover overlay */}
            <div className="absolute inset-0 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              style={{background:"rgba(0,0,0,.55)"}}>
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            </div>
            {/* Pending badge */}
            {imgFile && (
              <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center text-xs text-black font-bold shadow">!</div>
            )}
          </div>

          {/* Info + file controls */}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold" style={{color:C.txt,fontFamily:"'Playfair Display',serif"}}>{form.Username||"User"}</h2>
            <p className="text-sm" style={{color:C.sub}}>{form.email}</p>
        

            {/* File input (hidden) */}
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileChange} className="hidden"/>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {!imgFile ? (
                <button onClick={()=>fileRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all hover:opacity-80"
                  style={{borderColor:dark?"#2a2a42":"#d8d8e8",color:dark?"#a5b4fc":"#4338ca",background:dark?"rgba(99,102,241,.08)":"rgba(99,102,241,.06)"}}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                  </svg>
                 Update Your Profile Image 
                </button>
              ) : (
                <>
                  {/* Selected file chip */}
                  <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg font-medium"
                    style={{background:"rgba(234,179,8,.12)",color:"#fbbf24"}}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3 h-3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/>
                    </svg>
                    {imgFile.name.length>22 ? imgFile.name.slice(0,22)+"…" : imgFile.name}
                    <span className="opacity-60">({(imgFile.size/1024).toFixed(0)}KB)</span>
                  </div>
                  {/* Cancel */}
                  <button onClick={cancelImg}
                    className="px-2 py-1.5 rounded-lg text-xs font-medium border transition-all hover:opacity-80"
                    style={{borderColor:dark?"#18182a":"#e5e5f0",color:dark?"#666":"#999"}}>
                    ✕ Cancel
                  </button>
                </>
              )}
            </div>
            <p className="text-xs mt-1.5" style={{color:C.sub}}>
              {imgFile
                ? <span style={{color:"#fbbf24"}}>⚠ Image Will Update On save Changes</span>
                : "JPG, PNG, WebP · Max 5MB · Click On Avatar"}
            </p>
          </div>
        </div>

        {/* ── API info ── */}
     

        {/* ── Form fields ── */}
        {fetching ? (
          <div className="space-y-4">{[1,2,3].map(i=><div key={i} className="h-12 rounded-xl animate-pulse" style={{background:dark?"#1e1e30":"#f3f4f6"}}/>)}</div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs uppercase tracking-wider font-medium block mb-1.5" style={{color:C.lbl}}>Username</label>
                <input value={form.Username} onChange={set("Username")} className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-all ${C.inp}`}/>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider font-medium block mb-1.5" style={{color:C.lbl}}>Email</label>
                <input value={form.email} onChange={set("email")} type="email" className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-all ${C.inp}`}/>
              </div>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider font-medium block mb-1.5" style={{color:C.lbl}}>Bio</label>
              <textarea value={form.bio} onChange={set("bio")} rows={3} placeholder="Describe your self and your Work"
                className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-all resize-none ${C.inp}`}/>
            </div>

            {/* Save button */}
            <button onClick={save} disabled={load}
              className="w-full py-3 rounded-xl font-semibold text-white text-sm disabled:opacity-60 transition-all hover:opacity-90 flex items-center justify-center gap-2"
              style={{background:"linear-gradient(135deg,#6366f1,#ec4899)"}}>
              {load
                ? <><Spin/> {imgFile ? "Uploading & Saving…" : "Saving…"}</>
                : imgFile
                  ? "Upload & Save Changes ↑"
                  : "Save Changes"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════
// MAIN DASHBOARD
// ════════════════════════════════════════════════════
export default function Dashboard() {
  const navigate = useNavigate();
  const [active, setActive]   = useState("overview");
  const [dark,   setDark]     = useState(true);
  const [col,    setCol]      = useState(false);
  const [toast,  setToast]    = useState(null);

  const showToast = (msg,type="success") => setToast({msg,type});

  useEffect(()=>{
    if (!localStorage.getItem("token")) navigate("/auth");
    const l=document.createElement("link");
    l.href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;800&display=swap";
    l.rel="stylesheet"; document.head.appendChild(l);
  },[]);

  const ml = col?72:240;
  const pages = {
    overview : <Overview dark={dark} setActive={setActive}/>,
    create   : <CreateBlog dark={dark} toast={showToast}/>,
    allblogs : <AllBlogs dark={dark} toast={showToast} setActive={setActive}/>,
    profile  : <Profile dark={dark} toast={showToast}/>,
  };

  const barBg  = dark?"rgba(7,7,15,.92)":"rgba(248,248,252,.92)";
  const barBdr = dark?"#18182a":"#e8e8f0";
  const txt    = dark?"#e8e8ff":"#0f0f1a";
  const sub    = dark?"#44445a":"#9999b0";

  return (
    <div className="min-h-screen transition-colors duration-300" style={{background:dark?"#070710":"#f4f4f8"}}>
      <Sidebar active={active} setActive={setActive} dark={dark} setDark={setDark} col={col} setCol={setCol}/>

      <main className="transition-all duration-300 min-h-screen" style={{marginLeft:ml}}>
        {/* Topbar */}
        <div className="sticky top-0 z-30 px-8 py-4 flex items-center justify-between border-b"
          style={{background:barBg,borderColor:barBdr,backdropFilter:"blur(16px)"}}>
          <div>
            <p className="text-sm font-semibold capitalize" style={{color:txt}}>
              {active==="allblogs"?"All Stories":active==="create"?"Create Story":active}
            </p>
            <p className="text-xs" style={{color:sub}}>
              {new Date().toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}
            </p>
          </div>
          <button onClick={()=>navigate("/")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium border transition-all hover:opacity-80"
            style={{borderColor:barBdr,color:sub}}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
            </svg>
            Blog
          </button>
        </div>

        {/* Page */}
        <div className="px-8 py-8">{pages[active]}</div>
      </main>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)}/>}

      <style>{`
        @keyframes toastIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}
