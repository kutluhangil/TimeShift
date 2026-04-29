export async function downsampleImageWebGL(img: HTMLImageElement, tgtWidth: number, tgtHeight: number): Promise<string> {
    const canvas = document.createElement('canvas');
    canvas.width = tgtWidth;
    canvas.height = tgtHeight;
    const gl = canvas.getContext('webgl2', { preserveDrawingBuffer: true }) || canvas.getContext('webgl', { preserveDrawingBuffer: true });
    
    if (!gl) {
         throw new Error("WebGL not supported");
    }
    
    // Very simple WebGL texture draw
    const vertexShaderSource = `
        attribute vec2 a_position;
        attribute vec2 a_texCoord;
        varying vec2 v_texCoord;
        void main() {
            // Flip Y axis since WebGL has 0,0 at bottom left
            gl_Position = vec4(a_position.x, -a_position.y, 0, 1);
            v_texCoord = a_texCoord;
        }
    `;
    const fragmentShaderSource = `
        precision mediump float;
        uniform sampler2D u_image;
        varying vec2 v_texCoord;
        void main() {
            gl_FragColor = texture2D(u_image, v_texCoord);
        }
    `;
    const compileShader = (gl: WebGLRenderingContext | WebGL2RenderingContext, source: string, type: number) => {
        const shader = gl.createShader(type);
        if (!shader) return null;
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error(gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    };
    
    const makeProgram = (gl: WebGLRenderingContext | WebGL2RenderingContext) => {
        const vShader = compileShader(gl, vertexShaderSource, gl.VERTEX_SHADER);
        const fShader = compileShader(gl, fragmentShaderSource, gl.FRAGMENT_SHADER);
        if(!vShader || !fShader) return null;
        const prog = gl.createProgram();
        if(!prog) return null;
        gl.attachShader(prog, vShader);
        gl.attachShader(prog, fShader);
        gl.linkProgram(prog);
        return prog;
    };

    const program = makeProgram(gl as WebGLRenderingContext);
    if (!program) throw new Error("Could not compile WebGL program");

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -1.0, -1.0,  1.0, -1.0,  -1.0, 1.0,
        -1.0, 1.0,   1.0, -1.0,   1.0, 1.0
    ]), gl.STATIC_DRAW);

    const texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        0.0, 0.0,  1.0, 0.0,  0.0, 1.0,
        0.0, 1.0,  1.0, 0.0,  1.0, 1.0
    ]), gl.STATIC_DRAW);

    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0,0,0,0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);

    const positionLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const texCoordLocation = gl.getAttribLocation(program, "a_texCoord");
    gl.enableVertexAttribArray(texCoordLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    return canvas.toDataURL('image/jpeg', 0.8);
}
