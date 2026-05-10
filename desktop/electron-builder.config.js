/** @type {import('electron-builder').Configuration} */
module.exports = {
  appId: 'com.yoink.app',
  productName: 'Yoink',
  directories: { output: 'dist' },
  files: ['dist', 'dist-electron'],

  // Unpack native binaries from the asar archive so the OS can execute them
  asarUnpack: [
    'node_modules/ffmpeg-static/**',
    'node_modules/@ffprobe-installer/**',
    'node_modules/youtube-dl-exec/bin/**',
  ],

  icon: 'assets/icon.png',

  win: {
    icon: 'assets/icon.png',
    target: [{ target: 'nsis', arch: ['x64'] }],
    requestedExecutionLevel: 'asInvoker',
    // No code-signing certificate — skip signing to avoid winCodeSign download
    sign: () => {},
  },

  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: 'Yoink',
    installerIcon: 'assets/icon.ico',
    uninstallerIcon: 'assets/icon.ico',
  },

  mac: {
    icon: 'assets/icon.icns',
    target: [{ target: 'dmg', arch: ['arm64', 'x64'] }],
  },

  linux: {
    icon: 'assets/icon.png',
    target: 'AppImage',
  },
};
