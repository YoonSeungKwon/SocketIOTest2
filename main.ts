import * as THREE from 'three'
import {io} from 'socket.io-client'
import TWEEN from '@tweenjs/tween.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(70, window.innerWidth/ window.innerHeight, 0.1, 1000)
const renderer = new THREE.WebGL1Renderer()
const loader = new GLTFLoader()
const light = new THREE.DirectionalLight(0xffffff, 5)
const socket = io('http://localhost:3000')
const models:{[id:string]:THREE.Object3D}={}
const mixer:{[id:string]:THREE.AnimationMixer}={}
const animationMaps:any = {}
const clock = new THREE.Clock()

type KEY= {
    [index:string]:boolean
}

var myId = ''
var timeStamp = 0

const keys:KEY= {
    KeyA:false,
    KeyD:false,
    KeyW:false,
    KeyS:false,
}

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
    }, 10)
})

socket.on('clients', (clients:any)=>{
    Object.keys(clients).forEach((p)=>{
        timeStamp = Date.now()
        if(!models[p]){
            models[p] = new THREE.Object3D()

            loader.load('/xbot.gltf', (gltf)=>{
                models[p] = gltf.scene
                models[p].scale.set(0.01,0.01,0.01)
                models[p].translateY(1)
                models[p].name = p
                mixer[p] = new THREE.AnimationMixer(gltf.scene)
                const animations = gltf.animations
                animationMaps[p] = {}
                animations.forEach(_clip => {
                    const animationClip = mixer[p].clipAction(_clip)
                    animationMaps[p][_clip.name] = animationClip
                })
                models[myId].add(camera)
                scene.add(models[p])
            })
        }
        else{
            if(clients[p].p){
                new TWEEN.Tween(models[p].position)
                    .to(
                        {
                            x: clients[p].p.x,
                            y: clients[p].p.y,
                            z: clients[p].p.z,
                        },
                        10
                    )
                    .start()
            
            }
            if (clients[p].r) {
                new TWEEN.Tween(models[p].rotation)
                    .to(
                        {
                            x: clients[p].r._x,
                            y: clients[p].r._y,
                            z: clients[p].r._z,
                        },
                        10
                    )
                    .start()

            }
        }
    })
})

socket.on('removeClient', (id: string) => {
    scene.remove(scene.getObjectByName(id) as THREE.Object3D)
})


init();
setTimeout(()=>{},3000)
animate();

function init(){
    geo()
    scene.add(light)
    camera.translateY(150)
    camera.translateZ(-150)
    //Renderer
    renderer.setSize(window.innerWidth, window.innerHeight)
    document.body.appendChild(renderer.domElement)
    //KeyBoard Events
    document.addEventListener('keydown', function(e:KeyboardEvent){
        if(keys[e.code] !== undefined){
            keys[e.code] = true
        }
    });
    document.addEventListener('keyup', function(e:KeyboardEvent){
        if(keys[e.code] !== undefined){
            keys[e.code] = false
        }
    });
}

function geo(){
    const grid = new THREE.GridHelper(20, 20)
    const axis = new THREE.AxesHelper()
    scene.add(grid)
    scene.add(axis)
}

function animate(){
    requestAnimationFrame(animate)
    
    TWEEN.update()

    var speed:number = 0

    if(mixer[myId]){
        if(keys.KeyW || keys.KeyS){
            animationMaps[myId].Walk.play()
        }
        else{
            mixer[myId].stopAllAction()
            animationMaps[myId].Stand.play()
        }
    }


    if(mixer[myId]){
        mixer[myId].update(clock.getDelta())
    }
    

    if(keys.KeyW)
        speed = 0.05
    if(keys.KeyS)
        speed = -0.05
    if(keys.KeyA){
        models[myId].rotation.y += 0.05
    }
    if(keys.KeyD){
        models[myId].rotation.y -= 0.05
    }
    if(speed != 0){
        models[myId].translateZ(speed)
        camera.lookAt(models[myId].position)
    }


    renderer.render(scene, camera)
}
