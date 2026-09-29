// Plays the videos listed in a .playlist element's data-videos one after another, looping
// back to the first. Files that fail to load are skipped; if none load, the poster image
// (or a plain placeholder) is shown instead.
document.querySelectorAll(".playlist").forEach((el) => {
  const sources = (el.dataset.videos || "").split(",").map((s) => s.trim()).filter(Boolean);
  const poster = el.dataset.poster;
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

  const dots = document.createElement("div");
  dots.className = "dots";
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

  function play(i) {
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

  video.addEventListener("loadedmetadata", () => {
    el.style.aspectRatio = `${video.videoWidth} / ${video.videoHeight}`;
  });
  video.addEventListener("ended", next);
  video.addEventListener("error", () => {
    broken.add(current);
    buttons[current].hidden = true;
    next();
  });

  el.append(video);
  if (sources.length > 1) el.after(dots);
  play(0);
});
