// src/components/history/SummaryCards.jsx
import React from 'react';
import { KPICard } from '../common/KPICard';

export function SummaryCards({ cards = [] }) {
  if (!cards || cards.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card, idx) => (
        <KPICard
          key={idx}
          label={card.label}
          value={card.value}
          rawText={card.rawText}
          icon={card.icon}
          iconBg={card.iconBg || 'rgba(16, 185, 129, 0.12)'}
          iconColor={card.iconColor || '#10b981'}
          accentColor={card.accentColor || '#10b981'}
          subtitle={card.subtitle}
        />
      ))}
    </div>
  );
}
