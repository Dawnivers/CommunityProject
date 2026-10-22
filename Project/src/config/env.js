/**
 * 统一的环境变量出口。
 * 真实值放在 Project/.env.local（已被 .gitignore 排除），
 * 提交到仓库的只有 Project/.env.example。
 */

const trimTrailingSlash = (value) => (value || '').replace(/\/+$/, '');

/** 后端接口根地址，例如 http://127.0.0.1:8090/api/v1 */
export const API_BASE_URL =
  trimTrailingSlash(import.meta.env.VITE_API_BASE_URL) ||
  'http://127.0.0.1:8090/api/v1';

/** 后端静态资源根地址（图片回显用），例如 http://127.0.0.1:8090 */
export const API_ORIGIN =
  trimTrailingSlash(import.meta.env.VITE_API_ORIGIN) || 'http://127.0.0.1:8090';

/** 本地三维服务根地址（地形 / 影像 / 3D Tiles），例如 http://localhost:666 */
export const MODEL_BASE_URL =
  trimTrailingSlash(import.meta.env.VITE_MODEL_BASE_URL) || 'http://localhost:666';

/** Cesium Ion 令牌；本项目走离线地形与自制底图，通常留空即可 */
export const CESIUM_ION_TOKEN = import.meta.env.VITE_CESIUM_ION_TOKEN || '';
