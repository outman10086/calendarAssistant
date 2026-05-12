# 日程助手 + 心情日记

一个支持 PWA 推送的日程管理与心情记录 Web 应用。

## 功能特性

- 📅 **日程管理**：创建、编辑、删除日程，支持语音输入创建
- 🔔 **PWA 推送**：日程到期前自动推送提醒（即使网页关闭）
- 🌙 **心情日记**：每日 1-5 星心情评分，记录当天事件
- ⏰ **每日 11:00 推送**：准时提醒填写今日心情
- 🔄 **多设备同步**：8 位同步码机制，手机电脑数据互通
- 📱 **PWA 安装**：可安装到手机/电脑桌面，离线可用

## 技术栈

- 前端：React 19 + TypeScript + Vite + Tailwind CSS
- 后端：Vercel Serverless Functions
- 数据库：Supabase (PostgreSQL)
- 推送：Web Push API + cron-job.org 定时触发
- 部署：Vercel 免费版

## 快速开始

### 1. 创建 Supabase 项目

1. 访问 [supabase.com](https://supabase.com) 注册/登录
2. 创建新项目，记住项目 URL 和 API Keys
3. 进入 SQL Editor，执行 `supabase/migrations/001_init.sql` 中的 SQL

### 2. 生成 Web Push VAPID 密钥

```bash
npx web-push generate-vapid-keys
```

保存生成的公钥和私钥。

### 3. 配置环境变量

复制 `.env.example` 为 `.env.local`，填入以下值：

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
VAPID_PUBLIC_KEY=your-public-key
VAPID_PRIVATE_KEY=your-private-key
VAPID_SUBJECT=mailto:you@example.com
CRON_SECRET=a-random-strong-password

VITE_SUPABASE_URL=${SUPABASE_URL}
VITE_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
VITE_VAPID_PUBLIC_KEY=${VAPID_PUBLIC_KEY}
VITE_API_BASE=
```

### 4. 本地开发

```bash
npm install
npm run dev
```

### 5. 部署到 Vercel

1. 将代码推送到 GitHub
2. 在 [vercel.com](https://vercel.com) 导入项目
3. 在 Project Settings > Environment Variables 中添加上述所有变量（注意去掉 `VITE_` 前缀的变量也要加）
4. 重新部署

### 6. 配置 cron-job.org 定时任务

1. 访问 [cron-job.org](https://cron-job.org) 注册免费账号
2. 创建两个定时任务：

**任务一：每日心情提醒**
- URL: `https://your-domain.vercel.app/api/push/trigger-mood`
- 方法: POST
- Header: `x-cron-secret: your-cron-secret`
- 执行周期: 每天 11:00

**任务二：日程提醒**
- URL: `https://your-domain.vercel.app/api/push/trigger-schedule`
- 方法: POST
- Header: `x-cron-secret: your-cron-secret`
- 执行周期: 每 1 分钟

## 使用说明

### 首次使用
1. 打开应用，点击"生成同步码"
2. 记住你的 8 位同步码（可在设置中查看）
3. 在新设备上输入同步码即可同步数据

### 开启推送通知
1. 点击顶部铃铛图标或浏览器提示
2. 允许通知权限
3. 安装 PWA：浏览器菜单 > 安装应用到桌面/主屏幕

### 语音创建日程
1. 进入"日程"页面，点击"新建"
2. 点击标题输入框旁的麦克风图标
3. 说出日程内容，识别后自动填入

## 项目结构

```
calendar-assistant/
├── src/              # 前端 React 代码
├── api/              # Vercel Serverless API
├── supabase/         # 数据库迁移脚本
├── public/           # 静态资源与 PWA 图标
└── vercel.json       # Vercel 路由配置
```

## 注意事项

- iOS 16.4+ 才支持 PWA Web Push，旧版本建议保持网页运行
- 语音输入依赖浏览器 Web Speech API，Chrome/Edge/Safari 支持良好
- 免费版 Supabase 有 500MB 数据库限制，个人使用足够
