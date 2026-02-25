import React, { useState, useEffect, useRef, useCallback } from "react";
import * as THREE from "three";
import { useNavigate } from "react-router";

const BASE = "http://localhost:3000/api/vi";
const getToken = () => localStorage.getItem("token") || "";
const getUser  = () => { try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; } };
const isLoggedIn = () => !!localStorage.getItem("token");

async function apiFetch(url, opts = {}) {
  try {
    const res  = await fetch(url, { ...opts, headers: { "Content-Type":"application/json", "Authorization":`Bearer ${getToken()}`, ...(opts.headers||{}) } });
    const data = await res.json();
    return { ok: res.ok, data };
  } catch { return { ok: false, data: {} }; }
}

// Multipart fetch for image upload
async function apiFetchForm(url, formData, method="POST") {
  try {
    const res = await fetch(url, { method, headers: { "Authorization":`Bearer ${getToken()}` }, body: formData });
    const text = await res.text();
    let data = {};
    try { data = JSON.parse(text); } catch { data = { message: "Server error" }; }
    return { ok: res.ok, data };
  } catch { return { ok: false, data: {} }; }
}

const CATEGORIES = ["All","Technology","Design","Science","Culture","Philosophy"];
const CAT_COLOR  = { Technology:"#2563eb", Design:"#7c3aed", Science:"#0891b2", Culture:"#b45309", Philosophy:"#4f46e5" };
const CAT_BG     = { Technology:"#eff6ff", Design:"#f5f3ff", Science:"#ecfeff", Culture:"#fffbeb", Philosophy:"#eef2ff" };

const FALLBACK = [
  { _id:"1", title:"The Architecture of Infinite Scroll", excerpt:"How modern engineers construct experiences that feel boundless — and whether that boundlessness is good for us.", content:"The infinite scroll wasn't invented by accident. It was engineered with precision.\n\nBut what happens when we architect systems without asking what they're for?\n\nTechnology is never neutral. The scroll is proof.", category:"Technology", author:{ Username:"Mira Chen" }, createdAt:"2026-02-12", views:12400, likes:847 },
  { _id:"2", title:"Brutalism as Visual Language", excerpt:"Why the ugliest aesthetic in web design is also its most honest.", content:"Brutalism emerged from an earnest desire to show the truth of materials.\n\nWeb brutalism borrows this philosophy.\n\nDesign, like art, is contextual.", category:"Design", author:{ Username:"Elias Voss" }, createdAt:"2026-02-08", views:8900, likes:623 },
  { _id:"3", title:"Quantum Entanglement & Information Theory", excerpt:"The strange relationship between spooky action at a distance and the fundamental limits of what can be known.", content:"Einstein called it spooky action at a distance.\n\nBut here's what's often misunderstood: this doesn't violate special relativity.\n\nThe universe has rules. They're stranger than we imagined, but they hold.", category:"Science", author:{ Username:"Dr. Yuki Tanaka" }, createdAt:"2026-02-05", views:6100, likes:445 },
  { _id:"4", title:"The Last Vinyl Record Stores", excerpt:"Inside the culture of analog persistence — the people keeping physical music alive in a streaming world.", content:"The record store on Elm Street has stood for 43 years.\n\nThe algorithm gives you what you've already liked. The record store gives you what you didn't know you needed.\n\nResistance to convenience isn't nostalgia. It's a values statement.", category:"Culture", author:{ Username:"Sofia Reyes" }, createdAt:"2026-01-29", views:4800, likes:334 },
  { _id:"5", title:"Dark Mode is a Design Compromise", excerpt:"The ergonomics, aesthetics, and hidden costs of the interface mode that conquered the decade.", content:"Dark mode became a status feature before it became a good idea.\n\nFor people with astigmatism — roughly one in three — light text on dark backgrounds causes blur.\n\nDark mode is contextually better. The difference matters.", category:"Design", author:{ Username:"Mira Chen" }, createdAt:"2026-01-18", views:3200, likes:289 },
  { _id:"6", title:"The Ship of Theseus in Software", excerpt:"When every line of code has been rewritten, is it still the same program?", content:"The Ship of Theseus is one of philosophy's oldest identity puzzles.\n\nSoftware engineers live this problem daily.\n\nIdentity, for ships and for software, is a social construct. That doesn't make it unreal. It makes it more interesting.", category:"Philosophy", author:{ Username:"James Abubakar" }, createdAt:"2026-01-10", views:5600, likes:512 },
];

const fmt = (n=0) => n>=1000 ? (n/1000).toFixed(1)+"k" : String(n);

// ── THREE.JS BACKGROUND ─────────────────────────────────────
function ThreeBG() {
  const mountRef = useRef(null);
  const frameRef = useRef(null);
  useEffect(() => {
    if (!mountRef.current) return;
    const W=window.innerWidth, H=window.innerHeight;
    const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true });
    renderer.setSize(W,H); renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    mountRef.current.appendChild(renderer.domElement);
    const scene=new THREE.Scene(), camera=new THREE.PerspectiveCamera(50,W/H,0.1,200);
    camera.position.z=40;
    const objs=[];
    const colors=[0xd4d0ff,0xffd4e8,0xd4f0ff,0xfff4d4,0xe8d4ff];
    for(let i=0;i<12;i++){
      const geo=new THREE.TorusGeometry(2+Math.random()*4,0.05+Math.random()*0.07,8,60);
      const mat=new THREE.MeshBasicMaterial({color:colors[i%colors.length],transparent:true,opacity:0.15+Math.random()*0.1});
      const mesh=new THREE.Mesh(geo,mat);
      mesh.position.set((Math.random()-.5)*60,(Math.random()-.5)*40,(Math.random()-.5)*20-5);
      mesh.rotation.x=Math.random()*Math.PI; mesh.rotation.y=Math.random()*Math.PI;
      scene.add(mesh);
      objs.push({mesh,rx:(Math.random()-.5)*.004,ry:(Math.random()-.5)*.004,amp:Math.random()*1.5,freq:Math.random()*.5+.2,phase:Math.random()*Math.PI*2,oy:mesh.position.y});
    }
    const cnt=600, pos=new Float32Array(cnt*3);
    for(let i=0;i<cnt;i++){pos[i*3]=(Math.random()-.5)*100;pos[i*3+1]=(Math.random()-.5)*80;pos[i*3+2]=(Math.random()-.5)*40;}
    const dg=new THREE.BufferGeometry(); dg.setAttribute("position",new THREE.BufferAttribute(pos,3));
    scene.add(new THREE.Points(dg,new THREE.PointsMaterial({color:0xc4c0ff,size:.15,transparent:true,opacity:.3})));
    const mouse={x:0,y:0};
    const onMouse=e=>{mouse.x=(e.clientX/W-.5)*2; mouse.y=-(e.clientY/H-.5)*2;};
    window.addEventListener("mousemove",onMouse);
    let t=0;
    const animate=()=>{frameRef.current=requestAnimationFrame(animate);t+=.016;
      objs.forEach(o=>{o.mesh.rotation.x+=o.rx;o.mesh.rotation.y+=o.ry;o.mesh.position.y=o.oy+Math.sin(t*o.freq+o.phase)*o.amp;});
      camera.position.x+=(mouse.x*2-camera.position.x)*.025;
      camera.position.y+=(mouse.y*1.5-camera.position.y)*.025;
      camera.lookAt(scene.position); renderer.render(scene,camera);
    };
    animate();
    const onResize=()=>{const W=window.innerWidth,H=window.innerHeight;camera.aspect=W/H;camera.updateProjectionMatrix();renderer.setSize(W,H);};
    window.addEventListener("resize",onResize);
    return()=>{cancelAnimationFrame(frameRef.current);window.removeEventListener("mousemove",onMouse);window.removeEventListener("resize",onResize);renderer.dispose();if(mountRef.current?.contains(renderer.domElement))mountRef.current.removeChild(renderer.domElement);};
  },[]);
  return <div ref={mountRef} className="fixed inset-0 pointer-events-none" style={{zIndex:0}}/>;
}

function Avatar({src,initials,size="w-8 h-8",text="text-xs"}){
  const[err,setErr]=useState(false);
  if(src&&!err) return <img src={src} alt="" onError={()=>setErr(true)} className={`${size} rounded-full object-cover flex-shrink-0`} style={{border:"2px solid #e5e7eb"}}/>;
  return <div className={`${size} rounded-full flex items-center justify-center ${text} font-bold text-white flex-shrink-0`} style={{background:"linear-gradient(135deg,#2563eb,#7c3aed)"}}>{initials}</div>;
}

// ── COVER IMAGE PLACEHOLDER (when no image) ─────────────────
function CoverPlaceholder({ category, height="h-44" }) {
  const cc = CAT_COLOR[category] || "#2563eb";
  return (
    <div className={`${height} w-full flex items-center justify-center overflow-hidden select-none`}
      style={{background:`linear-gradient(135deg,${cc}18,${cc}30)`}}>
      <span className="font-black text-[80px] leading-none opacity-20"
        style={{fontFamily:"'Playfair Display',serif",color:cc}}>
        {category?.slice(0,1)||"R"}
      </span>
    </div>
  );
}

// ── NAVBAR ──────────────────────────────────────────────────
function Navbar({search,setSearch,onWrite,scrolled,onLoginClick}){
  const[mob,setMob]=useState(false);
  const[drop,setDrop]=useState(false);
  const navigate=useNavigate(), dropRef=useRef(null), li=isLoggedIn(), u=getUser();
  const img=u?.Profile_Img||u?.profileImg||"", name=u?.Username||u?.name||"User", email=u?.email||"", init=name.slice(0,2).toUpperCase();
  useEffect(()=>{const h=e=>{if(dropRef.current&&!dropRef.current.contains(e.target))setDrop(false);};document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);},[]);
  const logout=()=>{localStorage.removeItem("token");localStorage.removeItem("user");window.location.reload();};
  return(
    <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-500" style={{background:scrolled?"rgba(255,255,255,0.97)":"rgba(255,255,255,0.88)",backdropFilter:"blur(24px)",borderBottom:`1px solid ${scrolled?"#e5e7eb":"rgba(229,231,235,0.5)"}`,boxShadow:scrolled?"0 1px 24px rgba(0,0,0,0.07)":"none"}}>
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-5">
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{background:"linear-gradient(135deg,#2563eb,#7c3aed)"}}>
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5"><path d="M4 4h16v2H4V4zm0 4h10v2H4V8zm0 4h16v2H4v-2zm0 4h10v2H4v-2z" fill="white"/></svg>
          </div>
          <span className="font-black text-xl tracking-tight text-gray-900" style={{fontFamily:"'Playfair Display',serif"}}>Readly<span style={{color:"#2563eb"}}>.in</span></span>
        </div>
        <div className="hidden md:flex flex-1 max-w-xs">
          <div className="relative w-full">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search stories..." className="w-full rounded-full pl-10 pr-4 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none transition-all" style={{background:"#f3f4f6",border:"1.5px solid transparent"}} onFocus={e=>e.target.style.borderColor="#2563eb"} onBlur={e=>e.target.style.borderColor="transparent"}/>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-1 text-sm text-gray-500 font-medium">
          {["Technology","Design","Science"].map(c=><button key={c} className="px-3 py-1.5 rounded-lg transition-colors hover:bg-gray-100 hover:text-gray-900">{c}</button>)}
        </div>
        <div className="hidden md:flex items-center gap-3 ml-auto">
          {li?(
            <>
              <button onClick={onWrite} className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white transition-all hover:scale-105 hover:shadow-lg" style={{background:"linear-gradient(135deg,#2563eb,#7c3aed)"}}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>Write
              </button>
              <div className="relative" ref={dropRef}>
                <button onClick={()=>setDrop(p=>!p)} className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full transition-all hover:bg-gray-100" style={{border:"1.5px solid #e5e7eb"}}>
                  <Avatar src={img} initials={init} size="w-8 h-8" text="text-xs"/>
                  <span className="text-sm font-medium text-gray-700 max-w-[80px] truncate">{name}</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={`w-3.5 h-3.5 text-gray-400 transition-transform ${drop?"rotate-180":""}`}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
                </button>
                {drop&&(
                  <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl overflow-hidden z-50" style={{background:"#fff",border:"1px solid #e5e7eb",boxShadow:"0 16px 48px rgba(0,0,0,0.12)",animation:"dropIn .2s ease"}}>
                    <div className="px-4 py-3 border-b border-gray-100"><p className="text-sm font-semibold text-gray-900 truncate">{name}</p><p className="text-xs text-gray-500 truncate">{email}</p></div>
                    <div className="py-1">
                      <button onClick={()=>{setDrop(false);navigate("/dashboard");}} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"><span>⊞</span>Dashboard</button>
                      <div className="mx-4 my-1 border-t border-gray-100"/>
                      <button onClick={()=>{setDrop(false);logout();}} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors text-left"><span>↩</span>Logout</button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ):(
            <button onClick={onLoginClick} className="px-5 py-2 rounded-full text-sm font-semibold text-white transition-all hover:scale-105" style={{background:"linear-gradient(135deg,#2563eb,#7c3aed)"}}>Sign In</button>
          )}
        </div>
        <button className="md:hidden ml-auto text-gray-700" onClick={()=>setMob(p=>!p)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-6 h-6">{mob?<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>:<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>}</svg>
        </button>
      </div>
      {mob&&(
        <div className="md:hidden px-6 pb-5 space-y-3 border-t border-gray-100">
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..." className="w-full bg-gray-100 rounded-full px-4 py-2 text-sm text-gray-700 focus:outline-none mt-4"/>
          {li?(<>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50"><Avatar src={img} initials={init} size="w-9 h-9"/><div><p className="text-sm font-semibold text-gray-900">{name}</p><p className="text-xs text-gray-500">{email}</p></div></div>
            <button onClick={()=>{onWrite();setMob(false);}} className="w-full py-2.5 rounded-full text-sm font-semibold text-white" style={{background:"linear-gradient(135deg,#2563eb,#7c3aed)"}}>Write a Story</button>
            <button onClick={()=>{navigate("/dashboard");setMob(false);}} className="w-full py-2.5 rounded-full text-sm font-medium text-gray-700 border border-gray-200">Dashboard</button>
            <button onClick={logout} className="w-full py-2.5 rounded-full text-sm text-red-500 border border-red-100">Logout</button>
          </>):(<button onClick={()=>{onLoginClick();setMob(false);}} className="w-full py-2.5 rounded-full text-sm font-semibold text-white" style={{background:"linear-gradient(135deg,#2563eb,#7c3aed)"}}>Sign In</button>)}
        </div>
      )}
    </nav>
  );
}

// ── HERO ────────────────────────────────────────────────────
function Hero({onExplore}){
  const[vis,setVis]=useState(false);
  useEffect(()=>{setTimeout(()=>setVis(true),80);},[]);
  return(
    <section className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden" style={{zIndex:10}}>
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none select-none">
        <span className="font-black leading-none tracking-tighter" style={{fontFamily:"'Playfair Display',serif",fontSize:"22vw",color:"rgba(37,99,235,0.06)"}}>READ</span>
      </div>
      <div className={`max-w-4xl mx-auto text-center relative transition-all duration-1000 ${vis?"opacity-100 translate-y-0":"opacity-0 translate-y-10"}`}>
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold text-blue-600 mb-8 border border-blue-200" style={{background:"#eff6ff"}}>
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"/> THOUGHTFUL WRITING, EVERY DAY
        </div>
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-gray-900 mb-6 leading-none tracking-tighter" style={{fontFamily:"'Playfair Display',serif"}}>
          Where Ideas<br/>
          <span style={{background:"linear-gradient(135deg,#2563eb,#7c3aed)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Find Voice</span>
        </h1>
        <p className="text-gray-500 text-lg md:text-xl max-w-xl mx-auto mb-12 leading-relaxed font-light">Essays on technology, design, science & culture — written by thinkers, for the curious.</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button onClick={onExplore} className="px-8 py-4 rounded-full font-bold text-white text-base transition-all hover:scale-105 hover:shadow-xl" style={{background:"linear-gradient(135deg,#2563eb,#7c3aed)",boxShadow:"0 8px 32px rgba(37,99,235,0.3)"}}>Explore Stories →</button>
          <button className="px-8 py-4 rounded-full font-semibold text-gray-700 text-base border-2 border-gray-200 transition-all hover:border-blue-300 hover:text-blue-600">Browse Topics</button>
        </div>
        <div className="flex justify-center gap-16 mt-20">
          {[["4.2k","Stories"],["820","Authors"],["1.2M","Readers"]].map(([n,l])=>(
            <div key={l} className="text-center">
              <div className="text-2xl font-black text-gray-900" style={{fontFamily:"'Playfair Display',serif"}}>{n}</div>
              <div className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-medium">{l}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <div className="text-xs text-gray-400 uppercase tracking-widest font-medium">Scroll</div>
        <div className="w-px h-8 bg-gradient-to-b from-gray-400 to-transparent"/>
      </div>
    </section>
  );
}

function CategoryFilter({active,setActive}){
  return(
    <div className="flex gap-2 flex-wrap">
      {CATEGORIES.map(cat=>(
        <button key={cat} onClick={()=>setActive(cat)} className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${active===cat?"text-white shadow-lg scale-105":"text-gray-600 hover:text-gray-900 bg-white border border-gray-200 hover:border-gray-300"}`} style={active===cat?{background:"linear-gradient(135deg,#2563eb,#7c3aed)"}:{}}>{cat}</button>
      ))}
    </div>
  );
}

// ── POST CARD — with cover image ────────────────────────────
function PostCard({post,index,onClick,onLike,liked}){
  const[vis,setVis]=useState(false); const ref=useRef(null);
  useEffect(()=>{const obs=new IntersectionObserver(([e])=>{if(e.isIntersecting){setTimeout(()=>setVis(true),index*60);obs.disconnect();}},{threshold:.1});if(ref.current)obs.observe(ref.current);return()=>obs.disconnect();},[index]);
  const cc=CAT_COLOR[post.category]||"#2563eb",cb=CAT_BG[post.category]||"#eff6ff";
  const aName=post.author?.Username||post.author?.name||"Author", aInit=aName.slice(0,2).toUpperCase(), aImg=post.author?.Profile_Img||"";
  const dStr=post.createdAt?new Date(post.createdAt).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}):post.date||"";
  const rt=post.readTime||Math.max(1,Math.ceil((post.content||"").split(" ").length/200))+" min";
  const hasCover = !!post.coverImage;

  return(
    <div ref={ref} onClick={()=>onClick(post)} className={`group cursor-pointer transition-all duration-700 ${vis?"opacity-100 translate-y-0":"opacity-0 translate-y-6"}`}>
      <article className="rounded-2xl overflow-hidden border border-gray-100 bg-white transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col" style={{boxShadow:"0 2px 12px rgba(0,0,0,0.06)"}}>

        {/* Cover image or colored top bar */}
        {hasCover ? (
          <div className="relative h-44 overflow-hidden">
            <img src={post.coverImage} alt={post.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"/>
            {/* Category badge on image */}
            <div className="absolute top-3 left-3">
              <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{background:cb,color:cc}}>{post.category}</span>
            </div>
          </div>
        ) : (
          <div className="h-1.5 w-full" style={{background:`linear-gradient(90deg,${cc},${cc}88)`}}/>
        )}

        <div className="p-6 flex flex-col flex-1">
          {/* Category badge (only show if no cover image, since it's on the image otherwise) */}
          {!hasCover && (
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{background:cb,color:cc}}>{post.category}</span>
              <span className="text-xs text-gray-400 font-medium">{rt} read</span>
            </div>
          )}
          {hasCover && (
            <div className="flex justify-end mb-3">
              <span className="text-xs text-gray-400 font-medium">{rt} read</span>
            </div>
          )}

          <h3 className="font-black text-gray-900 text-lg leading-snug mb-3 group-hover:text-blue-600 transition-colors flex-1" style={{fontFamily:"'Playfair Display',serif"}}>{post.title}</h3>
          <p className="text-gray-500 text-sm leading-relaxed mb-5 line-clamp-2">{post.excerpt}</p>

          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <Avatar src={aImg} initials={aInit} size="w-7 h-7" text="text-xs"/>
              <div><p className="text-xs font-semibold text-gray-800">{aName}</p><p className="text-xs text-gray-400">{dStr}</p></div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={e=>{e.stopPropagation();onLike(post._id||post.id);}} className={`flex items-center gap-1 text-xs font-medium transition-all hover:scale-110 ${liked?"text-red-500":"text-gray-400 hover:text-red-400"}`}>
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill={liked?"currentColor":"none"} stroke="currentColor" strokeWidth={2}><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
                {fmt((post.likes||0)+(liked?1:0))}
              </button>
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                {fmt(post.commentCount||post.comments||0)}
              </span>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}

// ── FEATURED BANNER — with cover image ──────────────────────
function FeaturedBanner({post,onClick}){
  const cc=CAT_COLOR[post.category]||"#2563eb";
  const aName=post.author?.Username||post.author?.name||"Author", aInit=aName.slice(0,2).toUpperCase(), aImg=post.author?.Profile_Img||"";
  const dStr=post.createdAt?new Date(post.createdAt).toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"}):post.date||"";
  const rt=post.readTime||Math.max(1,Math.ceil((post.content||"").split(" ").length/200))+" min";
  const hasCover = !!post.coverImage;

  return(
    <div onClick={()=>onClick(post)} className="cursor-pointer group">
      <article className="rounded-3xl overflow-hidden border border-gray-200 bg-white transition-all duration-500 hover:shadow-2xl hover:-translate-y-1" style={{boxShadow:"0 4px 32px rgba(0,0,0,0.08)"}}>
        <div className="grid md:grid-cols-2">

          {/* Left — cover image OR gradient placeholder */}
          <div className="relative min-h-[280px] overflow-hidden">
            {hasCover ? (
              <>
                <img src={post.coverImage} alt={post.title}
                  className="w-full h-full object-cover absolute inset-0 transition-transform duration-700 group-hover:scale-105"/>
                {/* Overlay gradient */}
                <div className="absolute inset-0" style={{background:`linear-gradient(135deg,${cc}44,transparent)`}}/>
                {/* Badge */}
                <div className="absolute bottom-4 left-4">
                  <span className="text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full text-white" style={{background:cc}}>
                    Editor's Pick · {post.category}
                  </span>
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center" style={{background:`linear-gradient(135deg,${cc}15,${cc}30)`}}>
                <div className="absolute inset-0 flex items-center justify-center overflow-hidden select-none pointer-events-none">
                  <span className="font-black text-[160px] leading-none" style={{fontFamily:"'Playfair Display',serif",color:`${cc}18`}}>{post.category?.slice(0,1)}</span>
                </div>
                <div className="relative z-10 text-center p-8">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg" style={{background:`linear-gradient(135deg,${cc},${cc}bb)`}}>
                    <span className="text-white font-black text-2xl" style={{fontFamily:"'Playfair Display',serif"}}>{post.category?.slice(0,1)}</span>
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full text-white" style={{background:cc}}>Editor's Pick · {post.category}</span>
                </div>
              </div>
            )}
          </div>

          {/* Right — content */}
          <div className="p-8 md:p-10 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs font-bold uppercase tracking-widest" style={{color:cc}}>Featured Story</span>
                <span className="text-gray-300">·</span>
                <span className="text-xs text-gray-400 font-medium">{rt} read</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight mb-4 group-hover:text-blue-600 transition-colors" style={{fontFamily:"'Playfair Display',serif"}}>{post.title}</h2>
              <p className="text-gray-500 leading-relaxed mb-6">{post.excerpt}</p>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar src={aImg} initials={aInit} size="w-10 h-10" text="text-sm"/>
                <div><p className="text-sm font-bold text-gray-900">{aName}</p><p className="text-xs text-gray-400">{dStr}</p></div>
              </div>
              <div className="flex items-center gap-2 text-sm font-bold group-hover:gap-3 transition-all" style={{color:cc}}>
                Read Story
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}

// ── POST MODAL — with cover image ────────────────────────────
function PostModal({post,onClose,liked,onLike,onCommentAdded}){
  const[vis,setVis]=useState(false);
  const[comments,setComments]=useState([]);
  const[cText,setCText]=useState("");
  const[cLoad,setCLoad]=useState(false);
  const[fetching,setFetching]=useState(true);
  const navigate=useNavigate();
  const cc=CAT_COLOR[post.category]||"#2563eb", cb=CAT_BG[post.category]||"#eff6ff";
  const aName=post.author?.Username||post.author?.name||"Author", aInit=aName.slice(0,2).toUpperCase(), aImg=post.author?.Profile_Img||"";
  const dStr=post.createdAt?new Date(post.createdAt).toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"}):"";
  const rt=Math.max(1,Math.ceil((post.content||"").split(" ").length/200));
  const blogId=post._id||post.id;
  const isRealId=blogId&&blogId.length>10;

  useEffect(()=>{
    setTimeout(()=>setVis(true),10);
    document.body.style.overflow="hidden";
    if(isRealId){
      apiFetch(`${BASE}/user/blog/${blogId}/comments`).then(r=>{
        if(r.ok)setComments(Array.isArray(r.data)?r.data:r.data?.comments||[]);
        setFetching(false);
      });
    } else setFetching(false);
    return()=>{document.body.style.overflow="";};
  },[]);

  const handleLike=async()=>{
    if(!isLoggedIn()){onClose();navigate("/auth");return;}
    if(isRealId) await apiFetch(`${BASE}/user/blog/${blogId}/like`,{method:"PUT"});
    onLike(blogId);
  };

  const handleComment=async()=>{
    if(!isLoggedIn()){onClose();navigate("/auth");return;}
    if(!cText.trim())return;
    setCLoad(true);
    const u=getUser();
    if(isRealId){
      const r=await apiFetch(`${BASE}/user/blog/${blogId}/comment`,{method:"POST",body:JSON.stringify({text:cText})});
      if(r.ok){setComments(r.data?.comments||[...comments,{text:cText,user:{Username:u?.Username||"You"},createdAt:new Date()}]);onCommentAdded&&onCommentAdded();}
    } else {
      setComments(p=>[...p,{text:cText,user:{Username:u?.Username||"You"},createdAt:new Date(),_id:Date.now()}]);
    }
    setCText("");setCLoad(false);
  };

  return(
    <div className={`fixed inset-0 z-50 flex items-start justify-center p-4 md:p-8 transition-all duration-300 ${vis?"opacity-100":"opacity-0"}`} style={{background:"rgba(0,0,0,0.35)",backdropFilter:"blur(16px)",overflowY:"auto"}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div className={`w-full max-w-3xl rounded-3xl overflow-hidden bg-white transition-all duration-500 ${vis?"translate-y-0 scale-100":"translate-y-8 scale-95"}`} style={{marginTop:"80px",marginBottom:"40px",boxShadow:"0 32px 80px rgba(0,0,0,0.18)",border:"1px solid #e5e7eb"}}>

        {/* Cover image or gradient bar */}
        {post.coverImage ? (
          <div className="relative h-56 md:h-72 overflow-hidden">
            <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover"/>
            <div className="absolute inset-0" style={{background:"linear-gradient(to bottom,transparent 40%,rgba(0,0,0,0.5))"}}/>
            {/* Category + close on top of image */}
            <div className="absolute top-4 left-6 right-6 flex items-center justify-between">
              <span className="text-xs font-bold px-3 py-1 rounded-full" style={{background:cb,color:cc}}>{post.category}</span>
              <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all" style={{background:"rgba(0,0,0,0.3)"}}>✕</button>
            </div>
          </div>
        ) : (
          <div className="h-2" style={{background:`linear-gradient(90deg,${cc},${cc}66)`}}/>
        )}

        <div className="px-8 md:px-12 pt-8 pb-6">
          {/* If no cover image show category + close here */}
          {!post.coverImage && (
            <div className="flex items-center justify-between mb-5">
              <span className="text-xs font-bold px-3 py-1 rounded-full" style={{background:cb,color:cc}}>{post.category}</span>
              <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all">✕</button>
            </div>
          )}
          {/* If cover image, show close button was already on image, just add spacing */}
          {post.coverImage && (
            <div className="flex justify-end mb-3">
              <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all">✕</button>
            </div>
          )}

          <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-5 leading-tight" style={{fontFamily:"'Playfair Display',serif"}}>{post.title}</h1>
          <div className="flex items-center gap-4 pb-6 border-b border-gray-100">
            <Avatar src={aImg} initials={aInit} size="w-11 h-11" text="text-sm"/>
            <div className="flex-1"><p className="font-bold text-gray-900 text-sm">{aName}</p><p className="text-gray-400 text-xs">{dStr} · {rt} min read · {fmt(post.views||0)} views</p></div>
          </div>
        </div>

        <div className="px-8 md:px-12 pb-8 space-y-5">
          {(post.content||"").split("\n\n").map((p,i)=><p key={i} className="text-gray-700 leading-8 text-base" style={{fontFamily:"Georgia,serif"}}>{p}</p>)}
        </div>

        <div className="px-8 md:px-12 py-6 border-t border-gray-100 flex items-center gap-4">
          <button onClick={handleLike} className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 border-2 ${liked?"border-red-200 text-red-500 bg-red-50":"border-gray-200 text-gray-600 hover:border-red-200 hover:text-red-500"}`}>
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill={liked?"currentColor":"none"} stroke="currentColor" strokeWidth={2}><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
            {fmt((post.likes||0)+(liked?1:0))} {liked?"Liked":"Like"}
          </button>
          <span className="flex items-center gap-1.5 text-sm text-gray-500 font-medium">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
            {comments.length} comments
          </span>
        </div>

        {/* Comments */}
        <div className="px-8 md:px-12 py-8 border-t border-gray-100" style={{background:"#fafaf8"}}>
          <h3 className="font-black text-gray-900 mb-6" style={{fontFamily:"'Playfair Display',serif"}}>Comments ({comments.length})</h3>
          {isLoggedIn()?(
            <div className="flex gap-3 mb-8">
              <Avatar src={getUser()?.Profile_Img||""} initials={(getUser()?.Username||"U").slice(0,2).toUpperCase()} size="w-9 h-9" text="text-xs"/>
              <div className="flex-1">
                <textarea value={cText} onChange={e=>setCText(e.target.value)} rows={2} placeholder="Apna thoughts share karein..." className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none resize-none bg-white transition-all" onFocus={e=>e.target.style.borderColor=cc} onBlur={e=>e.target.style.borderColor="#e5e7eb"}/>
                <div className="flex justify-end mt-2">
                  <button onClick={handleComment} disabled={!cText.trim()||cLoad} className="px-5 py-2 rounded-full text-sm font-bold text-white disabled:opacity-50 transition-all hover:scale-105" style={{background:`linear-gradient(135deg,${cc},${cc}bb)`}}>{cLoad?"Posting...":"Post Comment"}</button>
                </div>
              </div>
            </div>
          ):(
            <div className="mb-6 p-4 rounded-2xl border border-gray-200 bg-white text-center">
              <p className="text-sm text-gray-500 mb-3">Comment karne ke liye login karein</p>
              <button onClick={()=>{onClose();navigate("/auth");}} className="px-5 py-2 rounded-full text-sm font-bold text-white" style={{background:"linear-gradient(135deg,#2563eb,#7c3aed)"}}>Sign In</button>
            </div>
          )}
          {fetching?(
            <div className="space-y-3">{[1,2].map(i=><div key={i} className="h-16 rounded-xl animate-pulse bg-gray-200"/>)}</div>
          ):comments.length===0?(
            <div className="text-center py-8 text-gray-400"><p className="text-3xl mb-2">💬</p><p className="text-sm">Add Comment</p></div>
          ):(
            <div className="space-y-4">
              {comments.map((c,i)=>{
                const cN=c.user?.Username||c.user?.name||"User", cI=cN.slice(0,2).toUpperCase(), cImg=c.user?.Profile_Img||"";
                const cD=c.createdAt?new Date(c.createdAt).toLocaleDateString("en-US",{month:"short",day:"numeric"}):"";
                return(
                  <div key={c._id||i} className="flex gap-3">
                    <Avatar src={cImg} initials={cI} size="w-8 h-8" text="text-xs"/>
                    <div className="flex-1 bg-white rounded-2xl px-4 py-3 border border-gray-100">
                      <div className="flex items-center justify-between mb-1"><p className="text-xs font-bold text-gray-900">{cN}</p><p className="text-xs text-gray-400">{cD}</p></div>
                      <p className="text-sm text-gray-600 leading-relaxed">{c.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LoginPopup({onClose,onLogin}){
  const[vis,setVis]=useState(false);
  useEffect(()=>{setTimeout(()=>setVis(true),10);},[]);
  return(
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${vis?"opacity-100":"opacity-0"}`} style={{background:"rgba(0,0,0,0.3)",backdropFilter:"blur(16px)"}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div className={`w-full max-w-sm rounded-3xl p-8 text-center bg-white transition-all duration-500 ${vis?"translate-y-0 scale-100":"translate-y-8 scale-95"}`} style={{boxShadow:"0 32px 80px rgba(0,0,0,0.18)",border:"1px solid #e5e7eb"}}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{background:"linear-gradient(135deg,#eff6ff,#f5f3ff)"}}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth={1.5} className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"/></svg>
        </div>
        <h3 className="text-xl font-black text-gray-900 mb-2" style={{fontFamily:"'Playfair Display',serif"}}>Login Required</h3>
        <p className="text-gray-500 text-sm leading-relaxed mb-7">Yeh story padhne ke liye pehle sign in karein.</p>
        <div className="flex flex-col gap-3">
          <button onClick={onLogin} className="w-full py-3 rounded-xl font-bold text-white text-sm transition-all hover:scale-[1.02] hover:shadow-lg" style={{background:"linear-gradient(135deg,#2563eb,#7c3aed)"}}>Sign In / Register</button>
          <button onClick={onClose} className="w-full py-3 rounded-xl text-sm text-gray-500 border border-gray-200 hover:text-gray-700 transition-all">Baad mein dekhunga</button>
        </div>
      </div>
    </div>
  );
}

// ── WRITE MODAL — with cover image upload ───────────────────
function WriteModal({onClose,onSubmit}){
  const[vis,setVis]=useState(false);
  const[step,setStep]=useState(1);
  const[load,setLoad]=useState(false);
  const[form,setForm]=useState({title:"",excerpt:"",content:"",category:"Technology",tags:"",status:"published"});
  const set=k=>e=>setForm({...form,[k]:e.target.value});

  // Cover image
  const[coverFile,setCoverFile]=useState(null);
  const[coverPrev,setCoverPrev]=useState("");
  const coverRef=useRef(null);

  const handleCover=(e)=>{
    const file=e.target.files?.[0];
    if(!file)return;
    if(!file.type.startsWith("image/")){alert(" image files allowed ");return;}
    if(file.size>5*1024*1024){alert("image less than 5mb");return;}
    setCoverFile(file);
    if(coverPrev)URL.revokeObjectURL(coverPrev);
    setCoverPrev(URL.createObjectURL(file));
  };
  const removeCover=()=>{if(coverPrev)URL.revokeObjectURL(coverPrev);setCoverFile(null);setCoverPrev("");if(coverRef.current)coverRef.current.value="";};
  useEffect(()=>()=>{if(coverPrev)URL.revokeObjectURL(coverPrev);},[]);

  useEffect(()=>{setTimeout(()=>setVis(true),10);document.body.style.overflow="hidden";return()=>{document.body.style.overflow="";};},[]);

  const cls="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none transition-all bg-white";

  const submit=async()=>{
    if(!form.title||!form.content)return;
    setLoad(true);
    const fd=new FormData();
    fd.append("title",form.title);
    fd.append("excerpt",form.excerpt);
    fd.append("content",form.content);
    fd.append("category",form.category);
    fd.append("status",form.status);
    fd.append("tags",JSON.stringify(form.tags.split(",").map(t=>t.trim()).filter(Boolean)));
    if(coverFile)fd.append("coverImage",coverFile);
    const r=await apiFetchForm(`${BASE}/user/blog/create`,fd,"POST");
    setLoad(false);
    if(r.ok){
      onSubmit(r.data?.blog||{...form,coverImage:coverPrev,_id:Date.now(),author:{Username:getUser()?.Username||"You"},createdAt:new Date()});
      onClose();
    }
  };

  return(
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${vis?"opacity-100":"opacity-0"}`} style={{background:"rgba(0,0,0,0.3)",backdropFilter:"blur(16px)",overflowY:"auto"}}>
      <div className={`w-full max-w-2xl rounded-3xl bg-white transition-all duration-500 ${vis?"translate-y-0 scale-100":"translate-y-8 scale-95"}`} style={{boxShadow:"0 32px 80px rgba(0,0,0,0.18)",border:"1px solid #e5e7eb",margin:"20px auto"}}>
        <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100">
          <div><h2 className="font-black text-gray-900 text-xl" style={{fontFamily:"'Playfair Display',serif"}}>Write a Story</h2><p className="text-gray-400 text-xs mt-0.5">Share your ideas with the world</p></div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all">✕</button>
        </div>

        {/* Progress bar */}
        <div className="flex gap-1.5 px-7 py-4">
          {[1,2].map(s=><div key={s} className="h-1.5 flex-1 rounded-full transition-all duration-500" style={{background:step>=s?"linear-gradient(90deg,#2563eb,#7c3aed)":"#f3f4f6"}}/>)}
        </div>

        <div className="px-7 pb-7 space-y-4">
          {step===1?(<>
            {/* Title */}
            <div><label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Title *</label>
              <input value={form.title} onChange={set("title")} placeholder="A compelling headline..." className={cls} onFocus={e=>e.target.style.borderColor="#2563eb"} onBlur={e=>e.target.style.borderColor="#e5e7eb"}/></div>

            {/* Excerpt */}
            <div><label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Excerpt</label>
              <textarea value={form.excerpt} onChange={set("excerpt")} rows={2} placeholder="Short summary..." className={`${cls} resize-none`} onFocus={e=>e.target.style.borderColor="#2563eb"} onBlur={e=>e.target.style.borderColor="#e5e7eb"}/></div>

            {/* Category + Status */}
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Category</label>
                <select value={form.category} onChange={set("category")} className={cls} onFocus={e=>e.target.style.borderColor="#2563eb"} onBlur={e=>e.target.style.borderColor="#e5e7eb"}>
                  {CATEGORIES.filter(c=>c!=="All").map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <div><label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Tags</label>
                <input value={form.tags} onChange={set("tags")} placeholder="AI, Design, Future" className={cls} onFocus={e=>e.target.style.borderColor="#2563eb"} onBlur={e=>e.target.style.borderColor="#e5e7eb"}/></div>
            </div>

            {/* Cover image upload */}
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Cover Image <span className="text-gray-400 normal-case font-normal">(optional)</span></label>
              <input ref={coverRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleCover} className="hidden"/>
              {!coverPrev?(
                <div onClick={()=>coverRef.current?.click()}
                  className="border-2 border-dashed rounded-xl p-5 flex items-center gap-4 cursor-pointer transition-all"
                  style={{borderColor:"#e5e7eb"}}
                  onMouseEnter={e=>e.currentTarget.style.borderColor="#2563eb"}
                  onMouseLeave={e=>e.currentTarget.style.borderColor="#e5e7eb"}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:"#eff6ff"}}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth={1.8} className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-blue-600">Click to upload cover image</p>
                    <p className="text-xs text-gray-400 mt-0.5">JPG, PNG, WebP · Max 5MB</p>
                  </div>
                </div>
              ):(
                <div className="relative rounded-xl overflow-hidden border border-gray-200">
                  <img src={coverPrev} alt="cover" className="w-full h-36 object-cover"/>
                  <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 hover:opacity-100 transition-opacity" style={{background:"rgba(0,0,0,0.55)"}}>
                    <button onClick={()=>coverRef.current?.click()} className="px-3 py-1.5 rounded-lg text-xs font-bold text-white" style={{background:"rgba(37,99,235,0.85)"}}>Change</button>
                    <button onClick={removeCover} className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-red-500/80">Remove</button>
                  </div>
                  <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg text-xs font-medium" style={{background:"rgba(0,0,0,0.65)",color:"#fbbf24"}}>
                    📎 {coverFile?.name?.length>22?coverFile.name.slice(0,22)+"…":coverFile?.name} · {(coverFile?.size/1024).toFixed(0)}KB
                  </div>
                </div>
              )}
            </div>

            <button onClick={()=>setStep(2)} disabled={!form.title} className="w-full py-3 rounded-xl font-bold text-white text-sm disabled:opacity-40 transition-all hover:scale-[1.01]" style={{background:"linear-gradient(135deg,#2563eb,#7c3aed)"}}>Next: Write Content →</button>
          </>):(<>
            <div>
              <div className="flex justify-between mb-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Content *</label>
                <span className="text-xs text-gray-400">{form.content.trim().split(/\s+/).filter(Boolean).length} words</span>
              </div>
              <textarea value={form.content} onChange={set("content")} rows={12} placeholder={"Apni story yahan likhein...\n\nDouble line break se paragraphs alag karein."} className={`${cls} resize-none leading-7`} onFocus={e=>e.target.style.borderColor="#2563eb"} onBlur={e=>e.target.style.borderColor="#e5e7eb"}/>
            </div>
            <div className="flex gap-3">
              <button onClick={()=>setStep(1)} className="py-3 px-6 rounded-xl font-semibold text-sm text-gray-600 border border-gray-200 hover:border-gray-300 transition-all">← Back</button>
              <button onClick={submit} disabled={!form.content||load} className="flex-1 py-3 rounded-xl font-bold text-white text-sm disabled:opacity-40 transition-all hover:scale-[1.01] flex items-center justify-center gap-2" style={{background:"linear-gradient(135deg,#2563eb,#7c3aed)"}}>
                {load ? (coverFile?"Uploading & Publishing...":"Publishing...") : "Publish Story ✓"}
              </button>
            </div>
          </>)}
        </div>
      </div>
    </div>
  );
}

function Newsletter(){
  const[email,setEmail]=useState(""),[ done,setDone]=useState(false);
  return(
    <section className="py-24 px-6" style={{zIndex:10,position:"relative"}}>
      <div className="max-w-3xl mx-auto rounded-3xl p-12 text-center border border-blue-100" style={{background:"linear-gradient(135deg,#eff6ff,#f5f3ff)"}}>
        <div className="text-blue-600 text-xs font-bold uppercase tracking-widest mb-3">Stay Curious</div>
        <h2 className="text-3xl font-black text-gray-900 mb-3" style={{fontFamily:"'Playfair Display',serif"}}>Stories in Your Inbox</h2>
        <p className="text-gray-500 mb-8 max-w-md mx-auto text-sm leading-relaxed">The best essays, once a week. No noise, no ads. Just ideas worth thinking about.</p>
        {done?<div className="text-blue-600 font-bold">✓ You're subscribed!</div>:(
          <div className="flex gap-3 max-w-sm mx-auto">
            <input type="email" placeholder="your@email.com" value={email} onChange={e=>setEmail(e.target.value)} className="flex-1 bg-white border border-blue-200 rounded-full px-5 py-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-all"/>
            <button onClick={()=>{if(email)setDone(true);}} className="px-6 py-3 rounded-full font-bold text-white text-sm transition-all hover:scale-105" style={{background:"linear-gradient(135deg,#2563eb,#7c3aed)"}}>Subscribe</button>
          </div>
        )}
      </div>
    </section>
  );
}

function Footer(){
  return(
    <footer className="border-t border-gray-200 py-12 px-6 bg-white" style={{zIndex:10,position:"relative"}}>
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{background:"linear-gradient(135deg,#2563eb,#7c3aed)"}}>
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4"><path d="M4 4h16v2H4V4zm0 4h10v2H4V8zm0 4h16v2H4v-2zm0 4h10v2H4v-2z" fill="white"/></svg>
          </div>
          <span className="font-black tracking-tight text-gray-900" style={{fontFamily:"'Playfair Display',serif"}}>Readly<span style={{color:"#2563eb"}}>.in</span></span>
        </div>
        <div className="flex gap-8 text-sm text-gray-400">{["About","Write","Topics","Privacy","Terms"].map(l=><button key={l} className="hover:text-gray-700 transition-colors font-medium">{l}</button>)}</div>
        <div className="text-gray-400 text-xs">© 2026 Readly.in</div>
      </div>
    </footer>
  );
}

// ── MAIN APP ─────────────────────────────────────────────────
export default function BlogApp(){
  const navigate=useNavigate();
  const[posts,setPosts]=useState([]);
  const[loading,setLoading]=useState(true);
  const[activeCat,setActiveCat]=useState("All");
  const[search,setSearch]=useState("");
  const[selPost,setSelPost]=useState(null);
  const[writeOpen,setWriteOpen]=useState(false);
  const[liked,setLiked]=useState(new Set());
  const[scrolled,setScrolled]=useState(false);
  const[toast,setToast]=useState(null);
  const[loginPopup,setLoginPopup]=useState(false);
  const postsRef=useRef(null);

  useEffect(()=>{
    apiFetch(`${BASE}/user/blog/all`).then(r=>{
      if(r.ok){const d=Array.isArray(r.data)?r.data:r.data?.blogs||[];setPosts(d.length>0?d:FALLBACK);}
      else setPosts(FALLBACK);
      setLoading(false);
    });
  },[]);

  useEffect(()=>{
    const link=document.createElement("link");
    link.href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;800;900&display=swap";
    link.rel="stylesheet"; document.head.appendChild(link);
  },[]);

  useEffect(()=>{const h=()=>setScrolled(window.scrollY>60);window.addEventListener("scroll",h);return()=>window.removeEventListener("scroll",h);},[]);

  const showToast=msg=>{setToast(msg);setTimeout(()=>setToast(null),3500);};
  const handlePostClick=post=>{if(!isLoggedIn()){setLoginPopup(true);return;}setSelPost(post);if((post._id||post.id)?.length>10)apiFetch(`${BASE}/user/blog/${post._id||post.id}`);};
  const handleWriteClick=()=>{if(!isLoggedIn()){setLoginPopup(true);return;}setWriteOpen(true);};
  const handleLike=useCallback(id=>{setLiked(p=>{const n=new Set(p);if(n.has(id)){n.delete(id);}else{n.add(id);showToast("Added to liked stories ❤️");}return n;});},[]);
  const handleSubmitPost=nb=>{setPosts(p=>[nb,...p]);showToast("Story published! 🎉");};

  const filtered=posts.filter(p=>{
    const q=search.toLowerCase();
    return(activeCat==="All"||p.category===activeCat)&&(!search||p.title?.toLowerCase().includes(q)||p.excerpt?.toLowerCase().includes(q)||(p.author?.Username||"").toLowerCase().includes(q));
  });
  const featured=filtered[0], gridPosts=filtered.slice(1);

  return(
    <div className="min-h-screen" style={{background:"#fafaf8",position:"relative"}}>
      <ThreeBG/>
      <Navbar search={search} setSearch={setSearch} onWrite={handleWriteClick} scrolled={scrolled} onLoginClick={()=>navigate("/auth")}/>
      <Hero onExplore={()=>postsRef.current?.scrollIntoView({behavior:"smooth"})}/>

      <div className="relative" style={{zIndex:10}}>
        <div ref={postsRef} className="max-w-7xl mx-auto px-6 py-20">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">Latest Stories</p>
              <h2 className="text-4xl font-black text-gray-900 tracking-tight" style={{fontFamily:"'Playfair Display',serif"}}>All Stories</h2>
            </div>
            <CategoryFilter active={activeCat} setActive={setActiveCat}/>
          </div>

          {loading?(
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3,4,5,6].map(i=>(
                <div key={i} className="rounded-2xl bg-white border border-gray-100 overflow-hidden" style={{boxShadow:"0 2px 12px rgba(0,0,0,0.06)"}}>
                  <div className="h-44 bg-gray-100 animate-pulse"/>
                  <div className="p-6 space-y-3"><div className="h-4 bg-gray-100 rounded-full animate-pulse w-1/3"/><div className="h-6 bg-gray-100 rounded-lg animate-pulse"/><div className="h-4 bg-gray-100 rounded-lg animate-pulse w-3/4"/></div>
                </div>
              ))}
            </div>
          ):filtered.length===0?(
            <div className="text-center py-24"><div className="text-6xl mb-4 text-gray-300">◯</div><p className="text-gray-500 font-semibold">No stories found</p></div>
          ):(
            <>
              {featured&&<div className="mb-10"><FeaturedBanner post={featured} onClick={handlePostClick}/></div>}
              {gridPosts.length>0&&(
                <>
                  <div className="flex items-center gap-4 mb-7">
                    <div className="w-1 h-5 rounded-full" style={{background:"linear-gradient(180deg,#2563eb,#7c3aed)"}}/>
                    <span className="text-sm font-bold text-gray-900">More Stories</span>
                    <div className="flex-1 h-px bg-gray-200"/>
                    <span className="text-xs text-gray-400 font-medium">{gridPosts.length} stories</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {gridPosts.map((post,i)=><PostCard key={post._id||post.id||i} post={post} index={i} onClick={handlePostClick} onLike={handleLike} liked={liked.has(post._id||post.id)}/>)}
                  </div>
                </>
              )}
            </>
          )}
        </div>
        <Newsletter/>
        <Footer/>
      </div>

      {selPost&&<PostModal post={selPost} onClose={()=>setSelPost(null)} liked={liked.has(selPost._id||selPost.id)} onLike={handleLike} onCommentAdded={()=>showToast("Comment post ho gaya!")}/>}
      {writeOpen&&<WriteModal onClose={()=>setWriteOpen(false)} onSubmit={handleSubmitPost}/>}
      {loginPopup&&<LoginPopup onClose={()=>setLoginPopup(false)} onLogin={()=>{setLoginPopup(false);navigate("/auth");}}/>}
      {toast&&(
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full text-white text-sm font-semibold z-50 flex items-center gap-2" style={{background:"linear-gradient(135deg,#2563eb,#7c3aed)",boxShadow:"0 8px 32px rgba(37,99,235,0.4)",animation:"slideUp .3s ease",whiteSpace:"nowrap"}}>
          ✓ {toast}
          <button onClick={()=>setToast(null)} className="ml-2 opacity-60 hover:opacity-100">✕</button>
        </div>
      )}
      <style>{`
        @keyframes slideUp{from{opacity:0;transform:translate(-50%,20px)}to{opacity:1;transform:translate(-50%,0)}}
        @keyframes dropIn{from{opacity:0;transform:translateY(-8px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
        .line-clamp-2{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
        *{scrollbar-width:thin;scrollbar-color:rgba(37,99,235,0.2) transparent}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:rgba(37,99,235,0.15);border-radius:3px}
      `}</style>
    </div>
  );
}