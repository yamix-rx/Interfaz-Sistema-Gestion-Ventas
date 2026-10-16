<div align="center">
  <img src="https://raw.githubusercontent.com/yamix-rx/yamix-rx/main/assets/proyecto-ventas.svg" width="75%" alt="Sistema de gestión de ventas" />
  <h1>Interfaz y Sistema de Gestión de Ventas</h1>
  <p>Aplicación web con interfaz en React y API para operaciones comerciales.</p>
  <img src="https://img.shields.io/badge/React-Frontend-149ECA?logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-Vite-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Express-Backend-222222?logo=express" alt="Express" />
  <img src="https://img.shields.io/badge/MySQL-Datos-4479A1?logo=mysql&logoColor=white" alt="MySQL" />
</div>

## 📌 Descripción

Proyecto de gestión comercial basado en una **interfaz construida con React + TypeScript + Vite** y un **backend Node.js + Express** con MySQL. El código de la API identifica al sistema como *Farmacia Sanet*.

La interfaz original tiene como referencia un [diseño en Figma](https://www.figma.com/design/HaJyKysEqbNGHAtzJyl4KN/Interfaz-Sistema-Gesti%C3%B3n-Ventas), que se complementa en este repositorio con componentes y servicios de aplicación.

## ✨ Funcionalidades y módulos presentes en el código

- Inicio de sesión y autenticación mediante tokens.
- Gestión de productos, categorías y laboratorios.
- Operaciones de compras y ventas.
- Clientes y usuarios.
- Panel de indicadores y reportes.
- API con rutas protegidas para operaciones administrativas.

## 🛠️ Stack

| Área | Tecnologías |
| :--- | :--- |
| Interfaz | React, TypeScript, Vite |
| UI | Tailwind CSS, Radix UI, Material UI |
| Backend | Node.js, Express |
| Datos | MySQL con `mysql2` |
| Autenticación | JSON Web Tokens, bcryptjs |
| Reportes | PDFKit |

## 🗂️ Estructura

```text
Interfaz-Sistema-Gestion-Ventas/
├── src/
│   ├── app/
│   └── main.tsx
├── backend/
│   ├── middleware/
│   ├── routes/
│   ├── services/
│   ├── db.js
│   └── index.js
├── package.json
└── vite.config.ts
```

## 🚀 Ejecución local

**Requisitos:** Node.js, npm y MySQL con una base de datos compatible con este proyecto.

### Frontend

```bash
git clone https://github.com/yamix-rx/Interfaz-Sistema-Gestion-Ventas.git
cd Interfaz-Sistema-Gestion-Ventas
npm install
npm run dev
```

### Backend

En otra terminal, desde la carpeta `backend`:

```bash
cd backend
npm install
```

Crea `backend/.env` usando credenciales de desarrollo propias:

```dotenv
PORT=3001
DB_HOST=localhost
DB_USER=tu_usuario
DB_PASSWORD=tu_contrasena
DB_NAME=tu_base_de_datos
JWT_SECRET=coloca_aqui_un_secreto_largo_y_aleatorio
```

Luego inicia la API:

```bash
node index.js
```

La API usa por defecto **http://localhost:3001**. Configura la conexión del frontend con el backend conforme a tu entorno y comprueba que el esquema MySQL requerido esté preparado.

> **Seguridad:** configura siempre `JWT_SECRET` en `.env`; no uses secretos de ejemplo en producción y no subas credenciales al repositorio.

## 👨‍💻 Autor

**RX** · [GitHub](https://github.com/yamix-rx) · [Portafolio](https://yamix-rx-portafolio.vercel.app/)
