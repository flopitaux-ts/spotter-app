import React, { useState, useEffect, useRef } from 'react';

// Titlebar Org switcher. Renders nothing at all unless the user actually has a
// choice to make — a single-Org user, and every cluster with Orgs switched off,
// sees the titlebar exactly as it was.
export function OrgSwitcher({ orgs, currentOrgId, switching, error, onSelect }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = () => setOpen(false);
    const onDocClick = (e) => {
      if (!rootRef.current?.contains(e.target)) close();
    };
    const onKeyDown = (e) => { if (e.key === 'Escape') close(); };
    // Most of the window is the embed's cross-origin iframe, and neither clicks
    // nor keys inside it reach this document — so the two listeners above go
    // silent the moment the user aims at the chat. Focus leaving the window is
    // the one signal that does survive the frame boundary, and it covers both
    // clicking into the chat and switching away from the app.
    window.addEventListener('blur', close);
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('blur', close);
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  if (orgs.length < 2) return null;

  const current = orgs.find((org) => org.id === currentOrgId);

  // The embed holds focus on load, so without this the Escape handler above
  // would never see a key press.
  const handleToggle = () => {
    setOpen((v) => !v);
    triggerRef.current?.focus();
  };

  const handleSelect = async (orgId) => {
    setOpen(false);
    if (orgId !== currentOrgId) await onSelect(orgId);
  };

  return (
    <div className="org-switcher" ref={rootRef}>
      <button
        ref={triggerRef}
        className="titlebar-btn"
        onClick={handleToggle}
        disabled={switching}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {switching ? 'Switching…' : (current?.name ?? 'Select Org')} ▾
      </button>
      {open && (
        <div className="org-menu" role="listbox">
          {orgs.map((org) => (
            <button
              key={org.id}
              className={`org-menu-item${org.id === currentOrgId ? ' org-menu-item--active' : ''}`}
              role="option"
              aria-selected={org.id === currentOrgId}
              onClick={() => handleSelect(org.id)}
            >
              <span className="org-menu-check">{org.id === currentOrgId ? '✓' : ''}</span>
              {org.name}
            </button>
          ))}
          {error && <p className="org-menu-error">{error}</p>}
        </div>
      )}
    </div>
  );
}
