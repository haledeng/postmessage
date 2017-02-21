(function(win) {
	/**
	 *
	 * usage:
	 * 
	 * PM.getMessage(function(data){
	 * 	
	 * });
	 *
	 * PM.postMessage({
	 * 	time: +new Date(),
	 * 	data: {
	 * 		status: 0,
	 * 		info: []
	 * 	}
	 * })
	 */

	// 同级目录下的proxy.html文件
	var COOKIE_URL = 'http://www.abc.com/proxy.html';

	var noop = function noop() {};

	var callback = noop;

	// iframe是否加载成功
	var proxyHasLoaded = false;

	var DOMAIN = COOKIE_URL.replace(/(https?:\/\/)([^\/]*)\/(.*)/, function(all, protocol, domain) {
		return protocol + domain;
	});

	var ifrId = 'ifr_' + Math.random().toString(32).slice(2, 10);

	var isType = function isType(obj, type) {
		return Object.prototype.toString.call(obj) === '[object ' + type + ']';
	};

	// 判断在iframe中
	var isInIframe = function isInIframe() {
		return self !== window.top || self !== window.parent;
	};

	// 等待某个表达式返回true后，再执行
	var waitFor = function waitFor(testFn, then, onTimeout, timeout) {
		var start = +new Date();
		var condition = false;
		var interval = setInterval(function() {
			if (+new Date() - start < timeout && !condition) {
				condition = testFn();
				return;
			}
			if (condition) {
				'function' === typeof then && then();
			} else {
				'function' === typeof onTimeout && onTimeout();
			}
			clearInterval(interval);
		}, 50);
	};

	/**
	 * 创建隐藏iframe
	 */
	var createHiddenIframe = function createHiddenIframe(url, onload) {
		if (isInIframe()) return;
		var ifr = document.createElement('iframe');
		ifr.id = ifrId;
		ifr.height = 0;
		ifr.width = 0;
		ifr.src = url;
		ifr.onload = function() {
			proxyHasLoaded = true;
			typeof onload === 'function' && onload();
			ifr.onload = ifr.onerror = null;
		};
		ifr.onerror = function() {
			proxyHasLoaded = true;
			ifr.onload = ifr.onerror = null;
		};
		document.body.appendChild(ifr);
	};

	// 向iframe发送信息，信息会被写到res.sspsky.com域名下的cookie中
	// 签名？postMessage时，附带签名信息，proxy验证签名通过后，才写cookie
	var postMessage = function postMessage(msg) {
		if (isInIframe()) return;
		if (!isType(msg, 'Object') /* || Object.keys(msg).length === 0*/ ) return;
		var ifr = document.getElementById(ifrId);
		var _post = function _post(_ifr) {
			_ifr.contentWindow.postMessage(JSON.stringify(msg), DOMAIN);
		};
		if (!ifr) {
			console.log('iframe has not been created');
			createHiddenIframe(COOKIE_URL, function() {
				ifr = document.getElementById(ifrId);
				_post(ifr);
			});
		} else {
			_post(ifr);
		}
	};

	// 只调用一次，避免多次监听事件处理
	var addListener = function addListener() {

		var listener = function(e) {
			if (e.origin === DOMAIN) {
				var data = JSON.parse(e.data);
				typeof callback === 'function' && callback(data);
			}
		};
		if (window.addEventListener) {
			window.addEventListener('message', listener, false);
		} else if (window.attachEvent) {
			window.attachEvent('onmessage', listener, false);
		}
	};

	// 接收res.sspsky.com发送的信息，主要是cookie信息
	// 向iframe下发push指令
	// 通过iframe向主页面push信息
	var getMessage = function getMessage(_callback) {
		if (isInIframe()) return;
		callback = _callback;
		var ifr = document.getElementById(ifrId);
		// 请求proxy页面push消息
		var _requestMessage = function _requestMessage(_ifr) {
			_ifr.contentWindow.postMessage(JSON.stringify({
				__ACTION__: 'push'
			}), DOMAIN);
		};
		if (!ifr) {
			console.log('iframe has not been created');
			createHiddenIframe(COOKIE_URL, function() {
				ifr = document.getElementById(ifrId);
				_requestMessage(ifr);
			});
		} else {
			// iframe 可能还没有load加载完成
			if (proxyHasLoaded) {
				_requestMessage(ifr);
			} else {
				// waiting
				waitFor(function test() {
					return proxyHasLoaded;
				}, function onThen() {
					_requestMessage(ifr);
				}, function onTimeout() {
					console.log('proxy load timeout');
				}, 3e4);
			}
		}
	};

	// 清除所有信息
	var clearAll = function() {
		var ifr = document.getElementById(ifrId);
		ifr.contentWindow.postMessage(JSON.stringify({
			__ACTION__: 'clear'
		}), DOMAIN);
	};


	// 删除某个key
	var deleteKey = function(key) {
		var ifr = document.getElementById(ifrId);
		ifr.contentWindow.postMessage(JSON.stringify({
			__ACTION__: 'delete',
			key: key
		}), DOMAIN);
	}

	// 预加载iframe
	function init() {
		if (isInIframe() || !'postMessage' in window) return;
		addListener();
		createHiddenIframe(COOKIE_URL);
	}
	init();

	// export interface
	win.PM = {
		postMessage: postMessage,
		getMessage: getMessage,
		clearAll: clearAll,
		deleteKey: deleteKey
	};
})(window);