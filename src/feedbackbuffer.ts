/**
 * Created by Nidin Vinayakan on 01/03/17.
 */
export class FeedBackTexture {

    public state: boolean = false;

    constructor(private texture0: WebGLTexture, private texture1: WebGLTexture) {

    }

    get source(): WebGLTexture {
        return this.state ? this.texture0 : this.texture1;
    }

    get target(): WebGLTexture {
        return this.state ? this.texture1 : this.texture0;
    }

    swap() {
        this.state = !this.state;
    }

    distroy() {
        gl.deleteTexture(this.texture0);
        gl.deleteTexture(this.texture1);
    }

}
export class FeedBackBuffer {

    public drawBuffer: WebGLFramebuffer;
    public readBuffer: WebGLFramebuffer;
    textures: {index: number, texture: FeedBackTexture}[];

    constructor(public width: number, public height: number, public numAttachments: number) {
        this.drawBuffer = gl.createFramebuffer();
        this.readBuffer = gl.createFramebuffer();
        this.textures = [];
    }

    addTexture(index: number, value: FeedBackTexture) {
        this.textures.push({index: index, texture: value});
    }

    bind() {
        // gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.readBuffer);
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, this.drawBuffer);
        checkFrameBuffer();
    }

    swap() {
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.drawBuffer);
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, this.readBuffer);

        checkFrameBuffer();

        for (let i = 0; i < this.textures.length; i++) {
            let group = this.textures[i];
            gl.readBuffer(gl.COLOR_ATTACHMENT0 + group.index);
            gl.drawBuffers(this.getSwapAttachments(group.index));


            gl.clearBufferfv(gl.COLOR, 0, [0.0, 0.0, 0.0, 1.0]);
            gl.blitFramebuffer(
                0, 0, this.width, this.height,
                0, 0, this.width, this.height,
                gl.COLOR_BUFFER_BIT, gl.NEAREST
            );

        }

        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.readBuffer);
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, this.drawBuffer);
    }

    private getSwapAttachments(index: number) {
        let completeAttachments = [];
        for (let i = 0; i < this.numAttachments; i++) {
            completeAttachments.push(i == index ? gl.COLOR_ATTACHMENT0 + i : gl.NONE);
        }
        return completeAttachments;
    }

    distroy() {
        gl.deleteFramebuffer(this.drawBuffer);
        gl.deleteFramebuffer(this.readBuffer);
    }
}

function checkFrameBuffer(): void {
    checkDrawBuffer();
    checkReadBuffer();
}
function checkDrawBuffer(): void {

    let code = gl.checkFramebufferStatus(gl.DRAW_FRAMEBUFFER);

    switch (code) {
        case gl.FRAMEBUFFER_COMPLETE:
            return;
        case gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT:
            console.error("FRAMEBUFFER_INCOMPLETE_ATTACHMENT");
            break;
        case gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT:
            console.error("FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT");
            break;
        case gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS:
            console.error("FRAMEBUFFER_INCOMPLETE_DIMENSIONS");
            break;
        case gl.FRAMEBUFFER_UNSUPPORTED:
            console.error("FRAMEBUFFER_UNSUPPORTED");
            break;
        case gl.FRAMEBUFFER_INCOMPLETE_MULTISAMPLE:
            console.error("FRAMEBUFFER_INCOMPLETE_MULTISAMPLE");
            break;
        case gl.RENDERBUFFER_SAMPLES:
            return;
    }
}
function checkReadBuffer(): void {

    let code = gl.checkFramebufferStatus(gl.READ_FRAMEBUFFER);

    switch (code) {
        case gl.FRAMEBUFFER_COMPLETE:
            return;
        case gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT:
            console.error("FRAMEBUFFER_INCOMPLETE_ATTACHMENT");
            break;
        case gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT:
            console.error("FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT");
            break;
        case gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS:
            console.error("FRAMEBUFFER_INCOMPLETE_DIMENSIONS");
            break;
        case gl.FRAMEBUFFER_UNSUPPORTED:
            console.error("FRAMEBUFFER_UNSUPPORTED");
            break;
        case gl.FRAMEBUFFER_INCOMPLETE_MULTISAMPLE:
            console.error("FRAMEBUFFER_INCOMPLETE_MULTISAMPLE");
            break;
        case gl.RENDERBUFFER_SAMPLES:
            return;
    }
}
