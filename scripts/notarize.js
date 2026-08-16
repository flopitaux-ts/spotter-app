const { notarize } = require('@electron/notarize');

// Notarization credentials come from one of two places:
//   CI      - APPLE_ID / APPLE_APP_SPECIFIC_PASSWORD / APPLE_TEAM_ID secrets
//   locally - a keychain profile created with `xcrun notarytool store-credentials`,
//             which keeps the app-specific password out of .env entirely.
// Env vars win so CI never picks up a developer's local profile.
const KEYCHAIN_PROFILE = process.env.NOTARIZE_KEYCHAIN_PROFILE || 'spotter-notary';

function resolveCredentials() {
  const { APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD, APPLE_TEAM_ID } = process.env;
  if (APPLE_ID && APPLE_APP_SPECIFIC_PASSWORD && APPLE_TEAM_ID) {
    return {
      source: 'environment',
      options: {
        appleId: APPLE_ID,
        appleIdPassword: APPLE_APP_SPECIFIC_PASSWORD,
        teamId: APPLE_TEAM_ID,
      },
    };
  }
  return { source: `keychain profile "${KEYCHAIN_PROFILE}"`, options: { keychainProfile: KEYCHAIN_PROFILE } };
}

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;
  if (electronPlatformName !== 'darwin') return;

  if (process.env.SKIP_NOTARIZE) {
    console.log('Skipping notarization: SKIP_NOTARIZE is set');
    return;
  }

  const appPath = `${appOutDir}/${context.packager.appInfo.productFilename}.app`;
  const { source, options } = resolveCredentials();

  console.log(`Notarizing ${appPath} using ${source}...`);

  await notarize({ appPath, ...options });

  console.log('Notarization complete.');
};
