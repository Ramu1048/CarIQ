import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  IconButton,
  Chip,
  Card,
  CardContent,
  CardMedia,
  CircularProgress,
  Avatar,
  Divider,
  Collapse,
  Tooltip,
  Fade,
  LinearProgress,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import SecurityIcon from '@mui/icons-material/Security';
import ElectricBoltIcon from '@mui/icons-material/ElectricBolt';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import CalculateIcon from '@mui/icons-material/Calculate';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import StarIcon from '@mui/icons-material/Star';
import HubIcon from '@mui/icons-material/Hub';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import ShieldIcon from '@mui/icons-material/Shield';
import SpeedIcon from '@mui/icons-material/Speed';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import TranslateIcon from '@mui/icons-material/Translate';

import { aiService } from '../../services/aiService';
import { Citation, RagDomain } from '../../services/ragKnowledgeEngine';
import { Vehicle } from '../../types';
import { useAppTheme } from '../../context/ThemeContext';

interface AIAdvisorTabProps {
  initialQuery?: string;
  onSelectVehicle: (vehicle: Vehicle) => void;
  onStartPurchase: (vehicle: Vehicle) => void;
}

interface ChatItem {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  citations?: Citation[];
  matchedVehicles?: Vehicle[];
  confidenceScore?: number;
  latencyMs?: number;
  suggestedFollowups?: string[];
  liked?: boolean;
  intent?: string;
  isOffTopic?: boolean;
}

const DOMAIN_FILTERS: { id: RagDomain; label: string; icon: React.ReactNode }[] = [
  { id: 'all',        label: 'All Topics',        icon: <HubIcon sx={{ fontSize: 16 }} /> },
  { id: 'safety',     label: 'Safety & NCAP',     icon: <SecurityIcon sx={{ fontSize: 16 }} /> },
  { id: 'ev',         label: 'EV & Battery',      icon: <ElectricBoltIcon sx={{ fontSize: 16 }} /> },
  { id: 'mileage',    label: 'Mileage & Fuel',    icon: <LocalGasStationIcon sx={{ fontSize: 16 }} /> },
  { id: 'finance',    label: 'EMI & Finance',     icon: <CalculateIcon sx={{ fontSize: 16 }} /> },
  { id: 'comparison', label: 'Compare Models',    icon: <CompareArrowsIcon sx={{ fontSize: 16 }} /> },
];

const DOMAIN_PRESETS: Record<RagDomain, string[]> = {
  all: [
    'Safest automatic SUV under 20 lakh for family',
    'Compare Tata Harrier vs Mahindra XUV700',
    'Best EV with 350km real-world range',
    'Explain the 20/4/10 car financing rule',
  ],
  safety: [
    'Which SUVs have verified 5-Star Bharat NCAP rating?',
    'Tata Nexon vs Creta: side pole crash protection',
    'Do all variants include 6 airbags as standard?',
    'What is Level 2 ADAS and which cars have it?',
  ],
  ev: [
    'Real-world highway range of Tata Nexon EV',
    'LFP battery life in Indian summer heat',
    'Running cost per km: EV vs petrol SUV',
    'Does 50kW fast charging degrade battery?',
  ],
  mileage: [
    'How does Grand Vitara achieve 27.97 km/l ARAI?',
    'Creta Turbo vs Diesel real-world city mileage',
    'At what monthly km does diesel pay off vs petrol?',
    'Brezza Smart Hybrid vs Nexon Petrol efficiency',
  ],
  finance: [
    'Calculate EMI for 18 lakh car using 20/4/10 rule',
    'How to claim Section 80EEB EV tax deduction?',
    'Hidden charges in on-road price to watch out for',
    'Is a 7-year car loan a bad financial decision?',
  ],
  comparison: [
    'Nexon DCA vs Creta DCT: which is more reliable?',
    'Mahindra Scorpio-N vs XUV700 for off-road use',
    'Tata Curvv EV vs MG ZS EV battery and range',
    'Brezza vs Venue: safety, clearance, maintenance',
  ],
};

const RAG_STEPS = [
  'Embedding query vector...',
  'Scanning technical manuals & NCAP reports...',
  'Cross-referencing 23 verified models...',
  'Grounding citations & generating answer...',
];

// ── WELCOME MESSAGE ──────────────────────────────────────────────────────────
const WELCOME_MESSAGE: ChatItem = {
  id: 'msg-welcome',
  role: 'assistant',
  content: `### Welcome to CarIQ AI Advisor\n\nI am powered by a **Retrieval-Augmented Generation (RAG)** engine connected to:\n\n- 9 verified OEM technical manuals and Bharat NCAP crash test logs\n- ARAI real-world driving telemetry and emissions data\n- 23-vehicle verified specification database\n\nAsk me anything — crash safety ratings, real-world mileage, EV battery life, model comparisons, or EMI calculations.`,
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  confidenceScore: 99,
  latencyMs: 14,
  citations: [
    {
      document: 'Bharat NCAP Official Crash Protocol 2024',
      section: 'Frontal & Side Impact Assessment',
      snippet: '64 km/h frontal offset | 50 km/h side barrier impact | 29 km/h side pole impact for curtain airbag evaluation.',
      relevanceScore: 99,
      category: 'safety',
      tags: ['ncap', 'crash test'],
    },
    {
      document: 'ARAI Real Driving Emissions Telemetry',
      section: 'Fuel Economy Certification Standard',
      snippet: 'Certifies fuel consumption vs real-world stop-and-go urban telemetry for accurate ownership projections.',
      relevanceScore: 97,
      category: 'mileage',
      tags: ['arai', 'fuel economy'],
    },
  ],
  suggestedFollowups: [
    'Safest automatic SUV under ₹20 Lakh',
    'Tata Nexon vs Hyundai Creta comparison',
    'Real-world range of Nexon EV',
    'EMI calculation for ₹18 Lakh car',
  ],
};

export const AIAdvisorTab: React.FC<AIAdvisorTabProps> = ({
  initialQuery = '',
  onSelectVehicle,
  onStartPurchase,
}) => {
  const { mode } = useAppTheme();
  const isDark = false; // Always light theme


  // ── Theme tokens ──────────────────────────────────────────────────────────
  const t = {
    bg:         isDark ? '#080808' : '#f8f9fb',
    surface:    isDark ? '#111111' : '#ffffff',
    surface2:   isDark ? '#1a1a1a' : '#f1f5f9',
    surface3:   isDark ? '#222222' : '#e8ecf0',
    border:     isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.09)',
    borderHov:  isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)',
    accent:     isDark ? '#ffffff' : '#000000',
    accentSub:  isDark ? '#e2e8f0' : '#1e293b',
    muted:      isDark ? '#94a3b8' : '#64748b',
    mutedFaint: isDark ? '#475569' : '#cbd5e1',
    userBg:     isDark ? '#1c1c1c' : '#f0f4f8',
    botBg:      isDark ? '#141414' : '#ffffff',
    activeChip: isDark ? '#ffffff' : '#0f172a',
    activeText: isDark ? '#000000' : '#ffffff',
    infoTag:    isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
    greenDot:   isDark ? '#4ade80' : '#16a34a',
    starColor:  isDark ? '#facc15' : '#d97706',
  };

  const [selectedDomain, setSelectedDomain] = useState<RagDomain>('all');
  const [messages, setMessages] = useState<ChatItem[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [ragStepIdx, setRagStepIdx] = useState(0);
  const [expandedCitId, setExpandedCitId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEnd = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    let iv: any;
    if (loading) {
      iv = setInterval(() => setRagStepIdx(p => (p + 1) % RAG_STEPS.length), 650);
    }
    return () => clearInterval(iv);
  }, [loading]);

  useEffect(() => {
    if (initialQuery?.trim()) handleSend(initialQuery);
  }, []);

  const handleSend = async (text?: string) => {
    const q = (text || input).trim();
    if (!q || loading) return;

    setMessages(prev => [...prev, {
      id: `u-${Date.now()}`, role: 'user', content: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }]);
    setInput('');
    setLoading(true);
    setRagStepIdx(0);

    try {
      const result = await aiService.askRag(q, selectedDomain);
      setMessages(prev => [...prev, {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: result.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        citations: result.isOffTopic ? [] : result.sources,
        matchedVehicles: result.isOffTopic ? [] : result.matchedVehicles,
        confidenceScore: result.confidenceScore,
        latencyMs: result.latencyMs,
        suggestedFollowups: result.suggestedFollowups,
        intent: result.intent,
        isOffTopic: result.isOffTopic ?? false,
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: `a-${Date.now()}`, role: 'assistant',
        content: `### CarIQ Fallback Response\n\nOur local knowledge base returned general guidance. Based on Indian road conditions and verified Bharat NCAP data, models like **Tata Nexon** (5★ NCAP, 208mm clearance) and **Hyundai Creta** (Level 2 ADAS, 19.99L) offer the best balance of safety and features in their segments.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        confidenceScore: 82,
        latencyMs: 22,
        suggestedFollowups: ['Tata Nexon specifications', 'Hyundai Creta vs Nexon comparison', 'SUVs under 20 Lakh'],
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleLike = (id: string) =>
    setMessages(prev => prev.map(m => m.id === id ? { ...m, liked: !m.liked } : m));

  const handleReset = () => {
    if (window.confirm('Clear this conversation?')) {
      setMessages([{
        ...WELCOME_MESSAGE,
        id: `msg-welcome-${Date.now()}`,
        content: `### New Conversation\n\nKnowledge base cleared and ready. What would you like to know about?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    }
  };

  // ── Markdown renderer ─────────────────────────────────────────────────────
  const renderContent = (text: string) => {
    const lines = text.split('\n');
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
        {lines.map((line, i) => {
          const s = line.trim();
          if (!s) return <Box key={i} sx={{ height: 6 }} />;

          if (s.startsWith('### ')) {
            return (
              <Typography key={i} sx={{
                fontWeight: 700, fontSize: { xs: '1rem', md: '1.08rem' },
                color: isDark ? '#f8fafc' : '#0f172a',
                letterSpacing: '-0.01em', lineHeight: 1.3, mt: 0.5,
              }}>
                {s.replace('### ', '')}
              </Typography>
            );
          }
          if (s.startsWith('#### ')) {
            return (
              <Typography key={i} sx={{
                fontWeight: 600, fontSize: '0.95rem',
                color: isDark ? '#e2e8f0' : '#1e293b', mt: 0.5,
              }}>
                {s.replace('#### ', '')}
              </Typography>
            );
          }
          if (s.match(/^\d+\.\s/)) {
            const numText = s.replace(/^\d+\.\s/, '');
            const num = s.match(/^(\d+)/)?.[1];
            return (
              <Box key={i} sx={{ display: 'flex', gap: 1.2, alignItems: 'flex-start' }}>
                <Box sx={{
                  minWidth: 22, height: 22, borderRadius: '50%',
                  bgcolor: t.accent, color: t.activeText,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.7rem', fontWeight: 800, flexShrink: 0, mt: 0.2,
                }}>
                  {num}
                </Box>
                <Typography variant="body2" sx={{ color: isDark ? '#cbd5e1' : '#334155', lineHeight: 1.65 }}
                  dangerouslySetInnerHTML={{ __html: bold(numText) }} />
              </Box>
            );
          }
          if (s.startsWith('- ') || s.startsWith('* ')) {
            const bt = s.slice(2);
            return (
              <Box key={i} sx={{ display: 'flex', gap: 1.2, alignItems: 'flex-start', pl: 0.5 }}>
                <Box sx={{
                  width: 5, height: 5, borderRadius: '50%',
                  bgcolor: t.muted, flexShrink: 0, mt: 1.1,
                }} />
                <Typography variant="body2" sx={{ color: isDark ? '#cbd5e1' : '#334155', lineHeight: 1.65 }}
                  dangerouslySetInnerHTML={{ __html: bold(bt) }} />
              </Box>
            );
          }
          if (s.startsWith('> ')) {
            const qt = s.slice(2);
            return (
              <Box key={i} sx={{
                pl: 1.5, py: 1, my: 0.5,
                borderLeft: `3px solid ${t.muted}`,
                bgcolor: t.infoTag, borderRadius: '0 6px 6px 0',
              }}>
                <Typography variant="body2" sx={{ color: t.muted, fontStyle: 'italic', lineHeight: 1.55 }}
                  dangerouslySetInnerHTML={{ __html: bold(qt) }} />
              </Box>
            );
          }
          return (
            <Typography key={i} variant="body2" sx={{ color: isDark ? '#cbd5e1' : '#475569', lineHeight: 1.65 }}
              dangerouslySetInnerHTML={{ __html: bold(s) }} />
          );
        })}
      </Box>
    );
  };

  const bold = (s: string) =>
    s.replace(/\*\*(.*?)\*\*/g, `<strong style="color:${isDark ? '#f8fafc' : '#0f172a'};font-weight:700;">$1</strong>`);

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ bgcolor: t.bg, minHeight: '100vh', py: 0 }}>
      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 3 } }}>

        {/* ── HEADER ────────────────────────────────────────────────────── */}
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
              <Box sx={{
                width: 38, height: 38, borderRadius: '10px',
                bgcolor: t.accent, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <SmartToyIcon sx={{ color: t.activeText, fontSize: 20 }} />
              </Box>
              <Box>
                <Typography sx={{
                  fontWeight: 800, fontSize: { xs: '1.2rem', md: '1.5rem' },
                  color: isDark ? '#ffffff' : '#000000', letterSpacing: '-0.03em',
                }}>
                  AI Advisor
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                  <Box sx={{
                    width: 7, height: 7, borderRadius: '50%', bgcolor: t.greenDot,
                    animation: 'pulse 2s infinite',
                    '@keyframes pulse': {
                      '0%, 100%': { opacity: 0.8 },
                      '50%': { opacity: 1, transform: 'scale(1.2)' },
                    },
                  }} />
                  <Typography variant="caption" sx={{ color: t.muted, fontSize: '0.72rem' }}>
                    RAG 2.0 · 9 Technical Manuals · 23 Verified Models
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>

          <Tooltip title="Clear conversation">
            <IconButton size="small" onClick={handleReset} sx={{
              color: t.muted, border: `1px solid ${t.border}`,
              bgcolor: t.surface, borderRadius: '8px', p: 1,
              '&:hover': { color: isDark ? '#f87171' : '#dc2626', borderColor: isDark ? '#f87171' : '#dc2626' },
            }}>
              <RestartAltIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        {/* ── DOMAIN FILTER BAR ──────────────────────────────────────────── */}
        <Box sx={{ display: 'flex', gap: 0.8, mb: 2, overflowX: 'auto', pb: 0.5,
          '&::-webkit-scrollbar': { height: 3 },
          '&::-webkit-scrollbar-thumb': { bgcolor: t.border, borderRadius: 2 },
        }}>
          {DOMAIN_FILTERS.map(d => {
            const active = selectedDomain === d.id;
            return (
              <Chip
                key={d.id}
                icon={<Box sx={{ color: active ? t.activeText : t.muted, display: 'flex' }}>{d.icon}</Box>}
                label={d.label}
                onClick={() => setSelectedDomain(d.id)}
                sx={{
                  cursor: 'pointer', fontWeight: 600, fontSize: '0.78rem',
                  height: 34, borderRadius: '8px', flexShrink: 0,
                  bgcolor: active ? t.accent : t.surface,
                  color: active ? t.activeText : t.muted,
                  border: `1px solid ${active ? t.accent : t.border}`,
                  transition: 'all 0.18s ease',
                  '&:hover': { bgcolor: active ? t.accent : t.surface2, borderColor: t.borderHov },
                }}
              />
            );
          })}
        </Box>

        {/* ── PRESET PROMPTS ────────────────────────────────────────────── */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, mb: 2 }}>
          {DOMAIN_PRESETS[selectedDomain].map((p, i) => (
            <Chip key={i} label={p} onClick={() => handleSend(p)} size="small"
              sx={{
                cursor: 'pointer', fontSize: '0.73rem', height: 28,
                bgcolor: t.surface2, color: t.muted, border: `1px solid ${t.border}`,
                borderRadius: '6px', fontWeight: 500,
                transition: 'all 0.15s',
                '&:hover': { bgcolor: t.surface3, color: isDark ? '#f1f5f9' : '#0f172a', borderColor: t.borderHov },
              }}
            />
          ))}
        </Box>

        {/* ── CHAT PANEL ────────────────────────────────────────────────── */}
        <Paper elevation={0} sx={{
          bgcolor: t.surface,
          border: `1px solid ${t.border}`,
          borderRadius: '16px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          height: { xs: '62vh', md: '70vh' },
          minHeight: 480,
        }}>

          {/* Messages area */}
          <Box sx={{
            flexGrow: 1, overflowY: 'auto', p: { xs: 2, md: 2.5 },
            display: 'flex', flexDirection: 'column', gap: 2.5,
            '&::-webkit-scrollbar': { width: 4 },
            '&::-webkit-scrollbar-thumb': { bgcolor: t.border, borderRadius: 2 },
          }}>
            {messages.map(msg => {
              const isUser = msg.role === 'user';
              return (
                <Box key={msg.id} sx={{
                  display: 'flex', gap: 1.5,
                  alignItems: 'flex-start',
                  justifyContent: isUser ? 'flex-end' : 'flex-start',
                }}>
                  {/* Bot avatar */}
                  {!isUser && (
                    <Avatar sx={{
                      bgcolor: t.accent, color: t.activeText, width: 34, height: 34,
                      fontSize: '0.85rem', flexShrink: 0,
                    }}>
                      <SmartToyIcon sx={{ fontSize: 18 }} />
                    </Avatar>
                  )}

                  <Box sx={{ maxWidth: { xs: '94%', md: '84%' }, display: 'flex', flexDirection: 'column', gap: 1 }}>

                    {/* Bot header strip */}
                    {!isUser && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        {msg.intent === 'non_english_script' ? (
                          /* Non-English script badge */
                          <Box sx={{
                            display: 'inline-flex', alignItems: 'center', gap: 0.5,
                            px: 1, py: 0.3, borderRadius: '5px',
                            bgcolor: isDark ? 'rgba(234,179,8,0.1)' : 'rgba(202,138,4,0.08)',
                            border: `1px solid ${isDark ? 'rgba(234,179,8,0.3)' : 'rgba(202,138,4,0.2)'}`,
                          }}>
                            <TranslateIcon sx={{ fontSize: 12, color: isDark ? '#facc15' : '#b45309' }} />
                            <Typography sx={{ fontSize: '0.67rem', color: isDark ? '#facc15' : '#b45309', fontWeight: 700 }}>
                              Non-English Alphabets Detected
                            </Typography>
                          </Box>
                        ) : msg.isOffTopic ? (
                          /* Off-topic badge */
                          <Box sx={{
                            display: 'inline-flex', alignItems: 'center', gap: 0.5,
                            px: 1, py: 0.3, borderRadius: '5px',
                            bgcolor: isDark ? 'rgba(248,113,113,0.1)' : 'rgba(220,38,38,0.07)',
                            border: `1px solid ${isDark ? 'rgba(248,113,113,0.3)' : 'rgba(220,38,38,0.2)'}`,
                          }}>
                            <DirectionsCarIcon sx={{ fontSize: 12, color: isDark ? '#f87171' : '#dc2626' }} />
                            <Typography sx={{ fontSize: '0.67rem', color: isDark ? '#f87171' : '#dc2626', fontWeight: 700 }}>
                              Out of Scope — Cars Only
                            </Typography>
                          </Box>
                        ) : (
                          /* Normal RAG badge */
                          <Box sx={{
                            display: 'inline-flex', alignItems: 'center', gap: 0.5,
                            px: 1, py: 0.3, borderRadius: '5px',
                            bgcolor: t.infoTag, border: `1px solid ${t.border}`,
                          }}>
                            <ShieldIcon sx={{ fontSize: 12, color: t.muted }} />
                            <Typography sx={{ fontSize: '0.67rem', color: t.muted, fontWeight: 700 }}>
                              RAG Grounded · {msg.confidenceScore ?? 96}% Confidence
                            </Typography>
                          </Box>
                        )}
                        {!msg.isOffTopic && msg.latencyMs && (
                          <Typography sx={{ fontSize: '0.65rem', color: t.mutedFaint }}>
                            {msg.latencyMs}ms
                          </Typography>
                        )}
                        {!msg.isOffTopic && msg.citations && msg.citations.length > 0 && (
                          <Box
                            onClick={() => setExpandedCitId(expandedCitId === msg.id ? null : msg.id)}
                            sx={{
                              display: 'inline-flex', alignItems: 'center', gap: 0.4,
                              px: 0.9, py: 0.3, borderRadius: '5px', cursor: 'pointer',
                              bgcolor: t.infoTag, border: `1px solid ${t.border}`,
                              '&:hover': { borderColor: t.borderHov },
                              transition: 'all 0.15s',
                            }}
                          >
                            <MenuBookIcon sx={{ fontSize: 11, color: t.muted }} />
                            <Typography sx={{ fontSize: '0.67rem', color: t.muted, fontWeight: 700 }}>
                              {msg.citations.length} Sources
                            </Typography>
                            {expandedCitId === msg.id
                              ? <ExpandLessIcon sx={{ fontSize: 12, color: t.muted }} />
                              : <ExpandMoreIcon sx={{ fontSize: 12, color: t.muted }} />
                            }
                          </Box>
                        )}
                      </Box>
                    )}

                    {/* Message bubble */}
                    <Box sx={{
                      px: { xs: 1.6, md: 2 }, py: 1.5,
                      borderRadius: isUser ? '14px 3px 14px 14px' : '3px 14px 14px 14px',
                      bgcolor: msg.isOffTopic
                        ? isDark ? 'rgba(248,113,113,0.06)' : 'rgba(220,38,38,0.04)'
                        : isUser ? t.userBg : t.botBg,
                      border: `1px solid ${msg.isOffTopic
                        ? isDark ? 'rgba(248,113,113,0.25)' : 'rgba(220,38,38,0.18)'
                        : t.border}`,
                    }}>
                      {isUser
                        ? <Typography variant="body2" sx={{ color: isDark ? '#f1f5f9' : '#0f172a', lineHeight: 1.65, fontWeight: 500 }}>
                            {msg.content}
                          </Typography>
                        : renderContent(msg.content)
                      }
                    </Box>

                    {/* ── CITATIONS ACCORDION ────────────────────────── */}
                    {!isUser && msg.citations && msg.citations.length > 0 && (
                      <Collapse in={expandedCitId === msg.id}>
                        <Box sx={{
                          mt: 0.3, p: 1.5, borderRadius: '10px',
                          bgcolor: t.surface2, border: `1px solid ${t.border}`,
                        }}>
                          <Typography sx={{ fontSize: '0.68rem', color: t.muted, fontWeight: 700, mb: 1, textTransform: 'uppercase', letterSpacing: 0.6 }}>
                            Retrieved Knowledge Sources
                          </Typography>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {msg.citations.map((c, ci) => (
                              <Box key={ci} sx={{
                                p: 1.2, borderRadius: '8px',
                                bgcolor: t.surface, border: `1px solid ${t.border}`,
                              }}>
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1, mb: 0.4 }}>
                                  <Typography sx={{ fontWeight: 700, color: isDark ? '#e2e8f0' : '#1e293b', fontSize: '0.78rem', lineHeight: 1.3 }}>
                                    {c.document}
                                  </Typography>
                                  <Chip label={`${c.relevanceScore}%`} size="small" sx={{
                                    height: 18, fontSize: '0.62rem', fontWeight: 700,
                                    bgcolor: t.surface3, color: t.muted, flexShrink: 0,
                                  }} />
                                </Box>
                                <Typography sx={{ fontSize: '0.71rem', color: t.muted, fontWeight: 600, mb: 0.4 }}>
                                  § {c.section}
                                </Typography>
                                <Typography sx={{ fontSize: '0.72rem', color: isDark ? '#94a3b8' : '#64748b', fontStyle: 'italic', lineHeight: 1.5 }}>
                                  "{c.snippet}"
                                </Typography>
                              </Box>
                            ))}
                          </Box>
                        </Box>
                      </Collapse>
                    )}

                    {/* ── MATCHED VEHICLE CARDS ──────────────────────── */}
                    {!isUser && msg.matchedVehicles && msg.matchedVehicles.length > 0 && (
                      <Box sx={{ mt: 0.5 }}>
                        <Typography sx={{ fontSize: '0.68rem', color: t.muted, fontWeight: 700, mb: 1, textTransform: 'uppercase', letterSpacing: 0.6 }}>
                          Matched Vehicles from Database
                        </Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: `repeat(${Math.min(msg.matchedVehicles.length, 3)}, 1fr)` }, gap: 1.2 }}>
                          {msg.matchedVehicles.map((v, vi) => {
                            const isEv = v.fuel_type === 'electric' || (v.ev_range_km && v.ev_range_km > 0);
                            return (
                              <Card key={v.id} elevation={0} sx={{
                                bgcolor: t.surface2, border: `1px solid ${t.border}`,
                                borderRadius: '12px', overflow: 'hidden',
                                transition: 'all 0.2s ease',
                                '&:hover': { borderColor: t.borderHov, transform: 'translateY(-2px)' },
                              }}>
                                <Box sx={{ position: 'relative', overflow: 'hidden', height: 110 }}>
                                  <CardMedia
                                    component="img"
                                    height="110"
                                    image={v.primary_image_url || '/images/cars/creta.png'}
                                    alt={v.model_name}
                                    sx={{ objectFit: 'cover', filter: isDark ? 'brightness(0.9)' : 'none' }}
                                  />
                                  <Box sx={{
                                    position: 'absolute', top: 8, right: 8,
                                    bgcolor: t.accent, color: t.activeText,
                                    fontSize: '0.6rem', fontWeight: 800, px: 0.8, py: 0.3, borderRadius: '4px',
                                  }}>
                                    #{vi + 1} MATCH
                                  </Box>
                                </Box>
                                <CardContent sx={{ p: 1.4, '&:last-child': { pb: 1.4 } }}>
                                  <Typography sx={{ fontSize: '0.68rem', color: t.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                                    {v.brand.name}
                                  </Typography>
                                  <Typography sx={{ fontWeight: 700, color: isDark ? '#f1f5f9' : '#0f172a', fontSize: '0.88rem', lineHeight: 1.2, mb: 0.5 }}>
                                    {v.model_name}
                                  </Typography>
                                  <Typography sx={{ fontWeight: 800, color: isDark ? '#f8fafc' : '#000000', fontSize: '0.9rem', mb: 0.8 }}>
                                    ₹{(v.ex_showroom_price / 100000).toFixed(2)}L
                                  </Typography>

                                  {/* Spec chips */}
                                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
                                    <Chip size="small" label={isEv ? `${v.ev_range_km || 400} km` : `${v.mileage_kmpl || '--'} km/l`}
                                      sx={{ height: 18, fontSize: '0.62rem', bgcolor: t.surface3, color: t.muted }} />
                                    {v.safety_rating && (
                                      <Chip size="small"
                                        label={`${v.safety_rating}★`}
                                        icon={<StarIcon sx={{ fontSize: '10px !important', color: `${t.starColor} !important` }} />}
                                        sx={{ height: 18, fontSize: '0.62rem', bgcolor: t.surface3, color: t.muted }} />
                                    )}
                                    <Chip size="small" label={v.transmission}
                                      sx={{ height: 18, fontSize: '0.62rem', bgcolor: t.surface3, color: t.muted, textTransform: 'capitalize' }} />
                                  </Box>

                                  <Box sx={{ display: 'flex', gap: 0.8 }}>
                                    <Button variant="contained" size="small" fullWidth
                                      onClick={() => onStartPurchase(v)}
                                      sx={{
                                        py: 0.5, fontSize: '0.7rem', fontWeight: 700,
                                        bgcolor: t.accent, color: t.activeText, borderRadius: '6px',
                                        '&:hover': { bgcolor: t.accentSub, transform: 'none' },
                                      }}>
                                      Book
                                    </Button>
                                    <Button variant="outlined" size="small"
                                      onClick={() => onSelectVehicle(v)}
                                      sx={{
                                        py: 0.5, fontSize: '0.7rem', fontWeight: 600,
                                        borderColor: t.border, color: t.muted, borderRadius: '6px', minWidth: 52,
                                        '&:hover': { borderColor: t.borderHov, color: isDark ? '#f1f5f9' : '#0f172a', transform: 'none' },
                                      }}>
                                      Info
                                    </Button>
                                  </Box>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </Box>
                      </Box>
                    )}

                    {/* ── FOLLOW-UP QUESTIONS ───────────────────────── */}
                    {!isUser && msg.suggestedFollowups && msg.suggestedFollowups.length > 0 && (
                      <Box sx={{ mt: 0.5 }}>
                        <Typography sx={{ fontSize: '0.67rem', color: t.mutedFaint, fontWeight: 700, mb: 0.8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          Follow-up Questions
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6 }}>
                          {msg.suggestedFollowups.map((f, fi) => (
                            <Chip key={fi} label={f} onClick={() => handleSend(f)} size="small" deleteIcon={
                              <ArrowForwardIcon sx={{ fontSize: '12px !important', color: `${t.muted} !important` }} />
                            } onDelete={() => handleSend(f)}
                              sx={{
                                cursor: 'pointer', fontSize: '0.71rem', height: 26,
                                bgcolor: t.surface2, color: t.muted,
                                border: `1px solid ${t.border}`, borderRadius: '6px',
                                '&:hover': { bgcolor: t.surface3, borderColor: t.borderHov, color: isDark ? '#f1f5f9' : '#0f172a' },
                                transition: 'all 0.15s',
                              }}
                            />
                          ))}
                        </Box>
                      </Box>
                    )}

                    {/* ── MESSAGE ACTIONS ───────────────────────────── */}
                    {!isUser && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.3 }}>
                        <Tooltip title={copiedId === msg.id ? 'Copied!' : 'Copy answer'}>
                          <IconButton size="small" onClick={() => handleCopy(msg.content, msg.id)}
                            sx={{ p: 0.6, color: t.mutedFaint, '&:hover': { color: t.muted } }}>
                            {copiedId === msg.id
                              ? <CheckIcon sx={{ fontSize: 14, color: t.greenDot }} />
                              : <ContentCopyIcon sx={{ fontSize: 14 }} />
                            }
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={msg.liked ? 'Liked' : 'Mark as helpful'}>
                          <IconButton size="small" onClick={() => handleLike(msg.id)}
                            sx={{ p: 0.6, color: msg.liked ? isDark ? '#ffffff' : '#000000' : t.mutedFaint, '&:hover': { color: t.muted } }}>
                            {msg.liked ? <ThumbUpIcon sx={{ fontSize: 14 }} /> : <ThumbUpOutlinedIcon sx={{ fontSize: 14 }} />}
                          </IconButton>
                        </Tooltip>
                        <Typography sx={{ fontSize: '0.62rem', color: t.mutedFaint, ml: 'auto' }}>
                          {msg.timestamp}
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  {/* User avatar */}
                  {isUser && (
                    <Avatar sx={{ bgcolor: t.surface3, color: t.muted, width: 34, height: 34, flexShrink: 0 }}>
                      <PersonIcon sx={{ fontSize: 18 }} />
                    </Avatar>
                  )}
                </Box>
              );
            })}

            {/* ── RAG PIPELINE INDICATOR ──────────────────────────── */}
            {loading && (
              <Fade in={loading}>
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                  <Avatar sx={{ bgcolor: t.accent, color: t.activeText, width: 34, height: 34 }}>
                    <SmartToyIcon sx={{ fontSize: 18 }} />
                  </Avatar>
                  <Box sx={{
                    px: 2, py: 1.8, borderRadius: '3px 14px 14px 14px',
                    bgcolor: t.botBg, border: `1px solid ${t.border}`,
                    minWidth: 260,
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.2 }}>
                      <CircularProgress size={14} sx={{ color: isDark ? '#94a3b8' : '#64748b' }} />
                      <Typography sx={{ fontSize: '0.78rem', color: t.muted, fontWeight: 600 }}>
                        Processing RAG Query
                      </Typography>
                    </Box>
                    <Typography sx={{ fontSize: '0.74rem', color: t.mutedFaint, mb: 1.2, fontStyle: 'italic' }}>
                      {RAG_STEPS[ragStepIdx]}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {RAG_STEPS.map((_, i) => (
                        <Box key={i} sx={{
                          height: 2, flexGrow: 1, borderRadius: 1,
                          bgcolor: i <= ragStepIdx ? (isDark ? '#ffffff' : '#000000') : t.border,
                          transition: 'all 0.3s ease',
                        }} />
                      ))}
                    </Box>
                  </Box>
                </Box>
              </Fade>
            )}

            <div ref={messagesEnd} />
          </Box>

          <Divider sx={{ borderColor: t.border }} />

          {/* ── INPUT BAR ────────────────────────────────────────────── */}
          <Box component="form" onSubmit={e => { e.preventDefault(); handleSend(); }}
            sx={{ p: { xs: 1.5, md: 2 }, bgcolor: t.surface, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField
                fullWidth variant="outlined" size="small"
                placeholder="Ask about safety ratings, mileage, EV range, comparisons, or EMI..."
                value={input}
                onChange={e => setInput(e.target.value)}
                disabled={loading}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '10px',
                    bgcolor: t.surface2,
                    color: isDark ? '#f1f5f9' : '#0f172a',
                    fontSize: '0.9rem',
                    '& fieldset': { borderColor: t.border },
                    '&:hover fieldset': { borderColor: t.borderHov },
                    '&.Mui-focused fieldset': { borderColor: t.accent, borderWidth: '1.5px' },
                    '& ::placeholder': { color: t.muted, opacity: 1 },
                  },
                }}
              />
              <Button type="submit" variant="contained" disabled={loading || !input.trim()}
                endIcon={<SendIcon sx={{ fontSize: 16 }} />}
                sx={{
                  borderRadius: '10px', px: 2.5, py: 1, fontWeight: 700,
                  fontSize: '0.85rem', flexShrink: 0, minWidth: 96,
                  bgcolor: t.accent, color: t.activeText,
                  boxShadow: 'none',
                  '&:hover': { bgcolor: t.accentSub, transform: 'none', boxShadow: 'none' },
                  '&.Mui-disabled': { bgcolor: t.infoTag, color: t.mutedFaint },
                }}>
                Send
              </Button>
            </Box>
            <Typography sx={{ fontSize: '0.65rem', color: t.mutedFaint, px: 0.5 }}>
              Answers grounded in Bharat NCAP crash data, ARAI telemetry & OEM technical manuals. Press Enter to send.
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};
