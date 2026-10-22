<template>
  <div
    class="set-info"
    :style="{
      '--panel-scale': props.scale,
      'font-size': '14px',
      'line-height': '1.5',
      'letter-spacing': '0.2px',
    }"
  >
    <header class="top-bar layer layer-header">
      <div class="title-area">
        <h1 class="title">编辑房户信息</h1>
      </div>

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
          <div v-if="buildingOpen" class="dropdown-menu dropdown-menu-building">
            <button
              v-for="building in buildingsData"
              :key="building"
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
    </header>

    <main class="content">
      <section class="table-panel layer layer-table" aria-label="房户信息">
        <div class="table-scroll">
          <table>
            <thead>
              <tr>
                <th>门牌号</th>
                <th>单元号</th>
                <th>楼层</th>
                <th>操作</th>
                <th>定位</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in currentRows"
                :key="row"
                @click="Selecthousehold(row)"
              >
                <td>
                  <span class="tag tag-blue">{{ row.room }}</span>
                </td>
                <td>
                  <span class="tag tag-cyan">{{ row.unit }}</span>
                </td>
                <td>
                  <span class="tag tag-amber">{{ row.floor }}</span>
                </td>
                <td>
                  <button
                    class="edit-button"
                    type="button"
                    @click="editRow(row)"
                  >
                    <span aria-hidden="true">&#9998;</span> 编辑信息
                  </button>
                </td>
                <td>
                  <button
                    class="locate-button"
                    type="button"
                    :aria-label="`定位 ${row.room}`"
                    @click="locateRow(row)"
                  >
                    <span aria-hidden="true">&#9678;</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <footer class="pagination-bar">
          <div class="pagination" aria-label="分页">
            <button
              class="page-button page-arrow"
              type="button"
              aria-label="上一页"
              :disabled="currentPage === 1"
              @click="changePage(currentPage - 1)"
            >
              &#8249;
            </button>

            <template v-for="page in pagesToShow" :key="page">
              <span v-if="page === '...'" class="ellipsis">...</span>
              <button
                v-else
                class="page-button"
                :class="{ active: page === currentPage }"
                type="button"
                @click="changePage(page)"
              >
                {{ page }}
              </button>
            </template>

            <button
              class="page-button page-arrow"
              type="button"
              aria-label="下一页"
              :disabled="currentPage === totalPages"
              @click="changePage(currentPage + 1)"
            >
              &#8250;
            </button>
          </div>

          <div class="page-size-picker dropdown" @click.stop>
            <span class="sr-only">每页条数</span>
            <button
              class="dropdown-trigger"
              type="button"
              aria-label="每页条数"
              :aria-expanded="pageSizeOpen"
              :disabled="buildingOpen || !rows.length"
              @click="pageSizeOpen = !pageSizeOpen"
            >
              <span>{{ rows.length ? `${rowsPerPage} / page` : '' }}</span>
              <span
                class="select-arrow"
                :class="{ open: pageSizeOpen }"
                aria-hidden="true"
              ></span>
            </button>
            <Transition name="dropdown-fade">
              <div v-if="pageSizeOpen" class="dropdown-menu dropdown-menu-up">
                <button
                  v-for="size in pageSizes"
                  :key="size"
                  class="dropdown-option"
                  :class="{ selected: rowsPerPage === size }"
                  type="button"
                  @click="selectPageSize(size)"
                >
                  <span>{{ size }} / page</span>
                  <span v-if="rowsPerPage === size" aria-hidden="true"
                    >&#10003;</span
                  >
                </button>
              </div>
            </Transition>
          </div>
        </footer>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted, onUnmounted } from 'vue';
import { getBuild, getHouse, getOneHouseInfo } from '@/api/function';
import * as Cesium from 'cesium';
import { useMapData } from '../stores/counter';
import * as turf from '@turf/turf';

// ========== 获取 Cesium 视图对象 ==========
const dataStore = useMapData();
const viewer = dataStore.Viewer;

// ========== 页面挂载时初始化楼栋数据 ==========
onMounted(async () => {
  // 从后端获取所有楼栋信息
  const info = await getBuild();
  if (info.code === 200) {
    const { data } = info;
    console.log(data, 'data');
    // 映射楼栋数据：提取 id、name、polygon（多边形坐标）
    buildingsData.value = data.map((item) => {
      return {
        id: item.id,
        name: item.name,
        polygon: item.polygon.coordinates[0],
      };
    });
  }
});

// ========== 响应式数据定义 ==========
const buildingsData = ref([]); // 楼栋数据列表

const props = defineProps({
  scale: {
    type: Number,
    default: 0.7,
  },
});

// ========== UI 状态管理 ==========
const selectedBuilding = ref('选择楼层'); // 当前选中的楼栋名称
const currentPage = ref(1); // 当前分页页码
const rowsPerPage = ref(10); // 每页显示行数
const pageSizes = [10, 20, 50, 100]; // 可选的每页行数
const buildingOpen = ref(false); // 楼栋下拉菜单打开状态
const pageSizeOpen = ref(false); // 分页大小下拉菜单打开状态
const notice = ref(''); // 提示信息

// ========== 房户数据 ==========
const rows = ref(
  // 存储从后端获取的房户数据
  [],
);

// ========== 分页相关计算属性 ==========
// 计算总页数
const totalPages = computed(() =>
  Math.max(1, Math.ceil(rows.value.length / rowsPerPage.value)),
);

// 获取当前页显示的行数据
const currentRows = computed(() => {
  const start = (currentPage.value - 1) * rowsPerPage.value;
  return rows.value.slice(start, start + rowsPerPage.value);
});

// 生成分页按钮显示逻辑（省略号处理）
const pagesToShow = computed(() => {
  if (totalPages.value <= 6) {
    return Array.from({ length: totalPages.value }, (_, index) => index + 1);
  }
  if (currentPage.value <= 3) return [1, 2, 3, 4, '...', totalPages.value];
  if (currentPage.value >= totalPages.value - 2) {
    return [
      1,
      '...',
      totalPages.value - 3,
      totalPages.value - 2,
      totalPages.value - 1,
      totalPages.value,
    ];
  }
  return [
    1,
    '...',
    currentPage.value - 1,
    currentPage.value,
    currentPage.value + 1,
    '...',
    totalPages.value,
  ];
});

// ========== 监听器 ==========
// 当每页行数改变时，重置到第一页
watch(rowsPerPage, () => {
  currentPage.value = 1;
});

// ========== 分页方法 ==========
// 改变页码
function changePage(page) {
  if (page >= 1 && page <= totalPages.value) currentPage.value = page;
}

let buildingEntity; // 存储当前选中楼栋的 Cesium 实体
let centerPoint; //楼栋中心点坐标
// ========== 楼栋选择功能 ==========
const selectBuilding = async (building) => {
  // 1. 清除之前选中的楼栋实体 和楼栋中心点
  if (buildingEntity) {
    viewer.entities.remove(buildingEntity);
    centerPoint = null;
    viewer.scene.requestRender();
  }

  // 1.1 清除上一楼栋中点击定位生成的房户 primitive（避免切换楼栋后残留）
  if (primitive) {
    viewer.scene.primitives.remove(primitive);
    primitive = null;
    householdHeight = null;
    viewer.scene.requestRender();
  }

  // 2. 更新 UI 状态
  selectedBuilding.value = building.name;
  buildingOpen.value = false;

  // 3. 计算楼栋中心点（用于相机飞行）
  const polygonFeature = {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [building.polygon],
    },
  };

  const center = turf.center(polygonFeature);
  const centerCoordinates = center.geometry.coordinates; //数组 [113,22]

  // 4. 将多边形坐标数组打平，用于 Cesium 渲染
  const positions = building.polygon.reduce((a, b) => {
    return a.concat(b);
  }, []);
  const cartesian = new Cesium.Cartesian3.fromDegreesArray(positions);

  // 5. 在 Cesium 中绘制多边形实体
  buildingEntity = viewer.entities.add({
    name: building.name,
    polygon: {
      hierarchy: new Cesium.PolygonHierarchy(cartesian),
      material: Cesium.Color.RED.withAlpha(0.6),
      classificationType: Cesium.ClassificationType.BOTH,
    },
  });
  viewer.scene.requestRender();

  // 6. 相机飞行到楼栋中心
  if (buildingEntity) {
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(...centerCoordinates, 500),
    });
  }

  // 7. 从后端获取该楼栋下所有房户信息
  const queryParam = {
    id: building.id,
    pageIndex: 1,
    noPage: 1, // 获取全部而不分页
  };

  const info = await getHouse(queryParam);
  if (info.code === 200) {
    console.log(info, '房户信息');
    const list = info.data.list;

    // 8. 清空之前的数据，重新填充当前楼栋的房户数据
    rows.value = [];
    let MinHeight = Number.MAX_VALUE;
    let MaxHeight = Number.MIN_VALUE;
    list.forEach((household) => {
      const { floorNum, number, minHeight, maxHeight } = household;

      //进行楼层最低/最高 点的计算 为确定楼层中心的高度
      if (minHeight < MinHeight) {
        MinHeight = minHeight;
      }
      if (maxHeight > MaxHeight) {
        MaxHeight = maxHeight;
      }

      // 生成门牌号：楼层 + 0 + 户号（例如：3层1号房 = 301）
      const room = `${floorNum}${Number(number) < 10 ? '0' + number : number}`;
      const unit = `${number}单元`;
      const floor = `F${floorNum}`;
      rows.value.push({
        ...household,
        room,
        unit,
        floor,
      });
    });
    const MiddleHeight = (MinHeight + MaxHeight) / 2;
    centerPoint = Cesium.Cartesian3.fromDegrees(
      ...centerCoordinates,
      MiddleHeight,
    );
    console.log(centerPoint, '楼栋中心');
  }
};

// ========== 分页大小控制 ==========
// 改变每页显示行数
function selectPageSize(size) {
  rowsPerPage.value = size;
  pageSizeOpen.value = false;
}

//点击row 跳转到对应房户
let primitive;
let householdHeight;
const Selecthousehold = (row) => {
  if (primitive) {
    viewer.scene.primitives.remove(primitive);
    householdHeight = null;
    viewer.scene.requestRender();
  }

  householdHeight = (row.minHeight + row.maxHeight) / 2;

  console.log(row, 'row');
  const { polygon: coordinates } = row;
  const position2 = coordinates.coordinates[0];
  const position1 = position2.reduce((a, b) => {
    return a.concat(b);
  }, []);

  const hierarchy = new Cesium.PolygonHierarchy(
    Cesium.Cartesian3.fromDegreesArray(position1),
  );
  primitive = new Cesium.ClassificationPrimitive({
    geometryInstances: new Cesium.GeometryInstance({
      geometry: new Cesium.PolygonGeometry({
        polygonHierarchy: hierarchy,
        height: row.minHeight,
        extrudedHeight: row.maxHeight,
      }),

      attributes: {
        color: Cesium.ColorGeometryInstanceAttribute.fromColor(
          Cesium.Color.fromRandom({ alpha: 0.6 }),
        ),
      },
    }),

    classificationType: Cesium.ClassificationType.CESIUM_3D_TILE,
  });
  viewer.scene.primitives.add(primitive);
  viewer.scene.requestRender();
};

// ========== 表格行操作 ==========
// 编辑房户信息（点击编辑按钮）

const editRow = async (row) => {
  const { id, floorNum, number } = row; //id 楼层 单元号
  const res = await getOneHouseInfo({ id });
  if (res.code === 200) {
    console.log(res.data, '返回数据');
    dataStore.updateRowData(res.data);
    dataStore.openShowEdit(); //打开编辑框
  }
};

// 定位房户（点击定位按钮）
function locateRow(row) {
  const { polygon: coordinates } = row;
  const position2 = coordinates.coordinates[0];

  //计算楼栋中心点（用于相机飞行）
  const polygonFeature = {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [position2],
    },
  };

  const center = turf.center(polygonFeature);
  const centerCoordinates = center.geometry.coordinates;
  const centerHouseholdHeight = (row.minHeight + row.maxHeight) / 2;
  const centerHouseholdPoint = Cesium.Cartesian3.fromDegrees(
    ...centerCoordinates,
    centerHouseholdHeight,
  );

  console.log(centerHouseholdPoint, '房户中心');
  flyToCube(centerHouseholdPoint, centerPoint);
}

// 房户飞行功能
function flyToCube(targetCenter, buildingCenter, distance = 60, maxPitch = 0) {
  if (!targetCenter || !buildingCenter) {
    showNotice('请先选择楼栋');
    return;
  }

  // 从楼栋中心指向房户中心，作为相机的外向方向。
  const outward = Cesium.Cartesian3.subtract(
    targetCenter,
    buildingCenter,
    new Cesium.Cartesian3(),
  );
  if (Cesium.Cartesian3.magnitudeSquared(outward) === 0) {
    showNotice('房户中心与楼栋中心重合');
    return;
  }
  Cesium.Cartesian3.normalize(outward, outward);

  // 以目标点的局部地平面为基准，限制相机俯仰角，避免斜向穿入楼体。
  const localUp = Cesium.Ellipsoid.WGS84.geodeticSurfaceNormal(
    targetCenter,
    new Cesium.Cartesian3(),
  );

  const verticalComponent = Cesium.Cartesian3.dot(outward, localUp);
  const horizontal = Cesium.Cartesian3.subtract(
    outward,
    Cesium.Cartesian3.multiplyByScalar(
      localUp,
      verticalComponent,
      new Cesium.Cartesian3(),
    ),
    new Cesium.Cartesian3(),
  );
  const horizontalLength = Cesium.Cartesian3.magnitude(horizontal);
  if (horizontalLength > Cesium.Math.EPSILON6) {
    const maxVertical =
      horizontalLength * Math.tan(Cesium.Math.toRadians(maxPitch));
    const limitedVertical = Cesium.Math.clamp(
      verticalComponent,
      -maxVertical,
      maxVertical,
    );
    Cesium.Cartesian3.add(
      horizontal,
      Cesium.Cartesian3.multiplyByScalar(
        localUp,
        limitedVertical,
        new Cesium.Cartesian3(),
      ),
      outward,
    );
    Cesium.Cartesian3.normalize(outward, outward);
  }

  // 相机位于房户外侧，并朝向房户中心。
  const cameraPos = Cesium.Cartesian3.add(
    targetCenter,
    Cesium.Cartesian3.multiplyByScalar(
      outward,
      distance,
      new Cesium.Cartesian3(),
    ),
    new Cesium.Cartesian3(),
  );
  const direction = Cesium.Cartesian3.negate(outward, new Cesium.Cartesian3());
  const up = Cesium.Ellipsoid.WGS84.geodeticSurfaceNormal(
    cameraPos,
    new Cesium.Cartesian3(),
  );

  viewer.camera.flyTo({
    destination: cameraPos,
    orientation: {
      direction,
      up,
    },
    duration: 1.2,
  });
}

// ========== 提示信息显示 ==========
// 显示临时提示信息（2.2 秒后自动消失）

// 组件卸载时，移除本组件产生的楼栋 entity 与房户 primitive
onUnmounted(() => {
  if (buildingEntity && viewer?.entities.contains(buildingEntity)) {
    viewer.entities.remove(buildingEntity);
  }
  buildingEntity = null;

  if (primitive && viewer?.scene.primitives.contains(primitive)) {
    viewer.scene.primitives.remove(primitive);
  }
  primitive = null;
  viewer.scene.requestRender();
});
</script>

<style scoped>
:global(*) {
  box-sizing: border-box;
}

:global(body) {
  margin: 0;
}

.set-info {
  --background: #0f1418;
  --surface: #171c20;
  --surface-high: #252b2e;
  --surface-highest: #303539;
  --outline: #3e484f;
  --muted: #bdc8d1;
  --text: #dee3e8;
  --primary: #8ed5ff;
  --primary-container: #38bdf8;
  --tertiary: #ffc176;
  position: fixed;
  top: 16px;
  left: 16px;
  z-index: 1000;
  transform: scale(var(--panel-scale, 0.5));
  transform-origin: top left;
  display: flex;
  flex-direction: column;
  width: 50vw;
  max-height: 120vh;
  /* 不设 overflow: hidden：否则楼栋下拉菜单展开超出面板时会被裁剪。
     面板内的滚动由 .table-scroll（overflow: auto）承担 */
  border: 1px solid rgba(56, 130, 246, 0.28);
  border-radius: 14px;
  color: var(--text);
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
  font-family: 'Segoe UI', 'Microsoft YaHei', sans-serif;
}

.set-info::before {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  content: '';
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

.top-bar {
  position: relative;
  z-index: 20;
  display: flex;
  flex: 0 0 64px;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 24px;
  background: rgba(9, 17, 33, 0.26);
  backdrop-filter: blur(12px);
}

.title-area {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 12px;
}

h1 {
  position: relative;
  margin: 0;
  padding-left: 14px;
  color: #f0f6ff;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-shadow: 0 0 12px rgba(56, 189, 248, 0.35);
}

.title::before {
  position: absolute;
  top: 50%;
  left: 0;
  width: 3px;
  height: 18px;
  content: '';
  border-radius: 2px;
  background: linear-gradient(180deg, #38bdf8, #2563eb);
  box-shadow: 0 0 8px rgba(56, 189, 248, 0.8);
  transform: translateY(-50%);
}

button {
  font: inherit;
}

button {
  cursor: pointer;
}

.building-picker,
.page-size-picker {
  position: relative;
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
}

.page-size-picker {
  z-index: 1050;
}

.dropdown-trigger {
  position: relative;
  display: inline-flex;
  min-width: 148px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 34px 8px 14px;
  border: 1px solid rgba(56, 130, 246, 0.22);
  border-radius: 6px;
  color: #b8d0ee;
  outline: 0;
  background: rgba(56, 130, 246, 0.08);
  text-align: left;
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

.dropdown-menu-up {
  top: auto;
  bottom: calc(100% + 6px);
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

.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
  transform-origin: top center;
}

.dropdown-menu-up.dropdown-fade-enter-active,
.dropdown-menu-up.dropdown-fade-leave-active {
  transform-origin: bottom center;
}

.dropdown-fade-enter-from,
.dropdown-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px) scaleY(0.96);
}

.dropdown-menu-up.dropdown-fade-enter-from,
.dropdown-menu-up.dropdown-fade-leave-to {
  transform: translateY(6px) scaleY(0.96);
}

.select-arrow {
  position: static;
  width: 8px;
  height: 8px;
  flex: 0 0 8px;
  margin: 0 3px 4px 0;
  border-right: 2px solid var(--muted);
  border-bottom: 2px solid var(--muted);
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

/* Keep the old native-control dimensions from changing the custom trigger. */
.dropdown-trigger {
  min-width: 148px;
}

.content {
  min-height: 0;
  width: 100%;
}

.table-panel {
  min-height: 0;
  overflow: hidden;
}

.layer-table {
  border-bottom: 0;
}

.table-scroll {
  max-height: min(560px, calc(100vh - 150px));
  overflow: auto;
  scrollbar-color: #6b7782 rgba(9, 17, 33, 0.72);
  scrollbar-width: thin;
}

.table-scroll::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.table-scroll::-webkit-scrollbar-track {
  border: 1px solid rgba(56, 130, 246, 0.12);
  background: rgba(9, 17, 33, 0.72);
}

.table-scroll::-webkit-scrollbar-thumb {
  border: 2px solid rgba(9, 17, 33, 0.72);
  border-radius: 6px;
  background: linear-gradient(180deg, #87929a, #58636c);
}

.table-scroll::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, #aab4bb, #707b84);
}

.table-scroll::-webkit-scrollbar-corner {
  background: #0b1220;
}

table {
  width: 100%;
  min-width: 680px;
  border-collapse: separate;
  border-spacing: 0;
  border: 1px solid rgba(56, 130, 246, 0.2);
  border-radius: 8px;
  text-align: center;
  background: rgba(9, 17, 33, 0.4);
  font-size: 14px;
}

th,
td {
  width: 20%;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(56, 130, 246, 0.12);
}

thead {
  position: sticky;
  top: 0;
  z-index: 10;
}

th {
  position: sticky;
  top: 0;
  z-index: 11;
  color: #a9c6ec;
  background: #101d35;
  font-size: 14px;
  letter-spacing: 0.3px;
  text-transform: uppercase;
}

tbody tr {
  transition: background 0.2s;
}

tbody tr:hover {
  background: rgba(56, 130, 246, 0.06);
}

.tag {
  display: inline-flex;
  align-items: center;
  padding: 3px 9px;
  border: 1px solid;
  border-radius: 999px;
  font-family: Consolas, monospace;
  font-size: 12px;
}

.tag-blue,
.tag-cyan {
  color: var(--primary);
  border-color: rgba(142, 213, 255, 0.55);
  background: rgba(142, 213, 255, 0.1);
  text-shadow: 0 0 8px rgba(56, 189, 248, 0.6);
}

.tag-cyan {
  color: var(--primary-container);
  border-color: rgba(56, 189, 248, 0.55);
  background: rgba(56, 189, 248, 0.1);
}

.tag-amber {
  color: var(--tertiary);
  border-color: rgba(255, 193, 118, 0.55);
  background: rgba(255, 193, 118, 0.1);
  text-shadow: 0 0 8px rgba(255, 193, 118, 0.45);
}

.edit-button,
.locate-button {
  border: 0;
  color: #38bdf8;
  background: transparent;
  transition:
    color 0.15s ease,
    text-shadow 0.15s ease,
    filter 0.15s ease;
}

.edit-button:hover {
  color: #22d3ee;
  text-shadow: 0 0 8px rgba(34, 211, 238, 0.5);
}

.locate-button {
  color: #38bdf8;
  font-size: 40px;
}

.locate-button:hover {
  color: #22d3ee;
  filter: drop-shadow(0 0 6px rgba(34, 211, 238, 0.6));
}

.pagination-bar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  flex-wrap: wrap;
  padding: 16px 0 0;
  background: transparent;
}

.pagination {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: Consolas, monospace;
}

.page-button {
  display: inline-flex;
  width: 32px;
  height: 32px;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  border-radius: 4px;
  color: var(--text);
  background: transparent;
}

.page-button:hover:not(:disabled),
.page-button.active {
  border-color: var(--primary);
  color: var(--primary);
  background: rgba(142, 213, 255, 0.14);
  box-shadow: 0 0 10px rgba(56, 189, 248, 0.25);
}

.page-button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
  border-color: var(--outline);
}

.page-arrow {
  color: var(--muted);
  font-size: 24px;
  line-height: 20px;
}

.ellipsis {
  padding: 0 4px;
  color: var(--muted);
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

.notice {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 1100;
  padding: 12px 18px;
  border: 1px solid rgba(142, 213, 255, 0.45);
  border-radius: 4px;
  color: var(--primary);
  background: var(--surface);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

@media (max-width: 600px) {
  .top-bar {
    min-height: 64px;
    padding: 12px 16px;
  }

  h1 {
    font-size: 18px;
  }

  .building-picker {
    max-width: 42%;
  }

  .building-picker .dropdown-trigger {
    min-width: 0;
    width: 100%;
    padding-left: 9px;
  }

  .table-scroll {
    max-height: calc(100vh - 150px);
  }

  .pagination-bar {
    justify-content: center;
    padding: 14px 10px;
  }
}
</style>
