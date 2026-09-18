import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography, Button, IconButton, Chip, Paper, Tooltip } from '@mui/material';
import * as THREE from 'three';
import ThreeDRotationIcon from '@mui/icons-material/ThreeDRotation';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import PauseCircleIcon from '@mui/icons-material/PauseCircle';
import GridViewIcon from '@mui/icons-material/GridView';
import SpeedIcon from '@mui/icons-material/Speed';
import SecurityIcon from '@mui/icons-material/Security';
import BatteryChargingFullIcon from '@mui/icons-material/BatteryChargingFull';

interface Car3DViewerProps {
  initialColor?: string;
  modelName?: string;
  brandName?: string;
}

const COLOR_PRESETS = [
  { name: 'Obsidian Night', hex: '#0f172a', threeColor: 0x0f172a },
  { name: 'Electric Cyan', hex: '#00e5ff', threeColor: 0x00e5ff },
  { name: 'Crimson Racing', hex: '#e11d48', threeColor: 0xe11d48 },
  { name: 'Apex Silver', hex: '#94a3b8', threeColor: 0x94a3b8 },
  { name: 'Sunset Gold', hex: '#f59e0b', threeColor: 0xf59e0b },
];

export const Car3DViewer: React.FC<Car3DViewerProps> = ({
  modelName = 'CarIQ Cyber GT Concept',
  brandName = 'CarIQ Studio',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedColor, setSelectedColor] = useState(COLOR_PRESETS[1]);
  const [headlightsOn, setHeadlightsOn] = useState(true);
  const [isRotating, setIsRotating] = useState(true);
  const [wireframeMode, setWireframeMode] = useState(false);

  // References for dynamic updates inside animation loop
  const carBodyMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const leftHeadlightRef = useRef<THREE.Mesh | null>(null);
  const rightHeadlightRef = useRef<THREE.Mesh | null>(null);
  const isRotatingRef = useRef(isRotating);
  isRotatingRef.current = isRotating;

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight || 460;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(4.5, 2.2, 5.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);

    // Grid Platform
    const grid = new THREE.GridHelper(24, 24, 0x00e5ff, 0x1e293b);
    grid.position.y = -0.65;
    scene.add(grid);

    // Glowing Circular Pedestal
    const pedestalGeo = new THREE.CylinderGeometry(3.6, 3.8, 0.1, 48);
    const pedestalMat = new THREE.MeshStandardMaterial({
      color: 0x0b1329,
      roughness: 0.3,
      metalness: 0.8,
    });
    const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestal.position.y = -0.7;
    scene.add(pedestal);

    const ringGeo = new THREE.RingGeometry(3.5, 3.65, 48);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = -0.64;
    scene.add(ring);

    // Car Root
    const carRoot = new THREE.Group();

    // Main Body
    const bodyGeo = new THREE.BoxGeometry(2.1, 0.55, 4.4);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: selectedColor.threeColor,
      metalness: 0.85,
      roughness: 0.2,
      wireframe: wireframeMode,
    });
    carBodyMatRef.current = bodyMat;

    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.y = 0;
    carRoot.add(bodyMesh);

    // Aerodynamic Cabin / Glass Canopy
    const cabinGeo = new THREE.BoxGeometry(1.65, 0.48, 2.2);
    const cabinMat = new THREE.MeshStandardMaterial({
      color: 0x050c1a,
      roughness: 0.1,
      metalness: 0.9,
      transparent: true,
      opacity: 0.85,
      wireframe: wireframeMode,
    });
    const cabinMesh = new THREE.Mesh(cabinGeo, cabinMat);
    cabinMesh.position.set(0, 0.48, -0.2);
    carRoot.add(cabinMesh);

    // Rear Aerodynamic Spoiler Wing
    const wingGeo = new THREE.BoxGeometry(1.9, 0.08, 0.4);
    const wingMesh = new THREE.Mesh(wingGeo, bodyMat);
    wingMesh.position.set(0, 0.55, -2.1);
    carRoot.add(wingMesh);

    const wingStrut1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.35, 0.1), bodyMat);
    wingStrut1.position.set(-0.6, 0.35, -2.1);
    carRoot.add(wingStrut1);

    const wingStrut2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.35, 0.1), bodyMat);
    wingStrut2.position.set(0.6, 0.35, -2.1);
    carRoot.add(wingStrut2);

    // Headlight Laser Beams
    const beamGeo = new THREE.CylinderGeometry(0.05, 0.6, 3.2, 16);
    beamGeo.rotateX(Math.PI / 2);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x00f2fe,
      transparent: true,
      opacity: headlightsOn ? 0.45 : 0.0,
    });

    const leftBeam = new THREE.Mesh(beamGeo, beamMat);
    leftBeam.position.set(-0.75, 0, 3.7);
    leftHeadlightRef.current = leftBeam;
    carRoot.add(leftBeam);

    const rightBeam = new THREE.Mesh(beamGeo, beamMat);
    rightBeam.position.set(0.75, 0, 3.7);
    rightHeadlightRef.current = rightBeam;
    carRoot.add(rightBeam);

    // Taillight Neon Strip
    const tailGeo = new THREE.BoxGeometry(1.9, 0.08, 0.08);
    const tailMat = new THREE.MeshBasicMaterial({ color: 0xff1744 });
    const tailMesh = new THREE.Mesh(tailGeo, tailMat);
    tailMesh.position.set(0, 0.12, -2.22);
    carRoot.add(tailMesh);

    // Wheels & Alloy Rims
    const wheelPositions = [
      [-1.12, -0.3, 1.35],
      [1.12, -0.3, 1.35],
      [-1.12, -0.3, -1.35],
      [1.12, -0.3, -1.35],
    ];

    const wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.3, 32);
    wheelGeo.rotateZ(Math.PI / 2);
    const tyreMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.6 });
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.1 });

    wheelPositions.forEach((pos) => {
      const wheelGroup = new THREE.Group();
      const tyre = new THREE.Mesh(wheelGeo, tyreMat);
      const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.32, 16), rimMat);
      rim.rotateZ(Math.PI / 2);

      wheelGroup.add(tyre);
      wheelGroup.add(rim);
      wheelGroup.position.set(pos[0], pos[1], pos[2]);
      carRoot.add(wheelGroup);
    });

    scene.add(carRoot);

    // Studio Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
    keyLight.position.set(5, 8, 5);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x00e5ff, 2.0);
    rimLight.position.set(-5, 6, -5);
    scene.add(rimLight);

    // Manual Interactive Drag Controls
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      carRoot.rotation.y += deltaX * 0.01;
      camera.position.y = Math.max(0.5, Math.min(4.5, camera.position.y - deltaY * 0.01));
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Animation Loop
    let reqId: number;
    const animate = () => {
      reqId = requestAnimationFrame(animate);

      if (isRotatingRef.current && !isDragging) {
        carRoot.rotation.y += 0.007;
      }

      // Look at car center
      camera.lookAt(0, 0.2, 0);
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight || 460;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(reqId);
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('resize', handleResize);
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Update color dynamically
  const handleColorChange = (color: typeof COLOR_PRESETS[0]) => {
    setSelectedColor(color);
    if (carBodyMatRef.current) {
      carBodyMatRef.current.color.setHex(color.threeColor);
    }
  };

  // Toggle headlights dynamically
  const handleToggleHeadlights = () => {
    const next = !headlightsOn;
    setHeadlightsOn(next);
    if (leftHeadlightRef.current && rightHeadlightRef.current) {
      (leftHeadlightRef.current.material as THREE.Material).opacity = next ? 0.45 : 0;
      (rightHeadlightRef.current.material as THREE.Material).opacity = next ? 0.45 : 0;
    }
  };

  // Toggle wireframe mode
  const handleToggleWireframe = () => {
    const next = !wireframeMode;
    setWireframeMode(next);
    if (carBodyMatRef.current) {
      carBodyMatRef.current.wireframe = next;
    }
  };

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: { xs: 400, md: 520 },
        borderRadius: '24px',
        overflow: 'hidden',
        background: 'radial-gradient(ellipse at bottom, #0f1c3f 0%, #080e1a 60%, #030712 100%)',
        border: '1px solid rgba(0, 229, 255, 0.2)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), inset 0 0 40px rgba(0, 229, 255, 0.05)',
      }}
    >
      {/* 3D Canvas Mount Point */}
      <Box
        ref={containerRef}
        sx={{
          width: '100%',
          height: '100%',
          cursor: 'grab',
          '&:active': { cursor: 'grabbing' },
        }}
      />

      {/* Top Overlay Badge & Telemetry */}
      <Box
        sx={{
          position: 'absolute',
          top: 20,
          left: 20,
          zIndex: 10,
          pointerEvents: 'none',
        }}
      >
        <Chip
          icon={<ThreeDRotationIcon sx={{ color: '#00e5ff !important' }} />}
          label="INTERACTIVE 360° WEBGL STUDIO"
          sx={{
            bgcolor: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(10px)',
            color: '#00e5ff',
            fontWeight: 700,
            border: '1px solid rgba(0, 229, 255, 0.3)',
            mb: 1,
          }}
        />
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#ffffff', textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
          {modelName}
        </Typography>
        <Typography variant="body2" sx={{ color: '#94a3b8' }}>
          {brandName} • Drag to inspect aerodynamics
        </Typography>
      </Box>

      {/* Top Right Quick Telemetry Chips */}
      <Box
        sx={{
          position: 'absolute',
          top: 20,
          right: 20,
          display: { xs: 'none', sm: 'flex' },
          flexDirection: 'column',
          gap: 1,
          zIndex: 10,
        }}
      >
        <Paper
          sx={{
            p: 1.2,
            px: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            bgcolor: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
          }}
        >
          <SpeedIcon sx={{ color: '#00e5ff', fontSize: 20 }} />
          <Box>
            <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', lineHeight: 1 }}>
              0-100 KM/H
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#ffffff' }}>
              6.8 SECONDS
            </Typography>
          </Box>
        </Paper>

        <Paper
          sx={{
            p: 1.2,
            px: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            bgcolor: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
          }}
        >
          <SecurityIcon sx={{ color: '#00e676', fontSize: 20 }} />
          <Box>
            <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', lineHeight: 1 }}>
              SAFETY BENCHMARK
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#00e676' }}>
              5-STAR NCAP
            </Typography>
          </Box>
        </Paper>

        <Paper
          sx={{
            p: 1.2,
            px: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            bgcolor: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
          }}
        >
          <BatteryChargingFullIcon sx={{ color: '#ffb703', fontSize: 20 }} />
          <Box>
            <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', lineHeight: 1 }}>
              ARAI RANGE
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#ffffff' }}>
              465 KM PER CHARGE
            </Typography>
          </Box>
        </Paper>
      </Box>

      {/* Bottom Controls Bar: Paint Customizer & Toggles */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 20,
          left: 20,
          right: 20,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
          zIndex: 10,
        }}
      >
        {/* Color Palette Selector */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.2,
            p: 1,
            px: 2,
            bgcolor: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(12px)',
            borderRadius: '50px',
            border: '1px solid rgba(255, 255, 255, 0.15)',
          }}
        >
          <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, mr: 0.5 }}>
            PAINT FINISH:
          </Typography>
          {COLOR_PRESETS.map((color) => (
            <Tooltip key={color.name} title={color.name} arrow>
              <Box
                onClick={() => handleColorChange(color)}
                sx={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  bgcolor: color.hex,
                  cursor: 'pointer',
                  border: selectedColor.name === color.name ? '2px solid #00e5ff' : '2px solid rgba(255,255,255,0.3)',
                  transform: selectedColor.name === color.name ? 'scale(1.2)' : 'scale(1)',
                  boxShadow: selectedColor.name === color.name ? '0 0 12px #00e5ff' : 'none',
                  transition: 'all 0.2s',
                  '&:hover': { transform: 'scale(1.2)' },
                }}
              />
            </Tooltip>
          ))}
        </Box>

        {/* View Controls: Auto-spin, Headlights, Wireframe */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            p: 0.8,
            bgcolor: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(12px)',
            borderRadius: '50px',
            border: '1px solid rgba(255, 255, 255, 0.15)',
          }}
        >
          <Tooltip title={isRotating ? 'Pause Auto-Spin' : 'Resume Auto-Spin'}>
            <IconButton
              onClick={() => setIsRotating(!isRotating)}
              size="small"
              sx={{ color: isRotating ? '#00e5ff' : '#94a3b8' }}
            >
              {isRotating ? <PauseCircleIcon /> : <PlayCircleIcon />}
            </IconButton>
          </Tooltip>

          <Tooltip title={headlightsOn ? 'Turn Off Headlights' : 'Turn On Headlights'}>
            <IconButton
              onClick={handleToggleHeadlights}
              size="small"
              sx={{ color: headlightsOn ? '#00e5ff' : '#94a3b8' }}
            >
              <LightbulbIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title={wireframeMode ? 'Shaded View' : 'CAD Wireframe Mode'}>
            <IconButton
              onClick={handleToggleWireframe}
              size="small"
              sx={{ color: wireframeMode ? '#00e5ff' : '#94a3b8' }}
            >
              <GridViewIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  );
};
