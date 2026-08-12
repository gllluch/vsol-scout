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

    function collectPlayers() {

        const names = safeArray(window.plr_names);

        return names.map((name, i) => ({
            id: safeArray(window.plr_id)[i] ?? null,
            name,

            position: safeArray(window.plr_pos)[i] ?? null,
            strength: safeArray(window.plr_str)[i] ?? null,
            form: safeArray(window.plr_fiza)[i] ?? null,

            styleCode: safeArray(window.plr_styles)[i] ?? null,

            injury: safeArray(window.plr_injury)[i] ?? null,
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

        return {
            id: getValue("match_id"),
            orderDay: getValue("order_day"),

            teamId: getValue("team_id"),
            curr: getValue("curr"),

            opponentId: getValue("teamId"),

            teamVs: getValue("my_vs"),

            formation: getValue("v_formation"),
            tactics: getValue("v_tactics"),
            gameStyle: getValue("v_playstyle"),

            players: collectPlayers(),

            orders: getValue("orders"),
            positions: getValue("order_pos"),

            links: getLinks()
        };
    }

    function collectPage() {

        const scripts = Array.from(
            document.scripts
        ).map(script => script.textContent || "");

        return {
            url: location.href,

            title: document.title,

            pageType:
                location.pathname.split("/").pop(),

            variables: {
                teamId: getValue("teamId"),
                curr: getValue("curr"),

                myVs: getValue("my_vs"),

                matchId: getValue("match_id"),
                orderDay: getValue("order_day"),

                formation: getValue("v_formation"),
                tactics: getValue("v_tactics"),
                gameStyle: getValue("v_playstyle")
            },

            players: collectPlayers(),

            links: getLinks(),

            scripts: scripts
                .filter(x => x.includes("match") ||
                            x.includes("roster") ||
                            x.includes("team"))
                .slice(0, 20)
        };
    }

    window.addEventListener("message", event => {

        if (event.source !== window) {
            return;
        }

        if (!event.data) {
            return;
        }

        if (event.data.type !== REQUEST) {
            return;
        }

        let result;

        if (event.data.mode === "match") {
            result = collectMatch();
        } else {
            result = collectPage();
        }

        window.postMessage({
            type: RESPONSE,
            result
        }, "*");
    });

})();
