// Plays the videos listed in a .playlist element's data-videos one after another, looping
// back to the first, holding each episode's last frame for data-pause ms (default 0) in between.
// Files that fail to load are skipped; if none load, the poster image (or a plain placeholder) is
// shown instead. Below each playlist: a play/pause button, then one dot per episode.
document.querySelectorAll(".playlist").forEach((el) => {
  const sources = (el.dataset.videos || "").split(",").map((s) => s.trim()).filter(Boolean);
  const poster = el.dataset.poster;
  const pause = Number(el.dataset.pause) || 0;
  if (el.dataset.ratio) el.style.aspectRatio = el.dataset.ratio;

  const showFallback = () => {
    el.replaceChildren();
    el.classList.add("fallback");
    if (poster) {
      const img = document.createElement("img");
      img.src = poster;
      img.alt = "";
      el.append(img);
    }
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = "Video coming soon";
    el.append(tag);
  };

  if (!sources.length) return showFallback();

  const video = document.createElement("video");
  Object.assign(video, { muted: true, playsInline: true, autoplay: true, preload: "auto" });
  video.setAttribute("muted", "");
  video.setAttribute("playsinline", "");
  if (poster) video.poster = poster;

  const ICON_PAUSE = '<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M4 2h3v12H4zM9 2h3v12H9z"/></svg>';
  const ICON_PLAY = '<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M4 2l10 6-10 6z"/></svg>';
  const controls = document.createElement("div");
  controls.className = "controls";
  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "playpause";
  controls.append(toggle);
  const dots = document.createElement("div");
  dots.className = "dots";
  controls.append(dots);
  let paused = false;  // the viewer's choice; the between-episode hold does not count as paused
  const showState = () => {
    toggle.innerHTML = paused ? ICON_PLAY : ICON_PAUSE;
    toggle.classList.toggle("is-paused", paused);
    toggle.setAttribute("aria-label", paused ? "Play" : "Pause");
  };
  toggle.addEventListener("click", () => {
    paused = !paused;
    if (paused) {
      clearTimeout(timer);  // pausing during the hold stays on this episode's last frame
      video.pause();
    } else if (video.ended) {
      next();
    } else {
      video.play().catch(() => {});
    }
    showState();
  });
  const buttons = sources.map((_, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.setAttribute("aria-label", `Episode ${i + 1}`);
    b.addEventListener("click", () => play(i));
    dots.append(b);
    return b;
  });

  const broken = new Set();
  let current = 0;
  let timer = null;

  function play(i) {
    clearTimeout(timer);
    paused = false;  // picking an episode plays it
    showState();
    current = i;
    buttons.forEach((b, j) => b.classList.toggle("active", j === i));
    video.src = sources[i];
    video.play().catch(() => {});
  }

  function next() {
    if (broken.size === sources.length) return showFallback();
    let i = current;
    do i = (i + 1) % sources.length; while (broken.has(i));
    play(i);
  }

  // The poster only covers the first load; kept, it would flash between episodes.
  video.addEventListener("loadeddata", () => video.removeAttribute("poster"), { once: true });
  video.addEventListener("loadedmetadata", () => {
    el.style.aspectRatio = `${video.videoWidth} / ${video.videoHeight}`;
  });
  video.addEventListener("ended", () => {
    if (!paused) timer = setTimeout(next, pause);
  });
  video.addEventListener("error", () => {
    broken.add(current);
    buttons[current].hidden = true;
    next();
  });

  // Tap/click for fullscreen: the clips' plot text is small at phone width.
  video.addEventListener("click", () => {
    if (video.requestFullscreen) video.requestFullscreen().catch(() => {});
    else if (video.webkitEnterFullscreen) video.webkitEnterFullscreen();
  });

  el.append(video);
  if (sources.length < 2) dots.hidden = true;
  el.after(controls);
  play(0);
});
