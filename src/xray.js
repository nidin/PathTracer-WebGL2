///<reference path="decleration.d.ts"/>
/**
 * Created by Nidin Vinayakan on 23/02/17.
 */
System.register(["./bbox", "./vector", "./mesh", "./obj", "./PhotonMapper"], function(exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    function exportStar_1(m) {
        var exports = {};
        for(var n in m) {
            if (n !== "default") exports[n] = m[n];
        }
        exports_1(exports);
    }
    return {
        setters:[
            function (bbox_1_1) {
                exportStar_1(bbox_1_1);
            },
            function (vector_1_1) {
                exportStar_1(vector_1_1);
            },
            function (mesh_1_1) {
                exportStar_1(mesh_1_1);
            },
            function (obj_1_1) {
                exportStar_1(obj_1_1);
            },
            function (PhotonMapper_1_1) {
                exportStar_1(PhotonMapper_1_1);
            }],
        execute: function() {
        }
    }
});
//# sourceMappingURL=xray.js.map