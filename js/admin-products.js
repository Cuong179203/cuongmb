"use strict";

// ============================================================
// CƯỜNG MOBILE
// ADMIN PRODUCTS
// FRONTEND ↔ GOOGLE APPS SCRIPT
//
// MỤC TIÊU:
// ADMIN SỬA SẢN PHẨM
//        ↓
// Hình ảnh chính      → Hình ảnh
// Hình ảnh phụ        → Hình ảnh phụ
// Khuyến mãi          → Khuyến mãi
// Ưu đãi              → Ưu đãi
// Thông số kỹ thuật   → Thông số kỹ thuật
//        ↓
// GOOGLE SHEETS
//        ↓
// GET PRODUCTS API
//        ↓
// TRANG CHI TIẾT SẢN PHẨM
//
// ============================================================


// ============================================================
// CONFIG
// ============================================================

// ============================================================
// STATE
// ============================================================

let products = [];

let editingProductId = null;


// ============================================================
// ADMIN TOKEN
// ============================================================

function getAdminToken() {

    try {

        return (
            sessionStorage.getItem(
                window.CUONG_MOBILE_ADMIN_TOKEN_KEY
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
            window.CUONG_MOBILE_ADMIN_TOKEN_KEY
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
        "Phiên đăng nhập admin đã hết hạn.\n\n" +
        "Vui lòng đăng nhập lại."
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
// API POST ADMIN
// ============================================================

async function apiPostAdmin(
    action,
    body = {}
) {

    const token =
        requireAdminToken();

    if (!token) {

        throw new Error(
            "Chưa đăng nhập admin."
        );

    }

    const payload = {

        ...body,

        action:
            action,

        adminToken:
            token

    };

    console.log(
        "===================================="
    );

    console.log(
        "API POST:",
        action
    );

    console.log(
        "===================================="
    );

    const response =
        await fetch(
            window.CUONG_MOBILE_API_URL,
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

    if (!response.ok) {

        throw new Error(
            "HTTP " +
            response.status
        );

    }

    const text =
        await response.text();

    console.log(
        "API RESPONSE:",
        action,
        text
    );

    let data;

    try {

        data =
            JSON.parse(
                text
            );

    }

    catch (error) {

        throw new Error(
            "API không trả về JSON hợp lệ."
        );

    }

    if (
        data &&
        data.success === false &&
        String(
            data.error || ""
        )
            .toLowerCase()
            .includes(
                "quyền truy cập admin"
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

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        console.log(
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

        try {

            const authResult =
                await apiPostAdmin(
                    "checkAdmin"
                );

            if (
                !authResult ||
                authResult.success !== true
            ) {

                throw new Error(
                    authResult?.error ||
                    "Admin Token không hợp lệ."
                );

            }

        }

        catch (error) {

            console.error(
                "ADMIN AUTH ERROR:",
                error
            );

            clearAdminToken();

            window.location.href =
                "admin.html";

            return;

        }

        // ====================================================
        // SEARCH
        // ====================================================

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

        // ====================================================
        // CATEGORY
        // ====================================================

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

        // ====================================================
        // FORM
        // ====================================================

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

        // ====================================================
        // IMAGE PREVIEW
        // ====================================================

        setupImagePreview();

        // ====================================================
        // LOAD
        // ====================================================

        loadProducts();

    }
);


// ============================================================
// LOAD PRODUCTS
// ============================================================

async function loadProducts() {

    showLoading(true);

    try {

        const apiUrl =
            String(
                window.CUONG_MOBILE_API_URL ||
                ""
            ).trim();

        if (!apiUrl) {

            throw new Error(
                "Thiếu cấu hình API. Vui lòng tải lại trang."
            );

        }

        const response =
            await fetch(
                apiUrl +
                "?action=getProducts&t=" +
                Date.now()
            );

        if (!response.ok) {

            throw new Error(
                "HTTP " +
                response.status
            );

        }

        const text =
            await response.text();

        console.log(
            "GET PRODUCTS:",
            text
        );

        let data;

        try {

            data =
                JSON.parse(
                    text
                );

        }

        catch (error) {

            throw new Error(
                "API không trả về JSON hợp lệ."
            );

        }

        if (!data.success) {

            throw new Error(
                data.error ||
                "Không thể tải sản phẩm."
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

        console.log(
            "Tổng sản phẩm:",
            products.length
        );

        // DEBUG QUAN TRỌNG
        products.forEach(
            function (product) {

                console.log(
                    "PRODUCT SYNC:",
                    {
                        id:
                            product.id,

                        image:
                            product.image,

                        images:
                            product.images,

                        imageCount:
                            product.images.length
                    }
                );

            }
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

        showLoading(false);

    }

}


// ============================================================
// NORMALIZE PRODUCT
// GAS → FRONTEND
//
// QUAN TRỌNG:
// Cột Google Sheets:
// "Hình ảnh"
// "Hình ảnh phụ"
// "Khuyến mãi"
// "Ưu đãi"
// "Thông số kỹ thuật"
//
// ============================================================

function normalizeProduct(
    product
) {

    product =
        product || {};

    const mainImage =
        String(
            product["Hình ảnh"] ??
            product.image ??
            ""
        ).trim();

    const galleryValue =
        product["Hình ảnh phụ"] ??
        product["Ảnh phụ"] ??
        product.gallery ??
        product.images ??
        product.subImages ??
        product.sub_images ??
        "";

    const gallery =
        normalizeImages(
            galleryValue
        );

    return {

        // ====================================================
        // BASIC
        // ====================================================

        id:
            String(
                product["ID"] ??
                product.id ??
                ""
            ).trim(),

        name:
            String(
                product["Tên sản phẩm"] ??
                product.name ??
                ""
            ).trim(),

        price:
            Number(
                product["Giá"] ??
                product.price ??
                0
            ),

        originalPrice:
            Number(
                product["Giá gốc"] ??
                product.originalPrice ??
                product.original_price ??
                0
            ),

        category:
            String(
                product["Danh mục"] ??
                product.category ??
                ""
            ).trim(),

        stock:
            Number(
                product["Tồn kho"] ??
                product.stock ??
                0
            ),

        // ====================================================
        // MAIN IMAGE
        // ====================================================

        image:
            mainImage,

        // ====================================================
        // GALLERY
        //
        // Đây chính là dữ liệu trang chi tiết sản phẩm cần.
        // ====================================================

        images:
            gallery,

        gallery:
            gallery,

        subImages:
            gallery,

        // ====================================================
        // PROMOTION
        // ====================================================

        discount:
            normalizeText(
                product["Khuyến mãi"] ??
                product.discount ??
                product.promotion ??
                product.promotions ??
                ""
            ),

        promotion:
            normalizeText(
                product["Khuyến mãi"] ??
                product.promotion ??
                product.discount ??
                ""
            ),

        // ====================================================
        // OFFER
        // ====================================================

        offer:
            normalizeText(
                product["Ưu đãi"] ??
                product.offer ??
                product.offers ??
                ""
            ),

        // ====================================================
        // SPECIFICATIONS
        // ====================================================

        specifications:
            normalizeText(
                product["Thông số kỹ thuật"] ??
                product.specifications ??
                product.specs ??
                ""
            ),

        specs:
            normalizeText(
                product["Thông số kỹ thuật"] ??
                product.specs ??
                product.specifications ??
                ""
            ),

        // ====================================================
        // DESCRIPTION
        // ====================================================

        description:
            String(
                product["Mô tả"] ??
                product.description ??
                ""
            ).trim(),

        // ====================================================
        // VISIBILITY
        // ====================================================

        visible:
            normalizeBoolean(
                product["Hiển thị"] ??
                product.visible ??
                true
            )

    };

}


// ============================================================
// NORMALIZE IMAGES
//
// Hỗ trợ:
// 1. Array
// 2. JSON array
// 3. Mỗi URL một dòng
// 4. URL ngăn cách bằng dấu phẩy
// 5. URL ngăn cách bằng |
// ============================================================

function normalizeImages(
    value
) {

    if (
        Array.isArray(value)
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

    if (
        text.startsWith("[") &&
        text.endsWith("]")
    ) {

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

            // JSON array không hợp lệ, tiếp tục xử lý như text.

        }

    }

    // ========================================================
    // NEW LINE
    // ========================================================

    let result =
        text
            .split(/\r?\n/)
            .map(
                function (item) {

                    return item.trim();

                }
            )
            .filter(Boolean);

    // ========================================================
    // NẾU CHỈ CÓ 1 DÒNG NHƯNG DÙNG "|" 
    // ========================================================

    if (
        result.length === 1 &&
        result[0].includes("|")
    ) {

        result =
            result[0]
                .split("|")
                .map(
                    function (item) {

                        return item.trim();

                    }
                )
                .filter(Boolean);

    }

    // ========================================================
    // NẾU CHỈ CÓ 1 DÒNG NHƯNG DÙNG ","
    //
    // Chỉ tách nếu tất cả phần nhìn giống URL.
    // ========================================================

    if (
        result.length === 1 &&
        result[0].includes(",")
    ) {

        const commaParts =
            result[0]
                .split(",")
                .map(
                    function (item) {

                        return item.trim();

                    }
                )
                .filter(Boolean);

        if (
            commaParts.length > 1 &&
            commaParts.every(
                function (item) {

                    return (
                        item.startsWith(
                            "http://"
                        ) ||
                        item.startsWith(
                            "https://"
                        ) ||
                        item.startsWith(
                            "data:image/"
                        )
                    );

                }
            )
        ) {

            result =
                commaParts;

        }

    }

    return result;

}


// ============================================================
// NORMALIZE TEXT
// ============================================================

function normalizeText(
    value
) {

    if (
        Array.isArray(value)
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
// NORMALIZE BOOLEAN
// ============================================================

function normalizeBoolean(
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

    const categories = [];

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
        '<option value="">Tất cả danh mục</option>';

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

    const searchText =
        searchElement
            ? searchElement.value
                .trim()
                .toLowerCase()
            : "";

    const selectedCategory =
        categoryElement
            ? categoryElement.value
            : "";

    body.innerHTML =
        "";

    const filtered =
        products.filter(
            function (product) {

                const matchesSearch =
                    !searchText ||
                    String(
                        product.name || ""
                    )
                        .toLowerCase()
                        .includes(
                            searchText
                        ) ||
                    String(
                        product.id || ""
                    )
                        .toLowerCase()
                        .includes(
                            searchText
                        );

                const matchesCategory =
                    !selectedCategory ||
                    product.category ===
                    selectedCategory;

                return (
                    matchesSearch &&
                    matchesCategory
                );

            }
        );

    if (table) {

        table.style.display =
            filtered.length
                ? ""
                : "none";

    }

    if (empty) {

        empty.style.display =
            filtered.length
                ? "none"
                : "";

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
                    product.name;

                img.loading =
                    "lazy";

                img.style.width =
                    "60px";

                img.style.height =
                    "60px";

                img.style.objectFit =
                    "cover";

                img.onerror =
                    function () {

                        img.style.display =
                            "none";

                        imageCell.textContent =
                            "Ảnh lỗi";

                    };

                imageCell.appendChild(
                    img
                );

            }

            else {

                imageCell.textContent =
                    "Không có ảnh";

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

            idCell.textContent =
                product.id;

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

            nameCell.textContent =
                product.name;

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
                product.category;

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

            originalPriceCell.textContent =
                formatMoney(
                    product.originalPrice
                );

            row.appendChild(
                originalPriceCell
            );

            // =================================================
            // OFFER
            // =================================================

            const offerCell =
                document.createElement(
                    "td"
                );

            offerCell.textContent =
                product.offer ||
                "-";

            row.appendChild(
                offerCell
            );

            // =================================================
            // STOCK
            // =================================================

            const stockCell =
                document.createElement(
                    "td"
                );

            stockCell.textContent =
                String(
                    product.stock
                );

            row.appendChild(
                stockCell
            );

            // =================================================
            // ACTION
            // =================================================

            const actionCell =
                document.createElement(
                    "td"
                );

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

window.openAddProduct =
    openAddProduct;


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

    // ========================================================
    // BASIC
    // ========================================================

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

    // ========================================================
    // MAIN IMAGE
    // ========================================================

    setValue(
        "productImage",
        product.image
    );

    // ========================================================
    // SUB IMAGES
    //
    // Đây là phần quan trọng nhất.
    //
    // product.images đã được lấy từ:
    // "Hình ảnh phụ"
    //
    // Khi mở modal sửa:
    // array → mỗi URL một dòng.
    // ========================================================

    setValue(
        "productImages",
        Array.isArray(product.images)
            ? product.images.join("\n")
            : ""
    );

    // ========================================================
    // PROMOTION
    // ========================================================

    setValue(
        "productPromotion",
        product.discount
    );

    // ========================================================
    // OFFER
    // ========================================================

    setValue(
        "productOffer",
        product.offer
    );

    // ========================================================
    // SPECIFICATIONS
    // ========================================================

    setValue(
        "productSpecifications",
        product.specifications
    );

    // ========================================================
    // DESCRIPTION
    // ========================================================

    setValue(
        "productDescription",
        product.description
    );

    // ========================================================
    // VISIBILITY
    // ========================================================

    setValue(
        "productVisible",
        product.visible
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

    // ========================================================
    // PREVIEW
    // ========================================================

    updateMainImagePreview();

    updateSubImagesPreview();

    openProductModal();

}

window.editProduct =
    editProduct;


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
            value == null
                ? ""
                : value;

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

window.openProductModal =
    openProductModal;


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

window.closeProductModal =
    closeProductModal;


// ============================================================
// SAVE PRODUCT
// ============================================================

async function saveProduct(
    event
) {

    event.preventDefault();

    const token =
        getAdminToken();

    if (!token) {

        redirectToAdminLogin();

        return;

    }

    // ========================================================
    // DOM
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

    const productPromotionElement =
        document.getElementById(
            "productPromotion"
        );

    const productOfferElement =
        document.getElementById(
            "productOffer"
        );

    const productSpecificationsElement =
        document.getElementById(
            "productSpecifications"
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
    // GALLERY
    //
    // Mỗi dòng = 1 ảnh.
    //
    // Ví dụ:
    //
    // https://abc.com/1.jpg
    // https://abc.com/2.jpg
    // https://abc.com/3.jpg
    //
    // Sẽ gửi:
    //
    // gallery:  [url1, url2, url3]
    // images:   [url1, url2, url3]
    // subImages:[url1, url2, url3]
    //
    // ========================================================

    const gallery =
        productImagesElement
            ? getLines(
                productImagesElement.value
            )
                .filter(
                    function (url, index, urls) {

                        return urls.indexOf(url) === index;

                    }
                )
                .join("\n")
            : "";

    // ========================================================
    // PRODUCT
    // ========================================================

    const product = {

        id:
            productIdElement
                ? productIdElement.value.trim()
                : "",

        name:
            productNameElement
                ? productNameElement.value.trim()
                : "",

        price:
            productPriceElement
                ? Number(
                    productPriceElement.value
                )
                : 0,

        originalPrice:
            productOriginalPriceElement
                ? Number(
                    productOriginalPriceElement.value ||
                    0
                )
                : 0,

        category:
            productCategoryElement
                ? productCategoryElement.value.trim()
                : "",

        stock:
            productStockElement
                ? Number(
                    productStockElement.value
                )
                : 0,

        // ====================================================
        // MAIN IMAGE
        // ====================================================

        image:
            productImageElement
                ? productImageElement.value.trim()
                : "",

        // ====================================================
        // GALLERY
        //
        // Code.gs cần dữ liệu này để ghi vào:
        // "Hình ảnh phụ"
        // ====================================================

        gallery:
            gallery,

        images:
            gallery,

        subImages:
            gallery,

        // ====================================================
        // PROMOTION
        // ====================================================

        discount:
            productPromotionElement
                ? productPromotionElement.value.trim()
                : "",

        promotion:
            productPromotionElement
                ? productPromotionElement.value.trim()
                : "",

        // ====================================================
        // OFFER
        // ====================================================

        offer:
            productOfferElement
                ? productOfferElement.value.trim()
                : "",

        // ====================================================
        // SPECIFICATIONS
        // ====================================================

        specs:
            productSpecificationsElement
                ? productSpecificationsElement.value.trim()
                : "",

        specifications:
            productSpecificationsElement
                ? productSpecificationsElement.value.trim()
                : "",

        // ====================================================
        // DESCRIPTION
        // ====================================================

        description:
            productDescriptionElement
                ? productDescriptionElement.value.trim()
                : "",

        // ====================================================
        // VISIBILITY
        // ====================================================

        visible:
            productVisibleElement
                ? productVisibleElement.value ===
                "true"
                : true

    };

    // ========================================================
    // DEBUG GALLERY
    // ========================================================

    console.log(
        "===================================="
    );

    console.log(
        "SAVE PRODUCT GALLERY:"
    );

    console.log(
        "MAIN IMAGE:",
        product.image
    );

    console.log(
        "SUB IMAGES:",
        product.gallery
    );

    console.log(
        "SUB IMAGE COUNT:",
        product.gallery.length
    );

    console.log(
        "===================================="
    );

    // ========================================================
    // VALIDATE ID
    // ========================================================

    if (!product.id) {

        alert(
            "Vui lòng nhập ID sản phẩm."
        );

        return;

    }

    // ========================================================
    // VALIDATE NAME
    // ========================================================

    if (!product.name) {

        alert(
            "Vui lòng nhập tên sản phẩm."
        );

        return;

    }

    // ========================================================
    // VALIDATE CATEGORY
    // ========================================================

    if (!product.category) {

        alert(
            "Vui lòng nhập danh mục."
        );

        return;

    }

    // ========================================================
    // VALIDATE PRICE
    // ========================================================

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

    // ========================================================
    // VALIDATE ORIGINAL PRICE
    // ========================================================

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

    // ========================================================
    // PRICE CHECK
    // ========================================================

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

            return;

        }

    }

    // ========================================================
    // STOCK
    // ========================================================

    if (
        !Number.isInteger(
            product.stock
        ) ||
        product.stock < 0
    ) {

        alert(
            "Tồn kho không hợp lệ."
        );

        return;

    }

    const imageUrls = [

        product.image,

        ...getLines(
            product.gallery
        )

    ].filter(Boolean);

    const invalidImageUrl =
        imageUrls.find(
            function (url) {

                return !isValidImageUrl(url);

            }
        );

    if (invalidImageUrl) {

        alert(
            "URL hình ảnh không hợp lệ:\n" +
            invalidImageUrl
        );

        return;

    }

    // ========================================================
    // ACTION
    // ========================================================

    const action =
        editingProductId
            ? "updateProduct"
            : "addProduct";

    try {

        // ====================================================
        // PAYLOAD
        // ====================================================

        const payload = {

            action:
                action,

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

            // =================================================
            // MAIN IMAGE
            // =================================================

            image:
                product.image,

            // =================================================
            // GALLERY
            //
            // Gửi nhiều alias để Code.gs/frontend hiện tại
            // đều có thể nhận đúng dữ liệu.
            // =================================================

            gallery:
                product.gallery,

            images:
                product.gallery,

            subImages:
                product.gallery,

            // =================================================
            // PROMOTION
            // =================================================

            discount:
                product.discount,

            promotion:
                product.promotion,

            // =================================================
            // OFFER
            // =================================================

            offer:
                product.offer,

            // =================================================
            // SPECIFICATIONS
            // =================================================

            specs:
                product.specs,

            specifications:
                product.specifications,

            // =================================================
            // DESCRIPTION
            // =================================================

            description:
                product.description,

            // =================================================
            // VISIBILITY
            // =================================================

            visible:
                product.visible,

            // =================================================
            // ADMIN TOKEN
            // =================================================

            adminToken:
                token

        };

        console.log(
            "===================================="
        );

        console.log(
            "SAVE PRODUCT:",
            action,
            product.id
        );

        console.log(
            "GALLERY:",
            payload.gallery
        );

        console.log(
            "GALLERY JSON:",
            JSON.stringify(
                payload.gallery
            )
        );

        console.log(
            "===================================="
        );

        // ====================================================
        // API
        // ====================================================

        const data =
            await apiPostAdmin(
                action,
                payload
            );

        console.log(
            "SAVE RESPONSE:",
            data
        );

        // ====================================================
        // CHECK
        // ====================================================

        if (
            !data ||
            data.success !== true
        ) {

            throw new Error(
                data &&
                    data.error
                    ? data.error
                    : "Không thể lưu sản phẩm."
            );

        }

        alert(
            data.message ||
            "Đã lưu sản phẩm."
        );

        // ====================================================
        // CLOSE
        // ====================================================

        closeProductModal();

        // ====================================================
        // RELOAD FROM GAS
        //
        // Quan trọng:
        // Không tự cập nhật products[] bằng dữ liệu form.
        //
        // Phải lấy lại từ Google Sheets thông qua API.
        //
        // Như vậy nếu API trả sai Hình ảnh phụ,
        // console sẽ phát hiện ngay.
        // ====================================================

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

}


// ============================================================
// DELETE PRODUCT
// ============================================================

async function removeProduct(
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

    const name =
        product
            ? product.name
            : id;

    if (
        !confirm(
            "Bạn có chắc muốn xóa sản phẩm:\n\n" +
            name
        )
    ) {

        return;

    }

    try {

        const data =
            await apiPostAdmin(
                "deleteProduct",
                {

                    id:
                        id

                }
            );

        console.log(
            "DELETE RESPONSE:",
            data
        );

        if (
            !data ||
            data.success !== true
        ) {

            throw new Error(
                data &&
                    data.error
                    ? data.error
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

}

window.removeProduct =
    removeProduct;


// ============================================================
// IMAGE PREVIEW
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
        input.value.trim();

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
        Array.isArray(value)
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

    return text
        .split(/\r?\n/)
        .map(
            function (item) {

                return item.trim();

            }
        )
        .filter(Boolean);

}


// ============================================================
// IMAGE URL VALIDATION
// ============================================================

function isValidImageUrl(
    value
) {

    const text =
        String(
            value || ""
        ).trim();

    if (!text) {

        return false;

    }

    if (
        text.startsWith(
            "data:image/"
        )
    ) {

        return true;

    }

    if (
        /^(?![\\/]|\/\/)(?:[\w.-]+\/)+[\w.-]+(?:\?[^#]*)?(?:#.*)?$/i.test(
            text
        )
    ) {

        return true;

    }

    try {

        const url =
            new URL(
                text
            );

        return (
            url.protocol === "http:" ||
            url.protocol === "https:"
        );

    }

    catch (error) {

        return false;

    }

}


// ============================================================
// VISIBILITY
// ============================================================

function isVisible(
    value
) {

    return normalizeBoolean(
        value
    );

}


// ============================================================
// FORMAT MONEY
// ============================================================

function formatMoney(
    value
) {

    const number =
        Number(
            value || 0
        );

    return number.toLocaleString(
        "vi-VN"
    ) +
        " ₫";

}


// ============================================================
// LOADING
// ============================================================

function showLoading(
    visible
) {

    const element =
        document.getElementById(
            "loading"
        );

    if (!element) {

        return;

    }

    element.style.display =
        visible
            ? ""
            : "none";

}


// ============================================================
// ERROR
// ============================================================

function showError(
    message
) {

    console.error(
        message
    );

    const element =
        document.getElementById(
            "error"
        );

    if (element) {

        element.textContent =
            message;

        element.style.display =
            "";

    }

}


// ============================================================
// EXPOSE
// ============================================================

window.loadProducts =
    loadProducts;

window.renderProducts =
    renderProducts;

window.saveProduct =
    saveProduct;

window.editProduct =
    editProduct;

window.removeProduct =
    removeProduct;

window.openAddProduct =
    openAddProduct;

window.openProductModal =
    openProductModal;

window.closeProductModal =
    closeProductModal;

window.updateMainImagePreview =
    updateMainImagePreview;

window.updateSubImagesPreview =
    updateSubImagesPreview;