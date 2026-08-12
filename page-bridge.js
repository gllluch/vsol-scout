(function () {
    "use strict";

    const REQUEST = "VSOL_SCOUT_GET_PAGE_DATA";
    const RESPONSE = "VSOL_SCOUT_PAGE_DATA";

    function safeArray(value) {
        return Array.isArray(value) ? value : [];
    }

    function getValue(name) {
        return typeof window[name] !== "undefined"
            ? window[name]
            : null;
    }

    function getLinks() {
        return Array.from(document.querySelectorAll("a[href]"))
            .map(a => ({
                text: (a.innerText || a.textContent || "").trim(),
                href: a.href
            }))
            .filter(x => x.href);
    }

    function extractTeamIdsFromLinks(links) {
        const ids = [];

        for (const link of links) {
            const match = link.href.match(
                /[?&]num=(\d+)/
            );

            if (match) {
                ids.push({
                    id: Number(match[1]),
                    text: link.text,
                    href: link.href
                });
            }
        }

        return ids;
    }

    function getOpponentId() {

        // 1. Явная переменная страницы
        const candidates = [
            getValue("teamId"),
            getValue("opponentId"),
            getValue("opponent_id"),
            getValue("team_id")
        ];

        for (const value of candidates) {
            if (
                value !== null &&
                value !== undefined &&
                /^\d+$/.test(String(value))
            ) {
                return Number(value);
            }
        }

        // 2. Ищем ссылки на roster.php
        const links = getLinks();

        const rosterLinks = links.filter(link =>
            /\/roster\.php\?num=\d+/i.test(link.href)
        );

        // Если на странице ровно одна подходящая ссылка —
        // это наиболее вероятный ID соперника.
        if (rosterLinks.length === 1) {

            const match =
                rosterLinks[0].href.match(
                    /[?&]num=(\d+)/
                );

            if (match) {
                return Number(match[1]);
            }
        }

        return null;
    }

    function collectPlayers() {

        const names =
            safeArray(window.plr_names);

        return names.map((name, i) => ({
            id:
                safeArray(window.plr_id)[i] ?? null,

            name,

            position:
                safeArray(window.plr_pos)[i] ?? null,

            strength:
                safeArray(window.plr_str)[i] ?? null,

            form:
                safeArray(window.plr_fiza)[i] ?? null,

            styleCode:
                safeArray(window.plr_styles)[i] ?? null,

            injury:
                safeArray(window.plr_injury)[i] ?? null,

            disqualification:
                safeArray(window.plr_disq)[i] ?? null,

            specialty1:
                safeArray(window.plr_sp1_core)[i] ?? null,

            specialty1Level:
                safeArray(window.plr_sp1_level)[i] ?? null,

            specialty2:
                safeArray(window.plr_sp2_core)[i] ?? null,

            specialty2Level:
                safeArray(window.plr_sp2_level)[i] ?? null,

            specialty3:
                safeArray(window.plr_sp3_core)[i] ?? null,

            specialty3Level:
                safeArray(window.plr_sp3_level)[i] ?? null,

            specialty4:
                safeArray(window.plr_sp4_core)[i] ?? null,

            specialty4Level:
                safeArray(window.plr_sp4_level)[i] ?? null
        }));
    }

    function collectMatch() {

        const links = getLinks();

        const opponentId =
            getOpponentId();

        return {

            id:
                getValue("match_id"),

            orderDay:
                getValue("order_day"),

            // Команда пользователя
            myTeamId:
                getValue("curr"),

            // КОМАНДА СОПЕРНИКА
            opponentId,

            // Vs СОПЕРНИКА
            opponentVs:
                getValue("my_vs"),

            formation:
                getValue("v_formation"),

            tactics:
                getValue("v_tactics"),

            gameStyle:
                getValue("v_playstyle"),

            players:
                collectPlayers(),

            orders:
                getValue("orders"),

            positions:
                getValue("order_pos"),

            links,

            rosterLinks:
                links.filter(link =>
                    /\/roster\.php\?num=\d+/i
                        .test(link.href)
                )
        };
    }

    function collectPage() {

        const links = getLinks();

        return {

            url:
                location.href,

            title:
                document.title,

            pageType:
                location.pathname
                    .split("/")
                    .pop(),

            variables: {

                teamId:
                    getValue("teamId"),

                curr:
                    getValue("curr"),

                myVs:
                    getValue("my_vs"),

                matchId:
                    getValue("match_id"),

                orderDay:
                    getValue("order_day"),

                formation:
                    getValue("v_formation"),

                tactics:
                    getValue("v_tactics"),

                gameStyle:
                    getValue("v_playstyle")
            },

            players:
                collectPlayers(),

            links,

            rosterLinks:
                links.filter(link =>
                    /\/roster\.php\?num=\d+/i
                        .test(link.href)
                )
        };
    }

    window.addEventListener(
        "message",
        event => {

            if (event.source !== window) {
                return;
            }

            if (!event.data) {
                return;
            }

            if (
                event.data.type !== REQUEST
            ) {
                return;
            }

            let result;

            if (
                event.data.mode === "match"
            ) {
                result = collectMatch();
            } else {
                result = collectPage();
            }

            window.postMessage({
                type: RESPONSE,
                result
            }, "*");
        }
    );

})();
