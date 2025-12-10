import { Component, OnInit, signal, computed, OnDestroy } from '@angular/core';
import { TableModule } from 'primeng/table';
import { PozosService } from '../services/pozos.Service';
import { RESTPozo } from '../models/pozos.model';
import { Button } from 'primeng/button';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Select } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DatePicker } from 'primeng/datepicker';
import { Router, ActivatedRoute } from '@angular/router';
import { RESTReporteResponse } from '../../reporte/models/reporte.model';
import { Subject } from 'rxjs';
import { debounceTime, switchMap, takeUntil } from 'rxjs/operators';
interface Conexion {
  name: string;
  conexion: string;
}
@Component({
  selector: 'app-pozos.component',
  imports: [TableModule, Button, Toast, Select, FormsModule, DatePicker],
  templateUrl: './pozos.component.html',
  styleUrl: './pozos.component.css',
  providers: [MessageService]
})
export class PozosComponent implements OnInit, OnDestroy {
  constructor(
    private pozosService: PozosService,
    private messageService: MessageService,
    private router: Router,
    private route: ActivatedRoute
  ) { }
  loading: boolean = false;
  loadingReporte = signal<boolean>(false);
  date = signal<Date | undefined>(undefined);
  pozosData: RESTPozo[] = [];
  pozosSeleccionados = signal<RESTPozo[]>([]);
  tipoReporte: 'diario' | 'mensual' = 'diario';
  viewMode: 'date' | 'month' = 'date';

  // Subject para manejar cambios de conexión
  private conexionChange$ = new Subject<{ conexion: string; nombre: string }>();
  private destroy$ = new Subject<void>();

  // Computed para determinar si el botón debe estar deshabilitado
  isGenerarReporteDisabled = computed(() => {
    return this.pozosSeleccionados().length === 0 || this.date() === undefined || this.loadingReporte();
  });

  conexiones: Conexion[] = [
    { name: 'Poza Rica', conexion: 'bd_MTC_PozaRica' },
    { name: 'Samaria Luna', conexion: 'bd_SDMC_Motocomp' },
    { name: 'Macuspana Muspac', conexion: 'bd_MTC_Muspac' },
    { name: 'Bellota Jujo', conexion: 'bd_Bellota' },
    { name: 'Cinco Presidentes', conexion: 'bd_MTC_CincoP' },
  ];
  conexionSeleccionada: Conexion = { name: '', conexion: '' };

  ngOnInit() {
    // Obtener tipo de reporte desde los datos de la ruta
    this.route.data.subscribe(data => {
      this.tipoReporte = data['tipo'] || 'diario';
      this.viewMode = this.tipoReporte === 'mensual' ? 'month' : 'date';
    });

    // Configurar el manejo de cambios de conexión con switchMap
    this.conexionChange$.pipe(
      debounceTime(300), // Esperar 300ms después del último cambio
      switchMap(({ conexion, nombre }) => {
        // Guardar la última conexión seleccionada
        this.pozosService.setUltimaConexion({
          name: nombre,
          conexion: conexion
        });

        // Si ya hay pozos cargados para esta conexión, no recargar
        if (this.pozosService.hasPozosCargados(conexion)) {
          this.pozosData = this.pozosService.getPozosCargados() || [];
          this.loading = false;
          return [];
        }

        this.loading = true;
        return this.pozosService.getData(conexion, nombre);
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (data) => {
        if (data.length > 0) {
          this.pozosData = data;
          this.loading = false;
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Pozos cargados correctamente: ' + this.conexionSeleccionada.name
          });
        }
      },
      error: () => {
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error al cargar los pozos: ' + this.conexionSeleccionada.name
        });
      }
    });

    // Verificar si hay una última conexión guardada
    const ultimaConexion = this.pozosService.getUltimaConexion();
    if (ultimaConexion) {
      this.conexionSeleccionada = ultimaConexion;
    }

    // Verificar si ya hay pozos cargados para la conexión actual
    if (this.pozosService.hasPozosCargados(this.conexionSeleccionada.conexion)) {
      this.pozosData = this.pozosService.getPozosCargados() || [];
    } else {
      this.loadPozosData(this.conexionSeleccionada.conexion, this.conexionSeleccionada.name);
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadPozosData(conexion?: string, nombreConexion?: string) {
    if (!conexion && !this.conexionSeleccionada.conexion) {
      return;
    }
    const conexionACargar = conexion || this.conexionSeleccionada.conexion;
    const nombreACargar = nombreConexion || this.conexionSeleccionada.name;

    // Emitir el cambio de conexión para que sea manejado por el stream
    this.conexionChange$.next({
      conexion: conexionACargar,
      nombre: nombreACargar
    });
  }

  generearReporte() {
    this.loadingReporte.set(true);
    const IdsPozos: number[] = this.pozosSeleccionados().map(p => p.IdPozo);
    const fechaFormateada = this.formatearFecha(this.date());
    this.pozosService.clearPozosSeleccionados();
    this.pozosService.clearReporteData();
    this.pozosService.clearFechaSeleccionada();

    this.pozosService.setPozosSeleccionados(this.pozosSeleccionados());
    this.pozosService.setFechaSeleccionada(fechaFormateada);

    if (this.tipoReporte === 'diario') {
      this.pozosService.generarReporteDiario(IdsPozos, fechaFormateada, this.conexionSeleccionada.conexion).subscribe({
        next: (data: RESTReporteResponse) => {
          this.loadingReporte.set(false);
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Reporte generado correctamente' });
          this.router.navigate(['reporte/pozos/diario/ver']);
        }, error: () => {
          this.loadingReporte.set(false);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al generar el reporte' });
        }
      })
    } else {
      this.pozosService.generarReporteMensual(IdsPozos, fechaFormateada, this.conexionSeleccionada.conexion).subscribe({
        next: (data: RESTReporteResponse) => {
          this.loadingReporte.set(false);
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Reporte generado correctamente' });
          this.router.navigate(['reporte/pozos/mensual/ver']);
        }, error: () => {
          this.loadingReporte.set(false);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al generar el reporte' });
        }
      })
    }




  }

  formatearFecha(fecha: Date | undefined): string {
    if (!fecha) return '';
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');

    // Si es mensual, retornar solo YYYY-MM
    if (this.tipoReporte === 'mensual') {
      return `${year}-${month}`;
    }

    // Si es diario, retornar YYYY-MM-DD
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

}
