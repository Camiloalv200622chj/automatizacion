# Contexto del Proyecto: API REST Node.js (ES6)

## 🛠 Stack Tecnológico
- **Runtime:** Node.js (Versión LTS)
- **Lenguaje:** JavaScript Puro (ES6+) - **No TypeScript**.
- **Framework Web:** Express.js
- **Base de Datos:** MongoDB con Mongoose (ODM).
- **Formato de Módulos:** ESM (`import`/`export`).

## 📁 Estructura de Carpetas
- `/src/config`: Configuraciones de DB (mongoose.connect) y variables de entorno.
- `/src/models`: Esquemas de Mongoose.
- `/src/controllers`: Lógica de control de rutas.
- `/src/routes`: Definición de endpoints de Express.
- `/src/middlewares`: Funciones de paso (auth, errores, validación).
- `/src/utils`: Funciones de ayuda generales.

## 📜 Reglas de Código (Estilo ES6)
1. **Importaciones:** Usar siempre `import x from 'y'`. No usar `require`.
2. **Asincronía:** Preferir `async/await` sobre `.then()`. 
3. **Manejo de Errores:** En los controladores, envolver la lógica en bloques `try/catch` y pasar el error al middleware global mediante `next(error)`.
4. **Variables:** Usar `const` por defecto, `let` solo si es necesario. Nunca usar `var`.
5. **Funciones:** Preferir Arrow Functions para middlewares y utilidades.
6. para el nombrado de variables y constantes utiliza camelCase.

## 🗄️ Convenciones de Mongoose
- Los nombres de los modelos deben estar en Singular y PascalCase (ej: `User.js`).
- Siempre incluir `timestamps: true` en el esquema.
- Validar campos obligatorios con mensajes personalizados en el Schema.

## 🚀 Comandos Útiles
- Iniciar Dev: `npm run dev` (usa nodemon).
- Iniciar Producción: `npm start`.
- Tests: `npm test`.

requerimientos:
Requerimientos Funcionales
RF-01 – Gestión de Contratistas

El sistema debe permitir:

Registrar contratistas con:

Nombre completo

Número de documento

Tipo de documento

Credenciales necesarias para descargar el certificado

Editar y eliminar contratistas

Activar/desactivar contratistas para el proceso automático

⚠ Pregunta incómoda:
¿Dónde vas a guardar las credenciales? ¿En texto plano? Si es así, es una mala idea.

RF-02 – Automatización de Descarga

El sistema debe:

Acceder al portal de descarga de certificados del SENA

Autocompletar formularios

Resolver el captcha

Descargar el archivo generado

Aquí hay un problema serio:

Si el captcha es reCAPTCHA de Google, automatizarlo puede violar términos de uso.

¿Ya validaste que legalmente puedes automatizarlo?
Porque si no, el proyecto nace con riesgo.

RF-03 – Procesamiento del Archivo

Después de la descarga:

Detectar si el archivo está comprimido (.zip)

Descomprimirlo

Validar que el archivo PDF exista

Eliminar el .zip si se requiere

Caso límite:
¿Y si el archivo descargado viene corrupto?
¿Y si el sistema cambia el formato?

RF-04 – Organización de Archivos

El sistema debe:

Crear automáticamente carpeta con formato:

/certificados/2026/03-Marzo/

Donde:

Marzo contiene certificados del mes de febrero

⚠ Punto ciego:
¿Cómo calculas el mes correctamente en enero?
Enero paga diciembre del año anterior.

¿Tu lógica contempla el cambio de año?

RF-05 – Renombrado de Archivos

El sistema debe:

Renombrar el archivo descargado con el siguiente formato:

NombreCompleto_2026_02.pdf

Preguntas que debes resolver:

¿Qué pasa si dos contratistas tienen el mismo nombre?

¿Qué pasa si el nombre tiene caracteres especiales?

¿Qué pasa si el archivo ya existe?

RF-06 – Ejecución Automática

El sistema debe:

Ejecutarse automáticamente mediante cron

Programarse para ejecutarse el último día de cada mes

Pregunta crítica:
¿Y si el portal aún no ha generado el certificado ese día?
¿Reintenta? ¿Cuántas veces?

RF-07 – Registro de Errores (Logging)

Debe:

Registrar intentos exitosos

Registrar fallos

Guardar logs en base de datos o archivo

Sin esto, cuando falle no sabrás por qué.

📌 2️⃣ Requerimientos No Funcionales
RNF-01 – Seguridad

Las credenciales deben almacenarse cifradas

El sistema debe usar variables de entorno

Debe haber control de acceso al panel

Si no haces esto, estás creando una bomba de datos personales.

RNF-02 – Tolerancia a Fallos

El sistema debe manejar:

Caída del portal

Cambio de estructura HTML

Timeout

Error de red

Automatización web = fragilidad.

RNF-03 – Escalabilidad

Pregunta real:

¿Es solo para 5 contratistas o 300?

Porque si son 300 y el portal detecta automatización masiva, podrías ser bloqueado.

RNF-04 – Cumplimiento Legal

Estás manipulando documentos oficiales.