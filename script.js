class MusicPlayer {
  constructor() {
    this.currentSong = null
    this.playlist = []
    this.queue = []
    this.currentIndex = 0
    this.isPlaying = false
    this.audio = new Audio()
    this.lastVolume = 1
    this.isMuted = false
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

    // Queue elements
    this.queueList = document.getElementById('queueList')
    this.queueCount = document.getElementById('queueCount')
    this.songMenu = document.getElementById('songMenu')

    // Volume elementssajkfbahfilnlwainfliwa

    this.volumeBtn = document.getElementById('volumeBtn')
    this.volumeSlider = document.getElementById('volumeSlider')
    this.volumeTooltip = document.querySelector('.volume-tooltip')

    // Set initial volume
    this.audio.volume = this.volumeSlider.value / 100
    this.updateVolumeIcon(this.audio.volume)
  }

  setupEventListeners() {
    // Search events
    this.searchButton.addEventListener('click', () => this.searchSongs())
    this.searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.searchSongs()
    })

    // Audio events
    this.audio.addEventListener('timeupdate', () => this.updateProgress())
    this.audio.addEventListener('ended', () => this.handleSongEnd())
    this.audio.addEventListener('loadedmetadata', () => {
      this.durationSpan.textContent = this.formatTime(this.audio.duration)
    })

    // Control events
    this.playPauseBtn.addEventListener('click', () => this.togglePlayPause())
    this.prevBtn.addEventListener('click', () => this.playPrevious())
    this.nextBtn.addEventListener('click', () => this.playNext())
    this.backwardBtn.addEventListener('click', () => this.seekBackward())
    this.forwardBtn.addEventListener('click', () => this.seekForward())

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (
        !e.target.closest('.song-menu') &&
        !e.target.closest('.song-menu-btn')
      ) {
        this.songMenu.classList.remove('active')
      }
    })

    // Volume control events
    this.volumeBtn.addEventListener('click', () => this.toggleMute())
    this.volumeSlider.addEventListener('input', (e) =>
      this.handleVolumeChange(e)
    )
    this.volumeSlider.addEventListener('mousemove', (e) =>
      this.updateVolumeTooltip(e)
    )
    this.volumeSlider.addEventListener(
      'mouseenter',
      () => (this.volumeTooltip.style.opacity = '1')
    )
    this.volumeSlider.addEventListener(
      'mouseleave',
      () => (this.volumeTooltip.style.opacity = '0')
    )
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
                <div class="song-info-container">
                    <h3>${song.title}</h3>
                    <p>${song.subtitle}</p>
                </div>
                <button class="song-menu-btn">
                    <i class="fas fa-ellipsis-v"></i>
                </button>
            `

      // Add click event for playing the song
      resultDiv
        .querySelector('.song-info-container')
        .addEventListener('click', () => {
          this.selectSong(song, index)
        })

      // Add click event for the menu button
      resultDiv
        .querySelector('.song-menu-btn')
        .addEventListener('click', (e) => {
          e.stopPropagation()
          this.showSongMenu(e, song)
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

  showSongMenu(event, song) {
    const menu = this.songMenu
    const rect = event.target.getBoundingClientRect()

    menu.style.top = `${rect.bottom + window.scrollY}px`
    menu.style.left = `${rect.left + window.scrollX}px`
    menu.classList.add('active')

    // Remove old event listeners
    const menuItems = menu.querySelectorAll('.song-menu-item')
    menuItems.forEach((item) => {
      item.replaceWith(item.cloneNode(true))
    })

    // Add new event listeners
    menu
      .querySelector('[data-action="queue"]')
      .addEventListener('click', () => {
        this.addToQueue(song)
        menu.classList.remove('active')
      })

    menu
      .querySelector('[data-action="playlist"]')
      .addEventListener('click', () => {
        this.addToPlaylist(song)
        menu.classList.remove('active')
      })
  }

  addToQueue(song) {
    this.queue.push(song)
    this.updateQueueDisplay()
  }

  addToPlaylist(song) {
    // You can implement playlist functionality here
    alert('Playlist feature coming soon!')
  }

  updateQueueDisplay() {
    this.queueList.innerHTML = ''
    this.queueCount.textContent = `${this.queue.length} songs`

    this.queue.forEach((song, index) => {
      const queueItem = document.createElement('div')
      queueItem.className = 'queue-item'
      if (this.currentSong === song) {
        queueItem.classList.add('active')
      }

      queueItem.innerHTML = `
                <div class="queue-item-info">
                    <div class="queue-item-title">${song.title}</div>
                    <div class="queue-item-artist">${song.subtitle}</div>
                </div>
                <button class="queue-item-remove">
                    <i class="fas fa-times"></i>
                </button>
            `

      queueItem
        .querySelector('.queue-item-remove')
        .addEventListener('click', (e) => {
          e.stopPropagation()
          this.removeFromQueue(index)
        })

      queueItem.addEventListener('click', () => {
        this.playQueueItem(index)
      })

      this.queueList.appendChild(queueItem)
    })
  }

  removeFromQueue(index) {
    this.queue.splice(index, 1)
    this.updateQueueDisplay()
  }

  playQueueItem(index) {
    const song = this.queue[index]
    this.selectSong(song)
    this.queue.splice(index, 1)
    this.updateQueueDisplay()
  }

  handleSongEnd() {
    if (this.queue.length > 0) {
      // Play the next song in queue
      const nextSong = this.queue.shift()
      this.selectSong(nextSong)
      this.updateQueueDisplay()
    } else {
      this.playNext()
    }
  }

  handleVolumeChange(e) {
    const volume = e.target.value / 100
    this.audio.volume = volume
    this.updateVolumeIcon(volume)
    this.updateVolumeSlider(volume)

    if (volume > 0) {
      this.isMuted = false
      this.lastVolume = volume
    }
  }

  toggleMute() {
    if (this.isMuted) {
      // Unmute
      this.audio.volume = this.lastVolume
      this.volumeSlider.value = this.lastVolume * 100
      this.isMuted = false
    } else {
      // Mute
      this.lastVolume = this.audio.volume
      this.audio.volume = 0
      this.volumeSlider.value = 0
      this.isMuted = true
    }
    this.updateVolumeIcon(this.audio.volume)
    this.updateVolumeSlider(this.audio.volume)
  }

  updateVolumeIcon(volume) {
    const icon = this.volumeBtn.querySelector('i')
    icon.className = 'fas'

    if (volume === 0) {
      icon.classList.add('fa-volume-mute')
    } else if (volume < 0.3) {
      icon.classList.add('fa-volume-off')
    } else if (volume < 0.7) {
      icon.classList.add('fa-volume-down')
    } else {
      icon.classList.add('fa-volume-up')
    }
  }

  updateVolumeSlider(volume) {
    this.volumeSlider.style.setProperty(
      '--volume-percentage',
      `${volume * 100}%`
    )
    this.volumeTooltip.textContent = `${Math.round(volume * 100)}%`
  }

  updateVolumeTooltip(e) {
    const rect = e.target.getBoundingClientRect()
    const position = (e.clientX - rect.left) / rect.width
    const value = Math.round(position * 100)
    this.volumeTooltip.textContent = `${Math.max(0, Math.min(100, value))}%`
  }
}

// Initialize the music player
const player = new MusicPlayer()
