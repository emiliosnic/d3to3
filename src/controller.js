
/**
 *   File: controller.js
 */

function Controller() {

	var _controller = {};

	/**
	 * Initialize Controller
	 */ 

	_controller.initializer = ({
		init: function () {
			_controller.config = { 
				'source'   : undefined, 
				'target'   : undefined,
				'controls' : false,
				'3D'       : false,
				'orbit'    : false
			};
			_controller.canvas = {
				offsetLeft : 0,
				offsetTop  : 0,
				width      : null, 
				height     : null 
			}
			_controller.model = { 
				axes    : [],
				texts   : [],
				content : []
			}; 
		}
	}).init();


	/**
	 * Create protected canvas objects 
	 */ 

	var camera, renderer, scene, group, container, controls, canvas, light, mouse, raycaster,
		ENABLE_ANIMATION = true;

	/**
	 * Setup WebGL Canvas 
	 */ 

	var setupCanvas = function () {	

		camera    = CAMERAS.DEFAULT(_controller.canvas.width, _controller.canvas.height);
		light     = LIGHTS.DEFAULT();
		renderer  = RENDERERS.DEFAULT(_controller.canvas.width, _controller.canvas.height);
		group     = GROUPS.DEFAULT();
		mouse     = new THREE.Vector3();
		raycaster = new THREE.Raycaster();


		if (_controller.config.controls){
			controls = CONTROLS.Orbit(camera);
			controls.addEventListener( 'change', function(){
				ENABLE_ANIMATION = false;
				camera.updateProjectionMatrix();
				light.alignToPosition(camera.position); 
				render();
			});
			renderer.domElement.addEventListener( 'mousewheel',     mousewheel, false );
			renderer.domElement.addEventListener( 'DOMMouseScroll', mousewheel, false ); 
			renderer.domElement.addEventListener( 'mousemove', onDocumentMouseMove, false );
		}

		if (_controller.config.target != undefined){
			container = document.getElementById(_controller.config.target);
		} else {
			container = document.getElementById(_controller.config.source);
		}
		container.appendChild( renderer.domElement );
	};

	/**
	 * Setup Views 
	 */ 

	var setupViews = function () {	
		
		// Setup Data Views
		_controller.model.content.forEach(function(model){
			new VIEW()
				.type(model.type)
				.setProperties({
					'canvas': _controller.canvas,
					'3D'    : _controller.config['3D'],
					'style' : _controller.config.style
				})
				.loadData(model.data)
				.appendTo(group);
		});

		// Setup Axes Views
		_controller.model.axes.forEach(function(axis){
			new VIEW()
				.type('axis')
				.setProperties({
					'canvas':_controller.canvas,
					'3D':    _controller.config['3D']
				})
				.loadData(axis)
				.appendTo(group);
		})



		// Setup Text Views
		_controller.model.texts.forEach(function(text){
			new VIEW()
				.type(text.type)
				.setProperties({
					'canvas':_controller.canvas,
					'3D':    _controller.config['3D']
				})
				.loadData(text)
				.appendTo(group);
		})

		// Flush Model
		_controller.model.content = [];

		// Flush the SVG tree (If source and targer are the same)

		if (_controller.config.source == _controller.config.target || _controller.config.target == undefined){
			document.getElementById(_controller.config.source).getElementsByTagName('svg')[0].remove();
		} 

		// Process network graph (if any)

		if (   _controller.config.network 
			&& _controller.config.network['zDepth'] 
			&& _controller.config['3D']){
			
			group.expandNetworkDepth(_controller.config.network['zDepth']);
		}

		// Populate scene 

		scene = (new THREE.Scene())
			.add(camera)
			.add(light)
			.add(group);
	}

	/**
	 * Animate helper
	 */ 

	var animate = function () {	
		render();
		requestAnimationFrame(animate);
	}

	/**
	 * Render helper
	 */ 

	var render = function() {	
		

		if (ENABLE_ANIMATION && _controller.config.orbit ){
			camera.orbitAroundCenter(scene);
			light.alignToPosition(camera.position); 
		}
		camera.updateProjectionMatrix();

		renderer.render( scene, camera );
	}

	/**
	 * Window resize helper
	 */ 

	function onWindowResize() {

		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize( window.innerWidth, window.innerHeight );
		render();
	}

	/**
	 * Mouse Wheel helper (for orthogonal camera)
	 */ 

	var mousewheel = function(event) {

		event.preventDefault();
		event.stopPropagation();

		camera.updateZoom(event);
		camera.updateProjectionMatrix();

		renderer.render(scene,camera);
	}
	
	/**
	 * Mouse Move processing (for network and 3D mode)
	 */ 

	function onDocumentMouseMove( event ) {
		
		event.preventDefault();

		if (!_controller.config.network || !_controller.config['3D'])
			return;

		var xPerc = (UNITS.normalizeH(event.offsetX-_controller.canvas.offsetLeft,_controller.canvas)/renderer.domElement.width  * 4 ),
			yPerc = (UNITS.normalizeV(event.offsetY-_controller.canvas.offsetTop, _controller.canvas)/renderer.domElement.height * 4 );

		mouse.set( xPerc, yPerc, - 1); 
		mouse.unproject( camera );

		var dir = new THREE.Vector3();
			dir.set( 0, 0, - 1 ).transformDirection( camera.matrixWorld );

		raycaster.set(mouse,dir);

		var intersects = raycaster.intersectObjects( group.children, true );

		if (intersects.length>0){
			// De-highlight all meshes in group
			group.children.forEach(function(object){
				object.hide();
			})

			// Highlight intersected objects
			intersects.forEach(function(intersection){
				intersection.object.show();

				// If this is a network graph then also highlight connected nodes
				if (_controller.config.network){
					group.highlightConnectedNodes(intersection.object);
				}

			})
		} else {
			// De-highlight all meshes in group
			group.children.forEach(function(object){
				object.show();
			})
		}
	}

	/**
	 * Public Methods
	 */ 

	_controller.addedMeshes = false;

	_controller.updateMeshes = function(data){

		if (!_controller.addedMeshes){
			_controller.model.content.push({ 
				'data' : data[0],
				'type' : data[0][0].nodeName
			});
			_controller.addedMeshes = true;
		}  else {

			var dataIndex = 0;

	        if (! group instanceof THREE.Group)
				return;	

			group.children.forEach(function(mesh, meshIndex){
				if (mesh.geometry.type == "CircleGeometry" || mesh.geometry.type == "SphereGeometry"){

					var baseX = data[0][dataIndex].cx.baseVal.value;
					var baseY = data[0][dataIndex].cy.baseVal.value;
					var baseRadius = data[0][dataIndex].r.baseVal.value;
					var scaleR = baseRadius / mesh.geometry.boundingSphere.radius;

					var x = UNITS.normalizeH(baseX, _controller.canvas),
						y = UNITS.normalizeV(baseY, _controller.canvas);


					mesh.scale.x = scaleR;
					mesh.scale.y = scaleR;
					mesh.scale.z = scaleR;

					mesh.position.setX(x);
					mesh.position.setX(x);
					mesh.position.setY(y);

					dataIndex++;

				}
	        })
		}
	}

	_controller.setup = function(){

		setupCanvas();
		setupViews();
		animate();
	}

	_controller.configure = function(properties){
		try {
			for (property in properties){
				_controller.config[property] = properties[property];
			} 
		} catch (err){
			LOGGER.report({'message': 'Configuration failed.', 'error':err });
		}
	}

	/**
	 * Return instance reference
	 */ 

	return _controller ;
}


