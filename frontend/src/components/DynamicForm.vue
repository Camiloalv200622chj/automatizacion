<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import axios from 'axios';

const props = defineProps<{
  entity: string
}>();

const loading = ref(false);
const error = ref<string | null>(null);
const success = ref(false);
const formData = reactive<Record<string, any>>({});

const entityFields: Record<string, any[]> = {
  aportes: [
    { name: 'tipoDocumento', label: 'Tipo de Documento', type: 'select', options: ['CC', 'CE', 'TI', 'PE', 'PPT'] },
    { name: 'numeroDocumento', label: 'Número de Documento', type: 'text' },
    { name: 'fechaExpedicion', label: 'Fecha de Expedición', type: 'date' },
    { name: 'eps', label: 'EPS', type: 'text', placeholder: 'Ej: Sanitas' },
    { name: 'periodoInicio', label: 'Mes Inicio', type: 'month' },
    { name: 'periodoFin', label: 'Mes Fin', type: 'month' }
  ],
  miplanilla: [
    { name: 'tipoDocumento', label: 'Tipo de Documento', type: 'select', options: ['CC', 'NIT', 'CE'] },
    { name: 'numeroDocumento', label: 'Número de Documento', type: 'text' },
    { name: 'periodo', label: 'Periodo (Mes y Año)', type: 'month' }
  ],
  enlace: [
    { name: 'tipoDocumento', label: 'Tipo de Documento', type: 'select', options: ['CC', 'CE', 'TI'] },
    { name: 'numeroDocumento', label: 'Número de Documento', type: 'text' },
    { name: 'periodo', label: 'Año y Mes (aaaa-mm)', type: 'month' },
    { name: 'tipoReporte', label: 'Tipo de Reporte', type: 'select', options: ['Pago sin valores', 'Pago con valores'] }
  ],
  soi: [
    { name: 'tipoDocumento', label: 'Tipo de Documento', type: 'select', options: ['CC', 'CE', 'TI'] },
    { name: 'numeroDocumento', label: 'Número de Documento', type: 'text' },
    { name: 'eps', label: 'EPS (Nombre completo)', type: 'text', placeholder: 'Ej: EPS SANITAS' },
    { name: 'periodo', label: 'Periodo (Mes y Año)', type: 'month' }
  ]
};

const currentFields = computed(() => {
  const baseFields = [
    { name: 'nombreCompleto', label: 'Nombre Completo del Contratista', type: 'text', placeholder: 'Ej: Juan Pérez' }
  ];
  return [...baseFields, ...(entityFields[props.entity] || [])];
});

const submitForm = async () => {
    loading.value = true;
    error.value = null;
    success.value = false;
    
    try {
        const response = await axios.post('/api/automation/run-entity', {
            entity: props.entity,
            data: {
                ...formData,
                saveProfile: formData.saveProfile // Explicitly include the flag
            }
        });
        success.value = true;
        console.log('Respuesta del servidor:', response.data);
    } catch (err: any) {
        error.value = err.response?.data?.message || 'Error al procesar la solicitud';
        console.error('Error:', err);
    } finally {
        loading.value = false;
    }
};
</script>

<template>
  <div class="dynamic-form glass">
    <h2>Formulario: {{ entity.split('_').join(' ').toUpperCase() }}</h2>
    
    <div v-if="success" class="alert success">
        ¡Solicitud enviada con éxito! El proceso de generación ha comenzado.
    </div>

    <div v-if="error" class="alert error">
        {{ error }}
    </div>

    <form v-if="!success" @submit.prevent="submitForm">
      <div v-for="field in currentFields" :key="field.name" class="form-group">
        <label :for="field.name">{{ field.label }}</label>
        
        <select v-if="field.type === 'select'" v-model="formData[field.name]" :id="field.name" required>
          <option value="" disabled>Seleccione una opción</option>
          <option v-for="opt in field.options" :key="opt" :value="opt">{{ opt }}</option>
        </select>

        <input 
          v-else 
          :type="field.type" 
          v-model="formData[field.name]" 
          :id="field.name"
          :placeholder="field.placeholder || ''"
          required
        />
      </div>

      <div class="form-group checkbox-group">
        <label class="checkbox-label">
          <input type="checkbox" v-model="formData.saveProfile" />
          Recordar mis datos para futuras consultas
        </label>
      </div>

      <button type="submit" class="btn-primary w-full mt-4" :disabled="loading">
        {{ loading ? 'Procesando...' : 'Generar Certificado ✨' }}
      </button>
    </form>
  </div>
</template>

<style scoped>
.dynamic-form {
  max-width: 500px;
  margin: 0 auto;
  padding: 2.5rem;
  text-align: left;
}

.form-group {
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

label { font-size: 0.9rem; font-weight: 500; opacity: 0.8; }

input, select {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 12px;
  color: white;
  outline: none;
  transition: border-color 0.3s;
}

input:focus, select:focus {
  border-color: #3b82f6;
}

.w-full { width: 100%; }
.mt-4 { margin-top: 1rem; }

.mt-4 { margin-top: 1rem; }

.checkbox-group {
    margin-top: 1rem;
    flex-direction: row !important;
    align-items: center;
    gap: 0.5rem;
}

.checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    cursor: pointer;
    font-size: 0.9rem;
    color: #94a3b8;
}

.checkbox-label input {
    width: 18px;
    height: 18px;
    cursor: pointer;
}

h2 { margin-top: 0; margin-bottom: 2rem; font-size: 1.5rem; color: #60a5fa; }

.alert {
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 1.5rem;
    font-size: 0.9rem;
}
.success { background: rgba(34, 197, 94, 0.2); border: 1px solid rgba(34, 197, 94, 0.3); color: #4ade80; }
.error { background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.3); color: #f87171; }
</style>
