// Импорт mp4box.js
importScripts('mp4box.all.js', 'mp4-builder.js');

// Хранилище для сегментов видео по табам
const videoData = new Map();

// Логирование
function log(message, data = null) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`, data || '');
}

// Инициализация данных для таба
function initTabData(tabId) {
    if (!videoData.has(tabId)) {
        videoData.set(tabId, {
            segments: [],
            mimeType: null,
            videos: [],
            isRecording: false,
            startTime: null,
            mp4Builder: new MP4Builder()
        });
        log(`Инициализирован таб ${tabId}`);
    }
    return videoData.get(tabId);
}

// Обработка сообщений
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    const tabId = sender.tab?.id || msg.tabId;
    
    if (msg.type === "VIDEO_DETECTED") {
        const data = initTabData(tabId);
        const videoInfo = {
            url: msg.url,
            type: msg.videoType,
            title: msg.title || 'Видео без названия',
            timestamp: Date.now()
        };
        
        // Проверяем, не добавлено ли уже это видео
        const exists = data.videos.some(v => v.url === videoInfo.url);
        if (!exists) {
            data.videos.push(videoInfo);
            log(`Обнаружено видео на табе ${tabId}:`, videoInfo);
        }
        
        sendResponse({ success: true });
    }
    
    if (msg.type === "VIDEO_MIME") {
        const data = initTabData(tabId);
        data.mimeType = msg.mime;
        data.isRecording = true;
        data.startTime = Date.now();
        log(`MIME тип установлен для таба ${tabId}: ${msg.mime}`);
        sendResponse({ success: true });
    }

    if (msg.type === "VIDEO_SEGMENT") {
        const data = initTabData(tabId);
        if (data.isRecording) {
            const segment = new Uint8Array(msg.data);
            data.segments.push(segment);
            
            // Добавляем в mp4Builder для обработки
            try {
                data.mp4Builder.addSegment(segment.buffer);
            } catch (error) {
                log(`Ошибка добавления сегмента в mp4Builder: ${error.message}`);
            }
            
            log(`Сегмент добавлен для таба ${tabId}. Всего: ${data.segments.length}`);
        }
        sendResponse({ success: true });
    }

    if (msg.type === "GET_STATUS") {
        const data = videoData.get(tabId) || initTabData(tabId);
        sendResponse({
            segments: data.segments.length,
            mime: data.mimeType,
            videos: data.videos,
            isRecording: data.isRecording,
            recordingTime: data.startTime ? Math.floor((Date.now() - data.startTime) / 1000) : 0
        });
    }

    if (msg.type === "START_RECORDING") {
        const data = initTabData(tabId);
        data.isRecording = true;
        data.startTime = Date.now();
        data.segments = [];
        data.mp4Builder.reset();
        data.mp4Builder.init();
        log(`Запись начата для таба ${tabId}`);
        sendResponse({ success: true });
    }

    if (msg.type === "STOP_RECORDING") {
        const data = videoData.get(tabId);
        if (data) {
            data.isRecording = false;
            log(`Запись остановлена для таба ${tabId}. Собрано сегментов: ${data.segments.length}`);
        }
        sendResponse({ success: true });
    }

    if (msg.type === "DOWNLOAD_SEGMENTS") {
        const data = videoData.get(tabId);
        if (!data || data.segments.length === 0) {
            sendResponse({ success: false, error: "Нет сегментов для скачивания" });
            return;
        }

        // Используем асинхронную функцию для сборки
        (async () => {
            try {
                log(`Начинаем сборку MP4 из ${data.segments.length} сегментов`);
                
                // Пробуем собрать через mp4Builder
                let finalBuffer;
                try {
                    finalBuffer = await data.mp4Builder.build();
                    log('MP4 собран через mp4Builder');
                } catch (error) {
                    log(`mp4Builder не смог собрать, используем простую конкатенацию: ${error.message}`);
                    // Fallback: простая конкатенация
                    const blob = new Blob(data.segments, { type: data.mimeType || "video/mp4" });
                    finalBuffer = await blob.arrayBuffer();
                }

                const blob = new Blob([finalBuffer], { type: data.mimeType || "video/mp4" });
                const url = URL.createObjectURL(blob);
                const filename = `video_${Date.now()}.mp4`;

                chrome.downloads.download({
                    url: url,
                    filename: filename,
                    saveAs: true
                }, (downloadId) => {
                    if (chrome.runtime.lastError) {
                        log(`Ошибка скачивания: ${chrome.runtime.lastError.message}`);
                        sendResponse({ success: false, error: chrome.runtime.lastError.message });
                    } else {
                        log(`Видео скачано: ${filename}, ID: ${downloadId}`);
                        // Очищаем данные после скачивания
                        data.segments = [];
                        data.isRecording = false;
                        data.mp4Builder.reset();
                        sendResponse({ success: true, filename: filename });
                    }
                });
            } catch (error) {
                log(`Ошибка при создании файла: ${error.message}`);
                sendResponse({ success: false, error: error.message });
            }
        })();

        return true; // Асинхронный ответ
    }

    if (msg.type === "DOWNLOAD_DIRECT") {
        const filename = `video_${Date.now()}.mp4`;
        chrome.downloads.download({
            url: msg.url,
            filename: filename,
            saveAs: true
        }, (downloadId) => {
            if (chrome.runtime.lastError) {
                log(`Ошибка прямого скачивания: ${chrome.runtime.lastError.message}`);
                sendResponse({ success: false, error: chrome.runtime.lastError.message });
            } else {
                log(`Прямое скачивание: ${filename}, ID: ${downloadId}`);
                sendResponse({ success: true, filename: filename });
            }
        });
    }

    if (msg.type === "CLEAR_DATA") {
        if (videoData.has(tabId)) {
            const data = videoData.get(tabId);
            if (data.mp4Builder) {
                data.mp4Builder.reset();
            }
            videoData.delete(tabId);
            log(`Данные очищены для таба ${tabId}`);
        }
        sendResponse({ success: true });
    }

    if (msg.type === "GET_MP4_INFO") {
        const data = initTabData(tabId); // Инициализируем если нужно
        
        if (!data.mp4Builder || !data.mp4Builder.isInitialized) {
            sendResponse({ success: false, error: "MP4Builder не инициализирован. Начните запись сегментов." });
            return true;
        }

        if (data.segments.length === 0) {
            sendResponse({ success: false, error: "Нет сегментов для анализа. Запишите видео сначала." });
            return true;
        }

        data.mp4Builder.getInfo()
            .then(info => {
                sendResponse({ success: true, info: info });
            })
            .catch(error => {
                sendResponse({ success: false, error: error.message });
            });

        return true; // Асинхронный ответ
    }

    return true; // Асинхронный ответ
});

// Очистка данных при закрытии таба
chrome.tabs.onRemoved.addListener((tabId) => {
    if (videoData.has(tabId)) {
        videoData.delete(tabId);
        log(`Таб ${tabId} закрыт, данные удалены`);
    }
});

log("Background script запущен");
