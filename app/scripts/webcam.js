$(function() {
  var video = $('video')[0];
  var canvas = $('canvas')[0];
  var streaming = false;
  var width = 0;
  var height = 0;

  var kairos = new Kairos('f51c3249', 'd6814b899b064fb58df942943afa3cb2');

  /*** BEGIN WEBCAM ***/
  navigator.getMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);

  navigator.getMedia({
    video: true,
    audio: false
  }, function(stream) {
    if (navigator.mozGetUserMedia)
      video.mozSrcObject = stream;
    else {
      var vu = window.URL || window.webkitURL;
      video.src = vu.createObjectURL(stream);
    }
    video.play();
  }, function(error) {
    if (window.console)
      console.error(error);
  });

  function dataURItoBlob(dataURI) {
    // convert base64/URLEncoded data component to raw binary data held in a string
    var byteString;
    if (dataURI.split(',')[0].indexOf('base64') >= 0)
      byteString = atob(dataURI.split(',')[1]);
    else
      byteString = unescape(dataURI.split(',')[1]);

    // separate out the mime component
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

    // write the bytes of the string to a typed array
    var ia = new Uint8Array(byteString.length);
    for (var i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }

    return new Blob([ia], {
      type: mimeString
    });
  }

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

      // Face Recognition or Food Recommender
      if (mode == 'face' || mode == 'food') {
        // Change action button text
        $('#action-button').text('Reset');

        var image_data = String(img);
        // Dealing with Javascript Format of Image Strings
        image_data = image_data.replace('data:image/jpeg;base64,', '');
        image_data = image_data.replace('data:image/jpg;base64,', '');
        image_data = image_data.replace('data:image/png;base64,', '');
        image_data = image_data.replace('data:image/gif;base64,', '');
        image_data = image_data.replace('data:image/bmp;base64,', '');
        var options = {
          'selector': 'FULL'
        };

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

            var raceProbs = {
              'asian': faces[0]['attributes']['asian'],
              'black': faces[0]['attributes']['black'],
              'hispanic': faces[0]['attributes']['hispanic'],
              'other': faces[0]['attributes']['other'],
              'white': faces[0]['attributes']['white']
            }
            var bestRaceProb = 0.0;
            var bestRace = 'asian';
            for (var race in raceProbs) {
              if (raceProbs.hasOwnProperty(race) && raceProbs[race] >= bestRaceProb) {
                bestRaceProb = raceProbs[race];
                bestRace = race;
              }
            }
            bestRaceProb = bestRaceProb.toFixed(3);

            var gender = 'girl';
            if (faces[0]['attributes']['gender']['type'] == 'M') {
              gender = 'guy';
            }
          
            if (mode == 'face') {
              $('#speech').text('You look ' + (bestRaceProb * 100) + '% like a ' + faces[0]['attributes']['age'] + '-year-old ' + bestRace + ' ' + gender + '.');
            } else {
              var recommendedFood = 'hamburgers';
              if (bestRace == 'asian') {
                var asianFood = ['fried rice', 'dumplings', 'tofu', 'noodles', 'sushi', 'udon'];
                recommendedFood = asianFood[Math.floor(Math.random() * asianFood.length)];
              } else if (bestRace == 'black') {

              } else if (bestRace == 'hispanic') {
                var elem = ['paella', 'burrito', 'quesadilla', 'fajita', 'churro', 'tequilla'];
                recommendedFood = elem[Math.floor(Math.random()*elem.length)];
              } else if (bestRace == 'other') {

              } else if (bestRace == 'white') {

              }
              $('#speech').text('You look like that you enjoy ' + recommendedFood + '.');
            }
          } else {
            if (mode == 'face') {
              $('#speech').text('Sorry, I can\'t see where your face is.');
            } else {
              $('#speech').text('I think you should eat a hamburger.');
            }
          }

          status = 'result';

          // Hide overlay
          $('.overlay').css('display', 'none');
        }

        kairos.detect(image_data, kairosCallback, options);
      } else if (mode == 'captioning') {
        $('#action-button').text('Reset');


        $(function() {
          var dataURL = canvas.toDataURL('image/jpeg', 0.5);
          var blob = dataURItoBlob(dataURL);
          var params = {
            'maxCandidates': '1'
          };

          $.ajax({
            url: 'https://westus.api.cognitive.microsoft.com/vision/v1.0/describe?' + $.param(params),
            beforeSend: function(xhrObj) {
              xhrObj.setRequestHeader('Content-Type', 'application/octet-stream');
              xhrObj.setRequestHeader('Ocp-Apim-Subscription-Key', 'a864229fb6934f41839b4980d0af5024');
            },
            type: 'POST',
            processData: false,
            data: blob,
            success: function(data) {
              $('#speech').text('I see ' + data.description.captions[0].text + '!');
              $('.overlay').css('display', 'none');
            },
            error: function(jqXHR, textStatus) {
              $('#speech').text('Sorry, server error.');
              $('.overlay').css('display', 'none');
            }
          })
        });

        status = 'result';
      } else if (mode == 'scan') {
        $('#action-button').text('Reset');

        $(function() {
          var dataURL = canvas.toDataURL('image/jpeg', 0.5);
          var blob = dataURItoBlob(dataURL);
          var params = {
            'handwriting': 'false'
          };

          $.ajax({
            url: 'https://westus.api.cognitive.microsoft.com/vision/v1.0/recognizeText?' + $.param(params),
            beforeSend: function(xhrObj) {
              xhrObj.setRequestHeader('Content-Type', 'application/octet-stream');
              xhrObj.setRequestHeader('Ocp-Apim-Subscription-Key', 'a864229fb6934f41839b4980d0af5024');
            },
            type: 'POST',
            processData: false,
            data: blob,
            success: function(data) {
              console.log(data);

              if (data.orientation == 'NotDetected') {
                $('#speech').text('I don\'t see any text.');
                $('.overlay').css('display', 'none');
                return;
              }

              var detectedText = 'Here\'s the text I see: ';
              console.log(detectedText);

              var regions = data.regions;
              for (var i = 0; i < regions.length; i++) {
                var region = regions[i];
                var lines = region.lines;
                for (var j = 0; j < lines.length; j++) {
                  var line = lines[j];
                  var words = line.words;

                  var boundingBox = line.boundingBox;
                  var coords = boundingBox.split(',');
                  for (var k = 0; k < coords.length; k++) {
                    coords[k] = parseInt(coords[k]);
                  }

                  context.lineWidth = '6';
                  context.strokeStyle = 'red';
                  context.rect(coords[0], coords[1], coords[2], coords[3]);
                  context.stroke();

                  for (var k = 0; k < words.length; k++) {
                    var word = words[k];
                    detectedText += word.text + ' ';
                  }

                  detectedText += '. ';
                }
              }

              console.log(detectedText);
              $('#speech').text(detectedText);
              $('.overlay').css('display', 'none');
            },
            error: function(jqXHR, textStatus) {
              $('#speech').text('Sorry, server error.');
              $('.overlay').css('display', 'none');
            }
          });
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