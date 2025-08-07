// Global variables
let currentFile = null;
let processedData = null;

// DOM elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const fileInfo = document.getElementById('fileInfo');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const processBtn = document.getElementById('processBtn');
const progressSection = document.getElementById('progressSection');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const resultSection = document.getElementById('resultSection');
const downloadBtn = document.getElementById('downloadBtn');
const previewModal = document.getElementById('previewModal');
const previewContent = document.getElementById('previewContent');

// Initialize event listeners
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
});

function initializeEventListeners() {
    // File input change event
    fileInput.addEventListener('change', handleFileSelect);
    
    // Drag and drop events
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    uploadArea.addEventListener('click', () => fileInput.click());
    
    // Download button event
    downloadBtn.addEventListener('click', downloadTxtFile);
    
    // Prevent default drag behaviors on document
    document.addEventListener('dragover', e => e.preventDefault());
    document.addEventListener('drop', e => e.preventDefault());
}

// Drag and drop handlers
function handleDragOver(e) {
    e.preventDefault();
    uploadArea.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
}

// File selection handler
function handleFileSelect(e) {
    if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
    }
}

// Main file handling function
function handleFile(file) {
    // Validate file type
    const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
    ];
    
    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/i)) {
        showError('Por favor, selecciona un archivo Excel válido (.xlsx o .xls)');
        return;
    }
    
    // Store file and update UI
    currentFile = file;
    updateFileInfo(file);
    enableProcessButton();
}

// Update file information display
function updateFileInfo(file) {
    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);
    fileInfo.style.display = 'flex';
    
    // Hide upload area
    uploadArea.style.display = 'none';
}

// Format file size for display
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Remove file and reset UI
function removeFile() {
    currentFile = null;
    processedData = null;
    
    fileInfo.style.display = 'none';
    uploadArea.style.display = 'block';
    processBtn.disabled = true;
    progressSection.style.display = 'none';
    resultSection.style.display = 'none';
    
    // Reset file input
    fileInput.value = '';
}

// Enable process button
function enableProcessButton() {
    processBtn.disabled = false;
}

// Main processing function
async function processFile() {
    if (!currentFile) {
        showError('No hay archivo seleccionado');
        return;
    }
    
    try {
        // Show progress
        showProgress(0, 'Leyendo archivo Excel...');
        
        // Read Excel file
        const excelData = await readExcelFile(currentFile);
        showProgress(30, 'Procesando datos...');
        
        // Convert to TXT format
        const txtContent = convertToTxtFormat(excelData);
        showProgress(80, 'Generando archivo TXT...');
        
        // Store processed data
        processedData = txtContent;
        showProgress(100, 'Proceso completado');
        
        // Show success
        setTimeout(() => {
            hideProgress();
            showResult();
        }, 500);
        
    } catch (error) {
        console.error('Error processing file:', error);
        hideProgress();
        showError('Error al procesar el archivo: ' + error.message);
    }
}

// Read Excel file using XLSX library
function readExcelFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                
                // Get first worksheet
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                
                // Convert to JSON
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                
                resolve(jsonData);
            } catch (error) {
                reject(new Error('Error al leer el archivo Excel: ' + error.message));
            }
        };
        
        reader.onerror = function() {
            reject(new Error('Error al leer el archivo'));
        };
        
        reader.readAsArrayBuffer(file);
    });
}

// Convert Excel data to TXT format according to SICORE specifications
function convertToTxtFormat(excelData) {
    if (!excelData || excelData.length < 2) {
        throw new Error('El archivo Excel está vacío o no tiene datos válidos');
    }
    
    const headers = excelData[0];
    const rows = excelData.slice(1);
    
    // Find column indices based on header names (case insensitive)
    const columnMapping = findColumnMapping(headers);
    
    let txtLines = [];
    let lineNumber = 191; // Starting line number as shown in example
    
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;
        
        try {
            const txtLine = formatRowToTxt(row, columnMapping, lineNumber + i);
            
            // Debug: Show positioning and data extraction for first line only
            if (i === 0) {
                debugDataExtraction(row, columnMapping);
                debugLinePositions(txtLine);
            }
            
            txtLines.push(txtLine);
        } catch (error) {
            console.warn(`Error processing row ${i + 2}:`, error.message);
        }
    }
    
    return txtLines.join('\n');
}

// Find column mapping based on specific Excel column positions
function findColumnMapping(headers) {
    // Mapeo específico según las columnas del Excel proporcionado
    const mapping = {
        fecha: 0,      // Columna A (índice 0)
        numero: 4,     // Columna E (índice 4) 
        neto: 5,       // Columna F (índice 5)
        iva: 6,        // Columna G (índice 6)
        cuit: 7,       // Columna H (índice 7)
        retencion: 11  // Columna L (índice 11)
    };
    
    // Verificar que las columnas existen en el Excel
    console.log("=== MAPEO DE COLUMNAS ===");
    console.log("Encabezados encontrados:", headers);
    console.log("Columna A (fecha):", headers[0]);
    console.log("Columna E (numero):", headers[4]);
    console.log("Columna F (neto):", headers[5]);
    console.log("Columna G (iva):", headers[6]);
    console.log("Columna H (cuit):", headers[7]);
    console.log("Columna L (retencion):", headers[11]);
    console.log("========================");
    
    return mapping;
}

// Format a single row to TXT format according to SICORE specifications
function formatRowToTxt(row, mapping, lineNumber) {
    // Create array of 145 spaces
    let lineArray = new Array(145).fill(' ');
    
    // Helper function to place text at exact position (1-based indexing)
    function setPosition(value, startPos, endPos, rightAlign = false) {
        const startIndex = startPos - 1; // Convert to 0-based
        const endIndex = endPos - 1;     // Convert to 0-based
        const fieldLength = endIndex - startIndex + 1;
        
        let text = value.toString();
        
        // Truncate if too long
        if (text.length > fieldLength) {
            text = text.substring(0, fieldLength);
        }
        
        if (rightAlign) {
            // Right align: pad with spaces on the left
            text = text.padStart(fieldLength, ' ');
        } else {
            // Left align: pad with spaces on the right
            text = text.padEnd(fieldLength, ' ');
        }
        
        // Place each character in the exact position
        for (let i = 0; i < text.length && i < fieldLength; i++) {
            lineArray[startIndex + i] = text[i];
        }
    }
    
    try {
        // Position 1-2: Código de comprobante (siempre "05")
        setPosition("05", 1, 2);
        
        // Position 3-12: Fecha de emisión del comprobante (DD/MM/AAAA)
        if (mapping.fecha !== undefined && row[mapping.fecha]) {
            const fecha = formatDate(row[mapping.fecha]);
            setPosition(fecha, 3, 12);
        } else {
            setPosition("0", 3, 12);
        }
        
        // Position 13-28: Número del comprobante (SIN CEROS A LA IZQUIERDA)
        if (mapping.numero !== undefined && row[mapping.numero]) {
            let numero = row[mapping.numero].toString();
            // Quitar ceros a la izquierda
            numero = numero.replace(/^0+/, '') || '0';
            setPosition(numero, 13, 28, false);  // false = izquierda
        } else {
            setPosition("0", 13, 28);
        }
        
        // Position 29-44: Importe del comprobante (F+G = NETO + IVA)
        let importeComprobante = 0;
        if (mapping.neto !== undefined && row[mapping.neto]) {
            importeComprobante += parseFloat(row[mapping.neto]) || 0;
        }
        if (mapping.iva !== undefined && row[mapping.iva]) {
            importeComprobante += parseFloat(row[mapping.iva]) || 0;
        }
        if (importeComprobante !== 0) {
            const importe = formatNumber(Math.abs(importeComprobante));
            setPosition(importe, 29, 44, true);  // true = derecha
        } else {
            setPosition("0", 29, 44);
        }
        
        // Position 45-48: Código de impuesto (0217 - con 0 antes del 217)
        setPosition("0217", 45, 48);
        
        // Position 49-52: Código de régimen (0311)
        setPosition("0311", 49, 52);
        
        // Position 53-66: Base de cálculo (solo F = NETO)
        if (mapping.neto !== undefined && row[mapping.neto]) {
            const base = formatNumber(Math.abs(row[mapping.neto]));
            setPosition(base, 53, 66, true);  // true = derecha
        } else {
            setPosition("0", 53, 66);
        }
        
        // Position 67-76: Fecha de emisión de la retención (DD/MM/AAAA)
        if (mapping.fecha !== undefined && row[mapping.fecha]) {
            const fecha = formatDate(row[mapping.fecha]);
            setPosition(fecha, 67, 76);
        } else {
            setPosition("0", 67, 76);
        }
        
        // Position 77-78: Código de condición (MODELO DICE "01")
        setPosition("01", 77, 78);
        
        // Position 79: Retención practicada a sujetos suspendidos según
        setPosition("0", 79, 79);
        
        // Position 80-93: Importe de la retención (alinear derecha)
        if (mapping.retencion !== undefined && row[mapping.retencion]) {
            const retencion = formatNumber(Math.abs(row[mapping.retencion]));
            setPosition(retencion, 80, 93, true);  // true = derecha
        } else {
            setPosition("0", 80, 93);
        }
        
        // Position 94-99: Porcentaje de exclusión (MODELO DICE "  0,00")
        setPosition("  0,00", 94, 99);
        
        // Position 100-109: Fecha publicación (espacios en blanco según modelo)
        setPosition("          ", 100, 109);
        
        // Position 110-111: Tipo de documento del retenido
        setPosition("80", 110, 111);
        
        // Position 112-131: Número de documento del retenido (CUIT - ALINEAR A LA IZQUIERDA)
        if (mapping.cuit !== undefined && row[mapping.cuit]) {
            let cuit = row[mapping.cuit].toString().replace(/\D/g, ''); // Remove non-digits
            setPosition(cuit, 112, 131, false);  // false = izquierda (no derecha!)
        } else {
            setPosition("0", 112, 131);
        }
        
        // Position 132-145: Número certificado original (completar con ceros)
        const certificado = String(lineNumber).padStart(14, '0');  // 14 posiciones rellenadas con ceros
        setPosition(certificado, 132, 145, true);
        
    } catch (error) {
        throw new Error(`Error formatting row: ${error.message}`);
    }
    
    // Convert array back to string
    return lineArray.join('');
}

// Format date to DD/MM/AAAA
function formatDate(dateValue) {
    let date;
    
    if (dateValue instanceof Date) {
        date = dateValue;
    } else if (typeof dateValue === 'number') {
        // Excel date serial number - corregir el desfase de timezone
        date = new Date((dateValue - 25569) * 86400 * 1000);
        // Ajustar para zona horaria local para evitar desfase de días
        date = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
    } else if (typeof dateValue === 'string') {
        date = new Date(dateValue);
    } else {
        throw new Error('Invalid date format');
    }
    
    if (isNaN(date.getTime())) {
        throw new Error('Invalid date');
    }
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
}

// Format number for TXT output
function formatNumber(value) {
    if (value === null || value === undefined || value === '') {
        return '0,00';
    }
    
    let num = parseFloat(value);
    if (isNaN(num)) {
        return '0,00';
    }
    
    // Format with 2 decimal places and replace dot with comma
    let formatted = num.toFixed(2).replace('.', ',');
    
    // Remove any thousands separators that might exist
    formatted = formatted.replace(/\./g, '');
    
    return formatted;
}

// Progress management
function showProgress(percentage, message) {
    progressSection.style.display = 'block';
    progressFill.style.width = percentage + '%';
    progressText.textContent = message;
}

function hideProgress() {
    progressSection.style.display = 'none';
}

// Show result section
function showResult() {
    resultSection.style.display = 'block';
}

// Download TXT file
function downloadTxtFile() {
    if (!processedData) {
        showError('No hay datos procesados para descargar');
        return;
    }
    
    const blob = new Blob([processedData], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sicore_retenciones.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    window.URL.revokeObjectURL(url);
}

// Preview file content
function previewFile() {
    if (!processedData) {
        showError('No hay datos procesados para previsualizar');
        return;
    }
    
    // Show first 20 lines for preview
    const lines = processedData.split('\n');
    const previewLines = lines.slice(0, 20);
    const preview = previewLines.join('\n');
    
    if (lines.length > 20) {
        previewContent.textContent = preview + '\n\n... y ' + (lines.length - 20) + ' líneas más';
    } else {
        previewContent.textContent = preview;
    }
    
    previewModal.style.display = 'flex';
}

// Close preview modal
function closePreview() {
    previewModal.style.display = 'none';
}

// Error handling
function showError(message) {
    alert('Error: ' + message);
}

// Debug function to show data extraction from Excel
function debugDataExtraction(row, mapping) {
    console.log("=== DEBUG: Extracción de datos del Excel ===");
    console.log("Fila completa:", row);
    console.log("");
    console.log("Columna A (fecha):", row[mapping.fecha]);
    console.log("Columna E (numero):", row[mapping.numero]);
    console.log("Columna F (neto):", row[mapping.neto]);
    console.log("Columna G (iva):", row[mapping.iva]);
    console.log("Columna H (cuit):", row[mapping.cuit]);
    console.log("Columna L (retencion):", row[mapping.retencion]);
    console.log("");
    
    // Calcular importes
    let importeComprobante = 0;
    if (mapping.neto !== undefined && row[mapping.neto]) {
        importeComprobante += parseFloat(row[mapping.neto]) || 0;
    }
    if (mapping.iva !== undefined && row[mapping.iva]) {
        importeComprobante += parseFloat(row[mapping.iva]) || 0;
    }
    
    console.log("CÁLCULOS:");
    console.log("Importe comprobante (F+G):", importeComprobante);
    console.log("Base cálculo (solo F):", row[mapping.neto]);
    
    // Número sin ceros a la izquierda
    let numeroSinCeros = "0";
    if (mapping.numero !== undefined && row[mapping.numero]) {
        numeroSinCeros = row[mapping.numero].toString().replace(/^0+/, '') || '0';
    }
    console.log("Número sin ceros:", numeroSinCeros);
    console.log("==========================================");
}

// Debug function to show exact positioning (only for development)
function debugLinePositions(line) {
    console.log("=== DEBUG: Posiciones exactas ===");
    console.log("Línea completa (" + line.length + " caracteres):");
    console.log('"' + line + '"');
    console.log("");
    console.log("Pos. 1-2 (Código comprobante):", '"' + line.substring(0, 2) + '"');
    console.log("Pos. 3-12 (Fecha emisión):", '"' + line.substring(2, 12) + '"');
    console.log("Pos. 13-28 (Número comprobante):", '"' + line.substring(12, 28) + '"');
    console.log("Pos. 29-44 (Importe comprobante F+G):", '"' + line.substring(28, 44) + '"');
    console.log("Pos. 45-48 (Código impuesto 0217):", '"' + line.substring(44, 48) + '"');
    console.log("Pos. 49-52 (Código régimen 0311):", '"' + line.substring(48, 52) + '"');
    console.log("Pos. 53-66 (Base cálculo F):", '"' + line.substring(52, 66) + '"');
    console.log("Pos. 67-76 (Fecha retención):", '"' + line.substring(66, 76) + '"');
    console.log("Pos. 77-78 (Código condición 01):", '"' + line.substring(76, 78) + '"');
    console.log("Pos. 79 (Retención suspendidos):", '"' + line.substring(78, 79) + '"');
    console.log("Pos. 80-93 (Importe retención L):", '"' + line.substring(79, 93) + '"');
    console.log("Pos. 94-99 (Porcentaje exclusión):", '"' + line.substring(93, 99) + '"');
    console.log("Pos. 100-109 (Fecha publicación):", '"' + line.substring(99, 109) + '"');
    console.log("Pos. 110-111 (Tipo documento):", '"' + line.substring(109, 111) + '"');
    console.log("Pos. 112-131 (CUIT H):", '"' + line.substring(111, 131) + '"');
    console.log("Pos. 132-145 (Certificado):", '"' + line.substring(131, 145) + '"');
    console.log("=====================================");
}