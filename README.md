# CommunityProject · 三维分层分户管理

基于 **Cesium + Vue 3 + Express + PostgreSQL** 的三维楼栋「分层分户」管理示例项目：
在三维实景楼栋模型上逐层、逐户查看与录入住户信息，并支持业主头像 / 户型图上传回显。

## 功能概览

- 三维场景加载本地地形、自制影像底图与楼栋 3D Tiles 模型，并限制相机活动范围
- 楼栋轮廓绘制与楼层切分（`polygonCut` / `drawTool`），楼层标注（`SimpleLabel`）
- 点击楼层查询房屋信息，气泡面板（`Popup.vue`）展示住户、业主头像、户型图
- 住户信息编辑（`edit.vue`）与楼栋/楼层配置（`SetBuild.vue` / `SetInfo.vue`）
- 图片上传：按 `{住户id}-{字段名}.{扩展名}` 命名落盘，数据库只存访问路径，重传自动覆盖旧文件

## 目录结构

```
CommunityProject/
├── Project/                 # 前端（Vue 3 + Vite + Cesium）
│   ├── src/
│   │   ├── api/             # axios 封装与接口函数
│   │   ├── cesiumTools/     # 场景初始化、绘制、标注、楼层切分等三维工具
│   │   ├── components/      # 业务组件（气泡、编辑、配置、扫描信息）
│   │   ├── config/env.js    # 统一读取 VITE_* 环境变量
│   │   ├── router/ stores/  # 路由与 Pinia 状态
│   │   └── views/           # 三维主视图
│   ├── .env.example         # 前端环境变量模板
│   └── vite.config.js
├── pg-api/                  # 后端（Express 5 + pg + multer）
│   ├── app.js               # 全部接口与上传逻辑
│   ├── servce.js            # 与 app.js 完全一致的备份副本
│   ├── static/uploads/      # 头像 / 户型图落盘目录
│   └── .env.example         # 后端环境变量模板
└── .gitignore
```

## 快速开始

### 1. 后端

```bash
cd pg-api
npm install          # 或 pnpm install
cp .env.example .env # Windows: copy .env.example .env
# 编辑 .env，填入本机 PostgreSQL 的账号密码与库名
node app.js          # 默认监听 http://localhost:8090
```

数据库需要包含楼栋表与房屋表（`fencengfenhu` 库），字段见 `app.js` 中各接口的 SQL。

### 2. 前端

```bash
cd Project
pnpm install
cp .env.example .env.local   # Windows: copy .env.example .env.local
pnpm dev                     # 默认 http://localhost:5173
```

三维场景依赖本机的瓦片 / 地形 / 模型服务（默认 `http://localhost:666`，
`/model/PenJiang/{z}/{x}/{y}.png`、`/model/PengJiang_Terrian`、
`/model/model/tileset.json`），没有该服务时地球底图与楼栋模型不会显示，
其余表格类功能不受影响。

## 环境变量

### 后端 `pg-api/.env`

| 变量 | 说明 | 默认值 |
| --- | --- | --- |
| `DB_HOST` | 数据库主机 | `127.0.0.1` |
| `DB_PORT` | 数据库端口 | `5432` |
| `DB_USER` | 数据库用户 | `postgres` |
| `DB_PASSWORD` | 数据库密码 | 无（必填） |
| `DB_NAME` | 数据库名 | `fencengfenhu` |
| `SERVER_PORT` | 接口服务端口 | `8090` |

### 前端 `Project/.env.local`

| 变量 | 说明 | 默认值 |
| --- | --- | --- |
| `VITE_CESIUM_ION_TOKEN` | Cesium Ion 令牌（选填，项目走离线地形） | 空 |
| `VITE_API_BASE_URL` | 接口根地址 | `http://127.0.0.1:8090/api/v1` |
| `VITE_API_ORIGIN` | 静态资源（图片）根地址 | `http://127.0.0.1:8090` |
| `VITE_MODEL_BASE_URL` | 本地三维服务根地址 | `http://localhost:666` |

## 安全约定

- **仓库里不保存任何真实密钥**：数据库密码、Cesium Ion 令牌等一律通过环境变量注入。
- `.env`、`.env.local`、`*.local`、`config.toml` 均已在 `.gitignore` 中排除，
  仓库只提交 `.env.example` 模板。
- 首次使用请复制模板并填入自己的凭据；凭据切勿提交、不要写进源码或 README。

## 主要接口

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/v1/getBuild` | 楼栋列表（含 GeoJSON 轮廓） |
| GET | `/api/v1/getHouse` | 按楼栋 / 楼层查询房屋 |
| GET | `/api/v1/getOneHouseInfo` | 单户详情 |
| POST | `/api/v1/addHouse` | 新增房屋 |
| POST | `/api/v1/updateInfo` | 更新住户信息与图片 |

图片通过 `multer` 内存接收后写入 `pg-api/static/uploads/{owner,house}`，
对外以 `/static/uploads/...` 访问。
