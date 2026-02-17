import React, { useState, useRef, useEffect, useCallback } from 'react';

interface JoystickProps {
  onMove: (data: { x: number; y: number } | null) => void;
  size?: number;
}

const Joystick: React.FC<JoystickProps> = ({ onMove, size = 120 }) => {
  const [active, setActive] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const stickRef = useRef<HTMLDivElement>(null);
  const baseRef = useRef<HTMLDivElement>(null);
  const touchId = useRef<number | null>(null);

  const radius = size / 2;
  const knobSize = size / 2.5;

  const handleStart = useCallback((clientX: number, clientY: number) => {
    setActive(true);
    updatePosition(clientX, clientY);
  }, []);

  const updatePosition = useCallback((clientX: number, clientY: number) => {
    if (!baseRef.current) return;

    const rect = baseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Normalize
    let x = dx;
    let y = dy;

    if (distance > radius) {
      const ratio = radius / distance;
      x = dx * ratio;
      y = dy * ratio;
    }

    setPosition({ x, y });

    // Send normalized vector (-1 to 1)
    onMove({
      x: x / radius,
      y: y / radius
    });
  }, [radius, onMove]);

  const handleEnd = useCallback(() => {
    setActive(false);
    setPosition({ x: 0, y: 0 });
    touchId.current = null;
    onMove(null);
  }, [onMove]);

  // Mouse Events
  const onMouseDown = (e: React.MouseEvent) => {
    handleStart(e.clientX, e.clientY);
  };

  const onMouseMove = (e: MouseEvent) => {
    if (active) {
      updatePosition(e.clientX, e.clientY);
    }
  };

  const onMouseUp = () => {
    if (active) handleEnd();
  };

  // Touch Events
  const onTouchStart = (e: React.TouchEvent) => {
    if (touchId.current !== null) return;
    const touch = e.changedTouches[0];
    touchId.current = touch.identifier;
    handleStart(touch.clientX, touch.clientY);
  };

  const onTouchMove = (e: TouchEvent) => {
    if (!active) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchId.current) {
        updatePosition(e.changedTouches[i].clientX, e.changedTouches[i].clientY);
        break;
      }
    }
  };

  const onTouchEnd = (e: TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchId.current) {
        handleEnd();
        break;
      }
    }
  };

  // Global listeners for drag outside container
  useEffect(() => {
    if (active) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('touchmove', onTouchMove);
      window.addEventListener('touchend', onTouchEnd);
      window.addEventListener('touchcancel', onTouchEnd);
    }

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [active, updatePosition, handleEnd]);

  return (
    <div
      ref={baseRef}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      className={`relative rounded-full backdrop-blur-sm border-2 transition-colors ${active ? 'bg-gray-800/50 border-white/40' : 'bg-gray-900/30 border-white/20'}`}
      style={{
        width: size,
        height: size,
        touchAction: 'none'
      }}
    >
      <div
        ref={stickRef}
        className={`absolute rounded-full shadow-lg transition-transform duration-75 ${active ? 'bg-blue-500' : 'bg-white/50'}`}
        style={{
          width: knobSize,
          height: knobSize,
          top: '50%',
          left: '50%',
          marginTop: -knobSize / 2,
          marginLeft: -knobSize / 2,
          transform: `translate(${position.x}px, ${position.y}px)`
        }}
      />
    </div>
  );
};

export default Joystick;
