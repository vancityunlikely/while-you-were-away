const finds = [
  {
    id: "cottage",
    x: 17.8,
    y: 29.6,
    kicker: "林子后面",
    title: "一直亮着的窗",
    body: "这一小时里，那扇窗没有灭过。没有人推门出来，也没有人把灯拧掉。像是有人在里面把时间过得很慢。",
    image: "assets/cottage.jpg",
  },
  {
    id: "fox",
    x: 37.2,
    y: 40.6,
    kicker: "自己来的",
    title: "背着包的狐狸",
    body: "它坐在你旁边，背包还扣着。包里有一颗圆石头，还是温的。它看月亮，不看人。",
    image: "assets/fox.jpg",
    video: "assets/fox.mp4",
  },
  {
    id: "lantern",
    x: 44.6,
    y: 45.4,
    kicker: "走的时候",
    title: "没吹灭的灯",
    body: "纸灯还热着。萤火虫围着它转，像以为这就是月亮。有人离开以前，把手从灯罩边放了下去。",
    image: "assets/lantern.jpg",
  },
  {
    id: "chair",
    x: 67.1,
    y: 51.2,
    kicker: "留给回来的人",
    title: "空着的椅子",
    body: "椅子对着月亮。座面上没有露水，草还是被压过的样子。谁刚坐过，把位置留了下来。",
    image: "assets/chair.jpg",
  },
  {
    id: "boat",
    x: 45.6,
    y: 78.4,
    kicker: "池塘原来是空的",
    title: "一只纸船",
    body: "船是新折的，边还干着。水里倒着月亮和灯。折船的人已经走了，船还在等风。",
    image: "assets/boat.jpg",
  },
];

const $ = (id) => document.getElementById(id);

const titleCard = $("titleCard");
const enter = $("enter");
const hotspots = $("hotspots");
const hud = $("hud");
const counter = $("counter");
const muteBtn = $("mute");
const gardenVideo = $("gardenVideo");
const sheet = $("sheet");
const card = $("card");
const cardImage = $("cardImage");
const cardVideo = $("cardVideo");
const cardKicker = $("cardKicker");
const cardTitle = $("cardTitle");
const cardBody = $("cardBody");
const letterWrap = $("letterWrap");

const found = new Set();
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let audio = null;
let muted = false;
let letterShown = false;
let openId = null;

function placeHotspots() {
  finds.forEach((item, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "hotspot";
    btn.style.left = `${item.x}%`;
    btn.style.top = `${item.y}%`;
    btn.style.animationDelay = `${i * 0.18}s`;
    btn.dataset.id = item.id;
    btn.setAttribute("aria-label", item.title);
    btn.addEventListener("click", (event) => {
      event.stopPropagation();
      openFind(item);
    });
    hotspots.appendChild(btn);
  });
}

function openFind(item) {
  openId = item.id;
  found.add(item.id);
  document.querySelector(`.hotspot[data-id="${item.id}"]`)?.classList.add("is-found");
  counter.textContent = `${found.size} / ${finds.length}`;

  cardKicker.textContent = item.kicker;
  cardTitle.textContent = item.title;
  cardBody.textContent = item.body;
  cardImage.src = item.image;

  const media = card.querySelector(".card-media");
  media.classList.remove("is-video");
  cardVideo.pause();
  cardVideo.removeAttribute("src");
  cardVideo.poster = item.image;
  if (item.video && !reduced) {
    const onPlaying = () => {
      media.classList.add("is-video");
      cardVideo.removeEventListener("playing", onPlaying);
    };
    cardVideo.addEventListener("playing", onPlaying);
    cardVideo.src = item.video;
    cardVideo.play().catch(() => {});
  }

  sheet.hidden = false;
}

function closeSheet() {
  const wasComplete = found.size === finds.length;
  sheet.hidden = true;
  cardVideo.pause();
  openId = null;
  if (wasComplete && !letterShown) {
    window.setTimeout(showLetter, 700);
  }
}

function showLetter() {
  letterShown = true;
  letterWrap.hidden = false;
}

function hideLetter() {
  letterWrap.hidden = true;
}

function startNightAudio() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;

  const ctx = new AudioCtx();
  const master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);
  master.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 2.2);

  const seconds = 3;
  const noise = ctx.createBuffer(1, seconds * ctx.sampleRate, ctx.sampleRate);
  const data = noise.getChannelData(0);
  let last = 0;
  for (let i = 0; i < data.length; i += 1) {
    last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
    data[i] = last * 4.8;
  }
  const wind = ctx.createBufferSource();
  wind.buffer = noise;
  wind.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 260;
  const windGain = ctx.createGain();
  windGain.gain.value = 0.38;
  wind.connect(filter);
  filter.connect(windGain);
  windGain.connect(master);
  wind.start();

  const pad = (freq, gain) => {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.value = gain;
    osc.connect(g);
    g.connect(master);
    osc.start();
  };
  pad(110, 0.028);
  pad(164.81, 0.016);
  pad(196, 0.01);

  const chirp = () => {
    if (ctx.state === "closed") return;
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.value = 2600 + Math.random() * 1100;
    const g = ctx.createGain();
    const t = ctx.currentTime;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.02, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
    osc.connect(g);
    g.connect(master);
    osc.start(t);
    osc.stop(t + 0.09);
    window.setTimeout(chirp, 420 + Math.random() * 1700);
  };
  window.setTimeout(chirp, 900);

  return { ctx, master };
}

function setMuted(next) {
  muted = next;
  muteBtn.setAttribute("aria-pressed", muted ? "true" : "false");
  muteBtn.textContent = muted ? "静" : "声";
  if (audio) {
    audio.master.gain.cancelScheduledValues(audio.ctx.currentTime);
    audio.master.gain.linearRampToValueAtTime(
      muted ? 0 : 0.2,
      audio.ctx.currentTime + 0.2
    );
  }
}

function enterGarden(instant) {
  if (instant) titleCard.style.transition = "none";
  titleCard.classList.add("is-gone");
  hud.hidden = false;
  hotspots.hidden = false;

  if (!reduced) {
    gardenVideo.classList.add("is-on");
    gardenVideo.play().catch(() => {});
  }

  if (!audio) audio = startNightAudio();
  else if (audio.ctx.state === "suspended") audio.ctx.resume();
}

placeHotspots();

const view = new URLSearchParams(location.search).get("view");
if (view === "garden" || view === "letter" || finds.some((item) => item.id === view)) {
  enterGarden(true);
  if (view === "letter") {
    finds.forEach((item) => found.add(item.id));
    counter.textContent = `${found.size} / ${finds.length}`;
    document.querySelectorAll(".hotspot").forEach((node) => node.classList.add("is-found"));
    showLetter();
  } else if (view !== "garden") {
    const item = finds.find((entry) => entry.id === view);
    if (item) window.setTimeout(() => openFind(item), 400);
  }
}

enter.addEventListener("click", enterGarden);
muteBtn.addEventListener("click", () => setMuted(!muted));
$("cardClose").addEventListener("click", closeSheet);
$("sheetDismiss").addEventListener("click", closeSheet);
$("letterClose").addEventListener("click", hideLetter);
$("letterDismiss").addEventListener("click", hideLetter);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (!sheet.hidden) closeSheet();
    else if (!letterWrap.hidden) hideLetter();
  }
  if (event.key === "Enter" && titleCard && !titleCard.classList.contains("is-gone")) {
    enterGarden();
  }
});
