import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

function roundedShape(width, height, radius) {
  const x = -width / 2;
  const y = -height / 2;
  const r = Math.min(radius, width / 2, height / 2);
  const shape = new THREE.Shape();
  shape.moveTo(x + r, y);
  shape.lineTo(x + width - r, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + r);
  shape.lineTo(x + width, y + height - r);
  shape.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  shape.lineTo(x + r, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);
  return shape;
}

function panel(width, height, depth, color, radius = 0.12, options = {}) {
  const geometry = new THREE.ExtrudeGeometry(roundedShape(width, height, radius), {
    depth,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: Math.min(0.025, depth / 4),
    bevelThickness: Math.min(0.025, depth / 4),
    curveSegments: 5,
  });
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: options.roughness ?? 0.42,
    metalness: options.metalness ?? 0.02,
    emissive: options.emissive ?? 0x000000,
    emissiveIntensity: options.emissiveIntensity ?? 0,
  });
  return new THREE.Mesh(geometry, material);
}

function bar(width, height, color, x, y, z, parent, radius = 0.04) {
  const mesh = panel(width, height, 0.035, color, radius, { roughness: 0.55 });
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}

function makeTimetableTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 616;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const roundedRect = (x, y, width, height, radius, color) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
  };
  roundedRect(0, 0, 512, 616, 22, "#f7f9ff");
  roundedRect(0, 0, 512, 150, 22, "#2857d8");
  ctx.fillStyle = "#dce7ff";
  ctx.font = "600 17px Tahoma, sans-serif";
  ctx.fillText("PTK  /  MY TIMETABLE", 29, 39);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 29px Tahoma, sans-serif";
  ctx.fillText("ตารางเรียนของฉัน", 29, 82);
  ctx.fillStyle = "#dce7ff";
  ctx.font = "17px Tahoma, sans-serif";
  ctx.fillText("สัปดาห์นี้", 30, 114);
  roundedRect(28, 175, 456, 51, 13, "#ffffff");
  ctx.fillStyle = "#62708c";
  ctx.font = "bold 14px Tahoma, sans-serif";
  const days = ["จ", "อ", "พ", "พฤ", "ศ"];
  days.forEach((day, index) => ctx.fillText(day, 69 + index * 83, 207));
  const colors = ["#dbe7ff", "#ffe3ef", "#e2f2e8", "#fff1d5"];
  for (let row = 0; row < 4; row += 1) {
    for (let column = 0; column < 5; column += 1) {
      const x = 37 + column * 88;
      const y = 245 + row * 72;
      const color = colors[(column + row) % colors.length];
      roundedRect(x, y, 74, 59, 10, color);
      roundedRect(x + 10, y + 13, 47, 5, 2.5, "#ffffff");
      roundedRect(x + 10, y + 26, 30, 4, 2, "#ffffff");
      roundedRect(x + 10, y + 38, 37, 4, 2, "#ffffff");
    }
  }
  roundedRect(161, 574, 190, 6, 3, "#c0cadd");
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function disposeObject(object) {
  object.traverse((child) => {
    child.geometry?.dispose?.();
    const materials = Array.isArray(child.material) ? child.material : child.material ? [child.material] : [];
    materials.forEach((material) => {
      for (const value of Object.values(material)) if (value?.isTexture) value.dispose();
      material.dispose();
    });
  });
}

function makePhone(parent) {
  const phone = new THREE.Group();
  phone.position.set(0.16, -0.04, 0);
  phone.rotation.set(-0.08, -0.13, -0.075);
  parent.add(phone);

  const frame = panel(2.05, 3.65, 0.18, 0x132652, 0.25, { roughness: 0.28, metalness: 0.13 });
  phone.add(frame);
  const screen = panel(1.83, 3.42, 0.055, 0xf8faff, 0.18, { roughness: 0.72 });
  screen.position.z = 0.19;
  phone.add(screen);

  const header = panel(1.73, 0.61, 0.035, 0x244fb5, 0.13);
  header.position.set(0, 1.29, 0.255);
  phone.add(header);
  const headerAccent = panel(0.56, 0.095, 0.025, 0xffc0d8, 0.045);
  headerAccent.position.set(-0.45, 1.31, 0.3);
  phone.add(headerAccent);
  const headerLine = panel(0.72, 0.065, 0.02, 0xffffff, 0.03);
  headerLine.position.set(-0.36, 1.13, 0.3);
  phone.add(headerLine);

  const dayXs = [-0.58, 0, 0.58];
  const classYs = [0.63, 0.1, -0.43, -0.96];
  for (let row = 0; row < classYs.length; row += 1) {
    const guide = bar(1.55, 0.035, 0xdce4f1, 0, classYs[row] - 0.23, 0.263, phone, 0.017);
    guide.material.transparent = true;
    guide.material.opacity = 0.84;
    for (let col = 0; col < dayXs.length; col += 1) {
      const active = (row + col) % 3 !== 1 || row === 2;
      if (!active) continue;
      const colors = [0x88a9ef, 0xf2a7c9, 0x9fcfb5, 0xf3ce82];
      const block = panel(0.39, 0.36, 0.035, colors[(row + col) % colors.length], 0.07);
      block.position.set(dayXs[col], classYs[row], 0.275);
      phone.add(block);
      const note = panel(0.22, 0.045, 0.018, 0xffffff, 0.02);
      note.position.set(dayXs[col], classYs[row] + 0.055, 0.315);
      phone.add(note);
    }
  }

  const cameraDot = new THREE.Mesh(
    new THREE.CircleGeometry(0.043, 20),
    new THREE.MeshStandardMaterial({ color: 0x46608f, roughness: 0.35 }),
  );
  cameraDot.position.set(0, 1.65, 0.29);
  phone.add(cameraDot);

  const navPill = panel(0.42, 0.055, 0.025, 0x8795ac, 0.025);
  navPill.position.set(0, -1.59, 0.29);
  phone.add(navPill);
  return phone;
}

function makeFloatingCard(parent, { x, y, z, color, tilt, width = 0.82, height = 0.72 }) {
  const card = new THREE.Group();
  card.position.set(x, y, z);
  card.rotation.z = tilt;
  parent.add(card);
  card.add(panel(width, height, 0.08, 0xffffff, 0.15, { roughness: 0.38 }));
  const swatch = panel(0.25, 0.25, 0.035, color, 0.075);
  swatch.position.set(-width * 0.26, height * 0.17, 0.11);
  card.add(swatch);
  const lineA = panel(width * 0.34, 0.055, 0.02, 0x9aa8c0, 0.025);
  lineA.position.set(width * 0.2, height * 0.2, 0.11);
  card.add(lineA);
  const lineB = panel(width * 0.56, 0.045, 0.02, 0xd4dbe7, 0.02);
  lineB.position.set(0.02, -height * 0.2, 0.11);
  card.add(lineB);
  return card;
}

function createScene(container, variant) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
  } catch (error) {
    container.dataset.sceneFallback = "true";
    return () => {};
  }

  const canvas = renderer.domElement;
  canvas.setAttribute("aria-hidden", "true");
  canvas.className = "ptk-scene-canvas";
  container.appendChild(canvas);
  let contextLost = false;
  const onContextLost = (event) => {
    event.preventDefault();
    contextLost = true;
    container.dataset.sceneFallback = "true";
    delete container.dataset.sceneReady;
    window.cancelAnimationFrame(raf);
    raf = 0;
    canvas.remove();
  };
  canvas.addEventListener("webglcontextlost", onContextLost, false);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 40);
  camera.position.set(0, 0, 8.4);
  const composition = new THREE.Group();
  composition.scale.setScalar(variant === "download" ? 0.82 : 1);
  scene.add(composition);

  scene.add(new THREE.HemisphereLight(0xf2f6ff, 0x203c78, 2.0));
  const key = new THREE.DirectionalLight(0xffffff, 3.1);
  key.position.set(-3.5, 5, 7);
  scene.add(key);
  const rim = new THREE.PointLight(0xff8fbe, 34, 12, 2);
  rim.position.set(3, 0.5, 4);
  scene.add(rim);

  const phone = new THREE.Group();
  phone.position.set(0.16, -0.04, 0);
  phone.rotation.set(-0.04, -0.17, -0.065);
  composition.add(phone);
  const cardA = makeFloatingCard(composition, { x: -1.58, y: 0.93, z: 0.2, color: 0xffc0d8, tilt: -0.16, width: 0.78, height: 0.69 });
  const cardB = makeFloatingCard(composition, { x: 1.65, y: -1.05, z: 0.42, color: 0x9bb7f1, tilt: 0.12, width: 0.75, height: 0.67 });
  const orbit = new THREE.Mesh(
    new THREE.TorusGeometry(2.26, 0.012, 5, 160),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.42 }),
  );
  orbit.rotation.set(1.22, 0.05, -0.18);
  orbit.position.z = -3;
  composition.add(orbit);
  const orbitAccent = new THREE.Mesh(
    new THREE.TorusGeometry(2.46, 0.008, 5, 160),
    new THREE.MeshBasicMaterial({ color: 0xff9ac5, transparent: true, opacity: 0.58 }),
  );
  orbitAccent.rotation.set(0.2, 1.15, 0.72);
  orbitAccent.position.z = -3;
  composition.add(orbitAccent);

  const dots = [];
  for (const [x, y, color, radius] of [
    [-2.08, -0.36, 0xffb2d1, 0.095],
    [2.03, 0.81, 0x9bb7f1, 0.085],
    [-1.28, -1.65, 0xffffff, 0.06],
    [1.18, 1.71, 0xffd27f, 0.055],
  ]) {
    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 18, 14),
      new THREE.MeshStandardMaterial({ color, roughness: 0.28, metalness: 0.04 }),
    );
    dot.position.set(x, y, 0.58);
    composition.add(dot);
    dots.push(dot);
  }

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
  const onPointerMove = (event) => {
    if (reducedMotion.matches) return;
    const bounds = container.getBoundingClientRect();
    pointer.targetY = ((event.clientX - bounds.left) / Math.max(bounds.width, 1) - 0.5) * 0.11;
    pointer.targetX = ((event.clientY - bounds.top) / Math.max(bounds.height, 1) - 0.5) * -0.08;
  };
  const onPointerLeave = () => { pointer.targetX = 0; pointer.targetY = 0; };
  container.addEventListener("pointermove", onPointerMove, { passive: true });
  container.addEventListener("pointerleave", onPointerLeave, { passive: true });

  let width = 0;
  let height = 0;
  let raf = 0;
  let active = true;
  let visible = true;
  let lastFrameTime = -Infinity;
  const modelLoader = new GLTFLoader();
  modelLoader.load("/models/ptk-phone.glb", (gltf) => {
    if (!active || contextLost) {
      disposeObject(gltf.scene);
      return;
    }
    const model = gltf.scene;
    // GLTFLoader sanitizes names with spaces, so use the scene's authored root.
    const modelRoot = model.children[0];
    const texture = makeTimetableTexture();
    if (!modelRoot || !texture) {
      disposeObject(model);
      texture?.dispose();
      container.dataset.sceneFallback = "true";
      return;
    }
    const originalScreen = model.getObjectByName("Main_flexible_display");
    if (originalScreen) originalScreen.visible = false;
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.1235, 0.1483),
      new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthTest: false, depthWrite: false, toneMapped: false }),
    );
    screen.position.set(0, 0, -0.00022);
    screen.renderOrder = 2;
    modelRoot.add(screen);
    const bounds = new THREE.Box3().setFromObject(model);
    const center = bounds.getCenter(new THREE.Vector3());
    const size = bounds.getSize(new THREE.Vector3());
    if (!size.y) {
      disposeObject(model);
      container.dataset.sceneFallback = "true";
      return;
    }
    const normalized = new THREE.Group();
    model.position.sub(center);
    normalized.scale.setScalar(3.7 / size.y);
    normalized.add(model);
    phone.add(normalized);
    container.dataset.sceneReady = "true";
    container.dataset.phoneModel = "loaded";
    if (visible && document.visibilityState !== "hidden") renderer.render(scene, camera);
  }, undefined, () => {
    if (active) container.dataset.sceneFallback = "true";
  });
  const resize = () => {
    if (contextLost) return;
    const box = container.getBoundingClientRect();
    const nextWidth = Math.max(1, Math.round(box.width));
    const nextHeight = Math.max(1, Math.round(box.height));
    if (nextWidth === width && nextHeight === height) return;
    width = nextWidth;
    height = nextHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.position.z = width < 420 ? 9.3 : (width < 700 ? 8.9 : 8.4);
    camera.updateProjectionMatrix();
    if (reducedMotion.matches) renderer.render(scene, camera);
  };
  const resizeObserver = typeof window.ResizeObserver === "function"
    ? new window.ResizeObserver(resize)
    : null;
  const onWindowResize = () => resize();
  if (resizeObserver) resizeObserver.observe(container);
  else window.addEventListener("resize", onWindowResize, { passive: true });
  resize();

  const visibilityObserver = typeof window.IntersectionObserver === "function"
    ? new window.IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) {
        window.cancelAnimationFrame(raf);
        raf = 0;
        draw(performance.now());
      }
    }, { threshold: 0 })
    : null;
  if (visibilityObserver) visibilityObserver.observe(container);
  const onDocumentVisibility = () => {
    window.cancelAnimationFrame(raf);
    raf = 0;
    if (contextLost) return;
    if (document.visibilityState === "hidden") return;
    if (visible && !reducedMotion.matches) raf = window.requestAnimationFrame(draw);
    else if (visible) renderer.render(scene, camera);
  };
  document.addEventListener("visibilitychange", onDocumentVisibility);

  const draw = (time) => {
    raf = 0;
    if (!active || contextLost) return;
    resize();
    if (visible && document.visibilityState !== "hidden") {
      if (reducedMotion.matches || time - lastFrameTime >= 1000 / 30) {
        if (!reducedMotion.matches) {
          const seconds = time * 0.001;
          pointer.x += (pointer.targetX - pointer.x) * 0.035;
          pointer.y += (pointer.targetY - pointer.y) * 0.035;
          composition.rotation.x = pointer.x + Math.sin(seconds * 0.45) * 0.018;
          composition.rotation.y = pointer.y + Math.sin(seconds * 0.34) * 0.028;
          phone.position.y = -0.04 + Math.sin(seconds * 0.85) * 0.045;
          cardA.position.y = 0.93 + Math.sin(seconds * 0.72 + 1) * 0.06;
          cardB.position.y = -1.05 + Math.sin(seconds * 0.62 + 2) * 0.055;
          dots.forEach((dot, index) => { dot.position.z = 0.58 + Math.sin(seconds * 0.8 + index) * 0.045; });
          orbit.rotation.z = -0.18 + Math.sin(seconds * 0.12) * 0.04;
        }
        lastFrameTime = time;
        renderer.render(scene, camera);
      }
    }
    if (!reducedMotion.matches && visible && document.visibilityState !== "hidden") {
      raf = window.requestAnimationFrame(draw);
    }
  };
  draw(performance.now());

  const onMotionPreference = () => {
    window.cancelAnimationFrame(raf);
    raf = 0;
    if (contextLost) return;
    if (reducedMotion.matches) {
      composition.rotation.set(0, 0, 0);
      phone.position.y = -0.04;
      cardA.position.y = 0.93;
      cardB.position.y = -1.05;
      renderer.render(scene, camera);
    } else if (visible && document.visibilityState !== "hidden") {
      raf = window.requestAnimationFrame(draw);
    }
  };
  reducedMotion.addEventListener?.("change", onMotionPreference);

  return () => {
    active = false;
    window.cancelAnimationFrame(raf);
    canvas.removeEventListener("webglcontextlost", onContextLost);
    reducedMotion.removeEventListener?.("change", onMotionPreference);
    document.removeEventListener("visibilitychange", onDocumentVisibility);
    if (resizeObserver) resizeObserver.disconnect();
    else window.removeEventListener("resize", onWindowResize);
    visibilityObserver?.disconnect();
    container.removeEventListener("pointermove", onPointerMove);
    container.removeEventListener("pointerleave", onPointerLeave);
    disposeObject(scene);
    renderer.dispose();
    delete container.dataset.sceneReady;
    canvas.remove();
  };
}

export default function PtkScene({ variant = "home" }) {
  const stageRef = useRef(null);

  useEffect(() => {
    const stage = stageRef.current;
    return stage ? createScene(stage, variant) : undefined;
  }, [variant]);

  return <div ref={stageRef} className="ptk-three-stage" aria-hidden="true">
    <div className="scene-fallback">
      <div className="scene-fallback-orbit" />
      <div className="fallback-phone">
        <div className="fallback-screen-head">สัปดาห์นี้</div>
        <div className="fallback-days"><i /><i /><i /><i /></div>
        <div className="fallback-grid">{Array.from({ length: 12 }, (_, index) => <i key={index} />)}</div>
        <div className="fallback-home" />
      </div>
    </div>
  </div>;
}
