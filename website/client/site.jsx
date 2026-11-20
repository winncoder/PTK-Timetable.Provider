import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import PtkScene from "./hero-scene.jsx";
import { isDownloadPath } from "./route-utils.js";
import { makeReleaseView } from "./release-utils.js";

const latestDownloadPath = "https://github.com/winncoder/PTK-Timetable.Provider/releases/download/v1.10.1/PTK-Schedule-1.10.1-arm64-v8a.apk";

function Icon({ name, className = "icon" }) {
  const common = { className, viewBox: "0 0 24 24", "aria-hidden": "true", focusable: "false" };
  switch (name) {
    case "arrow": return <svg {...common}><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
    case "download": return <svg {...common}><path d="M12 3v12m0 0 4.5-4.5M12 15l-4.5-4.5M4 18v2h16v-2" /></svg>;
    case "phone": return <svg {...common}><rect x="5" y="2" width="14" height="20" rx="2" /><path d="M10 18h4" /></svg>;
    case "check": return <svg {...common}><path d="m5 12 4 4L19 6" /></svg>;
    case "bell": return <svg {...common}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg>;
    case "scan": return <svg {...common}><path d="M4 4h5M4 4v5m16-5h-5m5 0v5M4 20h5m-5 0v-5m16 5h-5m5 0v-5M8 12h8" /></svg>;
    case "shield": return <svg {...common}><path d="M12 3 4 7v5c0 5 3.4 8 8 9 4.6-1 8-4 8-9V7l-8-4Z" /><path d="m9 12 2 2 4-4" /></svg>;
    case "clock": return <svg {...common}><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2.5 1.5M9 2h6" /></svg>;
    case "retry": return <svg {...common}><path d="M20 7v5h-5M4 17v-5h5M6.2 9a7 7 0 0 1 11.6-2L20 12M4 12l2.2 5a7 7 0 0 0 11.6-2" /></svg>;
    case "menu": return <svg {...common}><path d="M4 7h16M4 12h16M4 17h16" /></svg>;
    case "close": return <svg {...common}><path d="m6 6 12 12M18 6 6 18" /></svg>;
    default: return null;
  }
}

function Brand() {
  return <a className="brand" href="/" aria-label="PTK ตารางเรียน หน้าแรก">
    <img src="/ptk-icon.jpg" width="42" height="42" alt="" />
    <span className="brand-name">PTK ตารางเรียน<small>ผู้ช่วยจัดตารางเรียน</small></span>
  </a>;
}

function Header({ downloadPage }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef(null);
  const closeMenu = () => setMenuOpen(false);
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key !== "Escape") return;
      closeMenu();
      menuButtonRef.current?.focus();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);
  return <header className="site-header">
    <div className="wrap nav">
      <Brand />
      <nav className={`nav-links${menuOpen ? " is-open" : ""}`} id="primary-navigation" aria-label="เมนูหลัก">
        {downloadPage ? <><a className="nav-link" href="/">หน้าหลัก</a><a className="nav-link" href="#install-title" onClick={closeMenu}>วิธีติดตั้ง</a></> : <>
          <a className="nav-link" href="#features" onClick={closeMenu}>จุดเด่น</a>
          <a className="nav-link" href="#steps" onClick={closeMenu}>วิธีใช้งาน</a>
        </>}
        <a className={`nav-link${downloadPage ? " is-current" : ""}`} href="/download" aria-current={downloadPage ? "page" : undefined} onClick={closeMenu}>ดาวน์โหลด</a>
        <a className="button button-primary nav-mobile-cta" href="/download" onClick={closeMenu}>ดาวน์โหลด APK <Icon name="download" /></a>
      </nav>
      <a className="button button-primary button-small nav-cta" href="/download">ดาวน์โหลด APK <Icon name="download" /></a>
      <button ref={menuButtonRef} className="menu-toggle" type="button" aria-label={menuOpen ? "ปิดเมนู" : "เปิดเมนู"} aria-expanded={menuOpen} aria-controls="primary-navigation" onClick={() => setMenuOpen((open) => !open)}>
        <Icon name={menuOpen ? "close" : "menu"} />
      </button>
    </div>
  </header>;
}

function Footer({ downloadPage }) {
  return <footer className="site-footer">
    <div className="wrap footer-inner">
      <a className="footer-brand" href="/" aria-label="กลับหน้าแรก PTK ตารางเรียน"><img src="/ptk-icon.jpg" width="30" height="30" alt="" />PTK ตารางเรียน</a>
      <span>สำหรับนักเรียนโรงเรียนปทุมเทพวิทยาคาร</span>
      <nav className="footer-links" aria-label="ลิงก์ท้ายหน้า">
        {downloadPage ? <a className="footer-link" href="/">หน้าหลัก</a> : <a className="footer-link" href="/download">ดาวน์โหลด APK</a>}
      </nav>
    </div>
  </footer>;
}

function ScenePanel({ variant = "home" }) {
  const isDownload = variant === "download";
  return <figure className={`scene-figure scene-figure-${variant}`}>
    <div className="scene-panel" role="img" aria-label={isDownload ? "ภาพสามมิติประกอบการดาวน์โหลด PTK ตารางเรียน" : "ภาพสามมิติของโทรศัพท์แสดงตารางเรียน PTK"}>
      <div className="scene-glow" aria-hidden="true" />
      <PtkScene variant={variant} />
      <div className="scene-float scene-float-top" aria-hidden="true"><span className="scene-float-icon"><Icon name="scan" /></span><span><b>อ่านตารางได้หลายแบบ</b><small>OCR บนอุปกรณ์ · Gemini</small></span></div>
      <div className="scene-float scene-float-bottom" aria-hidden="true"><span className="scene-float-icon is-pink"><Icon name="bell" /></span><span><b>แจ้งเตือนตามที่เลือก</b><small>ตั้งได้ก่อนเริ่มหรือหมดคาบ</small></span></div>
      <span className="scene-asterisk scene-asterisk-one" aria-hidden="true">✳</span>
      <span className="scene-asterisk scene-asterisk-two" aria-hidden="true">✳</span>
    </div>
    <figcaption>ภาพประกอบสามมิติ · ไม่ใช่ภาพหน้าจอจริงของแอป</figcaption>
  </figure>;
}

const featureItems = [
  { icon: "scan", number: "01", title: "เลือกวิธีอ่านที่สบายใจ", text: "อ่านด้วย OCR บนอุปกรณ์ หรือเลือก Gemini ซึ่งจะส่งภาพไปยัง Google เพื่อประมวลผล" },
  { icon: "check", number: "02", title: "ตรวจและแก้ก่อนบันทึก", text: "ทบทวนชื่อวิชาและข้อมูลคาบที่อ่านได้ แล้วแก้ผลให้ถูกต้องก่อนจัดลงตาราง" },
  { icon: "bell", number: "03", title: "ตั้งเตือนเท่าที่ต้องการ", text: "เปิดหรือปิดการเตือนก่อนเริ่มคาบและก่อนหมดคาบได้แยกกัน" },
];

function HomePage() {
  return <>
    <Header downloadPage={false} />
    <main id="main">
      <section className="home-hero" aria-labelledby="hero-title">
        <div className="hero-shape hero-shape-one" aria-hidden="true" />
        <div className="hero-shape hero-shape-two" aria-hidden="true" />
        <div className="wrap hero-layout">
          <div className="hero-copy" data-reveal>
            <span className="eyebrow"><span className="eyebrow-dot" aria-hidden="true" />ผู้ช่วยจัดตารางเรียนสำหรับนักเรียน PTK</span>
            <h1 id="hero-title">ตารางเรียนชัดขึ้น<br /><span>พร้อมทุกคาบเรียน</span></h1>
            <p className="hero-lead">สแกนตารางเรียน ตรวจผลให้เรียบร้อย แล้วตั้งเตือนก่อนถึงคาบ — ในแอปเดียว</p>
            <div className="hero-actions">
              <a className="button button-primary button-large" href="/download">ดูรุ่นล่าสุดและดาวน์โหลด <Icon name="arrow" /></a>
              <a className="button button-outline button-large" href="#steps">ดูวิธีเริ่มต้น</a>
            </div>
            <div className="hero-note"><Icon name="shield" /><span>เลือก OCR บนอุปกรณ์เพื่อเก็บภาพไว้ในเครื่อง หรือเลือก Gemini ได้</span></div>
          </div>
          <div className="hero-art" data-reveal data-delay="1">
            <ScenePanel />
          </div>
        </div>
        <div className="wrap hero-feature-strip" aria-label="สามขั้นตอนหลัก">
          <span><i>01</i> สแกนตาราง</span><span className="strip-line" aria-hidden="true" /><span><i>02</i> ตรวจผล</span><span className="strip-line" aria-hidden="true" /><span><i>03</i> ตั้งเตือน</span>
        </div>
      </section>

      <section className="feature-section section-block" id="features" aria-labelledby="features-title">
        <div className="wrap">
          <div className="section-heading" data-reveal>
            <span className="section-kicker">จัดการเรื่องเรียนทีละขั้น</span>
            <h2 id="features-title">สแกนได้ แต่คุณยังเป็นคนตัดสินใจ</h2>
            <p>PTK ช่วยอ่านและจัดข้อมูลจากภาพตาราง แต่คุณตรวจแก้ก่อนบันทึกได้เสมอ</p>
          </div>
          <div className="feature-grid">
            {featureItems.map((item, index) => <article className="feature-card" data-reveal data-delay={index ? String(Math.min(index, 2)) : undefined} key={item.number}>
              <div className="feature-card-top"><span className={`feature-icon feature-icon-${index + 1}`}><Icon name={item.icon} /></span><span className="feature-number">{item.number}</span></div>
              <h3>{item.title}</h3><p>{item.text}</p>
            </article>)}
          </div>
          <div className="feature-footnote" data-reveal><span className="footnote-mark">i</span><p><strong>โปร่งใสเรื่องภาพ:</strong> OCR บนอุปกรณ์ระบุว่าภาพอยู่ในเครื่อง ส่วนการใช้ Gemini จะส่งภาพไปยัง Google</p></div>
        </div>
      </section>

      <section className="steps-section section-block" id="steps" aria-labelledby="steps-title">
        <div className="wrap steps-layout">
          <div className="steps-intro" data-reveal>
            <span className="section-kicker">เริ่มใช้งานง่าย ๆ</span>
            <h2 id="steps-title">จากภาพตาราง<br />สู่คาบที่พร้อม</h2>
            <p>เตรียมภาพที่เห็นวัน เวลา และเลขคาบชัดเจน จากนั้นตรวจข้อมูลก่อนเริ่มใช้ตาราง</p>
            <a className="text-link" href="/download">ดูวิธีติดตั้งและดาวน์โหลด <Icon name="arrow" /></a>
          </div>
          <ol className="steps-list">
            <li data-reveal><span className="step-index">1</span><div><h3>ติดตั้งและเลือกวิธีอ่าน</h3><p>ดาวน์โหลด APK แล้วเลือก OCR บนอุปกรณ์หรือ Gemini เมื่อเริ่มนำเข้าตาราง</p></div></li>
            <li data-reveal data-delay="1"><span className="step-index">2</span><div><h3>ครอปภาพและตรวจผล</h3><p>เลือกส่วนของตารางที่ต้องการ แล้วทบทวนหรือแก้ชื่อวิชาและข้อมูลคาบ</p></div></li>
            <li data-reveal data-delay="2"><span className="step-index">3</span><div><h3>เปิดการเตือนที่ต้องการ</h3><p>เลือกตัวเตือนก่อนเริ่มคาบหรือก่อนหมดคาบ และอนุญาตการแจ้งเตือนใน Android</p></div></li>
          </ol>
        </div>
      </section>

      <section className="home-cta" aria-labelledby="home-cta-title">
        <div className="wrap home-cta-inner" data-reveal>
          <div><span className="cta-kicker">พร้อมเริ่มจัดตารางแล้วหรือยัง?</span><h2 id="home-cta-title">เริ่มต้นด้วยเวอร์ชันล่าสุด</h2><p>ดูข้อมูล APK และขั้นตอนติดตั้งสำหรับ Android</p></div>
          <a className="button button-white button-large" href="/download">ไปหน้าดาวน์โหลด <Icon name="arrow" /></a>
        </div>
        <div className="cta-orb" aria-hidden="true" />
      </section>
    </main>
    <Footer downloadPage={false} />
  </>;
}

function useRelease() {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState({ status: "loading", release: null });

  useEffect(() => {
    const controller = new AbortController();
    let alive = true;
    const load = async () => {
      setResult({ status: "loading", release: null });
      try {
        const [latestResponse, detailsResponse] = await Promise.all([
          fetch("/api/releases/latest", { cache: "no-store", signal: controller.signal }),
          fetch("/api/release", { cache: "no-store", signal: controller.signal }).catch(() => null),
        ]);
        if (latestResponse.status === 404) {
          if (alive) setResult({ status: "not-found", release: null });
          return;
        }
        if (!latestResponse.ok) throw new Error(`Release request failed (${latestResponse.status}).`);
        const metadata = await latestResponse.json();
        const details = detailsResponse?.ok ? await detailsResponse.json() : null;
        const release = makeReleaseView(metadata, details, window.location.origin);
        if (alive) setResult({ status: "ready", release });
      } catch (error) {
        if (alive && error?.name !== "AbortError") {
          setResult({ status: "error", release: null });
          console.warn("Could not load the latest APK release details.", error);
        }
      }
    };
    load();
    return () => { alive = false; controller.abort(); };
  }, [attempt]);

  return { ...result, retry: () => setAttempt((value) => value + 1) };
}

function ReleaseStatus({ status }) {
  const labels = { loading: "กำลังตรวจสอบ", ready: "พร้อมดาวน์โหลด", "not-found": "ยังไม่มีรุ่นที่เผยแพร่", error: "โหลดข้อมูลไม่สำเร็จ" };
  return <span className={`status-pill is-${status === "ready" ? "available" : status === "loading" ? "loading" : "unavailable"}`} aria-live="polite">{labels[status]}</span>;
}

function ReleasePanel({ result, retry }) {
  const { status, release } = result;
  const unavailableMessage = status === "not-found"
    ? "ยังไม่มีข้อมูลรุ่นล่าสุดที่เผยแพร่ในขณะนี้"
    : "ไม่สามารถโหลดข้อมูลรุ่นล่าสุดได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง";
  return <article className="release-card" aria-labelledby="latest-title">
    <div className="release-main">
      <div className="release-header"><span className="release-label">ANDROID · ARM64</span><ReleaseStatus status={status} /></div>
      <div className="release-title-row">
        <img src="/app-icon.jpg" width="62" height="62" alt="" />
        <div><p className="release-overline">PTK STUDENT EDITION</p><h2 id="latest-title">PTK ตารางเรียน</h2><p className="release-subtitle">สำหรับนักเรียนปทุมเทพวิทยาคาร</p></div>
      </div>
      <div className="release-version"><span>เวอร์ชันล่าสุด</span><strong>{release?.version || "—"}</strong></div>
      <dl className="release-details">
        <div><dt>แพลตฟอร์ม</dt><dd>{release?.platform || "Android"}</dd></div>
        <div><dt>สถาปัตยกรรม</dt><dd>{release?.architecture || "ARM64"}</dd></div>
        <div><dt>ขนาดไฟล์</dt><dd>{release?.sizeText || "—"}</dd></div>
        <div><dt>วันที่เผยแพร่</dt><dd>{release?.dateText || "—"}</dd></div>
        <div className="release-filename"><dt>ชื่อไฟล์</dt><dd>{release?.fileName || "ไฟล์ APK รุ่นล่าสุด"}</dd></div>
      </dl>
      {status === "ready" ? <a className="button button-primary button-large download-action" href={latestDownloadPath}>
        <Icon name="download" />ดาวน์โหลดไฟล์ APK
      </a> : <div className={`release-message is-${status}`} role="status">
        <p>{status === "loading" ? "กำลังตรวจสอบข้อมูลรุ่นล่าสุด…" : unavailableMessage}</p>
        {status !== "loading" && <button className="retry-button" type="button" onClick={retry}><Icon name="retry" />ลองตรวจสอบอีกครั้ง</button>}
      </div>}
      <p className="download-trust"><Icon name="shield" />ดาวน์โหลดผ่านลิงก์รุ่นล่าสุดของ PTK</p>
    </div>
    <aside className="download-art" aria-label="ภาพประกอบแพ็กเกจ Android">
      <div className="download-art-head"><span className="download-art-dot" /><span>ANDROID PACKAGE</span></div>
      <ScenePanel variant="download" />
      <div className="package-mini"><span className="package-mini-mark"><Icon name="phone" /></span><span><b>PTK ตารางเรียน</b><small>ไฟล์ติดตั้ง · APK</small></span><span className="package-mini-check"><Icon name="check" /></span></div>
    </aside>
  </article>;
}

function DownloadPage() {
  const result = useRelease();
  return <>
    <Header downloadPage />
    <main id="main">
      <section className="download-hero" aria-labelledby="download-title">
        <div className="download-hero-shape" aria-hidden="true" />
        <div className="wrap download-hero-copy" data-reveal>
          <span className="eyebrow eyebrow-dark"><span className="eyebrow-dot" aria-hidden="true" />PTK · ANDROID APK</span>
          <h1 id="download-title">ดาวน์โหลด <span>PTK ตารางเรียน</span></h1>
          <p>ตรวจสอบเวอร์ชันล่าสุด ดาวน์โหลด APK แล้วเริ่มนำเข้าตารางเรียนของคุณ</p>
        </div>
      </section>
      <section className="release-section" aria-label="รายละเอียดรุ่นล่าสุด">
        <div className="wrap"><ReleasePanel result={result} retry={result.retry} />
          {result.status === "ready" && result.release?.releaseNotes && <article className="release-notes" aria-labelledby="release-notes-title">
            <h3 id="release-notes-title"><span className="notes-dot" />บันทึกการเปลี่ยนแปลง <span className="notes-version">รุ่น {result.release.version}</span></h3>
            <p>{result.release.releaseNotes}</p>
          </article>}
        </div>
      </section>
      <section className="install-section section-block" aria-labelledby="install-title">
        <div className="wrap">
          <div className="section-heading" data-reveal><span className="section-kicker">หลังดาวน์โหลด</span><h2 id="install-title">ติดตั้ง นำเข้าตาราง แล้วตั้งเตือน</h2><p>สามขั้นตอนสั้น ๆ สำหรับเริ่มใช้ PTK บน Android</p></div>
          <aside className="privacy-callout" data-reveal><span className="privacy-icon"><Icon name="shield" /></span><div><h3>เลือกวิธีอ่านภาพตามที่คุณสบายใจ</h3><p>OCR บนอุปกรณ์ระบุว่าภาพอยู่ในเครื่อง ส่วนการใช้ Gemini จะส่งภาพไปยัง Google เลือกตัวเลือกที่ต้องการก่อนสแกน</p></div></aside>
          <div className="install-grid">
            <article className="install-card" data-reveal><span className="install-index">01 <small>INSTALL</small></span><h3>ติดตั้งไฟล์ APK</h3><p>แตะปุ่มดาวน์โหลดด้านบน เปิดไฟล์ APK แล้วทำตามคำแนะนำของ Android</p></article>
            <article className="install-card" data-reveal data-delay="1"><span className="install-index">02 <small>IMPORT</small></span><h3>เลือก OCR และครอปภาพ</h3><p>เลือกวิธีอ่าน แล้วครอปส่วนที่มีเลขคาบ เวลา และวันเรียน</p></article>
            <article className="install-card" data-reveal data-delay="2"><span className="install-index">03 <small>REMINDERS</small></span><h3>ตรวจผลและตั้งเตือน</h3><p>แก้ข้อมูลวิชาและคาบ จากนั้นเปิดการเตือนที่ต้องการ</p></article>
          </div>
          <p className="install-note" data-reveal><strong>หมายเหตุ:</strong> Android อาจขออนุญาต Notifications และ Alarms &amp; reminders เพื่อให้ตัวเตือนทำงาน</p>
        </div>
      </section>
    </main>
    <Footer downloadPage />
  </>;
}

function usePageMotion() {
  useEffect(() => {
    const root = document.documentElement;
    const progress = document.getElementById("scroll-progress");
    const targets = Array.from(document.querySelectorAll("[data-reveal]"));
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let observer;
    let frame = 0;
    let lastY = window.scrollY;
    let direction = "down";

    const updateProgress = () => {
      frame = 0;
      const y = window.scrollY;
      if (Math.abs(y - lastY) > 1) direction = y > lastY ? "down" : "up";
      lastY = y;
      if (progress) {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        progress.style.width = `${max > 0 ? Math.min(100, Math.max(0, y / max * 100)) : 0}%`;
      }
    };
    const scheduleProgress = () => { if (!frame) frame = window.requestAnimationFrame(updateProgress); };
    const revealAll = () => targets.forEach((target) => target.classList.add("is-visible"));
    const start = () => {
      observer?.disconnect();
      if (reduced.matches || typeof window.IntersectionObserver !== "function") {
        root.classList.remove("motion-ready");
        revealAll();
        return;
      }
      root.classList.add("motion-ready");
      observer = new window.IntersectionObserver((entries) => {
        for (const entry of entries) {
          entry.target.style.setProperty("--reveal-shift", entry.isIntersecting ? (direction === "down" ? "20px" : "-20px") : (direction === "down" ? "-12px" : "12px"));
          entry.target.classList.toggle("is-visible", entry.isIntersecting);
        }
      }, { threshold: 0.08, rootMargin: "0px 0px -5% 0px" });
      targets.forEach((target) => observer.observe(target));
    };
    const onMotionChange = () => start();
    window.addEventListener("scroll", scheduleProgress, { passive: true });
    window.addEventListener("resize", scheduleProgress, { passive: true });
    reduced.addEventListener?.("change", onMotionChange);
    updateProgress();
    start();
    return () => {
      window.cancelAnimationFrame(frame);
      observer?.disconnect();
      root.classList.remove("motion-ready");
      window.removeEventListener("scroll", scheduleProgress);
      window.removeEventListener("resize", scheduleProgress);
      reduced.removeEventListener?.("change", onMotionChange);
    };
  }, []);
}

function App() {
  usePageMotion();
  const isDownload = isDownloadPath(window.location.pathname);
  useEffect(() => {
    document.title = isDownload ? "ดาวน์โหลด PTK ตารางเรียน · OCR และการแจ้งเตือน" : "PTK ตารางเรียน · สแกนตารางและตั้งเตือนคาบ";
    const description = document.querySelector('meta[name="description"]');
    if (description) description.content = isDownload
      ? "ดาวน์โหลด PTK ตารางเรียนสำหรับ Android พร้อมดูวิธีนำเข้าตาราง เลือก OCR แบบเก็บภาพไว้ในเครื่องหรือส่งให้ Gemini และตั้งการแจ้งเตือน"
      : "สแกนตารางเรียน PTK ด้วย OCR เลือกวิธีอ่านที่เหมาะกับคุณ ตรวจผลก่อนบันทึก แล้วตั้งการแจ้งเตือนเวลาเรียน";
  }, [isDownload]);
  return isDownload ? <DownloadPage /> : <HomePage />;
}

const mount = document.getElementById("app-root");
if (mount) createRoot(mount).render(<App />);
