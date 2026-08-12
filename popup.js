(function () {
    "use strict";

    let currentData = null;

    const collectButton = document.getElementById("collect");
    const downloadButton = document.getElementById("download");
    const copyButton = document.getElementById("copy");

    const status = document.getElementById("status");
    const result = document.getElementById("result");

    const matchInfo = document.getElementById("matchInfo");
    const playerInfo = document.getElementById("playerInfo");

    function setStatus(text, type = "") {

        status.textContent = text;

        status.className = "status";

        if (type) {
            status.classList.add(type);
        }
    }

    function escapeHtml(value) {

        if (value === null || value === undefined) {
            return "";
        }

        return String(value)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function showData(data) {

        currentData = data;

        result.classList.remove("hidden");

        const match = data.match || {};

        matchInfo.innerHTML = `
            <div class="info-row">
                <span class="info-label">Матч:</span>
                <span class="info-value">
                    ${escapeHtml(match.name || "Чемпионат")}
                </span>
            </div>

            <div class="info-row">
                <span class="info-label">ID матча:</span>
                <span class="info-value">
                    ${escapeHtml(match.id)}
                </span>
            </div>

            <div class="info-row">
                <span class="info-label">Vs:</span>
                <span class="info-value">
                    ${escapeHtml(match.teamVs)}
                </span>
            </div>

            <div class="info-row">
                <span class="info-label">Схема:</span>
                <span class="info-value">
                    ${escapeHtml(match.formation)}
                </span>
            </div>

            <div class="info-row">
                <span class="info-label">Тактика:</span>
                <span class="info-value">
                    ${escapeHtml(match.tactics)}
                </span>
            </div>

            <div class="info-row">
                <span class="info-label">Стиль:</span>
                <span class="info-value">
                    ${escapeHtml(match.gameStyle)}
                </span>
            </div>
        `;

        const players = Array.isArray(data.players)
            ? data.players
            : [];

        playerInfo.innerHTML = `
            <div class="info-row">
                <span class="info-label">Игроков собрано:</span>
                <span class="info-value">
                    ${players.length}
                </span>
            </div>
        `;
    }

    async function getActiveTab() {

        const tabs = await chrome.tabs.query({
            active: true,
            currentWindow: true
        });

        if (!tabs.length) {
            throw new Error("Активная вкладка не найдена.");
        }

        return tabs[0];
    }

    collectButton.addEventListener("click", async () => {

        result.classList.add("hidden");

        collectButton.disabled = true;

        setStatus("Получаю данные со страницы ВСОЛ...");

        try {

            const tab = await getActiveTab();

            if (!tab.url ||
                !tab.url.startsWith(
                    "https://www.virtualsoccer.ru/mng_order.php"
                )) {

                throw new Error(
                    "Откройте страницу подготовки к матчу ВСОЛ."
                );
            }

            const response = await chrome.tabs.sendMessage(
                tab.id,
                {
                    action: "getMatchData"
                }
            );

            if (!response) {

                throw new Error(
                    "Расширение не получило ответ от страницы."
                );
            }

            if (!response.success) {

                const errors =
                    response.errors || [
                        "Не удалось получить данные."
                    ];

                throw new Error(
                    errors.join("; ")
                );
            }

            showData(response.data);

            setStatus(
                `Данные получены: ${response.data.players.length} игроков.`,
                "success"
            );

        } catch (error) {

            console.error(error);

            setStatus(
                `Ошибка: ${error.message}`,
                "error"
            );

        } finally {

            collectButton.disabled = false;
        }
    });

    downloadButton.addEventListener("click", async () => {

        if (!currentData) {
            return;
        }

        try {

            const tab = await getActiveTab();

            const response = await chrome.tabs.sendMessage(
                tab.id,
                {
                    action: "downloadJson",
                    data: currentData
                }
            );

            if (!response || !response.success) {

                throw new Error(
                    response?.error ||
                    "Не удалось скачать JSON."
                );
            }

            setStatus(
                "JSON успешно скачан.",
                "success"
            );

        } catch (error) {

            setStatus(
                `Ошибка скачивания: ${error.message}`,
                "error"
            );
        }
    });

    copyButton.addEventListener("click", async () => {

        if (!currentData) {
            return;
        }

        try {

            const tab = await getActiveTab();

            const response = await chrome.tabs.sendMessage(
                tab.id,
                {
                    action: "copyJson",
                    data: currentData
                }
            );

            if (!response || !response.success) {

                throw new Error(
                    response?.error ||
                    "Не удалось скопировать JSON."
                );
            }

            setStatus(
                "JSON скопирован в буфер обмена.",
                "success"
            );

        } catch (error) {

            setStatus(
                `Ошибка копирования: ${error.message}`,
                "error"
            );
        }
    });

})();
