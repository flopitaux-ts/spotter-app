const { session } = require('electron');
const config = require('./config');
const { isValidHttpsUrl } = require('./urls');

// ThoughtSpot's v1 session Org endpoints — GET lists the Orgs the logged-in user
// belongs to, PUT moves the session to one of them. This is the pair the
// product's own Org switcher uses, so it works on any cluster with Orgs enabled.
// The SDK's overrideOrgId was the alternative, but it is honoured only when the
// Per Org URL feature is on, so it would silently do nothing elsewhere.
const ORGS_PATH = '/callosum/v1/tspublic/v1/session/orgs';

// Required on every v1 request; the cluster rejects the call without it.
const REQUESTED_BY = { 'X-Requested-By': 'ThoughtSpot' };

const NO_ORGS = { orgs: [], currentOrgId: null };

// The host is read from the persisted config rather than trusted from the
// renderer, matching how the auth window resolves it.
function orgsUrl() {
  const host = config.read().hostUrl;
  return isValidHttpsUrl(host) ? `${host}${ORGS_PATH}` : null;
}

// session.defaultSession is the same cookie jar the OIDC auth window fills, so
// these calls ride the user's existing session. Running them here rather than in
// the renderer also sidesteps CORS entirely — the renderer is a file:// page and
// would send Origin: null.
async function fetchOrgs() {
  const url = orgsUrl();
  if (!url) return NO_ORGS;
  try {
    // batchsize=-1 asks for every Org instead of the default first page.
    const res = await session.defaultSession.fetch(`${url}?batchsize=-1&offset=-1`, {
      headers: { ...REQUESTED_BY, Accept: 'application/json' },
      credentials: 'include',
    });
    // 403 is the ordinary answer on a cluster with Orgs switched off, or for a
    // user without the privilege. Not an error — just nothing to switch between.
    if (!res.ok) return NO_ORGS;
    const data = await res.json();
    const orgs = (data?.orgs || [])
      .filter((org) => org.isActive)
      .map((org) => ({ id: org.orgId, name: org.orgName }));
    return { orgs, currentOrgId: data?.currentOrgId ?? null };
  } catch {
    return NO_ORGS;
  }
}

async function switchOrg(orgId) {
  const url = orgsUrl();
  // orgId lands in a form body, so it has to be a number and nothing else —
  // the renderer is not trusted to supply one. Org 0 is Primary, hence Integer
  // rather than a truthiness check.
  if (!url || !Number.isInteger(orgId)) return false;
  try {
    const res = await session.defaultSession.fetch(url, {
      method: 'PUT',
      headers: { ...REQUESTED_BY, 'Content-Type': 'application/x-www-form-urlencoded' },
      credentials: 'include',
      body: `orgid=${orgId}`,
    });
    return res.ok;
  } catch {
    return false;
  }
}

module.exports = { fetchOrgs, switchOrg };
