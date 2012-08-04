/**
 * jQuery Tour - the flexible Tour plugin 1.2
 * (1.2.1 - by revaxarts)
 *
 * Copyright (c) 2011 Xaver Birsak
 * http://rxa.li/tour
 *
 * Licensed under the Envato Pty Ltd License Terms:
 * http://codecanyon.net/wiki/support/legal-terms/licensing-terms/
 *
 * limited, non-exclusive, non-transferable, non-sublicensable license
 */
window.jTour = function (tourdata, options) {

	//required to init the plugin with tour = jTour(...)
	if (this === window) return new jTour(tourdata, options);

	//short validation
	if (typeof jQuery !== 'function' || jQuery.fn.jquery.replace(/\./g, '') < 171) {
		alert('jQuery >=1.7.1 is required for jTour!');
		return false;
	}
	if (!$.isArray(tourdata)) $.error('tourdata must be a valid array');

	//some variables we need
	var version = '1.2.1',
		box, content, progress, arrow, navigation, overlay, prefix = 'jTour_',
		//chrome and safari are different
		animateDOM = $.browser.webkit ? $('body') : $('html'),
		current = 0,
		last, total = tourdata.length,
		timeout, steps, stepfunction, isPaused = manualskip = busy = false,
		scrollTop, scrollLeft, offsetX, offsetY, overlayZ = 20000,
		offsetFactor = 2.5,
		classStr, cssNames = {
			x: "scrollLeft",
			y: "scrollTop"
		},

		//the defaults which get overwritten with the options
		defaults = {
			speed: 1,
			axis: 'xy',
			autostart: false,
			autoplay: true,
			pauseOnHover: true,
			keyboardNav: true,
			showProgress: true,
			showControls: true,
			scrollBack: false,
			scrollDuration: 300,
			easing: 'swing',
			onStart: function () {},
			onStop: function () {},
			onPause: function () {},
			onPlay: function () {},
			onChange: function () {},
			onFinish: function () {},

			//these are the defaults for each step which can get overwritten in each step
			position: 'c',
			live: 'auto',
			offset: 0,
			wait: 0,
			expose: false,
			overlayOpacity: 0.2,
			delayIn: 200,
			delayOut: 100,
			animationIn: 'fadeIn',
			animationOut: 'fadeOut',
			onBeforeShow: function () {},
			onShow: function () {},
			onBeforeHide: function () {},
			onHide: function () {},
			onStep: function () {}
		};

	var settings = $.extend({}, defaults, options),

		//the defaults for each step
		stepdefaults = {
			position: settings.position,
			live: settings.live,
			offset: settings.offset,
			wait: settings.wait,
			expose: settings.expose,
			overlayOpacity: settings.overlayOpacity,
			delayIn: settings.delayIn,
			delayOut: settings.delayOut,
			animationIn: settings.animationIn,
			animationOut: settings.animationOut,
			onBeforeShow: settings.onBeforeShow,
			onShow: settings.onShow,
			onBeforeHide: settings.onBeforeHide,
			onHide: settings.onHide,
			onStep: settings.onStep,
			element: animateDOM,
			goTo: null //required for multipage tours
		};

	function init() {

		//Create new container and append it to the body
		box = $('<div/>', {
			'class': prefix + 'box'
		}).hide().appendTo('body');

		//the arrow wrapper
		arrow = $('<div/>', {
			'class': prefix + 'arrow'
		}).appendTo(box);

		//the content
		content = $('<div/>', {
			'class': prefix + 'content'
		}).appendTo(box);

		//the progressbar wrapper
		$('<div/>', {
			'class': prefix + 'progress'
		}).html('<div class="' + prefix + 'progress_bar"></div>').appendTo(box);

		//save the progressbar for later
		progress = box.find('.' + prefix + 'progress_bar');

		//we need control
		if (settings.showControls) {

			//the DOM
			navigation = $('<ul/>', {
				'class': prefix + 'nav'
			}).html('<li><a class="' + prefix + 'nav_btn prev" title="previous" data-role="prev">&nbsp;</a></li><li><a class="' + prefix + 'nav_btn play" title="play" data-role="play">&nbsp;</a></li><li><a class="' + prefix + 'nav_btn pause" title="pause" data-role="pause">&nbsp;</a></li><li><a class="' + prefix + 'nav_btn stop" title="stop" data-role="stop">&nbsp;</a></li><li><a class="' + prefix + 'nav_btn next" title="next" data-role="next">&nbsp;</a></li><li><a class="' + prefix + 'nav_btn slower" title="slower" data-role="slower">&nbsp;</a></li><li><a class="' + prefix + 'nav_btn faster" title="faster" data-role="faster">&nbsp;</a></li>').appendTo(box)
			//with some event delegation
			.delegate('a', 'click.jTour', function () {

				manualskip = true;
				//do stuff depending on which button was clicked
				switch ($(this).data('role')) {
				case 'next':
					next();
					break;
				case 'prev':
					prev();
					break;
				case 'slower':
					manualskip = false;
					changeSpeed(-0.25);
					break;
				case 'faster':
					manualskip = false;
					changeSpeed(0.25);
					break;
				case 'pause':
					pauseTour();
					break;
				case 'play':
					manualskip = false;
					continueTour();
					box.trigger('mouseleave');
					break;
				case 'stop':
					stop();
					break;
				}
			});

			//for styling we add a class to the box
			box.addClass('has-controls');

		}

		//the DOM for the overlay
		overlay = $('<div/>', {
			'class': prefix + 'overlay'
		}).css('opacity', settings.overlayOpacity).hide();

		if (!settings.showProgress) box.find('.' + prefix + 'progress').hide();

		//append the overlay to the body and set its height to the document height
		if (settings.overlayOpacity !== false) {
			overlay.appendTo('body').css('height', $(document).height());
		} else {
			overlay.remove();
		}

		//save the classes for later
		classStr = box.attr('class');

		//set the browser dimesions on resize
		$(window).unbind('resize.jTour').bind('resize.jTour', setClientDimesions).resize();

		//to access with the api we save it
		api.box = box;
		api.content = content;
		api.overlay = overlay;

		//set the axis as array
		settings.axis = settings.axis.split('');

		//check the has for jTour (multipages)
		if (location.hash) {
			var h = location.hash.split('=');

			//find a jTour string
			if (h[0].match(/jTour/)) {

				//remove the hash
				location.hash = '';
				//start with a different step
				start(parseInt(h[1], 10));
				return false;
			}
		}

		//start immediately if required
		if (settings.autostart) start();

	}

	function setClientDimesions() {
		offsetX = (window.innerWidth || document.documentElement.clientWidth) / offsetFactor;
		offsetY = (window.innerHeight || document.documentElement.clientHeight) / offsetFactor;
	}

	function bindEvents() {

		//pause on mouseover
		if (settings.pauseOnHover) box.bind({
			'mouseenter.jTour': pauseTour,
			'mouseleave.jTour': continueTour
		});

		//bind keyevents to the document
		if (settings.keyboardNav) $(document).bind({
			'keyup.jTour': keyEvent,
			'keydown.jTour': keyEvent
		});

	}

	function unbindEvents() {
		//unbind all events
		if (settings.pauseOnHover) box.unbind('.jTour');
		if (settings.keyboardNav) $(document).unbind('.jTour');
	}

	function keyEvent(event) {
		//do some stuff when keys are pressed
		switch (event.keyCode) {
		case 37:
			//left arrow => previous step
			(event.type == "keyup" && current > 0) ? prev() : event.preventDefault();
			break;
		case 39:
			//right arrow => next step
			(event.type == "keyup") ? next() : event.preventDefault();
			break;
		case 38:
			//up arrow => faster
			(event.type == "keyup") ? changeSpeed(0.25) : event.preventDefault();
			break;
		case 40:
			//down arrow => slower
			(event.type == "keyup") ? changeSpeed(-0.25) : event.preventDefault();
			break;
		case 32:
			//space => play/pause tour
			manualskip = true;
			(event.type == "keyup") ? pauseTour(true) : event.preventDefault();
			break;
		case 27:
			//ESC => stop tour
			(event.type == "keyup") ? stop() : event.preventDefault();
			break;
		}

	}

	function start(step) {


		//if no step is set use the current
		if (!step) step = current;

		//save starting position for later
		scrollTop = scrollTop || $(window).scrollTop();
		scrollLeft = scrollLeft || $(window).scrollLeft();

		//show the overlay and start the tour
		overlay.show().fadeIn(function () {
			bindEvents();
			isPaused = false;
			current = step;
			settings.onStart.call(api, current);
			show(step);
		});

		//toggle play/pause button
		if (settings.showControls) {
			navigation.find('.play').hide();
			navigation.find('.pause').show();
		}
	}

	function stop() {

		//prevent if tour is busy
		if (busy) return;

		//clear the timout to prevent any further action
		clearTimeout(timeout);
		//stop the progress
		progress.clearQueue().stop();
		//hide the overlay
		overlay.hide();

		unbindEvents();

		//scroll back to the starting position
		if (settings.scrollBack) {
			scroll(scrollLeft, scrollTop, settings.scrollDuration, function () {
				settings.onStop.call(api, current);
			});
		} else {
			settings.onStop.call(api, current);
		}

		//reset the CSS from the last element if it was exposed
		if (last && last.exposeElement) last.exposeElement.css(last.exposeElement.data('jTour')).removeData('jTour').removeClass(prefix + 'exposed');

		//hide box and set current to 0
		hide();
		current = 0;

		//toggle play/pause button
		if (settings.showControls) {
			navigation.find('.play').show();
			navigation.find('.pause').hide();
		}
	}

	function pauseTour(toggle, firecb) {

		//if toggle is true use this as play or pause function
		if (isPaused) {
			if (toggle === true) {
				manualskip = !manualskip;
				continueTour();
				return;
			}
			if (!manualskip) return;
		}

		//callback
		if (firecb !== false) settings.onPause.call(api, current);

		//clear the timout to prevent any further action
		clearTimeout(timeout);
		//stop the progress
		progress.clearQueue().stop();

		//toggle play/pause button
		if (settings.showControls && manualskip) {
			navigation.find('.play').show();
			navigation.find('.pause').hide();
		}

		isPaused = true;
	}

	function continueTour(firecb) {

		//only continue if no manual pause action was called
		if (isPaused && !manualskip) {

			//callback
			if (firecb !== false) settings.onPlay.call(api, current);

			//clear the timout to prevent any further action
			clearTimeout(timeout);

			//reset the progress from it's paused position
			var percentage = progress.width() / (content.width() / 100) / 100;
			var time = (tourdata[current].live || stepdefaults.live);

			//get the current time of the step
			time -= time * percentage;
			//stop the progress
			progress.clearQueue().stop().animate({
				width: '100%'
			}, {
				duration: time * (1 / settings.speed),
				easing: 'linear',
				step: stepfunction,
				complete: next
			});

			if (settings.showControls) {
				navigation.find('.play').hide();
				navigation.find('.pause').show();
			}

			isPaused = false;
		}
	}

	function restart(step) {

		//hide the box
		hide();
		//set current step to step or to zero if not set
		current = step || 0;
		//start again
		start(step);
	}

	function next() {

		//prevent if tour is busy
		if (busy) return;

		//some steps havent been executed
		if (steps && tourdata[current].steps) {
			if (tourdata[current].onStep) tourdata[current].onStep.call(api, last, 100);
			$.each(steps, function (i, e) {
				tourdata[current].steps[steps[i]].call(api, last, e);
			});
			steps = null;
		}

		//check for multipage feature
		if (tourdata[current].goTo) {
			//goto location and ad the hashtag
			window.location = tourdata[current].goTo + '#jTour=' + (current + 1);
			//reload if its the same page
			setTimeout(function () {
				location.reload();
			}, 1000);
			//stop here
			return false;
		}


		//if it's not the last step
		if (current + 1 < total) {
			//clear the timout to prevent any further action
			clearTimeout(timeout);
			progress.clearQueue().stop();
			//show next step
			show(++current);

			//we have the last step (no step left)
		} else {
			//and stop the tour
			stop();
			//call the callback
			settings.onFinish.call(api, current);
		}
	}

	function prev() {

		//prevent if tour is busy
		if (busy) return;

		//if it's not the first step
		if (current > 0) {
			//clear the timout to prevent any further action
			clearTimeout(timeout);
			progress.clearQueue().stop();
			//show previous step
			show(--current);
		}
	}

	function show(step) {

		//get options for this step
		var options = $.extend({}, stepdefaults, tourdata[step]),
			//get the jQuery DOM element
			$element = options.element = (options.element) ? ((typeof options.element == 'string') ? $(options.element) : options.element) : 0;

		//the jQuery DOM element doesn't exist
		if (!$element.length) {
			//throw an info in the console
			if (console && $element) console.log('Element $("' + $element.selector + '") doesn\'t exist!');
			//reduce total with one
			total--;
			//open next step
			next();
			return;
		}

		//live time must be calculated
		if (options.live === 'auto') {

			//need temp DOM object to calculate length without any HTML tags
			var temp = $('<div>').html(options.html),
				length = temp.text().length;

			//calculate live time depending on content length, but at least 2500 ms
			options.live = tourdata[step].live = Math.max(2500, Math.log(length / 10) * 2500 + 1000);
		}

		//make sure it's always positive;
		options.live = Math.abs(options.live);
		//this is a imagemap
		options.isArea = options.element[0].nodeName.toLowerCase() == 'area';

		//we have no last step (it's the first one)
		if (!last) {
			//we don't need a duration for the fadeOut
			options.delayOut = 0;
			options.animationOut = 'hide';
		} else {
			//callback for the last step
			last.onBeforeHide.call(api, last.element);
		}

		busy = true;

		//hide the last step with special function
		box[options.animationOut](options.delayOut, function () {

			//temporary position the invisible box for calculation
			box.css({
				left: 0,
				top: 0,
				"min-width": 0
			});
			//callback if we have a previous step
			if (last) last.onHide.call(api, last.element);

			//save timeout so we can clear it
			timeout = setTimeout(function () {

				var dimensions, position;

				//set the content of the step
				content.html(options.html);

				//callback with current step id
				settings.onChange.call(api, step);

				//our target is the body (or html)
				if ($element[0] === animateDOM[0]) {
					//save the dimensions of the target element
					dimensions = {
						width: offsetX * offsetFactor,
						height: (offsetY * offsetFactor / 2) - box.outerHeight() / 2,
						x: 0,
						y: 0
					};

					//target is an area
				} else if (options.isArea) {

					//get the coordinates
					var coords = $element[0].coords.split(',');

					//get postion of image including padding and border width
					var img = options.exposeElement = $('img[usemap=#' + $element.parent().attr('name') + ']'),
						imgoffset = img.offset(),
						imgpadding = {
							top: parseInt(img.css('paddingTop'), 10),
							left: parseInt(img.css('paddingLeft'), 10)
						},
						imgborder = {
							top: parseInt(img.css('borderTopWidth'), 10),
							left: parseInt(img.css('borderLeftWidth'), 10)
						};

					//save the dimensions of the target element
					dimensions = {
						width: coords[2] - coords[0],
						height: coords[3] - coords[1],
						x: parseInt(coords[0], 10) + imgoffset.left + imgpadding.left + imgborder.left,
						y: parseInt(coords[1], 10) + imgoffset.top + imgpadding.top + imgborder.top
					};

					//target is an another DOM element
				} else {
					//save the dimensions of the target element
					dimensions = {
						width: $element.outerWidth(),
						height: $element.outerHeight(),
						x: $element.offset().left,
						y: $element.offset().top
					};
				}


				//raw postion of the box element
				var position = {
					left: dimensions.x,
					top: dimensions.y
				};

				//correction is required for large elements
				var scrollcorrection = {
					x: 0,
					y: 0
				};

				//modify postion depending on the box position and add the offset to the element
				switch (options.position) {

				case 'ne':
					if (!isNaN(options.offset)) options.offset = {
						x: 0,
						y: options.offset
					};
					position.top -= box.outerHeight() + options.offset.y;
					position.left = dimensions.x + dimensions.width - box.outerWidth() + options.offset.x;
					scrollcorrection['x'] = dimensions.width / 2 - +box.outerWidth() / 2 + options.offset.x;
					scrollcorrection['y'] = -dimensions.height / 2 - box.outerHeight() / 2 - options.offset.y;
					break;

				case 'nw':
					if (!isNaN(options.offset)) options.offset = {
						x: 0,
						y: options.offset
					};
					position.top -= box.outerHeight() + options.offset.y;
					position.left = dimensions.x - options.offset.x;
					scrollcorrection['x'] = -dimensions.width / 2 + box.outerWidth() / 2 - options.offset.x;
					scrollcorrection['y'] = -dimensions.height / 2 - box.outerHeight() / 2 - options.offset.y;
					break;

				case 'n':
					if (!isNaN(options.offset)) options.offset = {
						x: 0,
						y: options.offset
					};
					position.top -= box.outerHeight() + options.offset.y;
					position.left += (dimensions.width - box.outerWidth()) / 2 + options.offset.x;
					scrollcorrection['x'] = options.offset.x;
					scrollcorrection['y'] = -dimensions.height / 2 - box.outerHeight() / 2 - options.offset.y;
					break;

				case 'se':
					if (!isNaN(options.offset)) options.offset = {
						x: 0,
						y: options.offset
					};
					position.top += dimensions.height + options.offset.y;
					position.left = dimensions.x + dimensions.width - box.outerWidth() + options.offset.x;
					scrollcorrection['x'] = dimensions.width / 2 - box.outerWidth() / 2 + options.offset.x;
					scrollcorrection['y'] = dimensions.height / 2 + box.outerHeight() / 2 + options.offset.y;
					break;

				case 'sw':
					if (!isNaN(options.offset)) options.offset = {
						x: 0,
						y: options.offset
					};
					position.top += dimensions.height + options.offset.y;
					position.left = dimensions.x - options.offset.x;
					scrollcorrection['x'] = -dimensions.width / 2 + box.outerWidth() / 2 - options.offset.x;
					scrollcorrection['y'] = dimensions.height / 2 + box.outerHeight() / 2 + options.offset.y;
					break;

				case 's':
					if (!isNaN(options.offset)) options.offset = {
						x: 0,
						y: options.offset
					};
					position.top += dimensions.height + options.offset.y;
					position.left += (dimensions.width - box.outerWidth()) / 2 + options.offset.x;
					scrollcorrection['x'] = options.offset.x;
					scrollcorrection['y'] = dimensions.height / 2 + box.outerHeight() / 2 + options.offset.y;
					break;

				case 'w':
					if (!isNaN(options.offset)) options.offset = {
						x: options.offset,
						y: 0
					};
					position.top -= box.outerHeight() / 2 - dimensions.height / 2 - options.offset.y;
					position.left -= box.outerWidth() + options.offset.x;
					scrollcorrection['x'] = -dimensions.width / 2 + box.outerWidth() / 2 - options.offset.x;
					scrollcorrection['y'] = -options.offset.y;
					break;

				case 'e':
					if (!isNaN(options.offset)) options.offset = {
						x: options.offset,
						y: 0
					};
					position.top -= box.outerHeight() / 2 - dimensions.height / 2 - options.offset.y;
					position.left += dimensions.width + options.offset.x;
					scrollcorrection['x'] = dimensions.width / 2 - box.outerWidth() / 2 + options.offset.x;
					scrollcorrection['y'] = -options.offset.y;
					break;

				case 'c':
					if (!isNaN(options.offset)) options.offset = {
						x: 0,
						y: options.offset
					};
					position.top -= box.outerHeight() / 2 - dimensions.height / 2 - options.offset.y;
					position.left += (dimensions.width - box.outerWidth()) / 2 + options.offset.x;
					scrollcorrection['x'] = options.offset.x;
					scrollcorrection['y'] = options.offset.y;
					break;

				}

				//we need the position of our element
				scrolltopos = {
					x: Math.max(0, dimensions.x - (offsetX * offsetFactor / 2 - dimensions.width / 2) + scrollcorrection['x']),
					y: Math.max(0, dimensions.y - (offsetY * offsetFactor / 2 - dimensions.height / 2) + scrollcorrection['y'])
				};

				//reset the style for the last element
				if (last && last.exposeElement && !options.isArea) last.exposeElement.css(last.exposeElement.data('jTour')).removeData('jTour').removeClass(prefix + 'exposed');

				//scroll to the position
				scroll(scrolltopos.x, scrolltopos.y, settings.scrollDuration, function () {
					//add a the postion as class to the arrow
					arrow.removeAttr('class').addClass(prefix + 'arrow ' + options.position);


					//if steps where defined
					if (options.steps) {
						//get all steps as array
						steps = [];
						$.each(options.steps, function (k) {
							steps.push(k);
						});

						//execute all steps that are lower or equal percentage (percentage = 0 - 100)
						stepfunction = function (percentage) {
							options.onStep.call(api, $element, percentage);
							var steplength = steps.length;
							if (!steplength) return;
							for (var i = 0; i < steplength; i++) {
								if (percentage >= steps[i]) {
									options.steps[steps[i]].call(api, $element);
									steps.shift();
								}
							}
						}
					} else {
						//no function required
						stepfunction = function (percentage) {
							options.onStep.call(api, $element, percentage)
						};
					}

					//we have controls
					if (settings.showControls) {

						//hide previous or next if it is the first or last step
						if (step == 0) {
							navigation.find('a.prev').hide();
						} else if (step == total - 1) {
							navigation.find('a.next').hide();
						} else {
							navigation.find('a.next, a.prev').show();
						}
					}

					//callback
					options.onBeforeShow.call(api, $element);

					//reset the progressbar
					progress.clearQueue().stop().css({

						//opera has a bug (http://bugs.jquery.com/ticket/7608) with width 0%
						width: ($.browser.opera) ? '1%' : '0%'
					});

					//add a minwidth to prevent smaller box outside of the viewport
					position['min-width'] = box.width();

					//set the element realtive and a zindex higher than the overlay
					if (options.expose && $element != animateDOM) {
						var oldcss = {
							'position': $element.css('position'),
							'zIndex': $element.css('zIndex')
						};
						var newcss = {
							'position': 'relative',
							'zIndex': overlayZ + 1
						};

						//area map has a different exposeElement (img - defined above)
						options.exposeElement = options.exposeElement || $element;
						//if css properties should get applied store the old ones
						if (typeof options.expose === 'object') {
							$.each(options.expose, function (prop, value) {
								oldcss[prop] = $element.css(prop);
								newcss[prop] = value;
							});
						};
						options.exposeElement.data('jTour', oldcss).css(newcss).addClass(prefix + 'exposed');
					}

					if (last) {
						//change overlay opacity if required
						if (last.overlayOpacity != options.overlayOpacity) overlay.fadeTo(options.delayIn * 2, options.overlayOpacity);

						//and set it explicitly on the first step
					} else {
						overlay.css({
							'opacity': options.overlayOpacity
						});
					}
					//apply the postion and the class, show the box
					box.css(position).attr('class', classStr + ' step-' + step)[options.animationIn](options.delayIn, function () {

						busy = false;
						//callback
						options.onShow.call(api, $element);
						//the current step is our next last one
						last = options;


						//if autoplay is active and the tour isn't paused
						if (settings.autoplay && !isPaused) {
							manualskip = false;

							//animate the progress bar and goto the next step on finish
							progress.stop().animate({
								width: '100%'
							}, {
								duration: options.live * (1 / settings.speed),
								easing: 'linear',
								step: stepfunction,
								complete: next
							});
						}
					});
				});

			}, options.wait);
		});

	}

	function hide() {

		//if no last is set we have nothing to hide
		if (!last) return;

		//callback
		last.onBeforeHide.call(api, last.element);

		//stop every animation
		progress.clearQueue().stop();
		box.stop();

		//and hide the box
		box[last.animationOut](last.delayOut, function () {
			//remove content
			content.empty();
			//callback
			last.onHide.call(api, last.element);
			last = null;

		});
	}

	function changeSpeed(offset) {
		//change the general speed of steps
		settings.speed = Math.max(0.1, settings.speed + offset);

		//prevent if tour is busy
		if (busy) return;

		pauseTour(null, false);
		continueTour(false);
	}

	function moveTo(x, y, duration, callback) {
		if (typeof x == 'object') {
			callback = ($.isFunction(y)) ? y : ($.isFunction(duration)) ? duration : false;
			duration = (!isNaN(y)) ? y : 0;
			y = x.offset().top;
			x = x.offset().left;
		}
		if ($.isFunction(duration)) {
			callback = duration;
			duration = false;
		}
		var to = {};
		if (x != null) to['left'] = x;
		if (y != null) to['top'] = y;

		box.animate(to, {
			duration: (duration === false) ? 0 : duration,
			complete: callback &&
			function () {
				callback.call(api);
			}
		});
	}

	function offset(x, y, duration, callback) {
		moveTo('+=' + x, '+=' + y, duration, callback);
	}

	function scroll(x, y, duration, callback) {

		//no need to scroll
		if (animateDOM.scrollTop() == y && animateDOM.scrollLeft() == x) duration = 1;

		var scrollto = {};

		$.each(settings.axis, function (i, ax) {
			scrollto[cssNames[ax]] = (ax == 'x') ? x : y;
		});

		//animate the html or body
		animateDOM.animate(scrollto, {
			duration: duration || settings.scrollDuration,
			complete: callback &&
			function () {
				callback.call(api);
			},
			queue: true,
			easing: settings.easing
		});
	}


	//our API with public methods
	var api = {
		start: function (step) {
			start(step);
		},
		restart: function (step) {
			restart(step);
		},
		pause: function (toggle) {
			manualskip = true;
			pauseTour(toggle);
		},
		play: function () {
			manualskip = false;
			continueTour();
		},
		stop: function () {
			stop();
		},
		next: function () {
			next();
		},
		prev: function () {
			prev();
		},
		faster: function (value) {
			changeSpeed(value || 0.25);
		},
		slower: function (value) {
			changeSpeed(value || -0.25);
		},
		moveTo: function (x, y, duration, callback) {
			moveTo(x, y, duration, callback);
		},
		offset: function (x, y, duration, callback) {
			offset(x, y, duration, callback);
		},
		scroll: function (x, y, duration, callback) {
			scroll(x, y, duration, callback);
		}
	};

	api.box = api.content = api.overlay = null;
	api.tourdata = tourdata;

	//init jTour
	init();

	//return the api for access
	return api;
};