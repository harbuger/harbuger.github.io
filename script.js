// ============================================================
// Motion engine: scroll reveals, count-ups, chart animations.
// Everything plays once. Respects prefers-reduced-motion.
// Site remains fully readable with JS disabled.
// ============================================================

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Gate all initial-hidden CSS states behind this class so the
// page is never blank without JS.
if (!reduceMotion) document.body.classList.add("anim-ready");

/* ---------- case study reveal ---------- */
const caseObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
        caseObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);
document.querySelectorAll(".case").forEach((el) => {
  if (reduceMotion) el.classList.add("in-view");
  else caseObserver.observe(el);
});

/* ---------- count-up numbers ---------- */
function easeOutExpo(t) {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

function formatValue(value, el) {
  const format = el.dataset.format || "";
  const suffix = el.dataset.suffix || "";
  const text = format === "comma" ? Math.round(value).toLocaleString("en-US") : String(Math.round(value));
  return text + suffix;
}

function countUp(el, duration = 1200) {
  const target = parseFloat(el.dataset.count);
  if (isNaN(target)) return;
  const start = performance.now();
  function frame(now) {
    const t = Math.min(1, (now - start) / duration);
    el.textContent = formatValue(target * easeOutExpo(t), el);
    if (t < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

/* ---------- burndown line draw ---------- */
function drawLines(scope) {
  scope.querySelectorAll(".draw-line").forEach((line) => {
    const len = line.getTotalLength();
    line.style.strokeDasharray = len;
    line.style.strokeDashoffset = len;
    // force a reflow so the transition starts from the hidden state
    line.getBoundingClientRect();
    line.style.transition = "stroke-dashoffset 1.4s cubic-bezier(0.4, 0, 0.2, 1) 0.2s";
    line.style.strokeDashoffset = "0";
  });
}

/* ---------- play triggers: stat strip + every mock ---------- */
function play(el) {
  el.classList.add("play");
  el.querySelectorAll(".cnt").forEach((n) => countUp(n));
  drawLines(el);
}

const playTargets = document.querySelectorAll(".stats, .mock");

if (reduceMotion) {
  // No animation: final values are already in the HTML.
  playTargets.forEach((el) => el.classList.add("play"));
} else {
  const playObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          play(entry.target);
          playObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.35 }
  );
  playTargets.forEach((el) => playObserver.observe(el));
}

/* ---------- copy email to clipboard ---------- */
document.querySelectorAll(".copy-email").forEach((btn) => {
  const original = btn.textContent;
  let timer;
  btn.addEventListener("click", async () => {
    const email = btn.dataset.email;
    let ok = false;
    try {
      await navigator.clipboard.writeText(email);
      ok = true;
    } catch (e) {
      // fallback for older browsers / non-secure contexts
      try {
        const ta = document.createElement("textarea");
        ta.value = email;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        ok = document.execCommand("copy");
        ta.remove();
      } catch (e2) { /* leave the address visible for manual copy */ }
    }
    if (!ok) return;
    btn.style.minWidth = btn.offsetWidth + "px"; // keep size stable during swap
    btn.classList.add("copied");
    btn.textContent = "Copied ✓";
    clearTimeout(timer);
    timer = setTimeout(() => {
      btn.classList.remove("copied");
      btn.textContent = original;
    }, 1800);
  });
});

/* ---------- reveal anything already in view on load ---------- */
window.addEventListener("load", () => {
  document.querySelectorAll(".case").forEach((el) => {
    if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add("in-view");
  });
});
