System.register(["./vector"], function(exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var vector_1;
    var Camera;
    return {
        setters:[
            function (vector_1_1) {
                vector_1 = vector_1_1;
            }],
        execute: function() {
            Camera = class Camera {
                constructor(origin = new vector_1.Vector3(), lookat = new vector_1.Vector3(), width, height, distance, u, v, w) {
                    this.origin = origin;
                    this.lookat = lookat;
                    this.width = width;
                    this.height = height;
                    this.distance = distance;
                    this.u = u;
                    this.v = v;
                    this.w = w;
                }
                set(origin, lookat, width, height, fov) {
                    this.origin = origin;
                    this.lookat = lookat;
                    this.width = width;
                    this.height = height;
                    this.distance = height / (2.0 * Math.tan((fov / 2.0) * (3.141592 / 180.0)));
                    const tv = new vector_1.Vector3(0.0, 1.0, 0.0);
                    this.w = this.lookat.sub(this.origin).normalize();
                    this.u = tv.op_remainder(this.w).normalize();
                    this.v = this.w.op_remainder(this.u).normalize();
                }
            };
            exports_1("Camera", Camera);
        }
    }
});
//# sourceMappingURL=camera.js.map