// ========================================
// CƯỜNG MOBILE
// CART.JS
// ========================================


document.addEventListener(
    "DOMContentLoaded",
    function () {

        renderCart();

        updateCartCount();

        setupCartEvents();

    }
);


// ========================================
// LẤY GIỎ HÀNG
// ========================================

function getCart() {

    try {

        const cart =
            JSON.parse(
                localStorage.getItem(
                    "cart"
                )
            )
            || [];


        return Array.isArray(cart)
            ? cart
            : [];

    } catch (error) {

        console.error(
            "Lỗi đọc giỏ hàng:",
            error
        );

        return [];

    }

}


// ========================================
// LƯU GIỎ HÀNG
// ========================================

function saveCart(
    cart
) {

    if (
        typeof window.CuongMobileSaveCart ===
        "function"
    ) {

        window.CuongMobileSaveCart(
            cart
        );

        return;

    }

    try {

        localStorage.setItem(
            "cart",
            JSON.stringify(
                cart
            )
        );

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

    }

}


// ========================================
// HIỂN THỊ GIỎ
// ========================================

function renderCart() {

    const cart =
        getCart();


    const cartList =
        document.getElementById(
            "cart-list"
        );


    const emptyCart =
        document.getElementById(
            "empty-cart"
        );


    const summary =
        document.getElementById(
            "cart-summary"
        );


    if (!cartList) {

        return;

    }


    // ====================================
    // GIỎ TRỐNG
    // ====================================

    if (cart.length === 0) {

        cartList.innerHTML =
            "";


        if (emptyCart) {

            emptyCart.style.display =
                "block";

        }


        if (summary) {

            summary.style.display =
                "none";

        }


        return;

    }


    // ====================================
    // CÓ SẢN PHẨM
    // ====================================

    if (emptyCart) {

        emptyCart.style.display =
            "none";

    }


    if (summary) {

        summary.style.display =
            "block";

    }


    cartList.innerHTML =
        cart.map(
            function (
                item,
                index
            ) {

                const quantity =
                    Number(
                        item.quantity || 1
                    );


                const price =
                    Number(
                        item.price || 0
                    );


                const total =
                    price
                    *
                    quantity;


                return `

                    <div
                        class="cart-item"
                        data-index="${index}">


                        <div
                            class="cart-item-image">

                            <img
                                src="${escapeHTML(
                    item.image || ""
                )}"
                                alt="${escapeHTML(
                    item.name
                )}">

                        </div>



                        <div
                            class="cart-item-info">


                            <h3>

                                ${escapeHTML(
                    item.name
                )}

                            </h3>


                            <p
                                class="cart-item-price">

                                ${formatPrice(
                    price
                )}

                            </p>


                            <button
                                type="button"
                                class="remove-btn"
                                data-index="${index}">

                                🗑 Xóa

                            </button>

                        </div>



                        <div
                            class="cart-quantity">


                            <button
                                type="button"
                                class="quantity-minus"
                                data-index="${index}">

                                −

                            </button>


                            <span>

                                ${quantity}

                            </span>


                            <button
                                type="button"
                                class="quantity-plus"
                                data-index="${index}">

                                +

                            </button>


                        </div>



                        <div
                            class="cart-item-total">

                            ${formatPrice(
                    total
                )}

                        </div>


                    </div>

                `;

            }
        )
            .join("");


    updateSummary(
        cart
    );

}


// ========================================
// TỔNG TIỀN
// ========================================

function updateSummary(
    cart
) {

    const subtotal =
        cart.reduce(
            function (
                total,
                item
            ) {

                return total
                    +
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


    const subtotalElement =
        document.getElementById(
            "cart-subtotal"
        );


    const totalElement =
        document.getElementById(
            "cart-total"
        );


    if (subtotalElement) {

        subtotalElement.textContent =
            formatPrice(
                subtotal
            );

    }


    if (totalElement) {

        totalElement.textContent =
            formatPrice(
                subtotal
            );

    }

}


// ========================================
// EVENT
// ========================================

function setupCartEvents() {

    document.addEventListener(
        "click",
        function (event) {


            // =================================
            // XÓA
            // =================================

            const removeButton =
                event.target.closest(
                    ".remove-btn"
                );


            if (removeButton) {

                const index =
                    Number(
                        removeButton.dataset.index
                    );


                removeItem(
                    index
                );

                return;

            }


            // =================================
            // GIẢM
            // =================================

            const minusButton =
                event.target.closest(
                    ".quantity-minus"
                );


            if (minusButton) {

                const index =
                    Number(
                        minusButton.dataset.index
                    );


                changeQuantity(
                    index,
                    -1
                );

                return;

            }


            // =================================
            // TĂNG
            // =================================

            const plusButton =
                event.target.closest(
                    ".quantity-plus"
                );


            if (plusButton) {

                const index =
                    Number(
                        plusButton.dataset.index
                    );


                changeQuantity(
                    index,
                    1
                );

                return;

            }

        }
    );


    // =====================================
    // CHECKOUT
    // =====================================

    const checkoutButton =
        document.getElementById(
            "checkout-btn"
        );


    if (checkoutButton) {

        checkoutButton.addEventListener(
            "click",
            function () {

                const cart =
                    getCart();


                if (cart.length === 0) {

                    alert(
                        "Giỏ hàng đang trống."
                    );

                    return;

                }


                window.location.href =
                    "checkout.html";

            }
        );

    }


    // =====================================
    // XÓA TOÀN BỘ
    // =====================================

    const clearButton =
        document.getElementById(
            "clear-cart-btn"
        );


    if (clearButton) {

        clearButton.addEventListener(
            "click",
            function () {

                const cart =
                    getCart();


                if (cart.length === 0) {

                    return;

                }


                const confirmDelete =
                    confirm(
                        "Bạn có chắc muốn xóa toàn bộ giỏ hàng?"
                    );


                if (!confirmDelete) {

                    return;

                }


                localStorage.removeItem(
                    "cart"
                );


                renderCart();

                updateCartCount();

            }
        );

    }

}


// ========================================
// THAY ĐỔI SỐ LƯỢNG
// ========================================

function changeQuantity(
    index,
    change
) {

    const cart =
        getCart();


    if (!cart[index]) {

        return;

    }


    let quantity =
        Number(
            cart[index].quantity || 1
        );


    quantity +=
        change;


    if (quantity <= 0) {

        removeItem(
            index
        );

        return;

    }

    const stock =
        Number(
            cart[index].stock || 0
        );

    if (
        stock > 0 &&
        quantity > stock
    ) {

        quantity =
            stock;

    }


    cart[index].quantity =
        quantity;


    saveCart(
        cart
    );


    renderCart();

    updateCartCount();

}


// ========================================
// XÓA SẢN PHẨM
// ========================================

function removeItem(
    index
) {

    const cart =
        getCart();


    if (!cart[index]) {

        return;

    }


    cart.splice(
        index,
        1
    );


    saveCart(
        cart
    );


    renderCart();

    updateCartCount();

}


// ========================================
// CART COUNT
// ========================================

function updateCartCount() {

    const cart =
        getCart();


    const count =
        cart.reduce(
            function (
                total,
                item
            ) {

                return total
                    +
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
// FORMAT TIỀN
// ========================================

function formatPrice(
    price
) {

    return Number(
        price || 0
    )
        .toLocaleString(
            "vi-VN"
        )
        +
        " ₫";

}


// ========================================
// ESCAPE HTML
// ========================================

function escapeHTML(
    value
) {

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