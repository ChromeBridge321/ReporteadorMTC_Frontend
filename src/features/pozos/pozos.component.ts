import { Component, OnInit, signal, computed, OnDestroy } from '@angular/core';
import { TableModule } from 'primeng/table';
import { PozosService } from '../../core/services/pozos.Service';
import { RESTPozo } from '../../core/models/pozos.model';
import { Button } from 'primeng/button';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Select } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DatePicker } from 'primeng/datepicker';
import { ProgressBar } from 'primeng/progressbar';
import { Router, ActivatedRoute } from '@angular/router';
import { RESTReporteResponse } from '../../core/models/reporte.model';
import { Subject } from 'rxjs';
import { debounceTime, switchMap, takeUntil } from 'rxjs/operators';
import { SkeletonModule } from 'primeng/skeleton';
interface Conexion {
  name: string;
  conexion: string;
}
@Component({
  selector: 'app-pozos.component',
  imports: [TableModule, Button, Toast, Select, FormsModule, DatePicker, ProgressBar, CommonModule, SkeletonModule],
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
  progressValue = signal<number>(0);
  private progressInterval: any;
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
    this.startProgress();
    const IdsPozos: number[] = this.pozosSeleccionados().map(p => p.IdPozo);
    const fechaFormateada = this.formatearFecha(this.date());
    this.pozosService.clearPozosSeleccionados();
    this.pozosService.clearReporteData();
    this.pozosService.clearFechaSeleccionada();

    this.pozosService.setPozosSeleccionados(this.pozosSeleccionados());
    this.pozosService.setFechaSeleccionada(fechaFormateada);
    this.loading = true;
    if (this.tipoReporte === 'diario') {
      this.pozosService.generarReporteDiario(IdsPozos, fechaFormateada, this.conexionSeleccionada.conexion).subscribe({
        next: (data: RESTReporteResponse) => {
          this.completeProgress(() => {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Reporte generado correctamente' });
            this.router.navigate(['reporte/pozos/diario/ver']);
          });
          this.loading = false;
        }, error: () => {
          this.stopProgressOnError();
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al generar el reporte' });
          this.loading = false;
        }
      })
    } else {
      this.pozosService.generarReporteMensual(IdsPozos, fechaFormateada, this.conexionSeleccionada.conexion).subscribe({
        next: (data: RESTReporteResponse) => {
          this.completeProgress(() => {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Reporte generado correctamente' });
            this.router.navigate(['reporte/pozos/mensual/ver']);
            this.loading = false;
          });
        }, error: () => {
          this.stopProgressOnError();
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al generar el reporte' });
          this.loading = false;
        }
      })
    }




  }

  startProgress() {
    this.progressValue.set(0);
    this.progressInterval = setInterval(() => {
      const currentValue = this.progressValue();
      if (currentValue < 99) {
        // Progreso logarítmico: rápido al inicio, lento al final
        let increment: number;
        if (currentValue < 30) {
          increment = 3; // Muy rápido al inicio (0-30%)
        } else if (currentValue < 60) {
          increment = 1.5; // Rápido (30-60%)
        } else if (currentValue < 80) {
          increment = 0.8; // Medio (60-80%)
        } else if (currentValue < 90) {
          increment = 0.4; // Lento (80-90%)
        } else {
          increment = 0.15; // Muy lento (90-99%)
        }
        this.progressValue.set(Math.round(Math.min(currentValue + increment, 99)));
      }
    }, 100); // Actualizar cada 100ms
  }

  completeProgress(callback: () => void) {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }

    // Completar al 100%
    this.progressValue.set(100);

    // Esperar 1 segundo antes de ejecutar el callback
    setTimeout(() => {
      this.loadingReporte.set(false);
      this.progressValue.set(0);
      callback();
    }, 1000);
  }

  stopProgressOnError() {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
    this.progressValue.set(0);
    this.loadingReporte.set(false);
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
