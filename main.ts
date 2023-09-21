import * as THREE from 'three'
import {io} from 'socket.io-client'
import TWEEN from '@tweenjs/tween.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(70, window.innerWidth/ window.innerHeight, 0.1, 1000)
const renderer = new THREE.WebGL1Renderer()
const controls = new OrbitControls(camera, renderer.domElement)
const loader = new GLTFLoader();
const axesHelper = new THREE.AxesHelper();
const socket = io('http://localhost:3000')
const models:{[id:string]:THREE.Object3D}={}
const mixer:{[id:string]:THREE.AnimationMixer}={}
const animationMaps:any = {}
const clock = new THREE.Clock()

var park = new THREE.Object3D();
var skybox = new THREE.Mesh()
var animationsMap = {};
var temp = new THREE.Vector3;
var dir = new THREE.Vector3;
var a = new THREE.Vector3;
var b = new THREE.Vector3;
var directionalLight = new THREE.HemisphereLight( 0xffffff, 0xB97A20, 2 );

//Num
var distance = 0.3
var myId = ''
var speed = 0.0
var timeStamp = 0

var keys = {
    KeyA: false,
    KeyS: false,
    KeyD: false,
    KeyW: false
};

//Socket IO Client

socket.on('connect', ()=>{
    console.log('connect')
})

socket.on('disconnect', ()=>{
    console.log('disconnect')
})

socket.on('id', (id)=>{
    myId = id;
    console.log(myId)
    setInterval(()=>{
        if(models[myId]){
            socket.emit('update', {
                t: Date.now(),
                p: models[myId].position,
                r: models[myId].rotation,
            })
        }
    }, 100)
})

socket.on('clients', (clients:any)=>{
    Object.keys(clients).forEach((p)=>{
        timeStamp = Date.now()
        if(!models[p]){
            models[p] = new THREE.Object3D()
            loader.load('/timmy.gltf', (gltf)=>{
                models[p] = gltf.scene
                models[p].scale.set(0.005,0.005,0.005)
                models[p].translateY(0.2)
                models[p].name = p
                mixer[p] = new THREE.AnimationMixer(gltf.scene)
                const animations = gltf.animations
                animationMaps[p] = {}
                animations.forEach(_clip => {
                    console.log(_clip.name)
                    const animationClip = mixer[p].clipAction(_clip)
                    animationMaps[p][_clip.name] = animationClip
                })
                scene.add(models[p])
            })
        }
        else{
            if(clients[p].p && p != myId){
                if(clients[p].p.x != models[p].position.x || clients[p].p.z != models[p].position.z){
                    new TWEEN.Tween(models[p].position)
                        .to(
                            {
                                x: clients[p].p.x,
                                y: clients[p].p.y,
                                z: clients[p].p.z,
                            },
                            100
                        )
                        .start()
                        .onStart(()=>{
                            animationMaps[p].Walk.play()
                        })
                }
                else{
                    if(animationMaps[p].Walk.isRunning()){
                        mixer[p].stopAllAction()
                        animationMaps[p].Stand.play()
                    }
                }
            }
            if (clients[p].r && p != myId) {
                new TWEEN.Tween(models[p].rotation)
                    .to(
                        {
                            x: clients[p].r._x,
                            y: clients[p].r._y,
                            z: clients[p].r._z,
                        },
                        30
                    )
                    .start()
            }
        }
    })
})

init();
animate();

function init(){

	scene.add(axesHelper);
	scene.add( directionalLight );
	scene.background = new THREE.CubeTextureLoader().setPath("skybox/")
	.load([
		'px.jpg',
		'nx.jpg',
		'py.jpg',
		'ny.jpg',
		'pz.jpg',
		'nz.jpg'
	])

	loader.load('/winter/scene.gltf', function(gltf){
		park = gltf.scene;
		scene.add(park);
	})

	renderer.setSize(window.innerWidth, window.innerHeight);
	document.body.appendChild( renderer.domElement);
	controls.maxDistance = 3	
	controls.minDistance = 1	
	//KeyBoard Event
	document.addEventListener('keydown', function(e:KeyboardEvent){
        if(keys[e.code] !== undefined){
            keys[e.code] = true
        }
        if(keys.KeyW || keys.KeyS){
            animationMaps[myId].Walk.play()
        }
    });
    document.addEventListener('keyup', function(e:KeyboardEvent){
        if(keys[e.code] !== undefined){
            keys[e.code] = false
        }
        if(!keys.KeyW && !keys.KeyS){
            mixer[myId].stopAllAction()
            animationMaps[myId].Stand.play()
        }
    });
}

function animate() {

	requestAnimationFrame( animate );

	TWEEN.update()

    var speed:number = 0
	

	if ( keys.KeyW )
		speed = 0.02;
	if ( keys.KeyS )
		speed = -0.02;
	if ( keys.KeyA ){
		models[myId].rotateY(0.04);
	}
	if ( keys.KeyD ){
		models[myId].rotateY(-0.04);
	}
	if(speed != 0){
        models[myId].translateZ(speed)
    }
	
    if(mixer[myId]){
        mixer[myId].update(clock.getDelta())
    }
    
    Object.keys(models).forEach((p)=>{
        if(p != myId){
            mixer[p].update(0.01)
        }
    })


	camera.lookAt(models[myId].position)
	controls.target = new THREE.Vector3(models[myId].position.x, models[myId].position.y, models[myId].position.z)
	controls.update()
	renderer.render( scene, camera );
}

