/**
 * Servicio para entrenamiento de modelos de Machine Learning
 * 
 * NOTA: Requiere @tensorflow/tfjs instalado
 * Ejecuta: npm install @tensorflow/tfjs
 */

export interface TrainingResult {
  model: any | null;
  history: any | null;
  accuracy: number;
  loss: number;
  epochs: number;
  trainingTime: number;
}

// Importar TensorFlow.js directamente ya que está instalado
import * as tf from '@tensorflow/tfjs';

/**
 * Carga TensorFlow.js (ya está importado estáticamente)
 */
async function loadTensorFlow(): Promise<any> {
  return tf;
}

/**
 * Prepara datos para entrenamiento de modelo de tendencias
 */
export function prepareTrendData(votesByDate: Array<{ date: string; count: number }>) {
  if (votesByDate.length < 2) {
    return null;
  }

  // Convertir fechas a números (días desde la primera fecha)
  const firstDate = new Date(votesByDate[0].date);
  const xs: number[] = [];
  const ys: number[] = [];

  votesByDate.forEach((vote, index) => {
    const date = new Date(vote.date);
    const daysSinceStart = Math.floor((date.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));
    xs.push(daysSinceStart);
    ys.push(vote.count);
  });

  // Normalizar datos
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);
  const normalizedXs = xs.map(x => x / (maxX || 1));
  const normalizedYs = ys.map(y => y / (maxY || 1));

  return {
    xs: normalizedXs,
    ys: normalizedYs,
    maxX,
    maxY,
    originalData: votesByDate,
  };
}

/**
 * Entrena un modelo de regresión para predecir tendencias
 */
export async function trainTrendModel(
  votesByDate: Array<{ date: string; count: number }>
): Promise<TrainingResult> {
  const tf = await loadTensorFlow();
  if (!tf) {
    throw new Error('TensorFlow.js no está instalado. Por favor, ejecuta: npm install @tensorflow/tfjs en el directorio frontend');
  }

  const startTime = Date.now();
  
  const preparedData = prepareTrendData(votesByDate);
  if (!preparedData) {
    throw new Error('No hay suficientes datos para entrenar el modelo');
  }

  // Crear modelo de regresión
  const model = tf.sequential({
    layers: [
      tf.layers.dense({
        inputShape: [1],
        units: 16,
        activation: 'relu',
      }),
      tf.layers.dense({
        units: 8,
        activation: 'relu',
      }),
      tf.layers.dense({
        units: 1,
        activation: 'linear',
      }),
    ],
  });

  // Compilar modelo
  model.compile({
    optimizer: tf.train.adam(0.01),
    loss: 'meanSquaredError',
    metrics: ['mae'], // meanAbsoluteError se escribe como 'mae'
  });

  // Preparar tensores
  const xs = tf.tensor2d(preparedData.xs, [preparedData.xs.length, 1]);
  const ys = tf.tensor2d(preparedData.ys, [preparedData.ys.length, 1]);

  // Dividir en entrenamiento y validación (80/20)
  const splitIndex = Math.floor(preparedData.xs.length * 0.8);
  const trainXs = xs.slice([0, 0], [splitIndex, 1]);
  const trainYs = ys.slice([0, 0], [splitIndex, 1]);
  const valXs = xs.slice([splitIndex, 0], [preparedData.xs.length - splitIndex, 1]);
  const valYs = ys.slice([splitIndex, 0], [preparedData.ys.length - splitIndex, 1]);

  // Entrenar modelo
  const epochs = Math.max(50, Math.min(200, Math.floor(preparedData.xs.length / 2)));
  const history = await model.fit(trainXs, trainYs, {
    epochs: epochs,
    validationData: [valXs, valYs],
    batchSize: Math.min(32, Math.floor(splitIndex / 4)),
    verbose: 0,
  });

  // Calcular métricas finales
  const finalLoss = history.history.loss[history.history.loss.length - 1] as number;
  const finalValLoss = history.history.val_loss 
    ? (history.history.val_loss[history.history.val_loss.length - 1] as number)
    : finalLoss;
  
  // Accuracy aproximada basada en el error relativo
  const predictions = model.predict(valXs) as any;
  const actuals = valYs;
  const errors = tf.abs(tf.sub(predictions, actuals));
  const meanError = (await errors.mean().data())[0];
  const accuracy = Math.max(0, Math.min(100, (1 - meanError) * 100));

  // Limpiar tensores
  xs.dispose();
  ys.dispose();
  trainXs.dispose();
  trainYs.dispose();
  valXs.dispose();
  valYs.dispose();
  predictions.dispose();
  actuals.dispose();
  errors.dispose();

  const trainingTime = Math.round((Date.now() - startTime) / 1000);

  return {
    model,
    history,
    accuracy: Math.round(accuracy * 10) / 10,
    loss: Math.round(finalValLoss * 1000) / 1000,
    epochs: epochs,
    trainingTime,
  };
}

/**
 * Prepara datos para detección de anomalías
 */
export function prepareAnomalyData(
  votes: Array<{ voter_dni: string; voted_at: string; category: string }>
) {
  const features: number[] = [];
  const labels: number[] = [];

  // Calcular características para cada voto
  const voterCounts = new Map<string, number>();
  const timeSlots = new Map<string, number>();

  votes.forEach(vote => {
    const voterDni = vote.voter_dni;
    const votedAt = new Date(vote.voted_at);
    const hour = votedAt.getHours();
    const dayOfWeek = votedAt.getDay();

    // Contar votos por votante
    const voterCount = voterCounts.get(voterDni) || 0;
    voterCounts.set(voterDni, voterCount + 1);

    // Contar votos en el mismo slot de tiempo (hora)
    const timeSlot = `${votedAt.toISOString().split('T')[0]}_${hour}`;
    const slotCount = timeSlots.get(timeSlot) || 0;
    timeSlots.set(timeSlot, slotCount + 1);

    // Características: [votos del mismo votante, hora del día, día de la semana, votos en el mismo slot]
    features.push(
      voterCount,
      hour / 24, // Normalizado
      dayOfWeek / 7, // Normalizado
      slotCount / 100 // Normalizado
    );

    // Etiqueta: 0 = normal, 1 = anomalía
    // Considerar anomalía si: más de 1 voto del mismo votante, fuera de horario, o muchos votos en mismo slot
    const isAnomaly = voterCount > 1 || hour < 8 || hour >= 18 || slotCount > 50 ? 1 : 0;
    labels.push(isAnomaly);
  });

  return { features, labels };
}

/**
 * Entrena un modelo de detección de anomalías
 */
export async function trainAnomalyModel(
  votes: Array<{ voter_dni: string; voted_at: string; category: string }>
): Promise<TrainingResult> {
  const tf = await loadTensorFlow();
  if (!tf) {
    throw new Error('TensorFlow.js no está instalado. Por favor, ejecuta: npm install @tensorflow/tfjs en el directorio frontend');
  }

  const startTime = Date.now();

  if (votes.length < 10) {
    throw new Error('No hay suficientes datos para entrenar el modelo de anomalías');
  }

  const { features, labels } = prepareAnomalyData(votes);

  // Crear modelo de clasificación binaria
  const model = tf.sequential({
    layers: [
      tf.layers.dense({
        inputShape: [4],
        units: 32,
        activation: 'relu',
      }),
      tf.layers.dropout({ rate: 0.2 }),
      tf.layers.dense({
        units: 16,
        activation: 'relu',
      }),
      tf.layers.dense({
        units: 1,
        activation: 'sigmoid',
      }),
    ],
  });

  // Compilar modelo
  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: 'binaryCrossentropy',
    metrics: ['accuracy'],
  });

  // Preparar tensores
  const numSamples = Math.floor(features.length / 4);
  const xs = tf.tensor2d(features, [numSamples, 4]);
  const ys = tf.tensor1d(labels);

  // Dividir en entrenamiento y validación
  const splitIndex = Math.floor(numSamples * 0.8);
  const trainXs = xs.slice([0, 0], [splitIndex, 4]);
  const trainYs = ys.slice([0], [splitIndex]);
  const valXs = xs.slice([splitIndex, 0], [numSamples - splitIndex, 4]);
  const valYs = ys.slice([splitIndex], [numSamples - splitIndex]);

  // Entrenar modelo
  const epochs = Math.max(30, Math.min(100, Math.floor(numSamples / 5)));
  const history = await model.fit(trainXs, trainYs, {
    epochs: epochs,
    validationData: [valXs, valYs],
    batchSize: Math.min(32, Math.floor(splitIndex / 4)),
    verbose: 0,
  });

  // Calcular métricas
  const finalLoss = history.history.loss[history.history.loss.length - 1] as number;
  const finalValLoss = history.history.val_loss 
    ? (history.history.val_loss[history.history.val_loss.length - 1] as number)
    : finalLoss;
  
  const finalAccuracy = history.history.acc 
    ? (history.history.acc[history.history.acc.length - 1] as number) * 100
    : (history.history.accuracy 
        ? (history.history.accuracy[history.history.accuracy.length - 1] as number) * 100
        : 0);

  // Limpiar tensores
  xs.dispose();
  ys.dispose();
  trainXs.dispose();
  trainYs.dispose();
  valXs.dispose();
  valYs.dispose();

  const trainingTime = Math.round((Date.now() - startTime) / 1000);

  return {
    model,
    history,
    accuracy: Math.round(finalAccuracy * 10) / 10,
    loss: Math.round(finalValLoss * 1000) / 1000,
    epochs: epochs,
    trainingTime,
  };
}

/**
 * Prepara datos para análisis de participación
 */
export function prepareParticipationData(
  participationByRegion: Record<string, { predicted: number; actual: number; demographic: string }>
) {
  const features: number[] = [];
  const labels: number[] = [];
  const regionNames: string[] = [];

  Object.entries(participationByRegion).forEach(([region, data]) => {
    // Características: [código de región normalizado, demografía codificada]
    const regionCode = region.charCodeAt(0) % 100 / 100; // Normalizado
    const demographicCode = data.demographic === 'Urbano' ? 1 : data.demographic === 'Rural' ? 0.5 : 0.25;
    
    features.push(regionCode, demographicCode);
    labels.push(data.actual / 100); // Normalizado a 0-1
    regionNames.push(region);
  });

  return { features, labels, regionNames };
}

/**
 * Entrena un modelo de regresión para predecir participación
 */
export async function trainParticipationModel(
  participationByRegion: Record<string, { predicted: number; actual: number; demographic: string }>
): Promise<TrainingResult> {
  const tf = await loadTensorFlow();
  if (!tf) {
    throw new Error('TensorFlow.js no está instalado. Por favor, ejecuta: npm install @tensorflow/tfjs en el directorio frontend');
  }

  const startTime = Date.now();

  const regions = Object.keys(participationByRegion);
  if (regions.length < 3) {
    throw new Error('No hay suficientes regiones para entrenar el modelo');
  }

  const { features, labels } = prepareParticipationData(participationByRegion);

  // Crear modelo de regresión
  const model = tf.sequential({
    layers: [
      tf.layers.dense({
        inputShape: [2],
        units: 16,
        activation: 'relu',
      }),
      tf.layers.dense({
        units: 8,
        activation: 'relu',
      }),
      tf.layers.dense({
        units: 1,
        activation: 'sigmoid', // Para valores entre 0 y 1 (porcentajes)
      }),
    ],
  });

  // Compilar modelo
  model.compile({
    optimizer: tf.train.adam(0.01),
    loss: 'meanSquaredError',
    metrics: ['mae'], // meanAbsoluteError se escribe como 'mae'
  });

  // Preparar tensores
  const numSamples = Math.floor(features.length / 2);
  const xs = tf.tensor2d(features, [numSamples, 2]);
  const ys = tf.tensor2d(labels, [numSamples, 1]);

  // Dividir en entrenamiento y validación
  const splitIndex = Math.floor(numSamples * 0.8);
  const trainXs = xs.slice([0, 0], [splitIndex, 2]);
  const trainYs = ys.slice([0, 0], [splitIndex, 1]);
  const valXs = xs.slice([splitIndex, 0], [numSamples - splitIndex, 2]);
  const valYs = ys.slice([splitIndex, 0], [numSamples - splitIndex, 1]);

  // Entrenar modelo
  const epochs = Math.max(50, Math.min(150, Math.floor(numSamples * 2)));
  const history = await model.fit(trainXs, trainYs, {
    epochs: epochs,
    validationData: [valXs, valYs],
    batchSize: Math.min(16, Math.floor(splitIndex / 2)),
    verbose: 0,
  });

  // Calcular métricas
  const finalLoss = history.history.loss[history.history.loss.length - 1] as number;
  const finalValLoss = history.history.val_loss 
    ? (history.history.val_loss[history.history.val_loss.length - 1] as number)
    : finalLoss;
  
  // Accuracy basada en error relativo
  const predictions = model.predict(valXs) as any;
  const actuals = valYs;
  const errors = tf.abs(tf.sub(predictions, actuals));
  const meanError = (await errors.mean().data())[0];
  const accuracy = Math.max(0, Math.min(100, (1 - meanError) * 100));

  // Limpiar tensores
  xs.dispose();
  ys.dispose();
  trainXs.dispose();
  trainYs.dispose();
  valXs.dispose();
  valYs.dispose();
  predictions.dispose();
  actuals.dispose();
  errors.dispose();

  const trainingTime = Math.round((Date.now() - startTime) / 1000);

  return {
    model,
    history,
    accuracy: Math.round(accuracy * 10) / 10,
    loss: Math.round(finalValLoss * 1000) / 1000,
    epochs: epochs,
    trainingTime,
  };
}
