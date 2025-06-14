class SPACE {
    THREE;
    scene;
    camera;
    renderer;
    this;
    earthRadius = 5;
    textureLoader;
    controls;
    userLocationGroup;
    proximityRadius;
    alertBox;
    mouse;

    constructor(THREE, OrbitControls) {
        this.THREE = THREE

        this.scene = new THREE.Scene()

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
        this.camera.position.z = 5;

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 5.5;
        this.controls.maxDistance = 40;
        this.textureLoader = new THREE.TextureLoader();
    }

    getStars = (numbers = 10000) => {
        const starGeometry = new this.THREE.BufferGeometry();
        const starVertices = [];
        for (let i = 0; i < numbers; i++) {
            const x = this.THREE.MathUtils.randFloatSpread(2000);
            const y = this.THREE.MathUtils.randFloatSpread(2000);
            const z = this.THREE.MathUtils.randFloatSpread(2000);
            starVertices.push(x, y, z);
        }
        starGeometry.setAttribute('position', new this.THREE.Float32BufferAttribute(starVertices, 3));
        const starMaterial = new this.THREE.PointsMaterial({ color: 'white' });
        const stars = new this.THREE.Points(starGeometry, starMaterial);
        this.scene.add(stars);
    }

    renderEarth(earthpath = './assets/earthtexture.jpg', options = { shininess: 100, bumpScale: 0.05, specularColor: 'grey' }) {
        const earthGeometry = new this.THREE.SphereGeometry(this.earthRadius, 64, 64);
        const earthTexture = this.textureLoader.load(earthpath);
        const earthMaterial = new this.THREE.MeshPhongMaterial({
            map: earthTexture,
            bumpMap: this.textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_normal_2048.jpg'),
            bumpScale: options.bumpScale,
            specularMap: this.textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_specular_2048.jpg'),
            specular: new this.THREE.Color(options.specularColor),
            shininess: options.shininess
        });
        const earth = new this.THREE.Mesh(earthGeometry, earthMaterial);
        this.earth = earth
        this.scene.add(earth);
    }

    renderCloudLayer = (cloudpath = './assents/cloud.jpg', options = { opacity: 0.4, bumpScale: 0.05, specularColor: 'grey' }) => {
        const cloudGeometry = new this.THREE.SphereGeometry(this.earthRadius * 1.00, 64, 64);
        const cloudTexture = this.textureLoader.load(cloudpath);
        const cloudMaterial = new this.THREE.MeshPhongMaterial({
            map: cloudTexture,
            bumpScale: options.bumpScale,
            specular: new this.THREE.Color(options.specularColor),
            transparent: true,
            opacity: options.opacity
        });
        const cloud = new this.THREE.Mesh(cloudGeometry, cloudMaterial);
        this.scene.add(cloud);
    }

    lightSetup = (
        ambientColor = 'white',
        ambientIntensity = 0.15,
        directionalColor = 'white',
        directionalIntensity = 1.2
    ) => {
        const ambientLight = new this.THREE.AmbientLight(ambientColor, ambientIntensity);
        this.scene.add(ambientLight);

        const directionalLight = new this.THREE.DirectionalLight(directionalColor, directionalIntensity);
        let lightCoordinates = this.getPositionForLightAndSun();
        directionalLight.position.copy(lightCoordinates);
        this.scene.add(directionalLight);
    };

    _latLonToVector3 = (lat, lon, radius) => {
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = (lon + 180) * (Math.PI / 180);
        const x = -(radius * Math.sin(phi) * Math.cos(theta));
        const z = (radius * Math.sin(phi) * Math.sin(theta));
        const y = (radius * Math.cos(phi));
        return new this.THREE.Vector3(x, y, z);
    }

    updateUserCirclePosition = (lat, lon) => {
        localStorage.setItem('userLat', lat);
        localStorage.setItem('userLon', lon);

        const userPosition = this._latLonToVector3(lat, lon, this.earthRadius + 0.01);
        this.userLocationGroup.position.copy(userPosition);
        this.userLocationGroup.lookAt(new this.THREE.Vector3(0, 0, 0));
        this.proximityCircle.visible = true;
        this.renderer.render(this.scene, this.camera);
    }

    Mylocation = (userLat, userLon, proximityRadius) => {
        //------------------for plate marker------------------------\\
        const plateGeometry = new this.THREE.CircleGeometry(0.1, 100);
        const plateMaterial = new this.THREE.MeshBasicMaterial({
            color: 'green',
            transparent: true,
            opacity: 0.5,
            side: this.THREE.DoubleSide,
            depthWrite: false
        });
        const userMarker = new this.THREE.Mesh(plateGeometry, plateMaterial);

        //------------------for circle marker-----------------------\\
        const proximityCircleGeometry = new this.THREE.TorusGeometry(proximityRadius, 0.02, 16, 100);
        const proximityCircleMaterial = new this.THREE.MeshBasicMaterial({
            color: 'white',
            transparent: true,
            opacity: 0.5
        });
        const proximityCircle = new this.THREE.Mesh(proximityCircleGeometry, proximityCircleMaterial);
        proximityCircle.visible = false;

        //--------------------creating group ------------------------\\
        const userLocationGroup = new this.THREE.Group();
        userLocationGroup.add(userMarker);
        userLocationGroup.add(proximityCircle);

        //adding to earth 
        this.earth.add(userLocationGroup);

        //setup view positino
        const userViewPosition = this._latLonToVector3(userLat, userLon, this.earthRadius * 1.8); //this is for where we see
        this.camera.position.copy(userViewPosition);
        this.camera.lookAt(new this.THREE.Vector3(0, 0, 0));

        //keep the group look at position
        const markerPosition = this._latLonToVector3(userLat, userLon, this.earthRadius + 0.01);
        userLocationGroup.position.copy(markerPosition);
        userLocationGroup.lookAt(new this.THREE.Vector3(0, 0, 0)); //this is for where our marker and all are

        //exporting stuffs to class level
        this.userLocationGroup = userLocationGroup;
        this.proximityCircle = proximityCircle;
        this.proximityRadius = proximityRadius;
    }

    updateISS = async (issSelf, issCoordsDiv, alertBox) => {
        let whereTheISS = 'https://api.wheretheiss.at/v1/satellites/25544';
        try {
            const res = await fetch(whereTheISS);
            const { latitude, longitude, altitude, velocity } = await res.json();
            this.issNow = { latitude, longitude, altitude, velocity };
            if (issSelf) {
                issSelf.position.copy(this._latLonToVector3(latitude, longitude, this.earthRadius + 0.4));


                if (issCoordsDiv) {
                    issCoordsDiv.innerHTML = `
                        <strong>ISS Position</strong><br>
                        Latitude: ${latitude.toFixed(4)}°<br>
                        Longitude: ${longitude.toFixed(4)}°<br>
                        Altitude: ${altitude.toFixed(2)} km<br>
                        Velocity: ${velocity.toFixed(2)} km/h`
                        ;
                }

                const isClose = issSelf.position.distanceTo(this.userLocationGroup.position) < this.proximityRadius;
                this.proximityCircle.visible = isClose;
                this.alertBox = alertBox
                alertBox.innerHTML = 'ISS is passing overhead!'
                alertBox.classList.toggle('visible', isClose);
            }
        } catch (err) {
            console.error("ISS tracking failed : ", err);
        }
    }

    loadISS = (GLTFLoader, issCoordsDiv, alertBox, updateIssInterval) => {
        const loader = new GLTFLoader();
        let issSelf;

        let highlighted = false;

        loader.load(
            './assets/iss23d.glb',
            (gltf) => {
                issSelf = gltf.scene;
                this.issSelf = issSelf
                issSelf.scale.set(2, 2, 2);
                this.earth.add(issSelf);

                this.updateISS(issSelf, issCoordsDiv, alertBox);
                setInterval(() => {
                    this.updateISS(issSelf, issCoordsDiv, alertBox);
                }, updateIssInterval);

            }
        );

    }

    getPositionForLightAndSun(multiplier = 1, date = new Date()) {
        const rad = Math.PI / 180;

        const startOfYear = new Date(Date.UTC(date.getUTCFullYear(), 0, 0));
        const diff = date - startOfYear;
        const dayOfYear = Math.floor(diff / 86400000);

        const declination = 23.44 * Math.cos(rad * ((360 / 365) * (dayOfYear + 10)));

        const utcHours = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
        const longitude = -15 * (utcHours - 12);

        return this._latLonToVector3(declination, longitude, this.earthRadius * multiplier);
    }

    renderSun(sunPath = './assets/sun.jpg', shininess = 100) {
        const sunGeometry = new this.THREE.SphereGeometry(this.earthRadius * 10, 64, 64)
        const sunTexture = this.textureLoader.load(sunPath);
        const _SunMaterial = new this.THREE.MeshPhongMaterial({
            map: sunTexture,
            bumpScale: 0.05,
            emissiveMap: sunTexture,
            emissive: new this.THREE.Color(0xffff00),
            emissiveIntensity: 1.5,
            shininess: shininess
        });
        const ss = this.getPositionForLightAndSun(400);
        const sun = new this.THREE.Mesh(sunGeometry, _SunMaterial);
        sun.position.copy(ss);
        this.scene.add(sun);
    }

    headME = (lat = this.issNow.latitude, lon = this.issNow.longitude, multiplyer = 1.2) => {
        const offset = this.earthRadius * multiplyer;
        const cameraPos = this._latLonToVector3(lat, lon, offset);

        this.camera.position.copy(cameraPos);
        this.camera.lookAt(new this.THREE.Vector3(0, 0, 0));

        // if (multiplyer == 1.2) {
        //     this.issSelf.traverse(child => {
        //         if (child.isMesh) {
        //             child.material.emissive.set('yellow');
        //         }
        //     });
        // }
        // this.controls.target.copy(center);
        // this.controls.update();
    };

    async renderISSorbit() {
      const now = Math.floor(Date.now() / 1000);
        const N = 20;
        const interval = 285;
        const half = Math.floor(N / 2);
        const timestamps = Array.from({ length: N }, (_, i) => now + (i - half) * interval);

        const url = `https://api.wheretheiss.at/v1/satellites/25544/positions?timestamps=${timestamps.join(',')}`;

        let pointsRes = await fetch(url);
        pointsRes = await pointsRes.json()

        const pointsArray = pointsRes.map(point =>
            this._latLonToVector3(point.latitude, point.longitude, this.earthRadius + 0.4)
        );

        const curve = new this.THREE.CatmullRomCurve3(pointsArray, true);
        const pointGeormetry = new this.THREE.TubeGeometry(curve, pointsArray.length * 10, 0.005, 3, true);
        const PointsMaterial = new this.THREE.MeshBasicMaterial({
            color: 'white',
            transparent: true,
            opacity: 0.5
        });
        const points = new this.THREE.Mesh(pointGeormetry, PointsMaterial);
        this.scene.add(points);
    }

}

export default SPACE