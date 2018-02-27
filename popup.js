function getCurrentChromeTab() {
	const queryInfo = {
		active: true,
		currentWindow: true
	};
	return new Promise((resolve, reject) => {
		chrome.tabs.query(queryInfo, tabs => {
			resolve(tabs[0]);
		});
	});
}
function sendMessage(tabId, data) {
	return new Promise((resolve, reject) => {
		chrome.tabs.sendMessage(tabId, data, r => resolve(r));
	});
}

getCurrentChromeTab().then((tab) => {
	const { id } = tab;
	const target = document.querySelector('main .videos');
	
	sendMessage(id, { action: "FETCH_VIDEOS" }).then((videos) => {
		console.log('msg return', videos);
		videos.forEach((...args) => {
			const btn = new VideoButton(id, ...args);
			target.appendChild(btn.render());
		});
		// render videos
	});
});

class VideoButton {
	constructor(id, file, idx) {
		this.file = file;
		this.idx = idx;
		this.tabId = id;
	}
	playVideo() {
		sendMessage(this.tabId, {
			action: "PLAY_VIDEO",
			idx: this.idx,
		});
	}
	render() {
		const btn = document.createElement('button');
		btn.textContent = this.file;
		btn.addEventListener('click', (e) => {
			e.preventDefault();
			this.playVideo();
		});
		return btn;
	}
}

// TODO halt clear resume
