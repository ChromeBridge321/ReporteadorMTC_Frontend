import { Injectable } from '@angular/core';
import { init } from 'excelize-wasm';
import { ExcelWorkbookContext } from '../../models/excel.model';

const EXCELIZE_WASM_URL = 'https://unpkg.com/excelize-wasm@0.1.0/excelize.wasm.gz';

/**
 * Servicio responsable de cargar plantillas Excel e inicializar el motor WASM.
 * Única responsabilidad: obtener un contexto de trabajo listo para operar.
 */
@Injectable({
  providedIn: 'root'
})
export class ExcelLoaderService {

  /**
   * Carga una plantilla Excel desde una URL y devuelve el contexto de trabajo.
   * @param templateUrl Ruta relativa a la plantilla (e.g. '/plantillaReporteDiario.xlsx')
   * @returns Contexto con la instancia de excelize y el archivo abierto
   * @throws Error si no se puede cargar o abrir la plantilla
   */
  async loadTemplate(templateUrl: string): Promise<ExcelWorkbookContext> {
    const response = await fetch(templateUrl);
    if (!response.ok) {
      throw new Error(`Error al cargar plantilla: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    const excelize = await init(EXCELIZE_WASM_URL);

    const file = excelize.OpenReader(uint8Array);
    if (file.error) {
      throw new Error(`Error al abrir plantilla: ${file.error}`);
    }

    return { excelize, file };
  }
}
