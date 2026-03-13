<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';

const loading = ref(true);
const error = ref<string | null>(null);
const report = ref<any[]>([]);
const period = ref(new Date().toISOString().substring(0, 7));

const fetchStatus = async () => {
    loading.value = true;
    error.value = null;
    try {
        const token = localStorage.getItem('supervisorToken');
        const response = await axios.get(`/api/automation/status?period=${period.value}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        report.value = response.data.report;
    } catch (err: any) {
        error.value = 'No autorizado o error al cargar el reporte';
        console.error(err);
    } finally {
        loading.value = false;
    }
};

const totalCompleted = computed(() => report.value.filter(i => i.completado).length);
const totalPending = computed(() => report.value.filter(i => !i.completado).length);
const total = computed(() => report.value.length);

const formatPeriod = (p: string) => {
    if (!p) return '';
    const [year, month] = p.split('-');
    const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    return `${months[parseInt(month) - 1]} ${year}`;
};

onMounted(fetchStatus);
</script>

<template>
  <div class="dash-page">
    <!-- Stats Bar -->
    <div class="stats-bar">
      <div class="stat-card">
        <span class="stat-num">{{ total }}</span>
        <span class="stat-label">Total Contratistas</span>
      </div>
      <div class="stat-card success">
        <span class="stat-num text-green">{{ totalCompleted }}</span>
        <span class="stat-label">Completados</span>
      </div>
      <div class="stat-card pending">
        <span class="stat-num text-orange">{{ totalPending }}</span>
        <span class="stat-label">Pendientes</span>
      </div>
    </div>

    <!-- Table Section -->
    <div class="table-section">
      <div class="table-header">
        <div>
          <h2 class="table-title">Estado Reciente de Trámites</h2>
          <p class="table-sub">Período: {{ formatPeriod(period) }}</p>
        </div>
        <div class="table-controls">
          <input type="month" v-model="period" @change="fetchStatus" class="month-input" />
          <button @click="fetchStatus" class="btn-refresh">↻ Actualizar</button>
        </div>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <span>Cargando datos de cumplimiento...</span>
      </div>

      <div v-else-if="error" class="error-state">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20"><path fill-rule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clip-rule="evenodd"/></svg>
        {{ error }}
      </div>

      <table v-else>
        <thead>
          <tr>
            <th>CONTRATISTA</th>
            <th>DOCUMENTO</th>
            <th>CONCEPTO</th>
            <th>ESTADO</th>
            <th>FECHA PROCESO</th>
            <th>ACCIÓN</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="report.length === 0">
            <td colspan="6" class="empty-cell">
              No hay contratistas registrados en el sistema para este período.
            </td>
          </tr>
          <tr v-for="item in report" :key="item.documento">
            <td class="td-name">{{ item.nombre }}</td>
            <td class="td-doc">{{ item.documento }}</td>
            <td>{{ item.entidad || '---' }}</td>
            <td>
              <span :class="['badge', item.completado ? 'badge-success' : 'badge-pending']">
                <span class="badge-dot"></span>
                {{ item.completado ? 'Pagado' : 'Pendiente' }}
              </span>
            </td>
            <td class="td-date">{{ item.fecha ? new Date(item.fecha).toLocaleDateString('es-CO') : '---' }}</td>
            <td>
              <button v-if="item.completado" class="btn-download">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="16"><path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z"/><path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z"/></svg>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Bottom Cards -->
    <div class="bottom-cards">
      <div class="info-card">
        <div class="info-card-icon green">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20"><path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z" clip-rule="evenodd"/></svg>
        </div>
        <div>
          <h4>¿Necesita ayuda con sus planillas?</h4>
          <p>Nuestro equipo de soporte está disponible para guiarle en todo el proceso de declaración.</p>
          <a href="#">Consultar guía de usuario →</a>
        </div>
      </div>
      <div class="info-card dark">
        <div class="info-card-icon calendar">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20"><path d="M12.75 12.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM7.5 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM8.25 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM9.75 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM10.5 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM12.75 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM14.25 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM15 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM16.5 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM15 12.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM16.5 13.5a.75.75 0 100-1.5.75.75 0 000 1.5z"/><path fill-rule="evenodd" d="M6.75 2.25A.75.75 0 017.5 3v1.5h9V3A.75.75 0 0118 3v1.5h.75a3 3 0 013 3v11.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V7.5a3 3 0 013-3H6V3a.75.75 0 01.75-.75zm13.5 9a1.5 1.5 0 00-1.5-1.5H5.25a1.5 1.5 0 00-1.5 1.5v7.5a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5v-7.5z" clip-rule="evenodd"/></svg>
        </div>
        <div>
          <h4>Próximo vencimiento</h4>
          <p>Su fecha límite para el pago de seguridad social es el <strong>15 del mes siguiente</strong>.</p>
          <a href="#">Configurar Recordatorio →</a>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dash-page {
  font-family: 'Inter', 'Segoe UI', sans-serif;
  color: #1a1a1a;
  background: #f5f7f5;
  min-height: 100%;
  padding: 1.5rem 2rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Stats bar */
.stats-bar {
  display: flex;
  gap: 1rem;
}
.stat-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 1.25rem 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 160px;
}
.stat-num {
  font-size: 2rem;
  font-weight: 800;
  color: #111827;
  line-height: 1;
}
.stat-num.text-green { color: #16a34a; }
.stat-num.text-orange { color: #d97706; }
.stat-label {
  font-size: 0.78rem;
  color: #6b7280;
  font-weight: 500;
}

/* Table section */
.table-section {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
}
.table-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1.5rem 1.75rem 1.25rem;
  border-bottom: 1px solid #f3f4f6;
  flex-wrap: wrap;
  gap: 1rem;
}
.table-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.2rem 0;
}
.table-sub { font-size: 0.82rem; color: #9ca3af; margin: 0; }
.table-controls { display: flex; gap: 0.75rem; align-items: center; }
.month-input {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  color: #374151;
  padding: 0.45rem 0.75rem;
  border-radius: 8px;
  font-size: 0.85rem;
  outline: none;
}
.btn-refresh {
  background: #39A900;
  color: white;
  border: none;
  padding: 0.45rem 1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}
.btn-refresh:hover { background: #2e8b00; }

table {
  width: 100%;
  border-collapse: collapse;
}
thead tr { background: #f9fafb; }
th {
  padding: 0.75rem 1.75rem;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.07em;
  color: #6b7280;
  text-transform: uppercase;
  text-align: left;
}
td {
  padding: 1rem 1.75rem;
  font-size: 0.88rem;
  border-top: 1px solid #f3f4f6;
  color: #374151;
}
.td-name { font-weight: 600; color: #111827; }
.td-doc { color: #6b7280; font-size: 0.82rem; }
.td-date { color: #9ca3af; font-size: 0.82rem; }
.empty-cell { text-align: center; color: #9ca3af; padding: 3rem; }

/* Badges */
.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.3rem 0.75rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
}
.badge-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.badge-success { background: #dcfce7; color: #16a34a; }
.badge-pending { background: #fef9c3; color: #a16207; }

/* Action buttons */
.btn-pay {
  background: white;
  border: 1.5px solid #d1d5db;
  color: #374151;
  padding: 0.35rem 0.9rem;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}
.btn-pay:hover { border-color: #39A900; color: #39A900; }
.btn-download {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
}
.btn-download:hover { color: #39A900; }

/* Loading / Error */
.loading-state, .error-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 3rem;
  color: #6b7280;
  font-size: 0.9rem;
}
.error-state { color: #ef4444; }
.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #e5e7eb;
  border-top-color: #39A900;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Bottom cards */
.bottom-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
.info-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}
.info-card.dark {
  background: #111827;
  border-color: #1f2937;
}
.info-card.dark h4 { color: white; }
.info-card.dark p { color: #9ca3af; }
.info-card.dark a { color: #39A900; }
.info-card-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.info-card-icon.green { background: #f0fdf4; color: #39A900; }
.info-card-icon.calendar { background: #1f2937; color: #39A900; }
.info-card h4 { font-size: 0.9rem; font-weight: 700; color: #111827; margin: 0 0 0.3rem 0; }
.info-card p { font-size: 0.8rem; color: #6b7280; margin: 0 0 0.5rem 0; line-height: 1.5; }
.info-card a { font-size: 0.8rem; color: #39A900; font-weight: 600; text-decoration: none; }
.info-card a:hover { text-decoration: underline; }

@media (max-width: 768px) {
  .bottom-cards { grid-template-columns: 1fr; }
  .stats-bar { flex-wrap: wrap; }
  .dash-page { padding: 1rem; }
}
</style>
