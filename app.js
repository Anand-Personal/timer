const setupPage = document.getElementById("setupPage");
const timerPage = document.getElementById("timerPage");

const examNameInput = document.getElementById("examName");
const hoursInput = document.getElementById("hours");
const minutesInput = document.getElementById("minutes");

const durationPanel = document.getElementById("durationPanel");
const headerClock = document.getElementById("headerClock");
const footerDate = document.getElementById("footerDate");

const displayExamName = document.getElementById("displayExamName");
const timerValue = document.getElementById("timerValue");
const timerStatus = document.getElementById("timerStatus");

const pauseButton = document.getElementById("pauseButton");
const pauseIcon = document.getElementById("pauseIcon");
const pauseText = document.getElementById("pauseText");

let timerInterval = null;
let remainingSeconds = 0;
let paused = false;
let mode = "countdown";

// Browser Screen Wake Lock + Fullscreen support.
let wakeLock = null;
let fullscreenRequested = false;

async function requestWakeLock() {
  if (!("wakeLock" in navigator)) return;

  try {
    wakeLock = await navigator.wakeLock.request("screen");

    wakeLock.addEventListener("release", () => {
      wakeLock = null;
      // Browsers can release the lock when the page becomes hidden.
      // visibilitychange below will request it again when possible.
    });
  } catch (error) {
    console.warn("Screen Wake Lock could not be acquired:", error);
  }
}

async function requestFullscreen() {
  if (document.fullscreenElement || !document.documentElement.requestFullscreen) {
    return;
  }

  try {
    await document.documentElement.requestFullscreen();
    fullscreenRequested = true;
  } catch (error) {
    // Fullscreen can be denied by browser policy/settings.
    console.warn("Fullscreen was not enabled:", error);
  }
}

async function keepScreenAwake() {
  if (document.visibilityState === "visible" && !wakeLock) {
    await requestWakeLock();
  }
}

document.addEventListener("visibilitychange", keepScreenAwake);

function pad(value) {
  return String(value).padStart(2, "0");
}

function updateHeaderClock() {
  const now = new Date();
  headerClock.textContent =
    `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

  footerDate.textContent = now.toLocaleDateString(undefined, {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
}

updateHeaderClock();
setInterval(updateHeaderClock, 1000);

document.querySelectorAll('input[name="timerMode"]').forEach((input) => {
  input.addEventListener("change", () => {
    durationPanel.classList.toggle("is-hidden", input.value !== "countdown");
  });
});

document.getElementById("startButton").addEventListener("click", startTimer);
pauseButton.addEventListener("click", togglePause);
document.getElementById("backButton").addEventListener("click", backToSetup);

examNameInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") startTimer();
});

function startTimer() {
  const name = examNameInput.value.trim();

  if (!name) {
    examNameInput.focus();
    alert("Please enter the examination name.");
    return;
  }

  mode = document.querySelector('input[name="timerMode"]:checked').value;
  displayExamName.textContent = name;

  // Both APIs are requested from the Start button user gesture.
  // Fullscreen keeps the examination display prominent; Wake Lock
  // prevents supported browsers/devices from sleeping while active.
  requestFullscreen();
  requestWakeLock();

  clearInterval(timerInterval);
  paused = false;
  timerStatus.classList.remove("finished");

  setupPage.classList.remove("page--active");
  timerPage.classList.add("page--active");

  if (mode === "current") {
    pauseButton.hidden = true;
    timerStatus.textContent = "IST";
    updateCurrentTime();
    timerInterval = setInterval(updateCurrentTime, 1000);
    return;
  }

  pauseButton.hidden = false;

  let hours = Number(hoursInput.value) || 0;
  let minutes = Number(minutesInput.value) || 0;

  hours = Math.max(0, Math.min(99, Math.floor(hours)));
  minutes = Math.max(0, Math.min(59, Math.floor(minutes)));

  remainingSeconds = hours * 3600 + minutes * 60;

  if (remainingSeconds <= 0) {
    backToSetup();
    alert("Please enter a duration greater than zero.");
    return;
  }

  updateCountdownDisplay();
  updatePauseButton();
  timerStatus.textContent = "TIMER RUNNING..";

  timerInterval = setInterval(countdownTick, 1000);
}

function countdownTick() {
  if (paused) return;

  if (remainingSeconds <= 0) {
    finishTimer();
    return;
  }

  remainingSeconds -= 1;
  updateCountdownDisplay();

  if (remainingSeconds === 0) {
    finishTimer();
  }
}

function finishTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  remainingSeconds = 0;
  updateCountdownDisplay();

  timerStatus.textContent = "TIME COMPLETED";
  timerStatus.classList.add("finished");
  pauseButton.hidden = true;

  // Optional browser notification sound without external assets.
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      const audio = new AudioContextClass();
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();

      oscillator.frequency.value = 880;
      gain.gain.value = 0.04;

      oscillator.connect(gain);
      gain.connect(audio.destination);

      oscillator.start();
      oscillator.stop(audio.currentTime + 0.35);
    }
  } catch (_) {}
}

function updateCountdownDisplay() {
  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = remainingSeconds % 60;

  timerValue.textContent =
    `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

function updateCurrentTime() {
  const now = new Date();

  timerValue.textContent =
    `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

function togglePause() {
  if (mode !== "countdown" || remainingSeconds <= 0) return;

  paused = !paused;
  updatePauseButton();

  timerStatus.textContent = paused ? "TIMER PAUSED" : "TIMER RUNNING..";
}

function updatePauseButton() {
  pauseIcon.textContent = paused ? "▶" : "Ⅱ";
  pauseText.textContent = paused ? "Resume Timer" : "Pause Timer";
}

async function backToSetup() {
  clearInterval(timerInterval);
  timerInterval = null;

  paused = false;
  mode = "countdown";

  if (wakeLock) {
    try {
      await wakeLock.release();
    } catch (_) {}
    wakeLock = null;
  }

  if (document.fullscreenElement && document.exitFullscreen) {
    try {
      await document.exitFullscreen();
    } catch (_) {}
  }

  fullscreenRequested = false;

  timerPage.classList.remove("page--active");
  setupPage.classList.add("page--active");

  pauseButton.hidden = false;
  updatePauseButton();

  timerStatus.classList.remove("finished");
  timerStatus.textContent = "TIMER RUNNING";
}

window.addEventListener("beforeunload", () => {
  clearInterval(timerInterval);
});


// If the browser releases fullscreen (for example after Esc), the timer
// continues running and the Wake Lock remains active where supported.

// =====================================
// F KEY = FULLSCREEN
// =====================================

document.addEventListener("keydown", async (event) => {

  // Ignore F if the user is typing in an input box
  const active = document.activeElement;

  if (
    active &&
    (active.tagName === "INPUT" ||
     active.tagName === "TEXTAREA")
  ) {
    return;
  }

  // F or f
  if (event.key.toLowerCase() === "f") {

    event.preventDefault();

    // Only enable fullscreen while the timer page is active
    if (timerPage.classList.contains("page--active")) {

      if (!document.fullscreenElement) {

        try {
          await document.documentElement.requestFullscreen();
          fullscreenRequested = true;
        } catch (error) {
          console.log("Fullscreen request failed:", error);
        }

      }
    }
  }
});
