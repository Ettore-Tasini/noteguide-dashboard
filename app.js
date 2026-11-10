// Dashboard del gestionale: legge il database dopo il login e disegna le pagine.
// Senza configurazione (config.js vuoto) mostra dati di esempio, e lo dice in alto.
const PIATTAFORME = { instagram: 'Instagram', tiktok: 'TikTok', youtube: 'YouTube' };
const SCHEDE = [
  { id: 'oggi', nome: 'Oggi' },
  { id: 'app', nome: 'App' },
  { id: 'social', nome: 'Social' },
  { id: 'coda', nome: 'In coda per la pubblicazione' },
  { id: 'esperimenti', nome: 'Esperimenti' },
  { id: 'commenti', nome: 'Commenti' },
  { id: 'trend', nome: 'Trend', fase: 'Arriva con la fase 2: i video virali trovati su TikTok, la loro crescita e i ganci scaricati.' },
  { id: 'strategia', nome: 'Strategia' },
  { id: 'video', nome: 'Video' },
  { id: 'richieste', nome: 'Richieste' },
  { id: 'decisioni', nome: 'Decisioni' },
  { id: 'sistema', nome: 'Sistema' },
];

// Le fonti come le chiama Apple nei report, in italiano come sul sito di App Store Connect.
const FONTI = { 'App Store search': "Ricerca sull'App Store", 'App Store browse': "Navigazione sull'App Store",
  'App referrer': "Link da un'altra app", 'Web referrer': 'Link da un sito', Unavailable: 'Non disponibile',
  'Institutional purchase': 'Acquisti istituzionali' };
const TASTI = { verifica: 'Verifica', suggerimento: 'Suggerimento', domanda: 'Domanda' };
const nomiPaesi = new Intl.DisplayNames(['it'], { type: 'region' });
const nomePaese = (codice) => { try { return nomiPaesi.of(codice); } catch { return codice; } };

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
  const paesi = [['Italia', 640], ['Stati Uniti', 180], ['Regno Unito', 70], ['Germania', 40]].map(([paese, download]) => ({ paese, download }));
  const follower = {};
  for (const [p, base, passo] of [['instagram', 180, 9], ['tiktok', 240, 16], ['youtube', 40, 3]]) {
    follower[p] = [];
    let f = base;
    for (let i = 30; i >= 0; i--) { f += Math.round(passo * (0.4 + caso() * 1.2)); follower[p].push([isoGiorno(giorniFa(i)), f]); }
  }
  const imbuto = [];
  for (let i = 14; i >= 0; i--) {
    const igVis = Math.round(2000 + caso() * 7000);
    imbuto.push({ giorno: isoGiorno(giorniFa(i)), igVis, igVisite: Math.round(igVis * (0.002 + caso() * 0.003)),
      igTocchi: Math.round(caso() * 4), daFuori: i < 2 ? null : Math.round(caso() * 5), ricerca: i < 2 ? null : Math.round(35 + caso() * 30),
      download: i < 2 ? null : Math.round(3 + caso() * 7) });
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
    app: { giorni: appGiorni, fonti, paesi, imbuto },
    tasti: [3, 2, 1].flatMap((i) => [['verifica', 40], ['suggerimento', 12], ['domanda', 7]]
      .map(([tasto, n]) => ({ giorno: isoGiorno(giorniFa(i)), tasto, quanti: Math.round(n * (0.7 + caso() * 0.6)) }))),
    costiMese: 0,
    strategie: [
      { id: 1, alle: new Date(ora - 40 * 60000).toISOString(), svolta: true, riassunto: 'Apro «Gag dopo l\'app»: Mago tiene il 63% di visione.',
        testo: '# Strategia di esempio\n\n## In 3 righe\n- Apro un esperimento: **gag dopo l\'app**.\n- Gli animati restano 7 video su 10.\n- Il Ricercatore cerca meme «Prof / Io».' },
    ],
    esperimenti: [
      { id: 2, creato_alle: new Date(ora - 40 * 60000).toISOString(), nome: 'Gag dopo l\'app', formato: 'animato 3D', piattaforma: 'instagram', cosa_cambia: 'storia', stato: 'in_corso',
        ipotesi: 'Una battuta dopo il segno rosso tiene la gente fino in fondo.', quota: '2 video su 10', come_si_giudica: 'punteggio sui primi 3-5 video maturi' },
      { id: 1, creato_alle: new Date(ora - 4 * 86400000).toISOString(), nome: 'Meme «Prof / Io»', formato: 'meme', piattaforma: 'tiktok', cosa_cambia: 'formato e grafica', stato: 'perso',
        ipotesi: 'Un meme fermo da 7 secondi costa poco e gira.', verdetto: 'punteggio 0,4 su 4 video', sicurezza: 'media', chiuso_alle: new Date(ora - 86400000).toISOString() },
    ],
    commenti: [
      { id: 2, alle: new Date(ora - 3 * 3600000).toISOString(), piattaforma: 'instagram', autore: 'giulia', commento: 'Does it work with geometry too?', bozza: null, tipo: 'domanda', stato: 'a_persona', motivo: 'non è nei fatti dell’app', post_url: '#' },
      { id: 1, alle: new Date(ora - 5 * 3600000).toISOString(), piattaforma: 'instagram', autore: 'luca', commento: '🔥🔥🔥 the cake', bozza: 'Grandpa survived, the cake did not 😅 Thanks!', tipo: 'complimento', stato: 'bozza', post_url: '#' },
    ],
    lezioni: [
      { id: 1, alle: new Date(ora - 86400000).toISOString(), testo: 'La visione media finisce sul segno rosso di NoteGuide.', contesto: 'animati, Instagram, novembre', numeri: '4 video su 5', sicurezza: 'media' },
    ],
    richieste: [
      { id: 2, da: 'Ettore', per: 'Matteo', stato: 'nuova', testo: 'Prova la ricerca del Ricercatore con «homework hack».', creata_alle: new Date(ora - 3 * 60000).toISOString() },
      { id: 1, da: 'Matteo', per: 'Ettore', stato: 'fatta', pc: 'PC-ETTORE', testo: 'Dimmi quanti video sono in coda.', creata_alle: new Date(ora - 50 * 60000).toISOString(),
        risposta: '**4 video in coda**, il prossimo esce alle 19:30 su Instagram.\n\n- Torta: TikTok 21:00\n- Palestra: YouTube domani 17:00' },
    ],
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
      { id: 'PC-ETTORE', persona: 'Ettore', ultimo_battito: new Date(ora - 4 * 60000).toISOString(),
        info: { crediti: { cinque_ore: 0.42, sblocco_cinque_ore: new Date(ora + 100 * 60000).toISOString(), settimana: 0.18,
          sblocco_settimana: new Date(ora + 2 * 86400000).toISOString() } } },
      { id: 'PC-MATTEO', persona: 'Matteo', ultimo_battito: new Date(ora - 9 * 3600000).toISOString() },
    ],
    attivi: [
      { agente: 'animatore', pc: 'PC-ETTORE', da: new Date(ora - 95 * 60000).toISOString(), cosa: 'Richiesta 108: video animato nuovo, dalla storia alla coda' },
      { agente: 'animatore', pc: 'PC-ETTORE', da: new Date(ora - 12 * 60000).toISOString(), cosa: 'Richiesta 111: «La piscina», esperimento 1' },
      { agente: 'stratega', pc: 'PC-ETTORE', da: new Date(ora - 2 * 60000).toISOString(), cosa: 'Rifornimento: video nuovi per l\'Animatore' },
    ],
    coda: [
      { titolo: 'NoteGuide-esempio', copertina: null, url: null, uscite: ['instagram', 'tiktok'].map((p) => (
        { piattaforma: p, stato: 'programmata', quando: new Date(ora + 3 * 3600000).toISOString(),
          didascalia: 'Wait for it… 🚀\n\nWrite it by hand, tap Check and NoteGuide shows you exactly where the mistake is.\n\n#math #noteguide' })) },
    ],
    video: [
      { titolo: 'NoteGuide-esempio', stato: 'in_coda', creato: new Date(ora - 5 * 3600000).toISOString(), copertina: null, url: null,
        uscite: [{ piattaforma: 'instagram', stato: 'programmata', quando: new Date(ora + 3 * 3600000).toISOString(), url: null, vis: null }] },
      { titolo: 'NoteGuide-razzo', stato: 'uscito', creato: new Date(ora - 3 * 86400000).toISOString(), copertina: null, url: null,
        uscite: ['instagram', 'tiktok', 'youtube'].map((p, i) => (
          { piattaforma: p, stato: 'pubblicata', quando: new Date(ora - 2 * 86400000).toISOString(), url: '#', vis: [1400, 320, 85][i] })) },
      { titolo: 'NoteGuide-meme', stato: 'bocciato', creato: new Date(ora - 4 * 86400000).toISOString(), copertina: null, url: null, uscite: [] },
    ],
    interruttori: ['tutto', 'pubblicazione', 'risposte', 'dm', 'tiktok'].map((nome) => (
      { nome, attivo: nome !== 'tiktok', motivo: nome === 'tiktok' ? 'captcha' : null, cambiato_alle: new Date(ora - 25 * 60000).toISOString() })),
  };
}

// Supabase dà al massimo 1.000 righe per richiesta. Le tabelle che crescono ogni giorno si leggono a pagine, fino in
// fondo: il 10/11 le letture dei post erano 1.807 e la pagina si fermava alla millesima, cioè al 7 novembre.
// `domanda` costruisce la richiesta da capo a ogni pagina, con un ordine che non cambia (la chiave della tabella) e
// con `count: 'exact'`, che dice quante righe sono in tutto.
const PAGINA = 1000;
async function tutte(domanda) {
  const righe = [];
  for (;;) {
    const { data, error, count } = await domanda().range(righe.length, righe.length + PAGINA - 1);
    if (error) return { data: null, error };
    righe.push(...data);
    const finite = count != null ? righe.length >= count : data.length < PAGINA;
    if (!data.length || finite) return { data: righe, error: null };
  }
}

async function datiVeri(sb) {
  const da = isoGiorno(giorniFa(90));
  const conta = { count: 'exact' };
  const inizioMese = isoGiorno(new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)));
  const risposte = await Promise.all([
    tutte(() => sb.from('metriche_app').select('giorno,store,metrica,dimensione,valore', conta).gte('giorno', da)
      .order('giorno').order('store').order('metrica').order('dimensione')),
    sb.from('costi').select('importo').gte('giorno', inizioMese),
    tutte(() => sb.from('metriche_account').select('giorno,piattaforma,valore', conta).eq('metrica', 'follower').gte('giorno', da)
      .order('giorno').order('piattaforma')),
    tutte(() => sb.from('pubblicazioni').select('id,piattaforma,url,pubblicata_alle,didascalia,video(titolo)', conta)
      .eq('stato', 'pubblicata').gte('pubblicata_alle', da).order('pubblicata_alle').order('id')),
    tutte(() => sb.from('metriche_post').select('pubblicazione_id,rilevate_alle,visualizzazioni', conta).gte('rilevate_alle', da)
      .order('rilevate_alle').order('pubblicazione_id')),
    sb.from('avvisi').select('*').is('risolto_alle', null).order('alle', { ascending: false }).limit(20),
    sb.from('decisioni').select('*').order('alle', { ascending: false }).limit(100),
    sb.from('pc').select('*').order('ultimo_battito', { ascending: false }),
    sb.from('interruttori').select('*').order('nome'),
    sb.from('pubblicazioni').select('piattaforma,stato,programmata_per,didascalia,video_id,video(titolo,anteprima,note)')
      .in('stato', ['in_corso', 'programmata']).order('programmata_per'),
    tutte(() => sb.from('tasti_app').select('giorno,tasto,quanti', conta).gte('giorno', da).order('giorno').order('tasto')),
    sb.from('richieste').select('*').order('creata_alle', { ascending: false }).limit(30),
    sb.from('strategie').select('*').order('alle', { ascending: false }).limit(15),
    sb.from('esperimenti').select('*').order('creato_alle', { ascending: false }).limit(100),
    sb.from('lezioni').select('*').order('alle', { ascending: false }).limit(50),
    sb.from('risposte_commenti').select('*').order('alle', { ascending: false }).limit(60),
    sb.from('video').select('titolo,stato,anteprima,creato_alle,note,pubblicazioni(id,piattaforma,stato,url,programmata_per,pubblicata_alle)')
      .order('creato_alle', { ascending: false }).limit(60),
    sb.from('metriche_account').select('giorno,metrica,valore').eq('piattaforma', 'instagram')
      .in('metrica', ['visualizzazioni', 'visite_profilo', 'tocchi_link']).gte('giorno', isoGiorno(giorniFa(30))),
    sb.from('richieste').select('id,agente,per,pc,iniziata_alle,minuti,testo').eq('stato', 'in_corso'),
    sb.from('turni').select('lavoro,slot,pc,preso_alle').is('finito_alle', null).gt('scade_alle', new Date().toISOString())
      .like('lavoro', 'agente_%'),
  ]);
  const errore = risposte.find((r) => r.error);
  if (errore) throw new Error(errore.error.message);
  const [metriche, costi, account, pubblicazioni, metrichePost, avvisi, decisioni, pc, interruttori, inCoda, tasti, richieste, strategie, esperimenti, lezioni, commenti, video, profiloIg, inCorso, turniAperti] = risposte.map((r) => r.data);

  const perGiorno = new Map();
  const fonti = new Map();
  const campagne = new Map();
  const paesi = new Map();
  const nomiMetriche = { download: 'download', sessioni: 'sessioni', dispositivi: 'dispositivi', ricavi_usd: 'ricavi' };
  for (const m of metriche) {
    for (const [prefisso, mappa] of [['fonte:', fonti], ['campagna:', campagne], ['paese:', paesi]]) {
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
  const imbuto = imbutoDai(metriche, profiloIg);
  for (const m of metrichePost) ultimaVista.set(m.pubblicazione_id, Number(m.visualizzazioni));
  const post = pubblicazioni.map((p) => ({ piattaforma: p.piattaforma, data: p.pubblicata_alle.slice(0, 10), url: p.url,
    titolo: p.video?.titolo || p.didascalia?.slice(0, 70) || 'Video senza titolo', vis: ultimaVista.get(p.id) ?? null })).filter((p) => p.vis != null);

  return {
    esempio: false,
    aggiornato: new Date(),
    // Se nelle bio ci sono i link con la campagna, si vede da quale piattaforma arrivano i download.
    app: { giorni: [...perGiorno.values()].sort((a, b) => a.giorno.localeCompare(b.giorno)),
      fonti: [...(campagne.size ? campagne : fonti)].map(([fonte, download]) => ({ fonte: FONTI[fonte] || fonte, download }))
        .filter((f) => f.download > 0).sort((a, b) => b.download - a.download),
      paesi: [...paesi].map(([codice, download]) => ({ paese: nomePaese(codice), download })).sort((a, b) => b.download - a.download),
      imbuto },
    costiMese: costi.reduce((s, c) => s + Number(c.importo), 0),
    follower, post, avvisi, decisioni, pc, interruttori, tasti, richieste, strategie, esperimenti, lezioni, commenti,
    attivi: agentiAttivi(inCorso, turniAperti),
    video: video.map((v) => ({ titolo: v.titolo || 'Video senza titolo', stato: v.stato, creato: v.creato_alle,
      copertina: v.anteprima, url: v.note?.url_video,
      uscite: v.pubblicazioni.map((p) => ({ piattaforma: p.piattaforma, stato: p.stato, quando: p.pubblicata_alle || p.programmata_per,
        url: p.url, vis: ultimaVista.get(p.id) ?? null })) })),
    coda: raggruppaCoda(inCoda.map((p) => ({ piattaforma: p.piattaforma, stato: p.stato, quando: p.programmata_per, didascalia: p.didascalia,
      video: p.video_id, titolo: p.video?.titolo, copertina: p.video?.anteprima, url: p.video?.note?.url_video }))),
  };
}

// Una scheda per video: le sue uscite (piattaforma, ora, descrizione), il video da guardare e la copertina.
function raggruppaCoda(righe) {
  const perVideo = new Map();
  for (const r of righe) {
    const v = perVideo.get(r.video) || { titolo: r.titolo || 'Video senza titolo', copertina: r.copertina, url: r.url, uscite: [] };
    v.uscite.push({ piattaforma: r.piattaforma, stato: r.stato, quando: r.quando, didascalia: r.didascalia });
    perVideo.set(r.video, v);
  }
  const prima = (v) => v.uscite.map((u) => u.quando || '9999').sort()[0];
  return [...perVideo.values()].sort((a, b) => prima(a).localeCompare(prima(b)));
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
      ...s.extra,
    })),
  });
}

// Colonne una sopra l'altra per giorno (una serie per piattaforma), con il bordo del fondo a staccare i pezzi.
function pile(el, giorni, serie, formato = numero) {
  const b = base();
  disegna(el, {
    ...b,
    grid: { left: 4, right: 8, top: 12, bottom: 4, containLabel: true },
    tooltip: { ...b.tooltip, trigger: 'axis', axisPointer: { type: 'shadow', shadowStyle: { color: css('griglia') } }, valueFormatter: formato },
    xAxis: { ...b.xAxis, type: 'category', data: giorni, axisLabel: { ...b.xAxis.axisLabel, formatter: etichetteDate(el) } },
    yAxis: { ...b.yAxis, type: 'value', axisLabel: { ...b.yAxis.axisLabel, formatter: (v) => formato(v) } },
    series: serie.map((s, i) => ({ name: s.nome, type: 'bar', stack: 'tot', data: s.valori, barMaxWidth: 24,
      itemStyle: { color: s.colore, borderColor: css('superficie'), borderWidth: 2,
        borderRadius: i === serie.length - 1 ? [4, 4, 0, 0] : 0 } })),
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
        <p class="sotto" style="margin:6px 0 0">Apple dà i numeri dell'app dopo circa 2 giorni: questo è il giorno più recente che esiste. Video, visualizzazioni e avvisi sono di adesso.</p>
      </section>
      <section class="scheda tessera"><div class="etichetta">Utenti attivi${ultimo ? ` (${giorno(ultimo.giorno)})` : ''}</div><div class="valore">${ultimo ? numero(ultimo.dispositivi) : '–'}</div></section>
      <section class="scheda tessera"><div class="etichetta">Ricavi netti, 30 giorni</div><div class="valore">${dollari(ricavi30)}</div></section>
      <section class="scheda tessera"><div class="etichetta">Costi del mese</div><div class="valore">${euro(d.costiMese)}</div></section>
      <section class="scheda tessera"><div class="etichetta">Video usciti oggi</div><div class="valore">${videoOggi}</div></section>
    </div>
    <div class="griglia">
      ${schedaAttivi(d)}
      <section class="scheda"><h2>Avvisi aperti</h2><p class="sotto">Dal Capo operativo e dagli script</p>${avvisi}</section>
      <section class="scheda"><h2>Ultime decisioni</h2><p class="sotto">Tutte nella pagina Decisioni</p>${elencoDecisioni(d.decisioni.slice(0, 3))}</section>
    </div>`;
}

// Gli agenti al lavoro adesso (Ettore, 9/11): le richieste in corso (Animatore e Claude in sottofondo) e i giri del
// calendario o del rifornimento non ancora finiti. Una richiesta oltre il suo tempo non conta: è un giro morto.
const NOMI_AGENTI = { capo: 'Capo operativo', animatore: 'Animatore', stratega: 'Stratega', analista: 'Analista', ricercatore: 'Ricercatore', community: 'Community manager' };
function agentiAttivi(inCorso, turniAperti) {
  const vivi = inCorso.filter((r) => !r.iniziata_alle || Date.now() - new Date(r.iniziata_alle) < ((r.minuti || 60) + 30) * 60000);
  return [
    ...vivi.map((r) => ({ agente: r.agente || `claude di ${r.per}`, pc: r.pc, da: r.iniziata_alle,
      cosa: `Richiesta ${r.id}: ${(r.testo || '').replace(/\s+/g, ' ').slice(0, 90)}` })),
    ...turniAperti.map((t) => ({ agente: t.lavoro.replace('agente_', ''), pc: t.pc, da: t.preso_alle,
      cosa: t.slot.startsWith('rif-') ? 'Rifornimento: video nuovi per l\'Animatore' : `Giro del ${t.slot}` })),
  ].sort((a, b) => String(a.da).localeCompare(String(b.da)));
}

function schedaAttivi(d) {
  const persona = Object.fromEntries(d.pc.map((p) => [p.id, p.persona || p.id]));
  const pct = (v) => (v == null ? '?' : `${Math.round(v * 100)}%`);
  const ora = (v) => (v ? new Date(v).toLocaleString('it-IT', { weekday: 'short', hour: '2-digit', minute: '2-digit' }) : '?');
  const crediti = d.pc.filter((p) => p.info?.crediti).map((p) => {
    const c = p.info.crediti;
    return `<p class="sotto" style="margin:4px 0">Claude di ${esc(p.persona || p.id)}: sessione di 5 ore al <strong>${pct(c.cinque_ore)}</strong>
      (si rinnova ${esc(ora(c.sblocco_cinque_ore))}), settimana al ${pct(c.settimana)}. Al 90% la produzione si ferma fino al rinnovo.</p>`;
  }).join('');
  const righe = (d.attivi || []).map((a) => [`<b>${esc(NOMI_AGENTI[a.agente] || a.agente)}</b>`, esc(persona[a.pc] || a.pc || '?'),
    a.da ? fa(a.da) : '–', esc(a.cosa)]);
  return `<section class="scheda" style="grid-column: 1 / -1"><h2>Agenti al lavoro adesso</h2>${crediti}
    ${righe.length ? tabella([['Agente'], ['PC di'], ['Partito'], ['Cosa fa']], righe) : '<p class="vuoto">Nessun agente al lavoro in questo momento.</p>'}</section>`;
}

// Dal video al download, giorno per giorno (9/11): visualizzazioni, visite al profilo e tocchi sul link di Instagram;
// visite alla pagina dell'App Store arrivate da fuori (link da un'altra app o dal web, più la pagina web
// dell'App Store), volte in cui NoteGuide compare nella ricerca, download. Un numero non ancora letto resta vuoto.
const DA_FUORI = ['fonte:App referrer', 'fonte:Web referrer'];
function imbutoDai(metriche, profiloIg) {
  const giorni = new Map();
  const g = (k) => giorni.get(k) || giorni.set(k, { giorno: k, igVis: null, igVisite: null, igTocchi: null, daFuori: null, ricerca: null, download: null }).get(k);
  const somma = (x, campo, v) => { x[campo] = (x[campo] ?? 0) + v; };
  for (const a of profiloIg) {
    const campo = { visualizzazioni: 'igVis', visite_profilo: 'igVisite', tocchi_link: 'igTocchi' }[a.metrica];
    if (campo) g(a.giorno)[campo] = Number(a.valore);
  }
  for (const m of metriche) {
    const v = Number(m.valore);
    if (m.metrica === 'download' && !m.dimensione) g(m.giorno).download = v;
    else if (m.metrica === 'impressioni' && !m.dimensione) { const x = g(m.giorno); x.daFuori ??= 0; x.ricerca ??= 0; }
    if (m.metrica === 'impressioni' && m.dimensione === 'fonte:App Store search') g(m.giorno).ricerca = v;
    if ((m.metrica === 'visite_pagina' && DA_FUORI.includes(m.dimensione)) || (m.metrica === 'visite_web' && !m.dimensione)) somma(g(m.giorno), 'daFuori', v);
  }
  const da = isoGiorno(giorniFa(30));
  return [...giorni.values()].filter((x) => x.giorno >= da).sort((a, b) => a.giorno.localeCompare(b.giorno));
}

// Visite al profilo e tocchi sul link ogni 1.000 visualizzazioni, sugli ultimi 14 giorni che hanno tutti e tre i numeri.
function ogniMille(imbuto) {
  const pieni = imbuto.filter((x) => x.igVis && x.igVisite != null && x.igTocchi != null).slice(-14);
  const vis = pieni.reduce((s, x) => s + x.igVis, 0);
  if (!vis) return null;
  return { giorni: pieni.length, vis, visite: pieni.reduce((s, x) => s + x.igVisite, 0), tocchi: pieni.reduce((s, x) => s + x.igTocchi, 0) };
}

function righeImbuto(om) {
  if (!om) return '<p class="vuoto">I numeri del profilo di Instagram arrivano con la prossima raccolta.</p>';
  const virgola = (v) => v.toFixed(v < 1 ? 2 : 1).replace('.', ',');
  return `<p class="delta" style="margin:0 0 8px">Instagram, ultimi ${om.giorni} giorni: <strong>${virgola(om.visite / om.vis * 1000)} visite al profilo</strong> e
    <strong>${virgola(om.tocchi / om.vis * 1000)} tocchi sul link</strong> ogni 1.000 visualizzazioni
    (${fmtIntero.format(om.vis)} visualizzazioni, ${fmtIntero.format(om.visite)} visite, ${fmtIntero.format(om.tocchi)} tocchi).</p>`;
}

// Download portati dai social, stimati: dai social non arrivano link (chi vede un video cerca NoteGuide sull'App
// Store), quindi si confrontano i download dal primo video uscito con la media dei 28 giorni prima. Il margine è
// quanto variano da soli i download in quel numero di giorni. I giorni di Apple sono completi dopo 2.
function stimaSocial(d) {
  const inizio = d.post.map((p) => p.data).sort()[0];
  const fine = isoGiorno(giorniFa(2));
  const prima = d.app.giorni.filter((x) => x.giorno < inizio).slice(-28);
  const dopo = d.app.giorni.filter((x) => x.giorno >= inizio && x.giorno <= fine);
  if (!inizio || prima.length < 14 || !dopo.length) return null;
  const media = prima.reduce((s, x) => s + x.download, 0) / prima.length;
  const scarto = Math.sqrt(prima.reduce((s, x) => s + (x.download - media) ** 2, 0) / prima.length);
  const fatti = dopo.reduce((s, x) => s + x.download, 0);
  const attesi = media * dopo.length;
  const vis = d.post.filter((p) => p.data >= inizio && p.data <= fine).reduce((s, p) => s + p.vis, 0);
  return { inizio, fine: dopo.at(-1).giorno, media, fatti, attesi, extra: Math.round(fatti - attesi),
    margine: Math.round(scarto * Math.sqrt(dopo.length)), vis };
}

function schedaStima(st) {
  const testa = '<section class="scheda eroe" style="grid-column: 1 / -1"><div class="etichetta">Download portati dai social, stima';
  if (!st) return `${testa}</div><p class="vuoto">Servono almeno 14 giorni di download prima del primo video.</p></section>`;
  const ogniMille = st.extra > 0 && st.vis
    ? ` Circa ${(st.extra / st.vis * 1000).toFixed(1).replace('.', ',')} download ogni 1.000 visualizzazioni (${fmtIntero.format(st.vis)} quelle dei video usciti in quei giorni).` : '';
  const chiaro = st.extra > st.margine ? 'più di quanto variano da soli' : 'dentro quanto variano da soli, quindi per ora non si distingue dal caso';
  return `${testa} (dal ${giorno(st.inizio)} al ${giorno(st.fine)})</div>
      <div class="valore">${st.extra > 0 ? '+' : ''}${fmtIntero.format(st.extra)}</div>
      <div class="delta">${fmtIntero.format(st.fatti)} download contro i ${fmtIntero.format(Math.round(st.attesi))} attesi con la media dei 28 giorni prima
        (${st.media.toFixed(1).replace('.', ',')} al giorno). Margine ±${st.margine}: ${chiaro}.${ogniMille}</div>
      <p class="sotto" style="margin:8px 0 0">Dai social non arrivano link: chi vede un video cerca NoteGuide sull'App Store, e Apple lo conta come ricerca. Per questo è una stima e non un conteggio.</p>
    </section>`;
}

function paginaApp(d) {
  return `<div class="tessere">${schedaStima(stimaSocial(d))}</div><div class="griglia">
    ${schedaGrafico('imbuto', 'Dal video al download', 'Per giorno. Instagram: visite al profilo (i reel da soli non le danno). App Store: visite alla pagina arrivate da un link esterno, e download. I numeri di Apple arrivano dopo circa 2 giorni', righeImbuto(ogniMille(d.app.imbuto || [])))}
    ${schedaGrafico('download', 'Download al giorno', 'Primi download dall\'App Store. Tratteggio: la media prima dei social; zona grigia: da quando escono i video')}
    ${schedaGrafico('visual', 'Visualizzazioni dei video', 'Per giorno di uscita, tutti i social, ultimi numeri letti', legenda(Object.entries(PIATTAFORME).map(([p, nome]) => [nome, css(p)])))}
    ${schedaGrafico('attivi', 'Utenti attivi', 'Dispositivi che hanno aperto l\'app, per giorno')}
    ${schedaGrafico('ricavi', 'Ricavi netti per settimana', 'Acquisti di crediti al netto della quota di Apple, in dollari come li dà Apple')}
    ${schedaGrafico('fonti', 'Da dove arrivano i download', 'Ultimi 90 giorni: per campagna se i link nelle bio la indicano, altrimenti per fonte')}
    ${schedaGrafico('paesi', 'Da quali paesi', 'Primi download degli ultimi 90 giorni')}
    ${schedaGrafico('tasti', 'I tasti dell\'app, dal più usato', `Quante volte si sceglie una voce dalla tendina di Verifica, Suggerimento e Domanda${d.tasti.length ? `, dal ${giorno(d.tasti[0].giorno)}` : ''}. Solo il numero, non chi li preme; il tutorial non conta`)}
  </div>`;
}

function disegnaApp(d) {
  const g = d.app.giorni;
  const colore = css('app');
  const imb = d.app.imbuto || [];
  linee(document.getElementById('g-imbuto'), [
    { nome: 'Profilo IG', colore: css('instagram'), punti: imb.map((x) => [x.giorno, x.igVisite]) },
    { nome: 'Da fuori', colore: css('muto'), punti: imb.map((x) => [x.giorno, x.daFuori]) },
    { nome: 'Download', colore, punti: imb.map((x) => [x.giorno, x.download]) }]);
  const cella = (v) => (v == null ? '–' : fmtIntero.format(v));
  tabelle.imbuto = () => tabella([['Giorno'], ['IG visual.', 1], ['Visite al profilo', 1], ['Tocchi sul link', 1], ['App Store da fuori', 1], ['Nella ricerca', 1], ['Download', 1]],
    [...imb].reverse().map((x) => [giorno(x.giorno), cella(x.igVis), cella(x.igVisite), cella(x.igTocchi), cella(x.daFuori), cella(x.ricerca), cella(x.download)]));
  const st = stimaSocial(d);
  linee(document.getElementById('g-download'), [{ nome: 'Download', colore, punti: g.map((x) => [x.giorno, x.download]), extra: st ? {
    markLine: { silent: true, symbol: 'none', lineStyle: { color: css('asse'), type: 'dashed' },
      label: { formatter: 'media prima', color: css('muto'), position: 'insideStartTop' }, data: [{ yAxis: +st.media.toFixed(1) }] },
    markArea: { silent: true, itemStyle: { color: css('griglia') }, data: [[{ xAxis: st.inizio }, { xAxis: g.at(-1).giorno }]] } } : undefined }]);
  const giorniVideo = [...new Set(d.post.map((p) => p.data))].sort();
  const visual = Object.entries(PIATTAFORME).map(([p, nome]) => ({ nome, colore: css(p),
    valori: giorniVideo.map((gv) => d.post.filter((x) => x.piattaforma === p && x.data === gv).reduce((s, x) => s + x.vis, 0)) }));
  pile(document.getElementById('g-visual'), giorniVideo, visual);
  const paesi = d.app.paesi.slice(0, 8);
  colonne(document.getElementById('g-paesi'), paesi.map((x) => x.paese), paesi.map((x) => x.download), colore, numero, true);
  tabelle.visual = () => tabella([['Giorno'], ...visual.map((v) => [v.nome, 1])],
    giorniVideo.map((gv, i) => [giorno(gv), ...visual.map((v) => fmtIntero.format(v.valori[i]))]));
  const totTasti = Object.entries(TASTI).map(([k, nome]) => [nome, d.tasti.filter((x) => x.tasto === k).reduce((s, x) => s + x.quanti, 0)])
    .sort((a, b) => b[1] - a[1]);
  colonne(document.getElementById('g-tasti'), totTasti.map((x) => x[0]), totTasti.map((x) => x[1]), colore, numero, true);
  const giorniTasti = [...new Set(d.tasti.map((x) => x.giorno))].sort().reverse();
  tabelle.tasti = () => tabella([['Giorno'], ...Object.values(TASTI).map((n) => [n, 1])], giorniTasti.map((gt) => [giorno(gt),
    ...Object.keys(TASTI).map((k) => fmtIntero.format(d.tasti.find((x) => x.giorno === gt && x.tasto === k)?.quanti ?? 0))]));
  tabelle.paesi = () => tabella([['Paese'], ['Download', 1]], d.app.paesi.map((x) => [esc(x.paese), fmtIntero.format(x.download)]));
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

const ora = (d) => new Date(d).toLocaleString('it-IT', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

function paginaCoda(d) {
  if (!d.coda.length) return '<section class="scheda"><h2>In coda per la pubblicazione</h2><p class="vuoto">Nessun video in coda.</p></section>';
  const schede = d.coda.map((v) => {
    const uscite = v.uscite.map((u) => `<div class="uscita">
        <div class="quando"><span class="punto" style="background:${css(u.piattaforma)}"></span><strong>${esc(PIATTAFORME[u.piattaforma])}</strong> · ${u.quando ? esc(ora(u.quando)) : 'in caricamento'}</div>
        <p class="didascalia">${esc(u.didascalia || '')}</p>
      </div>`).join('');
    const player = v.url
      ? `<video class="video-coda" controls playsinline preload="none" ${v.copertina ? `poster="${esc(v.copertina)}"` : ''} src="${esc(v.url)}"></video>`
      : '<div class="video-coda vuoto">Video non ancora caricato</div>';
    const copertina = v.copertina
      ? `<figure class="copertina"><img src="${esc(v.copertina)}" alt="Copertina di ${esc(v.titolo)}" loading="lazy"><figcaption>Copertina</figcaption></figure>` : '';
    return `<section class="scheda voce-coda"><div class="media-coda">${player}${copertina}</div>
      <div class="testo-coda"><h2>${esc(v.titolo)}</h2>${uscite}</div></section>`;
  }).join('');
  return `<p class="sotto intro-coda">I video programmati: escono da soli all'ora scritta, anche a PC spenti. Il video e la copertina restano qui finché non sono usciti dappertutto.</p>${schede}`;
}

// I video prodotti, dal più nuovo: la copertina, a che punto sono e come sono andati su ogni social.
const STATI_VIDEO = { idea: 'Idea', in_lavorazione: 'In lavorazione', in_revisione: 'Da rivedere', bocciato: 'Bocciato',
  in_coda: 'In coda', uscito: 'Uscito', analizzato: 'Analizzato' };
const USCITE = { pubblicata: ['bene', 'Uscito'], programmata: ['attenzione', 'Programmato'], in_corso: ['attenzione', 'In caricamento'], errore: ['grave', 'Errore'] };

function paginaVideo(d) {
  if (!d.video.length) return '<section class="scheda"><h2>Video</h2><p class="vuoto">Nessun video prodotto.</p></section>';
  const schede = d.video.map((v) => {
    // Un video resta «in_coda» anche dopo le prime uscite: se è già uscito da qualche parte si dice così.
    const stato = v.stato === 'in_coda' && v.uscite.some((u) => u.stato === 'pubblicata') ? 'uscito' : v.stato;
    const colore = { bocciato: 'grave', uscito: 'bene', analizzato: 'bene', in_revisione: 'attenzione' }[stato] || '';
    const uscite = v.uscite.map((u) => {
      const [classe, nome] = USCITE[u.stato] || ['', u.stato];
      const social = u.url ? `<a href="${esc(u.url)}" target="_blank" rel="noopener">${esc(PIATTAFORME[u.piattaforma])}</a>` : esc(PIATTAFORME[u.piattaforma]);
      return `<li><span class="punto" style="background:${css(u.piattaforma)}"></span><strong>${social}</strong>
        <span class="stato ${classe}">${nome}</span>${u.quando ? ` ${esc(giorno(u.quando))}` : ''}${u.vis != null ? ` · ${numero(u.vis)} visualizzazioni` : ''}</li>`;
    }).join('');
    // La copertina, se è ancora nel bucket; altrimenti un riquadro vuoto (vedi il gestore degli errori delle immagini).
    const copertina = v.copertina
      ? `<img class="anteprima-video" src="${esc(v.copertina)}" alt="Copertina di ${esc(v.titolo)}" loading="lazy">`
      : '<div class="anteprima-video vuoto">Senza copertina</div>';
    const guarda = v.url && !v.uscite.length ? `<a class="sotto" href="${esc(v.url)}" target="_blank" rel="noopener">Guarda il video</a>` : '';
    return `<section class="scheda voce-video">${copertina}
      <div><h2>${esc(v.titolo)}</h2>
        <p class="sotto"><span class="stato ${colore}">${esc(STATI_VIDEO[stato] || stato)}</span> · fatto il ${esc(giorno(v.creato))}</p>
        ${uscite ? `<ul class="uscite-video">${uscite}</ul>` : '<p class="vuoto">Non ancora dato ai social.</p>'}${guarda}</div></section>`;
  }).join('');
  return `<p class="sotto intro-coda">Gli ultimi ${d.video.length} video prodotti, dal più nuovo. Tocca il nome di un social per aprire il post.</p><div class="griglia-video">${schede}</div>`;
}

// Le copertine dei video già usciti dappertutto possono non esserci più nel bucket: al posto dell'immagine rotta, il riquadro vuoto.
document.addEventListener('error', (e) => {
  if (!e.target.matches?.('img.anteprima-video')) return;
  const vuoto = document.createElement('div');
  vuoto.className = 'anteprima-video vuoto';
  vuoto.textContent = 'Copertina non più disponibile';
  e.target.replaceWith(vuoto);
}, true);

// Grassetto, corsivo e codice dentro una riga di markdown, dopo aver tolto l'HTML.
const mdRiga = (s) => esc(s).replace(/`([^`]+)`/g, '<code>$1</code>')
  .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/(^|[\s(])\*([^*\s][^*]*?)\*/g, '$1<i>$2</i>');

// Il markdown dei resoconti degli agenti: titoli, elenchi, tabelle e paragrafi. Basta questo, niente librerie.
function markdown(testo) {
  const out = [];
  let elenco = null;
  let tab = null;
  const chiudi = () => {
    if (elenco) out.push(`<${elenco.tipo}>${elenco.voci.map((v) => `<li>${v}</li>`).join('')}</${elenco.tipo}>`);
    if (tab) out.push(tabella(tab[0].map((t) => [t]), tab.slice(1).map((r) => r.map(mdRiga))));
    elenco = tab = null;
  };
  for (const riga of String(testo).split('\n')) {
    const t = riga.trim();
    const voce = t.match(/^(-|\d+\.)\s+(.*)/);
    if (t.startsWith('|')) {
      if (elenco) chiudi();
      const celle = t.replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
      if (!celle.every((c) => /^:?-+:?$/.test(c))) (tab ||= []).push(celle);
    } else if (voce && !(riga.startsWith(' ') && elenco)) {
      const tipo = voce[1] === '-' ? 'ul' : 'ol';
      if (tab || (elenco && elenco.tipo !== tipo)) chiudi();
      (elenco ||= { tipo, voci: [] }).voci.push(mdRiga(voce[2]));
    } else if (t && elenco && riga.startsWith(' ')) {
      // Riga rientrata: continua la voce di prima (anche un sotto-punto).
      elenco.voci[elenco.voci.length - 1] += (voce ? '<br>• ' + mdRiga(voce[2]) : ' ' + mdRiga(t));
    } else {
      chiudi();
      const titolo = t.match(/^(#{1,4})\s+(.*)/);
      if (titolo) out.push(`<h${Math.min(titolo[1].length + 2, 5)}>${mdRiga(titolo[2])}</h${Math.min(titolo[1].length + 2, 5)}>`);
      else if (t) out.push(`<p>${mdRiga(t)}</p>`);
    }
  }
  chiudi();
  return out.join('');
}

function elencoDecisioni(decisioni) {
  if (!decisioni.length) return '<p class="vuoto">Ancora nessuna decisione.</p>';
  return `<ul class="elenco">${decisioni.map((x) => `<li><b>${esc(x.agente)}</b> <span class="quando">${fa(x.alle)}</span>`
    + `<div>${esc(x.decisione)}</div><div class="motivo">${String(x.motivo).includes('\n') ? markdown(x.motivo) : `Perché: ${mdRiga(x.motivo)}`}</div>`
    + (x.dati?.resoconto ? `<details class="resoconto"><summary>Leggi il resoconto intero</summary>${markdown(x.dati.resoconto)}</details>` : '')
    + '</li>').join('')}</ul>`;
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
    <section class="scheda"><h2>La tua password</h2><p class="sotto">Scegline una e falla salvare al telefono: poi si entra senza email</p>
      <form id="modulo-password" class="modulo-password">
        <input type="email" autocomplete="username" value="${esc(d.email || '')}" hidden>
        <input id="nuova-password" type="password" autocomplete="new-password" minlength="8" required placeholder="Almeno 8 caratteri">
        <button type="submit" class="bottone-tabella"${sb ? '' : ' disabled'}>Salva</button>
      </form>
      <p id="esito-password" class="sotto" role="status"></p></section>
  </div>`;
}

// Richieste fra i due Claude: chi scrive qui fa lavorare il Claude in sottofondo sul PC della persona scelta.
const STATI_RICHIESTA = { nuova: ['In attesa', 'attenzione'], in_corso: ['In corso', 'attenzione'], fatta: ['Fatta', 'bene'],
  errore: ['Errore', 'grave'], annullata: ['Annullata', ''] };

// Lo Stratega: la strategia in corso, le versioni prima e le lezioni. Lavora da solo; Ettore e Matteo lo fermano.
const STATI_ESPERIMENTO = { in_corso: ['In corso', 'attenzione'], vinto: ['Vinto', 'bene'], perso: ['Perso', 'grave'], fermato: ['Fermato', ''] };

function paginaStrategia(d) {
  if (!d.strategie.length) return '<section class="scheda"><h2>Strategia</h2><p class="vuoto">Lo Stratega non ha ancora fatto il primo giro.</p></section>';
  const [ora, ...prima] = d.strategie;
  const svolta = (s) => (s.svolta ? ' <span class="stato attenzione">Svolta</span>' : '');
  const lezioni = d.lezioni.map((l) => `<li>${mdRiga(l.testo)} <span class="quando">${fa(l.alle)}${l.sicurezza ? ` · sicurezza ${esc(l.sicurezza)}` : ''}</span>`
    + `${l.contesto || l.numeri ? `<div class="motivo">${esc([l.contesto, l.numeri].filter(Boolean).join(' · '))}</div>` : ''}</li>`).join('');
  return `<div class="griglia">
    <section class="scheda"><h2>Strategia in corso${svolta(ora)}</h2><p class="sotto">Giro di ${fa(ora.alle)}${ora.pc ? ` · ${esc(ora.pc)}` : ''}</p>
      <div class="resoconto">${markdown(ora.testo)}</div></section>
    <section class="scheda"><h2>Lezioni</h2><p class="sotto">Le cose imparate: si possono riprovare, dicendo che cosa cambia</p>
      ${lezioni ? `<ul class="elenco">${lezioni}</ul>` : '<p class="vuoto">Ancora nessuna.</p>'}</section>
    <section class="scheda"><h2>Giri prima</h2>${prima.length ? `<ul class="elenco">${prima.map((s) => `<li>${mdRiga(s.riassunto)}${svolta(s)} <span class="quando">${fa(s.alle)}</span>`
      + `<details class="resoconto"><summary>Leggi</summary>${markdown(s.testo)}</details></li>`).join('')}</ul>` : '<p class="vuoto">Nessuno.</p>'}</section>
  </div>`;
}

function paginaEsperimenti(d) {
  const voce = (e) => {
    const [nome, classe] = STATI_ESPERIMENTO[e.stato] || [e.stato, ''];
    return `<li><span class="stato ${classe}">${esc(nome)}</span> <b>${e.id}. ${esc(e.nome)}</b> <span class="quando">${esc(PIATTAFORME[e.piattaforma] || 'Tutti i social')} · ${esc(e.formato)} · ${fa(e.creato_alle)}</span>`
      + `<div>${mdRiga(e.ipotesi)}</div>`
      + `<div class="motivo">${esc([e.cosa_cambia ? `Cambia: ${e.cosa_cambia}` : null, e.quota, e.come_si_giudica].filter(Boolean).join(' · '))}</div>`
      + (e.verdetto ? `<div class="motivo">Verdetto: ${mdRiga(e.verdetto)}${e.sicurezza ? ` (sicurezza ${esc(e.sicurezza)})` : ''}</div>` : '')
      + (e.fermato_da ? `<div class="motivo">Fermato da ${esc(e.fermato_da)}</div>` : '')
      + (e.stato === 'in_corso' && sb ? `<button class="bottone-tabella" data-ferma="${e.id}">Ferma</button>` : '')
      + '</li>';
  };
  const inCorso = d.esperimenti.filter((e) => e.stato === 'in_corso');
  const chiusi = d.esperimenti.filter((e) => e.stato !== 'in_corso');
  return `<div class="griglia">
    <section class="scheda"><h2>In corso</h2><p class="sotto">Lo Stratega li apre e li chiude da solo. Se uno è sbagliato, fermatelo.</p>
      ${inCorso.length ? `<ul class="elenco">${inCorso.map(voce).join('')}</ul>` : '<p class="vuoto">Nessuno.</p>'}</section>
    <section class="scheda"><h2>Chiusi</h2><p class="sotto">Si giudicano sul punteggio (40% visualizzazioni, 20% tenuta, 40% interesse: like, commenti, salvati, condivisioni) e sul voto download; se non vanno d'accordo vince il voto download</p>
      ${chiusi.length ? `<ul class="elenco">${chiusi.map(voce).join('')}</ul>` : '<p class="vuoto">Nessuno.</p>'}</section>
  </div>`;
}

document.addEventListener('click', async (e) => {
  const b = e.target.closest('[data-ferma]');
  if (!b || !sb) return;
  b.disabled = true;
  await sb.rpc('ferma_esperimento', { p_id: Number(b.dataset.ferma) });
  const { data, error } = await sb.from('esperimenti').select('*').order('creato_alle', { ascending: false }).limit(100);
  if (!error) dati.esperimenti = data;
  if (attiva === 'esperimenti') mostra('esperimenti');
});

const STATI_RISPOSTA = { bozza: ['Bozza', ''], a_persona: ['A voi', 'attenzione'], approvata: ['Approvata', 'bene'], inviata: ['Inviata', 'bene'], scartata: ['Scartata', ''] };

// Il Community manager scrive le bozze; qui Ettore e Matteo le approvano (anche cambiate) o le scartano (Matteo, 8/11).
function paginaCommenti(d) {
  const voce = (c) => {
    const [nome, classe] = STATI_RISPOSTA[c.stato] || [c.stato, ''];
    const aperta = ['bozza', 'a_persona'].includes(c.stato);
    return `<li><span class="stato ${classe}">${esc(nome)}</span> <b>@${esc(c.autore || '?')}</b> <span class="quando">${esc(PIATTAFORME[c.piattaforma] || c.piattaforma)} · ${esc(c.tipo || '')} · ${fa(c.alle)}</span>`
      + `<div>«${esc(c.commento)}» ${c.post_url ? `<a href="${esc(c.post_url)}" target="_blank" rel="noopener">post</a>` : ''}</div>`
      + (c.motivo ? `<div class="motivo">${esc(c.motivo)}</div>` : '')
      + (aperta && sb
        ? `<textarea class="bozza" data-testo="${c.id}" rows="2" placeholder="Scrivete la risposta">${esc(c.bozza || '')}</textarea>`
          + `<button class="bottone-tabella" data-risposta="${c.id}" data-approva="1">Approva</button> <button class="bottone-tabella" data-risposta="${c.id}" data-approva="0">Scarta</button>`
        : (c.bozza ? `<div>Risposta: ${esc(c.bozza)}${c.decisa_da ? ` <span class="quando">(${esc(c.decisa_da)})</span>` : ''}</div>` : ''))
      + '</li>';
  };
  const commenti = d.commenti || [];
  const aperte = commenti.filter((c) => ['bozza', 'a_persona'].includes(c.stato));
  const decise = commenti.filter((c) => !['bozza', 'a_persona'].includes(c.stato));
  return `<div class="griglia">
    <section class="scheda"><h2>Da decidere</h2><p class="sotto">Bozze del Community manager: niente esce senza il vostro «Approva». Le approvate si mandano con «gestionale community invia».</p>
      ${aperte.length ? `<ul class="elenco">${aperte.map(voce).join('')}</ul>` : '<p class="vuoto">Nessuna.</p>'}</section>
    <section class="scheda"><h2>Decise</h2>
      ${decise.length ? `<ul class="elenco">${decise.map(voce).join('')}</ul>` : '<p class="vuoto">Nessuna.</p>'}</section>
  </div>`;
}

document.addEventListener('click', async (e) => {
  const b = e.target.closest('[data-risposta]');
  if (!b || !sb) return;
  b.disabled = true;
  const testo = document.querySelector(`[data-testo="${b.dataset.risposta}"]`)?.value || null;
  await sb.rpc('decidi_risposta', { p_id: Number(b.dataset.risposta), p_approva: b.dataset.approva === '1', p_testo: testo });
  const { data, error } = await sb.from('risposte_commenti').select('*').order('alle', { ascending: false }).limit(60);
  if (!error) dati.commenti = data;
  if (attiva === 'commenti') mostra('commenti');
});

function paginaRichieste(d) {
  const modulo = `<form id="modulo-richiesta" class="modulo-richiesta">
      <label for="richiesta-per">Per chi</label>
      <select id="richiesta-per"><option>Ettore</option><option>Matteo</option></select>
      <label for="richiesta-testo">Cosa deve fare il suo Claude</label>
      <textarea id="richiesta-testo" rows="4" maxlength="4000" required placeholder="Per esempio: dimmi quanti video sono in coda"></textarea>
      <button type="submit"${sb ? '' : ' disabled'}>Invia</button>
      <p id="esito-richiesta" class="sotto" role="status">${sb ? '' : 'Con i dati di esempio non si inviano richieste.'}</p>
    </form>`;
  const voci = d.richieste.map((r) => {
    const [nome, classe] = STATI_RICHIESTA[r.stato] || [r.stato, ''];
    return `<li><span class="stato ${classe}">${esc(nome)}</span> <b>${esc(r.da)} → ${esc(r.per)}</b> <span class="quando">${fa(r.creata_alle)}${r.pc ? ` · ${esc(r.pc)}` : ''}</span>`
      + `<div>${esc(r.testo)}</div>`
      + (r.risposta ? `<div class="resoconto">${markdown(r.risposta)}</div>` : '')
      + (r.stato === 'nuova' && sb ? `<button class="bottone-tabella" data-annulla="${r.id}">Annulla</button>` : '')
      + '</li>';
  }).join('');
  return `<div class="griglia"><section class="scheda"><h2>Nuova richiesta</h2><p class="sotto">La fa il Claude in sottofondo sul PC di quella persona, se lì le richieste sono accese. La risposta torna qui.</p>${modulo}</section>
    <section class="scheda"><h2>Ultime richieste</h2>${voci ? `<ul class="elenco">${voci}</ul>` : '<p class="vuoto">Ancora nessuna richiesta.</p>'}</section></div>`;
}

async function ricaricaRichieste() {
  const { data, error } = await sb.from('richieste').select('*').order('creata_alle', { ascending: false }).limit(30);
  if (!error) dati.richieste = data;
  if (attiva === 'richieste') mostra('richieste');
}

// Con una password salvata nel telefono si entra senza aspettare l'email (Matteo, 8/11: «senza troppi sbattimenti»).
document.addEventListener('submit', async (e) => {
  if (e.target.id !== 'modulo-password') return;
  e.preventDefault();
  const esito = document.getElementById('esito-password');
  const { error } = await sb.auth.updateUser({ password: document.getElementById('nuova-password').value });
  esito.textContent = error ? `Non è andata: ${error.message}` : 'Salvata. La prossima volta entri con email e password.';
});

document.addEventListener('submit', async (e) => {
  if (e.target.id !== 'modulo-richiesta') return;
  e.preventDefault();
  const esito = document.getElementById('esito-richiesta');
  const testo = document.getElementById('richiesta-testo').value.trim();
  if (!testo || !sb) return;
  e.target.querySelector('button').disabled = true;
  const { error } = await sb.rpc('nuova_richiesta', { p_per: document.getElementById('richiesta-per').value, p_testo: testo });
  if (error) {
    esito.textContent = `Non è andata: ${error.message}`;
    e.target.querySelector('button').disabled = false;
    return;
  }
  await ricaricaRichieste();
});

document.addEventListener('click', async (e) => {
  const b = e.target.closest('[data-annulla]');
  if (!b || !sb) return;
  b.disabled = true;
  await sb.rpc('annulla_richiesta', { p_id: Number(b.dataset.annulla) });
  await ricaricaRichieste();
});

// ---------------------------------------------------------------- avvio

const tabelle = {};
let dati = null;
let attiva = 'oggi';
let sb = null;

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
  main.innerHTML = { oggi: paginaOggi, app: paginaApp, social: paginaSocial, coda: paginaCoda, video: paginaVideo, esperimenti: paginaEsperimenti, commenti: paginaCommenti, strategia: paginaStrategia, richieste: paginaRichieste, decisioni: paginaDecisioni, sistema: paginaSistema }[id](dati);
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

const scrittaAggiornato = (d) => `Aggiornato alle ${d.aggiornato.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`;

// La pagina si rilegge da sola (Ettore, 10/11: «dovrebbe essere sempre aggiornata»): ogni 5 minuti se è in vista, e
// appena ci si torna dopo averla lasciata aperta. Non lo fa mentre qualcuno sta scrivendo, per non cancellargli il testo.
const RILEGGI_OGNI_MS = 5 * 60000;
let rileggendo = false;
function staScrivendo() {
  const a = document.activeElement;
  if (a && ['INPUT', 'TEXTAREA', 'SELECT'].includes(a.tagName)) return true;
  return [...document.querySelectorAll('#contenuto textarea, #contenuto input[type=password]')].some((c) => c.value !== c.defaultValue);
}
async function rileggi() {
  if (rileggendo || !sb || !dati || dati.esempio || document.hidden || staScrivendo()) return;
  if (Date.now() - dati.aggiornato.getTime() < RILEGGI_OGNI_MS) return;
  rileggendo = true;
  try {
    const nuovi = await datiVeri(sb);
    if (staScrivendo()) return;
    nuovi.email = dati.email;
    dati = nuovi;
    const aperti = [...document.querySelectorAll('#contenuto details')].map((x) => x.open);
    const giu = scrollY;
    mostra(attiva);
    document.querySelectorAll('#contenuto details').forEach((x, i) => { if (aperti[i] != null) x.open = aperti[i]; });
    scrollTo(0, giu);
    document.getElementById('stato-dati').textContent = scrittaAggiornato(dati);
  } catch (err) {
    // Un giro andato male non tocca la pagina: resta l'ora dell'ultima lettura riuscita, e si riprova al prossimo.
  } finally {
    rileggendo = false;
  }
}

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
    sb = window.supabase.createClient(supabaseUrl, supabaseChiavePubblica);
    const { data: { session } } = await sb.auth.getSession();
    if (!session) return chiediAccesso(sb);
    try {
      dati = await datiVeri(sb);
      dati.email = session.user.email;
      pillola.textContent = scrittaAggiornato(dati);
    } catch (err) {
      document.getElementById('contenuto').innerHTML = `<section class="scheda"><h2>Non riesco a leggere i dati</h2><p class="sotto">${esc(err.message)}</p></section>`;
      return;
    }
    setInterval(rileggi, 60000);
    document.addEventListener('visibilitychange', rileggi);
  }
  const iniziale = location.hash.slice(1);
  mostra(SCHEDE.some((s) => s.id === iniziale) ? iniziale : 'oggi');
}

function chiediAccesso(sb) {
  document.getElementById('schede').hidden = true;
  const sezione = document.getElementById('accesso');
  sezione.hidden = false;
  const esito = document.getElementById('esito-accesso');
  const email = () => document.getElementById('email').value.trim();
  document.getElementById('modulo-accesso').addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = document.getElementById('password').value;
    if (!password) { esito.textContent = 'Scrivi la password, oppure chiedi il link per email.'; return; }
    const { error } = await sb.auth.signInWithPassword({ email: email(), password });
    if (error) { esito.textContent = `Non è andata: ${error.message === 'Invalid login credentials' ? 'email o password sbagliate' : error.message}`; return; }
    location.reload();
  });
  document.getElementById('manda-link').addEventListener('click', async () => {
    if (!email()) { esito.textContent = 'Scrivi prima la tua email.'; return; }
    const { error } = await sb.auth.signInWithOtp({ email: email(), options: { shouldCreateUser: false, emailRedirectTo: location.origin + location.pathname } });
    esito.textContent = !error ? 'Fatto: controlla la posta e apri il link in questo stesso browser. Poi scegli una password in «Sistema».'
      : /rate limit/i.test(error.message) ? 'Troppe email in poco tempo (Supabase gratis ne manda 2 all’ora): riprova fra un’ora.'
      : `Non è andata: ${error.message}`;
  });
}

avvia();
