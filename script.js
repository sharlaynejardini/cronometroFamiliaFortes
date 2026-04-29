const steps = [
  { title: "1a Parte - Vamos nos conhecer", minutes: 8 },
  { title: "Sintese do programa", minutes: 2 },
  { title: "Elogios, regras e consequencias do grupo", minutes: 8 },
  { title: "Metas e como alcanca-las", minutes: 10 },
  { title: "Fazendo o Mapa dos sonhos", minutes: 30 },
  { title: "Preparacao para o encontro das familias", minutes: 1 },
  { title: "Lema dos Jovens", minutes: 1 }
];

const stepTitle = document.getElementById("step-title");
const stepDuration = document.getElementById("step-duration");
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

function formatNumber(value) {
  return String(value).padStart(2, "0");
}

function durationLabel(minutes) {
  return `${minutes} minuto${minutes === 1 ? "" : "s"}`;
}

function updateClock() {
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  minutesEl.textContent = formatNumber(mins);
  secondsEl.textContent = formatNumber(secs);
}

function updateProgress() {
  const totalStepSeconds = steps[currentIndex].minutes * 60;
  const elapsed = totalStepSeconds - timeLeft;
  const progress = totalStepSeconds === 0 ? 0 : (elapsed / totalStepSeconds) * 100;
  progressBar.style.width = `${Math.max(0, Math.min(100, progress))}%`;
}

function renderAgenda() {
  agendaList.innerHTML = "";

  steps.forEach((step, index) => {
    const item = document.createElement("li");
    item.className = "agenda-item";

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

    agendaList.appendChild(item);
  });
}

function renderStep() {
  const currentStep = steps[currentIndex];

  stepTitle.textContent = currentStep.title;
  stepDuration.textContent = durationLabel(currentStep.minutes);
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
  statusMessage.textContent = "Programa concluido. Parabens pelo encontro!";
  startPauseBtn.textContent = "Recomecar";
}

function moveToNextStep(autoAdvance = false) {
  if (currentIndex === steps.length - 1) {
    finishProgram();
    return;
  }

  currentIndex += 1;
  timeLeft = steps[currentIndex].minutes * 60;
  renderStep();

  statusMessage.textContent = autoAdvance
    ? `Etapa concluida. Iniciando: ${steps[currentIndex].title}.`
    : `Avancou para: ${steps[currentIndex].title}.`;
  statusMessage.classList.remove("warning");
}

function tick() {
  if (timeLeft > 0) {
    timeLeft -= 1;
    updateClock();
    updateProgress();
    return;
  }

  stopTimer();
  statusMessage.textContent = "Tempo encerrado. Clique em Avancar etapa para seguir.";
  statusMessage.classList.add("warning");
}

function startTimer() {
  if (currentIndex === steps.length - 1 && timeLeft === 0) {
    currentIndex = 0;
    timeLeft = steps[0].minutes * 60;
    renderStep();
  }

  if (intervalId) {
    return;
  }

  isRunning = true;
  startPauseBtn.textContent = "Pausar";
  statusMessage.textContent = `Cronometro em andamento: ${steps[currentIndex].title}.`;
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
  statusMessage.textContent = "Cronometro reiniciado.";
  statusMessage.classList.remove("warning");
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
    statusMessage.textContent = "Cronometro pausado.";
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

renderStep();
