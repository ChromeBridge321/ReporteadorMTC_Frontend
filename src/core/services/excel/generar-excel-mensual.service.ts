import { Injectable } from '@angular/core';
import { ExcelLoaderService } from './excel-loader.service';
import { FileDownloaderService } from './file-downloader.service';
import { ExcelSheetManagerService } from './excel-sheet-manager.service';
import { ChartBuilderService } from './chart-builder.service';
import { ChartConfig } from '../../models/excel.model';
import { RESTReporteResponse } from '../../models/reporte.model';
import { RESTReporte } from '../../models/reporte.model';
import { RESTPozo } from '../../models/pozos.model';

/**
 * Servicio para generar reportes Excel mensuales.
 * Orquesta los servicios de infraestructura para producir el reporte.
 */
@Injectable({
  providedIn: 'root'
})
export class GenerarExcelMensual {

  private readonly TEMPLATE_URL = '/plantillaReporteMensual.xlsx';
  private readonly DATA_START_ROW = 18;
  private readonly DATA_END_ROW = 48;
  private readonly FORMULA_COLUMNS = ['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'];

  constructor(
    private excelLoader: ExcelLoaderService,
    private fileDownloader: FileDownloaderService,
    private sheetManager: ExcelSheetManagerService,
    private chartBuilder: ChartBuilderService
  ) { }

  async generarExcel(
    pozosArray: RESTReporteResponse,
    pozosSeleccionados: RESTPozo[],
    fechaSeleccionada: string | undefined,
    conexionActual: string | null
  ): Promise<void> {
    try {
      const { excelize, file } = await this.excelLoader.loadTemplate(this.TEMPLATE_URL);

      for (let i = 0; i < pozosArray.length; i++) {
        const pozo = pozosArray[i];
        const nombrePozo = pozosSeleccionados[i]?.NombrePozo || `Pozo ${i + 1}`;

        const sheetName = this.sheetManager.prepareSheet(file, nombrePozo, i);
        if (!sheetName) continue;

        this.writeHeaders(file, sheetName, nombrePozo, conexionActual);
        const estiloNegativo = this.createNegativeStyle(file);
        this.writeDataRows(file, sheetName, pozo.registros, estiloNegativo);
        this.writeFormulas(file, sheetName);
        this.addCharts(file, excelize, sheetName);
      }

      this.fileDownloader.downloadExcel(file, `Reporte_Mensual_${fechaSeleccionada}.xlsx`);
    } catch (error) {
      console.error('Error al generar Excel Mensual:', error);
    }
  }

  /** Escribe los encabezados específicos del reporte mensual */
  private writeHeaders(f: any, sheetName: string, nombrePozo: string, conexionActual: string | null): void {
    f.SetCellValue(sheetName, 'G5', `Pozo ${nombrePozo}`);
    f.SetCellValue(sheetName, 'D11', `${nombrePozo}`);
    f.SetCellValue(sheetName, 'G2', `Activo De Extracción ${conexionActual || 'Conexión'}`);
  }

  /** Crea el estilo para celdas con valores negativos */
  private createNegativeStyle(f: any): any {
    return f.NewStyle({
      Fill: { Type: 'pattern', Pattern: 1, Color: ['#D20000'] },
      Font: { Color: '#FFFFFF', Bold: true },
      Alignment: { Horizontal: 'center', Vertical: 'center' },
      Border: [
        { Type: 'left', Color: '#000000', Style: 1 },
        { Type: 'top', Color: '#000000', Style: 1 },
        { Type: 'right', Color: '#000000', Style: 1 },
        { Type: 'bottom', Color: '#000000', Style: 1 }
      ]
    });
  }

  /** Escribe las filas de datos de registros diarios del mes */
  private writeDataRows(f: any, sheetName: string, registros: RESTReporte[], estiloNegativo: any): void {
    let rowNum = this.DATA_START_ROW;

    registros.forEach((registro) => {
      if (rowNum <= this.DATA_END_ROW) {
        f.SetCellValue(sheetName, `A${rowNum}`, `${registro.Fecha || ''}`);
        f.SetCellValue(sheetName, `B${rowNum}`, Number(registro.Presion_TP || 0));

        // Presión TR - Aplicar estilo si es negativo
        const presionTR = Number(registro.Presion_TR || 0);
        f.SetCellValue(sheetName, `C${rowNum}`, presionTR);
        if (presionTR < 0 && !estiloNegativo.error) {
          f.SetCellStyle(sheetName, `C${rowNum}`, `C${rowNum}`, estiloNegativo.style);
        }

        f.SetCellValue(sheetName, `D${rowNum}`, Number(registro.LDD || 0));
        f.SetCellValue(sheetName, `E${rowNum}`, Number(registro.Temperatura_Pozo || 0));
        f.SetCellValue(sheetName, `F${rowNum}`, Number(registro.Presion_Succion || 0));
        f.SetCellValue(sheetName, `G${rowNum}`, Number(registro.Presion_Descarga || 0));
        f.SetCellValue(sheetName, `H${rowNum}`, Number(registro.Velocidad || 0));
        f.SetCellValue(sheetName, `I${rowNum}`, Number(registro.Temp_Descarga || 0));
        f.SetCellValue(sheetName, `J${rowNum}`, Number(registro.Temp_Succion || 0));
        f.SetCellValue(sheetName, `K${rowNum}`, Number(registro.Qiny || 0));
        rowNum++;
      }
    });
  }

  /** Escribe la fórmula de AVERAGE en la fila resumen */
  private writeFormulas(f: any, sheetName: string): void {
    this.FORMULA_COLUMNS.forEach(col => {
      f.SetCellFormula(sheetName, `${col}49`, `=AVERAGE(${col}${this.DATA_START_ROW}:${col}${this.DATA_END_ROW})`);
    });
  }

  /** Agrega los gráficos específicos del reporte mensual */
  private addCharts(f: any, excelize: any, sheetName: string): void {
    const charts: ChartConfig[] = [
      // Gráfico: Qiny
      {
        position: 'O11',
        series: [
          { nameRange: '$K$16:$K$17', categoriesRange: '$N$18:$N$48', valuesRange: '$K$18:$K$48' }
        ],
        xAxisTitle: 'Dias',
        yAxisTitle: 'MMPCD',
        width: 620,
        height: 240
      },
      // Gráfico: Presión Succión y Descarga
      {
        position: 'O25',
        series: [
          { nameRange: '$F$16:$F$17', categoriesRange: '$N$18:$N$48', valuesRange: '$F$18:$F$48' },
          { nameRange: '$G$16:$G$17', categoriesRange: '$N$18:$N$48', valuesRange: '$G$18:$G$48' }
        ],
        xAxisTitle: 'Dias',
        yAxisTitle: 'kg/cm²',
        width: 620,
        height: 240
      },
      // Gráfico: Presiones TP, TR, LDD
      {
        position: 'O39',
        series: [
          { nameRange: '$B$16:$B$17', categoriesRange: '$N$18:$N$48', valuesRange: '$B$18:$B$48' },
          { nameRange: '$C$16:$C$17', categoriesRange: '$N$18:$N$48', valuesRange: '$C$18:$C$48' },
          { nameRange: '$D$16:$D$17', categoriesRange: '$N$18:$N$48', valuesRange: '$D$18:$D$48' }
        ],
        xAxisTitle: 'Dias',
        yAxisTitle: 'kg/cm²',
        width: 620,
        height: 240
      }
    ];

    this.chartBuilder.addMultipleLineCharts(f, excelize, sheetName, charts);
  }
}
