System.register(["./vector", "./mesh", "./obj"], function(exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var vector_1, mesh_1, obj_1;
    var OBJLoader;
    function append(slice, ...elements) {
        if (slice == undefined) {
            return elements;
        }
        else {
            slice.push.apply(slice, elements);
        }
        return slice;
    }
    return {
        setters:[
            function (vector_1_1) {
                vector_1 = vector_1_1;
            },
            function (mesh_1_1) {
                mesh_1 = mesh_1_1;
            },
            function (obj_1_1) {
                obj_1 = obj_1_1;
            }],
        execute: function() {
            OBJLoader = class OBJLoader {
                static Load(url, onLoad) {
                    console.log("Loading OBJ:" + url);
                    let basePath = url.substring(0, url.lastIndexOf("/"));
                    let xhr = new XMLHttpRequest();
                    xhr.open('GET', url, true);
                    xhr.onload = function () {
                        console.time("Parsing OBJ file");
                        OBJLoader.lastMesh = OBJLoader.parseOBJ(xhr.response, basePath);
                        console.timeEnd("Parsing OBJ file");
                        console.log("Parsing completed, Mesh Ref:" + OBJLoader.lastMesh);
                        if (onLoad) {
                            if (OBJLoader.hasMaterials && OBJLoader.materialsLoaded) {
                                onLoad(OBJLoader.lastMesh);
                            }
                            else if (!OBJLoader.hasMaterials) {
                                onLoad(OBJLoader.lastMesh);
                            }
                            else {
                                OBJLoader.pendingCallback = onLoad;
                            }
                        }
                    };
                    xhr.send(null);
                    return null;
                }
                static parseIndex(value, length) {
                    var n = parseInt(value);
                    if (n < 0) {
                        n += length;
                    }
                    return n;
                }
                static parseLine(line) {
                    try {
                        var result = line.match(/^(\S+)\s(.*)/);
                        if (result) {
                            var _str = result.slice(1);
                        }
                        else {
                            return null;
                        }
                    }
                    catch (e) {
                        console.log("Error in line:", line, e);
                        return null;
                    }
                    if (!_str) {
                        return null;
                    }
                    else {
                        return {
                            keyword: _str[0],
                            value: _str[1].split(/ {1,}/)
                        };
                    }
                }
                static parseFloats(fs) {
                    var floats = [];
                    fs.forEach(function (f) {
                        floats.push(parseFloat(f));
                    });
                    return floats;
                }
                static parseOBJ(data, basePath) {
                    this.hasMaterials = false;
                    this.materialsLoaded = false;
                    this.materialsLoading = false;
                    var vs = [null]; //1024 // 1-based indexing
                    var vts = [null]; // 1-based indexing
                    var vns = [null]; // 1-based indexing
                    var triangles = [];
                    this.materials = new Map(); //make(map[string]*Material)
                    let materialIds = [];
                    var material = new mesh_1.Material();
                    var materialId = 0;
                    var lines = data.split("\n");
                    console.log("OBJ File Details");
                    console.log(`    lines: ${lines.length}`);
                    for (var i = 0; i < lines.length; i++) {
                        let line = lines[i].trim();
                        if (line.length == 0) {
                            continue;
                        }
                        let item = OBJLoader.parseLine(line);
                        if (item) {
                            let f;
                            let v;
                            switch (item.keyword) {
                                case "mtllib":
                                    this.hasMaterials = true;
                                    this.materialsLoaded = false;
                                    //OBJLoader.LoadMTL(item.value[0], basePath);
                                    break;
                                case "usemtl":
                                    //material = OBJLoader.GetMaterial(item.value[0]);
                                    let mat = obj_1.getMaterial(item.value[0]);
                                    materialId = mat.id;
                                    materialIds.push(materialId);
                                    material = mat.mat;
                                    break;
                                case "v":
                                    f = OBJLoader.parseFloats(item.value);
                                    v = new vector_1.Vector3(f[0], f[1], f[2]);
                                    vs = append(vs, v);
                                    break;
                                case "vt":
                                    f = OBJLoader.parseFloats(item.value);
                                    v = new vector_1.Vector3(f[0], f[1], 0);
                                    vts = append(vts, v);
                                    break;
                                case "vn":
                                    f = OBJLoader.parseFloats(item.value);
                                    v = new vector_1.Vector3(f[0], f[1], f[2]);
                                    vns = append(vns, v);
                                    break;
                                case "f":
                                    var fvs = [];
                                    var fvts = [];
                                    var fvns = [];
                                    item.value.forEach(function (str, i) {
                                        let vertex = str.split(/\/\/{1,}/);
                                        fvs[i] = OBJLoader.parseIndex(vertex[0], vs.length);
                                        fvts[i] = OBJLoader.parseIndex(vertex[1], vts.length);
                                        fvns[i] = OBJLoader.parseIndex(vertex[2], vns.length);
                                    });
                                    for (let i = 1; i < fvs.length - 1; i++) {
                                        let i1 = 0;
                                        let i2 = i;
                                        let i3 = i + 1;
                                        let t = new mesh_1.Triangle();
                                        t.materialId = materialId;
                                        t.positions[0] = vs[fvs[i1]];
                                        t.positions[1] = vs[fvs[i2]];
                                        t.positions[2] = vs[fvs[i3]];
                                        t.texcoords[0] = vts[fvts[i1]] == undefined ? new vector_1.Vector2(1.0e+30, 1.0e+30) : vts[fvts[i1]];
                                        t.texcoords[1] = vts[fvts[i2]] == undefined ? new vector_1.Vector2(1.0e+30, 1.0e+30) : vts[fvts[i2]];
                                        t.texcoords[2] = vts[fvts[i3]] == undefined ? new vector_1.Vector2(1.0e+30, 1.0e+30) : vts[fvts[i3]];
                                        t.normals[0] = vns[fvns[i1]];
                                        t.normals[1] = vns[fvns[i2]];
                                        t.normals[2] = vns[fvns[i3]];
                                        if (!t.normals[0]) {
                                            const e0 = t.positions[1].sub(t.positions[0]);
                                            const e1 = t.positions[2].sub(t.positions[0]);
                                            const n = (e0.op_remainder(e1)).normalize();
                                            t.normals[0] = n;
                                            t.normals[1] = n;
                                            t.normals[2] = n;
                                        }
                                        triangles.push(t);
                                    }
                                    break;
                            }
                        }
                    }
                    console.log(`Num triangles: ${triangles.length}`);
                    return { triangles: triangles, materialIds: materialIds };
                }
                static GetMaterial(index) {
                    if (this.materials[index] == undefined) {
                        // var material:number = Material.Clone(this.parentMaterial);
                        var material = this.parentMaterial;
                        this.materials[index] = material;
                        return material;
                    }
                    else {
                        return this.materials[index];
                    }
                }
                static LoadMTL(url, basePath) {
                    if (this.materialsLoaded || this.materialsLoading) {
                        return;
                    }
                    this.materialsLoading = true;
                    url = basePath == "" ? url : basePath + "/" + url;
                    console.log("Loading MTL:" + url);
                    var self = this;
                    var xhr = new XMLHttpRequest();
                    xhr.open('GET', url, true);
                    xhr.onload = function () {
                        var lines = xhr.response.split("\n");
                        for (var i = 0; i < lines.length; i++) {
                            let line = lines[i].trim();
                            if (line.length == 0) {
                                continue;
                            }
                            let item = OBJLoader.parseLine(line);
                            if (item) {
                                var material;
                                switch (item.keyword) {
                                    case "newmtl":
                                        material = self.materials[item.value[0]];
                                        material = material ? material : new mesh_1.Material();
                                        self.materials[item.value[0]] = material;
                                        break;
                                    case "Ke":
                                        var c = OBJLoader.parseFloats(item.value);
                                        let max = Math.max(Math.max(c[0], c[1]), c[2]);
                                        if (max > 0) {
                                            material.color = new vector_1.Vector3(c[0] / max, c[1] / max, c[2] / max);
                                        }
                                        break;
                                    case "Kd":
                                        var c = OBJLoader.parseFloats(item.value);
                                        material.color = new vector_1.Vector3(c[0], c[1], c[2]);
                                        break;
                                    case "map_Kd":
                                        //material.texture = Texture.getTexture(item.value[0]);
                                        break;
                                    case "map_bump":
                                        //material.texture = Texture.getTexture(item.value[0]);
                                        break;
                                }
                            }
                        }
                        self.materialsLoaded = true;
                        if (self.pendingCallback) {
                            self.pendingCallback(self.lastMesh);
                            self.pendingCallback = null;
                        }
                    };
                    xhr.send(null);
                    return null;
                }
            };
            OBJLoader.hasMaterials = false;
            OBJLoader.materialsLoaded = false;
            OBJLoader.materialsLoading = false;
            OBJLoader.pendingCallback = null;
            exports_1("OBJLoader", OBJLoader);
        }
    }
});
//# sourceMappingURL=OBJLoader.js.map