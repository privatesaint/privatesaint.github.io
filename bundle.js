(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

},{"parse-usdl":2}],2:[function(require,module,exports){
exports.parse = require("./src/parseUsdl.js").parse;

},{"./src/parseUsdl.js":4}],3:[function(require,module,exports){
// Source: http://www.aamva.org/DL-ID-Card-Design-Standard/
exports.CodeToKey = {
  DCA: 'jurisdictionVehicleClass',
  DCB: 'jurisdictionRestrictionCodes',
  DCD: 'jurisdictionEndorsementCodes',
  DBA: 'dateOfExpiry',
  DCS: 'lastName',
  DAC: 'firstName',
  DAD: 'middleName',
  DBD: 'dateOfIssue',
  DBB: 'dateOfBirth',
  DBC: 'sex',
  DAY: 'eyeColor',
  DAU: 'height',
  DAG: 'addressStreet',
  DAI: 'addressCity',
  DAJ: 'addressState',
  DAK: 'addressPostalCode',
  DAQ: 'documentNumber',
  DCF: 'documentDiscriminator',
  DCG: 'issuer',
  DDE: 'lastNameTruncated',
  DDF: 'firstNameTruncated',
  DDG: 'middleNameTruncated',
  // optional
  DAZ: 'hairColor',
  DAH: 'addressStreet2',
  DCI: 'placeOfBirth',
  DCJ: 'auditInformation',
  DCK: 'inventoryControlNumber',
  DBN: 'otherLastName',
  DBG: 'otherFirstName',
  DBS: 'otherSuffixName',
  DCU: 'nameSuffix', // e.g. jr, sr
  DCE: 'weightRange',
  DCL: 'race',
  DCM: 'standardVehicleClassification',
  DCN: 'standardEndorsementCode',
  DCO: 'standardRestrictionCode',
  DCP: 'jurisdictionVehicleClassificationDescription',
  DCQ: 'jurisdictionEndorsementCodeDescription',
  DCR: 'jurisdictionRestrictionCodeDescription',
  DDA: 'complianceType',
  DDB: 'dateCardRevised',
  DDC: 'dateOfExpiryHazmatEndorsement',
  DDD: 'limitedDurationDocumentIndicator',
  DAW: 'weightLb',
  DAX: 'weightKg',
  DDH: 'dateAge18',
  DDI: 'dateAge19',
  DDJ: 'dateAge21',
  DDK: 'organDonor',
  DDL: 'veteran'
}

},{}],4:[function(require,module,exports){
const CodeToKey = require("./keys").CodeToKey;

const lineSeparator = "\n";

const defaultOptions = {suppressErrors: false};

exports.parse = function parseCode128(str, options = defaultOptions) {
  const props = {};
  const rawLines = str.trim().split(lineSeparator);
  const lines = rawLines.map(rawLine => sanitizeData(rawLine));
  let started;
  lines.slice(0, -1).forEach(line => {
    if (!started) {
      if (line.indexOf("ANSI ") === 0) {
        started = true;
      }
      return;
    }

    let code = getCode(line);
    let value = getValue(line);
    let key = getKey(code);
    if (!key) {
      if (options.suppressErrors) {
        return;
      } else {
        throw new Error("unknown code: " + code);
      }
    }

    if (isSexField(code)) value = getSex(code, value);

    props[key] = isDateField(key) ? getDateFormat(value) : value;
  });

  return props;
};

const sanitizeData = rawLine => rawLine.match(/[\011\012\015\040-\177]*/g).join('').trim();

const getCode = line => line.slice(0, 3);
const getValue = line => line.slice(3);
const getKey = code => CodeToKey[code];

const isSexField = code => code === "DBC";

const getSex = (code, value) => (value === "1" ? "M" : "F");

const isDateField = key => key.indexOf("date") === 0;

const getDateFormat = value => {
  const parts = [value.slice(0, 2), value.slice(2, 4), value.slice(4)];
  return parts.join("/");
};

},{"./keys":3}]},{},[1]);
