/**
 * Modelos e interfaces compartidas para la generación de reportes Excel.
 * Estas interfaces definen los contratos entre los servicios de Excel.
 */

/** Contexto del libro de trabajo Excel (instancia WASM + archivo abierto) */
export interface ExcelWorkbookContext {
  excelize: any;
  file: any;
}

/** Configuración de una serie para gráficos de Excel */
export interface ChartSeriesConfig {
  /** Rango de celdas para el nombre de la serie, e.g. '$F$9:$F$10' */
  nameRange: string;
  /** Rango de celdas para las categorías (eje X), e.g. '$L$11:$L$34' */
  categoriesRange: string;
  /** Rango de celdas para los valores (eje Y), e.g. '$F$11:$F$34' */
  valuesRange: string;
}

/** Configuración completa de un gráfico */
export interface ChartConfig {
  /** Celda donde se posiciona el gráfico, e.g. 'A54' */
  position: string;
  /** Series de datos del gráfico */
  series: ChartSeriesConfig[];
  /** Título del eje X */
  xAxisTitle: string;
  /** Título del eje Y */
  yAxisTitle: string;
  /** Ancho del gráfico en píxeles */
  width: number;
  /** Alto del gráfico en píxeles */
  height: number;
}
