'use client';
import TrainerSchedulePage from '@/components/trainer/TrainerSchedulePage';
import TrainerShell        from '@/components/trainer/layout/TrainerShell';

export default function SchedulePage() {
  return (
    <TrainerShell>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, letterSpacing: 1, color: 'var(--if-text, #f0f0f0)', margin: 0 }}>Schedule</h1>
        <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: 13, color: '#888', margin: '4px 0 0' }}>Your duty roster, all trainer assignments and gym holidays</p>
      </div>
      <TrainerSchedulePage />
    </TrainerShell>
  );
}
