// MP4 Builder - модуль для сборки MP4 из сегментов с использованием mp4box.js

class MP4Builder {
    constructor() {
        this.mp4boxfile = null;
        this.segments = [];
        this.offset = 0;
        this.isInitialized = false;
        this.info = null;
        this.initSegment = null;
    }

    // Инициализация mp4box
    init() {
        if (typeof MP4Box === 'undefined') {
            console.warn('[MP4Builder] MP4Box library not loaded, будет использована простая конкатенация');
            this.isInitialized = true;
            return;
        }

        try {
            this.mp4boxfile = MP4Box.createFile();
            
            // Настройка обработчиков
            this.mp4boxfile.onReady = (info) => {
                this.info = info;
                console.log('[MP4Builder] MP4 информация получена:', info);
            };

            this.mp4boxfile.onError = (error) => {
                console.error('[MP4Builder] Ошибка MP4Box:', error);
            };

            this.isInitialized = true;
            console.log('[MP4Builder] Инициализирован с MP4Box');
        } catch (error) {
            console.error('[MP4Builder] Ошибка инициализации MP4Box:', error);
            this.isInitialized = true; // Всё равно продолжаем работу
        }
    }

    // Добавление сегмента
    addSegment(arrayBuffer) {
        if (!this.isInitialized) {
            this.init();
        }

        // Сохраняем сегмент
        this.segments.push(arrayBuffer);

        // Пробуем добавить в mp4box для парсинга
        if (this.mp4boxfile) {
            try {
                const buffer = arrayBuffer.slice(0); // Копируем буфер
                buffer.fileStart = this.offset;
                this.mp4boxfile.appendBuffer(buffer);
                this.offset += arrayBuffer.byteLength;
            } catch (error) {
                console.warn('[MP4Builder] Не удалось добавить в MP4Box:', error.message);
            }
        }

        console.log(`[MP4Builder] Сегмент добавлен. Размер: ${arrayBuffer.byteLength}, Всего: ${this.segments.length}`);
    }

    // Сборка финального MP4
    async build() {
        return new Promise((resolve, reject) => {
            if (this.segments.length === 0) {
                reject(new Error('Нет сегментов для сборки'));
                return;
            }

            try {
                console.log(`[MP4Builder] Начинаем сборку из ${this.segments.length} сегментов`);

                // Метод 1: Пробуем использовать mp4box для правильной сборки
                if (this.mp4boxfile && this.info) {
                    console.log('[MP4Builder] Используем MP4Box для сборки');
                    this.buildWithMP4Box()
                        .then(resolve)
                        .catch((error) => {
                            console.warn('[MP4Builder] MP4Box сборка не удалась, используем конкатенацию:', error.message);
                            resolve(this.buildSimple());
                        });
                } else {
                    // Метод 2: Простая конкатенация (fallback)
                    console.log('[MP4Builder] Используем простую конкатенацию');
                    resolve(this.buildSimple());
                }
            } catch (error) {
                console.error('[MP4Builder] Ошибка сборки:', error);
                reject(error);
            }
        });
    }

    // Сборка с использованием MP4Box (продвинутый метод)
    async buildWithMP4Box() {
        return new Promise((resolve, reject) => {
            try {
                // Финализируем парсинг
                this.mp4boxfile.flush();

                // Получаем треки
                const tracks = this.info.tracks || [];
                if (tracks.length === 0) {
                    throw new Error('Нет треков в MP4');
                }

                console.log(`[MP4Builder] Найдено треков: ${tracks.length}`);

                // Инициализируем сегментацию для каждого трека
                const segmentedData = [];
                
                tracks.forEach(track => {
                    this.mp4boxfile.setSegmentOptions(track.id, null, {
                        nbSamples: 1000 // Количество сэмплов на сегмент
                    });
                });

                // Обработчик готовых сегментов
                this.mp4boxfile.onSegment = (id, user, buffer, sampleNum, isLast) => {
                    segmentedData.push(buffer);
                    
                    if (isLast) {
                        // Собираем все сегменты
                        const totalLength = segmentedData.reduce((sum, buf) => sum + buf.byteLength, 0);
                        const result = new Uint8Array(totalLength);
                        
                        let offset = 0;
                        for (const buf of segmentedData) {
                            result.set(new Uint8Array(buf), offset);
                            offset += buf.byteLength;
                        }

                        console.log(`[MP4Builder] MP4Box сборка завершена. Размер: ${totalLength} байт`);
                        resolve(result.buffer);
                    }
                };

                // Запускаем сегментацию
                const initSegs = this.mp4boxfile.initializeSegmentation();
                console.log('[MP4Builder] Сегментация инициализирована:', initSegs);
                
                this.mp4boxfile.start();

            } catch (error) {
                reject(error);
            }
        });
    }

    // Простая конкатенация сегментов (fallback метод)
    buildSimple() {
        const totalLength = this.segments.reduce((sum, seg) => sum + seg.byteLength, 0);
        const result = new Uint8Array(totalLength);
        
        let offset = 0;
        for (const segment of this.segments) {
            result.set(new Uint8Array(segment), offset);
            offset += segment.byteLength;
        }

        console.log(`[MP4Builder] Простая сборка завершена. Размер: ${totalLength} байт`);
        return result.buffer;
    }

    // Получение информации о файле
    async getInfo() {
        return new Promise((resolve, reject) => {
            if (!this.isInitialized) {
                reject(new Error('MP4Builder не инициализирован'));
                return;
            }

            if (!this.mp4boxfile) {
                reject(new Error('MP4Box не доступен'));
                return;
            }

            if (this.info) {
                resolve(this.info);
                return;
            }

            this.mp4boxfile.onReady = (info) => {
                this.info = info;
                console.log('[MP4Builder] Информация о файле:', info);
                resolve(info);
            };

            this.mp4boxfile.onError = (error) => {
                console.error('[MP4Builder] Ошибка парсинга:', error);
                reject(error);
            };

            // Финализируем парсинг
            this.mp4boxfile.flush();
        });
    }

    // Очистка
    reset() {
        if (this.mp4boxfile) {
            try {
                this.mp4boxfile.flush();
            } catch (e) {
                // Игнорируем ошибки при очистке
            }
        }
        
        this.segments = [];
        this.offset = 0;
        this.mp4boxfile = null;
        this.isInitialized = false;
        this.info = null;
        this.initSegment = null;
        
        console.log('[MP4Builder] Сброшен');
    }

    // Получение статистики
    getStats() {
        return {
            segments: this.segments.length,
            totalSize: this.segments.reduce((sum, seg) => sum + seg.byteLength, 0),
            offset: this.offset,
            isInitialized: this.isInitialized,
            hasInfo: !!this.info,
            tracks: this.info?.tracks?.length || 0
        };
    }
}

// Экспорт для использования в других скриптах
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MP4Builder;
}

