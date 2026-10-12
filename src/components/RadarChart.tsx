'use client';

import React from 'react';

interface RadarChartProps {
  userScores: {
    effectiveness: number;
    efficiency: number;
    equity: number;
    responsiveness: number;
  };
  publicScores: {
    effectiveness: number;
    efficiency: number;
    equity: number;
    responsiveness: number;
  };
}

export default function RadarChart({ userScores, publicScores }: RadarChartProps) {
  const cx = 170;
  const cy = 150;
  const r = 100;

  // 4 axes: Top (Efektivitas), Right (Efisiensi), Bottom (Responsivitas), Left (Keadilan)
  const axes = [
    { label: 'Efektivitas', key: 'effectiveness' as const, angle: -Math.PI / 2, labelX: cx, labelY: cy - r - 16, anchor: 'middle' },
    { label: 'Efisiensi', key: 'efficiency' as const, angle: 0, labelX: cx + r + 14, labelY: cy + 4, anchor: 'start' },
    { label: 'Responsivitas', key: 'responsiveness' as const, angle: Math.PI / 2, labelX: cx, labelY: cy + r + 22, anchor: 'middle' },
    { label: 'Keadilan', key: 'equity' as const, angle: Math.PI, labelX: cx - r - 14, labelY: cy + 4, anchor: 'end' },
  ];

  // Grid levels (2.5, 5.0, 7.5, 10.0)
  const levels = [0.25, 0.5, 0.75, 1.0];

  const getPoints = (scores: { effectiveness: number; efficiency: number; equity: number; responsiveness: number }) => {
    return axes
      .map((axis) => {
        const val = Math.max(0, Math.min(10, scores[axis.key])) / 10;
        const x = cx + r * val * Math.cos(axis.angle);
        const y = cy + r * val * Math.sin(axis.angle);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  };

  const userPolygon = getPoints(userScores);
  const publicPolygon = getPoints(publicScores);

  return (
    <div style={{ width: '100%', maxWidth: '340px', margin: '0 auto', userSelect: 'none' }}>
      <svg
        viewBox="0 0 340 300"
        style={{ width: '100%', height: 'auto', overflow: 'visible' }}
        aria-label="Grafik Radar Perbandingan 4 Dimensi"
      >
        <defs>
          <radialGradient id="radarCenterGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFF1ED" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </radialGradient>
          <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.1" />
          </filter>
        </defs>

        {/* Center Glow */}
        <circle cx={cx} cy={cy} r={r * 0.9} fill="url(#radarCenterGlow)" />

        {/* Concentric Grid Polygons */}
        {levels.map((lvl) => {
          const pts = axes
            .map((axis) => {
              const x = cx + r * lvl * Math.cos(axis.angle);
              const y = cy + r * lvl * Math.sin(axis.angle);
              return `${x.toFixed(1)},${y.toFixed(1)}`;
            })
            .join(' ');

          return (
            <polygon
              key={lvl}
              points={pts}
              fill="none"
              stroke="#E2E8F0"
              strokeWidth={lvl === 1.0 ? '1.5' : '1'}
              strokeDasharray={lvl === 1.0 ? 'none' : '3,3'}
            />
          );
        })}

        {/* Axis Crosshairs */}
        {axes.map((axis) => {
          const x = cx + r * Math.cos(axis.angle);
          const y = cy + r * Math.sin(axis.angle);
          return (
            <line
              key={axis.label}
              x1={cx}
              y1={cy}
              x2={x}
              y2={y}
              stroke="#E2E8F0"
              strokeWidth="1.2"
            />
          );
        })}

        {/* Public Consensus Polygon (Green/Mint) */}
        <polygon
          points={publicPolygon}
          fill="rgba(16, 185, 129, 0.16)"
          stroke="#10B981"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* Public Points */}
        {axes.map((axis) => {
          const val = Math.max(0, Math.min(10, publicScores[axis.key])) / 10;
          const x = cx + r * val * Math.cos(axis.angle);
          const y = cy + r * val * Math.sin(axis.angle);
          return (
            <circle
              key={`pub-${axis.key}`}
              cx={x}
              cy={y}
              r="4"
              fill="#10B981"
              stroke="#FFFFFF"
              strokeWidth="1.5"
            />
          );
        })}

        {/* User Evaluation Polygon (Coral/Primary) */}
        <polygon
          points={userPolygon}
          fill="rgba(255, 107, 74, 0.25)"
          stroke="#FF6B4A"
          strokeWidth="2.5"
          strokeLinejoin="round"
          filter="url(#softShadow)"
        />

        {/* User Points */}
        {axes.map((axis) => {
          const val = Math.max(0, Math.min(10, userScores[axis.key])) / 10;
          const x = cx + r * val * Math.cos(axis.angle);
          const y = cy + r * val * Math.sin(axis.angle);
          return (
            <g key={`user-${axis.key}`}>
              <circle
                cx={x}
                cy={y}
                r="5"
                fill="#FF6B4A"
                stroke="#FFFFFF"
                strokeWidth="2"
              />
            </g>
          );
        })}

        {/* Axis Labels & Current Scores */}
        {axes.map((axis) => (
          <g key={`lbl-${axis.label}`}>
            <text
              x={axis.labelX}
              y={axis.labelY}
              textAnchor={axis.anchor as 'middle' | 'start' | 'end'}
              fill="#334155"
              fontSize="11.5"
              fontWeight="700"
              fontFamily="var(--font-sans), sans-serif"
            >
              {axis.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
