// ============================================================
// CƯỜNG MOBILE
// ADMIN PRODUCTS
// VERSION: EXTENDED PRODUCT DATA
//
// Hỗ trợ:
// - Ảnh chính
// - Ảnh phụ
// - Giá bán
// - Giá gốc
// - Thông số kỹ thuật
// - Ưu đãi
// - Mô tả
// - Danh mục
// - Tồn kho
// - Hiển thị
// ============================================================


const API_URL =
    "https://script.google.com/macros/s/AKfycbxxQRkcRL5BrTEdH28baGNOIyYa-I2vKiYkbQ_ChiMICpqRLSayBpaCM_N44Kn8jtV3/exec";


let products = [];

let editingProductId = null;


// ============================================================
// DOM READY
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        console.log(
            "admin-products.js loaded"
        );


        const search =
            document.getElementById(
                "searchProduct"
            );


        const category =
            document.getElementById(
                "categoryFilter"
            );


        const form =
            document.getElementById(
                "productForm"
            );


        if (search) {

            search.addEventListener(
                "input",
                renderProducts
            );
        }


        if (category) {

            category.addEventListener(
                "change",
                renderProducts
            );
        }


        if (form) {

            form.addEventListener(
                "submit",
                saveProduct
            );
        }


        setupImagePreview();


        loadProducts();

    }
);


// ============================================================
// LOAD PRODUCTS
// ============================================================

async function loadProducts() {

    showLoading(true);


    try {

        const response =
            await fetch(
                API_URL +
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


        const data =
            JSON.parse(text);


        if (!data.success) {

            throw new Error(
                data.error ||
                "Không thể tải sản phẩm."
            );
        }


        products =
            Array.isArray(data.products)
                ? data.products.map(
                    normalizeProduct
                )
                : [];


        createCategoryFilter();

        renderProducts();


    } catch (error) {

        console.error(
            "LOAD ERROR:",
            error
        );


        showError(
            "Lỗi tải sản phẩm: " +
            error.message
        );


    } finally {

        showLoading(false);

    }
}


// ============================================================
// NORMALIZE PRODUCT
// ============================================================

function normalizeProduct(product) {

    product =
        product || {};


    return {

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


        image:
            String(
                product["Hình ảnh"] ??
                product.image ??
                ""
            ).trim(),


        images:
            normalizeImages(
                product["Ảnh phụ"] ??
                product.images ??
                product.subImages ??
                product.sub_images ??
                ""
            ),


        specifications:
            normalizeText(
                product["Thông số kỹ thuật"] ??
                product.specifications ??
                product.specs ??
                ""
            ),


        promotion:
            normalizeText(
                product["Ưu đãi"] ??
                product.promotion ??
                product.promotions ??
                ""
            ),


        description:
            String(
                product["Mô tả"] ??
                product.description ??
                ""
            ).trim(),


        visible:
            product["Hiển thị"] ??
            product.visible ??
            true

    };
}


// ============================================================
// NORMALIZE IMAGES
// ============================================================

function normalizeImages(value) {

    if (Array.isArray(value)) {

        return value
            .map(function (item) {
                return String(item).trim();
            })
            .filter(Boolean);
    }


    const text =
        String(value ?? "").trim();


    if (!text) {
        return [];
    }


    // Hỗ trợ dữ liệu cũ dạng JSON array
    try {

        const parsed =
            JSON.parse(text);


        if (Array.isArray(parsed)) {

            return parsed
                .map(function (item) {
                    return String(item).trim();
                })
                .filter(Boolean);
        }

    } catch (error) {
        // Không phải JSON => xử lý tiếp
    }


    // Chuẩn hóa xuống dòng
    return text
        .split(/\r?\n/)
        .map(function (item) {
            return item.trim();
        })
        .filter(Boolean);

}


// ============================================================
// NORMALIZE TEXT
// ============================================================

function normalizeText(value) {

    if (Array.isArray(value)) {

        return value
            .map(function (item) {
                return String(item).trim();
            })
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
            ? searchElement.value
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
                    product.id
                        .toLowerCase();


                const name =
                    product.name
                        .toLowerCase();


                return (

                    (
                        !search ||
                        id.includes(search) ||
                        name.includes(search)
                    )

                    &&

                    (
                        !category ||
                        product.category ===
                        category
                    )

                );

            }
        );


    body.innerHTML = "";


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
                "Không có sản phẩm.";
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


            // ==================================================
            // IMAGE
            // ==================================================

            const imageCell =
                document.createElement(
                    "td"
                );


            if (product.image) {

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


                img.onerror =
                    function () {

                        this.onerror =
                            null;

                        this.style.display =
                            "none";

                    };


                imageCell.appendChild(
                    img
                );

            } else {

                imageCell.textContent =
                    "Không ảnh";
            }


            row.appendChild(
                imageCell
            );


            // ==================================================
            // ID
            // ==================================================

            const idCell =
                document.createElement(
                    "td"
                );


            const strong =
                document.createElement(
                    "strong"
                );


            strong.textContent =
                product.id;


            idCell.appendChild(
                strong
            );


            row.appendChild(
                idCell
            );


            // ==================================================
            // NAME
            // ==================================================

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


            // ==================================================
            // CATEGORY
            // ==================================================

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


            // ==================================================
            // PRICE
            // ==================================================

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


            // ==================================================
            // ORIGINAL PRICE
            // ==================================================

            const originalPriceCell =
                document.createElement(
                    "td"
                );


            if (
                product.originalPrice >
                0
            ) {

                originalPriceCell
                    .className =
                    "product-original-price";


                originalPriceCell
                    .textContent =
                    formatMoney(
                        product.originalPrice
                    );

            } else {

                originalPriceCell
                    .textContent =
                    "—";
            }


            row.appendChild(
                originalPriceCell
            );


            // ==================================================
            // PROMOTION
            // ==================================================

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

            } else {

                promotionCell.textContent =
                    "—";
            }


            row.appendChild(
                promotionCell
            );


            // ==================================================
            // STOCK
            // ==================================================

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
                    product.stock +
                    " sản phẩm";

            } else {

                stockCell.className =
                    "stock-out";


                stockCell.textContent =
                    "Hết hàng";
            }


            row.appendChild(
                stockCell
            );


            // ==================================================
            // ACTION
            // ==================================================

            const actionCell =
                document.createElement(
                    "td"
                );


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
// THÊM SẢN PHẨM
// ============================================================

function openAddProduct() {

    console.log(
        "OPEN ADD PRODUCT"
    );


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
// SỬA SẢN PHẨM
// ============================================================

function editProduct(id) {

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


    document.getElementById(
        "modalTitle"
    ).textContent =
        "Sửa sản phẩm";


    document.getElementById(
        "productId"
    ).value =
        product.id;


    document.getElementById(
        "productName"
    ).value =
        product.name;


    document.getElementById(
        "productPrice"
    ).value =
        product.price || "";


    document.getElementById(
        "productOriginalPrice"
    ).value =
        product.originalPrice || "";


    document.getElementById(
        "productCategory"
    ).value =
        product.category;


    document.getElementById(
        "productStock"
    ).value =
        product.stock;


    document.getElementById(
        "productImage"
    ).value =
        product.image;


    document.getElementById(
        "productImages"
    ).value =
        product.images.join(
            "\n"
        );


    document.getElementById(
        "productSpecifications"
    ).value =
        product.specifications;


    document.getElementById(
        "productPromotion"
    ).value =
        product.promotion;


    document.getElementById(
        "productDescription"
    ).value =
        product.description;


    document.getElementById(
        "productVisible"
    ).value =
        isVisible(
            product.visible
        )
            ? "true"
            : "false";


    document.getElementById(
        "productId"
    ).disabled =
        true;


    updateMainImagePreview();

    updateSubImagesPreview();


    openProductModal();

}


window.editProduct =
    editProduct;


// ============================================================
// MỞ MODAL
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
// ĐÓNG MODAL
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

}


// ============================================================
// SAVE PRODUCT
// ============================================================

async function saveProduct(event) {

    event.preventDefault();


    const product = {

        id:
            document.getElementById(
                "productId"
            ).value.trim(),


        name:
            document.getElementById(
                "productName"
            ).value.trim(),


        price:
            Number(
                document.getElementById(
                    "productPrice"
                ).value
            ),


        originalPrice:
            Number(
                document.getElementById(
                    "productOriginalPrice"
                ).value ||
                0
            ),


        category:
            document.getElementById(
                "productCategory"
            ).value.trim(),


        stock:
            Number(
                document.getElementById(
                    "productStock"
                ).value
            ),


        image:
            document.getElementById(
                "productImage"
            ).value.trim(),


        images:
            getLines(
                document.getElementById(
                    "productImages"
                ).value
            ),


        specifications:
            document.getElementById(
                "productSpecifications"
            ).value.trim(),


        promotion:
            document.getElementById(
                "productPromotion"
            ).value.trim(),


        description:
            document.getElementById(
                "productDescription"
            ).value.trim(),


        visible:
            document.getElementById(
                "productVisible"
            ).value ===
            "true"

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
        product.price < 0
    ) {

        alert(
            "Giá bán không được âm."
        );

        return;
    }


    if (
        product.originalPrice < 0
    ) {

        alert(
            "Giá gốc không được âm."
        );

        return;
    }


    if (
        product.originalPrice > 0 &&
        product.price > product.originalPrice
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


    if (
        product.stock < 0
    ) {

        alert(
            "Tồn kho không được âm."
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

        const payload = {

            action:
                action,

            ...product

        };


        console.log(
            "SAVE PAYLOAD:",
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


        const text =
            await response.text();


        console.log(
            "SAVE RESPONSE:",
            text
        );


        const data =
            JSON.parse(text);


        if (!data.success) {

            throw new Error(
                data.error ||
                "Không thể lưu sản phẩm."
            );
        }


        alert(
            data.message ||
            "Đã lưu sản phẩm."
        );


        closeProductModal();


        await loadProducts();


    } catch (error) {

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
// XÓA SẢN PHẨM
// ============================================================

async function removeProduct(id) {

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
                        JSON.stringify({

                            action:
                                "deleteProduct",

                            id:
                                id

                        })

                }
            );


        const text =
            await response.text();


        const data =
            JSON.parse(text);


        if (!data.success) {

            throw new Error(
                data.error ||
                "Không thể xóa sản phẩm."
            );
        }


        alert(
            data.message ||
            "Đã xóa sản phẩm."
        );


        await loadProducts();


    } catch (error) {

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


    if (!container || !input) {
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


    if (!container || !input) {
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
        main.innerHTML = "";
    }


    if (sub) {
        sub.innerHTML = "";
    }

}


// ============================================================
// GET LINES
// ============================================================

function getLines(value) {

    if (
        Array.isArray(value)
    ) {

        return value
            .map(
                function (item) {
                    return String(
                        item
                    ).trim();
                }
            )
            .filter(Boolean);
    }


    return String(
        value ?? ""
    )
        .split(/\r?\n/)
        .map(
            function (item) {
                return item.trim();
            }
        )
        .filter(Boolean);

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

    return Number(
        value || 0
    )
        .toLocaleString(
            "vi-VN"
        ) +
        " ₫";

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
        text === "không"
    ) {

        return false;
    }


    return true;

}