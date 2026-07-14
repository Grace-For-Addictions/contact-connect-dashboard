import React, { useEffect, useState } from 'react';
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import { AuthProvider } from '@/lib/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import GraceCompanion from '@/components/GraceCompanion';
import { pagesConfig } from '@/pages.config';

const { Pages } = pagesConfig;

/**
 * RoomRouter — renders the room's live React page inside an isolated
 * MemoryRouter so pages that use <Link> / useNavigate / createPageUrl keep
 * working, scoped to the room rather than hijacking the spatial shell's URL.
 */
function RoomRouter({ page }) {
  return (
    <MemoryRouter initialEntries={[`/${page}`]} initialIndex={0}>
      <Routes>
        {Object.entries(Pages).map(([key, Page]) => (
          <Route key={key} path={`/${key}`} element={<Page />} />
        ))}
        <Route path="*" element={<Navigate to={`/${page}`} replace />} />
      </Routes>
    </MemoryRouter>
  );
}

/**
 * RoomHost — the bridge between the vanilla VRCC shell and React.
 *
 * The shell dispatches `vrcc:enter-room` (with the room's mapped `page`) when a
 * door opens, and `vrcc:exit-room` when the visitor leaves. This component
 * mounts the matching page inside a framed "room interior" panel. Providers
 * stay mounted across room changes so query cache and auth persist.
 */
export default function RoomHost() {
  const [room, setRoom] = useState(null);

  useEffect(() => {
    const onEnter = (e) => setRoom(e.detail?.page ? e.detail : null);
    const onExit = () => setRoom(null);
    window.addEventListener('vrcc:enter-room', onEnter);
    window.addEventListener('vrcc:exit-room', onExit);
    return () => {
      window.removeEventListener('vrcc:enter-room', onEnter);
      window.removeEventListener('vrcc:exit-room', onExit);
    };
  }, []);

  const handleBack = () => window.goBack?.();

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        {room && (
          <div className="rr-frame" style={{ ['--room-accent']: room.accent }}>
            <div className="rr-bar">
              <button className="rr-back" onClick={handleBack} aria-label="Back to the hallway">
                ← Hallway
              </button>
              <span className="rr-title">{room.ico} {room.name}</span>
              <span className="rr-tag">{room.tag}</span>
            </div>
            <div className="rr-scroll" key={room.page}>
              <RoomRouter page={room.page} />
            </div>
          </div>
        )}
        <Toaster />
        <GraceCompanion />
      </QueryClientProvider>
    </AuthProvider>
  );
}
