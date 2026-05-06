import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useUser, useClerk } from "@clerk/clerk-react";
import Login from "./pages/Login.jsx";
import Join  from "./pages/Join.jsx";
import Feed  from "./pages/Feed.jsx";

function getStored(key) {
  try { return JSON.parse(localStorage.getItem(key)); }
  catch { return null; }
}
function setStored(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

export default function App() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut }                    = useClerk();
  const [memberships, setMemberships]  = useState([]);
  const [splash, setSplash]            = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setSplash(false), 2800);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (user?.id) {
      const stored = getStored(`klassly_memberships_${user.id}`) || [];
      setMemberships(stored);
    }
  }, [user?.id]);

  const handleJoined = (result) => {
    setMemberships(prev => {
      const exists = prev.find(m => m.group?.id === result.group?.id);
      if (exists) return prev;
      const updated = [...prev, result];
      setStored(`klassly_memberships_${user.id}`, updated);
      return updated;
    });
  };

  const handleLogout = async () => {
    await signOut();
    setMemberships([]);
    window.location.href = "/";
  };

  if (splash || !isLoaded) return <Splash />;

  return (
    <Routes>
      <Route path="/login" element={
        isSignedIn ? <Navigate to="/" replace /> : <Login />
      }/>
      <Route path="/join" element={
        !isSignedIn ? <Navigate to="/login" replace /> :
        <Join user={user} memberships={memberships} onJoined={handleJoined} />
      }/>
      <Route path="/*" element={
        !isSignedIn          ? <Navigate to="/login" replace /> :
        memberships.length===0 ? <Navigate to="/join"  replace /> :
        <Feed
          user={user}
          memberships={memberships}
          onLogout={handleLogout}
          onAddChild={() => window.location.href="/join"}
        />
      }/>
    </Routes>
  );
}

function Splash() {
  return (
    <div className="splash" style={{
      display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center",
      position:"relative", overflow:"hidden"
    }}>
      {/* Glow */}
      <div style={{
        position:"absolute", top:"20%", left:"50%", transform:"translateX(-50%)",
        width:400, height:400, borderRadius:"50%", pointerEvents:"none",
        background:"radial-gradient(circle,rgba(61,214,200,0.07) 0%,transparent 70%)"
      }}/>

      {/* Logo */}
      <div style={{position:"relative", marginBottom:20}}>
        <div style={{
          position:"absolute", inset:-12, borderRadius:"50%",
          border:"1.5px solid rgba(61,214,200,0.28)",
          animation:"ringOut 2.2s ease-out 1.9s infinite"
        }}/>
        <div style={{
          position:"absolute", inset:-24, borderRadius:"50%",
          border:"1px solid rgba(61,214,200,0.14)",
          animation:"ringOut 2.2s ease-out 2.15s infinite"
        }}/>
        <div style={{
          width:88, height:88, borderRadius:24,
          background:"linear-gradient(135deg,#3DD6C8,#45B7D1)",
          display:"flex", alignItems:"center", justifyContent:"center",
          boxShadow:"0 8px 32px rgba(61,214,200,0.3)",
          animation:"spinPulse 1.6s cubic-bezier(0.4,0,0.2,1) 0.4s both"
        }}>
          <span style={{
            fontFamily:"'Fraunces',Georgia,serif", fontSize:52,
            fontWeight:900, color:"#0D0D1A", lineHeight:1, marginTop:4
          }}>K</span>
        </div>
      </div>

      {/* Text */}
      <div style={{textAlign:"center", animation:"fadeIn 0.5s ease 0.6s both"}}>
        <div style={{
          fontFamily:"'Fraunces',Georgia,serif", fontSize:36,
          fontWeight:900, color:"#fff",
          letterSpacing:"-0.03em", marginBottom:8
        }}>Klassly</div>
        <div style={{
          fontFamily:"system-ui,sans-serif", fontSize:14,
          color:"rgba(255,255,255,0.38)", letterSpacing:"0.04em"
        }}>für Eltern mit SchuKis</div>
      </div>

      {/* Dots */}
      <div style={{display:"flex", gap:8, marginTop:40, animation:"fadeIn 0.5s ease 0.8s both"}}>
        {[0,1,2].map(i=>(
          <div key={i} style={{
            width:7, height:7, borderRadius:"50%",
            background:"rgba(61,214,200,0.6)",
            animation:`blink 1.4s ease-in-out ${i*0.22}s infinite`
          }}/>
        ))}
      </div>

      {/* Jahr */}
      <div style={{
        position:"absolute", bottom:24,
        fontFamily:"system-ui,sans-serif", fontSize:11,
        color:"rgba(255,255,255,0.18)", letterSpacing:"0.12em",
        animation:"fadeIn 0.5s ease 1s both"
      }}>2026</div>
    </div>
  );
}
