$(function() {
  var video = $('video')[0];
  var canvas = $('canvas')[0];
  var streaming = false;
  var width = 0;
  var height = 0;
  
  navigator.getMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);
  
  navigator.getMedia({ video: true, audio: false }, function(stream) {
    if(navigator.mozGetUserMedia)
      video.mozSrcObject = stream;
    else {
      var vu = window.URL || window.webkitURL;
      video.src = vu.createObjectURL(stream);
    }
    video.play();
  }, function(error) {
    if(window.console)
      console.error(error);
  });

  video.addEventListener('canplay', function(ev){
    if (!streaming) {
      width = $('video').width();
      height = $('video').height();
    
      video.setAttribute('width', width);
      video.setAttribute('height', height);
      canvas.setAttribute('width', width);
      canvas.setAttribute('height', height);
      streaming = true;
    }
  }, false);

  var status = 'live';
  $('#action-button').click(function(e) {
    if (status == 'live') {
      $('.overlay').css('display', 'block');

      /* TODO: Make HTTP request */

      // Simluate HTTP request to Lambda
      setTimeout(function() {
        status = 'result';
        
        // Display overlay
        $('.overlay').css('display', 'none');

        // Change action button text
        $('#action-button').text('Reset');

        // Hide video
        $('video').css('display', 'none');

        // Draw image on canvas
        var context = canvas.getContext('2d');
        if (width && height) {
          console.log('Capture image!');
          canvas.width = width;
          canvas.height = height;
          context.drawImage(video, 0, 0, width, height);
        }

        // Show canvas
        $('canvas').css('display', 'block');
      }, 2000);
    } else if (status == 'result') {
      status = 'live';

      // Change action button text
      $('#action-button').text('Snap!');

      // Show video
      $('video').css('display', 'block');

      // Hide canvas
      $('canvas').css('display', 'none');
    }
  });
});
