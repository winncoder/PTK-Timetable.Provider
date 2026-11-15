(() => {
  const root = document.documentElement;
  const targets = Array.from(document.querySelectorAll("[data-reveal]"));
  const progress = document.getElementById("scroll-progress");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let observer = null;
  let lastY = window.scrollY;
  let direction = "down";
  let framePending = false;

  const showAll = () => {
    root.classList.remove("motion-ready");
    targets.forEach((target) => {
      target.classList.add("is-visible");
      target.style.removeProperty("--reveal-shift");
    });
  };

  const setProgress = () => {
    if (!progress) return;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const amount = maxScroll > 0 ? Math.min(100, Math.max(0, window.scrollY / maxScroll * 100)) : 0;
    progress.style.width = `${amount}%`;
  };

  const scheduleFrame = () => {
    if (framePending) return;
    framePending = true;
    window.requestAnimationFrame(() => {
      const currentY = window.scrollY;
      if (Math.abs(currentY - lastY) > 1) direction = currentY > lastY ? "down" : "up";
      lastY = currentY;
      setProgress();
      framePending = false;
    });
  };

  const startObserver = () => {
    if (reduceMotion.matches || !("IntersectionObserver" in window)) {
      showAll();
      return;
    }
    observer?.disconnect();
    observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const target = entry.target;
        if (entry.isIntersecting) {
          target.style.setProperty("--reveal-shift", direction === "down" ? "22px" : "-22px");
          target.classList.add("is-visible");
        } else {
          target.style.setProperty("--reveal-shift", direction === "down" ? "-15px" : "15px");
          target.classList.remove("is-visible");
        }
      }
    }, { threshold: 0.08, rootMargin: "0px 0px -5% 0px" });
    root.classList.add("motion-ready");
    targets.forEach((target) => observer.observe(target));
  };

  window.addEventListener("scroll", scheduleFrame, { passive: true });
  window.addEventListener("resize", scheduleFrame, { passive: true });
  reduceMotion.addEventListener?.("change", () => {
    if (reduceMotion.matches) {
      observer?.disconnect();
      observer = null;
      showAll();
    } else {
      startObserver();
    }
  });

  setProgress();
  startObserver();
})();
