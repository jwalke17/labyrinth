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

window.onload = function init(){
    initTHREE();
    initMaze();
    document.addEventListener("keypress", keyPressHandler, false);

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

function initTHREE() {

    var canvas = document.getElementById("my_canvas");
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
    return [0,0];
}

function getMeshRot() {
    return add_vect(getKeyRot(),getGimbalRot());
}

function getCameraRot() {
    return mult_vect(getGimbalRot(),1.0);
}

function render(){
    [baseMesh.rotation.x,baseMesh.rotation.y] = getMeshRot();
    baseMesh.__dirtyRotation = true;
    [ballMesh.rotation.x,ballMesh.rotation.y] = getMeshRot();
    ballMesh.__dirtyRotation = true;

    [[camera.rotation.x,camera.rotation.y],[camera.position.x,camera.position.y]] = getCameraRotAndPos(camera.position.z,getCameraRot());

    scene.simulate();
    renderer.render(scene, camera);

    if (ballMesh.position.x > 4.5 && ballMesh.position.y < -4.5) {
        alert("Congratulations! You won!");
        location.reload();
    }
}