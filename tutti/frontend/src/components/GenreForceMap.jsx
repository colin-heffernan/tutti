import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide } from "d3-force";
import THEME from "../theme";

//colors
const GENRE_PALETTE = [
  "#7c6ff7", "#f87171", "#4ade80", "#fbbf24", "#60a5fa",
  "#f472b6", "#34d399", "#fb923c", "#a78bfa", "#38bdf8",
  "#e879f9", "#86efac", "#fcd34d", "#93c5fd", "#f9a8d4",
  "#6ee7b7", "#fdba74", "#c4b5fd", "#7dd3fc", "#d8b4fe",
  "#bbf7d0", "#fde68a", "#bfdbfe", "#fbcfe8", "#a5f3fc",
];

const TOP_N = 20;
const CANVAS_HEIGHT = 420;

function GenreForceMap({ profile, overlaps }) {
  const mountRef = useRef(null);
  const tooltipRef = useRef(null);
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, genre: "", pct: 0 });

  useEffect(() => {
    if (!profile || profile.length === 0) return;

    const topGenres = profile.slice(0, TOP_N);
    const genreSet = new Set(topGenres.map(([g]) => g));
    const colorMap = {};
    topGenres.forEach(([genre], i) => {
      colorMap[genre] = GENRE_PALETTE[i % GENRE_PALETTE.length];
    });

    // Build nodes
    const nodes = topGenres.map(([genre, pct]) => ({
      id: genre,
      pct,
    }));

    // links from overlaps
    const links = [];
    for (const [genre1, related] of Object.entries(overlaps)) {
      if (!genreSet.has(genre1)) continue;
      for (const [genre2, count] of Object.entries(related)) {
        if (!genreSet.has(genre2)) continue;
        links.push({ source: genre1, target: genre2, strength: count });
      }
    }

    // Three.js setup 
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = CANVAS_HEIGHT;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 2000);
    camera.position.set(0, 0, 280);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.minDistance = 80;
    controls.maxDistance = 600;

    // directional light
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(100, 100, 100);
    scene.add(dirLight);

    //Three.js objects
    const nodeMeshes = {};
    const nodeGroup = new THREE.Group();

    const maxPct = topGenres[0][1];

    topGenres.forEach(([genre, pct]) => {
      const radius = 3 + Math.pow(pct / maxPct, 1.8) * 22;
      const geo = new THREE.SphereGeometry(radius, 32, 32);
      const color = new THREE.Color(colorMap[genre]);
      const mat = new THREE.MeshPhongMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.2,
        shininess: 60,
        transparent: true,
        opacity: 0.92,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.userData = { genre, pct, baseColor: color.clone(), radius };
      nodeMeshes[genre] = mesh;
      nodeGroup.add(mesh);
    });
    scene.add(nodeGroup);

    // Link lines
    const linkGroup = new THREE.Group();
    scene.add(linkGroup);

    // node positions 
    nodes.forEach((node) => {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 80 + Math.random() * 60;
      node.x = r * Math.sin(phi) * Math.cos(theta);
      node.y = r * Math.sin(phi) * Math.sin(theta);
      node.z = r * Math.cos(phi);
      node.vx = 0; node.vy = 0; node.vz = 0;
    });

    const nodeById = {};
    nodes.forEach((n) => (nodeById[n.id] = n));

    const resolvedLinks = links.map((l) => ({
      source: nodeById[l.source] || l.source,
      target: nodeById[l.target] || l.target,
      strength: l.strength,
    })).filter((l) => l.source && l.target && typeof l.source === "object" && typeof l.target === "object");

    const REPULSION = 5500;
    const LINK_STRENGTH = 0.04;
    const CENTER_PULL = 0.008;
    const DAMPING = 0.88;
    const MAX_ITER = 300;

    let iter = 0;
    let simDone = false;

    const runSimStep = () => {
      if (iter >= MAX_ITER) { simDone = true; return; }
      iter++;

      // Repulsio
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
          const distSq = dx * dx + dy * dy + dz * dz + 0.01;
          const dist = Math.sqrt(distSq);
          const force = REPULSION / distSq;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          const fz = (dz / dist) * force;
          a.vx -= fx; a.vy -= fy; a.vz -= fz;
          b.vx += fx; b.vy += fy; b.vz += fz;
        }
      }

      //attraction
      for (const link of resolvedLinks) {
        const { source: a, target: b, strength } = link;
        const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) + 0.01;
        const desiredDist = 120 + 180 / (strength + 1);
        const delta = (dist - desiredDist) / dist * LINK_STRENGTH * strength;
        a.vx += dx * delta; a.vy += dy * delta; a.vz += dz * delta;
        b.vx -= dx * delta; b.vy -= dy * delta; b.vz -= dz * delta;
      }

      // Center
      for (const node of nodes) {
        node.vx -= node.x * CENTER_PULL;
        node.vy -= node.y * CENTER_PULL;
        node.vz -= node.z * CENTER_PULL;
      }

      for (const node of nodes) {
        node.vx *= DAMPING; node.vy *= DAMPING; node.vz *= DAMPING;
        node.x += node.vx; node.y += node.vy; node.z += node.vz;
      }
    };

    for (let i = 0; i < 150; i++) runSimStep();

    const applyPositions = () => {
      for (const [genre, mesh] of Object.entries(nodeMeshes)) {
        const node = nodeById[genre];
        if (node) mesh.position.set(node.x, node.y, node.z);
      }
    };

    // Build link lines
    const buildLinks = () => {
      while (linkGroup.children.length) linkGroup.remove(linkGroup.children[0]);
      for (const link of resolvedLinks) {
        const { source: a, target: b, strength } = link;
        const points = [
          new THREE.Vector3(a.x, a.y, a.z),
          new THREE.Vector3(b.x, b.y, b.z),
        ];
        const geo = new THREE.BufferGeometry().setFromPoints(points);
        const opacity = Math.min(0.15 + strength * 0.1, 0.55);
        const mat = new THREE.LineBasicMaterial({
          color: 0x9d9daa,
          transparent: true,
          opacity,
        });
        linkGroup.add(new THREE.Line(geo, mat));
      }
    };

    applyPositions();
    buildLinks();

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let hoveredMesh = null;

    const onMouseMove = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const meshes = Object.values(nodeMeshes);
      const intersects = raycaster.intersectObjects(meshes);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        if (hoveredMesh !== hit) {
          if (hoveredMesh) {
            hoveredMesh.material.emissiveIntensity = 0.2;
            hoveredMesh.scale.setScalar(1);
          }
          hoveredMesh = hit;
          hoveredMesh.material.emissiveIntensity = 0.7;
          hoveredMesh.scale.setScalar(1.18);
        }
        const { genre, pct } = hit.userData;
        setTooltip({
          visible: true,
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
          genre,
          pct,
        });
        renderer.domElement.style.cursor = "pointer";
      } else {
        if (hoveredMesh) {
          hoveredMesh.material.emissiveIntensity = 0.2;
          hoveredMesh.scale.setScalar(1);
          hoveredMesh = null;
        }
        setTooltip((t) => ({ ...t, visible: false }));
        renderer.domElement.style.cursor = "default";
      }
    };

    renderer.domElement.addEventListener("mousemove", onMouseMove);

    //Animation loop
    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (!simDone) {
        runSimStep();
        applyPositions();
        buildLinks();
      }
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    //Resize
    const resizeObserver = new ResizeObserver(() => {
      const w = container.clientWidth;
      camera.aspect = w / CANVAS_HEIGHT;
      camera.updateProjectionMatrix();
      renderer.setSize(w, CANVAS_HEIGHT);
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener("mousemove", onMouseMove);
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [profile, overlaps]);

  return (
    <div style={{ position: "relative", width: "100%", marginBottom: 40 }}>
      <h2 style={{
        fontFamily: THEME.fontDisplay, fontSize: 20, fontWeight: 700,
        color: THEME.textPrimary, marginBottom: 12, textAlign: "left",
      }}>
        Your Genre Map
      </h2>
      <div
        ref={mountRef}
        style={{
          width: "100%", height: CANVAS_HEIGHT,
          borderRadius: THEME.radius.lg,
          background: THEME.bgCard,
          border: `1px solid ${THEME.border}`,
          overflow: "hidden",
          position: "relative",
        }}
      />
      {tooltip.visible && (
        <div
          ref={tooltipRef}
          style={{
            position: "absolute",
            left: tooltip.x + 14,
            top: tooltip.y - 10,
            pointerEvents: "none",
            background: THEME.bgElevated,
            border: `1px solid ${THEME.border}`,
            borderRadius: THEME.radius.md,
            padding: "8px 14px",
            fontFamily: THEME.fontBody,
            fontSize: 13,
            color: THEME.textPrimary,
            boxShadow: THEME.shadow.md,
            whiteSpace: "nowrap",
            zIndex: 10,
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 2 }}>{tooltip.genre}</div>
          <div style={{ color: THEME.textSecondary }}>{tooltip.pct.toFixed(1)}% of your listening</div>
        </div>
      )}
    </div>
  );
}

export default GenreForceMap;
