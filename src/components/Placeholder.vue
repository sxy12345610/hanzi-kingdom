<script setup>
import { useRouter } from 'vue-router'

defineProps({
  title: {
    type: String,
    default: '模块开发中',
  },
  icon: {
    type: String,
    default: '🚧',
  },
  color: {
    type: String,
    default: '#9c27b0',
  },
  desc: {
    type: String,
    default: '这个模块正在建设中，敬请期待！',
  },
})

const router = useRouter()

function goHome() {
  router.push('/')
}
</script>

<template>
  <div class="placeholder-page" :style="{ '--theme-color': color }">
    <div class="card">
      <div class="icon">{{ icon }}</div>
      <h2 class="title">{{ title }}</h2>
      <p class="desc">{{ desc }}</p>
      <button class="back-btn" @click="goHome">🏠 返回首页</button>
    </div>
  </div>
</template>

<style scoped>
.placeholder-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f0f4ff 0%, #e8f5e9 100%);
  padding: 20px;
}

.card {
  background: #fff;
  border-radius: 28px;
  padding: 48px 40px;
  text-align: center;
  border: 5px solid var(--theme-color);
  box-shadow: 0 8px 0 var(--theme-color), 0 16px 32px rgba(0, 0, 0, 0.12);
  max-width: 460px;
  width: 100%;
}

.icon {
  font-size: 88px;
  margin-bottom: 16px;
  animation: wobble 2s ease-in-out infinite;
}

@keyframes wobble {
  0%, 100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(-8deg);
  }
  75% {
    transform: rotate(8deg);
  }
}

.title {
  font-size: 32px;
  color: var(--theme-color);
  margin-bottom: 12px;
  font-weight: 800;
}

.desc {
  font-size: 16px;
  color: #555;
  margin-bottom: 28px;
  line-height: 1.6;
}

.back-btn {
  background: var(--theme-color);
  color: #fff;
  font-size: 18px;
  font-weight: 700;
  padding: 14px 36px;
  border-radius: 30px;
  box-shadow: 0 5px 0 rgba(0, 0, 0, 0.15);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.back-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 7px 0 rgba(0, 0, 0, 0.15);
}

.back-btn:active {
  transform: translateY(2px);
  box-shadow: 0 3px 0 rgba(0, 0, 0, 0.15);
}
</style>
