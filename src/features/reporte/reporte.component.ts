import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RESTReporteResponse } from './models/reporte.model';
import { TableModule } from 'primeng/table';
import { PozosService } from '../pozos/services/pozos.Service';
import { RESTPozo } from '../pozos/models/pozos.model';
import { Button } from 'primeng/button';
import { init } from 'excelize-wasm';

@Component({
  selector: 'app-reporte.component',
  imports: [CommonModule, TableModule, Button],
  templateUrl: './reporte.component.html',
  styleUrl: './reporte.component.css',
})
export class ReporteComponent implements OnInit {
  pozosArray: RESTReporteResponse = [];
  pozosSeleccionados: RESTPozo[] = [];
  fechaSeleccionada: string | undefined;
  constructor(private pozosService: PozosService) { }

  ngOnInit() {
    this.pozosService.reporteData$.subscribe(data => {
      if (data) {
        this.pozosArray = data;
      }
    });

    // Suscribirse a los pozos seleccionados
    this.pozosService.pozosSeleccionados$.subscribe(pozos => {
      this.pozosSeleccionados = pozos;
    });

    this.pozosService.fechaSeleccionada$.subscribe(fecha => {
      this.fechaSeleccionada = fecha;
    });


  }

  async exportarExcel() {
    try {
      // Cargar plantilla desde public
      const response = await fetch('/plantillaReporteDiario.xlsx');
      if (!response.ok) {
        console.error('Error al cargar plantilla:', response.statusText);
        return;
      }

      const arrayBuffer = await response.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // Inicializar Excelize con WASM desde CDN
      const excelize = await init('https://unpkg.com/excelize-wasm@0.1.0/excelize.wasm.gz');

      // Abrir la plantilla
      const f = excelize.OpenReader(uint8Array);
      if (f.error) {
        console.error('Error al abrir plantilla:', f.error);
        return;
      }

      // Obtener el nombre de la primera hoja (plantilla)
      const sheetList = f.GetSheetList();
      const plantillaSheet = sheetList.list[0];

      // Procesar cada pozo
      for (let i = 0; i < this.pozosArray.length; i++) {
        const pozo = this.pozosArray[i];
        const nombrePozo = this.pozosSeleccionados[i]?.NombrePozo || `Pozo ${i + 1}`;
        const nombreHoja = nombrePozo.substring(0, 31);

        let sheetName: string;

        if (i === 0) {
          // Renombrar la primera hoja (plantilla) con el nombre del primer pozo
          f.SetSheetName(plantillaSheet, nombreHoja);
          sheetName = nombreHoja;
        } else {
          // Crear nueva hoja con el nombre del pozo
          const newSheetResult = f.NewSheet(nombreHoja);
          if (newSheetResult.error || newSheetResult.index < 0) {
            console.error('Error al crear nueva hoja:', newSheetResult.error);
            continue;
          }

          // Copiar contenido de la primera hoja (índice 0) a la nueva hoja
          const copyResult = f.CopySheet(0, newSheetResult.index);
          if (copyResult.error) {
            console.error('Error al copiar hoja:', copyResult.error);
            continue;
          }

          sheetName = nombreHoja;
        }

        // Cambiar texto en celda merged D4:I4 - "Pozo NombrePozo"
        f.SetCellValue(sheetName, 'D4', `Pozo ${nombrePozo}`);

        // Cambiar texto en celda merged D44:I44 - "Pozo NombrePozo"
        f.SetCellValue(sheetName, 'D44', `Pozo ${nombrePozo}`);

        // Insertar datos en los rangos especificados
        // A11:A34 - Hora_Formato
        // B11:B34 - Presion_TP
        // C11:C34 - Presion_TR
        // D11:D34 - LDD
        // E11:E34 - Temperatura_Pozo
        // F11:F34 - Presion_Succion
        // G11:G34 - Presion_Descarga
        // H11:H34 - Velocidad
        // I11:I34 - Temp_Descarga
        // J11:J34 - Temp_Succion

        const estiloNegativo = f.NewStyle({
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

        let rowNum = 11;
        pozo.registros.forEach((registro) => {
          // Solo insertar si estamos dentro del rango (11 a 34)
          if (rowNum <= 34) {
            // Insertar fecha + hora en formato "fechaSeleccionada Hora_Formato"
            f.SetCellValue(sheetName, `A${rowNum}`, `${this.fechaSeleccionada} ${registro.Hora_Formato || ''}`);
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
            rowNum++;
          }
        });

        // Insertar fórmulas en las filas 35, 36 y 37 para cada columna (B-J)
        const columnas = ['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
        columnas.forEach(col => {
          // Fila 35: MAX
          f.SetCellFormula(sheetName, `${col}35`, `=MAX(${col}11:${col}34)`);
          // Fila 36: AVERAGE
          f.SetCellFormula(sheetName, `${col}36`, `=AVERAGE(${col}11:${col}34)`);
          // Fila 37: MIN
          f.SetCellFormula(sheetName, `${col}37`, `=MIN(${col}11:${col}34)`);
        });
      }

      // Forzar recálculo completo al abrir el archivo
      f.SetCalcProps({
        FullCalcOnLoad: true
      });

      // Generar y descargar el archivo
      const { buffer, error } = f.WriteToBuffer();
      if (error) {
        console.error('Error al escribir buffer:', error);
        return;
      }

      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Reporte_Pozos_${this.fechaSeleccionada}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error al generar Excel:', error);
    }
  }
}
