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

### Opcion A: usando phpMyAdmin

1. Inicia MySQL desde XAMPP, Laragon o tu herramienta local.
2. Abre phpMyAdmin, normalmente en `http://localhost/phpmyadmin`.
3. Crea una base de datos nueva con el nombre `facturacion_empresa`.
4. Selecciona la base de datos creada.
5. Entra a la pestana **Importar**.
6. Selecciona el archivo:

```text
backend/Base de datos.sql
```

7. Ejecuta la importacion y espera a que phpMyAdmin cree las tablas, registros y procedimientos.

### Opcion B: usando terminal MySQL

Desde la raiz del proyecto:

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS facturacion_empresa CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p facturacion_empresa < "backend/Base de datos.sql"
```

Si tu usuario `root` no tiene contrasena, puedes omitir `-p`:

```bash
mysql -u root -e "CREATE DATABASE IF NOT EXISTS facturacion_empresa CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root facturacion_empresa < "backend/Base de datos.sql"
```

### Verificacion Rapida

Al terminar la importacion, valida que existan tablas como:

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

El backend usa procedimientos almacenados, por lo que tambien deben importarse correctamente desde el mismo archivo SQL.

## Levantar el Backend

Abre una terminal en la raiz del proyecto y entra al backend:

```bash
cd backend
```

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

La conexion actual a MySQL esta definida en:

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

El puerto del backend puede definirse con la variable `PORT`. Si no se define, NestJS usa `3000`:

```dotenv
PORT=3000
```

El proyecto incluye `ConfigModule`, por lo que en el futuro se puede mover la configuracion sensible a `backend/.env`.

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
