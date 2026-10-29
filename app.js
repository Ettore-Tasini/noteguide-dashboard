// Dashboard del gestionale: legge il database dopo il login e disegna le pagine.
// Senza configurazione (config.js vuoto) mostra dati di esempio, e lo dice in alto.
const PIATTAFORME = { instagram: 'Instagram', tiktok: 'TikTok', youtube: 'YouTube' };
const SCHEDE = [
  { id: 'oggi', nome: 'Oggi' },
  { id: 'app', nome: 'App' },
  { id: 'social', nome: 'Social' },
  { id: 'esperimenti', nome: 'Esperimenti', fase: 'Arriva con la fase 4, quando escono i primi video: le variabili in prova e quali valori vincono.' },
  { id: 'trend', nome: 'Trend', fase: 'Arriva con la fase 2: i video virali trovati su TikTok, la loro crescita e i ganci scaricati.' },
  { id: 'strategia', nome: 'Strategia', fase: 'Arriva con la fase 2: la strategia in corso e le versioni precedenti.' },
  { id: 'video', nome: 'Video', fase: 'Arriva con la fase 3: anteprima e stato di ogni video prodotto.' },
  { id: 'decisioni', nome: 'Decisioni' },
  { id: 'sistema', nome: 'Sistema' },
];

const fmtNumero = new Intl.NumberFormat('it-IT', { notation: 'compact', maximumFractionDigits: 1 });
const fmtIntero = new Intl.NumberFormat('it-IT');
const fmtEuro = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' });
const fmtDollari = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'USD' });
const numero = (n) => (n == null ? '–' : fmtNumero.format(n));
const euro = (n) => (n == null ? '–' : fmtEuro.format(n));
// I ricavi Apple li dà in dollari («Proceeds in USD»): si mostrano così, senza cambi inventati.
const dollari = (n) => (n == null ? '–' : fmtDollari.format(n));
const giorno = (d) => new Date(d).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
const css = (nome) => getComputedStyle(document.documentElement).getPropertyValue(`--${nome}`).trim();
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const isoGiorno = (d) => d.toISOString().slice(0, 10);
const giorniFa = (n) => { const d = new Date(); d.setUTCHours(0, 0, 0, 0); d.setUTCDate(d.getUTCDate() - n); return d; };

function fa(quando) {
  const minuti = Math.round((Date.now() - new Date(quando)) / 60000);
  if (minuti < 60) return `${minuti} min fa`;
  if (minuti < 48 * 60) return `${Math.round(minuti / 60)} ore fa`;
  return `${Math.round(minuti / 1440)} giorni fa`;
}

function mediana(valori) {
  const v = [...valori].sort((a, b) => a - b);
  if (!v.length) return null;
  const m = Math.floor(v.length / 2);
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
}

// ---------------------------------------------------------------- dati

// Dati di esempio, sempre uguali (generatore con seme fisso), per vedere la dashboard prima del collegamento.
function datiEsempio() {
  let seme = 7;
  const caso = () => { seme = (seme * 16807) % 2147483647; return (seme - 1) / 2147483646; };
  const appGiorni = [];
  for (let i = 60; i >= 2; i--) {
    const d = giorniFa(i);
    const crescita = 1 + (60 - i) / 45;
    const settimana = [0.9, 1, 1, 1.05, 1.1, 1.25, 1.2][d.getUTCDay()];
    const download = Math.round(18 * crescita * settimana * (0.8 + caso() * 0.4));
    appGiorni.push({ giorno: isoGiorno(d), download, sessioni: Math.round(download * 6.5 * (0.85 + caso() * 0.3)),
      dispositivi: Math.round(120 * crescita + caso() * 25), ricavi: +(download * 0.21 * (0.6 + caso() * 0.8)).toFixed(2) });
  }
  const fonti = [['TikTok', 410], ['Instagram', 260], ['Ricerca App Store', 220], ['YouTube', 90], ['Altro', 60]]
    .map(([fonte, download]) => ({ fonte, download }));
  const follower = {};
  for (const [p, base, passo] of [['instagram', 180, 9], ['tiktok', 240, 16], ['youtube', 40, 3]]) {
    follower[p] = [];
    let f = base;
    for (let i = 30; i >= 0; i--) { f += Math.round(passo * (0.4 + caso() * 1.2)); follower[p].push([isoGiorno(giorniFa(i)), f]); }
  }
  const temi = ['animali', 'sport', 'cucina', 'scienza', 'film', 'gaming'];
  const post = [];
  for (let i = 14; i >= 1; i--) {
    for (const p of Object.keys(PIATTAFORME)) {
      for (let k = 0; k < 3; k++) {
        const scala = { instagram: 900, tiktok: 1600, youtube: 500 }[p];
        post.push({ piattaforma: p, data: isoGiorno(giorniFa(i)), titolo: `Gancio ${temi[(i + k) % temi.length]} + Verifica`,
          vis: Math.round(scala * Math.exp((caso() - 0.5) * 2.2)) });
      }
    }
  }
  const ora = Date.now();
  return {
    esempio: true,
    aggiornato: new Date(ora),
    app: { giorni: appGiorni, fonti },
    costiMese: 0,
    follower,
    post,
    avvisi: [
      { alle: new Date(ora - 25 * 60000).toISOString(), livello: 'grave', fonte: 'tiktok', messaggio: 'Captcha nella pagina di caricamento: TikTok in pausa, serve un vostro controllo.' },
      { alle: new Date(ora - 5 * 3600000).toISOString(), livello: 'attenzione', fonte: 'instagram', messaggio: 'La chiave scade fra 6 giorni: il rinnovo automatico non è riuscito.' },
    ],
    decisioni: [
      { alle: new Date(ora - 2 * 3600000).toISOString(), agente: 'Direttore', decisione: 'Questa settimana si provano le aree tematiche.', motivo: 'Mancano dati sulle aree: è la variabile con più incertezza.' },
      { alle: new Date(ora - 26 * 3600000).toISOString(), agente: 'Programmatore', decisione: 'Instagram alle 13 e alle 19.', motivo: 'Sono le ore in cui negli ultimi 14 giorni un PC era acceso.' },
      { alle: new Date(ora - 50 * 3600000).toISOString(), agente: 'Revisore', decisione: 'Bocciato un video: testo con «illimitato».', motivo: "L'AI gratuita ha 15 usi al giorno." },
    ],
    pc: [
      { id: 'PC-ETTORE', persona: 'Ettore', ultimo_battito: new Date(ora - 4 * 60000).toISOString() },
      { id: 'PC-MATTEO', persona: 'Matteo', ultimo_battito: new Date(ora - 9 * 3600000).toISOString() },
    ],
    interruttori: ['tutto', 'pubblicazione', 'risposte', 'dm', 'tiktok'].map((nome) => (
      { nome, attivo: nome !== 'tiktok', motivo: nome === 'tiktok' ? 'captcha' : null, cambiato_alle: new Date(ora - 25 * 60000).toISOString() })),
  };
}

async function datiVeri(sb) {
  const da = isoGiorno(giorniFa(90));
  const inizioMese = isoGiorno(new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)));
  const risposte = await Promise.all([
    sb.from('metriche_app').select('giorno,store,metrica,dimensione,valore').gte('giorno', da),
    sb.from('costi').select('importo').gte('giorno', inizioMese),
    sb.from('metriche_account').select('giorno,piattaforma,valore').eq('metrica', 'follower').gte('giorno', da).order('giorno'),
    sb.from('pubblicazioni').select('id,piattaforma,url,pubblicata_alle,didascalia,video(titolo)').eq('stato', 'pubblicata').gte('pubblicata_alle', da),
    sb.from('metriche_post').select('pubblicazione_id,rilevate_alle,visualizzazioni').gte('rilevate_alle', da).order('rilevate_alle'),
    sb.from('avvisi').select('*').is('risolto_alle', null).order('alle', { ascending: false }).limit(20),
    sb.from('decisioni').select('*').order('alle', { ascending: false }).limit(100),
    sb.from('pc').select('*').order('ultimo_battito', { ascending: false }),
    sb.from('interruttori').select('*').order('nome'),
  ]);
  const errore = risposte.find((r) => r.error);
  if (errore) throw new Error(errore.error.message);
  const [metriche, costi, account, pubblicazioni, metrichePost, avvisi, decisioni, pc, interruttori] = risposte.map((r) => r.data);

  const perGiorno = new Map();
  const fonti = new Map();
  const campagne = new Map();
  const nomiMetriche = { download: 'download', sessioni: 'sessioni', dispositivi: 'dispositivi', ricavi_usd: 'ricavi' };
  for (const m of metriche) {
    for (const [prefisso, mappa] of [['fonte:', fonti], ['campagna:', campagne]]) {
      if (m.metrica === 'download' && m.dimensione.startsWith(prefisso)) {
        const k = m.dimensione.slice(prefisso.length);
        mappa.set(k, (mappa.get(k) || 0) + Number(m.valore));
      }
    }
    if (m.dimensione) continue;
    const g = perGiorno.get(m.giorno) || { giorno: m.giorno, download: 0, sessioni: 0, dispositivi: 0, ricavi: 0 };
    if (nomiMetriche[m.metrica]) g[nomiMetriche[m.metrica]] += Number(m.valore);
    perGiorno.set(m.giorno, g);
  }
  const follower = {};
  for (const a of account) (follower[a.piattaforma] ||= []).push([a.giorno, Number(a.valore)]);
  const ultimaVista = new Map();
  for (const m of metrichePost) ultimaVista.set(m.pubblicazione_id, Number(m.visualizzazioni));
  const post = pubblicazioni.map((p) => ({ piattaforma: p.piattaforma, data: p.pubblicata_alle.slice(0, 10), url: p.url,
    titolo: p.video?.titolo || p.didascalia?.slice(0, 70) || 'Video senza titolo', vis: ultimaVista.get(p.id) ?? null })).filter((p) => p.vis != null);

  return {
    esempio: false,
    aggiornato: new Date(),
    // Se nelle bio ci sono i link con la campagna, si vede da quale piattaforma arrivano i download.
    app: { giorni: [...perGiorno.values()].sort((a, b) => a.giorno.localeCompare(b.giorno)),
      fonti: [...(campagne.size ? campagne : fonti)].map(([fonte, download]) => ({ fonte, download })).sort((a, b) => b.download - a.download) },
    costiMese: costi.reduce((s, c) => s + Number(c.importo), 0),
    follower, post, avvisi, decisioni, pc, interruttori,
  };
}

// ---------------------------------------------------------------- grafici

const grafici = new Set();

function base() {
  return {
    animation: false,
    textStyle: { fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif' },
    tooltip: { backgroundColor: css('superficie'), borderColor: css('bordo'), textStyle: { color: css('testo'), fontSize: 13 } },
    xAxis: { axisLine: { lineStyle: { color: css('asse') } }, axisTick: { show: false }, axisLabel: { color: css('muto'), hideOverlap: true }, splitLine: { show: false } },
    yAxis: { axisLine: { show: false }, axisLabel: { color: css('muto') }, splitLine: { lineStyle: { color: css('griglia'), width: 1 } } },
  };
}

// Sul telefono una data sì e una no sull'asse, perché le etichette non si tocchino.
const etichetteDate = (el) => (v, i) => (el.clientWidth < 500 && i % 2 ? '' : giorno(v));

function disegna(el, opzioni) {
  const g = echarts.init(el, null, { renderer: 'svg' });
  g.setOption(opzioni);
  grafici.add(g);
}

// Conteggi da zero; i follower con la scala stretta, perché conta la crescita.
function linee(el, serie, formato = numero, daZero = true) {
  const b = base();
  disegna(el, {
    ...b,
    grid: { left: 4, right: serie.length > 1 ? 74 : 16, top: 12, bottom: 4, containLabel: true },
    tooltip: { ...b.tooltip, trigger: 'axis', axisPointer: { type: 'line', lineStyle: { color: css('asse') } }, valueFormatter: formato },
    xAxis: { ...b.xAxis, type: 'time', axisLabel: { ...b.xAxis.axisLabel, formatter: etichetteDate(el) } },
    yAxis: { ...b.yAxis, type: 'value', scale: !daZero, axisLabel: { ...b.yAxis.axisLabel, formatter: (v) => formato(v) } },
    series: serie.map((s) => ({
      name: s.nome, type: 'line', data: s.punti, showSymbol: false, symbolSize: 8, connectNulls: false,
      lineStyle: { width: 2, color: s.colore, cap: 'round', join: 'round' },
      itemStyle: { color: s.colore, borderColor: css('superficie'), borderWidth: 2 },
      endLabel: serie.length > 1 ? { show: true, formatter: s.nome, color: css('testo-2'), fontSize: 12 } : undefined,
      emphasis: { focus: 'series' },
    })),
  });
}

// Valore in cima a ogni barra, oppure solo sull'ultima quando le barre sono tante e le etichette si toccano.
function colonne(el, categorie, valori, colore, formato = numero, orizzontali = false, soloUltima = false) {
  const b = base();
  const asseCategorie = { ...b.xAxis, type: 'category', data: categorie };
  const asseValori = { ...b.yAxis, type: 'value', axisLabel: { ...b.yAxis.axisLabel, formatter: (v) => formato(v) } };
  disegna(el, {
    ...b,
    grid: { left: 4, right: orizzontali ? 48 : 8, top: 18, bottom: 4, containLabel: true },
    tooltip: { ...b.tooltip, trigger: 'item', valueFormatter: formato },
    xAxis: orizzontali ? { ...asseValori, splitLine: { show: false }, axisLabel: { show: false } } : asseCategorie,
    yAxis: orizzontali ? { ...asseCategorie, inverse: true, axisLine: { show: false }, splitLine: { show: false } } : asseValori,
    series: [{ type: 'bar', data: valori, barMaxWidth: 24, itemStyle: { color: colore, borderRadius: orizzontali ? [0, 4, 4, 0] : [4, 4, 0, 0] },
      label: { show: true, position: orizzontali ? 'right' : 'top', color: css('testo-2'), fontSize: 12,
        formatter: (p) => (!soloUltima || p.dataIndex === valori.length - 1 ? formato(p.value) : '') } }],
  });
}

// Un punto per video: quante volte ha fatto la mediana della sua piattaforma (1 = nella media).
function punteggi(el, post) {
  const b = base();
  const serie = Object.entries(PIATTAFORME).map(([p, nome]) => ({
    name: nome, type: 'scatter', symbolSize: 9,
    itemStyle: { color: css(p), borderColor: css('superficie'), borderWidth: 2 },
    data: post.filter((x) => x.piattaforma === p).map((x) => ({ value: [x.data, x.punteggio], titolo: x.titolo, vis: x.vis })),
  }));
  serie[0].markLine = { silent: true, symbol: 'none', lineStyle: { color: css('asse'), type: 'dashed' },
    label: { formatter: 'mediana', color: css('muto'), position: 'insideEndTop' }, data: [{ yAxis: 1 }] };
  disegna(el, {
    ...b,
    grid: { left: 4, right: 16, top: 16, bottom: 4, containLabel: true },
    tooltip: { ...b.tooltip, trigger: 'item', formatter: (p) => `${esc(p.data.titolo)}<br>${p.seriesName}, ${giorno(p.data.value[0])}<br>`
      + `${fmtIntero.format(p.data.vis)} visualizzazioni · ${p.data.value[1].toFixed(1).replace('.', ',')}× la mediana` },
    xAxis: { ...b.xAxis, type: 'time', axisLabel: { ...b.xAxis.axisLabel, formatter: etichetteDate(el) } },
    yAxis: { ...b.yAxis, type: 'log', logBase: 2, axisLabel: { ...b.yAxis.axisLabel, formatter: (v) => `${String(v).replace('.', ',')}×` } },
    series: serie,
  });
}

// ---------------------------------------------------------------- pagine

const legenda = (voci) => `<div class="legenda">${voci.map(([nome, colore]) => `<span><i style="background:${colore}"></i>${esc(nome)}</span>`).join('')}</div>`;

function tabella(intestazioni, righe) {
  return `<div class="tabella-scorre"><table><thead><tr>${intestazioni.map(([t, n]) => `<th${n ? ' class="num"' : ''}>${esc(t)}</th>`).join('')}</tr></thead>`
    + `<tbody>${righe.map((r) => `<tr>${r.map((c, i) => `<td${intestazioni[i][1] ? ' class="num"' : ''}>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}

// Una scheda con grafico e, a richiesta, la stessa cosa in tabella.
function schedaGrafico(id, titolo, sotto, extra = '') {
  return `<section class="scheda"><div class="scheda-testa"><div><h2>${esc(titolo)}</h2><p class="sotto">${esc(sotto)}</p></div>`
    + `<button class="bottone-tabella" data-tabella="${id}" aria-pressed="false">Tabella</button></div>${extra}`
    + `<div id="g-${id}" class="grafico" role="img" aria-label="${esc(titolo)}"></div><div id="t-${id}" hidden></div></section>`;
}

function statoAvviso(livello) {
  const nome = { info: 'Info', attenzione: 'Attenzione', grave: 'Grave' }[livello] || livello;
  return `<span class="stato ${livello === 'info' ? 'bene' : esc(livello)}">${esc(nome)}</span>`;
}

function paginaOggi(d) {
  const giorni = d.app.giorni;
  const ultimo = giorni.at(-1);
  const prima = giorni.slice(-8, -1);
  const media = prima.length ? prima.reduce((s, g) => s + g.download, 0) / prima.length : null;
  const delta = ultimo && media ? Math.round(((ultimo.download - media) / media) * 100) : null;
  const ricavi30 = giorni.slice(-30).reduce((s, g) => s + g.ricavi, 0);
  const oggi = isoGiorno(new Date());
  const videoOggi = d.post.filter((p) => p.data === oggi).length;
  const avvisi = d.avvisi.length
    ? `<ul class="elenco">${d.avvisi.map((a) => `<li>${statoAvviso(a.livello)} <b>${esc(PIATTAFORME[a.fonte] || a.fonte)}</b> <span class="quando">${fa(a.alle)}</span><div>${esc(a.messaggio)}</div></li>`).join('')}</ul>`
    : '<p class="vuoto">Nessun avviso aperto.</p>';
  return `
    ${d.esempio ? '<p class="vuoto">Questi sono dati di esempio: il database non è ancora collegato.</p>' : ''}
    <div class="tessere">
      <section class="scheda eroe" style="grid-column: 1 / -1">
        <div class="etichetta">Download, ultimo giorno completo${ultimo ? ` (${giorno(ultimo.giorno)})` : ''}</div>
        <div class="valore">${ultimo ? fmtIntero.format(ultimo.download) : '–'}</div>
        <div class="delta ${delta > 0 ? 'su' : ''}">${delta == null ? 'Servono almeno 8 giorni di dati' : `${delta > 0 ? '+' : ''}${delta}% rispetto alla media dei 7 giorni prima`}</div>
      </section>
      <section class="scheda tessera"><div class="etichetta">Utenti attivi</div><div class="valore">${ultimo ? numero(ultimo.dispositivi) : '–'}</div></section>
      <section class="scheda tessera"><div class="etichetta">Ricavi netti, 30 giorni</div><div class="valore">${dollari(ricavi30)}</div></section>
      <section class="scheda tessera"><div class="etichetta">Costi del mese</div><div class="valore">${euro(d.costiMese)}</div></section>
      <section class="scheda tessera"><div class="etichetta">Video usciti oggi</div><div class="valore">${videoOggi}</div></section>
    </div>
    <div class="griglia">
      <section class="scheda"><h2>Avvisi aperti</h2><p class="sotto">Dal Guardiano e dagli script</p>${avvisi}</section>
      <section class="scheda"><h2>Ultime decisioni</h2><p class="sotto">Tutte nella pagina Decisioni</p>${elencoDecisioni(d.decisioni.slice(0, 3))}</section>
    </div>`;
}

function paginaApp(d) {
  return `<div class="griglia">
    ${schedaGrafico('download', 'Download al giorno', 'Primi download dall\'App Store, ultimi 60 giorni')}
    ${schedaGrafico('attivi', 'Utenti attivi', 'Dispositivi che hanno aperto l\'app, per giorno')}
    ${schedaGrafico('ricavi', 'Ricavi netti per settimana', 'Acquisti di crediti al netto della quota di Apple, in dollari come li dà Apple')}
    ${schedaGrafico('fonti', 'Da dove arrivano i download', 'Ultimi 90 giorni: per campagna se i link nelle bio la indicano, altrimenti per fonte')}
  </div>`;
}

function disegnaApp(d) {
  const g = d.app.giorni;
  const colore = css('app');
  linee(document.getElementById('g-download'), [{ nome: 'Download', colore, punti: g.map((x) => [x.giorno, x.download]) }]);
  linee(document.getElementById('g-attivi'), [{ nome: 'Utenti attivi', colore, punti: g.map((x) => [x.giorno, x.dispositivi]) }]);
  // Solo settimane complete (da lunedì a domenica), così la prima e l'ultima non sembrano un calo.
  const tutte = new Map();
  for (const x of g) {
    const d0 = new Date(x.giorno); d0.setUTCDate(d0.getUTCDate() - ((d0.getUTCDay() + 6) % 7));
    const k = isoGiorno(d0);
    const s = tutte.get(k) || { ricavi: 0, giorni: 0 };
    s.ricavi += x.ricavi; s.giorni += 1;
    tutte.set(k, s);
  }
  const settimane = new Map([...tutte].filter(([, s]) => s.giorni === 7).map(([k, s]) => [k, +s.ricavi.toFixed(2)]));
  colonne(document.getElementById('g-ricavi'), [...settimane.keys()].map(giorno), [...settimane.values()], colore, dollari, false, true);
  colonne(document.getElementById('g-fonti'), d.app.fonti.map((f) => f.fonte), d.app.fonti.map((f) => f.download), colore, numero, true);
  tabelle.download = () => tabella([['Giorno'], ['Download', 1]], g.map((x) => [giorno(x.giorno), fmtIntero.format(x.download)]));
  tabelle.attivi = () => tabella([['Giorno'], ['Utenti attivi', 1]], g.map((x) => [giorno(x.giorno), fmtIntero.format(x.dispositivi)]));
  tabelle.ricavi = () => tabella([['Settimana dal'], ['Ricavi', 1]], [...settimane].map(([k, v]) => [giorno(k), dollari(v)]));
  tabelle.fonti = () => tabella([['Fonte'], ['Download', 1]], d.app.fonti.map((f) => [esc(f.fonte), fmtIntero.format(f.download)]));
}

function conPunteggi(post) {
  const mediane = {};
  for (const p of Object.keys(PIATTAFORME)) mediane[p] = mediana(post.filter((x) => x.piattaforma === p).map((x) => x.vis));
  return post.map((x) => ({ ...x, punteggio: mediane[x.piattaforma] ? Math.max(x.vis, 1) / mediane[x.piattaforma] : null }));
}

function paginaSocial(d) {
  const voci = Object.entries(PIATTAFORME).map(([p, nome]) => [nome, css(p)]);
  const post = conPunteggi(d.post).sort((a, b) => b.data.localeCompare(a.data));
  const righe = post.slice(0, 15).map((x) => [
    `${x.url ? `<a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.titolo)}</a>` : esc(x.titolo)}`
      + `<div class="quando"><span class="punto" style="background:${css(x.piattaforma)}"></span>${esc(PIATTAFORME[x.piattaforma])} · ${giorno(x.data)}</div>`,
    fmtIntero.format(x.vis), x.punteggio == null ? '–' : `${x.punteggio.toFixed(1).replace('.', ',')}×`]);
  return `<div class="griglia">
    ${schedaGrafico('follower', 'Follower', 'Per piattaforma, ultimi 30 giorni', legenda(voci))}
    ${schedaGrafico('punteggi', 'Ogni video rispetto alla sua piattaforma', 'Visualizzazioni divise per la mediana dell\'account: 2× vuol dire il doppio del solito', legenda(voci))}
  </div>
  <section class="scheda" style="margin-top:12px"><h2>Video usciti</h2><p class="sotto">I più recenti, con il punteggio rispetto alla mediana</p>
    ${post.length ? tabella([['Video'], ['Visualizzazioni', 1], ['Punteggio', 1]], righe) : '<p class="vuoto">Ancora nessun video.</p>'}
  </section>`;
}

function disegnaSocial(d) {
  linee(document.getElementById('g-follower'), Object.entries(PIATTAFORME)
    .filter(([p]) => d.follower[p]?.length).map(([p, nome]) => ({ nome, colore: css(p), punti: d.follower[p] })), numero, false);
  const post = conPunteggi(d.post).filter((x) => x.punteggio != null);
  punteggi(document.getElementById('g-punteggi'), post);
  tabelle.follower = () => tabella([['Piattaforma'], ['Giorno'], ['Follower', 1]],
    Object.entries(d.follower).flatMap(([p, punti]) => punti.slice(-7).map(([g, v]) => [esc(PIATTAFORME[p]), giorno(g), fmtIntero.format(v)])));
  tabelle.punteggi = () => tabella([['Piattaforma'], ['Video'], ['Uscito'], ['Punteggio', 1]],
    post.map((x) => [esc(PIATTAFORME[x.piattaforma]), esc(x.titolo), giorno(x.data), `${x.punteggio.toFixed(1).replace('.', ',')}×`]));
}

function elencoDecisioni(decisioni) {
  if (!decisioni.length) return '<p class="vuoto">Ancora nessuna decisione.</p>';
  return `<ul class="elenco">${decisioni.map((x) => `<li><b>${esc(x.agente)}</b> <span class="quando">${fa(x.alle)}</span>`
    + `<div>${esc(x.decisione)}</div><div class="motivo">Perché: ${esc(x.motivo)}</div></li>`).join('')}</ul>`;
}

function paginaDecisioni(d) {
  return `<section class="scheda"><h2>Decisioni degli agenti</h2><p class="sotto">Ogni scelta presa da soli, con il motivo</p>${elencoDecisioni(d.decisioni)}</section>`;
}

function paginaSistema(d) {
  const pc = d.pc.map((p) => {
    const acceso = Date.now() - new Date(p.ultimo_battito) < 20 * 60000;
    return [esc(p.id), esc(p.persona || '?'), `<span class="stato ${acceso ? 'bene' : 'attenzione'}">${acceso ? 'Acceso' : 'Spento'}</span>`, fa(p.ultimo_battito)];
  });
  const interruttori = d.interruttori.map((i) => [esc(i.nome),
    `<span class="stato ${i.attivo ? 'bene' : 'grave'}">${i.attivo ? 'Acceso' : 'Spento'}</span>`,
    i.attivo ? '' : `${esc(i.motivo || '')} · ${fa(i.cambiato_alle)}`]);
  return `<div class="griglia">
    <section class="scheda"><h2>PC</h2><p class="sotto">Battito ogni 10 minuti</p>${tabella([['PC'], ['Di'], ['Stato'], ['Ultimo battito']], pc)}</section>
    <section class="scheda"><h2>Interruttori</h2><p class="sotto">Si cambiano dal terminale: gestionale pausa, gestionale tiktok riprendi</p>${tabella([['Nome'], ['Stato'], ['Perché']], interruttori)}</section>
  </div>`;
}

// ---------------------------------------------------------------- avvio

const tabelle = {};
let dati = null;
let attiva = 'oggi';

function mostra(id) {
  attiva = id;
  for (const g of grafici) g.dispose();
  grafici.clear();
  for (const k of Object.keys(tabelle)) delete tabelle[k];
  document.querySelectorAll('#schede button').forEach((b) => b.setAttribute('aria-current', b.dataset.id === id ? 'page' : 'false'));
  const scheda = SCHEDE.find((s) => s.id === id);
  const main = document.getElementById('contenuto');
  if (scheda.fase) {
    main.innerHTML = `<section class="scheda"><h2>${esc(scheda.nome)}</h2><p class="in-arrivo">${esc(scheda.fase)}</p></section>`;
    return;
  }
  main.innerHTML = { oggi: paginaOggi, app: paginaApp, social: paginaSocial, decisioni: paginaDecisioni, sistema: paginaSistema }[id](dati);
  if (id === 'app') disegnaApp(dati);
  if (id === 'social') disegnaSocial(dati);
  if (location.hash !== `#${id}`) history.replaceState(null, '', `#${id}`);
}

document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-tabella]');
  if (!b) return;
  const id = b.dataset.tabella;
  const grafico = document.getElementById(`g-${id}`);
  const tab = document.getElementById(`t-${id}`);
  const apri = tab.hidden;
  if (apri && tabelle[id]) tab.innerHTML = tabelle[id]();
  tab.hidden = !apri;
  grafico.hidden = apri;
  b.setAttribute('aria-pressed', String(apri));
  b.textContent = apri ? 'Grafico' : 'Tabella';
  if (!apri) echarts.getInstanceByDom(grafico)?.resize();
});

window.addEventListener('resize', () => grafici.forEach((g) => g.resize()));
window.addEventListener('hashchange', () => {
  const id = location.hash.slice(1);
  if (dati && id !== attiva && SCHEDE.some((s) => s.id === id)) mostra(id);
});
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => dati && mostra(attiva));

async function avvia() {
  const nav = document.getElementById('schede');
  nav.innerHTML = SCHEDE.map((s) => `<button data-id="${s.id}">${esc(s.nome)}</button>`).join('');
  nav.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) mostra(b.dataset.id); });

  const { supabaseUrl, supabaseChiavePubblica } = window.GESTIONALE || {};
  const pillola = document.getElementById('stato-dati');
  if (!supabaseUrl || !supabaseChiavePubblica) {
    dati = datiEsempio();
    pillola.textContent = 'Dati di esempio';
    pillola.classList.add('esempio');
  } else {
    const sb = window.supabase.createClient(supabaseUrl, supabaseChiavePubblica);
    const { data: { session } } = await sb.auth.getSession();
    if (!session) return chiediAccesso(sb);
    try {
      dati = await datiVeri(sb);
      pillola.textContent = `Aggiornato alle ${dati.aggiornato.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`;
    } catch (err) {
      document.getElementById('contenuto').innerHTML = `<section class="scheda"><h2>Non riesco a leggere i dati</h2><p class="sotto">${esc(err.message)}</p></section>`;
      return;
    }
  }
  const iniziale = location.hash.slice(1);
  mostra(SCHEDE.some((s) => s.id === iniziale) ? iniziale : 'oggi');
}

function chiediAccesso(sb) {
  document.getElementById('schede').hidden = true;
  const sezione = document.getElementById('accesso');
  sezione.hidden = false;
  document.getElementById('modulo-accesso').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const esito = document.getElementById('esito-accesso');
    const { error } = await sb.auth.signInWithOtp({ email, options: { shouldCreateUser: false, emailRedirectTo: location.origin + location.pathname } });
    esito.textContent = error ? `Non è andata: ${error.message}` : 'Fatto: controlla la posta e apri il link da questo dispositivo.';
  });
}

avvia();
