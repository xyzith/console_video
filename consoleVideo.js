!function() {
	const config = {
		fps: 5,
		pixelPerRow: 45,
		colorMixMethod: 'full'
	}
	
	const video = document.querySelector('video');
	if (!video) return false;
	const canvas = document.createElement('canvas');
	const ctx = canvas.getContext('2d');
	const delay = Math.floor(1000 / config.fps)
	const colorMixMethods = {
		none: function(grid) {
			return Array.prototype.slice.call(grid.data, 0, 3);
		},
		full: function(grid) {
			let r = g = b = 0;
			const { data } = grid;
			const pixels = data.length / 4;
			for (let i = 0; i < pixels; i++) {
				r += data[i * 4];
				g += data[i * 4 + 1];
				b += data[i * 4 + 2];
			}
			return [r, g, b].map((c) => Math.floor(c / pixels) );
		}
	}

	function requestFrame(callback) {
		setTimeout(callback, delay);
	} 

	function start() {
		const { videoWidth, videoHeight } = video;

		canvas.width = videoWidth;
		canvas.height = videoHeight;

		const column = config.pixelPerRow;
		const gridWidth = Math.floor(videoWidth / column);
		const row = Math.floor(videoHeight / gridWidth);
		const viewer = new Viewer(row, column);
		const colorMixMethod = colorMixMethods[config.colorMixMethod];
		function play() {
			ctx.drawImage(video, 0, 0);

			for (let i = 0; i < row; i++) {
				const offsetY = i * gridWidth;
				for (let j = 0; j < column; j++) {
					const offsetX = j * gridWidth;
					const grid = ctx.getImageData(offsetX, offsetY, gridWidth, gridWidth);
					viewer.add(colorMixMethod(grid))
				}
			}

			viewer.render();
			requestFrame(play);
//			requestAnimationFrame(play);
		}
		requestFrame(play);
//		requestAnimationFrame(play);
	}

	class Viewer {
		constructor(...args) {
			this.content = this.initContent(...args);
			this.colors = [];
		}
		initContent(row, column) {
			let str = '';
			for (let i = 0; i < row; i++) {
				str += '\n';
				for(let j = 0; j < column; j++) {
					str += '%c\u2580 ';
				}
			}
			return str;
		}
		add (color) {
			this.colors.push(color.map((c) => { 
				let hex = c.toString(16);
				return hex.length == 2 ? hex : `0${hex}`;
			}).join(''));
		}
		render () {
			const colors = this.colors.map((c) => `color: #${c};`);
			console.clear();
			console.log.apply(console, [this.content, ...colors])
			this.colors = [];
		}
	}
	if (!video.paused) {
		start();
	} else {
		video.addEventListener('play', start);
	}
}();
