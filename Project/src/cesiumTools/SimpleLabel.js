/*
 * @Description:
 * @Author: your name
 * @version:
 * @Date: 2024-05-14 09:35:39
 * @LastEditors: your name
 * @LastEditTime: 2024-06-26 15:16:09
 */
import { render, createVNode } from 'vue';
import * as Cesium from 'cesium';
// 静态导入弹窗组件：import(变量路径) 无法被 Vite 静态分析，
// 生产构建后组件不会被打包，导致弹窗在生产环境失效
import PopupComponent from '../components/Popup.vue';
/**
 * html简单文本标注类
 */
class SimpleLabel {
  constructor(viewer, options) {
    this.viewer = viewer;
    this.position = Cesium.defaultValue(
      options.position,
      Cesium.Cartesian3.ZERO,
    );
    this.isShow = Cesium.defaultValue(options.isShow, true);
    this.scaleByDistance = Cesium.defaultValue(
      options.scaleByDistance,
      new Cesium.NearFarScalar(1000, 1, 20000, 0.4),
    );
    this.popupType = Cesium.defaultValue(options.type, 'marker');
    this.offset = Cesium.defaultValue(options.offset, [0, 0]);
    // 静态注册弹窗组件，返回 Promise 以保持 addLabel 的调用方式不变
    this.popupRoutes = {
      marker: () => Promise.resolve({ default: PopupComponent }),
    };
    this.queryPopup = null;
    this.isDisplay = true;
    // ===== 性能优化缓存字段 =====
    this._windowPosition = new Cesium.Cartesian2(); // 复用投影结果对象，避免每帧 new
    this._elWidth = 0; // 元素宽度缓存，由 ResizeObserver 维护，避免每帧读 offsetWidth 触发强制布局
    this._lastLeft = null; // 上次写入的 left，避免无变化时重复赋值
    this._lastBottom = null; // 上次写入的 bottom
    this._lastScale = null; // 上次写入的 scale，避免缩放不变时反复触发重绘
    this._ro = null; // 观察元素尺寸变化的 ResizeObserver
  }

  // 外部修改坐标
  changePosition(position) {
    this.position = position;
  }

  removeQueryPopup() {
    this.queryPopup && this.queryPopup.removeMarker();
  }

  async addLabel(houseInfo) {
    // 如果在模板中找不到对应的，直接返回
    if (!this.popupRoutes[this.popupType]) {
      return null;
    }
    const res = await this.popupRoutes[this.popupType]();
    this.vmInstance = createVNode(res.default, {
      houseInfo: houseInfo,
      closePopup: () => {
        this.removeMarker();
      },
    }); //根据模板创建一个面板
    this.mountNode = document.createElement('div');
    render(this.vmInstance, this.mountNode);
    // vmInstance.el 在 script setup 组件下可能为 undefined，
    // 改为直接取 mountNode 下实际渲染出来的根元素
    this.el = this.mountNode.firstElementChild;
    this.viewer.cesiumWidget.container.appendChild(this.mountNode); //将字符串模板生成的内容添加到DOM上
    // 初始化宽度缓存，规避首次 postRender 前的真实元素尺寸是 0
    this._elWidth = this.el.offsetWidth || 0;
    // 用 ResizeObserver 跟踪元素宽度：内容变化（如图片加载）导致宽度改变时，
    // 仅在此回调里更新缓存，postRender 不再每帧读 offsetWidth 触发强制布局
    if (typeof ResizeObserver !== 'undefined' && this.el) {
      this._ro = new ResizeObserver(() => {
        this._elWidth = this.el.offsetWidth || 0;
      });
      this._ro.observe(this.el);
    }
    this.addPostRender();
    this.el.style.display = this.isShow ? 'block' : 'none';

    // requestRenderMode 开启时，viewer 只在画面变化时才渲染。
    // 此时若只新增 DOM 而不主动请求渲染，postRender 不会立即执行，
    // 弹窗会停留在未定位状态直到下一次相机移动，表现为“点击后延迟出现”。
    // 因此这里强制请求一帧，让 postRender 立刻定位弹窗。
    this.viewer.scene.requestRender && this.viewer.scene.requestRender();

    return this.el;
  }

  calcaluteGrade(curValue, stdNearFar) {
    let curPara = -1;
    if (curValue <= stdNearFar.near) {
      curPara = stdNearFar.nearValue;
    } else if (curValue >= stdNearFar.far) {
      curPara = stdNearFar.farValue;
    } else {
      const totalGrade = Math.ceil(
        Math.log(stdNearFar.far / stdNearFar.near) / Math.log(2),
      );
      const curGrade = Math.round(
        Math.log(curValue / stdNearFar.near) / Math.log(2),
      );
      curPara =
        stdNearFar.nearValue +
        ((stdNearFar.farValue - stdNearFar.nearValue) * curGrade) / totalGrade;
    }
    return curPara;
  }

  //添加场景事件
  addPostRender() {
    this.viewer.scene.postRender.addEventListener(this.postRender, this);
  }

  //场景渲染事件 实时更新标签的位置 使其与笛卡尔坐标一致
  postRender() {
    if (!this.el || !this.el.style) return;
    const scene = this.viewer.scene;
    const canvas = scene.canvas;
    const windowPosition = this._windowPosition;

    // 复用同一个 Cartesian2 对象做投影，避免每帧创建新对象产生 GC 压力
    Cesium.SceneTransforms.wgs84ToWindowCoordinates(
      scene,
      this.position,
      windowPosition,
    );

    // 位置会随相机移动而改变，但相同值时不再重复赋值（减少样式 system layout 开销）
    const bottom = canvas.height - windowPosition.y + this.offset[1] + 'px';
    if (bottom !== this._lastBottom) {
      this.el.style.bottom = bottom;
      this._lastBottom = bottom;
    }
    const left = windowPosition.x - this._elWidth / 2 + this.offset[0] + 'px';
    if (left !== this._lastLeft) {
      this.el.style.left = left;
      this._lastLeft = left;
    }

    // 处理近大远小效果：仅当缩放值变化时才写 transform，避免逐帧重绘
    const cameraHeight = Math.ceil(
      this.viewer.camera.positionCartographic.height,
    );
    const scaleSize = this.calcaluteGrade(cameraHeight, this.scaleByDistance);
    if (scaleSize !== this._lastScale) {
      this.el.style.transform = `scale(${scaleSize},${scaleSize})`;
      this._lastScale = scaleSize;
    }

    // 只有当显示模式打开的时候，才进行优化
    if (this.isDisplay) {
      const condition1 =
        windowPosition.y < 0 || windowPosition.y > canvas.height;
      const condition2 = cameraHeight > 12000;
      const condition3 =
        windowPosition.x < 0 || windowPosition.x > canvas.width;
      if (condition1 || condition2 || condition3) {
        this.el.style.display = 'none';
      } else {
        this.el.style.display = 'block';
      }
    }
  }

  removeMarker() {
    this.mountNode &&
      this.viewer.cesiumWidget.container.removeChild(this.mountNode); //删除DOM
    this.viewer.scene.postRender.removeEventListener(this.postRender, this); //移除事件监听
    // 断开 ResizeObserver，避免 DOM 已移除后仍被观察造成内存/回调泄漏
    if (this._ro) {
      this._ro.disconnect();
      this._ro = null;
    }
    this.mountNode = null;
    this.el = null;

    // requestRenderMode 下移除弹窗后主动请求一帧，清理上一帧留下的弹窗残影
    this.viewer.scene.requestRender && this.viewer.scene.requestRender();
  }
}
export default SimpleLabel;
