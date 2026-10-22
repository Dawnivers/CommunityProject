<template>
    <div id="cesium-viewer">
        <slot/>
    </div>
</template>

<script setup>
import * as Cesium from "cesium";
import { onMounted,markRaw } from "vue"; //markRaw取消入库的响应式包装 避免性能损耗
import {useMapData} from '@/stores/counter'
import {
    initViewer,
    setScene,
    loadTilesets,
   
} from "@/cesiumTools/sceneManager";

import { limitCameraToCenter} from "@/cesiumTools/CameraLimited.js";
import { MODEL_BASE_URL } from "@/config/env.js";


const dataStore = useMapData()

onMounted(async () => {
    const viewer = initViewer("cesium-viewer");//创建viewer 进行默认配置
    //setScene(viewer);
    //限制相机移动范围
limitCameraToCenter(viewer, 113.060251807, 22.647431202, {
  halfLon: 0.05, // 经度方向允许移动的半径（度）
  halfLat: 0.05, // 纬度方向允许移动的半径（度）
  minHeight: 50,
  maxHeight: 2000,
});
   // viewer.scene.debugShowFramesPerSecond = true; //显示帧率
    //性能优化
    viewer.scene.pixelRatio = 1;//1表示不使用Retina显示 Retina是2倍像素密度 越高性能越差
    viewer.scene.globe.maximumScreenSpaceError = 5 ; // 最准误差（米） 越高性能越好 但是会增加加载时间 默认4
  
    // 可以使用pinia来管理viewer地图对象，只需要将其标记为非响应式即可
    dataStore.setViewer(markRaw(viewer))
    const modelUrls = [{
      url:`${MODEL_BASE_URL}/model/model/tileset.json`,
      options:{}
    }]
    // 加载多个3dtiles
    await loadTilesets(viewer,modelUrls,(tilesets)=>{
      dataStore.setTileset(tilesets[0]) // 返回的由于这里只有一个
      viewer.zoomTo(tilesets[0])
    })
});
</script>

<style>
#cesium-viewer {
    width: 100%;
    height: 100%;
    pointer-events: all;
}
</style>