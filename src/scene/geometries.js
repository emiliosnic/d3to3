
/**
 *   File: scene/geometries.js
 */

var GEOMETRIES = (function () {

	/**
	 * Restore object color and opacity
	 */ 

	_show = function(){
		this.material.color.set(this.savedColor);
		this.material.opacity     = 1;
		this.material.transparent = true;
		this.verticesNeedUpdate   = true;
	}

	/**
	 * Hide object (by setting low opacity)
	 */ 

	_hide = function(){
		this.material.opacity     = 0.1;
		this.material.transparent = true;
	}

	return {
		CIRCLE: function (properties) {
			var circle = new THREE.Mesh(new THREE.CircleGeometry(properties.radius, 64), MATERIALS.DEFAULT_2D(properties.color));
				circle.position.set(properties.x, properties.y, properties.z);
				circle.show = _show;
				circle.hide = _hide;
				circle.savedColor = COLORS.normalize(properties.color);

			return circle;
		},
		SPHERE: function (properties) {
			var sphere = new THREE.Mesh(new THREE.SphereGeometry(properties.radius, 64, 64), MATERIALS.DEFAULT_3D(properties.color));
				sphere.position.set(properties.x, properties.y, properties.z);
				sphere.show = _show;
				sphere.hide = _hide;
				sphere.savedColor = COLORS.normalize(properties.color);

			return sphere;
		},
		TEXT: function (properties) {

			var WIDTH  = 8,
				HEIGHT = 0;

			var textGeom = new THREE.TextGeometry( properties.text, { 
				size:   WIDTH, 
				height: HEIGHT
			});
			var	textMesh = new THREE.Mesh( textGeom, MATERIALS.DEFAULT_2D(properties.color));
				textMesh.position.set( 
					properties.x - WIDTH/2, 
					properties.y - WIDTH/2, 
					properties.z );

				// Disable hide and show controls for text sprites
				textMesh.show = function(){};
				textMesh.hide = function(){};

			return textMesh;
		},
		LINE: function (properties) {

			var material = properties.material ||  MATERIALS.LINE(properties.color, properties.thickness);

			var geometry = new THREE.Geometry();
				geometry.vertices.push(new THREE.Vector3(properties.x1, properties.y1, properties.z1));
				geometry.vertices.push(new THREE.Vector3(properties.x2, properties.y2, properties.z2));

			var line = new THREE.Line(geometry, material);
				line.show = _show;
				line.hide = _hide;
				line.savedColor = COLORS.normalize(properties.color);

			return line;
		},
		AXIS: function (properties) {

			var material = properties.material ||  MATERIALS.AXIS();

			var geometry = new THREE.Geometry();
				geometry.vertices.push(new THREE.Vector3(properties.x1, properties.y1, properties.z1));
				geometry.vertices.push(new THREE.Vector3(properties.x2, properties.y2, properties.z2));

			var axis = new THREE.Line(geometry, material);

				// Disable hide and show controls for axis
				axis.show = function(){};
				axis.hide = function(){};

			return axis;
		}
	}

})();
