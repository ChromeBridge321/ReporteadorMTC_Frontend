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
      // Inicializar Excelize con WASM desde CDN
      const excelize = await init('https://unpkg.com/excelize-wasm@0.1.0/excelize.wasm.gz');
      
      const f = excelize.NewFile();
      if (f.error) {
        console.error('Error al crear archivo:', f.error);
        return;
      }

      // Crear una hoja por cada pozo
      for (let i = 0; i < this.pozosArray.length; i++) {
        const pozo = this.pozosArray[i];
        const nombrePozo = this.pozosSeleccionados[i]?.NombrePozo || `Pozo ${i + 1}`;
        
        // Crear worksheet con el nombre del pozo (máximo 31 caracteres)
        const nombreHoja = nombrePozo.substring(0, 31);
        
        // Crear nueva hoja o renombrar la primera
        if (i === 0) {
          // Renombrar la primera hoja (Sheet1)
          f.SetSheetName('Sheet1', nombreHoja);
        } else {
          // Crear nueva hoja
          f.NewSheet(nombreHoja);
        }

        // Configurar encabezados
        const esDiario = pozo.reporte === 'Diario';
        const headers = [
          esDiario ? 'Hora' : 'Fecha',
          'Presión TP',
          'Presión TR',
          'LDD',
          'Temperatura Pozo',
          'Presión Succión',
          'Presión Descarga',
          'Velocidad',
          'Temp. Descarga',
          'Temp. Succión'
        ];

        // Agregar título (merge A1:J1)
        f.MergeCell(nombreHoja, 'A1', 'J1');
        f.SetCellValue(nombreHoja, 'A1', `Reporte ${pozo.reporte} - ${nombrePozo}`);
        
        // Estilo para el título
        const titleStyle = f.NewStyle({
          Font: { Bold: true, Size: 16 },
          Alignment: { Horizontal: 'center', Vertical: 'center' },
          Fill: { Type: 'pattern', Pattern: 1, Color: ['#4472C4'] }
        });
        if (!titleStyle.error) {
          f.SetCellStyle(nombreHoja, 'A1', 'J1', titleStyle.style);
        }

        // Agregar fecha (merge A2:J2)
        f.MergeCell(nombreHoja, 'A2', 'J2');
        f.SetCellValue(nombreHoja, 'A2', `Fecha: ${this.fechaSeleccionada}`);
        
        const fechaStyle = f.NewStyle({
          Font: { Bold: true, Size: 12 },
          Alignment: { Horizontal: 'center' }
        });
        if (!fechaStyle.error) {
          f.SetCellStyle(nombreHoja, 'A2', 'J2', fechaStyle.style);
        }

        // Estilo para encabezados de columnas
        const headerStyle = f.NewStyle({
          Font: { Bold: true, Color: '#FFFFFF' },
          Alignment: { Horizontal: 'center', Vertical: 'center' },
          Fill: { Type: 'pattern', Pattern: 1, Color: ['#2E75B6'] },
          Border: [
            { Type: 'left', Color: '#000000', Style: 1 },
            { Type: 'top', Color: '#000000', Style: 1 },
            { Type: 'right', Color: '#000000', Style: 1 },
            { Type: 'bottom', Color: '#000000', Style: 1 }
          ]
        });

        // Agregar encabezados de columnas en la fila 4
        const columns = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
        headers.forEach((header, idx) => {
          const cell = `${columns[idx]}4`;
          f.SetCellValue(nombreHoja, cell, header);
          if (!headerStyle.error) {
            f.SetCellStyle(nombreHoja, cell, cell, headerStyle.style);
          }
        });

        // Estilo para datos con bordes
        const dataStyle = f.NewStyle({
          Alignment: { Horizontal: 'right' },
          Border: [
            { Type: 'left', Color: '#000000', Style: 1 },
            { Type: 'top', Color: '#000000', Style: 1 },
            { Type: 'right', Color: '#000000', Style: 1 },
            { Type: 'bottom', Color: '#000000', Style: 1 }
          ]
        });

        // Agregar datos
        let rowNum = 5;
        pozo.registros.forEach((registro) => {
          const valores = [
            registro.Hora_Formato || registro.Fecha_Formato,
            Number(registro.Presion_TP || 0).toFixed(2),
            Number(registro.Presion_TR || 0).toFixed(2),
            Number(registro.LDD || 0).toFixed(2),
            Number(registro.Temperatura_Pozo || 0).toFixed(2),
            Number(registro.Presion_Succion || 0).toFixed(2),
            Number(registro.Presion_Descarga || 0).toFixed(2),
            Number(registro.Velocidad || 0).toFixed(2),
            Number(registro.Temp_Descarga || 0).toFixed(2),
            Number(registro.Temp_Succion || 0).toFixed(2)
          ];

          valores.forEach((valor, idx) => {
            const cell = `${columns[idx]}${rowNum}`;
            f.SetCellValue(nombreHoja, cell, valor || '0.00');
            if (!dataStyle.error) {
              f.SetCellStyle(nombreHoja, cell, cell, dataStyle.style);
            }
          });

          rowNum++;
        });

        // Ajustar ancho de columnas
        columns.forEach(col => {
          f.SetColWidth(nombreHoja, col, col, 15);
        });
      }

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
