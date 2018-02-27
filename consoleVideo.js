let video_list;
let player;

function fetchVideo() {
	return document.getElementsByTagName('video');
}

function getFileName(video) {
	let src = '';
	if (!(src = video.src)) {
		src = video.querySelector('source').src;
	}
	return src.match(/[^\/]*$/)
}

function playVideo(video, config = { fps: 1, ppr: 4, mixer: 'full' }) {
	if (!video) return false;
	player = new Player(video, config);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if(sender.id !== chrome.runtime.id) { return false; }
	switch(request.action) {
		case 'FETCH_VIDEOS':
			video_list = fetchVideo();
			sendResponse(Array.prototype.map.call(video_list, (v) => getFileName(v)));
			break;
		case 'INIT_VIDEO':
			playVideo(video_list[request.idx], request.config);
			break;
		case 'PLAY':
			player.play();
			break;
		case 'PAUSE':
			player.pause();
			break;
	}
});

class Player {
	constructor(video, config) {
		const mixers = {
			none: function(grid) {
				return Array.prototype.slice.call(grid.data, 0, 3);
			},
			all: function(grid) {
				let [r, g, b] = [0, 0, 0];
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

		this.state = 'INIT';
		this.mixer = mixers[config.mixer];
		this.canvas = document.createElement('canvas');
		this.ctx = this.canvas.getContext('2d');
		this.delay = Math.floor(1000 / config.fps);
		this.config = config;
		this.video = video;
		this.frameId;
		this.init();

		if (!this.video.paused) {
			this.play();
		} else {
			if (this.video.readyState === 4) {
				this.render();
			}
			video.addEventListener('play', this.play.bind(this));
		}
	}

	init() {
		const { videoWidth, videoHeight } = this.video;

		this.canvas.width = videoWidth;
		this.canvas.height = videoHeight;
		this.column = this.config.ppr;
		this.gridWidth = Math.floor(videoWidth / this.column);
		this.row = Math.floor(videoHeight / this.gridWidth);
		this.viewer = new Viewer(this.row, this.column);
		this.state = "READY";
	}

	render() {
		console.log()
		const { ctx, viewer, gridWidth, row, column, video, mixer } = this;
		ctx.drawImage(video, 0, 0);
		for (let i = 0; i < row; i++) {
			const offsetY = i * gridWidth;
			for (let j = 0; j < column; j++) {
				const offsetX = j * gridWidth;
				const grid = ctx.getImageData(offsetX, offsetY, gridWidth, gridWidth);
				viewer.add(mixer(grid))
			}
		}
		viewer.render();
	}

	play() {
		const { state } = this;
		if(state === 'INIT') {
			this.init();
			this.play();
		} else if(state != 'PLAYING') {
			this.frameId = setTimeout(this.anime.bind(this), 0);
			this.state = 'PLAYING';
		}
	}

	anime() {
		const { delay } = this;
		this.render();
		this.frameId = setTimeout(this.anime.bind(this), delay);
	}

	pause() {
		clearTimeout(this.frameId);
		this.state = 'PAUSE';
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
