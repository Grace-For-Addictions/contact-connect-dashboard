import React from 'react'
import ReactDOM from 'react-dom/client'
import RoomHost from '@/shell/RoomHost'
import '@/index.css'

// The VRCC shell (index.html + /vrcc-*.js) owns spatial navigation. React
// mounts into the room scene and renders the live page behind whichever door
// the visitor opens.
const mount = document.getElementById('react-room')
if (mount) {
  ReactDOM.createRoot(mount).render(<RoomHost />)
}

if (import.meta.hot) {
  import.meta.hot.on('vite:beforeUpdate', () => {
    window.parent?.postMessage({ type: 'sandbox:beforeUpdate' }, '*');
  });
  import.meta.hot.on('vite:afterUpdate', () => {
    window.parent?.postMessage({ type: 'sandbox:afterUpdate' }, '*');
  });
}
