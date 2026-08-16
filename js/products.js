// ========================================
// CƯỜNG MOBILE
// PRODUCTS.JS
// ========================================

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

        const data =
            await response.json();

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

    } catch (error) {

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

function normalizeProduct(product) {

    const imageList = [];

    const possibleImages = [

        product["Hình ảnh"],
        product.image,

        product["Hình ảnh 2"],
        product.image2,

        product["Hình ảnh 3"],
        product.image3,

        product["Hình ảnh 4"],
        product.image4,

        product["Hình ảnh 5"],
        product.image5

    ];

    possibleImages.forEach(function (image) {

        const value =
            String(
                image ?? ""
            ).trim();

        if (
            value &&
            imageList.indexOf(value) === -1
        ) {

            imageList.push(value);

        }

    });


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
    // TÍNH PHẦN TRĂM GIẢM
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


        image:
            imageList.length > 0
                ? imageList[0]
                : "",


        images:
            imageList,


        image2:
            imageList[1] || "",

        image3:
            imageList[2] || "",

        image4:
            imageList[3] || "",

        image5:
            imageList[4] || "",


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