/* Lokal demomodel. Ingen netværkskald, rigtig login eller betaling. */
(function (root) {
  'use strict';
  const seed = () => ({
    version: 1, role: 'contributor', signedIn: true,
    profiles: {
      me: { name: 'Alex Jensen', bio: 'Jeg hjælper gerne med praktiske opgaver og nye fællesskaber i Aarhus.', role: 'Contributor / Requester', email: 'alex@example.dk' },
      org: { name: 'Fælles om Aarhus', bio: 'Vi samler lokale kræfter om en grønnere og mere social by.', role: 'Organization' },
      partner: { name: 'Kaffekvarteret', bio: 'Din lokale kaffepause. Vi bakker op om dem, der gør en forskel.', role: 'Reward Partner' },
      sara: { name: 'Sara Madsen', bio: 'Glad for at være ude og give en hånd med.', role: 'Contributor' },
      erik: { name: 'Erik Sørensen', bio: 'Aarhusianer med en lille have og mange projekter.', role: 'Requester' }
    },
    wallets: { me: { KK: 240, DKK: 900 }, org: { KK: 1800, DKK: 0 }, partner: { KK: 0, DKK: 0 }, sara: { KK: 0, DKK: 0 }, erik: { KK: 120, DKK: 1500 } },
    tasks: [
      { id: 't1', title: 'Giv strandparken en frisk start', category: 'Natur & miljø', owner: 'org', type: 'org', description: 'Vær med til en hyggelig formiddag, hvor vi samler affald langs vandet. Vi sørger for handsker, poser og en kop kaffe. Du skal bare tage tøj på efter vejret og have lyst til at hjælpe.', place: 'Tangkrogen, Aarhus', date: '2026-09-19', time: '10:00–12:00', amount: 80, unit: 'KK', capacity: 6, applicants: ['sara'], selected: [], status: 'open' },
      { id: 't2', title: 'Lav mad, der samler mennesker', category: 'Fællesskab', owner: 'org', type: 'org', description: 'Hjælp os med at forberede og servere aftensmad til fællesspisning. Du behøver ikke være kok; vi fordeler opgaverne og hjælper hinanden i køkkenet.', place: 'Folkestedet, Aarhus C', date: '2026-09-22', time: '16:00–19:00', amount: 120, unit: 'KK', capacity: 4, applicants: ['me', 'sara'], selected: [], status: 'open' },
      { id: 't3', title: 'En hjælpende hånd i haven', category: 'Praktisk hjælp', owner: 'erik', type: 'private', description: 'Jeg søger hjælp til at luge et par bede og samle grene i min lille have. Redskaber og en kold sodavand står klar.', place: 'Trøjborg, Aarhus N', date: '2026-09-20', time: '13:00–15:00', amount: 300, unit: 'DKK', capacity: 1, applicants: [], selected: [], status: 'open' },
      { id: 't4', title: 'Hjælp med at flytte en reol', category: 'Praktisk hjælp', owner: 'me', type: 'private', description: 'En reol skal flyttes fra stuen til kælderen. Vi er to om løftet, og opgaven tager omkring en time.', place: 'Frederiksbjerg, Aarhus C', date: '2026-09-21', time: '17:00–18:00', amount: 200, unit: 'DKK', capacity: 1, applicants: ['sara'], selected: [], status: 'open' }
    ],
    rewards: [
      { id: 'r1', title: 'En god kop kaffe', owner: 'partner', category: 'Kaffe & hygge', description: 'Tag en velfortjent pause med en valgfri kaffe hos Kaffekvarteret.', price: 60, terms: 'Gælder én almindelig kaffe i caféen. Fysisk udlevering er ikke implementeret i prototypen.' },
      { id: 'r2', title: 'Kaffe til dig og en ven', owner: 'partner', category: 'Del en oplevelse', description: 'Invitér en ven på to valgfrie kaffer og en god snak.', price: 110, terms: 'Gælder to almindelige kaffer ved samme besøg. Fysisk udlevering er ikke implementeret.' },
      { id: 'r3', title: 'Brunch for to', owner: 'partner', category: 'Tid sammen', description: 'En rolig start på weekenden med brunch og kaffe for to personer.', price: 400, terms: 'Bordreservation aftales med caféen. Fysisk udlevering er ikke implementeret.' }
    ],
    transactions: [{ id: 'x0', date: '2026-09-08', title: 'Tidligere frivilligt arbejde', from: 'org', to: 'me', amount: 240, unit: 'KK', status: 'Gennemført', task: null }],
    reviews: [], redemptions: []
  });
  const actor = s => s.role === 'org' ? 'org' : s.role === 'partner' ? 'partner' : 'me';
  const must = (condition, message) => { if (!condition) throw new Error(message); };
  const id = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const task = (s, taskId) => { const t = s.tasks.find(t => t.id === taskId); must(t, 'Opgaven findes ikke.'); return t; };
  function apply(s, taskId) {
    const t = task(s, taskId), who = actor(s);
    must(s.signedIn && s.role === 'contributor', 'Skift til Contributor for at tilbyde hjælp.');
    must(t.owner !== who && t.status !== 'done' && t.selected.length < t.capacity, 'Du kan ikke tilbyde hjælp til denne opgave.');
    must(!t.applicants.includes(who), 'Du har allerede tilbudt din hjælp.');
    t.applicants.push(who);
  }
  function assign(s, taskId, person) {
    const t = task(s, taskId);
    must(s.signedIn && t.owner === actor(s) && ['org', 'requester'].includes(s.role), 'Kun ejeren kan vælge deltagere.');
    must(t.status !== 'done' && t.applicants.includes(person) && !t.selected.includes(person) && t.selected.length < t.capacity, 'Deltageren kan ikke vælges.');
    must(person !== t.owner, 'Du kan ikke tildele opgaven til dig selv.');
    t.selected.push(person); t.status = 'assigned';
  }
  function complete(s, taskId) {
    const t = task(s, taskId), who = actor(s), total = t.amount * t.selected.length;
    must(s.signedIn && t.owner === who && ['org', 'requester'].includes(s.role), 'Kun ejeren kan afslutte opgaven.');
    must(t.status !== 'done' && t.selected.length > 0, 'Vælg mindst én deltager, før opgaven afsluttes.');
    must(s.wallets[who][t.unit] >= total, 'Der er ikke nok på saldoen til at gennemføre overførslen.');
    s.wallets[who][t.unit] -= total;
    t.selected.forEach(person => {
      s.wallets[person][t.unit] += t.amount;
      s.transactions.unshift({ id: id(), date: new Date().toISOString(), title: t.title, from: who, to: person, amount: t.amount, unit: t.unit, status: 'Gennemført', task: t.id });
    });
    t.status = 'done';
  }
  function redeem(s, rewardId) {
    const r = s.rewards.find(r => r.id === rewardId), who = actor(s);
    must(s.signedIn && s.role === 'contributor' && r, 'Belønningen kan ikke indløses fra denne rolle.');
    must(s.wallets[who].KK >= r.price, 'Du har ikke nok Karma Koins.');
    must(!s.redemptions.some(x => x.reward === rewardId && x.person === who), 'Denne belønning er allerede indløst i demoen.');
    s.wallets[who].KK -= r.price; s.wallets[r.owner].KK += r.price;
    const receipt = { id: id(), reward: r.id, person: who, date: new Date().toISOString() };
    s.redemptions.push(receipt);
    s.transactions.unshift({ id: receipt.id, date: receipt.date, title: r.title, from: who, to: r.owner, amount: r.price, unit: 'KK', status: 'Gennemført', reward: r.id });
    return receipt;
  }
  function addTask(s, data) {
    must(s.signedIn && ['org', 'requester'].includes(s.role), 'Denne rolle kan ikke oprette opgaver.');
    must(data.title.trim() && data.description.trim() && data.place.trim() && data.date, 'Udfyld alle påkrævede felter.');
    must(Number.isFinite(+data.amount) && +data.amount > 0 && Number.isInteger(+data.capacity) && +data.capacity > 0, 'Beløb og antal deltagere skal være positive.');
    const t = { ...data, id: id(), owner: actor(s), type: s.role === 'org' ? 'org' : 'private', unit: s.role === 'org' ? 'KK' : 'DKK', amount: +data.amount, capacity: +data.capacity, applicants: [], selected: [], status: 'open' };
    s.tasks.unshift(t); return t;
  }
  function addReward(s, data) {
    must(s.signedIn && s.role === 'partner', 'Kun Reward Partner kan oprette belønninger.');
    must(data.title.trim() && data.description.trim() && data.terms.trim() && Number.isFinite(+data.price) && +data.price > 0, 'Udfyld felterne, og angiv en positiv pris.');
    const r = { ...data, price: +data.price, owner: actor(s), id: id() }; s.rewards.unshift(r); return r;
  }
  function review(s, taskId, target, rating, comment) {
    const t = task(s, taskId), who = actor(s);
    must(s.signedIn && t.status === 'done', 'Opgaven skal være udført, før du kan anmelde.');
    must((who === t.owner && t.selected.includes(target)) || (t.selected.includes(who) && target === t.owner), 'Du kan kun anmelde din samarbejdspartner.');
    must(!s.reviews.some(r => r.task === taskId && r.author === who && r.target === target), 'Du har allerede anmeldt denne deltager.');
    must(Number.isInteger(+rating) && +rating >= 1 && +rating <= 5, 'Vælg en vurdering mellem 1 og 5.');
    s.reviews.unshift({ id: id(), task: taskId, author: who, target, rating: +rating, comment: comment.trim() });
  }
  const api = { seed, actor, apply, assign, complete, redeem, addTask, addReward, review };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.EchoModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
