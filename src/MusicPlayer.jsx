import React, { useRef, useState, useEffect } from 'react';

import Audio1 from "./Audio1.mp3";
import Audio2 from "./Audio2.mp3";
import Audio3 from "./Audio3.mp3";
import Audio4 from "./Audio4.mp3";
import Audio5 from "./Audio5.mp3";
import { FaPlayCircle, FaPauseCircle, FaStepForward, FaStepBackward } from "react-icons/fa";
import { TfiLoop } from "react-icons/tfi";
import { TbBalloonOff } from "react-icons/tb";
import image from "./image1.jpg";
import image2 from "./image2.jpg";
import image3 from "./image3.jpg";
import image4 from "./image4.jpg";
import image5 from "./image5.jpg";

import "./index.css";
import "./Music.css";

const MusicPlayer = () => {
    let [isPlaying, setPlaying] = useState(false);
    let [currentTime, setCurrentTime] = useState(0);
    let [currentSongIndex, setCurrentSongIndex] = useState(0);
    let [isLooping, setIsLooping] = useState(false);
    let [audioData, setAudioData] = useState(Array(20).fill(5)); // Initialize with default values

    let audioRef = useRef(null);
    let audioContextRef = useRef(null);
    let analyserRef = useRef(null);
    let animationFrameRef = useRef(null);

    let songs = [
        { title: "Leo", image: image, src: Audio1 },
        { title: "All the Stars", image: image2, src: Audio2 },
        { title: "Blinding Lights", image: image3, src: Audio3 },
        { title: "Millionaire", image: image4, src: Audio4 },
        { title: "Tauba Tauba", image: image5, src: Audio5 },

        


    ];

    let currentSong = songs[currentSongIndex];

    // Initialize audio analyzer
    useEffect(() => {
        // Create audio context and analyzer only once
        if (!audioContextRef.current) {
            try {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                audioContextRef.current = new AudioContext();
                analyserRef.current = audioContextRef.current.createAnalyser();
                analyserRef.current.fftSize = 64; // Lower for better performance
            } catch (error) {
                console.error("Web Audio API not supported:", error);
            }
        }

        return () => {
            // Clean up animation frame on unmount
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, []);

    // Connect audio element to analyzer when audio element is ready
    useEffect(() => {
        if (audioRef.current && audioContextRef.current && analyserRef.current) {
            // Create a source from the audio element
            const source = audioContextRef.current.createMediaElementSource(audioRef.current);
            source.connect(analyserRef.current);
            analyserRef.current.connect(audioContextRef.current.destination);
        }
    }, []);

    // Update visualizer when playing state changes
    useEffect(() => {
        if (isPlaying && analyserRef.current) {
            const updateVisualizer = () => {
                const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
                analyserRef.current.getByteFrequencyData(dataArray);
                
                // Map frequency data to our 20 bars
                const step = Math.floor(dataArray.length / 20);
                const newAudioData = Array(20).fill(0).map((_, i) => {
                    // Get average of a range of frequencies for each bar
                    const start = i * step;
                    const end = start + step;
                    let sum = 0;
                    for (let j = start; j < end; j++) {
                        sum += dataArray[j];
                    }
                    // Map 0-255 values to a range for bar heights (5-100)
                    return 5 + (sum / (end - start)) / 255 * 95;
                });
                
                setAudioData(newAudioData);
                animationFrameRef.current = requestAnimationFrame(updateVisualizer);
            };
            
            updateVisualizer();
        } else if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            // Set bars to minimal height when paused
            setAudioData(Array(20).fill(5));
        }
    }, [isPlaying]);

    // Play/Pause function with background animation
    let playOrPauseHandler = () => {
        if (isPlaying) {
            audioRef.current.pause();
            document.body.classList.remove("music-playing");
        } else {
            audioRef.current.play().catch(error => {
                console.error("Error playing audio:", error);
            });
            document.body.classList.add("music-playing");
            
            // Resume audio context if it's suspended (browser policy)
            if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
                audioContextRef.current.resume();
            }
        }
        setPlaying(!isPlaying);
    };

    // Time update handler
    let timeHandlerFunction = (e) => {
        setCurrentTime(e.target.currentTime);
    };

    // Drag handler for progress bar
    let dragHandlerFunction = (e) => {
        audioRef.current.currentTime = e.target.value;
        setCurrentTime(e.target.value);
    };

    // Skip forward or backward
    let skipForwardReverse = (direction) => {
        if (direction === "skip-forward") {
            setCurrentSongIndex((prevIndex) => (prevIndex + 1) % songs.length);
        } else if (direction === "skip-back") {
            setCurrentSongIndex((prevIndex) => (prevIndex - 1 + songs.length) % songs.length);
        }
    };

    return (
        <div className='container'>
            <img 
                src={currentSong.image} 
                alt={currentSong.title} 
                className={isPlaying ? "pulsing-image" : ""}
            />
            <h1 className='head'>{currentSong.title}</h1>

            <audio
                ref={audioRef}
                src={currentSong.src}
                onTimeUpdate={timeHandlerFunction}
                onEnded={() => skipForwardReverse("skip-forward")}
                loop={isLooping}
                preload="metadata"
            ></audio>

            {/* Audio Visualization Waves */}
            <div className={`audio-visualization ${isPlaying ? 'playing' : 'paused'}`}>
                {audioData.map((height, index) => (
                    <div 
                        key={index} 
                        className="wave-bar"
                        style={{ 
                            height: `${height}%`,
                            transition: 'height 0.1s ease-in-out'
                        }} 
                    />
                ))}
            </div>

            <div className='inputname'>
                <input
                    type="range"
                    value={currentTime}
                    max={audioRef.current ? audioRef.current.duration || 100 : 100}
                    onChange={dragHandlerFunction} 
                />
            </div>

            <div className='btn'>
                <button onClick={() => skipForwardReverse("skip-back")} ><FaStepBackward /></button>
                <button onClick={playOrPauseHandler}>{isPlaying ? <FaPauseCircle /> : <FaPlayCircle />}</button>
                <button onClick={() => skipForwardReverse("skip-forward")}><FaStepForward /></button>
                <button onClick={() => setIsLooping(!isLooping)}>
                    {isLooping ? <TfiLoop /> : <TbBalloonOff />}
                </button>
            </div>
        </div>
    );
};

export default MusicPlayer;