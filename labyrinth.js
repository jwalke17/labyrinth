"use strict";

Physijs.scripts.worker = "physijs_worker.js";
Physijs.scripts.ammo = "ammo.js";

var scene;
var renderer;
var camera;
var baseMesh;
var wallsMesh = [];
var ballMesh;

var keyRot = [0,0];
var gimbalRot = [0,0];

window.onload = function init(){
    var canvas_id = "my_canvas";
    initTHREE(canvas_id);
    initMaze();
    document.addEventListener("keypress", keyPressHandler, false);
    window.addEventListener("deviceorientation", rotationHandler, true);

    animate();
}

function initMaze() {
    var size = [10.0, 10.0, .5];
    var wallThickness = .15;
    var wallHeight = .1;
    var gapWidth = .4;
    var gapBallast = .1;
    var minDim = .4;
    var predictability = 2;

    var textureLoader = new THREE.TextureLoader();
    var woodTexture = textureLoader.load( "textures/wood.jpg" );
    woodTexture.wrapS = woodTexture.wrapT = THREE.RepeatWrapping;

    var woodMaterial = new THREE.MeshPhongMaterial({map: woodTexture});
    var woodMaterial2 = new THREE.MeshPhongMaterial({color: 0x874119});

    var baseGeo = new THREE.BoxGeometry( size[0], size[1], size[2] );
    baseMesh = new Physijs.BoxMesh(baseGeo, woodMaterial, 0);

    var wallsGeo = [];

    var corners = [
        [size[0]/2.0, size[1]/2.0],
        [-size[0]/2.0, size[1]/2.0],
        [-size[0]/2.0, -size[1]/2.0],
        [size[0]/2.0, -size[1]/2.0],
    ];
    var mazeVertices = generate_maze(corners,gapWidth,gapBallast,minDim,wallThickness,predictability);

    for(var i = 0; i < mazeVertices.length; i++){
        var tempBox = new THREE.Geometry();
        calculateVertices(tempBox, mazeVertices[i], wallThickness, size[2]/2.0, (size[2]/2.0)+wallHeight);
        tempBox.verticesNeedUpdate = true;
        pushFaces(tempBox);

        wallsGeo.push(tempBox);
        wallsGeo[i].computeFaceNormals();
        wallsMesh.push(new Physijs.ConvexMesh(wallsGeo[i], woodMaterial2));
        wallsMesh[i].updateMatrix();
        baseMesh.add(wallsMesh[i]);
    }

    scene.add(baseMesh);

    var ballGeo = new THREE.SphereGeometry(0.075, 12, 12);
    var ballMaterial = new THREE.MeshPhongMaterial({color: 0x888888});
    ballMesh = new Physijs.SphereMesh(ballGeo, ballMaterial);
    ballMesh.position.set(-4.6, 4.6, 0.5);
    scene.add(ballMesh);

}

function pushFaces(geometry){
    
    geometry.faces.push(
        new THREE.Face3(0, 2, 1),
        new THREE.Face3(3, 2, 0),
        new THREE.Face3(4, 0, 1),
        new THREE.Face3(5, 4, 1),
        new THREE.Face3(6, 4, 5),
        new THREE.Face3(6, 7, 4),
        new THREE.Face3(5, 1, 6),
        new THREE.Face3(1, 2, 6),
        new THREE.Face3(6, 2, 3),
        new THREE.Face3(6, 3, 7),
        new THREE.Face3(3, 0, 7),
        new THREE.Face3(0, 4, 7)
    );
    
}

function calculateVertices(geometry, points, thickness, bottom, top){
    var perp_line = rot_90(norm_vect(subtract_vect(points[1],points[0])));
	var corner_offset = mult_vect(perp_line,thickness/2);
	var corner_offset_neg = mult_vect(corner_offset,-1);
	var corners = [
		add_vect(points[0],corner_offset),
		add_vect(points[0],corner_offset_neg),
		add_vect(points[1],corner_offset_neg),
		add_vect(points[1],corner_offset)
	];
    geometry.vertices.push(
        new THREE.Vector3(corners[0][0], corners[0][1], bottom),
        new THREE.Vector3(corners[1][0], corners[1][1], bottom),
        new THREE.Vector3(corners[2][0], corners[2][1], bottom),
        new THREE.Vector3(corners[3][0], corners[3][1], bottom),
        new THREE.Vector3(corners[0][0], corners[0][1], top),
        new THREE.Vector3(corners[1][0], corners[1][1], top),
        new THREE.Vector3(corners[2][0], corners[2][1], top),
        new THREE.Vector3(corners[3][0], corners[3][1], top)
    );
}

function initTHREE(canvas_id) {

    var canvas = document.getElementById(canvas_id);
    var height = window.innerHeight;
    var width = window.innerWidth;
    scene = new Physijs.Scene();
    scene.setGravity(new THREE.Vector3(0, 0, -10));
    camera = new THREE.PerspectiveCamera( 100, width / height, 1, 1000 );
    camera.position.z = 5;
    renderer = new THREE.WebGLRenderer({canvas: canvas });
    renderer.setSize(width, height);

    var light = new THREE.PointLight(0xFFFFFF, 1, 100);
    light.position.set(0, 0, 20);
    scene.add(light);

    var light2 = new THREE.AmbientLight(0x222222);
    scene.add(light2);
}

function animate(){
    requestAnimationFrame(animate);
    render();   
}

function keyPressHandler(e) {
    var angleChange = 0.002, angleMax = 0.1, angleMin = -0.1;
    var keyCode = e.keyCode ? e.keyCode : e.which;

    if (keyCode == 115 && keyRot[0] < angleMax) {
        keyRot[0] += angleChange;
    } else if (keyCode == 119 && keyRot[0] > angleMin) {
        keyRot[0] -= angleChange;
    } else if (keyCode == 100 && keyRot[1] < angleMax) {
        keyRot[1] += angleChange;
    } else if (keyCode == 97 && keyRot[1] > angleMin) {
        keyRot[1] -= angleChange;
    }
}

var additional_screen_rotation = null;
function addExtraScreenRot() {
    if(additional_screen_rotation==null) {
        additional_screen_rotation = getURLParameter("dev_rot");
        if(additional_screen_rotation==null) {
            additional_screen_rotation = 0;
        } else {
            additional_screen_rotation = parseInt(additional_screen_rotation);
        }
    }
    var old_rot = additional_screen_rotation;
    additional_screen_rotation = additional_screen_rotation + 270;
    while(additional_screen_rotation>=360) {
        additional_screen_rotation = additional_screen_rotation - 360;
    }
    var sep = "?";
    if(location.href.indexOf("?") !== -1) {
        var sep = "&";
    }
    if(location.href.indexOf("dev_rot=") !== -1) {
        var pos=location.href.indexOf("dev_rot=");
        location.href = location.href.substr(0,pos) + "dev_rot="+additional_screen_rotation + location.href.substr(pos+(("dev_rot="+old_rot).length),location.href.length);
    } else {
        location.href = location.href + sep+"dev_rot="+additional_screen_rotation;
    }
}

function rotationHandler(e) {
    var angleMax = 0.1, angleMin = -0.1;
    var deg2rad = Math.PI/180;
    var scale = 0.1;
    var tempGimbalRot = [e.beta*deg2rad*scale,e.gamma*deg2rad*scale];
    if (tempGimbalRot[0] > angleMax) {
        tempGimbalRot[0] = angleMax;
    }
    if (tempGimbalRot[0] < angleMin) {
        tempGimbalRot[0] = angleMin;
    }
    if (tempGimbalRot[1] > angleMax) {
        tempGimbalRot[1] = angleMax;
    }
    if (tempGimbalRot[1] < angleMin) {
        tempGimbalRot[1] = angleMin;
    }
    var orient = null;
    if(screen.msOrientation!=undefined) {
        orient = screen.msOrientation;
    } else if(screen.orientation!=undefined) {
        orient = screen.orientation.type;
    }
    switch(screen.msOrientation) {
        case "portrait-primary":
            break;
        case "landscape-primary":
        tempGimbalRot = rot_90(tempGimbalRot);
            break;
        case "portrait-secondary":
        tempGimbalRot = rot_90(rot_90(tempGimbalRot));
            break;
        case "landscape-secondary":
        tempGimbalRot = rot_90(rot_90(rot_90(tempGimbalRot)));
            break;
        default:
            break;
    }
    if(additional_screen_rotation==null) {
        additional_screen_rotation = getURLParameter("dev_rot");
        if(additional_screen_rotation==null) {
            additional_screen_rotation = 0;
        } else {
            additional_screen_rotation = parseInt(additional_screen_rotation);
        }
    }
    var added_rot = 0;
    for(added_rot=0;added_rot<additional_screen_rotation;added_rot=added_rot+90) {
        tempGimbalRot = rot_90(tempGimbalRot);
    }
    if(ensureDeviceStartsFlat(tempGimbalRot)) {
        gimbalRot = tempGimbalRot;
    }
}

function getURLParameter(name) {
    return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) || [null, ''])[1].replace(/\+/g, '%20')) || null;
}

var firstGimbalValueSet = false;
var deviceEnsuredFlat = false;
var selectedKeyboardOnly = false;
function ensureDeviceStartsFlat(rot) {
    var angleMax = 0.04, angleMin = -0.04;
    if(rot!=[0,0]) {
        firstGimbalValueSet = true;
    }
    if(selectedKeyboardOnly) {
        return false;
    }
    if(firstGimbalValueSet) {
        if(deviceEnsuredFlat) {
            return true;
        } else {
            if ((rot[0] > angleMax) || (rot[0] < angleMin) || (rot[1] > angleMax) || (rot[1] < angleMin)) {
                var kbdOnlyParam = getURLParameter("kbd_only");
                if(kbdOnlyParam!=null) {
                    if(kbdOnlyParam=="yes" || kbdOnlyParam=="true") {
                        selectedKeyboardOnly = true;
                        return false;
                    }
                }
                if(!confirm("Please lay device flat, then press \"OK\" to begin.\nIf playing with keyboard, click on \"Cancel.\"")) {
                    selectedKeyboardOnly = true;
                    if(location.href.indexOf("?") !== -1) {
                        location.href = location.href + "&kbd_only=yes";
                    } else {
                        location.href = location.href + "?kbd_only=yes";
                    }
                }
                return false;
            } else {
                deviceEnsuredFlat = true;
                return true;
            }
        }
    } else {
        return false;
    }
}

function getCameraRotAndPos(pos_z,rot) {
    var pos = [0,0];
    if(Math.tan(rot[1])!=0) {
        pos[0] = pos_z * Math.tan(rot[1]);
    }
    if(Math.tan(rot[0])!=0) {
        pos[1] = -1 * pos_z * Math.tan(rot[0]);
    }
    return [rot,pos];
}

function getKeyRot() {
    return keyRot;
}

function getGimbalRot() {
    return gimbalRot;
}

function getMeshRot() {
    return add_vect(getKeyRot(),getGimbalRot());
}

function getCameraRot() {
    return mult_vect(getGimbalRot(),1.0);
}

function render(){
    var mesh_rot = getMeshRot();
    [baseMesh.rotation.x,baseMesh.rotation.y] = mesh_rot;
    baseMesh.__dirtyRotation = true;
    [ballMesh.rotation.x,ballMesh.rotation.y] = mesh_rot;
    ballMesh.__dirtyRotation = true;

    [[camera.rotation.x,camera.rotation.y],[camera.position.x,camera.position.y]] = getCameraRotAndPos(camera.position.z,getCameraRot());

    scene.simulate();
    renderer.render(scene, camera);

    if (ballMesh.position.x > 4.5 && ballMesh.position.y < -4.5) {
        alert("Congratulations! You won!");
        location.reload();
    }
}