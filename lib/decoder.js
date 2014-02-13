var MSGP = require( './msgp' )
var Stream = require( 'stream' )
var inherit = require( 'derive' ).inherit

/**
 * Decoder Constructor
 * @return {Decoder}
 */
function Decoder( options ) {
  
  if( !(this instanceof Decoder) )
    return new Decoder( options )
  
  this.options = options || {}
  this.options.objectMode = true
  this.options.decodeStrings = false
  
  Stream.Transform.call( this, options )
  
}

// Exports
module.exports = Decoder

/**
 * Decoder Prototype
 * @type {Object}
 */
Decoder.prototype = {
  
  constructor: Decoder,
  
  _transform: function( data, encoding, done ) {
    
  },
  
  _decode: function( data ) {
    
  }
  
}

// Inherit from transform stream
inherit( Decoder, Stream.Transform )
