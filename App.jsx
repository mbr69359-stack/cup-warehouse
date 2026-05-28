import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set, get, remove } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAcnJ4ypfYoWFvWkg2RdoH_Bj6mcKCHnx0",
  authDomain: "cup-warehouse.firebaseapp.com",
  databaseURL: "https://cup-warehouse-default-rtdb.firebaseio.com",
  projectId: "cup-warehouse",
  storageBucket: "cup-warehouse.firebasestorage.app",
  messagingSenderId: "880251286432",
  appId: "1:880251286432:web:a8317b2449b4a10913aac5",
};
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const uid = () => Math.random().toString(36).slice(2, 10);
const fmtDate = (iso) => new Date(iso).toLocaleString("zh-CN", {
  month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit"
});
const fmtMoney = (n) => "¥" + Math.abs(n || 0).toLocaleString("zh-CN", { maximumFractionDigits: 0 });
const COLORS = ["#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#f97316","#ec4899"];

function Modal({ title, onClose, children }) {
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:"#1a1d2e",border:"1px solid #2a2d3e",borderRadius:20,width:"100%",maxWidth:480,padding:"28px 28px 24px",boxShadow:"0 24px 64px rgba(0,0,0,0.6)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <span style={{fontSize:16,fontWeight:700,color:"#f1f5f9"}}>{title}</span>
          <button onClick={onClose} style={{background:"transparent",border:"none",color:"#475569",cursor:"pointer",fontSize:20}}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{marginBottom:14}}>
      <div style={{fontSize:11,color:"#64748b",marginBottom:5,fontWeight:600,letterSpacing:.5}}>{label}</div>
      {children}
    </div>
  );
}

const inp = {width:"100%",background:"#0f1117",border:"1px solid #2a2d3e",borderRadius:10,padding:"9px 13px",color:"#f1f5f9",fontSize:14,outline:"none",boxSizing:"border-box"};
const Inp = (p) => <input style={inp} {...p}/>;
const Sel = ({children,...p}) => <select style={{...inp,cursor:"pointer"}} {...p}>{children}</select>;

function Btn({ children, onClick, color="#3b82f6", outline, sm, full, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{padding:sm?"6px 12px":"10px 20px",borderRadius:8,border:outline?`1px solid ${color}`:"none",background:outline?"transparent":color,color:outline?color:"#fff",fontWeight:600,fontSize:sm?11:14,cursor:disabled?"not-allowed":"pointer",opacity:disabled?0.5:1,width:full?"100%":undefined,transition:"all .15s"}}>{children}</button>
  );
}

function useToast() {
  const [toast, setToast] = useState(null);
  const show = (text, ok=true) => { setToast({text,ok}); setTimeout(()=>setToast(null),2600); };
  return [toast, show];
}

function TblHeader({ cols, widths }) {
  const gc = widths ? widths.join(" ") : `repeat(${cols.length},1fr)`;
  return (
    <div style={{display:"grid",gridTemplateColumns:gc,padding:"10px 20px",background:"#141720",borderBottom:"1px solid #2a2d3e",fontSize:11,color:"#475569",fontWeight:700,letterSpacing:.5,gap:8}}>
      {cols.map((c,i)=><span key={i}>{c}</span>)}
    </div>
  );
}

function TblRow({ cols, widths }) {
  const [hov,setHov]=useState(false);
  const gc = widths ? widths.join(" ") : `repeat(${cols.length},1fr)`;
  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{display:"grid",gridTemplateColumns:gc,padding:"11px 20px",gap:8,borderBottom:"1px solid #1a1d2e",background:hov?"#1e2234":"transparent",transition:"background .15s",alignItems:"center"}}>
      {cols.map((c,i)=><div key={i} style={{fontSize:13}}>{c}</div>)}
    </div>
  );
}

function Empty({ text }) {
  return <div style={{textAlign:"center",color:"#475569",padding:"36px 0",fontSize:13}}>{text}</div>;
}

function KPI({ label, value, unit, color, icon }) {
  return (
    <div style={{background:"#1a1d2e",border:`1px solid ${color}22`,borderRadius:14,padding:"18px 20px",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:14,right:16,fontSize:26,opacity:.12}}>{icon}</div>
      <div style={{fontSize:11,color:"#64748b",marginBottom:6,fontWeight:600,letterSpacing:.5}}>{label}</div>
      <div style={{display:"flex",alignItems:"baseline",gap:5}}>
        <span style={{fontSize:24,fontWeight:800,color}}>{value}</span>
        <span style={{fontSize:12,color:"#475569"}}>{unit}</span>
      </div>
    </div>
  );
}

function WHCard({ wh, stock, onClick, onEdit, onDelete }) {
  const [hov,setHov]=useState(false);
  return (
    <div onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{background:"#1a1d2e",border:`1px solid ${hov?wh.color+"88":wh.color+"33"}`,borderRadius:14,padding:"18px",cursor:"pointer",transition:"all .2s",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${wh.color},${wh.color}44)`}}/>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between"}}>
        <div style={{width:36,height:36,borderRadius:9,background:wh.color+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🏭</div>
        <div style={{display:"flex",gap:4}} onClick={e=>e.stopPropagation()}>
          <button onClick={onEdit} style={{padding:"3px 8px",borderRadius:6,border:"1px solid #2a2d3e",background:"transparent",color:"#94a3b8",cursor:"pointer",fontSize:11,fontWeight:600}}>编辑</button>
          <button onClick={onDelete} style={{padding:"3px 8px",borderRadius:6,border:"1px solid #ef444433",background:"transparent",color:"#ef4444",cursor:"pointer",fontSize:11,fontWeight:600}}>删除</button>
        </div>
      </div>
      <div style={{marginTop:12,fontSize:15,fontWeight:700,color:"#f1f5f9"}}>{wh.name}</div>
      <div style={{fontSize:11,color:"#475569",marginTop:3}}>{wh.desc||"—"}</div>
      <div style={{marginTop:14,display:"flex",alignItems:"baseline",gap:4}}>
        <span style={{fontSize:24,fontWeight:800,color:wh.color}}>{stock.toLocaleString()}</span>
        <span style={{fontSize:11,color:"#475569"}}>只</span>
      </div>
      <div style={{marginTop:6,fontSize:10,color:wh.color}}>进入 →</div>
    </div>
  );
}

function AddCard({ onClick, label }) {
  const [hov,setHov]=useState(false);
  return (
    <div onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{border:"2px dashed",borderColor:hov?"#3b82f6":"#2a2d3e",borderRadius:14,padding:"18px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10,minHeight:140,transition:"all .2s",color:hov?"#3b82f6":"#475569"}}>
      <span style={{fontSize:28}}>＋</span>
      <span style={{fontSize:13,fontWeight:600}}>{label}</span>
    </div>
  );
}

function LineChart({ data, color="#3b82f6" }) {
  const W=400,H=140,pL=38,pB=26,pT=14,pR=10;
  const maxV=Math.max(...data.map(d=>d.value),1);
  const px=(i)=>pL+(i/(data.length-1))*(W-pL-pR);
  const py=(v)=>pT+(1-v/maxV)*(H-pT-pB);
  const pts=data.map((d,i)=>({x:px(i),y:py(d.value),...d}));
  const polyline=pts.map(p=>`${p.x},${p.y}`).join(" ");
  const area=`M${pts[0].x},${H-pB} ${pts.map(p=>`L${p.x},${p.y}`).join(" ")} L${pts[pts.length-1].x},${H-pB} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",height:"auto",display:"block"}}>
      {[0,.5,1].map((f,i)=>{
        const y=pT+f*(H-pT-pB);
        return <g key={i}><line x1={pL} y1={y} x2={W-pR} y2={y} stroke="#2a2d3e" strokeWidth={1}/><text x={pL-4} y={y+4} fill="#475569" fontSize={9} textAnchor="end">{Math.round((1-f)*maxV)}</text></g>;
      })}
      <path d={area} fill={color} opacity={0.12}/>
      <polyline points={polyline} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round"/>
      {pts.map((p,i)=>(
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={3} fill={color}/>
          <text x={p.x} y={H-pB+12} fill="#64748b" fontSize={9} textAnchor="middle">{p.label}</text>
          {p.value>0&&<text x={p.x} y={p.y-6} fill={color} fontSize={9} textAnchor="middle">{p.value}</text>}
        </g>
      ))}
    </svg>
  );
}

function BarChart({ data, color="#f59e0b" }) {
  if(!data||data.length===0) return <Empty text="暂无数据"/>;
  const W=400,H=150,pL=8,pB=34,pT=18,pR=8;
  const maxV=Math.max(...data.map(d=>d.value),1);
  const n=data.length;
  const slotW=(W-pL-pR)/n;
  const barW=Math.min(slotW*0.6,34);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",height:"auto",display:"block"}}>
      {[0,.5,1].map((f,i)=>{
        const y=pT+f*(H-pT-pB);
        return <line key={i} x1={pL} y1={y} x2={W-pR} y2={y} stroke="#2a2d3e" strokeWidth={1}/>;
      })}
      {data.map((d,i)=>{
        const bh=Math.max((d.value/maxV)*(H-pT-pB),2);
        const x=pL+i*slotW+slotW/2-barW/2;
        const y=H-pB-bh;
        const lbl=d.label.length>8?d.label.slice(0,7)+"…":d.label;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={bh} fill={color} rx={3} opacity={0.85}/>
            <text x={x+barW/2} y={H-pB+13} fill="#64748b" fontSize={8} textAnchor="middle">{lbl}</text>
            <text x={x+barW/2} y={y-4} fill={color} fontSize={9} textAnchor="middle">{d.value}</text>
          </g>
        );
      })}
    </svg>
  );
}

const REC_COLS = "78px 62px 98px 44px 1fr 68px 68px 34px";

function RecordsTable({ records, title, showWH, full, onDelete }) {
  const [filter,setFilter]=useState("all");
  const [search,setSearch]=useState("");
  const filtered=records.filter(r=>{
    const mt=filter==="all"||r.type===filter;
    const ms=!search||r.skuCode?.includes(search.toUpperCase())||r.note?.includes(search)||r.supplier?.includes(search)||r.whName?.includes(search);
    return mt&&ms;
  });
  return (
    <div style={{background:"#1a1d2e",border:"1px solid #2a2d3e",borderRadius:16,overflow:"hidden"}}>
      <div style={{padding:"14px 20px",borderBottom:"1px solid #2a2d3e",display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,flexWrap:"wrap"}}>
        <span style={{fontWeight:600,color:"#f1f5f9",fontSize:14}}>{title} <span style={{color:"#475569",fontWeight:400,fontSize:12}}>({filtered.length})</span></span>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="搜索…" style={{...inp,width:130,padding:"5px 10px",fontSize:12}}/>
          {["all","in","out"].map(f=>(
            <button key={f} onClick={()=>setFilter(f)} style={{padding:"4px 10px",borderRadius:6,border:"1px solid",fontSize:11,fontWeight:600,cursor:"pointer",borderColor:filter===f?"#3b82f6":"#2a2d3e",background:filter===f?"rgba(59,130,246,.15)":"transparent",color:filter===f?"#3b82f6":"#64748b"}}>
              {f==="all"?"全部":f==="in"?"入库":"出库"}
            </button>
          ))}
        </div>
      </div>
      <div style={full?{maxHeight:560,overflowY:"auto"}:{}}>
        {filtered.length===0&&<Empty text="暂无记录"/>}
        {filtered.map((r,i)=>(
          <div key={r.id} style={{display:"grid",gridTemplateColumns:REC_COLS,padding:"11px 20px",gap:8,borderBottom:i<filtered.length-1?"1px solid #141720":"none",alignItems:"center",fontSize:12}}>
            <span style={{color:"#475569"}}>{fmtDate(r.date)}</span>
            <span style={{fontWeight:600,fontSize:10,color:r.type==="in"?"#10b981":"#f59e0b",background:r.type==="in"?"rgba(16,185,129,.1)":"rgba(245,158,11,.1)",padding:"2px 5px",borderRadius:20,textAlign:"center"}}>{r.type==="in"?"⬇入库":"⬆出库"}</span>
            <code style={{color:"#60a5fa",fontSize:11}}>{r.skuCode}</code>
            <span style={{fontWeight:700,color:r.type==="in"?"#10b981":"#f59e0b"}}>{r.type==="in"?"+":"-"}{r.qty}</span>
            <span style={{color:"#94a3b8",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
              {[r.note,r.supplier].filter(Boolean).join(" · ")||"—"}
              {showWH&&r.whName&&<span style={{color:"#3b82f6",marginLeft:4}}>[{r.whName}]</span>}
            </span>
            <span style={{color:"#64748b",fontSize:11}}>{r.price>0?`¥${r.price}`:"—"}</span>
            <span style={{fontWeight:600,color:"#f1f5f9",textAlign:"right",fontSize:11}}>余{r.stockAfter}</span>
            {onDelete
              ? <button onClick={()=>onDelete(r)} style={{padding:"2px 5px",borderRadius:5,border:"1px solid #ef444433",background:"transparent",color:"#ef4444",cursor:"pointer",fontSize:10,fontWeight:600,textAlign:"center"}}>删除</button>
              : <span/>}
          </div>
        ))}
      </div>
    </div>
  );
}

function WHModal({ form, setForm, onSave, onClose, editMode }) {
  return (
    <Modal title={editMode?"编辑仓库":"添加仓库"} onClose={onClose}>
      <Field label="仓库名称 *"><Inp value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="如：成品仓、原料仓…"/></Field>
      <Field label="描述"><Inp value={form.desc} onChange={e=>setForm(f=>({...f,desc:e.target.value}))} placeholder="简单描述（可选）"/></Field>
      <Field label="标识颜色">
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {COLORS.map(c=><div key={c} onClick={()=>setForm(f=>({...f,color:c}))} style={{width:28,height:28,borderRadius:8,background:c,cursor:"pointer",border:form.color===c?"3px solid #fff":"3px solid transparent",transition:"border .15s"}}/>)}
        </div>
      </Field>
      <div style={{marginTop:20}}><Btn full onClick={onSave} color={form.color}>{editMode?"保存修改":"确认添加"}</Btn></div>
    </Modal>
  );
}

function SKUModal({ form, setForm, onSave, onClose, editMode }) {
  return (
    <Modal title={editMode?"编辑型号":"添加杯子型号"} onClose={onClose}>
      <Field label="型号编号 * （如：25001-1-C）">
        <Inp value={form.code} onChange={e=>setForm(f=>({...f,code:e.target.value}))} placeholder="25001-1-C" disabled={editMode} style={{...inp,opacity:editMode?0.6:1}}/>
      </Field>
      <Field label="型号名称"><Inp value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="如：马克杯A款"/></Field>
      <Field label="单位">
        <Sel value={form.unit} onChange={e=>setForm(f=>({...f,unit:e.target.value}))}>
          <option value="只">只</option><option value="个">个</option><option value="件">件</option><option value="箱">箱</option>
        </Sel>
      </Field>
      <Field label="库存预警值（全仓合计低于此值时显示红色预警）">
        <Inp type="number" value={form.alertThreshold||""} onChange={e=>setForm(f=>({...f,alertThreshold:e.target.value?parseInt(e.target.value):0}))} placeholder="0 = 不开启预警"/>
      </Field>
      <div style={{marginTop:20}}><Btn full onClick={onSave}>{editMode?"保存修改":"确认添加"}</Btn></div>
    </Modal>
  );
}

function TxModal({ form, setForm, warehouses, skus, stock, onSave, onClose }) {
  const curStock=form.whId&&form.skuId?(stock[form.whId]?.[form.skuId]||0):null;
  const qty=parseInt(form.qty)||0;
  const afterStock=curStock!==null?(form.type==="in"?curStock+qty:curStock-qty):null;
  return (
    <Modal title="入库 / 出库操作" onClose={onClose}>
      <div style={{display:"flex",gap:8,marginBottom:16}}>
        {[{v:"in",label:"⬇ 入库（补货）",c:"#10b981"},{v:"out",label:"⬆ 出库（发货）",c:"#f59e0b"}].map(t=>(
          <button key={t.v} onClick={()=>setForm(f=>({...f,type:t.v}))} style={{flex:1,padding:"10px",borderRadius:10,cursor:"pointer",border:`2px solid ${form.type===t.v?t.c:"#2a2d3e"}`,background:form.type===t.v?t.c+"15":"transparent",color:form.type===t.v?t.c:"#64748b",fontWeight:600,fontSize:13}}>{t.label}</button>
        ))}
      </div>
      <Field label="仓库 *">
        <Sel value={form.whId} onChange={e=>setForm(f=>({...f,whId:e.target.value}))}>
          <option value="">— 选择仓库 —</option>
          {warehouses.map(w=><option key={w.id} value={w.id}>{w.name}</option>)}
        </Sel>
      </Field>
      <Field label="杯子型号 *">
        <Sel value={form.skuId} onChange={e=>setForm(f=>({...f,skuId:e.target.value}))}>
          <option value="">— 选择型号 —</option>
          {skus.map(s=><option key={s.id} value={s.id}>{s.code}  {s.name}</option>)}
        </Sel>
      </Field>
      {curStock!==null&&<div style={{fontSize:12,color:"#64748b",marginBottom:12,marginTop:-6}}>当前库存：<strong style={{color:"#3b82f6"}}>{curStock} 只</strong></div>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <Field label="数量 *"><Inp type="number" value={form.qty} onChange={e=>setForm(f=>({...f,qty:e.target.value}))} placeholder="0"/></Field>
        <Field label={form.type==="in"?"进货单价（元）":"销售单价（元）"}>
          <Inp type="number" value={form.price||""} onChange={e=>setForm(f=>({...f,price:e.target.value}))} placeholder="选填"/>
        </Field>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <Field label="供应商 / 客户"><Inp value={form.supplier} onChange={e=>setForm(f=>({...f,supplier:e.target.value}))} placeholder="选填"/></Field>
        <Field label="备注"><Inp value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))} placeholder="批次号、订单号…"/></Field>
      </div>
      {afterStock!==null&&qty>0&&(
        <div style={{padding:"10px 14px",borderRadius:10,marginBottom:14,fontSize:13,background:form.type==="out"&&afterStock<0?"rgba(239,68,68,.1)":"rgba(59,130,246,.08)",border:form.type==="out"&&afterStock<0?"1px solid #ef444433":"1px solid #3b82f622",color:form.type==="out"&&afterStock<0?"#ef4444":"#94a3b8"}}>
          操作后库存：<strong style={{fontSize:15,color:afterStock<0?"#ef4444":"#f1f5f9"}}>{afterStock} 只</strong>
          {afterStock<0&&" ⚠ 库存不足！"}
        </div>
      )}
      <Btn full onClick={onSave} color={form.type==="in"?"#10b981":"#f59e0b"}>确认{form.type==="in"?"入库":"出库"}</Btn>
    </Modal>
  );
}

function AnalyticsPage({ data, skuList }) {
  const [period,setPeriod]=useState("week");
  const now=new Date();
  const startDate=period==="today"
    ?new Date(now.getFullYear(),now.getMonth(),now.getDate())
    :period==="week"
    ?new Date(now.getTime()-7*24*60*60*1000)
    :new Date(now.getFullYear(),now.getMonth(),1);

  const recList=Object.values(data.records).sort((a,b)=>new Date(b.date)-new Date(a.date));
  const filteredRecs=recList.filter(r=>new Date(r.date)>=startDate);
  const outRecs=filteredRecs.filter(r=>r.type==="out");

  const totalOutQty=outRecs.reduce((s,r)=>s+r.qty,0);
  const totalRevenue=outRecs.reduce((s,r)=>s+r.qty*(r.price||0),0);

  const avgCostBySku={};
  recList.filter(r=>r.type==="in"&&r.price>0).forEach(r=>{
    if(!avgCostBySku[r.skuId]) avgCostBySku[r.skuId]={qty:0,cost:0};
    avgCostBySku[r.skuId].qty+=r.qty;
    avgCostBySku[r.skuId].cost+=r.qty*(r.price||0);
  });
  const getAvgCost=(skuId)=>{const d=avgCostBySku[skuId];return d&&d.qty>0?d.cost/d.qty:0;};

  const totalCost=outRecs.reduce((s,r)=>s+getAvgCost(r.skuId)*r.qty,0);
  const grossProfit=totalRevenue-totalCost;

  const trend7=Array.from({length:7},(_,i)=>{
    const d=new Date(now);
    d.setDate(d.getDate()-(6-i));
    const dayStart=new Date(d.getFullYear(),d.getMonth(),d.getDate());
    const dayEnd=new Date(dayStart.getTime()+86400000);
    const label=`${String(d.getMonth()+1).padStart(2,"0")}/${String(d.getDate()).padStart(2,"0")}`;
    const value=recList.filter(r=>r.type==="out"&&new Date(r.date)>=dayStart&&new Date(r.date)<dayEnd).reduce((s,r)=>s+r.qty,0);
    return {label,value};
  });

  const skuOutMap={};
  outRecs.forEach(r=>{skuOutMap[r.skuCode]=(skuOutMap[r.skuCode]||0)+r.qty;});
  const topProducts=Object.entries(skuOutMap).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([label,value])=>({label,value}));

  const skuProfits=skuList.map(sku=>{
    const avgCost=getAvgCost(sku.id);
    const periodOut=outRecs.filter(r=>r.skuId===sku.id);
    const outQty=periodOut.reduce((s,r)=>s+r.qty,0);
    const revenue=periodOut.reduce((s,r)=>s+r.qty*(r.price||0),0);
    const cost=avgCost*outQty;
    const profit=revenue-cost;
    return {sku,avgCost,outQty,revenue,cost,profit};
  }).filter(p=>p.outQty>0).sort((a,b)=>b.profit-a.profit);

  const pLabel={today:"今日",week:"近7天",month:"本月"}[period];
  const profitColW=["110px","1fr","60px","70px","82px","78px","78px"];

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div style={{fontSize:16,fontWeight:700,color:"#f1f5f9"}}>数据分析</div>
        <div style={{display:"flex",gap:8}}>
          {[["today","今日"],["week","近7天"],["month","本月"]].map(([v,l])=>(
            <button key={v} onClick={()=>setPeriod(v)} style={{padding:"5px 14px",borderRadius:8,border:"1px solid",fontSize:12,fontWeight:600,cursor:"pointer",borderColor:period===v?"#3b82f6":"#2a2d3e",background:period===v?"rgba(59,130,246,.15)":"transparent",color:period===v?"#3b82f6":"#64748b"}}>{l}</button>
          ))}
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:24}}>
        <KPI label={`${pLabel}出货量`} value={totalOutQty.toLocaleString()} unit="只" color="#f59e0b" icon="⬆️"/>
        <KPI label={`${pLabel}销售收入`} value={fmtMoney(Math.round(totalRevenue))} unit="" color="#3b82f6" icon="💰"/>
        <KPI label={`${pLabel}货物成本`} value={fmtMoney(Math.round(totalCost))} unit="" color="#ef4444" icon="📦"/>
        <KPI label={`${pLabel}毛利润`} value={(grossProfit<0?"-":"")+fmtMoney(Math.round(grossProfit))} unit="" color={grossProfit>=0?"#10b981":"#ef4444"} icon="📈"/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:24}}>
        <div style={{background:"#1a1d2e",border:"1px solid #2a2d3e",borderRadius:16,padding:"18px 20px"}}>
          <div style={{fontSize:13,fontWeight:700,color:"#f1f5f9",marginBottom:14}}>近7天出货趋势（只）</div>
          <LineChart data={trend7} color="#3b82f6"/>
        </div>
        <div style={{background:"#1a1d2e",border:"1px solid #2a2d3e",borderRadius:16,padding:"18px 20px"}}>
          <div style={{fontSize:13,fontWeight:700,color:"#f1f5f9",marginBottom:14}}>畅销产品排行 · {pLabel}出货量</div>
          {topProducts.length===0?<Empty text="暂无出货记录"/>:<BarChart data={topProducts} color="#f59e0b"/>}
        </div>
      </div>
      <div style={{background:"#1a1d2e",border:"1px solid #2a2d3e",borderRadius:16,overflow:"hidden"}}>
        <div style={{padding:"14px 20px",borderBottom:"1px solid #2a2d3e",display:"flex",alignItems:"center",gap:12}}>
          <span style={{fontSize:14,fontWeight:600,color:"#f1f5f9"}}>各型号利润分析 · {pLabel}</span>
          {totalRevenue>0&&<span style={{fontSize:12,color:"#64748b"}}>毛利合计：<span style={{color:grossProfit>=0?"#10b981":"#ef4444",fontWeight:700}}>{(grossProfit<0?"-":"")+fmtMoney(Math.round(grossProfit))}</span></span>}
        </div>
        <TblHeader cols={["型号","名称","出货量","均进价","销售收入","货物成本","毛利润"]} widths={profitColW}/>
        {skuProfits.length===0&&<Empty text="暂无出货记录"/>}
        {skuProfits.map(p=>(
          <TblRow key={p.sku.id} cols={[
            <code style={{color:"#3b82f6",fontSize:12}}>{p.sku.code}</code>,
            <span style={{color:"#e2e8f0"}}>{p.sku.name}</span>,
            <span style={{color:"#f59e0b",fontWeight:600}}>{p.outQty}</span>,
            <span style={{color:"#94a3b8",fontSize:11}}>{p.avgCost>0?`¥${p.avgCost.toFixed(1)}`:"—"}</span>,
            <span style={{color:"#3b82f6"}}>{fmtMoney(Math.round(p.revenue))}</span>,
            <span style={{color:"#ef4444"}}>{fmtMoney(Math.round(p.cost))}</span>,
            <span style={{color:p.profit>=0?"#10b981":"#ef4444",fontWeight:700}}>{(p.profit<0?"-":"")+fmtMoney(Math.round(p.profit))}</span>
          ]} widths={profitColW}/>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [data,setData]=useState({warehouses:{},skus:{},stock:{},records:{}});
  const [loading,setLoading]=useState(true);
  const [tab,setTab]=useState("overview");
  const [modalWH,setModalWH]=useState(false);
  const [modalSKU,setModalSKU]=useState(false);
  const [modalTx,setModalTx]=useState(false);
  const [selWH,setSelWH]=useState(null);
  const [toast,showToast]=useToast();
  const [whForm,setWhForm]=useState({name:"",desc:"",color:COLORS[0]});
  const [skuForm,setSkuForm]=useState({code:"",name:"",unit:"只",alertThreshold:0});
  const [txForm,setTxForm]=useState({type:"in",whId:"",skuId:"",qty:"",note:"",supplier:"",price:""});
  const [editingWH,setEditingWH]=useState(null);
  const [editingSKU,setEditingSKU]=useState(null);

  useEffect(()=>{
    const dbRef=ref(db,"/");
    const unsub=onValue(dbRef,(snap)=>{
      const val=snap.val()||{};
      setData({warehouses:val.warehouses||{},skus:val.skus||{},stock:val.stock||{},records:val.records||{}});
      setLoading(false);
    });
    return ()=>unsub();
  },[]);

  useEffect(()=>{
    if(loading) return;
    if(Object.keys(data.warehouses).length===0){
      const wh1="wh_"+uid(),wh2="wh_"+uid(),sku1="sku_"+uid(),sku2="sku_"+uid();
      set(ref(db,"/"),{
        warehouses:{[wh1]:{id:wh1,name:"主仓库",desc:"总公司主仓",color:"#3b82f6"},[wh2]:{id:wh2,name:"成品仓",desc:"发货专用仓",color:"#10b981"}},
        skus:{[sku1]:{id:sku1,code:"25001-1-C",name:"马克杯A款",unit:"只"},[sku2]:{id:sku2,code:"25001-2-C",name:"保温杯B款",unit:"只"}},
        stock:{[wh1]:{[sku1]:500,[sku2]:300},[wh2]:{[sku1]:200,[sku2]:100}},
        records:{},
      });
    }
  },[loading]);

  const addWarehouse=()=>{
    if(!whForm.name.trim()) return showToast("仓库名不能为空",false);
    const id="wh_"+uid();
    set(ref(db,`warehouses/${id}`),{id,...whForm});
    setWhForm({name:"",desc:"",color:COLORS[0]});setModalWH(false);showToast("仓库添加成功 ✓");
  };

  const saveWarehouse=()=>{
    if(!whForm.name.trim()) return showToast("仓库名不能为空",false);
    const existing=data.warehouses[editingWH];
    set(ref(db,`warehouses/${editingWH}`),{...existing,...whForm});
    setEditingWH(null);showToast("仓库已更新 ✓");
  };

  const deleteWarehouse=async(whId)=>{
    const wh=data.warehouses[whId];
    if(!window.confirm(`确认删除仓库"${wh?.name}"？\n该仓库的库存数据将被清除，历史记录保留。`)) return;
    await remove(ref(db,`warehouses/${whId}`));
    await remove(ref(db,`stock/${whId}`));
    if(selWH===whId) setSelWH(null);
    showToast("仓库已删除 ✓");
  };

  const openEditWH=(wh)=>{
    setWhForm({name:wh.name,desc:wh.desc||"",color:wh.color});
    setEditingWH(wh.id);
  };

  const addSKU=()=>{
    if(!skuForm.code.trim()) return showToast("编号不能为空",false);
    if(Object.values(data.skus).find(s=>s.code===skuForm.code.trim().toUpperCase())) return showToast("编号已存在",false);
    const id="sku_"+uid();
    set(ref(db,`skus/${id}`),{id,...skuForm,code:skuForm.code.trim().toUpperCase()});
    setSkuForm({code:"",name:"",unit:"只",alertThreshold:0});setModalSKU(false);showToast("型号添加成功 ✓");
  };

  const saveSKU=()=>{
    const existing=data.skus[editingSKU];
    set(ref(db,`skus/${editingSKU}`),{...existing,name:skuForm.name,unit:skuForm.unit,alertThreshold:skuForm.alertThreshold||0});
    setEditingSKU(null);showToast("型号已更新 ✓");
  };

  const deleteSKU=async(skuId)=>{
    const sku=data.skus[skuId];
    if(!window.confirm(`确认删除型号"${sku?.code} ${sku?.name}"？\n所有仓库中该型号的库存将被清除，历史记录保留。`)) return;
    await remove(ref(db,`skus/${skuId}`));
    for(const whId of Object.keys(data.stock)){
      if(data.stock[whId]?.[skuId]!==undefined) await remove(ref(db,`stock/${whId}/${skuId}`));
    }
    showToast("型号已删除 ✓");
  };

  const openEditSKU=(sku)=>{
    setSkuForm({code:sku.code,name:sku.name||"",unit:sku.unit||"只",alertThreshold:sku.alertThreshold||0});
    setEditingSKU(sku.id);
  };

  const submitTx=async()=>{
    const qty=parseInt(txForm.qty);
    if(!txForm.whId) return showToast("请选择仓库",false);
    if(!txForm.skuId) return showToast("请选择型号",false);
    if(!qty||qty<=0) return showToast("数量无效",false);
    const snap=await get(ref(db,`stock/${txForm.whId}/${txForm.skuId}`));
    const curStock=snap.val()||0;
    if(txForm.type==="out"&&qty>curStock) return showToast("库存不足！",false);
    const newQty=txForm.type==="in"?curStock+qty:curStock-qty;
    const sku=data.skus[txForm.skuId],wh=data.warehouses[txForm.whId];
    const recId="rec_"+uid();
    const price=parseFloat(txForm.price)||0;
    await set(ref(db,`stock/${txForm.whId}/${txForm.skuId}`),newQty);
    await set(ref(db,`records/${recId}`),{id:recId,date:new Date().toISOString(),type:txForm.type,whId:txForm.whId,whName:wh.name,skuId:txForm.skuId,skuCode:sku.code,skuName:sku.name,qty,note:txForm.note,supplier:txForm.supplier,price,stockAfter:newQty});
    setTxForm(f=>({...f,qty:"",note:"",supplier:"",price:""}));setModalTx(false);
    showToast(`${txForm.type==="in"?"入库":"出库"} ${qty} 只 [${sku.code}] ✓`);
  };

  const deleteRecord=async(rec)=>{
    if(!window.confirm(`确认删除此记录？\n库存将回滚：${rec.type==="in"?"减少":"增加"} ${rec.qty} 只 [${rec.skuCode}]`)) return;
    const snap=await get(ref(db,`stock/${rec.whId}/${rec.skuId}`));
    const curStock=snap.val()||0;
    const newStock=rec.type==="in"?curStock-rec.qty:curStock+rec.qty;
    if(newStock<0){showToast("回滚后库存将为负，无法删除",false);return;}
    await set(ref(db,`stock/${rec.whId}/${rec.skuId}`),newStock);
    await remove(ref(db,`records/${rec.id}`));
    showToast("记录已删除，库存已回滚 ✓");
  };

  const whList=Object.values(data.warehouses);
  const skuList=Object.values(data.skus);
  const recList=Object.values(data.records).sort((a,b)=>new Date(b.date)-new Date(a.date));
  const totalStock=(whId)=>Object.values(data.stock[whId]||{}).reduce((s,v)=>s+(v||0),0);
  const grandTotal=whList.reduce((s,w)=>s+totalStock(w.id),0);
  const totalIn=recList.filter(r=>r.type==="in").reduce((s,r)=>s+r.qty,0);
  const totalOut=recList.filter(r=>r.type==="out").reduce((s,r)=>s+r.qty,0);
  const skuStockAll=(skuId)=>whList.reduce((s,w)=>s+(data.stock[w.id]?.[skuId]||0),0);
  const alertedSKUs=skuList.filter(sku=>sku.alertThreshold>0&&skuStockAll(sku.id)<sku.alertThreshold);
  const skuColW=["110px","1fr","52px",...whList.map(()=>"68px"),"62px","62px","88px"];

  const tabs=[
    {key:"overview",icon:"📊",label:"总览"},
    {key:"warehouses",icon:"🏭",label:"仓库"},
    {key:"skus",icon:"🥤",label:"型号"},
    {key:"records",icon:"📋",label:"记录"},
    {key:"analysis",icon:"📈",label:"分析"},
  ];

  if(loading) return (
    <div style={{minHeight:"100vh",background:"#0c0e17",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16}}>
      <div style={{width:48,height:48,border:"4px solid #2a2d3e",borderTop:"4px solid #3b82f6",borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
      <div style={{color:"#64748b",fontSize:14}}>正在连接云端数据库...</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if(selWH){
    const wh=data.warehouses[selWH];
    if(!wh){setSelWH(null);return null;}
    const whStock=data.stock[selWH]||{};
    return (
      <div style={{minHeight:"100vh",background:"#0c0e17",color:"#e8e8e8",fontFamily:"'Noto Sans SC','PingFang SC',sans-serif"}}>
        <header style={{background:"#12151f",borderBottom:"1px solid #1e2235",padding:"0 28px",display:"flex",alignItems:"center",justifyContent:"space-between",height:60,position:"sticky",top:0,zIndex:200}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:34,height:34,background:"linear-gradient(135deg,#3b82f6,#06b6d4)",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🥤</div>
            <div><div style={{fontWeight:700,fontSize:14}}>杯业仓储管理系统</div><div style={{fontSize:10,color:"#10b981"}}>● 云端实时同步</div></div>
          </div>
          <Btn sm outline color="#10b981" onClick={()=>{setTxForm(f=>({...f,whId:selWH}));setModalTx(true);}}>⬇⬆ 入出库</Btn>
        </header>
        {alertedSKUs.length>0&&(
          <div style={{background:"rgba(239,68,68,0.1)",borderBottom:"1px solid #ef444430",padding:"8px 28px",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
            <span style={{color:"#ef4444",fontWeight:700,fontSize:13}}>⚠ 库存预警：</span>
            {alertedSKUs.map(sku=>(
              <span key={sku.id} style={{fontSize:12,color:"#ef4444",background:"rgba(239,68,68,0.1)",padding:"2px 10px",borderRadius:20,border:"1px solid #ef444430"}}>
                {sku.code} 仅剩 {skuStockAll(sku.id)} {sku.unit}（预警值 {sku.alertThreshold}）
              </span>
            ))}
          </div>
        )}
        <main style={{flex:1,padding:"24px 28px",maxWidth:1200,width:"100%",margin:"0 auto",boxSizing:"border-box"}}>
          <button onClick={()=>setSelWH(null)} style={{display:"flex",alignItems:"center",gap:8,background:"transparent",border:"none",color:"#64748b",cursor:"pointer",fontSize:13,marginBottom:20,padding:0}}>← 返回仓库列表</button>
          <div style={{background:"#1a1d2e",border:`1px solid ${wh.color}44`,borderRadius:16,padding:"20px 24px",marginBottom:24,display:"flex",alignItems:"center",gap:16}}>
            <div style={{width:48,height:48,borderRadius:12,background:wh.color+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>🏭</div>
            <div style={{flex:1}}><div style={{fontSize:18,fontWeight:700,color:"#f1f5f9"}}>{wh.name}</div><div style={{fontSize:13,color:"#64748b",marginTop:2}}>{wh.desc||"—"}</div></div>
            <div style={{textAlign:"right"}}><div style={{fontSize:28,fontWeight:800,color:wh.color}}>{totalStock(selWH).toLocaleString()}</div><div style={{fontSize:12,color:"#64748b"}}>总库存（只）</div></div>
          </div>
          <div style={{background:"#1a1d2e",border:"1px solid #2a2d3e",borderRadius:16,overflow:"hidden",marginBottom:24}}>
            <div style={{padding:"14px 20px",borderBottom:"1px solid #2a2d3e",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontWeight:600,color:"#f1f5f9",fontSize:14}}>各型号库存</span>
              <Btn sm onClick={()=>{setTxForm(f=>({...f,whId:selWH}));setModalTx(true);}}>+ 入出库</Btn>
            </div>
            <TblHeader cols={["型号编号","名称","当前库存","单位"]}/>
            {skuList.length===0&&<Empty text="暂无型号"/>}
            {skuList.map(sku=>{
              const qty=whStock[sku.id]||0;
              const isAlert=sku.alertThreshold>0&&skuStockAll(sku.id)<sku.alertThreshold;
              return <TblRow key={sku.id} cols={[
                <code style={{color:"#3b82f6",fontFamily:"monospace",fontSize:13}}>{sku.code}</code>,
                <span style={{color:"#e2e8f0"}}>{sku.name}</span>,
                <span style={{fontWeight:700,color:isAlert?"#ef4444":qty>0?"#f1f5f9":"#ef4444",fontSize:15}}>{qty.toLocaleString()}{isAlert?" ⚠":""}</span>,
                <span style={{color:"#64748b"}}>{sku.unit}</span>
              ]}/>;
            })}
          </div>
          <RecordsTable records={recList.filter(r=>r.whId===selWH)} title={`${wh.name} 操作记录`} showWH={false} onDelete={deleteRecord}/>
        </main>
        {toast&&<div style={{position:"fixed",top:72,right:20,zIndex:999,background:toast.ok?"#10b981":"#ef4444",color:"#fff",padding:"10px 18px",borderRadius:10,fontWeight:600,fontSize:13}}>{toast.text}</div>}
        {modalTx&&<TxModal form={txForm} setForm={setTxForm} warehouses={whList} skus={skuList} stock={data.stock} onSave={submitTx} onClose={()=>setModalTx(false)}/>}
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;600;700;800&display=swap');*{box-sizing:border-box;}input[type=number]{-moz-appearance:textfield;}input::-webkit-inner-spin-button{-webkit-appearance:none;}select option{background:#1a1d2e;}`}</style>
      </div>
    );
  }

  return (
    <div style={{minHeight:"100vh",background:"#0c0e17",color:"#e8e8e8",fontFamily:"'Noto Sans SC','PingFang SC',sans-serif",display:"flex",flexDirection:"column"}}>
      <header style={{background:"#12151f",borderBottom:"1px solid #1e2235",padding:"0 28px",display:"flex",alignItems:"center",justifyContent:"space-between",height:60,position:"sticky",top:0,zIndex:200}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:34,height:34,background:"linear-gradient(135deg,#3b82f6,#06b6d4)",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🥤</div>
          <div><div style={{fontWeight:700,fontSize:14,letterSpacing:.5}}>杯业仓储管理系统</div><div style={{fontSize:10,color:"#10b981",letterSpacing:.5}}>● 云端实时同步</div></div>
        </div>
        <nav style={{display:"flex",gap:2}}>
          {tabs.map(t=>(
            <button key={t.key} onClick={()=>setTab(t.key)} style={{padding:"6px 13px",borderRadius:8,border:"none",cursor:"pointer",fontSize:12,fontWeight:tab===t.key?700:400,background:tab===t.key?"linear-gradient(135deg,#1d4ed8,#0891b2)":"transparent",color:tab===t.key?"#fff":"#64748b",transition:"all .2s",position:"relative"}}>
              {t.icon} {t.label}
              {t.key==="analysis"&&alertedSKUs.length>0&&<span style={{position:"absolute",top:2,right:2,width:6,height:6,borderRadius:"50%",background:"#ef4444"}}/>}
            </button>
          ))}
        </nav>
        <Btn sm outline color="#10b981" onClick={()=>setModalTx(true)}>⬇⬆ 入出库</Btn>
      </header>

      {alertedSKUs.length>0&&(
        <div style={{background:"rgba(239,68,68,0.1)",borderBottom:"1px solid #ef444430",padding:"8px 28px",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
          <span style={{color:"#ef4444",fontWeight:700,fontSize:13}}>⚠ 库存预警：</span>
          {alertedSKUs.map(sku=>(
            <span key={sku.id} style={{fontSize:12,color:"#ef4444",background:"rgba(239,68,68,0.1)",padding:"2px 10px",borderRadius:20,border:"1px solid #ef444430"}}>
              {sku.code} 仅剩 {skuStockAll(sku.id)} {sku.unit}（预警值 {sku.alertThreshold}）
            </span>
          ))}
        </div>
      )}

      {toast&&<div style={{position:"fixed",top:72,right:20,zIndex:999,background:toast.ok?"#10b981":"#ef4444",color:"#fff",padding:"10px 18px",borderRadius:10,fontWeight:600,fontSize:13}}>{toast.text}</div>}

      <main style={{flex:1,padding:"24px 28px",maxWidth:1200,width:"100%",margin:"0 auto",boxSizing:"border-box"}}>

        {tab==="overview"&&(
          <div>
            <div style={{marginBottom:14}}><div style={{fontSize:16,fontWeight:700,color:"#f1f5f9",display:"flex",alignItems:"center",gap:8}}>总览 <span style={{fontSize:11,color:"#10b981",background:"rgba(16,185,129,.1)",padding:"2px 10px",borderRadius:20,fontWeight:600}}>🟢 实时同步</span></div></div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:24}}>
              <KPI label="全部库存" value={grandTotal.toLocaleString()} unit="只" color="#3b82f6" icon="📦"/>
              <KPI label="累计入库" value={totalIn.toLocaleString()} unit="只" color="#10b981" icon="⬇️"/>
              <KPI label="累计出库" value={totalOut.toLocaleString()} unit="只" color="#f59e0b" icon="⬆️"/>
            </div>
            <div style={{marginBottom:14}}><div style={{fontSize:16,fontWeight:700,color:"#f1f5f9"}}>仓库概览</div><div style={{fontSize:11,color:"#475569",marginTop:2}}>点击卡片进入仓库详情</div></div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:14,marginBottom:24}}>
              {whList.map(wh=><WHCard key={wh.id} wh={wh} stock={totalStock(wh.id)} onClick={()=>setSelWH(wh.id)} onEdit={()=>openEditWH(wh)} onDelete={()=>deleteWarehouse(wh.id)}/>)}
              <AddCard onClick={()=>setModalWH(true)} label="添加仓库"/>
            </div>
            <div style={{marginBottom:14}}><div style={{fontSize:16,fontWeight:700,color:"#f1f5f9"}}>型号库存汇总</div><div style={{fontSize:11,color:"#475569",marginTop:2}}>跨仓库汇总</div></div>
            <div style={{background:"#1a1d2e",border:"1px solid #2a2d3e",borderRadius:16,overflow:"hidden",marginBottom:24}}>
              <TblHeader cols={["型号编号","名称","全仓合计","单位"]}/>
              {skuList.length===0&&<Empty text="暂无型号"/>}
              {skuList.map(sku=>{
                const total=skuStockAll(sku.id);
                const isAlert=sku.alertThreshold>0&&total<sku.alertThreshold;
                return <TblRow key={sku.id} cols={[
                  <code style={{color:"#3b82f6",fontFamily:"monospace"}}>{sku.code}</code>,
                  <span style={{color:"#e2e8f0"}}>{sku.name}</span>,
                  <span style={{fontWeight:700,color:isAlert?"#ef4444":total>0?"#10b981":"#ef4444",fontSize:15}}>{total.toLocaleString()}{isAlert?" ⚠":""}</span>,
                  <span style={{color:"#64748b"}}>{sku.unit}</span>
                ]}/>;
              })}
            </div>
            <RecordsTable records={recList.slice(0,10)} title="最近操作" showWH onDelete={deleteRecord}/>
          </div>
        )}

        {tab==="warehouses"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <div style={{fontSize:16,fontWeight:700,color:"#f1f5f9"}}>仓库管理</div>
              <Btn onClick={()=>setModalWH(true)}>+ 添加仓库</Btn>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:16}}>
              {whList.map(wh=><WHCard key={wh.id} wh={wh} stock={totalStock(wh.id)} onClick={()=>setSelWH(wh.id)} onEdit={()=>openEditWH(wh)} onDelete={()=>deleteWarehouse(wh.id)}/>)}
            </div>
          </div>
        )}

        {tab==="skus"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <div style={{fontSize:16,fontWeight:700,color:"#f1f5f9"}}>型号管理</div>
              <Btn onClick={()=>setModalSKU(true)}>+ 添加型号</Btn>
            </div>
            <div style={{background:"#1a1d2e",border:"1px solid #2a2d3e",borderRadius:16,overflow:"hidden"}}>
              <TblHeader cols={["型号编号","名称","单位",...whList.map(w=>w.name),"合计","预警值","操作"]} widths={skuColW}/>
              {skuList.length===0&&<Empty text="暂无型号"/>}
              {skuList.map(sku=>{
                const total=skuStockAll(sku.id);
                const isAlert=sku.alertThreshold>0&&total<sku.alertThreshold;
                return <TblRow key={sku.id} cols={[
                  <code style={{color:"#3b82f6",fontFamily:"monospace",fontSize:12}}>{sku.code}</code>,
                  <span style={{color:"#e2e8f0"}}>{sku.name}</span>,
                  <span style={{color:"#64748b"}}>{sku.unit}</span>,
                  ...whList.map(wh=>{const q=data.stock[wh.id]?.[sku.id]||0;return <span style={{fontWeight:600,color:q>0?"#f1f5f9":"#475569"}}>{q}</span>;}),
                  <span style={{fontWeight:700,color:isAlert?"#ef4444":"#3b82f6"}}>{total}{isAlert?" ⚠":""}</span>,
                  <span style={{color:isAlert?"#ef4444":"#64748b",fontSize:12}}>{sku.alertThreshold||"—"}</span>,
                  <div style={{display:"flex",gap:4}}>
                    <button onClick={()=>openEditSKU(sku)} style={{padding:"3px 8px",borderRadius:5,border:"1px solid #2a2d3e",background:"transparent",color:"#94a3b8",cursor:"pointer",fontSize:11,fontWeight:600}}>编辑</button>
                    <button onClick={()=>deleteSKU(sku.id)} style={{padding:"3px 8px",borderRadius:5,border:"1px solid #ef444433",background:"transparent",color:"#ef4444",cursor:"pointer",fontSize:11,fontWeight:600}}>删除</button>
                  </div>
                ]} widths={skuColW}/>;
              })}
            </div>
          </div>
        )}

        {tab==="records"&&<RecordsTable records={recList} title="全部记录" showWH full onDelete={deleteRecord}/>}
        {tab==="analysis"&&<AnalyticsPage data={data} skuList={skuList}/>}

      </main>

      {(modalWH||editingWH)&&<WHModal form={whForm} setForm={setWhForm} onSave={editingWH?saveWarehouse:addWarehouse} onClose={()=>{setModalWH(false);setEditingWH(null);}} editMode={!!editingWH}/>}
      {(modalSKU||editingSKU)&&<SKUModal form={skuForm} setForm={setSkuForm} onSave={editingSKU?saveSKU:addSKU} onClose={()=>{setModalSKU(false);setEditingSKU(null);}} editMode={!!editingSKU}/>}
      {modalTx&&<TxModal form={txForm} setForm={setTxForm} warehouses={whList} skus={skuList} stock={data.stock} onSave={submitTx} onClose={()=>setModalTx(false)}/>}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;600;700;800&display=swap');*{box-sizing:border-box;}input[type=number]{-moz-appearance:textfield;}input::-webkit-inner-spin-button{-webkit-appearance:none;}::-webkit-scrollbar{width:4px;height:4px;}::-webkit-scrollbar-track{background:transparent;}::-webkit-scrollbar-thumb{background:#2a2d3e;border-radius:2px;}select option{background:#1a1d2e;}`}</style>
    </div>
  );
}
