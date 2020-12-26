---
id: cli
title: Cli 命令
---

Ovine Cli 工具由 `@ovine/cli` 包提供，二次封装了 webpack 一系列配置。

主要添加了以下功能:

- 内置了 Ovine 应用必备的开发环境
- 添加了 Amis 主题编译，并且可方便的增加属于自己项目的个性化主题
- 内置 [Webpack Dll](https://zhuanlan.zhihu.com/p/84595664) 优化，不仅能够减少构建时间，还可实现浏览器长期缓存
- 结合 `react-hot-loader` 添加了热更新功能，使开发更加顺畅
- 可对按路由拆分文件，实现代码按需加载

> 将 `ovine` 添加到 `package.json scripts` 中，可简单使用 `yarn ovine` 执行以下命令

```json
{
  "scripts": {
    "ovine": "ovine"
  }
}
```

### `yarn ovine -h` 查看帮助

列出 ovine 命令的所有帮助项，或者查看具体的命令的帮助。 `yarn ovine dev -h` 查看 `dev` 命令的帮助信息。不必记忆所有的文档所有内容，需要时查看帮助即即可。

### `yarn ovine dev`

#### -p 启动端口

默认 7050

#### --host 启动的 host

默认 localhost

#### --mock 是否开启 mock 数据功能

默认 false

#### --env 当前应用环境

默认 localhost

#### --scss 开启 scss 更新

默认 false。此选项需要与 `ovine scss -w` 命令配合使用，可以实时预览主题文件修改后的效果。

#### --no-dll 不启用 dll

默认 false。不启用 dll 编译会非常慢。但是可以看到更多 `react` 的报错信息。

#### --no-open 不默认打开浏览器

默认 false

### `yarn ovine build`

#### --mock 是否开启 mock 数据功能

默认 false。开启 mock 后，可以使用 `mock.js` 数据。否则 `mock.js` 数据无效。

#### --env 当前应用环境

默认 production，如果非 `production` 环境可以自行设置，其他环境。

#### --bundle-analyzer 开启打包分析

是否开启 build 构建的依赖分析，默认 false。当有需要的时候可以使用此参数，更加详细的了解 build 包的大小。

### `yarn ovine dll` 打包 dll 文件

是将 amis 等一系列依赖包提前打包，不必每次构建都打包，可以加快构建速度，也可以使浏览器长期缓存，加快页面加载速度。每次 amis 升级，或者其他 dll 依赖包升级，都需要重复执行该命令。

> Amis 的依赖包还比较多的，构建 DLL 比较缓慢，此命令时间较长，大约 1-2 分钟左右，请耐心等待。

#### --bundle-analyzer 开启打包分析

是否开启 dll 构建的依赖分析，默认 false。当有需要的时候可以使用此参数，更加详细的了解 dll 包的大小。

### `yarn ovine scss` 编译 scss

Ovine 默认采用 `css in js` 方式写样式。但是 `amis` 使用的 `scss` 写样式。因此每当 `amis` 更新时，或者当更改 `scss` 主题变量时，都需要重新编译一下 amis 的样式。

#### -w 监听 scss 文件改动，实时编译

#### --verbose 打印详细日志

### Ovine 版本升级

[Ovine 版本更新日志](/org/blog/changelog/)

由于 Ovine 是一个应用型的框架，对 `Amis` 进行了封装，并内置了一些常用功能。如果想升级 `Amis`，必须升级 `Ovine`相关 npm 包。升级 `Ovine` 需进行以下操作。

- 更新 `Ovine` 相关 npm 包

  - `yarn add @ovine/cli@latest` 更新 cli 工具
  - `yarn add @ovine/core@latest` 更新 core 包

- 当 `Ovine` npm 包内更新了 `Amis` 版本时，需要额外进行下列步骤

  - `yarn ovine dll` 编译 Dll 静态资源文件
  - `yarn ovine scss` 编译 Amis 样式

- 当 `Ovine` 只更改了 Dll 相关配置时，仅需要执行 `yarn ovine dll` 即可

> 除了更新这些，如果有重大改版，还需要对应代码细节，进行代码改动。具体需要改动的内容，都会在版本日志中注明。

## 部署 Ovine 应用

Ovine 是单页面应用，使用 [browserHistory](https://blog.csdn.net/wangweiren_get/article/details/96423020) 模式，作为页面路由。构建好项目后，将打包好的文件拷贝到在服务器对应目录中，需要做一些简单配置，即可直接访问。推荐使用 `nginx` 作为部署 web 服务器配置。其他软件作为服务器均可。

以下就 `nginx` 简单配置为例。 [nginx 入门](https://zhuanlan.zhihu.com/p/33418520)

#### 将项目部署在域名的根目录下。 即 `https://app.com/` 为项目首页

- 构建项目 `yarn build`

  - 此步骤，可以传入 `env` 环境。如： `yarn build --env=staging` 等，表示不同环境的构建
  - 此步骤将构建项目，并将所有文件进行打包 `/my-app/dist/` 目录。

- 将构建好的文件拷贝到服务器中。将 `/my-app/dist/*` 拷贝到 `/path-to/my-app/`

  - 类 linux 系统同步文件 `rsync -a --delete /my-app/dist/* user@192.168.10.10:/path-to/my-app/`
  - windows 可采用其他方式，将文件同步到服务器中

- 编写域名根目录 `nginx` 配置

  ```bash
  server {
    # 一堆其他配置，比如 端口，https，缓存，日志文件等
    server_name app.com; # 域名配置
    location / {
      root   /path-to/my-app; # 项目目录
      index  index.html; # index文件
      try_files $uri $uri/ /index.html; # !!单页应用最重要配置，文件不存在，回退到 index.html
    }
    # 一堆其他配置, 比如 api 代理等
  }
  ```

- 启动或重启 `nginx`

> 此处使用 nginx 默认安装目录为命令路径，仅作为参考。

```bash
# 检查配置是否正确
sudo /usr/local/nginx/sbin/nginx -t

# 启动nginx
sudo /usr/local/nginx/sbin/nginx

# 重启 nginx
sudo /usr/local/nginx/sbin/nginx -s reload
```

---

#### 将项目部署在域名的子目录下。 即 `https://app.com/sub-path/` 为项目首页

其他步骤与上述类似，主要 `ovine` 配置与 `nginx` 配置不同。

- **在 `ovine.config.js`文件 添加 `publicPath` 配置**

```js
// ovine.config.js 文件
module.exports = {
  publicPath: '/sub-path/', // 必须以斜线结尾
  // ... 其他配置
}
```

- **重新执行 `yarn dll` 命令。只要修改 `publicPath` 就需要重新执行该命令。**

- 构建项目 `yarn build`

- 将构建好的文件拷贝到服务器中。 将 `/my-app/dist/*` 拷贝到 `/path-to/my-app/sub-path`

- **域名子目录 `nginx` 配置。注意 `sub-path`**

```bash
  server {
    # 一堆其他配置，比如 端口，https，缓存，日志文件等
    server_name app.com; # 域名配置
    location /sub-path { # 子目录
      root   /path-to/my-app; # 项目目录
      index  index.html; # index文件
      try_files $uri $uri/ /sub-path/index.html; # !!单页应用最重要配置，文件不存在，回退到 sub-path/index.html
    }
    # 一堆其他配置, 比如 api 代理等
  }

```

- 启动或重启 `nginx`
