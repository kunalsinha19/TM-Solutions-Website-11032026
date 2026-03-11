import { useRef } from "react";

const FRONTEND_ASSET_BASE = (import.meta.env.VITE_FRONTEND_URL || "http://localhost:3000").replace(/\/$/, "");

function resolvePreviewSrc(image) {
  if (!image) {
    return "https://placehold.co/800x600?text=Image";
  }

  if (/^(https?:|data:)/i.test(image)) {
    return image;
  }

  return `${FRONTEND_ASSET_BASE}${image.startsWith("/") ? image : `/${image}`}`;
}

export default function ImageUploader({ images, setImages }) {
  const inputRef = useRef(null);

  function addUrlField() {
    setImages([...(images || []), ""]);
  }

  function updateUrl(index, value) {
    const nextImages = [...images];
    nextImages[index] = value;
    setImages(nextImages);
  }

  function removeImage(index) {
    setImages(images.filter((_, currentIndex) => currentIndex !== index));
  }

  function onFileChange(event) {
    const files = Array.from(event.target.files || []);
    Promise.all(
      files.map(
        (file) =>
          new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(file);
          })
      )
    ).then((results) => {
      setImages([...(images || []), ...results.filter(Boolean)]);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    });
  }

  return (
    <div className="stack">
      <div className="row gap-sm wrap">
        <button type="button" className="secondary" onClick={() => inputRef.current?.click()}>
          Upload Images
        </button>
        <button type="button" className="secondary" onClick={addUrlField}>
          Add Image URL
        </button>
        <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={onFileChange} />
      </div>

      <div className="image-grid">
        {(images || []).map((image, index) => (
          <div key={`${image}-${index}`} className="image-card">
            <div className="image-preview-frame">
              <img src={resolvePreviewSrc(image)} alt="Product preview" />
            </div>
            <input
              value={image}
              onChange={(event) => updateUrl(index, event.target.value)}
              placeholder="https://example.com/image.jpg, /products/image.jpg, or uploaded base64"
            />
            <button type="button" className="danger" onClick={() => removeImage(index)}>
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
