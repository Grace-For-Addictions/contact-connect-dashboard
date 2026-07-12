import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import RoomHost from '@/shell/RoomHost'
import ResidenceApply from '@/pages/ResidenceApply'
import '@/index.css'

const params = new URLSearchParams(window.location.search)

if (params.has('apply')) {
  // Public self-service applicant flow — shareable as /?apply=1.
  // Renders full-screen over the shell so it works great on a phone.
  const root = document.createElement('div')
  root.id = 'apply-root'
  root.style.cssText = 'position:fixed;inset:0;z-index:99999;overflow:auto;background:#f6f4f0'
  document.body.appendChild(root)
  document.body.style.overflow = 'auto'
  ReactDOM.createRoot(root).render(
    <QueryClientProvider client={queryClientInstance}>
      <ResidenceApply />
    </QueryClientProvider>
  )
} else {
  // The VRCC shell (index.html + /vrcc-*.js) owns spatial navigation; React
  // mounts the live page behind whichever door the visitor opens.
  const mount = document.getElementById('react-room')
  if (mount) {
    ReactDOM.createRoot(mount).render(<RoomHost />)
  }
}

if (import.meta.hot) {
  import.meta.hot.on('vite:beforeUpdate', () => {
    window.parent?.postMessage({ type: 'sandbox:beforeUpdate' }, '*');
  });
  import.meta.hot.on('vite:afterUpdate', () => {
    window.parent?.postMessage({ type: 'sandbox:afterUpdate' }, '*');
  });
}
