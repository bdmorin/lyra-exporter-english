const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

module.exports = {
  // packagerConfig 用来配置 Electron Packager 的选项
  packagerConfig: {
    // 应用名称
    name: "Lyra's Chat Exporter",
    // 图标路径，确保在项目根目录下有一个 assets 文件夹，里面有 icon.ico/icon.png
    icon: './assets/icon',
    // 打包时要忽略的文件或目录
    ignore: [
      /^\/src/,
      /^\/public/,
      /^\/\.vscode/,
      /^\/\.git/,
      /^\/node_modules\/\.cache/,
      /^\/\.env$/,
      /forge\.config\.js$/, // 忽略配置文件本身
    ],
    // 将应用打包成 asar 文件，可以提高读取性能
    asar: true,
  },
  // rebuildConfig 用于重新构建原生模块
  rebuildConfig: {},
  // makers 是一个数组，定义了要生成的安装包类型
  makers: [
    {
      // Squirrel.Windows 用于创建 Windows 安装包 (.exe)
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'lyra_exporter', // 安装包的文件名
        setupIcon: './assets/icon.ico' // 安装程序的图标
      },
    },
    {
      // MakerZip 用于创建 zip 压缩包
      name: '@electron-forge/maker-zip',
      platforms: ['darwin', 'win32', 'linux'], // 为 macOS, Windows, Linux 都创建 zip 包
    },
    {
      // MakerDeb 用于创建 Debian/Ubuntu 的 .deb 安装包
      name: '@electron-forge/maker-deb',
      config: {
        options: {
          name: 'lyra-exporter',
          productName: "Lyra's Chat Exporter",
          genericName: 'Chat Exporter',
          description: 'A tool to export chat history.',
          icon: './assets/icon.png', // .deb 包的图标
          categories: ['Utility'],
        },
      },
    },
    {
      // MakerRpm 用于创建 Fedora/RedHat 的 .rpm 安装包
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
  // plugins 是一个数组，可以配置 Electron Forge 的插件
  plugins: [
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false, // 禁用 ELECTRON_RUN_AS_NODE
      [FuseV1Options.EnableCookieEncryption]: true, // 启用 cookie 加密
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false, // 禁用 NODE_OPTIONS
      [FuseV1Options.EnableNodeCliInspectArguments]: false, // 禁用 --inspect 和 --inspect-brk
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true, // 启用 asar 完整性校验
      [FuseV1Options.OnlyLoadAppFromAsar]: true, // 只从 asar 加载应用
    }),
  ],
};
