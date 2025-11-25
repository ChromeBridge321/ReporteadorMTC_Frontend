export interface RESTReporte {
  Pozo: string;
  Hora?: string;
  Fecha?: string;
  Hora_Formato?: string;
  Dia_Semana?: string;
  Fecha_Formato?: string;
  Presion_TP: number;
  Presion_TR: number;
  LDD: number;
  Temperatura_Pozo: number;
  Presion_Succion: number;
  Presion_Descarga: number;
  Velocidad: number;
  Temp_Descarga: number;
  Temp_Succion: number;
}

// Interfaz para agrupar registros por pozo
export interface RESTReportePorPozo {
  nombrePozo: string;
  reporte: string;
  registros: RESTReporte[];
}

// Interfaz para la respuesta del endpoint (array de pozos con sus registros)
export type RESTReporteResponse = RESTReportePorPozo[];
