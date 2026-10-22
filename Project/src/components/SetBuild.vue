<template>
  <div class="panel" :style="{ '--panel-scale': scale }">
    <!-- 第一层：标题 + 退出按钮 -->
    <header class="layer layer-header">
      <h1 class="title">楼房分户</h1>
      <button
        type="button"
        class="exit-btn"
        aria-label="刷新"
        @click="handleRefresh"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M21 12a9 9 0 1 1-3-6.7" />
          <polyline points="21 3 21 9 15 9" />
        </svg>
      </button>
    </header>

    <!-- 第二层：三步骤导航 -->
    <section class="layer layer-steps">
      <ul class="steps">
        <li
          v-for="(step, index) in steps"
          :key="step.id"
          class="step"
          :class="{
            'is-active': currentStep === step.id,
            'is-done': currentStep > step.id,
          }"
        >
          <span class="step-index">
            <svg
              v-if="currentStep > step.id"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="3"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <template v-else>{{ step.id }}</template>
          </span>
          <span class="step-label">{{ step.label }}</span>
          <span
            v-if="index < steps.length - 1"
            class="step-line"
            :class="{ 'is-done': currentStep > step.id }"
            aria-hidden="true"
          ></span>
        </li>
      </ul>
    </section>

    <!-- 第三层：绘制工具 -->
    <section class="layer layer-tools">
      <span class="tools-label">绘制户型：</span>
      <button type="button" class="tool-btn" @click="handleDraw">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M12 12v9" />
          <path d="M12 12 5 4" />
          <path d="m12 12 7-8" />
        </svg>
        <span>
          {{
            currentStep === 1
              ? '绘制图形'
              : currentStep === 2
                ? '户型裁剪'
                : '楼层分层'
          }}
        </span>
      </button>
    </section>

    <!-- 第四层：表格 + 下一步 -->
    <section class="layer layer-table">
      <table class="table">
        <thead>
          <tr>
            <th>分户坐标</th>
            <th>地址前缀</th>
            <th>单位</th>
            <th v-if="currentStep < 3">操作</th>
            <th v-if="currentStep === 2">定位</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.id">
            <td class="coord" :title="row.coord">{{ row.coord }}</td>

            <!-- 第一步和第二步：按行独立切换编辑状态 -->
            <template v-if="currentStep < 3 && row.isEditing">
              <td>
                <input v-model="row.prefix" type="text" class="cell-input" />
              </td>
              <td>
                <input
                  v-model="row.unit"
                  type="text"
                  class="cell-input cell-input-sm"
                />
              </td>
              <td class="actions">
                <button type="button" class="link-btn" @click="handleSave(row)">
                  保存
                </button>
                <button
                  type="button"
                  class="link-btn"
                  @click="handleCancel(row)"
                >
                  取消
                </button>
              </td>
              <td v-if="currentStep === 2"></td>
            </template>

            <template v-else>
              <td>{{ row.prefix }}</td>
              <td>{{ row.unit }}</td>
              <td v-if="currentStep < 3" class="actions">
                <button type="button" class="link-btn" @click="handleEdit(row)">
                  编辑
                </button>
                <button
                  type="button"
                  class="link-btn"
                  @click="handleDelete(row)"
                >
                  删除
                </button>
              </td>
              <td v-if="currentStep === 2">
                <button
                  type="button"
                  class="locate-btn"
                  aria-label="定位"
                  @click="handleLocate(row)"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path
                      d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"
                    />
                  </svg>
                </button>
              </td>
            </template>
          </tr>
        </tbody>
      </table>

      <!-- 第三步：楼层分层字段 -->

      <div v-if="currentStep === 3 && isThridShow" class="fields">
        <div class="field">
          <label class="field-label">最低点：</label>
          <input
            type="text"
            class="field-input"
            :value="layerData.lowest"
            disabled
          />
        </div>
        <div class="field">
          <label class="field-label">分割点：</label>
          <input
            type="text"
            class="field-input"
            :value="layerData.split"
            disabled
          />
        </div>
        <div class="field">
          <label class="field-label">最高点：</label>
          <input
            type="text"
            class="field-input"
            :value="layerData.highest"
            disabled
          />
        </div>
        <div class="field">
          <label class="field-label">楼层数：</label>
          <input v-model="layerData.floors" type="text" class="field-input" />
        </div>
      </div>

      <div class="table-footer">
        <template v-if="currentStep === 3">
          <button
            v-if="isThridShow"
            type="button"
            class="ghost-btn"
            @click="handleLayer"
          >
            楼房分层
          </button>
          <button
            v-if="isLayered"
            type="button"
            class="next-btn"
            @click="handleGenerate"
          >
            生成数据
          </button>
        </template>
        <button v-else type="button" class="next-btn" @click="handleNext">
          下一步
        </button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onUnmounted } from 'vue';
import DrawTool from '@/cesiumTools/drawTool';
import {
  changeCartesin3ToGeoJson,
  cartesian3ToDegreesHeight,
} from '../cesiumTools/utils';
import { useMapData } from '../stores/counter';
import { message } from 'ant-design-vue';

import polygonCut from '@/cesiumTools/polygonCut';
import * as Cesium from 'cesium';

import { binkEntityMaterial } from '../cesiumTools/sceneManager';

import { addHouse } from '@/api/function';
message.config({ top: '120px' });

const scale = 0.7;

//步骤名称（一/二/三）
const steps = [
  { id: 1, label: '区域绘制' },
  { id: 2, label: '户型切分' },
  { id: 3, label: '楼房分层' },
];

const currentStep = ref(1);

const isThridShow = ref(false);
const isLayered = ref(false);
const layerPrimitives = [];
const layerData = ref({
  lowest: 0,
  split: 0,
  highest: 0,
  floors: 0,
});

const rows = ref([
  /*  {
    coord: '113.06046783941999,...',
    prefix: '常青花园10楼栋',
    unit: '1',
    isEditing: false,
  },
  {
    coord: '113.0608299523483,...',
    prefix: '常青花园10楼栋',
    unit: '2',
    isEditing: false,
  }, */
]);

function handleRefresh() {
  // 清理正在进行的绘制，避免刷新后旧监听器继续接收鼠标事件
  if (drawTool) {
    drawTool.unRegisterEvents();
    drawTool.removeAllDrawEnts();
    drawTool.destoryMarker();
    drawTool.drawType = undefined;
    drawTool.positions = [];
    drawTool.curPositions = [];
  }

  drawEntLisener && drawTool?.removeListener(drawEntLisener);
  drawEntLisener = undefined;

  // 只清理本组件生成的分层 primitive
  layerPrimitives.forEach((primitive) => {
    viewer?.scene.primitives.remove(primitive);
  });
  layerPrimitives.length = 0;

  // 清理本次业务创建的 Entity（区域多边形、切分面等所有绘制图形）
  viewer?.entities.removeAll();
  // requestRenderMode 下清空后画面不会自动重绘，主动请求一帧避免旧图形残影
  viewer?.scene.requestRender && viewer.scene.requestRender();

  currentStep.value = 1;
  isThridShow.value = false;
  isLayered.value = false;
  layerData.value = {
    lowest: 0,
    split: 0,
    highest: 0,
    floors: 0,
  };
  rows.value = [];

  postDataSource.polygonJson = '';
  postDataSource.polygonJsonArr = [];
  postDataSource.unitArr = [];
  postDataSource.heightArr = [];
  postDataSource.name = [];
  postDataSource.floorNum = 0;
}

//推送到服务端的数据
//polygonJson 总区域 geojson字符串
//polygonJsonArr 切割后geojson 字符串数组 如果没有切割 传入【】
//unitArr 单位数组
//heightArr 三个高度数组
//name 楼栋名称
//floorNum 楼层数
const postDataSource = {
  polygonJson: '',
  polygonJsonArr: [],
  unitArr: [],
  heightArr: [],
  name: [],
  floorNum: 0,
};

//第一步：绘制图形

const dataStore = useMapData(); //定义仓库实例 拿到viewer
const viewer = dataStore.Viewer;
let drawTool;
if (viewer) {
  drawTool = new DrawTool(viewer);
}

let drawEntLisener;
function handleDraw() {
  if (currentStep.value === 1) {
    if (rows.value.length) {
      message.warn('请先完成当前建筑的分户处理');
      return;
    }
    //  防止 图形没画完 再次点击绘画 当点击时 没完成的作图也会清除
    drawEntLisener && drawTool.removeListener(drawEntLisener); //解绑
    //1.编写监听的事件（drawEnd会返回 绘画实体 坐标-Cartensian3 ）
    drawTool.active(drawTool.DrawTypes.Polygon);
    drawEntLisener = (drawEnt, postions, drawType) => {
      const { geojson, positionLng } = changeCartesin3ToGeoJson(
        postions,
        'polygon',
      );
      ('');
      if (geojson) {
        postDataSource.polygonJson = JSON.stringify(geojson);
        // 在table中填入数据
        rows.value.push({
          coord: positionLng.join(','),
          prefix: 'xxx小区xxx楼栋',
          unit: '1',
          isEditing: true,
          originalData: {
            prefix: 'xxx小区xxx楼栋',
            unit: '1',
          },
          entity: drawEnt,
          isSave: false,
          polyGonJson: geojson,
        });

        postDataSource.name = rows.value[0].prefix;
      }

      drawEntLisener && drawTool.removeListener(drawEntLisener); //解绑
    };
    drawTool.DrawEndEvent.addEventListener(drawEntLisener);
  } else if (currentStep.value === 2) {
    drawEntLisener && drawTool.removeListener(drawEntLisener); //解绑
    //裁剪线的绘制
    drawTool.active(drawTool.DrawTypes.Polyline);
    drawEntLisener = (drawEnt, positions) => {
      // 裁剪线只是临时绘制，结束回调后统一移除
      viewer.entities.remove(drawEnt);
      viewer.scene.requestRender();

      //二次切割时 rows 已被切分数据替换（无 polyGonJson 字段），
      //回退到 postDataSource.polygonJson 中保存的原始完整多边形
      const polygonJson =
        rows.value[0].polyGonJson || JSON.parse(postDataSource.polygonJson);
      const { geojson: lineJson } = changeCartesin3ToGeoJson(
        positions,
        'polyline',
      );

      //传入 多边形json 和 裁剪线 json 得到被分割的多边形们的数组
      let polygonCollection;
      try {
        polygonCollection = polygonCut(polygonJson, lineJson);
      } catch (err) {
        message.error(
          typeof err === 'string' ? err : '切割失败，请重新绘制裁剪线',
        );
        drawEntLisener && drawTool.removeListener(drawEntLisener); //解绑
        return;
      }

      //切割失败（结果只有 1 块）时直接返回，不污染 polygonJsonArr
      if (polygonCollection.features.length <= 1) {
        message.error('请切割区域！');
        drawEntLisener && drawTool.removeListener(drawEntLisener); //解绑
        return;
      }

      postDataSource.polygonJsonArr = polygonCollection.features.map((item) => {
        return JSON.stringify(item.geometry.coordinates);
      });

      //重置单元号数组，避免二次切割时旧数据残留（否则会提交 [1,2,1,2,...]）
      postDataSource.unitArr = [];

      //使用dataSource加载多边形数据
      Cesium.GeoJsonDataSource.load(polygonCollection, {
        clampToGround: true,
      }).then((info) => {
        //移除上一次的实体：首次切割移除第一步绘制的大多边形，
        //二次切割移除上次切分出的小多边形
        //注意 row.entity 是 Vue 响应式代理，需用 drawTool.removeDrawEnt 取原始引用删除
        rows.value.forEach((row) => {
          drawTool?.removeDrawEnt(row.entity);
        });

        //遍历每一个面 设置不同颜色 并更新rows数据
        let CutDatasource = [];
        info.entities.values.forEach((item, index) => {
          item.polygon.material = Cesium.Color.fromRandom({ alpha: 0.5 });
          viewer.entities.add(item);
          console.log(item);

          //用分户完的数据更新 rows
          CutDatasource.push({
            key: index,
            coord:
              polygonCollection.features[index].geometry.coordinates.toString(),
            prefix: rows.value[0].prefix,
            unit: index + 1,
            isEditing: false,
            isSave: true,
            entity: item,
          });
          postDataSource.unitArr.push(index + 1);
        });
        // 切分生成新面后主动刷新，避免 requestRenderMode 下残留上一批图形
        viewer.scene.requestRender();
        rows.value = CutDatasource;
      });

      drawEntLisener && drawTool.removeListener(drawEntLisener); //解绑
    };
    drawTool.DrawEndEvent.addEventListener(drawEntLisener);
  } else {
    drawEntLisener && drawTool.removeListener(drawEntLisener); //解绑
    drawTool.active(drawTool.DrawTypes.Point);

    drawEntLisener = (drawEnt, positions) => {
      viewer.entities.remove(drawEnt);
      viewer.scene.requestRender();

      if (positions.length !== 3) {
        message.warn('请绘制底层，分割点以及顶层位置');
        return;
      }

      isThridShow.value = true;
      isLayered.value = false;

      const PointHeight = positions.map((position) => {
        const positionLng = cartesian3ToDegreesHeight(position);
        return positionLng[2];
      });

      //从小到大 排序 防止点击顺序不是 从下往上
      PointHeight.sort((a, b) => a - b);

      postDataSource.heightArr = PointHeight;

      layerData.value.lowest = PointHeight[0];
      layerData.value.split = PointHeight[1];
      layerData.value.highest = PointHeight[2];

      drawEntLisener && drawTool.removeListener(drawEntLisener); //解绑
    };
    drawTool.DrawEndEvent.addEventListener(drawEntLisener);
  }
}

function handleSave(row) {
  row.isEditing = false;
  row.originalData = null;
  row.isSave = true;
}

function handleCancel(row) {
  if (row.isSave) {
    // 已保存的行处于"编辑"状态：取消 = 放弃对字段的修改，恢复原值、保留该行
    if (row.originalData) {
      row.prefix = row.originalData.prefix;
      row.unit = row.originalData.unit;
    }
    row.isEditing = false;
    row.originalData = null;
  } else {
    // 刚画好的新行（尚未保存）：取消 = 放弃这张图，效果与"删除"一致
    handleDelete(row);
  }
}

function handleEdit(row) {
  row.originalData = {
    prefix: row.prefix,
    unit: row.unit,
  };
  row.isEditing = true;
}

function handleDelete(row) {
  rows.value = rows.value.filter((item) => item !== row);
  // 用 drawTool 的删除几何方法：row.entity 是 Vue 响应式代理对象，
  // 直接 viewer.entities.remove 会删不掉，交由 drawTool 内部取原始引用删除
  drawTool?.removeDrawEnt(row.entity);
  // requestRenderMode 下主动请求一帧，确保删除后场景立即刷新、不留残影
  viewer?.scene.requestRender && viewer.scene.requestRender();
}

function handleLocate(row) {
  binkEntityMaterial(row.entity);
}

function handleNext() {
  //只有 有 分层数据的时候 才能下一步
  if (rows.value.length > 0) {
    if (rows.value[0].isSave) {
      if (currentStep.value < steps.length) {
        currentStep.value += 1;
      }
    } else {
      message.warn('请先保存数据');
    }
  } else {
    message.warn('请先绘制区域');
    return;
  }

  console.log(1);
}

//楼房分层
function handleLayer() {
  if (layerData.value.floors <= 0) {
    message.warn('楼层数应为正数');
    return;
  }

  postDataSource.floorNum = Number(layerData.value.floors);

  layerPrimitives.forEach((primitive) => {
    viewer.scene.primitives.remove(primitive);
  });
  layerPrimitives.length = 0;
  viewer.entities.removeAll();
  viewer.scene.requestRender();
  rows.value.forEach((row) => {
    //获取每一户的占地区域
    const { coord } = row;
    //第二步 coord: polygonCollection.features[index].geometry.coordinates.toString(),
    // 112.33,23,115.22,23  ...
    const positionArr = coord.split(',').map((item) => Number(item)); //将字符串 去除逗号 每一项转回数字 返回数组
    //此时一维数组  无法确定经纬度的分割 需要按照经纬度 隔开 分界
    const hierarchy = new Cesium.PolygonHierarchy(
      Cesium.Cartesian3.fromDegreesArray(positionArr),
    );

    //获取每一户的地板/天花板 高度
    const highest = layerData.value.highest;
    const lowest = layerData.value.lowest;
    const split = layerData.value.split;
    const floors = layerData.value.floors;
    const itemHeight = (highest - lowest) / (floors - 1);
    for (let i = 0; i < floors; i++) {
      let Height, extrudeHeight;
      //一楼大厅
      if (i == 0) {
        Height = lowest; //底部
        extrudeHeight = split; //顶部
      } else {
        Height = split + (i - 1) * itemHeight;
        extrudeHeight = Height + itemHeight;
      }
      addPrimitive(hierarchy, Height, extrudeHeight);
    }
  });
  isLayered.value = true;
}

function addPrimitive(hierarchy, height, extrudedHeight) {
  const primitive = new Cesium.ClassificationPrimitive({
    geometryInstances: new Cesium.GeometryInstance({
      geometry: new Cesium.PolygonGeometry({
        polygonHierarchy: hierarchy,
        height,
        extrudedHeight,
      }),

      attributes: {
        color: Cesium.ColorGeometryInstanceAttribute.fromColor(
          Cesium.Color.fromRandom({ alpha: 0.3 }),
        ),
      },
    }),
    classificationType: Cesium.ClassificationType.CESIUM_3D_TILE,
  });
  viewer.scene.primitives.add(primitive);
  layerPrimitives.push(primitive);
  viewer.scene.requestRender();
}

async function handleGenerate() {
  //提交前从表格行同步最新的地址前缀：
  //绘制完成时 postDataSource.name 已被固化为占位符，
  //用户后续在表格中编辑的前缀只更新了 row.prefix，需要在此处同步到提交对象
  if (rows.value.length) {
    postDataSource.name = rows.value[0].prefix;
  }

  const res = await addHouse(postDataSource);
  if (res.code === 200) {
    message.success('分户成功');
  }
}

// 组件卸载时，注销绘制事件并移除本组件产生的 entity / primitive
onUnmounted(() => {
  // 1. 注销绘制结束事件监听器
  drawEntLisener && drawTool?.removeListener(drawEntLisener);
  drawEntLisener = undefined;

  // 2. 清理绘制工具内部的事件、实体与临时 marker
  if (drawTool) {
    drawTool.unRegisterEvents();
    drawTool.removeAllDrawEnts();
    drawTool.destoryMarker();
    drawTool.drawType = undefined;
    drawTool.positions = [];
    drawTool.curPositions = [];
  }

  // 3. 移除二叉树分层产生的 primitive
  layerPrimitives.forEach((primitive) => {
    viewer?.scene.primitives.remove(primitive);
  });
  layerPrimitives.length = 0;

  // 4. 移除本组件绘制的 entity（绘制区域 / 切分后户型的实体）
  rows.value.forEach((row) => {
    if (row.entity && viewer?.entities.contains(row.entity)) {
      viewer.entities.remove(row.entity);
    }
  });
  viewer.scene.requestRender();
});
</script>

<style scoped>
.panel {
  position: fixed;
  top: 16px;
  left: 16px;
  z-index: 1000;
  transform: scale(var(--panel-scale, 1));
  transform-origin: top left;
  display: flex;
  flex-direction: column;
  width: 50vw;
  height: auto;
  margin: 0;
  border: 1px solid rgba(56, 130, 246, 0.28);
  border-radius: 14px;
  overflow: hidden;
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

/* 第一层 */
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

.exit-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  color: #7fa9d8;
  background: rgba(56, 130, 246, 0.08);
  border: 1px solid rgba(56, 130, 246, 0.2);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.18s ease;
}

.exit-btn:hover {
  color: #22d3ee;
  background: rgba(34, 211, 238, 0.12);
  border-color: rgba(34, 211, 238, 0.5);
  box-shadow: 0 0 12px rgba(34, 211, 238, 0.3);
}

/* 第二层：步骤 */
.layer-steps {
  padding-top: 20px;
  padding-bottom: 20px;
}

.steps {
  display: flex;
  align-items: center;
  gap: 0;
  margin: 0;
  padding: 0;
  list-style: none;
}

.step {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  color: #5f7a9e;
  font-size: 16px;
  font-weight: 500;
}

.step-index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  font-size: 14px;
  color: #9fb4d0;
  background: rgba(56, 130, 246, 0.1);
  border: 1px solid rgba(56, 130, 246, 0.25);
  border-radius: 50%;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.step.is-active {
  color: #38bdf8;
}

.step.is-active .step-index {
  color: #ffffff;
  background: linear-gradient(135deg, #38bdf8, #2563eb);
  border-color: transparent;
  box-shadow: 0 0 14px rgba(56, 189, 248, 0.65);
}

.step.is-done {
  color: #cfe0f5;
}

.step.is-done .step-index {
  background: rgba(34, 211, 238, 0.12);
  color: #22d3ee;
  border: 1.5px solid rgba(34, 211, 238, 0.7);
  box-shadow: 0 0 10px rgba(34, 211, 238, 0.35);
}

.step-line {
  flex: 1;
  height: 2px;
  margin: 0 16px;
  background: rgba(56, 130, 246, 0.18);
}

.step-line.is-done {
  background: linear-gradient(90deg, #22d3ee, #2563eb);
  box-shadow: 0 0 8px rgba(56, 189, 248, 0.5);
}

/* 第三层：工具 */
.layer-tools {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
}

.tools-label {
  color: #8ba6c9;
}

.tool-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 14px;
  color: #b8d0ee;
  background: rgba(56, 130, 246, 0.08);
  border: 1px solid rgba(56, 130, 246, 0.22);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.18s ease;
}

.tool-btn:hover {
  color: #22d3ee;
  background: rgba(34, 211, 238, 0.1);
  border-color: rgba(34, 211, 238, 0.45);
  box-shadow: 0 0 10px rgba(34, 211, 238, 0.25);
}

/* 第四层：表格 */
.layer-table {
  border-bottom: none;
}

.table {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid rgba(56, 130, 246, 0.2);
  border-radius: 8px;
  overflow: hidden;
  font-size: 14px;
  background: rgba(9, 17, 33, 0.4);
}

.table th,
.table td {
  padding: 12px 16px;
  text-align: center;
  border-bottom: 1px solid rgba(56, 130, 246, 0.12);
}

.table thead th {
  font-weight: 600;
  color: #a9c6ec;
  background: rgba(37, 99, 235, 0.14);
  letter-spacing: 0.3px;
}

.table tbody tr {
  transition: background 0.15s ease;
}

.table tbody tr:hover {
  background: rgba(56, 130, 246, 0.06);
}

.table tbody tr:last-child td {
  border-bottom: none;
}

.table tbody td {
  color: #d3e2f5;
}

.coord {
  color: #7fa9d8;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 180px;
}

.cell-input {
  width: 100%;
  max-width: 200px;
  padding: 8px 10px;
  font-size: 14px;
  color: #eaf2ff;
  background: rgba(9, 17, 33, 0.6);
  border: 1px solid rgba(56, 189, 248, 0.6);
  border-radius: 6px;
  outline: none;
  box-sizing: border-box;
  transition:
    box-shadow 0.15s ease,
    border-color 0.15s ease;
}

.cell-input-sm {
  max-width: 100px;
}

.cell-input:focus {
  border-color: #38bdf8;
  box-shadow:
    0 0 0 3px rgba(56, 189, 248, 0.2),
    0 0 12px rgba(56, 189, 248, 0.25);
}

.actions {
  text-align: center;
}

.link-btn {
  padding: 0;
  margin: 0 8px;
  font-size: 14px;
  color: #38bdf8;
  background: transparent;
  border: none;
  cursor: pointer;
  transition:
    color 0.15s ease,
    text-shadow 0.15s ease;
}

.link-btn:hover {
  color: #22d3ee;
  text-shadow: 0 0 8px rgba(34, 211, 238, 0.5);
}

.locate-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  color: #38bdf8;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;
}

.locate-btn:hover {
  color: #22d3ee;
  filter: drop-shadow(0 0 6px rgba(34, 211, 238, 0.6));
}

/* 第三步字段 */
.fields {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 20px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 14px;
  color: #8ba6c9;
}

.field-input {
  width: 100%;
  padding: 10px 12px;
  font-size: 14px;
  color: #eaf2ff;
  background: rgba(9, 17, 33, 0.6);
  border: 1px solid rgba(56, 130, 246, 0.3);
  border-radius: 6px;
  outline: none;
  box-sizing: border-box;
  transition:
    box-shadow 0.15s ease,
    border-color 0.15s ease;
}

.field-input:focus {
  border-color: #38bdf8;
  box-shadow:
    0 0 0 3px rgba(56, 189, 248, 0.2),
    0 0 12px rgba(56, 189, 248, 0.25);
}

.field-input:disabled {
  color: #5f7a9e;
  background: rgba(9, 17, 33, 0.3);
  border-color: rgba(56, 130, 246, 0.14);
  cursor: not-allowed;
}

.table-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
}

.ghost-btn {
  padding: 10px 24px;
  font-size: 14px;
  color: #b8d0ee;
  background: rgba(56, 130, 246, 0.08);
  border: 1px solid rgba(56, 130, 246, 0.35);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.18s ease;
}

.ghost-btn:hover {
  color: #22d3ee;
  background: rgba(34, 211, 238, 0.1);
  border-color: rgba(34, 211, 238, 0.5);
  box-shadow: 0 0 12px rgba(34, 211, 238, 0.25);
}

.next-btn {
  padding: 10px 28px;
  font-size: 14px;
  font-weight: 500;
  color: #ffffff;
  background: linear-gradient(135deg, #38bdf8, #2563eb);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(37, 99, 235, 0.45);
  transition: all 0.18s ease;
}

.next-btn:hover {
  box-shadow: 0 6px 22px rgba(56, 189, 248, 0.6);
  transform: translateY(-1px);
}

.next-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 10px rgba(37, 99, 235, 0.5);
}
</style>
