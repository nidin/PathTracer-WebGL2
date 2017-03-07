System.register(["./vector", "./bbox", "./obj", "./fs", "./OBJLoader"], function(exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var vector_1, bbox_1, obj_1, fs_1, OBJLoader_1;
    var Triangle, Material, Mesh;
    return {
        setters:[
            function (vector_1_1) {
                vector_1 = vector_1_1;
            },
            function (bbox_1_1) {
                bbox_1 = bbox_1_1;
            },
            function (obj_1_1) {
                obj_1 = obj_1_1;
            },
            function (fs_1_1) {
                fs_1 = fs_1_1;
            },
            function (OBJLoader_1_1) {
                OBJLoader_1 = OBJLoader_1_1;
            }],
        execute: function() {
            /**
             * Created by nidin on 2017-02-18.
             */
            Triangle = class Triangle {
                constructor(positions = [], normals = [], texcoords = [], bbox = new bbox_1.BBox(), centroid = new vector_1.Vector3(), materialId) {
                    this.positions = positions;
                    this.normals = normals;
                    this.texcoords = texcoords;
                    this.bbox = bbox;
                    this.centroid = centroid;
                    this.materialId = materialId;
                }
            };
            exports_1("Triangle", Triangle);
            Material = class Material {
                constructor(name, color = new vector_1.Vector3(), brdf = 0, eta = 0, specularity = 0, Ka, Kd, Ks, Ns, isTextured = false, texture, textureWidth, textureHeight) {
                    this.name = name;
                    this.color = color;
                    this.brdf = brdf;
                    this.eta = eta;
                    this.specularity = specularity;
                    this.Ka = Ka;
                    this.Kd = Kd;
                    this.Ks = Ks;
                    this.Ns = Ns;
                    this.isTextured = isTextured;
                    this.texture = texture;
                    this.textureWidth = textureWidth;
                    this.textureHeight = textureHeight;
                }
            };
            exports_1("Material", Material);
            Mesh = class Mesh {
                constructor(triangles = [], materials = [], lightsCDF, lightsIndices, lightsArea, bbox = new bbox_1.BBox()) {
                    this.triangles = triangles;
                    this.materials = materials;
                    this.lightsCDF = lightsCDF;
                    this.lightsIndices = lightsIndices;
                    this.lightsArea = lightsArea;
                    this.bbox = bbox;
                }
                calculateBBox() {
                    this.bbox.initialize();
                    for (let i = 0; i < this.triangles.length; i++) {
                        this.triangles[i].bbox.initialize();
                        this.triangles[i].bbox.expand(this.triangles[i].positions[0]);
                        this.triangles[i].bbox.expand(this.triangles[i].positions[1]);
                        this.triangles[i].bbox.expand(this.triangles[i].positions[2]);
                        this.triangles[i].centroid = this.triangles[i].positions[0].add(this.triangles[i].positions[1]).add(this.triangles[i].positions[2]).mulScalar(1.0 / 3.0);
                        this.bbox.expand(this.triangles[i].positions[0]);
                        this.bbox.expand(this.triangles[i].positions[1]);
                        this.bbox.expand(this.triangles[i].positions[2]);
                    }
                }
                prepareLightSources() {
                    this.lightsArea = 0.0;
                    let lightsCDF = [];
                    let lightsIndices = [];
                    for (let i = 0; i < this.triangles.length; i++) {
                        if (this.materials[this.triangles[i].materialId].brdf == -1) {
                            let Edge0 = this.triangles[i].positions[1].sub(this.triangles[i].positions[0]);
                            let Edge1 = this.triangles[i].positions[2].sub(this.triangles[i].positions[0]);
                            let a = 0.5 * Edge0.op_remainder(Edge1).length();
                            lightsCDF.push(a);
                            lightsIndices.push(i);
                            this.lightsArea += a;
                        }
                    }
                    this.lightsCDF = new Float32Array(lightsCDF);
                    this.lightsIndices = new Int32Array(lightsIndices);
                    if (lightsCDF.length == 0)
                        return;
                    for (let i = 1; i < this.lightsCDF.length; i++) {
                        this.lightsCDF[i] = this.lightsCDF[i] + this.lightsCDF[i - 1];
                    }
                    for (let i = 0; i < this.lightsCDF.length; i++) {
                        this.lightsCDF[i] = this.lightsCDF[i] / this.lightsArea;
                    }
                }
                release() {
                    this.triangles = null;
                    this.materials = null;
                }
                load(geometry, position, scale) {
                    let vertices = geometry.vertices;
                    let normals = geometry.normals ? geometry.normals : null;
                    let texcoords = geometry.texcoords ? geometry.texcoords : null;
                    let indices = geometry.indices;
                    this.materials = [];
                    let haveLightSource = this.prepareMaterials(geometry.materialIds);
                    let numTriangles = indices.length / 3;
                    this.triangles = [];
                    for (let i = 0; i < numTriangles; i++) {
                        const v0 = indices[i * 3];
                        const v1 = indices[i * 3 + 1];
                        const v2 = indices[i * 3 + 2];
                        let triangle = new Triangle();
                        triangle.positions[0] = new vector_1.Vector3(vertices[v0 * 3], vertices[v0 * 3 + 1], vertices[v0 * 3 + 2]);
                        triangle.positions[1] = new vector_1.Vector3(vertices[v1 * 3], vertices[v1 * 3 + 1], vertices[v1 * 3 + 2]);
                        triangle.positions[2] = new vector_1.Vector3(vertices[v2 * 3], vertices[v2 * 3 + 1], vertices[v2 * 3 + 2]);
                        triangle.positions[0] = triangle.positions[0].mulScalar(scale).add(position);
                        triangle.positions[1] = triangle.positions[1].mulScalar(scale).add(position);
                        triangle.positions[2] = triangle.positions[2].mulScalar(scale).add(position);
                        if (normals != null) {
                            triangle.normals[0] = new vector_1.Vector3(normals[v0 * 3], normals[v0 * 3 + 1], normals[v0 * 3 + 2]);
                            triangle.normals[1] = new vector_1.Vector3(normals[v1 * 3], normals[v1 * 3 + 1], normals[v1 * 3 + 2]);
                            triangle.normals[2] = new vector_1.Vector3(normals[v2 * 3], normals[v2 * 3 + 1], normals[v2 * 3 + 2]);
                        }
                        else {
                            // no normal data, calculate the normal for a polygon
                            const e0 = triangle.positions[1].sub(triangle.positions[0]);
                            const e1 = triangle.positions[2].sub(triangle.positions[0]);
                            const n = (e0.op_remainder(e1)).normalize();
                            triangle.normals[0] = n;
                            triangle.normals[1] = n;
                            triangle.normals[2] = n;
                        }
                        // material id
                        triangle.materialId = 0;
                        if (geometry.materialIds != null) {
                            // read texture coordinates
                            if ((texcoords != null) && obj_1.mtls[geometry.materialIds[i]].isTextured) {
                                triangle.texcoords[0] = new vector_1.Vector2(texcoords[v0 * 2], texcoords[v0 * 2 + 1]);
                                triangle.texcoords[1] = new vector_1.Vector2(texcoords[v1 * 2], texcoords[v1 * 2 + 1]);
                                triangle.texcoords[2] = new vector_1.Vector2(texcoords[v2 * 2], texcoords[v2 * 2 + 1]);
                            }
                            else {
                                triangle.texcoords[0] = new vector_1.Vector2(1.0e+30, 1.0e+30);
                                triangle.texcoords[1] = new vector_1.Vector2(1.0e+30, 1.0e+30);
                                triangle.texcoords[2] = new vector_1.Vector2(1.0e+30, 1.0e+30);
                            }
                            triangle.materialId = geometry.materialIds[i];
                        }
                        else {
                            triangle.texcoords[0] = new vector_1.Vector2(1.0e+30, 1.0e+30);
                            triangle.texcoords[1] = new vector_1.Vector2(1.0e+30, 1.0e+30);
                            triangle.texcoords[2] = new vector_1.Vector2(1.0e+30, 1.0e+30);
                        }
                        this.triangles[i] = triangle;
                    }
                    this.calculateBBox();
                    if (haveLightSource)
                        this.prepareLightSources();
                }
                loadOBJ(url, position, scale) {
                    let geometry = OBJLoader_1.OBJLoader.parseOBJ(fs_1.fs.getTextFile(url));
                    this.triangles = geometry.triangles;
                    let haveLightSource = this.prepareMaterials(geometry.materialIds);
                    this.calculateBBox();
                    if (haveLightSource)
                        this.prepareLightSources();
                    // let obj = parseOBJ(fs.getTextFile(url));
                    // this.load(obj, position, scale);
                }
                prepareMaterials(materialIds) {
                    let haveLightSource = false;
                    if (materialIds != null) {
                        for (let i = 0; i < obj_1.mtls.length; i++) {
                            let material = obj_1.mtls[i];
                            this.materials.push(material);
                            if (material.isTextured) {
                                this.materials[i].texture = new Uint8Array(material.texture.length);
                                for (let j = 0; j < material.texture.length; j++) {
                                    this.materials[i].texture[j] = material.texture[j];
                                }
                            }
                        }
                        for (let i = 0; i < obj_1.mtls.length; i++) {
                            // Lambertian
                            this.materials[i].brdf = 0;
                            this.materials[i].eta = 1.7;
                            this.materials[i].specularity = 1.0;
                            let material = obj_1.mtls[i];
                            if (material.Ns == 100.0) {
                                if (material.Ks.dot(material.Ks) == 3.0) {
                                    // mirror
                                    this.materials[i].brdf = 1;
                                }
                                else if (material.Ks.dot(material.Ks) > 0.0) {
                                    // plastic
                                    this.materials[i].brdf = 3;
                                }
                            }
                            else {
                                this.materials[i].specularity = Math.max(material.Ns / 100.0, 0.5);
                                if (material.Ks.dot(material.Ks) == 3.0) {
                                    // glossy mirror
                                    this.materials[i].brdf = 4;
                                }
                                else if (material.Ks.dot(material.Ks) > 0.0) {
                                    // glossy plastic
                                    this.materials[i].brdf = 6;
                                }
                            }
                            if (material.name.substring(0, 5) == "glass") {
                                this.materials[i].eta = material.Ks.dot(material.Ks) / 3.0 + 1.0;
                                if (material.Ns == 100.0) {
                                    // glass
                                    this.materials[i].brdf = 2;
                                }
                                else {
                                    // glossy glass
                                    this.materials[i].specularity = Math.max(material.Ns / 100.0, 0.5);
                                    this.materials[i].brdf = 5;
                                }
                            }
                            if (material.Ka.dot(material.Ka) > 0.0) {
                                // light source
                                this.materials[i].brdf = -1;
                                haveLightSource = true;
                            }
                            if ((this.materials[i].brdf == 0) || (this.materials[i].brdf == 3)) {
                                material.Kd = material.Kd.mulScalar(0.9);
                            }
                            if ((this.materials[i].brdf == 2) || (this.materials[i].brdf == 5)) {
                                material.Kd.x = Math.sqrt(material.Kd.x);
                                material.Kd.y = Math.sqrt(material.Kd.y);
                                material.Kd.z = Math.sqrt(material.Kd.z);
                            }
                            this.materials[i].color = material.Kd;
                            if (material.name.substring(0, 3) == "sss") {
                                this.materials[i].brdf = 7;
                            }
                        }
                    }
                    else {
                        // use default
                        let mtl = new Material();
                        mtl.isTextured = false;
                        mtl.brdf = 0;
                        mtl.Kd = new vector_1.Vector3(0.75, 0.75, 0.75);
                        this.materials.push(mtl);
                    }
                    return haveLightSource;
                }
            };
            exports_1("Mesh", Mesh);
        }
    }
});
//# sourceMappingURL=mesh.js.map