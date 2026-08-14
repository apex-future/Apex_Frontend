import React, { useEffect, useMemo, useRef } from 'react';
import './DepthText.css';

const MAX_LAYERS = 64;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const getLayerColor = (faceColor, depthColor, index, total) => {
  const progress = total <= 1 ? 1 : index / total;
  const eased = progress * progress;
  const faceMix = Math.round((1 - eased) * 72 + 4);
  return `color-mix(in srgb, ${faceColor} ${faceMix}%, ${depthColor})`;
};

const getTransform = (rotateX, rotateY) => `rotateX(${rotateX.toFixed(3)}deg) rotateY(${rotateY.toFixed(3)}deg)`;

const DepthText = ({
  text = 'Elevate',
  layers = 16,
  depth = 1.8,
  faceColor = '#FFFFFF',
  depthColor = '#7C3AED',
  tilt = 7.5,
  pointerTracking = true,
  smoothing = 0.14,
  perspective = 900,
  autoOrbit = false,
  orbitSpeed = 0.35,
  fontSize = 'clamp(1.5rem, 5vw, 2.25rem)',
  fontWeight = 900,
  shadow = true,
  className = '',
  style = {}
}) => {
  const rootRef = useRef(null);
  const stageRef = useRef(null);

  const safeLayers = clamp(Math.round(Number(layers) || 1), 2, MAX_LAYERS);
  const safeDepth = clamp(Number(depth) || 0, 0, 12);
  const safeTilt = clamp(Number(tilt) || 0, 0, 12);
  const safeSmoothing = clamp(Number(smoothing) || 0.14, 0.02, 0.35);
  const safePerspective = clamp(Number(perspective) || 900, 300, 2000);
  const safeOrbitSpeed = clamp(Number(orbitSpeed) || 0, 0, 2);

  const baseRotation = useMemo(() => ({ x: -safeTilt * 0.32, y: safeTilt * 0.42 }), [safeTilt]);

  const depthLayers = useMemo(
    () =>
      Array.from({ length: safeLayers }, (_, layerIndex) => {
        const index = safeLayers - layerIndex;
        return {
          index,
          color: getLayerColor(faceColor, depthColor, index, safeLayers),
          transform: `translateZ(${-index * safeDepth}px)`
        };
      }),
    [safeLayers, safeDepth, faceColor, depthColor]
  );

  useEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    if (!root || !stage || typeof window === 'undefined') return undefined;

    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      stage.style.transform = getTransform(baseRotation.x, baseRotation.y);
      return undefined;
    }

    let frameId = 0;
    let isHovered = false;
    const current = { ...baseRotation };
    const target = { ...baseRotation };

    const applyTransform = () => {
      if (stage) {
        stage.style.transform = getTransform(current.x, current.y);
      }
    };

    const startLoop = () => {
      if (!frameId) {
        frameId = requestAnimationFrame(tick);
      }
    };

    const tick = () => {
      current.x += (target.x - current.x) * safeSmoothing;
      current.y += (target.y - current.y) * safeSmoothing;
      applyTransform();

      const dx = Math.abs(target.x - current.x);
      const dy = Math.abs(target.y - current.y);

      // Keep animating while hovered or while easing back to base position
      if (isHovered || dx > 0.01 || dy > 0.01) {
        frameId = requestAnimationFrame(tick);
      } else {
        current.x = target.x;
        current.y = target.y;
        applyTransform();
        frameId = 0;
      }
    };

    const handlePointerMove = (event) => {
      const rect = root.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      isHovered = true;
      const x = clamp((event.clientX - (rect.left + rect.width / 2)) / (rect.width * 0.5), -1, 1);
      const y = clamp((event.clientY - (rect.top + rect.height / 2)) / (rect.height * 0.5), -1, 1);

      target.x = baseRotation.x - y * (safeTilt * 1.6);
      target.y = baseRotation.y + x * (safeTilt * 1.6);

      startLoop();
    };

    const handlePointerLeave = () => {
      isHovered = false;
      target.x = baseRotation.x;
      target.y = baseRotation.y;
      startLoop();
    };

    if (pointerTracking) {
      root.addEventListener('pointerenter', handlePointerMove);
      root.addEventListener('pointermove', handlePointerMove);
      root.addEventListener('pointerleave', handlePointerLeave);
      window.addEventListener('blur', handlePointerLeave);
    }

    applyTransform();

    return () => {
      if (pointerTracking) {
        root.removeEventListener('pointerenter', handlePointerMove);
        root.removeEventListener('pointermove', handlePointerMove);
        root.removeEventListener('pointerleave', handlePointerLeave);
        window.removeEventListener('blur', handlePointerLeave);
      }
      if (frameId) {
        cancelAnimationFrame(frameId);
        frameId = 0;
      }
    };
  }, [baseRotation, pointerTracking, safeSmoothing, safeTilt]);

  const rootStyle = {
    ...style,
    '--depth-text-perspective': `${safePerspective}px`,
    '--depth-text-font-size': fontSize,
    '--depth-text-font-weight': fontWeight,
    '--depth-text-face-color': faceColor,
    '--depth-text-depth-color': depthColor,
    '--depth-text-shadow': shadow
      ? `0 22px 34px color-mix(in srgb, ${depthColor} 36%, transparent), 0 4px 8px rgba(0, 0, 0, 0.28)`
      : 'none'
  };

  return (
    <span ref={rootRef} className={`depth-text ${className}`.trim()} style={rootStyle}>
      <span ref={stageRef} className="depth-text__stage">
        {depthLayers.map((layer) => (
          <span
            aria-hidden="true"
            className="depth-text__layer"
            key={layer.index}
            style={{ color: layer.color, transform: layer.transform }}
          >
            {text}
          </span>
        ))}
        <span className="depth-text__face">{text}</span>
      </span>
    </span>
  );
};

export default DepthText;
