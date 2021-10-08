
export const readFile = file => {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.readAsDataURL(file);
  });
};

export const createImage = data => {
  return new Promise(resolve => {
    const img = document.createElement('img');
    img.onload = () => resolve(img);
    img.src = data;
  })
}

export const dataURItoBlob = (dataURI, type) => {
  const binary = atob(dataURI.split(',')[1]);
  const array = [];
  for(let i = 0; i < binary.length; i++) {
      array.push(binary.charCodeAt(i));
  }
  return new Blob([new Uint8Array(array)], {type});
}