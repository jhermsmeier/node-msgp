var MSGP = require( './msgp' )
var Stream = require( 'stream' )
var inherit = require( 'derive' ).inherit
var Int64 = require( 'int64-native' )

/**
 * Encoder Constructor
 * @return {Encoder}
 */
function Encoder( options ) {
  
  if( !(this instanceof Encoder) )
    return new Encoder( options )
  
  this.options = options || {}
  this.options.objectMode = true
  // this.options.decodeStrings = false
  
  Stream.Transform.call(
    this, this.options
  )
  
}

// Exports
module.exports = Encoder

/**
 * Encoder Prototype
 * @type {Object}
 */
Encoder.prototype = {
  
  constructor: Encoder,
  
  use: function( code, encoder ) {
    // register extension middleware
  },
  
  _transform: function( data, encoding, done ) {
    this._encode( data )
    done()
  },
  
  _encode: function( data ) {
    
    if( data instanceof Buffer ) {
      return this._encodeBytes( data )
    }
    
    if( data == null ) {
      return this._encodeNil()
    }
    
    switch( typeof data ) {
      case 'boolean':
        this._encodeBoolean( data )
        break
      case 'string':
        this._encodeString( data )
        break
      case 'number':
        this._encodeNumber( data )
        break
      default:
      case 'object':
        Array.isArray( data )
          ? this._encodeArray( data )
          : this._encodeMap( data )
        break
    }
    
  },
  
  _encodeNil: function() {
    this.push( new Buffer( '\xC0' ) )
  },
  
  _encodeBoolean: function( bool ) {
    ( bool === true ) ?
      this.push( new Buffer( '\xC3' ) ) :
      this.push( new Buffer( '\xC2' ) )
  },
  
  _encodeBytes: function( data ) {
    
    var marker = null
    var length = data.length
    
    if( length < 0x100 ) {
      marker = new Buffer( 2 )
      marker[0] = 0xC4
      marker.writeUInt8( length, 1 )
    } else if( length < 0x10000 ) {
      marker = new Buffer( 3 )
      marker[0] = 0xC5
      marker.writeUInt16BE( length, 1 )
    } else if( length < 0x100000000 ) {
      marker = new Buffer( 5 )
      marker[0] = 0xC6
      marker.writeUInt32BE( length, 1 )
    } else {
      this.emit( 'error', new Error(
        'Raw binary data may not exceed 2^32 - 1 bytes in length'
      ))
    }
    
    if( marker != null ) {
      this.push( marker )
      this.push( data )
    }
    
  },
  
  _encodeString: function( str ) {
    
    var marker = null
    var data = new Buffer( str, 'utf8' )
    var length = data.length
    
    if( length < 0x20 ) {
      marker = new Buffer( 1 )
      marker[0] = 0xA0 ^ length
    } else if( length < 0x100 ) {
      marker = new Buffer( 2 )
      marker[0] = 0xD9
      marker.writeUInt8( length, 1 )
    } else if( length < 0x10000 ) {
      marker = new Buffer( 3 )
      marker[0] = 0xDA
      marker.writeUInt16BE( length, 1 )
    } else if( length < 0x100000000 ) {
      marker = new Buffer( 5 )
      marker[0] = 0xDB
      marker.writeUInt32BE( length, 1 )
    } else {
      this.emit( 'error', new Error(
        'Raw strings may not exceed 2^32 - 1 bytes in length'
      ))
    }
    
    if( marker != null ) {
      this.push( marker )
      this.push( data )
    }
    
  },
  
  _encodeArray: function( data ) {
    
    var marker = null
    var length = data.length
    
    if( length < 0x10 ) {
      marker = new Buffer( 1 )
      marker[0] = 0x90 ^ length
    } else if( length < 0x10000 ) {
      marker = new Buffer( 3 )
      marker[0] = 0xDC
      marker.writeUInt16BE( length, 1 )
    } else if( length < 0x100000000 ) {
      marker = new Buffer( 5 )
      marker[0] = 0xDD
      marker.writeUInt32BE( length, 1 )
    } else {
      this.emit( 'error', new Error(
        'Arrays may not exceed 2^32 - 1 elements in length'
      ))
    }
    
    if( marker != null ) {
      for( var i = 0; i < length; i++ ) {
        this._encode( data[i] )
      }
    }
    
  },
  
  _encodeMap: function( data ) {
    
    var marker = null
    var keys = Object.keys( data )
    var length = keys.length
    
    if( length < 0x10 ) {
      marker = new Buffer( 1 )
      marker[0] = 0x80 ^ length
    } else if( length < 0x10000 ) {
      marker = new Buffer( 3 )
      marker[0] = 0xDE
      marker.writeUInt16BE( length, 1 )
    } else if( length < 0x100000000 ) {
      marker = new Buffer( 5 )
      marker[0] = 0xDF
      marker.writeUInt32BE( length, 1 )
    } else {
      this.emit( 'error', new Error(
        'Maps may not exceed 2^32 - 1 elements in length'
      ))
    }
    
    if( marker != null ) {
      for( var i = 0; i < length; i++ ) {
        this._encodeString( keys[i] )
        this._encode( data[ keys[i] ] )
      }
    }
    
  },
  
  _encodeNumber: function( value ) {
    
    if( value === Infinity || value === -Infinity ) {
      return this._encodeFloat( value )
    } else if( Math.floor( value ) !== value ) {
      return this._encodeFloat( value )
    }
    
    if( value > MSGP.INT_MAX || value < MSGP.INT_MIN ) {
      this.emit( 'error', new Error(
        'Integer value out of 64bit range'
      ))
    }
    
    ( value >= 0 ) ?
      this._encodeUInt( value ) :
      this._encodeInt( Math.abs( value ) )
    
  },
  
  _encodeUInt: function( value ) {
    
    var data = null
    
    if( value < 0x80 ) {
      data = new Buffer( 1 )
      data[0] = value
    } else if( value < 0x100 ) {
      data = new Buffer( 2 )
      data[0] = 0xCC
      data.writeUInt8( value, 1 )
    } else if( value < 0x10000 ) {
      data = new Buffer( 3 )
      data[0] = 0xCD
      data.writeUInt16BE( value, 1 )
    } else if( value < 0x100000000 ) {
      data = new Buffer( 5 )
      data[0] = 0xCE
      data.writeUInt32BE( value, 1 )
    } else {
      data = new Buffer( 9 )
      data[0] = 0xCF
      var int64 = new Int64( value )
      data.writeUInt32BE( int64.high32(), 1 )
      data.writeUInt32BE( int64.low32(), 5 )
    }
    
    this.push( data )
    
  },
  
  _encodeInt: function( value ) {
    
    var data = null
    
    if( value < 0x20 ) {
      data = new Buffer( 1 )
      data[0] = 0xE0 ^ value
    } else if( value < 0x100 ) {
      data = new Buffer( 2 )
      data[0] = 0xD0
      data.writeUInt8( value, 1 )
    } else if( value < 0x10000 ) {
      data = new Buffer( 3 )
      data[0] = 0xD1
      data.writeUInt16BE( value, 1 )
    } else if( value < 0x100000000 ) {
      data = new Buffer( 5 )
      data[0] = 0xD2
      data.writeUInt32BE( value, 1 )
    } else {
      data = new Buffer( 9 )
      data[0] = 0xD3
      var int64 = new Int64( value )
      data.writeUInt32BE( int64.high32(), 1 )
      data.writeUInt32BE( int64.low32(), 5 )
    }
    
    this.push( data )
    
  },
  
  _encodeFloat: function( value ) {
    
    var data = null
    
    if( value < 0x100000000 ) {
      data = new Buffer( 5 )
      data[0] = 0xCA
      data.writeFloatBE( value, 1 )
    } else {
      data = new Buffer( 9 )
      data[0] = 0xCB
      data.writeDoubleBE( value, 1 )
    }
    
    this.push( data )
    
  }
  
}

// Inherit from transform stream
inherit( Encoder, Stream.Transform )
