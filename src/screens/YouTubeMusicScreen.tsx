import React, { useState } from 'react';
import {
  Music,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Search,
  ExternalLink,
  Sparkles,
  Heart,
  Volume2,
} from 'lucide-react';
import { sounds } from '../utils/soundEffects';

export const YouTubeMusicScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeVideoId, setActiveVideoId] = useState('jfKfPfyJRdk'); // Default smooth lofi/chill track
  const [activeTrackTitle, setActiveTrackTitle] = useState('Lofi Hip Hop Radio - Beats to Relax/Study to');
  const [isPlaying, setIsPlaying] = useState(true);

  const playlists = [
    {
      title: 'Arijit Singh Melodies',
      category: 'Romantic',
      videoId: 'V1bFr2KGq1g',
      trackTitle: 'Best of Arijit Singh Romantic Medley',
      color: 'from-rose-500 to-pink-600',
    },
    {
      title: 'Romantic Bollywood Hits',
      category: 'Love',
      videoId: 'gvyUuxdRdR4',
      trackTitle: 'Heart-Touching Bollywood Romantic Songs',
      color: 'from-pink-500 to-purple-600',
    },
    {
      title: 'Lofi Chill & Focus Beats',
      category: 'Focus',
      videoId: 'jfKfPfyJRdk',
      trackTitle: 'Lofi Hip Hop Radio - Beats to Relax/Study to',
      color: 'from-cyan-500 to-blue-600',
    },
    {
      title: 'Punjabi Hits & Beats',
      category: 'Energy',
      videoId: 'cl0a3i2wFcc',
      trackTitle: 'Top Punjabi Viral Hits',
      color: 'from-amber-400 to-orange-500',
    },
    {
      title: 'Acoustic Guitar & Piano',
      category: 'Peace',
      videoId: '4xDzrJKXOOY',
      trackTitle: 'Peaceful Acoustic Guitar Melodies',
      color: 'from-emerald-400 to-teal-500',
    },
  ];

  const handleSelectTrack = (videoId: string, title: string) => {
    sounds.playClickSound();
    setActiveVideoId(videoId);
    setActiveTrackTitle(title);
    setIsPlaying(true);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    sounds.playClickSound();
    const query = encodeURIComponent(searchQuery.trim());
    window.open(`https://www.youtube.com/results?search_query=${query}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-2 sm:px-4 py-3 space-y-6 select-none">
      {/* Header */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-neutral-900/80 border border-pink-500/20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-pink-500/10 text-pink-400">
            <Music className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              YouTube Music Experience
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300">
                Hi-Fi Audio
              </span>
            </div>
            <div className="text-[11px] text-neutral-400">
              Voice commanded playback: &quot;Play Arijit Singh&quot;, &quot;Play romantic songs&quot;
            </div>
          </div>
        </div>
      </div>

      {/* Embedded Player Viewport */}
      <div className="space-y-3">
        <div className="relative w-full aspect-video sm:h-72 rounded-2xl overflow-hidden border border-neutral-800 bg-black shadow-2xl">
          <iframe
            src={`https://www.youtube.com/embed/${activeVideoId}?autoplay=${isPlaying ? 1 : 0}&enablejsapi=1`}
            title={activeTrackTitle}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full border-0"
          />
        </div>

        {/* Currently Playing Card */}
        <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-500 to-purple-500 flex items-center justify-center text-white shrink-0 shadow-md">
              <Music className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate">{activeTrackTitle}</div>
              <div className="text-[11px] font-mono text-cyan-400 flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                <span>STREAMING VIA YASMIN AUDIO</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`https://www.youtube.com/watch?v=${activeVideoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition"
              title="Open in official YouTube"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search any song, artist, or album on YouTube..."
          className="w-full pl-10 pr-20 py-3 bg-neutral-900 border border-neutral-800 focus:border-pink-500 rounded-2xl text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none"
        />
        <button
          type="submit"
          className="absolute right-2 top-2 px-3 py-1.5 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs transition cursor-pointer"
        >
          Search
        </button>
      </form>

      {/* Curated Mood Playlists */}
      <div className="space-y-2.5">
        <div className="text-xs font-mono text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-pink-400" />
          Curated Companion Playlists
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {playlists.map((pl, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSelectTrack(pl.videoId, pl.trackTitle)}
              className="p-3.5 rounded-2xl bg-neutral-900/80 border border-neutral-800 hover:border-pink-500/40 hover:bg-neutral-850 flex items-center justify-between gap-3 text-left transition group cursor-pointer active:scale-98"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${pl.color} flex items-center justify-center text-white shrink-0 shadow-md group-hover:scale-105 transition-transform`}
                >
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white group-hover:text-pink-300 transition truncate">
                    {pl.title}
                  </div>
                  <div className="text-[10px] text-neutral-400 truncate mt-0.5">{pl.trackTitle}</div>
                </div>
              </div>

              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400">
                {pl.category}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
