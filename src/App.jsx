import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useUser, useClerk } from "@clerk/clerk-react";
import Login    from "./pages/Login.jsx";
import Join     from "./pages/Join.jsx";
import Feed     from "./pages/Feed.jsx";

function getStored(key) {
  try { return JSON.parse(localStorage.getItem(key)); }
  catch { return null; }
}

export default function App() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut }                    = useClerk();
  const [membership, setMember]        = useState(() => getStored("klassly_membership"));
  const [splash, setSplash]            = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setSplash(false), 2800);
    return () => clearTimeout(t);
  }, []);

  // Wenn User-ID sich ändert membership neu laden
  useEffect(() => {
    if (user?.id) {
      const stored = getStored(`klassly_membership_${user.id}`);
      setMember(stored);
    }
  }, [user?.id]);

  const handleJoined = (result) => {
    localStorage.setItem(`klassly_membership_${user.id}`, JSON.stringify(result));
    setMember(result);
  };

  const handleLogout = async () => {
    await signOut();
    setMember(null);
    window.location.href = "/";
  };

  if (splash) return <Splash />;
  if (!isLoaded) return <Splash />;

  return (
    <Routes>
      <Route path="/login" element={
        isSignedIn ? <Navigate to="/" replace /> : <Login />
      }/>
      <Route path="/join" element={
        !isSignedIn ? <Navigate to="/login" replace /> :
        membership  ? <Navigate to="/" replace />      :
        <Join user={user} onJoined={handleJoined} />
      }/>
      <Route path="/*" element={
        !isSignedIn  ? <Navigate to="/login" replace /> :
        !membership  ? <Navigate to="/join"  replace /> :
        <Feed user={user} membership={membership} onLogout={handleLogout} />
      }/>
    </Routes>
  );
}

function Splash() {
  return (
    <div style={{
      minHeight:"100dvh", display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center",
      background:"linear-gradient(160deg,#0D0D1A 0%,#0A1628 100%)",
      position:"relative", overflow:"hidden"
    }}>
      <div style={{
        position:"absolute", top:"20%", left:"50%", transform:"translateX(-50%)",
        width:400, height:400, borderRadius:"50%", pointerEvents:"none",
        background:"radial-gradient(circle,rgba(61,214,200,0.07) 0%,transparent 70%)"
      }}/>

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
            fontFamily:"Georgia,serif", fontSize:52,
            fontWeight:900, color:"#0D0D1A", lineHeight:1, marginTop:4
          }}>K</span>
        </div>
      </div>

      <div style={{textAlign:"center", animation:"fadeIn 0.5s ease 0.6s both"}}>
        <div style={{
          fontFamily:"Georgia,serif", fontSize:36, fontWeight:900,
          color:"#fff", letterSpacing:"-0.03em", marginBottom:8
        }}>Klassly</div>
        <div style={{
          fontFamily:"system-ui,sans-serif", fontSize:14,
          color:"rgba(255,255,255,0.38)", letterSpacing:"0.04em"
        }}>für Eltern mit SchuKis</div>
      </div>

      <div style={{display:"flex", gap:8, marginTop:40, animation:"fadeIn 0.5s ease 0.8s both"}}>
        {[0,1,2].map(i=>(
          <div key={i} style={{
            width:7, height:7, borderRadius:"50%",
            background:"rgba(61,214,200,0.6)",
            animation:`blink 1.4s ease-in-out ${i*0.22}s infinite`
          }}/>
        ))}
      </div>

      <div style={{
        position:"absolute", bottom:24,
        fontFamily:"system-ui,sans-serif", fontSize:11,
        color:"rgba(255,255,255,0.18)", letterSpacing:"0.12em",
        animation:"fadeIn 0.5s ease 1s both"
      }}>2026</div>

      <style>{`
        @keyframes spinPulse {
          0%   { transform:rotate(0deg)   scale(1);    }
          70%  { transform:rotate(360deg) scale(1);    }
          82%  { transform:rotate(360deg) scale(1.13); }
          91%  { transform:rotate(360deg) scale(0.96); }
          100% { transform:rotate(360deg) scale(1);    }
        }
        @keyframes ringOut {
          0%   { transform:scale(1);   opacity:0.6; }
          100% { transform:scale(1.9); opacity:0;   }
        }
        @keyframes fadeIn {
          from { opacity:0; transform:translateY(8px); }
          to   { opacity:1; transform:translateY(0);   }
        }
        @keyframes blink {
          0%,80%,100%{ transform:scale(0.6); opacity:0.3; }
          40%        { transform:scale(1);   opacity:1;   }
        }
      `}</style>
    </div>
  );
}
