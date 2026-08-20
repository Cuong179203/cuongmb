"use strict";

document.addEventListener(
    "DOMContentLoaded",
    function () {

        updateTrackingCartCount();

        const form =
            document.getElementById(
                "tracking-form"
            );

        if (form) {

            form.addEventListener(
                "submit",
                lookupOrder
            );

        }

    }
);

async function lookupOrder(event) {

    event.preventDefault();

    const input =
        document.getElementById(
            "tracking-order-id"
        );

    const result =
        document.getElementById(
            "tracking-result"
        );

    const orderId =
        String(
            input?.value || ""
        ).trim();

    if (!orderId || !result) {

        return;

    }

    result.className =
        "tracking-result is-loading";

    result.textContent =
        "Đang tra cứu...";

    try {

        const response =
            await fetch(
                window.CUONG_MOBILE_API_URL +
                "?action=getOrder&orderId=" +
                encodeURIComponent(orderId) +
                "&t=" +
                Date.now(),
                {
                    method: "GET",
                    cache: "no-store"
                }
            );

        if (!response.ok) {

            throw new Error(
                "HTTP " +
                response.status
            );

        }

        const data =
            await response.json();

        if (
            !data ||
            data.success !== true ||
            !data.order
        ) {

            throw new Error(
                data?.error ||
                "Không tìm thấy đơn hàng."
            );

        }

        renderOrder(
            result,
            data.order
        );

    }

    catch (error) {

        result.className =
            "tracking-result is-error";

        result.textContent =
            navigator.onLine
                ? error.message
                : "Mất kết nối mạng. Vui lòng thử lại.";

        if (
            typeof window.CuongMobileNotify ===
            "function"
        ) {

            window.CuongMobileNotify(
                result.textContent,
                "error"
            );

        }

    }

}

function renderOrder(
    container,
    order
) {

    const status =
        order["Trạng thái"] ||
        order.status ||
        "Chờ xử lý";

    const name =
        order["Họ tên"] ||
        order.name ||
        "";

    const date =
        order["Ngày"] ||
        order.date ||
        "";

    const products =
        order["Sản phẩm"] ||
        order.products ||
        "";

    const total =
        Number(
            order["Tổng tiền"] ||
            order.total ||
            0
        ).toLocaleString("vi-VN") +
        " ₫";

    const displayOrderId =
        String(
            order["Order ID"] ||
            order.orderId ||
            ""
        ).toUpperCase();

    container.className =
        "tracking-result is-success";

    container.innerHTML =
        "<div class=\"tracking-status\">" +
        escapeHtml(status) +
        "</div>" +
        "<div class=\"tracking-grid\">" +
        "<span>Mã đơn</span><strong>" +
        escapeHtml(
            displayOrderId
        ) +
        "</strong>" +
        "<span>Khách hàng</span><strong>" +
        escapeHtml(name) +
        "</strong>" +
        "<span>Ngày đặt</span><strong>" +
        escapeHtml(date) +
        "</strong>" +
        "<span>Sản phẩm</span><strong>" +
        escapeHtml(products) +
        "</strong>" +
        "<span>Tổng tiền</span><strong>" +
        escapeHtml(total) +
        "</strong></div>";

}

function updateTrackingCartCount() {

    try {

        const cart =
            JSON.parse(
                localStorage.getItem("cart") ||
                "[]"
            );

        const count =
            Array.isArray(cart)
                ? cart.reduce(
                    function (total, item) {

                        return total +
                            Number(item.quantity || 0);

                    },
                    0
                )
                : 0;

        const element =
            document.getElementById(
                "cart-count"
            );

        if (element) {

            element.textContent =
                count;

        }

    }

    catch (error) {

        console.error(
            "Lỗi đọc số lượng giỏ hàng:",
            error
        );

    }

}

function escapeHtml(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}
