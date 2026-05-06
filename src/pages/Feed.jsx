import { useState, useEffect, useCallback } from "react";

const T = { teal:"#3DD6C8", sky:"#45B7D1", dark:"#0D0D1A", white:"#FFFFFF", border:"#E8EDF2", text:"#2D3748", muted:"#94A3B8", light:"#F5F7FA", coral:"#FF6B6B" };
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
const KINDER_EMOJIS=["🦋","⚽","🌟","🎸","🦊","🚀","🌈","🎨"];

function Spinner({size=20}){return <div style={{width:size,height:size,borderRadius:"50%",border:`2px solid ${T.border}`,borderTopColor:T.teal,animation:"spin 0.7s linear infinite"}}/>;}

function KindChip({index, name, klasse}){
  const col=KINDER_COLORS[index%KINDER_COLORS.length];
  const emoji=KINDER_EMOJIS[index%KINDER_EMOJIS.length];
  return(
    <span style={{display:"inline-flex",alignItems:"center",gap:4,background:col.bg,color:col.color,border:`1.5px solid ${col.color}40`,borderRadius:20,padding:"2px 8px",fontFamily:"system-ui,sans-serif",fontSize:10,fontWeight:800,whiteSpace:"nowrap"}}>
      {emoji} {name}{klasse?` · Kl.${klasse}`:""}
    </span>
  );
}

function EntryCard({entry, kindIndex, myUserId}){
  const fach = FAECHER[entry.subject] || FAECHER.mathe;
  const [confirmed, setConfirmed] = useState(false);
  const [confirmCount, setConfirmCount] = useState(entry.confirm_count||0);
  const isUrgent = entry.due_date && Math.ceil((new Date(entry.due_date)-new Date())/(1000*60*60*24)) <= 1;
  const dueText = entry.due_date ? (()=>{
    const diff=Math.ceil((new Date(entry.due_date)-new Date())/(1000*60*60*24));
    if(diff===0)return"⚡ Heute!";if(diff===1)return"⏰ Morgen";if(diff<0)return"❗ Überfällig";return`📅 in ${diff} Tagen`;
  })():null;

  return(
    <div style={{background:T.white,borderRadius:20,padding:18,marginBottom:10,boxShadow:"0 2px 14px rgba(0,0,0,0.07)",borderLeft:`4px solid ${KINDER_COLORS[kindIndex%KINDER_COLORS.length].color}`}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10,gap:8,flexWrap:"wrap"}}>
        <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
          {entry.for_child&&<KindChip index={kindIndex} name={entry.for_child}/>}
          <span style={{display:"inline-flex",alignItems:"center",gap:4,background:fach.color+"15",color:fach.color,border:`1.5px solid ${fach.color}30`,borderRadius:20,padding:"3px 10px",fontFamily:"system-ui,sans-serif",fontSize:11,fontWeight:700}}>{fach.emoji} {fach.label}</span>
          {entry.priority==="wichtig"&&<span style={{background:"#FF8C0018",color:"#FF8C00",borderRadius:20,padding:"2px 8px",fontFamily:"system-ui,sans-serif",fontSize:10,fontWeight:700}}>🔴 Wichtig</span>}
          {entry.priority==="klassenarbeit"&&<span style={{background:"#FF6B6B18",color:T.coral,borderRadius:20,padding:"2px 8px",fontFamily:"system-ui,sans-serif",fontSize:10,fontWeight:700}}>📝 Klassenarbeit</span>}
        </div>
        {dueText&&<span style={{fontFamily:"system-ui,sans-serif",fontSize:11,fontWeight:700,flexShrink:0,color:isUrgent?"#FF8C00":T.muted,background:isUrgent?"#FFF8F0":T.light,borderRadius:10,padding:"2px 8px"}}>{dueText}</span>}
      </div>
      <p style={{fontFamily:"system-ui,sans-serif",fontSize:14,color:T.text,margin:"0 0 12px",lineHeight:1.6,fontWeight:600}}>{entry.text}</p>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{fontFamily:"system-ui,sans-serif",fontSize:11,color:T.muted,fontWeight:600}}>{entry.author_name}</span>
        <button onClick={()=>{setConfirmed(!confirmed);setConfirmCount(c=>confirmed?c-1:c+1);}}
          style={{background:confirmed?"#4ECDC420":"#F0F0F0",border:`1.5px solid ${confirmed?"#4ECDC4":"#E0E0E0"}`,borderRadius:20,padding:"4px 10px",cursor:"pointer",fontFamily:"system-ui,sans-serif",fontSize:11,fontWeight:700,color:confirmed?"#4ECDC4":"#888",transition:"all 0.15s"}}>
          ✓ {confirmCount}
        </button>
      </div>
    </div>
  );
}

function AddModal({memberships, myName, onClose, onAdded}){
  const [selKind, setSelKind]   = useState(memberships.length===1?0:null);
  const [subject, setSubject]   = useState("mathe");
  const [text, setText]         = useState("");
  const [dueDate, setDueDate]   = useState("");
  const [priority, setPriority] = useState("normal");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const handleAdd = async () => {
    if(!text.trim()||selKind===null) return;
    setLoading(true); setError("");
    const m = memberships[selKind];
    try {
      const res = await fetch("/api/entries",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
        group_id:m.group.id, subject, text:text.trim(),
        due_date:dueDate||null, priority, author_name:myName,
        for_child:m.member?.children?.[0]?.name||null
      })});
      const data = await res.json();
      if(!res.ok) throw new Error(data.error||"Fehler");
      onAdded({...data, _kindIndex:selKind});
      onClose();
    } catch(e){setError(e.message);setLoading(false);}
  };

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:1000,backdropFilter:"blur(4px)"}} onClick={onClose}>
      <div style={{background:T.white,borderRadius:"24px 24px 0 0",padding:"24px 20px 48px",width:"100%",maxWidth:480,maxHeight:"90vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:20}}>
          <div style={{fontFamily:"Georgia,serif",fontSize:22,fontWeight:700,color:T.text}}>📚 Hausaufgabe eintragen</div>
          <button onClick={onClose} style={{background:"#F0F0F0",border:"none",borderRadius:"50%",width:32,height:32,cursor:"pointer",fontSize:16}}>×</button>
        </div>
        {error&&<div style={{padding:"10px 14px",background:"#FFF0F0",borderRadius:12,fontFamily:"system-ui,sans-serif",fontSize:13,color:T.coral,marginBottom:12}}>{error}</div>}

        {/* Kind wählen */}
        <div style={{marginBottom:16}}>
          <div style={{fontFamily:"system-ui,sans-serif",fontSize:11,fontWeight:700,color:T.muted,marginBottom:8}}>FÜR WELCHES KIND?</div>
          <div style={{display:"flex",gap:8}}>
            {memberships.map((m,i)=>{
              const col=KINDER_COLORS[i%KINDER_COLORS.length];
              const emoji=KINDER_EMOJIS[i%KINDER_EMOJIS.length];
              const name=m.member?.children?.[0]?.name||`Kind ${i+1}`;
              const klasse=`${m.group?.grade||""}${m.group?.section||""}`;
              return(
                <button key={i} onClick={()=>setSelKind(i)} style={{flex:1,padding:"12px 8px",borderRadius:14,border:"none",background:selKind===i?col.color:col.bg,cursor:"pointer",transition:"all 0.15s",boxShadow:selKind===i?`0 3px 10px ${col.color}40`:"none",textAlign:"center"}}>
                  <div style={{fontSize:22,marginBottom:4}}>{emoji}</div>
                  <div style={{fontFamily:"system-ui,sans-serif",fontWeight:800,fontSize:12,color:selKind===i?"#fff":col.color}}>{name}</div>
                  <div style={{fontFamily:"system-ui,sans-serif",fontSize:10,color:selKind===i?"rgba(255,255,255,0.7)":T.muted}}>Kl. {klasse}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Fach */}
        <div style={{marginBottom:14}}>
          <div style={{fontFamily:"system-ui,sans-serif",fontSize:11,fontWeight:700,color:T.muted,marginBottom:8}}>FACH</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {Object.entries(FAECHER).map(([id,f])=>(
              <button key={id} onClick={()=>setSubject(id)} style={{background:subject===id?f.color:f.bg,border:`2px solid ${f.color}`,borderRadius:20,padding:"5px 12px",fontFamily:"system-ui,sans-serif",fontSize:12,fontWeight:700,color:subject===id?"#fff":f.color,cursor:"pointer"}}>{f.emoji} {f.label}</button>
            ))}
          </div>
        </div>

        <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Was müssen die Kinder machen?" style={{width:"100%",minHeight:80,border:`2px solid ${T.border}`,borderRadius:14,padding:"10px 14px",fontFamily:"system-ui,sans-serif",fontSize:14,outline:"none",resize:"vertical",marginBottom:12}}/>

        <div style={{display:"flex",gap:10,marginBottom:20}}>
          <div style={{flex:1}}>
            <div style={{fontFamily:"system-ui,sans-serif",fontSize:11,fontWeight:700,color:T.muted,marginBottom:6}}>ABGABE</div>
            <input type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)} style={{width:"100%",padding:"10px",borderRadius:10,border:`2px solid ${T.border}`,fontFamily:"system-ui,sans-serif",fontSize:13,outline:"none",background:T.white}}/>
          </div>
          <div style={{flex:1}}>
            <div style={{fontFamily:"system-ui,sans-serif",fontSize:11,fontWeight:700,color:T.muted,marginBottom:6}}>PRIORITÄT</div>
            <select value={priority} onChange={e=>setPriority(e.target.value)} style={{width:"100%",padding:"10px",borderRadius:10,border:`2px solid ${T.border}`,fontFamily:"system-ui,sans-serif",fontSize:13,outline:"none",background:T.white}}>
              <option value="normal">Normal</option>
              <option value="wichtig">Wichtig</option>
              <option value="klassenarbeit">Klassenarbeit</option>
            </select>
          </div>
        </div>

        <button onClick={handleAdd} disabled={loading||!text.trim()||selKind===null} style={{width:"100%",padding:"14px",borderRadius:14,border:"none",background:loading||!text.trim()||selKind===null?"#E2E8F0":grad,color:loading||!text.trim()||selKind===null?T.muted:T.dark,fontFamily:"system-ui,sans-serif",fontSize:15,fontWeight:800,cursor:loading||!text.trim()||selKind===null?"not-allowed":"pointer"}}>
          {loading?"Wird eingetragen…":"✓ Eintragen"}
        </button>
      </div>
    </div>
  );
}

export default function Feed({ user, memberships, onLogout, onAddChild }) {
  const [allEntries, setAllEntries] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [activeKind, setActiveKind] = useState(null); // null = alle
  const [activeFach, setActiveFach] = useState(null);
  const [tab, setTab]               = useState("feed");
  const [showAdd, setShowAdd]       = useState(false);

  const myName = user?.firstName || user?.emailAddresses?.[0]?.emailAddress || "Elternteil";

  // Einträge aus ALLEN Gruppen laden
  const loadEntries = useCallback(async () => {
    setLoading(true);
    try {
      const results = await Promise.all(
        memberships.map(async (m, i) => {
          const r = await fetch(`/api/entries?group_id=${m.group.id}`);
          const d = await r.json();
          return (Array.isArray(d)?d:[]).map(e => ({...e, _kindIndex:i}));
        })
      );
      const merged = results.flat().sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
      setAllEntries(merged);
    } catch { setAllEntries([]); }
    finally { setLoading(false); }
  }, [memberships]);

  useEffect(() => { loadEntries(); }, [loadEntries]);

  const filtered = allEntries
    .filter(e => {
      if(activeKind !== null && e._kindIndex !== activeKind) return false;
      if(activeFach && e.subject !== activeFach) return false;
      return true;
    })
    .sort((a,b) => {
      if(a.priority==="wichtig"&&b.priority!=="wichtig") return -1;
      if(b.priority==="wichtig"&&a.priority!=="wichtig") return 1;
      if(a.priority==="klassenarbeit"&&b.priority!=="klassenarbeit") return -1;
      return new Date(b.created_at)-new Date(a.created_at);
    });

  return(
    <div style={{minHeight:"100dvh",background:"#F5F7FA",maxWidth:480,margin:"0 auto",paddingBottom:80}}>

      {/* Header */}
      <div style={{background:grad,padding:"20px 20px 24px",position:"sticky",top:0,zIndex:100,boxShadow:"0 4px 20px rgba(61,214,200,0.25)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <div style={{fontFamily:"Georgia,serif",fontSize:24,color:"#fff",fontWeight:700,letterSpacing:"-0.02em"}}>Klassly</div>
            <div style={{fontFamily:"system-ui,sans-serif",fontSize:12,color:"rgba(255,255,255,0.7)",marginTop:2}}>
              {memberships.length} {memberships.length===1?"Kind":"Kinder"} · {activeKind===null?"Alle":memberships[activeKind]?.member?.children?.[0]?.name}
            </div>
          </div>
          {/* Kind-Filter Buttons */}
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            {memberships.map((m,i)=>{
              const col=KINDER_COLORS[i%KINDER_COLORS.length];
              const emoji=KINDER_EMOJIS[i%KINDER_EMOJIS.length];
              const active=activeKind===i;
              return(
                <button key={i} onClick={()=>setActiveKind(active?null:i)} style={{width:36,height:36,borderRadius:"50%",border:"none",background:active?col.color:"rgba(255,255,255,0.25)",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s",boxShadow:active?`0 2px 10px ${col.color}60`:"none"}}>{emoji}</button>
              );
            })}
            {/* Alle-Button wenn Filter aktiv */}
            {activeKind!==null&&(
              <button onClick={()=>setActiveKind(null)} style={{width:32,height:32,borderRadius:"50%",border:"none",background:"rgba(255,255,255,0.15)",fontSize:12,cursor:"pointer",color:"rgba(255,255,255,0.8)",fontFamily:"system-ui,sans-serif",fontWeight:700}}>All</button>
            )}
          </div>
        </div>
      </div>

      {/* Feed Tab */}
      {tab==="feed"&&(
        <>
          {/* Stats Kacheln */}
          <div style={{display:"grid",gridTemplateColumns:`repeat(${Math.min(memberships.length+1,4)},1fr)`,gap:10,padding:"12px 16px 0"}}>
            {memberships.map((m,i)=>{
              const col=KINDER_COLORS[i%KINDER_COLORS.length];
              const emoji=KINDER_EMOJIS[i%KINDER_EMOJIS.length];
              const name=m.member?.children?.[0]?.name||`Kind ${i+1}`;
              const count=allEntries.filter(e=>e._kindIndex===i).length;
              const urgent=allEntries.filter(e=>e._kindIndex===i&&e.due_date&&Math.ceil((new Date(e.due_date)-new Date())/(1000*60*60*24))<=1).length;
              return(
                <div key={i} style={{background:T.white,borderRadius:16,padding:"12px 10px",textAlign:"center",boxShadow:"0 2px 10px rgba(0,0,0,0.06)",borderTop:`3px solid ${col.color}`,cursor:"pointer"}} onClick={()=>setActiveKind(activeKind===i?null:i)}>
                  <div style={{fontSize:18,marginBottom:2}}>{emoji}</div>
                  <div style={{fontFamily:"system-ui,sans-serif",fontWeight:900,fontSize:20,color:col.color}}>{count}</div>
                  <div style={{fontFamily:"system-ui,sans-serif",fontSize:10,color:T.muted,fontWeight:600}}>{name}</div>
                  {urgent>0&&<div style={{fontFamily:"system-ui,sans-serif",fontSize:9,fontWeight:700,color:"#FF8C00",marginTop:2}}>⚡ {urgent} bald</div>}
                </div>
              );
            })}
            {/* Kind hinzufügen */}
            <div style={{background:T.white,borderRadius:16,padding:"12px 10px",textAlign:"center",boxShadow:"0 2px 10px rgba(0,0,0,0.06)",borderTop:`3px solid ${T.border}`,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}} onClick={onAddChild}>
              <div style={{fontSize:22,marginBottom:2,color:T.muted}}>+</div>
              <div style={{fontFamily:"system-ui,sans-serif",fontSize:10,color:T.muted,fontWeight:600}}>Kind</div>
            </div>
          </div>

          {/* Fach Filter */}
          <div style={{display:"flex",gap:6,overflowX:"auto",padding:"10px 16px 6px"}}>
            <button onClick={()=>setActiveFach(null)} style={{padding:"5px 12px",borderRadius:20,whiteSpace:"nowrap",border:`1.5px solid ${!activeFach?T.teal:T.border}`,background:!activeFach?T.teal:T.white,color:!activeFach?"#fff":T.muted,fontFamily:"system-ui,sans-serif",fontSize:11,fontWeight:700,cursor:"pointer"}}>Alle Fächer</button>
            {Object.entries(FAECHER).map(([id,f])=>(
              <button key={id} onClick={()=>setActiveFach(activeFach===id?null:id)} style={{padding:"5px 10px",borderRadius:20,whiteSpace:"nowrap",border:`1.5px solid ${f.color}`,background:activeFach===id?f.color:f.color+"15",color:activeFach===id?"#fff":f.color,fontFamily:"system-ui,sans-serif",fontSize:11,fontWeight:700,cursor:"pointer"}}>{f.emoji} {f.label}</button>
            ))}
          </div>

          {/* Einträge */}
          <div style={{padding:"0 16px"}}>
            {loading ? (
              <div style={{display:"flex",justifyContent:"center",padding:40}}><Spinner size={32}/></div>
            ) : filtered.length===0 ? (
              <div style={{textAlign:"center",padding:40,fontFamily:"Georgia,serif",fontSize:20,color:T.muted}}>
                {allEntries.length===0?"📭 Noch keine Einträge – sei der Erste!":"📭 Keine Einträge für diese Auswahl"}
              </div>
            ) : filtered.map(e=>(
              <EntryCard key={`${e.id}-${e._kindIndex}`} entry={e} kindIndex={e._kindIndex} myUserId={user?.id}/>
            ))}
          </div>
        </>
      )}

      {/* Einstellungen Tab */}
      {tab==="settings"&&(
        <div style={{padding:"12px 16px 0"}}>
          <div style={{background:T.white,borderRadius:20,padding:20,boxShadow:"0 2px 12px rgba(0,0,0,0.07)",marginBottom:12}}>
            <div style={{fontFamily:"system-ui,sans-serif",fontWeight:800,fontSize:14,color:T.text,marginBottom:12}}>Deine Kinder</div>
            {memberships.map((m,i)=>{
              const col=KINDER_COLORS[i%KINDER_COLORS.length];
              const emoji=KINDER_EMOJIS[i%KINDER_EMOJIS.length];
              const name=m.member?.children?.[0]?.name||`Kind ${i+1}`;
              return(
                <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:i<memberships.length-1?`1px solid ${T.border}`:"none"}}>
                  <span style={{fontSize:20}}>{emoji}</span>
                  <div style={{flex:1}}>
                    <div style={{fontFamily:"system-ui,sans-serif",fontSize:13,fontWeight:700,color:col.color}}>{name}</div>
                    <div style={{fontFamily:"system-ui,sans-serif",fontSize:11,color:T.muted}}>{m.group?.school_name||""} · Kl. {m.group?.grade}{m.group?.section||""}</div>
                  </div>
                </div>
              );
            })}
            <button onClick={onAddChild} style={{width:"100%",padding:"11px",borderRadius:12,border:`2px dashed ${T.border}`,background:"transparent",fontFamily:"system-ui,sans-serif",fontSize:13,fontWeight:700,color:T.muted,cursor:"pointer",marginTop:12}}>+ Weiteres Kind hinzufügen</button>
          </div>
          <div style={{background:T.white,borderRadius:20,padding:20,boxShadow:"0 2px 12px rgba(0,0,0,0.07)"}}>
            <div style={{fontFamily:"system-ui,sans-serif",fontWeight:800,fontSize:14,color:T.text,marginBottom:4}}>Konto</div>
            <div style={{fontFamily:"system-ui,sans-serif",fontSize:13,color:T.muted,marginBottom:20}}>{user?.emailAddresses?.[0]?.emailAddress}</div>
            <button onClick={onLogout} style={{width:"100%",padding:"12px",borderRadius:14,border:`2px solid ${T.coral}`,background:"#FFF0F0",fontFamily:"system-ui,sans-serif",fontWeight:700,fontSize:14,color:T.coral,cursor:"pointer"}}>Abmelden</button>
          </div>
        </div>
      )}

      {/* FAB */}
      {tab==="feed"&&(
        <button onClick={()=>setShowAdd(true)} style={{position:"fixed",bottom:90,right:"calc(50% - 220px)",width:56,height:56,borderRadius:"50%",background:"linear-gradient(135deg,#FF6B6B,#FF4500)",border:"none",color:"#fff",fontSize:28,cursor:"pointer",boxShadow:"0 6px 24px rgba(255,107,107,0.45)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200}}>+</button>
      )}

      {/* Bottom Nav */}
      <nav style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:T.white,borderTop:"1px solid #F0F0F0",display:"flex",boxShadow:"0 -4px 20px rgba(0,0,0,0.08)",zIndex:300}}>
        {[{id:"feed",icon:"📋",label:"Feed"},{id:"settings",icon:"⚙️",label:"Konto"}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:"12px 0 8px",background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2,borderTop:`3px solid ${tab===t.id?T.teal:"transparent"}`,transition:"border-color 0.15s"}}>
            <span style={{fontSize:20}}>{t.icon}</span>
            <span style={{fontFamily:"system-ui,sans-serif",fontSize:10,fontWeight:700,color:tab===t.id?T.teal:"#AAA"}}>{t.label}</span>
          </button>
        ))}
      </nav>

      {showAdd&&<AddModal memberships={memberships} myName={myName} onClose={()=>setShowAdd(false)} onAdded={e=>setAllEntries(p=>[{...e,confirm_count:0},...p])}/>}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
