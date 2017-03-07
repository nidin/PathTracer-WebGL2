import {Vector3, Vector2} from "./vector";
import {BBox} from "./bbox";
import {mtls, parseOBJ} from "./obj";
import {fs} from "./fs";
import {OBJLoader} from "./OBJLoader";
/**
 * Created by nidin on 2017-02-18.
 */

export class Triangle {
    constructor(public positions: Vector3[] = [],
                public normals: Vector3[] = [],
                public texcoords: Vector2[] = [],
                public bbox: BBox = new BBox(),
                public centroid: Vector3 = new Vector3(),
                public materialId?: number) {
    }
}

export class Material {
    constructor(public name?: string,
                public color: Vector3 = new Vector3(),
                public brdf: number = 0,
                public eta: number = 0,
                public specularity: number = 0,
                public Ka?: Vector3, public Kd?: Vector3, public Ks?: Vector3,
                public Ns?: number,
                public isTextured: boolean = false,
                public texture?: Uint8Array,
                public textureWidth?: number,
                public textureHeight?: number) {
    }
}

export class Mesh {
    constructor(public triangles: Triangle[] = [],
                public materials: Material[] = [],
                public lightsCDF?: Float32Array,
                public lightsIndices?: Int32Array,
                public lightsArea?: number,
                public bbox: BBox = new BBox()) {

    }

    public calculateBBox() {
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

    public prepareLightSources() {
        this.lightsArea = 0.0;
        let lightsCDF = [];
        let lightsIndices = [];

        for (let i: number = 0; i < this.triangles.length; i++) {
            if (this.materials[this.triangles[i].materialId].brdf == -1) {
                let Edge0: Vector3 = this.triangles[i].positions[1].sub(this.triangles[i].positions[0]);
                let Edge1: Vector3 = this.triangles[i].positions[2].sub(this.triangles[i].positions[0]);
                let a: number = 0.5 * Edge0.op_remainder(Edge1).length();
                lightsCDF.push(a);
                lightsIndices.push(i);
                this.lightsArea += a;
            }
        }

        this.lightsCDF = new Float32Array(lightsCDF);
        this.lightsIndices = new Int32Array(lightsIndices);

        if (lightsCDF.length == 0) return;

        for (let i: number = 1; i < this.lightsCDF.length; i++) {
            this.lightsCDF[i] = this.lightsCDF[i] + this.lightsCDF[i - 1];
        }

        for (let i: number = 0; i < this.lightsCDF.length; i++) {
            this.lightsCDF[i] = this.lightsCDF[i] / this.lightsArea;
        }
    }

    public release() {
        this.triangles = null;
        this.materials = null;
    }

    public load(geometry, position: Vector3, scale: number) {

        let vertices: Float32Array = geometry.vertices;
        let normals: Float32Array = geometry.normals ? geometry.normals : null;
        let texcoords: Float32Array = geometry.texcoords ? geometry.texcoords : null;
        let indices: Int32Array = geometry.indices;

        this.materials = [];
        let haveLightSource: boolean = this.prepareMaterials(geometry.materialIds);
        let numTriangles = indices.length / 3;
        this.triangles = [];

        for (let i: number = 0; i < numTriangles; i++) {
            const v0 = indices[i * 3];
            const v1 = indices[i * 3 + 1];
            const v2 = indices[i * 3 + 2];
            let triangle = new Triangle();
            triangle.positions[0] = new Vector3(vertices[v0 * 3], vertices[v0 * 3 + 1], vertices[v0 * 3 + 2]);
            triangle.positions[1] = new Vector3(vertices[v1 * 3], vertices[v1 * 3 + 1], vertices[v1 * 3 + 2]);
            triangle.positions[2] = new Vector3(vertices[v2 * 3], vertices[v2 * 3 + 1], vertices[v2 * 3 + 2]);

            triangle.positions[0] = triangle.positions[0].mulScalar(scale).add(position);
            triangle.positions[1] = triangle.positions[1].mulScalar(scale).add(position);
            triangle.positions[2] = triangle.positions[2].mulScalar(scale).add(position);

            if (normals != null) {
                triangle.normals[0] = new Vector3(normals[v0 * 3], normals[v0 * 3 + 1], normals[v0 * 3 + 2]);
                triangle.normals[1] = new Vector3(normals[v1 * 3], normals[v1 * 3 + 1], normals[v1 * 3 + 2]);
                triangle.normals[2] = new Vector3(normals[v2 * 3], normals[v2 * 3 + 1], normals[v2 * 3 + 2]);
            }
            else {
                // no normal data, calculate the normal for a polygon
                const e0: Vector3 = triangle.positions[1].sub(triangle.positions[0]);
                const e1: Vector3 = triangle.positions[2].sub(triangle.positions[0]);
                const n: Vector3 = (e0.op_remainder(e1)).normalize();

                triangle.normals[0] = n;
                triangle.normals[1] = n;
                triangle.normals[2] = n;
            }

            // material id
            triangle.materialId = 0;
            if (geometry.materialIds != null) {
                // read texture coordinates
                if ((texcoords != null) && mtls[geometry.materialIds[i]].isTextured) {
                    triangle.texcoords[0] = new Vector2(texcoords[v0 * 2], texcoords[v0 * 2 + 1]);
                    triangle.texcoords[1] = new Vector2(texcoords[v1 * 2], texcoords[v1 * 2 + 1]);
                    triangle.texcoords[2] = new Vector2(texcoords[v2 * 2], texcoords[v2 * 2 + 1]);
                }
                else {
                    triangle.texcoords[0] = new Vector2(1.0e+30, 1.0e+30);
                    triangle.texcoords[1] = new Vector2(1.0e+30, 1.0e+30);
                    triangle.texcoords[2] = new Vector2(1.0e+30, 1.0e+30);
                }

                triangle.materialId = geometry.materialIds[i];
            }
            else {
                triangle.texcoords[0] = new Vector2(1.0e+30, 1.0e+30);
                triangle.texcoords[1] = new Vector2(1.0e+30, 1.0e+30);
                triangle.texcoords[2] = new Vector2(1.0e+30, 1.0e+30);
            }


            this.triangles[i] = triangle;
        }

        this.calculateBBox();
        if (haveLightSource) this.prepareLightSources();
    }

    loadOBJ(url: string, position: Vector3, scale: number) {
        let geometry = OBJLoader.parseOBJ(fs.getTextFile(url));
        this.triangles = geometry.triangles;

        let haveLightSource = this.prepareMaterials(geometry.materialIds);

        this.calculateBBox();
        if (haveLightSource) this.prepareLightSources();

        // let obj = parseOBJ(fs.getTextFile(url));
        // this.load(obj, position, scale);
    }

    private prepareMaterials(materialIds) {

        let haveLightSource:boolean = false;

        if (materialIds != null) {
            for (let i: number = 0; i < mtls.length; i++) {
                let material = mtls[i];
                this.materials.push(material);
                if (material.isTextured) {
                    this.materials[i].texture = new Uint8Array(material.texture.length);
                    for (let j = 0; j < material.texture.length; j++) {
                        this.materials[i].texture[j] = material.texture[j];
                    }
                }
            }
            for (let i: number = 0; i < mtls.length; i++) {
                // Lambertian
                this.materials[i].brdf = 0;
                this.materials[i].eta = 1.7;
                this.materials[i].specularity = 1.0;
                let material = mtls[i];
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
            let mtl: Material = new Material();
            mtl.isTextured = false;
            mtl.brdf = 0;
            mtl.Kd = new Vector3(0.75, 0.75, 0.75);
            this.materials.push(mtl);
        }

        return haveLightSource;
    }
}
