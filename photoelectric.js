const canvas = document.querySelector('#photoSimulator');
const ctx = canvas.getContext('2d');
const color = document.querySelector('#color');
const brightness = document.querySelector('#brightness');
const metal = document.querySelector('#metal');
const toggle = document.querySelector('#toggle');
const reset = document.querySelector('#reset');
const photonCount = document.querySelector('#photonCount');
const electronCount = document.querySelector('#electronCount');
const insight = document.querySelector('#photoInsight');
let shining = false, carry = 0, photons = [], electrons = [], sent = 0, released = 0, last = 0;

function settings() { return { frequency: +color.value, brightness: +brightness.value, threshold: +metal.value }; }
function photonEnergy() { return 1.45 + settings().frequency * .027; }
function colorName() { const f = settings().frequency; return f < 33 ? 'red' : f < 66 ? 'green' : 'blue'; }
function canEject() { return photonEnergy() >= settings().threshold; }
function update() {
  const s = settings(), name = colorName(), enough = canEject();
  document.querySelector('#colorValue').textContent = name;
  document.querySelector('#brightnessValue').textContent = `${s.brightness}%`;
  insight.innerHTML = enough
    ? `<strong>Above the threshold.</strong> Each ${name} photon has ${photonEnergy().toFixed(1)} eV, which is enough to pay this metal’s ${s.threshold.toFixed(1)} eV entry fee. Brightness will now increase the number of released electrons.`
    : `<strong>Below the threshold: zero new electrons can be released.</strong> Each ${name} photon has only ${photonEnergy().toFixed(1)} eV, below the metal’s ${s.threshold.toFixed(1)} eV entry fee. Raising brightness sends more weak photons, not stronger photons.`;
}
function drawEnergyMeter() {
  const energy = photonEnergy(), threshold = settings().threshold, enough = canEject();
  const meterX = 35, meterY = 412, meterW = 405, max = 4.3;
  ctx.fillStyle = '#fffdf5'; ctx.fillRect(meterX - 8, meterY - 24, meterW + 16, 53);
  ctx.strokeStyle = '#8ea0b9'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(meterX, meterY); ctx.lineTo(meterX + meterW, meterY); ctx.stroke();
  const tX = meterX + meterW * threshold / max, eX = meterX + meterW * energy / max;
  ctx.strokeStyle = '#162a46'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(tX, meterY - 16); ctx.lineTo(tX, meterY + 16); ctx.stroke();
  ctx.fillStyle = enough ? '#2366cc' : '#d95845'; ctx.beginPath(); ctx.arc(eX, meterY, 7, 0, Math.PI * 2); ctx.fill();
  ctx.font = '700 12px system-ui'; ctx.fillStyle = '#405675';
  ctx.fillText('photon energy', meterX, meterY - 28); ctx.fillText('threshold', tX - 22, meterY + 31);
  ctx.fillStyle = enough ? '#2366cc' : '#b43c32';
  ctx.fillText(enough ? 'ABOVE THRESHOLD → ELECTRONS CAN ESCAPE' : 'BELOW THRESHOLD → NO ELECTRONS, EVEN AT 100% BRIGHTNESS', 455, 430);
}
function draw() {
  ctx.fillStyle = '#edf4ff'; ctx.fillRect(0, 0, 760, 480);
  ctx.fillStyle = '#162a46'; ctx.fillRect(440, 55, 36, 330);
  ctx.fillStyle = '#405675'; ctx.font = '700 13px system-ui';
  ctx.fillText('light source', 35, 48); ctx.fillText('metal surface', 415, 48); ctx.fillText('released electrons', 535, 48);
  ctx.fillStyle = '#ffd85c'; ctx.fillRect(26, 170, 14, 135);
  for (const photon of photons) { ctx.fillStyle = `hsl(${20 + settings().frequency * 2.2} 85% 55%)`; ctx.beginPath(); ctx.arc(photon.x, photon.y, 4, 0, 7); ctx.fill(); }
  for (const electron of electrons) { ctx.fillStyle = '#2366cc'; ctx.beginPath(); ctx.arc(electron.x, electron.y, 5, 0, 7); ctx.fill(); }
  drawEnergyMeter();
}
function frame(now) {
  const dt = Math.min((now - last) / 1000 || 0, .05); last = now;
  if (shining) { carry += settings().brightness * dt * .8; while (carry >= 1) { photons.push({ x: 48, y: 185 + Math.random() * 105 }); sent++; carry--; } }
  for (const photon of photons) photon.x += 240 * dt;
  for (const photon of photons.filter(photon => photon.x >= 440 && !photon.hit)) {
    photon.hit = true;
    if (canEject()) { released++; electrons.push({ x: 470, y: photon.y, vy: (Math.random() - .5) * 45 }); }
  }
  for (const electron of electrons) { electron.x += 150 * dt; electron.y += electron.vy * dt; }
  photons = photons.filter(photon => photon.x < 470); electrons = electrons.filter(electron => electron.x < 745);
  photonCount.textContent = sent; electronCount.textContent = released; draw(); requestAnimationFrame(frame);
}
toggle.onclick = () => { shining = !shining; toggle.textContent = shining ? 'pause' : 'shine light'; };
reset.onclick = () => { shining = false; toggle.textContent = 'shine light'; photons = []; electrons = []; sent = released = carry = 0; };
[color, brightness, metal].forEach(control => control.oninput = update);
update(); requestAnimationFrame(frame);
