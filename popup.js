// Popup UI контроллер
(function() {
    'use strict';

    let currentTabId = null;
    let updateInterval = null;
    let currentLang = 'ru'; // По умолчанию русский

    // Переводы
    const translations = {
        ru: {
            segments: 'Сегменты',
            videos: 'Видео',
            rec: 'ЗАПИСЬ',
            detectedVideos: 'Обнаруженные видео',
            noVideos: 'Видео не найдены<br>Откройте страницу с видео',
            start: 'Начать',
            stop: 'Стоп',
            download: 'Скачать',
            clear: 'Очистить',
            mp4Info: 'Инфо MP4',
            direct: 'ПРЯМАЯ ССЫЛКА',
            stream: 'ПОТОК',
            downloadSuccess: '✅ Видео скачано: ',
            downloadError: '❌ Ошибка: ',
            noSegments: 'Нет сегментов для скачивания',
            clearConfirm: 'Очистить все собранные данные?',
            dataCleared: '✅ Данные очищены',
            mp4InfoTitle: '📊 Информация о MP4:',
            duration: '🎬 Длительность: ',
            tracks: '📹 Треков: ',
            brand: '📦 Бренд: ',
            track: 'Трек',
            type: 'Тип',
            codec: 'Codec',
            resolution: 'Разрешение',
            channels: 'Каналов',
            sampleRate: 'Sample rate',
            noTrackInfo: 'Нет информации о треках',
            noInfo: 'Не удалось получить информацию',
            noSegmentsForInfo: 'Нет сегментов для анализа. Запишите видео сначала.',
            mp4BuilderNotInit: 'MP4Builder не инициализирован. Начните запись сегментов.',
            recordingStarted: 'Запись начата',
            recordingStopped: 'Запись остановлена',
            supportAuthor: 'Поддержать автора',
            loadingVideo: 'Загрузка информации...',
            adSegmentsFound: 'Найдены рекламные блоки',
            removeAds: 'Убрать рекламу',
            trimOptional: 'Обрезка (опционально)',
            trimStart: 'Начало',
            trimEnd: 'Конец',
            updateAvailable: 'Доступна новая версия',
            downloadUpdate: 'Скачать обновление',
            sbSponsor: 'Реклама',
            sbSelfpromo: 'Самореклама',
            sbIntro: 'Интро',
            sbOutro: 'Аутро',
            sbInteraction: 'Подписка',
            sbMusic: 'Музыка не по теме'
        },
        en: {
            segments: 'Segments',
            videos: 'Videos',
            rec: 'REC',
            detectedVideos: 'Detected Videos',
            noVideos: 'No videos detected<br>Open a page with video content',
            start: 'Start',
            stop: 'Stop',
            download: 'Download',
            clear: 'Clear',
            mp4Info: 'MP4 Info',
            direct: 'DIRECT',
            stream: 'STREAM',
            downloadSuccess: '✅ Video downloaded: ',
            downloadError: '❌ Error: ',
            noSegments: 'No segments to download',
            clearConfirm: 'Clear all collected data?',
            dataCleared: '✅ Data cleared',
            mp4InfoTitle: '📊 MP4 Information:',
            duration: '🎬 Duration: ',
            tracks: '📹 Tracks: ',
            brand: '📦 Brand: ',
            track: 'Track',
            type: 'Type',
            codec: 'Codec',
            resolution: 'Resolution',
            channels: 'Channels',
            sampleRate: 'Sample rate',
            noTrackInfo: 'No track information',
            noInfo: 'Failed to get information',
            noSegmentsForInfo: 'No segments to analyze. Record video first.',
            mp4BuilderNotInit: 'MP4Builder not initialized. Start recording segments.',
            recordingStarted: 'Recording started',
            recordingStopped: 'Recording stopped',
            supportAuthor: 'Support Author',
            loadingVideo: 'Loading video info...',
            adSegmentsFound: 'Ad segments found',
            removeAds: 'Remove ads',
            trimOptional: 'Trim (optional)',
            trimStart: 'Start',
            trimEnd: 'End',
            updateAvailable: 'New version available',
            downloadUpdate: 'Download update',
            sbSponsor: 'Sponsor',
            sbSelfpromo: 'Self-promo',
            sbIntro: 'Intro',
            sbOutro: 'Outro',
            sbInteraction: 'Subscribe',
            sbMusic: 'Off-topic music'
        }
    };

    // Функция перевода
    function t(key) {
        return translations[currentLang][key] || key;
    }

    // Применение переводов
    function applyTranslations() {
        console.log('[Lang] Применяем переводы для языка:', currentLang);
        
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = t(key);
            
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.placeholder = translation;
            } else {
                // Для элементов с HTML (например, noVideos с <br>)
                if (translation.includes('<br>')) {
                    element.innerHTML = translation;
                } else {
                    element.textContent = translation;
                }
            }
        });
        
        // Обновляем title кнопок
        const downloadBtns = document.querySelectorAll('.btn-download');
        downloadBtns.forEach(btn => {
            btn.setAttribute('title', t('download'));
        });
        
        console.log('[Lang] Переводы применены');
    }

    // Сохранение языка
    function saveLanguage(lang) {
        currentLang = lang;
        console.log('[Lang] Язык изменён на:', lang);
        
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            chrome.storage.local.set({ language: lang }, () => {
                console.log('[Lang] Язык сохранён в chrome.storage');
                applyTranslations();
            });
        } else {
            // Fallback - используем localStorage
            localStorage.setItem('language', lang);
            console.log('[Lang] Язык сохранён в localStorage');
            applyTranslations();
        }
    }

    // Загрузка языка
    function loadLanguage() {
        // Проверяем доступность chrome.storage
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            chrome.storage.local.get(['language'], (result) => {
                currentLang = result.language || 'ru';
                
                // Обновляем активную кнопку
                document.querySelectorAll('.lang-btn').forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.lang === currentLang);
                });
                
                // Применяем переводы
                applyTranslations();
            });
        } else {
            // Fallback - используем localStorage
            currentLang = localStorage.getItem('language') || 'ru';
            console.log('[Lang] Используем localStorage, язык:', currentLang);
            
            // Обновляем активную кнопку
            document.querySelectorAll('.lang-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.lang === currentLang);
            });
            
            // Применяем переводы
            applyTranslations();
        }
    }

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
        if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            return tab;
        } else {
            console.warn('[Video Downloader] chrome.tabs API недоступен');
            return null;
        }
    }

    // Обновление статуса
    async function updateStatus() {
        try {
            const tab = await getCurrentTab();
            if (!tab) {
                console.warn('[Video Downloader] Не удалось получить текущий таб');
                return;
            }

            currentTabId = tab.id;

            if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
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
            } else {
                console.warn('[Video Downloader] chrome.runtime API недоступен');
            }
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
                    <svg class="empty-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M15 10L19.553 7.724C20.237 7.382 21 7.867 21 8.618V15.382C21 16.133 20.237 16.618 19.553 16.276L15 14M5 18H13C14.105 18 15 17.105 15 16V8C15 6.895 14.105 6 13 6H5C3.895 6 3 6.895 3 8V16C3 17.105 3.895 18 5 18Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <div class="empty-text" data-i18n="noVideos">${t('noVideos')}</div>
                </div>
            `;
            return;
        }

        elements.videoList.innerHTML = videos.map((video, index) => `
            <div class="video-item">
                <div class="video-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M15 10L19.553 7.724C20.237 7.382 21 7.867 21 8.618V15.382C21 16.133 20.237 16.618 19.553 16.276L15 14M5 18H13C14.105 18 15 17.105 15 16V8C15 6.895 14.105 6 13 6H5C3.895 6 3 6.895 3 8V16C3 17.105 3.895 18 5 18Z" stroke="#6366f1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
                <div class="video-info">
                    <div class="video-title" title="${escapeHtml(video.title)}">
                        ${escapeHtml(video.title)}
                    </div>
                    <div class="video-type">
                        <span class="type-badge">${video.type === 'direct' ? t('direct') : t('stream')}</span>
                    </div>
                </div>
                <button class="btn btn-download" data-url="${escapeHtml(video.url)}" data-title="${escapeHtml(video.title)}" data-index="${index}" title="${t('download')}">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 3V16M12 16L7 11M12 16L17 11M3 21H21" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
            </div>
        `).join('');

        // Добавляем обработчики для кнопок скачивания
        elements.videoList.querySelectorAll('.btn-download').forEach(btn => {
            btn.addEventListener('click', () => {
                const url = btn.dataset.url;
                const title = btn.dataset.title;
                downloadDirect(url, title);
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
        if (!currentTabId) {
            showNotification('Ошибка: не удалось определить текущий таб', 'error');
            return;
        }

        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
            chrome.runtime.sendMessage(
                { type: "START_RECORDING", tabId: currentTabId },
                (response) => {
                    if (chrome.runtime.lastError) {
                        console.error('Ошибка начала записи:', chrome.runtime.lastError);
                        showNotification('Ошибка начала записи', 'error');
                        return;
                    }
                    if (response?.success) {
                        console.log('[Recording] Запись начата для таба', currentTabId);
                        showNotification(t('recordingStarted'), 'success');
                        updateStatus();
                    }
                }
            );
        } else {
            showNotification('Chrome API недоступен', 'error');
        }
    }

    // Остановить запись
    function stopRecording() {
        if (!currentTabId) {
            showNotification('Ошибка: не удалось определить текущий таб', 'error');
            return;
        }

        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
            chrome.runtime.sendMessage(
                { type: "STOP_RECORDING", tabId: currentTabId },
                (response) => {
                    if (chrome.runtime.lastError) {
                        console.error('Ошибка остановки записи:', chrome.runtime.lastError);
                        showNotification('Ошибка остановки записи', 'error');
                        return;
                    }
                    if (response?.success) {
                        console.log('[Recording] Запись остановлена для таба', currentTabId);
                        showNotification(t('recordingStopped'), 'success');
                        updateStatus();
                    }
                }
            );
        } else {
            showNotification('Chrome API недоступен', 'error');
        }
    }

    // Скачать собранные сегменты
    function downloadSegments() {
        chrome.runtime.sendMessage(
            { type: "DOWNLOAD_SEGMENTS", tabId: currentTabId },
            (response) => {
                if (!response?.success) {
                    showNotification(t('downloadError') + (response?.error || 'Unknown error'), 'error');
                    return;
                }

                // Firefox: SW не может создать blob URL, делаем это здесь
                if (response.needsClientDownload) {
                    try {
                        const buffer = new Uint8Array(response.bufferArray).buffer;
                        const blob = new Blob([buffer], { type: response.mimeType });
                        const url = URL.createObjectURL(blob);

                        const a = document.createElement('a');
                        a.href = url;
                        a.download = response.filename;
                        a.click();

                        setTimeout(() => URL.revokeObjectURL(url), 1000);
                        showNotification(t('downloadSuccess') + response.filename, 'success');
                        updateStatus();
                    } catch (err) {
                        showNotification(t('downloadError') + err.message, 'error');
                    }
                    return;
                }

                // Chrome / Opera / Edge — скачивание уже запущено в SW
                showNotification(t('downloadSuccess') + response.filename, 'success');
                updateStatus();
            }
        );
    }

    // Скачать прямое видео
    function downloadDirect(url, title) {
        chrome.runtime.sendMessage(
            { type: "DOWNLOAD_DIRECT", url: url, title: title, tabId: currentTabId },
            (response) => {
                if (response?.success) {
                    showNotification(t('downloadSuccess') + response.filename, 'success');
                } else {
                    showNotification(t('downloadError') + (response?.error || 'Unknown error'), 'error');
                }
            }
        );
    }

    // Очистить данные
    function clearData() {
        if (confirm(t('clearConfirm'))) {
            chrome.runtime.sendMessage(
                { type: "CLEAR_DATA", tabId: currentTabId },
                (response) => {
                    if (response?.success) {
                        showNotification(t('dataCleared'), 'success');
                        updateStatus();
                    }
                }
            );
        }
    }

    // Показать уведомление
    function showNotification(message, type = 'info') {
        // Удаляем предыдущее уведомление если есть
        const existing = document.querySelector('.notification');
        if (existing) {
            existing.remove();
        }

        // Создаём новое уведомление
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        // Иконка в зависимости от типа
        let icon = '';
        if (type === 'success') {
            icon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        } else if (type === 'error') {
            icon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 8V12M12 16H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        } else {
            icon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13 16H12V12H11M12 8H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        }
        
        notification.innerHTML = `${icon}<span>${message}</span>`;
        document.body.appendChild(notification);

        // Автоматически скрываем через 3 секунды
        setTimeout(() => {
            notification.classList.add('hiding');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }

    // Показать информацию о MP4
    function showMP4Info() {
        chrome.runtime.sendMessage(
            { type: "GET_MP4_INFO", tabId: currentTabId },
            (response) => {
                if (response?.success) {
                    const info = response.info;
                    const infoText = `
${t('mp4InfoTitle')}

${t('duration')}${info.duration ? (info.duration / info.timescale).toFixed(2) + 's' : 'N/A'}
${t('tracks')}${info.tracks?.length || 0}
${t('brand')}${info.brand || 'N/A'}

${info.tracks?.map((track, i) => `
${t('track')} ${i + 1}:
  - ID: ${track.id}
  - ${t('type')}: ${track.type}
  - ${t('codec')}: ${track.codec}
  - ${t('duration')}${track.duration ? (track.duration / track.timescale).toFixed(2) + 's' : 'N/A'}
  ${track.video ? `- ${t('resolution')}: ${track.video.width}x${track.video.height}` : ''}
  ${track.audio ? `- ${t('channels')}: ${track.audio.channel_count}, ${t('sampleRate')}: ${track.audio.sample_rate}` : ''}
`).join('\n') || t('noTrackInfo')}
                    `.trim();
                    
                    // Используем confirm вместо alert для MP4 info (это большой текст)
                    alert(infoText);
                } else {
                    showNotification(t('downloadError') + (response?.error || t('noInfo')), 'error');
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

    // Переключатель языков
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const lang = btn.dataset.lang;
            
            console.log('[Lang] Клик на кнопку:', lang);
            
            // Обновляем currentLang СРАЗУ
            currentLang = lang;
            
            // Обновляем активную кнопку
            document.querySelectorAll('.lang-btn').forEach(b => {
                b.classList.toggle('active', b.dataset.lang === lang);
            });
            
            // Сохраняем в storage
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                chrome.storage.local.set({ language: lang }, () => {
                    console.log('[Lang] Язык сохранён в chrome.storage:', lang);
                });
            } else {
                // Fallback - используем localStorage
                localStorage.setItem('language', lang);
                console.log('[Lang] Язык сохранён в localStorage:', lang);
            }
            
            // Применяем переводы
            applyTranslations();
            
            // Обновляем список видео с новым языком (если API доступен)
            if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage && currentTabId) {
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
            } else {
                console.log('[Lang] Пропускаем обновление статуса (API недоступен или нет tabId)');
            }
        });
    });

    // Инициализация
    loadLanguage();
    updateStatus();
    updateInterval = setInterval(updateStatus, 1000);

    // ===== Version & Update Checker =====
    const CURRENT_VERSION = chrome.runtime.getManifest().version;
    const GITHUB_REPO = 'Vidrimers/Yaro-Video-Downloader-Extension';

    document.getElementById('currentVersion').textContent = `v${CURRENT_VERSION}`;

    async function checkForUpdates() {
        try {
            const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`);
            if (!res.ok) return;

            const release = await res.json();
            const latestVersion = (release.tag_name || '').replace(/^v/, '');

            if (!latestVersion || latestVersion === CURRENT_VERSION) return;

            // Compare versions
            if (compareVersions(latestVersion, CURRENT_VERSION) <= 0) return;

            // Show update banner
            const banner = document.getElementById('updateBanner');
            document.getElementById('updateTitle').textContent = `New version: v${latestVersion}`;
            document.getElementById('updateVersion').textContent = `Current: v${CURRENT_VERSION} → Latest: v${latestVersion}`;

            const changelog = release.body || '';
            const changelogEl = document.getElementById('updateChangelog');
            if (changelog) {
                changelogEl.textContent = changelog.substring(0, 200) + (changelog.length > 200 ? '...' : '');
            } else {
                changelogEl.style.display = 'none';
            }

            // Find .zip download URL
            const zipAsset = (release.assets || []).find(a => a.name.endsWith('.zip'));
            if (zipAsset) {
                document.getElementById('updateDownloadBtn').href = zipAsset.browser_download_url;
            } else {
                document.getElementById('updateDownloadBtn').href = release.html_url;
            }

            banner.style.display = 'block';
        } catch (e) {
            console.warn('[Update check] Failed:', e);
        }
    }

    function compareVersions(a, b) {
        const pa = a.split('.').map(Number);
        const pb = b.split('.').map(Number);
        for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
            const na = pa[i] || 0;
            const nb = pb[i] || 0;
            if (na > nb) return 1;
            if (na < nb) return -1;
        }
        return 0;
    }

    checkForUpdates();

    // ===== Server Download (YouTube/Instagram) =====
    const SERVER_API_URL = 'https://vidrimers.site/dl';
    const SERVER_API_KEY = 'yaro-ext-api-k8x2m9p4';

    let serverVideoInfo = null;
    let selectedFormat = null;
    let serverPageUrl = null;

    function isYouTubeUrl(url) {
        if (!url) return false;
        try {
            const u = new URL(url);
            const h = u.hostname.toLowerCase();
            if (['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(h)) {
                if (u.pathname === '/watch' && u.searchParams.has('v')) return true;
                return /^\/shorts\//.test(u.pathname);
            }
            if (h === 'youtu.be') return u.pathname.length > 1;
            return false;
        } catch { return false; }
    }

    function isInstagramUrl(url) {
        if (!url) return false;
        try {
            const u = new URL(url);
            const h = u.hostname.toLowerCase();
            if (!['instagram.com', 'www.instagram.com'].includes(h)) return false;
            return /^\/(reels?|p|stories)\//.test(u.pathname);
        } catch { return false; }
    }

    async function fetchServerInfo(url) {
        const res = await fetch(`${SERVER_API_URL}/api/info`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': SERVER_API_KEY,
                'X-Extension-Version': chrome.runtime.getManifest().version
            },
            body: JSON.stringify({ url })
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || `Ошибка сервера (${res.status})`);
        }
        return res.json();
    }

    async function serverDownload(url, options = {}) {
        const res = await fetch(`${SERVER_API_URL}/api/download`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': SERVER_API_KEY,
                'X-Extension-Version': chrome.runtime.getManifest().version
            },
            body: JSON.stringify({ url, ...options })
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || `Ошибка сервера (${res.status})`);
        }
        return res.json();
    }

    async function initServerSection() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab || !tab.url) return;

            const url = tab.url;
            if (!isYouTubeUrl(url) && !isInstagramUrl(url)) return;

            // Hide local download sections on YouTube/Instagram
            const localSection = document.getElementById('localSection');
            const localControls = document.getElementById('localControls');
            if (localSection) localSection.style.display = 'none';
            if (localControls) localControls.style.display = 'none';

            // Hide stats grid (segments/recording not relevant)
            const statsGrid = document.querySelector('.stats-grid');
            if (statsGrid) statsGrid.style.display = 'none';

            const section = document.getElementById('serverSection');
            const loading = document.getElementById('serverLoading');
            const error = document.getElementById('serverError');
            const info = document.getElementById('serverVideoInfo');

            section.style.display = 'block';
            loading.style.display = 'flex';
            error.style.display = 'none';
            info.style.display = 'none';

            serverPageUrl = url;

            try {
                serverVideoInfo = await fetchServerInfo(url);
                serverVideoInfo.url = url;
                loading.style.display = 'none';
                info.style.display = 'block';
                renderServerVideoInfo();
            } catch (e) {
                loading.style.display = 'none';
                error.style.display = 'block';
                const msg = e.message || '';
                if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
                    error.textContent = 'Не удалось подключиться к серверу';
                } else if (msg.includes('500')) {
                    error.textContent = 'Ошибка на сервере, попробуйте позже';
                } else if (msg.includes('401')) {
                    error.textContent = 'Ошибка авторизации';
                } else {
                    error.textContent = msg || 'Не удалось загрузить информацию';
                }
            }
        } catch (e) {
            console.warn('[Server] Init failed:', e);
        }
    }

    function renderServerVideoInfo() {
        const data = serverVideoInfo;
        if (!data) return;

        document.getElementById('serverVideoTitle').textContent = data.title || 'Video';
        const meta = [];
        if (data.duration) {
            const m = Math.floor(data.duration / 60);
            const s = Math.floor(data.duration % 60);
            meta.push(`${m}:${s.toString().padStart(2, '0')}`);
        }
        if (data.uploader) meta.push(data.uploader);
        document.getElementById('serverVideoMeta').textContent = meta.join(' · ');

        // SponsorBlock
        const sbSection = document.getElementById('serverSponsorBlock');
        const sbSegments = document.getElementById('sbSegments');
        if (data.sponsorBlock && data.sponsorBlock.segments && data.sponsorBlock.segments.length > 0) {
            sbSection.style.display = 'block';
            const segs = data.sponsorBlock.segments.map(s =>
                `${s.categoryName}: ${s.startFormatted} - ${s.endFormatted}`
            ).join('\n');
            sbSegments.textContent = `${data.sponsorBlock.totalSegments} segments (${data.sponsorBlock.totalDurationFormatted})`;
        } else {
            sbSection.style.display = 'none';
        }

        // Quality buttons
        const qualityContainer = document.getElementById('serverQuality');
        qualityContainer.innerHTML = '';
        if (data.formats && data.formats.length > 0) {
            data.formats.forEach((f, i) => {
                const btn = document.createElement('button');
                btn.className = 'quality-btn' + (i === 0 ? ' selected' : '');
                btn.textContent = f.quality + (f.needsMerge ? ' (merged)' : '');
                btn.dataset.formatId = f.formatId;
                btn.dataset.quality = f.height || '';
                btn.addEventListener('click', () => {
                    qualityContainer.querySelectorAll('.quality-btn').forEach(b => b.classList.remove('selected'));
                    btn.classList.add('selected');
                    selectedFormat = f;
                });
                qualityContainer.appendChild(btn);
            });
            selectedFormat = data.formats[0];
        }
    }

    async function handleServerDownload() {
        if (!serverVideoInfo || !selectedFormat) return;

        const btn = document.getElementById('serverDownloadBtn');
        const origText = btn.querySelector('span').textContent;
        btn.disabled = true;
        btn.querySelector('span').textContent = 'Processing...';

        try {
            const trimStart = document.getElementById('trimStart').value.trim();
            const trimEnd = document.getElementById('trimEnd').value.trim();

            // Get selected SponsorBlock categories
            const selectedCategories = [];
            document.querySelectorAll('#sbCategories input[type="checkbox"]:checked').forEach(cb => {
                selectedCategories.push(cb.value);
            });

            const options = {
                formatId: selectedFormat.formatId,
                quality: selectedFormat.quality
            };

            if (selectedCategories.length > 0) options.sponsorCategories = selectedCategories;
            if (trimStart) options.trimStart = parseTimeToSeconds(trimStart);
            if (trimEnd) options.trimEnd = parseTimeToSeconds(trimEnd);

            const result = await serverDownload(serverPageUrl || serverVideoInfo.url, options);

            if (result.downloadUrl) {
                chrome.downloads.download({
                    url: result.downloadUrl,
                    filename: result.filename || 'video.mp4',
                    saveAs: true
                }, (downloadId) => {
                    if (chrome.runtime.lastError) {
                        showNotification('Download error: ' + chrome.runtime.lastError.message, 'error');
                    } else {
                        showNotification('Download started: ' + (result.filename || 'video.mp4'), 'success');
                    }
                    btn.disabled = false;
                    btn.querySelector('span').textContent = origText;
                });
            }
        } catch (e) {
            showNotification('Error: ' + e.message, 'error');
            btn.disabled = false;
            btn.querySelector('span').textContent = origText;
        }
    }

    function parseTimeToSeconds(str) {
        if (!str) return undefined;
        const parts = str.split(':').map(Number);
        if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
        if (parts.length === 2) return parts[0] * 60 + parts[1];
        return parts[0] || undefined;
    }

    // Bind server download button
    document.getElementById('serverDownloadBtn').addEventListener('click', handleServerDownload);

    // Init server section on load
    initServerSection();

    console.log('[Video Downloader] Popup инициализирован');
})();
