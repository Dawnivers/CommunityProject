import { defineStore } from 'pinia';
import { reactive } from 'vue';

//                                      仓库名
export const useMapData = defineStore('lineData', {
  //存数据
  state: () => {
    return {
      viewer: null,
      tileset: null,
      showEdit: false,

      rowdata: reactive({
        id: null,
        ownerName: null,
        ownerSex: null,
        idCard: null,
        phoneNum: null,
        nativePlace: null,
        houseType: null,
        builtArea: null,
        orientation: null,
        propertyType: null,
        houseAddress: null,
        ownerImg: null,
        houseImg: null,
      }),
    };
  },

  //算数据 return this.tileset ? this.tileset.length : 0;

  getters: {
    //调用 const data =dataStorageEn.Viewer
    Viewer() {
      return this.viewer;
    },
    Tile() {
      return this.tileset;
    },
    ShowEdit() {
      return this.showEdit;
    },
    RowData() {
      return this.rowdata;
    },
  },

  //改数据
  //`this` 指向 store 实例本身，所以 `this.viewer` 就是 `state.viewer`
  actions: {
    setViewer(viewer) {
      return new Promise((resolve, reject) => {
        this.viewer = viewer;
        resolve(viewer); //这里主要是把传入的viewer变成仓库属性 return 回去 viewer无用
      });
    },
    setTileset(tileset) {
      return new Promise((resolve, reject) => {
        this.tileset = tileset;
        resolve(tileset);
      });
    },
    //是否编辑
    openShowEdit() {
      this.showEdit = true;
    },
    closeShowEdit() {
      this.showEdit = false;
    },
    //修改数据
    updateRowData(data) {
      Object.assign(this.rowdata, data);
      return this.rowdata;
    },
  },
});
