const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const M = require('./model.js');

// A complete cooperation updates both parties and cannot transfer twice.
const s = M.seed();
M.apply(s, 't1');
assert.throws(() => M.apply(s, 't1'));
assert.throws(() => M.assign(s, 't1', 'me'));
s.role = 'org';
M.assign(s, 't1', 'me');
M.assign(s, 't1', 'sara');
M.complete(s, 't1');
assert.equal(s.wallets.me.KK, 320);
assert.equal(s.wallets.sara.KK, 80);
assert.equal(s.wallets.org.KK, 1640);
assert.equal(s.tasks[0].status, 'done');
assert.throws(() => M.complete(s, 't1'));
assert.equal(s.wallets.org.KK, 1640);
s.role = 'contributor';
M.review(s, 't1', 'org', 5, 'Godt samarbejde');
assert.throws(() => M.review(s, 't1', 'org', 5, 'Gentaget'));
assert.throws(() => M.review(s, 't1', 'sara', 5, 'Forkert modtager'));
M.redeem(s, 'r1');
assert.equal(s.wallets.me.KK, 260);
assert.equal(s.wallets.partner.KK, 60);
assert.throws(() => M.redeem(s, 'r1'));
assert.throws(() => M.redeem(s, 'r3'));
assert.equal(s.wallets.me.KK, 260);

// A failed payment leaves both task and balances untouched.
const poor = M.seed(); poor.role = 'org';
M.assign(poor, 't2', 'me'); poor.wallets.org.KK = 1;
const before = JSON.stringify(poor);
assert.throws(() => M.complete(poor, 't2'));
assert.equal(JSON.stringify(poor), before);

// Private task uses DKK, not Karma Koins.
const privateState = M.seed(); privateState.role = 'requester';
M.assign(privateState, 't4', 'sara'); M.complete(privateState, 't4');
assert.equal(privateState.wallets.me.DKK, 700);
assert.equal(privateState.wallets.sara.DKK, 200);
assert.equal(privateState.wallets.me.KK, 240);
assert.throws(() => M.addReward(privateState, { title: 'x', description: 'x', terms: 'x', price: 5 }));
assert.throws(() => M.addTask(privateState, { title: 'x', description: 'x', place: 'x', date: '2026-09-25', amount: -1, capacity: 1 }));
privateState.signedIn = false;
assert.throws(() => M.complete(privateState, 't4'));

// Render each view with a minimal document stub; this is not browser visual QA.
const elements = new Map();
function element(id) { if (!elements.has(id)) elements.set(id, { innerHTML: '', textContent: '', open: false, addEventListener() {}, showModal() { this.open = true; }, close() { this.open = false; } }); return elements.get(id); }
const context = vm.createContext({
  EchoModel: M, localStorage: { getItem: () => null, setItem() {} },
  document: { getElementById: element, addEventListener() {}, querySelector: () => null },
  location: { hash: '#discover' }, window: { addEventListener() {}, scrollTo() {} },
  setTimeout: () => 1, clearTimeout() {}, console, FormData: class {}
});
vm.runInContext(fs.readFileSync(__dirname + '/app.js', 'utf8'), context);
let count = 0;
for (const [role, routes] of Object.entries({
  contributor: ['discover', 'tasks', 'task/t1', 'wallet', 'rewards', 'reward/r1', 'reward/r3', 'profile', 'user/org', 'auth'],
  org: ['tasks', 'task/t1', 'new-task', 'wallet', 'profile'],
  requester: ['tasks', 'task/t4', 'new-task', 'wallet'],
  partner: ['partner', 'new-reward', 'reward/r1', 'wallet', 'profile']
})) {
  for (const route of routes) {
    vm.runInContext(`state.role = ${JSON.stringify(role)}; location.hash = ${JSON.stringify('#' + route)}; render();`, context);
    assert.ok(element('app').innerHTML.includes('<h1'), `${role} ${route}`);
    assert.ok(!element('app').innerHTML.includes('undefined'), `${role} ${route}`);
    count++;
  }
}
vm.runInContext("state.role = 'contributor'; state.profiles.me.name = '<img src=x onerror=alert(1)>'; location.hash = '#profile'; render();", context);
assert.ok(!element('app').innerHTML.includes('<img'));
assert.ok(element('app').innerHTML.includes('&lt;img'));
vm.runInContext("location.hash = '#new-reward'; render();", context);
assert.ok(element('app').innerHTML.includes('Denne side er ikke tilgængelig'));
vm.runInContext("state.signedIn = false; location.hash = '#wallet'; render();", context);
assert.ok(element('app').innerHTML.includes('auth-form'));
console.log(`PASS: task lifecycle, DKK payment, insufficient funds, duplicate protection, ratings, role checks, escaping, and ${count} view renders.`);
