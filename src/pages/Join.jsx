import { useState, useRef } from "react";

const T = { teal:"#3DD6C8", sky:"#45B7D1", dark:"#0D0D1A", white:"#FFFFFF", border:"#E8EDF2", text:"#2D3748", muted:"#94A3B8", light:"#F5F7FA", coral:"#FF6B6B" };
const grad = `linear-gradient(135deg,${T.teal},${T.sky})`;
const SCHULART_EMOJI = {"Grundschule":"🏫","Gesamtschule":"🏛️","Gymnasium":"📐","Realschule":"📚","Hauptschule":"🎒"};
const KINDER_COLORS = [{color:"#FF6B6B",bg:"#FFF0F0"},{color:"#45B7D1",bg:"#F0F8FF"},{color:"#4ECDC4",bg:"#F0FFFE"},{color:"#DDA0DD",bg:"#FFF0FF"}];
const KINDER_EMOJIS = ["🦋","⚽","🌟","🎸","🦊","🚀","🌈","🎨"];

function Btn({children,onClick,disabled}){
  return <button onClick={onClick} disabled={disabled} style={{width:"100%",padding:"14px",borderRadius:14,border:"none",background:disabled?"#E2E8F0":grad,color:disabled?T.muted:T.dark,fontFamily:"system-ui,sans-serif",fontSize:15,fontWeight:800,cursor:disabled?"not-allowed":"pointer",boxShadow:disabled?"none":"0 5px 18px rgba(61,214,200,0.3)",transition:"all 0.18s"}}>{children}</button>;
}

export default function Join({ user, memberships, onJoined }) {
  const [step, setStep]           = useState(0);
  const [childName, setChildName] = useState("");
  const [school, setSchool]       = useState(null);
  const [grade, setGrade]         = useState(null);
  const [section, setSection]     = useState("");
  const [query, setQuery]         = useState("");
  const [results, setResults]     = useState([]);
  const [loading, setLoading]     = useState(false);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");
  const timer = useRef(null);

  const isFirstChild = memberships.length === 0;
  const existingNames = memberships.map(m => m.member?.children?.[0]?.name).filter(Boolean);

  const searchSchools = async (q) => {
    setQuery(q);
    clearTimeout(timer.current);
    if (q.length < 2) { setResults([]); return; }
    setLoading(true);
    timer.current = setTimeout(async () => {
      try {
        const r = await fetch(`/api/schools?q=${encodeURIComponent(q)}&limit=6`);
        const d = await r.json();
        setResults(Array.isArray(d) ? d : []);
      } catch { setResults([]); }
      setLoading(false);
    }, 350);
  };

  const handleJoin = async () => {
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/groups/join", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          user_id: user?.id,
          school_id: school?.id,
          grade, section: section || null,
          display_name: user?.firstName ? `${user.firstName}` : "Elternteil",
          children: [{ name: childName.trim() }]
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Fehler");
      onJoined(data);
      window.location.href = "/";
    } catch(e) {
      setError(e.message);
      setSaving(false);
    }
  };

  const klassen = [1,2,3,4,5,6,7,8];

  return (
    <div style={{minHeight:"100dvh",background:T.light,display:"flex",justifyContent:"center"}}>
      <div style={{width:"100%",maxWidth:420,padding:"24px 20px 48px"}}>

        {/* Header */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:28}}>
          {step > 0 ? (
            <button onClick={()=>setStep(s=>s-1)} style={{background:"none",border:"none",cursor:"pointer",fontFamily:"system-ui,sans-serif",fontSize:13,fontWeight:700,color:T.muted,padding:0}}>← Zurück</button>
          ) : <div/>}
          <div style={{display:"flex",gap:6}}>
            {[0,1,2].map(i=>(
              <div key={i} style={{width:i===step?24:8,height:8,borderRadius:4,background:i===step?T.teal:i<step?T.sky+"90":T.border,transition:"all 0.3s"}}/>
            ))}
          </div>
        </div>

        {/* Bestehende Kinder anzeigen */}
        {memberships.length > 0 && (
          <div style={{marginBottom:20,padding:"12px 14px",background:"#F0FFFE",borderRadius:14,border:`1.5px solid ${T.teal}30`}}>
            <div style={{fontFamily:"system-ui,sans-serif",fontSize:11,fontWeight:700,color:T.muted,marginBottom:8}}>BEREITS EINGETRAGEN</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {memberships.map((m,i)=>{
                const col=KINDER_COLORS[i%KINDER_COLORS.length];
                const emoji=KINDER_EMOJIS[i%KINDER_EMOJIS.length];
                return(
                  <span key={i} style={{display:"inline-flex",alignItems:"center",gap:4,background:col.bg,color:col.color,border:`1.5px solid ${col.color}30`,borderRadius:20,padding:"3px 10px",fontFamily:"system-ui,sans-serif",fontSize:12,fontWeight:700}}>
                    {emoji} {m.member?.children?.[0]?.name} · Kl.{m.group?.grade}{m.group?.section||""}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {error && (
          <div style={{padding:"10px 14px",background:"#FFF0F0",borderRadius:12,fontFamily:"system-ui,sans-serif",fontSize:13,color:T.coral,marginBottom:16}}>{error}</div>
        )}

        {/* Step 0: Kind-Name */}
        {step === 0 && (
          <div>
            <div style={{fontFamily:"Georgia,serif",fontSize:28,fontWeight:700,color:T.dark,marginBottom:6}}>
              {isFirstChild ? "Dein erstes Kind" : "Weiteres Kind"}
            </div>
            <div style={{fontFamily:"system-ui,sans-serif",fontSize:13,color:T.muted,marginBottom:24}}>
              Vorname des Kindes – kein Nachname nötig.
            </div>
            <input value={childName} onChange={e=>setChildName(e.target.value)}
              placeholder="Vorname des Kindes…" maxLength={20}
              onKeyDown={e=>e.key==="Enter"&&childName.trim()&&setStep(1)}
              style={{width:"100%",padding:"14px",borderRadius:12,border:`2px solid ${childName?T.teal:T.border}`,fontFamily:"system-ui,sans-serif",fontSize:15,fontWeight:600,outline:"none",marginBottom:20,boxSizing:"border-box",transition:"border-color 0.2s"}}/>
            <Btn onClick={()=>setStep(1)} disabled={!childName.trim()}>Weiter →</Btn>
          </div>
        )}

        {/* Step 1: Schule */}
        {step === 1 && (
          <div>
            <div style={{fontFamily:"Georgia,serif",fontSize:28,fontWeight:700,color:T.dark,marginBottom:6}}>
              Schule von {childName}
            </div>
            <div style={{fontFamily:"system-ui,sans-serif",fontSize:13,color:T.muted,marginBottom:20}}>
              Nach Name, Stadt oder PLZ suchen.
            </div>

            {!school ? (
              <div style={{position:"relative"}}>
                <div style={{display:"flex",alignItems:"center",gap:10,border:`2px solid ${T.border}`,borderRadius:14,padding:"12px 14px",background:T.white}}>
                  <span>🔍</span>
                  <input value={query} onChange={e=>searchSchools(e.target.value)}
                    placeholder="z.B. Grundschule Frankfurt…" autoFocus
                    style={{flex:1,border:"none",outline:"none",fontFamily:"system-ui,sans-serif",fontSize:14,fontWeight:600}}/>
                  {loading && <div style={{width:16,height:16,borderRadius:"50%",border:`2px solid ${T.border}`,borderTopColor:T.teal,animation:"spin 0.7s linear infinite"}}/>}
                </div>
                {query.length >= 2 && (
                  <div style={{position:"absolute",top:"calc(100% + 6px)",left:0,right:0,background:T.white,borderRadius:14,boxShadow:"0 8px 32px rgba(0,0,0,0.14)",border:`1.5px solid ${T.border}`,zIndex:200,overflow:"hidden"}}>
                    {results.length === 0 && !loading ? (
                      <div style={{padding:"16px",textAlign:"center",fontFamily:"system-ui,sans-serif",fontSize:13,color:T.muted}}>Nicht gefunden</div>
                    ) : results.map((s,i) => (
                      <button key={s.id} onClick={()=>{setSchool(s);setQuery("");setResults([]);}}
                        style={{width:"100%",padding:"12px 14px",background:"none",border:"none",cursor:"pointer",textAlign:"left",display:"flex",gap:10,alignItems:"flex-start",borderBottom:i<results.length-1?`1px solid ${T.border}`:"none"}}>
                        <span style={{fontSize:20}}>{SCHULART_EMOJI[s.school_type]||"🏫"}</span>
                        <div>
                          <div style={{fontFamily:"system-ui,sans-serif",fontWeight:800,fontSize:12,color:T.text}}>{s.name}</div>
                          <div style={{fontFamily:"system-ui,sans-serif",fontSize:10,color:T.muted}}>{s.city} · {s.state} · {s.school_type}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div style={{display:"flex",alignItems:"center",gap:10,padding:"14px",background:"#F0FFFE",borderRadius:14,border:`1.5px solid ${T.teal}40`,marginBottom:16}}>
                <span style={{fontSize:22}}>{SCHULART_EMOJI[school.school_type]||"🏫"}</span>
                <div style={{flex:1}}>
                  <div style={{fontFamily:"system-ui,sans-serif",fontWeight:800,fontSize:13,color:T.text}}>{school.name}</div>
                  <div style={{fontFamily:"system-ui,sans-serif",fontSize:11,color:T.muted}}>{school.city} · {school.state}</div>
                </div>
                <button onClick={()=>setSchool(null)} style={{background:"#FFF0F0",border:"none",borderRadius:"50%",width:26,height:26,cursor:"pointer",color:T.coral,fontSize:14}}>×</button>
              </div>
            )}

            <div style={{marginTop:16}}>
              <Btn onClick={()=>setStep(2)} disabled={!school}>Weiter →</Btn>
            </div>
          </div>
        )}

        {/* Step 2: Klasse */}
        {step === 2 && (
          <div>
            <div style={{fontFamily:"Georgia,serif",fontSize:28,fontWeight:700,color:T.dark,marginBottom:6}}>
              Klasse von {childName}
            </div>
            <div style={{fontFamily:"system-ui,sans-serif",fontSize:13,color:T.muted,marginBottom:20}}>{school?.name}</div>

            <div style={{fontFamily:"system-ui,sans-serif",fontSize:11,fontWeight:700,color:T.muted,marginBottom:10}}>KLASSE</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:20}}>
              {klassen.map(k=>(
                <button key={k} onClick={()=>setGrade(k)} style={{width:48,height:48,borderRadius:12,border:"none",background:grade===k?T.dark:"#F0F4F8",color:grade===k?"#fff":T.muted,fontFamily:"system-ui,sans-serif",fontWeight:800,fontSize:16,cursor:"pointer",transition:"all 0.15s",boxShadow:grade===k?"0 4px 14px rgba(26,26,46,0.25)":"none"}}>{k}</button>
              ))}
            </div>

            {grade && (
              <>
                <div style={{fontFamily:"system-ui,sans-serif",fontSize:11,fontWeight:700,color:T.muted,marginBottom:10}}>BUCHSTABE (OPTIONAL)</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:20}}>
                  {["","a","b","c","d","e"].map(s=>(
                    <button key={s} onClick={()=>setSection(s)} style={{minWidth:44,height:40,borderRadius:10,border:"none",background:section===s?T.teal:"#F0F4F8",color:section===s?"#fff":T.muted,fontFamily:"system-ui,sans-serif",fontWeight:800,fontSize:14,cursor:"pointer",padding:"0 12px",transition:"all 0.15s"}}>{s||"–"}</button>
                  ))}
                </div>
              </>
            )}

            <Btn onClick={handleJoin} disabled={saving||!grade}>
              {saving ? "Wird eingerichtet…" : `${childName} in Klasse ${grade||""}${section} eintragen →`}
            </Btn>
          </div>
        )}

        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );
}
