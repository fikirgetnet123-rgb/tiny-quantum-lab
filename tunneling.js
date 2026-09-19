const canvas = document.querySelector('#tunnelSimulator');
const ctx = canvas.getContext('2d');
const controls = {
  thickness: document.querySelector('#thickness'), height: document.querySelector('#height'), energy: document.querySelector('#energy'),
  launch: document.querySelector('#launch'), reset: document.querySelector('#reset')
};
const labels = { thickness: document.querySelector('#thicknessValue'), height: document.querySelector('#heightValue'), energy: document.querySelector('#energyValue') };
const attemptsLabel = document.querySelector('#attemptCount');
const transmittedLabel = document.querySelector('#transmittedCount');
const insight = document.querySelector('#tunnelInsight');
const barrierX = 342, baseline = 350;
let packets = [], attempts = 0, transmitted = 0, detections = [], lastTime = 0;

function parameters() { return { thickness: +controls.thickness.value, height: +controls.height.value, energy: +controls.energy.value }; }
function transmissionChance() {
  const p = parameters();
  const mismatch = Math.max(3, p.height - p.energy + 25);
  return Math.min(.85, Math.exp(-(p.thickness / 70) * Math.sqrt(mismatch / 35)));
}
function updateLabels() {
  const p = parameters(), chance = transmissionChance();
  labels.thickness.textContent = p.thickness < 55 ? 'thin' : p.thickness > 110 ? 'thick' : 'medium';
  labels.height.textContent = p.height < 72 ? 'low' : p.height > 116 ? 'high' : 'medium';
  labels.energy.textContent = p.energy < 45 ? 'low' : p.energy > 75 ? 'high' : 'medium';
  const percent = Math.round(chance * 100);
  if (p.thickness < 55) insight.innerHTML = `<strong>Thin barrier selected: about ${percent}% may tunnel in this model.</strong> Psi has only a short distance to fade before it reaches the far side.`;
  else if (p.height > 116) insight.innerHTML = `<strong>Tall barrier selected: about ${percent}% may tunnel in this model.</strong> The wavefunction fades very quickly in a tall barrier.`;
  else if (p.energy > 75) insight.innerHTML = `<strong>High particle energy selected: about ${percent}% may tunnel in this model.</strong> The barrier is less difficult compared with the particle’s energy.`;
  else insight.innerHTML = `<strong>Current setup: about ${percent}% may tunnel in this model.</strong> Run several packets—the fraction that get through will vary, but it should trend toward this chance.`;
}
function drawPacket(center, amplitude, phase, color) {
  ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = 2.3;
  for (let x = center - 80; x <= center + 80; x += 2) {
    const local = x - center, envelope = Math.exp(-(local * local) / 1050);
    const y = baseline - amplitude * envelope * Math.cos(local / 9 - phase);
    if (x === center - 80) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
}
function drawBase() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const bg = ctx.createLinearGradient(0, 0, canvas.width, canvas.height); bg.addColorStop(0, '#edf4ff'); bg.addColorStop(1, '#dceafa'); ctx.fillStyle = bg; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const p = parameters(), barrierTop = baseline - p.height * 1.25;
  ctx.strokeStyle = 'rgba(22,42,70,.16)'; ctx.lineWidth = 1; ctx.setLineDash([4, 6]);
  for (let y = 75; y < baseline; y += 55) { ctx.beginPath(); ctx.moveTo(28, y); ctx.lineTo(730, y); ctx.stroke(); }
  ctx.setLineDash([]);
  // Potential-energy barrier: the raised blue outline is the “wall.”
  ctx.strokeStyle = '#162a46'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(35, baseline); ctx.lineTo(barrierX, baseline); ctx.lineTo(barrierX, barrierTop); ctx.lineTo(barrierX + p.thickness, barrierTop); ctx.lineTo(barrierX + p.thickness, baseline); ctx.lineTo(725, baseline); ctx.stroke();
  ctx.fillStyle = 'rgba(35,102,204,.12)'; ctx.fillRect(barrierX, barrierTop, p.thickness, baseline - barrierTop);
  ctx.font = '700 13px system-ui'; ctx.fillStyle = '#405675'; ctx.fillText('incoming wave packet', 48, 55); ctx.fillText('barrier', barrierX - 2, barrierTop - 12); ctx.fillText('detector', 650, 55);
  ctx.fillStyle = '#2366cc'; ctx.fillRect(700, 80, 3, baseline - 40);
  ctx.font = '12px system-ui'; ctx.fillText('particle energy', 37, baseline + 25); ctx.fillText('position →', 645, baseline + 25);
}
function draw(now) {
  drawBase();
  const chance = transmissionChance();
  for (const packet of packets) {
    const phase = now / 100;
    if (packet.t < .56) {
      drawPacket(72 + (barrierX - 95) * (packet.t / .56), 48, phase, '#7b4fc7');
    } else {
      const after = (packet.t - .56) / .72;
      drawPacket(barrierX - 6 - after * 285, 48 * Math.sqrt(1 - chance), phase, '#7b4fc7');
      drawPacket(barrierX + parameters().thickness + 8 + after * 305, 48 * Math.sqrt(chance), phase, '#7b4fc7');
      // A faded line in the barrier hints that the wavefunction decays rather than cutting off.
      ctx.strokeStyle = 'rgba(123,79,199,.45)'; ctx.lineWidth = 2; ctx.beginPath();
      for (let x = barrierX; x < barrierX + parameters().thickness; x += 2) { const fade = Math.exp(-(x - barrierX) / Math.max(12, parameters().thickness * .45)); const y = baseline - 44 * fade * Math.cos((x - barrierX) / 8 - phase); if (x === barrierX) ctx.moveTo(x, y); else ctx.lineTo(x, y); } ctx.stroke();
    }
  }
  for (const dot of detections) { ctx.fillStyle = '#ef7d2d'; ctx.beginPath(); ctx.arc(701, dot.y, 3.5, 0, Math.PI * 2); ctx.fill(); }
}
function launch() {
  attempts++;
  packets.push({ t: 0, tunneled: Math.random() < transmissionChance() });
  attemptsLabel.textContent = attempts;
}
function frame(now) {
  const dt = Math.min((now - lastTime) / 1000 || 0, .05); lastTime = now;
  for (const packet of packets) packet.t += dt;
  const finished = packets.filter(packet => packet.t >= 1.28);
  packets = packets.filter(packet => packet.t < 1.28);
  for (const packet of finished) if (packet.tunneled) { transmitted++; detections.push({ y: baseline }); }
  transmittedLabel.textContent = transmitted;
  draw(now); requestAnimationFrame(frame);
}
controls.launch.addEventListener('click', launch);
controls.reset.addEventListener('click', () => { packets = []; attempts = 0; transmitted = 0; detections = []; attemptsLabel.textContent = '0'; transmittedLabel.textContent = '0'; });
[controls.thickness, controls.height, controls.energy].forEach(input => input.addEventListener('input', updateLabels));
updateLabels(); requestAnimationFrame(frame);
