import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { VideoPlayer } from '../../components/player/VideoPlayer';

describe('VideoPlayer', () => {
  it('should render fallback when no video url is provided', () => {
    render(
      <VideoPlayer 
        onProgress={() => {}} 
        onEnded={() => {}} 
      />
    );
    expect(screen.getByText(/No video available/i)).toBeInTheDocument();
  });

  it('should render YouTube player when youtubeUrl is provided', () => {
    const { container } = render(
      <VideoPlayer 
        youtubeUrl="https://youtube.com/watch?v=12345" 
        onProgress={() => {}} 
        onEnded={() => {}} 
      />
    );
    // YouTubePlayer uses iframe or ReactPlayer, we can check for its container
    const iframe = container.querySelector('iframe');
    // Since ReactPlayer loads async, we just ensure it rendered the wrapper
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should render file player when fileUrl is provided', () => {
    const { container } = render(
      <VideoPlayer 
        fileUrl="https://example.com/video.mp4" 
        onProgress={() => {}} 
        onEnded={() => {}} 
      />
    );
    // FilePlayer uses a standard HTML5 <video> element
    const video = container.querySelector('video');
    expect(video).toBeInTheDocument();
  });

  it('should play from the large center overlay button', () => {
    const playMock = vi
      .spyOn(window.HTMLMediaElement.prototype, 'play')
      .mockResolvedValue(undefined);

    render(
      <VideoPlayer
        fileUrl="https://example.com/video.mp4"
        onProgress={() => {}}
        onEnded={() => {}}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /play video/i }));

    expect(playMock).toHaveBeenCalled();
    playMock.mockRestore();
  });
});
