const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

module.exports = {
  packagerConfig: {
    name: 'Claude Chat Exporter',
    icon: './assets/icon', // 不需要扩展名，会自动识别
    ignore: [
      /^\/src/,
      /^\/public/,
      /^\/\.git/,
      /^\/node_modules\/\.cache/,
      /^\/\.env/
    ]
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'claude_chat_exporter'
      }
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin']
    },
    {
      name: '@electron-forge/maker-deb',
      config: {
        options: {
          name: 'claude-chat-exporter',
          productName: 'Claude Chat Exporter',
          categories: ['Utility']
        }
      }
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {}
    }
  ]
};
