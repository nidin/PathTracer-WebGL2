System.register([], function(exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var fs;
    return {
        setters:[],
        execute: function() {
            /**
             * Created by Nidin Vinayakan on 24/02/17.
             */
            fs = class fs {
                static getTextFile(name) {
                    let file = fs.textFiles.get(name);
                    if (!file) {
                        throw `Cannot find file ${name}`;
                    }
                    return file;
                }
                static addTextFile(name, content) {
                    fs.textFiles.set(name, content);
                }
                static getBinFile(name) {
                    let file = fs.binFiles.get(name);
                    if (!file) {
                        throw `Cannot find binary file ${name}`;
                    }
                    return file;
                }
                static addBinFile(name, content) {
                    fs.binFiles.set(name, content);
                }
            };
            fs.textFiles = new Map();
            fs.binFiles = new Map();
            exports_1("fs", fs);
        }
    }
});
//# sourceMappingURL=fs.js.map