<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';

const loading = ref(true);
const error = ref<string | null>(null);
const report = ref<any[]>([]);
const period = ref(new Date().toISOString().substring(0, 7));

const fetchStatus = async () => {
    loading.value = true;
    error.value = null;
    try {
        const response = await axios.get(`/api/automation/status?period=${period.value}`);
        report.value = response.data.report;
    } catch (err: any) {
        error.value = 'Error al cargar el estado de cumplimiento';
        console.error(err);
    } finally {
        loading.value = false;
    }
};

onMounted(fetchStatus);
</script>

<template>
  <div class="dashboard glass p-6">
    <div class="flex justify-between items-center mb-8">
        <h2 class="text-xl font-bold text-blue-400">Panel de Seguimiento Mensual</h2>
        <input type="month" v-model="period" @change="fetchStatus" class="date-input" />
    </div>

    <div v-if="loading" class="text-center py-10 opacity-50">
        Cargando datos de cumplimiento...
    </div>

    <div v-else-if="error" class="alert error">
        {{ error }}
    </div>

    <div v-else class="table-container">
        <table>
            <thead>
                <tr>
                    <th>Contratista</th>
                    <th>Documento</th>
                    <th>Estado</th>
                    <th>Fecha Proceso</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="item in report" :key="item.documento">
                    <td>{{ item.nombre }}</td>
                    <td>{{ item.documento }}</td>
                    <td>
                        <span :class="['badge', item.completado ? 'bg-green' : 'bg-red']">
                            {{ item.completado ? 'Completado' : 'Pendiente' }}
                        </span>
                    </td>
                    <td>{{ item.fecha ? new Date(item.fecha).toLocaleString() : '---' }}</td>
                </tr>
            </tbody>
        </table>

        <div v-if="report.length === 0" class="text-center py-6 opacity-40">
            No hay contratistas registrados en el sistema.
        </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard {
    max-width: 900px;
    margin: 0 auto;
    border-radius: 16px;
}

.flex { display: flex; }
.justify-between { justify-content: space-between; }
.items-center { align-items: center; }
.mb-8 { margin-bottom: 2rem; }
.p-6 { padding: 1.5rem; }

.date-input {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: white;
    padding: 8px 12px;
    border-radius: 8px;
    outline: none;
}

table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
}

th, td {
    padding: 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

th {
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 1px;
    opacity: 0.6;
}

.badge {
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
}

.bg-green { background: rgba(34, 197, 94, 0.2); color: #4ade80; }
.bg-red { background: rgba(239, 68, 68, 0.2); color: #f87171; }

.text-center { text-align: center; }
.py-10 { padding: 2.5rem 0; }
.py-6 { padding: 1.5rem 0; }
.opacity-50 { opacity: 0.5; }
.opacity-40 { opacity: 0.4; }
.text-blue-400 { color: #60a5fa; }
.font-bold { font-weight: 700; }
.text-xl { font-size: 1.25rem; }

.alert {
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 1.5rem;
}
.error { background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.2); color: #f87171; }
</style>
