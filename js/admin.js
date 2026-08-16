// ============================================================
// CƯỜNG MOBILE
// ADMIN.JS
// GOOGLE APPS SCRIPT API
// VERSION: SECURITY STEP 2 - FINAL FIX
// ============================================================

"use strict";

// ============================================================
// CONFIG
// ============================================================

const API_URL =
    "https://script.google.com/macros/s/AKfycbxxQRkcRL5BrTEdH28baGNOIyYa-I2vKiYkbQ_ChiMICpqRLSayBpaCM_N44Kn8jtV3/exec";

const TOKEN_KEY =
    "CM_ADMIN_TOKEN";

// ============================================================
// STATE
// ============================================================

let products = [];
let orders = [];
let filteredOrders = [];

// ============================================================
// INIT
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        bindEvents();

        const token = getToken();

        if (token) {

            showApp();

            loadData();

        } else {

            showLogin();

        }

    }
);

// ============================================================
// TOKEN
// ============================================================

function getToken() {

    return (
        sessionStorage.getItem(
            TOKEN_KEY
        ) || ""
    ).trim();

}

function saveToken(token) {

    sessionStorage.setItem(
        TOKEN_KEY,
        String(token || "").trim()
    );

}

function clearToken() {

    sessionStorage.removeItem(
        TOKEN_KEY
    );

}

// ============================================================
// LOGIN
// ============================================================

async function loginAdmin() {

    const input =
        document.getElementById(
            "adminToken"
        );

    const errorBox =
        document.getElementById(
            "loginError"
        );

    if (!input) {

        return;

    }

    const token =
        input.value.trim();

    if (!token) {

        showLoginError(
            "Vui lòng nhập Admin Token."
        );

        return;

    }

    try {

        if (errorBox) {

            errorBox.style.display =
                "none";

            errorBox.textContent =
                "";

        }

        console.log(
            "Đang kiểm tra Admin Token..."
        );

        /*
         * Code.gs hiện tại KHÔNG có action checkAdmin.
         *
         * Vì vậy không gọi:
         * action: "checkAdmin"
         *
         * Ta xác thực bằng getOrders.
         *
         * Nếu token đúng:
         * {
         *   success: true,
         *   orders: [...]
         * }
         *
         * Nếu token sai:
         * {
         *   success: false,
         *   error: "Không có quyền truy cập admin."
         * }
         */

        const data =
            await apiPostWithToken(
                "getOrders",
                {},
                token
            );

        console.log(
            "Admin auth response:",
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
                    : "Admin Token không hợp lệ."
            );

        }

        saveToken(token);

        orders =
            Array.isArray(
                data.orders
            )
                ? data.orders
                : [];

        filteredOrders =
            [...orders];

        showApp();

        renderAll();

        /*
         * Sau khi xác thực thành công,
         * tải lại toàn bộ dữ liệu.
         */

        await loadData();

    }

    catch (error) {

        console.error(
            "Admin login error:",
            error
        );

        clearToken();

        showLogin();

        showLoginError(
            error.message ||
            "Không thể đăng nhập admin."
        );

    }

}

// ============================================================
// LOGIN ERROR
// ============================================================

function showLoginError(message) {

    const box =
        document.getElementById(
            "loginError"
        );

    if (!box) {

        alert(message);

        return;

    }

    box.textContent =
        String(message || "");

    box.style.display =
        "block";

}

// ============================================================
// LOGOUT
// ============================================================

function logoutAdmin() {

    clearToken();

    orders = [];

    products = [];

    filteredOrders = [];

    showLogin();

}

// ============================================================
// UI
// ============================================================

function showLogin() {

    const login =
        document.getElementById(
            "adminLogin"
        );

    const app =
        document.getElementById(
            "adminApp"
        );

    if (login) {

        login.style.display =
            "flex";

    }

    if (app) {

        app.style.display =
            "none";

    }

}

function showApp() {

    const login =
        document.getElementById(
            "adminLogin"
        );

    const app =
        document.getElementById(
            "adminApp"
        );

    if (login) {

        login.style.display =
            "none";

    }

    if (app) {

        app.style.display =
            "block";

    }

}

// ============================================================
// EVENTS
// ============================================================

function bindEvents() {

    document
        .getElementById(
            "adminLoginForm"
        )
        ?.addEventListener(
            "submit",
            function (e) {

                e.preventDefault();

                loginAdmin();

            }
        );

    document
        .getElementById(
            "logoutAdmin"
        )
        ?.addEventListener(
            "click",
            logoutAdmin
        );

    /*
     * HTML hiện tại:
     * id="refresh-orders"
     */

    document
        .getElementById(
            "refresh-orders"
        )
        ?.addEventListener(
            "click",
            loadData
        );

    /*
     * HTML mobile:
     * id="refresh-orders-mobile"
     */

    document
        .getElementById(
            "refresh-orders-mobile"
        )
        ?.addEventListener(
            "click",
            loadData
        );

    /*
     * Search
     */

    document
        .getElementById(
            "order-search"
        )
        ?.addEventListener(
            "input",
            applyOrderFilters
        );

    /*
     * Status filter
     */

    document
        .getElementById(
            "status-filter"
        )
        ?.addEventListener(
            "change",
            applyOrderFilters
        );

    /*
     * Modal close
     */

    document
        .getElementById(
            "close-order-modal"
        )
        ?.addEventListener(
            "click",
            closeOrderModal
        );

    /*
     * Click outside modal
     */

    document
        .getElementById(
            "order-modal"
        )
        ?.addEventListener(
            "click",
            function (e) {

                if (
                    e.target ===
                    this
                ) {

                    closeOrderModal();

                }

            }
        );

    /*
     * ESC đóng modal
     */

    document.addEventListener(
        "keydown",
        function (e) {

            if (
                e.key === "Escape"
            ) {

                closeOrderModal();

            }

        }
    );

}

// ============================================================
// API GET
// ============================================================

async function apiGet(
    action,
    admin = false
) {

    let url =
        API_URL +
        "?action=" +
        encodeURIComponent(
            action
        );

    if (admin) {

        const token =
            getToken();

        if (!token) {

            throw new Error(
                "Chưa đăng nhập admin."
            );

        }

        url +=
            "&adminToken=" +
            encodeURIComponent(
                token
            );

    }

    console.log(
        "API GET:",
        action
    );

    const res =
        await fetch(
            url
        );

    if (!res.ok) {

        throw new Error(
            "HTTP Error: " +
            res.status
        );

    }

    const data =
        await res.json();

    console.log(
        "API GET RESPONSE:",
        action,
        data
    );

    return data;

}

// ============================================================
// API POST
// ============================================================

async function apiPost(
    action,
    body = {}
) {

    return apiPostWithToken(
        action,
        body,
        getToken()
    );

}

// ============================================================
// API POST WITH TOKEN
// ============================================================

async function apiPostWithToken(
    action,
    body = {},
    token = ""
) {

    const payload = {

        ...body,

        action:
            action,

        adminToken:
            String(
                token || ""
            ).trim()

    };

    console.log(
        "API POST:",
        action
    );

    const res =
        await fetch(
            API_URL,
            {
                method: "POST",

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

    if (!res.ok) {

        throw new Error(
            "HTTP Error: " +
            res.status
        );

    }

    let data;

    try {

        data =
            await res.json();

    }

    catch (error) {

        throw new Error(
            "API không trả về JSON hợp lệ."
        );

    }

    console.log(
        "API RESPONSE:",
        action,
        data
    );

    return data;

}

// ============================================================
// LOAD DATA
// ============================================================

async function loadData() {

    try {

        await Promise.all([

            loadProducts(),

            loadOrders()

        ]);

    }

    catch (error) {

        console.error(
            "Load data error:",
            error
        );

        showAdminError(
            error.message ||
            "Không thể tải dữ liệu."
        );

    }

}

// ============================================================
// LOAD PRODUCTS
// ============================================================

async function loadProducts() {

    try {

        const data =
            await apiGet(
                "getProducts"
            );

        if (
            !data ||
            data.success !== true
        ) {

            throw new Error(
                data &&
                data.error
                    ? data.error
                    : "Không thể tải sản phẩm."
            );

        }

        products =
            Array.isArray(
                data.products
            )
                ? data.products
                : [];

        renderProducts();

    }

    catch (error) {

        console.error(
            "Load products error:",
            error
        );

        /*
         * Không alert liên tục khi dashboard
         * chỉ đang tải dữ liệu.
         */

        showAdminError(
            error.message ||
            "Không thể tải sản phẩm."
        );

    }

}

// ============================================================
// LOAD ORDERS
// ============================================================

async function loadOrders() {

    const tbody =
        document.getElementById(
            "orders-body"
        );

    if (tbody) {

        tbody.innerHTML = `

<tr>
<td
    colspan="9"
    id="admin-loading"
    class="no-orders"
>
Đang tải đơn hàng...
</td>
</tr>

`;

    }

    try {

        const data =
            await apiPost(
                "getOrders"
            );

        console.log(
            "GET ORDERS RESULT:",
            data
        );

        /*
         * API Code.gs trả:
         *
         * {
         *   success: true,
         *   count: 3,
         *   orders: [...]
         * }
         *
         * Không được kiểm tra:
         *
         * if (data === true)
         */

        if (
            !data ||
            data.success !== true
        ) {

            throw new Error(
                data &&
                data.error
                    ? data.error
                    : "Không thể tải đơn hàng."
            );

        }

        orders =
            Array.isArray(
                data.orders
            )
                ? data.orders
                : [];

        filteredOrders =
            [...orders];

        console.log(
            "ORDERS LOADED:",
            orders
        );

        hideAdminError();

        applyOrderFilters();

        updateStatistics();

    }

    catch (error) {

        console.error(
            "Load orders error:",
            error
        );

        showAdminError(
            error.message ||
            "Không thể tải đơn hàng."
        );

        if (
            String(
                error.message || ""
            ).toLowerCase()
                .includes(
                    "quyền truy cập admin"
                )
        ) {

            clearToken();

            showLogin();

        }

    }

}

// ============================================================
// RENDER ALL
// ============================================================

function renderAll() {

    renderProducts();

    renderOrders();

    updateStatistics();

}

// ============================================================
// ORDER FILTER
// ============================================================

function applyOrderFilters() {

    const searchInput =
        document.getElementById(
            "order-search"
        );

    const statusSelect =
        document.getElementById(
            "status-filter"
        );

    const keyword =
        (
            searchInput
                ?.value || ""
        )
            .trim()
            .toLowerCase();

    const status =
        statusSelect
            ?.value || "";

    filteredOrders =
        orders.filter(
            function (order) {

                const orderId =
                    String(
                        order["Order ID"] || ""
                    ).toLowerCase();

                const customer =
                    String(
                        order["Họ tên"] || ""
                    ).toLowerCase();

                const phone =
                    String(
                        order["Số điện thoại"] || ""
                    ).toLowerCase();

                const address =
                    String(
                        order["Địa chỉ"] || ""
                    ).toLowerCase();

                const product =
                    String(
                        order["Sản phẩm"] || ""
                    ).toLowerCase();

                const matchesSearch =
                    !keyword ||
                    orderId.includes(keyword) ||
                    customer.includes(keyword) ||
                    phone.includes(keyword) ||
                    address.includes(keyword) ||
                    product.includes(keyword);

                const matchesStatus =
                    !status ||
                    String(
                        order["Trạng thái"] || ""
                    ) === status;

                return (
                    matchesSearch &&
                    matchesStatus
                );

            }
        );

    renderOrders();

}

// ============================================================
// UPDATE STATISTICS
// ============================================================

function updateStatistics() {

    const total =
        orders.length;

    let pending = 0;
    let shipping = 0;
    let delivered = 0;
    let revenue = 0;

    orders.forEach(
        function (order) {

            const status =
                String(
                    order["Trạng thái"] || ""
                ).trim();

            if (
                status === "Chờ xử lý"
            ) {

                pending++;

            }

            if (
                status === "Đang giao"
            ) {

                shipping++;

            }

            if (
                status === "Đã giao"
            ) {

                delivered++;

            }

            /*
             * Doanh thu:
             * chỉ tính đơn đã giao.
             *
             * Nếu muốn tính tất cả đơn,
             * bỏ điều kiện status.
             */

            if (
                status === "Đã giao"
            ) {

                const amount =
                    Number(
                        order["Tổng tiền"] || 0
                    );

                if (
                    Number.isFinite(amount)
                ) {

                    revenue += amount;

                }

            }

        }
    );

    setText(
        "total-orders",
        total
    );

    setText(
        "pending-orders",
        pending
    );

    setText(
        "shipping-orders",
        shipping
    );

    setText(
        "delivered-orders",
        delivered
    );

    setText(
        "total-revenue",
        formatMoneyClient(
            revenue
        )
    );

}

// ============================================================
// SET TEXT
// ============================================================

function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );

    if (element) {

        element.textContent =
            String(value);

    }

}

// ============================================================
// PRODUCT FORM
// ============================================================

function getProductForm(
    prefix = ""
) {

    const get =
        id =>
            document.getElementById(
                prefix + id
            );

    return {

        id:
            get("id")
                ?.value
                .trim() || "",

        name:
            get("name")
                ?.value
                .trim() || "",

        price:
            Number(
                get("price")
                    ?.value || 0
            ),

        category:
            get("category")
                ?.value
                .trim() || "",

        stock:
            Number(
                get("stock")
                    ?.value || 0
            ),

        image:
            get("image")
                ?.value
                .trim() || "",

        description:
            get("description")
                ?.value
                .trim() || "",

        visible:
            !!get("visible")?.checked

    };

}

// ============================================================
// ADD PRODUCT
// ============================================================

async function addProduct() {

    try {

        const data =
            getProductForm(
                "add_"
            );

        const res =
            await apiPost(
                "addProduct",
                data
            );

        if (
            !res ||
            res.success !== true
        ) {

            return alert(
                res?.error ||
                "Không thể thêm sản phẩm."
            );

        }

        alert(
            "Đã thêm sản phẩm."
        );

        document
            .getElementById(
                "addProductForm"
            )
            ?.reset();

        await loadProducts();

    }

    catch (error) {

        console.error(
            "Add product error:",
            error
        );

        alert(
            error.message ||
            "Lỗi thêm sản phẩm."
        );

    }

}

// ============================================================
// UPDATE PRODUCT
// ============================================================

async function updateProduct() {

    try {

        const data =
            getProductForm(
                "edit_"
            );

        const res =
            await apiPost(
                "updateProduct",
                data
            );

        if (
            !res ||
            res.success !== true
        ) {

            return alert(
                res?.error ||
                "Không thể cập nhật sản phẩm."
            );

        }

        alert(
            "Đã cập nhật sản phẩm."
        );

        await loadProducts();

    }

    catch (error) {

        console.error(
            "Update product error:",
            error
        );

        alert(
            error.message ||
            "Lỗi cập nhật sản phẩm."
        );

    }

}

// ============================================================
// DELETE PRODUCT
// ============================================================

async function deleteProduct(
    id
) {

    if (
        !confirm(
            "Xóa sản phẩm?"
        )
    ) {

        return;

    }

    try {

        const res =
            await apiPost(
                "deleteProduct",
                {
                    id
                }
            );

        if (
            !res ||
            res.success !== true
        ) {

            return alert(
                res?.error ||
                "Không thể xóa sản phẩm."
            );

        }

        await loadProducts();

    }

    catch (error) {

        console.error(
            "Delete product error:",
            error
        );

        alert(
            error.message ||
            "Lỗi xóa sản phẩm."
        );

    }

}

// ============================================================
// EDIT PRODUCT
// ============================================================

function editProduct(
    id
) {

    const p =
        products.find(
            function (x) {

                return (
                    String(
                        x.ID
                    ) ===
                    String(id)
                );

            }
        );

    if (!p) {

        return;

    }

    setValue(
        "edit_id",
        p.ID || ""
    );

    setValue(
        "edit_name",
        p["Tên sản phẩm"] || ""
    );

    setValue(
        "edit_price",
        p["Giá"] || 0
    );

    setValue(
        "edit_category",
        p["Danh mục"] || ""
    );

    setValue(
        "edit_stock",
        p["Tồn kho"] || 0
    );

    setValue(
        "edit_image",
        p["Hình ảnh"] || ""
    );

    setValue(
        "edit_description",
        p["Mô tả"] || ""
    );

    const visible =
        document.getElementById(
            "edit_visible"
        );

    if (visible) {

        visible.checked =
            toBooleanClient(
                p["Hiển thị"]
            );

    }

    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });

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
            value;

    }

}

// ============================================================
// CHANGE ORDER STATUS
// ============================================================

async function changeStatus(
    id,
    status
) {

    try {

        const res =
            await apiPost(
                "updateStatus",
                {

                    orderId:
                        id,

                    status:
                        status

                }
            );

        if (
            !res ||
            res.success !== true
        ) {

            alert(
                res?.error ||
                "Không thể cập nhật trạng thái."
            );

            await loadOrders();

            return;

        }

        await loadOrders();

    }

    catch (error) {

        console.error(
            "Change status error:",
            error
        );

        alert(
            error.message ||
            "Lỗi cập nhật trạng thái."
        );

        await loadOrders();

    }

}

// ============================================================
// RENDER PRODUCTS
// ============================================================

function renderProducts() {

    const tbody =
        document.getElementById(
            "productsTableBody"
        );

    if (!tbody) {

        return;

    }

    tbody.innerHTML =
        products
            .map(
                function (p) {

                    return `

<tr>

<td>
${escapeHtml(p.ID)}
</td>

<td>

${
    p["Hình ảnh"]
        ? `<img
            src="${escapeHtml(
                p["Hình ảnh"]
            )}"
            width="50"
            height="50"
            style="object-fit:cover"
            onerror="this.style.display='none'"
        >`
        : ""
}

</td>

<td>
${escapeHtml(
    p["Tên sản phẩm"]
)}
</td>

<td>
${escapeHtml(
    p["Danh mục"]
)}
</td>

<td>
${Number(
    p["Giá"] || 0
).toLocaleString("vi-VN")} ₫
</td>

<td>
${Number(
    p["Tồn kho"] || 0
)}
</td>

<td>
${
    toBooleanClient(
        p["Hiển thị"]
    )
        ? "Hiện"
        : "Ẩn"
}
</td>

<td>

<button
    type="button"
    onclick="editProduct('${escapeJs(
        p.ID
    )}')"
>
Sửa
</button>

<button
    type="button"
    onclick="deleteProduct('${escapeJs(
        p.ID
    )}')"
>
Xóa
</button>

</td>

</tr>

`;

                }
            )
            .join("");

}

// ============================================================
// RENDER ORDERS
// ============================================================

function renderOrders() {

    /*
     * HTML dashboard của mày dùng:
     *
     * <tbody id="orders-body">
     *
     * Code cũ lại tìm:
     *
     * ordersTableBody
     *
     * Đây chính là lý do API trả đơn nhưng
     * giao diện không hiện.
     */

    const tbody =
        document.getElementById(
            "orders-body"
        );

    if (!tbody) {

        console.error(
            "Không tìm thấy #orders-body trong HTML."
        );

        return;

    }

    const statuses = [

        "Chờ xử lý",
        "Đã xác nhận",
        "Đang giao",
        "Đã giao",
        "Đã hủy"

    ];

    if (
        !filteredOrders.length
    ) {

        tbody.innerHTML = `

<tr>

<td
    colspan="9"
    class="no-orders"
>
Không có đơn hàng phù hợp.
</td>

</tr>

`;

        return;

    }

    tbody.innerHTML =
        filteredOrders
            .map(
                function (o) {

                    const orderId =
                        String(
                            o["Order ID"] || ""
                        );

                    const status =
                        String(
                            o["Trạng thái"] || ""
                        );

                    const total =
                        Number(
                            o["Tổng tiền"] || 0
                        );

                    return `

<tr>

<td>
<strong>
${escapeHtml(orderId)}
</strong>
</td>

<td>
${escapeHtml(
    o["Ngày"]
)}
</td>

<td>
<div>
<strong>
${escapeHtml(
    o["Họ tên"]
)}
</strong>
</div>

<div style="
    margin-top:3px;
    color:#94a3b8;
    font-size:10px;
">
${escapeHtml(
    o["Số điện thoại"]
)}
</div>
</td>

<td>
${escapeHtml(
    o["Địa chỉ"]
)}
</td>

<td>
${escapeHtml(
    o["Sản phẩm"]
)}
</td>

<td>
<strong>
${total.toLocaleString(
    "vi-VN"
)} ₫
</strong>
</td>

<td>
${escapeHtml(
    o["Thanh toán"] || "COD"
)}
</td>

<td>

<select
    class="status-select"
    onchange="changeStatus(
        '${escapeJs(orderId)}',
        this.value
    )"
>

${
    statuses
        .map(
            function (s) {

                return `
<option
    value="${escapeHtml(s)}"
    ${
        status === s
            ? "selected"
            : ""
    }
>
${escapeHtml(s)}
</option>
`;

            }
        )
        .join("")
}

</select>

</td>

<td>

<button
    type="button"
    class="detail-btn"
    onclick="showOrderDetail('${escapeJs(
        orderId
    )}')"
>
Chi tiết
</button>

</td>

</tr>

`;

                }
            )
            .join("");

}

// ============================================================
// ORDER DETAIL
// ============================================================

function showOrderDetail(
    orderId
) {

    const order =
        orders.find(
            function (o) {

                return (
                    String(
                        o["Order ID"] || ""
                    ) ===
                    String(orderId)
                );

            }
        );

    if (!order) {

        return;

    }

    const modal =
        document.getElementById(
            "order-modal"
        );

    const body =
        document.getElementById(
            "order-modal-body"
        );

    const title =
        document.getElementById(
            "order-modal-title"
        );

    if (
        !modal ||
        !body
    ) {

        return;

    }

    if (title) {

        title.textContent =
            "Chi tiết đơn hàng #" +
            (
                order["Order ID"] || ""
            );

    }

    const total =
        Number(
            order["Tổng tiền"] || 0
        );

    body.innerHTML = `

<div class="order-detail-top">

    <div class="detail-card">

        <div class="detail-label">
            Mã đơn hàng
        </div>

        <div class="detail-value">
            ${escapeHtml(
                order["Order ID"]
            )}
        </div>

    </div>

    <div class="detail-card">

        <div class="detail-label">
            Ngày đặt
        </div>

        <div class="detail-value">
            ${escapeHtml(
                order["Ngày"]
            )}
        </div>

    </div>

    <div class="detail-card">

        <div class="detail-label">
            Trạng thái
        </div>

        <div class="detail-value">
            ${escapeHtml(
                order["Trạng thái"]
            )}
        </div>

    </div>

    <div class="detail-card">

        <div class="detail-label">
            Thanh toán
        </div>

        <div class="detail-value">
            ${escapeHtml(
                order["Thanh toán"] || "COD"
            )}
        </div>

    </div>

</div>

<div class="detail-section">

    <div class="detail-section-title">
        Thông tin khách hàng
    </div>

    <div class="detail-info-grid">

        <div class="detail-row">
            <strong>Họ tên:</strong>
            <span>
                ${escapeHtml(
                    order["Họ tên"]
                )}
            </span>
        </div>

        <div class="detail-row">
            <strong>Số điện thoại:</strong>
            <span>
                ${escapeHtml(
                    order["Số điện thoại"]
                )}
            </span>
        </div>

        <div class="detail-row">
            <strong>Địa chỉ:</strong>
            <span>
                ${escapeHtml(
                    order["Địa chỉ"]
                )}
            </span>
        </div>

        <div class="detail-row">
            <strong>Ghi chú:</strong>
            <span>
                ${escapeHtml(
                    order["Ghi chú"] || ""
                )}
            </span>
        </div>

    </div>

</div>

<div class="detail-section">

    <div class="detail-section-title">
        Sản phẩm
    </div>

    <div class="detail-products">

        ${formatOrderDetailProducts(
            order
        )}

    </div>

    <div class="detail-total">

        <span>
            Tổng tiền
        </span>

        <strong>
            ${total.toLocaleString(
                "vi-VN"
            )} ₫
        </strong>

    </div>

</div>

`;

    modal.classList.add(
        "active"
    );

    modal.setAttribute(
        "aria-hidden",
        "false"
    );

}

// ============================================================
// FORMAT ORDER DETAIL PRODUCTS
// ============================================================

function formatOrderDetailProducts(
    order
) {

    const raw =
        order[
            "Chi tiết sản phẩm"
        ];

    if (raw) {

        try {

            const parsed =
                typeof raw === "string"
                    ? JSON.parse(raw)
                    : raw;

            if (
                Array.isArray(parsed) &&
                parsed.length
            ) {

                return parsed
                    .map(
                        function (item) {

                            const name =
                                item.name ||
                                item["Tên sản phẩm"] ||
                                "";

                            const quantity =
                                Number(
                                    item.quantity ||
                                    item.qty ||
                                    0
                                );

                            const price =
                                Number(
                                    item.price || 0
                                );

                            return `

<div
    style="
        padding:10px 0;
        border-bottom:1px solid #e2e8f0;
    "
>

<div style="font-weight:800">
${escapeHtml(name)}
</div>

<div style="
    margin-top:4px;
    color:#64748b;
    font-size:11px;
">

${quantity} ×
${price.toLocaleString(
    "vi-VN"
)} ₫

</div>

</div>

`;

                        }
                    )
                    .join("");

            }

        }

        catch (error) {

            console.warn(
                "Không parse được Chi tiết sản phẩm:",
                error
            );

        }

    }

    return `
<div style="
    white-space:pre-wrap;
    color:#475569;
    font-size:12px;
">
${escapeHtml(
    order["Sản phẩm"] || "Không có dữ liệu"
)}
</div>
`;

}

// ============================================================
// CLOSE ORDER MODAL
// ============================================================

function closeOrderModal() {

    const modal =
        document.getElementById(
            "order-modal"
        );

    if (!modal) {

        return;

    }

    modal.classList.remove(
        "active"
    );

    modal.setAttribute(
        "aria-hidden",
        "true"
    );

}

// ============================================================
// ADMIN ERROR
// ============================================================

function showAdminError(
    message
) {

    const box =
        document.getElementById(
            "admin-error"
        );

    if (!box) {

        console.error(
            message
        );

        return;

    }

    box.textContent =
        String(
            message || ""
        );

    box.style.display =
        "block";

}

function hideAdminError() {

    const box =
        document.getElementById(
            "admin-error"
        );

    if (box) {

        box.textContent =
            "";

        box.style.display =
            "none";

    }

}

// ============================================================
// CLIENT BOOLEAN
// ============================================================

function toBooleanClient(
    value
) {

    if (value === true) {

        return true;

    }

    if (value === false) {

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
        text === "không"
    );

}

// ============================================================
// MONEY
// ============================================================

function formatMoneyClient(
    value
) {

    return (
        Number(
            value || 0
        ).toLocaleString(
            "vi-VN"
        ) +
        " ₫"
    );

}

// ============================================================
// HTML ESCAPE
// ============================================================

function escapeHtml(
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

// ============================================================
// JAVASCRIPT STRING ESCAPE
// ============================================================

function escapeJs(
    value
) {

    return String(
        value ?? ""
    )
        .replace(
            /\\/g,
            "\\\\"
        )
        .replace(
            /'/g,
            "\\'"
        )
        .replace(
            /"/g,
            '\\"'
        )
        .replace(
            /\r/g,
            "\\r"
        )
        .replace(
            /\n/g,
            "\\n"
        );

}

// ============================================================
// GLOBAL
// ============================================================

window.loginAdmin =
    loginAdmin;

window.logoutAdmin =
    logoutAdmin;

window.editProduct =
    editProduct;

window.deleteProduct =
    deleteProduct;

window.changeStatus =
    changeStatus;

window.showOrderDetail =
    showOrderDetail;

window.closeOrderModal =
    closeOrderModal;