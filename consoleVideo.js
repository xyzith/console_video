!function() {
	const video = document.querySelector('video');
	if (!video) return false;
	const canvas = document.createElement('canvas');
	const ctx = canvas.getContext('2d');
	const config = {
		fps: 3,
		pixelPerRow: 45 
	}

	function requestFrame(callback) {
		setTimeout(callback, 250);
	} 

	function start() {
		const { videoWidth, videoHeight } = video;

		canvas.width = videoWidth;
		canvas.height = videoHeight;

		const column = config.pixelPerRow;
		const gridWidth = Math.floor(videoWidth / column);
		const row = Math.floor(videoHeight / gridWidth);
		const viewer = new Viewer(row, column);

		function play() {
			const grids = [];
			ctx.drawImage(video, 0, 0);
			for (let i = 0; i < row; i++) {
				const offsetY = i * gridWidth;
				for (let j = 0; j < column; j++) {
					const offsetX = j * gridWidth;
					grids.push(ctx.getImageData(offsetX, offsetY, gridWidth, gridWidth));
				}
			}
			grids.forEach((g) => viewer.add(Array.prototype.slice.call(g.data, 0, 3)));
			viewer.render();
			requestFrame(play);
		}
		requestFrame(play);
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
