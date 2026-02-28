import { Injectable } from '@angular/core';

/**
 * Servicio responsable de la gestión de hojas dentro de un libro Excel.
 * Única responsabilidad: crear, renombrar y copiar hojas.
 */
@Injectable({
  providedIn: 'root'
})
export class ExcelSheetManagerService {

  /**
   * Prepara una hoja para un pozo. Si es el primero, renombra la plantilla;
   * si no, crea una nueva hoja copiando la plantilla.
   * @param file Archivo Excel abierto (instancia excelize)
   * @param nombrePozo Nombre del pozo (se trunca a 31 caracteres)
   * @param index Índice del pozo (0 = primera hoja/plantilla)
   * @returns Nombre de la hoja creada, o null si hubo error
   */
  prepareSheet(file: any, nombrePozo: string, index: number): string | null {
    const nombreHoja = nombrePozo.substring(0, 31);

    if (index === 0) {
      const sheetList = file.GetSheetList();
      const plantillaSheet = sheetList.list[0];
      file.SetSheetName(plantillaSheet, nombreHoja);
      return nombreHoja;
    }

    const newSheetResult = file.NewSheet(nombreHoja);
    if (newSheetResult.error || newSheetResult.index < 0) {
      console.error('Error al crear nueva hoja:', newSheetResult.error);
      return null;
    }

    const copyResult = file.CopySheet(0, newSheetResult.index);
    if (copyResult.error) {
      console.error('Error al copiar hoja:', copyResult.error);
      return null;
    }

    return nombreHoja;
  }
}
