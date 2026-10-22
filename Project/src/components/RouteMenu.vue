<template>
  <nav class="route-menu" aria-label="功能导航">
    <RouterLink
      v-for="item in menuItems"
      :key="item.path"
      :to="item.path"
      class="menu-item"
      active-class="is-active"
    >
      {{ item.label }}
    </RouterLink>
  </nav>
</template>

<script setup>
import { RouterLink } from 'vue-router';

const menuItems = [
  { label: '楼房分户', path: '/setBuild' },
  { label: '房户信息', path: '/setInfo' },
  { label: '信息查看', path: '/scanInfo' },
];
</script>

<style scoped>
.route-menu {
  position: fixed;
  top: 16px;
  left: 50%;
  z-index: 1100;
  display: flex;
  gap: 4px;
  padding: 4px;
  transform: translateX(-50%);
  border: 1px solid rgba(56, 130, 246, 0.28);
  border-radius: 10px;
  background: rgba(9, 17, 33, 0.88);
  box-shadow: 0 8px 24px rgba(3, 10, 25, 0.45);
  backdrop-filter: blur(12px);
}

.menu-item {
  padding: 8px 18px;
  border-radius: 7px;
  color: #9fb4d0;
  font-size: 14px;
  text-decoration: none;
  white-space: nowrap;
  transition:
    color 0.18s ease,
    background 0.18s ease;
}

.menu-item:hover {
  color: #e6f4ff;
  background: rgba(56, 130, 246, 0.16);
}

.menu-item.is-active {
  color: #ffffff;
  background: linear-gradient(135deg, #38bdf8, #2563eb);
  box-shadow: 0 3px 10px rgba(37, 99, 235, 0.35);
}

@media (max-width: 560px) {
  .route-menu {
    top: 10px;
    width: calc(100vw - 20px);
  }

  .menu-item {
    flex: 1;
    padding: 8px 6px;
    text-align: center;
  }
}
</style>
