// ========================================
// CƯỜNG MOBILE
// CHECKOUT.JS
// ========================================


// ========================================
// API GOOGLE APPS SCRIPT
// ========================================

const API_URL =
    "https://script.google.com/macros/s/AKfycbxxQRkcRL5BrTEdH28baGNOIyYa-I2vKiYkbQ_ChiMICpqRLSayBpaCM_N44Kn8jtV3/exec";


// ========================================
// KHỞI ĐỘNG
// ========================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadCheckout();

        updateCartCount();

        setupCheckoutForm();

    }
);


// ========================================
// LẤY CART
// ========================================

function getCart() {

    try {

        const data =
            localStorage.getItem(
                "cart"
            );


        if (!data) {

            return [];

        }


        const cart =
            JSON.parse(
                data
            );


        return Array.isArray(cart)
            ? cart
            : [];

    }

    catch (error) {

        console.error(
            "Lỗi đọc cart:",
            error
        );

        return [];

    }

}


// ========================================
// HIỂN THỊ CHECKOUT
// ========================================

function loadCheckout() {

    const cart =
        getCart();


    const itemsContainer =
        document.getElementById(
            "checkout-items"
        );


    const totalElement =
        document.getElementById(
            "checkout-total"
        );


    const submitButton =
        document.getElementById(
            "submit-order"
        );


    if (!itemsContainer) {

        return;

    }


    // ====================================
    // GIỎ TRỐNG
    // ====================================

    if (
        cart.length === 0
    ) {

        itemsContainer.innerHTML = `

            <div class="checkout-empty">

                <h3>
                    Giỏ hàng đang trống
                </h3>

                <p>
                    Bạn chưa có sản phẩm để thanh toán.
                </p>

                <a
                    href="index.html#products"
                    class="btn">

                    Xem sản phẩm

                </a>

            </div>

        `;


        if (totalElement) {

            totalElement.textContent =
                "0 ₫";

        }


        if (submitButton) {

            submitButton.disabled =
                true;

        }


        return;

    }


    // ====================================
    // HIỂN THỊ SẢN PHẨM
    // ====================================

    let total = 0;


    itemsContainer.innerHTML =
        cart
            .map(
                function(item) {

                    const price =
                        Number(
                            item.price || 0
                        );


                    const quantity =
                        Number(
                            item.quantity || 1
                        );


                    const itemTotal =
                        price *
                        quantity;


                    total +=
                        itemTotal;


                    return `

                        <div
                            class="checkout-item">


                            <div
                                class="checkout-item-image">

                                <img
                                    src="${escapeHTML(
                                        item.image || ""
                                    )}"
                                    alt="${escapeHTML(
                                        item.name || ""
                                    )}">

                            </div>


                            <div
                                class="checkout-item-info">

                                <h3>

                                    ${escapeHTML(
                                        item.name || ""
                                    )}

                                </h3>


                                <p>

                                    ${formatPrice(
                                        price
                                    )}

                                    ×

                                    ${quantity}

                                </p>

                            </div>


                            <strong>

                                ${formatPrice(
                                    itemTotal
                                )}

                            </strong>


                        </div>

                    `;

                }
            )
            .join("");


    if (totalElement) {

        totalElement.textContent =
            formatPrice(
                total
            );

    }

}


// ========================================
// FORM THANH TOÁN
// ========================================

function setupCheckoutForm() {

    const form =
        document.getElementById(
            "checkout-form"
        );


    if (!form) {

        return;

    }


    form.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            const cart =
                getCart();


            // ============================
            // KIỂM TRA CART
            // ============================

            if (
                cart.length === 0
            ) {

                showMessage(
                    "Giỏ hàng đang trống."
                );

                return;

            }


            // ============================
            // LẤY FORM
            // ============================

            const name =
                document
                    .getElementById(
                        "customer-name"
                    )
                    .value
                    .trim();


            const phone =
                document
                    .getElementById(
                        "customer-phone"
                    )
                    .value
                    .trim();


            const address =
                document
                    .getElementById(
                        "customer-address"
                    )
                    .value
                    .trim();


            const note =
                document
                    .getElementById(
                        "customer-note"
                    )
                    .value
                    .trim();


            const paymentElement =
                document.querySelector(
                    'input[name="payment"]:checked'
                );


            const payment =
                paymentElement
                    ? paymentElement.value
                    : "COD";


            // ============================
            // VALIDATE
            // ============================

            if (!name) {

                showMessage(
                    "Vui lòng nhập họ và tên."
                );

                return;

            }


            if (!phone) {

                showMessage(
                    "Vui lòng nhập số điện thoại."
                );

                return;

            }


            if (
                !isValidPhone(phone)
            ) {

                showMessage(
                    "Số điện thoại không hợp lệ."
                );

                return;

            }


            if (!address) {

                showMessage(
                    "Vui lòng nhập địa chỉ."
                );

                return;

            }


            // ============================
            // TÍNH TỔNG
            // ============================

            const total =
                cart.reduce(
                    function(
                        sum,
                        item
                    ) {

                        return sum +

                            (
                                Number(
                                    item.price || 0
                                )

                                *

                                Number(
                                    item.quantity || 0
                                )
                            );

                    },
                    0
                );


            // ============================
            // TẠO MÃ ĐƠN
            // ============================

            const orderId =
                generateOrderId();


            // ============================
            // OBJECT GỬI APPS SCRIPT
            // ============================

            const order = {

                action:
                    "createOrder",

                orderId:
                    orderId,

                name:
                    name,

                phone:
                    phone,

                address:
                    address,

                items:
                    cart,

                total:
                    total,

                payment:
                    payment,

                note:
                    note

            };


            console.log(
                "Đơn hàng gửi đi:",
                order
            );


            // ============================
            // KHÓA NÚT
            // ============================

            const submitButton =
                document.getElementById(
                    "submit-order"
                );


            if (submitButton) {

                submitButton.disabled =
                    true;

                submitButton.textContent =
                    "Đang xử lý...";

            }


            showMessage(
                "Đang lưu đơn hàng..."
            );


            // ============================
            // GỬI GOOGLE SHEETS
            // ============================

            try {

                const result =
                    await sendOrder(
                        order
                    );


                console.log(
                    "Kết quả API:",
                    result
                );


                if (
                    !result ||
                    result.success !== true
                ) {

                    throw new Error(

                        result &&
                        (
                            result.error ||
                            result.message
                        )

                        ||

                        "Không thể lưu đơn hàng."

                    );

                }


                // ========================
                // LƯU ĐƠN CUỐI
                // ========================

                localStorage.setItem(

                    "lastOrder",

                    JSON.stringify({

                        ...order,

                        orderId:
                            result.orderId ||
                            order.orderId

                    })

                );


                // ========================
                // XÓA CART
                // ========================

                localStorage.removeItem(
                    "cart"
                );


                localStorage.removeItem(
                    "pendingOrder"
                );


                // ========================
                // CHUYỂN SUCCESS
                // ========================

                window.location.href =

                    "success.html?orderId=" +

                    encodeURIComponent(

                        result.orderId ||
                        order.orderId

                    );


            }

            catch (error) {

                console.error(
                    "Lỗi đặt hàng:",
                    error
                );


                showMessage(
                    "Lỗi: " +
                    error.message
                );


                if (submitButton) {

                    submitButton.disabled =
                        false;

                    submitButton.textContent =
                        "Đặt hàng";

                }

            }

        }
    );

}


// ========================================
// GỬI ORDER
// ========================================

async function sendOrder(order) {

    if (
        !API_URL ||
        API_URL.includes(
            "DÁN_URL"
        )
    ) {

        throw new Error(
            "Bạn chưa cấu hình API_URL trong checkout.js."
        );

    }


    const response =
        await fetch(

            API_URL,

            {

                method:
                    "POST",

                headers: {

                    "Content-Type":
                        "text/plain;charset=utf-8"

                },

                body:
                    JSON.stringify(
                        order
                    )

            }

        );


    // ====================================
    // ĐỌC TEXT TRƯỚC
    // ====================================

    const text =
        await response.text();


    console.log(
        "Raw API response:",
        text
    );


    if (!text) {

        throw new Error(
            "Google Apps Script trả về dữ liệu rỗng."
        );

    }


    // ====================================
    // PARSE JSON
    // ====================================

    let result;


    try {

        result =
            JSON.parse(
                text
            );

    }

    catch (error) {

        console.error(
            "API trả về không phải JSON:",
            text
        );


        throw new Error(
            "Google Apps Script không trả về JSON."
        );

    }


    return result;

}


// ========================================
// TẠO ORDER ID
// ========================================

function generateOrderId() {

    const now =
        new Date();


    const date =
        now.getFullYear() +

        String(
            now.getMonth() + 1
        ).padStart(
            2,
            "0"
        ) +

        String(
            now.getDate()
        ).padStart(
            2,
            "0"
        ) +

        String(
            now.getHours()
        ).padStart(
            2,
            "0"
        ) +

        String(
            now.getMinutes()
        ).padStart(
            2,
            "0"
        ) +

        String(
            now.getSeconds()
        ).padStart(
            2,
            "0"
        );


    const random =
        Math.floor(
            100 +
            Math.random() * 900
        );


    return (
        "CM" +
        date +
        random
    );

}


// ========================================
// VALIDATE PHONE
// ========================================

function isValidPhone(phone) {

    const cleaned =
        phone.replace(
            /\s/g,
            ""
        );


    return /^0\d{9,10}$/.test(
        cleaned
    );

}


// ========================================
// CART COUNT
// ========================================

function updateCartCount() {

    const cart =
        getCart();


    const count =
        cart.reduce(
            function(
                total,
                item
            ) {

                return total +

                    Number(
                        item.quantity || 0
                    );

            },
            0
        );


    const element =
        document.getElementById(
            "cart-count"
        );


    if (element) {

        element.textContent =
            count;

    }

}


// ========================================
// THÔNG BÁO
// ========================================

function showMessage(message) {

    const element =
        document.getElementById(
            "checkout-message"
        );


    if (!element) {

        return;

    }


    element.textContent =
        message;


    element.classList.add(
        "show"
    );

}


// ========================================
// FORMAT TIỀN
// ========================================

function formatPrice(price) {

    return Number(
        price || 0
    )
    .toLocaleString(
        "vi-VN"
    )
    + " ₫";

}


// ========================================
// ESCAPE HTML
// ========================================

function escapeHTML(value) {

    return String(
        value ?? ""
    )

    .replace(
        /&/g,
        "&amp;"
    )

    .replace(
        /</g,
        "&lt;"
    )

    .replace(
        />/g,
        "&gt;"
    )

    .replace(
        /"/g,
        "&quot;"
    )

    .replace(
        /'/g,
        "&#039;"
    );

}