const { parse } = require("parse-usdl");
const constraints = {
  video: {
    facingMode: "environment",
    width: { min: 700 },
    height: { min: 500 }
  }
};
const video = document.getElementById("videoele");
const image = document.querySelector("#img");
const screenshotButton = document.getElementById("btnele");
function hasGetUserMedia() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}
if (hasGetUserMedia()) {
  // Good to go!
  navigator.mediaDevices
    .getUserMedia(constraints)
    .then(gotStream)
    .catch(handleError);
} else {
  alert("getUserMedia() is not supported by your browser");
}

function gotStream(stream) {
  window.stream = stream; // make stream available to console
  video.srcObject = stream;
}
function handleError(error) {
  console.log(error);
}
screenshotButton.onclick = video.onclick = function() {
  const canvas = document.createElement("canvas");
  const canvas_context = canvas.getContext("2d");

  document.querySelector(".error").innerHTML = "";
  document.querySelector(".decodedText").innerHTML = "";

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas_context.drawImage(video, 0, 0, canvas.width, canvas.height);
  image.src = canvas.toDataURL("image/png");
  try {
    source = new ZXing.BitmapLuminanceSource(canvas_context, image);
    binarizer = new ZXing.Common.HybridBinarizer(source);
    bitmap = new ZXing.BinaryBitmap(binarizer);
    const result = ZXing.PDF417.PDF417Reader.decode(bitmap, null, false);
    if (result.length !== 0) {
      const res = parse(result[0].Text);
      if (Object.keys(res).length == 0) {
        document.querySelector(".decodedText").innerHTML = result[0].Text;
      } else {
        document.querySelector(".decodedText").innerHTML = JSON.stringify(
          res,
          null,
          2
        );
      }
    } else {
      document.querySelector(".decodedText").innerHTML =
        "Please try again/Try with a clearer picture";
    }
  } catch (err) {
    document.querySelector(".error").innerHTML = err;
  }
};
