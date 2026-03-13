<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import axios from 'axios';

const props = defineProps<{
  entity: string
}>();

const loading = ref(false);
const searchLoading = ref(false);
const error = ref<string | null>(null);
const success = ref(false);
const now = new Date();
const currentMonthStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;

const formData = reactive<Record<string, any>>({
  tipoDocumento: 'Cédula de ciudadanía',
  numeroDocumento: '',
  periodo: currentMonthStr,
  periodoInicio: currentMonthStr,
  periodoFin: currentMonthStr
});

const entityLabels: Record<string, string> = {
  aportes: 'Aportes en Línea',
  miplanilla: 'miplanilla.com',
  asopagos: 'Asopagos',
  soi: 'SOI – Certificado de Aportes',
};

const entityFields: Record<string, any[]> = {
  aportes: [
    { name: 'fechaExpedicion', label: 'Fecha de Expedición', type: 'date' },
    { name: 'eps', label: 'EPS', type: 'text', placeholder: 'Ej: Sanitas' },
    { name: 'periodoInicio', label: 'Mes Inicio', type: 'month' },
    { name: 'periodoFin', label: 'Mes Fin', type: 'month' }
  ],
  miplanilla: [
    { name: 'periodo', label: 'Periodo Salud (Mes y Año)', type: 'month' },
    { name: 'numeroPlanilla', label: 'Número de Planilla', type: 'text', placeholder: 'Ej: 123456789' },
    { name: 'fechaPago', label: 'Fecha de pago de la planilla', type: 'date' },
    { name: 'valorPagado', label: 'Valor total pagado', type: 'number', placeholder: 'Ej: 150000' }
  ],
  asopagos: [
    { name: 'periodo', label: 'Año y Mes (aaaa-mm)', type: 'month' },
    { name: 'tipoReporte', label: 'Tipo de Reporte', type: 'select', options: ['Reporte de pago sin valores', 'Reporte de pago con valores'] }
  ],
  soi: [
    { name: 'eps', label: 'EPS', type: 'select', options: [
      'Seleccione...','ALIANSALUD EPS','ASMET SALUD','CAPITAL SALUD','CAPRESOCA',
      'COMPENSAR','COOSALUD','FAMISANAR','NUEVA EPS','SANITAS',
      'SALUD TOTAL','SAVIA SALUD','SURA','MUTUAL SER'
    ] },
    { name: 'periodo', label: 'Periodo (Mes y Año)', type: 'month' }
  ]
};

const currentFields = computed(() => {
  const commonFields = [
    { name: 'tipoDocumento', label: 'Tipo de Documento', type: 'select', 
      options: props.entity === 'soi' ? [
        'Cédula de ciudadanía', 'Carné diplomático', 'Cédula de extranjería', 'NIT', 'Pasaporte', 
        'Permiso especial permanencia', 'Permiso por protección temporal', 'Salvo conducto', 'Tarjeta de identidad'
      ] : ['CC', 'CE', 'TI', 'NIT', 'PE', 'PPT'] 
    },
    { name: 'nombreCompleto', label: 'Nombre Completo del Contratista', type: 'text', placeholder: 'Se cargará automáticamente al buscar' }
  ];
  return [...commonFields, ...(entityFields[props.entity] || [])];
});

const searchContratista = async () => {
    if (!formData.numeroDocumento || formData.numeroDocumento.length < 5) return;
    searchLoading.value = true;
    error.value = null;
    try {
        const response = await axios.get(`/api/contratistas/search/${formData.numeroDocumento}`);
        const data = response.data;
        if (data) {
          if (data.nombreCompleto) formData.nombreCompleto = data.nombreCompleto;
          if (data.tipoDocumento) formData.tipoDocumento = data.tipoDocumento;
        }
    } catch (err: any) {
        if (err.response?.status === 404) {
          console.log('Contratista no registrado aún.');
        } else {
          console.error('Error en búsqueda:', err.message);
        }
    } finally {
        searchLoading.value = false;
    }
};

const submitForm = async () => {
    loading.value = true;
    error.value = null;
    success.value = false;
    try {
        await axios.post('/api/automation/run-entity', {
            entity: props.entity,
            data: formData
        });
        success.value = true;
    } catch (err: any) {
        error.value = err.response?.data?.message || 'Error al procesar la solicitud';
    } finally {
        loading.value = false;
    }
};
</script>

<template>
  <div class="form-wrapper">
    <!-- Title section -->
    <div class="form-title-area">
      <span class="form-badge">FORMULARIO DE SOLICITUD</span>
      <h1 class="form-title">{{ entityLabels[entity] || entity.toUpperCase() }}</h1>
      <p class="form-subtitle">Complete los datos del contratista para generar el certificado de aportes correspondiente.</p>
    </div>

    <!-- Card -->
    <div class="form-card">
      <!-- Success -->
      <div v-if="success" class="alert success">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="18"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd"/></svg>
        ¡Solicitud enviada con éxito! El proceso de generación ha comenzado.
      </div>
      <div v-if="error" class="alert error">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="18"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"/></svg>
        {{ error }}
      </div>

      <form v-if="!success" @submit.prevent="submitForm">
        <!-- Document search -->
        <div class="field">
          <label for="numeroDocumento">Número de Documento (Cédula)</label>
          <div class="search-row">
            <input 
              type="text" 
              v-model="formData.numeroDocumento" 
              id="numeroDocumento"
              placeholder="Ingrese número de cédula..."
              required
              @keyup.enter="searchContratista"
              @blur="searchContratista"
            />
            <button type="button" class="btn-search" @click="searchContratista" :disabled="searchLoading" title="Buscar en base de datos">
              <svg v-if="!searchLoading" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="16"><path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clip-rule="evenodd"/></svg>
              <span v-else class="spin-icon"></span>
            </button>
          </div>
        </div>

        <!-- Dynamic fields -->
        <div v-for="field in currentFields" :key="field.name" class="field">
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

        <!-- Submit -->
        <button type="submit" class="btn-primary btn-submit" :disabled="loading">
          <svg v-if="!loading" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="16"><path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z"/><path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z"/></svg>
          <span v-if="loading" class="spin-icon dark"></span>
          {{ loading ? 'Procesando...' : 'Generar Certificado' }}
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.form-wrapper {
  max-width: 560px;
  width: 100%;
  margin: 0 auto;
}

/* Title area */
.form-title-area {
  margin-bottom: 1.5rem;
}
.form-badge {
  display: inline-block;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--sena-green);
  margin-bottom: 0.5rem;
}
.form-title {
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--gray-900);
  margin: 0 0 0.4rem 0;
}
.form-subtitle {
  font-size: 0.88rem;
  color: var(--gray-500);
  line-height: 1.5;
  margin: 0;
}

/* Card */
.form-card {
  background: white;
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  padding: 2rem;
}

/* Fields */
.field {
  margin-bottom: 1.25rem;
}
.field label {
  display: block;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--gray-700);
  margin-bottom: 0.4rem;
}
.field input,
.field select {
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
.field input:focus,
.field select:focus {
  border-color: var(--sena-green);
  box-shadow: 0 0 0 3px rgba(57,169,0,0.1);
}
.field input::placeholder {
  color: var(--gray-400);
}

/* Search row */
.search-row {
  display: flex;
  gap: 0.5rem;
}
.search-row input { flex: 1; }
.btn-search {
  background: var(--sena-green);
  border: none;
  border-radius: var(--radius-md);
  width: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  transition: background 0.2s;
  flex-shrink: 0;
}
.btn-search:hover { background: var(--sena-green-dark); }
.btn-search:disabled { opacity: 0.5; cursor: not-allowed; }

/* Submit */
.btn-submit {
  width: 100%;
  margin-top: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
}

/* Spin icon */
.spin-icon {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
.spin-icon.dark {
  border-color: rgba(255,255,255,0.3);
  border-top-color: white;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Alerts */
.alert {
  margin-bottom: 1.25rem;
}
</style>
