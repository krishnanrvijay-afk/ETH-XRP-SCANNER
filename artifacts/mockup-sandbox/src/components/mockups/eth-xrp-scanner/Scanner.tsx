import { useState, useEffect } from "react";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Bebas+Neue&family=JetBrains+Mono:wght@400;600;700&display=swap');
  :root {
    --bg:#05080b; --surface:#0a0f14; --card:#0e1519; --border:#162028;
    --green:#00e676; --yellow:#ffd740; --red:#ff3d3d;
    --cyan:#00c8ff; --purple:#b388ff; --violet:#9c6fff;
    --muted:#4a6272; --text:#ddeeff; --white:#f0f8ff;
  }
  * { box-sizing:border-box; margin:0; padding:0; }
  body,#root { background:var(--bg); color:var(--text); font-family:'JetBrains Mono',monospace; font-size:12px; min-height:100vh; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.2} }
  @keyframes blink  { 0%,100%{opacity:1} 50%{opacity:0.4} }
  @keyframes slideIn { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:none} }
`;

/* ── tiny helpers ── */
const dot = (col: string) => (
  <span style={{ display:"inline-block", width:6, height:6, borderRadius:"50%", background:col, marginRight:6, animation:"pulse 1.8s ease-in-out infinite", verticalAlign:"middle" }} />
);

type PairData = {
  sym: string; venue: "MEXC" | "HL"; accentColor: string; borderCol: string;
  price: string; tickSize: string; notional: string; leverage: string;
  zone: string; status: "DETECTING" | "ARMED" | "IN-TRADE" | "WAITING";
  direction: "LONG" | "SHORT" | null; pnl: number; trades: number; wins: number;
  lastAction: string; fundingRate: string; spreadTicks: string;
  sessionWin: string; bestHours: string; margin: string;
};

const MOCK_DATA: PairData[] = [
  {
    sym:"ETH", venue:"MEXC", accentColor:"#00c8ff", borderCol:"rgba(0,200,255,0.45)",
    price:"2,016.40", tickSize:"$0.10", notional:"$625K", leverage:"25×",
    zone:"2014.20 – 2018.50", status:"DETECTING", direction:null,
    pnl:+247.80, trades:6, wins:4,
    lastAction:"Band confirmed · 2014.20/2018.50 · waiting for entry", fundingRate:"+0.0038%/1h",
    spreadTicks:"1 tk", sessionWin:"67%", bestHours:"04:00–12:00 UTC", margin:"$25,000",
  },
  {
    sym:"ETH", venue:"HL", accentColor:"#b388ff", borderCol:"rgba(179,136,255,0.45)",
    price:"2,016.55", tickSize:"$0.10", notional:"$625K", leverage:"25×",
    zone:"2014.20 – 2018.50", status:"ARMED", direction:"LONG",
    pnl:-31.25, trades:2, wins:1,
    lastAction:"Limit BUY @ 2014.30 · waiting fill · TP 2018.40 / SL 2010.10", fundingRate:"+0.0038%/1h",
    spreadTicks:"1 tk", sessionWin:"50%", bestHours:"04:00–12:00 UTC", margin:"$25,000",
  },
  {
    sym:"XRP", venue:"MEXC", accentColor:"#00c8ff", borderCol:"rgba(0,200,255,0.45)",
    price:"1.3002", tickSize:"$0.0001", notional:"$500K", leverage:"20×",
    zone:"1.2974 – 1.3028", status:"IN-TRADE", direction:"SHORT",
    pnl:+581.40, trades:9, wins:7,
    lastAction:"SHORT filled @ 1.3028 · unrPnL +$194 · TP 1.2978 / SL 1.3078", fundingRate:"-0.0027%/1h",
    spreadTicks:"1 tk", sessionWin:"78%", bestHours:"03:00 + 11:00 UTC", margin:"$25,000",
  },
  {
    sym:"XRP", venue:"HL", accentColor:"#b388ff", borderCol:"rgba(179,136,255,0.45)",
    price:"1.3003", tickSize:"$0.0001", notional:"$500K", leverage:"20×",
    zone:"1.2974 – 1.3028", status:"DETECTING", direction:null,
    pnl:+82.50, trades:3, wins:2,
    lastAction:"Tick-pair confirmed · anchors 1.2975/1.3027 · monitoring", fundingRate:"-0.0027%/1h",
    spreadTicks:"1 tk", sessionWin:"67%", bestHours:"03:00 + 11:00 UTC", margin:"$25,000",
  },
];

const statusColor: Record<string, string> = {
  DETECTING:"#ffd740", ARMED:"#00c8ff", "IN-TRADE":"#00e676", WAITING:"#4a6272",
};

function PairCard({ d }: { d: PairData }) {
  const wr = d.trades > 0 ? Math.round(d.wins / d.trades * 100) : 0;
  const isHL = d.venue === "HL";
  const venueGlow = isHL
    ? "0 0 0 1px rgba(179,136,255,0.3), 0 2px 16px rgba(179,136,255,0.08)"
    : "0 0 0 1px rgba(0,200,255,0.3), 0 2px 16px rgba(0,200,255,0.08)";

  return (
    <div style={{
      background:"#0a0e12", border:`2px solid ${d.borderCol}`,
      borderRadius:10, padding:14, flex:1, minWidth:0,
      boxShadow: venueGlow, animation:"slideIn 0.3s ease",
    }}>
      {/* card header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
            <span style={{ fontFamily:"'Bebas Neue'", fontSize:22, letterSpacing:2, color:d.accentColor }}>{d.sym}</span>
            <span style={{
              background: isHL ? "rgba(179,136,255,0.15)" : "rgba(0,200,255,0.12)",
              border:`1px solid ${d.borderCol}`, color:d.accentColor,
              padding:"1px 7px", borderRadius:3, fontSize:10, fontWeight:700, letterSpacing:1,
            }}>{d.venue}</span>
            {d.direction && (
              <span style={{
                background: d.direction==="LONG" ? "rgba(0,230,118,0.15)" : "rgba(255,61,61,0.15)",
                border:`1px solid ${d.direction==="LONG" ? "rgba(0,230,118,0.4)" : "rgba(255,61,61,0.4)"}`,
                color: d.direction==="LONG" ? "#00e676" : "#ff3d3d",
                padding:"1px 7px", borderRadius:3, fontSize:10, fontWeight:700,
              }}>{d.direction}</span>
            )}
          </div>
          <div style={{ fontSize:10, color:"#4a6272" }}>
            {d.leverage} · Notional {d.notional} · Margin {d.margin}
          </div>
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ fontFamily:"'Bebas Neue'", fontSize:20, color: d.pnl >= 0 ? "#00e676" : "#ff3d3d" }}>
            {d.pnl >= 0 ? "+" : ""}${d.pnl.toFixed(2)}
          </div>
          <div style={{ fontSize:9, color:"#4a6272" }}>session P&L</div>
        </div>
      </div>

      {/* price + status row */}
      <div style={{ display:"flex", gap:6, marginBottom:8 }}>
        <div style={{ flex:1, background:"#060a0d", border:"1px solid #162028", borderRadius:6, padding:"7px 10px" }}>
          <div style={{ fontSize:9, color:"#4a6272", marginBottom:2 }}>MARK PRICE</div>
          <div style={{ fontFamily:"'Bebas Neue'", fontSize:18, color:"#f0f8ff", letterSpacing:1 }}>${d.price}</div>
          <div style={{ fontSize:9, color:"#4a6272", marginTop:1 }}>tick {d.tickSize} · spread {d.spreadTicks}</div>
        </div>
        <div style={{ flex:1, background:"#060a0d", border:"1px solid #162028", borderRadius:6, padding:"7px 10px" }}>
          <div style={{ fontSize:9, color:"#4a6272", marginBottom:2 }}>STATUS</div>
          <div style={{ display:"flex", alignItems:"center", gap:5 }}>
            {dot(statusColor[d.status])}
            <span style={{ fontFamily:"'Bebas Neue'", fontSize:16, color:statusColor[d.status], letterSpacing:1 }}>{d.status}</span>
          </div>
          <div style={{ fontSize:9, color:"#4a6272", marginTop:1 }}>funding {d.fundingRate}</div>
        </div>
        <div style={{ flex:1, background:"#060a0d", border:"1px solid #162028", borderRadius:6, padding:"7px 10px" }}>
          <div style={{ fontSize:9, color:"#4a6272", marginBottom:2 }}>WIN RATE</div>
          <div style={{ fontFamily:"'Bebas Neue'", fontSize:18, color: wr>=70?"#00e676":wr>=50?"#ffd740":"#ff3d3d", letterSpacing:1 }}>{wr}%</div>
          <div style={{ fontSize:9, color:"#4a6272", marginTop:1 }}>{d.wins}W / {d.trades-d.wins}L · {d.trades} trades</div>
        </div>
      </div>

      {/* zone band */}
      <div style={{ background:"#060a0d", border:"1px solid #162028", borderRadius:6, padding:"7px 10px", marginBottom:8 }}>
        <div style={{ fontSize:9, color:"#4a6272", marginBottom:3 }}>ACTIVE ZONE</div>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <span style={{ fontFamily:"'JetBrains Mono'", fontSize:11, color:"#ff3d3d" }}>{d.zone.split(" – ")[0]}</span>
          <div style={{ flex:1, height:4, background:"#162028", borderRadius:2, position:"relative" }}>
            <div style={{
              position:"absolute", left:"25%", right:"25%", top:0, bottom:0,
              background: `linear-gradient(90deg, transparent, ${d.accentColor}55, transparent)`,
              borderRadius:2,
            }} />
            {d.status==="IN-TRADE" && (
              <div style={{
                position:"absolute", left:"52%", top:-2, width:8, height:8,
                background: d.direction==="LONG"?"#00e676":"#ff3d3d",
                borderRadius:"50%", transform:"translateX(-50%)",
                boxShadow:`0 0 6px ${d.direction==="LONG"?"#00e676":"#ff3d3d"}`,
              }} />
            )}
          </div>
          <span style={{ fontFamily:"'JetBrains Mono'", fontSize:11, color:"#00e676" }}>{d.zone.split(" – ")[1]}</span>
        </div>
      </div>

      {/* last action */}
      <div style={{
        background:"#060a0d", border:`1px solid ${d.borderCol}33`,
        borderRadius:6, padding:"7px 10px", fontSize:9.5, color:"#8ab0c0",
        lineHeight:1.6,
      }}>
        {dot(statusColor[d.status])}
        {d.lastAction}
      </div>

      {/* fee note — HL specific */}
      {isHL && (
        <div style={{
          marginTop:7, background:"rgba(179,136,255,0.07)", border:"1px solid rgba(179,136,255,0.2)",
          borderRadius:5, padding:"5px 9px", fontSize:9, color:"#b388ff",
        }}>
          HL fee structure · 0.015% maker RT · min TP = 0.39% of price · break-even WR 70%
        </div>
      )}
    </div>
  );
}

function VenueCompareBar({ sym, mexcPnl, hlPnl, mexcWR, hlWR }: { sym:string; mexcPnl:number; hlPnl:number; mexcWR:number; hlWR:number }) {
  return (
    <div style={{
      background:"#08111a", border:"1px solid #162028",
      borderRadius:7, padding:"8px 14px", marginBottom:8, display:"flex", alignItems:"center", gap:12,
    }}>
      <span style={{ fontFamily:"'Bebas Neue'", fontSize:14, color:"#4a6272", letterSpacing:2, minWidth:40 }}>{sym}</span>
      <div style={{ flex:1, display:"flex", gap:6 }}>
        <span style={{ fontSize:9, color:"#00c8ff" }}>MEXC</span>
        <span style={{ fontSize:9, color: mexcPnl>=0?"#00e676":"#ff3d3d", fontWeight:700 }}>
          {mexcPnl>=0?"+":""}${mexcPnl.toFixed(0)}
        </span>
        <span style={{ fontSize:9, color:"#4a6272" }}>·</span>
        <span style={{ fontSize:9, color:"#4a6272" }}>WR {mexcWR}%</span>
      </div>
      <div style={{ fontSize:9, color:"#4a6272" }}>vs</div>
      <div style={{ flex:1, display:"flex", gap:6, justifyContent:"flex-end" }}>
        <span style={{ fontSize:9, color:"#4a6272" }}>WR {hlWR}%</span>
        <span style={{ fontSize:9, color:"#4a6272" }}>·</span>
        <span style={{ fontSize:9, color: hlPnl>=0?"#00e676":"#ff3d3d", fontWeight:700 }}>
          {hlPnl>=0?"+":""}${hlPnl.toFixed(0)}
        </span>
        <span style={{ fontSize:9, color:"#b388ff" }}>HL</span>
      </div>
    </div>
  );
}

export function Scanner() {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);

  const edtStr = time.toLocaleTimeString("en-US", { timeZone:"America/New_York", hour12:false }) + " EDT";
  const hr = parseInt(time.toLocaleString("en-US", { timeZone:"America/New_York", hour:"2-digit", hour12:false }));
  const inOptimalETH = hr >= 0 && hr < 8;
  const inOptimalXRP = hr === 23 || (hr >= 3 && hr < 5) || (hr >= 7 && hr < 9);

  const totalPnl  = MOCK_DATA.reduce((s,d)=>s+d.pnl, 0);
  const totalTrades = MOCK_DATA.reduce((s,d)=>s+d.trades, 0);
  const totalWins   = MOCK_DATA.reduce((s,d)=>s+d.wins, 0);

  const ethMexc = MOCK_DATA[0]; const ethHL = MOCK_DATA[1];
  const xrpMexc = MOCK_DATA[2]; const xrpHL = MOCK_DATA[3];

  return (
    <>
      <style>{CSS}</style>
      <div style={{ maxWidth:1360, margin:"0 auto", padding:10, fontFamily:"'JetBrains Mono',monospace" }}>

        {/* ── HEADER ── */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingBottom:10, borderBottom:"1px solid #162028", marginBottom:10 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <span style={{ fontFamily:"'Bebas Neue'", fontSize:22, letterSpacing:2, color:"#f0f8ff" }}>
              ETH · XRP <span style={{ color:"#00e676" }}>SCANNER</span>
            </span>
            <span style={{
              background:"rgba(0,200,255,0.1)", border:"1px solid rgba(0,200,255,0.3)",
              color:"#00c8ff", padding:"2px 8px", borderRadius:3, fontSize:10, letterSpacing:1,
            }}>MEXC</span>
            <span style={{ fontFamily:"'Bebas Neue'", fontSize:11, color:"#4a6272", letterSpacing:2 }}>+</span>
            <span style={{
              background:"rgba(179,136,255,0.1)", border:"1px solid rgba(179,136,255,0.3)",
              color:"#b388ff", padding:"2px 8px", borderRadius:3, fontSize:10, letterSpacing:1,
            }}>HYPERLIQUID</span>
            <span style={{
              background:"rgba(255,215,64,0.1)", border:"1px solid rgba(255,215,64,0.3)",
              color:"#ffd740", padding:"2px 8px", borderRadius:3, fontSize:9, letterSpacing:1,
            }}>PAPER MODE</span>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:12, fontWeight:700, color:"#ffd740" }}>{edtStr}</div>
            <div style={{ fontSize:9, color:"#4a6272", marginTop:1 }}>Zone-window · 0.39% TP threshold · 70% WR target</div>
          </div>
        </div>

        {/* ── SESSION BAR ── */}
        <div style={{ display:"flex", gap:3, marginBottom:10 }}>
          {[["ASIA","0–8 UTC",inOptimalETH,"#162028","rgba(0,200,255,0.08)"],
            ["LONDON","8–13 UTC",inOptimalXRP,"#162028","rgba(179,136,255,0.08)"],
            ["NY OPEN","13–17 UTC",false,"#162028","#0a0f14"],
            ["NY","17–22 UTC",false,"#162028","#0a0f14"],
            ["LATE","22–0 UTC",inOptimalXRP,"#162028","rgba(179,136,255,0.08)"]
          ].map(([label,hrs,active,border,bg]) => (
            <div key={label as string} style={{
              flex:1, height:26, borderRadius:3, display:"flex", flexDirection:"column",
              alignItems:"center", justifyContent:"center",
              background: bg as string, border:`1px solid ${border}`,
              outline: active ? "2px solid #ffd740" : "none",
            }}>
              <span style={{ fontFamily:"'Bebas Neue'", fontSize:12, letterSpacing:1.5, color: active?"#ffd740":"#4a6272" }}>{label as string}</span>
              <span style={{ fontSize:8, color:"#4a6272", lineHeight:1 }}>{hrs as string}</span>
            </div>
          ))}
        </div>

        {/* ── VENUE LEGEND ── */}
        <div style={{ display:"flex", gap:8, marginBottom:10 }}>
          <div style={{ display:"flex", alignItems:"center", gap:5, background:"rgba(0,200,255,0.06)", border:"1px solid rgba(0,200,255,0.2)", borderRadius:4, padding:"4px 10px" }}>
            <div style={{ width:10, height:10, borderRadius:2, background:"rgba(0,200,255,0.4)", border:"1px solid #00c8ff" }} />
            <span style={{ fontSize:9, color:"#00c8ff" }}>MEXC · 0% maker fee · 50× · $50K min TP move</span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:5, background:"rgba(179,136,255,0.06)", border:"1px solid rgba(179,136,255,0.2)", borderRadius:4, padding:"4px 10px" }}>
            <div style={{ width:10, height:10, borderRadius:2, background:"rgba(179,136,255,0.4)", border:"1px solid #b388ff" }} />
            <span style={{ fontSize:9, color:"#b388ff" }}>HYPERLIQUID · 0.015% maker · max 25× · 0.39% min TP</span>
          </div>
          <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:5 }}>
            <span style={{ fontSize:9, color:"#4a6272" }}>Zones shared · both venues track same price band</span>
          </div>
        </div>

        {/* ── COMBINED STATS ── */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:6, marginBottom:12 }}>
          {[
            ["TOTAL P&L", `${totalPnl>=0?"+":""}$${totalPnl.toFixed(2)}`, totalPnl>=0?"#00e676":"#ff3d3d"],
            ["WIN RATE", totalTrades>0?`${Math.round(totalWins/totalTrades*100)}%`:"--", "#f0f8ff"],
            ["TRADES", totalTrades, "#f0f8ff"],
            ["MEXC P&L", `+$${(ethMexc.pnl+xrpMexc.pnl).toFixed(0)}`, "#00c8ff"],
            ["HL P&L", `${(ethHL.pnl+xrpHL.pnl)>=0?"+":""}$${(ethHL.pnl+xrpHL.pnl).toFixed(0)}`, "#b388ff"],
          ].map(([label, val, color]) => (
            <div key={label as string} style={{ background:"#0e1519", border:"1px solid #162028", borderRadius:5, padding:"10px 8px", textAlign:"center" }}>
              <div style={{ fontSize:9, color:"#fff", textTransform:"uppercase", letterSpacing:1, marginBottom:3, fontWeight:700 }}>{label as string}</div>
              <div style={{ fontFamily:"'Bebas Neue'", fontSize:24, letterSpacing:1, color: color as string }}>{val}</div>
            </div>
          ))}
        </div>

        {/* ── VENUE COMPARE BARS ── */}
        <VenueCompareBar sym="ETH" mexcPnl={ethMexc.pnl} hlPnl={ethHL.pnl}
          mexcWR={Math.round(ethMexc.wins/ethMexc.trades*100)}
          hlWR={Math.round(ethHL.wins/ethHL.trades*100)} />
        <VenueCompareBar sym="XRP" mexcPnl={xrpMexc.pnl} hlPnl={xrpHL.pnl}
          mexcWR={Math.round(xrpMexc.wins/xrpMexc.trades*100)}
          hlWR={Math.round(xrpHL.wins/xrpHL.trades*100)} />

        {/* ── ETH ROW ── */}
        <div style={{ marginBottom:6, display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontFamily:"'Bebas Neue'", fontSize:14, letterSpacing:3, color:"#4a6272" }}>ETHEREUM</span>
          <div style={{ flex:1, height:1, background:"#162028" }} />
          {inOptimalETH && (
            <span style={{ fontSize:9, color:"#00e676", animation:"blink 1.5s infinite" }}>● OPTIMAL SESSION WINDOW</span>
          )}
          <span style={{ fontSize:9, color:"#4a6272" }}>Best: 04:00–12:00 UTC / 00:00–08:00 EDT</span>
        </div>
        <div style={{ display:"flex", gap:10, marginBottom:14 }}>
          <PairCard d={ethMexc} />
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", width:30, flexShrink:0 }}>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
              <div style={{ width:1, flex:1, background:"#162028" }} />
              <span style={{ fontSize:8, color:"#4a6272", transform:"rotate(0deg)", letterSpacing:1 }}>VS</span>
              <div style={{ width:1, flex:1, background:"#162028" }} />
            </div>
          </div>
          <PairCard d={ethHL} />
        </div>

        {/* ── XRP ROW ── */}
        <div style={{ marginBottom:6, display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontFamily:"'Bebas Neue'", fontSize:14, letterSpacing:3, color:"#4a6272" }}>RIPPLE</span>
          <div style={{ flex:1, height:1, background:"#162028" }} />
          {inOptimalXRP && (
            <span style={{ fontSize:9, color:"#00e676", animation:"blink 1.5s infinite" }}>● OPTIMAL SESSION WINDOW</span>
          )}
          <span style={{ fontSize:9, color:"#4a6272" }}>Best: 03:00 UTC / 23:00 EDT · 11:00 UTC / 07:00 EDT</span>
        </div>
        <div style={{ display:"flex", gap:10, marginBottom:14 }}>
          <PairCard d={xrpMexc} />
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", width:30, flexShrink:0 }}>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
              <div style={{ width:1, flex:1, background:"#162028" }} />
              <span style={{ fontSize:8, color:"#4a6272", letterSpacing:1 }}>VS</span>
              <div style={{ width:1, flex:1, background:"#162028" }} />
            </div>
          </div>
          <PairCard d={xrpHL} />
        </div>

        {/* ── FOOTER ── */}
        <div style={{
          borderTop:"1px solid #162028", paddingTop:8, display:"flex",
          justifyContent:"space-between", alignItems:"center",
        }}>
          <div style={{ fontSize:9, color:"#4a6272" }}>
            ETH $625K · XRP $500K · $25K margin · 0% maker MEXC · 0.015% maker HL · paper mode
          </div>
          <div style={{ fontSize:9, color:"#4a6272" }}>
            Zone-window oscillation · 0.39% TP (HL) · 0.096% TP (MEXC) · ZONE-WINDOW BUILD
          </div>
        </div>
      </div>
    </>
  );
}
