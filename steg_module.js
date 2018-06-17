#!/usr/bin/env nodejs

'use strict';

const Ppm = require('./ppm');

/** prefix which always precedes actual message when message is hidden
 *  in an image.
 */
const STEG_MAGIC = 'stg';

/** Constructor which takes some kind of ID and a Ppm image */
function StegModule(id, ppm) {
  this.id = id;
  this.ppm = ppm;
}

/** Hide message msg using PPM image contained in this StegModule object
 *  and return an object containing the new PPM image.
 *
 *  Specifically, this function will always return an object.  If an
 *  error occurs, then the "error" property of the return'd object
 *  will be set to a suitable error message.  If everything ok, then
 *  the "ppm" property of return'd object will be set to a Ppm image
 *  ppmOut which is derived from this.ppm with msg hidden.
 *
 *  The ppmOut image will be formed from the image contained in this
 *  StegModule object and msg as follows.
 *
 *    1.  The meta-info (header, comments, resolution, color-depth)
 *        for ppmOut is set to that of the PPM image contained in this
 *        StegModule object.
 *
 *    2.  A magicMsg is formed as the concatenation of STEG_MAGIC,
 *        msg and the NUL-character '\0'.
 *
 *    3.  The bits of the character codes of magicMsg including the
 *        terminating NUL-character are unpacked (MSB-first) into the
 *        LSB of successive pixel bytes of the ppmOut image.  Note
 *        that the pixel bytes of ppmOut should be identical to those
 *        of the image in this StegModule object except that the LSB of each
 *        pixel byte will contain the bits of magicMsg.
 *
 *  The function should detect the following errors:
 *
 *    STEG_TOO_BIG:   The provided pixelBytes array is not large enough
 *                    to allow hiding magicMsg.
 *    STEG_MSG:       The image contained in this StegModule object may already
 *                    contain a hidden message; detected by seeing
 *                    this StegModule object's underlying image pixel bytes
 *                    starting with a hidden STEG_MAGIC string.
 *
 * Each error message must start with the above IDs (STEG_TOO_BIG, etc).
 */
StegModule.prototype.hide = function(msg) {
  //hide STEG_MAGIC + msg + '\0' into a copy of this.ppm
  //construct copy as shown below, then update pixelBytes in the copy.

  var ppmOut = new Ppm(this.ppm); //Create a copy of the ppm image

  msg = STEG_MAGIC + msg + '\0';



  var message = '';
  var stgMessage = '';
  var stgTooBig = '';
  var counter = 0;

  if(msg.length > ppmOut.pixelBytes.length){
    stgTooBig += 'STEG_TOO_BIG error!';
    return { error: stgTooBig};
  }


  for(let i=0; i<3; i++){ //stg control
    var binaryNum = '';
    for(let j=0; j<8; j++){
      if(ppmOut.pixelBytes[counter] % 2 === 0) {  //even value
        binaryNum += "0";
      }
      else {  //odd value
        binaryNum += "1";
      }
      counter++;
    }
    var hexa = parseInt(binaryNum, 2).toString(16); //convert binary to hexadecimal
    hexa = hexa.toString();
    var chAscii = '';
    for (var k = 0; k < hexa.length; k += 2)  //convert hexadecimal to ascii
        chAscii += String.fromCharCode(parseInt(hexa.substr(k, 2), 16));
    message += chAscii;
  }
  if (message === STEG_MAGIC){
    stgMessage += 'STEG_MSG: image already contains a hidden message!';
    return { error: stgMessage};
  }
  else{

    var i=0;
    var count = 0;

    while (i < msg.length + 4){
      var hexOfCh = msg.charCodeAt(i).toString(16); //convert ascii char to hexadecimal value
      var binOfCh = ("00000000" + (parseInt(hexOfCh, 16)).toString(2)).substr(-8);  //convert hexadecimal value to binary value

      for(let j=0; j<8; j++){
        if(ppmOut.pixelBytes[count] % 2 === 0){ //check if the binary value is equal to what it should get from the pixel bytes' LSB
          if(binOfCh[j] === '1'){
            ppmOut.pixelBytes[count] = ppmOut.pixelBytes[count] | 1 ;
          }
        }
        else{
          if(binOfCh[j] === '0'){
            ppmOut.pixelBytes[count] = ppmOut.pixelBytes[count] & (((1<<(8))-1)<<1);
          }
        }
        count++;
      }
      i++;

    }

  }
  return { ppm: ppmOut };
}

/** Return message hidden in this StegModule object.  Specifically, if
 *  an error occurs, then return an object with "error" property set
 *  to a string describing the error.  If everything is ok, then the
 *  return'd object should have a "msg" property set to the hidden
 *  message.  Note that the return'd message should not contain
 *  STEG_MAGIC or the terminating NUL '\0' character.
 *
 *  The function will detect the following errors:
 *
 *    STEG_NO_MSG:    The image contained in this Steg object does not
 *                    contain a hidden message; detected by not
 *                    seeing this Steg object's underlying image pixel
 *                    bytes starting with a hidden STEG_MAGIC
 *                    string.
 *    STEG_BAD_MSG:   A bad message was decoded (the NUL-terminator
 *                    was not found).
 *
 * Each error message must start with the above IDs (STEG_NO_MSG, etc).
 */
StegModule.prototype.unhide = function() {
  //TODO

  var i = 0;
  var counter = 0;
  var message = '';
  var hiddenMessage = '';
  var stegNoMessage = '';
  var stegBadMessage = '';

  while (i < this.ppm.pixelBytes.length && ch !== '\0'){
    var binaryNum = '';
    for(let j=0; j<8; j++){

      if(this.ppm.pixelBytes[counter] % 2 === 0) {  //even value
        binaryNum += "0";
      }
      else {  //odd value
        binaryNum += "1";
      }
      counter++;
    }
    var hexa = parseInt(binaryNum, 2).toString(16); //converts binary number to hexadecimal value
    hexa = hexa.toString();
    var chAscii = '';
    for (var k = 0; k < hexa.length; k += 2)
        chAscii += String.fromCharCode(parseInt(hexa.substr(k, 2), 16));
    message += chAscii;

    var ch = chAscii;

    i++;
  }

  if(ch !== '\0'){  //STEG_BAD_MSG
    stegBadMessage += 'STEG_BAD_MSG: bad message!';
    return {  error: stegBadMessage }
  }

  if(message[0] === 's' && message[1] === 't' && message[2] == 'g'){
    for(var l = 3; l<message.length; l++){
      hiddenMessage += message[l];
    }
  }
  else {  // STEG_NO_MSG

    stegNoMessage += 'STEG_NO_MSG: image does not have a message!';
    return { error: stegNoMessage}
  }
  return { msg: hiddenMessage };
}


module.exports = StegModule;
