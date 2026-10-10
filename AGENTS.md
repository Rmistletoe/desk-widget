# Agent 协作与开发规范

本文档面向参与本项目设计、开发和维护的 AI Agent，规定核心准则、工程要求以及开发踩坑与问题记录。

## 一、 强制开发要求

1. **零多余依赖**：优先使用轻量原生方案，依赖轻巧简洁，杜绝大型无用包。
2. **纯本地离线**：所有数据存储在用户本地设备，严禁任何形式的外部网络上传，确保隐私与数据安全。
3. **即时持久化**：用户输入和勾选操作必须实时保存，外部 `config.json` 与 `data.json` 直接落盘在 exe 同级目录。
4. **低资源占用与秒开**：挂件常驻后台，内存占用控制在几十 MB，双击 0.05 秒秒开，不抢占 CPU。
5. **问题必须回流文档（核心规则）**：**在任何工作阶段中，遇到排查出的 Bug、环境冲突、平台陷阱或技术折腾，必须第一时间归纳并更新到本文档的“问题与踩坑记录”章节中。后续 Agent 开展工作前必须通读本清单，严禁重复犯错。**
6. **Git Commit Message 规范（核心铁律）**：**必须遵循 `<type>: <中文详细描述>` 格式！**
   - 前缀必须使用标准英文标识：`feat:`（新功能）、`fix:`（修复）、`docs:`（文档更新）、`perf:`（性能优化）、`refactor:`（重构）、`chore:`（杂项构建）。
   - 冒号后跟中文描述（例如：`feat: 重构为原生WPF桌面挂件架构`、`fix: 解决双击事件与资源字典报错`）。
7. **Git Push 权限控制（核心铁律）**：**AI Agent 仅在本地执行 `git commit`，严禁执行 `git push`！远程推送全权由用户手动执行。**
8. **Docs 文档文件名强制中文规范**：**`docs/` 目录下的所有设计、规格与说明文档，文件名必须强制使用中文（如 `docs/系统架构与性能设计.md`、`docs/功能规格与业务逻辑.md`），方便团队随时查阅。**
9. **项目架构目录隔离规范**：**WPF 项目工程必须放置在独立的 `src/DeskWidget/` 子目录下，严禁直接堆在根目录，确保根目录结构整洁清晰。**

## 二、 目录分工与职责

- `src/DeskWidget/`：WPF 桌面挂件主工程目录。
  - `Models/`：定义配置与数据实体类（`AppConfig.cs`、`TodoItem.cs`、`StickyNote.cs`）。
  - `Services/`：负责纯本地文件持久化（`StorageService.cs`）与 Win32 原生全局热键（`HotkeyService.cs`）。
  - `ViewModels/`：基于 CommunityToolkit.Mvvm 实现的响应式业务逻辑与倒计时调度（`MainViewModel.cs`）。
  - `Converters/`：XAML 数据转换器（莫兰迪色彩画刷、待办删除线）。
  - `MainWindow.xaml` / `MainWindow.xaml.cs`：现代 Fluent 风格悬浮无边框挂件主窗口与原生系统托盘。
- `docs/`：存放需求设计与架构演进文档（全部采用中文命名）。
- `release/`：独立版单文件打包输出目录。

## 三、 代码风格与规范

1. **类型安全**：全面开启 TypeScript 严格模式，避免使用 `any`。
2. **命名规范**：
   - 业务工具函数使用小驼峰命名（如 `calculateWorkProgress`）。
   - 组件使用大驼峰命名（如 `SettingsModal.vue`）。
   - 常量与配置键名使用大写下划线（如 `DEFAULT_WORK_HOURS`）。
3. **错误处理**：涉及剪贴板读取、本地文件读写时，必须添加 `try-catch` 保护，避免渲染进程崩溃。

---

## 四、 工作过程问题与踩坑记录 (Troubleshooting Log)

### 1. Electron 预加载脚本 (Preload) 模块语法冲突
- **现象**：主进程打包后报错 `Unable to load preload script: SyntaxError: Cannot use import statement outside a module`，导致窗口静默加载失败，界面完全不显示。
- **根因**：Electron 沙箱环境下的预加载脚本仅支持 CommonJS 语法，而打包管线在 `"type": "module"` 配置下将 TS 脚本转译成了 ESM（带 `import`/`export`）。
- **解法**：预加载脚本采用纯净 CommonJS 语法（`preload.cjs`，直接使用 `require('electron')`），并在 Vite 构建生命周期中直接复制落盘，禁止二次转译。

### 2. Windows 批处理脚本路径转义与中文编码冲突
- **现象**：双击 `.bat` 启动脚本无任何反应，命令行报错 `系统找不到指定的路径` 或 `'"' is not recognized as an internal or external command`。
- **根因**：
  1. Windows `cmd.exe` 默认使用 GBK 编码（代码页 936），若批处理文件以 UTF-8 编码保存且含有中文路径，双字节字符会被截断导致路径乱码。
  2. Windows 内置变量 `%~dp0` 结尾默认自带反斜杠 `\`。若写成 `"%~dp0"`，尾随的 `\` 与结尾双引号 `"` 会组合成转义符 `\"`，导致命令行引号逃逸并解析崩溃。
- **解法**：在脚本所在目录下执行时，去除 `%~dp0` 路径宏，直接采用纯相对路径 `start release\portable\FinanceWidget.exe`；并在启动前使用 `taskkill /f /im ... 2>nul` 清理残留僵尸进程。

### 3. Chromium 网络代理自动探测 (WPAD) 导致的启动假死
- **现象**：点击启动图标后，需要等待好几秒窗口才会慢吞吞弹出。
- **根因**：Chromium 启动时默认会执行 Web Proxy Auto-Discovery (WPAD) 探测系统网络代理，在 Windows 环境下即使加载本地 `file://` 页面也会发生 2～4 秒的硬性阻塞等待。
- **解法**：在 Electron 主进程入口显式传入 `app.commandLine.appendSwitch('no-proxy-server')` 跳过网络代理探测，冷启动耗时直接大幅下降。注意：**严禁随意禁用着色器磁盘缓存（`disable-gpu-shader-disk-cache`）**，否则每次冷启动都会强制 CPU 重新编译 Direct3D HLSL 着色器，反而引发数秒严重卡顿。

### 4. 任务栏隐藏与 Windows 10/11 系统托盘折叠机制
- **现象**：开启 `skipTaskbar: true` 后，任务栏无图标，同时用户反馈在右下角也看不到托盘图标。
- **根因**：
  1. Windows 10/11 会默认将未固定在任务栏的新增托盘图标收纳在右下角时间左侧的折叠箭头 `^` 内（Overflow Area）。
  2. 若托盘图标通过相对文件路径加载，打包后路径丢失会导致 `nativeImage.createEmpty()`，而在 Windows 上加载空图标会直接抛异常破坏后续逻辑。
- **解法**：
  1. 托盘图标采用 Base64 内嵌 Data URL 形式直接生成 `nativeImage`，零文件依赖，100% 保证生成成功。
  2. 配合全局老板键（`Alt + Shift + H`）作为双重兜底唤醒机制。

### 5. 业务定位从专属垂直解耦为大众通用挂件
- **背景与调整**：初始版本深度绑定了财务专用功能（税率速算、大写转换、开票模板），后续根据产品演进要求解耦为所有人通用的桌面便签。
- **解法**：
  1. 剔除行业特化预设，替换为 `[重要]`、`[工作]`、`[生活]`、`[学习]` 通用分类。
  2. 引入图形化设置弹窗（`⚙️`），将上下班作息、发薪日、透明度和自定义留言交由用户在界面上直观配置并自动持久化。

### 6. 托盘出现很快但窗口界面滞后 5 秒的深度根治
- **现象**：双击启动脚本后，右下角系统托盘图标瞬间出现，但桌面上的便签窗口过了整整 5 秒才加载渲染出来。
- **根因（多重复合性能杀手）**：
  1. **负优化：禁用着色器缓存**：此前添加了 `disable-gpu-shader-disk-cache`，导致 Windows D3D11 每次冷启动都重新实时编译 DirectComposition Alpha Blending 着色器，耗时 2~3 秒。
  2. **负优化：禁用预热渲染器**：此前在 `disable-features` 中误禁用了 `SpareRendererForSitePerProcess`，导致无法在主进程初始化时并行预热渲染器，必须串行冷启动。
  3. **Windows DWM 阴影与透明窗口冲突**：无边框透明窗口（`transparent: true`）开启了 `hasShadow: true`。Windows 原生不支持无边框透明窗口自带系统阴影，强制 DWM 走昂贵且容易握手超时的 DirectComposition 阴影计算。
  4. **CSS `backdrop-blur` 离屏模糊黑洞**：在透明窗口上设置 `backdrop-filter: blur(...)`，Chromium 无法获取桌面背景，会触发软件后备双通道离屏高斯卷积着色器编译与渲染，首屏构建耗时极长。
  5. **后台窗口降频挂起机制（Background Throttling）**：由于开启了 `skipTaskbar: true`，Chromium 在未主动聚焦前会将其误判为不可见的后台窗口，默认对渲染器执行降频挂起（1000ms 调度一次），导致首帧绘制被延迟。
  6. **无单实例锁导致旧进程冲突**：多开或快速重开时，旧实例尚未完全释放文件锁与 GPU 互斥体，新实例等待锁超时 3~5 秒。
- **解法**：
  1. 彻底移除 `disable-gpu-shader-disk-cache`，恢复 GPU Shader 磁盘缓存秒级复用。
  2. 移除对 `SpareRendererForSitePerProcess` 的禁用，恢复并行预热。
  3. 主进程配置 `hasShadow: false`，完全依靠前端 Tailwind `shadow-xl` 硬件加速阴影，消除 DWM 冲突。
  4. 移除 CSS 里的 `backdrop-blur-md`，消除离屏模糊着色器编译损耗。
  5. 开启 `backgroundThrottling: false`，彻底禁止 Chromium 对桌面挂件窗口降频。
  6. 引入 `app.requestSingleInstanceLock()` 单实例锁，重复运行自动呼出已有窗口，避免锁冲突。
  7. 窗口初始化改为 `show: false`，在 `ready-to-show` 时立即 `show()` 并 `focus()`，外加 500ms 兜底，实测从托盘到界面渲染展示仅需 270ms。

### 7. 外部独立配置文件与打包解耦规范（config.json 与 data.json）
- **背景与痛点**：此前配置保存在浏览器的内部 `localStorage` 中。每次重新打包、跨版本更新或部署给他人时，用户需要重新配置作息、发薪日、透明度和留言，无法做到配置持久独立。
- **解法（主进程同步注入 + 外部文件双向落盘）**：
  1. **文件定位**：打包环境下保存在可执行文件同级目录（`release/portable/config.json`），开发环境下保存在工程根目录，任何用户均可用记事本直接修改。
  2. **双向无缝同步**：
     - 启动阶段：主进程读取 `config.json` 与 `data.json`，在预加载阶段通过同步 IPC 注入前端 Store，**首帧即使用用户真实配置，零异步闪烁**。
     - 运行阶段：在界面设置窗口（`⚙️`）调整参数，或编辑待办/便签时，前端 Store 响应式深度监听，自动实时同步写回本地外部 `config.json` 与 `data.json`。
  3. **重新打包零影响**：后续无论怎样重新构建覆盖程序二进制文件，只要保留外部的 `config.json`，用户专属配置永不丢失。

### 8. Electron 未打 asar 包时 app.isPackaged 判定陷阱与表单未显式落盘
- **现象**：在设置弹窗中修改发薪日、作息时间后点击“保存并关闭”，界面或重启后依然显示默认 15 号与默认作息，修改配置失效。
- **根因**：
  1. **`app.isPackaged` 判定陷阱**：绿色免安装版本使用的是解压的 `resources/app` 文件夹（未封装为单一 `app.asar`）。在 Electron 底层规范中，只要没有使用 asar，`app.isPackaged` 永远返回 `false`！这导致 `getConfigDir` 错误走了 `process.cwd()` 分支。当从批处理、快捷方式或不同目录拉起进程时，`process.cwd()` 发生错位，无法定位到 exe 物理同级目录的 `config.json`。
  2. **设置弹窗“有名无实”**：`SettingsModal.vue` 的【保存并关闭】按钮仅执行了隐藏弹窗，缺乏显式调用 Store 保存方法的动作；依赖的被动 watch 在嵌套对象修改时未触发落盘。
- **解法**：
  1. 抛弃 `app.isPackaged` 依赖，改用 `path.dirname(process.execPath)` 并排除 `node_modules`，无论是否打包或从何处拉起，一律精准落盘在 exe 物理所在目录。
  2. 在 Store 中声明显式的 `updateConfig(newConfig)` 方法，弹窗点击【保存并关闭】时显式触发落盘与主进程 IPC，确保 100% 写入。

### 9. 生产打包代码混淆下的 this 指向丢失与事件处理无 try-catch 假死
- **现象**：在设置弹窗中修改完配置后，点击底部的【保存并关闭】按钮，界面毫无反应，弹窗关不掉，仿佛死机卡住。
- **根因**：
  1. 在 `widgetStore` 的 `updateConfig` 方法内，使用了 `Object.assign(this.config, ...)`。在 Rollup/Vite 生产压缩混淆下，`this` 丢失变为 `undefined`，触发了 `TypeError: Cannot read properties of undefined`。
  2. 组件事件函数 `handleSave` 没有包裹 `try...catch...finally`，一旦首行抛错，整个函数瞬间中断退出，导致下一行 `widgetStore.showSettings = false` 根本无法执行，在 UI 上表现为“按钮完全无反应”。
- **解法**：
  1. 严格禁止在 Vue 单例 Store 的方法中使用脆弱的 `this`，全部改为显式闭包变量引用（`widgetStore.config`）。
  2. 所有 UI 关键事件回调强制添加 `try...catch...finally`，确保即使保存层偶发异常，UI 状态依然能平滑重置并关闭，绝不阻断用户界面。
  3. 全局注册 `F12` 开发者工具呼出快捷键，彻底告别盲人摸象。
### 10. Wpf.Ui 4.x 资源字典命名空间与路径变迁
- **现象**：在 `App.xaml` 中按照旧版文档引入 `<ui:XamlControlsResources />` 时，编译报错找不到该类型，或者找不到主题资源。
- **根因**：Wpf.Ui 从 4.0 起进行了架构大重构，废弃了旧版自定义 Resources 标签，统一回归标准的 `ResourceDictionary` 语法。
- **解法**：在 `App.xaml` 的 `MergedDictionaries` 中，显式通过 Pack URI 引入：
  - `pack://application:,,,/Wpf.Ui;component/Resources/Theme/Light.xaml`
  - `pack://application:,,,/Wpf.Ui;component/Resources/Wpf.Ui.xaml`

### 11. WPF 与 WinForms 启用后的全局命名空间冲突
- **现象**：项目为接入高可靠原生托盘开启 `<UseWindowsForms>true</UseWindowsForms>` 后，编译报错 `Button`、`Application`、`KeyEventArgs`、`Color` 存在二义性。
- **根因**：`System.Windows.Forms` 与 `System.Windows`（WPF）在同一个编译上下文内引入了同名类型。
- **解法**：在 XAML 后台代码与 Service 中显式使用完全限定命名空间：如 `System.Windows.Input.KeyEventArgs`、`System.Windows.Controls.Button`、`System.Windows.Media.Color.FromRgb(...)`，WinForms 仅用于 `System.Windows.Forms.NotifyIcon`。

### 12. TextBox 缺少 LineHeight 属性与 XAML 解析中断
- **现象**：在 便签的 `TextBox` 上设置 `LineHeight="24"`，编译直接报错并导致窗体无法解析。
- **根因**：WPF 中 `TextBox` 继承自 `TextBoxBase`，并不支持 `LineHeight` 属性（仅 `TextBlock` 具备）。
- **解法**：便签多行输入框移除 `LineHeight`，通过设置 `FontSize`、`FontFamily` 与 `Padding` 实现优雅的行间排版。

### 13. Border 缺少 MouseDoubleClick 事件与折叠交互
- **现象**：在顶部胶囊的 `Border` 上绑定 `MouseDoubleClick="Border_MouseDoubleClick"` 报错找不到该事件。
- **根因**：`Border` 继承自 `FrameworkElement`，未封装双击事件（`Control` 类才具备）。
- **解法**：监听 `MouseLeftButtonDown` 事件，判断 `if (e.ClickCount == 2)` 触发双击折叠与展开，单次点击则继续调用 `DragMove()` 实现窗口平滑拖拽。

### 14. 初始化时序空指针陷阱与 TextChanged 提前触发
- **现象**：窗口在启动时直接抛出 `NullReferenceException` 闪退崩溃。
- **根因**：XAML 中的 `TextBox` 在绑定初始文本（`Text="{Binding ...}"`）时，会在 `InitializeComponent()` 执行期间立即触发 `TextChanged` 事件。若防抖计时器（`_noteSaveDebounceTimer`）在 `InitializeComponent()` 之后才实例化，回调执行时计时器为 `null`。
- **解法**：所有非 UI 依赖的字段、防抖定时器等，必须严格放置在 `InitializeComponent()` 之前完成实例化。

