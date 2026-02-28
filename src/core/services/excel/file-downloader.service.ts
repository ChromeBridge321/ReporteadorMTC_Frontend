import { Injectable } from '@angular/core';

/**
 * Servicio responsable de la descarga de archivos Excel generados.
 * Única responsabilidad: convertir el buffer a archivo y disparar la descarga.
 */
@Injectable({
  providedIn: 'root'
})
export class FileDownloaderService {

  /**
   * Genera el archivo Excel final y lo descarga en el navegador.
   * @param file Archivo Excel abierto (instancia excelize)
   * @param fileName Nombre del archivo descargado (e.g. 'Reporte_Pozos_2026-02-28.xlsx')
   * @throws Error si no se puede escribir el buffer
   */
  downloadExcel(file: any, fileName: string): void {
    // Forzar recálculo completo de fórmulas al abrir en Excel
    file.SetCalcProps({
      FullCalcOnLoad: true
    });

    const { buffer, error } = file.WriteToBuffer();
    if (error) {
      throw new Error(`Error al escribir buffer: ${error}`);
    }

    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}
