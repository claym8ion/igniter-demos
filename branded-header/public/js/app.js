(function($) {

  //
  // Video API
  // provides an interface for working with embedded videos
  //

  var videoAPI = {

    parseUrl: function(videoUrl) {
      var videoService, videoKey;

      if (videoUrl.indexOf('youtube.com/watch') !== -1) {

        videoService = 'youtube';
        // use 11 characters after url parameter
        videoKey = videoUrl.substr(videoUrl.lastIndexOf("v=") + 2, 11);

      } else if (videoUrl.indexOf('youtu.be') !== -1) {

        videoService = 'youtube';
        // use 11 characters from end
        videoKey = videoUrl.substr(-11);

      } else if (videoUrl.indexOf('vimeo.com') !== -1) {

        videoService = 'vimeo';
        // use everything after domain
        videoKey = videoUrl.substr(videoUrl.indexOf("vimeo.com/") + 10);
      }

      return { service: videoService, key: videoKey };
    },

    fetchThumbnail: function(service, key, cb) {
      videoAPI[service]._fetchThumbnail(key, cb);
    },

    determineEmbedSrc: function(service, key, cb) {
      videoAPI[service]._determineEmbedSrc(key, cb);
    },

    youtube : {
      _fetchThumbnail: function(key, cb) {
        cb("http://img.youtube.com/vi/" + key + "/0.jpg");
      },
      _determineEmbedSrc: function(key, cb) {
        cb("http://www.youtube.com/embed/" + key + "?enablejsapi=1&wmode=opaque&origin=" + document.domain);
      }
    },

    vimeo : {
      _fetchThumbnail: function(key, cb) {
        $.getJSON('http://www.vimeo.com/api/v2/video/' + key + '.json?callback=?', {format: "json"}, function(data) {
          cb(data[0].thumbnail_large);
        });
      },
      _determineEmbedSrc: function(key, cb) {
        cb("http://player.vimeo.com/video/" + key + "?wmode=opaque");
      }
    }
  };

  //
  // Toggle Show Collection (used by multiple product post)
  //

  $(document).on('click', 'div#collection-show button, a.view-collection', function () {
    $('.slider').removeClass('disappear').addClass('fadeInUp');
    $('div.overlay').fadeIn();
    return false;
  });

  //
  // Toggle PDP (used by single-post theme)
  //

  $(document).on('click', 'a.product-link', function() {
    $('.slider')
      .removeClass('disappear')
      .addClass('fadeInUp');

    $('div.overlay').fadeIn();
    return false;
  });
  $(document).on('click', 'div.product-close, div.overlay', function() {
    $('.slider')
      .addClass('disappear')
      .removeClass('fadeInUp');

    $('div.overlay').fadeOut();
  });


  //
  // Load image gallery (used in multi-product-post theme)
  //

  $(document).on('click', '.image-gallery a', function() {
    var $this = $(this);
    $(".main-image img").attr('src', $this.attr('href'));
    $this.addClass('active').siblings().removeClass('active');
    return false;
  });

  //
  // Toggle share modal (used in social share post)
  //

  $(document).on('click', '#action a', function () {
    $('#slider').addClass('fadeInUp');
    $('div.overlay').fadeIn();
    return false;
  });
  $(document).on('click', '#slider .close, div.overlay', function () {
    $('#slider').removeClass('fadeInUp');
    $('div.overlay').fadeOut();
    return false;
  });

  //
  // Lead generation page
  //
  $(document).on('click', '#slider .close', function () {
    $('#slider').removeClass('fadeInUp');
      $('.before').removeClass('hide');
      $('.after').removeClass('show');
  });
  $(document).on('click', 'a.submit', function () {
    $(this).closest('form').submit();
    return false;
  });
  $(document).on('submit', 'form#lead-gen-form', function() {
    var $form = $(this),
        action = $form.attr('action'),
        method = $form.attr('method'),
        data = $form.serializeArray();

    if (data.length > 0) {
      $.ajax({
        url: action,
        type: method,
        data: data
      }).done(function() {
          // show success markup
          $('.before').addClass('hide');
          $('.after').addClass('show');
      }).fail(function(xhr) {
        alert('Failure! Server responded with (' + xhr.status + ') ' + xhr.statusText );
      });
    }

    return false;
  });

  $(document).ready(function() {

    //
    // Load splash video (used in multiple product post)
    //

    $("iframe[data-video]").each(function(){
      var $videoIframe = $(this),
        videoUrl = $videoIframe.data('video'),
        video = videoAPI.parseUrl(videoUrl);

      videoAPI.determineEmbedSrc(video.service, video.key, function(embedSrc) {
        $videoIframe.attr('src', embedSrc);
      });
    });

    //
    // Initialize FlexSlider
    // @link http://www.woothemes.com/flexslider/
    //
    $(".flexslider")
      .flexslider({
        animation: "fade", // "slide" type does not work if starting slide is video
        animationSpeed: 200,
        animationLoop: false,
        directionNav: false,
        controlsContainer: ".flexslider-nav",
        controlNav: true,
        manualControls: "ul#thumbnails li a",
        useCSS: false,
        smoothHeight: true,
        slideshow: false,
        touch: false,
        startAt: function() {
          // start with video slide (if exists)
          var $flexSliderNav = $('.flexslider-nav');
          return $flexSliderNav.index('[data-video]') || 0;
        }(),
        start: function(slider) {
          //
          // video slides
          //
          slider.controlNav
            .filter('[data-video]')
            .each(function(i) {
              var $videoThumbnail = $('img', this),
                videoIframe = slider.slides.filter('.video').find('iframe')[i],
                videoUrl = $(this).data('video'),
                video = videoAPI.parseUrl(videoUrl);

              videoAPI.fetchThumbnail(video.service, video.key, function(imageSrc) {
                $videoThumbnail.attr('src', imageSrc);
              });

              videoAPI.determineEmbedSrc(video.service, video.key, function(embedSrc) {
                videoIframe.src = embedSrc;
              });
            });

        },
        before: function(slider) {

          //
          // if leaving video slide, stop it first
          //
          var $currentSlide = slider.slides.eq(slider.currentSlide);
          if ($currentSlide.hasClass('video')) {
            var iframe = $('iframe', $currentSlide)[0];
            iframe.src = iframe.src;
          }
        }
      });

    $('ul#thumbnails li.video a').prepend('<span class="play"></span>');


    //
    // Initialize Instagram plugin
    // @link http://potomak.github.com/jquery-instagram/
    //

    $(".instagram").each(function() {
      var $instagram = $(this),
        hashtag = $instagram.data('hashtag'),
      // a client id obtained from registering an Instagram API
      // client app at http://instagr.am/developer/register/
        clientId = 'baee48560b984845974f6b85a07bf7d9',
        nextUrl;

      $instagram.instagram({
        hash: hashtag,
        clientId : clientId,
        show : 18,
        onComplete : function (photos, data) {
          if (photos.length) {
            nextUrl = data.pagination.next_url;
            $instagram.children('div:gt(8)').remove();
          } else {
            $instagram.next('button.more').remove();
          }
        }
      });

      // handler for lazy-loading more photos
      $instagram.next('button.more').click(function() {
        var $button = $(this),
          buttonText = $button.text(),
          loadingText = 'Loading…';

        if ($button.text() !== loadingText) {
          $button.text(loadingText);
          $instagram.instagram({
            next_url : nextUrl,
            show : 9,
            onComplete : function(photos, data) {
              if (photos.length) {
                nextUrl = data.pagination.next_url;
                $button.text(buttonText);
              } else {
                $button.remove();
              }
            }
          });
        }
      });
    });
  });

}(jQuery));