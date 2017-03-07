///<reference path="../src/declaration.d.ts" />
// import {parseOBJ, Vector3} from "xray";
// import {xray, parseOBJ} from "xray";
// import {mtls, parseOBJ, loadMTL, Mesh, Vector3} from "../src/xray";
import {mtls, loadMTL, parseOBJ} from "../src/obj";
import {Mesh} from "../src/mesh";
import {Vector3} from "../src/vector";
import {fs} from "../src/fs";
import {PathTracer} from "../src/PathTracer";
/**
 * Created by Nidin Vinayakan on 23/02/17.
 */
export class PathTracerTest {

    mapper: PathTracer;

    constructor() {

        this.load(() => {
            console.log("done");
            this.mapper = new PathTracer();
            this.mapper.run();
        });

    }

    load(callback) {

        let filesToLoad = [
            // {src: "textures/debug_texture.jpg", name:"debug_texture.jpg", type: "image"},

            {src: "models/cornell_metal.obj", name:"cornell_metal.obj", type: "text"},
            {src: "models/cornell_metal.mtl", name:"cornell_metal.mtl", type: "text"},

            {src: "models/minimum-raytrace-planes/minimum-raytrace.obj", name:"minimum-raytrace-planes.obj", type: "text"},
            {src: "models/minimum-raytrace-planes/minimum-raytrace.mtl", name:"minimum-raytrace-planes.mtl", type: "text"},

            {src: "models/stanford-dragon/stanford-dragon.obj", name:"models/stanford-dragon.obj", type: "text"},
            {src: "models/stanford-dragon/stanford-dragon.mtl", name:"models/stanford-dragon.mtl", type: "text"},

            {src: "models/dragon_2/dragon_2.obj", name:"models/dragon_2.obj", type: "text"},
            {src: "models/dragon_2/dragon_2.mtl", name:"models/dragon_2.mtl", type: "text"},

            {src: "../src/shaders/debug.fs", name:"debug.fs", type: "text"},
            {src: "../src/shaders/debug.vs", name:"debug.vs", type: "text"},
            {src: "../src/shaders/draw.fs", name:"draw.fs", type: "text"},
            {src: "../src/shaders/draw.vs", name:"draw.vs", type: "text"},
            {src: "../src/shaders/eyeraytrace.fs", name:"eyeraytrace.fs", type: "text"},
            {src: "../src/shaders/eyeraytrace.vs", name:"eyeraytrace.vs", type: "text"},
        ];

        let numFiles = filesToLoad.length;
        let numFilesLoaded = 0;

        filesToLoad.forEach((file) => {

            if(file.type == "image"){
                let img = new Image();
                img.src = file.src;
                numFilesLoaded++;
                if (numFilesLoaded == numFiles) {
                    callback();
                }
            } else {
                fetch(file.src).then((response) => {
                    return file.type == "text" ? response.text() : response.arrayBuffer();
                }).then((contents) => {
                    file.type == "text" ? fs.addTextFile(file.name, contents) : fs.addBinFile(file.name, contents);
                    numFilesLoaded++;
                    if (numFilesLoaded == numFiles) {
                        callback();
                    }
                })
            }

        });
    }
}