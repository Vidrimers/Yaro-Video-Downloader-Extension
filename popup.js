// Popup UI контроллер
(function() {
    'use strict';

    let currentTabId = null;
    let updateInterval = null;

    // Элементы UI
    const elements = {
        segmentCount: document.getElementById('segmentCount'),
        videoCount: document.getElementById('videoCount'),
        recordingTime: document.getElementById('recordingTime'),
        recordingIndicator: document.getElementById('recordingIndicator'),
        videoList: document.getElementById('videoList'),
        startRecording: document.getElementById('startRecording'),
        stopRecording: document.getElementById('stopRecording'),
        downloadSegments: document.getElementById('downloadSegments'),
        clearData: document.getElementById('clearData'),
        showInfo: document.getElementById('showInfo')
    };

    // Получение текущего таба
    async function getCurrentTab() {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        return tab;
    }

    // Обновление статуса
    async function updateStatus() {
        try {
            const tab = await getCurrentTab();
            if (!tab) return;

            currentTabId = tab.id;

            chrome.runtime.sendMessage(
                { type: "GET_STATUS", tabId: currentTabId },
                (response) => {
                    if (chrome.runtime.lastError) {
                        console.error('Ошибка получения статуса:', chrome.runtime.lastError);
                        return;
                    }

                    if (response) {
                        updateUI(response);
                    }
                }
            );
        } catch (error) {
            console.error('Ошибка обновления статуса:', error);
        }
    }

    // Обновление UI
    function updateUI(status) {
        // Обновляем счётчики
        elements.segmentCount.textContent = status.segments || 0;
        elements.videoCount.textContent = status.videos?.length || 0;
        elements.recordingTime.textContent = `${status.recordingTime || 0}s`;

        // Индикатор записи
        if (status.isRecording) {
            elements.recordingIndicator.classList.add('active');
            elements.startRecording.disabled = true;
            elements.stopRecording.disabled = false;
        } else {
            elements.recordingIndicator.classList.remove('active');
            elements.startRecording.disabled = false;
            elements.stopRecording.disabled = true;
        }

        // Обновляем список видео
        updateVideoList(status.videos || []);

        // Активируем кнопку скачивания сегментов
        elements.downloadSegments.disabled = (status.segments || 0) === 0;
    }

    // Обновление списка видео
    function updateVideoList(videos) {
        if (videos.length === 0) {
            elements.videoList.innerHTML = `
                <div class="empty-state">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
                    </svg>
                    <p>Видео не найдены<br>Откройте страницу с видео</p>
                </div>
            `;
            return;
        }

        elements.videoList.innerHTML = videos.map((video, index) => `
            <div class="video-item">
                <div class="video-info">
                    <div class="video-title" title="${escapeHtml(video.title)}">
                        ${escapeHtml(video.title)}
                    </div>
                    <div class="video-type">
                        ${video.type === 'direct' ? '🔗 Прямая ссылка' : '🔒 Защищённое'}
                    </div>
                </div>
                <button class="btn btn-primary btn-small" data-url="${escapeHtml(video.url)}" data-index="${index}">
                    ⬇ Скачать
                </button>
            </div>
        `).join('');

        // Добавляем обработчики для кнопок скачивания
        elements.videoList.querySelectorAll('.btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const url = btn.dataset.url;
                downloadDirect(url);
            });
        });
    }

    // Экранирование HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Начать запись сегментов
    function startRecording() {
        chrome.runtime.sendMessage(
            { type: "START_RECORDING", tabId: currentTabId },
            (response) => {
                if (response?.success) {
                    console.log('Запись начата');
                    updateStatus();
                }
            }
        );
    }

    // Остановить запись
    function stopRecording() {
        chrome.runtime.sendMessage(
            { type: "STOP_RECORDING", tabId: currentTabId },
            (response) => {
                if (response?.success) {
                    console.log('Запись остановлена');
                    updateStatus();
                }
            }
        );
    }

    // Скачать собранные сегменты
    function downloadSegments() {
        chrome.runtime.sendMessage(
            { type: "DOWNLOAD_SEGMENTS", tabId: currentTabId },
            (response) => {
                if (response?.success) {
                    showNotification('✅ Видео скачано: ' + response.filename);
                    updateStatus();
                } else {
                    showNotification('❌ Ошибка: ' + (response?.error || 'Неизвестная ошибка'));
                }
            }
        );
    }

    // Скачать прямое видео
    function downloadDirect(url) {
        chrome.runtime.sendMessage(
            { type: "DOWNLOAD_DIRECT", url: url, tabId: currentTabId },
            (response) => {
                if (response?.success) {
                    showNotification('✅ Видео скачано: ' + response.filename);
                } else {
                    showNotification('❌ Ошибка: ' + (response?.error || 'Неизвестная ошибка'));
                }
            }
        );
    }

    // Очистить данные
    function clearData() {
        if (confirm('Очистить все собранные данные?')) {
            chrome.runtime.sendMessage(
                { type: "CLEAR_DATA", tabId: currentTabId },
                (response) => {
                    if (response?.success) {
                        showNotification('✅ Данные очищены');
                        updateStatus();
                    }
                }
            );
        }
    }

    // Показать уведомление
    function showNotification(message) {
        // Простое уведомление через alert (можно улучшить)
        alert(message);
    }

    // Показать информацию о MP4
    function showMP4Info() {
        chrome.runtime.sendMessage(
            { type: "GET_MP4_INFO", tabId: currentTabId },
            (response) => {
                if (response?.success) {
                    const info = response.info;
                    const infoText = `
📊 Информация о MP4:

🎬 Длительность: ${info.duration ? (info.duration / info.timescale).toFixed(2) + 's' : 'N/A'}
📹 Треков: ${info.tracks?.length || 0}
📦 Бренд: ${info.brand || 'N/A'}

${info.tracks?.map((track, i) => `
Трек ${i + 1}:
  - ID: ${track.id}
  - Тип: ${track.type}
  - Codec: ${track.codec}
  - Длительность: ${track.duration ? (track.duration / track.timescale).toFixed(2) + 's' : 'N/A'}
  ${track.video ? `- Разрешение: ${track.video.width}x${track.video.height}` : ''}
  ${track.audio ? `- Каналов: ${track.audio.channel_count}, Sample rate: ${track.audio.sample_rate}` : ''}
`).join('\n') || 'Нет информации о треках'}
                    `.trim();
                    
                    alert(infoText);
                } else {
                    showNotification('❌ ' + (response?.error || 'Не удалось получить информацию'));
                }
            }
        );
    }

    // Обработчики событий
    elements.startRecording.addEventListener('click', startRecording);
    elements.stopRecording.addEventListener('click', stopRecording);
    elements.downloadSegments.addEventListener('click', downloadSegments);
    elements.clearData.addEventListener('click', clearData);
    elements.showInfo.addEventListener('click', showMP4Info);

    // Инициализация
    updateStatus();
    updateInterval = setInterval(updateStatus, 1000);

    // Очистка при закрытии popup
    window.addEventListener('unload', () => {
        if (updateInterval) {
            clearInterval(updateInterval);
        }
    });

    console.log('[Video Downloader] Popup инициализирован');
})();
