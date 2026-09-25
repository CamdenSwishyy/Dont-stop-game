const state = { streak: 0, coins: 1240, xp: 0, level: 0, best: 0, combo: 0, eventPoints: 370, shopOwned: false, multiplier: 1, xpBoost: 0, coinBoost: 0, cooldownLevel: 0, luckLevel: 0, recoveryLevel: 0, dailyCoins: 0, successfulMoves: 0, contributions: 0 };
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
function getCurrentLoginRecord() {
  const allLoginRecords = JSON.parse(localStorage.getItem(loginKey) || '{}') || {};
  const accountId = typeof currentEmail === 'undefined' ? 'guest' : (currentEmail || 'guest');
  return allLoginRecords[accountId] || { date: '', streak: 0, reward: 0 };
}
function saveCurrentLoginRecord(record) {
  const allLoginRecords = JSON.parse(localStorage.getItem(loginKey) || '{}') || {};
  const accountId = typeof currentEmail === 'undefined' ? 'guest' : (currentEmail || 'guest');
  allLoginRecords[accountId] = record;
  localStorage.setItem(loginKey, JSON.stringify(allLoginRecords));
}
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
let currentEmail = localStorage.getItem(sessionKey) || '';
let loginStreak = Number(getCurrentLoginRecord().streak) || 0;
const seededEmails = new Set(['not.jordan@example.com', 'crashvault@example.com', 'stopsign@example.com']);
const savedAccounts = JSON.parse(localStorage.getItem(accountKey) || '[]');
let accounts = Array.isArray(savedAccounts) ? savedAccounts.filter(account => !seededEmails.has(account.email)) : [];
const zeroStateMigrationKey = 'dontStopZeroStateMigration';
if (!localStorage.getItem(zeroStateMigrationKey)) { accounts = accounts.map(account => ({ ...account, streak: 0, best: 0, xp: 0, level: 0 })); localStorage.setItem(zeroStateMigrationKey, '1'); }
localStorage.setItem(accountKey, JSON.stringify(accounts));
const savedPlayer = accounts.find(account => account.email === currentEmail);
if (savedPlayer) { state.streak = Number(savedPlayer.streak) || 0; state.best = Number(savedPlayer.best ?? savedPlayer.streak) || 0; state.xp = Number(savedPlayer.xp) || 0; state.level = Number(savedPlayer.level) || 0; state.coins = Number(savedPlayer.coins) || state.coins; }
let boardMode = 'streak';
let checkedRemoteReset = false;
const choices = { safe: { xp: 8, label: 'SAFE +8 XP' }, risky: { xp: 18, label: 'RISKY +18 XP' }, insane: { xp: 40, label: 'INSANE +40 XP' } };
const chanceBases = { safe: .85, risky: .70, insane: .55 };
const chanceCaps = { safe: .90, risky: .80, insane: .70 };
const messages = ['HOW FAR CAN YOU GO?', 'KEEP THAT ENERGY.', 'THE BUTTON HAS CHOSEN YOU.', 'WHY ARE YOU STILL PLAYING?', '99%... DON\'T MESS THIS UP.'];
const $ = id => document.getElementById(id);
const toast = $('toast');
const soundKey = 'dontStopSoundEnabled';
let soundEnabled = localStorage.getItem(soundKey) !== 'false';
let audioContext;
let toastTimer;
let cooldownUntil = 0;
let cooldownTimer;
function showToast(message, good = true) { toast.textContent = message; toast.style.background = good ? 'var(--lime)' : 'var(--pink)'; toast.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 1700); }
function playSound(kind) { if (!soundEnabled) return; const AudioContextClass = window.AudioContext || window.webkitAudioContext; if (!AudioContextClass) return; audioContext = audioContext || new AudioContextClass(); if (audioContext.state === 'suspended') audioContext.resume(); const notes = { success: [520, 660], fail: [180, 120], reward: [660, 880, 1040] }[kind] || [440]; notes.forEach((frequency, index) => { const oscillator = audioContext.createOscillator(); const gain = audioContext.createGain(); const start = audioContext.currentTime + index * .09; oscillator.frequency.value = frequency; oscillator.type = kind === 'fail' ? 'sawtooth' : 'sine'; gain.gain.setValueAtTime(.0001, start); gain.gain.exponentialRampToValueAtTime(.12, start + .01); gain.gain.exponentialRampToValueAtTime(.0001, start + .12); oscillator.connect(gain); gain.connect(audioContext.destination); oscillator.start(start); oscillator.stop(start + .14); }); }
function updateSoundButton() { $('sound-toggle').textContent = soundEnabled ? '♪' : '×'; $('sound-toggle').classList.toggle('muted', !soundEnabled); $('sound-toggle').setAttribute('aria-label', soundEnabled ? 'Mute sound effects' : 'Enable sound effects'); $('sound-toggle').title = soundEnabled ? 'Mute sound effects' : 'Enable sound effects'; }
function updateCooldown() { const remaining = Math.max(0, cooldownUntil - Date.now()); document.querySelectorAll('.choice').forEach(button => { button.disabled = remaining > 0; }); if (remaining > 0) { $('risk-label').textContent = `COOLDOWN ${(remaining / 1000).toFixed(1)}s`; return; } clearInterval(cooldownTimer); cooldownTimer = null; $('risk-label').textContent = 'Ready to start another run.'; }
function startCooldown(seconds) { cooldownUntil = Date.now() + seconds * 1000; clearInterval(cooldownTimer); updateCooldown(); cooldownTimer = setInterval(updateCooldown, 100); }
function getCooldownSeconds() { return [15, 10, 5, 2][state.cooldownLevel]; }
function getChoiceChance(choiceName) {
  const progress = Math.min(state.luckLevel / 20, 1);
  return chanceBases[choiceName] + (chanceCaps[choiceName] - chanceBases[choiceName]) * progress;
}
function getLevelTarget() { return 100 + state.level * 25; }
function saveDailyProgress() { localStorage.setItem(dailyKey, JSON.stringify({ date: today, dailyCoins: state.dailyCoins, successfulMoves: state.successfulMoves, contributions: state.contributions, claimedQuests })); }
function checkDailyQuests() { const quests = [{ id: 'streak', complete: state.streak >= 15, reward: 500, message: 'HOT STREAK COMPLETE · +500 COINS' }, { id: 'coins', complete: state.dailyCoins >= 500, reward: 750, message: 'COIN FLIP COMPLETE · +750 COINS' }, { id: 'moves', complete: state.successfulMoves >= 10, reward: 1000, message: 'MOVE MAKER COMPLETE · +1000 COINS' }, { id: 'event', complete: state.contributions >= 10, reward: 1500, message: 'SERVER BOOSTER COMPLETE · +1500 COINS' }]; quests.forEach(quest => { if (!quest.complete || claimedQuests[quest.id]) return; claimedQuests[quest.id] = true; state.coins += quest.reward; showToast(quest.message); }); saveDailyProgress(); }
function checkAchievements() { const achievements = [{ id: 'first-step', title: 'FIRST STEP', description: 'Win your first move', reward: 100, complete: state.successfulMoves >= 1 }, { id: 'hot-streak', title: 'HOT STREAK', description: 'Reach a streak of 15', reward: 500, complete: state.streak >= 15 || state.best >= 15 }, { id: 'level-up', title: 'LEVEL UP', description: 'Reach level 13', reward: 1000, complete: state.level >= 13 }, { id: 'upgrade-hunter', title: 'UPGRADE HUNTER', description: 'Buy your first upgrade', reward: 750, complete: state.xpBoost + state.coinBoost + state.cooldownLevel + state.luckLevel + state.recoveryLevel > 0 || state.shopOwned }, { id: 'max-luck', title: 'LUCKY BREAK', description: 'Reach max luck', reward: 5000, complete: state.luckLevel >= 20 }]; achievements.forEach(achievement => { if (!achievement.complete || unlockedAchievements[achievement.id]) return; unlockedAchievements[achievement.id] = true; state.coins += achievement.reward; showToast(`${achievement.title} UNLOCKED · +${achievement.reward} COINS`); }); localStorage.setItem(achievementKey, JSON.stringify({ unlocked: unlockedAchievements })); }
function getDailyLoginReward(day) { const rewards = { 1: 300, 2: 600, 3: 900, 4: 1200, 5: 1500 }; return rewards[day] || 1500; }
function getNextLoginStreak() {
  const record = getCurrentLoginRecord();
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const currentStreak = Number(record.streak) || 0;
  return record.date === yesterday ? currentStreak + 1 : 1;
}
function claimDailyLogin() {
  if (!currentEmail) { showToast('SIGN IN TO CLAIM THE DAILY REWARD.', false); return; }
  const record = getCurrentLoginRecord();
  if (record.date === today) return;
  const nextStreak = getNextLoginStreak();
  const reward = getDailyLoginReward(nextStreak);
  state.coins += reward;
  const updatedRecord = { ...record, date: today, streak: nextStreak, reward };
  saveCurrentLoginRecord(updatedRecord);
  loginStreak = nextStreak;
  playSound('reward');
  showToast(`DAY ${nextStreak} LOGIN REWARD · +${reward} COINS`);
  render(true);
}
function render(syncOnline = false) {
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
  const xpUpgradeCost = 1200 * (state.xpBoost + 1); const coinUpgradeCost = 1500 * (state.coinBoost + 1); const cooldownCosts = [20000, 50000, 100000]; const luckCosts = [20000, 50000, 100000, 200000, 400000, 800000, 1600000, 3200000, 6400000, 12800000, 25600000, 51200000, 102400000, 204800000, 409600000, 819200000, 1638400000, 3276800000, 6553600000, 13107200000]; const recoveryUpgradeCost = 30000 * (state.recoveryLevel + 1);
  $('xp-upgrade-button').textContent = state.xpBoost >= 3 ? 'MAX' : `${xpUpgradeCost} ✦`; $('xp-upgrade-button').disabled = state.xpBoost >= 3;
  $('coin-upgrade-button').textContent = state.coinBoost >= 3 ? 'MAX' : `${coinUpgradeCost} ✦`; $('coin-upgrade-button').disabled = state.coinBoost >= 3;
  $('cooldown-upgrade-button').textContent = state.cooldownLevel >= 3 ? 'MAX' : `${cooldownCosts[state.cooldownLevel]} ✦`; $('cooldown-upgrade-button').disabled = state.cooldownLevel >= 3;
  $('luck-upgrade-button').textContent = state.luckLevel >= luckCosts.length ? 'MAX' : `${luckCosts[state.luckLevel] || luckCosts[luckCosts.length - 1]} ✦`; $('luck-upgrade-button').disabled = state.luckLevel >= luckCosts.length;
  $('recovery-upgrade-button').textContent = state.recoveryLevel >= 3 ? 'MAX' : `${recoveryUpgradeCost} ✦`; $('recovery-upgrade-button').disabled = state.recoveryLevel >= 3;
  $('xp-upgrade-level').textContent = `Level ${state.xpBoost} · +${state.xpBoost * 10}% XP`;
  $('coin-upgrade-level').textContent = `Level ${state.coinBoost} · +${state.coinBoost * 10}% coins`;
  $('cooldown-upgrade-level').textContent = `Level ${state.cooldownLevel} · ${getCooldownSeconds()}s cooldown`;
  $('luck-upgrade-level').textContent = `Level ${state.luckLevel} · Safe ${Math.round(getChoiceChance('safe') * 1000) / 10}% / Risky ${Math.round(getChoiceChance('risky') * 1000) / 10}% / Insane ${Math.round(getChoiceChance('insane') * 1000) / 10}%`;
  $('recovery-upgrade-level').textContent = `Level ${state.recoveryLevel} · -${state.recoveryLevel * 25}% XP loss`;
  const currentLogin = getCurrentLoginRecord();
  const loginClaimed = !currentEmail ? true : currentLogin.date === today;
  const nextLoginStreak = loginClaimed ? Number(currentLogin.streak || loginStreak || 1) : getNextLoginStreak();
  const nextRewardValue = getDailyLoginReward(nextLoginStreak);
  $('login-reward-copy').textContent = !currentEmail ? 'Sign in to claim a daily reward' : (loginClaimed ? `Day ${nextLoginStreak} · Claimed today` : `Day ${nextLoginStreak} · Claim today's reward`);
  $('login-reward-value').textContent = `${nextRewardValue} ✦`;
  $('login-claim-button').textContent = loginClaimed ? 'CLAIMED' : 'CLAIM REWARD';
  $('login-claim-button').disabled = !currentEmail || loginClaimed;
  const achievementItems = [{ id: 'first-step', title: 'FIRST STEP', description: 'Win your first move' }, { id: 'hot-streak', title: 'HOT STREAK', description: 'Reach a streak of 15' }, { id: 'level-up', title: 'LEVEL UP', description: 'Reach level 13' }, { id: 'upgrade-hunter', title: 'UPGRADE HUNTER', description: 'Buy your first upgrade' }, { id: 'max-luck', title: 'LUCKY BREAK', description: 'Reach 100% luck' }];
  $('achievement-list').innerHTML = achievementItems.map(item => `<li class="${unlockedAchievements[item.id] ? 'unlocked' : ''}"><span>${unlockedAchievements[item.id] ? '✓' : '○'}</span><div><strong>${item.title}</strong><small>${item.description}</small></div></li>`).join('');
  document.querySelectorAll('.choice').forEach(button => { const choice = choices[button.dataset.choice]; button.querySelector('.choice-detail').textContent = `+${choice.xp} XP · ${(getChoiceChance(button.dataset.choice) * 100).toFixed(1)}%`; });
  const rebirth = $('rebirth-button'); rebirth.disabled = state.level < 50; rebirth.classList.toggle('ready', state.level >= 50); rebirth.textContent = state.level >= 50 ? 'REBIRTH NOW' : 'REBIRTH AT LEVEL 50';
  updateCurrentAccount(); renderLeaderboard(syncOnline);
}
function updateCurrentAccount() { const account = accounts.find(item => item.email === currentEmail); if (!account) return; account.streak = state.streak; account.best = state.best; account.xp = state.xp; account.level = state.level; account.coins = state.coins; localStorage.setItem(accountKey, JSON.stringify(accounts)); }
function escapeHtml(value) { return value.replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character])); }
function renderLeaderboardRows(players) {
  const list = $('leaderboard-list');
  list.innerHTML = players.map((item, index) => { const score = item[boardMode] || 0; const safeName = escapeHtml(item.player_name || item.name); const initials = escapeHtml(safeName.slice(0, 2).toUpperCase()); const isYou = item.player_name === accounts.find(account => account.email === currentEmail)?.name; return `<li class="${isYou ? 'you' : ''}"><span class="rank ${index === 0 ? 'rank-gold' : index === 1 ? 'rank-silver' : index === 2 ? 'rank-bronze' : ''}">${String(index + 1).padStart(2, '0')}</span><span class="leader-avatar ${isYou ? 'you-avatar' : index % 2 ? 'blue' : 'orange'}">${initials}</span><span class="leader-info"><strong>${safeName}${isYou ? ' · you' : ''}</strong><small>${boardMode.toUpperCase()} ${score.toLocaleString()}</small></span><b>${score.toLocaleString()}</b></li>`; }).join('');
}
async function syncOnlinePlayer(account) {
  if (!onlineBoard) return;
  const player = { player_name: account.name, streak: state.best, level: state.level, coins: state.coins, updated_at: new Date().toISOString() };
  const { error } = await onlineBoard.from('leaderboard').upsert(player, { onConflict: 'player_name' });
  if (error) console.error('Leaderboard sync failed:', error.message);
}
function resetLocalProgress(account) {
  Object.assign(account, { streak: 0, best: 0, xp: 0, level: 0, coins: 0 });
  state.streak = 0;
  state.best = 0;
  state.xp = 0;
  state.level = 0;
  state.coins = 0;
  state.combo = 0;
  state.xpBoost = 0;
  state.coinBoost = 0;
  state.cooldownLevel = 0;
  state.luckLevel = 0;
  state.recoveryLevel = 0;
  state.shopOwned = false;
  localStorage.setItem(accountKey, JSON.stringify(accounts));
  localStorage.setItem(upgradeKey, JSON.stringify({ xpBoost: 0, coinBoost: 0, cooldownLevel: 0, luckLevel: 0, recoveryLevel: 0, shopOwned: false }));
}
async function renderOnlineLeaderboard(account, syncOnline) {
  if (syncOnline) {
    checkedRemoteReset = true;
    await syncOnlinePlayer(account);
  } else if (!checkedRemoteReset) {
    checkedRemoteReset = true;
    const { data: savedPlayer, error: savedPlayerError } = await onlineBoard.from('leaderboard').select('streak, level, coins').eq('player_name', account.name).maybeSingle();
    if (!savedPlayerError && !savedPlayer) {
      resetLocalProgress(account);
      await syncOnlinePlayer(account);
      render();
    } else if (!savedPlayerError && savedPlayer && Number(savedPlayer.streak) === 0 && Number(savedPlayer.level) === 0 && Number(savedPlayer.coins) === 0) {
      resetLocalProgress(account);
      render();
    }
  }
  const { data, error } = await onlineBoard.from('leaderboard').select('player_name, streak, level, coins').order(boardMode, { ascending: false }).limit(50);
  if (error || !data) return renderLeaderboardRows(accounts);
  renderLeaderboardRows(data);
}
function renderLeaderboard(syncOnline = false) {
  const account = accounts.find(item => item.email === currentEmail); const gate = $('auth-gate'); const content = $('leaderboard-content'); const dangerZone = $('danger-zone');
  const dangerButtons = document.querySelectorAll('.danger-button');
  const bottomDeleteButton = $('delete-account-bottom');
  const accountTools = $('account-tools');
  if (!account) {
    gate.classList.remove('hidden');
    content.classList.add('hidden');
    dangerZone.classList.add('hidden');
    dangerButtons.forEach(button => button.disabled = true);
    accountTools.classList.add('hidden');
    bottomDeleteButton.disabled = true;
    $('danger-password').value = '';
    return;
  }
  gate.classList.add('hidden'); content.classList.remove('hidden'); dangerZone.classList.remove('hidden'); dangerButtons.forEach(button => button.disabled = false);
  accountTools.classList.remove('hidden');
  bottomDeleteButton.disabled = false;
  $('signed-in-name').textContent = account.name;
  if (onlineBoard) { renderOnlineLeaderboard(account, syncOnline); return; }
  const sorted = [...accounts].sort((a, b) => (b[boardMode] || 0) - (a[boardMode] || 0)); const list = $('leaderboard-list');
  list.innerHTML = sorted.map((item, index) => { const score = item[boardMode] || 0; const safeName = escapeHtml(item.name); const initials = escapeHtml(item.name.slice(0, 2).toUpperCase()); const isYou = item.email === currentEmail; return `<li class="${isYou ? 'you' : ''}"><span class="rank ${index === 0 ? 'rank-gold' : index === 1 ? 'rank-silver' : index === 2 ? 'rank-bronze' : ''}">${String(index + 1).padStart(2, '0')}</span><span class="leader-avatar ${isYou ? 'you-avatar' : index % 2 ? 'blue' : 'orange'}">${initials}</span><span class="leader-info"><strong>${safeName}${isYou ? ' · you' : ''}</strong><small>${boardMode.toUpperCase()} ${score.toLocaleString()}</small></span><b>${score.toLocaleString()}</b></li>`; }).join('');
}
function setAuthError(message) { $('auth-error').textContent = message; }
function signIn(event) { event.preventDefault(); const email = $('signin-email').value.trim().toLowerCase(); const password = $('signin-password').value; const account = accounts.find(item => item.email === email && item.password === password); if (!account) { setAuthError('Email or password is incorrect.'); return; } currentEmail = email; checkedRemoteReset = false; localStorage.setItem(sessionKey, currentEmail); setAuthError(''); event.target.reset(); showToast(`WELCOME BACK, ${account.name.toUpperCase()}`); render(); }
 function signUp(event) { event.preventDefault(); const email = $('signup-email').value.trim().toLowerCase(); const name = $('signup-name').value.trim(); const password = $('signup-password').value; if (accounts.some(item => item.email === email)) { setAuthError('That email already has an account.'); return; } if (accounts.some(item => item.name.toLowerCase() === name.toLowerCase())) { setAuthError('That display name is already taken.'); return; } const account = { email, name, password, streak: state.streak, best: state.best, xp: state.xp, level: state.level, coins: state.coins }; accounts.push(account); currentEmail = email; checkedRemoteReset = false; localStorage.setItem(accountKey, JSON.stringify(accounts)); localStorage.setItem(sessionKey, currentEmail); setAuthError(''); event.target.reset(); showToast('ACCOUNT CREATED · BOARD UNLOCKED'); render(true); }
function signOut() { currentEmail = ''; checkedRemoteReset = false; localStorage.removeItem(sessionKey); renderLeaderboard(); showToast('SIGNED OUT'); }
function getCurrentAccount() { return accounts.find(item => item.email === currentEmail) || null; }
function verifyAccountPassword() {
  const password = $('danger-password').value.trim();
  const account = getCurrentAccount();
  if (!account) { showToast('SIGN IN FIRST.', false); return null; }
  if (password !== account.password) { showToast('WRONG PASSWORD.', false); return null; }
  return account;
}
function resetCurrentAccount() {
  const account = verifyAccountPassword();
  if (!account) return;
  account.streak = 0;
  account.best = 0;
  account.xp = 0;
  account.level = 0;
  account.coins = 1240;
  state.streak = 0;
  state.best = 0;
  state.xp = 0;
  state.level = 0;
  state.coins = 1240;
  state.combo = 0;
  state.dailyCoins = 0;
  state.successfulMoves = 0;
  state.contributions = 0;
  state.xpBoost = 0;
  state.coinBoost = 0;
  state.cooldownLevel = 0;
  state.luckLevel = 0;
  state.recoveryLevel = 0;
  state.shopOwned = false;
  localStorage.setItem(accountKey, JSON.stringify(accounts));
  localStorage.setItem(upgradeKey, JSON.stringify({ xpBoost: 0, coinBoost: 0, cooldownLevel: 0, luckLevel: 0, recoveryLevel: 0, shopOwned: false }));
  localStorage.setItem(dailyKey, JSON.stringify({ date: today, dailyCoins: 0, successfulMoves: 0, contributions: 0, claimedQuests: {} }));
  localStorage.setItem(achievementKey, JSON.stringify({ unlocked: {} }));
  if (currentEmail) {
    const allLoginRecords = JSON.parse(localStorage.getItem(loginKey) || '{}') || {};
    delete allLoginRecords[currentEmail];
    localStorage.setItem(loginKey, JSON.stringify(allLoginRecords));
  }
  $('danger-password').value = '';
  showToast('ACCOUNT RESET · START FRESH');
  render(true);
  renderLeaderboard();
}
function deleteCurrentAccount() {
  const account = verifyAccountPassword();
  if (!account) return;
  const confirmed = window.confirm('Delete this account permanently? This cannot be undone.');
  if (!confirmed) return;
  accounts = accounts.filter(item => item.email !== account.email);
  localStorage.setItem(accountKey, JSON.stringify(accounts));
  currentEmail = '';
  localStorage.removeItem(sessionKey);
  $('danger-password').value = '';
  showToast('ACCOUNT DELETED');
  render();
  renderLeaderboard();
}
function resetProgressData() {
  const confirmed = window.confirm('Hard reset all players? This clears all saved coins, levels, streaks, upgrades, and rewards.');
  if (!confirmed) return;
  const resetKeys = [sessionKey, upgradeKey, dailyKey, achievementKey, loginKey, zeroStateMigrationKey];
  resetKeys.forEach(key => localStorage.removeItem(key));
  accounts = accounts.map(account => ({
    ...account,
    streak: 0,
    best: 0,
    xp: 0,
    level: 0,
    coins: 0,
    xpBoost: 0,
    coinBoost: 0,
    cooldownLevel: 0,
    luckLevel: 0,
    recoveryLevel: 0,
    shopOwned: false
  }));
  currentEmail = '';
  state.streak = 0;
  state.best = 0;
  state.xp = 0;
  state.level = 0;
  state.coins = 0;
  state.combo = 0;
  state.dailyCoins = 0;
  state.successfulMoves = 0;
  state.contributions = 0;
  state.xpBoost = 0;
  state.coinBoost = 0;
  state.cooldownLevel = 0;
  state.luckLevel = 0;
  state.recoveryLevel = 0;
  state.shopOwned = false;
  loginStreak = 0;
  Object.keys(unlockedAchievements).forEach(key => delete unlockedAchievements[key]);
  Object.keys(claimedQuests).forEach(key => delete claimedQuests[key]);
  localStorage.setItem(accountKey, JSON.stringify(accounts));
  localStorage.setItem(sessionKey, '');
  localStorage.setItem(upgradeKey, JSON.stringify({ xpBoost: 0, coinBoost: 0, cooldownLevel: 0, luckLevel: 0, recoveryLevel: 0, shopOwned: false }));
  localStorage.setItem(dailyKey, JSON.stringify({ date: today, dailyCoins: 0, successfulMoves: 0, contributions: 0, claimedQuests: {} }));
  localStorage.setItem(achievementKey, JSON.stringify({ unlocked: {} }));
  localStorage.setItem(loginKey, JSON.stringify({}));
  showToast('BOARD RESET · ALL PLAYERS TO ZERO');
  render();
  renderLeaderboard();
}
function play(choiceName) {
  if (Date.now() < cooldownUntil) return;
  const choice = choices[choiceName];
  const success = Math.random() <= getChoiceChance(choiceName);
  if (!success) { const xpLoss = Math.round(12 * (1 - state.recoveryLevel * .25)); playSound('fail'); showToast('STREAK LOST. THAT WAS BRAVE.', false); state.streak = 0; state.combo = 0; state.xp = Math.max(0, state.xp - xpLoss); $('risk-label').textContent = 'The run resets. Start another one.'; $('run-message').textContent = 'TOUCH GRASS.'; render(true); startCooldown(getCooldownSeconds()); return; }
  state.streak += 1; state.combo += 1; state.successfulMoves += 1; state.xp += Math.round(choice.xp * (1 + state.xpBoost * .1 + (state.shopOwned ? .25 : 0))); if (state.streak > state.best) state.best = state.streak;
  playSound('success'); if (state.xp >= getLevelTarget()) { state.xp -= getLevelTarget(); state.level += 1; playSound('reward'); showToast(`LEVEL ${state.level} UNLOCKED`); } else { showToast(choice.label); }
  $('run-message').textContent = messages[Math.floor(Math.random() * messages.length)]; $('risk-label').textContent = state.streak > 10 ? 'You are officially making questionable choices.' : 'The higher you go, the harder you fall.'; checkDailyQuests(); checkAchievements(); render(true);
}
function cashOut() { if (!state.streak) { showToast('BUILD A STREAK FIRST.', false); return; } const reward = Math.round(Math.max(8, state.streak * 16) * (1 + state.coinBoost * .1 + (state.shopOwned ? .25 : 0))); state.coins += reward; state.dailyCoins += reward; playSound('reward'); showToast(`BANKED +${reward} COINS`); state.streak = 0; state.combo = 0; state.xp = Math.min(getLevelTarget(), state.xp + 6); $('run-message').textContent = 'NICE EXIT. AGAIN?'; $('risk-label').textContent = 'Coins secured. The loop continues.'; checkDailyQuests(); checkAchievements(); render(true); }
document.querySelectorAll('.choice').forEach(button => button.addEventListener('click', () => play(button.dataset.choice)));
$('cash-out').addEventListener('click', cashOut);
$('login-claim-button').addEventListener('click', claimDailyLogin);
$('sound-toggle').addEventListener('click', () => { soundEnabled = !soundEnabled; localStorage.setItem(soundKey, soundEnabled); updateSoundButton(); if (soundEnabled) playSound('success'); });
$('signin-form').addEventListener('submit', signIn); $('signup-form').addEventListener('submit', signUp); $('sign-out').addEventListener('click', signOut); $('reset-save').addEventListener('click', resetProgressData); $('reset-account').addEventListener('click', resetCurrentAccount); $('delete-account').addEventListener('click', deleteCurrentAccount); $('delete-account-bottom').addEventListener('click', deleteCurrentAccount);
document.querySelectorAll('[data-auth-mode]').forEach(button => button.addEventListener('click', () => { const signup = button.dataset.authMode === 'signup'; document.querySelectorAll('[data-auth-mode]').forEach(item => item.classList.toggle('active', item === button)); $('signin-form').classList.toggle('hidden', signup); $('signup-form').classList.toggle('hidden', !signup); setAuthError(''); }));
document.querySelectorAll('[data-board-mode]').forEach(button => button.addEventListener('click', () => { boardMode = button.dataset.boardMode; document.querySelectorAll('[data-board-mode]').forEach(item => item.classList.toggle('active', item === button)); renderLeaderboard(); }));
 $('event-button').addEventListener('click', () => { state.eventPoints += 25; state.contributions += 1; if (state.eventPoints >= eventTarget) { state.eventPoints -= eventTarget; state.coins += 2500; showToast('GLOBAL EVENT COMPLETE +2500'); } else { showToast('CONTRIBUTION LOGGED'); } checkDailyQuests(); checkAchievements(); render(true); });
 $('shop-button').addEventListener('click', () => { if (state.coins < 30000) { showToast('NOT ENOUGH COINS.', false); return; } state.coins -= 30000; state.shopOwned = true; localStorage.setItem(upgradeKey, JSON.stringify({ xpBoost: state.xpBoost, coinBoost: state.coinBoost, cooldownLevel: state.cooldownLevel, luckLevel: state.luckLevel, recoveryLevel: state.recoveryLevel, shopOwned: state.shopOwned })); showToast('STATIC BLOOM UNLOCKED · +25% REWARDS'); render(true); });
 $('xp-upgrade-button').addEventListener('click', () => buyUpgrade('xpBoost', 1200, 'XP BOOST')); $('coin-upgrade-button').addEventListener('click', () => buyUpgrade('coinBoost', 1500, 'COIN BOOST')); $('cooldown-upgrade-button').addEventListener('click', () => buyUpgrade('cooldownLevel', 0, 'COOLDOWN', [20000, 50000, 100000])); $('luck-upgrade-button').addEventListener('click', () => buyUpgrade('luckLevel', 2500, 'LUCK BOOST', null, 20)); $('recovery-upgrade-button').addEventListener('click', () => buyUpgrade('recoveryLevel', 30000, 'RECOVERY CORE'));
function buyUpgrade(type, baseCost, label, priceList = null, maxLevel = 3, priceStep = baseCost) {
  const level = state[type];
  if (type === 'luckLevel') {
    const luckCosts = [20000, 50000, 100000, 200000, 400000, 800000, 1600000, 3200000, 6400000, 12800000, 25600000, 51200000, 102400000, 204800000, 409600000, 819200000, 1638400000, 3276800000, 6553600000, 13107200000];
    if (level >= luckCosts.length) return;
    const cost = luckCosts[level];
    if (state.coins < cost) { showToast('NOT ENOUGH COINS.', false); return; }
    state.coins -= cost;
    state[type] += 1;
    localStorage.setItem(upgradeKey, JSON.stringify({ xpBoost: state.xpBoost, coinBoost: state.coinBoost, cooldownLevel: state.cooldownLevel, luckLevel: state.luckLevel, recoveryLevel: state.recoveryLevel, shopOwned: state.shopOwned }));
    playSound('reward');
    showToast(`${label} LEVEL ${state[type]} UNLOCKED`);
    checkAchievements();
    render(true);
    return;
  }
  const cost = priceList ? priceList[level] : baseCost + level * priceStep;
  if (level >= maxLevel) return;
  if (state.coins < cost) { showToast('NOT ENOUGH COINS.', false); return; }
  state.coins -= cost; state[type] += 1; localStorage.setItem(upgradeKey, JSON.stringify({ xpBoost: state.xpBoost, coinBoost: state.coinBoost, cooldownLevel: state.cooldownLevel, luckLevel: state.luckLevel, recoveryLevel: state.recoveryLevel, shopOwned: state.shopOwned })); playSound('reward'); showToast(`${label} LEVEL ${state[type]} UNLOCKED`); checkAchievements(); render(true);
}
$('rebirth-button').addEventListener('click', () => { if (state.level < 50) return; state.level = 1; state.xp = 0; state.streak = 0; state.combo = 0; state.multiplier += .25; showToast(`REBIRTH COMPLETE · x${state.multiplier.toFixed(2)}`); render(true); });
document.addEventListener('keydown', event => { if (event.key === '1') play('safe'); if (event.key === '2') play('risky'); if (event.key === '3') play('insane'); if (event.key.toLowerCase() === 'c') cashOut(); });
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);
updateSoundButton();
checkAchievements();
render();
