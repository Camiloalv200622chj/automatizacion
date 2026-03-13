<script setup lang="ts">
import { ref } from 'vue';
import axios from 'axios';

const emit = defineEmits(['login-success']);

const email = ref('');
const password = ref('');
const loading = ref(false);
const error = ref<string | null>(null);

const handleLogin = async () => {
  loading.value = true;
  error.value = null;
  try {
    const response = await axios.post('/api/supervisores/login', {
      correo: email.value,
      password: password.value
    });
    localStorage.setItem('supervisorToken', response.data.token);
    localStorage.setItem('supervisorData', JSON.stringify(response.data));
    emit('login-success', response.data);
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Error al iniciar sesión';
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="login-wrapper">
    <div class="login-brand">
      <div class="brand-icon">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
          <path d="M11.644 1.59a.75.75 0 01.712 0l9.75 5.25a.75.75 0 010 1.32l-9.75 5.25a.75.75 0 01-.712 0l-9.75-5.25a.75.75 0 010-1.32l9.75-5.25z"/>
          <path d="M3.265 10.602l7.668 4.129a2.25 2.25 0 002.134 0l7.668-4.13 1.37.739a.75.75 0 010 1.32l-9.75 5.25a.75.75 0 01-.71 0l-9.75-5.25a.75.75 0 010-1.32l1.37-.738z"/>
          <path d="M10.933 19.231l-7.668-4.13-1.37.739a.75.75 0 000 1.32l9.75 5.25c.221.12.489.12.71 0l9.75-5.25a.75.75 0 000-1.32l-1.37-.738-7.668 4.13a2.25 2.25 0 01-2.134-.001z"/>
        </svg>
      </div>
      <h1 class="brand-name">SENA</h1>
      <p class="brand-sub">Panel de Supervisión Institucional</p>
    </div>

    <div class="login-card">
      <h2>Acceso Supervisor</h2>
      <p class="login-hint">Ingrese sus credenciales para acceder al panel de control.</p>
      
      <form @submit.prevent="handleLogin">
        <div class="field">
          <label for="login-email">Correo Electrónico</label>
          <input 
            type="email" 
            id="login-email"
            v-model="email" 
            placeholder="ejemplo@sena.edu.co" 
            required 
          />
        </div>
        
        <div class="field">
          <label for="login-pass">Contraseña</label>
          <input 
            type="password" 
            id="login-pass"
            v-model="password" 
            placeholder="••••••••" 
            required 
          />
        </div>
        
        <div v-if="error" class="alert error">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="16"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"/></svg>
          {{ error }}
        </div>
        
        <button type="submit" :disabled="loading" class="btn-primary btn-login">
          {{ loading ? 'Verificando...' : 'Iniciar Sesión' }}
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.login-wrapper {
  width: 100%;
  max-width: 400px;
  text-align: center;
}

.login-brand {
  margin-bottom: 2rem;
}
.brand-icon {
  width: 56px;
  height: 56px;
  background: var(--sena-green);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin: 0 auto 0.75rem;
}
.brand-name {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--gray-900);
  letter-spacing: 0.05em;
  margin: 0;
}
.brand-sub {
  font-size: 0.82rem;
  color: var(--gray-500);
  margin: 0.25rem 0 0 0;
}

.login-card {
  background: white;
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  padding: 2rem;
  text-align: left;
}
.login-card h2 {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--gray-900);
  margin: 0 0 0.3rem 0;
}
.login-hint {
  font-size: 0.82rem;
  color: var(--gray-500);
  margin: 0 0 1.5rem 0;
}

.field {
  margin-bottom: 1.25rem;
}
.field label {
  display: block;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--gray-700);
  margin-bottom: 0.35rem;
}
.field input {
  width: 100%;
  background: var(--gray-50);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
  padding: 0.7rem 0.85rem;
  color: var(--gray-900);
  font-size: 0.88rem;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.field input:focus {
  border-color: var(--sena-green);
  box-shadow: 0 0 0 3px rgba(57,169,0,0.1);
}
.field input::placeholder {
  color: var(--gray-400);
}

.btn-login {
  width: 100%;
  margin-top: 0.5rem;
}

.alert {
  margin-bottom: 1rem;
}
</style>
