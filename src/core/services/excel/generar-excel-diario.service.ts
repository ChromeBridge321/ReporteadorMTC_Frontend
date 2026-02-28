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
 * Servicio para generar reportes Excel diarios.
 * Orquesta los servicios de infraestructura para producir el reporte.
 */
@Injectable({
  providedIn: 'root'
})
export class GenerarExcelDiarioService {

  private readonly TEMPLATE_URL = '/plantillaReporteDiario.xlsx';
  private readonly DATA_START_ROW = 11;
  private readonly DATA_END_ROW = 34;
  private readonly FORMULA_COLUMNS = ['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

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
        this.writeDataRows(file, sheetName, pozo.registros, fechaSeleccionada);
        this.writeFormulas(file, sheetName);
        this.addCharts(file, excelize, sheetName);
      }

      this.fileDownloader.downloadExcel(file, `Reporte_Pozos_${fechaSeleccionada}.xlsx`);
    } catch (error) {
      console.error('Error al generar Excel Diario:', error);
    }
  }

  /** Escribe los encabezados específicos del reporte diario */
  private writeHeaders(f: any, sheetName: string, nombrePozo: string, conexionActual: string | null): void {
    f.SetCellValue(sheetName, 'D4', `Pozo ${nombrePozo}`);
    f.SetCellValue(sheetName, 'D44', `Pozo ${nombrePozo}`);
    f.SetCellValue(sheetName, 'D6', `Activo De Extracción ${conexionActual || 'Conexión'}`);
    f.SetCellValue(sheetName, 'D46', `Activo De Extracción ${conexionActual || 'Conexión'}`);
  }

  /** Escribe las filas de datos de registros horarios */
  private writeDataRows(f: any, sheetName: string, registros: RESTReporte[], fechaSeleccionada: string | undefined): void {
    let rowNum = this.DATA_START_ROW;

    registros.forEach((registro) => {
      if (rowNum <= this.DATA_END_ROW) {
        f.SetCellValue(sheetName, `A${rowNum}`, `${fechaSeleccionada} ${registro.Hora_Formato || ''}`);
        f.SetCellValue(sheetName, `B${rowNum}`, Number(registro.Presion_TP || 0));
        f.SetCellValue(sheetName, `C${rowNum}`, Number(registro.Presion_TR || 0));
        f.SetCellValue(sheetName, `D${rowNum}`, Number(registro.LDD || 0));
        f.SetCellValue(sheetName, `E${rowNum}`, Number(registro.Temperatura_Pozo || 0));
        f.SetCellValue(sheetName, `F${rowNum}`, Number(registro.Presion_Succion || 0));
        f.SetCellValue(sheetName, `G${rowNum}`, Number(registro.Presion_Descarga || 0));
        f.SetCellValue(sheetName, `H${rowNum}`, Number(registro.Velocidad || 0));
        f.SetCellValue(sheetName, `I${rowNum}`, Number(registro.Temp_Descarga || 0));
        f.SetCellValue(sheetName, `J${rowNum}`, Number(registro.Temp_Succion || 0));
        f.SetCellValue(sheetName, `M${rowNum}`, Number(registro.Qiny || 0));
        rowNum++;
      }
    });
  }

  /** Escribe las fórmulas de MAX, AVERAGE y MIN en las filas resumen */
  private writeFormulas(f: any, sheetName: string): void {
    this.FORMULA_COLUMNS.forEach(col => {
      f.SetCellFormula(sheetName, `${col}35`, `=MAX(${col}${this.DATA_START_ROW}:${col}${this.DATA_END_ROW})`);
      f.SetCellFormula(sheetName, `${col}36`, `=AVERAGE(${col}${this.DATA_START_ROW}:${col}${this.DATA_END_ROW})`);
      f.SetCellFormula(sheetName, `${col}37`, `=MIN(${col}${this.DATA_START_ROW}:${col}${this.DATA_END_ROW})`);
    });
  }

  /** Agrega los gráficos específicos del reporte diario */
  private addCharts(f: any, excelize: any, sheetName: string): void {
    const charts: ChartConfig[] = [
      // Gráfico: Presión Succión y Descarga
      {
        position: 'G54',
        series: [
          { nameRange: '$F$9:$F$10', categoriesRange: '$L$11:$L$34', valuesRange: '$F$11:$F$34' },
          { nameRange: '$G$9:$G$10', categoriesRange: '$L$11:$L$34', valuesRange: '$G$11:$G$34' }
        ],
        xAxisTitle: 'Horas',
        yAxisTitle: 'P Succ kg/cm2',
        width: 480,
        height: 240
      },
      // Gráfico: Qiny
      {
        position: 'A54',
        series: [
          { nameRange: '$M$8:$M$10', categoriesRange: '$L$11:$L$34', valuesRange: '$M$11:$M$34' }
        ],
        xAxisTitle: 'Horas',
        yAxisTitle: 'MMPCD',
        width: 480,
        height: 240
      },
      // Gráfico: Presiones TP, TR, LDD
      {
        position: 'A70',
        series: [
          { nameRange: '$B$9:$B$10', categoriesRange: '$L$11:$L$34', valuesRange: '$B$11:$B$34' },
          { nameRange: '$C$9:$C$10', categoriesRange: '$L$11:$L$34', valuesRange: '$C$11:$C$34' },
          { nameRange: '$D$9:$D$10', categoriesRange: '$L$11:$L$34', valuesRange: '$D$11:$D$34' }
        ],
        xAxisTitle: 'Horas',
        yAxisTitle: 'MMPCD',
        width: 480,
        height: 240
      }
    ];

    this.chartBuilder.addMultipleLineCharts(f, excelize, sheetName, charts);
  }
}
