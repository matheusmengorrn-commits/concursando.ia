import { useState, useRef, useEffect } from "react";

const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Lora:ital,wght@0,400;0,600;1,400&family=JetBrains+Mono:wght@400;500&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg: #080f1e;
      --surface: #0d1829;
      --surface2: #111f35;
      --surface3: #162540;
      --border: rgba(255,255,255,0.07);
      --border2: rgba(255,255,255,0.13);
      --accent: #3b82f6;
      --accent2: #60a5fa;
      --accent-glow: rgba(59,130,246,0.25);
      --gold: #f59e0b;
      --gold2: #fcd34d;
      --gold-glow: rgba(245,158,11,0.22);
      --green: #10b981;
      --red: #ef4444;
      --amber: #f59e0b;
      --text: #f0f4ff;
      --text2: #94a3b8;
      --text3: #64748b;
      --radius: 14px;
      --radius-sm: 8px;
    }
    body {
      font-family: 'Lora', Georgia, serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      background-image:
        linear-gradient(rgba(59,130,246,0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(59,130,246,0.03) 1px, transparent 1px);
      background-size: 40px 40px;
    }
    ::-webkit-scrollbar { width: 5px; }
    ::-webkit-scrollbar-track { background: var(--surface); }
    ::-webkit-scrollbar-thumb { background: var(--surface3); border-radius: 3px; }
    textarea, input, select { font-family: 'Lora', serif; outline: none; }
    @keyframes fadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.85)} }
    @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
    .fade-up { animation: fadeUp .45s cubic-bezier(.22,1,.36,1) both; }
    .syne { font-family: 'Syne', sans-serif; }
    .mono { font-family: 'JetBrains Mono', monospace; }
  `}</style>
);

const API_KEY = import.meta.env.VITE_GROQ_API_KEY;

async function callClaude(messages, system = "") {
  const body = { model: "claude-sonnet-4-20250514", max_tokens: 1000, messages };
  if (system) body.system = system;
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true"
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.content?.map(b => b.text || "").join("") || "";
}

function Loader({ label = "Analisando com IA…" }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, color:"var(--text3)", fontFamily:"'Syne',sans-serif", fontSize:13 }}>
      <div style={{ width:20, height:20, border:"2.5px solid var(--surface3)", borderTopColor:"var(--accent)", borderRadius:"50%", animation:"spin .7s linear infinite" }} />
      {label}
    </div>
  );
}

function Label({ children }) {
  return <p style={{ fontFamily:"'Syne',sans-serif", fontSize:11, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", color:"var(--text3)", marginBottom:10 }}>{children}</p>;
}

function Card({ children, style={} }) {
  return (
    <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--radius)", position:"relative", overflow:"hidden", ...style }}>
      <div style={{ position:"absolute", inset:0, background:"linear-gradient(135deg,rgba(255,255,255,.03) 0%,transparent 60%)", pointerEvents:"none" }} />
      {children}
    </div>
  );
}

function Chip({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      display:"inline-flex", alignItems:"center", padding:"5px 14px", borderRadius:99,
      fontFamily:"'Syne',sans-serif", fontSize:12, fontWeight:600, cursor:"pointer",
      transition:"all .15s", border:`1.5px solid ${active ? "var(--accent)" : "var(--border2)"}`,
      background: active ? "var(--accent)" : "var(--surface2)",
      color: active ? "#fff" : "var(--text3)", userSelect:"none"
    }}>{label}</button>
  );
}

function scoreColor(n, max=10) {
  const p = n/max;
  return p >= .7 ? "var(--green)" : p >= .5 ? "var(--amber)" : "var(--red)";
}

/* ══════════════════════════════════════════
   CHAT
══════════════════════════════════════════ */
function ChatTab() {
  const [msgs, setMsgs] = useState([{ role:"assistant", content:"Olá! Sou seu professor de IA especializado em concursos públicos e ENEM. 📚\n\nPode me perguntar qualquer coisa — matérias, macetes, resumos, estratégias de prova. Por onde quer começar?" }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);
  const SUGESTOES = ["Explique funções do 1º grau","Resumo da Era Vargas","Macetes para ortografia","Dicas para Redação ENEM"];

  useEffect(() => { endRef.current?.scrollIntoView({ behavior:"smooth" }); }, [msgs, loading]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role:"user", content:input.trim() };
    const updated = [...msgs, userMsg];
    setMsgs(updated); setInput(""); setLoading(true);
    const system = `Você é um professor particular de elite, especialista em concursos públicos, ENEM e vestibulares brasileiros. Didática clara, objetiva e encorajadora. Use exemplos reais e macetes quando útil. Responda em português brasileiro.`;
    try {
      const reply = await callClaude(updated.map(m => ({ role:m.role, content:m.content })), system);
      setMsgs([...updated, { role:"assistant", content:reply }]);
    } catch(e) {
      setMsgs([...updated, { role:"assistant", content:"❌ Erro: " + e.message }]);
    }
    setLoading(false);
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"calc(100vh - 200px)", minHeight:500 }}>
      <Card style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <div style={{ flex:1, overflowY:"auto", padding:"24px 28px", display:"flex", flexDirection:"column", gap:14 }}>
          {msgs.map((m,i) => (
            <div key={i} style={{ display:"flex", justifyContent:m.role==="user"?"flex-end":"flex-start", alignItems:"flex-end", gap:10 }}>
              {m.role==="assistant" && <div style={{ width:32, height:32, borderRadius:10, background:"linear-gradient(135deg,var(--accent),#818cf8)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, flexShrink:0 }}>🎓</div>}
              <div style={{
                maxWidth:"78%", padding:"13px 18px", fontSize:14.5, lineHeight:1.75, whiteSpace:"pre-wrap",
                borderRadius: m.role==="user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                background: m.role==="user" ? "var(--accent)" : "var(--surface2)",
                border: m.role==="assistant" ? "1px solid var(--border2)" : "none",
                color: m.role==="user" ? "#fff" : "var(--text)"
              }}>{m.content}</div>
            </div>
          ))}
          {loading && (
            <div style={{ display:"flex", alignItems:"flex-end", gap:10 }}>
              <div style={{ width:32, height:32, borderRadius:10, background:"linear-gradient(135deg,var(--accent),#818cf8)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15 }}>🎓</div>
              <div style={{ padding:"14px 18px", background:"var(--surface2)", border:"1px solid var(--border2)", borderRadius:"16px 16px 16px 4px", display:"flex", gap:5 }}>
                {[0,1,2].map(i => <span key={i} style={{ width:8, height:8, borderRadius:"50%", background:"var(--accent2)", display:"inline-block", animation:`pulse 1.2s ${i*.18}s ease infinite` }} />)}
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>
        {msgs.length <= 1 && (
          <div style={{ padding:"0 28px 14px", display:"flex", gap:8, flexWrap:"wrap" }}>
            {SUGESTOES.map(s => (
              <button key={s} onClick={() => setInput(s)} style={{ padding:"7px 14px", borderRadius:99, background:"var(--surface2)", border:"1px solid var(--border2)", color:"var(--text2)", fontSize:12.5, cursor:"pointer", fontFamily:"'Syne',sans-serif", fontWeight:500 }}>{s}</button>
            ))}
          </div>
        )}
        <div style={{ padding:"16px 24px", borderTop:"1px solid var(--border)", display:"flex", gap:12 }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key==="Enter" && send()}
            placeholder="Faça uma pergunta ao seu professor…"
            style={{ flex:1, background:"var(--surface2)", border:"1px solid var(--border2)", borderRadius:"var(--radius-sm)", color:"var(--text)", fontSize:14, padding:"12px 16px", transition:"border-color .2s" }} />
          <button onClick={send} disabled={!input.trim()||loading}
            style={{ background:"var(--accent)", color:"#fff", border:"none", borderRadius:"var(--radius-sm)", padding:"12px 22px", fontFamily:"'Syne',sans-serif", fontSize:14, fontWeight:700, cursor:"pointer" }}>
            Enviar ↑
          </button>
        </div>
      </Card>
    </div>
  );
}

/* ══════════════════════════════════════════
   REDAÇÃO
══════════════════════════════════════════ */
function RedacaoTab() {
  const [text, setText] = useState("");
  const [tema, setTema] = useState("");
  const [tipo, setTipo] = useState("ENEM");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const TIPOS = ["ENEM","Vestibular","Concurso Federal","Concurso Estadual"];
  const words = text.split(/\s+/).filter(Boolean).length;
  const wColor = words < 200 ? "var(--red)" : words < 300 ? "var(--amber)" : "var(--green)";

  const analisar = async () => {
    if (!text.trim()) return;
    setLoading(true); setResult(null);
    const system = `Você é um corretor expert em redações de ${tipo}. Retorne SOMENTE JSON válido, sem markdown:
{"nota_geral":<0-10>,"resumo":"avaliação em 2 frases","criterios":[{"nome":"Domínio da norma culta","nota":<0-10>,"feedback":"...","erros":["..."]},{"nome":"Compreensão da proposta","nota":<0-10>,"feedback":"...","erros":["..."]},{"nome":"Capacidade argumentativa","nota":<0-10>,"feedback":"...","erros":["..."]},{"nome":"Coesão e coerência","nota":<0-10>,"feedback":"...","erros":["..."]},{"nome":"Proposta de intervenção","nota":<0-10>,"feedback":"...","erros":["..."]}],"pontos_fortes":["...","..."],"pontos_melhoria":["...","..."],"sugestao":"reescrita do parágrafo mais fraco"}`;
    try {
      const raw = await callClaude([{ role:"user", content:`Tipo: ${tipo}\nTema: ${tema||"não informado"}\n\nRedação:\n${text}` }], system);
      setResult(JSON.parse(raw.replace(/```json|```/g,"").trim()));
    } catch(e) { setResult({ error: e.message }); }
    setLoading(false);
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <Card>
        <div style={{ padding:"28px 32px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:16, marginBottom:24 }}>
            <div>
              <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:800 }}>Correção de Redação</h2>
              <p style={{ fontSize:14, color:"var(--text3)", marginTop:4 }}>Análise completa por competência com feedback detalhado</p>
            </div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {TIPOS.map(t => <Chip key={t} label={t} active={tipo===t} onClick={() => setTipo(t)} />)}
            </div>
          </div>
          <div style={{ marginBottom:16 }}>
            <Label>Tema (opcional)</Label>
            <input value={tema} onChange={e => setTema(e.target.value)} placeholder="Ex: Desafios da saúde mental no Brasil"
              style={{ width:"100%", background:"var(--surface2)", border:"1px solid var(--border2)", borderRadius:"var(--radius-sm)", color:"var(--text)", fontSize:14, padding:"12px 16px" }} />
          </div>
          <div style={{ marginBottom:16 }}>
            <Label>Sua redação</Label>
            <textarea value={text} onChange={e => setText(e.target.value)} rows={10} placeholder="Cole ou escreva sua redação aqui…"
              style={{ width:"100%", background:"var(--surface2)", border:"1px solid var(--border2)", borderRadius:"var(--radius-sm)", color:"var(--text)", fontSize:14, padding:"12px 16px", lineHeight:1.8, resize:"vertical" }} />
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, color:wColor }}>{words} palavras</span>
            {loading ? <Loader label="Corrigindo redação…" /> :
              <button onClick={analisar} disabled={!text.trim()}
                style={{ background:"linear-gradient(135deg,var(--gold),var(--gold2))", color:"#000", border:"none", borderRadius:"var(--radius-sm)", padding:"13px 28px", fontFamily:"'Syne',sans-serif", fontSize:14, fontWeight:800, cursor:"pointer" }}>
                Analisar Redação →
              </button>}
          </div>
        </div>
      </Card>

      {result && !result.error && (
        <div className="fade-up" style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <div style={{ padding:"24px 28px", background:"linear-gradient(135deg,#0a1628,#0d1f3c)", border:"1px solid rgba(59,130,246,.2)", borderRadius:"var(--radius)", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:20 }}>
            <div style={{ flex:1 }}>
              <Label>Resultado Final</Label>
              <p style={{ fontSize:15, color:"var(--text2)", lineHeight:1.7, maxWidth:520 }}>{result.resumo}</p>
            </div>
            <div style={{ width:84, height:84, borderRadius:"50%", border:`3px solid ${scoreColor(result.nota_geral)}`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", boxShadow:`0 0 30px ${scoreColor(result.nota_geral)}44` }}>
              <span style={{ fontFamily:"'Syne',sans-serif", fontSize:30, fontWeight:800, color:scoreColor(result.nota_geral), lineHeight:1 }}>{result.nota_geral}</span>
              <span style={{ fontSize:11, color:"var(--text3)" }}>/10</span>
            </div>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(250px,1fr))", gap:14 }}>
            {result.criterios?.map((c,i) => (
              <Card key={i} style={{ padding:"20px 22px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
                  <p style={{ fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:600, flex:1, marginRight:10, lineHeight:1.4 }}>{c.nome}</p>
                  <span style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:800, color:scoreColor(c.nota) }}>{c.nota}/10</span>
                </div>
                <div style={{ height:6, borderRadius:3, background:"var(--surface3)", overflow:"hidden", marginTop:8 }}>
                  <div style={{ height:"100%", width:`${c.nota*10}%`, borderRadius:3, background:scoreColor(c.nota), transition:"width 1s" }} />
                </div>
                <p style={{ fontSize:13, color:"var(--text3)", lineHeight:1.6, marginTop:10 }}>{c.feedback}</p>
                {c.erros?.filter(Boolean).map((e,j) => <p key={j} style={{ fontSize:12, color:"var(--red)", marginTop:4 }}>• {e}</p>)}
              </Card>
            ))}
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
            <Card style={{ padding:"22px 24px", borderTop:"3px solid var(--green)" }}>
              <Label>✅ Pontos Fortes</Label>
              {result.pontos_fortes?.map((p,i) => <p key={i} style={{ fontSize:14, color:"var(--text2)", marginBottom:8, paddingLeft:12, borderLeft:"2px solid rgba(16,185,129,.3)", lineHeight:1.6 }}>{p}</p>)}
            </Card>
            <Card style={{ padding:"22px 24px", borderTop:"3px solid var(--amber)" }}>
              <Label>⚠️ A Melhorar</Label>
              {result.pontos_melhoria?.map((p,i) => <p key={i} style={{ fontSize:14, color:"var(--text2)", marginBottom:8, paddingLeft:12, borderLeft:"2px solid rgba(245,158,11,.3)", lineHeight:1.6 }}>{p}</p>)}
            </Card>
          </div>

          {result.sugestao && (
            <Card style={{ padding:"24px 28px", borderLeft:"3px solid var(--accent)" }}>
              <Label>✏️ Sugestão de Reescrita</Label>
              <p style={{ fontSize:14.5, color:"var(--text2)", lineHeight:1.8, fontStyle:"italic" }}>{result.sugestao}</p>
            </Card>
          )}
        </div>
      )}
      {result?.error && <Card style={{ padding:24, borderLeft:"3px solid var(--red)" }}><p style={{ color:"var(--red)" }}>Erro: {result.error}</p></Card>}
    </div>
  );
}

/* ══════════════════════════════════════════
   QUESTÕES
══════════════════════════════════════════ */
function QuestoesTab() {
  const [questao, setQuestao] = useState("");
  const [materia, setMateria] = useState("Português");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const MATERIAS = ["Português","Matemática","História","Geografia","Biologia","Física","Química","Direito","Raciocínio Lógico","Informática","Atualidades"];
  const nivelColor = { "Fácil":"var(--green)", "Médio":"var(--amber)", "Difícil":"var(--red)" };

  const corrigir = async () => {
    if (!questao.trim()) return;
    setLoading(true); setResult(null);
    const system = `Você é professor especialista em concursos e ENEM. Retorne SOMENTE JSON válido, sem markdown:
{"resposta_correta":"<letra>","nivel":"Fácil|Médio|Difícil","tema":"<tema>","explicacao_geral":"<3-5 frases>","alternativas":[{"letra":"A","texto":"...","correta":true,"explicacao":"..."}],"conceito_chave":"<conceito>","dica_concurso":"<dica>"}`;
    try {
      const raw = await callClaude([{ role:"user", content:`Matéria: ${materia}\n\nQuestão:\n${questao}` }], system);
      setResult(JSON.parse(raw.replace(/```json|```/g,"").trim()));
    } catch(e) { setResult({ error: e.message }); }
    setLoading(false);
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <Card>
        <div style={{ padding:"28px 32px" }}>
          <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:800, marginBottom:4 }}>Correção de Questões</h2>
          <p style={{ fontSize:14, color:"var(--text3)", marginBottom:24 }}>Cole qualquer questão — a IA explica e analisa cada alternativa</p>
          <div style={{ marginBottom:18 }}>
            <Label>Matéria</Label>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
              {MATERIAS.map(m => <Chip key={m} label={m} active={materia===m} onClick={() => setMateria(m)} />)}
            </div>
          </div>
          <div style={{ marginBottom:18 }}>
            <Label>Questão</Label>
            <textarea value={questao} onChange={e => setQuestao(e.target.value)} rows={8}
              placeholder={"Cole a questão aqui. Exemplo:\n\n(CESPE/2023) Em relação à Constituição de 1988:\nA) O voto é facultativo para maiores de 18 anos\nB) O Brasil adota a forma federativa de Estado\nC) O Poder Judiciário pode editar leis\nD) O mandato presidencial é de 5 anos"}
              style={{ width:"100%", background:"var(--surface2)", border:"1px solid var(--border2)", borderRadius:"var(--radius-sm)", color:"var(--text)", fontSize:14, padding:"12px 16px", lineHeight:1.75, resize:"vertical" }} />
          </div>
          <div style={{ display:"flex", justifyContent:"flex-end", gap:16, alignItems:"center" }}>
            {loading ? <Loader label="Analisando questão…" /> :
              <button onClick={corrigir} disabled={!questao.trim()}
                style={{ background:"linear-gradient(135deg,var(--gold),var(--gold2))", color:"#000", border:"none", borderRadius:"var(--radius-sm)", padding:"13px 28px", fontFamily:"'Syne',sans-serif", fontSize:14, fontWeight:800, cursor:"pointer" }}>
                Corrigir e Explicar →
              </button>}
          </div>
        </div>
      </Card>

      {result && !result.error && (
        <div className="fade-up" style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <div style={{ padding:"24px 28px", background:"linear-gradient(135deg,#0a1628,#0d1f3c)", border:"1px solid rgba(59,130,246,.2)", borderRadius:"var(--radius)", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:20 }}>
            <div>
              <Label>Resposta Correta</Label>
              <p style={{ fontFamily:"'Syne',sans-serif", fontSize:36, fontWeight:800, color:"var(--green)", lineHeight:1 }}>{result.resposta_correta}</p>
            </div>
            <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
              {[{ label:"Nível", val:result.nivel, color:nivelColor[result.nivel]||"var(--text2)" }, { label:"Tema", val:result.tema, color:"var(--text2)" }].map(({ label, val, color }) => (
                <div key={label} style={{ background:"rgba(255,255,255,.04)", border:"1px solid var(--border2)", borderRadius:10, padding:"12px 18px" }}>
                  <p style={{ fontFamily:"'Syne',sans-serif", fontSize:10, color:"var(--text3)", letterSpacing:1, textTransform:"uppercase", marginBottom:4 }}>{label}</p>
                  <p style={{ fontFamily:"'Syne',sans-serif", fontSize:14, fontWeight:700, color }}>{val}</p>
                </div>
              ))}
            </div>
          </div>

          <Card style={{ padding:"24px 28px" }}>
            <Label>📖 Explicação</Label>
            <p style={{ fontSize:15, color:"var(--text2)", lineHeight:1.8 }}>{result.explicacao_geral}</p>
            {result.conceito_chave && (
              <div style={{ marginTop:14, padding:"12px 16px", background:"rgba(59,130,246,.08)", borderRadius:"var(--radius-sm)", border:"1px solid rgba(59,130,246,.2)" }}>
                <span style={{ fontFamily:"'Syne',sans-serif", fontSize:12, color:"var(--accent2)", fontWeight:700 }}>CONCEITO-CHAVE: </span>
                <span style={{ fontSize:13.5, color:"var(--text2)" }}>{result.conceito_chave}</span>
              </div>
            )}
          </Card>

          {result.alternativas?.length > 0 && (
            <Card style={{ padding:"24px 28px" }}>
              <Label>📋 Análise das Alternativas</Label>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {result.alternativas.map((alt,i) => (
                  <div key={i} style={{ display:"flex", gap:12, padding:"13px 16px", borderRadius:"var(--radius-sm)", border:`1.5px solid ${alt.correta?"rgba(16,185,129,.35)":"rgba(239,68,68,.12)"}`, background:alt.correta?"rgba(16,185,129,.07)":"rgba(239,68,68,.04)" }}>
                    <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:15, color:alt.correta?"var(--green)":"var(--text3)", minWidth:22 }}>{alt.letra}</span>
                    <div>
                      <p style={{ fontSize:14, color:"var(--text)", marginBottom:5, lineHeight:1.5 }}>{alt.texto}</p>
                      <p style={{ fontSize:13, color:alt.correta?"var(--green)":"var(--text3)", lineHeight:1.5 }}>{alt.correta?"✅ ":"❌ "}{alt.explicacao}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {result.dica_concurso && (
            <div style={{ padding:"22px 28px", borderRadius:"var(--radius)", background:"linear-gradient(135deg,rgba(245,158,11,.08),rgba(245,158,11,.03))", border:"1px solid rgba(245,158,11,.2)" }}>
              <Label>💡 Dica Estratégica</Label>
              <p style={{ fontSize:14.5, color:"var(--text2)", lineHeight:1.75 }}>{result.dica_concurso}</p>
            </div>
          )}
        </div>
      )}
      {result?.error && <Card style={{ padding:24, borderLeft:"3px solid var(--red)" }}><p style={{ color:"var(--red)" }}>Erro: {result.error}</p></Card>}
    </div>
  );
}

/* ══════════════════════════════════════════
   APP SHELL
══════════════════════════════════════════ */
const TABS = [
  { id:"chat",    icon:"🎓", label:"Professor IA" },
  { id:"redacao", icon:"📝", label:"Redação" },
  { id:"questoes",icon:"✅", label:"Questões" },
];

export default function App() {
  const [tab, setTab] = useState("chat");
  return (
    <>
      <GlobalStyles />
      <div style={{ minHeight:"100vh" }}>
        <header style={{ borderBottom:"1px solid var(--border)", backdropFilter:"blur(20px)", background:"rgba(8,15,30,0.9)", position:"sticky", top:0, zIndex:100 }}>
          <div style={{ maxWidth:1100, margin:"0 auto", padding:"14px 24px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:16, flexWrap:"wrap" }}>
            <div style={{ display:"flex", alignItems:"center", gap:14 }}>
              <div style={{ width:42, height:42, borderRadius:12, background:"linear-gradient(135deg,var(--accent),#818cf8)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, boxShadow:"0 4px 20px var(--accent-glow)", animation:"float 4s ease infinite" }}>🏛️</div>
              <div>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:800, lineHeight:1, background:"linear-gradient(90deg,#f0f4ff,var(--accent2))", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
                  Concursando<span style={{ WebkitTextFillColor:"var(--gold)", color:"var(--gold)" }}>.IA</span>
                </div>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:10, color:"var(--text3)", letterSpacing:1.5, marginTop:2, fontWeight:600 }}>PLATAFORMA DE ESTUDOS COM IA</div>
              </div>
            </div>
            <nav style={{ display:"flex", gap:6, background:"var(--surface)", border:"1px solid var(--border)", padding:5, borderRadius:12 }}>
              {TABS.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  style={{ padding:"10px 18px", border:"none", cursor:"pointer", fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:600, borderRadius:8, transition:"all .2s", background:tab===t.id?"var(--accent)":"transparent", color:tab===t.id?"#fff":"var(--text3)", boxShadow:tab===t.id?"0 4px 20px var(--accent-glow)":"none" }}>
                  {t.icon} {t.label}
                </button>
              ))}
            </nav>
            <div style={{ display:"flex", gap:8 }}>
              {["ENEM","Concursos","Vestibular"].map(b => (
                <span key={b} style={{ fontFamily:"'Syne',sans-serif", fontSize:11, fontWeight:700, padding:"4px 10px", borderRadius:99, border:"1px solid var(--border2)", color:"var(--text3)" }}>{b}</span>
              ))}
            </div>
          </div>
        </header>
        <main style={{ maxWidth:1100, margin:"0 auto", padding:"28px 24px" }}>
          {tab==="chat" && <ChatTab />}
          {tab==="redacao" && <RedacaoTab />}
          {tab==="questoes" && <QuestoesTab />}
        </main>
        <footer style={{ borderTop:"1px solid var(--border)", padding:"20px 24px", textAlign:"center", marginTop:24 }}>
          <p style={{ fontFamily:"'Syne',sans-serif", fontSize:12, color:"var(--text3)" }}>Concursando.IA — Tecnologia a serviço da sua aprovação</p>
        </footer>
      </div>
    </>
  );
}
import { useState, useRef, useEffect } from "react";

const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Lora:ital,wght@0,400;0,600;1,400&family=JetBrains+Mono:wght@400;500&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg: #080f1e;
      --surface: #0d1829;
      --surface2: #111f35;
      --surface3: #162540;
      --border: rgba(255,255,255,0.07);
      --border2: rgba(255,255,255,0.13);
      --accent: #3b82f6;
      --accent2: #60a5fa;
      --accent-glow: rgba(59,130,246,0.25);
      --gold: #f59e0b;
      --gold2: #fcd34d;
      --gold-glow: rgba(245,158,11,0.22);
      --green: #10b981;
      --red: #ef4444;
      --amber: #f59e0b;
      --text: #f0f4ff;
      --text2: #94a3b8;
      --text3: #64748b;
      --radius: 14px;
      --radius-sm: 8px;
    }
    body {
      font-family: 'Lora', Georgia, serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      background-image:
        linear-gradient(rgba(59,130,246,0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(59,130,246,0.03) 1px, transparent 1px);
      background-size: 40px 40px;
    }
    ::-webkit-scrollbar { width: 5px; }
    ::-webkit-scrollbar-track { background: var(--surface); }
    ::-webkit-scrollbar-thumb { background: var(--surface3); border-radius: 3px; }
    textarea, input, select { font-family: 'Lora', serif; outline: none; }
    @keyframes fadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.85)} }
    @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
    .fade-up { animation: fadeUp .45s cubic-bezier(.22,1,.36,1) both; }
    .syne { font-family: 'Syne', sans-serif; }
    .mono { font-family: 'JetBrains Mono', monospace; }
  `}</style>
);

const API_KEY = import.meta.env.VITE_GROQ_API_KEY;

async function callClaude(messages, system = "") {
  const groqMessages = [];
  if (system) groqMessages.push({ role: "system", content: system });
  groqMessages.push(...messages);

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      max_tokens: 1000,
      messages: groqMessages
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.choices?.[0]?.message?.content || "";
}

function Loader({ label = "Analisando com IA…" }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, color:"var(--text3)", fontFamily:"'Syne',sans-serif", fontSize:13 }}>
      <div style={{ width:20, height:20, border:"2.5px solid var(--surface3)", borderTopColor:"var(--accent)", borderRadius:"50%", animation:"spin .7s linear infinite" }} />
      {label}
    </div>
  );
}

function Label({ children }) {
  return <p style={{ fontFamily:"'Syne',sans-serif", fontSize:11, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", color:"var(--text3)", marginBottom:10 }}>{children}</p>;
}

function Card({ children, style={} }) {
  return (
    <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--radius)", position:"relative", overflow:"hidden", ...style }}>
      <div style={{ position:"absolute", inset:0, background:"linear-gradient(135deg,rgba(255,255,255,.03) 0%,transparent 60%)", pointerEvents:"none" }} />
      {children}
    </div>
  );
}

function Chip({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      display:"inline-flex", alignItems:"center", padding:"5px 14px", borderRadius:99,
      fontFamily:"'Syne',sans-serif", fontSize:12, fontWeight:600, cursor:"pointer",
      transition:"all .15s", border:`1.5px solid ${active ? "var(--accent)" : "var(--border2)"}`,
      background: active ? "var(--accent)" : "var(--surface2)",
      color: active ? "#fff" : "var(--text3)", userSelect:"none"
    }}>{label}</button>
  );
}

function scoreColor(n, max=10) {
  const p = n/max;
  return p >= .7 ? "var(--green)" : p >= .5 ? "var(--amber)" : "var(--red)";
}

/* ══════════════════════════════════════════
   CHAT
══════════════════════════════════════════ */
function ChatTab() {
  const [msgs, setMsgs] = useState([{ role:"assistant", content:"Olá! Sou seu professor de IA especializado em concursos públicos e ENEM. 📚\n\nPode me perguntar qualquer coisa — matérias, macetes, resumos, estratégias de prova. Por onde quer começar?" }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);
  const SUGESTOES = ["Explique funções do 1º grau","Resumo da Era Vargas","Macetes para ortografia","Dicas para Redação ENEM"];

  useEffect(() => { endRef.current?.scrollIntoView({ behavior:"smooth" }); }, [msgs, loading]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role:"user", content:input.trim() };
    const updated = [...msgs, userMsg];
    setMsgs(updated); setInput(""); setLoading(true);
    const system = `Você é um professor particular de elite, especialista em concursos públicos, ENEM e vestibulares brasileiros. Didática clara, objetiva e encorajadora. Use exemplos reais e macetes quando útil. Responda em português brasileiro.`;
    try {
      const reply = await callClaude(updated.map(m => ({ role:m.role, content:m.content })), system);
      setMsgs([...updated, { role:"assistant", content:reply }]);
    } catch(e) {
      setMsgs([...updated, { role:"assistant", content:"❌ Erro: " + e.message }]);
    }
    setLoading(false);
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"calc(100vh - 200px)", minHeight:500 }}>
      <Card style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <div style={{ flex:1, overflowY:"auto", padding:"24px 28px", display:"flex", flexDirection:"column", gap:14 }}>
          {msgs.map((m,i) => (
            <div key={i} style={{ display:"flex", justifyContent:m.role==="user"?"flex-end":"flex-start", alignItems:"flex-end", gap:10 }}>
              {m.role==="assistant" && <div style={{ width:32, height:32, borderRadius:10, background:"linear-gradient(135deg,var(--accent),#818cf8)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, flexShrink:0 }}>🎓</div>}
              <div style={{
                maxWidth:"78%", padding:"13px 18px", fontSize:14.5, lineHeight:1.75, whiteSpace:"pre-wrap",
                borderRadius: m.role==="user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                background: m.role==="user" ? "var(--accent)" : "var(--surface2)",
                border: m.role==="assistant" ? "1px solid var(--border2)" : "none",
                color: m.role==="user" ? "#fff" : "var(--text)"
              }}>{m.content}</div>
            </div>
          ))}
          {loading && (
            <div style={{ display:"flex", alignItems:"flex-end", gap:10 }}>
              <div style={{ width:32, height:32, borderRadius:10, background:"linear-gradient(135deg,var(--accent),#818cf8)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15 }}>🎓</div>
              <div style={{ padding:"14px 18px", background:"var(--surface2)", border:"1px solid var(--border2)", borderRadius:"16px 16px 16px 4px", display:"flex", gap:5 }}>
                {[0,1,2].map(i => <span key={i} style={{ width:8, height:8, borderRadius:"50%", background:"var(--accent2)", display:"inline-block", animation:`pulse 1.2s ${i*.18}s ease infinite` }} />)}
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>
        {msgs.length <= 1 && (
          <div style={{ padding:"0 28px 14px", display:"flex", gap:8, flexWrap:"wrap" }}>
            {SUGESTOES.map(s => (
              <button key={s} onClick={() => setInput(s)} style={{ padding:"7px 14px", borderRadius:99, background:"var(--surface2)", border:"1px solid var(--border2)", color:"var(--text2)", fontSize:12.5, cursor:"pointer", fontFamily:"'Syne',sans-serif", fontWeight:500 }}>{s}</button>
            ))}
          </div>
        )}
        <div style={{ padding:"16px 24px", borderTop:"1px solid var(--border)", display:"flex", gap:12 }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key==="Enter" && send()}
            placeholder="Faça uma pergunta ao seu professor…"
            style={{ flex:1, background:"var(--surface2)", border:"1px solid var(--border2)", borderRadius:"var(--radius-sm)", color:"var(--text)", fontSize:14, padding:"12px 16px", transition:"border-color .2s" }} />
          <button onClick={send} disabled={!input.trim()||loading}
            style={{ background:"var(--accent)", color:"#fff", border:"none", borderRadius:"var(--radius-sm)", padding:"12px 22px", fontFamily:"'Syne',sans-serif", fontSize:14, fontWeight:700, cursor:"pointer" }}>
            Enviar ↑
          </button>
        </div>
      </Card>
    </div>
  );
}

/* ══════════════════════════════════════════
   REDAÇÃO
══════════════════════════════════════════ */
function RedacaoTab() {
  const [text, setText] = useState("");
  const [tema, setTema] = useState("");
  const [tipo, setTipo] = useState("ENEM");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const TIPOS = ["ENEM","Vestibular","Concurso Federal","Concurso Estadual"];
  const words = text.split(/\s+/).filter(Boolean).length;
  const wColor = words < 200 ? "var(--red)" : words < 300 ? "var(--amber)" : "var(--green)";

  const analisar = async () => {
    if (!text.trim()) return;
    setLoading(true); setResult(null);
    const system = `Você é um corretor expert em redações de ${tipo}. Retorne SOMENTE JSON válido, sem markdown:
{"nota_geral":<0-10>,"resumo":"avaliação em 2 frases","criterios":[{"nome":"Domínio da norma culta","nota":<0-10>,"feedback":"...","erros":["..."]},{"nome":"Compreensão da proposta","nota":<0-10>,"feedback":"...","erros":["..."]},{"nome":"Capacidade argumentativa","nota":<0-10>,"feedback":"...","erros":["..."]},{"nome":"Coesão e coerência","nota":<0-10>,"feedback":"...","erros":["..."]},{"nome":"Proposta de intervenção","nota":<0-10>,"feedback":"...","erros":["..."]}],"pontos_fortes":["...","..."],"pontos_melhoria":["...","..."],"sugestao":"reescrita do parágrafo mais fraco"}`;
    try {
      const raw = await callClaude([{ role:"user", content:`Tipo: ${tipo}\nTema: ${tema||"não informado"}\n\nRedação:\n${text}` }], system);
      setResult(JSON.parse(raw.replace(/```json|```/g,"").trim()));
    } catch(e) { setResult({ error: e.message }); }
    setLoading(false);
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <Card>
        <div style={{ padding:"28px 32px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:16, marginBottom:24 }}>
            <div>
              <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:800 }}>Correção de Redação</h2>
              <p style={{ fontSize:14, color:"var(--text3)", marginTop:4 }}>Análise completa por competência com feedback detalhado</p>
            </div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {TIPOS.map(t => <Chip key={t} label={t} active={tipo===t} onClick={() => setTipo(t)} />)}
            </div>
          </div>
          <div style={{ marginBottom:16 }}>
            <Label>Tema (opcional)</Label>
            <input value={tema} onChange={e => setTema(e.target.value)} placeholder="Ex: Desafios da saúde mental no Brasil"
              style={{ width:"100%", background:"var(--surface2)", border:"1px solid var(--border2)", borderRadius:"var(--radius-sm)", color:"var(--text)", fontSize:14, padding:"12px 16px" }} />
          </div>
          <div style={{ marginBottom:16 }}>
            <Label>Sua redação</Label>
            <textarea value={text} onChange={e => setText(e.target.value)} rows={10} placeholder="Cole ou escreva sua redação aqui…"
              style={{ width:"100%", background:"var(--surface2)", border:"1px solid var(--border2)", borderRadius:"var(--radius-sm)", color:"var(--text)", fontSize:14, padding:"12px 16px", lineHeight:1.8, resize:"vertical" }} />
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, color:wColor }}>{words} palavras</span>
            {loading ? <Loader label="Corrigindo redação…" /> :
              <button onClick={analisar} disabled={!text.trim()}
                style={{ background:"linear-gradient(135deg,var(--gold),var(--gold2))", color:"#000", border:"none", borderRadius:"var(--radius-sm)", padding:"13px 28px", fontFamily:"'Syne',sans-serif", fontSize:14, fontWeight:800, cursor:"pointer" }}>
                Analisar Redação →
              </button>}
          </div>
        </div>
      </Card>

      {result && !result.error && (
        <div className="fade-up" style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <div style={{ padding:"24px 28px", background:"linear-gradient(135deg,#0a1628,#0d1f3c)", border:"1px solid rgba(59,130,246,.2)", borderRadius:"var(--radius)", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:20 }}>
            <div style={{ flex:1 }}>
              <Label>Resultado Final</Label>
              <p style={{ fontSize:15, color:"var(--text2)", lineHeight:1.7, maxWidth:520 }}>{result.resumo}</p>
            </div>
            <div style={{ width:84, height:84, borderRadius:"50%", border:`3px solid ${scoreColor(result.nota_geral)}`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", boxShadow:`0 0 30px ${scoreColor(result.nota_geral)}44` }}>
              <span style={{ fontFamily:"'Syne',sans-serif", fontSize:30, fontWeight:800, color:scoreColor(result.nota_geral), lineHeight:1 }}>{result.nota_geral}</span>
              <span style={{ fontSize:11, color:"var(--text3)" }}>/10</span>
            </div>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(250px,1fr))", gap:14 }}>
            {result.criterios?.map((c,i) => (
              <Card key={i} style={{ padding:"20px 22px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
                  <p style={{ fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:600, flex:1, marginRight:10, lineHeight:1.4 }}>{c.nome}</p>
                  <span style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:800, color:scoreColor(c.nota) }}>{c.nota}/10</span>
                </div>
                <div style={{ height:6, borderRadius:3, background:"var(--surface3)", overflow:"hidden", marginTop:8 }}>
                  <div style={{ height:"100%", width:`${c.nota*10}%`, borderRadius:3, background:scoreColor(c.nota), transition:"width 1s" }} />
                </div>
                <p style={{ fontSize:13, color:"var(--text3)", lineHeight:1.6, marginTop:10 }}>{c.feedback}</p>
                {c.erros?.filter(Boolean).map((e,j) => <p key={j} style={{ fontSize:12, color:"var(--red)", marginTop:4 }}>• {e}</p>)}
              </Card>
            ))}
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
            <Card style={{ padding:"22px 24px", borderTop:"3px solid var(--green)" }}>
              <Label>✅ Pontos Fortes</Label>
              {result.pontos_fortes?.map((p,i) => <p key={i} style={{ fontSize:14, color:"var(--text2)", marginBottom:8, paddingLeft:12, borderLeft:"2px solid rgba(16,185,129,.3)", lineHeight:1.6 }}>{p}</p>)}
            </Card>
            <Card style={{ padding:"22px 24px", borderTop:"3px solid var(--amber)" }}>
              <Label>⚠️ A Melhorar</Label>
              {result.pontos_melhoria?.map((p,i) => <p key={i} style={{ fontSize:14, color:"var(--text2)", marginBottom:8, paddingLeft:12, borderLeft:"2px solid rgba(245,158,11,.3)", lineHeight:1.6 }}>{p}</p>)}
            </Card>
          </div>

          {result.sugestao && (
            <Card style={{ padding:"24px 28px", borderLeft:"3px solid var(--accent)" }}>
              <Label>✏️ Sugestão de Reescrita</Label>
              <p style={{ fontSize:14.5, color:"var(--text2)", lineHeight:1.8, fontStyle:"italic" }}>{result.sugestao}</p>
            </Card>
          )}
        </div>
      )}
      {result?.error && <Card style={{ padding:24, borderLeft:"3px solid var(--red)" }}><p style={{ color:"var(--red)" }}>Erro: {result.error}</p></Card>}
    </div>
  );
}

/* ══════════════════════════════════════════
   QUESTÕES
══════════════════════════════════════════ */
function QuestoesTab() {
  const [questao, setQuestao] = useState("");
  const [materia, setMateria] = useState("Português");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const MATERIAS = ["Português","Matemática","História","Geografia","Biologia","Física","Química","Direito","Raciocínio Lógico","Informática","Atualidades"];
  const nivelColor = { "Fácil":"var(--green)", "Médio":"var(--amber)", "Difícil":"var(--red)" };

  const corrigir = async () => {
    if (!questao.trim()) return;
    setLoading(true); setResult(null);
    const system = `Você é professor especialista em concursos e ENEM. Retorne SOMENTE JSON válido, sem markdown:
{"resposta_correta":"<letra>","nivel":"Fácil|Médio|Difícil","tema":"<tema>","explicacao_geral":"<3-5 frases>","alternativas":[{"letra":"A","texto":"...","correta":true,"explicacao":"..."}],"conceito_chave":"<conceito>","dica_concurso":"<dica>"}`;
    try {
      const raw = await callClaude([{ role:"user", content:`Matéria: ${materia}\n\nQuestão:\n${questao}` }], system);
      setResult(JSON.parse(raw.replace(/```json|```/g,"").trim()));
    } catch(e) { setResult({ error: e.message }); }
    setLoading(false);
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <Card>
        <div style={{ padding:"28px 32px" }}>
          <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:800, marginBottom:4 }}>Correção de Questões</h2>
          <p style={{ fontSize:14, color:"var(--text3)", marginBottom:24 }}>Cole qualquer questão — a IA explica e analisa cada alternativa</p>
          <div style={{ marginBottom:18 }}>
            <Label>Matéria</Label>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
              {MATERIAS.map(m => <Chip key={m} label={m} active={materia===m} onClick={() => setMateria(m)} />)}
            </div>
          </div>
          <div style={{ marginBottom:18 }}>
            <Label>Questão</Label>
            <textarea value={questao} onChange={e => setQuestao(e.target.value)} rows={8}
              placeholder={"Cole a questão aqui. Exemplo:\n\n(CESPE/2023) Em relação à Constituição de 1988:\nA) O voto é facultativo para maiores de 18 anos\nB) O Brasil adota a forma federativa de Estado\nC) O Poder Judiciário pode editar leis\nD) O mandato presidencial é de 5 anos"}
              style={{ width:"100%", background:"var(--surface2)", border:"1px solid var(--border2)", borderRadius:"var(--radius-sm)", color:"var(--text)", fontSize:14, padding:"12px 16px", lineHeight:1.75, resize:"vertical" }} />
          </div>
          <div style={{ display:"flex", justifyContent:"flex-end", gap:16, alignItems:"center" }}>
            {loading ? <Loader label="Analisando questão…" /> :
              <button onClick={corrigir} disabled={!questao.trim()}
                style={{ background:"linear-gradient(135deg,var(--gold),var(--gold2))", color:"#000", border:"none", borderRadius:"var(--radius-sm)", padding:"13px 28px", fontFamily:"'Syne',sans-serif", fontSize:14, fontWeight:800, cursor:"pointer" }}>
                Corrigir e Explicar →
              </button>}
          </div>
        </div>
      </Card>

      {result && !result.error && (
        <div className="fade-up" style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <div style={{ padding:"24px 28px", background:"linear-gradient(135deg,#0a1628,#0d1f3c)", border:"1px solid rgba(59,130,246,.2)", borderRadius:"var(--radius)", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:20 }}>
            <div>
              <Label>Resposta Correta</Label>
              <p style={{ fontFamily:"'Syne',sans-serif", fontSize:36, fontWeight:800, color:"var(--green)", lineHeight:1 }}>{result.resposta_correta}</p>
            </div>
            <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
              {[{ label:"Nível", val:result.nivel, color:nivelColor[result.nivel]||"var(--text2)" }, { label:"Tema", val:result.tema, color:"var(--text2)" }].map(({ label, val, color }) => (
                <div key={label} style={{ background:"rgba(255,255,255,.04)", border:"1px solid var(--border2)", borderRadius:10, padding:"12px 18px" }}>
                  <p style={{ fontFamily:"'Syne',sans-serif", fontSize:10, color:"var(--text3)", letterSpacing:1, textTransform:"uppercase", marginBottom:4 }}>{label}</p>
                  <p style={{ fontFamily:"'Syne',sans-serif", fontSize:14, fontWeight:700, color }}>{val}</p>
                </div>
              ))}
            </div>
          </div>

          <Card style={{ padding:"24px 28px" }}>
            <Label>📖 Explicação</Label>
            <p style={{ fontSize:15, color:"var(--text2)", lineHeight:1.8 }}>{result.explicacao_geral}</p>
            {result.conceito_chave && (
              <div style={{ marginTop:14, padding:"12px 16px", background:"rgba(59,130,246,.08)", borderRadius:"var(--radius-sm)", border:"1px solid rgba(59,130,246,.2)" }}>
                <span style={{ fontFamily:"'Syne',sans-serif", fontSize:12, color:"var(--accent2)", fontWeight:700 }}>CONCEITO-CHAVE: </span>
                <span style={{ fontSize:13.5, color:"var(--text2)" }}>{result.conceito_chave}</span>
              </div>
            )}
          </Card>

          {result.alternativas?.length > 0 && (
            <Card style={{ padding:"24px 28px" }}>
              <Label>📋 Análise das Alternativas</Label>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {result.alternativas.map((alt,i) => (
                  <div key={i} style={{ display:"flex", gap:12, padding:"13px 16px", borderRadius:"var(--radius-sm)", border:`1.5px solid ${alt.correta?"rgba(16,185,129,.35)":"rgba(239,68,68,.12)"}`, background:alt.correta?"rgba(16,185,129,.07)":"rgba(239,68,68,.04)" }}>
                    <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:15, color:alt.correta?"var(--green)":"var(--text3)", minWidth:22 }}>{alt.letra}</span>
                    <div>
                      <p style={{ fontSize:14, color:"var(--text)", marginBottom:5, lineHeight:1.5 }}>{alt.texto}</p>
                      <p style={{ fontSize:13, color:alt.correta?"var(--green)":"var(--text3)", lineHeight:1.5 }}>{alt.correta?"✅ ":"❌ "}{alt.explicacao}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {result.dica_concurso && (
            <div style={{ padding:"22px 28px", borderRadius:"var(--radius)", background:"linear-gradient(135deg,rgba(245,158,11,.08),rgba(245,158,11,.03))", border:"1px solid rgba(245,158,11,.2)" }}>
              <Label>💡 Dica Estratégica</Label>
              <p style={{ fontSize:14.5, color:"var(--text2)", lineHeight:1.75 }}>{result.dica_concurso}</p>
            </div>
          )}
        </div>
      )}
      {result?.error && <Card style={{ padding:24, borderLeft:"3px solid var(--red)" }}><p style={{ color:"var(--red)" }}>Erro: {result.error}</p></Card>}
    </div>
  );
}

/* ══════════════════════════════════════════
   APP SHELL
══════════════════════════════════════════ */
const TABS = [
  { id:"chat",    icon:"🎓", label:"Professor IA" },
  { id:"redacao", icon:"📝", label:"Redação" },
  { id:"questoes",icon:"✅", label:"Questões" },
];

export default function App() {
  const [tab, setTab] = useState("chat");
  return (
    <>
      <GlobalStyles />
      <div style={{ minHeight:"100vh" }}>
        <header style={{ borderBottom:"1px solid var(--border)", backdropFilter:"blur(20px)", background:"rgba(8,15,30,0.9)", position:"sticky", top:0, zIndex:100 }}>
          <div style={{ maxWidth:1100, margin:"0 auto", padding:"14px 24px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:16, flexWrap:"wrap" }}>
            <div style={{ display:"flex", alignItems:"center", gap:14 }}>
              <div style={{ width:42, height:42, borderRadius:12, background:"linear-gradient(135deg,var(--accent),#818cf8)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, boxShadow:"0 4px 20px var(--accent-glow)", animation:"float 4s ease infinite" }}>🏛️</div>
              <div>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:800, lineHeight:1, background:"linear-gradient(90deg,#f0f4ff,var(--accent2))", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
                  Concursando<span style={{ WebkitTextFillColor:"var(--gold)", color:"var(--gold)" }}>.IA</span>
                </div>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:10, color:"var(--text3)", letterSpacing:1.5, marginTop:2, fontWeight:600 }}>PLATAFORMA DE ESTUDOS COM IA</div>
              </div>
            </div>
            <nav style={{ display:"flex", gap:6, background:"var(--surface)", border:"1px solid var(--border)", padding:5, borderRadius:12 }}>
              {TABS.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  style={{ padding:"10px 18px", border:"none", cursor:"pointer", fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:600, borderRadius:8, transition:"all .2s", background:tab===t.id?"var(--accent)":"transparent", color:tab===t.id?"#fff":"var(--text3)", boxShadow:tab===t.id?"0 4px 20px var(--accent-glow)":"none" }}>
                  {t.icon} {t.label}
                </button>
              ))}
            </nav>
            <div style={{ display:"flex", gap:8 }}>
              {["ENEM","Concursos","Vestibular"].map(b => (
                <span key={b} style={{ fontFamily:"'Syne',sans-serif", fontSize:11, fontWeight:700, padding:"4px 10px", borderRadius:99, border:"1px solid var(--border2)", color:"var(--text3)" }}>{b}</span>
              ))}
            </div>
          </div>
        </header>
        <main style={{ maxWidth:1100, margin:"0 auto", padding:"28px 24px" }}>
          {tab==="chat" && <ChatTab />}
          {tab==="redacao" && <RedacaoTab />}
          {tab==="questoes" && <QuestoesTab />}
        </main>
        <footer style={{ borderTop:"1px solid var(--border)", padding:"20px 24px", textAlign:"center", marginTop:24 }}>
          <p style={{ fontFamily:"'Syne',sans-serif", fontSize:12, color:"var(--text3)" }}>Concursando.IA — Tecnologia a serviço da sua aprovação</p>
        </footer>
      </div>
    </>
  );
}
const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "llama3-8b-8192",
    messages: [
      { role: "user", content: userMessage }
    ],
  }),
});

const data = await response.json();
