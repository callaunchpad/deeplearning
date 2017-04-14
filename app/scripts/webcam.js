$(function() {
  var video = $('video')[0];
  var canvas = $('canvas')[0];
  var streaming = false;
  var width = 0;
  var height = 0;

  var kairos = new Kairos('f51c3249', 'd6814b899b064fb58df942943afa3cb2');

  /*** BEGIN WEBCAM ***/
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

  /*** GET WIDTH AND HEIGHT ***/
  video.addEventListener('canplay', function(ev) {
    if (!streaming) {
      width = video.videoWidth;
      height = video.videoHeight;

      video.setAttribute('width', width);
      video.setAttribute('height', height);
      canvas.setAttribute('width', width);
      canvas.setAttribute('height', height);
      streaming = true;
    }
  }, false);

  /*** ADD EVENT LISTENER TO BUTTON ***/
  var status = 'live';
  var img = false;
  $('#action-button').click(function(e) {
    /*** ON LIVE, GET IMG, PROCESS IMG, RENDER RESULTS ***/
    if (status == 'live') {
      $('.overlay').css('display', 'block');

      // Draw image on canvas
      var context = canvas.getContext('2d');
      if (width && height) {
        canvas.width = width;
        canvas.height = height;
        context.drawImage(video, 0, 0, width, height);
      }

      // Format image
      img = canvas.toDataURL('image/png');

      // Hide video
      $('video').css('display', 'none');
      $('canvas').css('display', 'block');



      // Object Detection (Single)
      if (mode == 'f1') {

      }

      // Face Recognition
      else if (mode == 'f2') {
        // Change action button text
        $('#action-button').text('Reset');

        var image_data = String(img);
        // Dealing with Javascript Format of Image Strings
        image_data = image_data.replace('data:image/jpeg;base64,', '');
        image_data = image_data.replace('data:image/jpg;base64,', '');
        image_data = image_data.replace('data:image/png;base64,', '');
        image_data = image_data.replace('data:image/gif;base64,', '');
        image_data = image_data.replace('data:image/bmp;base64,', '');
        var options = {'selector': 'FULL'};

        function kairosCallback(res) {
          var jsonResponse = JSON.parse(res.responseText);

          console.log(jsonResponse);
          if (!!jsonResponse.images) {
            var faces = jsonResponse.images[0].faces;
            var face;

            for (var i = 0; i < faces.length; i++) {
              context.lineWidth = '6';
              context.strokeStyle = 'red';
              face = faces[i];
              context.rect(face.topLeftX, face.topLeftY, face.width, face.height);
              context.stroke();
            }
          }

          status = 'result';

          // Hide overlay
          $('.overlay').css('display', 'none');
        }

        kairos.detect(image_data, kairosCallback, options);
      }



    /*** ON LIVE, GET IMG ***/
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


/*** HANDLE SWITCHING BETWEEN MODES ***/
var mode = 'f1';
var changeMode = function(nextMode) {
  mode = nextMode;
}
