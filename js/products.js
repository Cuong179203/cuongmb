
"use strict";

const API_URL =
    "https://script.google.com/macros/s/AKfycbxxQRkcRL5BrTEdH28baGNOIyYa-I2vKiYkbQ_ChiMICpqRLSayBpaCM_N44Kn8jtV3/exec";

let products = [];


// ========================================
// LOAD PRODUCTS
// ========================================

async function loadProducts() {

    try {

        console.log("Đang tải sản phẩm từ API...");

        const response = await fetch(
            API_URL +
            "?action=getProducts&t=" +
            Date.now()
        );

        if (!response.ok) {

            throw new Error(
                "HTTP " + response.status
            );

        }

        const data = await response.json();

        console.log(
            "PRODUCT API:",
            data
        );

        if (!data.success) {

            throw new Error(
                data.error ||
                "API trả về lỗi."
            );

        }

        products =
            Array.isArray(data.products)
                ? data.products.map(
                    normalizeProduct
                )
                : [];

        console.log(
            "Products loaded:",
            products
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
//
// CHỈ NHẬN:
//
// 1. Hình ảnh       -> ảnh chính
// 2. Hình ảnh phụ   -> ảnh phụ
//
// KHÔNG NHẬN:
//
// Hình ảnh 2
// Hình ảnh 3
// Hình ảnh 4
// Hình ảnh 5
// image2
// image3
// image4
// image5
// ========================================

function normalizeProduct(product) {

    product = product || {};


    // ====================================
    // ẢNH CHÍNH
    // ====================================

    const mainImage =
        String(
            product["Hình ảnh"] ??
            product.image ??
            ""
        ).trim();


    // ====================================
    // ẢNH PHỤ
    //
    // Chỉ lấy từ:
    //
    // Hình ảnh phụ
    // Ảnh phụ
    // images
    // subImages
    // sub_images
    //
    // KHÔNG lấy Hình ảnh 2/3/4/5
    // ====================================

    const subImages =
        normalizeSubImages(
            product["Hình ảnh phụ"] ??
            product["Ảnh phụ"] ??
            product.images ??
            product.subImages ??
            product.sub_images ??
            ""
        );


    // ====================================
    // TẠO GALLERY
    //
    // ẢNH CHÍNH luôn đứng đầu.
    //
    // Ảnh phụ đứng sau.
    //
    // Loại ảnh trùng.
    // ====================================

    const imageList = [];

    if (mainImage) {

        imageList.push(
            mainImage
        );

    }


    subImages.forEach(
        function (image) {

            if (
                image &&
                imageList.indexOf(image) === -1
            ) {

                imageList.push(
                    image
                );

            }

        }
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
            product.oldPrice ??
            0
        );


    // ====================================
    // GIẢM GIÁ
    // ====================================

    let discountPercent = 0;

    if (
        originalPrice > 0 &&
        price > 0 &&
        originalPrice > price
    ) {

        discountPercent =
            Math.round(
                (
                    1 -
                    price / originalPrice
                ) * 100
            );

    }


    // ====================================
    // THÔNG SỐ
    // ====================================

    const specifications =
        product["Thông số kỹ thuật"] ??
        product["Thông số KT"] ??
        product.specifications ??
        product.specs ??
        "";


    // ====================================
    // RETURN
    // ====================================

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
            Number.isFinite(price)
                ? price
                : 0,


        originalPrice:
            Number.isFinite(originalPrice)
                ? originalPrice
                : 0,


        discountPercent:
            discountPercent,


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
            ) || 0,


        // =================================
        // ẢNH CHÍNH
        // =================================

        image:
            mainImage,


        // =================================
        // GALLERY
        //
        // [ảnh chính, ảnh phụ 1, ảnh phụ 2...]
        // =================================

        images:
            imageList,


        // =================================
        // KHÔNG CÒN image2-image5
        // =================================


        offer:
            String(
                product["Ưu đãi"] ??
                product.offer ??
                product.promotion ??
                ""
            ).trim(),


        specifications:
            String(
                specifications
            ).trim(),


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


// ========================================
// NORMALIZE ẢNH PHỤ
// ========================================

function normalizeSubImages(value) {

    // ====================================
    // Nếu API trả Array
    // ====================================

    if (Array.isArray(value)) {

        return value
            .map(
                function (image) {

                    return String(
                        image ?? ""
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


    // ====================================
    // Nếu là JSON Array
    //
    // Ví dụ:
    //
    // ["url1","url2","url3"]
    // ====================================

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
                    function (image) {

                        return String(
                            image ?? ""
                        ).trim();

                    }
                )
                .filter(Boolean);

        }

    }

    catch (error) {

        // Không phải JSON
        // tiếp tục xử lý text

    }


    // ====================================
    // Nếu nhập mỗi URL một dòng
    // ====================================

    return text
        .split(/\r?\n/)
        .map(
            function (image) {

                return image.trim();

            }
        )
        .filter(Boolean);

}


// ========================================
// CHỜ PRODUCTS LOAD
// ========================================

window.productsReady =
    loadProducts();


// ========================================
// EXPORT
// ========================================

window.getProducts =
    function () {

        return products;

    };