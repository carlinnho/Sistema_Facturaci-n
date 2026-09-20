# Guia de Inicio: Sistema de Facturacion y Punto de Venta

**Consultoria y Asesoria Empresarial JB**

Sistema web para la gestion de ventas, facturacion, inventario, proveedores, medios de pago, usuarios, perfiles y reportes de una empresa. El proyecto esta organizado como una aplicacion full-stack: un backend en NestJS conectado a MySQL/MariaDB y un frontend en React con Vite.

La base de datos principal se importa desde el archivo SQL incluido en el backend. Para entorno local, el sistema espera una base de datos llamada `facturacion_empresa`.

---

## Tabla de Contenidos

1. [Tecnologias Utilizadas](#tecnologias-utilizadas)
2. [Requisitos Previos](#requisitos-previos)
3. [Clonar o Actualizar el Proyecto](#clonar-o-actualizar-el-proyecto)
4. [Configuracion de la Base de Datos Local](#configuracion-de-la-base-de-datos-local)
5. [Levantar el Backend](#levantar-el-backend)
6. [Levantar el Frontend](#levantar-el-frontend)
7. [Configuracion y Variables](#configuracion-y-variables)
8. [Pruebas Locales](#pruebas-locales)
9. [Funcionalidades Principales](#funcionalidades-principales)
10. [Estructura del Proyecto](#estructura-del-proyecto)
11. [Flujo de Trabajo Diario](#flujo-de-trabajo-diario)
12. [Soporte y Contacto](#soporte-y-contacto)

---

## Tecnologias Utilizadas

Resumen de las tecnologias principales del proyecto y para que se usan.

### Frontend

Ubicacion: `frontend/`

- **React 19 + Vite:** base de la aplicacion cliente y servidor de desarrollo con recarga rapida.
- **JavaScript:** desarrollo de paginas, componentes, contexto y servicios HTTP.
- **Tailwind CSS 4:** estilos, maquetacion responsiva e interfaz moderna.
- **React Router DOM:** navegacion entre login, POS, inventario, proveedores, reportes y configuracion.
- **Axios:** consumo de endpoints del backend.
- **Lucide React:** iconografia de botones, menus, formularios y vistas.
- **Framer Motion:** animaciones y transiciones.
- **Recharts:** graficos y paneles visuales para reportes.
- **HTML5 QR Code:** lectura de codigos mediante camara.
- **React To Print:** soporte para impresion de comprobantes o tickets.

### Backend

Ubicacion: `backend/`

- **NestJS 11 + TypeScript:** API REST modular para la logica del sistema.
- **MySQL/MariaDB + mysql2:** conexion a base de datos relacional y ejecucion de procedimientos almacenados.
- **JWT + Passport:** autenticacion por token para proteger rutas privadas.
- **bcrypt:** cifrado y validacion de contrasenas mediante `password_hash`.
- **class-validator / class-transformer:** validacion de DTOs de entrada.
- **PDFKit:** generacion de documentos PDF.
- **ExcelJS:** generacion de reportes en Excel.
- **adm-zip:** compresion de respaldos.
- **xml-crypto, xmldom y xmlbuilder2:** utilidades para XML y procesos relacionados con comprobantes.

### Base de Datos

- **Motor recomendado:** MySQL o MariaDB.
- **Nombre local esperado:** `facturacion_empresa`.
- **Archivo principal de importacion:** `backend/Base de datos.sql`.
- **Respaldos generados por el sistema:** `backend/almacen_backups/`.

El backend se conecta actualmente a:

```text
host: localhost
user: root
password:
database: facturacion_empresa
port: 3306
```

> Nota: la contrasena maestra de prueba para el registro de empresa incluido en el SQL es `Contraseña.123`. El valor guardado en `password_hash` es un hash bcrypt, no una contrasena real en texto plano.

## Requisitos Previos

Antes de comenzar, asegurate de tener instalado:

- **Node.js + NPM:** version LTS recomendada.
- **MySQL o MariaDB:** puede ser mediante XAMPP, Laragon, WampServer, Docker o instalacion directa.
- **phpMyAdmin, MySQL Workbench o cliente MySQL:** para crear e importar la base de datos.
- **Git:** para clonar y sincronizar el repositorio.
- **Editor de codigo:** Visual Studio Code o equivalente.
- **Cliente HTTP para pruebas:** Postman, Bruno, Insomnia o Thunder Client.

## Clonar o Actualizar el Proyecto

Para descargar el proyecto por primera vez:

```bash
git clone URL_DEL_REPOSITORIO
cd SistemFacturacion
```

Cuando el repositorio ya exista localmente, abre una terminal en la carpeta principal y sincroniza los ultimos cambios:

```bash
git pull origin main
```

## Configuracion de la Base de Datos Local

El proyecto necesita una base de datos llamada exactamente:

```text
facturacion_empresa
```

### Paso 1: Importar las tablas y datos

#### Opcion A: phpMyAdmin

1. Inicia MySQL desde XAMPP, Laragon o tu herramienta local.
2. Abre phpMyAdmin, normalmente en `http://localhost/phpmyadmin`.
3. Crea una base de datos nueva con el nombre `facturacion_empresa`.
4. Seleccionala y ve a la pestana **Importar**.
5. Selecciona `backend/Base de datos.sql` y ejecuta.

#### Opcion B: terminal MySQL

```bash
mysql -u root -e "CREATE DATABASE IF NOT EXISTS facturacion_empresa CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root facturacion_empresa < "backend/Base de datos.sql"
```

### Paso 2: Importar los Stored Procedures (OBLIGATORIO)

El archivo `Base de datos.sql` no incluye los stored procedures. Debes importarlos por separado ejecutando:

```bash
mysql -u root facturacion_empresa < "backend/stored_procedures.sql"
```

> **Si usas XAMPP** y `mysql` no esta en el PATH, usa la ruta completa:
> ```bash
> & "C:\xampp\mysql\bin\mysql.exe" -u root facturacion_empresa < "backend/stored_procedures.sql"
> ```
> En PowerShell usa `Get-Content` en lugar de `<`:
> ```powershell
> Get-Content "backend\stored_procedures.sql" | & "C:\xampp\mysql\bin\mysql.exe" -u root facturacion_empresa
> ```

### Verificacion

Despues de ambos pasos, verifica que los procedimientos esten creados:

```sql
SHOW PROCEDURE STATUS WHERE Db = 'facturacion_empresa';
```

Deberias ver 22 procedimientos listados (sp_validar_login_empresa, sp_listar_perfiles, sp_login_perfil, etc.).

Verifica tambien que existan las tablas principales:

```text
detalle_empresa
usuarios
roles
productos
categorias
ventas
detalle_ventas
proveedores
medios_pago
historial_backups
```

## Levantar el Backend

Abre una terminal en la raiz del proyecto y entra al backend:

```bash
cd backend
```

Crea el archivo de variables de entorno. Dentro de la carpeta `backend/`, crea un archivo llamado `.env` con el siguiente contenido:

```dotenv
# Puerto del servidor (opcional)
PORT=3000

# Token para la API de DNI/RUC (apis.net.pe)
APIS_NET_TOKEN=sk_14879.8xfue5QXag8fmaTRRT2qY2oBsLUl7Wa8
```

> El archivo `.env` no se sube al repositorio (esta en `.gitignore`), por eso debes crearlo manualmente en cada entorno local.

Instala las dependencias:

```bash
npm install
```

Inicia el servidor en modo desarrollo:

```bash
npm run start:dev
```

Por defecto, el backend queda disponible en:

```text
http://localhost:3000
```

Endpoint de prueba:

```text
GET http://localhost:3000
```

Endpoint temporal para generar hash bcrypt de la contrasena de prueba:

```text
GET http://localhost:3000/generate-hash
```

> Este endpoint sirve solo como apoyo durante desarrollo para generar el hash de `Contraseña.123`. Si el proyecto se publica para produccion, se recomienda eliminarlo o protegerlo.

## Levantar el Frontend

Abre una segunda terminal desde la raiz del proyecto y entra al frontend:

```bash
cd frontend
```

Instala las dependencias:

```bash
npm install
```

Inicia el servidor de desarrollo:

```bash
npm run dev
```

Vite mostrara la URL local de la aplicacion. Normalmente sera:

```text
http://localhost:5173
```

El frontend consume el backend en:

```text
http://localhost:3000
```

## Configuracion y Variables

### Backend

La conexion a MySQL esta definida directamente en:

```text
backend/src/modules/database/database.service.ts
```

Valores actuales:

```ts
host: 'localhost',
user: 'root',
password: '',
database: 'facturacion_empresa',
```

Las variables de entorno del backend se configuran en el archivo `backend/.env`. Este archivo no esta en el repositorio, debes crearlo manualmente (ver seccion [Levantar el Backend](#levantar-el-backend)):

```dotenv
# Puerto del servidor (opcional)
PORT=3000

# Token para la API de DNI/RUC (apis.net.pe)
APIS_NET_TOKEN=sk_14879.8xfue5QXag8fmaTRRT2qY2oBsLUl7Wa8
```

### Frontend

La URL base del backend esta definida en:

```text
frontend/src/api/axiosConfig.js
```

Valor actual:

```js
baseURL: "http://localhost:3000"
```

Si cambias el puerto del backend, actualiza tambien este valor.

### CORS

El backend permite peticiones desde el frontend local:

```text
http://localhost:5173
```

La configuracion se encuentra en:

```text
backend/src/main.ts
```

## Pruebas Locales

Puedes probar la API con Postman, Bruno, Insomnia o Thunder Client.

### Login de Empresa

```http
POST http://localhost:3000/auth/login-empresa
Content-Type: application/json

{
  "email": "correo_configurado_en_detalle_empresa",
  "password": "Contraseña.123"
}
```

Si las credenciales son correctas, el backend devolvera un token:

```json
{
  "access_token": "TOKEN_JWT"
}
```

Para rutas protegidas, envia el token en el header:

```http
Authorization: Bearer TOKEN_JWT
```

### Rutas de Referencia

```text
POST http://localhost:3000/auth/login-empresa
GET  http://localhost:3000/auth/perfiles
POST http://localhost:3000/auth/login-perfil
GET  http://localhost:3000/productos
GET  http://localhost:3000/categorias
GET  http://localhost:3000/proveedores
GET  http://localhost:3000/medios-pago
GET  http://localhost:3000/reportes
GET  http://localhost:3000/backup
```

Algunas rutas requieren autenticacion JWT.

## Funcionalidades Principales

- Inicio de sesion de empresa con contrasena cifrada usando bcrypt.
- Selector e inicio de sesion por perfiles de usuario.
- Gestion de usuarios y roles.
- Gestion de datos de la empresa.
- Control de productos, categorias y stock.
- Registro y administracion de proveedores.
- Gestion de medios de pago.
- Punto de venta con carrito, cantidades, descuentos y totales.
- Emision y registro de ventas.
- Reportes, historial y paneles graficos.
- Exportacion o generacion de archivos PDF y Excel.
- Sistema de respaldos de base de datos.
- Escaneo de codigos mediante camara.

## Estructura del Proyecto

```text
.
├── backend/
│   ├── Base de datos.sql
│   ├── almacen_backups/
│   ├── src/
│   │   ├── common/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── backup/
│   │   │   ├── categorias/
│   │   │   ├── database/
│   │   │   ├── empresa/
│   │   │   ├── medios-pago/
│   │   │   ├── productos/
│   │   │   ├── proveedores/
│   │   │   ├── reportes/
│   │   │   ├── sunat/
│   │   │   ├── users/
│   │   │   └── ventas/
│   │   ├── app.module.ts
│   │   └── main.ts
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
└── README.md
```

## Flujo de Trabajo Diario

- **Base de datos:** antes de probar, confirma que MySQL este activo y que exista `facturacion_empresa`.
- **Backend:** ejecuta `npm run start:dev` dentro de `backend/`.
- **Frontend:** ejecuta `npm run dev` dentro de `frontend/`.
- **API:** prueba endpoints sensibles con un cliente HTTP antes de validar desde React.
- **Cambios de BD:** cuando cambie la estructura o data inicial, actualiza `backend/Base de datos.sql`.
- **Credenciales:** no subas contrasenas reales ni secretos de produccion al repositorio.
- **Ramas:** crea una rama nueva para cada mejora o correccion antes de hacer commit.

## Soporte y Contacto

Ante dudas, errores de instalacion o problemas durante pruebas locales, comunicarse con el responsable del proyecto.

---

<p align="center">Sistema de Facturacion y Punto de Venta - Consultoria y Asesoria Empresarial JB</p>
