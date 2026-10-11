<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

/* ===== 从 sessionStorage 读取三个模块的星星（关闭标签页后清零） ===== */
const hanziStars = ref(0) // 汉字森林
const idiomStars = ref(0) // 成语乐园
const poemStars = ref(0) // 古诗村

function loadStars() {
  hanziStars.value = Number(sessionStorage.getItem('hanziStars') || 0)
  idiomStars.value = Number(sessionStorage.getItem('idiomStars') || 0)
  poemStars.value = Number(sessionStorage.getItem('poemStars') || 0)
}

/* ===== 总星星 ===== */
const totalStars = computed(() => hanziStars.value + idiomStars.value + poemStars.value)

/* ===== 等级：按总星星划分 ===== */
const level = computed(() => {
  const t = totalStars.value
  if (t > 60) return { icon: '🏆', name: '诗词大师' }
  if (t >= 31) return { icon: '🌳', name: '文字冒险家' }
  if (t >= 11) return { icon: '🌿', name: '语文小达人' }
  return { icon: '🌱', name: '初级探索者' }
})

/* ===== 距离下一级的进度（百分比） ===== */
const levelProgress = computed(() => {
  const t = totalStars.value
  if (t > 60) return 100
  if (t >= 31) return Math.round(((t - 30) / 30) * 100) // 31~60 -> 目标 61
  if (t >= 11) return Math.round(((t - 10) / 20) * 100) // 11~30 -> 目标 31
  return Math.round((t / 11) * 100) // 0~10 -> 目标 11
})

/* ===== 徽章系统 ===== */
const badges = computed(() => [
  { icon: '🌱', name: '初次探索', desc: '完成第一次游戏', earned: totalStars.value >= 1 },
  { icon: '📜', name: '诗词收藏家', desc: '累计 5 颗诗词星', earned: poemStars.value >= 5 },
  { icon: '🏝️', name: '成语达人', desc: '累计 5 颗成语星', earned: idiomStars.value >= 5 },
])

function goHome() {
  router.push('/')
}

// 收到游戏页的 starUpdate 事件时重新读取星星，实时刷新星星/等级/徽章
function onStarUpdate() {
  loadStars()
}

onMounted(() => {
  loadStars()
  window.addEventListener('starUpdate', onStarUpdate)
})

onBeforeUnmount(() => {
  window.removeEventListener('starUpdate', onStarUpdate)
})
</script>

<template>
  <div class="growth-page">
    <!-- 漂浮装饰 -->
    <div class="float-deco deco-1">⭐</div>
    <div class="float-deco deco-2">✨</div>
    <div class="float-deco deco-3">🎈</div>
    <div class="float-deco deco-4">🌟</div>

    <!-- 顶部栏 -->
    <header class="top-bar">
      <button class="back-btn" @click="goHome">🏠</button>
      <h1 class="title">⭐ 我的成长</h1>
      <div class="star-box">
        <span class="star">⭐</span>
        <span class="star-count">{{ totalStars }}</span>
      </div>
    </header>

    <!-- 探险家名片 -->
    <section class="explorer-card">
      <div class="avatar">🐰</div>
      <div class="explorer-name">小小文字探险家</div>
      <div class="level-badge">
        <span class="level-icon">{{ level.icon }}</span>
        <span class="level-name">{{ level.name }}</span>
      </div>
      <!-- 等级进度条 -->
      <div class="level-bar">
        <div class="level-bar-fill" :style="{ width: levelProgress + '%' }"></div>
      </div>
      <div class="level-tip" v-if="totalStars <= 60">再得几颗星就能升级啦！</div>
      <div class="level-tip" v-else>你已经是最高等级啦！</div>
    </section>

    <!-- 三个模块的星星 -->
    <section class="stars-grid">
      <div class="star-card hanzi">
        <div class="star-card-icon">⭐</div>
        <div class="star-card-count">{{ hanziStars }}</div>
        <div class="star-card-name">汉字星</div>
      </div>
      <div class="star-card idiom">
        <div class="star-card-icon">📖</div>
        <div class="star-card-count">{{ idiomStars }}</div>
        <div class="star-card-name">成语星</div>
      </div>
      <div class="star-card poem">
        <div class="star-card-icon">🌙</div>
        <div class="star-card-count">{{ poemStars }}</div>
        <div class="star-card-name">诗词星</div>
      </div>
    </section>

    <!-- 徽章墙 -->
    <section class="badge-section">
      <h2 class="section-title">🏅 我的徽章</h2>
      <div class="badge-grid">
        <div
          v-for="(b, i) in badges"
          :key="b.name"
          class="badge-card"
          :class="{ earned: b.earned }"
          :style="{ '--delay': i * 0.15 + 's' }"
        >
          <div class="badge-icon">{{ b.earned ? b.icon : '🔒' }}</div>
          <div class="badge-name">{{ b.name }}</div>
          <div class="badge-desc">{{ b.desc }}</div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.growth-page {
  position: relative;
  min-height: 100vh;
  background: linear-gradient(180deg, #ffccbc 0%, #ffab91 45%, #ff7043 100%);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 16px 40px;
}

/* ===== 漂浮装饰 ===== */
.float-deco {
  position: absolute;
  font-size: 34px;
  opacity: 0.8;
  animation: float-swing 3s ease-in-out infinite;
  pointer-events: none;
  z-index: 1;
}

.deco-1 { top: 12%; left: 8%; }
.deco-2 { top: 20%; right: 10%; font-size: 26px; animation-delay: -0.8s; }
.deco-3 { top: 55%; left: 6%; font-size: 30px; animation-delay: -1.5s; }
.deco-4 { top: 68%; right: 8%; animation-delay: -2.2s; }

@keyframes float-swing {
  0%, 100% { transform: translateY(0) rotate(-6deg); }
  50% { transform: translateY(-12px) rotate(6deg); }
}

/* ===== 顶部栏 ===== */
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 5;
  max-width: 720px;
  width: 100%;
}

.back-btn {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  background: #fff;
  font-size: 26px;
  box-shadow: 0 4px 0 #d84315, 0 6px 12px rgba(0, 0, 0, 0.15);
  transition: transform 0.15s ease;
}

.back-btn:active {
  transform: translateY(3px);
  box-shadow: 0 1px 0 #d84315;
}

.title {
  font-size: clamp(24px, 5vw, 36px);
  font-weight: 900;
  color: #d84315;
  text-shadow: 2px 2px 0 #fff, 4px 4px 0 rgba(0, 0, 0, 0.1);
}

.star-box {
  background: #fff8e1;
  border: 3px solid #ffc107;
  border-radius: 16px;
  padding: 6px 14px;
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 4px 0 #ffa000;
}

.star { font-size: 24px; }

.star-count {
  font-size: 22px;
  font-weight: 800;
  color: #f57f17;
}

/* ===== 探险家名片 ===== */
.explorer-card {
  z-index: 3;
  margin-top: 16px;
  background: #fff;
  border-radius: 24px;
  border: 4px solid #ff8a65;
  box-shadow: 0 6px 0 #e64a19, 0 10px 20px rgba(0, 0, 0, 0.12);
  padding: 20px 28px;
  text-align: center;
  max-width: 460px;
  width: 100%;
}

.avatar {
  font-size: 64px;
  animation: avatar-hop 2.4s ease-in-out infinite;
  display: inline-block;
  filter: drop-shadow(2px 4px 4px rgba(0, 0, 0, 0.2));
}

@keyframes avatar-hop {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.explorer-name {
  font-size: clamp(20px, 4.5vw, 26px);
  font-weight: 900;
  color: #5d4037;
  margin-top: 4px;
}

.level-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  background: #fff8e1;
  border: 3px solid #ffc107;
  border-radius: 24px;
  padding: 8px 20px;
  box-shadow: 0 3px 0 #ffa000;
}

.level-icon { font-size: 26px; }

.level-name {
  font-size: 19px;
  font-weight: 900;
  color: #f57f17;
}

/* 等级进度条 */
.level-bar {
  margin-top: 14px;
  height: 18px;
  background: #fbe9e7;
  border-radius: 10px;
  overflow: hidden;
  border: 2px solid #ffccbc;
}

.level-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #ffd54f 0%, #ffb300 100%);
  border-radius: 8px;
  transition: width 0.6s ease;
}

.level-tip {
  margin-top: 8px;
  font-size: 14px;
  font-weight: 700;
  color: #8d6e63;
}

/* ===== 星星卡片 ===== */
.stars-grid {
  z-index: 3;
  margin-top: 18px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  max-width: 460px;
  width: 100%;
}

.star-card {
  background: #fff;
  border-radius: 22px;
  padding: 16px 8px;
  text-align: center;
  border: 4px solid;
  animation: card-pop 0.4s ease both;
}

@keyframes card-pop {
  0% { transform: scale(0.7); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

.star-card.hanzi {
  border-color: #81c784;
  box-shadow: 0 5px 0 #43a047;
}

.star-card.idiom {
  border-color: #ffb74d;
  box-shadow: 0 5px 0 #f57c00;
  animation-delay: 0.1s;
}

.star-card.poem {
  border-color: #ce93d8;
  box-shadow: 0 5px 0 #8e24aa;
  animation-delay: 0.2s;
}

.star-card-icon { font-size: 34px; }

.star-card-count {
  font-size: 30px;
  font-weight: 900;
  color: #424242;
  margin-top: 2px;
}

.star-card-name {
  font-size: 14px;
  font-weight: 800;
  color: #757575;
  margin-top: 2px;
}

/* ===== 徽章墙 ===== */
.badge-section {
  z-index: 3;
  margin-top: 22px;
  max-width: 460px;
  width: 100%;
}

.section-title {
  font-size: clamp(19px, 4vw, 24px);
  font-weight: 900;
  color: #fff;
  text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.15);
  text-align: center;
  margin-bottom: 12px;
}

.badge-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}

.badge-card {
  background: rgba(255, 255, 255, 0.55);
  border-radius: 22px;
  padding: 16px 8px;
  text-align: center;
  border: 4px dashed rgba(255, 255, 255, 0.8);
  animation: card-pop 0.4s ease both;
  animation-delay: var(--delay);
}

.badge-card.earned {
  background: #fff;
  border: 4px solid #ffd54f;
  box-shadow: 0 5px 0 #ffb300, 0 8px 14px rgba(0, 0, 0, 0.15);
}

.badge-icon {
  font-size: 38px;
  filter: grayscale(0);
}

.badge-card:not(.earned) .badge-icon {
  filter: grayscale(1);
  opacity: 0.6;
}

.badge-name {
  font-size: 14px;
  font-weight: 900;
  color: #5d4037;
  margin-top: 4px;
}

.badge-card.earned .badge-name {
  color: #e65100;
}

.badge-desc {
  font-size: 11px;
  font-weight: 600;
  color: #8d6e63;
  margin-top: 2px;
}
</style>
