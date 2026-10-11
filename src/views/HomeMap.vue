<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const entrances = [
  {
    name: '汉字森林',
    icon: '🌳',
    path: '/forest',
    color: '#4caf50',
    desc: '拼拼乐 · 偏旁组合',
  },
  {
    name: '成语乐园',
    icon: '🏝️',
    path: '/idiom',
    color: '#ff9800',
    desc: '看图猜成语 · 故事',
  },
  {
    name: '古诗村',
    icon: '🌙',
    path: '/poem',
    color: '#9c27b0',
    desc: '古诗填空 · 排序',
  },
  {
    name: '我的成长',
    icon: '⭐',
    path: '/growth',
    color: '#f44336',
    desc: '星星 · 徽章 · 记录',
  },
]

function goTo(path) {
  router.push(path)
}
</script>

<template>
  <div class="home-map">
    <!-- 漂浮的云朵 -->
    <div class="cloud cloud-1">☁️</div>
    <div class="cloud cloud-2">☁️</div>
    <div class="cloud cloud-3">☁️</div>
    <div class="cloud cloud-4">☁️</div>

    <!-- 顶部：城堡 + 标题 -->
    <header class="header">
      <div class="castle">🏰</div>
      <h1 class="title">汉字王国</h1>
      <p class="subtitle">小学语文趣味互动益智游戏平台</p>
    </header>

    <!-- 中间：小探险家角色 -->
    <section class="map-area">
      <div class="explorer">🐰</div>
      <div class="ground"></div>
    </section>

    <!-- 下方：四个游戏区域（两列布局） -->
    <nav class="entrances">
      <div
        v-for="(item, index) in entrances"
        :key="item.path"
        class="entrance-card"
        :style="{ '--card-color': item.color, '--delay': index * 0.3 + 's' }"
        @click="goTo(item.path)"
      >
        <div class="card-icon">{{ item.icon }}</div>
        <div class="card-name">{{ item.name }}</div>
        <div class="card-desc">{{ item.desc }}</div>
      </div>
    </nav>
  </div>
</template>

<style scoped>
.home-map {
  position: relative;
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(180deg, #87ceeb 0%, #b0e0e6 40%, #c8f7c5 75%, #98fb98 100%);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 30px 20px 40px;
}

/* ===== 云朵动画 ===== */
.cloud {
  position: absolute;
  font-size: 60px;
  opacity: 0.9;
  animation: float-cloud linear infinite;
  pointer-events: none;
  z-index: 1;
}

.cloud-1 {
  top: 8%;
  left: -10%;
  animation-duration: 40s;
}

.cloud-2 {
  top: 18%;
  left: -15%;
  font-size: 80px;
  animation-duration: 55s;
  animation-delay: -10s;
}

.cloud-3 {
  top: 5%;
  left: -20%;
  font-size: 50px;
  animation-duration: 48s;
  animation-delay: -25s;
}

.cloud-4 {
  top: 25%;
  left: -12%;
  font-size: 70px;
  animation-duration: 62s;
  animation-delay: -35s;
}

@keyframes float-cloud {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(120vw);
  }
}

/* ===== 顶部：城堡 + 标题 ===== */
.header {
  text-align: center;
  z-index: 2;
  margin-bottom: 8px;
}

.castle {
  font-size: clamp(70px, 11vw, 110px);
  animation: castle-bounce 3s ease-in-out infinite;
  filter: drop-shadow(4px 6px 6px rgba(0, 0, 0, 0.2));
  line-height: 1;
}

@keyframes castle-bounce {
  0%, 100% {
    transform: translateY(0) rotate(-2deg);
  }
  50% {
    transform: translateY(-10px) rotate(2deg);
  }
}

.title {
  font-size: clamp(36px, 6vw, 60px);
  font-weight: 900;
  color: #ff6b35;
  text-shadow: 3px 3px 0 #fff, 6px 6px 0 rgba(0, 0, 0, 0.12);
  letter-spacing: 4px;
  margin-top: 4px;
  animation: bounce-title 2s ease-in-out infinite;
}

@keyframes bounce-title {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-6px);
  }
}

.subtitle {
  font-size: clamp(13px, 1.8vw, 18px);
  color: #2d5016;
  margin-top: 6px;
  font-weight: 600;
}

/* ===== 中间：小探险家角色 ===== */
.map-area {
  position: relative;
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 130px;
  z-index: 2;
}

.explorer {
  font-size: clamp(56px, 9vw, 84px);
  animation: explorer-hop 2.4s ease-in-out infinite;
  filter: drop-shadow(2px 4px 4px rgba(0, 0, 0, 0.2));
}

@keyframes explorer-hop {
  0%, 100% {
    transform: translateY(0) scaleX(1);
  }
  25% {
    transform: translateY(-16px) scaleX(1);
  }
  50% {
    transform: translateY(0) scaleX(-1);
  }
  75% {
    transform: translateY(-16px) scaleX(-1);
  }
}

.ground {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 220px;
  height: 28px;
  background: linear-gradient(180deg, #8bc34a 0%, #689f38 100%);
  border-radius: 50% 50% 0 0 / 28px 28px 0 0;
  z-index: -1;
}

/* ===== 下方：四个游戏区域（两列布局） ===== */
.entrances {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18px;
  max-width: 520px;
  width: 100%;
  margin: 12px auto 0;
  z-index: 3;
  padding: 0 10px;
}

.entrance-card {
  background: #fff;
  border-radius: 22px;
  height: 170px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12px 8px;
  text-align: center;
  cursor: pointer;
  border: 4px solid var(--card-color);
  box-shadow: 0 6px 0 var(--card-color), 0 10px 20px rgba(0, 0, 0, 0.15);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  user-select: none;
  animation: card-float 3s ease-in-out infinite;
  animation-delay: var(--delay);
}

@keyframes card-float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-6px);
  }
}

.entrance-card:hover {
  animation-play-state: paused;
  transform: translateY(-10px) scale(1.08);
  box-shadow: 0 12px 0 var(--card-color), 0 18px 28px rgba(0, 0, 0, 0.22);
}

.entrance-card:active {
  animation-play-state: paused;
  transform: translateY(2px) scale(0.96);
  box-shadow: 0 3px 0 var(--card-color), 0 5px 10px rgba(0, 0, 0, 0.15);
}

.card-icon {
  font-size: 48px;
  margin-bottom: 4px;
  transition: transform 0.3s ease;
  line-height: 1;
}

.entrance-card:hover .card-icon {
  transform: scale(1.18) rotate(-6deg);
}

.card-name {
  font-size: 20px;
  font-weight: 800;
  color: var(--card-color);
  margin-bottom: 2px;
}

.card-desc {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}
</style>
