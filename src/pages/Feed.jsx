import { useState, useEffect, useCallback } from "react";

// ─── Design System (aus Claude Design) ───────────────────────
const K = {
  canvas:   '#F5F1EA',
  surface:  '#FFFFFF',
  navy:     '#0D0D1A',
  navySoft: '#1A1A2E',
  ink:      '#26262E',
  inkSoft:  '#5A5C6B',
  muted:    '#9498A6',
  hairline: '#ECE7DE',
  teal:     '#3DD6C8',
  sky:      '#45B7D1',
  coral:    '#FF6B6B',
  amber:    '#F5A623',
  sage:     '#7BC4A8',
  lilac:    '#9B8CE8',
  tealTint:  'rgba(61,214,200,0.10)',
  coralTint: 'rgba(255,107,107,0.10)',
  amberTint: 'rgba(245,166,35,0.12)',
  card:    '0 1px 2px rgba(13,13,26,0.04), 0 4px 14px rgba(13,13,26,0.05)',
  cardLg:  '0 2px 8px rgba(13,13,26,0.06), 0 18px 40px rgba(13,13,26,0.10)',
  fontUI:      "'Nunito', system-ui, sans-serif",
  fontDisplay: "'Fraunces', Georgia, serif",
};

const SUBJECTS = {
  Mathe:    { color:'#FF6B6B', tint:'rgba(255,107,107,0.10)', glyph:'∑' },
  Deutsch:  { color:'#3DD6C8', tint:'rgba(61,214,200,0.10)',  glyph:'A' },
  Englisch: { color:'#45B7D1', tint:'rgba(69,183,209,0.12)',  glyph:'E' },
  Sachk:    { color:'#7BC4A8', tint:'rgba(123,196,168,0.14)', glyph:'🌍' },
  Sport:    { color:'#9B8CE8', tint:'rgba(155,140,232,0.12)', glyph:'⚡' },
  Kunst:    { color:'#F5A623', tint:'rgba(245,166,35,0.12)',  glyph:'✦' },
  Musik:    { color:'#FF6B6B', tint:'rgba(255,107,107,0.10)', glyph:'♪' },
};

const SUBJECT_MAP = {
  mathe:'Mathe', deutsch:'Deutsch', englisch:'Englisch',
  sachkunde:'Sachk', sport:'Sport', kunst:'Kunst', musik:'Musik',
};

const KINDER_COLORS = [
  {color:'#FF6B6B',bg:'rgba(255,107,107,0.10)'},
  {color:'#45B7D1',bg:'rgba(69,183,209,0.12)'},
  {color:'#3DD6C8',bg:'rgba(61,214,200,0.10)'},
  {color:'#9B8CE8',bg:'rgba(155,140,232,0.12)'},
];
const KINDER_EMOJIS = ["🦋","⚽","🌟","🎸"];

// ─── Kleine Komponenten ───────────────────────────────────────
function SubjectTile({ subject, size = 38 }) {
  const key = SUBJECT_MAP[subject] || subject;
  const s = SUBJECTS[key] || SUBJECTS.Mathe;
  return (
    <div style={{
      width:size, height:size, borderRadius:size*0.3,
      background:s.tint, color:s.color,
      display:'flex', alignItems:'center', justifyContent:'center',
      fontFamily:K.fontDisplay, fontWeight:800, fontSize:size*0.5,
      flexShrink:0,
    }}>{s.glyph}</div>
  );
}

function KindChip({ index, name }) {
  const col = KINDER_COLORS[index % KINDER_COLORS.length];
  const emoji = KINDER_EMOJIS[index % KINDER_EMOJIS.length];
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:3,
      padding:'2px 8px', borderRadius:999,
      background:col.bg, color:col.color,
      fontFamily:K.fontUI, fontSize:11, fontWeight:800,
      whiteSpace:'nowrap',
    }}>{emoji} {name}</span>
  );
}

function Chip({ children, color=K.inkSoft, tint='#F2EEE5', icon }) {
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:4,
      padding:'3px 9px', borderRadius:999,
      background:tint, color,
      fontFamily:K.fontUI, fontSize:11, fontWeight:800,
      whiteSpace:'nowrap',
    }}>
      {icon&&<span style={{fontSize:11}}>{icon}</span>}
      {children}
    </span>
  );
}

function AvatarStack({ people=[], size=18 }) {
  return (
    <div style={{display:'flex',alignItems:'center'}}>
      {people.slice(0,3).map((p,i)=>(
        <div key={i} style={{
          width:size, height:size, borderRadius:'50%',
          background:p.bg||K.teal, color:p.fg||K.navy,
          display:'flex', alignItems:'center', justifyContent:'center',
          fontFamily:K.fontUI, fontSize:size*0.42, fontWeight:900,
          marginLeft:i===0?0:-size*0.32,
          border:`2px solid ${K.surface}`, boxSizing:'border-box',
          flexShrink:0,
        }}>{p.initial}</div>
      ))}
    </div>
  );
}

function Spinner({size=20}){
  return <div style={{width:size,height:size,borderRadius:'50%',border:`2px solid ${K.hairline}`,borderTopColor:K.teal,animation:'spin 0.7s linear infinite'}}/>;
}

// ─── Homework Card (aus Design) ───────────────────────────────
function HomeworkCard({ entry, kindIndex, onConfirm }) {
  const subjectKey = SUBJECT_MAP[entry.subject] || 'Mathe';
  const s = SUBJECTS[subjectKey] || SUBJECTS.Mathe;
  const [confirmed, setConfirmed] = useState(false);
  const [count, setCount] = useState(entry.confirm_count || 0);

  const dueText = entry.due_date ? (() => {
    const diff = Math.ceil((new Date(entry.due_date)-new Date())/(1000*60*60*24));
    if(diff===0) return { label:'Heute', urgent:true, icon:'⚡' };
    if(diff===1) return { label:'Morgen', urgent:true, icon:'⏰' };
    if(diff<0)   return { label:'Überfällig', urgent:true, icon:'❗' };
    return { label:`In ${diff} Tagen`, urgent:false, icon:'📅' };
  })() : null;

  const isExam = entry.priority === 'klassenarbeit';

  return (
    <div style={{
      background:K.surface, borderRadius:20,
      padding:'14px 14px 12px',
      boxShadow:K.card,
      fontFamily:K.fontUI,
    }}>
      {/* Head */}
      <div style={{display:'flex',alignItems:'flex-start',gap:12,marginBottom:10}}>
        <SubjectTile subject={entry.subject} size={38}/>
        <div style={{flex:1,minWidth:0}}>
          <div style={{
            display:'flex', alignItems:'center', gap:6, marginBottom:2,
            fontSize:11, fontWeight:800, letterSpacing:'0.04em', textTransform:'uppercase',
            color:s.color,
          }}>
            <span>{subjectKey}</span>
            <span style={{width:3,height:3,borderRadius:999,background:K.hairline}}/>
            <span style={{color:K.muted}}>{isExam?'Klassenarbeit':'Hausaufgabe'}</span>
            {entry.for_child && kindIndex !== undefined && (
              <>
                <span style={{width:3,height:3,borderRadius:999,background:K.hairline}}/>
                <KindChip index={kindIndex} name={entry.for_child}/>
              </>
            )}
          </div>
          <div style={{
            fontFamily:K.fontDisplay, fontSize:16, fontWeight:700, lineHeight:1.25,
            color:K.ink, letterSpacing:'-0.015em',
          }}>{entry.text}</div>
        </div>
        {isExam && (
          <div style={{
            background:K.coralTint, color:K.coral,
            fontSize:10, fontWeight:900, letterSpacing:'0.04em',
            padding:'3px 7px', borderRadius:6, textTransform:'uppercase',
            marginTop:2, flexShrink:0,
          }}>KA</div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        gap:8, paddingLeft:50,
      }}>
        <div style={{display:'flex',alignItems:'center',gap:6}}>
          {dueText && (
            <Chip
              color={dueText.urgent?K.coral:K.inkSoft}
              tint={dueText.urgent?K.coralTint:'#F2EEE5'}
              icon={dueText.icon}>
              {dueText.label}
            </Chip>
          )}
          <span style={{fontSize:11,fontWeight:700,color:K.muted}}>· {entry.author_name}</span>
        </div>
        <button onClick={()=>{setConfirmed(!confirmed);setCount(c=>confirmed?c-1:c+1);}}
          style={{
            display:'flex', alignItems:'center', gap:5,
            background:'none', border:'none', cursor:'pointer', padding:0,
            fontFamily:K.fontUI, fontSize:12, fontWeight:700,
            color:confirmed?K.teal:K.inkSoft,
          }}>
          <AvatarStack people={[]} size={18}/>
          <span>{count} bestätigt{confirmed?' · du auch':''}</span>
        </button>
      </div>
    </div>
  );
}

// ─── Today Banner ─────────────────────────────────────────────
function TodayBanner({ entries }) {
  const today = entries.filter(e => e.due_date &&
    Math.ceil((new Date(e.due_date)-new Date())/(1000*60*60*24)) <= 0
  ).length;
  const week = entries.filter(e => e.due_date &&
    Math.ceil((new Date(e.due_date)-new Date())/(1000*60*60*24)) <= 7 &&
    Math.ceil((new Date(e.due_date)-new Date())/(1000*60*60*24)) > 0
  ).length;
  const total = entries.length;
  const pct = total > 0 ? Math.min((week/Math.max(total,1)),1) : 0;
  const circumference = 2 * Math.PI * 22;

  const days = ['So','Mo','Di','Mi','Do','Fr','Sa'];
  const now = new Date();

  return (
    <div style={{
      margin:'0 16px 14px', padding:'14px 16px',
      borderRadius:20,
      background:`linear-gradient(135deg, ${K.navy} 0%, #182542 100%)`,
      color:'#fff', position:'relative', overflow:'hidden',
      fontFamily:K.fontUI,
    }}>
      <div style={{
        position:'absolute', right:-30, top:-30, width:140, height:140, borderRadius:'50%',
        background:`radial-gradient(circle, ${K.tealTint} 0%, transparent 70%)`,
      }}/>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',position:'relative'}}>
        <div>
          <div style={{fontSize:11,fontWeight:800,letterSpacing:'0.06em',color:K.teal,textTransform:'uppercase'}}>
            Heute · {days[now.getDay()]}
          </div>
          <div style={{fontFamily:K.fontDisplay,fontSize:22,fontWeight:800,marginTop:4,letterSpacing:'-0.02em'}}>
            {total} {total===1?'Eintrag':'Einträge'}
          </div>
          <div style={{fontSize:12,fontWeight:600,color:'rgba(255,255,255,0.55)',marginTop:2}}>
            {today>0?`${today} heute fällig · `:''}
            {week} diese Woche
          </div>
        </div>
        <div style={{width:56,height:56,borderRadius:18,position:'relative',flexShrink:0,
          background:'rgba(255,255,255,0.06)',
          display:'flex',alignItems:'center',justifyContent:'center'}}>
          <svg width="56" height="56" viewBox="0 0 56 56" style={{position:'absolute'}}>
            <circle cx="28" cy="28" r="22" stroke="rgba(255,255,255,0.08)" strokeWidth="4" fill="none"/>
            <circle cx="28" cy="28" r="22" stroke={K.teal} strokeWidth="4" fill="none"
              strokeDasharray={`${circumference*Math.max(pct,0.05)} ${circumference}`}
              strokeLinecap="round" transform="rotate(-90 28 28)"/>
          </svg>
          <span style={{fontFamily:K.fontDisplay,fontSize:15,fontWeight:900}}>{week}</span>
        </div>
      </div>
    </div>
  );
}

// ─── App Header ───────────────────────────────────────────────
function AppHeader({ memberships, activeKind, onToggleKind, myName }) {
  const m = activeKind !== null ? memberships[activeKind] : null;
  const greeting = myName ? `Hallo ${myName.split(' ')[0]}` : 'Hallo';
  const klasse = m
    ? `${m.group?.school_name||'Schule'} · Kl. ${m.group?.grade}${m.group?.section||''}`
    : `${memberships.length} ${memberships.length===1?'Kind':'Kinder'} eingetragen`;

  return (
    <div style={{padding:'8px 18px 14px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}>
      <div style={{display:'flex',alignItems:'center',gap:12,minWidth:0,flex:1}}>
        {/* Kind switcher */}
        {memberships.length > 0 && (
          <button onClick={()=>onToggleKind(activeKind===0?null:0)} style={{
            width:44, height:44, borderRadius:14, border:'none',
            background:K.tealTint, color:K.teal,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontFamily:K.fontDisplay, fontSize:20, fontWeight:900,
            position:'relative', flexShrink:0, cursor:'pointer',
          }}>
            {memberships[activeKind??0]?.member?.children?.[0]?.name?.[0] || 'K'}
            {memberships.length > 1 && (
              <span style={{
                position:'absolute', right:-2, bottom:-2,
                width:16, height:16, borderRadius:8,
                background:K.surface, color:K.inkSoft,
                border:`1.5px solid ${K.canvas}`,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:9, fontWeight:800,
              }}>↕</span>
            )}
          </button>
        )}
        <div style={{minWidth:0}}>
          <div style={{fontFamily:K.fontDisplay,fontSize:22,fontWeight:800,color:K.navy,letterSpacing:'-0.025em',lineHeight:1.1}}>
            {greeting}
          </div>
          <div style={{fontFamily:K.fontUI,fontSize:12,fontWeight:700,color:K.inkSoft,marginTop:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
            {klasse}
          </div>
        </div>
      </div>
      {/* Notif bell */}
      <button style={{width:38,height:38,borderRadius:12,border:'none',background:K.surface,color:K.navy,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 1px 2px rgba(13,13,26,0.04)'}}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M9 2a5 5 0 00-5 5v3l-1.5 2.5h13L14 10V7a5 5 0 00-5-5z" stroke={K.navy} strokeWidth="1.6" strokeLinejoin="round"/>
          <path d="M7 14a2 2 0 004 0" stroke={K.navy} strokeWidth="1.6" strokeLinecap="round"/>
          <circle cx="14" cy="4" r="2.5" fill={K.coral}/>
        </svg>
      </button>
    </div>
  );
}

// ─── Filter Pills ─────────────────────────────────────────────
function FilterPills({ active, onChange }) {
  const items = ['Alle','Hausaufgaben','Klassenarbeiten'];
  return (
    <div style={{display:'flex',gap:6,padding:'0 16px 12px',overflowX:'auto',fontFamily:K.fontUI}}>
      {items.map(it => {
        const a = it === active;
        return (
          <button key={it} onClick={()=>onChange(it)} style={{
            border:'none', cursor:'pointer',
            padding:'7px 14px', borderRadius:999,
            background:a?K.navy:K.surface,
            color:a?'#fff':K.inkSoft,
            fontSize:12, fontWeight:800, letterSpacing:'-0.005em',
            whiteSpace:'nowrap',
            boxShadow:a?'none':'0 1px 2px rgba(13,13,26,0.04)',
            transition:'all 0.15s',
          }}>{it}</button>
        );
      })}
    </div>
  );
}

// ─── Section Title ────────────────────────────────────────────
function SectionTitle({ children }) {
  return (
    <div style={{padding:'0 18px',margin:'6px 0 10px',display:'flex',alignItems:'baseline',justifyContent:'space-between',fontFamily:K.fontUI}}>
      <div style={{fontFamily:K.fontDisplay,fontSize:16,fontWeight:800,color:K.ink,letterSpacing:'-0.02em'}}>{children}</div>
    </div>
  );
}

// ─── Floating Glass Tab Bar (aus Design) ──────────────────────
function TabBar({ active, onChange, onAdd }) {
  const items = [
    { id:'feed',   label:'Feed',    icon:(c)=>(
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="3" y="4" width="16" height="2.4" rx="1.2" fill={c}/>
        <rect x="3" y="9.8" width="16" height="2.4" rx="1.2" fill={c} opacity="0.7"/>
        <rect x="3" y="15.6" width="10" height="2.4" rx="1.2" fill={c} opacity="0.4"/>
      </svg>
    )},
    { id:'cal',    label:'Termine', icon:(c)=>(
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="3" y="5" width="16" height="14" rx="3" stroke={c} strokeWidth="1.8"/>
        <path d="M3 9h16" stroke={c} strokeWidth="1.8"/>
        <path d="M7 3v4M15 3v4" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
        <circle cx="11" cy="14" r="1.6" fill={c}/>
      </svg>
    )},
    { id:'add', big:true },
    { id:'kasse',  label:'Kasse',   icon:(c)=>(
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="8" stroke={c} strokeWidth="1.8"/>
        <path d="M11 6.5v9M14 8.5c-.5-1.2-1.7-1.7-3-1.7-1.7 0-2.7.7-2.7 1.9 0 1.2.9 1.6 2.7 2 1.8.4 2.7.7 2.7 1.9 0 1.2-1 1.9-2.7 1.9-1.5 0-2.6-.6-3-1.8" stroke={c} strokeWidth="1.6" strokeLinecap="round"/>
      </svg>
    )},
    { id:'me',     label:'Du',      icon:(c)=>(
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="8" r="3.5" stroke={c} strokeWidth="1.8"/>
        <path d="M4 19c1-3.5 4-5.5 7-5.5s6 2 7 5.5" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    )},
  ];

  return (
    <div style={{
      position:'fixed', bottom:18, left:12, right:12,
      height:64, borderRadius:22,
      background:'rgba(255,255,255,0.92)',
      backdropFilter:'blur(20px) saturate(160%)',
      WebkitBackdropFilter:'blur(20px) saturate(160%)',
      boxShadow:'0 1px 0 rgba(255,255,255,0.7) inset, 0 1px 2px rgba(13,13,26,0.04), 0 12px 30px rgba(13,13,26,0.10)',
      border:'1px solid rgba(13,13,26,0.04)',
      display:'flex', alignItems:'center', justifyContent:'space-around',
      zIndex:100,
      fontFamily:K.fontUI,
    }}>
      {items.map(it => {
        if (it.big) return (
          <button key="add" onClick={onAdd} style={{
            width:52, height:52, borderRadius:18,
            background:`linear-gradient(135deg,${K.teal},${K.sky})`,
            border:'none', cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:'0 8px 22px rgba(61,214,200,0.45), 0 1px 0 rgba(255,255,255,0.4) inset',
            transform:'translateY(-4px)',
          }}>
            <svg width="22" height="22" viewBox="0 0 22 22">
              <path d="M11 4v14M4 11h14" stroke={K.navy} strokeWidth="2.6" strokeLinecap="round"/>
            </svg>
          </button>
        );
        const isActive = it.id === active;
        const color = isActive ? K.navy : K.muted;
        return (
          <div key={it.id} onClick={()=>onChange(it.id)} style={{
            display:'flex', flexDirection:'column', alignItems:'center', gap:3,
            color, flex:1, cursor:'pointer',
          }}>
            {it.icon(color)}
            <span style={{fontSize:10,fontWeight:800,letterSpacing:'-0.005em'}}>{it.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Add Modal ────────────────────────────────────────────────
function AddModal({ memberships, myName, onClose, onAdded }) {
  const [selKind, setSelKind]   = useState(memberships.length===1?0:null);
  const [subject, setSubject]   = useState('mathe');
  const [text, setText]         = useState('');
  const [dueDate, setDueDate]   = useState('');
  const [priority, setPriority] = useState('normal');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const SUBJ_OPTIONS = [
    {id:'mathe',label:'Mathe',glyph:'∑'},{id:'deutsch',label:'Deutsch',glyph:'A'},
    {id:'englisch',label:'Englisch',glyph:'E'},{id:'sachkunde',label:'Sachk.',glyph:'🌍'},
    {id:'sport',label:'Sport',glyph:'⚡'},{id:'kunst',label:'Kunst',glyph:'✦'},
    {id:'musik',label:'Musik',glyph:'♪'},
  ];

  const handleAdd = async () => {
    if(!text.trim()||selKind===null) return;
    setLoading(true); setError('');
    const m = memberships[selKind];
    try {
      const res = await fetch('/api/entries',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
        group_id:m.group.id, subject, text:text.trim(),
        due_date:dueDate||null, priority, author_name:myName,
        for_child:m.member?.children?.[0]?.name||null
      })});
      const data = await res.json();
      if(!res.ok) throw new Error(data.error||'Fehler');
      onAdded({...data, _kindIndex:selKind});
      onClose();
    } catch(e){setError(e.message);setLoading(false);}
  };

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(13,13,26,0.6)',display:'flex',alignItems:'flex-end',justifyContent:'center',zIndex:200,backdropFilter:'blur(8px)'}} onClick={onClose}>
      <div style={{background:K.surface,borderRadius:'24px 24px 0 0',padding:'20px 20px 48px',width:'100%',maxWidth:480,maxHeight:'90vh',overflowY:'auto',animation:'slideUp 0.3s ease'}} onClick={e=>e.stopPropagation()}>
        {/* Handle */}
        <div style={{width:36,height:4,borderRadius:2,background:K.hairline,margin:'0 auto 20px'}}/>

        <div style={{fontFamily:K.fontDisplay,fontSize:22,fontWeight:800,color:K.ink,marginBottom:20,letterSpacing:'-0.02em'}}>
          Hausaufgabe eintragen
        </div>

        {error&&<div style={{padding:'10px 14px',background:K.coralTint,borderRadius:12,fontFamily:K.fontUI,fontSize:13,color:K.coral,marginBottom:12}}>{error}</div>}

        {/* Kind */}
        {memberships.length > 1 && (
          <div style={{marginBottom:16}}>
            <div style={{fontFamily:K.fontUI,fontSize:11,fontWeight:800,color:K.muted,letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:8}}>Für welches Kind?</div>
            <div style={{display:'flex',gap:8}}>
              {memberships.map((m,i)=>{
                const col=KINDER_COLORS[i%KINDER_COLORS.length];
                const emoji=KINDER_EMOJIS[i%KINDER_EMOJIS.length];
                const name=m.member?.children?.[0]?.name||`Kind ${i+1}`;
                return(
                  <button key={i} onClick={()=>setSelKind(i)} style={{flex:1,padding:'12px 8px',borderRadius:16,border:'none',background:selKind===i?col.color:col.bg,cursor:'pointer',transition:'all 0.15s',textAlign:'center'}}>
                    <div style={{fontSize:20,marginBottom:4}}>{emoji}</div>
                    <div style={{fontFamily:K.fontUI,fontWeight:800,fontSize:12,color:selKind===i?'#fff':col.color}}>{name}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Fach */}
        <div style={{marginBottom:16}}>
          <div style={{fontFamily:K.fontUI,fontSize:11,fontWeight:800,color:K.muted,letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:8}}>Fach</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
            {SUBJ_OPTIONS.map(o=>{
              const subj = SUBJECTS[SUBJECT_MAP[o.id]||o.id]||SUBJECTS.Mathe;
              const active = subject===o.id;
              return(
                <button key={o.id} onClick={()=>setSubject(o.id)} style={{
                  display:'flex',alignItems:'center',gap:6,
                  padding:'6px 12px',borderRadius:10,border:'none',cursor:'pointer',
                  background:active?subj.tint:'#F5F1EA',
                  color:active?subj.color:K.inkSoft,
                  fontFamily:K.fontUI,fontSize:12,fontWeight:800,
                  transition:'all 0.15s',
                }}>{o.glyph} {o.label}</button>
              );
            })}
          </div>
        </div>

        {/* Text */}
        <textarea value={text} onChange={e=>setText(e.target.value)}
          placeholder="Was müssen die Kinder machen?"
          style={{width:'100%',minHeight:80,border:`1.5px solid ${K.hairline}`,borderRadius:14,padding:'12px 14px',fontFamily:K.fontUI,fontSize:14,fontWeight:600,outline:'none',resize:'vertical',marginBottom:12,background:K.canvas,color:K.ink}}/>

        {/* Datum + Priorität */}
        <div style={{display:'flex',gap:10,marginBottom:20}}>
          <div style={{flex:1}}>
            <div style={{fontFamily:K.fontUI,fontSize:11,fontWeight:800,color:K.muted,letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:6}}>Abgabe</div>
            <input type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)} style={{width:'100%',padding:'10px',borderRadius:10,border:`1.5px solid ${K.hairline}`,fontFamily:K.fontUI,fontSize:13,outline:'none',background:K.canvas,color:K.ink}}/>
          </div>
          <div style={{flex:1}}>
            <div style={{fontFamily:K.fontUI,fontSize:11,fontWeight:800,color:K.muted,letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:6}}>Priorität</div>
            <select value={priority} onChange={e=>setPriority(e.target.value)} style={{width:'100%',padding:'10px',borderRadius:10,border:`1.5px solid ${K.hairline}`,fontFamily:K.fontUI,fontSize:13,outline:'none',background:K.canvas,color:K.ink}}>
              <option value="normal">Normal</option>
              <option value="wichtig">Wichtig</option>
              <option value="klassenarbeit">Klassenarbeit</option>
            </select>
          </div>
        </div>

        <button onClick={handleAdd} disabled={loading||!text.trim()||selKind===null} style={{
          width:'100%',padding:'15px',borderRadius:16,border:'none',
          background:loading||!text.trim()||selKind===null?K.hairline:`linear-gradient(135deg,${K.teal},${K.sky})`,
          color:loading||!text.trim()||selKind===null?K.muted:K.navy,
          fontFamily:K.fontUI,fontSize:15,fontWeight:900,cursor:loading||!text.trim()||selKind===null?'not-allowed':'pointer',
          boxShadow:loading||!text.trim()||selKind===null?'none':'0 6px 22px rgba(61,214,200,0.4)',
          transition:'all 0.2s',
        }}>
          {loading?'Wird eingetragen…':'Eintragen ✓'}
        </button>
      </div>
    </div>
  );
}

// ─── Settings Screen ──────────────────────────────────────────
function SettingsScreen({ user, memberships, onLogout, onAddChild }) {
  return (
    <div style={{padding:'16px 16px 0',background:K.canvas,minHeight:'100%'}}>
      <div style={{fontFamily:K.fontDisplay,fontSize:26,fontWeight:800,color:K.navy,letterSpacing:'-0.025em',marginBottom:20,padding:'8px 2px 0'}}>
        Dein Profil
      </div>

      <div style={{background:K.surface,borderRadius:20,overflow:'hidden',boxShadow:K.card,marginBottom:16}}>
        <div style={{padding:'16px 18px',borderBottom:`1px solid ${K.hairline}`}}>
          <div style={{fontFamily:K.fontUI,fontSize:11,fontWeight:800,color:K.muted,letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:4}}>Konto</div>
          <div style={{fontFamily:K.fontDisplay,fontSize:16,fontWeight:700,color:K.ink}}>{user?.firstName||user?.emailAddresses?.[0]?.emailAddress||'Elternteil'}</div>
          <div style={{fontFamily:K.fontUI,fontSize:12,color:K.muted,marginTop:2}}>{user?.emailAddresses?.[0]?.emailAddress}</div>
        </div>
      </div>

      <div style={{background:K.surface,borderRadius:20,overflow:'hidden',boxShadow:K.card,marginBottom:16}}>
        <div style={{padding:'14px 18px 4px'}}>
          <div style={{fontFamily:K.fontUI,fontSize:11,fontWeight:800,color:K.muted,letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:12}}>Meine Kinder</div>
        </div>
        {memberships.map((m,i)=>{
          const col=KINDER_COLORS[i%KINDER_COLORS.length];
          const emoji=KINDER_EMOJIS[i%KINDER_EMOJIS.length];
          const name=m.member?.children?.[0]?.name||`Kind ${i+1}`;
          return(
            <div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 18px',borderTop:`1px solid ${K.hairline}`}}>
              <div style={{width:40,height:40,borderRadius:12,background:col.bg,color:col.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>{emoji}</div>
              <div style={{flex:1}}>
                <div style={{fontFamily:K.fontUI,fontWeight:800,fontSize:14,color:K.ink}}>{name}</div>
                <div style={{fontFamily:K.fontUI,fontSize:12,color:K.muted}}>{m.group?.school_name||''} · Kl. {m.group?.grade}{m.group?.section||''}</div>
              </div>
            </div>
          );
        })}
        <div style={{padding:'12px 18px',borderTop:`1px solid ${K.hairline}`}}>
          <button onClick={onAddChild} style={{width:'100%',padding:'11px',borderRadius:12,border:`1.5px dashed ${K.hairline}`,background:'transparent',fontFamily:K.fontUI,fontSize:13,fontWeight:700,color:K.muted,cursor:'pointer'}}>
            + Weiteres Kind hinzufügen
          </button>
        </div>
      </div>

      <button onClick={onLogout} style={{width:'100%',padding:'14px',borderRadius:16,border:`1.5px solid ${K.coral}`,background:K.coralTint,fontFamily:K.fontUI,fontWeight:800,fontSize:14,color:K.coral,cursor:'pointer',marginBottom:100}}>
        Abmelden
      </button>
    </div>
  );
}

// ─── Feed Root ────────────────────────────────────────────────
export default function Feed({ user, memberships, onLogout, onAddChild }) {
  const [allEntries, setAllEntries] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [activeKind, setActiveKind] = useState(null);
  const [activeFilter, setActiveFilter] = useState('Alle');
  const [tab, setTab]               = useState('feed');
  const [showAdd, setShowAdd]       = useState(false);

  const myName = user?.firstName || user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] || 'Elternteil';

  const loadEntries = useCallback(async () => {
    setLoading(true);
    try {
      const results = await Promise.all(
        memberships.map(async (m, i) => {
          const r = await fetch(`/api/entries?group_id=${m.group.id}`);
          const d = await r.json();
          return (Array.isArray(d)?d:[]).map(e=>({...e,_kindIndex:i}));
        })
      );
      setAllEntries(results.flat().sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)));
    } catch { setAllEntries([]); }
    finally { setLoading(false); }
  }, [memberships]);

  useEffect(()=>{loadEntries();},[loadEntries]);

  const filtered = allEntries.filter(e=>{
    if(activeKind!==null&&e._kindIndex!==activeKind) return false;
    if(activeFilter==='Hausaufgaben'&&e.priority==='klassenarbeit') return false;
    if(activeFilter==='Klassenarbeiten'&&e.priority!=='klassenarbeit') return false;
    return true;
  }).sort((a,b)=>{
    if(a.priority==='wichtig'&&b.priority!=='wichtig') return -1;
    if(b.priority==='wichtig'&&a.priority!=='wichtig') return 1;
    if(a.priority==='klassenarbeit'&&b.priority!=='klassenarbeit') return -1;
    return new Date(b.created_at)-new Date(a.created_at);
  });

  const toggleKind = (current) => {
    if(memberships.length <= 1) return;
    setActiveKind(prev=>{
      if(prev===null) return 0;
      if(prev<memberships.length-1) return prev+1;
      return null;
    });
  };

  return(
    <div style={{minHeight:'100dvh',background:K.canvas,paddingBottom:100}}>

      {/* Header */}
      <AppHeader
        memberships={memberships}
        activeKind={activeKind}
        onToggleKind={toggleKind}
        myName={myName}
      />

      {/* Feed */}
      {tab==='feed'&&(
        <>
          <FilterPills active={activeFilter} onChange={setActiveFilter}/>
          <TodayBanner entries={allEntries}/>

          {loading?(
            <div style={{display:'flex',justifyContent:'center',padding:40}}><Spinner size={32}/></div>
          ):filtered.length===0?(
            <div style={{textAlign:'center',padding:'40px 20px'}}>
              <div style={{fontFamily:K.fontDisplay,fontSize:22,fontWeight:700,color:K.muted,marginBottom:8}}>Noch nichts hier</div>
              <div style={{fontFamily:K.fontUI,fontSize:14,color:K.muted}}>Sei der Erste und trag etwas ein!</div>
            </div>
          ):(
            <>
              {filtered.some(e=>e.due_date&&Math.ceil((new Date(e.due_date)-new Date())/(1000*60*60*24))<=1)&&(
                <>
                  <SectionTitle>Heute & Morgen</SectionTitle>
                  <div style={{padding:'0 14px',display:'flex',flexDirection:'column',gap:10,marginBottom:8}}>
                    {filtered.filter(e=>e.due_date&&Math.ceil((new Date(e.due_date)-new Date())/(1000*60*60*24))<=1).map(e=>(
                      <HomeworkCard key={e.id} entry={e} kindIndex={e._kindIndex}/>
                    ))}
                  </div>
                </>
              )}
              <SectionTitle>Alle Einträge</SectionTitle>
              <div style={{padding:'0 14px',display:'flex',flexDirection:'column',gap:10}}>
                {filtered.filter(e=>!e.due_date||Math.ceil((new Date(e.due_date)-new Date())/(1000*60*60*24))>1).map(e=>(
                  <HomeworkCard key={e.id} entry={e} kindIndex={e._kindIndex}/>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* Einstellungen */}
      {tab==='me'&&(
        <SettingsScreen user={user} memberships={memberships} onLogout={onLogout} onAddChild={onAddChild}/>
      )}

      {/* Platzhalter für andere Tabs */}
      {(tab==='cal'||tab==='kasse')&&(
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'60vh',gap:12}}>
          <div style={{fontSize:48}}>{tab==='cal'?'📅':'💰'}</div>
          <div style={{fontFamily:K.fontDisplay,fontSize:22,fontWeight:700,color:K.muted}}>{tab==='cal'?'Termine':'Klassenkasse'}</div>
          <div style={{fontFamily:K.fontUI,fontSize:14,color:K.muted}}>Kommt bald</div>
        </div>
      )}

      {/* Floating Glass Tab Bar */}
      <TabBar active={tab} onChange={setTab} onAdd={()=>setShowAdd(true)}/>

      {showAdd&&(
        <AddModal
          memberships={memberships}
          myName={myName}
          onClose={()=>setShowAdd(false)}
          onAdded={e=>setAllEntries(p=>[{...e,confirm_count:0},...p])}
        />
      )}
    </div>
  );
}
