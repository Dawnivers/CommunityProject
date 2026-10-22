/*
 * @Description:
 * @Author: your name
 * @version:
 * @Date: 2024-06-27 15:33:20
 * @LastEditors: your name
 * @LastEditTime: 2024-06-27 15:33:22
 */
/*
 * @Description:
 * @Author: your name
 * @version:
 * @Date: 2024-02-29 13:24:23
 * @LastEditors: your name
 * @LastEditTime: 2024-06-25 14:55:37
 */

import * as turf from '@turf/turf';
import * as Cesium from 'cesium';
import _ from 'lodash';

//获取唯一码 时间不可能重复
export function getPlotCode() {
  const date = new Date();
  let code = date.getFullYear() + '';
  code += date.getMonth() + 1;
  code += date.getDate();
  code += date.getHours();
  code += date.getMinutes();
  code += date.getSeconds();
  code += date.getMilliseconds();
  return code;
}

export function unifiedHeight(positions, height) {
  if (!height) height = getPositionHeight(positions[0]); //如果没有指定高度 就用第一个的高度
  let point3d;
  for (let i = 0; i < positions.length; i++) {
    const element = positions[i];
    point3d = cartesian3ToPoint3D(element);
    positions[i] = Cesium.Cartesian3.fromDegrees(point3d.x, point3d.y, height);
  }
  return height;
}

export function getPositionHeight(position) {
  const cartographic = Cesium.Cartographic.fromCartesian(position);
  return cartographic.height;
}

//二维点转三维点
export function point2dToPoint3d(viewer, point2ds) {
  let point3ds = [];
  for (let i = 0; i < point2ds.length; i++) {
    const item = point2ds[i];
    const cartesian3 = Cesium.Cartesian3.fromDegrees(item[0], item[1], 0); //没有高度的笛卡尔坐标对象
    const c = viewer.scene.clampToHeight(cartesian3);
    point3ds.push(c);
  }
  return point3ds;
}

//笛卡尔坐标转为 经纬度xyz
export function cartesian3ToPoint3D(position) {
  const cartographic = Cesium.Cartographic.fromCartesian(position);
  const lon = Cesium.Math.toDegrees(cartographic.longitude);
  const lat = Cesium.Math.toDegrees(cartographic.latitude);
  return {
    x: lon,
    y: lat,
    z: cartographic.height > 0 ? cartographic.height : 0,
  };
}

export function midPosition(first, second) {
  if (!first || !second) return null;
  let point3d1 = cartesian3ToPoint3D(first);
  let point3d2 = cartesian3ToPoint3D(second);
  let midLonLat = {
    x: (point3d1.x + point3d2.x) / 2,
    y: (point3d1.y + point3d2.y) / 2,
    z: (point3d1.z + point3d2.z) / 2,
  };
  return Cesium.Cartesian3.fromDegrees(midLonLat.x, midLonLat.y, midLonLat.z);
}

//  笛卡尔坐标转为经纬度[x,y]
export function cartesian3ToLonLat(position) {
  const cartographic = Cesium.Cartographic.fromCartesian(position);
  const lon = Cesium.Math.toDegrees(cartographic.longitude);
  const lat = Cesium.Math.toDegrees(cartographic.latitude);
  return [lon, lat];
}

export function get2PositionDistance(p1, p2) {
  let lngLat1 = cartesian3ToLonLat(p1);
  let lngLat2 = cartesian3ToLonLat(p2);
  return distance(lngLat1, lngLat2);
}

//计算两个点的距离
export function distance(lngLat1, lngLat2) {
  let radLat1 = (lngLat1[1] * Math.PI) / 180.0;
  let radLat2 = (lngLat2[1] * Math.PI) / 180.0;
  let a = radLat1 - radLat2;
  let b = (lngLat1[0] * Math.PI) / 180.0 - (lngLat2[0] * Math.PI) / 180.0;
  let s =
    2 *
    Math.asin(
      Math.sqrt(
        Math.pow(Math.sin(a / 2), 2) +
          Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(b / 2), 2),
      ),
    );
  s = s * 6378.137;
  s = Math.round(s * 10000) / 10;
  return s;
}

//判断笛卡尔坐标串是否为顺时针
export function booleanClockwise(positions) {
  let degreesArrary = [];
  positions.map((position) => {
    degreesArrary.push(cartesian3ToDegrees(position));
  });
  //首尾闭合
  degreesArrary.push(degreesArrary[0]);
  let lineString = turf.lineString(degreesArrary);
  return turf.booleanClockwise(lineString);
}

//笛卡尔坐标转为经纬度
export function cartesian3ToDegrees(position) {
  let c = Cesium.Cartographic.fromCartesian(position);
  return [
    Cesium.Math.toDegrees(c.longitude),
    Cesium.Math.toDegrees(c.latitude),
  ];
}

//根据坐标串获取ClippingPlanes 传入的坐标必须为逆时针顺序
export function getClippingPlanes(positions) {
  let pLength = positions.length;
  let clippingPlanes = []; // 存储ClippingPlane集合
  for (let i = 0; i < pLength; ++i) {
    let nextIndex = (i + 1) % pLength;
    let midpoint = Cesium.Cartesian3.add(
      positions[i],
      positions[nextIndex],
      new Cesium.Cartesian3(),
    );
    midpoint = Cesium.Cartesian3.multiplyByScalar(midpoint, 0.5, midpoint);

    let up = Cesium.Cartesian3.normalize(midpoint, new Cesium.Cartesian3());
    let right = Cesium.Cartesian3.subtract(
      positions[nextIndex],
      midpoint,
      new Cesium.Cartesian3(),
    );
    right = Cesium.Cartesian3.normalize(right, right);

    let normal = Cesium.Cartesian3.cross(right, up, new Cesium.Cartesian3());
    normal = Cesium.Cartesian3.normalize(normal, normal);

    let originCenteredPlane = new Cesium.Plane(normal, 0.0);
    let distance = Cesium.Plane.getPointDistance(originCenteredPlane, midpoint);
    clippingPlanes.push(new Cesium.ClippingPlane(normal, distance));
  }
  return clippingPlanes;
}

//获取所有点中的最低高度
export function getMinHeight(positions) {
  let minHeight = 1000000;
  let degreesHeight;
  positions.map((position) => {
    degreesHeight = cartesian3ToDegreesHeight(position);
    if (minHeight > degreesHeight[2]) {
      minHeight = degreesHeight[2];
    }
  });
  return minHeight;
}

//笛卡尔坐标转为经纬度
export function cartesian3ToDegreesHeight(position) {
  let c = Cesium.Cartographic.fromCartesian(position);
  return [
    Cesium.Math.toDegrees(c.longitude),
    Cesium.Math.toDegrees(c.latitude),
    c.height,
  ];
}

// 工具函数
// 更新3dtiles的模型矩阵
export const update3dtilesMaxtrix = (params, tileset) => {
  //根据经纬度控制模型的位置
  let position = Cesium.Cartesian3.fromDegrees(params.tx, params.ty, params.tz);
  let m = Cesium.Transforms.eastNorthUpToFixedFrame(position);
  console.log(m);
  //旋转
  //  根据角度，获取到3阶旋转矩阵
  let mx = Cesium.Matrix3.fromRotationX(Cesium.Math.toRadians(params.rx));
  let my = Cesium.Matrix3.fromRotationY(Cesium.Math.toRadians(params.ry));
  let mz = Cesium.Matrix3.fromRotationZ(Cesium.Math.toRadians(params.rz));
  //   根据3阶旋转矩阵，获取到4阶旋转矩阵
  let rotationX = Cesium.Matrix4.fromRotationTranslation(mx);
  let rotationY = Cesium.Matrix4.fromRotationTranslation(my);
  let rotationZ = Cesium.Matrix4.fromRotationTranslation(mz);

  //   构造缩放矩阵
  const _scale = Cesium.Matrix4.fromUniformScale(params.scale);

  //旋转、平移矩阵相乘
  Cesium.Matrix4.multiply(m, rotationX, m);
  Cesium.Matrix4.multiply(m, rotationY, m);
  Cesium.Matrix4.multiply(m, rotationZ, m);
  Cesium.Matrix4.multiply(m, _scale, m);
  //赋值给tileset
  tileset._root.transform = m;
  console.log(tileset.modelMatrix);
};

export const loadTilesets = async (viewer) => {
  // 加载3dtiles数据
  const url = 'http://localhost:8888/AGI_HQ/tileset.json';

  const postion = Cesium.Cartesian3.fromDegrees(114.27, 30.58, 0);
  console.log(postion);
  const modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(postion);

  const tile = new Cesium.Cesium3DTileset({
    url,
    modelMatrix: modelMatrix,
  });

  viewer.scene.primitives.add(tile);
  viewer.zoomTo(tile);
  return tile;
};

//获取一个圆的边缘坐标
export const generateCirclePoints = (center, radius) => {
  let points = [];
  for (let i = 0; i < 360; i += 2) {
    points.push(getCirclePoint(center[0], center[1], i, radius));
  }
  return points;
};

const getCirclePoint = (lon, lat, angle, radius) => {
  let dx = radius * Math.sin((angle * Math.PI) / 180.0);
  let dy = radius * Math.cos((angle * Math.PI) / 180.0);
  let ec = 6356725 + ((6378137 - 6356725) * (90.0 - lat)) / 90.0;
  let ed = ec * Math.cos((lat * Math.PI) / 180);
  let newLon = ((dx / ed + (lon * Math.PI) / 180.0) * 180.0) / Math.PI;
  let newLat = ((dy / ec + (lat * Math.PI) / 180.0) * 180.0) / Math.PI;
  return [newLon, newLat];
};

// 笛卡尔坐标转turf geojson
export const changeCartesin3ToGeoJson = (catersian3Arr, geojsonType) => {
  if (catersian3Arr?.length) {
    // 笛卡尔3转经纬度
    const positionList = [];
    catersian3Arr.forEach((item) => {
      let position = cartesian3ToLonLat(item);
      positionList.push(position);
    });
    let geojson = {};
    if (geojsonType === 'polygon') {
      positionList.push(positionList[0]);
      geojson = turf.polygon([positionList]);
    } else if (geojsonType === 'polyline') {
      geojson = turf.lineString(positionList);
    }

    return {
      geojson: geojson,
      positionLng: positionList,
    };
  }
};

// 多边形裁剪
export const polygonCut = (
  poly,
  line,
  tolerance = 0.0002,
  toleranceType = 'kilometers',
) => {
  // 1. 条件判断
  if (poly.geometry === void 0 || poly.geometry.type !== 'Polygon')
    throw '传入的必须为polygon';
  if (
    line.geometry === void 0 ||
    line.geometry.type.toLowerCase().indexOf('linestring') === -1
  )
    throw '传入的必须为linestring';
  if (line.geometry.type === 'LineString') {
    if (
      turf.booleanPointInPolygon(
        turf.point(line.geometry.coordinates[0]),
        poly,
      ) ||
      turf.booleanPointInPolygon(
        turf.point(
          line.geometry.coordinates[line.geometry.coordinates.length - 1],
        ),
        poly,
      )
    )
      throw '起点和终点必须在多边形之外';
  }
  // 2. 计算交点，并把线的点合并
  let lineIntersect = turf.lineIntersect(line, poly);
  const lineExp = turf.explode(line);
  for (let i = 0; i < lineExp.features.length - 1; i++) {
    lineIntersect.features.push(
      turf.point(lineExp.features[i].geometry.coordinates),
    );
  }
  // 3. 计算线的缓冲区
  const lineBuffer = turf.buffer(line, tolerance, {
    units: toleranceType,
  });
  // 4. 计算线缓冲和多边形的difference，返回"MultiPolygon"，所以将其拆开
  const _body = turf.difference(poly, lineBuffer);
  let pieces = [];
  if (_body.geometry.type === 'Polygon') {
    pieces.push(turf.polygon(_body.geometry.coordinates));
  } else {
    _body.geometry.coordinates.forEach(function (a) {
      pieces.push(turf.polygon(a));
    });
  }
  // 5. 处理点数据
  for (let p in pieces) {
    const piece = pieces[p];
    for (let c in piece.geometry.coordinates[0]) {
      const coord = piece.geometry.coordinates[0][c];
      const p = turf.point(coord);
      for (let lp in lineIntersect.features) {
        const lpoint = lineIntersect.features[lp];
        if (turf.distance(lpoint, p, toleranceType) <= tolerance * 2) {
          piece.geometry.coordinates[0][c] = lpoint.geometry.coordinates;
        }
      }
    }
  }
  // 6. 过滤掉重复点
  // for (let p in pieces) {
  //   const coords = pieces[p].geometry.coordinates[0];
  //   pieces[p].geometry.coordinates[0] = filterDuplicatePoints(coords);
  // }
  // 7. 将属性赋予每一个polygon，并处理id
  pieces.forEach((a, index) => {
    a.properties = Object.assign({}, poly.properties);
    a.properties.id += `-${index}`;
  });
  return turf.featureCollection(pieces);
};

// 生成classificationnPrimitive 
export const addPrimitive = (polygon, minHeight, maxHeight, id) => {
  const coordinates = polygon.coordinates[0];
  
  const position1 = coordinates.reduce((a, b) => {
    return a.concat(b);
  }, []);

  //2.几何图形Polygon的hierachy无法识别一维数组的经纬度信息，需要转成 按每两位 为一组经纬度 读取的笛卡尔3阶 世界坐标
  const hierarchy = new Cesium.PolygonHierarchy(
    Cesium.Cartesian3.fromDegreesArray(position1),
  );

  //Instance
  const Instance = new Cesium.GeometryInstance({
    //给实例设置 id，这样 scene.pick 返回的 pick.id 才能定位到该实例，
    //进而通过 primitive.getGeometryInstanceAttributes(pick.id) 修改颜色等属性
    id: id,
    geometry: new Cesium.PolygonGeometry({
      polygonHierarchy: hierarchy,
      height: minHeight,
      extrudedHeight: maxHeight,
    }),

    attributes: {
      color: Cesium.ColorGeometryInstanceAttribute.fromColor(
        Cesium.Color.fromRandom({ alpha: 0.6 }),
      ),
    },
  });
  //Appearnce 由于classifictionPrimitive 样式设定在Instance 所以不设置Apperance
  const primitives = new Cesium.ClassificationPrimitive({
    geometryInstances: Instance,
    //appearance:
  });
  return primitives;
}