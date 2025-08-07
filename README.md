# Excel a Sicore - Next.js

Aplicación web moderna para convertir archivos Excel a formato TXT SICORE para retenciones de ganancias.

## 🚀 Características

- **Interfaz moderna**: Construida con Next.js 15, React 19 y shadcn/ui
- **Drag & Drop**: Sube archivos fácilmente arrastrándolos a la zona de carga
- **Procesamiento en tiempo real**: Conversión instantánea sin necesidad de servidor
- **Vista previa**: Revisa el contenido del archivo TXT antes de descargarlo
- **Responsive**: Funciona perfectamente en desktop y móvil
- **TypeScript**: Código tipo-seguro y mantenible

## 🛠️ Tecnologías

- **Next.js 15** - Framework React moderno
- **React 19** - Biblioteca de UI
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Estilos utilitarios
- **shadcn/ui** - Componentes de UI modernos
- **react-dropzone** - Carga de archivos con drag & drop
- **xlsx** - Procesamiento de archivos Excel

## 📋 Requisitos

- Node.js 18+ 
- npm o yarn

## 🏗️ Instalación

1. **Clona o descarga el proyecto**

2. **Instala las dependencias**
   ```bash
   npm install
   ```

3. **Ejecuta en modo desarrollo**
   ```bash
   npm run dev
   ```

4. **Abre tu navegador**
   - Ve a `http://localhost:3000`

## 📦 Comandos disponibles

```bash
# Desarrollo
npm run dev

# Construcción para producción
npm run build

# Ejecutar en producción
npm start

# Linting
npm run lint
```

## 📊 Formato de Excel esperado

El archivo Excel debe tener las siguientes columnas:

| Columna | Contenido | Ejemplo |
|---------|-----------|---------|
| A | Fecha | 11/06/2025 |
| E | Número de comprobante | 000123 |
| F | Neto | 1000.00 |
| G | IVA | 210.00 |
| H | CUIT | 20123456789 |
| L | Retención | 30.00 |

## 🎯 Funcionalidades

1. **Carga de archivos**: Soporta archivos .xlsx y .xls
2. **Procesamiento automático**: Convierte automáticamente al formato SICORE
3. **Validación**: Verifica que el archivo tenga el formato correcto
4. **Descarga**: Genera archivo TXT listo para SICORE
5. **Vista previa**: Muestra el contenido antes de descargar

## 📝 Notas técnicas

- **Posicionamiento exacto**: El archivo TXT respeta las posiciones de caracteres específicas de SICORE
- **Códigos fijos**: Se incluyen automáticamente los códigos requeridos (05, 0217, 0311, etc.)
- **Cálculos automáticos**: Suma automática de Neto + IVA para importe total
- **Formato de fechas**: Conversión automática a DD/MM/AAAA
- **Corrección de timezone**: Manejo correcto de fechas de Excel

## 👨‍💻 Créditos

**@Pablo Fontana Programacion Artesanal**

---

*Aplicación creada con Next.js y shadcn/ui para optimizar el proceso de conversión Excel a SICORE.*