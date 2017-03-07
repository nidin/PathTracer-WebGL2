System.register(["./vector"], function(exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var vector_1;
    var BBox;
    return {
        setters:[
            function (vector_1_1) {
                vector_1 = vector_1_1;
            }],
        execute: function() {
            BBox = class BBox {
                constructor(min = new vector_1.Vector3(), max = new vector_1.Vector3()) {
                    this.min = min;
                    this.max = max;
                }
                longestAxis() {
                    var length = this.max.sub(this.min);
                    if ((length.x > length.y) && (length.x > length.z)) {
                        return 0;
                    }
                    else if (length.y > length.z) {
                        return 1;
                    }
                    else {
                        return 2;
                    }
                }
                area() {
                    var length = this.max.sub(this.min);
                    return 2.0 * (length.x * length.y + length.y * length.z + length.z * length.x);
                }
                expand(p) {
                    this.max = this.max.maximize(p);
                    this.min = this.min.minimize(p);
                }
                initialize() {
                    this.min = new vector_1.Vector3(1e+38, 1e+38, 1e+38);
                    this.max = new vector_1.Vector3(-1e+38, -1e+38, -1e+38);
                }
            };
            exports_1("BBox", BBox);
        }
    }
});
//# sourceMappingURL=bbox.js.map