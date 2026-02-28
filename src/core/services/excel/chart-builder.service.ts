import { Injectable } from '@angular/core';
import { ChartConfig, ChartSeriesConfig } from '../../models/excel.model';

/**
 * Servicio responsable de la creación de gráficos en hojas Excel.
 * Única responsabilidad: construir y agregar gráficos a una hoja.
 */
@Injectable({
  providedIn: 'root'
})
export class ChartBuilderService {

  /**
   * Agrega un gráfico de líneas a una hoja Excel.
   * @param file Archivo Excel abierto
   * @param excelize Instancia de excelize (para acceder a tipos de gráfico)
   * @param sheetName Nombre de la hoja donde se agrega el gráfico
   * @param config Configuración completa del gráfico
   */
  addLineChart(file: any, excelize: any, sheetName: string, config: ChartConfig): void {
    const chart: any = {
      Type: excelize.Line,
      Series: config.series.map((s: ChartSeriesConfig) => ({
        Name: `'${sheetName}'!${s.nameRange}`,
        Categories: `'${sheetName}'!${s.categoriesRange}`,
        Values: `'${sheetName}'!${s.valuesRange}`
      })),
      Legend: { Position: 'top' },
      XAxis: { Title: [{ Text: config.xAxisTitle }] },
      YAxis: { Title: [{ Text: config.yAxisTitle }] },
      Dimension: { Width: config.width, Height: config.height }
    };

    const result = file.AddChart(sheetName, config.position, chart);
    if (result.error) {
      console.error(`Error al crear gráfico en ${config.position}:`, result.error);
    }
  }

  /**
   * Agrega múltiples gráficos de líneas a una hoja Excel.
   * @param file Archivo Excel abierto
   * @param excelize Instancia de excelize
   * @param sheetName Nombre de la hoja
   * @param charts Array de configuraciones de gráficos
   */
  addMultipleLineCharts(file: any, excelize: any, sheetName: string, charts: ChartConfig[]): void {
    charts.forEach(config => this.addLineChart(file, excelize, sheetName, config));
  }
}
