const steps = [
  { title: "1ª Parte - Vamos nos conhecer", minutes: 8 },
  { title: "Síntese do programa", minutes: 2 },
  { title: "Elogios, regras e consequências do grupo", minutes: 8 },
  { title: "Metas e como alcançá-las", minutes: 10 },
  { title: "Fazendo o Mapa dos sonhos", minutes: 30 },
  { title: "Preparação para o encontro das famílias", minutes: 1 },
  {
    title: "Lema dos Jovens",
    minutes: 1,
    note: "Somos jovens <strong>FORTES</strong> com um <strong>GRANDE</strong> futuro. Estamos tomando boas decisões para alcançarmos nossas metas.",
    variant: "quote"
  }
];

const activityPanel = document.querySelector(".activity-panel");
const stepTitle = document.getElementById("step-title");
const stepDuration = document.getElementById("step-duration");
const stepNote = document.getElementById("step-note");
const minutesEl = document.getElementById("minutes");
const secondsEl = document.getElementById("seconds");
const progressBar = document.getElementById("progress-bar");
const currentStepCount = document.getElementById("current-step-count");
const totalTime = document.getElementById("total-time");
const statusMessage = document.getElementById("status-message");
const agendaList = document.getElementById("agenda-list");
const startPauseBtn = document.getElementById("start-pause-btn");
const nextBtn = document.getElementById("next-btn");
const resetBtn = document.getElementById("reset-btn");

const totalMinutes = steps.reduce((sum, step) => sum + step.minutes, 0);

let currentIndex = 0;
let timeLeft = steps[0].minutes * 60;
let isRunning = false;
let intervalId = null;
let audioContext = null;
let announcedMilestones = new Set();

function getStepTotalSeconds() {
  return steps[currentIndex].minutes * 60;
}

function formatNumber(value) {
  return String(value).padStart(2, "0");
}

function durationLabel(minutes) {
  return `${minutes} minuto${minutes === 1 ? "" : "s"}`;
}

function ensureAudioContext() {
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      return null;
    }

    audioContext = new AudioContextClass();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume();
  }

  return audioContext;
}

function playTone(frequency, duration, type = "sine", volume = 0.06) {
  const context = ensureAudioContext();
  if (!context) {
    return;
  }

  const oscillator = context.createOscillator();
  const gainNode = context.createGain();
  const now = context.currentTime;

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, now);

  gainNode.gain.setValueAtTime(0.0001, now);
  gainNode.gain.exponentialRampToValueAtTime(volume, now + 0.02);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  oscillator.connect(gainNode);
  gainNode.connect(context.destination);

  oscillator.start(now);
  oscillator.stop(now + duration + 0.03);
}

function playHalfAlert() {
  playTone(720, 0.22, "sine", 0.08);
}

function playThreeQuarterAlert() {
  playTone(880, 0.18, "triangle", 0.08);
  setTimeout(() => playTone(1040, 0.22, "triangle", 0.07), 120);
}

function playCountdownBeep(secondsRemaining) {
  const urgent = secondsRemaining <= 3;
  playTone(urgent ? 1200 : 980, urgent ? 0.16 : 0.12, "square", urgent ? 0.07 : 0.05);
}

function resetStepAlerts() {
  announcedMilestones = new Set();
}

function handleSoundCues() {
  const totalStepSeconds = getStepTotalSeconds();
  const elapsed = totalStepSeconds - timeLeft;
  const halfway = Math.floor(totalStepSeconds / 2);
  const threeQuarter = Math.floor(totalStepSeconds * 0.75);

  if (halfway > 0 && elapsed >= halfway && !announcedMilestones.has("half")) {
    announcedMilestones.add("half");
    playHalfAlert();
  }

  if (threeQuarter > 0 && elapsed >= threeQuarter && !announcedMilestones.has("threeQuarter")) {
    announcedMilestones.add("threeQuarter");
    playThreeQuarterAlert();
  }

  if (timeLeft <= 10 && timeLeft >= 1) {
    const countdownKey = `countdown-${timeLeft}`;
    if (!announcedMilestones.has(countdownKey)) {
      announcedMilestones.add(countdownKey);
      playCountdownBeep(timeLeft);
    }
  }
}

function updateClock() {
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  minutesEl.textContent = formatNumber(mins);
  secondsEl.textContent = formatNumber(secs);
}

function updateProgress() {
  const totalStepSeconds = getStepTotalSeconds();
  const elapsed = totalStepSeconds - timeLeft;
  const progress = totalStepSeconds === 0 ? 0 : (elapsed / totalStepSeconds) * 100;
  progressBar.style.width = `${Math.max(0, Math.min(100, progress))}%`;
}

function renderAgenda() {
  agendaList.innerHTML = "";

  steps.forEach((step, index) => {
    const item = document.createElement("li");
    item.className = "agenda-item";
    item.tabIndex = 0;
    item.setAttribute("role", "link");

    if (index === currentIndex) {
      item.classList.add("current");
    } else if (index < currentIndex) {
      item.classList.add("done");
    }

    item.innerHTML = `
      <span class="agenda-index">${index + 1}</span>
      <span class="agenda-name">${step.title}</span>
      <span class="agenda-time">${durationLabel(step.minutes)}</span>
    `;

    item.addEventListener("click", () => {
      goToStep(index);
    });

    item.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        goToStep(index);
      }
    });

    agendaList.appendChild(item);
  });
}

function renderStep() {
  const currentStep = steps[currentIndex];

  stepTitle.textContent = currentStep.title;
  stepDuration.textContent = durationLabel(currentStep.minutes);
  activityPanel.classList.toggle("is-quote", currentStep.variant === "quote");

  if (currentStep.note) {
    stepNote.innerHTML = currentStep.note;
    stepNote.hidden = false;
  } else {
    stepNote.innerHTML = "";
    stepNote.hidden = true;
  }

  currentStepCount.textContent = `Etapa ${currentIndex + 1} de ${steps.length}`;
  totalTime.textContent = `Tempo total: ${totalMinutes} minutos`;

  updateClock();
  updateProgress();
  renderAgenda();
}

function stopTimer() {
  clearInterval(intervalId);
  intervalId = null;
  isRunning = false;
  startPauseBtn.textContent = "Continuar";
}

function finishProgram() {
  stopTimer();
  statusMessage.textContent = "Programa concluído. Parabéns pelo encontro!";
  startPauseBtn.textContent = "Recomeçar";
}

function goToStep(index) {
  stopTimer();
  currentIndex = index;
  timeLeft = getStepTotalSeconds();
  startPauseBtn.textContent = "Iniciar";
  statusMessage.textContent = `Etapa selecionada: ${steps[currentIndex].title}.`;
  statusMessage.classList.remove("warning");
  resetStepAlerts();
  renderStep();
}

function moveToNextStep(autoAdvance = false) {
  if (currentIndex === steps.length - 1) {
    finishProgram();
    return;
  }

  currentIndex += 1;
  timeLeft = getStepTotalSeconds();
  resetStepAlerts();
  renderStep();

  statusMessage.textContent = autoAdvance
    ? `Etapa concluída. Iniciando: ${steps[currentIndex].title}.`
    : `Avançou para: ${steps[currentIndex].title}.`;
  statusMessage.classList.remove("warning");
}

function tick() {
  if (timeLeft > 0) {
    timeLeft -= 1;
    updateClock();
    updateProgress();
    handleSoundCues();
    return;
  }

  moveToNextStep(true);
}

function startTimer() {
  if (currentIndex === steps.length - 1 && timeLeft === 0) {
    currentIndex = 0;
    timeLeft = steps[0].minutes * 60;
    resetStepAlerts();
    renderStep();
  }

  if (intervalId) {
    return;
  }

  ensureAudioContext();
  isRunning = true;
  startPauseBtn.textContent = "Pausar";
  statusMessage.textContent = `Cronômetro em andamento: ${steps[currentIndex].title}.`;
  statusMessage.classList.remove("warning");

  intervalId = setInterval(() => {
    if (isRunning) {
      tick();
    }
  }, 1000);
}

function resetTimer() {
  stopTimer();
  currentIndex = 0;
  timeLeft = steps[0].minutes * 60;
  startPauseBtn.textContent = "Iniciar";
  statusMessage.textContent = "Cronômetro reiniciado.";
  statusMessage.classList.remove("warning");
  resetStepAlerts();
  renderStep();
}

startPauseBtn.addEventListener("click", () => {
  if (currentIndex === steps.length - 1 && timeLeft === 0) {
    resetTimer();
    startTimer();
    return;
  }

  if (isRunning) {
    stopTimer();
    statusMessage.textContent = "Cronômetro pausado.";
    statusMessage.classList.remove("warning");
    return;
  }

  startTimer();
});

nextBtn.addEventListener("click", () => {
  if (currentIndex === steps.length - 1) {
    finishProgram();
    return;
  }

  moveToNextStep(false);
});

resetBtn.addEventListener("click", resetTimer);

resetStepAlerts();
renderStep();
