import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import RoomHost from '@/shell/RoomHost'
import ResidenceApply from '@/pages/ResidenceApply'
import DailyCheckIn from '@/pages/DailyCheckIn'
import VrccOnboarding from '@/components/VrccOnboarding'
import { getIdentity, syncWindow } from '@/lib/identity'
import '@/index.css'

// Publish the current identity to the shell before anything renders, so the
// hallway locks the right doors from the first paint.
syncWindow(getIdentity())

const params = new URLSearchParams(window.location.search)

// Full-screen, phone-friendly self-service flows shareable as direct links.
function mountFullScreen(id, element) {
  const root = document.createElement('div')
  root.id = id
  root.style.cssText = 'position:fixed;inset:0;z-index:99999;overflow:auto;background:#f6f4f0'
  document.body.appendChild(root)
  document.body.style.overflow = 'auto'
  ReactDOM.createRoot(root).render(
    <QueryClientProvider client={queryClientInstance}>{element}</QueryClientProvider>
  )
}

if (params.has('apply')) {
  mountFullScreen('apply-root', <ResidenceApply />)
} else if (params.has('checkin')) {
  mountFullScreen('checkin-root', <DailyCheckIn />)
} else {
  // The VRCC shell (index.html + /vrcc-*.js) owns spatial navigation; React
  // mounts the live page behind whichever door the visitor opens.
  const mount = document.getElementById('react-room')
  if (mount) {
    ReactDOM.createRoot(mount).render(<RoomHost />)
  }

  // The self-identify / onboarding gate lives in its own overlay root so it can
  // cover the whole building (lobby, hallway, rooms) when the visitor enters.
  const onb = document.createElement('div')
  onb.id = 'onboarding-root'
  document.body.appendChild(onb)
  ReactDOM.createRoot(onb).render(
    <QueryClientProvider client={queryClientInstance}><VrccOnboarding /></QueryClientProvider>
  )
}

if (import.meta.hot) {
  import.meta.hot.on('vite:beforeUpdate', () => {
    window.parent?.postMessage({ type: 'sandbox:beforeUpdate' }, '*');
  });
  import.meta.hot.on('vite:afterUpdate', () => {
    window.parent?.postMessage({ type: 'sandbox:afterUpdate' }, '*');
  });
}
