import SPACE from "./ISS.js"

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const userLat = localStorage.getItem('userLat') 
  ? parseFloat(localStorage.getItem('userLat')) 
  : parseFloat(25);

const userLon = localStorage.getItem('userLon') 
  ? parseFloat(localStorage.getItem('userLon')) 
  : parseFloat(73);

document.getElementById('lat').value = userLat;
document.getElementById('lan').value = userLon;

document.querySelector('form').addEventListener('submit', (event) => {
    event.preventDefault();
    const userLat = parseFloat(document.querySelector('#lat').value);
    const userLon = parseFloat(document.querySelector('#lan').value);
    console.log(userLat, userLon);
    space.updateUserCirclePosition(userLat, userLon);
    headme.onclick = () => space.headME(userLat , userLon , 1.5);
    animate()
});
const issCoordsDiv = document.getElementById('issCoords');
const alertBox = document.getElementById('alertBox');
const headiss = document.getElementById('headISS');
const headme = document.getElementById('headME');

headiss.onclick = () => space.headME();
headme.onclick = () => space.headME(userLat , userLon , 1.5);

let space = new SPACE(THREE , OrbitControls  , { minDistance : 5.5 , maxDistance : 40 })
document.body.appendChild(space.renderer.domElement)


space.getStars(10000)
space.renderEarth('./assets/earthtexture.jpg')
space.renderCloudLayer('./assets/cloud.jpg')
space.renderSun('./assets/sun.jpg')
space.lightSetup()
space.Mylocation(userLat , userLon , 1.2 )
space.loadISS(GLTFLoader , issCoordsDiv , alertBox , 2000)
space.renderISSorbit()



//animate setup
function animate() {
    requestAnimationFrame(animate);
    space.controls.update();
    space.renderer.render(space.scene, space.camera);
}

window.addEventListener('resize', () => {
    space.camera.aspect = window.innerWidth / window.innerHeight;
    space.camera.updateProjectionMatrix();
    space.renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();