// Inspired by this pen (https://codepen.io/sdras/pen/dZOdpv) from the great @sdras.

new Vue({
  el: "#app",

  data: function data() {
    return {
      emotion: '',
      image: '',
      loading: false,
      noFace: false,
      playlist: []
    };
  },


  methods: {
    getEmotions: function getEmotions() {
      var _this = this;

      var contentType = void 0,
          data = void 0;
      this.loading = true;

      if (typeof this.image === "string") {
        data = { url: this.image };
        contentType = "application/json";
      } else {
        data = this.image;
        contentType = "application/octet-stream";
      }

      axios({
        method: "post",
        url: things.microsoft.url,
        data: data,
        headers: {
          "Content-Type": contentType,
          "Ocp-Apim-Subscription-Key": things.microsoft.key
        }
      }).then(function (response) {
        if (response.data.length > 0) {
          _this.getTopEmotion(response.data[0].scores);
          _this.getPlaylist();
        } else {
          _this.noFace = true;
          _this.loading = false;
        }
      });
    },
    reset: function reset() {
      this.playlist = [];
      this.resetImage();
    },
    getTopEmotion: function getTopEmotion(scores) {
      this.emotion = Object.keys(scores).reduce(function (a, b) {
        return scores[a] > scores[b] ? a : b;
      });
      console.log('emotion :: ', this.emotion);
    },
    getPlaylist: function getPlaylist() {
      var _this2 = this;

      axios({
        method: "get",
        url: things.itunes.url,
        params: {
          type: 'track',
          term: this.emotion, // this.getEmotionTerm()
          limit: 25,
          media: 'music',
          entity: 'musicTrack'
        },
        headers: {
          "Content-Type": "application/json"
        }
      }).then(function (response) {
        console.log('itunes response :: ', response);
        if (response.data.results && response.data.results.length) {
          _this2.playlist = _this2.playlist.concat(response.data.results);
        }
        _this2.loading = false;
      });
    },
    handleFile: function handleFile(e) {
      var files = e.target.files;
      if (!files.length) return;

      this.image = files[0];
      this.createImage();
      this.getEmotions();
    },
    createImage: function createImage() {
      var _this3 = this;

      var image = new Image();
      var reader = new FileReader();

      reader.onload = function (e) {
        _this3.image = e.target.result;
      };
      reader.readAsDataURL(this.image);
    },
    resetImage: function resetImage(e) {
      this.image = "";
      this.noFace = false;
    },
    useMine: function useMine() {
      this.image = 'https://i.imgflip.com/qk55o.jpg';
      this.getEmotions();
    }
  }
});

Vue.component('player', {
  props: ['playlist'],

  data: function data() {
    return {
      currentIndex: 0,
      currentTrack: null,
      sounds: []
    };
  },


  computed: {
    isPlaying: function isPlaying() {
      return this.sounds.length && this.sounds[this.currentIndex].playing();
    }
  },

  methods: {
    isSongPlaying: function isSongPlaying(songIndex) {
      return songIndex === this.currentIndex && this.sounds[songIndex] && this.sounds[songIndex].playing();
    },
    togglePlay: function togglePlay() {
      if (this.isSongPlaying(this.currentIndex)) {
        this.sounds[this.currentIndex].pause();
      } else {
        this.sounds[this.currentIndex].play();
      }
    },
    playSong: function playSong(index) {
      if (this.currentIndex === index) {
        this.togglePlay();
      } else {
        this.sounds[this.currentIndex].stop();
        this.currentIndex = index;
        this.sounds[index].play();
      }
    },
    nextSong: function nextSong() {
      if (!this.sounds.length || !this.sounds[this.currentIndex + 1]) return;

      this.sounds[this.currentIndex].stop();
      this.currentIndex++;
      this.sounds[this.currentIndex].play();
    },
    previousSong: function previousSong() {
      if (!this.sounds.length || !this.sounds[this.currentIndex - 1]) return;

      this.sounds[this.currentIndex].stop();
      this.currentIndex--;
      this.sounds[this.currentIndex].play();
    }
  },

  watch: {
    playlist: function playlist(newVal, oldVal) {
      var self = this;

      if (!newVal.length) {
        this.sounds[this.currentIndex].stop();
        this.sounds = [];
      }

      var newTracks = oldVal.length ? newVal.slice(oldVal.length) : newVal;

      newTracks.forEach(function (item) {
        var sound = new Howl({
          src: [item.previewUrl],
          onend: function onend() {
            if (self.sounds[self.currentIndex + 1]) {
              self.currentIndex++;
              self.sounds[self.currentIndex].play();
            }
          }
        });

        self.sounds.push(sound);
      });

      // only autoplay on the first load.
      if (!oldVal.length) {
        this.sounds[this.currentIndex].play();
      }
    }
  },

  template: '#player'
});

// Go away.
var things = {
  microsoft: {
    url: "https://westus.api.cognitive.microsoft.com/emotion/v1.0/recognize",
    key: "55c111fd66f340289347a12ba4063c73"
  },
  itunes: {
    url: 'https://itunes.apple.com/search'
  }
};
