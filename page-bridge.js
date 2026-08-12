(function () {
    "use strict";

    const REQUEST = "VSOL_SCOUT_GET_DATA";
    const RESPONSE = "VSOL_SCOUT_DATA";

    function exists(value) {
        return typeof value !== "undefined";
    }

    function safeArray(value) {
        return Array.isArray(value) ? value : [];
    }

    function getPlayerData() {
        const names = safeArray(window.plr_names);
        const count = names.length;

        const players = [];

        for (let i = 0; i < count; i++) {
            players.push({
                id: safeArray(window.plr_id)[i] ?? null,
                name: names[i] ?? null,

                position: safeArray(window.plr_pos)[i] ?? null,
                strength: safeArray(window.plr_str)[i] ?? null,
                form: safeArray(window.plr_fiza)[i] ?? null,

                styleCode: safeArray(window.plr_styles)[i] ?? null,
                nationality: safeArray(window.plr_nat)[i] ?? null,

                injury: safeArray(window.plr_injury)[i] ?? null,
                disqualification: safeArray(window.plr_disq)[i] ?? null,

                played: safeArray(window.plr_ip)[i] ?? null,
                missed: safeArray(window.plr_op)[i] ?? null,

                salary: safeArray(window.plr_sf)[i] ?? null,

                gk: safeArray(window.plr_gk)[i] ?? null,
                ld: safeArray(window.plr_ld)[i] ?? null,
                cd: safeArray(window.plr_cd)[i] ?? null,
                rd: safeArray(window.plr_rd)[i] ?? null,

                lm: safeArray(window.plr_lm)[i] ?? null,
                cm: safeArray(window.plr_cm)[i] ?? null,
                rm: safeArray(window.plr_rm)[i] ?? null,

                lf: safeArray(window.plr_lf)[i] ?? null,
                cf: safeArray(window.plr_cf)[i] ?? null,
                rf: safeArray(window.plr_rf)[i] ?? null,

                specialty1: safeArray(window.plr_sp1_core)[i] ?? null,
                specialty1Level: safeArray(window.plr_sp1_level)[i] ?? null,

                specialty2: safeArray(window.plr_sp2_core)[i] ?? null,
                specialty2Level: safeArray(window.plr_sp2_level)[i] ?? null,

                specialty3: safeArray(window.plr_sp3_core)[i] ?? null,
                specialty3Level: safeArray(window.plr_sp3_level)[i] ?? null,

                specialty4: safeArray(window.plr_sp4_core)[i] ?? null,
                specialty4Level: safeArray(window.plr_sp4_level)[i] ?? null
            });
        }

        return players;
    }

    function collectData() {
        const errors = [];

        if (!exists(window.plr_names)) {
            errors.push("plr_names не найден");
        }

        if (!exists(window.plr_str)) {
            errors.push("plr_str не найден");
        }

        if (!exists(window.my_vs)) {
            errors.push("my_vs не найден");
        }

        if (errors.length > 0) {
            return {
                success: false,
                errors
            };
        }

        const data = {
            scoutVersion: "0.1.1",

            collectedAt: new Date().toISOString(),

            source: {
                url: window.location.href,
                hostname: window.location.hostname
            },

            match: {
                id: exists(window.match_id) ? window.match_id : null,
                orderDay: exists(window.order_day) ? window.order_day : null,
                type: exists(window.matchtype) ? window.matchtype : null,
                name: exists(window.matchname) ? window.matchname : null,

                teamId: exists(window.curr) ? window.curr : null,
                teamVs: exists(window.my_vs) ? window.my_vs : null,

                formation: exists(window.v_formation)
                    ? window.v_formation
                    : null,

                tactics: exists(window.v_tactics)
                    ? window.v_tactics
                    : null,

                gameStyle: exists(window.v_playstyle)
                    ? window.v_playstyle
                    : null,

                defence: exists(window.v_defence)
                    ? window.v_defence
                    : null,

                morale: exists(window.v_morale)
                    ? window.v_morale
                    : null,

                superBonus: exists(window.super_bonus)
                    ? window.super_bonus
                    : null,

                restBonus: exists(window.rest_bonus)
                    ? window.rest_bonus
                    : null
            },

            lineup: {
                playersInOrder: exists(window.players_in_order)
                    ? window.players_in_order
                    : null,

                positions: safeArray(window.order_pos),

                playerIds: safeArray(window.orders),

                comboPlayer: safeArray(window.combo_plr),

                combo: safeArray(window.plr_combo)
            },

            players: getPlayerData(),

            order: {
                formation: exists(window.v_formation)
                    ? window.v_formation
                    : null,

                tactics: exists(window.v_tactics)
                    ? window.v_tactics
                    : null,

                gameStyle: exists(window.v_playstyle)
                    ? window.v_playstyle
                    : null,

                orders: safeArray(window.orders),

                positions: safeArray(window.order_pos)
            },

            raw: {
                playerIds: safeArray(window.plr_id),
                playerNames: safeArray(window.plr_names),
                playerPositions: safeArray(window.plr_pos),
                playerStrength: safeArray(window.plr_str),
                playerForm: safeArray(window.plr_fiza),
                playerStyles: safeArray(window.plr_styles),

                injuries: safeArray(window.plr_injury),
                disqualifications: safeArray(window.plr_disq),

                specialties: {
                    sp1: safeArray(window.plr_sp1_core),
                    sp1Level: safeArray(window.plr_sp1_level),

                    sp2: safeArray(window.plr_sp2_core),
                    sp2Level: safeArray(window.plr_sp2_level),

                    sp3: safeArray(window.plr_sp3_core),
                    sp3Level: safeArray(window.plr_sp3_level),

                    sp4: safeArray(window.plr_sp4_core),
                    sp4Level: safeArray(window.plr_sp4_level)
                }
            }
        };

        return {
            success: true,
            data
        };
    }

    window.addEventListener("message", function (event) {

        if (event.source !== window) {
            return;
        }

        if (!event.data) {
            return;
        }

        if (event.data.type !== REQUEST) {
            return;
        }

        const result = collectData();

        window.postMessage({
            type: RESPONSE,
            result
        }, "*");
    });

})();
