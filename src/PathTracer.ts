import {CGPURT} from "./gpurt";
import {Vector3, Vector4} from "./vector";
import {fillArray, vec4array_to_f32Array} from "./utils";
import {fs} from "./fs";
import {loadMTL, mtls} from "./obj";
import {Quad} from "./quad";
import {DebugQuad} from "./debugquad";
import {FeedBackTexture, FeedBackBuffer} from "./feedbackbuffer";
/**
 * Created by Nidin Vinayakan on 24/02/17.
 */

declare const gl: WebGLRenderingContext;

let debugDraw, shaderDraw, shaderEyeRayTrace;

let canonicalCameraPosition: Vector3;
let fieldOfView: number;
let lookAtPosition: Vector3;

let gpurt: CGPURT = new CGPURT();
let numPhotons: number = 0.0;
let numSamples: number = 0;
let frameCount: number = 0;
let focalLength: number = 13.0;
let apertureSize: number = 0.2;
let m_nextUpdate: number = 0;
let startedTime: number = 0;
const maxNumberOfBounces: number = 10;
const imageResolution: number = 512;
let samplesTexture: FeedBackTexture; //feedback
let randomEyeRayTexture: FeedBackTexture; //feedback
let eyeRayTraceSurface: FeedBackBuffer;

function createFullShader(vertex_shader_path: string, fragment_shader_path: string) {
    // create a fragment shader and a vertex shader
    let program = gl.createProgram();
    // console.log(`compiling ${vertex_shader_path}...`);

    let vertexShaderSource = fs.getTextFile(vertex_shader_path);

    let shader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(shader, vertexShaderSource);
    gl.compileShader(shader);
    gl.attachShader(program, shader);

    // console.log("done.");

    // console.log(`compiling ${fragment_shader_path}...`);
    let fragmentShaderSource = fs.getTextFile(fragment_shader_path);

    shader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(shader, fragmentShaderSource);
    gl.compileShader(shader);
    gl.attachShader(program, shader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        let info = gl.getProgramInfoLog(program);
        console.error('Could not compile WebGL program. \n\n' + info);
    } else {
        // console.log("done.");
    }

    return program;
}

export class PathTracer {

    quad: Quad;
    debugQuad: DebugQuad;

    constructor() {
        this.init();
    }

    init() {

        console.log("MAX_COLOR_ATTACHMENTS:" + gl.getParameter(gl.MAX_COLOR_ATTACHMENTS));
        console.log("MAX_DRAW_BUFFERS:" + gl.getParameter(gl.MAX_DRAW_BUFFERS));
        console.log("MAX_TEXTURE_SIZE:" + gl.getParameter(gl.MAX_TEXTURE_SIZE));
        console.log("MAX_TEXTURE_IMAGE_UNITS:" + gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS));
        console.log("MAX_VERTEX_TEXTURE_IMAGE_UNITS:" + gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS));
        console.log("MAX_COMBINED_TEXTURE_IMAGE_UNITS:" + gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS));

        //Extensions
        gl.getExtension('EXT_color_buffer_float');

        this.quad = new Quad();

    }

    run() {

        // create shaders
        debugDraw = createFullShader("debug.vs", "debug.fs");
        shaderDraw = createFullShader("draw.vs", "draw.fs");
        shaderEyeRayTrace = createFullShader("eyeraytrace.vs", "eyeraytrace.fs");

        this.debugQuad = new DebugQuad(debugDraw);

        // create textures

        randomEyeRayTexture = new FeedBackTexture(
            this.createTexture(0, gl.RGBA32F, imageResolution),
            this.createTexture(0, gl.RGBA32F, imageResolution)
        );

        samplesTexture = new FeedBackTexture(
            this.createTexture(1, gl.RGBA32F, imageResolution),
            this.createTexture(1, gl.RGBA32F, imageResolution)
        );

        // create FBOs
        // eye ray intersection data
        eyeRayTraceSurface = new FeedBackBuffer(imageResolution, imageResolution, 6);
        gl.bindFramebuffer(gl.FRAMEBUFFER, eyeRayTraceSurface.drawBuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, randomEyeRayTexture.target, 0);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, samplesTexture.target, 0);
        eyeRayTraceSurface.addTexture(0, randomEyeRayTexture);
        eyeRayTraceSurface.addTexture(1, samplesTexture);
        gl.drawBuffers([
            gl.COLOR_ATTACHMENT0,
            gl.COLOR_ATTACHMENT1,
        ]);

        //attach read buffers
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, eyeRayTraceSurface.readBuffer);
        gl.framebufferTexture2D(gl.READ_FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, randomEyeRayTexture.source, 0);
        gl.framebufferTexture2D(gl.READ_FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, samplesTexture.source, 0);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        // initialize misc data
        frameCount = 0;
        // gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.clearColor(0.5, 0.5, 0.5, 1.0);

        canonicalCameraPosition = new Vector3(0.0, 0.0, 1500.0);
        fieldOfView = 45.0;
        lookAtPosition = new Vector3(0.0, 0.0, 0.0);
        gpurt.camera.set(canonicalCameraPosition, lookAtPosition, imageResolution, imageResolution, fieldOfView);

        let modelName1 = "cornell_metal";
        let modelName2 = "models/stanford-dragon";
        let modelName3 = "minimum-raytrace-planes";
        let modelName4 = "models/dragon_2";

        let modelName = modelName1;

        // load mesh data
        loadMTL(fs.getTextFile(modelName + ".mtl"));

        console.log(mtls);

        gpurt.mesh.loadOBJ(modelName + ".obj", new Vector3(0.0, 0.0, 0.0), 0.01);

        // precalcuation (BVH construction) for mesh
        console.log("building BVH...");
        gpurt.precalculateMeshData();
        console.log("done");

        if (gpurt.mesh.lightsCDF.length == 0) {
            console.log("no light source is defined, use constant illumination");
        }

        // enter the main loop
        // gl.clear(gl.COLOR_BUFFER_BIT);
        startedTime = performance.now();
        console.log("start rendering...");
        requestAnimationFrame(this.render.bind(this));
    }

    iteration = 0;

    render() {

        if (this.iteration++ > 100) {
            return;
        }

        let bboxOffsets = new Vector4();
        bboxOffsets.x = (                             0.5) / (gpurt.bboxDataSizeX * 2.0);
        bboxOffsets.y = (gpurt.bboxDataSizeY * 3.0 + 0.5) / (gpurt.bboxDataSizeY * 4.0);
        bboxOffsets.z = (gpurt.bboxDataSizeX + 0.5) / (gpurt.bboxDataSizeX * 2.0);
        bboxOffsets.w = (gpurt.bboxDataSizeY * 3.0 + 0.5) / (gpurt.bboxDataSizeY * 4.0);

        this.eyeRayTracing(bboxOffsets);

        // update
        gl.finish();
        frameCount++;
        if ((performance.now() - m_nextUpdate) > 0) {
            let numMPaths = (numPhotons + numSamples * imageResolution * imageResolution) / (1024.0 * 1024.0);
            console.log(`${(performance.now() - startedTime) / 1000} sec,  ${numMPaths / ((performance.now() - startedTime) / 1000)} M paths/sec,  ${numMPaths} M paths`);
            m_nextUpdate = performance.now() + 1000;
        }

        requestAnimationFrame(this.render.bind(this));
    }

    private eyeRayTracing(bboxOffsets: Vector4) {
        // eye ray tracing
        //######################################
        //#      PASS 1 - EYE RAY TRACING      #
        //######################################
        eyeRayTraceSurface.bind();

        gl.useProgram(shaderEyeRayTrace);

        // ray tracing parameters
        gl.uniform4f(gl.getUniformLocation(shaderEyeRayTrace, "offsetToBBoxMinMax"), bboxOffsets.x, bboxOffsets.y, bboxOffsets.z, bboxOffsets.w);

        gl.uniform1i(gl.getUniformLocation(shaderEyeRayTrace, "texturePolygons"), 3);
        this.setTexture(3, gpurt.textureTriangles);

        gl.uniform1i(gl.getUniformLocation(shaderEyeRayTrace, "cubeTextureBBoxRootIndices"), 4);
        this.setCubeTexture(4, gpurt.cubeTextureBBoxRootIndices);

        gl.uniform1i(gl.getUniformLocation(shaderEyeRayTrace, "textureBVH"), 5);
        this.setTexture(5, gpurt.textureBVHs);

        gl.uniform1i(gl.getUniformLocation(shaderEyeRayTrace, "volumeTextureTextures"), 6);
        this.setVolumeTexture(6, gpurt.volumeTextureTextures);

        // material data
        gl.uniform1i(gl.getUniformLocation(shaderEyeRayTrace, "textureMaterials"), 7);
        this.setTexture(7, gpurt.textureMaterials);

        gl.uniform1f(gl.getUniformLocation(shaderEyeRayTrace, "materialStride"), gpurt.materialDataStride);
        gl.uniform1f(gl.getUniformLocation(shaderEyeRayTrace, "materialNumRcp"), 1.0 / (gpurt.mesh.materials.length));
        gl.uniform1f(gl.getUniformLocation(shaderEyeRayTrace, "lightSummedArea"), gpurt.mesh.lightsArea);

        // camera parameters
        let vData = new Vector4();
        vData.x = gpurt.camera.origin.x;
        vData.y = gpurt.camera.origin.y;
        vData.z = gpurt.camera.origin.z;
        gl.uniform3f(gl.getUniformLocation(shaderEyeRayTrace, "cameraPosition"), vData.x, vData.y, vData.z);

        gl.uniform3f(gl.getUniformLocation(shaderEyeRayTrace, "cameraU"), gpurt.camera.u.x, gpurt.camera.u.y, gpurt.camera.u.z);
        gl.uniform3f(gl.getUniformLocation(shaderEyeRayTrace, "cameraV"), gpurt.camera.v.x, gpurt.camera.v.y, gpurt.camera.v.z);
        gl.uniform3f(gl.getUniformLocation(shaderEyeRayTrace, "cameraW"), gpurt.camera.w.x, gpurt.camera.w.y, gpurt.camera.w.z);

        vData.x = gpurt.camera.width * 0.5;
        vData.y = gpurt.camera.height * 0.5;
        vData.z = gpurt.camera.distance;
        gl.uniform3f(gl.getUniformLocation(shaderEyeRayTrace, "cameraParams"), vData.x, vData.y, vData.z);

        // antialiasing offset
        vData.x = (Math.random() - 0.5) * 1.25;
        vData.y = (Math.random() - 0.5) * 1.25;
        gl.uniform2f(gl.getUniformLocation(shaderEyeRayTrace, "AAOffset"), vData.x, vData.y);

        // some extra parameters
        gl.uniform1i(gl.getUniformLocation(shaderEyeRayTrace, "randomTexture"), 0);
        this.setTexture(0, randomEyeRayTexture.source);

        gl.uniform1i(gl.getUniformLocation(shaderEyeRayTrace, "samplesTexture"), 1);
        this.setTexture(1, samplesTexture.source);

        gl.uniform1f(gl.getUniformLocation(shaderEyeRayTrace, "focalLength"), focalLength);
        gl.uniform1i(gl.getUniformLocation(shaderEyeRayTrace, "maxPathLength"), maxNumberOfBounces);
        gl.uniform1f(gl.getUniformLocation(shaderEyeRayTrace, "apertureSize"), apertureSize);
        gl.uniform2f(gl.getUniformLocation(shaderEyeRayTrace, "polygonDataStride"), gpurt.polygonDataStride.x, gpurt.polygonDataStride.y);

        numSamples++;

        this.quad.draw(shaderEyeRayTrace, imageResolution, imageResolution);
        //swap feedback textures
        eyeRayTraceSurface.swap();

        // this.debugQuad.drawTex(samplesTexture.target, 512, 512);

        this.debugQuad.draw(shaderDraw, samplesTexture.source, 512, 512, numSamples);
        // this.debugQuad.drawTex(gpurt.textureTriangles, 512, 512);

        return;
    }

    createTexture(textureIndex, format: GLenum, bufferSize): WebGLTexture {
        gl.activeTexture(gl.TEXTURE0 + textureIndex);
        let texture: WebGLTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, format, bufferSize, bufferSize, 0, gl.RGBA, gl.FLOAT, null);

        return texture;
    }

    setTexture(textureIndex: number, texture: WebGLTexture): WebGLTexture {
        gl.activeTexture(gl.TEXTURE0 + textureIndex);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        return texture;
    }

    setCubeTexture(cubeTextureIndex, cubeTexture) {
        gl.activeTexture(gl.TEXTURE0 + cubeTextureIndex);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeTexture);
    }

    setVolumeTexture(volumeTextureIndex, volumeTexture) {
        gl.activeTexture(gl.TEXTURE0 + volumeTextureIndex);
        gl.bindTexture(gl.TEXTURE_3D, volumeTexture);
    }

    distroy() {
        // release the resources of gpurt
        gpurt.release();

        // delete things

        gl.deleteProgram(shaderDraw);
        gl.deleteProgram(shaderEyeRayTrace);

        samplesTexture.distroy();
        randomEyeRayTexture.distroy();
        eyeRayTraceSurface.distroy();

        return 0;
    }
}