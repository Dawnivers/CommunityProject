<template>
  <div class="panel" :style="{ '--panel-scale': scale }">
    <!-- 第一行：标题 -->
    <header class="layer layer-header">
      <h1 class="title">查看房户信息</h1>
    </header>

    <!-- 第二行：楼栋选择 -->
    <section class="layer layer-select">
      <span class="select-label">楼栋选择：</span>

      <div class="building-picker dropdown" @click.stop>
        <span class="sr-only">选择楼栋</span>
        <button
          class="dropdown-trigger"
          type="button"
          aria-label="选择楼栋"
          :aria-expanded="buildingOpen"
          @click="buildingOpen = !buildingOpen"
        >
          <span>{{ selectedBuilding }}</span>
          <span
            class="select-arrow"
            :class="{ open: buildingOpen }"
            aria-hidden="true"
          ></span>
        </button>

        <Transition name="dropdown-fade">
          <div v-if="buildingOpen" class="dropdown-menu">
            <button
              v-for="building in buildingsData"
              :key="building.id"
              class="dropdown-option"
              :class="{ selected: selectedBuilding === building.name }"
              type="button"
              @click="selectBuilding(building)"
            >
              <span>{{ building.name }}</span>
              <span v-if="selectedBuilding === building.name" aria-hidden="true"
                >&#10003;</span
              >
            </button>
          </div>
        </Transition>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { getBuild } from '@/api/function';
import * as turf from '@turf/turf';
import { useMapData } from '@/stores/counter';
import * as Cesium from 'cesium';
import { getHouse, getOneHouseInfo } from '@/api/function';
import { addPrimitive } from '@/cesiumTools/utils';
import SimpleLabel from '../cesiumTools/SimpleLabel.js';

const dataStore = useMapData();
const viewer = dataStore.Viewer;

const props = defineProps({
  scale: {
    type: Number,
    default: 0.7,
  },
});

// ========== 响应式数据 ==========
const buildingsData = ref([]); // 楼栋数据列表
const selectedBuilding = ref('请选择楼栋'); // 当前选中的楼栋名称
const buildingOpen = ref(false); // 楼栋下拉菜单打开状态
const housePrimitives = []; // 保存本组件渲染的所有房户 primitive，便于切换楼栋与卸载时移除

// ========== 页面挂载时初始化楼栋数据 ==========
onMounted(async () => {
  const info = await getBuild();
  if (info.code === 200) {
    const { data } = info;

    buildingsData.value = data.map((item) => ({
      id: item.id,
      name: item.name,
      polygon: item.polygon.coordinates[0],
    }));
  }
});

// ========== 楼栋选择 ==========
async function selectBuilding(building) {
  //选择楼栋
  selectedBuilding.value = building.name;
  buildingOpen.value = false;

  //飞行效果
  flyToBuilding(building.polygon);

  //获取 当前楼栋所有房户信息
  const list = await getHouseInfo(building.id);
  console.log(list);

  //移除上一楼栋渲染的 primitive，避免叠加
  housePrimitives.forEach((p) => viewer.scene.primitives.remove(p));
  housePrimitives.length = 0;

  //重置拾取状态：上一楼栋的 primitive 已被移除，
  //若不重置，再次点击时 getGeometryInstanceAttributes 会因引用失效而抛异常
  lastPick = null;
  if (lastPopup) {
    lastPopup.removeMarker();
    lastPopup = null;
  }

  //根据房户 信息 渲染所有住户的primitive(和SetBuilding 类似)
  list.forEach((item) => {
    const primitive = addPrimitive(
      item.polygon,
      item.minHeight,
      item.maxHeight,
      item.id,
    );
    viewer.scene.primitives.add(primitive);
    housePrimitives.push(primitive);
  });
  // requestRenderMode 下主动刷新：新增房户 primitive 后即时渲染，避免残留上一楼栋的旧画面
  viewer.scene.requestRender();
}

// ========== 注册点击事件 获取被点击的primitive 信息
let sse = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
let lastPick = null;
let lastAttributeColor = null;

let lastPopup = null;

const registHandler = () => {
  sse.setInputAction(async (e) => {
    const pick = viewer.scene.pick(e.position);
    const pickPosition = viewer.scene.pickPosition(e.position); //Cartesian3

    console.log(pick, 'pick');
    console.log(pick.id, 'pickID');

    if (pick && pick.id && pickPosition) {
      if (lastPick && lastPopup) {
        const Lastattributes = lastPick.primitive.getGeometryInstanceAttributes(
          lastPick.id,
        );

        Lastattributes.color = lastAttributeColor;
        lastPopup.removeMarker();
      }
      //改变被点击的primitive 颜色为黄色
      const attributes = pick.primitive.getGeometryInstanceAttributes(pick.id);
      //console.log(pick.primitive); 获得的primitive 可以正常 使用 primitive.appearance.material 来调整样式

      lastPick = pick;
      lastAttributeColor = attributes.color;
      attributes.color = Cesium.ColorGeometryInstanceAttribute.toValue(
        Cesium.Color.YELLOW.withAlpha(0.88),
      );
      // 修改 primitive 颜色后主动刷新，让选中高亮即时生效
      viewer.scene.requestRender();

      //点击被点击的primitive 显示popup
      //1.气泡的样式设定
      const popup = new SimpleLabel(viewer, {
        position: pickPosition,
        type: 'marker',
        offset: [300, -400],
        scaleByDistance: new Cesium.NearFarScalar(1000, 0.8, 20000, 0.4),
      });
      lastPopup = popup;

      //2根据 点击的 primitive id 获取 houseInfo 注册点击气泡
      const houseInfo = await getHouseInfoByID(pick.id);
      console.log(houseInfo, '房户信息');
      popup.addLabel(houseInfo); //传入要渲染的数据 后端获取
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
};

registHandler();
//=======工具功能实现==========
async function getHouseInfoByID(id) {
  const res = await getOneHouseInfo({ id });
  if (res.code === 200) {
    return res.data;
  }
}

async function getHouseInfo(id) {
  // 7. 从后端获取该楼栋下所有房户信息
  const queryParam = {
    id: id,
    pageIndex: 1,
    noPage: 1, // 获取全部而不分页
  };
  const info = await getHouse(queryParam);
  if (info.code === 200) {
    console.log(info, '房户信息');
    const list = info.data.list;
    return list;
  }
}
function flyToBuilding(coordinates) {
  //飞行效果
  const polygonFeature = {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [coordinates],
    },
  };

  const centerObject = turf.center(polygonFeature);
  const centerCoordinates = centerObject.geometry.coordinates; //数组 [113,22]

  // 6. 相机飞行到楼栋中心
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(...centerCoordinates, 500),
  });
}

// 组件卸载时，注销事件处理器并移除本组件产生的 primitive / popup
onUnmounted(() => {
  // 1. 销毁屏幕空间事件处理器（点击拾取事件）
  if (sse) {
    sse.destroy();
    sse = null;
  }

  // 2. 移除所有房户 primitive
  housePrimitives.forEach((p) => viewer.scene.primitives.remove(p));
  housePrimitives.length = 0;

  // 3. 移除 popup 标注（含其 postRender 监听器）
  if (lastPopup) {
    lastPopup.removeMarker();
    lastPopup = null;
  }
  viewer.scene.requestRender();
});
</script>

<style scoped>
.panel {
  position: fixed;
  top: 16px;
  left: 16px;
  z-index: 1000;
  transform: scale(var(--panel-scale, 1.2));
  transform-origin: top left;
  display: flex;
  flex-direction: column;
  width: 50vw;
  border: 1px solid rgba(56, 130, 246, 0.28);
  border-radius: 14px;
  background:
    radial-gradient(
      120% 80% at 0% 0%,
      rgba(37, 99, 235, 0.14),
      transparent 60%
    ),
    radial-gradient(
      120% 80% at 100% 100%,
      rgba(6, 182, 212, 0.12),
      transparent 55%
    ),
    linear-gradient(160deg, #0b1220 0%, #0c1526 55%, #0a1120 100%);
  box-shadow:
    0 0 0 1px rgba(56, 130, 246, 0.08),
    0 18px 50px rgba(3, 10, 25, 0.65),
    inset 0 1px 0 rgba(148, 197, 255, 0.08);
  font-family:
    system-ui,
    -apple-system,
    'Segoe UI',
    sans-serif;
  color: #e6eefc;
}

/* 顶部发光装饰线 */
.panel::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(
    90deg,
    transparent,
    #38bdf8 20%,
    #2563eb 50%,
    #22d3ee 80%,
    transparent
  );
  opacity: 0.85;
}

.layer {
  padding: 16px 24px;
  border-bottom: 1px solid rgba(56, 130, 246, 0.14);
}

/* 第一行：标题 */
.layer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.title {
  position: relative;
  margin: 0;
  padding-left: 14px;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 0.5px;
  color: #f0f6ff;
  text-shadow: 0 0 12px rgba(56, 189, 248, 0.35);
}

/* 标题左侧发光竖条 */
.title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 18px;
  border-radius: 2px;
  background: linear-gradient(180deg, #38bdf8, #2563eb);
  box-shadow: 0 0 8px rgba(56, 189, 248, 0.8);
}

/* 第二行：楼栋选择 */
.layer-select {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-bottom: none;
}

.select-label {
  color: #8ba6c9;
  font-size: 18px;
}

/* ========== 楼栋下拉 ========== */
.building-picker {
  position: relative;
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
}

.dropdown-trigger {
  position: relative;
  display: inline-flex;
  min-width: 130px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 20px 8px 14px;
  border: 1px solid rgba(56, 130, 246, 0.22);
  border-radius: 6px;
  color: #b8d0ee;
  outline: 0;
  background: rgba(56, 130, 246, 0.08);
  text-align: left;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.18s ease;
}

.dropdown-trigger:hover {
  border-color: rgba(56, 189, 248, 0.5);
  background: rgba(56, 130, 246, 0.14);
}

.dropdown-trigger:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.dropdown-trigger:disabled:hover {
  border-color: rgba(56, 130, 246, 0.22);
  background: rgba(56, 130, 246, 0.08);
}

.dropdown-trigger:focus,
.dropdown-trigger:active,
.dropdown-trigger[aria-expanded='true'] {
  border-color: rgba(34, 211, 238, 0.45);
  background: rgba(34, 211, 238, 0.14);
  box-shadow:
    0 0 0 2px rgba(34, 211, 238, 0.14),
    0 0 12px rgba(34, 211, 238, 0.3);
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  z-index: 30;
  width: 100%;
  padding: 4px 0;
  overflow: hidden;
  border: 1px solid rgba(56, 130, 246, 0.35);
  border-radius: 6px;
  background: #0b1220;
  box-shadow:
    0 8px 24px rgba(3, 10, 25, 0.65),
    0 0 12px rgba(56, 189, 248, 0.12);
}

.dropdown-option {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  padding: 8px 14px;
  border: 0;
  color: #d3e2f5;
  background: transparent;
  text-align: left;
  font: inherit;
  cursor: pointer;
  transition:
    color 0.15s ease,
    background 0.15s ease;
}

.dropdown-option:hover,
.dropdown-option.selected {
  color: #ffffff;
  background: rgba(56, 130, 246, 0.2);
}

.dropdown-option.selected {
  color: #38bdf8;
}

.select-arrow {
  position: static;
  width: 8px;
  height: 8px;
  flex: 0 0 8px;
  margin: 0 3px 4px 0;
  border-right: 2px solid #bdc8d1;
  border-bottom: 2px solid #bdc8d1;
  transform: rotate(45deg);
  transform-origin: center;
  transition:
    border-color 0.18s ease,
    transform 0.18s ease;
}

.select-arrow.open {
  color: #22d3ee;
  border-color: #22d3ee;
  transform: rotate(225deg);
}

/* 下拉过渡动画 */
.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
  transform-origin: top center;
}

.dropdown-fade-enter-from,
.dropdown-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px) scaleY(0.96);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
