"use strict";

/* ========================
   CONTENT & ASSET SETTINGS
   Replace only the *_PATH_HERE values with your own local asset paths.
   No external media is used by this project.
======================== */
const worlds = {
  // ضعي ملف def.mp4 بجوار index.html ليكون مشهد البداية.
  default: { name: "عالمي لكِ", video: "def.mp4" },

  seasons: [
    { name: "الربيع", icon: "🌸", video: "ربيع.mp4" },
    { name: "الصيف", icon: "☀️", video: "صيف.mp4" },
    { name: "الخريف", icon: "🍂", video: "خريف.mp4" },
    { name: "الشتاء", icon: "❄️", video: "شتاء.mp4" }
  ]
};


// Add as many natural scenes as you wish.
// Every object appears automatically in "كل الجمال".
const natureVideos = [
  { name: "nature", video: "nature1.mp4" },
  { name: "vad1", video: "nature2.mp4" },
  { name: "vad2", video: "nature3.mp4" },
  { name: "vad3", video: "nature4.mp4" },
  { name: "vad4", video: "nature5.mp4" },
  { name: "vad5", video: "nature6.mp4" }
];


const sounds = [
  { name: "الصوت الافتراضي", icon: "🎵", file: "def.mp3" },
  { name: "المطر", icon: "🌧", file: "مطر.wav" },
  { name: "البحر", icon: "🌊", file: "البحر.wav" },
  { name: "الغابة", icon: "🌿", file: "غابة.wav" },
  { name: "العصافير", icon: "🐦", file: "العصافير.wav" },
  { name: "الصباح", icon: "🕊️", file: "صباح.wav" },
  { name: "الريح", icon: "💨", file: "الرياح.wav" },
  { name: "الماء", icon: "💧", file: "ماء.wav" },
  { name: "ليل هادئ", icon: "🌙", file: "ليل هادئ.wav" },
  { name: "لحن رومانسي", icon: "🎵", file: "rom.mp3" }
];


const introLines = [
 
  "تفضلي إلى عالمكِ ❤️"
];


const state = {
  activeVideo: null,
  incomingVideo: null,

  audioMode: "video",
  currentAudioFile: null,
  currentSoundName: "صوت الفيديو الأصلي",

  audioEnabled: false,
  volume: 0.55,
  audioRequestId: 0,

  videoTransitioning: false,
  idleTimer: null
};


const $ = (selector) => document.querySelector(selector);


// مساعد آمن لربط الأحداث
function on(selector, event, handler, options) {
  const el = typeof selector === "string" ? $(selector) : selector;

  if (!el) {
    console.warn(
      `[bindEvents] العنصر "${selector}" غير موجود في الصفحة — تم تجاوز ربط الحدث.`
    );

    return;
  }

  el.addEventListener(event, handler, options);
}


const videoA = $("#videoLayerA");
const videoB = $("#videoLayerB");
const ambientAudio = $("#ambientAudio");


// ========================
// COVER IMAGE
// ========================

let coverHidden = false;

function hideCoverImage() {
  if (coverHidden) return;

  coverHidden = true;

  const cover = $("#preloadCover");

  if (cover) cover.classList.add("is-hidden");
}


// ========================
// INITIALIZE APP
// ========================

function initializeApp() {
  state.activeVideo = videoA;
  state.incomingVideo = videoB;

  initializeDefaultVideo();

  ambientAudio.volume = state.volume;

  buildWorldLists();
  buildSoundList();
  showIntro();
  bindEvents();
  revealControls();


  // صورة الغلاف تفضل ظاهرة حتى تضغطي زر "ادخلي" (وبعدها بشوية) — الإخفاء الفعلي مربوط بحدث الضغط بالأسفل في bindEvents
  const coverImage = $("#preloadCoverImage");

  // إن لم تكن صورة الغلاف (cover.jpg) موجودة بعد، تُخفى بهدوء دون ترك أيقونة صورة معطوبة
  if (coverImage) {
    coverImage.addEventListener(
      "error",
      () => {
        coverImage.style.display = "none";
      },
      { once: true }
    );
  }

  // شبكة أمان فقط: لو لم يتم الضغط على زر الدخول لأي سبب، تختفي الصورة تلقائيًا بعد مدة طويلة نسبيًا
  window.setTimeout(hideCoverImage, 150000);


  // تشغيل الفيديو فقط.
  // الصوت لن يبدأ إلا بعد الضغط على "ادخلي"
  videoA.play().catch(() => {});
}


// ========================
// DEFAULT VIDEO
// ========================

function initializeDefaultVideo() {
  videoA.dataset.source = worlds.default.video;

  if (videoA.getAttribute("src") !== worlds.default.video) {
    videoA.src = worlds.default.video;
    videoA.load();
  }

  videoA.classList.add("is-active");

  videoB.pause();
  videoB.removeAttribute("src");
  videoB.load();
  videoB.classList.remove("is-active");
}


// ========================
// DEFAULT AUDIO
// ========================
// تم إلغاء التشغيل التلقائي هنا.
// الصوت سيبدأ من زر "ادخلي" فقط.

function startDefaultAmbientAudio() {
  const source = sounds[0].file;
  const name = sounds[0].name;

  ambientAudio.src = source;
  ambientAudio.load();

  ambientAudio.volume = 0;

  state.audioMode = "ambient";
  state.currentAudioFile = source;
  state.currentSoundName = name;
}


// ========================
// INTRO
// ========================

function showIntro() {
  const container = $("#introText");

  introLines.forEach((line, index) => {
    const item = document.createElement("span");

    item.className = "intro-line";
    item.textContent = line;

    item.style.animationDelay = `${0.22 + index * 0.115}s`;

    container.append(item);
  });


  const totalDelay = 650 + introLines.length * 115;

  window.setTimeout(() => {
    $("#enterButton").hidden = false;
  }, totalDelay);
}


function hideIntro() {
  $("#intro").classList.add("is-hidden");

  revealControls();

  requestFullscreenIfDesktop();
}


// ========================
// FULLSCREEN
// ========================

function requestFullscreenIfDesktop() {
  const isDesktop =
    window.matchMedia("(hover:hover) and (pointer:fine)").matches;

  if (!isDesktop) return;

  const root = document.documentElement;

  const request =
    root.requestFullscreen ||
    root.webkitRequestFullscreen ||
    root.mozRequestFullScreen ||
    root.msRequestFullscreen;

  if (!request) return;

  try {
    request.call(root).catch(() => {});
  } catch {
    // المستخدم رفض أو المتصفح منع الطلب
  }
}


// ========================
// WORLD LISTS
// ========================

function buildWorldLists() {
  populateChoiceList("#seasonList", worlds.seasons, "season");
  populateChoiceList("#natureList", natureVideos, "nature");
}


function populateChoiceList(selector, items, kind) {
  const list = $(selector);

  if (!list) return;

  list.innerHTML = "";

  items.forEach((item, index) => {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "choice-button";

    button.dataset.kind = kind;
    button.dataset.index = index;

    button.textContent = `${item.icon || "✦"} ${item.name}`;

    list.append(button);
  });
}


function buildSoundList() {
  const list = $("#soundList");

  if (!list) return;

  list.innerHTML = "";

  sounds.forEach((sound, index) => {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "sound-button";

    button.dataset.soundIndex = index;

    button.innerHTML = `
      <span>${sound.icon} ${sound.name}</span>
      <small>اختيار</small>
    `;

    list.append(button);
  });
}


// ========================
// CHANGE WORLD
// ========================

function changeWorld(item, category) {
  if (!item || !item.video || state.videoTransitioning) return;

  setSelectedWorld(category, item.name);

  crossFadeVideo(item.video);

  closeSettings();

  announce(`تم اختيار ${item.name}`);
}


function setSelectedWorld(category, name) {
  document
    .querySelectorAll(".world-option,.choice-button")
    .forEach((button) => button.classList.remove("selected"));


  const parent = document.querySelector(
    `.world-option[data-world="${
      category === "default"
        ? "default"
        : category === "season"
        ? "seasons"
        : "nature"
    }"]`
  );

  if (parent) parent.classList.add("selected");


  document.querySelectorAll(".choice-button").forEach((button) => {
    if (button.textContent.includes(name)) {
      button.classList.add("selected");
    }
  });
}


// ========================
// VIDEO TRANSITION
// ========================

async function crossFadeVideo(source) {
  if (sameVideoSource(source, state.activeVideo)) return;

  if (source.includes("_PATH_HERE")) {
    announce("أضيفي مسار فيديو هذا العالم في أعلى ملف script.js أولًا.");
    return;
  }


  state.videoTransitioning = true;

  const next = state.incomingVideo;

  next.dataset.source = source;

  next.muted = true;
  next.volume = state.volume;


  try {
    await loadVideoSource(next, source);


    // منع الفيديوهين من تشغيل الصوت معًا
    if (state.audioMode === "video" && state.audioEnabled) {
      state.activeVideo.muted = true;
    }


    next.muted = !(
      state.audioMode === "video" &&
      state.audioEnabled
    );


    await next.play();

    next.classList.add("is-active");

    await wait(2050);


    state.activeVideo.pause();

    state.activeVideo.removeAttribute("src");

    state.activeVideo.load();

    state.activeVideo.classList.remove("is-active");


    [state.activeVideo, state.incomingVideo] = [
      next,
      state.activeVideo
    ];

  } catch (error) {

    state.activeVideo.muted = !(
      state.audioMode === "video" &&
      state.audioEnabled
    );

    console.warn(
      "Video could not be loaded.",
      error
    );

    announce(
      error.message ||
      "تعذّر تشغيل هذا الفيديو. راجعي مساره."
    );

  } finally {
    state.videoTransitioning = false;
  }
}


function sameVideoSource(source, video) {
  try {
    return (
      new URL(
        source,
        document.baseURI
      ).href ===
      new URL(
        video.dataset.source || video.currentSrc,
        document.baseURI
      ).href
    );
  } catch {
    return (
      source === video.dataset.source ||
      source === video.currentSrc
    );
  }
}


function resolveVideoSrc(source) {
  try {
    return encodeURI(source);
  } catch {
    return source;
  }
}


// ========================
// VIDEO ERROR
// ========================

function describeMediaError(video) {
  const code = video.error && video.error.code;

  switch (code) {
    case 1:
      return "تم إلغاء تحميل الفيديو.";

    case 2:
      return "تعذّر الوصول لملف الفيديو (تأكدي من اسم الملف ومساره).";

    case 3:
      return "الملف تالف أو تعذّر فك تشفيره.";

    case 4:
      return "صيغة هذا الفيديو غير مدعومة على هذا الجهاز — حوّليه إلى H.264 mp4 (باستخدام faststart) ليعمل على الآيفون.";

    default:
      return "تعذّر تشغيل الفيديو.";
  }
}


// ========================
// LOAD VIDEO
// ========================

function loadVideoSource(video, source) {
  return new Promise((resolve, reject) => {

    let timer;


    const cleanup = () => {
      clearTimeout(timer);

      video.removeEventListener(
        "canplay",
        ready
      );

      video.removeEventListener(
        "error",
        fail
      );
    };


    const ready = () => {
      cleanup();
      resolve();
    };


    const fail = () => {
      const reason = describeMediaError(video);

      cleanup();

      reject(new Error(reason));
    };


    video.addEventListener(
      "canplay",
      ready,
      { once: true }
    );


    video.addEventListener(
      "error",
      fail,
      { once: true }
    );


    timer = window.setTimeout(() => {
      cleanup();

      reject(
        new Error(
          "تعذّر تحميل الفيديو خلال وقت كافٍ — تأكدي من حجم الملف والاتصال بالإنترنت."
        )
      );

    }, 30000);


    video.src = resolveVideoSrc(source);

    video.load();
  });
}


// ========================
// VIDEO AUDIO
// ========================

function setVideoAudioEnabled(enabled) {
  state.audioMode = "video";

  state.audioEnabled = enabled;

  ambientAudio.pause();
  ambientAudio.currentTime = 0;

  state.activeVideo.muted = !enabled;
  state.activeVideo.volume = state.volume;

  state.currentSoundName = "صوت الفيديو الأصلي";

  updateAudioUI();
}


async function useOriginalVideoAudio() {

  const requestId = beginAudioAction();

  // تحديد الزر فورًا حتى تشعري بالاستجابة اللحظية قبل انتهاء تلاشي الصوت السابق
  document
    .querySelectorAll(".sound-list .sound-button, #originalVideoSound")
    .forEach((button) => button.classList.remove("selected"));

  const originalBtn = $("#originalVideoSound");

  if (originalBtn) {
    originalBtn.classList.add("selected");
    originalBtn.classList.add("is-loading");
  }

  if (state.audioMode === "ambient") {
    await fadeAudio(0, 220, requestId);

    if (requestId !== state.audioRequestId) return;

    ambientAudio.pause();
  }

  if (originalBtn) originalBtn.classList.remove("is-loading");

  setVideoAudioEnabled(true);
}


// ========================
// CHANGE AUDIO
// ========================

async function changeAudio(file, name) {
  if (!file) return;


  if (
    state.audioMode === "ambient" &&
    file === state.currentAudioFile
  ) {
    toggleAudio();

    return;
  }


  const requestId = beginAudioAction();

  state.activeVideo.muted = true;

  state.audioMode = "ambient";
  state.currentAudioFile = file;
  state.currentSoundName = name;
  state.audioEnabled = true;


  // تحديث فوري للاسم/التحديد + مؤشر تحميل على الزر، حتى تشعري بالاستجابة من أول ضغطة
  updateAudioUI();
  setSoundLoading(file, true);


  if (!ambientAudio.paused) {
    await fadeAudio(0, 220, requestId);

    if (requestId !== state.audioRequestId) {
      setSoundLoading(file, false);
      return;
    }
  }


  ambientAudio.pause();

  ambientAudio.src = file;

  ambientAudio.load();

  ambientAudio.volume = 0;


  try {
    await ambientAudio.play();

    if (requestId !== state.audioRequestId) {
      setSoundLoading(file, false);
      return;
    }

    await fadeAudio(state.volume, 650, requestId);

  } catch {
    if (requestId === state.audioRequestId) {
      state.audioEnabled = false;

      announce(
        "تعذّر تشغيل الصوت. راجعي مسار الملف."
      );
    }
  }


  setSoundLoading(file, false);

  if (requestId === state.audioRequestId) updateAudioUI();
}


// ========================
// AUDIO TOGGLE
// ========================

async function toggleAudio() {

  if (state.audioMode === "video") {

    setVideoAudioEnabled(
      !state.audioEnabled
    );

    return;
  }


  const requestId = beginAudioAction();

  const turningOn = !state.audioEnabled;


  // تحديث الأيقونة فورًا حتى لا تبدو الضغطة بلا أثر أثناء التلاشي
  state.audioEnabled = turningOn;

  updateAudioUI();


  if (!turningOn) {

    await fadeAudio(0, 300, requestId);

    if (requestId !== state.audioRequestId) return;

    ambientAudio.pause();

  } else {

    try {

      await ambientAudio.play();

      if (requestId !== state.audioRequestId) return;

      await fadeAudio(
        state.volume,
        450,
        requestId
      );

    } catch {

      if (requestId !== state.audioRequestId) return;

      state.audioEnabled = false;
    }
  }


  if (requestId === state.audioRequestId) updateAudioUI();
}


// ========================
// CINEMATIC FADE
// ========================

async function fadeAudio(
  target,
  duration = 500,
  requestId = state.audioRequestId
) {
  const start = ambientAudio.volume;

  const steps = Math.max(
    1,
    Math.round(duration / 25)
  );


  for (
    let i = 1;
    i <= steps;
    i++
  ) {

    // إن بدأ إجراء صوت أحدث (ضغطة جديدة) أثناء هذا التلاشي، نتوقف فورًا ونترك الأحدث يتحكم
    if (requestId !== state.audioRequestId) return;

    ambientAudio.volume =
      start +
      (target - start) *
      (i / steps);


    await wait(
      duration / steps
    );
  }
}


// يبدأ "جولة" صوتية جديدة ويُبطل أي جولة سابقة لا تزال قيد التنفيذ
function beginAudioAction() {
  return ++state.audioRequestId;
}


// تعليم/إزالة حالة "جاري التحميل" على زر الصوت المطابق للملف، لإعطاء استجابة بصرية فورية لحظة الضغط
function setSoundLoading(file, isLoading) {
  document
    .querySelectorAll(".sound-list .sound-button")
    .forEach((button) => {
      const isTarget =
        sounds[button.dataset.soundIndex].file === file;

      button.classList.toggle(
        "is-loading",
        isTarget && isLoading
      );
    });
}


// ========================
// AUDIO UI
// ========================

function updateAudioUI() {

  const icon =
    state.audioEnabled
      ? "🔊"
      : "🔇";


  $("#audioToggle").innerHTML =
    `<span aria-hidden="true">${icon}</span>`;


  $("#audioToggle").setAttribute(
    "aria-label",
    state.audioEnabled
      ? "كتم الصوت"
      : "تشغيل الصوت"
  );


  $("#audioToggle").setAttribute(
    "aria-pressed",
    String(state.audioEnabled)
  );


  $("#currentSoundLabel").textContent =
    state.currentSoundName;


  const originalBtn =
    $("#originalVideoSound");


  if (originalBtn) {
    originalBtn.classList.toggle(
      "selected",
      state.audioMode === "video"
    );
  }


  document
    .querySelectorAll(
      ".sound-list .sound-button"
    )
    .forEach((button) => {

      button.classList.toggle(
        "selected",

        state.audioMode === "ambient" &&
        sounds[
          button.dataset.soundIndex
        ].file === state.currentAudioFile
      );

    });
}


// ========================
// SETTINGS
// ========================

function openSettings() {
  $("#settingsPanel").classList.add(
    "is-open"
  );

  $("#panelScrim").classList.add(
    "is-visible"
  );

  $("#settingsPanel").setAttribute(
    "aria-hidden",
    "false"
  );

  $("#settingsButton").setAttribute(
    "aria-expanded",
    "true"
  );

  revealControls();
}


function closeSettings() {
  $("#settingsPanel").classList.remove(
    "is-open"
  );

  $("#panelScrim").classList.remove(
    "is-visible"
  );

  $("#settingsPanel").setAttribute(
    "aria-hidden",
    "true"
  );

  $("#settingsButton").setAttribute(
    "aria-expanded",
    "false"
  );
}


function toggleWorldGroup(world) {

  const list =
    $(
      `#${world === "seasons"
        ? "seasonList"
        : "natureList"}`
    );


  const button =
    document.querySelector(
      `.world-option[data-world="${world}"]`
    );


  const open = list.hidden;

  list.hidden = !open;

  button.setAttribute(
    "aria-expanded",
    String(open)
  );
}


// ========================
// PARALLAX
// ========================

function handleParallax(event) {

  if (
    window.matchMedia(
      "(hover:hover)"
    ).matches
  ) {

    const x =
      (
        event.clientX /
        window.innerWidth -
        0.5
      ) * 4;


    const y =
      (
        event.clientY /
        window.innerHeight -
        0.5
      ) * 4;


    $(".vignette").style.transform =
      `scale(1.04) translate(${-x}px,${-y}px)`;


    const glow =
      $("#cursorGlow");


    glow.style.left =
      `${event.clientX}px`;


    glow.style.top =
      `${event.clientY}px`;


    glow.classList.add(
      "is-visible"
    );
  }
}


// ========================
// CONTROLS
// ========================

function revealControls() {

  $("#hud").classList.remove(
    "is-idle"
  );


  window.clearTimeout(
    state.idleTimer
  );


  state.idleTimer =
    window.setTimeout(() => {

      if (
        !$("#settingsPanel")
          .classList
          .contains("is-open")
      ) {

        $("#hud").classList.add(
          "is-idle"
        );
      }

    }, 5200);
}


function announce(message) {
  $("#statusMessage").textContent =
    message;
}


function wait(ms) {
  return new Promise(
    (resolve) =>
      window.setTimeout(
        resolve,
        ms
      )
  );
}


// ========================
// EVENTS
// ========================

function bindEvents() {

  // ==========================================
  // زر "ادخلي"
  // الصوت يبدأ هنا فورًا مع ضغطة المستخدم
  // ==========================================

  on(
    "#enterButton",
    "click",
    async () => {

      // إخفاء المقدمة
      hideIntro();


      // صورة الغلاف تفضل ظاهرة شويّة بعد الضغط، وبعدين تنتقل بالراحة للفيديو
      window.setTimeout(
        hideCoverImage,
        1800
      );


      const requestId =
        beginAudioAction();


      // ملف الصوت الافتراضي
      const source =
        sounds[0].file;


      // ضبط حالة الصوت
      state.audioMode =
        "ambient";


      state.currentAudioFile =
        source;


      state.currentSoundName =
        sounds[0].name;


      state.audioEnabled =
        true;


      // إيقاف أي تشغيل سابق
      ambientAudio.pause();

      ambientAudio.currentTime =
        0;


      // تحميل def.mp3
      ambientAudio.src =
        source;

      ambientAudio.load();


      // البداية من صفر
      // حتى يبدأ الـ Fade من الصمت
      ambientAudio.volume = 0;


      try {

        // مهم جدًا:
        // play() هنا داخل click
        // لذلك المتصفح يسمح بتشغيل الصوت
        await ambientAudio.play();

        if (requestId !== state.audioRequestId) return;


        // Fade In سينمائي
        // من 0% إلى 55% خلال 1.2 ثانية
        await fadeAudio(
          state.volume,
          1200,
          requestId
        );


        updateAudioUI();

      } catch (error) {

        if (requestId !== state.audioRequestId) return;

        state.audioEnabled =
          false;


        console.warn(
          "تعذر تشغيل الصوت:",
          error
        );


        updateAudioUI();
      }
    }
  );


  on(
    "#settingsButton",
    "click",
    openSettings
  );


  on(
    "#closePanelButton",
    "click",
    closeSettings
  );


  on(
    "#panelScrim",
    "click",
    closeSettings
  );


  on(
    "#audioToggle",
    "click",
    toggleAudio
  );


  on(
    "#volumeRange",
    "input",
    (event) => {

      state.volume =
        Number(
          event.target.value
        );


      if (!state.audioEnabled)
        return;


      if (
        state.audioMode === "video"
      ) {

        state.activeVideo.volume =
          state.volume;

      } else {

        ambientAudio.volume =
          state.volume;
      }
    }
  );


  on(
    "#originalVideoSound",
    "click",
    useOriginalVideoAudio
  );


  // ========================
  // WORLD / SOUND CLICKS
  // ========================

  document.addEventListener(
    "click",
    (event) => {

      const world =
        event.target.closest(
          ".world-option"
        );


      const choice =
        event.target.closest(
          ".choice-button"
        );


      const sound =
        event.target.closest(
          ".sound-list .sound-button"
        );


      if (world) {

        if (
          world.dataset.world ===
          "default"
        ) {

          changeWorld(
            worlds.default,
            "default"
          );

        } else {

          toggleWorldGroup(
            world.dataset.world
          );
        }
      }


      if (choice) {

        const data =
          choice.dataset.kind ===
          "season"
            ? worlds.seasons
            : natureVideos;


        changeWorld(
          data[
            choice.dataset.index
          ],
          choice.dataset.kind
        );
      }


      if (sound) {

        const item =
          sounds[
            sound.dataset.soundIndex
          ];


        changeAudio(
          item.file,
          item.name
        );
      }
    }
  );


  // ========================
  // UI ACTIVITY
  // ========================

  [
    "mousemove",
    "touchstart",
    "keydown"
  ].forEach(
    (name) =>

      document.addEventListener(
        name,
        revealControls,
        { passive: true }
      )
  );


  document.addEventListener(
    "mousemove",
    handleParallax,
    { passive: true }
  );


  document.addEventListener(
    "mouseleave",
    () =>
      $("#cursorGlow")
        .classList
        .remove("is-visible")
  );
}


// ========================
// START
// ========================

document.addEventListener(
  "DOMContentLoaded",
  initializeApp
);
