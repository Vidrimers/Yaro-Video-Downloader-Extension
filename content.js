// Content Script - мост между injector и background
(function() {
    'use strict';

    console.log('[Video Downloader] Content script загружен');

    // Внедряем injector в страницу
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('injector.js');
    script.onload = function() {
        console.log('[Video Downloader] Injector внедрён');
        this.remove();
    };
    (document.head || document.documentElement).appendChild(script);

    // Слушаем сообщения от injector
    window.addEventListener('message', (event) => {
        // Проверяем источник сообщения
        if (event.source !== window) return;

        const message = event.data;

        if (message.type === "VIDEO_SEGMENT") {
            chrome.runtime.sendMessage({
                type: "VIDEO_SEGMENT",
                data: message.data
            }).catch(err => {
                console.error('[Video Downloader] Ошибка отправки сегмента:', err);
            });
        }

        if (message.type === "VIDEO_MIME") {
            chrome.runtime.sendMessage({
                type: "VIDEO_MIME",
                mime: message.mime
            }).catch(err => {
                console.error('[Video Downloader] Ошибка отправки MIME:', err);
            });
        }

        if (message.type === "VIDEO_DETECTED") {
            chrome.runtime.sendMessage({
                type: "VIDEO_DETECTED",
                url: message.url,
                videoType: message.videoType,
                title: message.title
            }).catch(err => {
                console.error('[Video Downloader] Ошибка отправки информации о видео:', err);
            });
        }
    });

    console.log('[Video Downloader] Content script инициализирован');
})();
