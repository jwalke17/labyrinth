"use strict";

var scene;
var renderer;
var world;
var camera;
var cube;

var maze;

window.onload = function init(){

    initTHREE();

    initMaze();

    animate();


}

function initMaze() {
    var size = [10.0, 10.0, .5];
    var wallThickness = .2;
    var wallHeight = .1;
    var gapWidth = .1;
    var minDim = .5;

    //var mazeGeo = new THREE.Geometry();
    var yellowMaterial = new THREE.MeshPhongMaterial({color:0xC0C000});
    var blueMaterial = new THREE.MeshPhongMaterial({color:0x00C0C0});

    var baseGeo = new THREE.BoxGeometry( size[0], size[1], size[2] );
    var baseMesh = new THREE.Mesh(baseGeo, yellowMaterial);
    scene.add(baseMesh);
    //mazeGeo.merge(baseMesh.geometry, baseMesh.matrix);

    var wallsGeo = [];
    var wallsMesh = [];

    var corners = [
        [size[0]/2.0, size[1]/2.0],
        [-size[0]/2.0, size[1]/2.0],
        [-size[0]/2.0, -size[1]/2.0],
        [size[0]/2.0, -size[1]/2.0],
    ];
    var mazeVertices = generate_maze(corners,gapWidth,minDim,wallThickness);

    for(var i = 0; i < mazeVertices.length; i++){
        var tempBox = new THREE.Geometry();
        calculateVertices(tempBox, mazeVertices[i], wallThickness, size[2]/2.0, (size[2]/2.0)+wallHeight);
        tempBox.verticesNeedUpdate = true;
        pushFaces(tempBox);

        wallsGeo.push(tempBox);
        wallsGeo[i].computeFaceNormals();
        wallsMesh.push(new THREE.Mesh(wallsGeo[i], blueMaterial));
        wallsMesh[i].updateMatrix();
        scene.add(wallsMesh[i]);
    }
    
    //var mazeMesh = new THREE.Mesh(mazeGeo, material);
    //scene.add(mazeMesh);

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
    scene = new THREE.Scene();
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

function render(){
    renderer.render(scene, camera);
}