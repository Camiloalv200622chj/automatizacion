<script setup lang="ts">
import { ref, onMounted } from 'vue';
import EntitySelector from './components/EntitySelector.vue';
import DynamicForm from './components/DynamicForm.vue';
import Dashboard from './components/Dashboard.vue';
import Login from './components/Login.vue';

// 'selector' | 'form' | 'dashboard' | 'login'
const view = ref<'selector' | 'form' | 'dashboard' | 'login'>('selector');
const selectedEntity = ref<string | null>(null);
const isSupervisorLoggedIn = ref(false);

onMounted(() => {
  const token = localStorage.getItem('supervisorToken');
  if (token) isSupervisorLoggedIn.value = true;
});

const handleEntitySelect = (entity: string) => {
  selectedEntity.value = entity;
  view.value = 'form';
};

const goHome = () => {
  selectedEntity.value = null;
  view.value = 'selector';
};

const goToDashboard = () => {
  view.value = isSupervisorLoggedIn.value ? 'dashboard' : 'login';
};

const handleLoginSuccess = () => {
  isSupervisorLoggedIn.value = true;
  view.value = 'dashboard';
};

const logout = () => {
  localStorage.removeItem('supervisorToken');
  localStorage.removeItem('supervisorData');
  isSupervisorLoggedIn.value = false;
  view.value = 'selector';
};
</script>

<template>
  <div class="app-root">
    <!-- ENTITY SELECTOR: full page landing -->
    <EntitySelector
      v-if="view === 'selector'"
      @select="handleEntitySelect"
      @go-dashboard="goToDashboard"
    />

    <!-- DYNAMIC FORM: after entity selected -->
    <div v-else-if="view === 'form'" class="form-shell">
      <!-- reuse portal-style header -->
      <header class="form-header">
        <div class="logo-area" @click="goHome" style="cursor:pointer">
          <div class="logo-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
              <path d="M11.644 1.59a.75.75 0 01.712 0l9.75 5.25a.75.75 0 010 1.32l-9.75 5.25a.75.75 0 01-.712 0l-9.75-5.25a.75.75 0 010-1.32l9.75-5.25z"/>
              <path d="M3.265 10.602l7.668 4.129a2.25 2.25 0 002.134 0l7.668-4.13 1.37.739a.75.75 0 010 1.32l-9.75 5.25a.75.75 0 01-.71 0l-9.75-5.25a.75.75 0 010-1.32l1.37-.738z"/>
              <path d="M10.933 19.231l-7.668-4.13-1.37.739a.75.75 0 000 1.32l9.75 5.25c.221.12.489.12.71 0l9.75-5.25a.75.75 0 000-1.32l-1.37-.738-7.668 4.13a2.25 2.25 0 01-2.134-.001z"/>
            </svg>
          </div>
          <div>
            <span class="logo-name">SENA</span>
            <span class="logo-sub">SERVICIO NACIONAL DE APRENDIZAJE</span>
          </div>
        </div>
        <div class="form-nav">
          <button class="btn-back-header" @click="goHome">← Volver al Portal</button>
        </div>
      </header>
      <div class="form-body">
        <DynamicForm :entity="selectedEntity!" />
      </div>
    </div>

    <!-- LOGIN: supervisor access -->
    <div v-else-if="view === 'login'" class="centered-view">
      <Login @login-success="handleLoginSuccess" />
      <button class="btn-link-back" @click="goHome">← Volver al inicio</button>
    </div>

    <!-- DASHBOARD: supervisor panel -->
    <div v-else-if="view === 'dashboard'" class="dashboard-shell">
      <header class="form-header">
        <div class="logo-area" @click="goHome" style="cursor:pointer">
          <div class="logo-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
              <path d="M11.644 1.59a.75.75 0 01.712 0l9.75 5.25a.75.75 0 010 1.32l-9.75 5.25a.75.75 0 01-.712 0l-9.75-5.25a.75.75 0 010-1.32l9.75-5.25z"/>
              <path d="M3.265 10.602l7.668 4.129a2.25 2.25 0 002.134 0l7.668-4.13 1.37.739a.75.75 0 010 1.32l-9.75 5.25a.75.75 0 01-.71 0l-9.75-5.25a.75.75 0 010-1.32l1.37-.738z"/>
              <path d="M10.933 19.231l-7.668-4.13-1.37.739a.75.75 0 000 1.32l9.75 5.25c.221.12.489.12.71 0l9.75-5.25a.75.75 0 000-1.32l-1.37-.738-7.668 4.13a2.25 2.25 0 01-2.134-.001z"/>
            </svg>
          </div>
          <div>
            <span class="logo-name">SENA</span>
            <span class="logo-sub">SERVICIO NACIONAL DE APRENDIZAJE</span>
          </div>
        </div>
        <div class="form-nav">
          <span class="supervisor-badge">Panel Supervisor</span>
          <button class="btn-logout" @click="logout">Cerrar Sesión</button>
          <button class="btn-back-header" @click="goHome">← Portal</button>
        </div>
      </header>
      <Dashboard />
    </div>
  </div>
</template>

<style>
/* Reset global */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body, #app { height: 100%; width: 100%; }
body { font-family: 'Inter', 'Segoe UI', sans-serif; background: #f5f7f5; }
</style>

<style scoped>
.app-root {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Shared header */
.form-header {
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 0 2.5rem;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 10;
  flex-shrink: 0;
}
.logo-area { display: flex; align-items: center; gap: 0.75rem; }
.logo-icon {
  width: 38px; height: 38px;
  background: #39A900; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  color: white;
}
.logo-name { display: block; font-weight: 800; font-size: 1rem; color: #1a1a1a; letter-spacing: 0.05em; line-height: 1; }
.logo-sub { display: block; font-size: 0.6rem; color: #6b7280; letter-spacing: 0.08em; text-transform: uppercase; margin-top: 1px; }

.form-nav { display: flex; align-items: center; gap: 1rem; }
.btn-back-header {
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  color: #374151;
  padding: 0.4rem 1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}
.btn-back-header:hover { background: #e5e7eb; }

.btn-logout {
  background: #fee2e2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 0.4rem 1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}
.btn-logout:hover { background: #fecaca; }

.supervisor-badge {
  font-size: 0.78rem;
  font-weight: 700;
  background: #f0fdf4;
  color: #39A900;
  border: 1px solid #bbf7d0;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
}

/* Form shell */
.form-shell, .dashboard-shell {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #f5f7f5;
}
.form-body {
  flex: 1;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 3rem 1rem;
}

/* Login centered */
.centered-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #f5f7f5;
  gap: 1.5rem;
}
.btn-link-back {
  background: none;
  border: none;
  color: #6b7280;
  font-size: 0.85rem;
  cursor: pointer;
  text-decoration: underline;
}
</style>
