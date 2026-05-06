import { SignIn } from "@clerk/clerk-react";

const T = {
  teal:"#3DD6C8", sky:"#45B7D1", dark:"#0D0D1A",
  white:"#FFFFFF", muted:"rgba(255,255,255,0.5)"
};

const FEATURES = [
  { icon:"📚", title:"Hausaufgaben-Feed",     text:"Was die Klasse aufhat – von Eltern bestätigt." },
  { icon:"📅", title:"Termine & Klassenarbeiten", text:"Nie wieder einen Termin verpassen." },
  { icon:"👨‍👩‍👧", title:"Mehrere Kinder",      text:"Alle Kinder in einer App." },
  { icon:"💰", title:"Klassenkasse",          text:"Sammlungen transparent tracken." },
];

export default function Login() {
  return (
    <div style={{
      minHeight:"100dvh", display:"flex", flexDirection:"column",
      background:`linear-gradient(160deg,${T.dark} 0%,#0A1628 100%)`
    }}>

      {/* Hero */}
      <div style={{
        flex:1, display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center",
        padding:"48px 24px 32px", position:"relative", overflow:"hidden"
      }}>
        {/* Glow */}
        <div style={{
          position:"absolute", top:-100, left:"50%", transform:"translateX(-50%)",
          width:500, height:500, borderRadius:"50%", pointerEvents:"none",
          background:"radial-gradient(circle,rgba(61,214,200,0.07) 0%,transparent 70%)"
        }}/>

        {/* Logo */}
        <div style={{
          width:76, height:76, borderRadius:22,
          background:`linear-gradient(135deg,${T.teal},${T.sky})`,
          display:"flex", alignItems:"center", justifyContent:"center",
          marginBottom:18,
          boxShadow:"0 0 0 10px rgba(61,214,200,0.08),0 12px 40px rgba(61,214,200,0.25)"
        }}>
          <span style={{
            fontFamily:"Georgia,serif", fontSize:46,
            fontWeight:900, color:T.dark, lineHeight:1, marginTop:4
          }}>K</span>
        </div>

        <h1 style={{
          fontFamily:"Georgia,serif", fontSize:34, fontWeight:900,
          color:T.white, margin:"0 0 10px", letterSpacing:"-0.03em",
          textAlign:"center", lineHeight:1.15
        }}>Immer wissen<br/>was Sache ist.</h1>

        <p style={{
          fontFamily:"system-ui,sans-serif", fontSize:15,
          color:T.muted, margin:"0 0 32px",
          textAlign:"center", lineHeight:1.6, maxWidth:300
        }}>
          Die App für Eltern mit SchuKis –<br/>
          kostenlos & ohne Schul-Login.
        </p>

        {/* Features */}
        <div style={{
          display:"grid", gridTemplateColumns:"1fr 1fr",
          gap:10, width:"100%", maxWidth:380
        }}>
          {FEATURES.map((f,i) => (
            <div key={i} style={{
              background:"rgba(255,255,255,0.05)",
              border:"1px solid rgba(255,255,255,0.08)",
              borderRadius:14, padding:"12px 14px"
            }}>
              <div style={{fontSize:20, marginBottom:6}}>{f.icon}</div>
              <div style={{
                fontFamily:"system-ui,sans-serif",
                fontSize:12, fontWeight:700, color:T.white, marginBottom:3
              }}>{f.title}</div>
              <div style={{
                fontFamily:"system-ui,sans-serif",
                fontSize:11, color:"rgba(255,255,255,0.4)", lineHeight:1.4
              }}>{f.text}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Clerk Login Card */}
      <div style={{
        background:T.white,
        borderRadius:"28px 28px 0 0",
        padding:"28px 24px 48px",
        boxShadow:"0 -8px 40px rgba(0,0,0,0.25)",
        display:"flex", flexDirection:"column", alignItems:"center"
      }}>
        <SignIn
          routing="hash"
          appearance={{
            elements:{
              rootBox:{ width:"100%", maxWidth:360 },
              card:{
                boxShadow:"none", padding:0,
                border:"none", background:"transparent"
              },
              headerTitle:{ display:"none" },
              headerSubtitle:{ display:"none" },
              socialButtonsBlockButton:{
                border:"2px solid #E8EDF2",
                borderRadius:12, fontWeight:700,
                fontFamily:"system-ui,sans-serif",
                marginBottom:6
              },
              formButtonPrimary:{
                background:`linear-gradient(135deg,${T.teal},${T.sky})`,
                color:T.dark, borderRadius:12,
                fontFamily:"system-ui,sans-serif",
                fontWeight:900, fontSize:15,
                boxShadow:"0 6px 20px rgba(61,214,200,0.35)"
              },
              formFieldInput:{
                borderRadius:12, border:"2px solid #E8EDF2",
                fontFamily:"system-ui,sans-serif",
                fontSize:14, fontWeight:600
              },
              footerActionLink:{ color:T.teal },
              dividerLine:{ background:"#E8EDF2" },
            }
          }}
        />

        <p style={{
          fontFamily:"system-ui,sans-serif", fontSize:11,
          color:"#94A3B8", textAlign:"center",
          marginTop:14, lineHeight:1.5
        }}>
          Kostenlos · Kein Spam · Deine Daten bleiben privat
        </p>
      </div>
    </div>
  );
}
