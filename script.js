class MusicPlayer {
  constructor() {
    this.currentSong = null
    this.playlist = []
    this.currentIndex = 0
    this.isPlaying = false
    this.audio = new Audio()
    this.initializeElements()
    this.setupEventListeners()
  }

  initializeElements() {
    // Search elements
    this.searchInput = document.getElementById('searchInput')
    this.searchButton = document.getElementById('searchButton')
    this.searchResults = document.getElementById('searchResults')

    // Player elements
    this.albumArt = document.getElementById('albumArt')
    this.songTitle = document.getElementById('songTitle')
    this.artistName = document.getElementById('artistName')
    this.progressBar = document.getElementById('progress')
    this.currentTimeSpan = document.getElementById('currentTime')
    this.durationSpan = document.getElementById('duration')

    // Control buttons
    this.prevBtn = document.getElementById('prevBtn')
    this.backwardBtn = document.getElementById('backwardBtn')
    this.playPauseBtn = document.getElementById('playPauseBtn')
    this.forwardBtn = document.getElementById('forwardBtn')
    this.nextBtn = document.getElementById('nextBtn')
  }

  setupEventListeners() {
    // Search events
    this.searchButton.addEventListener('click', () => this.searchSongs())
    this.searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.searchSongs()
    })

    // Audio events
    this.audio.addEventListener('timeupdate', () => this.updateProgress())
    this.audio.addEventListener('ended', () => this.playNext())
    this.audio.addEventListener('loadedmetadata', () => {
      this.durationSpan.textContent = this.formatTime(this.audio.duration)
    })

    // Control events
    this.playPauseBtn.addEventListener('click', () => this.togglePlayPause())
    this.prevBtn.addEventListener('click', () => this.playPrevious())
    this.nextBtn.addEventListener('click', () => this.playNext())
    this.backwardBtn.addEventListener('click', () => this.seekBackward())
    this.forwardBtn.addEventListener('click', () => this.seekForward())
  }

  async searchSongs() {
    const query = this.searchInput.value.trim()
    if (!query) return

    const options = {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': 'ed47cb496cmsh19777552376a6ddp11a6b2jsn89b4dc03c517',
        'X-RapidAPI-Host': 'shazam.p.rapidapi.com',
      },
    }

    try {
      // Show loading state
      this.searchResults.innerHTML = '<p>Searching...</p>'

      const response = await fetch(
        `https://shazam.p.rapidapi.com/search?term=${encodeURIComponent(
          query
        )}&locale=en-US&offset=0&limit=10`,
        options
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.tracks && data.tracks.hits && data.tracks.hits.length > 0) {
        this.playlist = data.tracks.hits.map((hit) => {
          const track = hit.track
          return {
            title: track.title || 'Unknown Title',
            subtitle: track.subtitle || 'Unknown Artist',
            images: track.images || {},
            url:
              track.hub?.actions?.find(
                (action) =>
                  action.type === 'uri' || action.uri?.includes('.mp3')
              )?.uri || null,
          }
        })
        this.displaySearchResults(this.playlist)
      } else {
        this.searchResults.innerHTML =
          '<p>No songs found. Try a different search.</p>'
        this.playlist = []
      }
    } catch (error) {
      console.error('Error searching songs:', error)
      this.searchResults.innerHTML = `<p>Error searching songs: ${error.message}. Please try again.</p>`
      this.playlist = []
    }
  }

  displaySearchResults(songs) {
    this.searchResults.innerHTML = ''
    if (songs.length === 0) {
      this.searchResults.innerHTML =
        '<p>No songs found. Try a different search.</p>'
      return
    }

    songs.forEach((song, index) => {
      const resultDiv = document.createElement('div')
      resultDiv.className = 'search-result'
      resultDiv.innerHTML = `
                <div style="padding: 10px; cursor: pointer; border-bottom: 1px solid rgba(255,255,255,0.1);">
                    <h3>${song.title}</h3>
                    <p>${song.subtitle}</p>
                </div>
            `
      resultDiv.addEventListener('click', () => {
        if (song.url) {
          this.selectSong(song, index)
        } else {
          alert('Sorry, this song is not available for playback.')
        }
      })
      this.searchResults.appendChild(resultDiv)
    })
  }

  selectSong(song, index) {
    this.currentSong = song
    this.currentIndex = index

    // Update UI
    this.songTitle.textContent = song.title
    this.artistName.textContent = song.subtitle
    this.albumArt.src =
      song.images?.coverart ||
      'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiMzMzMiLz48dGV4dCB4PSI1MCIgeT0iNTAiIGZvbnQtc2l6ZT0iMjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiNmZmYiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4='

    // Update audio source and play
    if (song.url) {
      this.audio.src = song.url
      this.playAudio()
    } else {
      console.error('No playable URL found for this song')
      this.songTitle.textContent = 'Cannot play this song'
      this.artistName.textContent = 'No playable URL available'
    }
  }

  togglePlayPause() {
    if (!this.currentSong) return

    if (this.isPlaying) {
      this.pauseAudio()
    } else {
      this.playAudio()
    }
  }

  playAudio() {
    this.audio.play()
    this.isPlaying = true
    this.playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>'
  }

  pauseAudio() {
    this.audio.pause()
    this.isPlaying = false
    this.playPauseBtn.innerHTML = '<i class="fas fa-play"></i>'
  }

  playPrevious() {
    if (this.currentIndex > 0) {
      this.currentIndex--
      this.selectSong(this.playlist[this.currentIndex], this.currentIndex)
    }
  }

  playNext() {
    if (this.currentIndex < this.playlist.length - 1) {
      this.currentIndex++
      this.selectSong(this.playlist[this.currentIndex], this.currentIndex)
    }
  }

  seekBackward() {
    this.audio.currentTime = Math.max(0, this.audio.currentTime - 10)
  }

  seekForward() {
    this.audio.currentTime = Math.min(
      this.audio.duration,
      this.audio.currentTime + 10
    )
  }

  updateProgress() {
    const progress = (this.audio.currentTime / this.audio.duration) * 100
    this.progressBar.style.width = `${progress}%`
    this.currentTimeSpan.textContent = this.formatTime(this.audio.currentTime)
  }

  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }
}

// Initialize the music player
const player = new MusicPlayer()
