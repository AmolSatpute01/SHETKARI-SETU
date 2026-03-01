import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";

function CropperModal({ imageSrc, onClose, onCropDone }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropComplete = useCallback((_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  return (
    <div style={overlay}>
      <div style={box}>
        <h3 style={{ marginTop: 0 }}>Crop your profile photo</h3>

        <div style={cropArea}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1} // ✅ circle size
            cropShape="round"
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <input
          type="range"
          min={1}
          max={3}
          step={0.1}
          value={zoom}
          onChange={(e) => setZoom(e.target.value)}
          style={{ width: "100%", marginTop: "12px" }}
        />

        <div style={btnRow}>
          <button style={cancelBtn} onClick={onClose}>
            Cancel
          </button>

          <button
            style={doneBtn}
            onClick={() => onCropDone(croppedAreaPixels)}
          >
            ✅ Done
          </button>
        </div>
      </div>
    </div>
  );
}

const overlay = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  background: "rgba(0,0,0,0.55)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 99999,
};

const box = {
  width: "420px",
  background: "#fff",
  padding: "18px",
  borderRadius: "14px",
};

const cropArea = {
  position: "relative",
  width: "100%",
  height: "300px",
  background: "#000",
  borderRadius: "12px",
  overflow: "hidden",
};

const btnRow = {
  marginTop: "14px",
  display: "flex",
  gap: "10px",
};

const cancelBtn = {
  flex: 1,
  padding: "10px",
  borderRadius: "10px",
  border: "1px solid #ddd",
  background: "#fff",
  cursor: "pointer",
  fontWeight: "800",
};

const doneBtn = {
  flex: 1,
  padding: "10px",
  borderRadius: "10px",
  border: "none",
  background: "#2e7d32",
  color: "#fff",
  cursor: "pointer",
  fontWeight: "900",
};

export default CropperModal;
