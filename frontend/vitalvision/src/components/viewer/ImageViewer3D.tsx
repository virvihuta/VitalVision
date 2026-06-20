import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RotateCcw, Box, Maximize2, Minimize2 } from "lucide-react";
import { useLanguage } from "../../hooks/useLanguage";
import { t } from "../../i18n";

interface ImageViewer3DProps {
  imageDataUrl: string;
  height?: number;
}

export const ImageViewer3D: React.FC<ImageViewer3DProps> = ({ imageDataUrl, height = 400 }) => {
  const { lang } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);

  const [brightness, setBrightness] = useState(1.0);
  const [contrast, setContrast] = useState(1.2);
  const [is3D, setIs3D] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // rotation state
  const rotation = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!mountRef.current || !imageDataUrl) return;

    const mount = mountRef.current;
    const width = mount.clientWidth;
    const initialHeight = mount.clientHeight || height;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#070D1A");
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / initialHeight, 0.1, 1000);
    camera.position.z = 3;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, initialHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const loader = new THREE.TextureLoader();
    loader.load(imageDataUrl, (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      const aspect = texture.image.width / texture.image.height;
      const planeWidth = 2.4;
      const planeHeight = planeWidth / aspect;

      const material = new THREE.ShaderMaterial({
        uniforms: {
          uTexture: { value: texture },
          uBrightness: { value: 1.0 },
          uContrast: { value: 1.2 },
          uDisplacement: { value: 0.25 },
        },
        vertexShader: `
          uniform sampler2D uTexture;
          uniform float uDisplacement;
          varying vec2 vUv;
          void main() {
            vUv = uv;
            vec4 color = texture2D(uTexture, uv);
            float luminance = dot(color.rgb, vec3(0.299, 0.587, 0.114));
            vec3 displaced = position + normal * luminance * uDisplacement;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
          }
        `,
        fragmentShader: `
          uniform sampler2D uTexture;
          uniform float uBrightness;
          uniform float uContrast;
          varying vec2 vUv;
          void main() {
            vec4 color = texture2D(uTexture, vUv);
            color.rgb = (color.rgb - 0.5) * uContrast + 0.5;
            color.rgb *= uBrightness;
            gl_FragColor = color;
          }
        `,
      });
      materialRef.current = material;

      const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight, 128, 128);
      const mesh = new THREE.Mesh(geometry, material);
      meshRef.current = mesh;
      scene.add(mesh);
    });

    let frame: number;
    const animate = () => {
      if (meshRef.current) {
        meshRef.current.rotation.x = rotation.current.x;
        meshRef.current.rotation.y = rotation.current.y;
      }
      renderer.render(scene, camera);
      frame = requestAnimationFrame(animate);
    };
    animate();

    const onDown = (e: PointerEvent) => {
      isDragging.current = true;
      lastPointer.current = { x: e.clientX, y: e.clientY };
    };
    const onMove = (e: PointerEvent) => {
      if (!isDragging.current) return;
      const dx = e.clientX - lastPointer.current.x;
      const dy = e.clientY - lastPointer.current.y;
      rotation.current.y += dx * 0.01;
      rotation.current.x += dy * 0.01;
      rotation.current.x = Math.max(-1, Math.min(1, rotation.current.x));
      lastPointer.current = { x: e.clientX, y: e.clientY };
    };
    const onUp = () => { isDragging.current = false; };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      camera.position.z = Math.max(1.5, Math.min(6, camera.position.z + e.deltaY * 0.002));
    };

    renderer.domElement.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    renderer.domElement.addEventListener("wheel", onWheel, { passive: false });

    const resize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight || height;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", resize);
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    return () => {
      cancelAnimationFrame(frame);
      renderer.domElement.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      renderer.domElement.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", resize);
      ro.disconnect();
      mount.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [imageDataUrl, height]);

  useEffect(() => {
    const onChange = () => {
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen().catch(() => {});
    }
  };

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uBrightness.value = brightness;
      materialRef.current.uniforms.uContrast.value = contrast;
      materialRef.current.uniforms.uDisplacement.value = is3D ? 0.25 : 0;
    }
  }, [brightness, contrast, is3D]);

  const reset = () => {
    rotation.current = { x: 0, y: 0 };
    setBrightness(1.0);
    setContrast(1.2);
    if (cameraRef.current) cameraRef.current.position.z = 3;
  };

  return (
    <div
      ref={containerRef}
      className={`bg-navy-800 border border-navy-600 overflow-hidden ${
        isFullscreen ? "w-screen h-screen flex flex-col rounded-none" : "rounded-xl"
      }`}
    >
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-navy-700">
        <div className="flex items-center gap-2">
          <Box size={14} className="text-clinical-blue" />
          <p className="text-xs font-medium text-slate-300">{t("viewerTitle", lang)}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIs3D(!is3D)}
            className={`text-xs px-2 py-1 rounded transition-colors ${
              is3D ? "bg-clinical-blue text-white" : "bg-navy-700 text-slate-400 hover:text-slate-200"
            }`}
          >
            3D
          </button>
          <button
            onClick={reset}
            className="text-slate-500 hover:text-slate-300 transition-colors"
            title={t("resetView", lang)}
          >
            <RotateCcw size={13} />
          </button>
          <button
            onClick={toggleFullscreen}
            className="text-slate-500 hover:text-slate-300 transition-colors"
            title={isFullscreen ? t("exitFullscreen", lang) : t("fullscreen", lang)}
          >
            {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
        </div>
      </div>

      <div
        ref={mountRef}
        className={isFullscreen ? "flex-1" : ""}
        style={{
          height: isFullscreen ? undefined : height,
          cursor: is3D ? "grab" : "default",
        }}
      />

      <div className="px-4 py-3 border-t border-navy-700 grid grid-cols-2 gap-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-slate-400">{t("brightness", lang)}</label>
            <span className="text-xs font-mono text-slate-500">{brightness.toFixed(2)}</span>
          </div>
          <input
            type="range" min="0.3" max="2" step="0.05"
            value={brightness}
            onChange={(e) => setBrightness(parseFloat(e.target.value))}
            className="w-full accent-clinical-blue"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-slate-400">{t("contrast", lang)}</label>
            <span className="text-xs font-mono text-slate-500">{contrast.toFixed(2)}</span>
          </div>
          <input
            type="range" min="0.5" max="3" step="0.05"
            value={contrast}
            onChange={(e) => setContrast(parseFloat(e.target.value))}
            className="w-full accent-clinical-blue"
          />
        </div>
      </div>

      <p className="text-xs text-slate-600 text-center py-2 border-t border-navy-700">
        {t("dragToRotate", lang)}
      </p>
    </div>
  );
};