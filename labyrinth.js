"use strict";

Physijs.scripts.worker = "physijs_worker.js";
Physijs.scripts.ammo = "ammo.js";

var scene;
var renderer;
var camera;
var baseMesh;
var wallsMesh = [];
var ballMesh;

var angleX = 0;
var angleY = 0;

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

    var yellowMaterial = new THREE.MeshPhongMaterial({color:0xC0C000});
    var blueMaterial = new THREE.MeshPhongMaterial({color:0x00C0C0});

    var baseGeo = new THREE.BoxGeometry( size[0], size[1], size[2] );
    baseMesh = new Physijs.BoxMesh(baseGeo, yellowMaterial, 0);

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
        wallsMesh.push(new Physijs.ConvexMesh(wallsGeo[i], blueMaterial));
        wallsMesh[i].updateMatrix();
        baseMesh.add(wallsMesh[i]);
    }

    scene.add(baseMesh);

    var ballGeo = new THREE.SphereGeometry(0.075, 12, 12);
    var ballMaterial = new THREE.MeshPhongMaterial({color: 0xDDDDDD});
    ballMesh = new Physijs.SphereMesh(ballGeo, ballMaterial);
    ballMesh.position.set(-4.5, 4.5, 0.5);
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

    var light = new THREE.PointLight(0xFFFFFF, 1, 80);
    light.position.set(0, 0, 8);
    scene.add(light);
    
    var light2 = new THREE.PointLight(0xFFFFFF, 1, 80);
    light2.position.set(0, -10, 0);
    scene.add(light2);

}

function animate(){
    requestAnimationFrame(animate);
    updateTHREE();
    render();   
}

function updateTHREE(){

}

function keyPressHandler(e) {
    var keyCode = e.keyCode ? e.keyCode : e.which;
    if (keyCode == 115) {
        angleX += 0.002;
    } else if (keyCode == 119) {
        angleX -= 0.002;
    } else if (keyCode == 100) {
        angleY += 0.002;
    } else if (keyCode == 97) {
        angleY -= 0.002;
    }
}

function render(){
    baseMesh.rotation.set(angleX, angleY, 0);
    baseMesh.__dirtyRotation = true;
    
    ballMesh.rotation.set(angleX, angleY, 0);
    ballMesh.__dirtyRotation = true;

    scene.simulate();
    renderer.render(scene, camera);
}