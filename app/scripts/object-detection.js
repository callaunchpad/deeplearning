$(function() {
	Webcam.set({
		width: 320,
		height: 240,
		image_format: 'png'
	});
  Webcam.attach('#object-detection-input');
  var frame_rate = 1000;
  
  function take_picture() {
    Webcam.snap(function(data_uri) {
    	var img = new Image();
    	img.src = data_uri;
      $('#object-detection-output').empty().append(img);
    });
  };

  Webcam.on('live', function() {
  	setInterval(take_picture, frame_rate);
  });
});
