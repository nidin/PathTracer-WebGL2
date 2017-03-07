System.register(["./gpurt", "./vector", "./fs", "./obj", "./quad", "./debugquad", "./feedbackbuffer"], function(exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var gpurt_1, vector_1, fs_1, obj_1, quad_1, debugquad_1, feedbackbuffer_1;
    var debugDraw, shaderDraw, shaderEyeRayTrace, canonicalCameraPosition, fieldOfView, lookAtPosition, gpurt, numPhotons, numSamples, frameCount, focalLength, apertureSize, m_nextUpdate, startedTime, maxNumberOfBounces, imageResolution, samplesTexture, randomEyeRayTexture, eyeRayTraceSurface, PathTracer;
    function createFullShader(vertex_shader_path, fragment_shader_path) {
        // create a fragment shader and a vertex shader
        let program = gl.createProgram();
        // console.log(`compiling ${vertex_shader_path}...`);
        let vertexShaderSource = fs_1.fs.getTextFile(vertex_shader_path);
        let shader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(shader, vertexShaderSource);
        gl.compileShader(shader);
        gl.attachShader(program, shader);
        // console.log("done.");
        // console.log(`compiling ${fragment_shader_path}...`);
        let fragmentShaderSource = fs_1.fs.getTextFile(fragment_shader_path);
        shader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(shader, fragmentShaderSource);
        gl.compileShader(shader);
        gl.attachShader(program, shader);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            let info = gl.getProgramInfoLog(program);
            console.error('Could not compile WebGL program. \n\n' + info);
        }
        else {
        }
        return program;
    }
    return {
        setters:[
            function (gpurt_1_1) {
                gpurt_1 = gpurt_1_1;
            },
            function (vector_1_1) {
                vector_1 = vector_1_1;
            },
            function (fs_1_1) {
                fs_1 = fs_1_1;
            },
            function (obj_1_1) {
                obj_1 = obj_1_1;
            },
            function (quad_1_1) {
                quad_1 = quad_1_1;
            },
            function (debugquad_1_1) {
                debugquad_1 = debugquad_1_1;
            },
            function (feedbackbuffer_1_1) {
                feedbackbuffer_1 = feedbackbuffer_1_1;
            }],
        execute: function() {
            gpurt = new gpurt_1.CGPURT();
            numPhotons = 0.0;
            numSamples = 0;
            frameCount = 0;
            focalLength = 13.0;
            apertureSize = 0.2;
            m_nextUpdate = 0;
            startedTime = 0;
            maxNumberOfBounces = 10;
            imageResolution = 512;
             //feedback
             //feedback
            PathTracer = class PathTracer {
                constructor() {
                    this.iteration = 0;
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
                    this.quad = new quad_1.Quad();
                }
                run() {
                    // create shaders
                    debugDraw = createFullShader("debug.vs", "debug.fs");
                    shaderDraw = createFullShader("draw.vs", "draw.fs");
                    shaderEyeRayTrace = createFullShader("eyeraytrace.vs", "eyeraytrace.fs");
                    this.debugQuad = new debugquad_1.DebugQuad(debugDraw);
                    // create textures
                    randomEyeRayTexture = new feedbackbuffer_1.FeedBackTexture(this.createTexture(0, gl.RGBA32F, imageResolution), this.createTexture(0, gl.RGBA32F, imageResolution));
                    samplesTexture = new feedbackbuffer_1.FeedBackTexture(this.createTexture(1, gl.RGBA32F, imageResolution), this.createTexture(1, gl.RGBA32F, imageResolution));
                    // create FBOs
                    // eye ray intersection data
                    eyeRayTraceSurface = new feedbackbuffer_1.FeedBackBuffer(imageResolution, imageResolution, 6);
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
                    canonicalCameraPosition = new vector_1.Vector3(0.0, 0.0, 1500.0);
                    fieldOfView = 45.0;
                    lookAtPosition = new vector_1.Vector3(0.0, 0.0, 0.0);
                    gpurt.camera.set(canonicalCameraPosition, lookAtPosition, imageResolution, imageResolution, fieldOfView);
                    let modelName1 = "cornell_metal";
                    let modelName2 = "models/stanford-dragon";
                    let modelName3 = "minimum-raytrace-planes";
                    let modelName4 = "models/dragon_2";
                    let modelName = modelName1;
                    // load mesh data
                    obj_1.loadMTL(fs_1.fs.getTextFile(modelName + ".mtl"));
                    console.log(obj_1.mtls);
                    gpurt.mesh.loadOBJ(modelName + ".obj", new vector_1.Vector3(0.0, 0.0, 0.0), 0.01);
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
                render() {
                    if (this.iteration++ > 100) {
                        return;
                    }
                    let bboxOffsets = new vector_1.Vector4();
                    bboxOffsets.x = (0.5) / (gpurt.bboxDataSizeX * 2.0);
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
                eyeRayTracing(bboxOffsets) {
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
                    let vData = new vector_1.Vector4();
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
                createTexture(textureIndex, format, bufferSize) {
                    gl.activeTexture(gl.TEXTURE0 + textureIndex);
                    let texture = gl.createTexture();
                    gl.bindTexture(gl.TEXTURE_2D, texture);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                    gl.texImage2D(gl.TEXTURE_2D, 0, format, bufferSize, bufferSize, 0, gl.RGBA, gl.FLOAT, null);
                    return texture;
                }
                setTexture(textureIndex, texture) {
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
            };
            exports_1("PathTracer", PathTracer);
        }
    }
});
//# sourceMappingURL=PathTracer.js.map