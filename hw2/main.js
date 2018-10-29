var g = {};

function init() {
    // create gl context
    var gl = initWebGL("canvas-main");
    if (!gl) return;

    // parameters: gl context, vshader id, fshader id, attributes, clear color, clear depth
    g.program = simpleSetup(gl, "vshader", "fshader", ["vNormal", "vColor", "vPosition"], [0, 0, 0, 1], 10000);

    gl.uniform3f(gl.getUniformLocation(g.program, "lightDir"), 0, 0, 1);

    g.box = makeBox(gl);
    /*
    var colors = new Uint8Array([
        0, 0, 1, 1,   0, 0, 1, 1,   0, 0, 1, 1,   0, 0, 1, 1,     // v0-v1-v2-v3 front
        1, 0, 0, 1,   1, 0, 0, 1,   1, 0, 0, 1,   1, 0, 0, 1,     // v0-v3-v4-v5 right
        0, 1, 0, 1,   0, 1, 0, 1,   0, 1, 0, 1,   0, 1, 0, 1,     // v0-v5-v6-v1 top
        1, 1, 0, 1,   1, 1, 0, 1,   1, 1, 0, 1,   1, 1, 0, 1,     // v1-v6-v7-v2 left
        1, 0, 1, 1,   1, 0, 1, 1,   1, 0, 1, 1,   1, 0, 1, 1,     // v7-v4-v3-v2 bottom
        0, 1, 1, 1,   0, 1, 1, 1,   0, 1, 1, 1,   0, 1, 1, 1      // v4-v7-v6-v5 back
    ]);
    */
    var colors = new Uint8Array([
        1, 1, 1, 1,   1, 1, 1, 1,   1, 1, 1, 1,   1, 1, 1, 1,     // v0-v1-v2-v3 front
        1, 1, 1, 1,   1, 1, 1, 1,   1, 1, 1, 1,   1, 1, 1, 1,     // v0-v3-v4-v5 right
        1, 1, 1, 1,   1, 1, 1, 1,   1, 1, 1, 1,   1, 1, 1, 1,     // v0-v5-v6-v1 top
        1, 1, 1, 1,   1, 1, 1, 1,   1, 1, 1, 1,   1, 1, 1, 1,     // v1-v6-v7-v2 left
        1, 1, 1, 1,   1, 1, 1, 1,   1, 1, 1, 1,   1, 1, 1, 1,     // v7-v4-v3-v2 bottom
        1, 1, 1, 1,   1, 1, 1, 1,   1, 1, 1, 1,   1, 1, 1, 1      // v4-v7-v6-v5 back
    ]);
    g.box.colorObject = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, g.box.colorObject);
    gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);

    g.mvMatrix = new J3DIMatrix4();
    g.u_normalMatrixLoc = gl.getUniformLocation(g.program, "u_normalMatrix");
    g.normalMatrix = new J3DIMatrix4();
    g.u_projMatrixLoc = gl.getUniformLocation(g.program, "u_projMatrix");
    g.pMatrix = new J3DIMatrix4();
    g.u_modelViewMatrixLoc = gl.getUniformLocation(g.program, "u_modelViewMatrix");
    g.mvMatrix = new J3DIMatrix4();

    gl.enableVertexAttribArray(0);
    gl.enableVertexAttribArray(1);
    gl.enableVertexAttribArray(2);

    gl.bindBuffer(gl.ARRAY_BUFFER, g.box.vertexObject);
    gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, g.box.normalObject);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, g.box.colorObject);
    gl.vertexAttribPointer(1, 4, gl.UNSIGNED_BYTE, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, g.box.indexObject);

    return gl;
}

function reshape(gl) {
    var canvas = g.canvas;
    var windowWidth = window.innerWidth - 20;
    var windowHeight = window.innerHeight - 40;
    if (windowWidth == g.width && windowHeight == g.height) return;

    g.width = windowWidth;
    g.height = windowHeight;
    canvas.width = g.width;
    canvas.height = g.height;

    gl.viewport(0, 0, g.width, g.height);
    g.perspectiveMatrix = new J3DIMatrix4();
    g.perspectiveMatrix.perspective(30, g.width / g.height, 1, 10000);
    g.perspectiveMatrix.translate(0, 0, -1000);
}

function logMat(mat) {
    var arr = mat.getAsArray();
    for (var i = 0; i < 16; ++i) {
        console.log(i + ":" + arr[i]);
    }
}

function logVec(vec) {
    var arr = vec.getAsArray();
    for (var i = 0; i < 3; ++i) {
        console.log(i + ":" + arr[i]);
    }
}

function updateTrackBall(mat) {
    var r = new J3DIMatrix4();
    r.makeIdentity();
    if (g.mouseVecStart) {
        var axis = new J3DIVector3(g.mouseVecStart[0], g.mouseVecStart[1], g.mouseVecStart[2]);
        axis.cross(g.mouseVecCur);
        var angle = Math.acos(Math.min(1, g.mouseVecStart.dot(g.mouseVecCur)));
        r.rotate(angle / Math.PI * 180, axis[0], axis[1], axis[2]);
    }
    r.multiply(mat);
    return r;
}

MatrixStack = function() {
    this.stack = [];
}

MatrixStack.prototype.pop = function(m) {
    if (this.stack.length == 0) {
        m.makeIdentity();
    }
    m.load(this.stack.pop());
}

MatrixStack.prototype.push = function(m) {
    this.stack.push(new J3DIMatrix4(m));
}

function getRevoluteJoint(xAngle, revAngle) {
    var m = new J3DIMatrix4();
    m.makeIdentity();
    m.rotate(xAngle, 1, 0, 0);
    m.rotate(revAngle, 0, 1, 0);
    return m;
}

function getBallAndSocketJoint(xAngle, yAngle, zAngle) {
    var m = new J3DIMatrix4();
    m.makeIdentity();
    m.rotate(xAngle, yAngle, zAngle);
    return m;
}

Link = function(jointMatrix, t, draw, links) {
    this.jointMatrix = jointMatrix;
    this.t = t;
    this.draw = draw;
    this.links = links;
}

function drawBVH(here) {
    var i;

    var r = [], tx = here.offset[0], ty = here.offset[1], tz = here.offset[2];
    if (here.channels) {
        for (i = 0; i < here.channels.length; ++i) {
            var t = g.bvh.motion.frames[g.frameI][g.frameJ++];
            switch (here.channels[i]) {
                case "Xposition": tx += t; break;
                case "Yposition": ty += t; break;
                case "Zposition": tz += t; break;
                case "Xrotation": r.push([0, t]); break;
                case "Yrotation": r.push([1, t]); break;
                case "Zrotation": r.push([2, t]); break;
                default: // wtf?
            }
        }
    }

    var v1 = new J3DIVector3(1, 0, 0);
    var v2 = new J3DIVector3(tx, ty, tz);
    var cosa = v1.dot(v2) / (v1.vectorLength() * v2.vectorLength());
    var a = Math.acos(Math.max(-1, Math.min(1, cosa)));
    v1.cross(v2);

    var stk = new MatrixStack();
    if (here.type != "ROOT") {
        stk.push(g.mvMatrix);
        g.mvMatrix.rotate(a / Math.PI * 180, v1[0], v1[1], v1[2]);
        g.mvMatrix.scale(v2.vectorLength() / 2, 1, 1);
        g.mvMatrix.translate(1, 0, 0);
        g.mvMatrix.setUniform(gl, g.u_modelViewMatrixLoc, false);
        g.normalMatrix.load(g.mvMatrix);
        g.normalMatrix.invert();
        g.normalMatrix.transpose();
        g.normalMatrix.setUniform(gl, g.u_normalMatrixLoc, false);
        gl.drawElements(gl.TRIANGLES, g.box.numIndices, gl.UNSIGNED_BYTE, 0);
        stk.pop(g.mvMatrix);
    }

    stk.push(g.mvMatrix);
    g.mvMatrix.translate(tx, ty, tz);
    for (i = 0; i < r.length; ++i) {
        switch (r[i][0]) {
            case 0: g.mvMatrix.rotate(r[i][1], 1, 0, 0); break;
            case 1: g.mvMatrix.rotate(r[i][1], 0, 1, 0); break;
            case 2: g.mvMatrix.rotate(r[i][1], 0, 0, 1); break;
            default: // wtf?
        }
    }
    stk.push(g.mvMatrix);
    g.mvMatrix.scale(2, 2, 2);
    g.mvMatrix.setUniform(gl, g.u_modelViewMatrixLoc, false);
    g.normalMatrix.load(g.mvMatrix);
    g.normalMatrix.invert();
    g.normalMatrix.transpose();
    g.normalMatrix.setUniform(gl, g.u_normalMatrixLoc, false);
    gl.drawElements(gl.TRIANGLES, g.box.numIndices, gl.UNSIGNED_BYTE, 0);
    stk.pop(g.mvMatrix);
    for (i = 0; i < here.child.length; ++i) {
        drawBVH(here.child[i]);
    }
    stk.pop(g.mvMatrix);
}

function drawPicture(gl) {
    reshape(gl);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    g.pMatrix.load(g.perspectiveMatrix);
    if (g.isMouseDown) {
        g.pMatrix.multiply(updateTrackBall(g.trackBallMat));
    } else {
        g.pMatrix.multiply(g.trackBallMat);
    }
    g.pMatrix.setUniform(gl, g.u_projMatrixLoc, false);


    g.mvMatrix.makeIdentity();
    if (g.bvh) {
        if (g.autoplay.checked) {
            var curTime = new Date().getTime();
            g.frameI = Math.round((curTime - g.bvhStartTime) / 1000 / g.bvh.motion.frameTime);
            if (g.frameI >= g.bvh.motion.frameNum) {
                g.bvhStartTime = curTime;
                g.frameI = 0;
            }
            g.slider.value = g.frameI;
        } else {
            g.frameI = g.slider.value;
        }
        g.frameJ = 0;
        drawBVH(g.bvh.hierarchy);
        g.bvhinfo.innerHTML = "Total Frame: " + g.bvh.motion.frameNum + "<br>"
                            + "Original FPS: " + Math.round(1 / g.bvh.motion.frameTime) + "<br>"
                            + "Current Frame: " + g.frameI;

    }

    framerate.snapshot();
}

function start() {
    g.width = -1;
    g.height = -1;
    g.canvas = document.getElementById("canvas-main");
    g.bvhinfo = document.getElementById("bvhinfo");
    g.isMouseDown = false;
    g.trackBallMat = new J3DIMatrix4();
    g.trackBallMat.makeIdentity();
    g.keystate = {};
    g.slider = document.getElementById("slider");
    g.autoplay = document.getElementById("autoplay");

    var c = g.canvas;

    c.addEventListener("webglcontextlost", handleContextLost, false);
    c.addEventListener("webglcontextrestored", handleContextRestored, false);

    c.addEventListener("mousedown", mousedownListener);
    c.addEventListener("mousemove", mousemoveListener);
    c.addEventListener("mouseup", mouseupListener);

    c.addEventListener("keydown", keydownListener);
    c.addEventListener("keyup", keyupListener);

    var gl = init();
    if (!gl) return;

    framerate = new Framerate("framerate");
    var f = function() {
        drawPicture(gl);
        g.requestId = window.requestAnimationFrame(f);
    };
    f();

    function handleContextLost(e) {
        e.preventDefault();
        if (g.requestId !== undefined) {
            window.cancelAnimFrame(g.requestId);
            g.requestId = undefined;
        }
    }

    function handleContextRestored() {
        init();
        f();
    }
}

function mousedownListener() {
    g.mouseVecStart = getMouseVec();
    g.mouseVecCur = getMouseVec();
    g.isMouseDown = true;
}

function mousemoveListener() {
    g.mouseVecCur = getMouseVec();
}

function mouseupListener() {
    g.isMouseDown = false;
    g.mouseVecCur = getMouseVec();
    g.trackBallMat.load(updateTrackBall(g.trackBallMat));
}

function getMouseVec() {
    var canvas = g.canvas;
    var rect = canvas.getBoundingClientRect();
    var h2 = canvas.clientHeight / 2;
    var w2 = canvas.clientWidth / 2;
    var x = (event.clientX - rect.left - w2) / h2;
    var y = -(event.clientY - rect.top - h2) / h2;
    var r = Math.max(1, Math.sqrt(x * x + y * y));
    x /= r; y /= r;
    var z = Math.sqrt(Math.max(0, 1 - (x * x + y * y)));
    return new J3DIVector3(x, y, z);
}

function keydownListener() {
    g.keystate[event.keyCode] = true;
}

function keyupListener() {
    g.keystate[event.keyCode] = false;
}

function setupBVH(bvh) {
    g.bvhStartTime = new Date().getTime();
    g.slider.min = 0;
    g.slider.value = 0;
    g.bvh = parser.parse(bvh);
    g.slider.max = g.bvh.motion.frameNum - 1;
}

function handleFiles(files) {
    var fr = new FileReader();
    fr.addEventListener('loadend', function() {
        setupBVH(fr.result);
    });
    fr.readAsText(files[0]);
}

function handleBVH(i) {
    if (i == -1) return;
    setupBVH(bvhs[i]);
}
