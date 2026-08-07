import CircularGallery from './CircularGallery';

export default function CircularGalleryDemo() {
  return (
    <div style={{ height: '600px', position: 'relative' }}>
      <CircularGallery
        bend={1}
        textColor="#ffffff"
        borderRadius={0.05}
        scrollEase={0.05}
        fontUrl=""
        font="bold 30px Orbitron"
        scrollSpeed={2}
      />
    </div>
  );
}
