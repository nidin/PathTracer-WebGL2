import {Material} from "./mesh";
import {Vector3} from "./vector";
/**
 * Created by nidin on 2017-02-18.
 */
export function get_indices(word: string) {

    let ix = word.split("/");

    return {
        vI: parseInt(ix[0]),
        tI: parseInt(ix[1]),
        nI: parseInt(ix[2])
    }
}

export var mtls: Material[] = [];
export async function loadPPM(fileName: string, i: number) {
    let response = await fetch(fileName);
    let contents = await response.text();
}

export function loadMTL(contents: string, base = "") {

    let mtl: Material;
    let limit = contents.length;
    let j = 0;

    while (j < limit) {
        let lineObj = readLine(contents, j);
        let lineStr: string = lineObj.line;

        let i = mtls.length;

        if (lineStr.substring(0, 6) == "newmtl") {
            lineStr = lineStr.substring(7, lineStr.length);
            mtl = new Material();
            mtl.name = lineStr;
            mtl.isTextured = false;
            mtls.push(mtl);
        }
        else if (lineStr.substring(0, 2) == "Ka") {
            lineStr = lineStr.substring(3, lineStr.length);
            let rgb = readFloats(lineStr);
            mtl.Ka = new Vector3(rgb[0], rgb[1], rgb[2]);
        }
        else if (lineStr.substring(0, 2) == "Kd") {
            lineStr = lineStr.substring(3, lineStr.length);
            let rgb = readFloats(lineStr);
            mtl.Kd = new Vector3(rgb[0], rgb[1], rgb[2]);
        }
        else if (lineStr.substring(0, 2) == "Ks") {
            lineStr = lineStr.substring(3, lineStr.length);
            let rgb = readFloats(lineStr);
            mtl.Ks = new Vector3(rgb[0], rgb[1], rgb[2]);
        }
        else if (lineStr.substring(0, 2) == "Ns") {
            lineStr = lineStr.substring(3, lineStr.length);
            mtl.Ns = parseFloat(lineStr);
        }
        else if (lineStr.substring(0, 6) == "map_Kd") {
            // lineStr = lineStr.substring(7, lineStr.length - 2);
            // mtls[i - 1].isTextured = true;
            //loadPPM(lineStr, i - 1);
        }

        j = lineObj.end + 1;
    }
}


export function parseOBJ(contents: string, base = "", callback?) {

    let nVertices: number;
    let vertices: Float32Array;
    let normals: Float32Array;
    let texcoords: Float32Array;
    let nIndices: number;
    let indices: Int32Array;
    let materialIds: number[];

    let nv: number = 0, nn: number = 0, nf: number = 0, nt: number = 0;
    let limit = contents.length;
    let i = 0;
    let lineObj;

    while (i < limit) {
        lineObj = readLine(contents, i);
        let line: string = lineObj.line;

        if (line.substr(0, 6) == "mtllib") {
            //await loadMTL(base + line.substring(7, line.length));
        }

        if (line[0] == 'v') {
            if (line[1] == 'n') {
                nn++;
            }
            else if (line[1] == 't') {
                nt++;
            }
            else {
                nv++;
            }
        }
        else if (line[0] == 'f') {
            nf++;
        }

        i = lineObj.end + 1;
    }

    let n = new Float32Array(3 * (nn > nf ? nn : nf));
    let v = new Float32Array(3 * nv);
    let t = new Float32Array(2 * nt);

    let vInd = new Int32Array(3 * nf);
    let nInd = new Int32Array(3 * nf);
    let tInd = new Int32Array(3 * nf);
    let mInd = new Int32Array(nf);

    let nvertices = 0;
    let nnormals = 0;
    let ntexcoords = 0;
    let nindices = 0;
    let ntriangles = 0;
    let noNormals = false;
    let noTexCoords = false;
    let noMaterials = true;
    let cmaterial = 0;

    i = 0;

    while (i < limit) {
        let lineObj = readLine(contents, i);
        let line = lineObj.line;
        let lineStr: string = line;

        if (line[0] == 'v') {
            if (line[1] == 'n') {
                let xyz = readFloats(line.substring(3, line.length));
                let x = xyz[0];
                let y = xyz[1];
                let z = xyz[2];
                //sscanf(&line[2], "%f %f %f\n", &x, &y, &z);
                let l = Math.sqrt(x * x + y * y + z * z);
                x = x / l;
                y = y / l;
                z = z / l;
                n[nnormals] = x;
                nnormals++;
                n[nnormals] = y;
                nnormals++;
                n[nnormals] = z;
                nnormals++;
            }
            else if (line[1] == 't') {
                let uv = readFloats(line.substring(3, line.length));
                // sscanf(&line[2], "%f %f\n", &u, &v);
                t[ntexcoords] = uv[0];
                ntexcoords++;
                t[ntexcoords] = uv[1];
                ntexcoords++;
            }
            else {
                let xyz = readFloats(line.substring(2, line.length));
                // sscanf( &line[1], "%f %f %f\n", &x, &y, &z);
                v[nvertices] = xyz[0];
                nvertices++;
                v[nvertices] = xyz[1];
                nvertices++;
                v[nvertices] = xyz[2];
                nvertices++;
            }
        }
        if (lineStr.substr(0, 6) == "usemtl") {
            lineStr = lineStr.substring(7, lineStr.length);

            if (mtls.length != 0) {
                for (let i = 0; i < mtls.length; i++) {
                    if (lineStr == mtls[i].name) {
                        cmaterial = i;
                        noMaterials = false;
                        break;
                    }
                }
            }

        }
        else if (line[0] == 'f') {
            // let s1[32], s2[32], s3[32];
            let s = line.substring(2, line.length).split(" ");
            let vI, tI, nI;

            mInd[ntriangles] = cmaterial;

            // indices for first vertex
            let indices = get_indices(s[0]);
            vI = indices.vI;
            tI = indices.tI;
            nI = indices.nI;

            vInd[nindices] = vI - 1;
            if (nI) {
                nInd[nindices] = nI - 1;
            }
            else {
                noNormals = true;
            }

            if (tI) {
                tInd[nindices] = tI - 1;
            }
            else {
                noTexCoords = true;
            }
            nindices++;

            // indices for second vertex
            indices = get_indices(s[1]);
            vI = indices.vI;
            tI = indices.tI;
            nI = indices.nI;

            vInd[nindices] = vI - 1;
            if (nI) {
                nInd[nindices] = nI - 1;
            }
            else {
                noNormals = true;
            }

            if (tI) {
                tInd[nindices] = tI - 1;
            }
            else {
                noTexCoords = true;
            }
            nindices++;

            // indices for third vertex
            indices = get_indices(s[2]);
            vI = indices.vI;
            tI = indices.tI;
            nI = indices.nI;

            vInd[nindices] = vI - 1;
            if (nI) {
                nInd[nindices] = nI - 1;
            }
            else {
                noNormals = true;
            }

            if (tI) {
                tInd[nindices] = tI - 1;
            }
            else {
                noTexCoords = true;
            }
            nindices++;

            ntriangles++;
        }

        i = lineObj.end + 1;
    }

    // we don't support separate indices for normals, vertices, and texture coordinates.
    vertices = new Float32Array(ntriangles * 9);
    if (!noNormals) {
        normals = new Float32Array(ntriangles * 9);
    }
    else {
        normals = null;
    }

    if (!noTexCoords) {
        texcoords = new Float32Array(ntriangles * 6);
    }
    else {
        texcoords = null;
    }

    if (!noMaterials) {
        materialIds = [];
    }
    else {
        materialIds = null;
    }

    indices = new Int32Array(ntriangles * 3);
    nVertices = ntriangles * 3;
    nIndices = ntriangles * 3;

    for (let i = 0; i < ntriangles; i++) {
        if (!noMaterials) {
            materialIds[i] = mInd[i];
        }

        let vi0 = vInd[3 * i], vi1 = vInd[3 * i + 1], vi2 = vInd[3 * i + 2];

        indices[3 * i] = 3 * i;
        indices[3 * i + 1] = 3 * i + 1;
        indices[3 * i + 2] = 3 * i + 2;

        vertices[9 * i] = v[3 * vi0];
        vertices[9 * i + 1] = v[3 * vi0 + 1];
        vertices[9 * i + 2] = v[3 * vi0 + 2];

        vertices[9 * i + 3] = v[3 * vi1];
        vertices[9 * i + 4] = v[3 * vi1 + 1];
        vertices[9 * i + 5] = v[3 * vi1 + 2];

        vertices[9 * i + 6] = v[3 * vi2];
        vertices[9 * i + 7] = v[3 * vi2 + 1];
        vertices[9 * i + 8] = v[3 * vi2 + 2];

        if (!noNormals) {

            let ni0 = nInd[3 * i], ni1 = nInd[3 * i + 1], ni2 = nInd[3 * i + 2];

            normals[9 * i] = n[3 * ni0];
            normals[9 * i + 1] = n[3 * ni0 + 1];
            normals[9 * i + 2] = n[3 * ni0 + 2];

            normals[9 * i + 3] = n[3 * ni1];
            normals[9 * i + 4] = n[3 * ni1 + 1];
            normals[9 * i + 5] = n[3 * ni1 + 2];

            normals[9 * i + 6] = n[3 * ni2];
            normals[9 * i + 7] = n[3 * ni2 + 1];
            normals[9 * i + 8] = n[3 * ni2 + 2];
        }

        if (!noTexCoords) {

            let ti0 = tInd[3 * i], ti1 = tInd[3 * i + 1], ti2 = tInd[3 * i + 2];

            texcoords[6 * i] = t[2 * ti0];
            texcoords[6 * i + 1] = t[2 * ti0 + 1];

            texcoords[6 * i + 2] = t[2 * ti1];
            texcoords[6 * i + 3] = t[2 * ti1 + 1];

            texcoords[6 * i + 4] = t[2 * ti2];
            texcoords[6 * i + 5] = t[2 * ti2 + 1];
        }

    }

    let result = {
        vertices: vertices,
        normals: normals,
        texcoords: texcoords,
        indices: indices,
        materialIds: materialIds
    };
    if (callback) {
        callback(result);
    }
    return result;
}

export function getMaterial(name: string): {id:number, mat:Material} {
    if (mtls.length != 0) {
        for (let i = 0; i < mtls.length; i++) {
            if (name == mtls[i].name) {
                return {id:i, mat:mtls[i]};
            }
        }
    }
    return null;
}

function readLine(str, start = 0, length?): {line: string, end: number} {
    let i = start;
    let limit = length ? length : str.length;
    let line = "";
    while (i < limit) {
        let c = str[i];
        if (c == "\n") {
            return {line: line, end: i};
        }
        i = i + 1;
        line += c;
    }
    return {line: line, end: i};
}

function readIntegers(str): Int32Array {
    return new Int32Array(str.split(" "));
}

function readFloats(str): Float32Array {
    return new Float32Array(str.split(" "));
}