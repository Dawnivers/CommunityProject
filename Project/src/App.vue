<template>
  <RouteMenu />
  <RouterView />

  <edit v-if="dataStore.showEdit" @close="dataStore.closeShowEdit"> </edit>

  <keep-alive>
    <CesiumView></CesiumView>
  </keep-alive>
</template>

<script setup>
import CesiumView from './views/CesiumView.vue';
import RouteMenu from './components/RouteMenu.vue';
import edit from './components/edit.vue';
import { useMapData } from '@/stores/counter.js';

const dataStore = useMapData();
</script>
<style scoped></style>
