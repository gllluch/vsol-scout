(function () {
    "use strict";

    let scoutData = null;

    const scanButton =
        document.getElementById("scan");

    const downloadButton =
        document.getElementById("download");

    const status =
        document.getElementById("status");

    const result =
        document.getElementById("result");

    const matchInfo =
        document.getElementById("matchInfo");

    const squadInfo =
        document.getElementById("squadInfo");

    const scoutInfo =
        document.getElementById("scoutInfo");

    function setStatus(
        text,
        type = ""
    ) {

        status.textContent = text;

        status.className = "status";

        if (type) {
            status.classList.add(type);
        }
    }

    function esc(value) {

        if (
            value === null ||
            value === undefined
        ) {
            return "";
        }

        return String(value)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll(
                "'",
                "&#039;"
            );
    }

    async function activeTab() {

        const tabs =
            await chrome.tabs.query({
                active: true,
                currentWindow: true
            });

        if (!tabs.length) {
            throw new Error(
                "Активная вкладка не найдена."
            );
        }

        return tabs[0];
    }

    async function collectTab(
        tabId,
        mode = "page"
    ) {

        const response =
            await chrome.tabs.sendMessage(
                tabId,
                {
                    action: "collectPage",
                    mode
                }
            );

        if (
            !response ||
            !response.success
        ) {

            throw new Error(
                response?.error ||
                "Не удалось получить данные страницы."
            );
        }

        return response.data;
    }

    async function openScoutTab(url) {

        const tab =
            await chrome.tabs.create({
                url,
                active: false
            });

        await waitForTab(tab.id);

        return tab;
    }

    function waitForTab(tabId) {

        return new Promise(
            (resolve, reject) => {

                const timeout =
                    setTimeout(() => {

                        chrome.tabs.onUpdated.removeListener(
                            listener
                        );

                        reject(
                            new Error(
                                "Страница слишком долго загружается."
                            )
                        );

                    }, 15000);

                function listener(
                    updatedTabId,
                    changeInfo
                ) {

                    if (
                        updatedTabId !== tabId
                    ) {
                        return;
                    }

                    if (
                        changeInfo.status ===
                        "complete"
                    ) {

                        clearTimeout(timeout);

                        chrome.tabs.onUpdated.removeListener(
                            listener
                        );

                        setTimeout(
                            resolve,
                            500
                        );
                    }
                }

                chrome.tabs.onUpdated.addListener(
                    listener
                );
            }
        );
    }

    function findMatchLinks(
        links
    ) {

        return links
            .filter(link =>
                /\/match\.php/i.test(
                    link.href
                )
            )
            .map(link => ({
                text: link.text,
                href: link.href
            }));
    }

    async function scan() {

        scanButton.disabled = true;

        result.classList.add(
            "hidden"
        );

        setStatus(
            "Сканирую страницу матча..."
        );

        let opponentTab = null;

        try {

            const current =
                await activeTab();

            if (
                !current.url ||
                !current.url.includes(
                    "/mng_order.php"
                )
            ) {

                throw new Error(
                    "Сначала откройте страницу подготовки к матчу."
                );
            }

            const match =
                await collectTab(
                    current.id,
                    "match"
                );

            /*
             * ВАЖНО:
             *
             * teamId в новой структуре
             * считаем ID соперника.
             *
             * my_vs = Vs соперника.
             */

            const opponentId =
                Number(match.opponentId);
            
            if (
                !opponentId ||
                !Number.isInteger(opponentId)
            ) {
                throw new Error(
                    "Не найден корректный ID соперника."
                );
            }
            
            console.log(
                "VSOL Scout: ID соперника =",
                opponentId
            );
            setStatus(
                `Соперник найден: ID ${opponentId}. Загружаю ростер...`
            );

            const rosterUrl =
                `https://www.virtualsoccer.ru/roster.php?num=${opponentId}`;

            opponentTab =
                await openScoutTab(
                    rosterUrl
                );

            const opponent =
                await collectTab(
                    opponentTab.id,
                    "page"
                );

            const matchLinks =
                findMatchLinks(
                    opponent.links
                );

            setStatus(
                `Соперник загружен. Найдено ссылок на матчи: ${matchLinks.length}`,
                "success"
            );

            scoutData = {

                scoutVersion:
                    "0.1.2",

                collectedAt:
                    new Date().toISOString(),

                match: {

                    source:
                        match,

                    opponent: {

                        id:
                            opponentId,

                        vs:
                            match.teamVs,

                        roster:
                            opponent
                    }
                },

                history: {

                    available:
                        matchLinks.length > 0,

                    matches:
                        matchLinks
                }
            };

            showResult(
                scoutData
            );

        } catch (error) {

            console.error(error);

            setStatus(
                error.message,
                "error"
            );

        } finally {

            if (opponentTab) {

                try {
                    await chrome.tabs.remove(
                        opponentTab.id
                    );
                } catch (_) {}
            }

            scanButton.disabled = false;
        }
    }

    function showResult(data) {

        result.classList.remove(
            "hidden"
        );

        const match =
            data.match.source.match ||
            {};

        const opponent =
            data.match.opponent;

        const players =
            data.match.source.players ||
            [];

        const history =
            data.history.matches ||
            [];

        matchInfo.innerHTML = `

            <div class="info-row">
                <span class="label">
                    ID матча:
                </span>

                <span class="value">
                    ${esc(match.id)}
                </span>
            </div>

            <div class="info-row">
                <span class="label">
                    ID соперника:
                </span>

                <span class="value">
                    ${esc(opponent.id)}
                </span>
            </div>

            <div class="info-row">
                <span class="label">
                    Vs соперника:
                </span>

                <span class="value">
                    ${esc(opponent.vs)}
                </span>
            </div>

            <div class="info-row">
                <span class="label">
                    Стиль:
                </span>

                <span class="value">
                    ${esc(match.gameStyle)}
                </span>
            </div>

            <div class="info-row">
                <span class="label">
                    Тактика:
                </span>

                <span class="value">
                    ${esc(match.tactics)}
                </span>
            </div>

        `;

        squadInfo.innerHTML = `

            <div class="info-row">

                <span class="label">
                    Игроков:
                </span>

                <span class="value">
                    ${players.length}
                </span>

            </div>

        `;

        scoutInfo.innerHTML = `

            <div class="info-row">

                <span class="label">
                    Страница соперника:
                </span>

                <span class="value">
                    получена
                </span>

            </div>

            <div class="info-row">

                <span class="label">
                    Ссылок на матчи:
                </span>

                <span class="value">
                    ${history.length}
                </span>

            </div>

        `;
    }

    scanButton.addEventListener(
        "click",
        scan
    );

    downloadButton.addEventListener(
        "click",
        async () => {

            if (!scoutData) {
                return;
            }

            try {

                const tab =
                    await activeTab();

                const response =
                    await chrome.tabs.sendMessage(
                        tab.id,
                        {
                            action:
                                "downloadJson",

                            data:
                                scoutData
                        }
                    );

                if (
                    !response ||
                    !response.success
                ) {

                    throw new Error(
                        response?.error ||
                        "Ошибка скачивания."
                    );
                }

                setStatus(
                    "Разведка сохранена.",
                    "success"
                );

            } catch (error) {

                setStatus(
                    error.message,
                    "error"
                );
            }
        }
    );

})();
