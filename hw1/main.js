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
    g.perspectiveMatrix.translate(0, 0, -50);
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
    var axis = new J3DIVector3(g.mouseVecStart[0], g.mouseVecStart[1], g.mouseVecStart[2]);
    axis.cross(g.mouseVecCur);
    var angle = Math.acos(Math.min(1, g.mouseVecStart.dot(g.mouseVecCur)));
    var r = new J3DIMatrix4();
    r.makeIdentity();
    r.rotate(angle / Math.PI * 180, axis[0], axis[1], axis[2]);
    r.multiply(mat);
    return r;
}

MatrixStack = function() {
    this.stack = [];
}

MatrixStack.prototype.pop = function() {
    if (this.stack.length == 0) {
        var m = new J3DIMatrix4();
        m.makeIdentity();
        return m;
    }
    return this.stack.pop();
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

function drawLinkTree(here) {
    var m;
    if (here.draw) {
        m = new J3DIMatrix4(g.mvMatrix);
        g.mvMatrix.multiply(here.jointMatrix);
        g.mvMatrix.scale(here.t / 2, 0.4, 0.4);
        g.mvMatrix.translate(here.t / 2, 0, 0);
        g.mvMatrix.setUniform(gl, g.u_modelViewMatrixLoc, false);
        g.normalMatrix.load(g.mvMatrix);
        g.normalMatrix.invert();
        g.normalMatrix.transpose();
        g.normalMatrix.setUniform(gl, g.u_normalMatrixLoc, false);
        gl.drawElements(gl.TRIANGLES, g.box.numIndices, gl.UNSIGNED_BYTE, 0);
        g.mvMatrix.load(m);
    }
    m = new J3DIMatrix4(g.mvMatrix);
    g.mvMatrix.multiply(here.jointMatrix);
    g.mvMatrix.translate(here.t, 0, 0);
    for (var i = 0; i < here.links.length; ++i) {
        drawLinkTree(here.links[i]);
    }
    g.mvMatrix.load(m);
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

    var curTime = new Date().getTime();
    var headAngle = curTime / 1000 * 360;
    var rightarmAngle = curTime / 1000 * -360;
    var rightlegAngle = 30 * Math.cos(curTime / 1000 * Math.PI);
    var leftlegAngle = -30 * Math.cos(curTime / 1000 * Math.PI);
    var rightkneeAngle = 30 + rightlegAngle;
    var leftkneeAngle = 30 + leftlegAngle;
    var jitter = 10 * Math.cos(curTime / 1000 * Math.PI);

    var human =
        // waist (root)
        new Link(getBallAndSocketJoint(0, 0, 0), 0, false, [
            // neck
            new Link(getBallAndSocketJoint(0, 0, 90), 2, true, [
                // head
                new Link(getBallAndSocketJoint(headAngle, 10, 0), 2, true, []),
                // left arm
                new Link(getBallAndSocketJoint(0, 0, -100), 1.5, true, [
                    new Link(getBallAndSocketJoint(0, 0, -60), 1.5, true, [
                        new Link(getRevoluteJoint(90, -30), 1.5, true, [])
                    ])
                ]),
                // right arm
                new Link(getBallAndSocketJoint(0, 0, 100), 1.5, true, [
                    new Link(getBallAndSocketJoint(rightarmAngle, 0, 60), 1.5, true, [
                        new Link(getRevoluteJoint(90, 30), 1.5, true, [])
                    ])
                ])
            ]),
            // right leg
            new Link(getBallAndSocketJoint(0, 0, 240), 2, true, [
                new Link(getBallAndSocketJoint(0, rightlegAngle, 30), 2, true, [
                    new Link(getRevoluteJoint(0, rightkneeAngle), 2, true, [])
                ])
            ]),
            // left leg
            new Link(getBallAndSocketJoint(0, 0, 300), 2, true, [
                new Link(getBallAndSocketJoint(0, leftlegAngle, -30), 2, true, [
                    new Link(getRevoluteJoint(0, leftkneeAngle), 2, true, [])
                ])
            ])
        ]);

    g.mvMatrix.makeIdentity();
    drawLinkTree(human);

    framerate.snapshot();
}

function start() {
    g.width = -1;
    g.height = -1;
    g.canvas = document.getElementById("canvas-main");
    g.isMouseDown = false;
    g.trackBallMat = new J3DIMatrix4();
    g.trackBallMat.makeIdentity();
    g.keystate = {};

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
    g.isMouseDown = true;
    g.mouseVecStart = getMouseVec();
    g.mouseVecCur = getMouseVec();
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
