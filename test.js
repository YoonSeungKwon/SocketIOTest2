import * as THREE from 'three';
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js"
import CANNON from 'cannon';

const geometry = new THREE.BoxGeometry(1, 1, 1)
const material = new THREE.MeshBasicMaterial({color:0x00ff00,})

//Basic Component
var scene, camera, light, renderer, loader, grid, axis, mixer, speed, cube;

//3D Model
var model = new THREE.Object3D();

//Animation Map
var animationsMap = {};

//Animation Sequence
const clock = new THREE.Clock();

//KeyBoard Input
var keys = {
    KeyA: false,
    KeyS: false,
    KeyD: false,
    KeyW: false,
    Space: false
};

//Main Function
init();
animate();

//Setting
function init(){
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);


    //Basic Setting
    setup_renderer();
    setup_camera();
    setup_light();
    setup_geometry();
    setup_model();
    makeCube();

    //KeyBoard Event
    document.body.addEventListener( 'keydown', function(e) { 
        if ( keys[ e.code ] !== undefined )
            keys[ e.code ] = true;
    });
    document.body.addEventListener( 'keyup', function(e) {
        if ( keys[ e.code ] !== undefined && e.code != 'Space')
            keys[ e.code ] = false;
    });
}

//Mesh
function makeCube(){
    cube = new THREE.Mesh(geometry, material)
    scene.add(cube)
}

//Renderer Setting
function setup_renderer(){
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild( renderer.domElement);
}

//Perspective Camera
function setup_camera(){
    camera = new THREE.PerspectiveCamera(70, window.innerWidth/ window.innerHeight, 0.001, 1000);
    camera.position.set(0, 3, 5);
    scene.add(camera);
}

//Light Setting(Directional Light or Ambient Light)
function setup_light(){
    light = new THREE.HemisphereLight(0xffffff, 0x8888ff, 3);// (Color, Intensity)
    scene.add(light);
}

//Set Geometry Axis and Grid(Can Replace)
function setup_geometry(){
    grid = new THREE.GridHelper(20, 20);
    axis = new THREE.AxesHelper();
    scene.add(grid);
    scene.add(axis);
}

//Saving Model from GLTF or GLB File
function setup_model(){
    loader = new GLTFLoader();
    loader.load('/timmy.gltf', (gltf)=>{
        model = gltf.scene;
        model.translateY(1);
        model.scale.set(0.01, 0.01, 0.01);
        scene.add(model);
        setup_animation(gltf);
    })

}

//Saving Animation From GLTF or GLB Model
function setup_animation(gltf){
    mixer = new THREE.AnimationMixer(gltf.scene);
    const animations = gltf.animations;
    animations.forEach(clip => {
        const name = clip.name;
        const animationClip = mixer.clipAction(clip);
        animationsMap[name] = animationClip;
    });
    console.log(animationsMap);
}

//Animation & Render
function animate(){
    requestAnimationFrame( animate );
    speed = 0.0;

    //Animation
    if(keys.Space && !animationsMap['Jump'].isRunning()){
        mixer.stopAllAction();
        animationsMap['Jump'].play();
        animationsMap['Jump'].loop = THREE.LoopOnce;
        keys.Space = false;
    }
    else{
        if(keys.KeyS||keys.KeyW){
            if(!animationsMap['Jump'].isRunning()){
                 animationsMap['Walk'].play();
            }
        }
        else{
            if(!animationsMap['Jump'].isRunning()){
                mixer.stopAllAction();
                animationsMap['Stand'].play();
            }
        }
        
    }

    //Animation Frame Update
    if(mixer){
        mixer.update(clock.getDelta());
    } 

    //Move
    if ( keys.KeyW )
		speed = 0.03;
	else if ( keys.KeyS )
		speed = -0.03;
	model.translateZ( speed );
	if ( keys.KeyA ){
		model.rotateY(0.05);
	}
	else if ( keys.KeyD ){
		model.rotateY(-0.05);
	}

    camera.lookAt(model.position);
    renderer.render( scene, camera );
}


