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

      // Face Recognition
      if (mode == 'face') {
        var image_data = String(img);
        
        // Dealing with Javascript Format of Image Strings
        image_data = image_data.replace('data:image/jpeg;base64,', '');
        image_data = image_data.replace('data:image/jpg;base64,', '');
        image_data = image_data.replace('data:image/png;base64,', '');
        image_data = image_data.replace('data:image/gif;base64,', '');
        image_data = image_data.replace('data:image/bmp;base64,', '');
        
        // Change action button text
        $('#action-button').text('Reset');

        var options = {'selector': 'FULL'};

        function kairosCallback(res) {
          var jsonResponse = JSON.parse(res.responseText);

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

            var raceProbs = {
              'asian': faces[0]['attributes']['asian'],
              'black': faces[0]['attributes']['black'],
              'hispanic': faces[0]['attributes']['hispanic'],
              'other': faces[0]['attributes']['other'],
              'white': faces[0]['attributes']['white']
            }
            var bestRaceProb = 0.0;
            var bestRace = 'asian';
            for(var race in raceProbs) {
              if(raceProbs.hasOwnProperty(race) && raceProbs[race] >= bestRaceProb) {
                bestRaceProb = raceProbs[race];
                bestRace = race;
              }
            }
            bestRaceProb = bestRaceProb.toFixed(3);

            var gender = 'girl';
            if (faces[0]['attributes']['gender']['type'] == 'M') {
              gender = 'guy';
            }

            $('#speech').text('You look ' + (bestRaceProb * 100) + '% like a ' + faces[0]['attributes']['age'] + '-year-old ' + bestRace + ' ' + gender +'.');
          } else {
            $('#speech').text('Sorry, I can\'t see where your face is.');
          }

          status = 'result';

          // Hide overlay
          $('.overlay').css('display', 'none');
        }

        kairos.detect(image_data, kairosCallback, options);
      } 

      // Product Hunter
      else if (mode == 'product') {
        // Change action button text
        $('#action-button').text('Reset');

        var header_settings = {
          'Content-type'     : 'application/json',
          'Authorization'    : 'CloudSight BLIk1IjVLNIVSr7bIAUxOw'
        };
        var data = { 
          'remote_image_url'  : 'https://images-na.ssl-images-amazon.com/images/I/61xMPiowKhL._SY355_.jpg',
          'locale' : 'en-US'
        };

        // TODO: Why is it going to error when it's succeeding?
        // TODO: Poll every 1 second after successful response from POST request.
        // TOOD: Update dialog when product name has been discovered.
        jQuery.ajax('http://api.cloudsight.ai/image_requests', {
          headers  : header_settings,
          type     : 'POST',
          dataType : 'raw',
          data     : JSON.stringify(data),
          success  : function(res) {
            var jsonResponse = JSON.parse(res.responseText);
            console.log(jsonResponse);

            setTimeout(function() {
              var header_settings = {
                'token': jsonResponse.token,
                'Authorization': 'CloudSight BLIk1IjVLNIVSr7bIAUxOw'
              };

              jQuery.ajax('http://api.cloudsight.ai/image_responses/' + jsonResponse.token, {
                headers : header_settings,
                type: 'GET',
                data: {},
                success: function(res) {
                  console.log(res);

                  // Hide overlay
                  $('.overlay').css('display', 'none');
                },
                error: function(res) {
                  console.log(res);

                  // Hide overlay
                  $('.overlay').css('display', 'none');
                }
              });
            }, 6000);
          },
          error    : function(res) {
            $('#speech').text('Internal server error.');

            var jsonResponse = JSON.parse(res.responseText);
            console.log(jsonResponse);

            setTimeout(function() {
              var header_settings = {
                'token': jsonResponse.token,
                'Authorization': 'CloudSight BLIk1IjVLNIVSr7bIAUxOw'
              };

              jQuery.ajax('http://api.cloudsight.ai/image_responses/' + jsonResponse.token, {
                headers : header_settings,
                type: 'GET',
                data: {},
                success: function(res) {
                  console.log(res);

                  // Hide overlay
                  $('.overlay').css('display', 'none');
                },
                error: function(res) {
                  console.log(res);

                  // Hide overlay
                  $('.overlay').css('display', 'none');
                }
              });
            }, 6000);
          }
        });

        status = 'result';
      }



    /*** ON LIVE, GET IMG ***/
    } else if (status == 'result') {
      status = 'live';

      // Change action button text
      $('#action-button').text('Snap');

      // Show video
      $('video').css('display', 'block');

      // Hide canvas
      $('canvas').css('display', 'none');

      $('#speech').text('Send me a snap!');
    }
  });
});


/*** HANDLE SWITCHING BETWEEN MODES ***/
var mode = 'face';
var changeMode = function(nextMode) {
  $('#action-button').text('Snap');
  $('video').css('display', 'block');
  $('canvas').css('display', 'none');

  // Close glasses feature
  if (mode == 'glasses' && nextMode !== 'glasses') {
    $('#action-button').css('opacity', 1);
    $('#speech').text('Send me a snap!');
  }

  // Open glasses feature
  if (mode !== 'glasses' && nextMode == 'glasses') {
    $('#action-button').css('opacity', 0);
    startGlassesDemo();
    $('#speech').text('Let\'s see how you look in glasses.');
  }

  mode = nextMode;
}
