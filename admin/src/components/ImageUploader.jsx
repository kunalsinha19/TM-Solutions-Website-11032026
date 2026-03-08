import { useRef } from "react";

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
            <img src={image || "https://placehold.co/320x200?text=Image"} alt="Product preview" />
            <input
              value={image}
              onChange={(event) => updateUrl(index, event.target.value)}
              placeholder="https://example.com/image.jpg or uploaded base64"
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
