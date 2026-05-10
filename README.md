# AeroApp ✈️ - Sistema de Reservas de Aerolínea (Proyecto Académico)

Este es un proyecto académico construido con [Next.js](https://nextjs.org/), Tailwind CSS y [Supabase](https://supabase.com/) para la gestión de la base de datos. Está diseñado para simular el flujo básico de búsqueda y reserva de vuelos.

## 🚀 Tecnologías Utilizadas

* **Framework:** Next.js (App Router)
* **Estilos:** Tailwind CSS
* **Base de Datos & API:** Supabase (PostgreSQL)
* **Despliegue:** Vercel

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:
* [Node.js](https://nodejs.org/) (versión 18 o superior).
* Git.
* Solicitar al líder del equipo las claves de entorno (`NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`) y la contraseña de la base de datos.

---

## 🛠️ Instalación y Configuración Local

Sigue estos pasos para levantar el entorno de desarrollo en tu máquina:

### 1. Clonar el repositorio e instalar dependencias

```bash
git clone https://github.com/TU_USUARIO/aerolinea-academica.git
cd aerolinea-academica
npm install
```

### 2. Configurar Variables de Entorno
Crea un archivo llamado `.env.local` en la raíz del proyecto y agrega las credenciales de Supabase que te proporcionó el equipo:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://aqotyjubakcesevouofb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anon_aqui
```
(Nota: El archivo .env.local está ignorado por Git por seguridad, nunca subas tus claves al repositorio público).

### 3. Iniciar el Servidor de Desarrollo

```bash
npm run dev
```

Abre http://localhost:3000 en tu navegador.