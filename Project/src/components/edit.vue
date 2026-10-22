<template>
  <div class="edit-owner-container">
    <main class="sci-modal-container" data-purpose="owner-edit-panel">
      <header class="panel-header">
        <div class="header-title-group">
          <h1 class="panel-title">编辑业主信息</h1>
        </div>
        <button
          aria-label="关闭"
          type="button"
          class="close-btn"
          @mouseout="onCloseMouseOut"
          @mouseover="onCloseMouseOver"
          @click="$emit('close')"
        >
          <svg
            fill="none"
            height="70%"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2.2"
            viewbox="0 0 24 24"
            width="80%"
          >
            <line x1="18" x2="6" y1="6" y2="18"></line>
            <line x1="6" x2="18" y1="6" y2="18"></line>
          </svg>
        </button>
      </header>

      <form class="panel-body" @submit.prevent="onSubmit">
        <section class="info-card" data-purpose="owner-information-card">
          <div class="section-title">业主信息</div>

          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label" for="owner-name">
                <span><span class="required-marker">*</span>业主姓名</span>
              </label>
              <div class="input-wrapper">
                <input
                  v-model="formData.ownerName"
                  class="sci-input"
                  id="owner-name"
                  placeholder="请输入业主姓名"
                  required
                  type="text"
                />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label" for="owner-gender">
                <span><span class="required-marker">*</span>业主性别</span>
              </label>
              <div class="custom-select-container" id="select-owner-gender">
                <input
                  id="owner-gender"
                  v-model="formData.ownerSex"
                  name="owner-gender"
                  type="hidden"
                />
                <div
                  aria-expanded="false"
                  aria-haspopup="listbox"
                  class="custom-select-trigger"
                  role="button"
                  tabindex="0"
                  @click="toggleSelect('owner-gender')"
                  @keydown="handleSelectKeydown('owner-gender', $event)"
                >
                  <span class="custom-select-value">{{
                    getGenderLabel()
                  }}</span>
                  <svg
                    class="select-arrow"
                    :class="{ open: openSelect === 'owner-gender' }"
                    fill="none"
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    viewbox="0 0 24 24"
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>
                <div
                  v-if="openSelect === 'owner-gender'"
                  class="custom-select-dropdown"
                  role="listbox"
                >
                  <div
                    aria-selected="true"
                    class="custom-select-option"
                    :class="{ selected: formData.ownerSex === 'male' }"
                    data-value="male"
                    role="option"
                    @click="selectOption('owner-gender', 'male')"
                  >
                    男
                  </div>
                  <div
                    aria-selected="false"
                    class="custom-select-option"
                    :class="{ selected: formData.ownerSex === 'female' }"
                    data-value="female"
                    role="option"
                    @click="selectOption('owner-gender', 'female')"
                  >
                    女
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label" for="owner-id-card">
                <span><span class="required-marker">*</span>身份证号</span>
              </label>
              <div class="input-wrapper">
                <input
                  v-model="formData.idCard"
                  class="sci-input"
                  id="owner-id-card"
                  placeholder="请输入18位身份证号"
                  required
                  type="text"
                />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label" for="owner-phoneNum">
                <span><span class="required-marker">*</span>手机号码</span>
              </label>
              <div class="input-wrapper">
                <input
                  v-model="formData.phoneNum"
                  class="sci-input"
                  id="owner-phoneNum"
                  placeholder="请输入联系手机号"
                  required
                  type="tel"
                />
              </div>
            </div>
          </div>

          <div class="form-group full-width">
            <label class="form-label" for="owner-nativePlace">
              <span>家庭住址</span>
            </label>
            <div class="input-wrapper">
              <input
                v-model="formData.nativePlace"
                class="sci-input"
                id="owner-nativePlace"
                placeholder="请输入常住家庭住址详细信息"
                type="text"
              />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label"><span>业主头像</span></label>
            <div class="media-upload-row">
              <div class="preview-box avatar-preview" title="头像预览">
                <img
                  v-if="formData.ownerImg"
                  :src="formData.ownerImg"
                  class="preview-image"
                  alt="业主头像预览"
                />
                <svg
                  v-else
                  fill="none"
                  height="30%"
                  stroke="rgba(56, 189, 248, 0.6)"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.6"
                  viewbox="0 0 24 24"
                  width="30%"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <input
                ref="ownerImageInput"
                class="file-input"
                type="file"
                accept="image/*"
                @change="handleImageChange($event, 'ownerImg')"
              />
              <button
                class="reupload-btn"
                type="button"
                @click="openImagePicker('ownerImageInput')"
              >
                <svg
                  fill="none"
                  height="15"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  viewbox="0 0 24 24"
                  width="15"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" x2="12" y1="3" y2="15"></line>
                </svg>
                <span>重新上传</span>
              </button>
            </div>
          </div>
        </section>

        <section class="info-card" data-purpose="house-information-card">
          <div class="section-title">房屋信息</div>

          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label" for="house-type"
                ><span>房屋类型</span></label
              >
              <div class="input-wrapper">
                <input
                  v-model="formData.houseType"
                  class="sci-input"
                  id="house-type"
                  placeholder="例如：三室两厅一卫"
                  type="text"
                />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label" for="house-area"
                ><span>房屋面积</span></label
              >
              <div class="input-wrapper">
                <input
                  v-model="formData.builtArea"
                  class="sci-input"
                  id="house-area"
                  placeholder="请输入房屋建筑面积"
                  type="text"
                />
                <span class="input-suffix">m²</span>
              </div>
            </div>
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label" for="house-orientation"
                ><span>房屋朝向</span></label
              >
              <div class="input-wrapper">
                <input
                  v-model="formData.orientation"
                  class="sci-input"
                  id="house-orientation"
                  placeholder="例如：南向、南北通透"
                  type="text"
                />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label" for="property-type"
                ><span>物业类型</span></label
              >
              <div class="custom-select-container" id="select-property-type">
                <input
                  id="property-type"
                  v-model="formData.propertyType"
                  name="property-type"
                  type="hidden"
                />
                <div
                  aria-expanded="false"
                  aria-haspopup="listbox"
                  class="custom-select-trigger"
                  role="button"
                  tabindex="0"
                  @click="toggleSelect('property-type')"
                  @keydown="handleSelectKeydown('property-type', $event)"
                >
                  <span class="custom-select-value">{{
                    getPropertyTypeLabel()
                  }}</span>
                  <svg
                    class="select-arrow"
                    :class="{ open: openSelect === 'property-type' }"
                    fill="none"
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    viewbox="0 0 24 24"
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>
                <div
                  v-if="openSelect === 'property-type'"
                  class="custom-select-dropdown"
                  role="listbox"
                >
                  <div
                    aria-selected="true"
                    class="custom-select-option"
                    :class="{
                      selected: formData.propertyType === 'residential',
                    }"
                    data-value="residential"
                    role="option"
                    @click="selectOption('property-type', 'residential')"
                  >
                    居民物业
                  </div>
                  <div
                    aria-selected="false"
                    class="custom-select-option"
                    :class="{
                      selected: formData.propertyType === 'commercial',
                    }"
                    data-value="commercial"
                    role="option"
                    @click="selectOption('property-type', 'commercial')"
                  >
                    商业物业
                  </div>
                  <div
                    aria-selected="false"
                    class="custom-select-option"
                    :class="{
                      selected: formData.propertyType === 'industrial',
                    }"
                    data-value="industrial"
                    role="option"
                    @click="selectOption('property-type', 'industrial')"
                  >
                    工业物业
                  </div>
                  <div
                    aria-selected="false"
                    class="custom-select-option"
                    :class="{ selected: formData.propertyType === 'other' }"
                    data-value="other"
                    role="option"
                    @click="selectOption('property-type', 'other')"
                  >
                    其他物业
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="form-group full-width">
            <label class="form-label" for="house-number"
              ><span>房屋号码 (只读)</span></label
            >
            <div class="input-wrapper">
              <input
                v-model="formData.houseAddress"
                class="sci-input"
                disabled
                id="house-number"
                readonly
                type="text"
              />
              <svg
                class="input-lock-icon"
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                viewbox="0 0 24 24"
              >
                <rect height="11" rx="2" ry="2" width="18" x="3" y="11"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label"><span>户型图</span></label>
            <div class="media-upload-row">
              <div class="preview-box floorplan-preview" title="户型图预览">
                <img
                  v-if="formData.houseImg"
                  :src="formData.houseImg"
                  class="preview-image"
                  alt="户型图预览"
                />
                <svg
                  v-else
                  fill="none"
                  height="30%"
                  stroke="rgba(56, 189, 248, 0.6)"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.6"
                  viewbox="0 0 24 24"
                  width="24%"
                >
                  <rect height="18" rx="2" ry="2" width="18" x="3" y="3"></rect>
                  <line x1="3" x2="21" y1="9" y2="9"></line>
                  <line x1="9" x2="9" y1="21" y2="9"></line>
                  <circle cx="15" cy="15" r="2"></circle>
                </svg>
              </div>
              <input
                ref="houseImageInput"
                class="file-input"
                type="file"
                accept="image/*"
                @change="handleImageChange($event, 'houseImg')"
              />
              <button
                class="reupload-btn"
                type="button"
                @click="openImagePicker('houseImageInput')"
              >
                <svg
                  fill="none"
                  height="15"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  viewbox="0 0 24 24"
                  width="15"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" x2="12" y1="3" y2="15"></line>
                </svg>
                <span>重新上传</span>
              </button>
            </div>
          </div>
        </section>

        <footer class="panel-footer">
          <button class="btn-cancel" type="button" @click="$emit('close')">
            取消
          </button>
          <button class="btn-submit" type="submit">
            <svg
              fill="none"
              height="16"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2.5"
              viewbox="0 0 24 24"
              width="16"
            >
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>提交</span>
          </button>
        </footer>
      </form>
    </main>
  </div>
</template>

<script setup>
import { onBeforeUnmount, ref } from 'vue';
import { updateInfo } from '@/api/function';
import { useMapData } from '@/stores/counter';
import { API_ORIGIN } from '@/config/env.js';

const datastore = useMapData();
defineEmits(['close']);

const openSelect = ref(null);

//reactive 也是响应对象 区别ref 是访问值时候 无需value
/* const formData = reactive({
  ownerName: '张明宇',
  ownerSex: 'male',
  idCard: '11010819880520431X',
  phoneNum: '13812345678',
  nativePlace: '北京市海淀区中关村南大街科技创新园7号院',
  houseType: '三室两厅两卫',
  builtArea: '138.65',
  orientation: '南北通透',
  propertyType: 'residential',
  houseAddress: '1602室',
  ownerImg: null,
  houseImg:null
}); */

const formData = datastore.RowData;

const ownerImageInput = ref(null);
const houseImageInput = ref(null);
const objectUrls = new Set();
const selectedFiles = {
  ownerImg: null,
  houseImg: null,
};

const apiOrigin = API_ORIGIN;

function getImageUrl(imagePath) {
  if (
    !imagePath ||
    imagePath.startsWith('blob:') ||
    imagePath.startsWith('data:')
  ) {
    return imagePath;
  }

  return imagePath.startsWith('http')
    ? imagePath
    : `${apiOrigin}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
}

function getImagePath(imagePath) {
  if (
    !imagePath ||
    imagePath.startsWith('blob:') ||
    imagePath.startsWith('data:')
  ) {
    return imagePath;
  }

  try {
    return new URL(imagePath, apiOrigin).pathname;
  } catch {
    return imagePath;
  }
}

formData.ownerImg = getImageUrl(formData.ownerImg);
formData.houseImg = getImageUrl(formData.houseImg);

// 回显：数据库 property_type 是数字（1~4），下拉框用英文键比较选中态，需要转换
const propertyTypeKeyMap = {
  1: 'residential',
  2: 'commercial',
  3: 'industrial',
  4: 'other',
};
if (
  formData.propertyType != null &&
  propertyTypeKeyMap[formData.propertyType]
) {
  formData.propertyType = propertyTypeKeyMap[formData.propertyType];
}

function openImagePicker(inputRef) {
  const input =
    inputRef === 'ownerImageInput'
      ? ownerImageInput.value
      : houseImageInput.value;
  input?.click();
}

function handleImageChange(event, field) {
  const [file] = event.target.files;
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    window.alert('请选择图片文件');
    event.target.value = '';
    return;
  }

  const imageUrl = URL.createObjectURL(file);
  objectUrls.add(imageUrl);
  selectedFiles[field] = file;
  formData[field] = imageUrl;
  event.target.value = '';
}

onBeforeUnmount(() => {
  objectUrls.forEach((url) => URL.revokeObjectURL(url));
});

function toggleSelect(selectId) {
  if (openSelect.value === selectId) {
    openSelect.value = null;
  } else {
    openSelect.value = selectId;
  }
}

function closeAllSelects() {
  openSelect.value = null;
}

function selectOption(selectId, value) {
  if (selectId === 'owner-gender') {
    formData.ownerSex = value;
  } else if (selectId === 'property-type') {
    formData.propertyType = value;
  }
  closeAllSelects();
}

function handleSelectKeydown(selectId, e) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    toggleSelect(selectId);
  } else if (e.key === 'Escape') {
    closeAllSelects();
  }
}

function getGenderLabel() {
  return formData.ownerSex === 'male' ? '男' : '女';
}

function getPropertyTypeLabel() {
  const typeMap = {
    residential: '居民物业',
    commercial: '商业物业',
    industrial: '工业物业',
    other: '其他物业',
  };
  return typeMap[formData.propertyType] || '居民物业';
}

// 数据库 property_type 是 smallint（1居民物业 2商业物业 3工业物业 4其他）
// 提交前需要把下拉框的英文键转成数字，否则 PostgreSQL 报"无效的类型 smallint 输入语法"
const propertyTypeCodeMap = {
  residential: 1,
  commercial: 2,
  industrial: 3,
  other: 4,
};

async function onSubmit() {
  const uploadData = new FormData();

  Object.entries(formData).forEach(([field, value]) => {
    if (field !== 'ownerImg' && field !== 'houseImg') {
      if (field === 'propertyType') {
        // 物业类型：英文键转数字再提交；未选择（null/undefined）时默认传 1（居民物业）
        const code = propertyTypeCodeMap[value] ?? (value == null ? 1 : value);
        uploadData.append(field, code);
      } else if (value != null) {
        uploadData.append(field, value);
      }
    }
  });

  if (selectedFiles.ownerImg) {
    uploadData.append('ownerImg', selectedFiles.ownerImg);
  } else if (formData.ownerImg) {
    uploadData.append('ownerImg', getImagePath(formData.ownerImg));
  }

  if (selectedFiles.houseImg) {
    uploadData.append('houseImg', selectedFiles.houseImg);
  } else if (formData.houseImg) {
    uploadData.append('houseImg', getImagePath(formData.houseImg));
  }

  try {
    const response = await updateInfo(uploadData);
    if (response.data) {
      datastore.updateRowData({
        ...response.data,
        ownerImg: getImageUrl(response.data.ownerImg),
        houseImg: getImageUrl(response.data.houseImg),
      });
      datastore.closeShowEdit();
    }
    window.alert('更新成功');
  } catch (error) {
    console.error('更新业主信息失败:', error);
    window.alert(error.response?.data?.message || '更新失败，请稍后重试');
  }
}
</script>

<style scoped>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'PingFang SC',
    'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  -webkit-font-smoothing: antialiased;
}

.edit-owner-container {
  --edit-scale: 0.8;
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 32px 16px;
  overflow-y: auto;
  background: rgba(2, 8, 23, 0.55);
}

.sci-modal-container {
  width: 100%;
  max-width: 900px;
  transform: scale(var(--edit-scale));
  transform-origin: center center;
  background: rgba(10, 17, 30, 0.88);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(56, 189, 248, 0.35);
  border-radius: 12px;
  box-shadow:
    0 0 35px rgba(8, 145, 178, 0.22),
    0 25px 50px -12px rgba(0, 0, 0, 0.7);
  position: relative;
}

.sci-modal-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    #38bdf8 30%,
    #00f0ff 70%,
    transparent 100%
  );
}

.sci-modal-container::after {
  content: '';
  position: absolute;
  bottom: 0;
  right: 0;
  width: 140px;
  height: 140px;
  background: radial-gradient(
    circle,
    rgba(0, 240, 255, 0.08) 0%,
    transparent 70%
  );
  pointer-events: none;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 28px;
  border-bottom: 1px solid rgba(56, 189, 248, 0.18);
  background: rgba(15, 23, 42, 0.45);
}

.header-title-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.panel-title {
  font-size: 19px;
  font-weight: 600;
  letter-spacing: 0.8px;
  color: #f8fafc;
  text-shadow: 0 0 12px rgba(56, 189, 248, 0.4);
}

.close-btn {
  background: transparent;
  border: none;
  outline: none;
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: rgb(56, 189, 248);
  filter: drop-shadow(rgba(56, 189, 248, 0.8) 0px 0px 6px);
  padding: 0;
  transition: 0.25s;
}

.panel-body {
  padding: 24px 28px;
  display: flex;
  flex-direction: column;
  gap: 22px;
  max-height: calc(100vh - 300px);
  overflow-y: auto;
  scrollbar-color: #6b7782 rgba(9, 17, 33, 0.72);
  scrollbar-width: thin;
}

.panel-body::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.panel-body::-webkit-scrollbar-track {
  border: 1px solid rgba(56, 130, 246, 0.12);
  background: rgba(9, 17, 33, 0.72);
}

.panel-body::-webkit-scrollbar-thumb {
  border: 2px solid rgba(9, 17, 33, 0.72);
  border-radius: 6px;
  background: linear-gradient(180deg, #87929a, #58636c);
}

.panel-body::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, #aab4bb, #707b84);
}

.panel-body::-webkit-scrollbar-corner {
  background: #0b1220;
}

.info-card {
  background: rgba(15, 23, 42, 0.55);
  border: 1px solid rgba(56, 189, 248, 0.18);
  border-radius: 8px;
  padding: 18px 22px;
  position: relative;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #38bdf8;
  margin-bottom: 18px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.section-title::before {
  content: '';
  display: inline-block;
  width: 4px;
  height: 14px;
  background: linear-gradient(180deg, #00f0ff, #0284c7);
  border-radius: 2px;
  box-shadow: 0 0 8px #00f0ff;
}

.form-grid-2 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px 24px;
  margin-bottom: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.form-group.full-width {
  margin-bottom: 16px;
}

.form-label {
  font-size: 13px;
  color: #94a3b8;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.required-marker {
  color: #f43f5e;
  margin-right: 2px;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.sci-input {
  width: 100%;
  height: 40px;
  background: rgba(10, 15, 24, 0.85);
  border: 1px solid rgba(56, 189, 248, 0.28);
  border-radius: 6px;
  padding: 0 14px;
  color: #f1f5f9;
  font-size: 13.5px;
  outline: none;
  transition: all 0.25s ease;
}

.sci-input::placeholder {
  color: #475569;
}

.sci-input:focus {
  border-color: #00f0ff;
  box-shadow: 0 0 12px rgba(0, 240, 255, 0.35);
  background: rgba(13, 22, 38, 0.95);
}

.sci-input:-webkit-autofill,
.sci-input:-webkit-autofill:hover,
.sci-input:-webkit-autofill:focus,
.sci-input:autofill {
  -webkit-text-fill-color: #f1f5f9;
  -webkit-box-shadow: 0 0 0 1000px rgba(10, 15, 24, 0.85) inset;
  box-shadow: 0 0 0 1000px rgba(10, 15, 24, 0.85) inset;
  transition: background-color 9999s ease-out;
}

.sci-input:disabled,
.sci-input[readonly] {
  background: rgba(15, 23, 42, 0.5);
  border-color: rgba(71, 85, 105, 0.3);
  color: #64748b;
  cursor: not-allowed;
}

.input-suffix {
  position: absolute;
  right: 14px;
  color: #64748b;
  font-size: 13px;
  pointer-events: none;
}

.input-lock-icon {
  position: absolute;
  right: 12px;
  color: #64748b;
  width: 15px;
  height: 15px;
  pointer-events: none;
}

.custom-select-container {
  position: relative;
  width: 100%;
  user-select: none;
}

.custom-select-trigger {
  width: 100%;
  height: 40px;
  background: rgba(10, 15, 24, 0.85);
  border: 1px solid rgba(56, 189, 248, 0.28);
  border-radius: 6px;
  padding: 0 36px 0 14px;
  color: #f1f5f9;
  font-size: 13.5px;
  outline: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: all 0.25s ease;
}

.custom-select-trigger:hover {
  border-color: rgba(56, 189, 248, 0.5);
  background: rgba(13, 22, 38, 0.9);
}

.select-arrow {
  position: absolute;
  right: 12px;
  top: 50%;
  margin-top: -8px;
  width: 16px;
  height: 16px;
  color: #38bdf8;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  transform-origin: center center;
  transform: rotate(0deg);
  transition:
    transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    color 0.25s ease,
    filter 0.25s ease;
}

.select-arrow.open {
  transform: rotate(180deg);
  color: #00f0ff;
  filter: drop-shadow(0 0 6px rgba(0, 240, 255, 0.85));
}

.custom-select-dropdown {
  position: absolute;
  top: calc(100% + 5px);
  left: 0;
  right: 0;
  background: rgba(10, 17, 30, 0.96);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(56, 189, 248, 0.38);
  border-radius: 6px;
  box-shadow:
    0 10px 25px -5px rgba(0, 0, 0, 0.7),
    0 0 15px rgba(8, 145, 178, 0.3);
  z-index: 50;
  max-height: 220px;
  overflow-y: auto;
  padding: 5px;
}

.custom-select-option {
  padding: 8px 12px;
  color: #cbd5e1;
  font-size: 13px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all 0.2s ease;
}

.custom-select-option:hover {
  background: rgba(56, 189, 248, 0.16);
  color: #00f0ff;
  text-shadow: 0 0 8px rgba(0, 240, 255, 0.4);
}

.custom-select-option.selected {
  background: rgba(0, 240, 255, 0.12);
  color: #00f0ff;
  font-weight: 500;
}

.custom-select-dropdown::-webkit-scrollbar {
  width: 5px;
}

.custom-select-dropdown::-webkit-scrollbar-track {
  border: 1px solid rgba(56, 130, 246, 0.12);
  background: rgba(9, 17, 33, 0.72);
}

.custom-select-dropdown::-webkit-scrollbar-thumb {
  border: 2px solid rgba(9, 17, 33, 0.72);
  border-radius: 6px;
  background: linear-gradient(180deg, #87929a, #58636c);
}

.custom-select-dropdown::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, #aab4bb, #707b84);
}

.media-upload-row {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-top: 4px;
}

.preview-box {
  background: rgba(8, 14, 26, 0.85);
  border: 1px dashed rgba(56, 189, 248, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  transition: all 0.25s ease;
}

.preview-box:hover {
  border-color: #00f0ff;
  box-shadow: 0 0 10px rgba(0, 240, 255, 0.2);
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.file-input {
  display: none;
}

.avatar-preview {
  width: 76px;
  height: 76px;
  border-radius: 8px;
}

.floorplan-preview {
  width: 120px;
  height: 76px;
  border-radius: 6px;
}

.reupload-btn {
  height: 38px;
  padding: 0 16px;
  background: rgba(56, 189, 248, 0.08);
  border: 1px solid rgba(56, 189, 248, 0.35);
  border-radius: 6px;
  color: #38bdf8;
  font-size: 13px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  cursor: pointer;
  transition: all 0.25s ease;
}

.reupload-btn:hover {
  background: rgba(56, 189, 248, 0.18);
  border-color: #00f0ff;
  color: #00f0ff;
  box-shadow: 0 0 14px rgba(0, 240, 255, 0.3);
}

.panel-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  padding: 18px 28px;
  border-top: 1px solid rgba(56, 189, 248, 0.18);
  background: rgba(15, 23, 42, 0.4);
}

.btn-cancel {
  height: 40px;
  padding: 0 22px;
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 6px;
  color: #94a3b8;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.25s ease;
}

.btn-cancel:hover {
  background: rgba(51, 65, 85, 0.7);
  border-color: #94a3b8;
  color: #f1f5f9;
}

.btn-submit {
  height: 40px;
  padding: 0 28px;
  background: linear-gradient(135deg, #0284c7 0%, #00f0ff 100%);
  border: none;
  border-radius: 6px;
  color: #04101e;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.5px;
  cursor: pointer;
  box-shadow: 0 0 15px rgba(0, 240, 255, 0.4);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.25s ease;
}

.btn-submit:hover {
  background: linear-gradient(135deg, #0369a1 0%, #38bdf8 100%);
  box-shadow: 0 0 25px rgba(0, 240, 255, 0.65);
  transform: translateY(-1px);
}

.btn-submit:active {
  transform: translateY(0);
}

@media (max-width: 680px) {
  .form-grid-2 {
    grid-template-columns: 1fr;
  }
  .panel-body {
    padding: 16px;
  }
  .panel-header,
  .panel-footer {
    padding: 16px;
  }
}
</style>
