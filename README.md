
```
//init envoriment
npm install -g typescript
npm init
npm install three

//for http/path module in server.ts
npm install @types/node 

//refresh the server.ts, if need
F1->Restart TS server

//for express module in server.ts
npm install express
npm install @types/express

//build you code
tsc -p ./src/client/
tsc -p ./src/server/

//run the server for normal mode
node ./dist/server/server.js

//auto hot compile
tsc -p src/server/ -w

//install nodemon for auto restart server after hot compile
npm install nodemon --save-dev [-g]
//run nodemon(npx nodemon ./dist/server/server.js for local)
nodemon ./dist/server/server.js

//install concurrently for starting boh processes by a sigle command
npm instsall concurrently --save-dev

//add "dev": "concurrently -k \"tsc -p ./src/server -w\" \"tsc -p ./src/client -w\" \"nodemon ./dist/server/server.js\"" to package.json->scripts 
npm run dev
```

```
|-- Three.js-TypeScript-Tutorial
    |-- dist
        |-- client
            |-- index.html
        |-- server
    |-- node_modules
        |-- three
            |-- (Several extra files and folders containing the Three.js source code)
    |-- src
        |-- client
            |-- client.ts
            |-- tsconfig.json
        |-- server
            |-- server.ts
            |-- tsconfig.json
    |-- package.json
    |-- package-lock.json
```

dist/client/index.htm
```
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>

<body>
    <script type="module" src="client.js"></script>
</body>

</html>
```

src/client/client.ts
```
import * as THREE from '/build/three.module.js'
import { OrbitControls } from '/jsm/controls/OrbitControls'

const scene: THREE.Scene = new THREE.Scene()

const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)

const renderer: THREE.WebGLRenderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

const controls = new OrbitControls(camera, renderer.domElement)

const geometry: THREE.BoxGeometry = new THREE.BoxGeometry()
const material: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true })

const cube: THREE.Mesh = new THREE.Mesh(geometry, material)
scene.add(cube)

camera.position.z = 2

var animate = function () {
    requestAnimationFrame(animate)

    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;

    controls.update()

    renderer.render(scene, camera)
};

animate();
```

src/client/tsconfig.json
```
{
    "compilerOptions": {
        "target": "ES6",
        "module": "ES6",
        "outDir": "../../dist/client",
        "baseUrl": ".",
        "paths": {
            "/build/three.module.js": ["../../node_modules/three/src/Three"],
            "/jsm/*": ["../../node_modules/three/examples/jsm/*"],
        },
        "moduleResolution": "node"
    },
    "include": [
        "**/*.ts"
    ]
}
```

src/server/server.ts
```
import http from "http"
import path from "path"
import express from "express"

const port: number = 3000

class App {
    private server: http.Server
    private port: number

    constructor(port: number) {
        this.port = port
        const app = express()
        app.use(express.static(path.join(__dirname, '../client')))
        app.use('/build/three.module.js', express.static(path.join(__dirname, '../../node_modules/three/build/three.module.js')))
        app.use('/jsm/controls/OrbitControls', express.static(path.join(__dirname, '../../node_modules/three/examples/jsm/controls/OrbitControls.js')))

        this.server = new http.Server(app);
    }

    public Start() {
        this.server.listen(this.port, () => {
            console.log( `Server listening on port ${this.port}.` )
        })
    }
}

new App(port).Start()
```

src/server/tsconfig.js
```
{
    "compilerOptions": {
        "target": "ES2019",
        "module": "commonjs",
        "outDir": "../../dist/server",
        "sourceMap": true,
        "esModuleInterop": true
    },
    "include": [
        "**/*.ts"
    ]
}
```