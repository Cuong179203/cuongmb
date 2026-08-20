"use strict";

window.CUONG_MOBILE_API_URL =
    "https://script.google.com/macros/s/AKfycbxxQRkcRL5BrTEdH28baGNOIyYa-I2vKiYkbQ_ChiMICpqRLSayBpaCM_N44Kn8jtV3/exec";

window.CUONG_MOBILE_ADMIN_TOKEN_KEY =
    "CM_ADMIN_TOKEN";

window.CuongMobileNotify =
    function (message, type = "error") {

        let element =
            document.getElementById(
                "cm-notification"
            );

        if (!element) {

            element =
                document.createElement(
                    "div"
                );

            element.id =
                "cm-notification";

            element.setAttribute(
                "role",
                "status"
            );

            document.body.appendChild(
                element
            );

        }

        element.className =
            "cm-notification cm-notification-" +
            type;

        element.textContent =
            String(message || "");

        element.classList.add(
            "is-visible"
        );

        clearTimeout(
            window.CuongMobileNotify.timer
        );

        window.CuongMobileNotify.timer =
            setTimeout(
                function () {

                    element.classList.remove(
                        "is-visible"
                    );

                },
                4500
            );

    };

window.CuongMobileSaveCart =
    function (cart) {

        try {

            localStorage.setItem(
                "cart",
                JSON.stringify(
                    Array.isArray(cart)
                        ? cart
                        : []
                )
            );

            return true;

        }

        catch (error) {

            if (
                typeof window.CuongMobileNotify ===
                "function"
            ) {

                window.CuongMobileNotify(
                    "Không thể lưu giỏ hàng trên trình duyệt.",
                    "error"
                );

            }

            console.error(
                "Lỗi lưu giỏ hàng:",
                error
            );

            return false;

        }

    };