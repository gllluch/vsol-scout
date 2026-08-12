(function () {
    "use strict";

    const REQUEST = "VSOL_SCOUT_GET_PAGE_DATA";
    const RESPONSE = "VSOL_SCOUT_PAGE_DATA";

    let resolver = null;

    window.addEventListener("message", event => {

        if (event.source !== window) {
            return;
        }

        if (!event.data) {
            return;
        }

        if (event.data.type !== RESPONSE) {
            return;
        }

        if (!resolver) {
            return;
        }

        const resolve = resolver;

        resolver = null;

        resolve(event.data.result);
    });

    function getPageData(mode = "page") {

        return new Promise((resolve, reject) => {

            resolver = resolve;

            window.postMessage({
                type: REQUEST,
                mode
            }, "*");

            setTimeout(() => {

                if (!resolver) {
                    return;
                }

                resolver = null;

                reject(
                    new Error(
                        "Страница ВСОЛ не ответила."
                    )
                );

            }, 5000);
        });
    }

    function downloadJson(data) {

        const json = JSON.stringify(
            data,
            null,
            2
        );

        const blob = new Blob(
            [json],
            {
                type:
                    "application/json;charset=utf-8"
            }
        );

        const url =
            URL.createObjectURL(blob);

        const link =
            document.createElement("a");

        link.href = url;

        link.download =
            `vsol-scout-${Date.now()}.json`;

        document.body.appendChild(link);

        link.click();

        link.remove();

        setTimeout(
            () => URL.revokeObjectURL(url),
            1000
        );
    }

    chrome.runtime.onMessage.addListener(
        (request, sender, sendResponse) => {

            if (
                !request ||
                request.action !==
                "collectPage"
            ) {
                return;
            }

            getPageData(request.mode)
                .then(data => {

                    sendResponse({
                        success: true,
                        data
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

    chrome.runtime.onMessage.addListener(
        (request, sender, sendResponse) => {

            if (
                !request ||
                request.action !==
                "downloadJson"
            ) {
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

})();
