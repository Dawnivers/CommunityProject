import * as Cesium from 'cesium';

/**
 * 限制 Cesium 相机：缩放高度范围 + 水平平移范围
 * @param {Cesium.Viewer} viewer          Cesium Viewer 实例
 * @param {Cesium.Rectangle} rectangle    允许相机水平移动的经纬度矩形
 * @param {object} options                可选 { minHeight, maxHeight, padding }
 *   - minHeight  最近缩放高度(米)，防止贴地
 *   - maxHeight  最远缩放高度(米)，防止拉太远
 *   - padding    边界缓冲(度，默认 0)，紧贴边界留一点余量防抖动
 */
export function setCameraLimits(viewer, rectangle, options = {}) {
  const { minHeight = 500, maxHeight = 20000, padding = 0.0 } = options;

  // 取出边界经纬度
  const west = Cesium.Math.toDegrees(rectangle.west);
  const east = Cesium.Math.toDegrees(rectangle.east);
  const south = Cesium.Math.toDegrees(rectangle.south);
  const north = Cesium.Math.toDegrees(rectangle.north);

  // ---------- 1. 限制缩放高度 ----------
  const controller = viewer.scene.screenSpaceCameraController;
  controller.minimumZoomDistance = minHeight;
  controller.maximumZoomDistance = maxHeight;

  // ---------- 2. 限制水平平移范围（每帧钳制） ----------
  // 注意：不能用 camera.moved（鼠标松开后才触发），必须用 scene.preRender 每帧钳制，
  // 拖拽过程中才会持续生效，无法拖出范围。
  let isClamping = false; // 防止钳制内部再次触发造成抖动
  const onPreRender = () => {
    if (isClamping) return;

    const carto = Cesium.Cartographic.fromCartesian(viewer.camera.positionWC);
    let lon = Cesium.Math.toDegrees(carto.longitude);
    let lat = Cesium.Math.toDegrees(carto.latitude);

    let clamped = false;
    if (lon < west + padding) {
      lon = west + padding;
      clamped = true;
    }
    if (lon > east - padding) {
      lon = east - padding;
      clamped = true;
    }
    if (lat < south + padding) {
      lat = south + padding;
      clamped = true;
    }
    if (lat > north - padding) {
      lat = north - padding;
      clamped = true;
    }

    if (clamped) {
      isClamping = true;
      // 直接赋值相机位置(轻量、不重推朝向)，临时关闭控制器避免本帧内被反推
      viewer.scene.screenSpaceCameraController.enabled = false;
      viewer.camera.position = Cesium.Cartesian3.fromDegrees(
        lon,
        lat,
        carto.height,
      );
      viewer.scene.screenSpaceCameraController.enabled = true;
      isClamping = false;
    }
  };
  viewer.scene.preRender.addEventListener(onPreRender);
}

/**
 * 便捷封装：以某个中心点为中心，四周各留 halfLon/halfLat 的可移动范围
 * @param {Cesium.Viewer} viewer   Viewer 实例
 * @param {number} centerLon       中心经度
 * @param {number} centerLat       中心纬度
 * @param {object} opts            可选 { halfLon, halfLat, minHeight, maxHeight, padding }
 */
export function limitCameraToCenter(viewer, centerLon, centerLat, opts = {}) {
  const {
    halfLon = 0.01, // 经度半宽(度) ≈ 0.01 度约 1km 左右
    halfLat = 0.01, // 纬度半宽(度)
    minHeight = 500,
    maxHeight = 20000,
    padding = 0.0,
  } = opts;

  const rect = Cesium.Rectangle.fromDegrees(
    centerLon - halfLon, // 西
    centerLat - halfLat, // 南
    centerLon + halfLon, // 东
    centerLat + halfLat, // 北
  );

  setCameraLimits(viewer, rect, { minHeight, maxHeight, padding });
}
