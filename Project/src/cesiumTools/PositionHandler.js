/*
 * @Description: cesium坐标转换工具
 * @Author: your name
 * @version:
 * @Date: 2024-11-28 10:06:49
 * @LastEditors: your name
 * @LastEditTime: 2024-12-02 17:40:44
 */
import * as Cesium from "cesium";


class PositionTransfer {
  /**
   * 坐标转换工具
   * @param {Cesium.Viewer} viewer : viewer程序对象
   */
  constructor(viewer) {
    this.viewer = viewer;
  }

  /**
   * 笛卡尔转经纬度
   * @param {Cesium.Cartesian3} position : 笛卡尔三阶坐标
   */
  cartesian3ToLng(position) {
    // 获取当前椭球的坐标系统，其中包含了坐标转换工具
    const ellipsoid = this.viewer.scene.globe.ellipsoid;
    // 笛卡尔坐标转为弧度坐标
    const cartoGraphic = ellipsoid.cartesianToCartographic(position);
    // 将弧度坐标转为经纬度
    const lng = Cesium.Math.toDegrees(cartoGraphic.longitude);
    const lat = Cesium.Math.toDegrees(cartoGraphic.latitude);
    const height = cartoGraphic.height;
    return {
      lng,
      lat,
      height,
    };
  }

  /**
   * 笛卡尔转经纬度(方式2)
   * @param {Cesium.Cartesian3} position : 笛卡尔三阶坐标
   */
  cartesian3ToDegreesHeight(position) {
    let c = Cesium.Cartographic.fromCartesian(position);
    return [
      Cesium.Math.toDegrees(c.longitude),
      Cesium.Math.toDegrees(c.latitude),
      c.height,
    ];
  }

  /**
   * 根据笛卡尔获取位置高度
   * @param {Cesium.Cartesian3} position : 笛卡尔三阶坐标
   */
  getPositionHeight(position) {
    const cartographic = Cesium.Cartographic.fromCartesian(position);
    return cartographic.height;
  }

  getCirclePoint(lon, lat, angle, radius) {
    let dx = radius * Math.sin((angle * Math.PI) / 180.0);
    let dy = radius * Math.cos((angle * Math.PI) / 180.0);
    let ec = 6356725 + ((6378137 - 6356725) * (90.0 - lat)) / 90.0;
    let ed = ec * Math.cos((lat * Math.PI) / 180);
    let newLon = ((dx / ed + (lon * Math.PI) / 180.0) * 180.0) / Math.PI;
    let newLat = ((dy / ec + (lat * Math.PI) / 180.0) * 180.0) / Math.PI;
    return [newLon, newLat];
  }

  /**
   * 获取圆的边缘坐标
   * @param {Cesium.Cartesian3} center : 笛卡尔三阶坐标
   * @param {Number} radius : 半径
   */
  generateCirclePoints(center, radius) {
    let points = [];
    for (let i = 0; i < 360; i += 2) {
      points.push(this.getCirclePoint(center[0], center[1], i, radius));
    }
    return points;
  }

  /**
   * 经纬度转笛卡尔
   * @param {Object} position : 经纬度 {lng,lat,height}
   */
  lngToCartesian3(position) {
    const { lng, lat, height } = position;
    return new Cesium.Cartesian3.fromDegrees(lng, lat, height);
  }

  /**
   * 经纬度转笛卡尔(批量)
   * @param {Array<{lng,lat,height}>|Array<{lng,lat}>} positions : 经纬度坐标数组
   * @param {Boolean} isHeight 是否包含了高度
   */
  lngPositionsToCartesian3(positions, isHeight = false) {
    const resArr = [];
    if (Array.isArray(positions)) {
      positions.forEach((position) => {
        const { lng, lat, height } = position;
        if (isHeight) {
          resArr.push(lng, lat, height);
        } else {
          resArr.push(lng, lat);
        }
      });
      // 根据是否带高度，返回对应的数据
      return isHeight
        ? new Cesium.Cartesian3.fromDegreesArrayHeights(resArr)
        : new Cesium.Cartesian3.fromDegreesArray(resArr);
    }
  }

  /**
   * 屏幕坐标和笛卡尔坐标转换
   * @param {Cesium.Cartesian2} position : 屏幕坐标，笛卡尔2阶数据
   */
  screenPositionToCartesian3(position) {
    return this.viewer.scene.globe.pick(
      this.viewer.camera.getPickRay(position),
      this.viewer.scene
    );
  }

  /**
   * 世界坐标转屏幕坐标
   * @param {Cesium.Cartesian3} position : 世界坐标
   */
  cartesian3ToScreenPosition(position) {
    return Cesium.SceneTransforms.wgs84ToWindowCoordinates(
      this.viewer.scene,
      position
    );
  }

  // todo:世界坐标转为带地形高度的经纬度
}

export default PositionTransfer;
