$.fn.Languager = function () {
	const owner    = $(this),
		  selected = owner.find(".selected"),
		  block    = owner.find(".lang_block");

	selected.off().click(function () {
		block.slideToggle();
		owner.toggleClass("sel");
	});

	return {
		val: () => selected.attr("tag"),
		set: v => block.find(`a[tag=${v}]`).click()
	};
};

$.fn.Dialog = function (msg, timeout, callback) {
	const owner = $(this);

	owner.hide().empty();
	owner.append(msg);

	owner.fadeIn("fast");
	setTimeout(function () {
		owner.fadeOut();
		if (typeof(callback) === "function") callback();
	}, (timeout || 3) * 1000);
};

function dialog (msg, timeout, callback = timeout) {
	$("#dialog").Dialog(msg, timeout, callback);
}

function language (page, lang, callback) {
	http("json", `/language/${page}.json`)
		.on("done", d => callback(d[lang]));
}

function httpRmd (url) {
	return url;
}

function http (type, url, data, headers) {
	if (!headers || typeof(headers) !== "object") headers = {};
	if (!data || typeof(data) !== "object") data = {};

	let callback = {},
		result   = {
			on:  (key, cb) => {
				callback[key] = cb;

				return result;
			},
			off: key => {
				delete callback[key];

				return result;
			}
		};

	switch (type) {
		case "get":
		case "post":
			$.ajax({
				url:      httpRmd(url),
				type:     type.toUpperCase(),
				dataType: "json",
				headers:  headers,
				data:     data,
				success:  function (d) {
					if (callback.done) callback.done(d);
				},
				error:    function (xhr) {
					if (callback.error) callback.error({code: xhr.status, msg: xhr.statusText});
				}
			});
			break;
		case "json":
			$.get(httpRmd(url), d => {
				if (d && callback.done) callback.done(d);
			});
			break;
		case "js":
			type = "script";
		case "script":
		case "text":
		case "html":
			$.ajax({
				url:      httpRmd(url),
				type:     "GET",
				dataType: type,
				headers:  headers,
				data:     data,
				success:  function (d) {
					if (callback.done) callback.done(d);
				},
				error:    function (xhr) {
					if (callback.error) callback.error("HTTP Code:" + xhr.status + ", " + xhr.statusText);
				}
			});
			break;
		case "file":
			(function () {
				var xhr = new XMLHttpRequest(),
					fd  = new FormData();

				xhr.upload.onprogress = function (e, p) {
					if (e.lengthComputable) {
						p = Math.round(e.loaded * 100 / e.total);
						if (callback.progress) callback.progress(p);
					}
				};
				xhr.onload            = function (e) {
					if (callback.done) callback.done(e.target.responseText);
				};
				xhr.onerror           = function (e) {
					console.error(e);
					if (callback.error) callback.error(e);
				};
				xhr.onabort           = function (e) {
					console.warn(e);
					if (callback.abort) callback.abort(e);
				};

				for (let k in data) fd.append(k, data[k]);

				xhr.open("POST", url, true);
				xhr.send(fd);
			})(httpRmd(url));
			break;
	}

	return result;
}

function calcTime (dt) {
	let val = (new Date()).getTime() - parseInt(dt);

	val = parseInt(val / 1000);
	if (val < 60) return `${val} Seconds`;

	val = parseInt(val / 60);
	if (val < 60) return `${val} Minutes`;

	val = parseInt(val / 60);
	if (val < 24) return `${val} Hours`;

	val = parseInt(val / 24);
	if (val < 31) return `${val} Days`;

	val = parseInt(val / 60);
	if (val < 12) return `${val} Months`;

	val = parseInt(val / 12);
	return `${val} Years`;
}

function analytics_google (id) {
	window.dataLayer = window.dataLayer || [];

	function gtag () {dataLayer.push(arguments);}

	gtag('js', new Date());
	gtag('config', id);
}

function analytics_baidu (id) {
}

function analytics_cnzz (id) {
	let cnzz_protocol = (("https:" == document.location.protocol) ? "https://" : "http://");
	document.write(unescape(`%3Cspan id='cnzz_stat_icon_${id}'%3E%3C/span%3E%3Cscript src='${cnzz_protocol}s23.cnzz.com/z_stat.php%3Fid%3D${id}' type='text/javascript'%3E%3C/script%3E`));
}