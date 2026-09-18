import React, { useEffect, useState, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  LinearProgress,
  IconButton,
  Chip,
  Tooltip,
} from '@mui/material';
import SpeedIcon from '@mui/icons-material/Speed';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import KeyboardDoubleArrowDownIcon from '@mui/icons-material/KeyboardDoubleArrowDown';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import TuneIcon from '@mui/icons-material/Tune';
import * as THREE from 'three';

interface WelcomeIntroProps {
  onComplete: () => void;
}

const THEME_ACCENTS = [
  { name: 'Cyber Cyan', hex: 0x00e5ff, color: '#00e5ff' },
  { name: 'Hyper Orange', hex: 0xffb703, color: '#ffb703' },
  { name: 'Neon Crimson', hex: 0xff0055, color: '#ff0055' },
  { name: 'Matrix Green', hex: 0x00ff88, color: '#00ff88' },
];

export const WelcomeIntro: React.FC<WelcomeIntroProps> = ({ onComplete }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [rpm, setRpm] = useState(1200);
  const [speed, setSpeed] = useState(0);
  const [boost, setBoost] = useState(0.4);
  const [isEngineStarted, setIsEngineStarted] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [accentIdx, setAccentIdx] = useState(0);

  // Sound Synthesizer via Web Audio API (No external mp3 needed)
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  const initAudio = () => {
    if (audioCtxRef.current) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(65, ctx.currentTime);

      gain.gain.setValueAtTime(0, ctx.currentTime);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();

      audioCtxRef.current = ctx;
      oscRef.current = osc;
      gainRef.current = gain;
    } catch {
      // AudioContext disabled or blocked
    }
  };

  const playRevSound = (freq = 140) => {
    if (!audioCtxRef.current || isMuted) return;
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    if (oscRef.current && gainRef.current) {
      const now = audioCtxRef.current.currentTime;
      oscRef.current.frequency.cancelScheduledValues(now);
      oscRef.current.frequency.setValueAtTime(oscRef.current.frequency.value, now);
      oscRef.current.frequency.exponentialRampToValueAtTime(freq, now + 0.3);
      oscRef.current.frequency.exponentialRampToValueAtTime(70, now + 1.2);

      gainRef.current.gain.cancelScheduledValues(now);
      gainRef.current.gain.setValueAtTime(0.08, now);
      gainRef.current.gain.exponentialRampToValueAtTime(0.01, now + 1.2);
    }
  };

  // Three.js 3D Futuristic Wireframe Speed Car & Warp Tunnel
  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth || window.innerWidth;
    const height = mountRef.current.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020712, 0.05);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 2.3, 7.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

    // Grid Floor
    const gridColor = THEME_ACCENTS[accentIdx].hex;
    const gridHelper = new THREE.GridHelper(60, 60, gridColor, 0x091b33);
    gridHelper.position.y = -1;
    scene.add(gridHelper);

    // Warp Speed Stars / Particles
    const starGeo = new THREE.BufferGeometry();
    const starCount = 600;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 40;
      starPositions[i + 1] = Math.random() * 20 - 2;
      starPositions[i + 2] = (Math.random() - 0.5) * 60;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0x00e5ff,
      size: 0.12,
      transparent: true,
      opacity: 0.8,
    });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // Car Group
    const carGroup = new THREE.Group();

    // Sleek Sports Body Geometry
    const bodyGeo = new THREE.BoxGeometry(2.3, 0.55, 4.8);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x040a14,
      roughness: 0.1,
      metalness: 0.9,
    });
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.y = 0.1;
    carGroup.add(bodyMesh);

    // Neon Wireframe Overlay
    const wireMat = new THREE.MeshBasicMaterial({
      color: gridColor,
      wireframe: true,
      transparent: true,
      opacity: 0.75,
    });
    const wireMesh = new THREE.Mesh(bodyGeo, wireMat);
    wireMesh.position.y = 0.1;
    carGroup.add(wireMesh);

    // Cockpit Roof
    const cabinGeo = new THREE.BoxGeometry(1.7, 0.5, 2.3);
    const cabinMat = new THREE.MeshStandardMaterial({
      color: gridColor,
      transparent: true,
      opacity: 0.35,
      roughness: 0.1,
      metalness: 0.8,
    });
    const cabinMesh = new THREE.Mesh(cabinGeo, cabinMat);
    cabinMesh.position.set(0, 0.55, -0.2);
    carGroup.add(cabinMesh);

    // Headlight Laser Beams
    const lightGeo = new THREE.CylinderGeometry(0.08, 0.9, 4.5, 16);
    lightGeo.rotateX(Math.PI / 2);
    const lightMat = new THREE.MeshBasicMaterial({
      color: gridColor,
      transparent: true,
      opacity: 0.45,
    });
    const leftBeam = new THREE.Mesh(lightGeo, lightMat);
    leftBeam.position.set(-0.85, 0.1, 4.4);
    carGroup.add(leftBeam);

    const rightBeam = new THREE.Mesh(lightGeo, lightMat);
    rightBeam.position.set(0.85, 0.1, 4.4);
    carGroup.add(rightBeam);

    // Underglow Neon Glow
    const underglowGeo = new THREE.PlaneGeometry(2.2, 4.8);
    underglowGeo.rotateX(-Math.PI / 2);
    const underglowMat = new THREE.MeshBasicMaterial({
      color: gridColor,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
    });
    const underglow = new THREE.Mesh(underglowGeo, underglowMat);
    underglow.position.y = -0.92;
    carGroup.add(underglow);

    // Wheels with Neon Rims
    const wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.3, 24);
    wheelGeo.rotateZ(Math.PI / 2);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.4 });
    const rimMat = new THREE.MeshBasicMaterial({ color: gridColor, wireframe: true });

    const wheelPositions = [
      [-1.15, -0.15, 1.45],
      [1.15, -0.15, 1.45],
      [-1.15, -0.15, -1.45],
      [1.15, -0.15, -1.45],
    ];

    const wheels: THREE.Mesh[] = [];
    wheelPositions.forEach((pos) => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.position.set(pos[0], pos[1], pos[2]);
      const rim = new THREE.Mesh(wheelGeo, rimMat);
      rim.scale.set(1.02, 1.02, 1.02);
      wheel.add(rim);
      carGroup.add(wheel);
      wheels.push(wheel);
    });

    scene.add(carGroup);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(gridColor, 3, 15);
    pointLight.position.set(0, 2, 2);
    scene.add(pointLight);

    // Mouse Parallax
    let targetRotY = 0;
    let targetRotX = 0;
    const handleMouseMoveWindow = (e: MouseEvent) => {
      const normX = (e.clientX / window.innerWidth) * 2 - 1;
      const normY = (e.clientY / window.innerHeight) * 2 - 1;
      targetRotY = normX * 0.4;
      targetRotX = normY * 0.15;
    };
    window.addEventListener('mousemove', handleMouseMoveWindow);

    // Animation Loop
    let clock = new THREE.Clock();
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Gentle floating and parallax orbit
      carGroup.rotation.y += (targetRotY + Math.sin(elapsed * 0.5) * 0.2 - carGroup.rotation.y) * 0.05;
      camera.position.y += (2.3 - targetRotX * 1.5 - camera.position.y) * 0.05;
      carGroup.position.y = Math.sin(elapsed * 2) * 0.06;

      // Spin wheels
      wheels.forEach((w) => {
        w.rotation.x -= 0.08;
      });

      // Move road grid backward to simulate speed
      gridHelper.position.z = (gridHelper.position.z + 0.15) % 1;

      // Warp speed stars moving toward camera
      const posArr = starGeo.attributes.position.array as Float32Array;
      for (let i = 2; i < starCount * 3; i += 3) {
        posArr[i] += 0.4;
        if (posArr[i] > 15) {
          posArr[i] = -40;
        }
      }
      starGeo.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMoveWindow);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [accentIdx]);

  // Dynamic Telemetry HUD ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setRpm((prev) => {
        if (!isEngineStarted) {
          return 1200 + Math.floor(Math.random() * 100);
        }
        const delta = Math.floor(Math.random() * 800) - 250;
        const next = Math.max(1400, Math.min(8200, prev + delta));
        return next;
      });

      setSpeed((prev) => {
        if (!isEngineStarted) return 0;
        const nextSpeed = Math.min(240, Math.max(40, prev + (Math.random() > 0.4 ? 4 : -2)));
        return nextSpeed;
      });

      setBoost((prev) => {
        if (!isEngineStarted) return 0.2;
        return Number((0.8 + Math.random() * 1.4).toFixed(1));
      });
    }, 150);

    return () => clearInterval(interval);
  }, [isEngineStarted]);

  // Engine Start Trigger
  const handleEngineStart = () => {
    initAudio();
    setIsEngineStarted(true);
    setRpm(4500);
    setSpeed(60);
    playRevSound(220);
  };

  const handleRevEngine = () => {
    initAudio();
    setRpm((prev) => Math.min(8200, prev + 1800));
    playRevSound(280);
  };

  // Transition into Showroom (Slide up curtain)
  const handleEnterShowroom = () => {
    setIsExiting(true);
    setTimeout(() => {
      onComplete();
    }, 750);
  };

  const accentColor = THEME_ACCENTS[accentIdx].color;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 9999,
        background: 'linear-gradient(180deg, #020617 0%, #030a1a 60%, #051428 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
        overflow: 'hidden',
        transition: 'transform 0.75s cubic-bezier(0.85, 0, 0.15, 1), opacity 0.75s ease',
        transform: isExiting ? 'translateY(-100%)' : 'translateY(0)',
        opacity: isExiting ? 0.2 : 1,
      }}
    >
      {/* 3D WebGL Canvas Layer */}
      <Box
        ref={mountRef}
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 1,
        }}
      />

      {/* Top Header Bar */}
      <Box
        sx={{
          width: '100%',
          p: { xs: 2, sm: 3 },
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 10,
          backdropFilter: 'blur(8px)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: '12px',
              bgcolor: 'rgba(0, 229, 255, 0.15)',
              border: `1px solid ${accentColor}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 0 20px ${accentColor}44`,
            }}
          >
            <SpeedIcon sx={{ color: accentColor, fontSize: 26 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900, letterSpacing: 2, color: '#ffffff' }}>
              Car<span style={{ color: accentColor }}>IQ</span>
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontSize: '0.68rem', letterSpacing: 1 }}>
              SMART AUTOMOTIVE INTELLIGENCE
            </Typography>
          </Box>
        </Box>

        {/* Top Controls: Sound & Theme Accents */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 0.8, bgcolor: 'rgba(15,23,42,0.8)', p: 0.6, borderRadius: 50, border: '1px solid rgba(255,255,255,0.1)' }}>
            {THEME_ACCENTS.map((acc, i) => (
              <Tooltip key={acc.name} title={acc.name}>
                <Box
                  onClick={() => setAccentIdx(i)}
                  sx={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    bgcolor: acc.color,
                    cursor: 'pointer',
                    boxShadow: accentIdx === i ? `0 0 10px ${acc.color}` : 'none',
                    border: accentIdx === i ? '2px solid #fff' : 'none',
                    transition: 'transform 0.2s',
                    '&:hover': { transform: 'scale(1.2)' },
                  }}
                />
              </Tooltip>
            ))}
          </Box>

          <IconButton
            onClick={() => {
              initAudio();
              setIsMuted(!isMuted);
            }}
            sx={{
              bgcolor: 'rgba(15, 23, 42, 0.8)',
              border: `1px solid ${accentColor}44`,
              color: isMuted ? '#64748b' : accentColor,
            }}
          >
            {isMuted ? <VolumeOffIcon /> : <VolumeUpIcon />}
          </IconButton>
        </Box>
      </Box>

      {/* Center Cinematic Content */}
      <Box
        sx={{
          zIndex: 10,
          textAlign: 'center',
          px: 2,
          maxWidth: 900,
          mx: 'auto',
          userSelect: 'none',
        }}
      >
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 1,
            px: 2.5,
            py: 0.8,
            borderRadius: 50,
            bgcolor: 'rgba(0, 229, 255, 0.1)',
            border: `1px solid ${accentColor}55`,
            mb: 2,
          }}
        >
          <AutoAwesomeIcon sx={{ color: accentColor, fontSize: 18 }} />
          <Typography variant="body2" sx={{ color: accentColor, fontWeight: 700, letterSpacing: 2 }}>
            AI-POWERED AUTOMOTIVE ECOSYSTEM
          </Typography>
        </Box>

        <Typography
          variant="h1"
          sx={{
            fontSize: { xs: '2.4rem', sm: '3.6rem', md: '4.6rem' },
            fontWeight: 900,
            lineHeight: 1.1,
            mb: 2,
            background: 'linear-gradient(180deg, #ffffff 0%, #cbd5e1 60%, #64748b 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: `0 0 50px ${accentColor}44`,
          }}
        >
          Discover. Compare. <br />
          <span style={{ color: accentColor, WebkitTextFillColor: accentColor }}>Own Smarter.</span>
        </Typography>

        <Typography variant="body1" sx={{ color: '#94a3b8', maxWidth: 640, mx: 'auto', mb: 3.5, fontSize: { xs: '0.9rem', md: '1.05rem' } }}>
          Real-time AI recommendations, 3D holographic vehicle orbits, multi-variant spec matching, and instant digital booking.
        </Typography>

        {/* Live Cockpit Telemetry Gauges */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            gap: { xs: 1.5, sm: 3 },
            mb: 3,
            flexWrap: 'wrap',
          }}
        >
          {/* Tachometer / RPM */}
          <Box
            onClick={handleRevEngine}
            sx={{
              p: { xs: 1.5, sm: 2 },
              borderRadius: '16px',
              bgcolor: 'rgba(15, 23, 42, 0.85)',
              border: `1px solid ${accentColor}44`,
              minWidth: { xs: 110, sm: 150 },
              backdropFilter: 'blur(16px)',
              cursor: 'pointer',
              transition: 'transform 0.2s',
              '&:hover': { transform: 'scale(1.05)' },
            }}
          >
            <Typography variant="caption" sx={{ color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
              <SpeedIcon sx={{ fontSize: 16, color: accentColor }} /> RPM (TAP TO REV)
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, color: rpm > 6500 ? '#ff3366' : accentColor, my: 0.5, fontSize: { xs: '1.4rem', sm: '2rem' } }}>
              {rpm.toLocaleString()}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={Math.min(100, (rpm / 8000) * 100)}
              sx={{
                height: 5,
                borderRadius: 3,
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                '& .MuiLinearProgress-bar': { bgcolor: rpm > 6500 ? '#ff3366' : accentColor },
              }}
            />
          </Box>

          {/* Speedometer */}
          <Box
            sx={{
              p: { xs: 1.5, sm: 2 },
              borderRadius: '16px',
              bgcolor: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(255, 183, 3, 0.35)',
              minWidth: { xs: 110, sm: 150 },
              backdropFilter: 'blur(16px)',
            }}
          >
            <Typography variant="caption" sx={{ color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
              <FlashOnIcon sx={{ fontSize: 16, color: '#ffb703' }} /> SPEED KM/H
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, color: '#ffb703', my: 0.5, fontSize: { xs: '1.4rem', sm: '2rem' } }}>
              {speed}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={Math.min(100, (speed / 240) * 100)}
              sx={{
                height: 5,
                borderRadius: 3,
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                '& .MuiLinearProgress-bar': { bgcolor: '#ffb703' },
              }}
            />
          </Box>

          {/* Turbo Boost */}
          <Box
            sx={{
              p: { xs: 1.5, sm: 2 },
              borderRadius: '16px',
              bgcolor: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(0, 255, 136, 0.35)',
              minWidth: { xs: 110, sm: 140 },
              backdropFilter: 'blur(16px)',
            }}
          >
            <Typography variant="caption" sx={{ color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
              <TuneIcon sx={{ fontSize: 16, color: '#00ff88' }} /> TURBO BOOST
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, color: '#00ff88', my: 0.5, fontSize: { xs: '1.4rem', sm: '2rem' } }}>
              {boost} BAR
            </Typography>
            <LinearProgress
              variant="determinate"
              value={Math.min(100, (boost / 2.5) * 100)}
              sx={{
                height: 5,
                borderRadius: 3,
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                '& .MuiLinearProgress-bar': { bgcolor: '#00ff88' },
              }}
            />
          </Box>
        </Box>

        {/* Engine Start Pulse Button */}
        {!isEngineStarted && (
          <Button
            variant="outlined"
            onClick={handleEngineStart}
            startIcon={<PowerSettingsNewIcon />}
            sx={{
              borderColor: accentColor,
              color: '#ffffff',
              borderRadius: 50,
              px: 3.5,
              py: 1,
              fontWeight: 800,
              letterSpacing: 1.5,
              bgcolor: 'rgba(0, 229, 255, 0.15)',
              boxShadow: `0 0 25px ${accentColor}55`,
              animation: 'pulse 1.8s infinite',
              '@keyframes pulse': {
                '0%': { transform: 'scale(1)', boxShadow: `0 0 20px ${accentColor}44` },
                '50%': { transform: 'scale(1.05)', boxShadow: `0 0 35px ${accentColor}88` },
                '100%': { transform: 'scale(1)', boxShadow: `0 0 20px ${accentColor}44` },
              },
            }}
          >
            IGNITION: START ENGINE
          </Button>
        )}
      </Box>

      {/* Bottom Action Area: Enter Showroom */}
      <Box
        sx={{
          width: '100%',
          maxWidth: 640,
          p: { xs: 2.5, md: 3.5 },
          textAlign: 'center',
          zIndex: 10,
        }}
      >
        <Button
          variant="contained"
          size="large"
          onClick={handleEnterShowroom}
          endIcon={<PlayArrowIcon />}
          sx={{
            py: 1.8,
            px: { xs: 4, sm: 6 },
            fontSize: { xs: '1rem', sm: '1.18rem' },
            fontWeight: 900,
            letterSpacing: 1.5,
            borderRadius: 50,
            background: `linear-gradient(135deg, ${accentColor} 0%, #0072ff 100%)`,
            boxShadow: `0 0 40px ${accentColor}77, inset 0 0 15px rgba(255, 255, 255, 0.4)`,
            color: '#000000',
            '&:hover': {
              background: `linear-gradient(135deg, #ffffff 0%, ${accentColor} 100%)`,
              transform: 'scale(1.04)',
              boxShadow: `0 0 55px ${accentColor}`,
            },
          }}
        >
          ENTER 3D SHOWROOM
        </Button>

        {/* Scroll Cue with Floating Chevrons */}
        <Box
          onClick={handleEnterShowroom}
          sx={{
            mt: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0.5,
            cursor: 'pointer',
            color: accentColor,
            opacity: 0.85,
            animation: 'bounce 1.5s infinite',
            '@keyframes bounce': {
              '0%, 100%': { transform: 'translateY(0)' },
              '50%': { transform: 'translateY(6px)' },
            },
          }}
        >
          <KeyboardDoubleArrowDownIcon sx={{ fontSize: 20 }} />
          <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: 1.2 }}>
            SCROLL DOWN TO REVEAL HOME TAB
          </Typography>
          <KeyboardDoubleArrowDownIcon sx={{ fontSize: 20 }} />
        </Box>
      </Box>
    </Box>
  );
};
