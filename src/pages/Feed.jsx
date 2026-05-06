import { useState, useEffect, useCallback } from "react";

const T = { teal:"#3DD6C8", sky:"#45B7D1", dark:"#1A1A2E", white:"#FFFFFF", border:"#E8EDF2", text:"#2D3748", muted:"#94A3B8", light:"#F5F7FA", coral:"#FF6B6B" };
const grad = `linear-gradient(135deg,${T.teal},${T.sky})`;

const FAECHER = {
  mathe:     {label:"Mathe",    emoji:"📐",color:"#FF6B6B",bg:"#FFF0F0"},
  deutsch:   {label:"Deutsch",  emoji:"📝",color:"#4ECDC4",bg:"#F0FFFE"},
  englisch:  {label:"Englisch", emoji:"🌍",color:"#45B7D1",bg:"#F0F8FF"},
  sachkunde: {label:"Sachkunde",emoji:"🔬",color:"#96CEB4",bg:"#F0FFF4"},
  sport:     {label:"Sport",    emoji:"⚽",color:"#DDA0DD",bg:"#FFF0FF"},
  kunst:     {label:"Kunst",    emoji:"🎨",color:"#FFB347",bg:"#FFF8F0"},
  musik:     {label:"Musik",    emoji:"🎵",color:"#F7C948",bg:"#FFFDF0"},
};

const KINDER_COLORS=[{color:"#FF6B6B",bg:"#FFF0F0"},{color:"#45B7D1",bg:"#F0F8FF"},{color:"#4ECDC4",bg:"#F0FFFE"},{color:"#DDA0DD",bg:"#FFF0FF"}];
const KINDER_EMOJIS=["🦋","⚽","🌟","🎸"];

function Spinner({size=20}){return <div style={{width:size,height:size,borderRadius:"50%",border:`2px solid ${T.border}`,borderTopColor:T.teal,animation:"spin 0.7s linear infinite"}}/>;}

function EntryCard({entry,kinder,myUserId,myName}){
  const kindIdx=kinder.findIndex(k=>k.name===entry.for_child);
  const kindCol=kindIdx>=0?KINDER_COLORS[kindIdx%KINDER_COLORS.length]:null;
  const kindEmoji=kindIdx>=0?KINDER_EMOJIS[kindIdx%KINDER_EMOJIS.length]:null;
  const fach=FAECHER[entry.subject]||FAECHER.mathe;
  const [confirmed,setConfirmed]=useState(false);
  const [confirmCount,setConfirmCount]=useState(entry.confirm_count||0);

  const dueText=entry.due_date?(()=>{
    const d=new Date(entry.due_date);const today=new Date();today.setHours(0,0,0,0);
    const diff=Math.ceil((d-today)/(1000*60*60*24));
    if(diff===0)return"⚡ Heute!";if(diff===1)return"⏰ Morgen";if(diff<0)return"❗ Überfällig";return`📅 in ${diff} Tagen`;
  })():null;

  const isUrgent=dueText&&["Heute","Morgen","Überfällig"].some(x=>dueText.includes(x));

  return(
    <div style={{background:T.white,borderRadius:20,padding:18,marginBottom:12,boxShadow:"0 2px 16px rgba(0,0,0,0.07)",borderLeft:`4px solid ${kindCol?.color||fach.color}`}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10,gap:8,flexWrap:"wrap"}}>
        <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
          {kindCol&&<span style={{display:"inline-flex",alignItems:"center",gap:4,background:kindCol.bg,color:kindCol.color,border:`1.5px solid ${kindCol.color}40`,borderRadius:20,padding:"2px 8px",fontFamily:"Nunito,sans-serif",fontSize:10,fontWeight:800,whiteSpace:"nowrap"}}>{kindEmoji} {entry.for_child}</span>}
          <span style={{display:"inline-flex",alignItems:"center",gap:4,background:fach.color+"15",color:fach.color,border:`1.5px solid ${fach.color}30`,borderRadius:20,padding:"3px 10px",fontFamily:"Nunito,sans-serif",fontSize:11,fontWeight:700}}>{fach.emoji} {fach.label}</span>
          {entry.priority==="wichtig"&&<span style={{background:"#FF8C0018",color:"#FF8C00",borderRadius:20,padding:"2px 8px",fontFamily:"Nunito,sans-serif",fontSize:10,fontWeight:700}}>🔴 Wichtig</span>}
          {entry.priority==="klassenarbeit"&&<span style={{background:"#FF6B6B18",color:T.coral,borderRadius:20,padding:"2px 8px",fontFamily:"Nunito,sans-serif",fontSize:10,fontWeight:700}}>📝 Klassenarbeit</span>}
        </div>
        {dueText&&<span style={{fontFamily:"Nunito,sans-serif",fontSize:11,fontWeight:700,flexShrink:0,color:isUrgent?"#FF8C00":T.muted,background:isUrgent?"#FFF8F0":T.light,borderRadius:10,padding:"2px 8px"}}>{dueText}</span>}
      </div>
      <p style={{fontFamily:"Nunito,sans-serif",fontSize:14,color:T.text,margin:"0 0 12px",lineHeight:1.6,fontWeight:600}}>{entry.text}</p>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{fontFamily:"Nunito,sans-serif",fontSize:11,color:T.muted,fontWeight:600}}>{entry.author_name}</span>
        <button onClick={()=>{setConfirmed(!confirmed);setConfirmCount(c=>confirmed?c-1:c+1);}} style={{background:confirmed?"#4ECDC420":"#F0F0F0",border:`1.5px solid ${confirmed?"#4ECDC4":"#E0E0E0"}`,borderRadius:20,padding:"4px 10px",cursor:"pointer",fontFamily:"Nunito,sans-serif",fontSize:11,fontWeight:700,color:confirmed?"#4ECDC4":"#888",transition:"all 0.15s"}}>
          ✓ {confirmCount}
        </button>
      </div>
    </div>
  );
}

function AddModal({group,kinder,myName,onClose,onAdded}){
  const [selKind,setSelKind]=useState(kinder.length===1?0:null);
  const [subject,setSubject]=useState("mathe");
  const [text,setText]=useState("");
  const [dueDate,setDueDate]=useState("");
  const [priority,setPriority]=useState("normal");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");

  const handleAdd=async()=>{
    if(!text.trim())return;
    setLoading(true);setError("");
    try{
      const res=await fetch("/api/entries",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({group_id:group.id,subject,text:text.trim(),due_date:dueDate||null,priority,author_name:myName,for_child:selKind!==null?kinder[selKind]?.name:null})});
      const data=await res.json();
      if(!res.ok)throw new Error(data.error||"Fehler");
      onAdded(data);onClose();
    }catch(e){setError(e.message);setLoading(false);}
  };

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:1000,backdropFilter:"blur(4px)"}} onClick={onClose}>
      <div style={{background:T.white,borderRadius:"24px 24px 0 0",padding:"24px 20px 48px",width:"100%",maxWidth:480,maxHeight:"90vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:20}}>
          <div style={{fontFamily:"Georgia,serif",fontSize:22,fontWeight:700,color:T.text}}>📚 Hausaufgabe eintragen</div>
          <button onClick={onClose} style={{background:"#F0F0F0",border:"none",borderRadius:"50%",width:32,height:32,cursor:"pointer",fontSize:16}}>×</button>
        </div>
        {error&&<div style={{padding:"10px 14px",background:"#FFF0F0",borderRadius:12,fontFamily:"Nunito,sans-serif",fontSize:13,color:T.coral,marginBottom:12}}>{error}</div>}
        {kinder.length>1&&(
          <div style={{marginBottom:16}}>
            <div style={{fontFamily:"Nunito,sans-serif",fontSize:11,fontWeight:700,color:T.muted,marginBottom:8}}>FÜR WELCHES KIND?</div>
            <div style={{display:"flex",gap:8}}>
              {kinder.map((k,i)=>{const col=KINDER_COLORS[i%KINDER_COLORS.length];const emoji=KINDER_EMOJIS[i%KINDER_EMOJIS.length];return(
                <button key={i} onClick={()=>setSelKind(selKind===i?null:i)} style={{flex:1,padding:"10px 6px",borderRadius:14,border:"none",background:selKind===i?col.color:col.bg,cursor:"pointer",transition:"all 0.15s",boxShadow:selKind===i?`0 3px 10px ${col.color}40`:"none"}}>
                  <div style={{fontSize:20,marginBottom:4}}>{emoji}</div>
                  <div style={{fontFamily:"Nunito,sans-serif",fontWeight:800,fontSize:12,color:selKind===i?"#fff":col.color}}>{k.name}</div>
                </button>
              );})}
            </div>
          </div>
        )}
        <div style={{marginBottom:14}}>
          <div style={{fontFamily:"Nunito,sans-serif",fontSize:11,fontWeight:700,color:T.muted,marginBottom:8}}>FACH</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {Object.entries(FAECHER).map(([id,f])=>(
              <button key={id} onClick={()=>setSubject(id)} style={{background:subject===id?f.color:f.bg,border:`2px solid ${f.color}`,borderRadius:20,padding:"5px 12px",fontFamily:"Nunito,sans-serif",fontSize:12,fontWeight:700,color:subject===id?"#fff":f.color,cursor:"pointer"}}>{f.emoji} {f.label}</button>
            ))}
          </div>
        </div>
        <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Was müssen die Kinder machen?" style={{width:"100%",minHeight:80,border:`2px solid ${T.border}`,borderRadius:14,padding:"10px 14px",fontFamily:"Nunito,sans-serif",fontSize:14,outline:"none",resize:"vertical",marginBottom:12}}/>
        <div style={{display:"flex",gap:10,marginBottom:20}}>
          <div style={{flex:1}}>
            <div style={{fontFamily:"Nunito,sans-serif",fontSize:11,fontWeight:700,color:T.muted,marginBottom:6}}>ABGABE</div>
            <input type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)} style={{width:"100%",padding:"10px",borderRadius:10,border:`2px solid ${T.border}`,fontFamily:"Nunito,sans-serif",fontSize:13,outline:"none",background:T.white}}/>
          </div>
          <div style={{flex:1}}>
            <div style={{fontFamily:"Nunito,sans-serif",fontSize:11,fontWeight:700,color:T.muted,marginBottom:6}}>PRIORITÄT</div>
            <select value={priority} onChange={e=>setPriority(e.target.value)} style={{width:"100%",padding:"10px",borderRadius:10,border:`2px solid ${T.border}`,fontFamily:"Nunito,sans-serif",fontSize:13,outline:"none",background:T.white}}>
              <option value="normal">Normal</option>
              <option value="wichtig">Wichtig</option>
              <option value="klassenarbeit">Klassenarbeit</option>
            </select>
          </div>
        </div>
        <button onClick={handleAdd} disabled={loading||!text.trim()} style={{width:"100%",padding:"14px",borderRadius:14,border:"none",background:loading||!text.trim()?"#E2E8F0":grad,color:loading||!text.trim()?T.muted:T.dark,fontFamily:"Nunito,sans-serif",fontSize:15,fontWeight:800,cursor:loading||!text.trim()?"not-allowed":"pointer"}}>
          {loading?"Wird eingetragen…":"✓ Eintragen"}
        </button>
      </div>
    </div>
  );
}

export default function Feed({user,membership,onLogout}){
  const {group,member}=membership;
  const [entries,setEntries]=useState([]);
  const [loading,setLoading]=useState(true);
  const [tab,setTab]=useState("feed");
  const [activeFach,setActiveFach]=useState(null);
  const [activeKind,setActiveKind]=useState(null);
  const [showAdd,setShowAdd]=useState(false);

  const kinder=member?.children||[];
  const myName=member?.display_name||user?.name||"Elternteil";

  const loadEntries=useCallback(async()=>{
    if(!group)return;setLoading(true);
    try{const r=await fetch(`/api/entries?group_id=${group.id}`);const d=await r.json();setEntries(Array.isArray(d)?d:[]);}
    catch{setEntries([]);}
    finally{setLoading(false);}
  },[group?.id]);

  useEffect(()=>{loadEntries();},[loadEntries]);

  const filtered=entries.filter(e=>{
    if(activeKind!==null&&e.for_child!==kinder[activeKind]?.name)return false;
    if(activeFach&&e.subject!==activeFach)return false;
    return true;
  }).sort((a,b)=>{
    if(a.priority==="wichtig"&&b.priority!=="wichtig")return -1;
    if(b.priority==="wichtig"&&a.priority!=="wichtig")return 1;
    return new Date(b.created_at)-new Date(a.created_at);
  });

  return(
    <div style={{minHeight:"100dvh",background:"#F5F7FA",maxWidth:480,margin:"0 auto",paddingBottom:80}}>
      {/* Header */}
      <div style={{background:grad,padding:"20px 20px 24px",position:"sticky",top:0,zIndex:100,boxShadow:"0 4px 20px rgba(61,214,200,0.25)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <div style={{fontFamily:"Georgia,serif",fontSize:24,color:"#fff",fontWeight:700,letterSpacing:"-0.02em"}}>Klassly</div>
            <div style={{fontFamily:"Nunito,sans-serif",fontSize:12,color:"rgba(255,255,255,0.8)",marginTop:2}}>{group?.school_name||""} · Kl. {group?.grade}{group?.section||""}</div>
          </div>
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            {kinder.map((k,i)=>{const col=KINDER_COLORS[i%KINDER_COLORS.length];const emoji=KINDER_EMOJIS[i%KINDER_EMOJIS.length];const active=activeKind===i;return(
              <button key={i} onClick={()=>setActiveKind(active?null:i)} style={{width:36,height:36,borderRadius:"50%",border:"none",background:active?col.color:"rgba(255,255,255,0.25)",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s",boxShadow:active?`0 2px 10px ${col.color}60`:"none"}}>{emoji}</button>
            );})}
          </div>
        </div>
      </div>

      {/* Feed Tab */}
      {tab==="feed"&&(
        <>
          <div style={{display:"flex",gap:6,overflowX:"auto",padding:"12px 16px 8px"}}>
            <button onClick={()=>setActiveFach(null)} style={{padding:"5px 12px",borderRadius:20,whiteSpace:"nowrap",border:`1.5px solid ${!activeFach?T.teal:T.border}`,background:!activeFach?T.teal:T.white,color:!activeFach?"#fff":T.muted,fontFamily:"Nunito,sans-serif",fontSize:11,fontWeight:700,cursor:"pointer"}}>Alle</button>
            {Object.entries(FAECHER).map(([id,f])=>(
              <button key={id} onClick={()=>setActiveFach(activeFach===id?null:id)} style={{padding:"5px 10px",borderRadius:20,whiteSpace:"nowrap",border:`1.5px solid ${f.color}`,background:activeFach===id?f.color:f.color+"15",color:activeFach===id?"#fff":f.color,fontFamily:"Nunito,sans-serif",fontSize:11,fontWeight:700,cursor:"pointer"}}>{f.emoji} {f.label}</button>
            ))}
          </div>
          <div style={{padding:"0 16px"}}>
            {loading?<div style={{display:"flex",justifyContent:"center",padding:40}}><Spinner size={32}/></div>:
            filtered.length===0?<div style={{textAlign:"center",padding:40,fontFamily:"Georgia,serif",fontSize:20,color:T.muted}}>{entries.length===0?"📭 Noch keine Einträge – sei der Erste!":"📭 Keine Einträge"}</div>:
            filtered.map(e=><EntryCard key={e.id} entry={e} kinder={kinder} myUserId={user?.id} myName={myName}/>)}
          </div>
        </>
      )}

      {/* Einstellungen */}
      {tab==="settings"&&(
        <div style={{padding:"12px 16px 0"}}>
          <div style={{background:T.white,borderRadius:20,padding:20,boxShadow:"0 2px 12px rgba(0,0,0,0.07)"}}>
            <div style={{fontFamily:"Nunito,sans-serif",fontWeight:800,fontSize:14,color:T.text,marginBottom:4}}>Eingeloggt als</div>
            <div style={{fontFamily:"Nunito,sans-serif",fontSize:14,color:T.muted,marginBottom:2}}>{myName}</div>
            <div style={{fontFamily:"Nunito,sans-serif",fontSize:12,color:T.muted,marginBottom:20}}>{user?.email}</div>
            <div style={{fontFamily:"Nunito,sans-serif",fontWeight:800,fontSize:13,color:T.text,marginBottom:8}}>Kinder</div>
            {kinder.map((k,i)=>{const col=KINDER_COLORS[i%KINDER_COLORS.length];const emoji=KINDER_EMOJIS[i%KINDER_EMOJIS.length];return(
              <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 0",borderBottom:i<kinder.length-1?`1px solid ${T.border}`:"none"}}>
                <span style={{fontSize:18}}>{emoji}</span>
                <span style={{fontFamily:"Nunito,sans-serif",fontSize:13,fontWeight:700,color:col.color}}>{k.name}</span>
              </div>
            );})}
            <div style={{marginTop:20}}>
              <button onClick={onLogout} style={{width:"100%",padding:"12px",borderRadius:14,border:`2px solid ${T.coral}`,background:"#FFF0F0",fontFamily:"Nunito,sans-serif",fontWeight:700,fontSize:14,color:T.coral,cursor:"pointer"}}>Abmelden</button>
            </div>
          </div>
        </div>
      )}

      {/* FAB */}
      {tab==="feed"&&(
        <button onClick={()=>setShowAdd(true)} style={{position:"fixed",bottom:90,right:"calc(50% - 220px)",width:56,height:56,borderRadius:"50%",background:"linear-gradient(135deg,#FF6B6B,#FF4500)",border:"none",color:"#fff",fontSize:28,cursor:"pointer",boxShadow:"0 6px 24px rgba(255,107,107,0.45)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200}}>+</button>
      )}

      {/* Nav */}
      <nav style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:T.white,borderTop:"1px solid #F0F0F0",display:"flex",boxShadow:"0 -4px 20px rgba(0,0,0,0.08)",zIndex:300}}>
        {[{id:"feed",icon:"📋",label:"Feed"},{id:"settings",icon:"⚙️",label:"Konto"}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:"12px 0 8px",background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2,borderTop:`3px solid ${tab===t.id?T.teal:"transparent"}`,transition:"border-color 0.15s"}}>
            <span style={{fontSize:20}}>{t.icon}</span>
            <span style={{fontFamily:"Nunito,sans-serif",fontSize:10,fontWeight:700,color:tab===t.id?T.teal:"#AAA"}}>{t.label}</span>
          </button>
        ))}
      </nav>

      {showAdd&&<AddModal group={group} kinder={kinder} myName={myName} onClose={()=>setShowAdd(false)} onAdded={e=>setEntries(p=>[{...e,confirm_count:0},...p])}/>}
    </div>
  );
}
