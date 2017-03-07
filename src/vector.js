System.register([], function(exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var Vector2, Vector4, Vector3;
    return {
        setters:[],
        execute: function() {
            Vector2 = class Vector2 {
                constructor(x = 0.0, y = 0.0) {
                    this.x = x;
                    this.y = y;
                }
                get(axis) {
                    switch (axis) {
                        case 1:
                            return this.x;
                        case 2:
                            return this.y;
                    }
                }
                get glData() {
                    return new Float32Array([this.x, this.y]);
                }
            };
            exports_1("Vector2", Vector2);
            Vector4 = class Vector4 {
                constructor(x = 0.0, y = 0.0, z = 0.0, w = 0.0) {
                    this.x = x;
                    this.y = y;
                    this.z = z;
                    this.w = w;
                }
                get(axis) {
                    switch (axis) {
                        case 1:
                            return this.x;
                        case 2:
                            return this.y;
                        case 3:
                            return this.z;
                        case 4:
                            return this.w;
                    }
                }
                get glData() {
                    return new Float32Array([this.x, this.y, this.z, this.w]);
                }
            };
            exports_1("Vector4", Vector4);
            Vector3 = class Vector3 {
                constructor(x = 0.0, y = 0.0, z = 0.0) {
                    this.x = x;
                    this.y = y;
                    this.z = z;
                }
                get glData() {
                    return new Float32Array([this.x, this.y, this.z]);
                }
                add(b) {
                    return new Vector3(this.x + b.x, this.y + b.y, this.z + b.z);
                }
                addScalar(f) {
                    return new Vector3(this.x + f, this.y + f, this.z + f);
                }
                sub(b) {
                    return new Vector3(this.x - b.x, this.y - b.y, this.z - b.z);
                }
                subScalar(f) {
                    return new Vector3(this.x - f, this.y - f, this.z - f);
                }
                mul(b) {
                    return new Vector3(this.x * b.x, this.y * b.y, this.z * b.z);
                }
                mulScalar(f) {
                    return new Vector3(this.x * f, this.y * f, this.z * f);
                }
                div(b) {
                    return new Vector3(this.x / b.x, this.y / b.y, this.z / b.z);
                }
                divScalar(f) {
                    return new Vector3(this.x / f, this.y / f, this.z / f);
                }
                dot(b) {
                    return (this.x * b.x) + (this.y * b.y) + (this.z * b.z);
                }
                length() {
                    return Math.sqrt((this.x * this.x) + (this.y * this.y) + (this.z * this.z));
                }
                normalize() {
                    let d = this.length();
                    return new Vector3(this.x / d, this.y / d, this.z / d);
                }
                op_remainder(b) {
                    return new Vector3(this.y * b.z - this.z * b.y, this.z * b.x - this.x * b.z, this.x * b.y - this.y * b.x);
                }
                maximize(b) {
                    return new Vector3(this.x > b.x ? this.x : b.x, this.y > b.y ? this.y : b.y, this.z > b.z ? this.z : b.z);
                }
                minimize(b) {
                    return new Vector3(this.x < b.x ? this.x : b.x, this.y < b.y ? this.y : b.y, this.z < b.z ? this.z : b.z);
                }
                get(axis) {
                    switch (axis) {
                        case 1:
                            return this.x;
                        case 2:
                            return this.y;
                        case 3:
                            return this.z;
                    }
                }
            };
            exports_1("Vector3", Vector3);
        }
    }
});
//# sourceMappingURL=vector.js.map