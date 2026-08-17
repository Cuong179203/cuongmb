"use strict";

(function () {



    const API_URL =
        "https://script.google.com/macros/s/AKfycbxxQRkcRL5BrTEdH28baGNOIyYa-I2vKiYkbQ_ChiMICpqRLSayBpaCM_N44Kn8jtV3/exec";

    const TOKEN_KEY =
        "CM_ADMIN_TOKEN";


    // ============================================================
    // STATE
    // ============================================================

    let products = [];

    let editingProductId = null;

    let isSaving = false;

    let isDeleting = false;


    // ============================================================
    // LOG
    // ============================================================

    function log() {

        try {

            console.log.apply(
                console,
                arguments
            );

        }

        catch (error) {

            // Ignore console errors

        }

    }


    // ============================================================
    // GET ADMIN TOKEN
    // ============================================================

    function getAdminToken() {

        try {

            return String(
                sessionStorage.getItem(
                    TOKEN_KEY
                ) || ""
            ).trim();

        }

        catch (error) {

            console.error(
                "Không thể đọc Admin Token:",
                error
            );

            return "";

        }

    }


    // ============================================================
    // CLEAR TOKEN
    // ============================================================

    function clearAdminToken() {

        try {

            sessionStorage.removeItem(
                TOKEN_KEY
            );

        }

        catch (error) {

            console.error(
                "Không thể xóa Admin Token:",
                error
            );

        }

    }


    // ============================================================
    // REDIRECT LOGIN
    // ============================================================

    function redirectToAdminLogin() {

        clearAdminToken();

        alert(
            "Phiên đăng nhập admin đã hết hạn.\n\nVui lòng đăng nhập lại."
        );

        window.location.href =
            "admin.html";

    }


    // ============================================================
    // REQUIRE TOKEN
    // ============================================================

    function requireAdminToken() {

        const token =
            getAdminToken();

        if (!token) {

            redirectToAdminLogin();

            return null;

        }

        return token;

    }


    // ============================================================
    // PARSE API RESPONSE
    // ============================================================

    async function parseApiResponse(
        response,
        action
    ) {

        if (!response) {

            throw new Error(
                "Không nhận được phản hồi từ API."
            );

        }


        if (!response.ok) {

            throw new Error(
                "HTTP " +
                response.status +
                " - " +
                response.statusText
            );

        }


        const text =
            await response.text();


        log(
            "API RESPONSE:",
            action || "",
            text
        );


        if (!text || !text.trim()) {

            throw new Error(
                "API trả về dữ liệu rỗng."
            );

        }


        let data;


        try {

            data =
                JSON.parse(
                    text
                );

        }

        catch (error) {

            console.error(
                "JSON PARSE ERROR:",
                error
            );


            console.error(
                "RAW API RESPONSE:",
                text
            );


            throw new Error(
                "API không trả về JSON hợp lệ."
            );

        }


        return data;

    }


    // ============================================================
    // CHECK ADMIN ERROR
    // ============================================================

    function isAdminPermissionError(
        data
    ) {

        if (
            !data ||
            data.success !== false
        ) {

            return false;

        }


        const errorText =
            String(
                data.error ||
                data.message ||
                ""
            )
                .trim()
                .toLowerCase();


        return (

            errorText.includes(
                "quyền truy cập admin"
            )

            ||

            errorText.includes(
                "không có quyền"
            )

            ||

            errorText.includes(
                "admin token"
            )

            ||

            errorText.includes(
                "token không hợp lệ"
            )

            ||

            errorText.includes(
                "token khong hop le"
            )

            ||

            errorText.includes(
                "unauthorized"
            )

            ||

            errorText.includes(
                "forbidden"
            )

        );

    }


    // ============================================================
    // POST ADMIN API
    // ============================================================

    async function apiPostAdmin(
        action,
        body
    ) {

        const token =
            requireAdminToken();


        if (!token) {

            throw new Error(
                "Chưa đăng nhập admin."
            );

        }


        const payload = {

            ...(body || {}),

            action:
                action,

            adminToken:
                token

        };


        log(
            "API POST:",
            action
        );


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
                            payload
                        )

                }
            );


        const data =
            await parseApiResponse(
                response,
                action
            );


        if (
            isAdminPermissionError(
                data
            )
        ) {

            redirectToAdminLogin();

            throw new Error(
                "Không có quyền truy cập admin."
            );

        }


        return data;

    }


    // ============================================================
    // DOM READY
    // ============================================================

    function init() {

        log(
            "admin-products.js loaded"
        );


        const token =
            getAdminToken();


        if (!token) {

            console.warn(
                "Không tìm thấy CM_ADMIN_TOKEN."
            );


            window.location.href =
                "admin.html";

            return;

        }


        // ========================================================
        // SEARCH
        // ========================================================

        const search =
            document.getElementById(
                "searchProduct"
            );


        if (search) {

            search.addEventListener(
                "input",
                renderProducts
            );

        }


        // ========================================================
        // CATEGORY
        // ========================================================

        const category =
            document.getElementById(
                "categoryFilter"
            );


        if (category) {

            category.addEventListener(
                "change",
                renderProducts
            );

        }


        // ========================================================
        // FORM
        // ========================================================

        const form =
            document.getElementById(
                "productForm"
            );


        if (form) {

            form.addEventListener(
                "submit",
                saveProduct
            );

        }


        // ========================================================
        // IMAGE PREVIEW
        // ========================================================

        setupImagePreview();


        // ========================================================
        // LOAD PRODUCTS
        // ========================================================

        loadProducts();

    }


    // ============================================================
    // LOAD PRODUCTS
    // ============================================================

    async function loadProducts() {

        showLoading(
            true
        );


        try {

            const response =
                await fetch(
                    API_URL +
                    "?action=getProducts&t=" +
                    Date.now(),
                    {

                        method:
                            "GET",

                        cache:
                            "no-store"

                    }
                );


            const data =
                await parseApiResponse(
                    response,
                    "getProducts"
                );


            if (
                isAdminPermissionError(
                    data
                )
            ) {

                redirectToAdminLogin();

                return;

            }


            if (
                !data ||
                data.success !== true
            ) {

                throw new Error(
                    data &&
                    (
                        data.error ||
                        data.message
                    )
                        ? (
                            data.error ||
                            data.message
                        )
                        : "Không thể tải sản phẩm."
                );

            }


            if (
                Array.isArray(
                    data.products
                )
            ) {

                products =
                    data.products.map(
                        normalizeProduct
                    );

            }

            else {

                products = [];

            }


            log(
                "Tổng sản phẩm:",
                products.length
            );


            createCategoryFilter();

            renderProducts();

        }

        catch (error) {

            console.error(
                "LOAD ERROR:",
                error
            );


            showError(
                "Lỗi tải sản phẩm: " +
                error.message
            );

        }

        finally {

            showLoading(
                false
            );

        }

    }


    // ============================================================
    // NORMALIZE PRODUCT
    // ============================================================

    function normalizeProduct(
        product
    ) {

        product =
            product || {};


        const price =
            toNumber(
                firstDefined(
                    product["Giá"],
                    product.price,
                    0
                )
            );


        const originalPrice =
            toNumber(
                firstDefined(
                    product["Giá gốc"],
                    product.originalPrice,
                    product.original_price,
                    0
                )
            );


        const stock =
            toNumber(
                firstDefined(
                    product["Tồn kho"],
                    product.stock,
                    0
                )
            );


        return {

            id:
                String(
                    firstDefined(
                        product["ID"],
                        product.id,
                        ""
                    )
                ).trim(),


            name:
                String(
                    firstDefined(
                        product["Tên sản phẩm"],
                        product.name,
                        ""
                    )
                ).trim(),


            price:
                price,


            originalPrice:
                originalPrice,


            category:
                String(
                    firstDefined(
                        product["Danh mục"],
                        product.category,
                        ""
                    )
                ).trim(),


            stock:
                stock,


            image:
                String(
                    firstDefined(
                        product["Hình ảnh"],
                        product.image,
                        ""
                    )
                ).trim(),


            images:
                normalizeImages(
                    firstDefined(
                        product["Hình ảnh phụ"],
                        product["Ảnh phụ"],
                        product.images,
                        product.subImages,
                        product.sub_images,
                        ""
                    )
                ),


            specifications:
                normalizeText(
                    firstDefined(
                        product["Thông số kỹ thuật"],
                        product.specifications,
                        product.specs,
                        ""
                    )
                ),


            promotion:
                normalizeText(
                    firstDefined(
                        product["Ưu đãi"],
                        product.promotion,
                        product.promotions,
                        ""
                    )
                ),


            description:
                String(
                    firstDefined(
                        product["Mô tả"],
                        product.description,
                        ""
                    )
                ).trim(),


            visible:
                firstDefined(
                    product["Hiển thị"],
                    product.visible,
                    true
                )

        };

    }


    // ============================================================
    // FIRST DEFINED
    // ============================================================

    function firstDefined() {

        const args =
            Array.from(
                arguments
            );


        for (
            let i = 0;
            i < args.length;
            i++
        ) {

            if (
                args[i] !== undefined &&
                args[i] !== null
            ) {

                return args[i];

            }

        }


        return "";

    }


    // ============================================================
    // NUMBER
    // ============================================================

    function toNumber(
        value
    ) {

        if (
            typeof value ===
            "number"
        ) {

            return Number.isFinite(
                value
            )
                ? value
                : 0;

        }


        let text =
            String(
                value ?? ""
            )
                .trim();


        if (!text) {

            return 0;

        }


        // Xóa ký hiệu tiền
        text =
            text
                .replace(
                    /₫/g,
                    ""
                )
                .replace(
                    /đ/gi,
                    ""
                )
                .trim();


        // Trường hợp dạng 12.000.000
        if (
            /^\d{1,3}(\.\d{3})+$/.test(
                text
            )
        ) {

            text =
                text.replace(
                    /\./g,
                    ""
                );

        }

        // Trường hợp dạng 12,000,000
        else if (
            /^\d{1,3}(,\d{3})+$/.test(
                text
            )
        ) {

            text =
                text.replace(
                    /,/g,
                    ""
                );

        }


        const number =
            Number(
                text
            );


        return Number.isFinite(
            number
        )
            ? number
            : 0;

    }


    // ============================================================
    // NORMALIZE IMAGES
    // ============================================================

    function normalizeImages(
        value
    ) {

        if (
            Array.isArray(
                value
            )
        ) {

            return value
                .map(
                    function (item) {

                        return String(
                            item ?? ""
                        ).trim();

                    }
                )
                .filter(Boolean);

        }


        const text =
            String(
                value ?? ""
            ).trim();


        if (!text) {

            return [];

        }


        // ========================================================
        // JSON ARRAY
        // ========================================================

        try {

            const parsed =
                JSON.parse(
                    text
                );


            if (
                Array.isArray(
                    parsed
                )
            ) {

                return parsed
                    .map(
                        function (item) {

                            return String(
                                item ?? ""
                            ).trim();

                        }
                    )
                    .filter(Boolean);

            }

        }

        catch (error) {

            // Tiếp tục xử lý text

        }


        // ========================================================
        // NEW LINE
        // ========================================================

        if (
            text.includes(
                "\n"
            )
        ) {

            return text
                .split(/\r?\n/)
                .map(
                    function (item) {

                        return item.trim();

                    }
                )
                .filter(Boolean);

        }


        // ========================================================
        // COMMA
        // ========================================================

        if (
            text.includes(",")
        ) {

            return text
                .split(",")
                .map(
                    function (item) {

                        return item.trim();

                    }
                )
                .filter(Boolean);

        }


        return [text];

    }


    // ============================================================
    // NORMALIZE TEXT
    // ============================================================

    function normalizeText(
        value
    ) {

        if (
            Array.isArray(
                value
            )
        ) {

            return value
                .map(
                    function (item) {

                        return String(
                            item ?? ""
                        ).trim();

                    }
                )
                .filter(Boolean)
                .join("\n");

        }


        return String(
            value ?? ""
        ).trim();

    }


    // ============================================================
    // CATEGORY FILTER
    // ============================================================

    function createCategoryFilter() {

        const select =
            document.getElementById(
                "categoryFilter"
            );


        if (!select) {

            return;

        }


        const oldValue =
            select.value;


        const categories =
            [];


        products.forEach(
            function (product) {

                const category =
                    String(
                        product.category ||
                        ""
                    ).trim();


                if (
                    category &&
                    !categories.includes(
                        category
                    )
                ) {

                    categories.push(
                        category
                    );

                }

            }
        );


        categories.sort(
            function (a, b) {

                return a.localeCompare(
                    b,
                    "vi"
                );

            }
        );


        select.innerHTML =
            "";


        const allOption =
            document.createElement(
                "option"
            );


        allOption.value =
            "";


        allOption.textContent =
            "Tất cả danh mục";


        select.appendChild(
            allOption
        );


        categories.forEach(
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


        if (
            categories.includes(
                oldValue
            )
        ) {

            select.value =
                oldValue;

        }

        else {

            select.value =
                "";

        }

    }


    // ============================================================
    // RENDER PRODUCTS
    // ============================================================

    function renderProducts() {

        const body =
            document.getElementById(
                "productBody"
            );


        const table =
            document.getElementById(
                "productTable"
            );


        const empty =
            document.getElementById(
                "empty"
            );


        if (!body) {

            console.warn(
                "Không tìm thấy #productBody"
            );

            return;

        }


        const searchElement =
            document.getElementById(
                "searchProduct"
            );


        const categoryElement =
            document.getElementById(
                "categoryFilter"
            );


        const search =
            searchElement
                ? String(
                    searchElement.value ||
                    ""
                )
                    .trim()
                    .toLowerCase()
                : "";


        const category =
            categoryElement
                ? categoryElement.value
                : "";


        const filtered =
            products.filter(
                function (product) {

                    const id =
                        String(
                            product.id ||
                            ""
                        )
                            .toLowerCase();


                    const name =
                        String(
                            product.name ||
                            ""
                        )
                            .toLowerCase();


                    const productCategory =
                        String(
                            product.category ||
                            ""
                        );


                    const matchSearch =

                        !search ||

                        id.includes(
                            search
                        ) ||

                        name.includes(
                            search
                        );


                    const matchCategory =

                        !category ||

                        productCategory ===
                        category;


                    return (
                        matchSearch &&
                        matchCategory
                    );

                }
            );


        body.innerHTML =
            "";


        if (
            filtered.length === 0
        ) {

            if (table) {

                table.style.display =
                    "none";

            }


            if (empty) {

                empty.style.display =
                    "block";


                empty.textContent =
                    products.length === 0
                        ? "Chưa có sản phẩm."
                        : "Không có sản phẩm phù hợp.";

            }


            return;

        }


        if (table) {

            table.style.display =
                "table";

        }


        if (empty) {

            empty.style.display =
                "none";

        }


        filtered.forEach(
            function (product) {

                const row =
                    document.createElement(
                        "tr"
                    );


                // =================================================
                // IMAGE
                // =================================================

                const imageCell =
                    document.createElement(
                        "td"
                    );


                imageCell.className =
                    "product-image-cell";


                if (
                    product.image
                ) {

                    const img =
                        document.createElement(
                            "img"
                        );


                    img.src =
                        product.image;


                    img.alt =
                        product.name ||
                        "Sản phẩm";


                    img.loading =
                        "lazy";


                    img.onerror =
                        function () {

                            this.onerror =
                                null;


                            this.style.display =
                                "none";


                            if (
                                !imageCell.querySelector(
                                    ".image-fallback"
                                )
                            ) {

                                const fallback =
                                    document.createElement(
                                        "span"
                                    );


                                fallback.className =
                                    "image-fallback";


                                fallback.textContent =
                                    "Không ảnh";


                                imageCell.appendChild(
                                    fallback
                                );

                            }

                        };


                    imageCell.appendChild(
                        img
                    );

                }

                else {

                    imageCell.textContent =
                        "Không ảnh";

                }


                row.appendChild(
                    imageCell
                );


                // =================================================
                // ID
                // =================================================

                const idCell =
                    document.createElement(
                        "td"
                    );


                const strong =
                    document.createElement(
                        "strong"
                    );


                strong.textContent =
                    product.id ||
                    "—";


                idCell.appendChild(
                    strong
                );


                row.appendChild(
                    idCell
                );


                // =================================================
                // NAME
                // =================================================

                const nameCell =
                    document.createElement(
                        "td"
                    );


                nameCell.className =
                    "product-name";


                nameCell.textContent =
                    product.name ||
                    "Chưa có tên";


                row.appendChild(
                    nameCell
                );


                // =================================================
                // CATEGORY
                // =================================================

                const categoryCell =
                    document.createElement(
                        "td"
                    );


                categoryCell.textContent =
                    product.category ||
                    "Chưa phân loại";


                row.appendChild(
                    categoryCell
                );


                // =================================================
                // PRICE
                // =================================================

                const priceCell =
                    document.createElement(
                        "td"
                    );


                priceCell.className =
                    "product-price";


                priceCell.textContent =
                    formatMoney(
                        product.price
                    );


                row.appendChild(
                    priceCell
                );


                // =================================================
                // ORIGINAL PRICE
                // =================================================

                const originalPriceCell =
                    document.createElement(
                        "td"
                    );


                if (
                    product.originalPrice >
                    0
                ) {

                    originalPriceCell.className =
                        "product-original-price";


                    originalPriceCell.textContent =
                        formatMoney(
                            product.originalPrice
                        );

                }

                else {

                    originalPriceCell.textContent =
                        "—";

                }


                row.appendChild(
                    originalPriceCell
                );


                // =================================================
                // PROMOTION
                // =================================================

                const promotionCell =
                    document.createElement(
                        "td"
                    );


                const promotions =
                    getLines(
                        product.promotion
                    );


                if (
                    promotions.length > 0
                ) {

                    const badge =
                        document.createElement(
                            "span"
                        );


                    badge.className =
                        "promo-badge";


                    badge.textContent =
                        promotions.length +
                        " ưu đãi";


                    promotionCell.appendChild(
                        badge
                    );

                }

                else {

                    promotionCell.textContent =
                        "—";

                }


                row.appendChild(
                    promotionCell
                );


                // =================================================
                // STOCK
                // =================================================

                const stockCell =
                    document.createElement(
                        "td"
                    );


                if (
                    product.stock > 0
                ) {

                    stockCell.className =
                        "stock-ok";


                    stockCell.textContent =
                        formatNumber(
                            product.stock
                        ) +
                        " sản phẩm";

                }

                else {

                    stockCell.className =
                        "stock-out";


                    stockCell.textContent =
                        "Hết hàng";

                }


                row.appendChild(
                    stockCell
                );


                // =================================================
                // VISIBLE
                // =================================================

                const visibleCell =
                    document.createElement(
                        "td"
                    );


                const visibleBadge =
                    document.createElement(
                        "span"
                    );


                if (
                    isVisible(
                        product.visible
                    )
                ) {

                    visibleBadge.className =
                        "status-visible";


                    visibleBadge.textContent =
                        "Đang hiển thị";

                }

                else {

                    visibleBadge.className =
                        "status-hidden";


                    visibleBadge.textContent =
                        "Đang ẩn";

                }


                visibleCell.appendChild(
                    visibleBadge
                );


                row.appendChild(
                    visibleCell
                );


                // =================================================
                // ACTION
                // =================================================

                const actionCell =
                    document.createElement(
                        "td"
                    );


                actionCell.className =
                    "product-actions";


                // EDIT

                const editButton =
                    document.createElement(
                        "button"
                    );


                editButton.type =
                    "button";


                editButton.className =
                    "btn-edit";


                editButton.textContent =
                    "Sửa";


                editButton.addEventListener(
                    "click",
                    function () {

                        editProduct(
                            product.id
                        );

                    }
                );


                // DELETE

                const deleteButton =
                    document.createElement(
                        "button"
                    );


                deleteButton.type =
                    "button";


                deleteButton.className =
                    "btn-delete";


                deleteButton.textContent =
                    "Xóa";


                deleteButton.addEventListener(
                    "click",
                    function () {

                        removeProduct(
                            product.id
                        );

                    }
                );


                actionCell.appendChild(
                    editButton
                );


                actionCell.appendChild(
                    deleteButton
                );


                row.appendChild(
                    actionCell
                );


                body.appendChild(
                    row
                );

            }
        );

    }


    // ============================================================
    // ADD PRODUCT
    // ============================================================

    function openAddProduct() {

        log(
            "OPEN ADD PRODUCT"
        );


        const token =
            getAdminToken();


        if (!token) {

            redirectToAdminLogin();

            return;

        }


        editingProductId =
            null;


        const modal =
            document.getElementById(
                "productModal"
            );


        const title =
            document.getElementById(
                "modalTitle"
            );


        const form =
            document.getElementById(
                "productForm"
            );


        const id =
            document.getElementById(
                "productId"
            );


        const visible =
            document.getElementById(
                "productVisible"
            );


        if (!modal) {

            alert(
                "Không tìm thấy #productModal"
            );

            return;

        }


        if (title) {

            title.textContent =
                "Thêm sản phẩm";

        }


        if (form) {

            form.reset();

        }


        if (id) {

            id.disabled =
                false;


            id.value =
                "";

        }


        if (visible) {

            visible.value =
                "true";

        }


        clearImagePreviews();


        modal.classList.add(
            "active"
        );

    }


    // ============================================================
    // EDIT PRODUCT
    // ============================================================

    function editProduct(
        id
    ) {

        const token =
            getAdminToken();


        if (!token) {

            redirectToAdminLogin();

            return;

        }


        const product =
            products.find(
                function (item) {

                    return String(
                        item.id
                    ) ===
                        String(id);

                }
            );


        if (!product) {

            alert(
                "Không tìm thấy sản phẩm."
            );

            return;

        }


        editingProductId =
            product.id;


        const modalTitle =
            document.getElementById(
                "modalTitle"
            );


        if (modalTitle) {

            modalTitle.textContent =
                "Sửa sản phẩm";

        }


        setValue(
            "productId",
            product.id
        );


        setValue(
            "productName",
            product.name
        );


        setValue(
            "productPrice",
            product.price
        );


        setValue(
            "productOriginalPrice",
            product.originalPrice
        );


        setValue(
            "productCategory",
            product.category
        );


        setValue(
            "productStock",
            product.stock
        );


        setValue(
            "productImage",
            product.image
        );


        setValue(
            "productImages",
            product.images.join(
                "\n"
            )
        );


        setValue(
            "productSpecifications",
            product.specifications
        );


        setValue(
            "productPromotion",
            product.promotion
        );


        setValue(
            "productDescription",
            product.description
        );


        setValue(
            "productVisible",
            isVisible(
                product.visible
            )
                ? "true"
                : "false"
        );


        const idInput =
            document.getElementById(
                "productId"
            );


        if (idInput) {

            idInput.disabled =
                true;

        }


        updateMainImagePreview();

        updateSubImagesPreview();


        openProductModal();

    }


    // ============================================================
    // SET VALUE
    // ============================================================

    function setValue(
        id,
        value
    ) {

        const element =
            document.getElementById(
                id
            );


        if (element) {

            element.value =
                value ?? "";

        }

    }


    // ============================================================
    // OPEN MODAL
    // ============================================================

    function openProductModal() {

        const modal =
            document.getElementById(
                "productModal"
            );


        if (!modal) {

            alert(
                "Không tìm thấy #productModal."
            );

            return;

        }


        modal.classList.add(
            "active"
        );

    }


    // ============================================================
    // CLOSE MODAL
    // ============================================================

    function closeProductModal() {

        const modal =
            document.getElementById(
                "productModal"
            );


        if (modal) {

            modal.classList.remove(
                "active"
            );

        }


        editingProductId =
            null;


        const id =
            document.getElementById(
                "productId"
            );


        if (id) {

            id.disabled =
                false;

        }


        clearImagePreviews();

    }


    // ============================================================
    // SAVE PRODUCT
    // ============================================================

    async function saveProduct(
        event
    ) {

        if (event) {

            event.preventDefault();

        }


        if (isSaving) {

            return;

        }


        const token =
            getAdminToken();


        if (!token) {

            redirectToAdminLogin();

            return;

        }


        // ========================================================
        // ELEMENTS
        // ========================================================

        const productIdElement =
            document.getElementById(
                "productId"
            );


        const productNameElement =
            document.getElementById(
                "productName"
            );


        const productPriceElement =
            document.getElementById(
                "productPrice"
            );


        const productOriginalPriceElement =
            document.getElementById(
                "productOriginalPrice"
            );


        const productCategoryElement =
            document.getElementById(
                "productCategory"
            );


        const productStockElement =
            document.getElementById(
                "productStock"
            );


        const productImageElement =
            document.getElementById(
                "productImage"
            );


        const productImagesElement =
            document.getElementById(
                "productImages"
            );


        const productSpecificationsElement =
            document.getElementById(
                "productSpecifications"
            );


        const productPromotionElement =
            document.getElementById(
                "productPromotion"
            );


        const productDescriptionElement =
            document.getElementById(
                "productDescription"
            );


        const productVisibleElement =
            document.getElementById(
                "productVisible"
            );


        // ========================================================
        // PRODUCT DATA
        // ========================================================

        const product = {

            id:
                productIdElement
                    ? String(
                        productIdElement.value ||
                        ""
                    ).trim()
                    : "",


            name:
                productNameElement
                    ? String(
                        productNameElement.value ||
                        ""
                    ).trim()
                    : "",


            price:
                productPriceElement
                    ? toNumber(
                        productPriceElement.value
                    )
                    : 0,


            originalPrice:
                productOriginalPriceElement
                    ? toNumber(
                        productOriginalPriceElement.value
                    )
                    : 0,


            category:
                productCategoryElement
                    ? String(
                        productCategoryElement.value ||
                        ""
                    ).trim()
                    : "",


            stock:
                productStockElement
                    ? toNumber(
                        productStockElement.value
                    )
                    : 0,


            image:
                productImageElement
                    ? String(
                        productImageElement.value ||
                        ""
                    ).trim()
                    : "",


            images:
                productImagesElement
                    ? getLines(
                        productImagesElement.value
                    )
                    : [],


            specifications:
                productSpecificationsElement
                    ? String(
                        productSpecificationsElement.value ||
                        ""
                    ).trim()
                    : "",


            promotion:
                productPromotionElement
                    ? String(
                        productPromotionElement.value ||
                        ""
                    ).trim()
                    : "",


            description:
                productDescriptionElement
                    ? String(
                        productDescriptionElement.value ||
                        ""
                    ).trim()
                    : "",


            visible:
                productVisibleElement
                    ? (
                        productVisibleElement.value ===
                        "true"
                    )
                    : true

        };


        // ========================================================
        // VALIDATE
        // ========================================================

        if (!product.id) {

            alert(
                "Vui lòng nhập ID sản phẩm."
            );

            return;

        }


        if (!product.name) {

            alert(
                "Vui lòng nhập tên sản phẩm."
            );

            return;

        }


        if (!product.category) {

            alert(
                "Vui lòng nhập danh mục."
            );

            return;

        }


        if (
            !Number.isFinite(
                product.price
            ) ||
            product.price < 0
        ) {

            alert(
                "Giá bán không hợp lệ."
            );

            return;

        }


        if (
            !Number.isFinite(
                product.originalPrice
            ) ||
            product.originalPrice < 0
        ) {

            alert(
                "Giá gốc không hợp lệ."
            );

            return;

        }


        if (
            product.originalPrice > 0 &&
            product.price >
            product.originalPrice
        ) {

            const confirmed =
                confirm(
                    "Giá bán đang cao hơn giá gốc.\n\n" +
                    "Bạn vẫn muốn lưu sản phẩm?"
                );


            if (!confirmed) {

                return;

            }

        }


        if (
            !Number.isFinite(
                product.stock
            ) ||
            product.stock < 0
        ) {

            alert(
                "Tồn kho không hợp lệ."
            );

            return;

        }


        // ========================================================
        // CHECK DUPLICATE ID WHEN ADDING
        // ========================================================

        if (
            !editingProductId
        ) {

            const duplicate =
                products.some(
                    function (item) {

                        return (
                            String(
                                item.id
                            ).trim()
                            .toLowerCase()
                            ===
                            product.id
                                .trim()
                                .toLowerCase()
                        );

                    }
                );


            if (duplicate) {

                alert(
                    "ID sản phẩm đã tồn tại.\n\n" +
                    "Vui lòng nhập ID khác."
                );

                return;

            }

        }


        // ========================================================
        // ACTION
        // ========================================================

        const action =
            editingProductId
                ? "updateProduct"
                : "addProduct";


        // ========================================================
        // SAVE
        // ========================================================

        isSaving =
            true;


        const submitButton =
            getSubmitButton();


        setButtonLoading(
            submitButton,
            true,
            editingProductId
                ? "Đang cập nhật..."
                : "Đang thêm..."
        );


        try {

            const data =
                await apiPostAdmin(
                    action,
                    product
                );


            if (
                !data ||
                data.success !== true
            ) {

                throw new Error(
                    data &&
                    (
                        data.error ||
                        data.message
                    )
                        ? (
                            data.error ||
                            data.message
                        )
                        : "Không thể lưu sản phẩm."
                );

            }


            alert(
                data.message ||
                (
                    editingProductId
                        ? "Đã cập nhật sản phẩm."
                        : "Đã thêm sản phẩm."
                )
            );


            closeProductModal();


            await loadProducts();

        }

        catch (error) {

            console.error(
                "SAVE ERROR:",
                error
            );


            alert(
                "Lỗi lưu sản phẩm:\n" +
                error.message
            );

        }

        finally {

            isSaving =
                false;


            setButtonLoading(
                submitButton,
                false
            );

        }

    }


    // ============================================================
    // GET FORM SUBMIT BUTTON
    // ============================================================

    function getSubmitButton() {

        const form =
            document.getElementById(
                "productForm"
            );


        if (!form) {

            return null;

        }


        return (
            form.querySelector(
                'button[type="submit"]'
            ) ||
            form.querySelector(
                "button.btn-primary"
            ) ||
            form.querySelector(
                "button"
            )
        );

    }


    // ============================================================
    // BUTTON LOADING
    // ============================================================

    function setButtonLoading(
        button,
        loading,
        loadingText
    ) {

        if (!button) {

            return;

        }


        if (loading) {

            button.dataset.originalText =
                button.textContent;


            button.disabled =
                true;


            if (loadingText) {

                button.textContent =
                    loadingText;

            }

        }

        else {

            button.disabled =
                false;


            if (
                button.dataset.originalText
            ) {

                button.textContent =
                    button.dataset.originalText;

                delete button.dataset.originalText;

            }

        }

    }


    // ============================================================
    // DELETE PRODUCT
    // ============================================================

    async function removeProduct(
        id
    ) {

        if (isDeleting) {

            return;

        }


        const token =
            getAdminToken();


        if (!token) {

            redirectToAdminLogin();

            return;

        }


        const product =
            products.find(
                function (item) {

                    return String(
                        item.id
                    ) ===
                        String(id);

                }
            );


        const name =
            product
                ? product.name
                : id;


        const confirmed =
            confirm(
                "Bạn có chắc muốn xóa sản phẩm:\n\n" +
                name +
                "\n\n" +
                "Hành động này không thể hoàn tác."
            );


        if (!confirmed) {

            return;

        }


        isDeleting =
            true;


        try {

            const data =
                await apiPostAdmin(
                    "deleteProduct",
                    {

                        id:
                            id

                    }
                );


            if (
                !data ||
                data.success !== true
            ) {

                throw new Error(
                    data &&
                    (
                        data.error ||
                        data.message
                    )
                        ? (
                            data.error ||
                            data.message
                        )
                        : "Không thể xóa sản phẩm."
                );

            }


            alert(
                data.message ||
                "Đã xóa sản phẩm."
            );


            await loadProducts();

        }

        catch (error) {

            console.error(
                "DELETE ERROR:",
                error
            );


            alert(
                "Lỗi xóa sản phẩm:\n" +
                error.message
            );

        }

        finally {

            isDeleting =
                false;

        }

    }


    // ============================================================
    // IMAGE PREVIEW SETUP
    // ============================================================

    function setupImagePreview() {

        const mainImage =
            document.getElementById(
                "productImage"
            );


        const subImages =
            document.getElementById(
                "productImages"
            );


        if (mainImage) {

            mainImage.addEventListener(
                "input",
                updateMainImagePreview
            );

        }


        if (subImages) {

            subImages.addEventListener(
                "input",
                updateSubImagesPreview
            );

        }

    }


    // ============================================================
    // MAIN IMAGE PREVIEW
    // ============================================================

    function updateMainImagePreview() {

        const container =
            document.getElementById(
                "mainImagePreview"
            );


        const input =
            document.getElementById(
                "productImage"
            );


        if (
            !container ||
            !input
        ) {

            return;

        }


        container.innerHTML =
            "";


        const url =
            String(
                input.value ||
                ""
            ).trim();


        if (!url) {

            return;

        }


        appendImagePreview(
            container,
            url
        );

    }


    // ============================================================
    // SUB IMAGE PREVIEW
    // ============================================================

    function updateSubImagesPreview() {

        const container =
            document.getElementById(
                "subImagesPreview"
            );


        const input =
            document.getElementById(
                "productImages"
            );


        if (
            !container ||
            !input
        ) {

            return;

        }


        container.innerHTML =
            "";


        const urls =
            getLines(
                input.value
            );


        urls.forEach(
            function (url) {

                appendImagePreview(
                    container,
                    url
                );

            }
        );

    }


    // ============================================================
    // APPEND IMAGE PREVIEW
    // ============================================================

    function appendImagePreview(
        container,
        url
    ) {

        const item =
            document.createElement(
                "div"
            );


        item.className =
            "image-preview-item";


        const img =
            document.createElement(
                "img"
            );


        img.src =
            url;


        img.alt =
            "Preview";


        img.loading =
            "lazy";


        img.onerror =
            function () {

                item.style.display =
                    "none";

            };


        item.appendChild(
            img
        );


        container.appendChild(
            item
        );

    }


    // ============================================================
    // CLEAR IMAGE PREVIEWS
    // ============================================================

    function clearImagePreviews() {

        const main =
            document.getElementById(
                "mainImagePreview"
            );


        const sub =
            document.getElementById(
                "subImagesPreview"
            );


        if (main) {

            main.innerHTML =
                "";

        }


        if (sub) {

            sub.innerHTML =
                "";

        }

    }


    // ============================================================
    // GET LINES
    // ============================================================

    function getLines(
        value
    ) {

        if (
            Array.isArray(
                value
            )
        ) {

            return value
                .map(
                    function (item) {

                        return String(
                            item ?? ""
                        ).trim();

                    }
                )
                .filter(Boolean);

        }


        const text =
            String(
                value ?? ""
            ).trim();


        if (!text) {

            return [];

        }


        // JSON array

        try {

            const parsed =
                JSON.parse(
                    text
                );


            if (
                Array.isArray(
                    parsed
                )
            ) {

                return parsed
                    .map(
                        function (item) {

                            return String(
                                item ?? ""
                            ).trim();

                        }
                    )
                    .filter(Boolean);

            }

        }

        catch (error) {

            // Continue

        }


        // New lines

        if (
            text.includes(
                "\n"
            )
        ) {

            return text
                .split(/\r?\n/)
                .map(
                    function (item) {

                        return item.trim();

                    }
                )
                .filter(Boolean);

        }


        // Comma-separated

        if (
            text.includes(",")
        ) {

            return text
                .split(",")
                .map(
                    function (item) {

                        return item.trim();

                    }
                )
                .filter(Boolean);

        }


        return [text];

    }


    // ============================================================
    // CLICK OUTSIDE MODAL
    // ============================================================

    document.addEventListener(
        "click",
        function (event) {

            const modal =
                document.getElementById(
                    "productModal"
                );


            if (
                modal &&
                event.target === modal
            ) {

                closeProductModal();

            }

        }
    );


    // ============================================================
    // ESC
    // ============================================================

    document.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key !==
                "Escape"
            ) {

                return;

            }


            const modal =
                document.getElementById(
                    "productModal"
                );


            if (
                modal &&
                modal.classList.contains(
                    "active"
                )
            ) {

                closeProductModal();

            }

        }
    );


    // ============================================================
    // LOADING
    // ============================================================

    function showLoading(
        loading
    ) {

        const element =
            document.getElementById(
                "loading"
            );


        if (!element) {

            return;

        }


        element.style.display =
            loading
                ? "block"
                : "none";

    }


    // ============================================================
    // ERROR
    // ============================================================

    function showError(
        message
    ) {

        const table =
            document.getElementById(
                "productTable"
            );


        const empty =
            document.getElementById(
                "empty"
            );


        if (table) {

            table.style.display =
                "none";

        }


        if (empty) {

            empty.style.display =
                "block";


            empty.textContent =
                message;

        }

    }


    // ============================================================
    // FORMAT MONEY
    // ============================================================

    function formatMoney(
        value
    ) {

        const number =
            toNumber(
                value
            );


        return number.toLocaleString(
            "vi-VN"
        ) +
        " ₫";

    }


    // ============================================================
    // FORMAT NUMBER
    // ============================================================

    function formatNumber(
        value
    ) {

        return toNumber(
            value
        ).toLocaleString(
            "vi-VN"
        );

    }


    // ============================================================
    // CHECK VISIBLE
    // ============================================================

    function isVisible(
        value
    ) {

        if (
            value === false ||
            value === 0
        ) {

            return false;

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
            text === "hidden" ||
            text === "hide"
        ) {

            return false;

        }


        return true;

    }


    // ============================================================
    // EXPOSE FUNCTIONS FOR HTML
    // ============================================================

    window.openAddProduct =
        openAddProduct;


    window.editProduct =
        editProduct;


    window.openProductModal =
        openProductModal;


    window.closeProductModal =
        closeProductModal;


    window.removeProduct =
        removeProduct;


    // ============================================================
    // DOM READY
    // ============================================================

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            init,
            {
                once: true
            }
        );

    }

    else {

        init();

    }


})();