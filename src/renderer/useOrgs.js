import { useState, useEffect, useCallback } from 'react';

// Org state for the titlebar switcher. The list and the switch both happen in
// the main process, which owns the ThoughtSpot session cookies — see
// src/main/orgs.js for why the renderer does not call the REST API itself.
//
// `enabled` gates the initial load on auth having landed: before that the
// session cookie is not usable and the call would come back empty, which the UI
// cannot tell apart from "this cluster has no Orgs".
export function useOrgs({ tsHost, enabled }) {
  const [orgs, setOrgs] = useState([]);
  const [currentOrgId, setCurrentOrgId] = useState(null);
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState('');
  // Counts completed switches, and nothing else. The embed is keyed on this so
  // it remounts when — and only when — the user actually changed Org. Keying it
  // on currentOrgId instead would remount once on startup too, as that goes from
  // null to the loaded value.
  const [epoch, setEpoch] = useState(0);

  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;
    (async () => {
      const result = await window.electronAPI?.getOrgs?.();
      if (cancelled || !result) return;
      setOrgs(result.orgs || []);
      setCurrentOrgId(result.currentOrgId ?? null);
    })();
    // tsHost is a dependency so switching instances re-reads rather than
    // carrying the previous cluster's Orgs across.
    return () => { cancelled = true; };
  }, [tsHost, enabled]);

  const switchTo = useCallback(async (orgId) => {
    setError('');
    setSwitching(true);
    const ok = await window.electronAPI?.switchOrg?.(orgId);
    setSwitching(false);
    // On failure the session is untouched, so leaving currentOrgId alone keeps
    // the UI honest about which Org is actually active.
    if (!ok) {
      setError('Could not switch Org.');
      return false;
    }
    setCurrentOrgId(orgId);
    setEpoch((n) => n + 1);
    return true;
  }, []);

  return { orgs, currentOrgId, switching, error, epoch, switchTo };
}
