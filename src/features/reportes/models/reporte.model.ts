export interface RESTReporte {
  Pozo: string;
  Hora: string;
  Hora_Formato: string;
  Presion_TP: number;
  Presion_TR: number;
  LDD: number;
  Temperatura_Pozo: number;
  Temp_LE: number;
  Temp_Descarga: number;
  Presion_Succion: number;
  Presion_Estatica_Descarga: number;
  Velocidad: number;
  Temperatura_Descarga: number;
  Temperatura_Succion: number;
}

// Interfaz para la respuesta del endpoint (objeto con claves dinámicas)
export interface RESTReporteResponse {
  [nombrePozo: string]: RESTReporte[];
}
