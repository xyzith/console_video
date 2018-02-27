let video_list;
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	console.log('123');
	if(sender.id !== chrome.runtime.id) { return false; }
	console.log(request);
	switch(request.action) {
		case 'FETCH_VIDEOS':
			video_list = fetchVideo();
			sendResponse(Array.prototype.map.call(video_list, (v) => v.src ));
		case 'PLAY_VIDEO':
			playVideo(video_list[request.idx]);
	}
});
function fetchVideo() {
	return document.getElementsByTagName('video');
}

function playVideo(video) {
	if (!video) return false;

	const config = {
		fps: 5,
		pixelPerRow: 30,
		colorMixMethod: 'full'
	}
	
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
				const offset = i * 4;
				r += data[offset];
				g += data[offset + 1];
				b += data[offset + 2];
			}
			return [r, g, b].map((c) => Math.floor(c / pixels) );
		}
	}

	function requestFrame(callback) {
		return setTimeout(callback, delay);
	} 

	function start() {
		const { videoWidth, videoHeight } = video;
		video.crossorigin = "anonymous";

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
	if (!video.paused) {
		start();
	} else {
		//video.addEventListener('play', start);
	}

};
class Controller {
	constructor(video) {
		this.video = video;
		this.frameId;

		if (!this.video.paused) {
			//TODO start();
		} else {
			//video.addEventListener('play', start);
		}
	}
	play() {
	}
	stop() {
		clearTimeout(this.frameId);
	}
	start() {
	}
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
