var axios = require('axios')
  


axios({
        method: 'get',
        url:'https://blockchain.info/q/getreceivedbyaddress/1EyUhw3GwsRGATABpP2DBZRqhVFFzDUR5Q?confirmations=1'
    }). then(function(response){
     console.log(response.data);
    }).catch(function(error){
     console.log(error); 
     });


axios ({
        method:'get',
        url:'https://blockchain.info/q/getblockcount/1EyUhw3GwsRGATABpP2DBZRqhVFFzDUR5Q'
    }).then(function(response){
            console.log(response.data);
    }).catch(function(error){
            console.log(error);
    });
~       
