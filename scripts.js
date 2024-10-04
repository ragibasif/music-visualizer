const song = document.getElementById("song");
const scrollBarContainer = document.getElementById("scroll-bar-container");
const scrollBar = document.getElementById("scroll-bar");
const currentTimeOfSong = document.getElementById("time");
const durationTimeOfSong = document.getElementById("duration");
const previousBtn = document.getElementById("previous");
const playBtn = document.getElementById("play");
const nextBtn = document.getElementById("next");
const muteBtn = document.getElementById("mute");
const playlistElement = document.getElementById("playlist");
const canvas = document.getElementById("visualizer");
const ctx = canvas.getContext("2d");

let isPlaying = false;
let songs = [];
let songIndex = 0;

fetch("songs.json")
  .then((response) => response.json())
  .then((data) => {
    songs = data;
    loadSong(songIndex);
    updatePlaylistUI();
  })
  .catch((error) => console.error("Error fetching the JSON data:", error));

function playSong() {
  playBtn.textContent = "Pause";
  song.play();
  isPlaying = true;
  createOrResumeAudioContext();
}

function pauseSong() {
  playBtn.textContent = "Play";
  song.pause();
  isPlaying = false;
}

function togglePlayPause() {
  if (isPlaying) {
    pauseSong();
  } else {
    playSong();
  }
}
let isMuted = false;

function toggleMute() {
  if (!isMuted) {
    song.volume = 0;
    muteBtn.textContent = "Unmute";
  } else {
    song.volume = 1;
    muteBtn.textContent = "Mute";
  }
  isMuted = !isMuted;
}

muteBtn.addEventListener("click", toggleMute);

function loadSong(index) {
  if (index >= 0 && index < songs.length) {
    songIndex = index;
    song.src = songs[songIndex].src;
    song.load();
    updatePlaylistUI();
  } else {
    console.error("Invalid track index:", index);
  }
}

function previousSong() {
  songIndex = songIndex > 0 ? songIndex - 1 : songs.length - 1;
  loadSong(songIndex);
  playSong();
}

function nextSong() {
  songIndex = songIndex < songs.length - 1 ? songIndex + 1 : 0;
  loadSong(songIndex);
  playSong();
}

function selectSong(index) {
  loadSong(index);
  playSong();
}

function updatePlaylistUI() {
  playlistElement.innerHTML = "";
  songs.forEach((track, index) => {
    const li = document.createElement("li");
    li.textContent = track.name + " - " + track.artist;
    li.onclick = () => selectSong(index);
    if (index === songIndex) {
      li.classList.add("active");
    }
    playlistElement.appendChild(li);
  });
}

// scroll bar/time
function updateScrollBar(event) {
  if (isPlaying) {
    const { duration, currentTime } = event.srcElement;
    const progressPercent = (currentTime / duration) * 100;
    scrollBar.style.width = `${progressPercent}%`;
    const durationMinutes = Math.floor(duration / 60);
    let durationSeconds = Math.floor(duration % 60);
    if (durationSeconds < 10) {
      durationSeconds = `0${durationSeconds}`;
    }
    if (durationSeconds) {
      durationTimeOfSong.textContent = `${durationMinutes}:${durationSeconds}`;
    }
    const currentMinutes = Math.floor(currentTime / 60);
    let currentSeconds = Math.floor(currentTime % 60);
    if (currentSeconds < 10) {
      currentSeconds = `0${currentSeconds}`;
    }
    currentTimeOfSong.textContent = `${currentMinutes}:${currentSeconds}`;
  }
}

function changeProgress(event) {
  const width = this.clientWidth;
  const clickX = event.offsetX;
  const { duration } = song;
  song.currentTime = (clickX / width) * duration;
  if (!isPlaying) {
    scrollBar.style.width = `${(song.currentTime / duration) * 100}%`;
    const durationMinutes = Math.floor(duration / 60);
    let durationSeconds = Math.floor(duration % 60);
    if (durationSeconds < 10) {
      durationSeconds = `0${durationSeconds}`;
    }
    if (durationSeconds) {
      durationTimeOfSong.textContent = `${durationMinutes}:${durationSeconds}`;
    }
    const currentMinutes = Math.floor(song.currentTime / 60);
    let currentSeconds = Math.floor(song.currentTime % 60);
    if (currentSeconds < 10) {
      currentSeconds = `0${currentSeconds}`;
    }
    currentTimeOfSong.textContent = `${currentMinutes}:${currentSeconds}`;
  }
}

let audioContext;
let analyzer;
let source;

function createOrResumeAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyzer = audioContext.createAnalyser();
    source = audioContext.createMediaElementSource(song);
    source.connect(analyzer);
    analyzer.connect(audioContext.destination);
    analyzer.fftSize = 256;
  }
  if (audioContext.state === "suspended") {
    audioContext.resume();
  }
}

function drawVisualizer() {
  requestAnimationFrame(drawVisualizer);
  if (!analyzer) return;

  const bufferLength = analyzer.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  analyzer.getByteFrequencyData(dataArray);

  const barWidth = canvas.width / bufferLength;
  const barHeightMultiplier = canvas.height / 256;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < bufferLength; i++) {
    const barHeight = dataArray[i] * barHeightMultiplier;
    const x = i * barWidth;
    const y = canvas.height - barHeight;

    const gradient = ctx.createLinearGradient(
      x,
      y,
      x + barWidth,
      y + barHeight
    );
    gradient.addColorStop(0, `rgb(110, 33, 194)`);
    gradient.addColorStop(dataArray[i] / 255, `rgb(255, 107, 100)`);
    gradient.addColorStop(1, `rgb(252, 10, 110)`);

    ctx.fillStyle = gradient;
    // mirror
    ctx.fillRect(canvas.width / 2 - x, y, barWidth, barHeight);
    ctx.fillRect(canvas.width / 2 + x, y, barWidth, barHeight);
  }
}

playBtn.addEventListener("click", togglePlayPause);
previousBtn.addEventListener("click", previousSong);
nextBtn.addEventListener("click", nextSong);
song.addEventListener("timeupdate", updateScrollBar);
song.addEventListener("ended", nextSong);
scrollBarContainer.addEventListener("click", changeProgress);

window.onload = () => {
  drawVisualizer();
};

document
  .querySelector(".liquid-button")
  .addEventListener("mouseenter", function () {
    this.querySelector(".liquid-path").style.animationPlayState = "paused";
  });

document
  .querySelector(".liquid-button")
  .addEventListener("mouseleave", function () {
    this.querySelector(".liquid-path").style.animationPlayState = "running";
  });
