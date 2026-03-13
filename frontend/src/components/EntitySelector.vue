<script setup lang="ts">
const entities = [
  {
    id: 'aportes',
    name: 'Aportes en Línea',
    desc: 'Supervisión de aportes al sistema general de seguridad social en línea (EPS).',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"/></svg>`,
  },
  {
    id: 'miplanilla',
    name: 'miplanilla.com',
    desc: 'Gestión de aportes para fondos de pensiones obligatorias y regímenes alternativos.',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3"/></svg>`,
  },
  {
    id: 'asopagos',
    name: 'Asopagos',
    desc: 'Reporte y seguimiento de riesgos laborales y protección al trabajador.',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"/></svg>`,
  },
  {
    id: 'soi',
    name: 'SOI',
    desc: 'Administración de aportes parafiscales y beneficios familiares del contratista.',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z"/></svg>`,
  },
];

const emit = defineEmits(['select', 'go-dashboard']);
</script>

<template>
  <div class="portal-page">
    <!-- Header -->
    <header class="portal-header">
      <div class="logo-area">
        <div class="logo-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M11.644 1.59a.75.75 0 01.712 0l9.75 5.25a.75.75 0 010 1.32l-9.75 5.25a.75.75 0 01-.712 0l-9.75-5.25a.75.75 0 010-1.32l9.75-5.25z"/><path d="M3.265 10.602l7.668 4.129a2.25 2.25 0 002.134 0l7.668-4.13 1.37.739a.75.75 0 010 1.32l-9.75 5.25a.75.75 0 01-.71 0l-9.75-5.25a.75.75 0 010-1.32l1.37-.738z"/><path d="M10.933 19.231l-7.668-4.13-1.37.739a.75.75 0 000 1.32l9.75 5.25c.221.12.489.12.71 0l9.75-5.25a.75.75 0 000-1.32l-1.37-.738-7.668 4.13a2.25 2.25 0 01-2.134-.001z"/></svg>
        </div>
        <div>
          <span class="logo-name">SENA</span>
          <span class="logo-sub">SERVICIO NACIONAL DE APRENDIZAJE</span>
        </div>
      </div>
      <nav class="portal-nav">
        <a href="#">Historial</a>
        <a href="#">Normatividad</a>
        <button class="btn-report" @click="emit('go-dashboard')">Panel Supervisor →</button>
      </nav>
    </header>

    <!-- Main Content -->
    <main class="portal-main">
      <div class="module-badge">◉ MÓDULO DE SUPERVISIÓN INSTITUCIONAL</div>
      <h1 class="portal-title">Portal de Supervisión de Planillas</h1>
      <p class="portal-desc">
        Bienvenido al sistema centralizado de gestión y supervisión de aportes a la seguridad social.
        Seleccione la entidad correspondiente para proceder con el reporte.
      </p>

      <div class="section-header">
        <h2 class="section-title">Seleccione la Entidad de Planilla</h2>
        <span class="entity-count">{{ entities.length }} entidades disponibles</span>
      </div>

      <div class="entity-grid">
        <div
          v-for="entity in entities"
          :key="entity.id"
          class="entity-card"
          @click="emit('select', entity.id)"
        >
          <div class="card-icon" v-html="entity.icon"></div>
          <h3 class="card-name">{{ entity.name }}</h3>
          <p class="card-desc">{{ entity.desc }}</p>
          <span class="card-cta">Abrir Formulario →</span>
        </div>
      </div>

      <div class="info-box">
        <div class="info-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z" clip-rule="evenodd"/></svg>
        </div>
        <p>
          <strong>Información importante:</strong> Recuerde que toda la información ingresada en los formularios
          de supervisión tiene carácter de declaración oficial. El sistema registra su dirección IP y tiempo de
          sesión por motivos de seguridad institucional.
        </p>
      </div>
    </main>

    <!-- Footer -->
    <footer class="portal-footer">
      <span>© 2024 SENA - Supervisión de Planillas</span>
      <span>Todos los derechos reservados, Colombia</span>
      <div class="footer-links">
        <a href="#">Políticas de Privacidad</a>
        <a href="#">Términos y Condiciones</a>
        <a href="#">Portal Transparencia</a>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.portal-page {
  position: fixed;
  inset: 0;
  background: #f5f7f5;
  color: #1a1a1a;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  z-index: 1000;
  font-family: 'Inter', 'Segoe UI', sans-serif;
}

/* Header */
.portal-header {
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
}
.logo-area {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.logo-icon {
  width: 38px;
  height: 38px;
  background: #39A900;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}
.logo-name {
  display: block;
  font-weight: 800;
  font-size: 1rem;
  color: #1a1a1a;
  letter-spacing: 0.05em;
  line-height: 1;
}
.logo-sub {
  display: block;
  font-size: 0.6rem;
  color: #6b7280;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-top: 1px;
}
.portal-nav {
  display: flex;
  align-items: center;
  gap: 2rem;
}
.portal-nav a {
  text-decoration: none;
  color: #4b5563;
  font-size: 0.9rem;
  font-weight: 500;
  transition: color 0.2s;
}
.portal-nav a:hover { color: #39A900; }
.btn-report {
  background: #39A900;
  color: white;
  border: none;
  padding: 0.45rem 1rem;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-report:hover { background: #2e8b00; }

/* Main */
.portal-main {
  flex: 1;
  max-width: 960px;
  margin: 0 auto;
  width: 100%;
  padding: 3rem 2.5rem 2rem;
}
.module-badge {
  display: inline-block;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #39A900;
  margin-bottom: 1rem;
}
.portal-title {
  font-size: 2rem;
  font-weight: 800;
  color: #111827;
  margin: 0 0 0.75rem 0;
}
.portal-desc {
  color: #6b7280;
  font-size: 0.95rem;
  max-width: 560px;
  line-height: 1.6;
  margin: 0 0 2.5rem 0;
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
}
.section-title {
  font-size: 1rem;
  font-weight: 700;
  color: #374151;
  margin: 0;
}
.entity-count {
  font-size: 0.8rem;
  color: #9ca3af;
}

/* Entity Grid */
.entity-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.25rem;
  margin-bottom: 2rem;
}
.entity-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.2s;
}
.entity-card:hover {
  border-color: #39A900;
  box-shadow: 0 4px 12px rgba(57, 169, 0, 0.12);
  transform: translateY(-2px);
}
.card-icon {
  width: 40px;
  height: 40px;
  margin-bottom: 1rem;
  color: #39A900;
}
.card-icon svg { width: 100%; height: 100%; }
.card-name {
  font-size: 1rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.5rem 0;
}
.card-desc {
  font-size: 0.8rem;
  color: #6b7280;
  line-height: 1.5;
  margin: 0 0 1.25rem 0;
}
.card-cta {
  font-size: 0.8rem;
  font-weight: 700;
  color: #39A900;
}

/* Info box */
.info-box {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 10px;
  padding: 1rem 1.25rem;
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}
.info-icon { color: #39A900; flex-shrink: 0; margin-top: 1px; }
.info-box p {
  font-size: 0.82rem;
  color: #374151;
  margin: 0;
  line-height: 1.6;
}

/* Footer */
.portal-footer {
  display: flex;
  align-items: center;
  gap: 2rem;
  padding: 1rem 2.5rem;
  border-top: 1px solid #e5e7eb;
  font-size: 0.75rem;
  color: #9ca3af;
  background: white;
  flex-wrap: wrap;
}
.footer-links {
  display: flex;
  gap: 1.5rem;
  margin-left: auto;
}
.footer-links a { color: #9ca3af; text-decoration: none; }
.footer-links a:hover { color: #39A900; }

@media (max-width: 768px) {
  .entity-grid { grid-template-columns: 1fr 1fr; }
  .portal-nav { gap: 1rem; }
  .portal-nav a { display: none; }
}
@media (max-width: 480px) {
  .entity-grid { grid-template-columns: 1fr; }
}
</style>
