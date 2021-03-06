function startGlassesDemo() {
	var smoother = new Smoother([0.9999999, 0.9999999, 0.999, 0.999], [0, 0, 0, 0]),
		video = $('video')[0],
		glasses = $('img.glasses'),
		detector;

	requestAnimationFrame(play);

	function play() {
		if (mode !== 'glasses') {
			glasses.css('opacity', 0)
			return;
		}
		requestAnimationFrame(play);
		if (video.readyState === video.HAVE_ENOUGH_DATA && video.videoWidth > 0) {

          	// Prepare the detector once the video dimensions are known:
          	if (!detector) {
	      		var width = ~~(60 * video.videoWidth / video.videoHeight);
				var height = 60;
	      		detector = new objectdetect.detector(width, height, 1.1, objectdetect.frontalface_alt);
	      	}

      		// Perform the actual detection:
			var coords = detector.detect(video, 1);
			if (coords[0]) {
				var coord = coords[0];
				coord = smoother.smooth(coord);

				// Rescale coordinates from detector to video coordinate space:
				coord[0] *= video.videoWidth / detector.canvas.width;
				coord[1] *= video.videoHeight / detector.canvas.height;
				coord[2] *= video.videoWidth / detector.canvas.width;
				coord[3] *= video.videoHeight / detector.canvas.height;

				// Display glasses overlay:
				glasses.css('left', ~~(coord[0] + coord[2] * 1.0/8 + video.offsetLeft) + 'px');
				glasses.css('top', ~~(coord[1] + coord[3] * 0.8/8 + video.offsetTop) + 'px');
				glasses.css('width', ~~(coord[2] * 6/8) + 'px');
				glasses.css('height', ~~(coord[3] * 6/8) + 'px');
				glasses.css('opacity', 1);

			} else {
				var opacity = glasses.css('opacity') - 0.2;
				glasses.css('opacity', opacity > 0 ? opacity : 0);
			}
		}
	}
};