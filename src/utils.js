System.register([], function(exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    /**
     * Created by Nidin Vinayakan on 24/02/17.
     */
    function fillArray(array, type, num) {
        for (let i = 0; i < num; i++) {
            array[i] = new type();
        }
        return array;
    }
    exports_1("fillArray", fillArray);
    function vec4array_to_f32Array(array) {
        let i = 0;
        let j = 0;
        let f32 = new Float32Array(array.length * 4);
        while (i < array.length) {
            let v = array[i];
            f32[j] = v.x;
            f32[j + 1] = v.y;
            f32[j + 2] = v.z;
            f32[j + 3] = v.w;
            i = i + 1;
            j = j + 4;
        }
        return f32;
    }
    exports_1("vec4array_to_f32Array", vec4array_to_f32Array);
    function vec3array_to_f32Array(array) {
        let i = 0;
        let j = 0;
        let f32 = new Float32Array(array.length * 3);
        while (i < array.length) {
            let v = array[i];
            f32[j] = v.x;
            f32[j + 1] = v.y;
            f32[j + 2] = v.z;
            i = i + 1;
            j = j + 3;
        }
        return f32;
    }
    exports_1("vec3array_to_f32Array", vec3array_to_f32Array);
    function vec2array_to_f32Array(array) {
        let i = 0;
        let j = 0;
        let f32 = new Float32Array(array.length * 2);
        while (i < array.length) {
            let v = array[i];
            f32[j] = v.x;
            f32[j + 1] = v.y;
            i = i + 1;
            j = j + 2;
        }
        return f32;
    }
    exports_1("vec2array_to_f32Array", vec2array_to_f32Array);
    return {
        setters:[],
        execute: function() {
        }
    }
});
//# sourceMappingURL=utils.js.map