"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "app/api/story/upload/route";
exports.ids = ["app/api/story/upload/route"];
exports.modules = {

/***/ "firebase-admin":
/*!*********************************!*\
  !*** external "firebase-admin" ***!
  \*********************************/
/***/ ((module) => {

module.exports = require("firebase-admin");

/***/ }),

/***/ "next/dist/compiled/next-server/app-page.runtime.dev.js":
/*!*************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-page.runtime.dev.js" ***!
  \*************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/compiled/next-server/app-page.runtime.dev.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-route.runtime.dev.js":
/*!**************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-route.runtime.dev.js" ***!
  \**************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/compiled/next-server/app-route.runtime.dev.js");

/***/ }),

/***/ "crypto":
/*!*************************!*\
  !*** external "crypto" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("crypto");

/***/ }),

/***/ "fs":
/*!*********************!*\
  !*** external "fs" ***!
  \*********************/
/***/ ((module) => {

module.exports = require("fs");

/***/ }),

/***/ "http":
/*!***********************!*\
  !*** external "http" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("http");

/***/ }),

/***/ "https":
/*!************************!*\
  !*** external "https" ***!
  \************************/
/***/ ((module) => {

module.exports = require("https");

/***/ }),

/***/ "path":
/*!***********************!*\
  !*** external "path" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("path");

/***/ }),

/***/ "querystring":
/*!******************************!*\
  !*** external "querystring" ***!
  \******************************/
/***/ ((module) => {

module.exports = require("querystring");

/***/ }),

/***/ "stream":
/*!*************************!*\
  !*** external "stream" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("stream");

/***/ }),

/***/ "url":
/*!**********************!*\
  !*** external "url" ***!
  \**********************/
/***/ ((module) => {

module.exports = require("url");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fstory%2Fupload%2Froute&page=%2Fapi%2Fstory%2Fupload%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fstory%2Fupload%2Froute.ts&appDir=C%3A%5Cxampp%5Chtdocs%5CHallo%5Csrc%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5Cxampp%5Chtdocs%5CHallo&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!":
/*!**************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fstory%2Fupload%2Froute&page=%2Fapi%2Fstory%2Fupload%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fstory%2Fupload%2Froute.ts&appDir=C%3A%5Cxampp%5Chtdocs%5CHallo%5Csrc%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5Cxampp%5Chtdocs%5CHallo&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D! ***!
  \**************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   originalPathname: () => (/* binding */ originalPathname),\n/* harmony export */   patchFetch: () => (/* binding */ patchFetch),\n/* harmony export */   requestAsyncStorage: () => (/* binding */ requestAsyncStorage),\n/* harmony export */   routeModule: () => (/* binding */ routeModule),\n/* harmony export */   serverHooks: () => (/* binding */ serverHooks),\n/* harmony export */   staticGenerationAsyncStorage: () => (/* binding */ staticGenerationAsyncStorage)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/future/route-modules/app-route/module.compiled */ \"(rsc)/./node_modules/next/dist/server/future/route-modules/app-route/module.compiled.js\");\n/* harmony import */ var next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_future_route_kind__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/future/route-kind */ \"(rsc)/./node_modules/next/dist/server/future/route-kind.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/dist/server/lib/patch-fetch */ \"(rsc)/./node_modules/next/dist/server/lib/patch-fetch.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var C_xampp_htdocs_Hallo_src_app_api_story_upload_route_ts__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./src/app/api/story/upload/route.ts */ \"(rsc)/./src/app/api/story/upload/route.ts\");\n\n\n\n\n// We inject the nextConfigOutput here so that we can use them in the route\n// module.\nconst nextConfigOutput = \"\"\nconst routeModule = new next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__.AppRouteRouteModule({\n    definition: {\n        kind: next_dist_server_future_route_kind__WEBPACK_IMPORTED_MODULE_1__.RouteKind.APP_ROUTE,\n        page: \"/api/story/upload/route\",\n        pathname: \"/api/story/upload\",\n        filename: \"route\",\n        bundlePath: \"app/api/story/upload/route\"\n    },\n    resolvedPagePath: \"C:\\\\xampp\\\\htdocs\\\\Hallo\\\\src\\\\app\\\\api\\\\story\\\\upload\\\\route.ts\",\n    nextConfigOutput,\n    userland: C_xampp_htdocs_Hallo_src_app_api_story_upload_route_ts__WEBPACK_IMPORTED_MODULE_3__\n});\n// Pull out the exports that we need to expose from the module. This should\n// be eliminated when we've moved the other routes to the new format. These\n// are used to hook into the route.\nconst { requestAsyncStorage, staticGenerationAsyncStorage, serverHooks } = routeModule;\nconst originalPathname = \"/api/story/upload/route\";\nfunction patchFetch() {\n    return (0,next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__.patchFetch)({\n        serverHooks,\n        staticGenerationAsyncStorage\n    });\n}\n\n\n//# sourceMappingURL=app-route.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvbmV4dC9kaXN0L2J1aWxkL3dlYnBhY2svbG9hZGVycy9uZXh0LWFwcC1sb2FkZXIuanM/bmFtZT1hcHAlMkZhcGklMkZzdG9yeSUyRnVwbG9hZCUyRnJvdXRlJnBhZ2U9JTJGYXBpJTJGc3RvcnklMkZ1cGxvYWQlMkZyb3V0ZSZhcHBQYXRocz0mcGFnZVBhdGg9cHJpdmF0ZS1uZXh0LWFwcC1kaXIlMkZhcGklMkZzdG9yeSUyRnVwbG9hZCUyRnJvdXRlLnRzJmFwcERpcj1DJTNBJTVDeGFtcHAlNUNodGRvY3MlNUNIYWxsbyU1Q3NyYyU1Q2FwcCZwYWdlRXh0ZW5zaW9ucz10c3gmcGFnZUV4dGVuc2lvbnM9dHMmcGFnZUV4dGVuc2lvbnM9anN4JnBhZ2VFeHRlbnNpb25zPWpzJnJvb3REaXI9QyUzQSU1Q3hhbXBwJTVDaHRkb2NzJTVDSGFsbG8maXNEZXY9dHJ1ZSZ0c2NvbmZpZ1BhdGg9dHNjb25maWcuanNvbiZiYXNlUGF0aD0mYXNzZXRQcmVmaXg9Jm5leHRDb25maWdPdXRwdXQ9JnByZWZlcnJlZFJlZ2lvbj0mbWlkZGxld2FyZUNvbmZpZz1lMzAlM0QhIiwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQUFzRztBQUN2QztBQUNjO0FBQ2dCO0FBQzdGO0FBQ0E7QUFDQTtBQUNBLHdCQUF3QixnSEFBbUI7QUFDM0M7QUFDQSxjQUFjLHlFQUFTO0FBQ3ZCO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQSxZQUFZO0FBQ1osQ0FBQztBQUNEO0FBQ0E7QUFDQTtBQUNBLFFBQVEsaUVBQWlFO0FBQ3pFO0FBQ0E7QUFDQSxXQUFXLDRFQUFXO0FBQ3RCO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDdUg7O0FBRXZIIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vaGFsbG8vPzFkOWYiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQXBwUm91dGVSb3V0ZU1vZHVsZSB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL2Z1dHVyZS9yb3V0ZS1tb2R1bGVzL2FwcC1yb3V0ZS9tb2R1bGUuY29tcGlsZWRcIjtcbmltcG9ydCB7IFJvdXRlS2luZCB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL2Z1dHVyZS9yb3V0ZS1raW5kXCI7XG5pbXBvcnQgeyBwYXRjaEZldGNoIGFzIF9wYXRjaEZldGNoIH0gZnJvbSBcIm5leHQvZGlzdC9zZXJ2ZXIvbGliL3BhdGNoLWZldGNoXCI7XG5pbXBvcnQgKiBhcyB1c2VybGFuZCBmcm9tIFwiQzpcXFxceGFtcHBcXFxcaHRkb2NzXFxcXEhhbGxvXFxcXHNyY1xcXFxhcHBcXFxcYXBpXFxcXHN0b3J5XFxcXHVwbG9hZFxcXFxyb3V0ZS50c1wiO1xuLy8gV2UgaW5qZWN0IHRoZSBuZXh0Q29uZmlnT3V0cHV0IGhlcmUgc28gdGhhdCB3ZSBjYW4gdXNlIHRoZW0gaW4gdGhlIHJvdXRlXG4vLyBtb2R1bGUuXG5jb25zdCBuZXh0Q29uZmlnT3V0cHV0ID0gXCJcIlxuY29uc3Qgcm91dGVNb2R1bGUgPSBuZXcgQXBwUm91dGVSb3V0ZU1vZHVsZSh7XG4gICAgZGVmaW5pdGlvbjoge1xuICAgICAgICBraW5kOiBSb3V0ZUtpbmQuQVBQX1JPVVRFLFxuICAgICAgICBwYWdlOiBcIi9hcGkvc3RvcnkvdXBsb2FkL3JvdXRlXCIsXG4gICAgICAgIHBhdGhuYW1lOiBcIi9hcGkvc3RvcnkvdXBsb2FkXCIsXG4gICAgICAgIGZpbGVuYW1lOiBcInJvdXRlXCIsXG4gICAgICAgIGJ1bmRsZVBhdGg6IFwiYXBwL2FwaS9zdG9yeS91cGxvYWQvcm91dGVcIlxuICAgIH0sXG4gICAgcmVzb2x2ZWRQYWdlUGF0aDogXCJDOlxcXFx4YW1wcFxcXFxodGRvY3NcXFxcSGFsbG9cXFxcc3JjXFxcXGFwcFxcXFxhcGlcXFxcc3RvcnlcXFxcdXBsb2FkXFxcXHJvdXRlLnRzXCIsXG4gICAgbmV4dENvbmZpZ091dHB1dCxcbiAgICB1c2VybGFuZFxufSk7XG4vLyBQdWxsIG91dCB0aGUgZXhwb3J0cyB0aGF0IHdlIG5lZWQgdG8gZXhwb3NlIGZyb20gdGhlIG1vZHVsZS4gVGhpcyBzaG91bGRcbi8vIGJlIGVsaW1pbmF0ZWQgd2hlbiB3ZSd2ZSBtb3ZlZCB0aGUgb3RoZXIgcm91dGVzIHRvIHRoZSBuZXcgZm9ybWF0LiBUaGVzZVxuLy8gYXJlIHVzZWQgdG8gaG9vayBpbnRvIHRoZSByb3V0ZS5cbmNvbnN0IHsgcmVxdWVzdEFzeW5jU3RvcmFnZSwgc3RhdGljR2VuZXJhdGlvbkFzeW5jU3RvcmFnZSwgc2VydmVySG9va3MgfSA9IHJvdXRlTW9kdWxlO1xuY29uc3Qgb3JpZ2luYWxQYXRobmFtZSA9IFwiL2FwaS9zdG9yeS91cGxvYWQvcm91dGVcIjtcbmZ1bmN0aW9uIHBhdGNoRmV0Y2goKSB7XG4gICAgcmV0dXJuIF9wYXRjaEZldGNoKHtcbiAgICAgICAgc2VydmVySG9va3MsXG4gICAgICAgIHN0YXRpY0dlbmVyYXRpb25Bc3luY1N0b3JhZ2VcbiAgICB9KTtcbn1cbmV4cG9ydCB7IHJvdXRlTW9kdWxlLCByZXF1ZXN0QXN5bmNTdG9yYWdlLCBzdGF0aWNHZW5lcmF0aW9uQXN5bmNTdG9yYWdlLCBzZXJ2ZXJIb29rcywgb3JpZ2luYWxQYXRobmFtZSwgcGF0Y2hGZXRjaCwgIH07XG5cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWFwcC1yb3V0ZS5qcy5tYXAiXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fstory%2Fupload%2Froute&page=%2Fapi%2Fstory%2Fupload%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fstory%2Fupload%2Froute.ts&appDir=C%3A%5Cxampp%5Chtdocs%5CHallo%5Csrc%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5Cxampp%5Chtdocs%5CHallo&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!\n");

/***/ }),

/***/ "(rsc)/./src/app/api/story/upload/route.ts":
/*!*******************************************!*\
  !*** ./src/app/api/story/upload/route.ts ***!
  \*******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   POST: () => (/* binding */ POST)\n/* harmony export */ });\n/* harmony import */ var next_server__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/server */ \"(rsc)/./node_modules/next/dist/api/server.js\");\n/* harmony import */ var _firebase_admin__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @/firebase/admin */ \"(rsc)/./src/firebase/admin.ts\");\n/* harmony import */ var uuid__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! uuid */ \"(rsc)/./node_modules/uuid/dist/esm/v4.js\");\n/* harmony import */ var _lib_cloudinary__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @/lib/cloudinary */ \"(rsc)/./src/lib/cloudinary.ts\");\n\n\n\n\nasync function POST(request) {\n    try {\n        // Log debug untuk memastikan variabel environment terload\n        console.log(\"Cloudinary Config:\", {\n            cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? \"Set\" : \"Not Set\",\n            api_key: process.env.CLOUDINARY_API_KEY ? \"Set\" : \"Not Set\",\n            api_secret: process.env.CLOUDINARY_API_SECRET ? \"Set\" : \"Not Set\"\n        });\n        // Verifikasi token Firebase\n        const authHeader = request.headers.get(\"Authorization\");\n        if (!authHeader || !authHeader.startsWith(\"Bearer \")) {\n            return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                error: \"Unauthorized\"\n            }, {\n                status: 401\n            });\n        }\n        const idToken = authHeader.split(\"Bearer \")[1];\n        // Verifikasi token\n        const decodedToken = await _firebase_admin__WEBPACK_IMPORTED_MODULE_1__.auth.verifyIdToken(idToken);\n        const userId = decodedToken.uid;\n        // Dapatkan data form\n        const formData = await request.formData();\n        const file = formData.get(\"file\");\n        const caption = formData.get(\"caption\") || \"\";\n        const resourceType = formData.get(\"resourceType\") || \"image\";\n        if (!file) {\n            return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                error: \"No file provided\"\n            }, {\n                status: 400\n            });\n        }\n        // Baca file sebagai buffer untuk Cloudinary\n        const buffer = Buffer.from(await file.arrayBuffer());\n        const storyId = (0,uuid__WEBPACK_IMPORTED_MODULE_3__[\"default\"])();\n        // Upload ke Cloudinary dengan metode alternatif (yang lebih sederhana daripada streams)\n        const uploadResult = await new Promise((resolve, reject)=>{\n            // Convert buffer ke base64 untuk Cloudinary\n            const base64Data = buffer.toString(\"base64\");\n            const dataURI = `data:${file.type};base64,${base64Data}`;\n            _lib_cloudinary__WEBPACK_IMPORTED_MODULE_2__[\"default\"].uploader.upload(dataURI, {\n                folder: \"hallo-stories\",\n                public_id: `${userId}_${storyId}`,\n                resource_type: resourceType === \"video\" ? \"video\" : \"image\"\n            }, (error, result)=>{\n                if (error) {\n                    reject(error);\n                    return;\n                }\n                resolve(result);\n            });\n        });\n        // @ts-ignore - result akan mengandung beberapa properti Cloudinary\n        const url = uploadResult.secure_url;\n        // @ts-ignore - untuk video, Cloudinary akan mengembalikan durasi dalam detik\n        const duration = resourceType === \"video\" ? uploadResult.duration : undefined;\n        // Simpan referensi ke Firestore\n        const storyRef = _firebase_admin__WEBPACK_IMPORTED_MODULE_1__.firestore.collection(\"stories\").doc();\n        // Set timestamp saat ini\n        const now = new Date();\n        // Set juga waktu kedaluwarsa (expiry) untuk memudahkan penghapusan otomatis\n        const expiryTime = new Date(now);\n        expiryTime.setHours(expiryTime.getHours() + 24); // Tambah 24 jam dari sekarang\n        await storyRef.set({\n            userId,\n            imageUrl: url,\n            caption,\n            timestamp: now,\n            expiryTime: expiryTime,\n            resourceType,\n            ...duration && {\n                duration\n            }\n        });\n        // Set TTL (Time to Live) pada dokumen untuk otomatis dihapus setelah 24 jam\n        // Catatan: Ini memerlukan Firestore TTL yang dikonfigurasi atau fungsi Cloud yang dijadwalkan\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            success: true,\n            storyId: storyRef.id\n        });\n    } catch (error) {\n        console.error(\"Error uploading story:\", error);\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            error: \"Failed to upload story\"\n        }, {\n            status: 500\n        });\n    }\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,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RSxZQUFZQTtZQUNaN0I7WUFDQSxHQUFJc0IsWUFBWTtnQkFBRUE7WUFBUyxDQUFDO1FBQzlCO1FBRUEsNEVBQTRFO1FBQzVFLDhGQUE4RjtRQUU5RixPQUFPeEQscURBQVlBLENBQUNzQixJQUFJLENBQUM7WUFBRStDLFNBQVM7WUFBTTlCLFNBQVNtQixTQUFTWSxFQUFFO1FBQUM7SUFDakUsRUFBRSxPQUFPL0MsT0FBTztRQUNkZixRQUFRZSxLQUFLLENBQUMsMEJBQTBCQTtRQUN4QyxPQUFPdkIscURBQVlBLENBQUNzQixJQUFJLENBQUM7WUFBRUMsT0FBTztRQUF5QixHQUFHO1lBQUVDLFFBQVE7UUFBSTtJQUM5RTtBQUNGIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vaGFsbG8vLi9zcmMvYXBwL2FwaS9zdG9yeS91cGxvYWQvcm91dGUudHM/ZmJjZSJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBOZXh0UmVxdWVzdCwgTmV4dFJlc3BvbnNlIH0gZnJvbSAnbmV4dC9zZXJ2ZXInO1xyXG5pbXBvcnQgeyBhdXRoLCBmaXJlc3RvcmUgfSBmcm9tICdAL2ZpcmViYXNlL2FkbWluJztcclxuaW1wb3J0IHsgdjQgYXMgdXVpZHY0IH0gZnJvbSAndXVpZCc7XHJcbmltcG9ydCBjbG91ZGluYXJ5IGZyb20gJ0AvbGliL2Nsb3VkaW5hcnknO1xyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIFBPU1QocmVxdWVzdDogTmV4dFJlcXVlc3QpIHtcclxuICB0cnkge1xyXG4gICAgLy8gTG9nIGRlYnVnIHVudHVrIG1lbWFzdGlrYW4gdmFyaWFiZWwgZW52aXJvbm1lbnQgdGVybG9hZFxyXG4gICAgY29uc29sZS5sb2coJ0Nsb3VkaW5hcnkgQ29uZmlnOicsIHtcclxuICAgICAgY2xvdWRfbmFtZTogcHJvY2Vzcy5lbnYuQ0xPVURJTkFSWV9DTE9VRF9OQU1FID8gJ1NldCcgOiAnTm90IFNldCcsXHJcbiAgICAgIGFwaV9rZXk6IHByb2Nlc3MuZW52LkNMT1VESU5BUllfQVBJX0tFWSA/ICdTZXQnIDogJ05vdCBTZXQnLFxyXG4gICAgICBhcGlfc2VjcmV0OiBwcm9jZXNzLmVudi5DTE9VRElOQVJZX0FQSV9TRUNSRVQgPyAnU2V0JyA6ICdOb3QgU2V0JyxcclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICAvLyBWZXJpZmlrYXNpIHRva2VuIEZpcmViYXNlXHJcbiAgICBjb25zdCBhdXRoSGVhZGVyID0gcmVxdWVzdC5oZWFkZXJzLmdldCgnQXV0aG9yaXphdGlvbicpO1xyXG4gICAgXHJcbiAgICBpZiAoIWF1dGhIZWFkZXIgfHwgIWF1dGhIZWFkZXIuc3RhcnRzV2l0aCgnQmVhcmVyICcpKSB7XHJcbiAgICAgIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbih7IGVycm9yOiAnVW5hdXRob3JpemVkJyB9LCB7IHN0YXR1czogNDAxIH0pO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBjb25zdCBpZFRva2VuID0gYXV0aEhlYWRlci5zcGxpdCgnQmVhcmVyICcpWzFdO1xyXG4gICAgXHJcbiAgICAvLyBWZXJpZmlrYXNpIHRva2VuXHJcbiAgICBjb25zdCBkZWNvZGVkVG9rZW4gPSBhd2FpdCBhdXRoLnZlcmlmeUlkVG9rZW4oaWRUb2tlbik7XHJcbiAgICBjb25zdCB1c2VySWQgPSBkZWNvZGVkVG9rZW4udWlkO1xyXG4gICAgXHJcbiAgICAvLyBEYXBhdGthbiBkYXRhIGZvcm1cclxuICAgIGNvbnN0IGZvcm1EYXRhID0gYXdhaXQgcmVxdWVzdC5mb3JtRGF0YSgpO1xyXG4gICAgY29uc3QgZmlsZSA9IGZvcm1EYXRhLmdldCgnZmlsZScpIGFzIEZpbGUgfCBudWxsO1xyXG4gICAgY29uc3QgY2FwdGlvbiA9IGZvcm1EYXRhLmdldCgnY2FwdGlvbicpIGFzIHN0cmluZyB8fCAnJztcclxuICAgIGNvbnN0IHJlc291cmNlVHlwZSA9IGZvcm1EYXRhLmdldCgncmVzb3VyY2VUeXBlJykgYXMgc3RyaW5nIHx8ICdpbWFnZSc7XHJcbiAgICBcclxuICAgIGlmICghZmlsZSkge1xyXG4gICAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oeyBlcnJvcjogJ05vIGZpbGUgcHJvdmlkZWQnIH0sIHsgc3RhdHVzOiA0MDAgfSk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8vIEJhY2EgZmlsZSBzZWJhZ2FpIGJ1ZmZlciB1bnR1ayBDbG91ZGluYXJ5XHJcbiAgICBjb25zdCBidWZmZXIgPSBCdWZmZXIuZnJvbShhd2FpdCBmaWxlLmFycmF5QnVmZmVyKCkpO1xyXG4gICAgY29uc3Qgc3RvcnlJZCA9IHV1aWR2NCgpO1xyXG4gICAgXHJcbiAgICAvLyBVcGxvYWQga2UgQ2xvdWRpbmFyeSBkZW5nYW4gbWV0b2RlIGFsdGVybmF0aWYgKHlhbmcgbGViaWggc2VkZXJoYW5hIGRhcmlwYWRhIHN0cmVhbXMpXHJcbiAgICBjb25zdCB1cGxvYWRSZXN1bHQgPSBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgIC8vIENvbnZlcnQgYnVmZmVyIGtlIGJhc2U2NCB1bnR1ayBDbG91ZGluYXJ5XHJcbiAgICAgIGNvbnN0IGJhc2U2NERhdGEgPSBidWZmZXIudG9TdHJpbmcoJ2Jhc2U2NCcpO1xyXG4gICAgICBjb25zdCBkYXRhVVJJID0gYGRhdGE6JHtmaWxlLnR5cGV9O2Jhc2U2NCwke2Jhc2U2NERhdGF9YDtcclxuICAgICAgXHJcbiAgICAgIGNsb3VkaW5hcnkudXBsb2FkZXIudXBsb2FkKFxyXG4gICAgICAgIGRhdGFVUkksXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgZm9sZGVyOiAnaGFsbG8tc3RvcmllcycsXHJcbiAgICAgICAgICBwdWJsaWNfaWQ6IGAke3VzZXJJZH1fJHtzdG9yeUlkfWAsXHJcbiAgICAgICAgICByZXNvdXJjZV90eXBlOiByZXNvdXJjZVR5cGUgPT09ICd2aWRlbycgPyAndmlkZW8nIDogJ2ltYWdlJyxcclxuICAgICAgICB9LFxyXG4gICAgICAgIChlcnJvciwgcmVzdWx0KSA9PiB7XHJcbiAgICAgICAgICBpZiAoZXJyb3IpIHtcclxuICAgICAgICAgICAgcmVqZWN0KGVycm9yKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgcmVzb2x2ZShyZXN1bHQpO1xyXG4gICAgICAgIH1cclxuICAgICAgKTtcclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICAvLyBAdHMtaWdub3JlIC0gcmVzdWx0IGFrYW4gbWVuZ2FuZHVuZyBiZWJlcmFwYSBwcm9wZXJ0aSBDbG91ZGluYXJ5XHJcbiAgICBjb25zdCB1cmwgPSB1cGxvYWRSZXN1bHQuc2VjdXJlX3VybDtcclxuICAgIC8vIEB0cy1pZ25vcmUgLSB1bnR1ayB2aWRlbywgQ2xvdWRpbmFyeSBha2FuIG1lbmdlbWJhbGlrYW4gZHVyYXNpIGRhbGFtIGRldGlrXHJcbiAgICBjb25zdCBkdXJhdGlvbiA9IHJlc291cmNlVHlwZSA9PT0gJ3ZpZGVvJyA/IHVwbG9hZFJlc3VsdC5kdXJhdGlvbiA6IHVuZGVmaW5lZDtcclxuICAgIFxyXG4gICAgLy8gU2ltcGFuIHJlZmVyZW5zaSBrZSBGaXJlc3RvcmVcclxuICAgIGNvbnN0IHN0b3J5UmVmID0gZmlyZXN0b3JlLmNvbGxlY3Rpb24oJ3N0b3JpZXMnKS5kb2MoKTtcclxuICAgIFxyXG4gICAgLy8gU2V0IHRpbWVzdGFtcCBzYWF0IGluaVxyXG4gICAgY29uc3Qgbm93ID0gbmV3IERhdGUoKTtcclxuICAgIFxyXG4gICAgLy8gU2V0IGp1Z2Egd2FrdHUga2VkYWx1d2Fyc2EgKGV4cGlyeSkgdW50dWsgbWVtdWRhaGthbiBwZW5naGFwdXNhbiBvdG9tYXRpc1xyXG4gICAgY29uc3QgZXhwaXJ5VGltZSA9IG5ldyBEYXRlKG5vdyk7XHJcbiAgICBleHBpcnlUaW1lLnNldEhvdXJzKGV4cGlyeVRpbWUuZ2V0SG91cnMoKSArIDI0KTsgLy8gVGFtYmFoIDI0IGphbSBkYXJpIHNla2FyYW5nXHJcbiAgICBcclxuICAgIGF3YWl0IHN0b3J5UmVmLnNldCh7XHJcbiAgICAgIHVzZXJJZCxcclxuICAgICAgaW1hZ2VVcmw6IHVybCxcclxuICAgICAgY2FwdGlvbixcclxuICAgICAgdGltZXN0YW1wOiBub3csXHJcbiAgICAgIGV4cGlyeVRpbWU6IGV4cGlyeVRpbWUsIC8vIFdha3R1IGtlZGFsdXdhcnNhIHN0b3J5IHVudHVrIG1lbXVkYWhrYW4gcGVuZ2hhcHVzYW4gb3RvbWF0aXNcclxuICAgICAgcmVzb3VyY2VUeXBlLFxyXG4gICAgICAuLi4oZHVyYXRpb24gJiYgeyBkdXJhdGlvbiB9KSxcclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICAvLyBTZXQgVFRMIChUaW1lIHRvIExpdmUpIHBhZGEgZG9rdW1lbiB1bnR1ayBvdG9tYXRpcyBkaWhhcHVzIHNldGVsYWggMjQgamFtXHJcbiAgICAvLyBDYXRhdGFuOiBJbmkgbWVtZXJsdWthbiBGaXJlc3RvcmUgVFRMIHlhbmcgZGlrb25maWd1cmFzaSBhdGF1IGZ1bmdzaSBDbG91ZCB5YW5nIGRpamFkd2Fsa2FuXHJcbiAgICBcclxuICAgIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbih7IHN1Y2Nlc3M6IHRydWUsIHN0b3J5SWQ6IHN0b3J5UmVmLmlkIH0pO1xyXG4gIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICBjb25zb2xlLmVycm9yKCdFcnJvciB1cGxvYWRpbmcgc3Rvcnk6JywgZXJyb3IpO1xyXG4gICAgcmV0dXJuIE5leHRSZXNwb25zZS5qc29uKHsgZXJyb3I6ICdGYWlsZWQgdG8gdXBsb2FkIHN0b3J5JyB9LCB7IHN0YXR1czogNTAwIH0pO1xyXG4gIH1cclxufSAiXSwibmFtZXMiOlsiTmV4dFJlc3BvbnNlIiwiYXV0aCIsImZpcmVzdG9yZSIsInY0IiwidXVpZHY0IiwiY2xvdWRpbmFyeSIsIlBPU1QiLCJyZXF1ZXN0IiwiY29uc29sZSIsImxvZyIsImNsb3VkX25hbWUiLCJwcm9jZXNzIiwiZW52IiwiQ0xPVURJTkFSWV9DTE9VRF9OQU1FIiwiYXBpX2tleSIsIkNMT1VESU5BUllfQVBJX0tFWSIsImFwaV9zZWNyZXQiLCJDTE9VRElOQVJZX0FQSV9TRUNSRVQiLCJhdXRoSGVhZGVyIiwiaGVhZGVycyIsImdldCIsInN0YXJ0c1dpdGgiLCJqc29uIiwiZXJyb3IiLCJzdGF0dXMiLCJpZFRva2VuIiwic3BsaXQiLCJkZWNvZGVkVG9rZW4iLCJ2ZXJpZnlJZFRva2VuIiwidXNlcklkIiwidWlkIiwiZm9ybURhdGEiLCJmaWxlIiwiY2FwdGlvbiIsInJlc291cmNlVHlwZSIsImJ1ZmZlciIsIkJ1ZmZlciIsImZyb20iLCJhcnJheUJ1ZmZlciIsInN0b3J5SWQiLCJ1cGxvYWRSZXN1bHQiLCJQcm9taXNlIiwicmVzb2x2ZSIsInJlamVjdCIsImJhc2U2NERhdGEiLCJ0b1N0cmluZyIsImRhdGFVUkkiLCJ0eXBlIiwidXBsb2FkZXIiLCJ1cGxvYWQiLCJmb2xkZXIiLCJwdWJsaWNfaWQiLCJyZXNvdXJjZV90eXBlIiwicmVzdWx0IiwidXJsIiwic2VjdXJlX3VybCIsImR1cmF0aW9uIiwidW5kZWZpbmVkIiwic3RvcnlSZWYiLCJjb2xsZWN0aW9uIiwiZG9jIiwibm93IiwiRGF0ZSIsImV4cGlyeVRpbWUiLCJzZXRIb3VycyIsImdldEhvdXJzIiwic2V0IiwiaW1hZ2VVcmwiLCJ0aW1lc3RhbXAiLCJzdWNjZXNzIiwiaWQiXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./src/app/api/story/upload/route.ts\n");

/***/ }),

/***/ "(rsc)/./src/firebase/admin.ts":
/*!*******************************!*\
  !*** ./src/firebase/admin.ts ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   auth: () => (/* binding */ auth),\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__),\n/* harmony export */   firestore: () => (/* binding */ firestore)\n/* harmony export */ });\n/* harmony import */ var firebase_admin__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! firebase-admin */ \"firebase-admin\");\n/* harmony import */ var firebase_admin__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(firebase_admin__WEBPACK_IMPORTED_MODULE_0__);\n\n// Cek apakah sudah terinisialisasi\nif (!firebase_admin__WEBPACK_IMPORTED_MODULE_0__.apps.length) {\n    try {\n        firebase_admin__WEBPACK_IMPORTED_MODULE_0__.initializeApp({\n            credential: firebase_admin__WEBPACK_IMPORTED_MODULE_0__.credential.cert({\n                projectId: process.env.FIREBASE_PROJECT_ID,\n                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,\n                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\\\n/g, \"\\n\")\n            }),\n            databaseURL: process.env.FIREBASE_DATABASE_URL\n        });\n    } catch (error) {\n        console.error(\"Firebase admin initialization error\", error);\n    }\n}\nconst auth = firebase_admin__WEBPACK_IMPORTED_MODULE_0__.auth();\nconst firestore = firebase_admin__WEBPACK_IMPORTED_MODULE_0__.firestore();\n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (firebase_admin__WEBPACK_IMPORTED_MODULE_0__);\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9zcmMvZmlyZWJhc2UvYWRtaW4udHMiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7QUFBd0M7QUFFeEMsbUNBQW1DO0FBQ25DLElBQUksQ0FBQ0EsZ0RBQVUsQ0FBQ0UsTUFBTSxFQUFFO0lBQ3RCLElBQUk7UUFDRkYseURBQW1CLENBQUM7WUFDbEJJLFlBQVlKLHNEQUFnQixDQUFDSyxJQUFJLENBQUM7Z0JBQ2hDQyxXQUFXQyxRQUFRQyxHQUFHLENBQUNDLG1CQUFtQjtnQkFDMUNDLGFBQWFILFFBQVFDLEdBQUcsQ0FBQ0cscUJBQXFCO2dCQUM5Q0MsWUFBWUwsUUFBUUMsR0FBRyxDQUFDSyxvQkFBb0IsRUFBRUMsUUFBUSxRQUFRO1lBQ2hFO1lBQ0FDLGFBQWFSLFFBQVFDLEdBQUcsQ0FBQ1EscUJBQXFCO1FBQ2hEO0lBQ0YsRUFBRSxPQUFPQyxPQUFPO1FBQ2RDLFFBQVFELEtBQUssQ0FBQyx1Q0FBdUNBO0lBQ3ZEO0FBQ0Y7QUFFTyxNQUFNRSxPQUFPbkIsZ0RBQVUsR0FBRztBQUMxQixNQUFNb0IsWUFBWXBCLHFEQUFlLEdBQUc7QUFDM0MsaUVBQWVBLDJDQUFLQSxFQUFDIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vaGFsbG8vLi9zcmMvZmlyZWJhc2UvYWRtaW4udHM/OThiNyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBhZG1pbiBmcm9tICdmaXJlYmFzZS1hZG1pbic7XHJcblxyXG4vLyBDZWsgYXBha2FoIHN1ZGFoIHRlcmluaXNpYWxpc2FzaVxyXG5pZiAoIWFkbWluLmFwcHMubGVuZ3RoKSB7XHJcbiAgdHJ5IHtcclxuICAgIGFkbWluLmluaXRpYWxpemVBcHAoe1xyXG4gICAgICBjcmVkZW50aWFsOiBhZG1pbi5jcmVkZW50aWFsLmNlcnQoe1xyXG4gICAgICAgIHByb2plY3RJZDogcHJvY2Vzcy5lbnYuRklSRUJBU0VfUFJPSkVDVF9JRCxcclxuICAgICAgICBjbGllbnRFbWFpbDogcHJvY2Vzcy5lbnYuRklSRUJBU0VfQ0xJRU5UX0VNQUlMLFxyXG4gICAgICAgIHByaXZhdGVLZXk6IHByb2Nlc3MuZW52LkZJUkVCQVNFX1BSSVZBVEVfS0VZPy5yZXBsYWNlKC9cXFxcbi9nLCAnXFxuJyksXHJcbiAgICAgIH0pLFxyXG4gICAgICBkYXRhYmFzZVVSTDogcHJvY2Vzcy5lbnYuRklSRUJBU0VfREFUQUJBU0VfVVJMLFxyXG4gICAgfSk7XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoJ0ZpcmViYXNlIGFkbWluIGluaXRpYWxpemF0aW9uIGVycm9yJywgZXJyb3IpO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IGF1dGggPSBhZG1pbi5hdXRoKCk7XHJcbmV4cG9ydCBjb25zdCBmaXJlc3RvcmUgPSBhZG1pbi5maXJlc3RvcmUoKTtcclxuZXhwb3J0IGRlZmF1bHQgYWRtaW47ICJdLCJuYW1lcyI6WyJhZG1pbiIsImFwcHMiLCJsZW5ndGgiLCJpbml0aWFsaXplQXBwIiwiY3JlZGVudGlhbCIsImNlcnQiLCJwcm9qZWN0SWQiLCJwcm9jZXNzIiwiZW52IiwiRklSRUJBU0VfUFJPSkVDVF9JRCIsImNsaWVudEVtYWlsIiwiRklSRUJBU0VfQ0xJRU5UX0VNQUlMIiwicHJpdmF0ZUtleSIsIkZJUkVCQVNFX1BSSVZBVEVfS0VZIiwicmVwbGFjZSIsImRhdGFiYXNlVVJMIiwiRklSRUJBU0VfREFUQUJBU0VfVVJMIiwiZXJyb3IiLCJjb25zb2xlIiwiYXV0aCIsImZpcmVzdG9yZSJdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./src/firebase/admin.ts\n");

/***/ }),

/***/ "(rsc)/./src/lib/cloudinary.ts":
/*!*******************************!*\
  !*** ./src/lib/cloudinary.ts ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__)\n/* harmony export */ });\n/* harmony import */ var cloudinary__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! cloudinary */ \"(rsc)/./node_modules/cloudinary/cloudinary.js\");\n/* harmony import */ var cloudinary__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(cloudinary__WEBPACK_IMPORTED_MODULE_0__);\n\n// Konfigurasi Cloudinary\ncloudinary__WEBPACK_IMPORTED_MODULE_0__.v2.config({\n    cloud_name: \"dk7iscykg\",\n    api_key: \"479643753769294\",\n    api_secret: \"COLo8c_tmuuAA2ka6P7VLBDlbgw\",\n    secure: true\n});\nconsole.log(\"Cloudinary configured with hardcoded values for testing\");\n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (cloudinary__WEBPACK_IMPORTED_MODULE_0__.v2);\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9zcmMvbGliL2Nsb3VkaW5hcnkudHMiLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQThDO0FBRTlDLHlCQUF5QjtBQUN6QkMsMENBQVVBLENBQUNDLE1BQU0sQ0FBQztJQUNoQkMsWUFBWTtJQUNaQyxTQUFTO0lBQ1RDLFlBQVk7SUFDWkMsUUFBUTtBQUNWO0FBRUFDLFFBQVFDLEdBQUcsQ0FBQztBQUVaLGlFQUFlUCwwQ0FBVUEsRUFBQyIsInNvdXJjZXMiOlsid2VicGFjazovL2hhbGxvLy4vc3JjL2xpYi9jbG91ZGluYXJ5LnRzP2UxZmEiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgdjIgYXMgY2xvdWRpbmFyeSB9IGZyb20gJ2Nsb3VkaW5hcnknO1xyXG5cclxuLy8gS29uZmlndXJhc2kgQ2xvdWRpbmFyeVxyXG5jbG91ZGluYXJ5LmNvbmZpZyh7XHJcbiAgY2xvdWRfbmFtZTogJ2RrN2lzY3lrZycsIC8vIHByb2Nlc3MuZW52LkNMT1VESU5BUllfQ0xPVURfTkFNRVxyXG4gIGFwaV9rZXk6ICc0Nzk2NDM3NTM3NjkyOTQnLCAvLyBwcm9jZXNzLmVudi5DTE9VRElOQVJZX0FQSV9LRVlcclxuICBhcGlfc2VjcmV0OiAnQ09MbzhjX3RtdXVBQTJrYTZQN1ZMQkRsYmd3JywgLy8gcHJvY2Vzcy5lbnYuQ0xPVURJTkFSWV9BUElfU0VDUkVUXHJcbiAgc2VjdXJlOiB0cnVlXHJcbn0pO1xyXG5cclxuY29uc29sZS5sb2coJ0Nsb3VkaW5hcnkgY29uZmlndXJlZCB3aXRoIGhhcmRjb2RlZCB2YWx1ZXMgZm9yIHRlc3RpbmcnKTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsb3VkaW5hcnk7ICJdLCJuYW1lcyI6WyJ2MiIsImNsb3VkaW5hcnkiLCJjb25maWciLCJjbG91ZF9uYW1lIiwiYXBpX2tleSIsImFwaV9zZWNyZXQiLCJzZWN1cmUiLCJjb25zb2xlIiwibG9nIl0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./src/lib/cloudinary.ts\n");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next","vendor-chunks/@opentelemetry","vendor-chunks/lodash","vendor-chunks/cloudinary","vendor-chunks/uuid","vendor-chunks/q"], () => (__webpack_exec__("(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fstory%2Fupload%2Froute&page=%2Fapi%2Fstory%2Fupload%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fstory%2Fupload%2Froute.ts&appDir=C%3A%5Cxampp%5Chtdocs%5CHallo%5Csrc%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5Cxampp%5Chtdocs%5CHallo&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();