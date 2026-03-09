const { notarize } = require('@electron/notarize');

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;
  if (electronPlatformName !== 'darwin') return;

  const appId = 'com.thoughtspot.spotter';
  const appPath = `${appOutDir}/${context.packager.appInfo.productFilename}.app`;

  if (!process.env.APPLE_ID || !process.env.APPLE_APP_SPECIFIC_PASSWORD) {
    console.log('Skipping notarization: APPLE_ID or APPLE_APP_SPECIFIC_PASSWORD not set');
    return;
  }

  console.log(`Notarizing ${appPath}...`);

  await notarize({
    appPath,
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD,
    teamId: process.env.APPLE_TEAM_ID || '8LDY3JKFJX',
  });

  console.log('Notarization complete.');
};
