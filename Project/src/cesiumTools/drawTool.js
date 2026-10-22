/*
 * @Description:
 * @Author: your name
 * @version:
 * @Date: 2024-03-05 14:46:14
 * @LastEditors: your name
 * @LastEditTime: 2025-01-24 16:38:40
 */
import * as Cesium from 'cesium';
import PositionHandler from './PositionHandler';

class DrawTool {
  /**
   * 绘制工具
   * @param {Cesium.Viewer} viewer : viewer程序对象
   */
  constructor(viewer, options = {}) {
    this.viewer = viewer;
    // 开启深度检测
    //this.viewer.scene.globe.depthTestAgainstTerrain = true;
    viewer.scene.globe.depthTestAgainstTerrain = true;
    // 允许 pickPosition 获取半透明切分面（第二步实体）的深度。
    viewer.scene.pickTranslucentDepth = true;

    // 设置线性深度
    // viewer.scene.logarithmicDepthBuffer = false;  // 禁用对数深度缓冲
    // viewer.scene.globe.linearDepth = true;        // 启用线性深度
    this.positionTool = new PositionHandler(viewer);
    // 默认按照贴地模式绘制图元
    this.drawMode = Cesium.defaultValue(
      options.drawMode,
      this.DrawModes.ClampToGround,
    );
    // 初始化handler,events
    this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
    this.DrawEndEvent = new Cesium.Event(); //结束绘制事件
  }

  // 绘制模式，支持贴地和固定高度
  DrawModes = {
    ClampToGround: 'clampToGround',
    None: 'none',
  };

  DrawTypes = {
    Polyline: 'Polyline',
    Rect: 'Rect',
    Point: 'Point',
    Circle: 'Circle',
    Polygon: 'Polygon',
  };

  // 激活工具，传入DrawType
  active(drawType) {
    // 重新开始绘制前，清理上一次未完成的绘制状态和提示
    if (this.drawEntity || this.marker) {
      this.unRegisterEvents();
      this.removeAllDrawEnts();
      this.destoryMarker();
      this.drawEntity = undefined;
    }
    // 如果在我们的绘制工具集合中，存在这个工具
    if (Object.keys(this.DrawTypes).includes(drawType)) {
      this.drawType = drawType;
      // 最终的坐标
      this.positions = [];
      // 绘制过程中的坐标
      this.curPositions = [];
      //   每次点击有一个标点，需要存储实体
      this.points = [];
      // 注册鼠标事件
      this.registerEvents();

      //设置鼠标状态
      this.viewer.enableCursorStyle = false;
      this.viewer._element.style.cursor = 'default';
      this.createMarker(drawType);
    } else {
      return;
    }
  }

  createMarker(drawType) {
    this.marker = document.createElement('div');
    this.marker.innerHTML = `左键点击绘制${drawType},右键结束绘制`;
    this.marker.className = 'marker-draw';
    this.viewer.cesiumWidget.container.appendChild(this.marker);
  }

  destoryMarker() {
    this.marker && this.viewer.cesiumWidget.container.removeChild(this.marker);
    this.marker = null;
  }

  registerEvents() {
    // 分别注册左键画点，右键结束画点，鼠标移动事件
    this.leftClickEvent();
    this.rightClickEvent();
    this.mouseMoveEvent();
  }

  /**
   * 屏幕坐标转笛卡尔，分别从模型，地形，地球表面进行讨论
   *
   * @param {Cesium.Cartesian2} px 屏幕坐标
   *
   * @return {Cesium.Cartesian3} Cartesian3 三维坐标
   */
  getcartesian3FromScreen(px) {
    if (this.viewer && px) {
      // 使用pick获取当前射线穿透的第一个物体
      const pick = this.viewer.scene.pick(px);
      let isOn3dtiles = false;
      let isOnTerrain = false;
      // 最终得到的笛卡尔坐标
      let cartesianRes = null;
      if (pick && pick.primitive && pick.primitive.isCesium3DTileset) {
        isOn3dtiles = true;
      }

      // Entity（例如第二步切分出的多边形）没有 primitive 属性，
      // 但仍然可以从渲染深度中取得它表面的坐标。
      if (pick && this.viewer.scene.pickPositionSupported) {
        cartesianRes = this.viewer.scene.pickPosition(px);
      }
      // 判断是否加载了地形
      let boolTerrain =
        this.viewer.terrainProvider instanceof Cesium.EllipsoidTerrainProvider;
      // 如果没有点击到模型，并且加载了地形的话,走地形碰撞逻辑
      if (!cartesianRes && !isOn3dtiles && !boolTerrain) {
        const ray = this.viewer.scene.camera.getPickRay(px);
        if (!ray) return null;
        cartesianRes = this.viewer.scene.globe.pick(ray, this.viewer.scene);
        isOnTerrain = true;
      }
      // 如果没有加载地形，也没有3dtiles,就是拾取到地球上的坐标
      if (!cartesianRes && !isOn3dtiles && !isOnTerrain && boolTerrain) {
        cartesianRes = this.viewer.scene.camera.pickEllipsoid(
          px,
          this.viewer.scene.globe.ellipsoid,
        );
      }
      // 3dtiles
      if (!cartesianRes && isOn3dtiles) {
        cartesianRes = this.viewer.scene.pickPosition(px);
      }

      // 如果有笛卡尔坐标，避免笛卡尔坐标的高度小于0
      if (cartesianRes) {
        let position =
          this.positionTool.cartesian3ToDegreesHeight(cartesianRes);
        // 可以将坐标高度设置为>=0
        // if(position[2]<0){

        // }
        return cartesianRes;
      }
      return false;
    }
  }

  leftClickEvent() {
    // 单机鼠标左键画点
    this.handler.setInputAction((e) => {
      // 屏幕坐标转为笛卡尔坐标，分三种情况
      let position = this.getcartesian3FromScreen(e.position);
      if (!position) return;
      this.positions.push(position);
      this.curPositions.push(position);
      // 如果是第一个点，就开始根据drawType，绘制图案
      if (this.positions.length === 1) {
        this.startDraw();
        this.setClamp();
      }
      //  如果是画线或者画点，每次点击左键，都在同一位置画一个点，绘制线的端点
      if (
        this.drawType === this.DrawTypes.Polyline ||
        this.drawType === this.DrawTypes.Point
      ) {
        this.generatePoint(position);
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  }

  //   鼠标移动事件
  mouseMoveEvent() {
    this.handler.setInputAction((e) => {
      this.marker.style.left = e.endPosition.x + 20 + 'px';
      this.marker.style.top = e.endPosition.y - 20 + 'px';
      this.viewer._element.style.cursor = 'default'; //由于鼠标移动时 Cesium会默认将鼠标样式修改为手柄 所以移动时手动设置回来
      let position = this.getcartesian3FromScreen(e.endPosition);
      if (!position || !this.drawEntity) return;
      // tempPositions是每次鼠标移动时，我们得到的坐标,this.position是我们左键点击才能得到的坐标
      this.curPositions = [...this.positions, position];
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
  }

  //   右键点击，结束绘制
  rightClickEvent() {
    this.handler.setInputAction(() => {
      // 如果还没有开始绘制，直接结束绘制状态（不提交残缺数据）
      if (!this.drawEntity) {
        this.deactive(false);
        return;
      }
      // 如果当前的坐标数量少于最小数量，直接结束（不提交残缺数据）
      if (this.positions.length < this.minPositionCount) {
        this.deactive(false);
        return;
      }
      // 根据各种绘制类型，要重新给坐标赋值，吧callback变为constant
      switch (this.drawType) {
        case this.DrawTypes.Polyline:
          this.drawEntity.polyline.positions = this.positions;
          break;
        case this.DrawTypes.Rect:
          this.drawEntity.polygon.hierarchy = new Cesium.PolygonHierarchy(
            this.getRectFourPoints(),
          );
          this.drawEntity.polyline.positions = this.getRectFourPoints();
          this.positions = this.getRectFourPoints();
          this.positions.pop();
          break;
        case this.DrawTypes.Circle:
          this.drawEntity.ellipse.semiMinorAxis = this.getAxis();
          this.drawEntity.ellipse.semiMajorAxis = this.getAxis();
          this.minPositionCount = 2;
          break;
        case this.DrawTypes.Polygon:
          this.drawEntity.polygon.hierarchy = new Cesium.PolygonHierarchy(
            this.positions.concat(this.positions[0]),
          );
          this.drawEntity.polyline.positions = this.positions.concat(
            this.positions[0],
          );
          break;
        default:
          break;
      }
      this.deactive();
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
  }

  startDraw() {
    switch (this.drawType) {
      case this.DrawTypes.Point:
        // 对于点，直接结束绘制就完事了
        this.drawEntity = this.generatePoint(this.positions[0]);
        // 记录最小构成几何体的坐标数量,point:1,polyline:2,rect:2,circle:2,polygon:3
        this.minPositionCount = 1;
        break;
      case this.DrawTypes.Polyline:
        this.generatePolyline();
        this.minPositionCount = 2;
        break;
      case this.DrawTypes.Rect:
        this.generateRect();
        this.minPositionCount = 2;
        break;
      case this.DrawTypes.Circle:
        this.generateCircle();
        this.minPositionCount = 2;
        break;
      case this.DrawTypes.Polygon:
        this.generatePolygon();
        this.minPositionCount = 3;
      default:
        break;
    }
  }
  // 绘制点
  generatePoint(position) {
    const cartographic = Cesium.Cartographic.fromCartesian(position);
    const point = this.viewer.entities.add({
      Type: this.DrawTypes.Point,
      position: position,
      point: {
        pixelSize: 14,
        color: Cesium.Color.RED,
      },
    });
    this.points.push(point);
    return point;
  }

  //   绘制线,position使用callbackProperty
  generatePolyline() {
    this.drawEntity = this.viewer.entities.add({
      Type: this.DrawTypes.Polyline,
      polyline: {
        positions: new Cesium.CallbackProperty((e) => {
          return this.isValidPosition(this.curPositions);
        }, false),
        width: 2,
        material: new Cesium.PolylineDashMaterialProperty({
          color: Cesium.Color.YELLOW,
        }),
      },
    });
  }

  isValidPosition(boundary) {
    // 判断所有点是否都一样
    if (
      Array.isArray(boundary) &&
      boundary.length > 1 &&
      boundary.every(
        (p) =>
          p.x === boundary[0].x &&
          p.y === boundary[0].y &&
          p.z === boundary[0].z,
      )
    ) {
      return [];
    } else {
      return boundary;
    }
  }

  //   绘制矩形，由polygon和polyline组成
  generateRect() {
    this.drawEntity = this.viewer.entities.add({
      Type: this.DrawTypes.Rect,
      polygon: {
        hierarchy: new Cesium.CallbackProperty((e) => {
          const boundary = this.isValidPosition(this.getRectFourPoints());
          return new Cesium.PolygonHierarchy(boundary);
        }, false),
        material: Cesium.Color.RED.withAlpha(0.6),
      },
      polyline: {
        positions: new Cesium.CallbackProperty((e) => {
          return this.isValidPosition(this.getRectFourPoints());
        }, false),
        width: 1,
        material: new Cesium.PolylineDashMaterialProperty({
          color: Cesium.Color.YELLOW,
        }),
        depthFailMaterial: new Cesium.PolylineDashMaterialProperty({
          color: Cesium.Color.YELLOW,
        }),
      },
    });
  }

  // 绘制多边形
  generatePolygon() {
    this.drawEntity = this.viewer.entities.add({
      Type: this.DrawTypes.Polygon,
      polygon: {
        // 多边形坐标有首位闭合的特点
        hierarchy: new Cesium.CallbackProperty((e) => {
          const boundary = this.isValidPosition(
            this.curPositions.concat(this.curPositions[0]),
          );
          return new Cesium.PolygonHierarchy(boundary);
        }, false),
        material: Cesium.Color.RED.withAlpha(0.6),
      },
      polyline: {
        positions: new Cesium.CallbackProperty((e) => {
          const boundary = this.isValidPosition(
            this.curPositions.concat(this.curPositions[0]),
          );
          return boundary;
        }, false),
        width: 1,
        material: new Cesium.PolylineDashMaterialProperty({
          color: Cesium.Color.YELLOW,
        }),
        depthFailMaterial: new Cesium.PolylineDashMaterialProperty({
          color: Cesium.Color.YELLOW,
        }),
      },
    });
  }

  // 绘制圆
  generateCircle() {
    this.drawEntity = this.viewer.entities.add({
      position: this.positions[0],
      ellipse: {
        height: this.positionTool.getPositionHeight(this.positions[0]),
        semiMinorAxis: new Cesium.CallbackProperty((e) => {
          return this.getAxis();
        }, false),
        semiMajorAxis: new Cesium.CallbackProperty((e) => {
          return this.getAxis();
        }, false),
        material: Cesium.Color.RED.withAlpha(0.6),
      },
    });
  }

  setClamp() {
    // 设置贴地
    if (this.drawMode === 'clampToGround') {
      if (this.drawEntity.ellipse) {
        this.drawEntity.ellipse.classificationType =
          Cesium.ClassificationType.BOTH;
      }
      if (this.drawEntity.polygon) {
        this.drawEntity.polygon.classificationType =
          Cesium.ClassificationType.BOTH;
        this.drawEntity.polygon.perPositionHeight = false;
      }
      if (this.drawEntity.polyline) {
        this.drawEntity.polyline.classificationType =
          Cesium.ClassificationType.BOTH;
        this.drawEntity.polyline.clampToGround = true;
      }
    } else {
      if (this.drawEntity.ellipse) {
        this.drawEntity.ellipse.height = this.positionTool.getPositionHeight(
          this.positions[0],
        );
      }
      if (this.drawEntity.polygon) {
        this.drawEntity.polygon.classificationType = undefined;
        this.drawEntity.polygon.perPositionHeight = true;
      }
      if (this.drawEntity.polyline) {
        this.drawEntity.polyline.classificationType = undefined;
        this.drawEntity.polyline.clampToGround = false;
      }
    }
  }

  // 获取矩形四个点
  getRectFourPoints() {
    let res = this.curPositions;
    if (this.curPositions.length > 1) {
      let p1 = this.curPositions[0];
      let p2 = this.curPositions[1];

      let c1 = Cesium.Cartographic.fromCartesian(p1);
      let c2 = Cesium.Cartographic.fromCartesian(p2);
      if (c1.height < 0) c1.height = 0;
      if (c2.height < 0) c2.height = 0;
      let lls = this.getRectanglePointsByTwoPoint(c1, c2);

      // 坐标数组转为指定格式
      let ars = [
        lls[0][0],
        lls[0][1],
        c1.height,
        lls[1][0],
        lls[1][1],
        c1.height,
        lls[2][0],
        lls[2][1],
        c1.height,
        lls[3][0],
        lls[3][1],
        c1.height,
        lls[0][0],
        lls[0][1],
        c1.height,
      ];
      res = Cesium.Cartesian3.fromDegreesArrayHeights(ars);
    }
    return res;
  }

  //   获取矩形四个点
  getRectanglePointsByTwoPoint(c1, c2) {
    //转为经纬度
    let lngLat1 = [
      Cesium.Math.toDegrees(c1.longitude),
      Cesium.Math.toDegrees(c1.latitude),
    ];
    let lngLat2 = [
      Cesium.Math.toDegrees(c2.longitude),
      Cesium.Math.toDegrees(c2.latitude),
    ];

    let lngLat3 = [
      Cesium.Math.toDegrees(c1.longitude),
      Cesium.Math.toDegrees(c2.latitude),
    ];
    let lngLat4 = [
      Cesium.Math.toDegrees(c2.longitude),
      Cesium.Math.toDegrees(c1.latitude),
    ];

    return [lngLat1, lngLat3, lngLat2, lngLat4];
  }

  //圆半径
  getAxis() {
    if (this.curPositions.length > 1) {
      let p1 = this.curPositions[0];
      let p2 = this.curPositions[this.curPositions.length - 1];
      const axis = Cesium.Cartesian3.distance(p1, p2);
      return axis;
    } else {
      return 0;
    }
  }

  // 结束绘制
  // isComplete：是否为完整绘制结束。提前结束（点数不足）时传 false，
  // 此时不提交 DrawEndEvent（避免把残缺坐标抛给业务回调），并清理残缺实体
  deactive(isComplete = true) {
    // 对于圆，根据半径计算边缘点坐标并返回
    let points = [];
    if (isComplete && this.drawType === this.DrawTypes.Circle) {
      const radius = this.getAxis();
      const positions = this.positionTool.cartesian3ToDegreesHeight(
        this.positions[0],
      );
      points = this.positionTool.generateCirclePoints(positions, radius);
      points = points.map((item) => {
        const height = this.positionTool.getPositionHeight(this.positions[0]);
        return Cesium.Cartesian3.fromDegrees(item[0], item[1], height);
      });
    }

    if (isComplete) {
      // 提交绘制结束事件
      this.DrawEndEvent.raiseEvent(
        this.drawEntity,
        this.positions,
        this.drawType,
        points,
      );
    } else {
      // 清理残缺的绘制实体，避免半成品多边形/线残留在场景中
      this.removeAllDrawEnts();
    }
    // 端点是独立实体，结束绘制后也要一并清理
    this.points.forEach((point) => {
      this.viewer.entities.remove(point);
    });
    this.points = [];
    this.unRegisterEvents();
    this.destoryMarker();
    this.drawType = undefined;
    this.drawEntity = undefined;
    this.positions = [];
    this.curPositions = [];
    this.viewer._element.style.cursor = 'pointer';
    this.viewer.enableCursorStyle = true;
  }

  //解除鼠标事件
  unRegisterEvents() {
    this.handler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK);
    this.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
    this.handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    this.handler.removeInputAction(
      Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK,
    );
  }

  //   清除绘制的实体
  removeAllDrawEnts() {
    this.points &&
      this.points.forEach((point) => {
        this.viewer.entities.remove(point);
      });
    this.drawEntity && this.viewer.entities.remove(this.drawEntity);
    this.points = [];
    this.drawEntity = null;
  }

  // 删除业务方保存的某个绘制实体
  // 注意：rows 是 Vue 响应式数组，row.entity 会被深度代理成 Proxy，
  // 直接传给 viewer.entities.remove 会因引用不匹配而删除失败。
  // 此方法先取出原始引用再移除，同时兼容未代理的原始实体。
  removeDrawEnt(entity) {
    if (!entity) return;
    const raw = entity.__v_raw || entity; // 兼容 Vue 响应式代理
    this.viewer.entities.remove(raw);
  }

  removeListener(event) {
    this.DrawEndEvent &&
      this.DrawEndEvent.numberOfListeners &&
      this.DrawEndEvent.removeEventListener(event);
  }
}

export default DrawTool;
