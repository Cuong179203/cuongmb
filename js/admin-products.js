"use strict";

(function () {

    // ========================================================
    // CONFIG
    // ========================================================

    const API_URL =
        "https://script.google.com/macros/s/AKfycbxxQRkcRL5BrTEdH28baGNOIyYa-I2vKiYkbQ_ChiMICpqRLSayBpaCM_N44Kn8jtV3/exec";

    const TOKEN_KEY =
        "CM_ADMIN_TOKEN";


    // ========================================================
    // STATE
    // ========================================================

    let products = [];

    let editingProductId = null;

    let isSaving = false;

    let isDeleting = false;


    // ========================================================
    // LOG
    // ========================================================

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


    // ========================================================
    // TOKEN
    // ========================================================

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


    function redirectToAdminLogin() {

        clearAdminToken();

        alert(
            "Phiên đăng nhập admin đã hết hạn.\n\n" +
            "Vui lòng đăng nhập lại."
        );

        window.location.href =
            "admin.html";

    }


    function requireAdminToken() {

        const token =
            getAdminToken();

        if (!token) {

            redirectToAdminLogin();

            return null;

        }

        return token;

    }


    // ========================================================
    // API RESPONSE
    // ========================================================

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


        if (!text.trim()) {

            throw new Error(
                "API trả về dữ liệu rỗng."
            );

        }


        try {

            return JSON.parse(
                text
            );

        }

        catch (error) {

            console.error(
                "JSON PARSE ERROR:",
                error
            );

            console.error(
                "RAW RESPONSE:",
                text
            );

            throw new Error(
                "API không trả về JSON hợp lệ."
            );

        }

    }


    // ========================================================
    // ADMIN ERROR
    // ========================================================

    function isAdminPermissionError(
        data
    ) {

        if (
            !data ||
            data.success !== false
        ) {

            return false;

        }


        const text =
            String(
                data.error ||
                data.message ||
                ""
            )
                .trim()
                .toLowerCase();


        return (

            text.includes(
                "quyền truy cập admin"
            )

            ||

            text.includes(
                "không có quyền"
            )

            ||

            text.includes(
                "admin token"
            )

            ||

            text.includes(
                "token không hợp lệ"
            )

            ||

            text.includes(
                "token khong hop le"
            )

            ||

            text.includes(
                "unauthorized"
            )

            ||

            text.includes(
                "forbidden"
            )

        );

    }


    // ========================================================
    // POST ADMIN
    // ========================================================

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
            action,
            payload
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


    // ========================================================
    // INIT
    // ========================================================

    function init() {

        log(
            "admin-products.js loaded"
        );


        if (!getAdminToken()) {

            console.warn(
                "Không tìm thấy CM_ADMIN_TOKEN."
            );

            window.location.href =
                "admin.html";

            return;

        }


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


        setupImagePreview();

        loadProducts();

    }


    // ========================================================
    // LOAD PRODUCTS
    // ========================================================

    async function loadProducts() {

        showLoading(
            true
        );


        try {

            /*
            GAS hiện tại có getProducts public.
            Không gửi adminToken ở GET vì doGet()
            của GAS không yêu cầu admin cho getProducts.
            */

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


            products =
                Array.isArray(
                    data.products
                )
                    ? data.products.map(
                        normalizeProduct
                    )
                    : [];


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


    // ========================================================
    // NORMALIZE PRODUCT
    // GAS → FRONTEND
    // ========================================================

    function normalizeProduct(
        product
    ) {

        product =
            product || {};


        /*
        GAS getProducts() trả về:
        ID
        Tên sản phẩm
        Giá
        Giá gốc
        Danh mục
        Tồn kho
        Hình ảnh
        Hình ảnh phụ
        Khuyến mãi
        Ưu đãi
        Thông số kỹ thuật
        Mô tả
        Hiển thị
        */

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
                toNumber(
                    firstDefined(
                        product["Giá"],
                        product.price,
                        0
                    )
                ),


            originalPrice:
                toNumber(
                    firstDefined(
                        product["Giá gốc"],
                        product.originalPrice,
                        product.original_price,
                        0
                    )
                ),


            category:
                String(
                    firstDefined(
                        product["Danh mục"],
                        product.category,
                        ""
                    )
                ).trim(),


            stock:
                toNumber(
                    firstDefined(
                        product["Tồn kho"],
                        product.stock,
                        0
                    )
                ),


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
                        product.gallery,
                        product.images,
                        product.additionalImages,
                        ""
                    )
                ),


            /*
            GAS phân biệt "Khuyến mãi" và "Ưu đãi".
            Frontend giữ cả hai.
            */

            discount:
                normalizeText(
                    firstDefined(
                        product["Khuyến mãi"],
                        product.discount,
                        product.promotion,
                        ""
                    )
                ),


            promotion:
                normalizeText(
                    firstDefined(
                        product["Ưu đãi"],
                        product.offer,
                        product.offers,
                        product.promotion,
                        ""
                    )
                ),


            specifications:
                normalizeText(
                    firstDefined(
                        product["Thông số kỹ thuật"],
                        product.specs,
                        product.specifications,
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


    // ========================================================
    // FIRST DEFINED
    // ========================================================

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


    // ========================================================
    // NUMBER
    // ========================================================

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


    // ========================================================
    // IMAGES
    // ========================================================

    function normalizeImages(
        value
    ) {

        if (
            Array.isArray(value)
        ) {

            return value
                .map(
                    item =>
                        String(
                            item ?? ""
                        ).trim()
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


        try {

            const parsed =
                JSON.parse(
                    text
                );


            if (
                Array.isArray(parsed)
            ) {

                return parsed
                    .map(
                        item =>
                            String(
                                item ?? ""
                            ).trim()
                    )
                    .filter(Boolean);

            }

        }

        catch (error) {

            // Continue

        }


        return text
            .split(/\r?\n|,/)
            .map(
                item =>
                    item.trim()
            )
            .filter(Boolean);

    }


    // ========================================================
    // TEXT
    // ========================================================

    function normalizeText(
        value
    ) {

        if (
            Array.isArray(value)
        ) {

            return value
                .map(
                    item =>
                        String(
                            item ?? ""
                        ).trim()
                )
                .filter(Boolean)
                .join("\n");

        }


        return String(
            value ?? ""
        ).trim();

    }


    // ========================================================
    // CATEGORY
    // ========================================================

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
            product => {

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
            (a, b) =>
                a.localeCompare(
                    b,
                    "vi"
                )
        );


        select.innerHTML =
            "";


        const all =
            document.createElement(
                "option"
            );


        all.value =
            "";


        all.textContent =
            "Tất cả danh mục";


        select.appendChild(
            all
        );


        categories.forEach(
            category => {

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


    // ========================================================
    // RENDER
    // ========================================================

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
                product => {

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


                    return (

                        (
                            !search ||
                            id.includes(search) ||
                            name.includes(search)
                        )

                        &&

                        (
                            !category ||
                            productCategory === category
                        )

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
            product => {

                const row =
                    document.createElement(
                        "tr"
                    );


                // IMAGE

                const imageCell =
                    document.createElement(
                        "td"
                    );


                imageCell.className =
                    "product-image-cell";


                if (product.image) {

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


                // ID

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


                // NAME

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


                // CATEGORY

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


                // PRICE

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


                // ORIGINAL PRICE

                const originalPriceCell =
                    document.createElement(
                        "td"
                    );


                if (
                    product.originalPrice > 0
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


                // PROMOTION

                const promotionCell =
                    document.createElement(
                        "td"
                    );


                const promotionLines =
                    getLines(
                        product.promotion
                    );


                const discountLines =
                    getLines(
                        product.discount
                    );


                const totalPromotionLines =
                    promotionLines.length +
                    discountLines.length;


                if (
                    totalPromotionLines > 0
                ) {

                    const badge =
                        document.createElement(
                            "span"
                        );


                    badge.className =
                        "promo-badge";


                    badge.textContent =
                        totalPromotionLines +
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


                // STOCK

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


                // VISIBLE

                const visibleCell =
                    document.createElement(
                        "td"
                    );


                const badge =
                    document.createElement(
                        "span"
                    );


                if (
                    isVisible(
                        product.visible
                    )
                ) {

                    badge.className =
                        "status-visible";


                    badge.textContent =
                        "Đang hiển thị";

                }

                else {

                    badge.className =
                        "status-hidden";


                    badge.textContent =
                        "Đang ẩn";

                }


                visibleCell.appendChild(
                    badge
                );


                row.appendChild(
                    visibleCell
                );


                // ACTION

                const actionCell =
                    document.createElement(
                        "td"
                    );


                actionCell.className =
                    "product-actions";


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
                    () =>
                        editProduct(
                            product.id
                        )
                );


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
                    () =>
                        removeProduct(
                            product.id
                        )
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


    // ========================================================
    // ADD
    // ========================================================

    function openAddProduct() {

        if (!requireAdminToken()) {

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


    // ========================================================
    // EDIT
    // ========================================================

    function editProduct(
        id
    ) {

        if (!requireAdminToken()) {

            return;

        }


        const product =
            products.find(
                item =>
                    normalizeId(
                        item.id
                    ) ===
                    normalizeId(
                        id
                    )
            );


        if (!product) {

            alert(
                "Không tìm thấy sản phẩm."
            );

            return;

        }


        editingProductId =
            product.id;


        const title =
            document.getElementById(
                "modalTitle"
            );


        if (title) {

            title.textContent =
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


    // ========================================================
    // SAVE
    // ========================================================

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
            requireAdminToken();


        if (!token) {

            return;

        }


        const product =
            readProductFromForm();


        if (
            !validateProduct(
                product
            )
        ) {

            return;

        }


        if (
            !editingProductId
        ) {

            const duplicate =
                products.some(
                    item =>
                        normalizeId(
                            item.id
                        ) ===
                        normalizeId(
                            product.id
                        )
                );


            if (duplicate) {

                alert(
                    "ID sản phẩm đã tồn tại."
                );

                return;

            }

        }


        const action =
            editingProductId
                ? "updateProduct"
                : "addProduct";


        isSaving =
            true;


        const button =
            getSubmitButton();


        setButtonLoading(
            button,
            true,
            editingProductId
                ? "Đang cập nhật..."
                : "Đang thêm..."
        );


        try {

            /*
            CONTRACT CHUẨN VỚI GAS

            Frontend:
                id
                name
                price
                originalPrice
                category
                stock
                image
                images
                promotion
                description
                visible

            GAS buildProductRow():
                Hình ảnh phụ ← images
                Ưu đãi       ← promotion / offer
                Khuyến mãi   ← discount / promotion

            Để tránh mất dữ liệu, gửi thêm:
                gallery
                offer
                offers
                specs
                discount

            */

            const payload = {

                id:
                    product.id,

                name:
                    product.name,

                price:
                    product.price,

                originalPrice:
                    product.originalPrice,

                category:
                    product.category,

                stock:
                    product.stock,

                image:
                    product.image,

                images:
                    product.images.join(
                        "\n"
                    ),

                gallery:
                    product.images.join(
                        "\n"
                    ),

                additionalImages:
                    product.images.join(
                        "\n"
                    ),

                discount:
                    product.discount,

                promotion:
                    product.promotion,

                offer:
                    product.promotion,

                offers:
                    product.promotion,

                specs:
                    product.specifications,

                specifications:
                    product.specifications,

                description:
                    product.description,

                visible:
                    product.visible,

                adminToken:
                    token

            };


            log(
                "SAVE ACTION:",
                action
            );


            log(
                "SAVE PAYLOAD:",
                {
                    ...payload,
                    adminToken:
                        token
                            ? "TOKEN_RECEIVED"
                            : "NO_TOKEN"
                }
            );


            const data =
                await apiPostAdmin(
                    action,
                    payload
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
                button,
                false
            );

        }

    }


    // ========================================================
    // READ FORM
    // ========================================================

    function readProductFromForm() {

        const get =
            id =>
                document.getElementById(
                    id
                );


        const product = {

            id:
                get("productId")
                    ? String(
                        get("productId").value ||
                        ""
                    ).trim()
                    : "",


            name:
                get("productName")
                    ? String(
                        get("productName").value ||
                        ""
                    ).trim()
                    : "",


            price:
                get("productPrice")
                    ? toNumber(
                        get("productPrice").value
                    )
                    : 0,


            originalPrice:
                get("productOriginalPrice")
                    ? toNumber(
                        get("productOriginalPrice").value
                    )
                    : 0,


            category:
                get("productCategory")
                    ? String(
                        get("productCategory").value ||
                        ""
                    ).trim()
                    : "",


            stock:
                get("productStock")
                    ? toNumber(
                        get("productStock").value
                    )
                    : 0,


            image:
                get("productImage")
                    ? String(
                        get("productImage").value ||
                        ""
                    ).trim()
                    : "",


            images:
                get("productImages")
                    ? getLines(
                        get("productImages").value
                    )
                    : [],


            specifications:
                get("productSpecifications")
                    ? String(
                        get("productSpecifications").value ||
                        ""
                    ).trim()
                    : "",


            promotion:
                get("productPromotion")
                    ? String(
                        get("productPromotion").value ||
                        ""
                    ).trim()
                    : "",


            /*
            Nếu HTML hiện tại chỉ có một ô
            productPromotion thì coi đó là
            Ưu đãi.

            discount để rỗng.
            */

            discount:
                "",


            description:
                get("productDescription")
                    ? String(
                        get("productDescription").value ||
                        ""
                    ).trim()
                    : "",


            visible:
                get("productVisible")
                    ? (
                        get("productVisible").value ===
                        "true"
                    )
                    : true

        };


        return product;

    }


    // ========================================================
    // VALIDATE
    // ========================================================

    function validateProduct(
        product
    ) {

        if (!product.id) {

            alert(
                "Vui lòng nhập ID sản phẩm."
            );

            return false;

        }


        if (!product.name) {

            alert(
                "Vui lòng nhập tên sản phẩm."
            );

            return false;

        }


        if (!product.category) {

            alert(
                "Vui lòng nhập danh mục."
            );

            return false;

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

            return false;

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

            return false;

        }


        if (
            product.originalPrice > 0 &&
            product.price >
            product.originalPrice
        ) {

            if (
                !confirm(
                    "Giá bán đang cao hơn giá gốc.\n\n" +
                    "Bạn vẫn muốn lưu sản phẩm?"
                )
            ) {

                return false;

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

            return false;

        }


        return true;

    }


    // ========================================================
    // DELETE
    // ========================================================

    async function removeProduct(
        id
    ) {

        if (isDeleting) {

            return;

        }


        if (!requireAdminToken()) {

            return;

        }


        const product =
            products.find(
                item =>
                    normalizeId(
                        item.id
                    ) ===
                    normalizeId(
                        id
                    )
            );


        const name =
            product
                ? product.name
                : id;


        if (
            !confirm(
                "Bạn có chắc muốn xóa sản phẩm:\n\n" +
                name +
                "\n\n" +
                "Hành động này không thể hoàn tác."
            )
        ) {

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


    // ========================================================
    // MODAL
    // ========================================================

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


    // ========================================================
    // IMAGE PREVIEW
    // ========================================================

    function setupImagePreview() {

        const main =
            document.getElementById(
                "productImage"
            );


        const sub =
            document.getElementById(
                "productImages"
            );


        if (main) {

            main.addEventListener(
                "input",
                updateMainImagePreview
            );

        }


        if (sub) {

            sub.addEventListener(
                "input",
                updateSubImagesPreview
            );

        }

    }


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


        getLines(
            input.value
        ).forEach(
            url =>
                appendImagePreview(
                    container,
                    url
                )
        );

    }


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


    // ========================================================
    // HELPERS
    // ========================================================

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


    function getLines(
        value
    ) {

        if (
            Array.isArray(value)
        ) {

            return value
                .map(
                    item =>
                        String(
                            item ?? ""
                        ).trim()
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


        try {

            const parsed =
                JSON.parse(
                    text
                );


            if (
                Array.isArray(parsed)
            ) {

                return parsed
                    .map(
                        item =>
                            String(
                                item ?? ""
                            ).trim()
                    )
                    .filter(Boolean);

            }

        }

        catch (error) {

            // Continue

        }


        return text
            .split(/\r?\n|,/)
            .map(
                item =>
                    item.trim()
            )
            .filter(Boolean);

    }


    function normalizeId(
        value
    ) {

        return String(
            value ?? ""
        )
            .trim()
            .replace(
                /\.0+$/,
                ""
            )
            .toLowerCase();

    }


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


        return !(
            text === "false" ||
            text === "0" ||
            text === "no" ||
            text === "không" ||
            text === "hidden" ||
            text === "hide"
        );

    }


    function formatMoney(
        value
    ) {

        return toNumber(
            value
        ).toLocaleString(
            "vi-VN"
        ) +
        " ₫";

    }


    function formatNumber(
        value
    ) {

        return toNumber(
            value
        ).toLocaleString(
            "vi-VN"
        );

    }


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


    function setButtonLoading(
        button,
        loading,
        text
    ) {

        if (!button) {

            return;

        }


        if (loading) {

            button.dataset.originalText =
                button.textContent;


            button.disabled =
                true;


            if (text) {

                button.textContent =
                    text;

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


    // ========================================================
    // MODAL EVENTS
    // ========================================================

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


    // ========================================================
    // EXPOSE
    // ========================================================

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


    // ========================================================
    // START
    // ========================================================

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