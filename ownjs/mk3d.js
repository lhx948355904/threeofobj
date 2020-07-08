class Lq {
	constructor(options) {
		this.options = options;

		//加载依赖js
		this.loadJS();

		window.onload = () => {
			//初始化three
			this.initThree(options)
		}

		//定义获取元素方法
		Object.defineProperties(window, {
			getEl: {
				value: function(el) {
					return document.querySelector(el)
				},
				enumerable: false,
				configurable: true
			},
			getEls: {
				value: function(el) {
					return document.querySelectorAll(el)
				},
				enumerable: false,
				configurable: true
			},
		})
	}

	loadJS() {
		const threeJs = ['./js/three.js']
		const jsArr = [
			'./js/TrackballControls.js',
			'./js/DDSLoader.js',
			'./js/OBJLoader.js',
			'./js/OBJMTLLoader.js',
			'./js/Detector.js',
			'./js/dat.gui.min.js',
			'./js/OrbitControls.js',
			'./js/TransformControls.js',
			'./js/DragControls.js',
		]

		this._importJs(threeJs, () => {
			this._importJs(jsArr, () => {
				console.info("资源加载完毕");

				this.colorsOfObj = {};
				this.modelBox3 = new THREE.Box3();
				this.changeMaterialBool = false;
			})
		})
	}

	//重置3d
	reset() {
		this.initCamera();
		this.initControls();
	}

	//隐线可见
	showHideLine() {
		this.changeMaterialBool = !this.changeMaterialBool;
		for(let x of this.meshArrs) {
			this.changeMaterial(x)
		}
	}

	//展示树图
	showTree() {
		let that = this;
		if($(".treeSelect").html() == "") {
			var arr = [{
				name: that.meshParent.name || "模型",
				id: 1,
				pId: 0,
				type: '0',
			}]

			for(let x in that.meshArrs) {
				arr.push({
					name: that.meshArrs[x].name,
					id: x + '0',
					pId: 1,
					type: '1',
				})
			}

			$(".treeSelect").treeSelect({
				data: arr,
				inputId: "txt",
				//点击 获取到指定obj 变色
				zTreeOnClick(e) {
					let name = e.target.innerHTML;
					for(let x of that.meshArrs) {

						if(x.name == name) {
							that.changeMaterial(x)
						}
					}
				}
			})
			//			$("#txt").click();
		} else {
			$(".treeSelect").toggle(200);
		}

	}
	
	//切换坐标轴
	toggleAxisHelper(){
		this.axisHelper.visible = !this.axisHelper.visible ;
	}
	
	//全屏方法
	fullScreen() {
		var de = document.documentElement;
		if(de.requestFullscreen) {
			de.requestFullscreen();
		} else if(de.mozRequestFullScreen) {
			de.mozRequestFullScreen();
		} else if(de.webkitRequestFullScreen) {
			de.webkitRequestFullScreen();
		} else if(de.msRequestFullscreen) {
			de.msRequestFullscreen();
		} else {
			wtx.info("当前浏览器不支持全屏！");
		}

	};

	// 场景
	initScene() {
		this.scene = new THREE.Scene();
	}

	// 相机
	initCamera() {
		this.camera = new THREE.PerspectiveCamera(10, window.innerWidth / window.innerHeight, 0.1, 2000);
		this.camera.position.set(50, 50, 50);
	}

	// 渲染器
	initRenderer() {
		if(Detector.webgl) {
			this.renderer = new THREE.WebGLRenderer({
				antialias: true,
				alpha: true
			});
		} else {
			this.renderer = new THREE.CanvasRenderer();
		}
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		this.renderer.setClearColor(0x000000,0);
		document.body.appendChild(this.renderer.domElement);
	}

	// 初始化模型
	initContent() {
		var raycaster = new THREE.Raycaster()
		var mtlLoader = new THREE.MTLLoader();
		mtlLoader.setPath(this.options.path);
		mtlLoader.load(this.options.mtl, (materials) => {

			materials.preload();

			var objLoader = new THREE.OBJLoader();
			objLoader.setMaterials(materials);
			objLoader.setPath(this.options.path);
			objLoader.load(this.options.obj, (object) => {
				object.scale.set(0.05, 0.05, 0.05);
				this.meshParent = object;
				this.meshArrs = object.children;

				for(let x of this.meshArrs) {
					this.colorsOfObj[x.uuid] = x.material.color;
				}
				this.scene.add(object);

			});

		});
	}

	//爆炸效果
	modelExplode(model, num) {
		this.modelBox3 = new THREE.Box3();
		this.modelBox3.expandByObject(model);

		var modelWorldPs = new THREE.Vector3().addVectors(this.modelBox3.max, this.modelBox3.min).multiplyScalar(0.5);
		var childBox = new THREE.Box3();
		model.traverse(function(child) {
			if(child.isMesh) {
				childBox.setFromObject(child);
				var childCenter = new THREE.Vector3().addVectors(childBox.max, childBox.min).multiplyScalar(0.5);

				if(isNaN(childCenter.x)) return;
				child.childCenter = new THREE.Vector3().subVectors(childCenter, modelWorldPs).normalize();
				//保存初始坐标
				//child.userData.oldPs = child.getWorldPosition(new THREE.Vector3());
				// console.log("初始坐标",child.userData.oldPs);
				if(!child.isMesh || !child.childCenter) return;
				//爆炸公式
				child.position.copy(childCenter).multiplyScalar(num);
			}
		});

	}

	// 初始化轨迹球控件
	initControls() {
		this.mouseControls = new THREE.TrackballControls(this.camera, this.renderer.domElement);
		this.mouseControls.staticMoving = false;
		this.mouseControls.rotateSpeed = 0.5; // 旋转速度
		this.mouseControls.zoomSpeed = 0.4; // 缩放速度
		this.mouseControls.panSpeed = 0.1; // 平controls
		//		this.controls.noRotate = true;
		//		this.controls.noPan = true;
	}

	// 改变对象材质属性
	changeMaterial(object) {
		var color = new THREE.Color("rgb(65,105,225)");

		var material = new THREE.MeshLambertMaterial({
			//					transparent: object.material.transparent ? false : true,
			opacity: 0.9,
			emissiveIntensity: object.material.emissiveIntensity == 10 ? 1 : 1,
			reflectivity: 1,
			wireframe: this.changeMaterialBool ? true : false,
			morphTargets: true,
			skinning: true,
			color: color.equals(object.material.color) ? this.colorsOfObj[object.uuid] : color
		});
		console.log(material.color)
		object.material = material;
	}

	initThree(options) {
		var that = this;
		//		this.initScene()
		var light, selectObject, labelToggle = true,
			activeObj;
		var modelBox3 = new THREE.Box3();
		var meshBox3 = new THREE.Box3();

		// 鼠标双击触发的方法
		function onMouseClick(event) {

			function getIntersects(event) {
				event.preventDefault();
				//				console.log("event.clientX:" + event.clientX)
				//				console.log("event.clientY:" + event.clientY)

				// 声明 raycaster 和 mouse 变量
				var raycaster = new THREE.Raycaster();
				var mouse = new THREE.Vector2();

				// 通过鼠标点击位置,计算出 raycaster 所需点的位置,以屏幕为中心点,范围 -1 到 1
				mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
				mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

				//通过鼠标点击的位置(二维坐标)和当前相机的矩阵计算出射线位置
				raycaster.setFromCamera(mouse, that.camera);

				// 获取与射线相交的对象数组，其中的元素按照距离排序，越近的越靠前
				var intersects = raycaster.intersectObjects(that.meshArrs);

				//返回选中的对象
				return intersects;
			}

			// 获取 raycaster 和所有模型相交的数组，其中的元素按照距离排序，越近的越靠前
			var intersects = getIntersects(event);

			// 获取选中最近的 Mesh 对象
			if(intersects.length != 0 && intersects[0].object instanceof THREE.Mesh) {
				selectObject = intersects[0].object;
				labelToggle = false;
				activeObj = selectObject;

				that.changeMaterial(selectObject);
				renderDiv(selectObject);
				//					modelExplode(selectObject, 20)
			} else {
				labelToggle = false;
			}
		}

		// 获取与射线相交的对象数组
		function getIntersects(event) {
			event.preventDefault();
			//			console.log("event.clientX:" + event.clientX)
			//			console.log("event.clientY:" + event.clientY)

			// 声明 raycaster 和 mouse 变量
			var raycaster = new THREE.Raycaster();
			var mouse = new THREE.Vector2();

			// 通过鼠标点击位置,计算出 raycaster 所需点的位置,以屏幕为中心点,范围 -1 到 1
			mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
			mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

			//通过鼠标点击的位置(二维坐标)和当前相机的矩阵计算出射线位置
			raycaster.setFromCamera(mouse, that.camera);

			// 获取与射线相交的对象数组，其中的元素按照距离排序，越近的越靠前
			var intersects = raycaster.intersectObjects(that.scene.children);

			//返回选中的对象
			return intersects;
		}

		// 窗口变动触发的方法
		function onWindowResize() {
			that.camera.aspect = window.innerWidth / window.innerHeight;
			that.camera.updateProjectionMatrix();
			that.renderer.setSize(window.innerWidth, window.innerHeight);
		}

		// 键盘按下触发的方法
		function onKeyDown(event) {
			console.log(event.keyCode)
			switch(event.keyCode) {
				case 13:
					that.reset();
					break;
				//左
				case 37:
					var axis = new THREE.Vector3(1,1,0);//向量axis
					for(let x of that.meshArrs) {
						x.translateOnAxis(axis, 10);
					}
			}
		}

		// 添加拖拽控件
		function initDragControls() {
			// 添加平移控件
			var transformControls = new THREE.TransformControls(that.camera, that.renderer.domElement);
			transformControls.setMode('scale')
			that.scene.add(transformControls);

			// 过滤不是 Mesh 的物体,例如辅助网格对象
			var objects = [];
			for(let i = 0; i < that.scene.children.length; i++) {
				if(that.scene.children[i].isMesh) {
					objects.push(that.scene.children[i]);
				}
			}
			// 初始化拖拽控件
			var dragControls = new THREE.DragControls(objects, that.camera, that.renderer.domElement);

			// 鼠标略过事件
			dragControls.addEventListener('hoveron', function(event) {
				// 让变换控件对象和选中的对象绑定
				transformControls.attach(event.object);
			});
			// 开始拖拽
			dragControls.addEventListener('dragstart', function(event) {
				that.mouseControls.enabled = false;
			});
			// 拖拽结束
			dragControls.addEventListener('dragend', function(event) {
				that.mouseControls.enabled = true;
			});
		}

		// 初始化灯光
		function initLight() {
			light = new THREE.SpotLight('white');
			light.position.set(-300, 300, 300);
			light.castShadow = true;

			that.scene.add(light);
			that.scene.add(new THREE.AmbientLight('white'));
		}

		// 初始化 dat.GUI
		function initGui() {
			// 保存需要修改相关数据的对象
			gui = new function() {

			}
			// 属性添加到控件
			var guiControls = new dat.GUI();
		}

		function initOrbitControls() {
			var controls = new THREE.OrbitControls(that.camera, that.renderer.domElement); //创建控件对象
			controls.addEventListener('change', animate); //监听鼠标、键盘事件
		}

		function initAxisHelper() {
			that.axisHelper = new THREE.AxisHelper(400);
			that.axisHelper.visible = false;
			that.scene.add(that.axisHelper);
		}

		// 更新div的位置
		function renderDiv(object) {
			// 显示模型信息
			$("#label").html(`
				<div title="${object.name}">
					设备名称:<span>${object.name}</span>
				</div>
				<div title="${object.uuid}">
					设备ID:<span>${object.uuid}</span>
				</div>
			`);

		}

		// 更新控件
		function update() {
			that.mouseControls.update();
			that.mouseControls.handleResize();

		}

		// 初始化
		function init() {
			that.initScene();
			that.initCamera();
			that.initRenderer();
			that.initContent();
			initLight();
			that.initControls();
			initAxisHelper();
			//			initDragControls();
//			initOrbitControls();
			//initGui();

			addEventListener('click', onMouseClick, false);
			addEventListener('resize', onWindowResize, false);
			addEventListener('keydown', onKeyDown, false);

		}

		function animate() {
			requestAnimationFrame(animate);
			that.renderer.render(that.scene, that.camera);
			update();
		}

		init();
		animate();

		

		$("#blastRange").on('input', (e) => {
			for(let x of this.meshArrs) {
				this.modelExplode(x, e.target.value * 0.4)
			}
		})
		
		$("#backgroundRange").on('input', (e) => {
			let v = e.target.value * 5;
			$("body").css("background",`rgb(${v},${v},${v})`)
		})
	}

	_importJs(url, callback) {
		let fn = callback || function() {},
			scriptList = [];
		if(url instanceof Array) {
			for(let x in url) {
				let script = document.createElement('script');
				script.src = url[x];
				script.defer = 'defer';
				script.type = 'text/javascript';
				x == url.length - 1 ? script.onload = () => fn() : "";
				scriptList.push(script)
			}
		} else {
			console.warn("路径为数组格式")
		}

		scriptList.map(v => {
			document.getElementsByTagName('head')[0].appendChild(v)
		})

	}
}

new Lq;