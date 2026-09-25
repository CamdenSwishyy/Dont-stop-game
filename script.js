const state = { streak: 7, coins: 1240, xp: 68, level: 12, best: 28, combo: 3, eventPoints: 370, shopOwned: false, multiplier: 1 };
const accountKey = 'dontStopAccounts';
const sessionKey = 'dontStopSession';
const seededEmails = new Set(['not.jordan@example.com', 'crashvault@example.com', 'stopsign@example.com']);
const savedAccounts = JSON.parse(localStorage.getItem(accountKey) || '[]');
let accounts = Array.isArray(savedAccounts) ? savedAccounts.filter(account => !seededEmails.has(account.email)) : [];
localStorage.setItem(accountKey, JSON.stringify(accounts));
let currentEmail = localStorage.getItem(sessionKey) || '';
let boardMode = 'streak';
const choices = { safe: { xp: 8, chance: .85, label: 'SAFE +8 XP' }, risky: { xp: 18, chance: .70, label: 'RISKY +18 XP' }, insane: { xp: 40, chance: .55, label: 'INSANE +40 XP' } };
const messages = ['HOW FAR CAN YOU GO?', 'KEEP THAT ENERGY.', 'THE BUTTON HAS CHOSEN YOU.', 'WHY ARE YOU STILL PLAYING?', '99%... DON\'T MESS THIS UP.'];
const $ = id => document.getElementById(id);
const toast = $('toast');
let toastTimer;
function showToast(message, good = true) { toast.textContent = message; toast.style.background = good ? 'var(--lime)' : 'var(--pink)'; toast.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 1700); }
function render() {
  $('coin-count').textContent = state.coins.toLocaleString(); $('streak-number').textContent = String(state.streak).padStart(2, '0');
  $('streak-stat').textContent = state.streak; $('best-stat').textContent = state.best;
  $('combo-count').textContent = `+${state.combo}`; $('cash-value').textContent = `+${Math.max(8, state.streak * 16)}`;
  $('progress-percent').textContent = `${state.xp}%`; $('progress-fill').style.width = `${state.xp}%`; $('xp-fill').style.width = `${state.xp}%`;
  $('quest-current').textContent = Math.min(state.streak, 15); $('quest-fill').style.width = `${Math.min(state.streak / 15 * 100, 100)}%`;
  $('level-number').textContent = state.level; $('level-xp').textContent = Math.max(0, 420 - state.xp);
  $('multiplier').textContent = `x${(1 + state.streak * .1).toFixed(1)}`;
  $('event-points').textContent = state.eventPoints; $('event-fill').style.width = `${Math.min(state.eventPoints / 10, 100)}%`;
  $('mini-quest-progress').textContent = `${Math.min(state.streak, 15)} / 15`; $('coin-quest-progress').textContent = `${Math.min(Math.max(state.coins - 1240, 0), 500)} / 500`;
  $('shop-button').textContent = state.shopOwned ? 'OWNED' : '500 ✦'; $('shop-button').disabled = state.shopOwned;
  const rebirth = $('rebirth-button'); rebirth.disabled = state.level < 50; rebirth.classList.toggle('ready', state.level >= 50); rebirth.textContent = state.level >= 50 ? 'REBIRTH NOW' : 'REBIRTH AT LEVEL 50';
  updateCurrentAccount(); renderLeaderboard();
}
function updateCurrentAccount() { const account = accounts.find(item => item.email === currentEmail); if (!account) return; account.streak = state.best; account.level = state.level; account.coins = state.coins; localStorage.setItem(accountKey, JSON.stringify(accounts)); }
function escapeHtml(value) { return value.replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character])); }
function renderLeaderboard() {
  const account = accounts.find(item => item.email === currentEmail); const gate = $('auth-gate'); const content = $('leaderboard-content');
  if (!account) { gate.classList.remove('hidden'); content.classList.add('hidden'); return; }
  gate.classList.add('hidden'); content.classList.remove('hidden'); $('signed-in-name').textContent = account.name;
  const sorted = [...accounts].sort((a, b) => (b[boardMode] || 0) - (a[boardMode] || 0)); const list = $('leaderboard-list');
  list.innerHTML = sorted.map((item, index) => { const score = item[boardMode] || 0; const safeName = escapeHtml(item.name); const initials = escapeHtml(item.name.slice(0, 2).toUpperCase()); const isYou = item.email === currentEmail; return `<li class="${isYou ? 'you' : ''}"><span class="rank ${index === 0 ? 'rank-gold' : index === 1 ? 'rank-silver' : index === 2 ? 'rank-bronze' : ''}">${String(index + 1).padStart(2, '0')}</span><span class="leader-avatar ${isYou ? 'you-avatar' : index % 2 ? 'blue' : 'orange'}">${initials}</span><span class="leader-info"><strong>${safeName}${isYou ? ' · you' : ''}</strong><small>${boardMode.toUpperCase()} ${score.toLocaleString()}</small></span><b>${score.toLocaleString()}</b></li>`; }).join('');
}
function setAuthError(message) { $('auth-error').textContent = message; }
function signIn(event) { event.preventDefault(); const email = $('signin-email').value.trim().toLowerCase(); const password = $('signin-password').value; const account = accounts.find(item => item.email === email && item.password === password); if (!account) { setAuthError('Email or password is incorrect.'); return; } currentEmail = email; localStorage.setItem(sessionKey, currentEmail); setAuthError(''); event.target.reset(); showToast(`WELCOME BACK, ${account.name.toUpperCase()}`); render(); }
function signUp(event) { event.preventDefault(); const email = $('signup-email').value.trim().toLowerCase(); const name = $('signup-name').value.trim(); const password = $('signup-password').value; if (accounts.some(item => item.email === email)) { setAuthError('That email already has an account.'); return; } if (accounts.some(item => item.name.toLowerCase() === name.toLowerCase())) { setAuthError('That display name is already taken.'); return; } const account = { email, name, password, streak: state.best, level: state.level, coins: state.coins }; accounts.push(account); currentEmail = email; localStorage.setItem(accountKey, JSON.stringify(accounts)); localStorage.setItem(sessionKey, currentEmail); setAuthError(''); event.target.reset(); showToast('ACCOUNT CREATED · BOARD UNLOCKED'); render(); }
function signOut() { currentEmail = ''; localStorage.removeItem(sessionKey); renderLeaderboard(); showToast('SIGNED OUT'); }
function play(choiceName) {
  const choice = choices[choiceName];
  const success = Math.random() <= choice.chance;
  if (!success) { showToast('STREAK LOST. THAT WAS BRAVE.', false); state.streak = 0; state.combo = 0; state.xp = Math.max(0, state.xp - 12); $('risk-label').textContent = 'The run resets. Start another one.'; $('run-message').textContent = 'TOUCH GRASS.'; render(); return; }
  state.streak += 1; state.combo += 1; state.xp += choice.xp; if (state.streak > state.best) state.best = state.streak;
  if (state.xp >= 100) { state.xp -= 100; state.level += 1; showToast(`LEVEL ${state.level} UNLOCKED`); } else { showToast(choice.label); }
  $('run-message').textContent = messages[Math.floor(Math.random() * messages.length)]; $('risk-label').textContent = state.streak > 10 ? 'You are officially making questionable choices.' : 'The higher you go, the harder you fall.'; render();
}
function cashOut() { if (!state.streak) { showToast('BUILD A STREAK FIRST.', false); return; } const reward = Math.max(8, state.streak * 16); state.coins += reward; showToast(`BANKED +${reward} COINS`); state.streak = 0; state.combo = 0; state.xp = Math.min(100, state.xp + 6); $('run-message').textContent = 'NICE EXIT. AGAIN?'; $('risk-label').textContent = 'Coins secured. The loop continues.'; render(); }
document.querySelectorAll('.choice').forEach(button => button.addEventListener('click', () => play(button.dataset.choice)));
$('cash-out').addEventListener('click', cashOut);
$('signin-form').addEventListener('submit', signIn); $('signup-form').addEventListener('submit', signUp); $('sign-out').addEventListener('click', signOut);
document.querySelectorAll('[data-auth-mode]').forEach(button => button.addEventListener('click', () => { const signup = button.dataset.authMode === 'signup'; document.querySelectorAll('[data-auth-mode]').forEach(item => item.classList.toggle('active', item === button)); $('signin-form').classList.toggle('hidden', signup); $('signup-form').classList.toggle('hidden', !signup); setAuthError(''); }));
document.querySelectorAll('[data-board-mode]').forEach(button => button.addEventListener('click', () => { boardMode = button.dataset.boardMode; document.querySelectorAll('[data-board-mode]').forEach(item => item.classList.toggle('active', item === button)); renderLeaderboard(); }));
$('event-button').addEventListener('click', () => { state.eventPoints += 25; if (state.eventPoints >= 1000) { state.eventPoints -= 1000; state.coins += 2500; showToast('GLOBAL EVENT COMPLETE +2500'); } else { showToast('CONTRIBUTION LOGGED'); } render(); });
$('shop-button').addEventListener('click', () => { if (state.coins < 500) { showToast('NOT ENOUGH COINS.', false); return; } state.coins -= 500; state.shopOwned = true; showToast('STATIC BLOOM UNLOCKED'); render(); });
$('rebirth-button').addEventListener('click', () => { if (state.level < 50) return; state.level = 1; state.xp = 0; state.streak = 0; state.combo = 0; state.multiplier += .25; showToast(`REBIRTH COMPLETE · x${state.multiplier.toFixed(2)}`); render(); });
document.addEventListener('keydown', event => { if (event.key === '1') play('safe'); if (event.key === '2') play('risky'); if (event.key === '3') play('insane'); if (event.key.toLowerCase() === 'c') cashOut(); });
render();
