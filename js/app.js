// ========================================
// CƯỜNG MOBILE
// APP.JS
// GOOGLE APPS SCRIPT API + UI
// ========================================

// ========================================
// START
// ========================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        console.log("================================");
        console.log("CƯỜNG MOBILE - APP.JS START");
        console.log("================================");

        // ================================
        // CORE
        // ================================

        initSearch();

        initCategoryFilter();

        initSort();

        updateCartCount();


        // ================================
        // NEW UI
        // ================================

        initMobileMenu();

        initClearSearch();

        initClearFilters();

        initResetProducts();

        initBackToTop();

        initSmoothScroll();


        // ================================
        // LOAD PRODUCTS
        // ================================

        loadProductsFromAPI();

    }
);


// ========================================
// LOAD PRODUCTS FROM API
// ========================================

async function loadProductsFromAPI() {

    const container =
        document.getElementById(
            "product-list"
        );


    if (!container) {

        console.error(
            "Không tìm thấy #product-list"
        );

        return;

    }


    container.innerHTML = `

        <div class="loading">

            <div class="loading-spinner"></div>

            <p>
                Đang tải sản phẩm...
            </p>

        </div>

    `;


    try {

        console.log(
            "Đang gọi Google Apps Script..."
        );


        const apiUrl =
            window.CUONG_MOBILE_API_URL +
            "?action=getProducts&t=" +
            Date.now();


        console.log(
            "API URL:",
            apiUrl
        );


        const response =
            await fetch(
                apiUrl,
                {
                    method: "GET",
                    cache: "no-store"
                }
            );


        console.log(
            "HTTP STATUS:",
            response.status
        );


        if (!response.ok) {

            throw new Error(
                "HTTP " +
                response.status
            );

        }


        const data =
            await response.json();


        console.log(
            "===== DỮ LIỆU API ====="
        );

        console.log(data);


        // ==================================
        // KIỂM TRA API
        // ==================================

        if (!data) {

            throw new Error(
                "API không trả về dữ liệu."
            );

        }


        if (
            data.success !== true
        ) {

            throw new Error(
                data.error ||
                "API trả về success=false."
            );

        }


        if (
            !Array.isArray(
                data.products
            )
        ) {

            throw new Error(
                "data.products không phải Array."
            );

        }


        console.log(
            "Số sản phẩm API:",
            data.products.length
        );


        console.table(
            data.products
        );


        // ==================================
        // NORMALIZE
        // ==================================

        productList =
            normalizeProducts(
                data.products
            );


        console.log(
            "Số sản phẩm sau normalize:",
            productList.length
        );


        console.table(
            productList
        );


        // ==================================
        // CATEGORY
        // ==================================

        createCategoryOptions(
            productList
        );


        // ==================================
        // RENDER
        // ==================================

        applyFilters();

    }

    catch (error) {

        console.error(
            "================================"
        );

        console.error(
            "LỖI LOAD PRODUCTS API"
        );

        console.error(error);

        console.error(
            "================================"
        );


        // ==================================
        // FALLBACK PRODUCTS.JS
        // ==================================

        if (
            typeof products !== "undefined" &&
            Array.isArray(products)
        ) {

            console.warn(
                "API lỗi → dùng products.js"
            );


            productList =
                normalizeProducts(
                    products
                );


            createCategoryOptions(
                productList
            );


            applyFilters();


            showToast(
                "Đang sử dụng dữ liệu sản phẩm dự phòng",
                "info"
            );


            return;

        }


        // ==================================
        // ERROR
        // ==================================

        container.innerHTML = `

            <div class="empty-products">

                <div class="no-products-icon">
                    ⚠️
                </div>

                <h3>
                    Không thể tải sản phẩm
                </h3>

                <p>
                    ${escapeHTML(
            error.message ||
            "Lỗi không xác định"
        )}
                </p>

                <button
                    type="button"
                    class="btn btn-primary"
                    onclick="loadProductsFromAPI()"
                >
                    Thử lại
                </button>

            </div>

        `;


        updateProductTotal(0);

    }

}


// ========================================
// DATA
// ========================================

let productList = [];


// ========================================
// NORMALIZE PRODUCTS
// ========================================

function normalizeProducts(
    list
) {

    if (
        !Array.isArray(list)
    ) {

        return [];

    }


    return list

        .map(
            function (product) {

                if (!product) {

                    return null;

                }


                // ==================================
                // ID
                // ==================================

                const id =
                    String(
                        product.id ??
                        product.ID ??
                        ""
                    ).trim();


                if (!id) {

                    return null;

                }


                // ==================================
                // VISIBLE
                // ==================================

                const visible =
                    normalizeVisible(
                        product.visible ??
                        product["Hiển thị"] ??
                        true
                    );


                // ==================================
                // PRICE
                // ==================================

                let price =
                    product.price ??
                    product["Giá"] ??
                    0;


                if (
                    typeof price === "string"
                ) {

                    price =
                        price.replace(
                            /[^\d.-]/g,
                            ""
                        );

                }


                // ==================================
                // STOCK
                // ==================================

                let stock =
                    product.stock ??
                    product["Tồn kho"] ??
                    0;


                if (
                    typeof stock === "string"
                ) {

                    stock =
                        stock.replace(
                            /[^\d.-]/g,
                            ""
                        );

                }


                // ==================================
                // PRODUCT
                // ==================================

                return {

                    id: id,

                    name:
                        String(
                            product.name ??
                            product["Tên sản phẩm"] ??
                            ""
                        ).trim(),

                    price:
                        Number(price) || 0,

                    category:
                        String(
                            product.category ??
                            product["Danh mục"] ??
                            ""
                        ).trim(),

                    stock:
                        Number(stock) || 0,

                    image:
                        String(
                            product.image ??
                            product["Hình ảnh"] ??
                            ""
                        ).trim(),

                    description:
                        String(
                            product.description ??
                            product["Mô tả"] ??
                            ""
                        ).trim(),

                    visible:
                        visible

                };

            }
        )

        .filter(
            function (product) {

                if (!product) {

                    return false;

                }


                return (
                    product.visible === true
                );

            }
        );

}


// ========================================
// NORMALIZE VISIBLE
// ========================================

function normalizeVisible(
    value
) {

    if (
        value === true
    ) {

        return true;

    }


    if (
        value === false
    ) {

        return false;

    }


    if (
        value === 0
    ) {

        return false;

    }


    if (
        value === 1
    ) {

        return true;

    }


    const text =
        String(
            value ?? ""
        )
            .trim()
            .toLowerCase();


    if (
        text === "false" ||
        text === "0" ||
        text === "no" ||
        text === "không" ||
        text === "off"
    ) {

        return false;

    }


    return true;

}


// ========================================
// RENDER
// ========================================

function renderProducts(
    list
) {

    const container =
        document.getElementById(
            "product-list"
        );


    const noProducts =
        document.getElementById(
            "no-products"
        );


    if (!container) {

        console.error(
            "Không tìm thấy #product-list"
        );

        return;

    }


    container.innerHTML = "";


    // ==================================
    // NO RESULT
    // ==================================

    if (
        !Array.isArray(list) ||
        list.length === 0
    ) {

        container.innerHTML = "";


        if (noProducts) {

            noProducts.hidden = false;

        }


        updateProductTotal(0);

        return;

    }


    // ==================================
    // HIDE NO RESULT
    // ==================================

    if (noProducts) {

        noProducts.hidden = true;

    }


    // ==================================
    // RENDER
    // ==================================

    list.forEach(
        function (product) {

            container.appendChild(
                createProductCard(
                    product
                )
            );

        }
    );


    updateProductTotal(
        list.length
    );

}


// ========================================
// PRODUCT CARD
// ========================================
// CLICK CARD → PRODUCT DETAIL
// ========================================

function createProductCard(
    product
) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "product-card";


    const id =
        String(
            product.id
        );


    const name =
        product.name ||
        "Sản phẩm";


    const category =
        product.category ||
        "Sản phẩm";


    const price =
        Number(
            product.price || 0
        );


    const stock =
        Number(
            product.stock || 0
        );


    const image =
        product.image ||
        "";


    // ==================================
    // CLICKABLE
    // ==================================

    card.setAttribute(
        "role",
        "link"
    );


    card.setAttribute(
        "tabindex",
        "0"
    );


    card.setAttribute(
        "aria-label",
        `Xem chi tiết ${name}`
    );


    card.style.cursor =
        "pointer";


    // ==================================
    // IMAGE
    // ==================================

    let imageHTML;


    if (image) {

        imageHTML = `

            <img
                src="${escapeHTML(image)}"
                alt="${escapeHTML(name)}"
                loading="lazy"
                onerror="
                    this.style.display='none';
                    this.parentElement.classList.add('image-error');
                "
            >

        `;

    }

    else {

        imageHTML = `

            <div class="image-placeholder">

                📱

                <span>
                    Không có hình ảnh
                </span>

            </div>

        `;

    }


    // ==================================
    // STOCK
    // ==================================

    const stockText =
        stock > 0
            ? `Còn ${stock} sản phẩm`
            : "Hết hàng";


    const stockClass =
        stock > 0
            ? "in-stock"
            : "out-of-stock";


    // ==================================
    // CARD
    // ==================================

    card.innerHTML = `

        <div class="product-image">

            ${imageHTML}

            <div class="product-badge">

                ${stock <= 0
            ? "Hết hàng"
            : "Có sẵn"
        }

            </div>

        </div>


        <div class="product-info">

            <div class="product-category">

                ${escapeHTML(category)}

            </div>


            <h3 class="product-name">

                ${escapeHTML(name)}

            </h3>


            <div class="product-price">

                ${formatPrice(price)}

            </div>


            <div
                class="product-stock ${stockClass}"
            >

                ${stockText}

            </div>


            <div class="product-actions">

                <button
                    type="button"
                    class="add-cart-btn"
                    data-product-id="${escapeHTML(id)}"
                    ${stock <= 0
            ? "disabled"
            : ""
        }
                >
                    🛒 Thêm giỏ
                </button>

            </div>

        </div>

    `;


    // ==================================
    // ADD CART BUTTON
    // ==================================

    const addButton =
        card.querySelector(
            ".add-cart-btn"
        );


    if (addButton) {

        addButton.addEventListener(
            "click",
            function (event) {

                // Không cho click lan lên card
                event.preventDefault();

                event.stopPropagation();


                if (stock <= 0) {

                    showToast(
                        "Sản phẩm đã hết hàng",
                        "error"
                    );

                    return;

                }


                addToCart(
                    product
                );

            }
        );

    }


    // ==================================
    // CARD CLICK
    // ==================================

    card.addEventListener(
        "click",
        function (event) {

            // Nếu click vào button
            // thì không chuyển trang
            if (
                event.target.closest(
                    ".add-cart-btn"
                )
            ) {

                return;

            }


            window.location.href =
                "product.html?id=" +
                encodeURIComponent(id);

        }
    );


    // ==================================
    // KEYBOARD
    // ==================================

    card.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Enter" ||
                event.key === " "
            ) {

                event.preventDefault();


                window.location.href =
                    "product.html?id=" +
                    encodeURIComponent(id);

            }

        }
    );


    return card;

}


// ========================================
// ADD TO CART
// ========================================

function addToCart(
    product
) {

    if (!product) {

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


    if (!Array.isArray(cart)) {

        cart = [];

    }


    const existingIndex =
        cart.findIndex(
            function (item) {

                return String(
                    item.id
                ) ===
                    String(
                        product.id
                    );

            }
        );


    if (
        existingIndex !== -1
    ) {

        const currentQuantity =
            Number(
                cart[existingIndex].quantity
            ) || 1;


        const stock =
            Number(
                product.stock
            ) || 0;


        if (
            stock > 0 &&
            currentQuantity >= stock
        ) {

            showToast(
                "Đã đạt số lượng tồn kho",
                "warning"
            );

            return;

        }


        cart[
            existingIndex
        ].quantity =
            currentQuantity + 1;

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
                ) || 0,

            image:
                product.image || "",

            quantity:
                1

        });

    }


    try {

        localStorage.setItem(
            "cart",
            JSON.stringify(cart)
        );

    }

    catch (error) {

        console.error(
            "Không thể lưu giỏ hàng:",
            error
        );


        showToast(
            "Không thể lưu giỏ hàng",
            "error"
        );


        return;

    }


    updateCartCount();


    showToast(
        `${product.name} đã được thêm vào giỏ`,
        "success"
    );

}


// ========================================
// SEARCH
// ========================================

function initSearch() {

    const search =
        document.getElementById(
            "search-input"
        );


    if (!search) {

        return;

    }


    search.addEventListener(
        "input",
        function () {

            applyFilters();

            updateSearchClearButton();

        }
    );

}


// ========================================
// CLEAR SEARCH
// ========================================

function initClearSearch() {

    const button =
        document.getElementById(
            "clear-search"
        );


    const search =
        document.getElementById(
            "search-input"
        );


    if (
        !button ||
        !search
    ) {

        return;

    }


    updateSearchClearButton();


    button.addEventListener(
        "click",
        function () {

            search.value = "";

            applyFilters();

            updateSearchClearButton();

            search.focus();

        }
    );

}


// ========================================
// UPDATE CLEAR SEARCH
// ========================================

function updateSearchClearButton() {

    const search =
        document.getElementById(
            "search-input"
        );


    const button =
        document.getElementById(
            "clear-search"
        );


    if (
        !search ||
        !button
    ) {

        return;

    }


    button.hidden =
        !search.value.trim();

}


// ========================================
// CATEGORY
// ========================================

function initCategoryFilter() {

    const select =
        document.getElementById(
            "category-filter"
        );


    if (!select) {

        return;

    }


    select.addEventListener(
        "change",
        applyFilters
    );

}


// ========================================
// CATEGORY OPTIONS
// ========================================

function createCategoryOptions(
    list
) {

    const select =
        document.getElementById(
            "category-filter"
        );


    if (!select) {

        return;

    }


    const currentValue =
        select.value;


    const categories =
        new Set();


    list.forEach(
        function (product) {

            if (
                product.category
            ) {

                categories.add(
                    String(
                        product.category
                    ).trim()
                );

            }

        }
    );


    select.innerHTML = `

        <option value="">
            Tất cả sản phẩm
        </option>

    `;


    Array.from(
        categories
    )
        .sort(
            function (a, b) {

                return a.localeCompare(
                    b,
                    "vi"
                );

            }
        )
        .forEach(
            function (category) {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    category;


                option.textContent =
                    category;


                select.appendChild(
                    option
                );

            }
        );


    // Khôi phục lựa chọn

    if (
        currentValue &&
        categories.has(
            currentValue
        )
    ) {

        select.value =
            currentValue;

    }

}


// ========================================
// SORT
// ========================================

function initSort() {

    const sort =
        document.getElementById(
            "sort-filter"
        ) ||
        document.getElementById(
            "sort"
        );


    if (!sort) {

        return;

    }


    sort.addEventListener(
        "change",
        applyFilters
    );

}


// ========================================
// FILTER
// ========================================

function applyFilters() {

    const search =
        document.getElementById(
            "search-input"
        );


    const category =
        document.getElementById(
            "category-filter"
        );


    const sort =
        document.getElementById(
            "sort-filter"
        ) ||
        document.getElementById(
            "sort"
        );


    const keyword =
        search
            ? String(
                search.value || ""
            )
                .trim()
                .toLowerCase()
            : "";


    const selectedCategory =
        category
            ? String(
                category.value || ""
            ).trim()
            : "";


    const sortValue =
        sort
            ? sort.value
            : "";


    let result =
        productList.filter(
            function (product) {

                const name =
                    String(
                        product.name || ""
                    )
                        .toLowerCase();


                const cat =
                    String(
                        product.category || ""
                    )
                        .toLowerCase();


                const desc =
                    String(
                        product.description || ""
                    )
                        .toLowerCase();


                // ==========================
                // SEARCH
                // ==========================

                if (
                    keyword &&
                    !name.includes(keyword) &&
                    !cat.includes(keyword) &&
                    !desc.includes(keyword)
                ) {

                    return false;

                }


                // ==========================
                // CATEGORY
                // ==========================

                if (
                    selectedCategory &&
                    String(
                        product.category || ""
                    ) !==
                    selectedCategory
                ) {

                    return false;

                }


                return true;

            }
        );


    // ==================================
    // SORT
    // ==================================

    if (
        sortValue === "price-asc"
    ) {

        result.sort(
            function (a, b) {

                return (
                    Number(a.price || 0) -
                    Number(b.price || 0)
                );

            }
        );

    }


    else if (
        sortValue === "price-desc"
    ) {

        result.sort(
            function (a, b) {

                return (
                    Number(b.price || 0) -
                    Number(a.price || 0)
                );

            }
        );

    }


    else if (
        sortValue === "name-asc"
    ) {

        result.sort(
            function (a, b) {

                return String(
                    a.name || ""
                )
                    .localeCompare(
                        String(
                            b.name || ""
                        ),
                        "vi"
                    );

            }
        );

    }


    // ==================================
    // RENDER
    // ==================================

    renderProducts(
        result
    );


    // ==================================
    // ACTIVE FILTERS
    // ==================================

    updateActiveFilters(
        keyword,
        selectedCategory,
        sortValue
    );

}


// ========================================
// ACTIVE FILTERS
// ========================================

function updateActiveFilters(
    keyword,
    category,
    sortValue
) {

    const wrapper =
        document.getElementById(
            "active-filters"
        );


    const tags =
        document.getElementById(
            "filter-tags"
        );


    if (
        !wrapper ||
        !tags
    ) {

        return;

    }


    tags.innerHTML = "";


    let hasFilter = false;


    // SEARCH

    if (keyword) {

        hasFilter = true;


        const tag =
            document.createElement(
                "span"
            );


        tag.className =
            "filter-tag";


        tag.innerHTML =
            `Tìm: ${escapeHTML(keyword)}`;


        tags.appendChild(tag);

    }


    // CATEGORY

    if (category) {

        hasFilter = true;


        const tag =
            document.createElement(
                "span"
            );


        tag.className =
            "filter-tag";


        tag.innerHTML =
            `Danh mục: ${escapeHTML(category)}`;


        tags.appendChild(tag);

    }


    // SORT

    if (sortValue) {

        hasFilter = true;


        const sortNames = {

            "price-asc":
                "Giá thấp → cao",

            "price-desc":
                "Giá cao → thấp",

            "name-asc":
                "Tên A → Z"

        };


        const tag =
            document.createElement(
                "span"
            );


        tag.className =
            "filter-tag";


        tag.textContent =
            sortNames[
            sortValue
            ] ||
            sortValue;


        tags.appendChild(tag);

    }


    wrapper.hidden =
        !hasFilter;

}


// ========================================
// CLEAR FILTERS
// ========================================

function initClearFilters() {

    const button =
        document.getElementById(
            "clear-filters"
        );


    if (!button) {

        return;

    }


    button.addEventListener(
        "click",
        clearAllFilters
    );

}


// ========================================
// CLEAR ALL FILTERS
// ========================================

function clearAllFilters() {

    const search =
        document.getElementById(
            "search-input"
        );


    const category =
        document.getElementById(
            "category-filter"
        );


    const sort =
        document.getElementById(
            "sort-filter"
        ) ||
        document.getElementById(
            "sort"
        );


    if (search) {

        search.value = "";

    }


    if (category) {

        category.value = "";

    }


    if (sort) {

        sort.value = "";

    }


    updateSearchClearButton();


    applyFilters();

}


// ========================================
// RESET PRODUCTS
// ========================================

function initResetProducts() {

    const button =
        document.getElementById(
            "reset-products"
        );


    if (!button) {

        return;

    }


    button.addEventListener(
        "click",
        function () {

            clearAllFilters();

        }
    );

}


// ========================================
// PRODUCT TOTAL
// ========================================

function updateProductTotal(
    count
) {

    const element =
        document.getElementById(
            "product-total"
        );


    if (!element) {

        return;

    }


    const total =
        Number(count) || 0;


    element.textContent =
        `${total} sản phẩm`;

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

                return (
                    total +
                    (
                        Number(
                            item.quantity
                        ) || 0
                    )
                );

            },
            0
        );


    document
        .querySelectorAll(
            "#cart-count, .cart-count"
        )
        .forEach(
            function (element) {

                element.textContent =
                    count;


                if (count > 0) {

                    element.classList.add(
                        "has-items"
                    );

                }

                else {

                    element.classList.remove(
                        "has-items"
                    );

                }

            }
        );

}


// ========================================
// STORAGE EVENT
// ========================================

window.addEventListener(
    "storage",
    function (event) {

        if (
            event.key === "cart"
        ) {

            updateCartCount();

        }

    }
);


// ========================================
// MOBILE MENU
// ========================================

function initMobileMenu() {

    const toggle =
        document.getElementById(
            "menu-toggle"
        );


    const nav =
        document.getElementById(
            "main-nav"
        );


    if (
        !toggle ||
        !nav
    ) {

        return;

    }


    toggle.addEventListener(
        "click",
        function () {

            const isOpen =
                nav.classList.toggle(
                    "open"
                );


            toggle.classList.toggle(
                "active",
                isOpen
            );


            toggle.setAttribute(
                "aria-expanded",
                String(isOpen)
            );

        }
    );


    nav.querySelectorAll(
        "a"
    ).forEach(
        function (link) {

            link.addEventListener(
                "click",
                function () {

                    nav.classList.remove(
                        "open"
                    );


                    toggle.classList.remove(
                        "active"
                    );


                    toggle.setAttribute(
                        "aria-expanded",
                        "false"
                    );

                }
            );

        }
    );


    document.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Escape"
            ) {

                nav.classList.remove(
                    "open"
                );


                toggle.classList.remove(
                    "active"
                );


                toggle.setAttribute(
                    "aria-expanded",
                    "false"
                );

            }

        }
    );

}


// ========================================
// BACK TO TOP
// ========================================

function initBackToTop() {

    const button =
        document.getElementById(
            "back-to-top"
        );


    if (!button) {

        return;

    }


    function updateButton() {

        if (
            window.scrollY > 400
        ) {

            button.classList.add(
                "show"
            );

        }

        else {

            button.classList.remove(
                "show"
            );

        }

    }


    window.addEventListener(
        "scroll",
        updateButton,
        {
            passive: true
        }
    );


    button.addEventListener(
        "click",
        function () {

            window.scrollTo({

                top: 0,

                behavior: "smooth"

            });

        }
    );


    updateButton();

}


// ========================================
// SMOOTH SCROLL
// ========================================

function initSmoothScroll() {

    document.querySelectorAll(
        'a[href^="#"]'
    )
        .forEach(
            function (link) {

                link.addEventListener(
                    "click",
                    function (event) {

                        const targetId =
                            link.getAttribute(
                                "href"
                            );


                        if (
                            !targetId ||
                            targetId === "#"
                        ) {

                            return;

                        }


                        const target =
                            document.querySelector(
                                targetId
                            );


                        if (!target) {

                            return;

                        }


                        event.preventDefault();


                        target.scrollIntoView({

                            behavior:
                                "smooth",

                            block:
                                "start"

                        });

                    }
                );

            }
        );

}


// ========================================
// TOAST
// ========================================

function showToast(
    message,
    type = "success"
) {

    const toast =
        document.getElementById(
            "toast"
        );


    const toastMessage =
        document.getElementById(
            "toast-message"
        );


    const toastIcon =
        document.getElementById(
            "toast-icon"
        );


    if (
        !toast ||
        !toastMessage
    ) {

        return;

    }


    const icons = {

        success: "✓",

        error: "✕",

        warning: "⚠",

        info: "ℹ"

    };


    toastMessage.textContent =
        message;


    if (toastIcon) {

        toastIcon.textContent =
            icons[type] ||
            icons.success;

    }


    toast.classList.remove(
        "success",
        "error",
        "warning",
        "info",
        "show"
    );


    toast.classList.add(
        type
    );


    void toast.offsetWidth;


    toast.classList.add(
        "show"
    );


    clearTimeout(
        window.__toastTimer
    );


    window.__toastTimer =
        setTimeout(
            function () {

                toast.classList.remove(
                    "show"
                );

            },
            3000
        );

}


// ========================================
// PRICE
// ========================================

function formatPrice(
    value
) {

    const number =
        Number(value) || 0;


    return (
        number.toLocaleString(
            "vi-VN"
        ) +
        " ₫"
    );

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