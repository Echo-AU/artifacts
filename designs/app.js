'use strict';
const M = EchoModel;
const STORAGE = 'echo-ui-prototype-v1';
let state;
try { const saved = JSON.parse(localStorage.getItem(STORAGE)); state = saved?.version === 1 ? saved : M.seed(); } catch { state = M.seed(); }
let filter = 'all', query = '', taskTab = 'all', detailTab = 'about', authTab = 'login', pending = null;
const app = document.getElementById('app'), dialog = document.getElementById('dialog');
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const e = escapeHTML;
const roles = { contributor: 'Contributor', requester: 'Requester', org: 'Organization', partner: 'Reward Partner' };
const who = () => M.actor(state);
const profile = id => state.profiles[id] || { name: 'Ukendt bruger', bio: '', role: '' };
const money = (amount, unit = 'KK') => `${Number(amount).toLocaleString('da-DK')} ${unit === 'KK' ? 'KK' : 'kr.'}`;
const date = value => new Date(value).toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' });
const initials = id => profile(id).name.split(' ').map(x => x[0]).slice(0, 2).join('');
const paths = {
 search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
 grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
 tasks: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2h6v2M9 10h6M9 14h6M9 18h4"/>',
 gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v9h14v-9M12 8v13"/><path d="M12 8C5 8 4 2 8 3c3 0 4 5 4 5Zm0 0c7 0 8-6 4-5-3 0-4 5-4 5Z"/>',
 wallet: '<rect x="3" y="5" width="18" height="15" rx="2"/><path d="M3 8h18M16 12h5v5h-5z"/>',
 person: '<circle cx="12" cy="7" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
 plus: '<path d="M12 4v16M4 12h16"/>',
 pin: '<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 0 1 14 0Z"/><circle cx="12" cy="10" r="2"/>',
 clock: '<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
 arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
 leaf: '<path d="M20 3C7 2 2 8 5 15c4 8 16 2 15-12ZM4 21 16 8"/>',
 heart: '<path d="m12 21-8-8C-3 5 7-1 12 6c5-7 15-1 8 7Z"/>',
 logout: '<path d="M9 3H4v18h5M9 12h12m-5-5 5 5-5 5"/>'
};
const icon = name => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${paths[name] || paths.grid}</svg>`;
const avatar = (id, large = false) => `<span class="avatar ${large ? 'large' : ''}" aria-hidden="true">${e(initials(id))}</span>`;
const button = (label, action, id = '', extra = '', primary = false) => `<button class="btn ${primary ? 'primary' : ''}" data-action="${action}" data-id="${e(id)}" ${extra}>${label}</button>`;
const link = (label, route, primary = false) => `<a class="btn ${primary ? 'primary' : ''}" href="#${route}">${label}</a>`;
const empty = (title, text, action = '') => `<div class="empty"><h2>${title}</h2><p>${text}</p>${action}</div>`;
const head = (label, title, text = '', action = '') => `<div class="page-head"><div><div class="eyebrow">${label}</div><h1 tabindex="-1">${title}</h1>${text ? `<p>${text}</p>` : ''}</div>${action}</div>`;
const field = (label, name, value = '', type = 'text', attrs = '') => `<label class="field">${label}<input name="${name}" type="${type}" value="${e(value)}" ${attrs} required></label>`;
const area = (label, name, value = '') => `<label class="field">${label}<textarea name="${name}" maxlength="1500" required>${e(value)}</textarea></label>`;
function save() { try { localStorage.setItem(STORAGE, JSON.stringify(state)); } catch { toast('Ændringer virker i denne session, men browseren kunne ikke gemme dem.'); } }
function toast(message) { const el = document.getElementById('toast'); el.textContent = message; clearTimeout(toast.timer); toast.timer = setTimeout(() => { el.textContent = ''; }, 4500); }
function route() { return location.hash.slice(1).split('/'); }
function go(url) { if (location.hash === '#' + url) render(); else location.hash = url; }
function home() { return state.role === 'contributor' ? 'discover' : state.role === 'partner' ? 'partner' : 'tasks'; }
function navItems() {
  const items = state.role === 'contributor' ? [['discover', 'Find opgaver', 'search'], ['tasks', 'Mine opgaver', 'tasks'], ['rewards', 'Belønninger', 'gift']]
    : state.role === 'partner' ? [['partner', 'Mine belønninger', 'gift'], ['new-reward', 'Opret belønning', 'plus']]
      : [['tasks', state.role === 'org' ? 'Mine aktiviteter' : 'Mine opgaver', 'tasks'], ['new-task', state.role === 'org' ? 'Opret aktivitet' : 'Opret opgave', 'plus']];
  return [...items, ['wallet', 'Saldo og historik', 'wallet'], ['profile', 'Min profil', 'person']];
}
function allowed(page) {
  const common = ['task', 'user', 'profile', 'wallet', 'auth'];
  return common.includes(page) || navItems().some(item => item[0] === page) || (page === 'reward' && ['contributor', 'partner'].includes(state.role));
}
function render() {
  let [page, id] = route();
  if (!page) { go(home()); return; }
  if (!state.signedIn) page = 'auth';
  const names = { discover: 'Find opgaver', tasks: state.role === 'org' ? 'Mine aktiviteter' : 'Mine opgaver', task: 'Opgavedetaljer', 'new-task': 'Opret opgave', rewards: 'Belønninger', reward: 'Belønningsdetaljer', partner: 'Mine belønninger', 'new-reward': 'Opret belønning', wallet: 'Saldo og historik', profile: 'Min profil', user: 'Brugerprofil', auth: 'Velkommen til Echo' };
  const views = { discover, tasks, task: () => taskDetail(id), 'new-task': newTask, rewards, reward: () => rewardDetail(id), partner: partnerView, 'new-reward': newReward, wallet, profile: myProfile, user: () => userProfile(id), auth };
  const content = !allowed(page) ? empty('Denne side er ikke tilgængelig', 'Vælg et arbejdsområde i menuen.', link('Til oversigten', home())) : views[page] ? views[page]() : empty('Siden blev ikke fundet', 'Brug menuen til at komme videre.', link('Til oversigten', home()));
  document.title = `Echo · ${names[page] || 'Prototype'}`;
  if (page === 'auth') { app.innerHTML = `<main id="main">${content}</main>`; return; }
  const active = page === 'task' ? 'tasks' : page === 'reward' ? (state.role === 'partner' ? 'partner' : 'rewards') : page;
  app.innerHTML = `<div class="layout"><aside class="sidebar"><a href="#${home()}" class="brand" aria-label="Echo, til oversigten"><span class="brand-mark">))</span>echo<span style="color:var(--blue)">.</span></a><div class="nav-label">DIT FÆLLESSKAB</div><nav class="nav" aria-label="Hovedmenu">${navItems().map(([url, title, name]) => `<a href="#${url}" class="${active === url ? 'active' : ''}" ${active === url ? 'aria-current="page"' : ''}>${icon(name)}${title}</a>`).join('')}<a href="#auth" data-action="logout">${icon('logout')}Log ud</a></nav><div class="sidebar-bottom"><div class="demo-box"><label for="role">Afprøv som</label><select id="role">${Object.entries(roles).map(([v, text]) => `<option value="${v}" ${state.role === v ? 'selected' : ''}>${text}</option>`).join('')}</select><p>Lokal prototype · kun demodata</p></div><button class="reset" data-action="reset">Nulstil demo</button></div></aside><div class="workspace"><header class="topbar"><span class="crumb">Dit Echo <span aria-hidden="true">/</span> ${names[page] || 'Side'}</span><div class="account"><a href="#wallet" class="coin-pill">${money(state.wallets[who()].KK)} <span aria-hidden="true">✦</span></a><a href="#profile" class="account">${avatar(who())}<span class="account-name">${e(profile(who()).name)}</span></a></div></header><main id="main">${content}<p class="footnote">Echo · Klikbar prototype med lokale demodata. Ingen rigtige betalinger eller konti.</p></main></div></div>`;
}
function taskStatus(t) {
  if (t.status === 'done') return ['Udført', ''];
  if (t.selected.includes(who())) return ['Du er valgt', ''];
  if (t.applicants.includes(who())) return ['Afventer svar', 'waiting'];
  if (t.status === 'assigned') return ['Deltagere valgt', 'neutral'];
  return ['Åben for hjælp', 'neutral'];
}
function taskCard(t, mine = false) {
  const [status, cls] = taskStatus(t);
  return `<article class="card"><div class="card-top"><span class="tile-icon">${icon(t.type === 'private' ? 'tasks' : t.category === 'Natur & miljø' ? 'leaf' : 'heart')}</span><span class="badge ${mine ? cls : t.unit === 'DKK' ? 'money' : ''}">${mine ? status : t.unit === 'KK' ? 'Frivillig aktivitet' : 'Betalt opgave'}</span></div><h3><a class="card-title-link" href="#task/${t.id}">${e(t.title)}</a></h3><a class="meta" href="#user/${t.owner}">${e(profile(t.owner).name)} ↗</a><p class="description">${e(t.description.length > 100 ? t.description.slice(0, 100) + '…' : t.description)}</p><div class="card-meta">${icon('pin')}${e(t.place)}</div><div class="card-meta">${icon('clock')}${date(t.date)} · ${e(t.time)}</div><div class="card-foot"><span class="amount">${money(t.amount, t.unit)}<small>pr. deltager</small></span><a href="#task/${t.id}" class="btn small">Se opgave ${icon('arrow')}</a></div></article>`;
}
function filteredTasks() { return state.tasks.filter(t => t.status !== 'done' && t.owner !== who() && t.selected.length < t.capacity && (filter === 'all' || t.type === filter) && `${t.title} ${t.place} ${t.category} ${profile(t.owner).name}`.toLocaleLowerCase('da').includes(query.toLocaleLowerCase('da'))); }
function taskResults() { const list = filteredTasks(); return `<div class="section-line"><h2>${list.length} opgaver at give en hånd med</h2><span class="meta">Aarhus og omegn</span></div>${list.length ? `<div class="cards">${list.map(t => taskCard(t)).join('')}</div>` : empty('Ingen opgaver matcher', 'Prøv en anden søgning eller vælg alle opgavetyper.', button('Ryd filtre', 'clear-filter'))}`; }
function discover() {
  return head('GØR EN FORSKEL', 'Find din næste opgave', 'Små bidrag. En stor forskel for nogen i nærheden.') + `<div class="welcome"><div><h2>Din tid er noget værd.</h2><p>Giv en hånd med i dit lokalområde, og optjen Karma Koins til gode oplevelser.</p></div><div><div class="accent">${state.wallets.me.KK} <span aria-hidden="true">✦</span></div><small>dine Karma Koins</small></div></div><div class="toolbar"><label class="search">${icon('search')}<input id="search" aria-label="Søg efter opgave, sted eller organisation" placeholder="Søg efter opgave, sted eller organisation…" value="${e(query)}"></label><select id="filter" aria-label="Opgavetype"><option value="all" ${filter === 'all' ? 'selected' : ''}>Alle opgavetyper</option><option value="org" ${filter === 'org' ? 'selected' : ''}>Frivillige aktiviteter</option><option value="private" ${filter === 'private' ? 'selected' : ''}>Betalte opgaver</option></select></div><div id="task-results" aria-live="polite">${taskResults()}</div>`;
}
function tasks() {
  const owner = state.role !== 'contributor';
  const all = state.tasks.filter(t => owner ? t.owner === who() : t.applicants.includes(who()));
  const list = all.filter(t => taskTab === 'all' || (taskTab === 'done' ? t.status === 'done' : taskTab === 'pending' ? t.status !== 'done' && (owner ? t.applicants.some(x => !t.selected.includes(x)) : !t.selected.includes(who())) : t.status !== 'done' && (owner ? t.selected.length > 0 : t.selected.includes(who()))));
  return head('DIT OVERBLIK', state.role === 'org' ? 'Mine aktiviteter' : 'Mine opgaver', owner ? 'Følg dine opgaver fra første tilbud til sidste tak.' : 'Se dine tilbud, aftaler og udførte opgaver.', owner ? link(icon('plus') + (state.role === 'org' ? 'Opret aktivitet' : 'Opret opgave'), 'new-task', true) : '') + `<div class="tabs" aria-label="Filtrér opgaver">${[['all', 'Alle'], ['pending', 'Afventer svar'], ['assigned', 'Tildelte'], ['done', 'Udførte']].map(([value, label]) => `<button data-action="task-filter" data-id="${value}" class="${taskTab === value ? 'active' : ''}" aria-pressed="${taskTab === value}">${label}</button>`).join('')}</div>${list.length ? `<div class="cards">${list.map(t => taskCard(t, true)).join('')}</div>` : empty('Her er ingen opgaver endnu', owner ? 'Opret en opgave, og lad andre give en hånd med.' : 'Find en opgave, og tilbyd din hjælp.', link(owner ? 'Opret opgave' : 'Find opgaver', owner ? 'new-task' : 'discover', true))}`;
}
function taskDetail(id) {
  const t = state.tasks.find(t => t.id === id); if (!t) return empty('Opgaven findes ikke', 'Den er muligvis fjernet ved nulstilling.', link('Til oversigten', home()));
  const owner = t.owner === who() && ['org', 'requester'].includes(state.role), participant = t.selected.includes(who());
  const [status, cls] = taskStatus(t);
  let action = '';
  if (owner && t.status !== 'done') action = button('Afslut og overfør', 'complete', id, t.selected.length ? '' : 'disabled', true);
  else if (state.role === 'contributor' && who() !== t.owner && t.status !== 'done') action = button(participant ? 'Du er valgt' : t.applicants.includes(who()) ? 'Afventer svar' : 'Tilbyd hjælp', 'apply', id, t.applicants.includes(who()) || t.selected.length >= t.capacity ? 'disabled' : '', true);
  if (t.status === 'done' && (owner || participant)) action = button('Skriv en anmeldelse', 'review', id);
  return `<a href="#${owner || t.applicants.includes(who()) ? 'tasks' : home()}" class="btn text">← Til oversigten</a>` + head(t.type === 'org' ? 'FRIVILLIG AKTIVITET' : 'BETALT OPGAVE', e(t.title)) + `<div class="detail-grid"><section class="panel"><div class="tabs"><button data-action="detail-tab" data-id="about" class="${detailTab === 'about' ? 'active' : ''}" aria-pressed="${detailTab === 'about'}">Om opgaven</button>${owner ? `<button data-action="detail-tab" data-id="people" class="${detailTab === 'people' ? 'active' : ''}" aria-pressed="${detailTab === 'people'}">Deltagere (${t.applicants.length})</button>` : ''}</div>${detailTab === 'people' && owner ? `<h2>Hvem vil give en hånd med?</h2><p class="muted">${t.selected.length} af ${t.capacity} pladser er tildelt.</p>${t.applicants.map(person => `<div class="person-row">${avatar(person)}<div class="grow"><a href="#user/${person}">${e(profile(person).name)} ↗</a><small>${t.selected.includes(person) ? 'Valgt til opgaven' : 'Har tilbudt sin hjælp'}</small></div>${button(t.selected.includes(person) ? 'Valgt' : 'Vælg deltager', 'assign', id, `data-person="${person}" ${t.selected.includes(person) || t.status === 'done' || t.selected.length >= t.capacity ? 'disabled' : ''}`)}</div>`).join('') || '<p class="muted">Der er endnu ingen tilbud.</p>'}` : `<h2>Om opgaven</h2><p class="detail-copy">${e(t.description)}</p><div class="detail-info"><span class="card-meta">${icon('pin')}${e(t.place)}</span><span class="card-meta">${icon('clock')}${date(t.date)} · ${e(t.time)}</span></div><h2>Arrangeret af</h2><a class="person-row" href="#user/${t.owner}">${avatar(t.owner)}<div><strong>${e(profile(t.owner).name)}</strong><small>Se profil og omdømme ↗</small></div></a><div class="note">Du tilbyder først din hjælp. Arrangøren vælger derefter deltagere, og du kan følge svaret under Mine opgaver.</div>`}</section><aside class="panel"><div class="facts"><div><small>Belønning pr. deltager</small><strong class="amount">${money(t.amount, t.unit)}</strong></div><div><small>Opgavens status</small><span class="badge ${cls}">${status}</span></div><div><small>Deltagere</small><strong>${t.selected.length} / ${t.capacity} valgt</strong></div><div><small>Overførsel</small><strong>${t.status === 'done' ? 'Gennemført' : 'Afventer udførelse'}</strong></div></div><div class="full">${action}</div>${owner && !t.selected.length ? '<p class="meta">Vælg deltagere i fanen, før opgaven kan afsluttes.</p>' : ''}${t.applicants.includes(who()) && !participant && t.status !== 'done' ? '<p class="meta">Dit tilbud er modtaget. Du er endnu ikke tildelt opgaven.</p>' : ''}</aside></div>`;
}
function newTask() {
  const org = state.role === 'org';
  return head('FRA IDÉ TIL HANDLING', org ? 'Opret en aktivitet' : 'Opret en opgave', 'Fortæl, hvad du har brug for hjælp til.') + `<form id="task-form" class="panel form-panel">${field('Titel', 'title', '', 'text', 'maxlength="100"')}${area('Beskrivelse', 'description')}<div class="form-grid">${field('Sted', 'place', '', 'text', 'maxlength="120"')}${field('Dato', 'date', '2026-09-25', 'date')}${field('Tidsrum', 'time', '10:00–12:00', 'text', 'maxlength="50"')}${field('Antal deltagere', 'capacity', '1', 'number', 'min="1" max="100" step="1"')}${field(`Belønning pr. deltager (${org ? 'Karma Koins' : 'DKK'})`, 'amount', org ? '80' : '200', 'number', 'min="1" max="100000" step="1"')}<label class="field">Kategori<select name="category"><option>Fællesskab</option><option>Natur & miljø</option><option>Praktisk hjælp</option></select></label></div><p class="note">Beløbet gælder hver valgt deltager. Overførslen bekræftes, når opgaven er udført.</p><div class="form-actions">${link('Annuller', 'tasks')}<button class="btn primary" type="submit">Se forhåndsvisning ${icon('arrow')}</button></div></form>`;
}
function rewardCard(r) { return `<article class="card"><div class="reward-strip">${icon('gift')}<strong>${money(r.price)}</strong></div><span class="meta">${e(r.category)}</span><h3 style="margin-top:8px"><a href="#reward/${r.id}">${e(r.title)}</a></h3><p class="description">${e(r.description)}</p><div class="card-foot"><span class="meta">${e(profile(r.owner).name)}</span><a class="btn small" href="#reward/${r.id}">Se belønning</a></div>${state.role === 'contributor' && state.wallets.me.KK < r.price ? `<p class="meta" style="margin:14px 0 0">Du mangler ${money(r.price - state.wallets.me.KK)}</p>` : ''}</article>`; }
function rewards() { return head('NOGET AT GLÆDE SIG TIL', 'Dine bidrag giver tilbage', 'Brug dine Karma Koins hos lokale belønningspartnere.', link(money(state.wallets.me.KK) + ' på din saldo', 'wallet')) + `<div class="cards">${state.rewards.map(rewardCard).join('')}</div>`; }
function partnerView() { const list = state.rewards.filter(r => r.owner === who()); return head('GIV NOGET TILBAGE', 'Mine belønninger', 'Dine tilbud til dem, der bidrager til fællesskabet.', link(icon('plus') + 'Opret belønning', 'new-reward', true)) + (list.length ? `<div class="cards">${list.map(rewardCard).join('')}</div>` : empty('Ingen belønninger endnu', 'Opret din første belønning.', link('Opret belønning', 'new-reward', true))); }
function rewardDetail(id) {
  const r = state.rewards.find(r => r.id === id); if (!r) return empty('Belønningen findes ikke', 'Gå tilbage til oversigten.', link('Til oversigten', home()));
  const receipt = state.redemptions.find(x => x.reward === id && x.person === who());
  return `<a class="btn text" href="#${state.role === 'partner' ? 'partner' : 'rewards'}">← Til belønninger</a>` + head(e(r.category).toUpperCase(), e(r.title)) + `<div class="detail-grid"><section class="panel"><h2>En belønning for din indsats</h2><p>${e(r.description)}</p><h2>Vilkår</h2><p>${e(r.terms)}</p><a class="person-row" href="#user/${r.owner}">${avatar(r.owner)}<div><strong>${e(profile(r.owner).name)}</strong><small>Se partnerens profil ↗</small></div></a>${receipt ? `<div class="note"><strong>Indløsning gennemført</strong><p>Din demokvittering: ${e(receipt.id)}<br>${date(receipt.date)} · ${money(r.price)}</p>Fysisk udlevering og partnerens kontrol skal afklares. Kvitteringen kan ikke bruges i en rigtig butik.</div>` : ''}</section><aside class="panel"><div class="reward-strip">${icon('gift')}<strong>${money(r.price)}</strong></div>${state.role === 'contributor' ? `<div class="facts"><div><small>Din saldo</small><strong>${money(state.wallets.me.KK)}</strong></div></div>${receipt ? '<p class="note">Du har indløst denne belønning i demoen.</p>' : `<div class="full">${button('Indløs belønning', 'redeem', id, state.wallets.me.KK < r.price ? 'disabled' : '', true)}</div>${state.wallets.me.KK < r.price ? `<p class="note warning">Du mangler ${money(r.price - state.wallets.me.KK)}. Optjen flere ved at hjælpe med en opgave.</p>${link('Find opgaver', 'discover')}` : ''}`}` : '<p class="muted">Dette er visningen af din belønning. Skift til Contributor for at afprøve indløsning.</p>'}</aside></div>`;
}
function newReward() { return head('EN TAK FOR INDSATSEN', 'Opret en belønning', 'Giv Contributors noget at bruge deres Karma Koins på.') + `<form id="reward-form" class="panel form-panel">${field('Titel', 'title', '', 'text', 'maxlength="100"')}${area('Beskrivelse', 'description')}${field('Pris i Karma Koins', 'price', '60', 'number', 'min="1" max="100000" step="1"')}${field('Kategori', 'category', 'Kaffe & hygge', 'text', 'maxlength="60"')}${area('Indløsningsvilkår', 'terms')}<div class="form-actions">${link('Annuller', 'partner')}<button type="submit" class="btn primary">Opret belønning</button></div></form>`; }
function wallet() {
  const w = state.wallets[who()], tx = state.transactions.filter(x => x.from === who() || x.to === who());
  return head('DET HAR DU MED DIG', 'Saldo og historik', 'Følg, hvad der kommer ind, og hvad du giver videre.') + `<div class="balance-grid"><section class="balance"><p>Karma Koins</p><strong>${money(w.KK)}</strong><p>${state.role === 'org' ? 'Til belønning af frivillige' : state.role === 'partner' ? 'Modtaget fra indløsninger' : 'Til gode oplevelser'}</p></section>${['contributor', 'requester'].includes(state.role) ? `<section class="balance secondary"><p>Penge · DKK</p><strong>${money(w.DKK, 'DKK')}</strong><p>Holdes adskilt fra Karma Koins</p></section>` : ''}</div><section class="panel"><h2>Transaktioner</h2>${tx.length ? `<div class="table-wrap"><table><thead><tr><th>Handling</th><th>Dato</th><th>Beløb</th><th>Status</th></tr></thead><tbody>${tx.map(x => `<tr><td><details><summary>${e(x.title)}</summary><p>Fra ${e(profile(x.from).name)} til ${e(profile(x.to).name)}<br>Reference: ${e(x.id)}</p>${x.task ? `<a class="inline-link" href="#task/${x.task}">Se opgave</a>` : x.reward && ['contributor', 'partner'].includes(state.role) ? `<a class="inline-link" href="#reward/${x.reward}">Se belønning</a>` : ''}</details></td><td>${date(x.date)}</td><td class="${x.to === who() ? 'positive' : 'negative'}" style="white-space:nowrap">${x.to === who() ? '+' : '−'}${money(x.amount, x.unit)}</td><td><span class="badge">${x.status}</span></td></tr>`).join('')}</tbody></table></div>` : empty('Ingen transaktioner endnu', 'Dine overførsler og indløsninger vises her.')}</section>`;
}
function myProfile() { const p = profile(who()); return head('DIT ANSIGT UDADTIL', 'Min profil', 'Gør det nemt for andre at lære dig lidt at kende.') + `<form id="profile-form" class="panel form-panel"><div class="profile-head">${avatar(who(), true)}<div><h2>${e(p.name)}</h2><span class="meta">${e(p.role)}</span></div></div><h2>Offentlige oplysninger</h2>${field('Navn', 'name', p.name, 'text', 'maxlength="80"')}${area('Om mig / os', 'bio', p.bio)}<h2>Private kontooplysninger</h2><p class="muted">${e(p.email || 'Ingen e-mail angivet i demoen')} · vises kun til dig</p><div class="form-actions">${link('Se offentlig profil', 'user/' + who())}<button type="submit" class="btn primary">Gem profil</button></div></form>`; }
function userProfile(id) {
  if (!state.profiles[id]) return empty('Profilen findes ikke', 'Vælg en bruger fra en opgave.');
  const p = profile(id), reviews = state.reviews.filter(r => r.target === id);
  return head('MØD HINANDEN', 'Profil og omdømme') + `<section class="panel form-panel"><div class="profile-head">${avatar(id, true)}<div><h2>${e(p.name)}</h2><span class="meta">${e(p.role)}</span></div></div><p>${e(p.bio)}</p><h2>Omdømme</h2>${reviews.length ? `<p><strong>${(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toLocaleString('da-DK', { maximumFractionDigits: 1 })} / 5</strong> · ${reviews.length} anmeldelser</p>${reviews.map(r => `<article class="review"><div class="stars" aria-label="${r.rating} af 5 stjerner">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div><p>${e(r.comment || 'Ingen kommentar tilføjet.')}</p><small>Fra ${e(profile(r.author).name)} efter en udført opgave</small></article>`).join('')}` : '<p class="muted">Ingen anmeldelser endnu. Det siger ikke noget om brugerens erfaring eller kvalitet.</p>'}</section>`;
}
function auth() {
  return `<div class="auth"><a class="brand" href="#auth"><span class="brand-mark">))</span>echo.</a><h1>${authTab === 'login' ? 'Godt at se dig.' : 'Bliv en del af Echo.'}</h1><p class="auth-intro">Giv en hånd med. Få noget godt igen.</p><div class="panel"><div class="tabs">${[['login', 'Log ind'], ['signup', 'Opret konto']].map(([value, label]) => `<button data-action="auth-tab" data-id="${value}" class="${authTab === value ? 'active' : ''}">${label}</button>`).join('')}</div><form id="auth-form">${authTab === 'signup' ? field('Dit navn / organisationens navn', 'name', '', 'text', 'maxlength="80"') : ''}${field('E-mail', 'email', '', 'email', 'autocomplete="off"')}${field('Adgangskode til demo', 'password', '', 'password', 'minlength="6" autocomplete="off"')}<label class="field">${authTab === 'signup' ? 'Kontotype' : 'Demoarbejdsområde'}<select name="role"><option value="contributor">Contributor / Requester · hjælp eller opret opgaver</option><option value="org">Organization · arrangér aktiviteter</option><option value="partner">Reward Partner · tilbyd belønninger</option></select></label><p class="meta">Kun en demonstration. Brug opdigtede oplysninger. Adgangskoden gemmes ikke, og der oprettes ingen rigtig konto.</p><button class="btn primary full" type="submit">${authTab === 'signup' ? 'Opret demokonto' : 'Log ind i demo'}</button></form></div>${button('Fortsæt med demodata', 'demo-login')}</div>`;
}
function modal(title, body, action = '', label = 'Bekræft') {
  pending = action;
  dialog.innerHTML = `<div class="dialog-head"><h2 id="dialog-title">${title}</h2><button class="close" data-action="close" aria-label="Luk dialog">×</button></div>${body}<p id="dialog-error" class="error" role="alert"></p><div class="dialog-actions">${button(action ? 'Annuller' : 'Luk', 'close')}${action ? button(label, 'confirm', '', '', true) : ''}</div>`;
  if (!dialog.open) dialog.showModal();
}
function handle(action, id, el) {
  if (action === 'close') { pending = null; dialog.close(); return; }
  if (action === 'confirm') { if (!pending) return; const fn = pending; el.disabled = true; try { fn(); save(); pending = null; dialog.close(); render(); } catch (error) { document.getElementById('dialog-error').textContent = error.message; el.disabled = false; } return; }
  if (action === 'logout') { state.signedIn = false; save(); go('auth'); return; }
  if (action === 'demo-login') { state.signedIn = true; save(); go(home()); return; }
  if (action === 'auth-tab') { authTab = id; render(); return; }
  if (action === 'task-filter') { taskTab = id; render(); return; }
  if (action === 'detail-tab') { detailTab = id; render(); return; }
  if (action === 'clear-filter') { filter = 'all'; query = ''; render(); return; }
  if (action === 'reset') { modal('Nulstil demodata?', '<p>Lokale opgaver, profilændringer, anmeldelser og transaktioner erstattes med startdata.</p>', () => { state = M.seed(); filter = 'all'; query = ''; taskTab = 'all'; go('discover'); toast('Demoen er nulstillet.'); }, 'Nulstil demo'); return; }
  if (action === 'apply') { M.apply(state, id); save(); render(); toast('Dit tilbud er sendt. Du afventer arrangørens svar.'); return; }
  if (action === 'assign') { M.assign(state, id, el.dataset.person); save(); render(); toast('Deltageren er valgt til opgaven.'); return; }
  if (action === 'complete') {
    const t = state.tasks.find(t => t.id === id), total = t.amount * t.selected.length;
    modal('Afslut opgaven og overfør', `<p>Bekræft, at opgaven er udført af de valgte deltagere.</p><div class="note">${t.selected.map(person => `${e(profile(person).name)}: <strong>${money(t.amount, t.unit)}</strong>`).join('<br>')}</div><p>I alt: <strong>${money(total, t.unit)}</strong><br>Din saldo: ${money(state.wallets[who()][t.unit], t.unit)}</p><p class="meta">Overførslen simuleres. Der flyttes ingen rigtige penge.</p>`, () => { M.complete(state, id); toast('Opgaven er udført, og overførslen er gennemført.'); }, 'Bekræft udførelse og overfør'); return;
  }
  if (action === 'redeem') {
    const r = state.rewards.find(r => r.id === id);
    modal('Indløs din belønning', `<p>${e(r.title)} hos ${e(profile(r.owner).name)}</p><div class="facts"><div><small>Pris</small><strong>${money(r.price)}</strong></div><div><small>Saldo efter indløsning</small><strong>${money(state.wallets.me.KK - r.price)}</strong></div></div><p class="meta">Dette er en demoindløsning. Belønningen kan ikke afhentes i en rigtig butik.</p>`, () => { M.redeem(state, id); toast('Belønningen er indløst. Din kvittering vises på siden.'); }, 'Bekræft indløsning'); return;
  }
  if (action === 'review') {
    const t = state.tasks.find(t => t.id === id), targets = (who() === t.owner ? t.selected : [t.owner]).filter(person => !state.reviews.some(r => r.task === id && r.author === who() && r.target === person));
    if (!targets.length) { toast('Du har allerede anmeldt dine samarbejdspartnere.'); return; }
    modal('Hvordan var samarbejdet?', `<label class="field">Anmeld bruger<select id="review-target">${targets.map(person => `<option value="${person}">${e(profile(person).name)}</option>`).join('')}</select></label><label class="field">Vurdering<select id="review-rating">${[5, 4, 3, 2, 1].map(n => `<option value="${n}">${n} af 5 stjerner</option>`).join('')}</select></label><label class="field">Kommentar (valgfri)<textarea id="review-comment" maxlength="1000"></textarea></label>`, () => { M.review(state, id, document.getElementById('review-target').value, document.getElementById('review-rating').value, document.getElementById('review-comment').value); toast('Tak. Din anmeldelse er gemt på brugerens profil.'); }, 'Gem anmeldelse');
  }
}
document.addEventListener('click', event => { const el = event.target.closest('[data-action]'); if (!el) return; event.preventDefault(); try { handle(el.dataset.action, el.dataset.id, el); } catch (error) { toast(error.message); } });
document.addEventListener('input', event => { if (event.target.id === 'search') { query = event.target.value; document.getElementById('task-results').innerHTML = taskResults(); } });
document.addEventListener('change', event => {
  if (event.target.id === 'role') { state.role = event.target.value; taskTab = 'all'; detailTab = 'about'; save(); go(home()); }
  if (event.target.id === 'filter') { filter = event.target.value; document.getElementById('task-results').innerHTML = taskResults(); }
});
document.addEventListener('submit', event => {
  event.preventDefault(); const form = event.target; if (!form.reportValidity()) return;
  const data = Object.fromEntries(new FormData(form));
  try {
    if (form.id === 'task-form') { modal('Klar til offentliggørelse?', `<h3>${e(data.title)}</h3><p class="detail-copy">${e(data.description)}</p><p>${e(data.place)} · ${date(data.date)} · ${e(data.time)}</p><div class="note">${data.capacity} deltagere · ${money(data.amount, state.role === 'org' ? 'KK' : 'DKK')} pr. deltager</div>`, () => { const t = M.addTask(state, data); detailTab = 'about'; go('task/' + t.id); toast('Din opgave er offentliggjort.'); }, 'Offentliggør'); return; }
    if (form.id === 'reward-form') { const r = M.addReward(state, data); save(); go('reward/' + r.id); toast('Din belønning er oprettet.'); }
    if (form.id === 'profile-form') { state.profiles[who()].name = data.name.trim() || profile(who()).name; state.profiles[who()].bio = data.bio.trim(); save(); render(); toast('Din profil er gemt.'); }
    if (form.id === 'auth-form') { state.role = data.role; state.signedIn = true; if (authTab === 'signup') { state.profiles[who()].name = data.name.trim() || profile(who()).name; state.profiles[who()].email = data.email; } save(); go(home()); toast(authTab === 'signup' ? 'Din demoprofil er klar.' : 'Du er logget ind i demoen.'); }
  } catch (error) { toast(error.message); }
});
dialog.addEventListener('cancel', () => { pending = null; });
window.addEventListener('hashchange', () => { detailTab = 'about'; render(); window.scrollTo(0, 0); document.querySelector('h1')?.focus({ preventScroll: true }); });
render();
