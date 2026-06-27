// Injector - перехватывает MediaSource API и обычные видео
(function() {
    'use strict';

    console.log('[Video Downloader] Injector загружен');

    // Перехват MediaSource для защищённых видео
    if (typeof MediaSource !== 'undefined') {
        const originalAddSourceBuffer = MediaSource.prototype.addSourceBuffer;
        MediaSource.prototype.addSourceBuffer = function(mime) {
            console.log('[Video Downloader] MediaSource обнаружен:', mime);
            window.postMessage({ 
                type: "VIDEO_MIME", 
                mime: mime 
            }, "*");
            return originalAddSourceBuffer.call(this, mime);
        };

        const originalAppendBuffer = SourceBuffer.prototype.appendBuffer;
        SourceBuffer.prototype.appendBuffer = function(buffer) {
            try {
                let data;
                if (buffer instanceof ArrayBuffer) {
                    data = buffer.slice(0);
                } else if (ArrayBuffer.isView(buffer)) {
                    data = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
                } else {
                    data = buffer;
                }

                window.postMessage({
                    type: "VIDEO_SEGMENT",
                    data: data
                }, "*");
            } catch (e) {
                console.warn('[Video Downloader] Не удалось отправить сегмент:', e.message);
            }

            return originalAppendBuffer.call(this, buffer);
        };
    }

    // Поиск обычных видео на странице
    function detectVideos() {
        const videos = document.querySelectorAll('video');
        videos.forEach((video, index) => {
            if (video.src && !video.dataset.detected) {
                video.dataset.detected = 'true';
                
                const videoInfo = {
                    url: video.src,
                    videoType: 'direct',
                    title: document.title || `Видео ${index + 1}`
                };

                console.log('[Video Downloader] Обнаружено прямое видео:', videoInfo);
                window.postMessage({
                    type: "VIDEO_DETECTED",
                    ...videoInfo
                }, "*");
            }

            // Проверяем source элементы внутри video
            const sources = video.querySelectorAll('source');
            sources.forEach((source, srcIndex) => {
                if (source.src && !source.dataset.detected) {
                    source.dataset.detected = 'true';
                    
                    const videoInfo = {
                        url: source.src,
                        videoType: 'direct',
                        title: document.title || `Видео ${index + 1} (source ${srcIndex + 1})`
                    };

                    console.log('[Video Downloader] Обнаружен source:', videoInfo);
                    window.postMessage({
                        type: "VIDEO_DETECTED",
                        ...videoInfo
                    }, "*");
                }
            });
        });
    }

    // Запускаем поиск видео при загрузке
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', detectVideos);
    } else {
        detectVideos();
    }

    // Периодически проверяем новые видео (для динамических сайтов)
    setInterval(detectVideos, 3000);

    // Наблюдаем за добавлением новых video элементов
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.tagName === 'VIDEO' || (node.querySelectorAll && node.querySelectorAll('video').length > 0)) {
                    detectVideos();
                }
            });
        });
    });

    observer.observe(document.body || document.documentElement, {
        childList: true,
        subtree: true
    });

    console.log('[Video Downloader] Injector инициализирован');
})();
