const canvas = document.querySelector('#simulator');
const ctx = canvas.getContext('2d');
const controls = {
  mode: document.querySelector('#slitMode'), separation: document.querySelector('#separation'),
  wavelength: document.querySelector('#wavelength'), rate: document.querySelector('#rate'),
  toggle: document.querySelector('#toggle'), reset: document.querySelector('#reset')
};
const labels = { separation: document.querySelector('#separationValue'), wavelength: document.querySelector('#wavelengthValue'), rate: document.querySelector('#rateValue') };
const countLabel = document.querySelector('#particleCount');
const insight = document.querySelector('#liveInsight');
const source = { x: 72, y: canvas.height / 2 }, barrierX = 310, screenX = 690;
let running = false, count = 0, carry = 0, lastTime = 0;
let hits = [], travellers = [];

function parameters() { return { d: +controls.separation.value, wavelength: +controls.wavelength.value, rate: +controls.rate.value, mode: controls.mode.value }; }
function updateLabels() {
  const p = parameters();
  labels.separation.textContent = p.d < 65 ? 'close' : p.d > 105 ? 'wide' : 'medium';
  labels.wavelength.textContent = p.wavelength;
  labels.rate.textContent = p.rate;
  if (p.mode === 'one') insight.innerHTML = '<strong>You have one slit open.</strong> There is one route for the wavefunction, so there is no second route to interfere with it. Expect one wide cluster of dots.';
  else if (p.wavelength >= 20) insight.innerHTML = '<strong>Long wavelength selected.</strong> The wave peaks stay matched over a larger distance, so the bright bands should be farther apart.';
  else if (p.d >= 105) insight.innerHTML = '<strong>Wide slit separation selected.</strong> The two paths differ more quickly across the detector, so the bright bands should be closer together.';
  else insight.innerHTML = '<strong>Two routes are open.</strong> Watch for alternating crowded and quiet zones on the screen. They are the visible result of interference.';
}
function probability(y) {
  const { d, wavelength, mode } = parameters();
  const relative = (y - canvas.height / 2) / 150;
  const envelope = Math.exp(-relative * relative * 2.3);
  if (mode === 'one') return envelope;
  const phase = Math.PI * d * relative / wavelength;
  return (0.04 + .96 * Math.cos(phase) ** 2) * envelope;
}
function sampleHit() {
  for (let i = 0; i < 1000; i++) {
    const y = 38 + Math.random() * (canvas.height - 76);
    if (Math.random() < probability(y)) return y;
  }
  return canvas.height / 2;
}
function slits() {
  const { d, mode } = parameters(), center = canvas.height / 2;
  return mode === 'one' ? [center] : [center - d / 2, center + d / 2];
}
function launch() {
  const y = sampleHit(), openSlits = slits();
  const slitY = openSlits[Math.floor(Math.random() * openSlits.length)];
  travellers.push({ y, slitY, t: 0, speed: .42 + Math.random() * .12 });
}
function drawWave(cx, cy, radius, maxRadius, alpha) {
  if (radius > maxRadius) return;
  ctx.strokeStyle = `rgba(35,102,204,${alpha * (1 - radius / maxRadius)})`;
  ctx.lineWidth = 1.3; ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.stroke();
}
function drawBase() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
  grad.addColorStop(0, '#edf4ff'); grad.addColorStop(1, '#dceafa'); ctx.fillStyle = grad; ctx.fillRect(0, 0, canvas.width, canvas.height);
  // Gentle guide lines make the detector pattern easier to compare.
  ctx.strokeStyle = 'rgba(22,42,70,.08)'; ctx.lineWidth = 1;
  for (let y = 70; y < canvas.height - 40; y += 50) { ctx.beginPath(); ctx.moveTo(15, y); ctx.lineTo(canvas.width - 16, y); ctx.stroke(); }
  ctx.fillStyle = '#2366cc'; ctx.beginPath(); ctx.arc(source.x, source.y, 8, 0, Math.PI * 2); ctx.fill();
  const center = canvas.height / 2, openSlits = slits(), slitSize = 26;
  ctx.fillStyle = '#162a46'; let start = 30;
  for (const slitY of openSlits) { ctx.fillRect(barrierX, start, 12, slitY - slitSize / 2 - start); start = slitY + slitSize / 2; }
  ctx.fillRect(barrierX, start, 12, canvas.height - 30 - start);
  ctx.fillStyle = '#2366cc'; ctx.fillRect(screenX, 30, 3, canvas.height - 60);
  ctx.font = '700 13px system-ui'; ctx.fillStyle = '#405675';
  ctx.fillText('source', 38, 45); ctx.fillText(openSlits.length === 1 ? 'one slit' : 'two slits', 255, 45); ctx.fillText('screen', 655, 45);
}
function drawTraveller(particle) {
  const p = particle.t, toBarrier = .36;
  let x, y;
  if (p < toBarrier) {
    const t = p / toBarrier; x = source.x + (barrierX - source.x) * t; y = source.y + (particle.slitY - source.y) * t;
  } else {
    const t = (p - toBarrier) / (1 - toBarrier); x = barrierX + (screenX - barrierX) * t; y = particle.slitY + (particle.y - particle.slitY) * t;
  }
  ctx.fillStyle = '#ef7d2d'; ctx.beginPath(); ctx.arc(x, y, 3.2, 0, Math.PI * 2); ctx.fill();
}
function drawWaves(now) {
  const pulse = (now / 1000) * 60;
  // Wavefronts travel from the source, then new wavefronts spread from each open slit.
  for (let offset = 0; offset < 420; offset += 48) drawWave(source.x, source.y, (pulse + offset) % 420, 245, .23);
  for (const slitY of slits()) for (let offset = 0; offset < 390; offset += 42) drawWave(barrierX + 8, slitY, (pulse + offset) % 390, 390, .18);
}
function draw(now) {
  drawBase(); drawWaves(now);
  for (const particle of travellers) drawTraveller(particle);
  for (const y of hits) { ctx.fillStyle = 'rgba(239,125,45,.72)'; ctx.beginPath(); ctx.arc(screenX, y, 1.8, 0, Math.PI * 2); ctx.fill(); }
}
function frame(now) {
  const dt = Math.min((now - lastTime) / 1000 || 0, .05); lastTime = now;
  if (running) {
    carry += parameters().rate * dt;
    while (carry >= 1) { launch(); carry--; }
  }
  for (const particle of travellers) particle.t += particle.speed * dt;
  const arrived = travellers.filter(particle => particle.t >= 1);
  travellers = travellers.filter(particle => particle.t < 1);
  for (const particle of arrived) { hits.push(particle.y); count++; }
  countLabel.textContent = count.toLocaleString(); draw(now); requestAnimationFrame(frame);
}
controls.toggle.addEventListener('click', () => { running = !running; controls.toggle.textContent = running ? 'pause' : 'send particles'; });
controls.reset.addEventListener('click', () => { hits = []; travellers = []; count = 0; carry = 0; countLabel.textContent = '0'; });
[controls.mode, controls.separation, controls.wavelength, controls.rate].forEach(input => input.addEventListener('input', updateLabels));
updateLabels(); requestAnimationFrame(frame);
