/*
 * @Description:
 * @Author: your name
 * @version:
 * @Date: 2024-06-24 09:31:06
 * @LastEditors: your name
 * @LastEditTime: 2024-06-25 14:27:45
 */
import * as Cesium from 'cesium';
import { CESIUM_ION_TOKEN, MODEL_BASE_URL } from '@/config/env.js';

// 令牌从环境变量读取（Project/.env.local），不再写死在源码里
Cesium.Ion.defaultAccessToken = CESIUM_ION_TOKEN;

// 初始化地图场景
export const initViewer = (container) => {
  // 初始化cesium地图对象viewer
  const viewer = new Cesium.Viewer(container, {
    timeline: false, // 是否显示时间线控件
    animation: false, // 是否显示动画控件
    baseLayerPicker: false, // 避免token
    infoBox: false, // 是否显示点击要素之后显示的信息
    selectionIndicator: false, //选中元素显示,默认true
    skyAtmosphere: false, //关闭地球光环
    homeButton: false,
    fullscreenButton: false,
    geocoder: false,
    sceneModePicker: false,
    shouldAnimate: true,
    navigationHelpButton: false,
    //项目无时间变化时使用
    requestRenderMode : true , // 只在画面变化时渲染 
    maximumRenderTimeChange : Infinity , // 最大渲染时间间隔，避免无限循环

    //terrainProvider: new Cesium.EllipsoidTerrainProvider(),
    // 使用本地椭球地形，避免初始化时请求 Cesium Ion
    //terrainProvider: new Cesium.EllipsoidTerrainProvider(),
    //使用离线地形
    terrainProvider: new Cesium.CesiumTerrainProvider({
            url: `${MODEL_BASE_URL}/model/PengJiang_Terrian`,
            requestVertexNormals: true, // 请求照明
            requestWaterMask: true // 请求水波纹效果
 }),
    // 使用 ArcGIS 影像服务作为底图，不依赖 Cesium Ion Token
    /* imageryProvider: new Cesium.UrlTemplateImageryProvider({
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    }), */
    //使用自制底图
    imageryProvider:new Cesium.UrlTemplateImageryProvider({
    url: `${MODEL_BASE_URL}/model/PenJiang/{z}/{x}/{y}.png`,
    minimumLevel: 10,
    maximumLevel: 16,
    tilingScheme: new Cesium.WebMercatorTilingScheme(), // 瓦片方案 墨卡托投影，和Cesium World terrain默认投影一致
    rectangle: Cesium.Rectangle.fromDegrees(112.7321, 22.361, 113.3954, 22.898),// 自定义请求影像范围
  }) ,
  });

  return viewer;
};

// 设置后处理效果
export const setScene = (viewer) => {
  //隐藏太阳
  viewer.scene.sun.show = false;
  //隐藏月亮
  viewer.scene.moon.show = false;
  viewer.scene.globe.enableLighting = true; // 开启全球光照

  // 泛光设置
  const bloom = viewer.scene.postProcessStages.bloom;
  bloom.enabled = false;

  // 亮度设置
  // 亮度设置
  var stages = viewer.scene.postProcessStages;
  // 是否支持图像渲染像素化处理
  if (Cesium.FeatureDetection.supportsImageRenderingPixelated()) {
    viewer.resolutionScale = window.devicePixelRatio;
  }

  // 开启抗锯齿
  viewer.scene.postProcessStages.fxaa.enabled = true;

  viewer.scene.brightness =
    viewer.scene.brightness ||
    stages.add(Cesium.PostProcessStageLibrary.createBrightnessStage());
  viewer.scene.brightness.enabled = true;
  viewer.scene.brightness.uniforms.brightness = 1.2;
  viewer.scene.globe.depthTestAgainstTerrain = true;
  viewer._cesiumWidget._creditContainer.style.display = 'none';

  viewer.shadows = false; //开启阴影效果
  viewer.shadowMap.darkness = 0.8; //阴影透明度--越大越透明
  //去cesium logo水印 或 css
  viewer.cesiumWidget.creditContainer.style.display = 'none'; //去cesium logo水印

  // 场景设置
  viewer.scene.highDynamicRange = true;
  viewer.scene.postProcessStages.bloom.enabled = true;
  viewer.scene.postProcessStages.bloom.uniforms.contrast = 255;
  viewer.scene.postProcessStages.bloom.uniforms.brightness = 0.02;
  viewer.scene.postProcessStages.bloom.uniforms.glowOnly = false;
  viewer.scene.postProcessStages.bloom.uniforms.delta = 3.1;
  viewer.scene.postProcessStages.bloom.uniforms.sigma = 5;
  viewer.scene.postProcessStages.bloom.uniforms.stepSize = 0.6;
  viewer.scene.postProcessStages.bloom.uniforms.isSelected = false;
  viewer.scene.postProcessStages.bloom.uniforms.selectedBloom = 10;
  viewer.scene.postProcessStages.bloom.uniforms.bloomColor =
    Cesium.Color.fromCssColorString('#fafafa');
  viewer.scene.sun.show = false;
  viewer.scene.moon.show = false;
  viewer.scene.undergroundMode = false;
  viewer.scene.terrainProvider.isCreateSkirt = false;
  viewer.scene.globe.showGroundAtmosphere = false;
  viewer.scene.globe.enableLighting = false;
  viewer.scene.fog.enabled = false;
};

// 多个3dtiles模型加载
// urls 多个3dtiles模型地址  loadCb 加载完成的回调
// urls<{url,options}>
/*  const modelUrls = [{
      url:"http://localhost:666/model/model/tileset.json",
      options:{}
    }] */
export const loadTilesets = async (viewer, urls, loadCb) => {
  const tilesets = urls.map((item) => {
    const { url, options } = item;
    let params = { url };

    //如果选项里有参数 就将其整合到params
    /*
    const tileset = new Cesium.Cesium3DTileset({
      url: 'http://localhost:666/model/model/tileset.json',
      ...defaultOpts,
}); 
*/
    const defaultOpts = {
  // ================= 加载优化参数 =================
  skipLevelOfDetail: true, // 启用LOD层级跳过优化（建议true）
  baseScreenSpaceError: 512, // 基础屏幕空间误差阈值（值越大加载越激进）
  skipScreenSpaceErrorFactor: 16, // LOD跳过的误差乘数（值越大跳过越多层级）
  skipLevels: 1, // 最小跳过的层级数
  immediatelyLoadDesiredLevelOfDetail: false, // 是否仅加载满足误差要求的层级
  loadSiblings: false, // 是否加载相邻瓦片（关闭可提升中心区域加载优先级）

  // ================= 渲染性能参数 =================
  maximumMemoryUsage: 2048, // 最大内存使用(MB)，根据设备配置调整512 1024
  progressiveResolutionHeightFraction: 0.5, // 渐进加载分辨率比例（0-1，值越小初始越模糊）

  // ================= 动态加载优化 =================
  dynamicScreenSpaceError: true, // 启用动态屏幕空间误差优化（根据视距调整细节）
  dynamicScreenSpaceErrorDensity: 10, // 动态误差密度（值越大周边加载越快）

  // ================= 视觉焦点优化 =================
  foveatedScreenSpaceError: true, // 启用中心焦点区域优先加载
  foveatedConeSize: 0.1, // 焦点区域锥形角度（0-1，值越小中心区域越优先）

  // ================= 调试选项 =====================
  debugShowContentBoundingVolume: false, // 显示内容包围盒
  debugShowBoundingVolume: false, // 显示瓦片包围盒
  debugShowViewerRequestVolume: false, // 显示请求范围体积
  debugColorizeTiles: false, // 随机颜色区分瓦片
  cullWithChildrenBounds: false, // ---优化选项。是否使用子边界体积的并集来剔除瓦片（默认true）
  cullRequestsWhileMoving: false, // ---优化选项。不要请求由于相机移动而在返回时可能未使用的图块。这种优化只适用于静止的瓦片集(默认true)
  cullRequestsWhileMovingMultiplier: 10, // 值越小能够更快的剔除 ---优化选项。移动时用于剔除请求的乘数。较大的是更积极的剔除，较小的较不积极的剔除(默认60)原10
  preloadWhenHidden: true, // ---tileset.show时 预加载瓷砖false。加载图块，就好像图块集可见但不渲染它们(默认false)
  preloadFlightDestinations: true, // ---优化选项。在相机飞行时在相机的飞行目的地预加载图块(默认true)
  preferLeaves: true, // ---优化选项。最好先装载叶子(默认false)
  dynamicScreenSpaceErrorHeightFalloff: 0.25, // --- 密度开始下降的瓦片集高度的比率(默认0.25)
  foveatedMinimumScreenSpaceErrorRelaxation: 0.0, // --- 优化选项。当Cesium3DTileset#foveatedScreenSpaceError为 true 时使用以控制中央凹锥之外的图块的起始屏幕空间误差松弛。屏幕空间错误将从 tileset 值开始Cesium3DTileset#maximumScreenSpaceError根据提供的Cesium3DTileset#foveatedInterpolationCallback.(默认0.0)
  luminanceAtZenith: 0.2, // --- 用于此模型的程序环境贴图的天顶处的太阳亮度（以千坎德拉每平方米为单位）(默认0.2)
  backFaceCulling: true, // --- 是否剔除背面几何体。当为 true 时，背面剔除由 glTF 材质的 doubleSided 属性确定；如果为 false，则禁用背面剔除(默认true)
  debugFreezeFrame: false, // --- 仅用于调试。确定是否应仅使用最后一帧的图块进行渲染(默认false)
  debugShowGeometricError: false, // --- 仅用于调试。如果为 true，则绘制标签以指示每个图块的几何误差(默认false)
  debugShowRenderingStatistics: false, // --- 仅用于调试。如果为 true，则绘制标签以指示每个图块的命令、点、三角形和特征的数量(默认false)
  debugShowMemoryUsage: false, // --- 仅用于调试。如果为 true，则绘制标签以指示每个图块使用的纹理和几何内存（以兆字节为单位）(默认false)
  debugShowUrl: false, // --- 仅用于调试。如果为 true，则绘制标签以指示每个图块的 url(默认false)
    };
    
    Object.assign(params, defaultOpts);
    if (typeof options === 'object') {
      Object.assign(params, options);
    }
    const tile = viewer.scene.primitives.add(
      new Cesium.Cesium3DTileset(params),
    );
    return tile.readyPromise; //tilesets是 Promise数组
  });
  let result = await Promise.all(tilesets); //`Promise.all` 接收一个 Promise 数组，**并行等待所有 Promise 都完成**：
  loadCb && loadCb(result); //如果传了 `loadCb` 回调函数，就调用它，把加载好的瓦片数组传过去。
};

export const handleDefaultModelEffect = (tile) => {
  // 处理模型着色
  tile.style = new Cesium.Cesium3DTileStyle({
    color: {
      conditions: [
        ['Number(${Elevation})<20', "color('rgb(25, 211, 226)',0.0)"],

        ['Number(${Elevation})>20', "color('rgb(25, 211, 226)',1)"],
        //['true', "color('rgb(42, 122, 237)',1)"]
      ],
      show: false,
    },
  });
  const customShader = new Cesium.CustomShader({
    uniforms: {
      maxHeight: {
        type: Cesium.UniformType.FLOAT,
        value: 660.0,
      },
      minHeight: {
        type: Cesium.UniformType.FLOAT,
        value: 520.0,
      },
    },
    mode: Cesium.CustomShaderMode.MODIFY_MATERIAL,
    lightingModel: Cesium.LightingModel.PBR,
    vertexShaderText: /*glsl*/ `
            void vertexMain(VertexInput vsInput, inout czm_modelVertexOutput vsOutput) {

            }
       `,
    fragmentShaderText: /*glsl*/ `
            void fragmentMain(FragmentInput fsInput,inout czm_modelMaterial material) {
                vec3 positionMC = fsInput.attributes.positionMC;
            
                // 注意shader中写浮点数是 一定要带小数点 否则会报错 比如0需要写成0.0 1要写成1.0
                float _baseHeight = minHeight; // 物体的基础高度，需要修改成一个合适的建筑基础高度
                float _heightRange = maxHeight; // 高亮的范围(_baseHeight ~ _baseHeight + _heightRange)
                float _glowRange = maxHeight; // 光环的移动范围(高度)
                // 建筑基础色
                float czm_height = positionMC.y - _baseHeight -65.0;
                float baseColor = czm_height / _heightRange;
                float bottomColor= czm_height / _heightRange*2.0;
                // 房顶给固定颜色增加立体感
                if(czm_height<29.0) {
                    material.diffuse *= vec3(bottomColor);
                }else{
                  material.diffuse *= vec3(baseColor); // 渐变
                }
            }
         `,
  });
  //tile.customShader = customShader;
};

// 视角飞到全局 （位置 速度 相机参数）
export const flyToDefaultView = (viewer) => {
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(113.95, 30.19, 34000),
    duration: 2,
    orientation: {
      heading: Cesium.Math.toRadians(35.0),
      pitch: Cesium.Math.toRadians(-37.0),
      roll: 0.0,
    },
  });
};

// 闪烁实体
export const binkEntityMaterial = (entity) => {
  if (!entity.polygon.material.color._value) return;
  let initColor = entity.polygon.material.color._value;
  let x = 1;
  let flog = true;
  entity.polygon.material = new Cesium.ColorMaterialProperty(
    new Cesium.CallbackProperty(() => {
      if (flog) {
        x = x - 0.05;
        if (x <= 0) {
          flog = false;
        }
      } else {
        x = x + 0.05;
        if (x >= 1) {
          flog = true;
        }
      }
      return Cesium.Color.RED.withAlpha(x);
    }, false),
  );
  setTimeout(() => {
    entity.polygon.material = initColor;
  }, 1500);
};
