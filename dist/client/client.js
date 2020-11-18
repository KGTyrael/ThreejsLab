import * as THREE from '/build/three.module.js';
import { OrbitControls } from '/jsm/controls/OrbitControls';
import { GLTFLoader } from '/jsm/loaders/GLTFLoader';
import Stats from '/jsm/libs/stats.module';
import { GUI } from '/jsm/libs/dat.gui.module';
import { TWEEN } from '/jsm/libs/tween.module.min';
const scene = new THREE.Scene();
//const axesHelper = new THREE.AxesHelper(5)
//scene.add(axesHelper)
// var light1 = new THREE.SpotLight();
// light1.position.set(2.5, 5, 2.5)
// light1.angle = Math.PI / 8
// light1.penumbra = 0.5
// light1.castShadow = true;
// light1.shadow.mapSize.width = 1024;
// light1.shadow.mapSize.height = 1024;
// light1.shadow.camera.near = 0.5;
// light1.shadow.camera.far = 20
// scene.add(light1);
// var light2 = new THREE.SpotLight();
// light2.position.set(-2.5, 5, 2.5)
// light2.angle = Math.PI / 8
// light2.penumbra = 0.5
// light2.castShadow = true;
// light2.shadow.mapSize.width = 1024;
// light2.shadow.mapSize.height = 1024;
// light2.shadow.camera.near = 0.5;
// light2.shadow.camera.far = 20
// scene.add(light2);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 1000);
camera.position.set(0.8, 1.4, 1.0);
//用于renderdr抗锯齿
const devicePixelRatio = window.devicePixelRatio;
const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    precision: "highp" //着色器的精度。可以是"highp", "mediump" 或 "lowp". 默认为"highp"，如果设备支持的话。
});
renderer.setPixelRatio(devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);
const controls = new OrbitControls(camera, renderer.domElement);
controls.maxDistance = 4;
controls.minDistance = 0;
//controls.target.set(0, 1, 0)
//可射线检测物体
let floorMeshes = new Array();
//镜头阻挡碰撞
let CameraBlockMeshes = new Array();
const GLTFloader = new GLTFLoader();
GLTFloader.load('mode/scene.glb', function (gltf) {
    gltf.scene.traverse(function (child) {
        if (child.isMesh) {
            let m = child;
            m.receiveShadow = true;
            m.castShadow = true;
            CameraBlockMeshes.push(m);
        }
        if (child.isLight) {
            let l = child;
            l.castShadow = true;
            //l.shadow.bias = -.003
            l.shadow.mapSize.width = 2048;
            l.shadow.mapSize.height = 2048;
        }
    });
    scene.add(gltf.scene);
    gltf.scene.traverse(function (child) {
        //if ((<THREE.Mesh>child).isMesh) {
        if (child.name == 'floor') {
            console.dir(child.name);
            floorMeshes.push(child);
        }
    });
}, (xhr) => {
    console.log((xhr.loaded / xhr.total * 100) + '% loaded');
}, (error) => {
    console.log(error);
});
let mixer;
let modelReady = false;
let modelMesh;
let skeleton;
let animationActions = new Array();
let activeAction;
let lastAction;
const loader = new GLTFLoader();
const baseActions = {
    idle: { weight: 1 },
    walk: { weight: 0 },
    run: { weight: 0 }
};
const additiveActions = {
    sneak_pose: { weight: 0 },
    sad_pose: { weight: 0 },
    agree: { weight: 0 },
    headShake: { weight: 0 }
};
const allActions = [];
loader.load('models/Xbot.glb', function (gltf) {
    modelMesh = gltf.scene;
    scene.add(modelMesh);
    controls.target.set(modelMesh.position.x, modelMesh.position.y + 2, modelMesh.position.z);
    //console.dir(modelMesh)
    // modelMesh.traverse( function ( object ) {
    //     if(object.name=='mixamorigHeadTop_End'){
    //         //console.dir(controls.target)
    //         //controls.target=object.position
    //         console.dir(modelMesh.position)
    //     }
    if (object.isMesh) {
        object.castShadow = true;
    }
});
skeleton = new THREE.SkeletonHelper(modelMesh);
skeleton.visible = false;
scene.add(skeleton);
const animations = gltf.animations;
mixer = new THREE.AnimationMixer(modelMesh);
let numAnimations = animations.length;
for (let i = 0; i !== numAnimations; ++i) {
    let clip = animations[i];
    const name = clip.name;
    if (baseActions[name]) {
        const action = mixer.clipAction(clip);
        activateAction(action);
        baseActions[name].action = action;
        allActions.push(action);
    }
    else if (additiveActions[name]) {
        // Make the clip additive and remove the reference frame
        THREE.AnimationUtils.makeClipAdditive(clip);
        if (clip.name.endsWith('_pose')) {
            clip = THREE.AnimationUtils.subclip(clip, clip.name, 2, 3, 30);
        }
        const action = mixer.clipAction(clip);
        activateAction(action);
        additiveActions[name].action = action;
        allActions.push(action);
    }
}
;
function activateAction(action) {
    const clip = action.getClip();
    const settings = baseActions[clip.name] || additiveActions[clip.name];
    setWeight(action, settings.weight);
    action.play();
}
function setWeight(action, weight) {
    action.enabled = true;
    action.setEffectiveTimeScale(1);
    action.setEffectiveWeight(weight);
}
// gltfLoader.load(
//     'models/Kachujin.glb',
//     (gltf) => {
//         gltf.scene.traverse(function (child) {
//             if ((<THREE.Mesh>child).isMesh) {
//                 let m = <THREE.Mesh>child
//                 m.castShadow = true
//                 m.frustumCulled = false;
//                 m.geometry.computeVertexNormals()
//             }
//         })
//         mixer = new THREE.AnimationMixer(gltf.scene)
//         let animationAction = mixer.clipAction((gltf as any).animations[0])
//         animationActions.push(animationAction)
//         animationsFolder.add(animations, "default")
//         activeAction = animationActions[0]
//         scene.add(gltf.scene);
//         modelMesh = gltf.scene
//         //add an animation from another file
//         gltfLoader.load('models/Kachujin.glb',
//             (gltf) => {
//                 console.log("loaded samba")
//                 let animationAction = mixer.clipAction((gltf as any).animations[0]);
//                 animationActions.push(animationAction)
//                 animationsFolder.add(animations, "samba")
//                 //add an animation from another file
//                 gltfLoader.load('models/Kachujin@kick.glb',
//                     (gltf) => {
//                         console.log("loaded bellydance")
//                         let animationAction = mixer.clipAction((gltf as any).animations[0]);
//                         animationActions.push(animationAction)
//                         animationsFolder.add(animations, "bellydance")
//                         //add an animation from another file
//                         gltfLoader.load('models/Kachujin@walking.glb',
//                             (gltf) => {
//                                 console.log("loaded goofyrunning");
//                                 (gltf as any).animations[0].tracks.shift() //delete the specific track that moves the object forward while running
//                                 let animationAction = mixer.clipAction((gltf as any).animations[0]);
//                                 animationActions.push(animationAction)
//                                 animationsFolder.add(animations, "goofyrunning")
//                                 modelReady = true
//                             },
//                             (xhr) => {
//                                 console.log((xhr.loaded / xhr.total * 100) + '% loaded')
//                             },
//                             (error) => {
//                                 console.log(error);
//                             }
//                         )
//                     },
//                     (xhr) => {
//                         console.log((xhr.loaded / xhr.total * 100) + '% loaded')
//                     },
//                     (error) => {
//                         console.log(error);
//                     }
//                 )
//             },
//             (xhr) => {
//                 console.log((xhr.loaded / xhr.total * 100) + '% loaded')
//             },
//             (error) => {
//                 console.log(error);
//             }
//         )
//     },
//     (xhr) => {
//         console.log((xhr.loaded / xhr.total * 100) + '% loaded')
//     },
//     (error) => {
//         console.log(error);
//     }
// )
window.addEventListener('resize', onWindowResize, false);
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    render();
}
const raycaster = new THREE.Raycaster();
const targetQuaternion = new THREE.Quaternion();
renderer.domElement.addEventListener('dblclick', onDoubleClick, false);
function onDoubleClick(event) {
    const mouse = {
        x: (event.clientX / renderer.domElement.clientWidth) * 2 - 1,
        y: -(event.clientY / renderer.domElement.clientHeight) * 2 + 1
    };
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(floorMeshes, false);
    if (intersects.length > 0) {
        const p = intersects[0].point;
        const distance = modelMesh.position.distanceTo(p);
        //modelMesh.lookAt(p)
        const rotationMatrix = new THREE.Matrix4();
        rotationMatrix.lookAt(p, modelMesh.position, modelMesh.up);
        targetQuaternion.setFromRotationMatrix(rotationMatrix);
        activateAction(allActions[0]);
        TWEEN.removeAll();
        new TWEEN.Tween(modelMesh.position)
            .to({
            x: p.x,
            y: p.y,
            z: p.z
        }, 1000 / 2.2 * distance) //walks 2 meters a second * the distance
            .onUpdate(() => {
            controls.target.set(modelMesh.position.x, modelMesh.position.y + 2, modelMesh.position.z);
            // light1.target = modelMesh;
            // light2.target = modelMesh;
        })
            .start()
            .onComplete(() => {
            activateAction(allActions[1]);
            //console.log(activeAction)
            activeAction.clampWhenFinished = true;
            activeAction.loop = THREE.LoopOnce;
        });
    }
}
const stats = Stats();
document.body.appendChild(stats.dom);
var animations = {
    default: function () {
        setAction(animationActions[0]);
    },
    samba: function () {
        setAction(animationActions[1]);
    },
    bellydance: function () {
        setAction(animationActions[2]);
    },
    goofyrunning: function () {
        setAction(animationActions[3]);
    },
};
const setAction = (toAction) => {
    if (toAction != activeAction) {
        lastAction = activeAction;
        activeAction = toAction;
        //lastAction.stop()
        lastAction.fadeOut(.2);
        activeAction.reset();
        activeAction.fadeIn(.2);
        activeAction.play();
    }
};
const gui = new GUI();
const animationsFolder = gui.addFolder("Animations");
animationsFolder.open();
const clock = new THREE.Clock();
var animate = function () {
    requestAnimationFrame(animate);
    controls.update();
    const delta = clock.getDelta();
    if (modelReady) {
        mixer.update(delta);
        if (!modelMesh.quaternion.equals(targetQuaternion)) {
            modelMesh.quaternion.rotateTowards(targetQuaternion, delta * 10);
        }
    }
    TWEEN.update();
    render();
    stats.update();
};
function render() {
    renderer.render(scene, camera);
}
animate();
