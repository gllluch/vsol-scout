(function () {
    "use strict";

    const REQUEST = "VSOL_SCOUT_GET_DATA";
    const RESPONSE = "VSOL_SCOUT_DATA";

    let waitingResolve = null;
    let waitingReject = null;

    window.addEventListener("message", function (event) {

        if (event.source !== window) {
            return;
        }

        if (!event.data) {
            return;
        }

        if (event.data.type !== RESPONSE) {
            return;
        }

        if (!waitingResolve) {
            return;
        }

        const result = event.data.result;

        const resolve = waitingResolve;

        waitingResolve = null;
        waitingReject = null;

        resolve(result);
    });

    function requestData() {

        return new Promise((resolve, reject) => {

            waitingResolve = resolve;
            waitingReject = reject;

            window.postMessage({
                type: REQUEST
            }, "*");

            setTimeout(() => {

                if (!waitingResolve) {
                    return;
                }

                waitingResolve = null;
                waitingReject = null;

                reject(
                    new Error(
                        "ВСОЛ не ответил. Возможно, страница еще не загрузилась."
                    )
                );

            }, 5000);
        });
    }

    function downloadJson(data) {

        const json = JSON.stringify(data, null, 2);

        const blob = new Blob(
            [json],
            {
                type: "application/json;charset=utf-8"
            }
        );

        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");

        link.href = url;

        const matchId =
            data.match && data.match.id
                ? data.match.id
                : "unknown";

        link.download = `vsol-match-${matchId}.json`;

        document.body.appendChild(link);

        link.click();

        link.remove();

        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 1000);
    }

    function copyJson(data) {

        const json = JSON.stringify(data, null, 2);

        return navigator.clipboard.writeText(json);
    }

    chrome.runtime.onMessage.addListener(
        (request, sender, sendResponse) => {

            if (!request || request.action !== "getMatchData") {
                return;
            }

            requestData()
                .then(result => {

                    if (!result.success) {

                        sendResponse({
                            success: false,
                            errors: result.errors
                        });

                        return;
                    }

                    sendResponse({
                        success: true,
                        data: result.data
                    });
                })
                .catch(error => {

                    sendResponse({
                        success: false,
                        errors: [error.message]
                    });
                });

            return true;
        }
    );

    chrome.runtime.onMessage.addListener(
        (request, sender, sendResponse) => {

            if (!request || request.action !== "downloadJson") {
                return;
            }

            if (!request.data) {

                sendResponse({
                    success: false,
                    error: "Нет данных для скачивания."
                });

                return;
            }

            try {

                downloadJson(request.data);

                sendResponse({
                    success: true
                });

            } catch (error) {

                sendResponse({
                    success: false,
                    error: error.message
                });
            }
        }
    );

    chrome.runtime.onMessage.addListener(
        (request, sender, sendResponse) => {

            if (!request || request.action !== "copyJson") {
                return;
            }

            if (!request.data) {

                sendResponse({
                    success: false,
                    error: "Нет данных для копирования."
                });

                return;
            }

            copyJson(request.data)
                .then(() => {

                    sendResponse({
                        success: true
                    });

                })
                .catch(error => {

                    sendResponse({
                        success: false,
                        error: error.message
                    });
                });

            return true;
        }
    );

})();
