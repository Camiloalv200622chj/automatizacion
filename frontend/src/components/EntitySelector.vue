<script setup lang="ts">
const entities = [
  { id: 'aportes', name: 'Aportes en Línea', url: 'https://empresas.aportesenlinea.com' },
  { id: 'miplanilla', name: 'miplanilla.com', url: 'https://www.miplanilla.com' },
  { id: 'enlace', name: 'Enlace Operativo', url: 'https://www.enlace-apb.com' },
  { id: 'soi', name: 'SOI', url: 'https://servicio.nuevosoi.com.co' }
];

const emit = defineEmits(['select', 'close']);
</script>

<template>
  <div class="modal-overlay" @click.self="emit('close')">
    <div class="modal-content glass">
      <div class="modal-header">
        <h2>Selecciona la Entidad</h2>
        <button class="close-btn" @click="emit('close')">&times;</button>
      </div>
      
      <div class="entity-grid">
        <div 
          v-for="entity in entities" 
          :key="entity.id" 
          class="entity-card"
          @click="emit('select', entity.id)"
        >
          <div class="entity-icon">✨</div>
          <h3>{{ entity.name }}</h3>
          <p>{{ entity.url.replace('https://', '') }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  width: 100%;
  max-width: 600px;
  padding: 2rem;
  animation: slideUp 0.3s ease-out;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 2rem;
  color: white;
  cursor: pointer;
  opacity: 0.5;
}

.close-btn:hover { opacity: 1; }

.entity-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.entity-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s;
}

.entity-card:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: #3b82f6;
  transform: translateY(-5px);
}

.entity-icon {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.entity-card h3 { margin: 0 0 0.5rem 0; font-size: 1.1rem; }
.entity-card p { margin: 0; font-size: 0.8rem; opacity: 0.5; }

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@media (max-width: 480px) {
  .entity-grid { grid-template-columns: 1fr; }
}
</style>
