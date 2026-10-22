<template>
  <!-- 详情展示模态框卡片：配合 SimpleLabel 以 absolute 定位贴附在三维坐标处 -->
  <div class="detail-modal-card" :style="{ '--popup-scale': scale }">
    <!-- 右上角科技蓝发光 X 退出按钮 -->
    <button class="close-btn" aria-label="关闭退出" @click="handleClose">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>

    <!-- 弹性自适应可滚动主体容器 -->
    <div class="modal-scrollable-body">
      <!-- 模块一：业主信息 -->
      <div class="section-container">
        <div class="section-header">
          <div class="section-indicator"></div>
          <span class="section-title">业主信息</span>
        </div>

        <div class="section-content-row">
          <!-- 左侧图片视窗：业主照片/头像 -->
          <div class="image-viewport" title="业主头像/照片">
            <div class="tech-corner corner-tl"></div>
            <div class="tech-corner corner-tr"></div>
            <div class="tech-corner corner-bl"></div>
            <div class="tech-corner corner-br"></div>
            <img
              v-if="ownerImg"
              :src="ownerImg"
              alt="业主照片"
              class="viewport-image"
            />
            <template v-else>
              <svg
                class="image-placeholder-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <span class="image-placeholder-text">业主照片</span>
            </template>
          </div>

          <!-- 右侧信息属性自适应弹性网格 -->
          <div class="info-list-col">
            <div class="info-item">
              <span class="info-label">业主姓名：</span>
              <span class="info-value value-strong">{{
                houseInfo.ownerName
              }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">业主性别：</span>
              <span class="info-value">{{ genderLabel }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">手机号码：</span>
              <span class="info-value highlight-code">{{
                houseInfo.phoneNum
              }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">身份证号：</span>
              <span class="info-value highlight-code">{{
                houseInfo.idCard
              }}</span>
            </div>
            <div class="info-item info-item-full">
              <span class="info-label">业主住址：</span>
              <span class="info-value value-address">{{
                houseInfo.nativePlace
              }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 区域分割线 -->
      <div class="section-divider"></div>

      <!-- 模块二：房屋信息 -->
      <div class="section-container">
        <div class="section-header">
          <div class="section-indicator section-indicator-warm"></div>
          <span class="section-title">房屋信息</span>
        </div>

        <div class="section-content-row">
          <!-- 左侧图片视窗：户型图/实景图 -->
          <div class="image-viewport" title="房屋户型图/实景图">
            <div class="tech-corner corner-tl"></div>
            <div class="tech-corner corner-tr"></div>
            <div class="tech-corner corner-bl"></div>
            <div class="tech-corner corner-br"></div>
            <img
              v-if="houseImg"
              :src="houseImg"
              alt="房屋户型图"
              class="viewport-image"
            />
            <template v-else>
              <svg
                class="image-placeholder-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
              <span class="image-placeholder-text">房屋户型图</span>
            </template>
          </div>

          <!-- 右侧信息属性自适应弹性网格 -->
          <div class="info-list-col">
            <div class="info-item">
              <span class="info-label">房屋面积：</span>
              <span class="info-value value-area">
                {{ houseInfo.builtArea }}
                <span class="area-unit">m²</span>
              </span>
            </div>
            <div class="info-item">
              <span class="info-label">房屋朝向：</span>
              <span class="info-value">{{ houseInfo.orientation }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">物业类型：</span>
              <span class="info-value">
                <span
                  class="info-badge"
                  :class="propertyTypeInfo.badge"
                  :data-type="propertyTypeInfo.dataType"
                  :title="`物业类型：${propertyTypeInfo.label}`"
                  >{{ propertyTypeInfo.label }}</span
                >
              </span>
            </div>
            <div class="info-item info-item-full">
              <span class="info-label">房屋号码：</span>
              <span class="info-value highlight-code value-house-no">{{
                houseInfo.houseAddress
              }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { API_ORIGIN } from '@/config/env.js';

const props = defineProps({
  // 房户信息对象（来自后端 / RowData）
  houseInfo: {
    type: Object,
    default: () => ({}),
  },
  // 关闭回调（由 SimpleLabel 注入，用于移除标注）
  closePopup: {
    type: Function,
    default: null,
  },
  // 缩放比例：整体气泡框的大小缩放（1 为原始大小）
 
});

const apiOrigin = API_ORIGIN;

// 图片路径补全：兼容 blob / data / http / 相对路径
function getImageUrl(imagePath) {
  if (!imagePath) return imagePath;
  if (
    imagePath.startsWith('blob:') ||
    imagePath.startsWith('data:') ||
    imagePath.startsWith('http')
  ) {
    return imagePath;
  }
  return `${apiOrigin}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
}

const ownerImg = computed(() => getImageUrl(props.houseInfo.ownerImg));
const houseImg = computed(() => getImageUrl(props.houseInfo.houseImg));

// 性别显示：兼容英文键与中文
const genderLabel = computed(() => {
  const s = props.houseInfo.ownerSex;
  if (s === 'male') return '男';
  if (s === 'female') return '女';
  return s || '男';
});

// 物业类型映射：兼容数据库数字（1~4）与前端英文键
const PROPERTY_TYPE_MAP = {
  1: {
    label: '居民物业',
    badge: 'badge-residential teal',
    dataType: 'residential',
  },
  2: { label: '商业物业', badge: 'badge-commercial', dataType: 'commercial' },
  3: { label: '工业物业', badge: 'badge-industrial', dataType: 'industrial' },
  4: { label: '其他物业', badge: 'badge-other', dataType: 'other' },
  residential: {
    label: '居民物业',
    badge: 'badge-residential teal',
    dataType: 'residential',
  },
  commercial: {
    label: '商业物业',
    badge: 'badge-commercial',
    dataType: 'commercial',
  },
  industrial: {
    label: '工业物业',
    badge: 'badge-industrial',
    dataType: 'industrial',
  },
  other: { label: '其他物业', badge: 'badge-other', dataType: 'other' },
};

const propertyTypeInfo = computed(
  () => PROPERTY_TYPE_MAP[props.houseInfo.propertyType] || PROPERTY_TYPE_MAP[1],
);

function handleClose() {
  props.closePopup?.();
}
</script>

<style scoped>
/* 基础重置（scoped 下仅作用于组件内元素，不影响 Cesium 全局） */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue',
    Arial, 'Noto Sans', sans-serif;
}

/* 详情弹窗主体容器
   注意：SimpleLabel.postRender 通过设置 el.style.left/bottom 来贴附坐标，
   因此这里必须是 absolute 定位（原始独立页面为 relative，此处按标注场景调整） */
.detail-modal-card {
  position: absolute;
  width: 100%;
  max-width: 680px;
  /* 整体缩放：由 --popup-scale 控制（1=原始），以底部中间为缩放原点，保持贴附坐标稳定 */
  transform: scale(var(--popup-scale, 1));
  transform-origin: bottom center;
  /* 背景调为非常透明，能看到背后场景；同时取消 backdrop 模糊，避免背景被糊掉 */
  background: rgba(23, 28, 32, 0.08);
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  border: 1px solid #2a343d;
  border-radius: 16px;
  box-shadow:
    0 24px 48px -12px rgba(0, 0, 0, 0.7),
    0 0 0 1px rgba(56, 189, 248, 0.1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 32px 36px 36px;
}

/* 右上角蓝色发光无边框 X 退出按钮 */
.close-btn {
  position: absolute;
  top: 10px;
  right: 12px;
  width: 22px;
  height: 22px;
  background: transparent;
  border: none;
  outline: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  color: #38bdf8;
  filter: drop-shadow(0 0 6px rgba(56, 189, 248, 0.8));
  transition: all 0.25s ease;
  z-index: 10;
}

.close-btn:hover {
  color: #00f2fe;
  transform: scale(1.12);
  filter: drop-shadow(0 0 10px rgba(56, 189, 248, 1));
}

.close-btn svg {
  width: 15px;
  height: 15px;
  stroke-width: 2.2;
}

/* 模块区域包装 */
.section-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 板块标题栏 */
.section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  background: rgba(15, 20, 24, 0.7);
  border: 1px solid rgba(56, 189, 248, 0.25);
  border-radius: 8px;
  box-shadow: inset 0 0 12px rgba(56, 189, 248, 0.05);
}

.section-indicator {
  width: 4px;
  height: 18px;
  background: linear-gradient(180deg, #00f2fe 0%, #38bdf8 100%);
  border-radius: 2px;
  box-shadow: 0 0 8px rgba(56, 189, 248, 0.8);
}

/* 房屋信息模块的暖色指示条 */
.section-indicator-warm {
  background: linear-gradient(180deg, #fb923c 0%, #f97316 100%);
  box-shadow:
    0 0 10px rgba(249, 115, 22, 0.8),
    0 0 4px #fb923c;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.5px;
  color: #ffffff;
  text-shadow: 0 0 8px rgba(56, 189, 248, 0.4);
}

/* 左右布局内容主体 */
.section-content-row {
  display: flex;
  gap: 24px;
  align-items: flex-start;
  padding: 4px 8px;
}

/* 左侧图片视窗 */
.image-viewport {
  width: 160px;
  height: 160px;
  flex-shrink: 0;
  border: 1px solid #343a3e;
  border-radius: 12px;
  background: #11161b;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: inset 0 0 16px rgba(0, 0, 0, 0.6);
  transition:
    border-color 0.25s ease,
    box-shadow 0.25s ease;
}

.image-viewport:hover {
  border-color: rgba(56, 189, 248, 0.5);
  box-shadow:
    inset 0 0 16px rgba(0, 0, 0, 0.6),
    0 0 12px rgba(56, 189, 248, 0.2);
}

.viewport-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-placeholder-icon {
  width: 44px;
  height: 44px;
  color: #475569;
  stroke-width: 1.5;
  transition: color 0.25s ease;
}

.image-viewport:hover .image-placeholder-icon {
  color: #38bdf8;
}

.image-placeholder-text {
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
  letter-spacing: 1px;
}

/* 科技感装饰四角线 */
.tech-corner {
  position: absolute;
  width: 8px;
  height: 8px;
  border-color: #38bdf8;
  pointer-events: none;
  opacity: 0.7;
}
.corner-tl {
  top: 4px;
  left: 4px;
  border-top: 1.5px solid #38bdf8;
  border-left: 1.5px solid #38bdf8;
}
.corner-tr {
  top: 4px;
  right: 4px;
  border-top: 1.5px solid #38bdf8;
  border-right: 1.5px solid #38bdf8;
}
.corner-bl {
  bottom: 4px;
  left: 4px;
  border-bottom: 1.5px solid #38bdf8;
  border-left: 1.5px solid #38bdf8;
}
.corner-br {
  bottom: 4px;
  right: 4px;
  border-bottom: 1.5px solid #38bdf8;
  border-right: 1.5px solid #38bdf8;
}

/* 右侧信息列表 */
.info-list-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  align-items: baseline;
  font-size: 14px;
  line-height: 1.5;
}

.info-label {
  width: 85px;
  flex-shrink: 0;
  color: #94a3b8;
  font-weight: 500;
  position: relative;
}

.info-value {
  flex: 1;
  color: #f1f5f9;
  font-weight: 400;
  word-break: break-all;
}

/* 高亮或气泡标签字段 */
.info-value.highlight-code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  letter-spacing: 0.5px;
  color: #38bdf8;
  text-shadow: 0 0 6px rgba(56, 189, 248, 0.4);
}

.info-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  background: rgba(56, 189, 248, 0.12);
  color: #38bdf8;
  border: 1px solid rgba(56, 189, 248, 0.3);
  box-shadow: 0 0 6px rgba(56, 189, 248, 0.2);
}

/* 分割线条 */
.section-divider {
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(56, 189, 248, 0.2),
    rgba(52, 58, 62, 0.6),
    transparent
  );
  margin: 4px 0;
}

/* 文字强调辅助类（对应原始内联样式） */
.value-strong {
  font-weight: 600;
  color: #ffffff;
}
.value-address {
  color: #f1f5f9;
  line-height: 1.6;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
}
.value-area {
  font-weight: 500;
}
.area-unit {
  font-size: 12px;
  color: #94a3b8;
}
.value-house-no {
  color: #67e8f9;
}

/* ===== 物业类型发光胶囊徽章体系 ===== */
.info-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 3px 12px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.5px;
  transition: all 0.25s ease;
  cursor: default;
  user-select: none;
}

/* 居民物业 - 青绿/翡翠绿系 */
.info-badge.badge-residential,
.info-badge.teal {
  background: rgba(45, 212, 191, 0.12);
  border: 1px solid rgba(45, 212, 191, 0.35);
  color: #2dd4bf;
  text-shadow: 0 0 8px rgba(45, 212, 191, 0.5);
  box-shadow:
    0 0 10px rgba(45, 212, 191, 0.15),
    inset 0 0 6px rgba(45, 212, 191, 0.08);
}
.info-badge.badge-residential:hover,
.info-badge.teal:hover {
  background: rgba(45, 212, 191, 0.2);
  border-color: rgba(45, 212, 191, 0.6);
  box-shadow:
    0 0 14px rgba(45, 212, 191, 0.35),
    inset 0 0 8px rgba(45, 212, 191, 0.15);
}

/* 商业物业 - 科技天蓝/海蓝系 */
.info-badge.badge-commercial {
  background: rgba(56, 189, 248, 0.12);
  border: 1px solid rgba(56, 189, 248, 0.35);
  color: #38bdf8;
  text-shadow: 0 0 8px rgba(56, 189, 248, 0.5);
  box-shadow:
    0 0 10px rgba(56, 189, 248, 0.15),
    inset 0 0 6px rgba(56, 189, 248, 0.08);
}
.info-badge.badge-commercial:hover {
  background: rgba(56, 189, 248, 0.2);
  border-color: rgba(56, 189, 248, 0.6);
  box-shadow:
    0 0 14px rgba(56, 189, 248, 0.35),
    inset 0 0 8px rgba(56, 189, 248, 0.15);
}

/* 工业物业 - 活力琥珀/橙金系 */
.info-badge.badge-industrial {
  background: rgba(251, 146, 60, 0.12);
  border: 1px solid rgba(251, 146, 60, 0.35);
  color: #fb923c;
  text-shadow: 0 0 8px rgba(251, 146, 60, 0.5);
  box-shadow:
    0 0 10px rgba(251, 146, 60, 0.15),
    inset 0 0 6px rgba(251, 146, 60, 0.08);
}
.info-badge.badge-industrial:hover {
  background: rgba(251, 146, 60, 0.2);
  border-color: rgba(251, 146, 60, 0.6);
  box-shadow:
    0 0 14px rgba(251, 146, 60, 0.35),
    inset 0 0 8px rgba(251, 146, 60, 0.15);
}

/* 其他物业 - 神秘幻紫/丁香紫系 */
.info-badge.badge-other {
  background: rgba(192, 132, 252, 0.12);
  border: 1px solid rgba(192, 132, 252, 0.35);
  color: #c084fc;
  text-shadow: 0 0 8px rgba(192, 132, 252, 0.5);
  box-shadow:
    0 0 10px rgba(192, 132, 252, 0.15),
    inset 0 0 6px rgba(192, 132, 252, 0.08);
}
.info-badge.badge-other:hover {
  background: rgba(192, 132, 252, 0.2);
  border-color: rgba(192, 132, 252, 0.6);
  box-shadow:
    0 0 14px rgba(192, 132, 252, 0.35),
    inset 0 0 8px rgba(192, 132, 252, 0.15);
}

/* ===== 可读性增强：文本改为发光材质，提升辨识度 ===== */
.info-label {
  color: #8be9ff;
  font-weight: 500;
  text-shadow:
    0 0 8px rgba(56, 189, 248, 0.9),
    0 0 16px rgba(56, 189, 248, 0.5),
    0 1px 3px rgba(0, 0, 0, 0.9);
}
.info-value {
  color: #f8fcff;
  text-shadow:
    0 0 6px rgba(186, 230, 253, 0.55),
    0 1px 4px rgba(0, 0, 0, 0.9);
}
/* 高亮/等宽字段沿用原有发光，略微增强 */
.info-value.highlight-code {
  color: #7dd3fc;
  text-shadow:
    0 0 8px rgba(56, 189, 248, 0.85),
    0 0 14px rgba(56, 189, 248, 0.45),
    0 1px 3px rgba(0, 0, 0, 0.9);
}

/* ===== 自适应布局（视口防撑爆约束） ===== */
.detail-modal-card {
  width: min(720px, 94vw) !important;
  min-width: min(420px, 94vw) !important;
  max-width: 720px !important;
  height: auto !important;
  min-height: fit-content !important;
  max-height: 94vh !important;
  display: flex !important;
  flex-direction: column !important;
  overflow: visible !important;
  padding: 22px 28px 24px !important;
  gap: 14px !important;
  margin: auto;
}

.modal-scrollable-body {
  flex: 1 1 auto;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-right: 4px;
  max-height: 84vh;
}

.modal-scrollable-body::-webkit-scrollbar {
  width: 5px;
}
.modal-scrollable-body::-webkit-scrollbar-track {
  background: rgba(15, 20, 24, 0.4);
  border-radius: 9999px;
}
.modal-scrollable-body::-webkit-scrollbar-thumb {
  background: rgba(56, 189, 248, 0.4);
  border-radius: 9999px;
  box-shadow: 0 0 6px rgba(56, 189, 248, 0.5);
}
.modal-scrollable-body::-webkit-scrollbar-thumb:hover {
  background: rgba(56, 189, 248, 0.7);
  box-shadow: 0 0 10px rgba(56, 189, 248, 0.9);
}

.section-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.section-header {
  padding: 7px 14px;
}

.section-content-row {
  display: flex;
  gap: 16px;
  align-items: center;
  padding: 2px 2px;
}

.image-viewport {
  width: 108px !important;
  height: 108px !important;
  min-width: 108px !important;
  min-height: 108px !important;
  aspect-ratio: 1 / 1 !important;
  flex-shrink: 0 !important;
  border-radius: 10px !important;
  gap: 4px !important;
}

.image-placeholder-icon {
  width: 32px !important;
  height: 32px !important;
}

.image-placeholder-text {
  font-size: 12px !important;
}

.info-list-col {
  flex: 1 1 auto;
  display: grid;
  grid-template-columns: repeat(2, minmax(170px, 1fr));
  gap: 8px 14px;
  align-content: center;
  min-width: 0;
}

.info-item.info-item-full {
  grid-column: 1 / -1;
}

.info-item {
  display: flex;
  align-items: center;
  min-width: 0;
  font-size: 13.5px;
}

.info-label {
  width: 76px;
  font-size: 13.5px;
}

.info-value {
  min-width: 0;
  font-size: 13.5px;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.section-divider {
  margin: 2px 0;
}

@media (max-width: 600px) {
  .section-content-row {
    flex-direction: column;
    align-items: center;
  }
  .image-viewport {
    width: 100px !important;
    height: 100px !important;
    min-width: 100px !important;
    min-height: 100px !important;
  }
  .info-list-col {
    grid-template-columns: 1fr;
    width: 100%;
    gap: 6px 10px;
  }
}
</style>
