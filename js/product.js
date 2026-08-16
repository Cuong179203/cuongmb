// ========================================
// CƯỜNG MOBILE
// PRODUCT.JS
// ========================================

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        console.log(
            "PRODUCT PAGE START"
        );

        try {

            await window.productsReady;

            console.log(
                "Products ready:",
                products
            );

            showProduct();

            updateCartCount();

        }

        catch (error) {

            console.error(
                "Không tải được products:",
                error
            );

            const container =
                document.getElementById(
                    "product-detail"
                );

            if (container) {

                container.innerHTML = `

                    <div class="product-not-found">

                        <h2>
                            Lỗi dữ liệu sản phẩm
                        </h2>

                        <p>
                            Không tải được danh sách sản phẩm.
                        </p>

                        <a
                            href="index.html"
                            class="btn">

                            ← Quay lại trang chủ

                        </a>

                    </div>

                `;

            }

        }

    }
);


// ========================================
// GET PRODUCT ID
// ========================================

function getProductId() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    return params.get("id");

}


// ========================================
// SHOW PRODUCT
// ========================================

function showProduct() {

    const container =
        document.getElementById(
            "product-detail"
        );

    if (!container) {

        console.error(
            "Không tìm thấy #product-detail"
        );

        return;

    }


    const productId =
        getProductId();


    if (!productId) {

        showProductError(
            container,
            "Không có mã sản phẩm."
        );

        return;

    }


    const product =
        products.find(
            function (item) {

                return String(
                    item.id
                ).trim()
                ===
                String(
                    productId
                ).trim();

            }
        );


    if (!product) {

        showProductError(
            container,
            "Không tìm thấy sản phẩm có mã: " +
            productId
        );

        return;

    }


    document.title =
        product.name +
        " - Cường Mobile";


    const stock =
        Number(
            product.stock || 0
        );


    const stockText =
        stock > 0
            ? `Còn ${stock} sản phẩm`
            : "Hết hàng";


    const images =
        Array.isArray(
            product.images
        )
            ? product.images
            : [];


    // Nếu dữ liệu cũ chỉ có image
    if (
        images.length === 0 &&
        product.image
    ) {

        images.push(
            product.image
        );

    }


    const mainImage =
        images[0] || "";


    const hasOriginalPrice =
        Number(
            product.originalPrice
        ) > Number(
            product.price
        );


    const discountPercent =
        Number(
            product.discountPercent
        ) || 0;


    const offerHTML =
        product.offer
            ? `

                <div class="product-offer">

                    <div class="product-offer-title">

                        🔥 Ưu đãi đặc biệt

                    </div>

                    <div class="product-offer-content">

                        ${escapeHTML(
                            product.offer
                        )}

                    </div>

                </div>

            `
            : "";


    const priceHTML = `

        <div class="product-price-area">

            ${
                hasOriginalPrice
                    ? `

                        <div class="product-original-price">

                            ${formatPrice(
                                product.originalPrice
                            )}

                        </div>

                    `
                    : ""
            }


            <div class="product-current-price">

                ${formatPrice(
                    product.price
                )}

            </div>


            ${
                discountPercent > 0
                    ? `

                        <span class="product-discount">

                            -${discountPercent}%

                        </span>

                    `
                    : ""
            }

        </div>

    `;


    const thumbnailsHTML =
        images.length > 0
            ? `

                <div
                    class="product-thumbnails"
                    id="product-thumbnails">

                    ${

                        images
                            .map(
                                function (
                                    image,
                                    index
                                ) {

                                    return `

                                        <button
                                            type="button"
                                            class="
                                                product-thumbnail
                                                ${
                                                    index === 0
                                                        ? "active"
                                                        : ""
                                                }
                                            "
                                            data-index="${index}">

                                            <img
                                                src="${escapeHTML(
                                                    image
                                                )}"
                                                alt="${escapeHTML(
                                                    product.name
                                                )} - ảnh ${index + 1}"
                                                loading="lazy"
                                            >

                                        </button>

                                    `;

                                }
                            )
                            .join("")

                    }

                </div>

            `
            : "";


    const specificationsHTML =
        renderSpecifications(
            product.specifications
        );


    container.innerHTML = `

        <div class="product-detail">


            <!-- ==================================
                 IMAGE GALLERY
                 ================================== -->

            <div class="product-detail-gallery">


                <div class="product-main-image-wrap">

                    ${
                        discountPercent > 0
                            ? `

                                <div class="product-image-badge">

                                    -${discountPercent}%

                                </div>

                            `
                            : ""
                    }


                    <img
                        src="${escapeHTML(
                            mainImage
                        )}"
                        alt="${escapeHTML(
                            product.name
                        )}"
                        id="product-image"
                        class="product-main-image"
                    >


                    <div
                        id="image-error"
                        class="image-error"
                        style="display:none;">

                        Không tải được hình ảnh sản phẩm.

                    </div>

                </div>


                ${thumbnailsHTML}


            </div>



            <!-- ==================================
                 PRODUCT INFO
                 ================================== -->

            <div class="product-detail-info">


                <div class="product-category">

                    ${escapeHTML(
                        product.category ||
                        "Sản phẩm"
                    )}

                </div>


                <h1>

                    ${escapeHTML(
                        product.name
                    )}

                </h1>


                ${priceHTML}


                <div class="product-stock">

                    ${
                        stock > 0
                            ? "✓ "
                            : "✕ "
                    }

                    ${stockText}

                </div>


                ${offerHTML}


                


                <!-- QUANTITY -->

                <div class="quantity-box">

                    <label
                        for="product-quantity">

                        Số lượng:

                    </label>


                    <div class="quantity-control">

                        <button
                            type="button"
                            id="minus-btn">

                            −

                        </button>


                        <input
                            type="number"
                            id="product-quantity"
                            value="1"
                            min="1"
                            max="${stock > 0 ? stock : 1}"
                        >


                        <button
                            type="button"
                            id="plus-btn">

                            +

                        </button>

                    </div>

                </div>


                <!-- BUTTONS -->

                <div class="product-action-buttons">


                    <button
                        type="button"
                        id="add-to-cart"
                        class="btn add-product-btn"
                        ${stock <= 0 ? "disabled" : ""}>

                        🛒 Thêm vào giỏ

                    </button>


                    <button
                        type="button"
                        id="buy-now"
                        class="btn buy-now-btn"
                        ${stock <= 0 ? "disabled" : ""}>

                        ⚡ Mua ngay

                    </button>


                </div>


                <a
                    href="cart.html"
                    class="view-cart-link">

                    Xem giỏ hàng →

                </a>


                <div
                    id="product-message"
                    class="product-message">

                </div>


            </div>


        </div>


        <!-- ==================================
             SPECIFICATIONS
             ================================== -->

        ${
            specificationsHTML
                ? `

                    <section class="product-specifications">

                        <div class="section-heading">

                            <span>
                                ⚙️
                            </span>

                            <h2>
                                Thông số kỹ thuật
                            </h2>

                        </div>


                        <div class="specifications-content">

                            ${specificationsHTML}

                        </div>

                    </section>

                `
                : ""
        }


        <!-- ==================================
             FULL DESCRIPTION
             ================================== -->

        ${
            product.description
                ? `

                    <section class="product-full-description">

                        <div class="section-heading">

                            <span>
                                📋
                            </span>

                            <h2>
                                Mô tả sản phẩm
                            </h2>

                        </div>


                        <div class="description-content">

                            ${formatDescription(
                                product.description
                            )}

                        </div>

                    </section>

                `
                : ""
        }

    `;


    setupGallery(
        images
    );


    setupImageError();


    setupProductEvents(
        product
    );

}


// ========================================
// GALLERY
// ========================================

function setupGallery(
    images
) {

    const mainImage =
        document.getElementById(
            "product-image"
        );

    const thumbnails =
        document.querySelectorAll(
            ".product-thumbnail"
        );


    if (
        !mainImage ||
        !images.length
    ) {

        return;

    }


    thumbnails.forEach(
        function (
            thumbnail
        ) {

            thumbnail.addEventListener(
                "click",
                function () {

                    const index =
                        Number(
                            thumbnail.dataset.index
                        );


                    if (
                        !images[index]
                    ) {

                        return;

                    }


                    mainImage.src =
                        images[index];


                    thumbnails.forEach(
                        function (
                            item
                        ) {

                            item.classList.remove(
                                "active"
                            );

                        }
                    );


                    thumbnail.classList.add(
                        "active"
                    );

                }
            );

        }
    );

}


// ========================================
// IMAGE ERROR
// ========================================

function setupImageError() {

    const image =
        document.getElementById(
            "product-image"
        );


    const imageError =
        document.getElementById(
            "image-error"
        );


    if (!image) {
        return;
    }


    image.addEventListener(
        "error",
        function () {

            image.style.display =
                "none";


            if (imageError) {

                imageError.style.display =
                    "block";

            }

        }
    );

}


// ========================================
// SPECIFICATIONS
// ========================================

function renderSpecifications(
    specifications
) {

    if (!specifications) {
        return "";
    }


    const text =
        String(
            specifications
        ).trim();


    if (!text) {
        return "";
    }


    const lines =
        text
            .split(/\r?\n/)
            .map(
                function (
                    line
                ) {

                    return line.trim();

                }
            )
            .filter(
                Boolean
            );


    if (!lines.length) {
        return "";
    }


    return `

        <div class="specification-table">

            ${
                lines
                    .map(
                        function (
                            line
                        ) {

                            const separatorIndex =
                                line.indexOf(":");


                            if (
                                separatorIndex === -1
                            ) {

                                return `

                                    <div class="spec-row spec-row-full">

                                        <div class="spec-value">

                                            ${escapeHTML(
                                                line
                                            )}

                                        </div>

                                    </div>

                                `;

                            }


                            const label =
                                line
                                    .substring(
                                        0,
                                        separatorIndex
                                    )
                                    .trim();


                            const value =
                                line
                                    .substring(
                                        separatorIndex + 1
                                    )
                                    .trim();


                            return `

                                <div class="spec-row">

                                    <div class="spec-label">

                                        ${escapeHTML(
                                            label
                                        )}

                                    </div>


                                    <div class="spec-value">

                                        ${escapeHTML(
                                            value
                                        )}

                                    </div>

                                </div>

                            `;

                        }
                    )
                    .join("")
            }

        </div>

    `;

}


// ========================================
// DESCRIPTION
// ========================================

function formatDescription(
    description
) {

    return escapeHTML(
        description
    )
    .replace(
        /\r?\n/g,
        "<br>"
    );

}


// ========================================
// PRODUCT EVENTS
// ========================================

function setupProductEvents(
    product
) {

    const input =
        document.getElementById(
            "product-quantity"
        );


    const minus =
        document.getElementById(
            "minus-btn"
        );


    const plus =
        document.getElementById(
            "plus-btn"
        );


    const addButton =
        document.getElementById(
            "add-to-cart"
        );


    const buyNow =
        document.getElementById(
            "buy-now"
        );


    if (
        !input ||
        !minus ||
        !plus
    ) {

        return;

    }


    minus.addEventListener(
        "click",
        function () {

            let quantity =
                Number(
                    input.value
                ) || 1;


            quantity--;


            if (
                quantity < 1
            ) {

                quantity = 1;

            }


            input.value =
                quantity;

        }
    );


    plus.addEventListener(
        "click",
        function () {

            let quantity =
                Number(
                    input.value
                ) || 1;


            const max =
                Number(
                    product.stock || 0
                );


            quantity++;


            if (
                quantity > max
            ) {

                quantity = max;

            }


            input.value =
                quantity;

        }
    );


    input.addEventListener(
        "change",
        function () {

            let quantity =
                Number(
                    input.value
                ) || 1;


            const max =
                Number(
                    product.stock || 0
                );


            if (
                quantity < 1
            ) {

                quantity = 1;

            }


            if (
                quantity > max
            ) {

                quantity = max;

            }


            input.value =
                quantity;

        }
    );


    if (addButton) {

        addButton.addEventListener(
            "click",
            function () {

                const quantity =
                    getQuantity(
                        input,
                        product
                    );


                if (!quantity) {
                    return;
                }


                addToCart(
                    product,
                    quantity
                );


                showMessage(
                    "✓ Đã thêm sản phẩm vào giỏ hàng."
                );

            }
        );

    }


    if (buyNow) {

        buyNow.addEventListener(
            "click",
            function () {

                const quantity =
                    getQuantity(
                        input,
                        product
                    );


                if (!quantity) {
                    return;
                }


                let cart = [];


                try {

                    cart =
                        JSON.parse(
                            localStorage.getItem(
                                "cart"
                            )
                        ) || [];

                }

                catch (error) {

                    cart = [];

                }


                if (
                    !Array.isArray(cart)
                ) {

                    cart = [];

                }


                const existing =
                    cart.find(
                        function (
                            item
                        ) {

                            return String(
                                item.id
                            )
                            ===
                            String(
                                product.id
                            );

                        }
                    );


                if (existing) {

                    existing.quantity =
                        Number(
                            existing.quantity || 0
                        ) +
                        quantity;

                }

                else {

                    cart.push({

                        id:
                            product.id,

                        name:
                            product.name,

                        price:
                            Number(
                                product.price
                            ),

                        image:
                            product.image,

                        quantity:
                            quantity

                    });

                }


                localStorage.setItem(
                    "cart",
                    JSON.stringify(
                        cart
                    )
                );


                window.location.href =
                    "checkout.html";

            }
        );

    }

}


// ========================================
// GET QUANTITY
// ========================================

function getQuantity(
    input,
    product
) {

    let quantity =
        Number(
            input.value
        ) || 1;


    const stock =
        Number(
            product.stock || 0
        );


    if (
        stock <= 0
    ) {

        showMessage(
            "Sản phẩm hiện đã hết hàng."
        );

        return null;

    }


    if (
        quantity < 1
    ) {

        quantity = 1;

    }


    if (
        quantity > stock
    ) {

        quantity = stock;

        input.value =
            stock;


        showMessage(
            `Chỉ còn ${stock} sản phẩm.`
        );

    }


    return quantity;

}


// ========================================
// ADD TO CART
// ========================================

function addToCart(
    product,
    quantity
) {

    let cart = [];


    try {

        cart =
            JSON.parse(
                localStorage.getItem(
                    "cart"
                )
            ) || [];

    }

    catch (error) {

        cart = [];

    }


    if (
        !Array.isArray(cart)
    ) {

        cart = [];

    }


    const existing =
        cart.find(
            function (
                item
            ) {

                return String(
                    item.id
                )
                ===
                String(
                    product.id
                );

            }
        );


    if (existing) {

        existing.quantity =
            Number(
                existing.quantity || 0
            ) +
            quantity;

    }

    else {

        cart.push({

            id:
                product.id,

            name:
                product.name,

            price:
                Number(
                    product.price
                ),

            image:
                product.image,

            quantity:
                quantity

        });

    }


    localStorage.setItem(
        "cart",
        JSON.stringify(
            cart
        )
    );


    updateCartCount();

}


// ========================================
// CART COUNT
// ========================================

function updateCartCount() {

    let cart = [];


    try {

        cart =
            JSON.parse(
                localStorage.getItem(
                    "cart"
                )
            ) || [];

    }

    catch (error) {

        cart = [];

    }


    if (
        !Array.isArray(cart)
    ) {

        cart = [];

    }


    const count =
        cart.reduce(
            function (
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


    const cartCount =
        document.getElementById(
            "cart-count"
        );


    if (cartCount) {

        cartCount.textContent =
            count;

    }

}


// ========================================
// MESSAGE
// ========================================

function showMessage(
    message
) {

    const element =
        document.getElementById(
            "product-message"
        );


    if (!element) {
        return;
    }


    element.textContent =
        message;


    element.classList.add(
        "show"
    );


    clearTimeout(
        window.productMessageTimer
    );


    window.productMessageTimer =
        setTimeout(
            function () {

                element.classList.remove(
                    "show"
                );

            },
            2500
        );

}


// ========================================
// FORMAT PRICE
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
// PRODUCT ERROR
// ========================================

function showProductError(
    container,
    message
) {

    container.innerHTML = `

        <div class="product-not-found">

            <h2>
                Không tìm thấy sản phẩm
            </h2>

            <p>
                ${escapeHTML(
                    message
                )}
            </p>

            <a
                href="index.html#products"
                class="btn">

                ← Quay lại sản phẩm

            </a>

        </div>

    `;

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
console.time("PRODUCT API");

fetch(API_URL)
    .then(response => response.json())
    .then(data => {

        console.timeEnd("PRODUCT API");

        // xử lý tiếp...

    });