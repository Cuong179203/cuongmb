
"use strict";


// ========================================
// API CONFIG
// ========================================

const API_URL =
    "https://script.google.com/macros/s/AKfycbxxQRkcRL5BrTEdH28baGNOIyYa-I2vKiYkbQ_ChiMICpqRLSayBpaCM_N44Kn8jtV3/exec";


// ========================================
// GLOBAL PRODUCTS
// ========================================

let products = [];


// ========================================
// LOAD PRODUCTS
// ========================================

async function loadProducts() {

    try {

        console.log(
            "========================================"
        );

        console.log(
            "CƯỜNG MOBILE - PRODUCTS.JS"
        );

        console.log(
            "Đang tải sản phẩm từ API..."
        );

        const response =
            await fetch(
                API_URL +
                "?action=getProducts&t=" +
                Date.now()
            );


        // ====================================
        // HTTP CHECK
        // ====================================

        if (!response.ok) {

            throw new Error(
                "HTTP " +
                response.status
            );

        }


        // ====================================
        // READ RESPONSE
        // ====================================

        const text =
            await response.text();


        console.log(
            "PRODUCT API RAW:",
            text
        );


        // ====================================
        // PARSE JSON
        // ====================================

        let data;

        try {

            data =
                JSON.parse(
                    text
                );

        }

        catch (error) {

            console.error(
                "API không trả về JSON:",
                text
            );

            throw new Error(
                "API không trả về JSON hợp lệ."
            );

        }


        console.log(
            "PRODUCT API:",
            data
        );


        // ====================================
        // API SUCCESS CHECK
        // ====================================

        if (
            !data ||
            data.success !== true
        ) {

            throw new Error(
                data &&
                    data.error
                    ? data.error
                    : "API trả về lỗi."
            );

        }


        // ====================================
        // NORMALIZE PRODUCTS
        // ====================================

        products =
            Array.isArray(
                data.products
            )
                ? data.products.map(
                    normalizeProduct
                )
                : [];


        console.log(
            "Products loaded:",
            products
        );


        console.log(
            "Tổng sản phẩm:",
            products.length
        );


        // ====================================
        // DEBUG IMAGE DATA
        // ====================================

        products.forEach(
            function (product) {

                console.log(
                    "PRODUCT IMAGE DATA:",
                    {
                        id:
                            product.id,

                        name:
                            product.name,

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


        console.log(
            "========================================"
        );


        return products;

    }

    catch (error) {

        console.error(
            "LOAD PRODUCTS ERROR:",
            error
        );


        products = [];


        throw error;

    }

}


// ========================================
// NORMALIZE PRODUCT
// ========================================

function normalizeProduct(
    product
) {

    product =
        product || {};


    // ====================================
    // IMAGE LIST
    // ====================================

    const imageList = [];


    // ====================================
    // ADD IMAGE HELPER
    // ====================================

    function addImage(
        image
    ) {

        if (
            image === null ||
            image === undefined
        ) {

            return;

        }


        // ==================================
        // ARRAY
        // ==================================

        if (
            Array.isArray(image)
        ) {

            image.forEach(
                function (item) {

                    addImage(
                        item
                    );

                }
            );

            return;

        }


        const text =
            String(
                image
            ).trim();


        if (!text) {

            return;

        }


        // ==================================
        // JSON ARRAY
        // ==================================

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

                parsed.forEach(
                    function (item) {

                        addImage(
                            item
                        );

                    }
                );

                return;

            }

        }

        catch (error) {

            // Không phải JSON
            // tiếp tục xử lý text
        }


        // ==================================
        // MULTIPLE URL
        //
        // Hình ảnh phụ trong Google Sheet
        // đang được admin-products.js lưu:
        //
        // URL 1
        // URL 2
        // URL 3
        //
        // ==================================

        const lines =
            text.split(
                /\r?\n/
            );


        lines.forEach(
            function (line) {

                const value =
                    String(
                        line || ""
                    ).trim();


                if (
                    !value
                ) {

                    return;

                }


                if (
                    imageList.indexOf(
                        value
                    ) === -1
                ) {

                    imageList.push(
                        value
                    );

                }

            }
        );

    }


    // ====================================
    // MAIN IMAGE
    // ====================================

    addImage(
        product["Hình ảnh"]
    );


    addImage(
        product.image
    );


    // ====================================
    // MAIN IMAGE - OLD FORMAT
    // ====================================

    addImage(
        product["Hình ảnh 2"]
    );

    addImage(
        product.image2
    );


    addImage(
        product["Hình ảnh 3"]
    );

    addImage(
        product.image3
    );


    addImage(
        product["Hình ảnh 4"]
    );

    addImage(
        product.image4
    );


    addImage(
        product["Hình ảnh 5"]
    );

    addImage(
        product.image5
    );


    // ====================================
    // ⭐ IMAGE PHỤ
    //
    // CODE.GS:
    //
    // product["Hình ảnh phụ"]
    //
    // ADMIN:
    //
    // product.images
    //
    // ====================================

    addImage(
        product["Hình ảnh phụ"]
    );


    addImage(
        product["Ảnh phụ"]
    );


    addImage(
        product.images
    );

    addImage(
        product.gallery
    );


    addImage(
        product.subImages
    );


    addImage(
        product.sub_images
    );


    // ====================================
    // GIÁ
    // ====================================

    const price =
        Number(
            product["Giá"] ??
            product.price ??
            0
        );


    const originalPrice =
        Number(
            product["Giá gốc"] ??
            product.originalPrice ??
            product.original_price ??
            product.oldPrice ??
            0
        );


    // ====================================
    // PHẦN TRĂM GIẢM
    // ====================================

    let discountPercent =
        0;


    if (
        originalPrice > 0 &&
        price > 0 &&
        originalPrice > price
    ) {

        discountPercent =
            Math.round(
                (
                    1 -
                    price /
                    originalPrice
                ) *
                100
            );

    }


    // ====================================
    // THÔNG SỐ KỸ THUẬT
    // ====================================

    const specifications =
        product["Thông số kỹ thuật"] ??
        product["Thông số KT"] ??
        product.specifications ??
        product.specs ??
        "";


    // ====================================
    // ƯU ĐÃI
    // ====================================

    const offer =
        product["Ưu đãi"] ??
        product.offer ??
        product.promotion ??
        product.promotions ??
        "";


    // ====================================
    // MÔ TẢ
    // ====================================

    const description =
        product["Mô tả"] ??
        product.description ??
        "";


    // ====================================
    // VISIBLE
    // ====================================

    const visible =
        product["Hiển thị"] ??
        product.visible ??
        true;


    // ====================================
    // RETURN NORMALIZED PRODUCT
    // ====================================

    return {

        // ==================================
        // BASIC
        // ==================================

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


        category:
            String(
                product["Danh mục"] ??
                product.category ??
                ""
            ).trim(),


        // ==================================
        // PRICE
        // ==================================

        price:
            Number.isFinite(
                price
            )
                ? price
                : 0,


        originalPrice:
            Number.isFinite(
                originalPrice
            )
                ? originalPrice
                : 0,


        discountPercent:
            discountPercent,


        // ==================================
        // STOCK
        // ==================================

        stock:
            Number(
                product["Tồn kho"] ??
                product.stock ??
                0
            ) || 0,


        // ==================================
        // ⭐ MAIN IMAGE
        // ==================================

        image:
            imageList.length > 0
                ? imageList[0]
                : "",


        // ==================================
        // ⭐ ALL IMAGES
        //
        // images[0] = ảnh chính
        // images[1] = ảnh phụ 1
        // images[2] = ảnh phụ 2
        // ...
        // ==================================

        images:
            imageList,


        gallery:
            imageList,


        // ==================================
        // OLD IMAGE FIELDS
        //
        // Giữ lại để code cũ không lỗi
        // ==================================

        image2:
            imageList[1] || "",


        image3:
            imageList[2] || "",


        image4:
            imageList[3] || "",


        image5:
            imageList[4] || "",


        // ==================================
        // OFFER
        // ==================================

        offer:
            String(
                offer
            ).trim(),


        discount:
            String(
                product.discount ??
                product.promotion ??
                ""
            ).trim(),


        // ==================================
        // SPECIFICATIONS
        // ==================================

        specifications:
            String(
                specifications
            ).trim(),


        // ==================================
        // DESCRIPTION
        // ==================================

        description:
            String(
                description
            ).trim(),


        // ==================================
        // VISIBLE
        // ==================================

        visible:
            visible

    };

}


// ========================================
// FIND PRODUCT BY ID
// ========================================

function getProductById(
    id
) {

    const targetId =
        String(
            id ?? ""
        ).trim();


    if (!targetId) {

        return null;

    }


    return products.find(
        function (product) {

            return String(
                product.id
            ).trim() ===
                targetId;

        }
    ) || null;

}


// ========================================
// FIND PRODUCT BY NAME
// ========================================

function getProductByName(
    name
) {

    const targetName =
        String(
            name ?? ""
        )
            .trim()
            .toLowerCase();


    if (!targetName) {

        return null;

    }


    return products.find(
        function (product) {

            return String(
                product.name
            )
                .trim()
                .toLowerCase() ===
                targetName;

        }
    ) || null;

}


// ========================================
// GET PRODUCT
//
// Hỗ trợ:
// ?id=SP001
//
// hoặc:
// ?product=SP001
// ========================================

function findProductFromUrl() {

    try {

        const params =
            new URLSearchParams(
                window.location.search
            );


        const id =
            params.get(
                "id"
            ) ||
            params.get(
                "product"
            ) ||
            params.get(
                "productId"
            );


        if (!id) {

            return null;

        }


        return getProductById(
            id
        );

    }

    catch (error) {

        console.error(
            "URL PRODUCT ERROR:",
            error
        );

        return null;

    }

}


// ========================================
// WAIT PRODUCTS LOAD
// ========================================

window.productsReady =
    loadProducts();


// ========================================
// EXPORT PRODUCTS
// ========================================

window.getProducts =
    function () {

        return products;

    };


// ========================================
// EXPORT PRODUCT BY ID
// ========================================

window.getProductById =
    getProductById;


// ========================================
// EXPORT PRODUCT BY NAME
// ========================================

window.getProductByName =
    getProductByName;


// ========================================
// EXPORT FIND PRODUCT FROM URL
// ========================================

window.findProductFromUrl =
    findProductFromUrl;


// ========================================
// DEBUG EXPORT
// ========================================

window.CuongMobileProducts =
{

    getAll:
        function () {

            return products;

        },


    getById:
        function (id) {

            return getProductById(
                id
            );

        },


    getByName:
        function (name) {

            return getProductByName(
                name
            );

        }

};