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

function getConfig() {
	const cfg = {};
	const form = document.forms.options;
	const formData = new FormData(form);
	for (let [k, v] of formData.entries()) {
		console.log(k, v);
		cfg[k] = v;
	}
	return cfg;
}

function regButtons(id) {
	document.querySelector('.play').addEventListener('click', (e) => {
		e.preventDefault();
		sendMessage(id, { action: 'PLAY' })
	});
	document.querySelector('.pause').addEventListener('click', (e) => {
		e.preventDefault();
		sendMessage(id, { action: 'PAUSE' })
	});
};


getCurrentChromeTab().then((tab) => {
	const { id } = tab;
	const target = document.querySelector('main .videos');

	regButtons(id);
	
	sendMessage(id, { action: "FETCH_VIDEOS" }).then((videos) => {
		console.log('msg return', videos);
		videos.forEach((...args) => {
			const btn = new VideoButton(id, ...args);
			target.appendChild(btn.render());
		});
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
			action: "INIT_VIDEO",
			idx: this.idx,
			config: getConfig(),
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

