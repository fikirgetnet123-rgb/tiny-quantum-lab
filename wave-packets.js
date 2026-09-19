const canvas = document.querySelector('#packetSimulator');
const ctx = canvas.getContext('2d');
const controls = {
  mode: document.querySelector('#spaceMode'), width: document.querySelector('#width'), mass: document.querySelector('#mass'),
  momentum: document.querySelector('#momentum'), toggle: document.querySelector('#toggle'), reset: document.querySelector('#reset')
};
const labels = { width: document.querySelector('#widthValue'), mass: document.querySelector('#massValue'), momentum: document.querySelector('#momentumValue') };
const timeReadout = document.querySelector('#timeReadout');
const insight = document.querySelector('#packetInsight');
let running = false, time = 0, lastTime = 0;
const left = 35, right = 724, probabilityBase = 202, waveBase = 383, wallX = 665;

function parameters() { return { mode: controls.mode.value, width: +controls.width.value, mass: +controls.mass.value, momentum: +controls.momentum.value }; }
function packetState() {
  const p = parameters();
  const speed = .72 + p.momentum / 90;
  const spreadTime = (p.mass / 40) * Math.pow(p.width / 27, 2) * 3.6;
  const sigma = p.width * Math.sqrt(1 + Math.pow(time / spreadTime, 2));
  let center = 120 + speed * time * 58;
  let direction = 1;
  if (p.mode === 'wall') {
    const distance = wallX - 120;
    const cycle = distance * 2;
    const travel = (speed * time * 58) % cycle;
    if (travel > distance) { center = wallX - (travel - distance); direction = -1; } else center = 120 + travel;
  } else if (center > right + 100) center = 40 + ((center - 40) % (right - 40));
  return { p, center, sigma, direction, speed, spreadTime };
}
function updateLabels() {
  const p = parameters();
  labels.width.textContent = p.width < 36 ? 'narrow' : p.width > 58 ? 'wide' : 'medium';
  labels.mass.textContent = p.mass < 46 ? 'light' : p.mass > 74 ? 'heavy' : 'medium';
  labels.momentum.textContent = p.momentum < 45 ? 'low' : p.momentum > 75 ? 'high' : 'medium';
  if (p.mode === 'wall') insight.innerHTML = '<strong>A wall is on.</strong> Watch the center of the blue probability packet move right, then return left after reaching the wall.';
  else if (p.width < 36) insight.innerHTML = '<strong>Narrow packet selected.</strong> Its location starts more certain, but its wider momentum mix makes the packet spread faster.';
  else if (p.mass > 74) insight.innerHTML = '<strong>Heavy particle selected.</strong> Heavier particles resist spreading, so the blue probability packet stays focused longer.';
  else if (p.momentum > 75) insight.innerHTML = '<strong>High momentum selected.</strong> The center of the packet travels faster. Notice that motion and spreading are different effects.';
  else insight.innerHTML = '<strong>Watch both curves.</strong> The purple wiggles are ψ; the smooth blue hump is |ψ|², which maps where a measurement is likely to find the particle.';
}
function drawGrid() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height); grad.addColorStop(0, '#edf4ff'); grad.addColorStop(1, '#dceafa'); ctx.fillStyle = grad; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = 'rgba(22,42,70,.13)'; ctx.lineWidth = 1; ctx.setLineDash([4, 6]);
  for (let x = 60; x < right; x += 80) { ctx.beginPath(); ctx.moveTo(x, 42); ctx.lineTo(x, 440); ctx.stroke(); }
  ctx.setLineDash([]); ctx.strokeStyle = '#61728d';
  [probabilityBase, waveBase].forEach(y => { ctx.beginPath(); ctx.moveTo(left, y); ctx.lineTo(right, y); ctx.stroke(); });
  ctx.font = '700 13px system-ui'; ctx.fillStyle = '#405675'; ctx.fillText('probability  |ψ|²', 37, 35); ctx.fillText('wavefunction  ψ', 37, 262); ctx.fillText('position →', 650, 455);
  if (parameters().mode === 'wall') { ctx.fillStyle = '#162a46'; ctx.fillRect(wallX, 45, 10, 388); ctx.fillStyle = '#405675'; ctx.fillText('wall', wallX - 7, 35); }
}
function drawPacket() {
  const state = packetState(), { center, sigma, p, direction } = state;
  // |psi|² is the smooth probability hill.
  ctx.beginPath(); ctx.moveTo(left, probabilityBase);
  for (let x = left; x <= right; x += 2) { const z = (x - center) / sigma; const probability = Math.exp(-z * z / 2); ctx.lineTo(x, probabilityBase - probability * 122); }
  ctx.lineTo(right, probabilityBase); ctx.closePath(); ctx.fillStyle = 'rgba(35,102,204,.24)'; ctx.fill();
  ctx.beginPath();
  for (let x = left; x <= right; x += 2) { const z = (x - center) / sigma; const probability = Math.exp(-z * z / 2); const y = probabilityBase - probability * 122; if (x === left) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
  ctx.strokeStyle = '#2366cc'; ctx.lineWidth = 2.4; ctx.stroke();
  // One real-valued slice of psi, drawn below the probability map.
  const waveLength = 18 + (100 - p.momentum) / 10;
  ctx.beginPath();
  for (let x = left; x <= right; x += 2) { const z = (x - center) / sigma; const envelope = Math.exp(-z * z / 2); const y = waveBase - 72 * envelope * Math.cos((x - center) / waveLength * Math.PI * 2 * direction - time * 7); if (x === left) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
  ctx.strokeStyle = '#7b4fc7'; ctx.lineWidth = 2.2; ctx.stroke();
  ctx.fillStyle = '#ef7d2d'; ctx.beginPath(); ctx.arc(center, probabilityBase - 126, 3.8, 0, Math.PI * 2); ctx.fill();
}
function draw() { drawGrid(); drawPacket(); }
function frame(now) {
  const dt = Math.min((now - lastTime) / 1000 || 0, .05); lastTime = now;
  if (running) time += dt;
  timeReadout.textContent = time.toFixed(1); draw(); requestAnimationFrame(frame);
}
controls.toggle.addEventListener('click', () => { running = !running; controls.toggle.textContent = running ? 'pause' : 'play'; });
controls.reset.addEventListener('click', () => { time = 0; running = false; controls.toggle.textContent = 'play'; });
[controls.mode, controls.width, controls.mass, controls.momentum].forEach(input => input.addEventListener('input', updateLabels));
updateLabels(); requestAnimationFrame(frame);
