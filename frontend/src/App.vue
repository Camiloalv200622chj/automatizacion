<script setup lang="ts">
import { ref } from 'vue';
import EntitySelector from './components/EntitySelector.vue';
import DynamicForm from './components/DynamicForm.vue';

const selectedEntity = ref<string | null>(null);
const showModal = ref(false);

const openModal = () => {
  showModal.value = true;
};

const handleEntitySelect = (entity: string) => {
  selectedEntity.value = entity;
  showModal.value = false;
};

const reset = () => {
  selectedEntity.value = null;
};
</script>

<template>
  <div class="container">
    <header>
      <h1 class="title-gradient">Certificados Automatizados</h1>
      <p class="subtitle">Gestión mensual de aportes y seguridad social</p>
    </header>

    <main>
      <div v-if="!selectedEntity" class="hero-selection">
        <div class="glass p-8">
          <p class="mb-6 opacity-80">Selecciona una entidad para comenzar el proceso de descarga mensual.</p>
          <button @click="openModal" class="btn-primary">Nueva Solicitud</button>
        </div>
      </div>

      <div v-else class="form-container">
        <button @click="reset" class="btn-back">← Volver al inicio</button>
        <DynamicForm :entity="selectedEntity" />
      </div>
    </main>

    <!-- Modal para selección de entidad -->
    <EntitySelector 
      v-if="showModal" 
      @close="showModal = false" 
      @select="handleEntitySelect" 
    />
  </div>
</template>

<style scoped>
.container {
  min-height: 80vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.subtitle {
  font-size: 1.2rem;
  opacity: 0.7;
  margin-top: -1.5rem;
  margin-bottom: 4rem;
}

.p-8 { padding: 2rem; }
.mb-6 { margin-bottom: 1.5rem; }

.btn-back {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  padding: 8px 16px;
  border-radius: 8px;
  margin-bottom: 2rem;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-back:hover {
  background: rgba(255, 255, 255, 0.1);
}
</style>
