
var MSGP = module.exports

MSGP.version = '2.0'

MSGP.INT_MAX = Math.pow( 2, 64 ) - 1
MSGP.INT_MIN = Math.pow( 2, 63 ) * -1

MSGP.Encoder = require( './encoder' )
MSGP.Decoder = require( './decoder' )

// console.log(
//   require( 'util' ).inspect(
//     MSGP, { colors: true, depth: 0 }
//   )
// )
