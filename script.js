const state = { streak: 7, coins: 1240, xp: 68, level: 12, best: 28, combo: 3, eventPoints: 370, shopOwned: false, multiplier: 1, xpBoost: 0, coinBoost: 0, cooldownLevel: 0, luckLevel: 0, recoveryLevel: 0, dailyCoins: 0, successfulMoves: 0, contributions: 0 };
const accountKey = 'dontStopAccounts';
const sessionKey = 'dontStopSession';
const upgradeKey = 'dontStopUpgrades';
const onlineBoard = window.supabase?.createClient('https://ckvfklamhdfwbykvuyps.supabase.co', 'sb_publishable_MvCKpBgaYoP-RLGGBeIrtw_NObU8z54');
const dailyKey = 'dontStopDaily';
const achievementKey = 'dontStopAchievements';
const loginKey = 'dontStopLogin';
const eventTarget = 50000;
const savedUpgrades = JSON.parse(localStorage.getItem(upgradeKey) || '{}') || {};
const today = new Date().toISOString().slice(0, 10); const savedDailyRecord = JSON.parse(localStorage.getItem(dailyKey) || '{}') || {}; const savedDaily = savedDailyRecord.date === today ? savedDailyRecord : {};
const savedAchievements = JSON.parse(localStorage.getItem(achievementKey) || '{}') || {};
const savedLogin = JSON.parse(localStorage.getItem(loginKey) || '{}') || {};
state.xpBoost = Number(savedUpgrades.xpBoost) || 0;
state.coinBoost = Number(savedUpgrades.coinBoost) || 0;
state.cooldownLevel = Number(savedUpgrades.cooldownLevel) || 0;
state.luckLevel = Number(savedUpgrades.luckLevel) || 0;
state.recoveryLevel = Number(savedUpgrades.recoveryLevel) || 0;
state.shopOwned = Boolean(savedUpgrades.shopOwned);
state.dailyCoins = Number(savedDaily.dailyCoins) || 0;
state.successfulMoves = Number(savedDaily.successfulMoves) || 0;
state.contributions = Number(savedDaily.contributions) || 0;
const claimedQuests = savedDaily.claimedQuests || {};
const unlockedAchievements = savedAchievements.unlocked || {};
let loginStreak = Number(savedLogin.streak) || 0;
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
let cooldownUntil = 0;
let cooldownTimer;
function showToast(message, good = true) { toast.textContent = message; toast.style.background = good ? 'var(--lime)' : 'var(--pink)'; toast.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 1700); }
function updateCooldown() { const remaining = Math.max(0, cooldownUntil - Date.now()); document.querySelectorAll('.choice').forEach(button => { button.disabled = remaining > 0; }); if (remaining > 0) { $('risk-label').textContent = `COOLDOWN ${(remaining / 1000).toFixed(1)}s`; return; } clearInterval(cooldownTimer); cooldownTimer = null; $('risk-label').textContent = 'Ready to start another run.'; }
function startCooldown(seconds) { cooldownUntil = Date.now() + seconds * 1000; clearInterval(cooldownTimer); updateCooldown(); cooldownTimer = setInterval(updateCooldown, 100); }
function getCooldownSeconds() { return [15, 10, 5, 2][state.cooldownLevel]; }
function getChoiceChance(choiceName) { return Math.min(1, choices[choiceName].chance + state.luckLevel * .05); }
function getLevelTarget() { return 100 + (state.level - 1) * 25; }
function saveDailyProgress() { localStorage.setItem(dailyKey, JSON.stringify({ date: today, dailyCoins: state.dailyCoins, successfulMoves: state.successfulMoves, contributions: state.contributions, claimedQuests })); }
function checkDailyQuests() { const quests = [{ id: 'streak', complete: state.streak >= 15, reward: 500, message: 'HOT STREAK COMPLETE · +500 COINS' }, { id: 'coins', complete: state.dailyCoins >= 500, reward: 750, message: 'COIN FLIP COMPLETE · +750 COINS' }, { id: 'moves', complete: state.successfulMoves >= 10, reward: 1000, message: 'MOVE MAKER COMPLETE · +1000 COINS' }, { id: 'event', complete: state.contributions >= 10, reward: 1500, message: 'SERVER BOOSTER COMPLETE · +1500 COINS' }]; quests.forEach(quest => { if (!quest.complete || claimedQuests[quest.id]) return; claimedQuests[quest.id] = true; state.coins += quest.reward; showToast(quest.message); }); saveDailyProgress(); }
function checkAchievements() { const achievements = [{ id: 'first-step', title: 'FIRST STEP', description: 'Win your first move', reward: 100, complete: state.successfulMoves >= 1 }, { id: 'hot-streak', title: 'HOT STREAK', description: 'Reach a streak of 15', reward: 500, complete: state.streak >= 15 || state.best >= 15 }, { id: 'level-up', title: 'LEVEL UP', description: 'Reach level 13', reward: 1000, complete: state.level >= 13 }, { id: 'upgrade-hunter', title: 'UPGRADE HUNTER', description: 'Buy your first upgrade', reward: 750, complete: state.xpBoost + state.coinBoost + state.cooldownLevel + state.luckLevel + state.recoveryLevel > 0 || state.shopOwned }, { id: 'max-luck', title: 'LUCKY BREAK', description: 'Reach 100% luck', reward: 5000, complete: state.luckLevel >= 20 }]; achievements.forEach(achievement => { if (!achievement.complete || unlockedAchievements[achievement.id]) return; unlockedAchievements[achievement.id] = true; state.coins += achievement.reward; showToast(`${achievement.title} UNLOCKED · +${achievement.reward} COINS`); }); localStorage.setItem(achievementKey, JSON.stringify({ unlocked: unlockedAchievements })); }
function claimDailyLogin() { if (savedLogin.date === today) return; const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10); loginStreak = savedLogin.date === yesterday ? loginStreak + 1 : 1; const reward = Math.min(250 + loginStreak * 50, 1000); state.coins += reward; localStorage.setItem(loginKey, JSON.stringify({ date: today, streak: loginStreak, reward })); showToast(`DAY ${loginStreak} LOGIN REWARD · +${reward} COINS`); }
function render() {
  const levelTarget = getLevelTarget(); const levelProgress = Math.min(state.xp / levelTarget * 100, 100);
  $('coin-count').textContent = state.coins.toLocaleString(); $('streak-number').textContent = String(state.streak).padStart(2, '0');
  $('streak-stat').textContent = state.streak; $('best-stat').textContent = state.best;
  $('combo-count').textContent = `+${state.combo}`; $('cash-value').textContent = `+${Math.max(8, state.streak * 16)}`;
  $('progress-percent').textContent = `${Math.round(levelProgress)}%`; $('progress-fill').style.width = `${levelProgress}%`; $('xp-fill').style.width = `${levelProgress}%`;
  $('quest-current').textContent = Math.min(state.streak, 15); $('quest-fill').style.width = `${Math.min(state.streak / 15 * 100, 100)}%`;
  $('level-number').textContent = state.level; $('level-xp').textContent = Math.max(0, levelTarget - state.xp);
  $('multiplier').textContent = `x${(1 + state.streak * .1).toFixed(1)}`;
  $('event-points').textContent = state.eventPoints.toLocaleString(); $('event-fill').style.width = `${Math.min(state.eventPoints / eventTarget * 100, 100)}%`;
  $('mini-quest-progress').textContent = `${Math.min(state.streak, 15)} / 15`; $('coin-quest-progress').textContent = `${Math.min(state.dailyCoins, 500)} / 500`; $('move-quest-progress').textContent = `${Math.min(state.successfulMoves, 10)} / 10`; $('event-quest-progress').textContent = `${Math.min(state.contributions, 10)} / 10`;
  $('shop-button').textContent = state.shopOwned ? 'OWNED' : '30,000 ✦'; $('shop-button').disabled = state.shopOwned;
  const xpUpgradeCost = 500 * (state.xpBoost + 1); const coinUpgradeCost = 650 * (state.coinBoost + 1); const cooldownCosts = [20000, 50000, 100000]; const luckUpgradeCost = 650 * (state.luckLevel + 1); const recoveryUpgradeCost = 30000 * (state.recoveryLevel + 1);
  $('xp-upgrade-button').textContent = state.xpBoost >= 3 ? 'MAX' : `${xpUpgradeCost} ✦`; $('xp-upgrade-button').disabled = state.xpBoost >= 3;
  $('coin-upgrade-button').textContent = state.coinBoost >= 3 ? 'MAX' : `${coinUpgradeCost} ✦`; $('coin-upgrade-button').disabled = state.coinBoost >= 3;
  $('cooldown-upgrade-button').textContent = state.cooldownLevel >= 3 ? 'MAX' : `${cooldownCosts[state.cooldownLevel]} ✦`; $('cooldown-upgrade-button').disabled = state.cooldownLevel >= 3;
  $('luck-upgrade-button').textContent = state.luckLevel >= 20 ? 'MAX' : `${luckUpgradeCost} ✦`; $('luck-upgrade-button').disabled = state.luckLevel >= 20;
  $('recovery-upgrade-button').textContent = state.recoveryLevel >= 3 ? 'MAX' : `${recoveryUpgradeCost} ✦`; $('recovery-upgrade-button').disabled = state.recoveryLevel >= 3;
  $('xp-upgrade-level').textContent = `Level ${state.xpBoost} · +${state.xpBoost * 10}% XP`;
  $('coin-upgrade-level').textContent = `Level ${state.coinBoost} · +${state.coinBoost * 10}% coins`;
  $('cooldown-upgrade-level').textContent = `Level ${state.cooldownLevel} · ${getCooldownSeconds()}s cooldown`;
  $('luck-upgrade-level').textContent = `Level ${state.luckLevel} · ${Math.min(state.luckLevel * 5, 100)}% luck`;
  $('recovery-upgrade-level').textContent = `Level ${state.recoveryLevel} · -${state.recoveryLevel * 25}% XP loss`;
  $('login-reward-copy').textContent = `Day ${loginStreak} · Daily reward`; $('login-reward-value').textContent = `${Math.min(250 + loginStreak * 50, 1000)} ✦`;
  const achievementItems = [{ id: 'first-step', title: 'FIRST STEP', description: 'Win your first move' }, { id: 'hot-streak', title: 'HOT STREAK', description: 'Reach a streak of 15' }, { id: 'level-up', title: 'LEVEL UP', description: 'Reach level 13' }, { id: 'upgrade-hunter', title: 'UPGRADE HUNTER', description: 'Buy your first upgrade' }, { id: 'max-luck', title: 'LUCKY BREAK', description: 'Reach 100% luck' }];
  $('achievement-list').innerHTML = achievementItems.map(item => `<li class="${unlockedAchievements[item.id] ? 'unlocked' : ''}"><span>${unlockedAchievements[item.id] ? '✓' : '○'}</span><div><strong>${item.title}</strong><small>${item.description}</small></div></li>`).join('');
  document.querySelectorAll('.choice').forEach(button => { const choice = choices[button.dataset.choice]; button.querySelector('.choice-detail').textContent = `+${choice.xp} XP · ${Math.round(getChoiceChance(button.dataset.choice) * 100)}%`; });
  const rebirth = $('rebirth-button'); rebirth.disabled = state.level < 50; rebirth.classList.toggle('ready', state.level >= 50); rebirth.textContent = state.level >= 50 ? 'REBIRTH NOW' : 'REBIRTH AT LEVEL 50';
  updateCurrentAccount(); renderLeaderboard();
}
function updateCurrentAccount() { const account = accounts.find(item => item.email === currentEmail); if (!account) return; account.streak = state.best; account.level = state.level; account.coins = state.coins; localStorage.setItem(accountKey, JSON.stringify(accounts)); }
function escapeHtml(value) { return value.replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character])); }
function renderLeaderboardRows(players) {
  const list = $('leaderboard-list');
  list.innerHTML = players.map((item, index) => { const score = item[boardMode] || 0; const safeName = escapeHtml(item.player_name || item.name); const initials = escapeHtml(safeName.slice(0, 2).toUpperCase()); const isYou = item.player_name === accounts.find(account => account.email === currentEmail)?.name; return `<li class="${isYou ? 'you' : ''}"><span class="rank ${index === 0 ? 'rank-gold' : index === 1 ? 'rank-silver' : index === 2 ? 'rank-bronze' : ''}">${String(index + 1).padStart(2, '0')}</span><span class="leader-avatar ${isYou ? 'you-avatar' : index % 2 ? 'blue' : 'orange'}">${initials}</span><span class="leader-info"><strong>${safeName}${isYou ? ' · you' : ''}</strong><small>${boardMode.toUpperCase()} ${score.toLocaleString()}</small></span><b>${score.toLocaleString()}</b></li>`; }).join('');
}
async function syncOnlinePlayer(account) {
  if (!onlineBoard) return;
  const player = { player_name: account.name, streak: state.best, level: state.level, coins: state.coins, updated_at: new Date().toISOString() };
  const { data: existing } = await onlineBoard.from('leaderboard').select('id').eq('player_name', account.name).maybeSingle();
  if (existing) await onlineBoard.from('leaderboard').update(player).eq('id', existing.id); else await onlineBoard.from('leaderboard').insert(player);
}
async function renderOnlineLeaderboard(account) {
  await syncOnlinePlayer(account);
  const { data, error } = await onlineBoard.from('leaderboard').select('player_name, streak, level, coins').order(boardMode, { ascending: false }).limit(50);
  if (error || !data) return renderLeaderboardRows(accounts);
  renderLeaderboardRows(data);
}
function renderLeaderboard() {
  const account = accounts.find(item => item.email === currentEmail); const gate = $('auth-gate'); const content = $('leaderboard-content');
  if (!account) { gate.classList.remove('hidden'); content.classList.add('hidden'); return; }
  gate.classList.add('hidden'); content.classList.remove('hidden'); $('signed-in-name').textContent = account.name;
  if (onlineBoard) { renderOnlineLeaderboard(account); return; }
  const sorted = [...accounts].sort((a, b) => (b[boardMode] || 0) - (a[boardMode] || 0)); const list = $('leaderboard-list');
  list.innerHTML = sorted.map((item, index) => { const score = item[boardMode] || 0; const safeName = escapeHtml(item.name); const initials = escapeHtml(item.name.slice(0, 2).toUpperCase()); const isYou = item.email === currentEmail; return `<li class="${isYou ? 'you' : ''}"><span class="rank ${index === 0 ? 'rank-gold' : index === 1 ? 'rank-silver' : index === 2 ? 'rank-bronze' : ''}">${String(index + 1).padStart(2, '0')}</span><span class="leader-avatar ${isYou ? 'you-avatar' : index % 2 ? 'blue' : 'orange'}">${initials}</span><span class="leader-info"><strong>${safeName}${isYou ? ' · you' : ''}</strong><small>${boardMode.toUpperCase()} ${score.toLocaleString()}</small></span><b>${score.toLocaleString()}</b></li>`; }).join('');
}
function setAuthError(message) { $('auth-error').textContent = message; }
function signIn(event) { event.preventDefault(); const email = $('signin-email').value.trim().toLowerCase(); const password = $('signin-password').value; const account = accounts.find(item => item.email === email && item.password === password); if (!account) { setAuthError('Email or password is incorrect.'); return; } currentEmail = email; localStorage.setItem(sessionKey, currentEmail); setAuthError(''); event.target.reset(); showToast(`WELCOME BACK, ${account.name.toUpperCase()}`); render(); }
function signUp(event) { event.preventDefault(); const email = $('signup-email').value.trim().toLowerCase(); const name = $('signup-name').value.trim(); const password = $('signup-password').value; if (accounts.some(item => item.email === email)) { setAuthError('That email already has an account.'); return; } if (accounts.some(item => item.name.toLowerCase() === name.toLowerCase())) { setAuthError('That display name is already taken.'); return; } const account = { email, name, password, streak: state.best, level: state.level, coins: state.coins }; accounts.push(account); currentEmail = email; localStorage.setItem(accountKey, JSON.stringify(accounts)); localStorage.setItem(sessionKey, currentEmail); setAuthError(''); event.target.reset(); showToast('ACCOUNT CREATED · BOARD UNLOCKED'); render(); }
function signOut() { currentEmail = ''; localStorage.removeItem(sessionKey); renderLeaderboard(); showToast('SIGNED OUT'); }
function play(choiceName) {
  if (Date.now() < cooldownUntil) return;
  const choice = choices[choiceName];
  const success = Math.random() <= getChoiceChance(choiceName);
  if (!success) { const xpLoss = Math.round(12 * (1 - state.recoveryLevel * .25)); showToast('STREAK LOST. THAT WAS BRAVE.', false); state.streak = 0; state.combo = 0; state.xp = Math.max(0, state.xp - xpLoss); $('risk-label').textContent = 'The run resets. Start another one.'; $('run-message').textContent = 'TOUCH GRASS.'; render(); startCooldown(getCooldownSeconds()); return; }
  state.streak += 1; state.combo += 1; state.successfulMoves += 1; state.xp += Math.round(choice.xp * (1 + state.xpBoost * .1 + (state.shopOwned ? .25 : 0))); if (state.streak > state.best) state.best = state.streak;
  if (state.xp >= getLevelTarget()) { state.xp -= getLevelTarget(); state.level += 1; showToast(`LEVEL ${state.level} UNLOCKED`); } else { showToast(choice.label); }
  $('run-message').textContent = messages[Math.floor(Math.random() * messages.length)]; $('risk-label').textContent = state.streak > 10 ? 'You are officially making questionable choices.' : 'The higher you go, the harder you fall.'; checkDailyQuests(); checkAchievements(); render();
}
function cashOut() { if (!state.streak) { showToast('BUILD A STREAK FIRST.', false); return; } const reward = Math.round(Math.max(8, state.streak * 16) * (1 + state.coinBoost * .1 + (state.shopOwned ? .25 : 0))); state.coins += reward; state.dailyCoins += reward; showToast(`BANKED +${reward} COINS`); state.streak = 0; state.combo = 0; state.xp = Math.min(getLevelTarget(), state.xp + 6); $('run-message').textContent = 'NICE EXIT. AGAIN?'; $('risk-label').textContent = 'Coins secured. The loop continues.'; checkDailyQuests(); checkAchievements(); render(); }
document.querySelectorAll('.choice').forEach(button => button.addEventListener('click', () => play(button.dataset.choice)));
$('cash-out').addEventListener('click', cashOut);
$('signin-form').addEventListener('submit', signIn); $('signup-form').addEventListener('submit', signUp); $('sign-out').addEventListener('click', signOut);
document.querySelectorAll('[data-auth-mode]').forEach(button => button.addEventListener('click', () => { const signup = button.dataset.authMode === 'signup'; document.querySelectorAll('[data-auth-mode]').forEach(item => item.classList.toggle('active', item === button)); $('signin-form').classList.toggle('hidden', signup); $('signup-form').classList.toggle('hidden', !signup); setAuthError(''); }));
document.querySelectorAll('[data-board-mode]').forEach(button => button.addEventListener('click', () => { boardMode = button.dataset.boardMode; document.querySelectorAll('[data-board-mode]').forEach(item => item.classList.toggle('active', item === button)); renderLeaderboard(); }));
 $('event-button').addEventListener('click', () => { state.eventPoints += 25; state.contributions += 1; if (state.eventPoints >= eventTarget) { state.eventPoints -= eventTarget; state.coins += 2500; showToast('GLOBAL EVENT COMPLETE +2500'); } else { showToast('CONTRIBUTION LOGGED'); } checkDailyQuests(); checkAchievements(); render(); });
$('shop-button').addEventListener('click', () => { if (state.coins < 30000) { showToast('NOT ENOUGH COINS.', false); return; } state.coins -= 30000; state.shopOwned = true; localStorage.setItem(upgradeKey, JSON.stringify({ xpBoost: state.xpBoost, coinBoost: state.coinBoost, cooldownLevel: state.cooldownLevel, luckLevel: state.luckLevel, recoveryLevel: state.recoveryLevel, shopOwned: state.shopOwned })); showToast('STATIC BLOOM UNLOCKED · +25% REWARDS'); render(); });
 $('xp-upgrade-button').addEventListener('click', () => buyUpgrade('xpBoost', 500, 'XP BOOST')); $('coin-upgrade-button').addEventListener('click', () => buyUpgrade('coinBoost', 650, 'COIN BOOST')); $('cooldown-upgrade-button').addEventListener('click', () => buyUpgrade('cooldownLevel', 0, 'COOLDOWN', [20000, 50000, 100000])); $('luck-upgrade-button').addEventListener('click', () => buyUpgrade('luckLevel', 650, 'LUCK BOOST', null, 20)); $('recovery-upgrade-button').addEventListener('click', () => buyUpgrade('recoveryLevel', 30000, 'RECOVERY CORE'));
function buyUpgrade(type, baseCost, label, priceList = null, maxLevel = 3, priceStep = baseCost) { const level = state[type]; if (level >= maxLevel) return; const cost = priceList ? priceList[level] : baseCost + level * priceStep; if (state.coins < cost) { showToast('NOT ENOUGH COINS.', false); return; } state.coins -= cost; state[type] += 1; localStorage.setItem(upgradeKey, JSON.stringify({ xpBoost: state.xpBoost, coinBoost: state.coinBoost, cooldownLevel: state.cooldownLevel, luckLevel: state.luckLevel, recoveryLevel: state.recoveryLevel, shopOwned: state.shopOwned })); showToast(`${label} LEVEL ${state[type]} UNLOCKED`); checkAchievements(); render(); }
$('rebirth-button').addEventListener('click', () => { if (state.level < 50) return; state.level = 1; state.xp = 0; state.streak = 0; state.combo = 0; state.multiplier += .25; showToast(`REBIRTH COMPLETE · x${state.multiplier.toFixed(2)}`); render(); });
document.addEventListener('keydown', event => { if (event.key === '1') play('safe'); if (event.key === '2') play('risky'); if (event.key === '3') play('insane'); if (event.key.toLowerCase() === 'c') cashOut(); });
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);
claimDailyLogin();
checkAchievements();
render();
