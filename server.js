/* by rafælcastrocouto */
var http = require('http'),
    url = require('url'),
    static = require('static.simple'),
    host = process.env.HOST,
    port = process.env.PORT || 5000,
    waiting = {id: 'none'},
    currentData = {},
    db = {
      get: function(name, cb){cb(currentData[name]||'');},
      set: function(name, val, cb){currentData[name] = val; cb(true);}
    },
    chat = [];
    debug = false;

if(host == 'localhost') debug = true;
  
if(debug) db = require('db.csv');

var send = function(response, data){
  response.writeHead(200, {
    'Content-Type': 'application/json'//,'Access-Control-Allow-Origin': '*'
  });
  response.end(''+data);
};

http.createServer(function(request, response){   
  var urlObj = url.parse(request.url, true);
  var pathname = urlObj.pathname;  
  if(request.headers['x-forwarded-proto'] == 'https'){
    response.writeHead(302, {'Location': 'http://dotacard.herokuapp.com/'}); 
    response.end();
  }
  console.log('request: '+pathname);
  if(pathname[0] == '/') pathname = pathname.slice(1); 
  if(pathname == 'db'){
    var query = urlObj.query;
    if(query.set){
      console.log('set: '+ query.set);
      //WAITING
      if(query.set == 'waiting'){
        if(waiting.id == 'none'){
          waiting = query.data;
          send(response, waiting);
        } else {
          send(response, waiting);
          waiting = {id: 'none'};
        }
      } //CHAT
      else if(query.set == 'chat'){
        chat.push(query.data);
        while(chat.length > 240) chat.shift();
        send(response, JSON.stringify({messages: chat}));
      } //DEFAULT SET
      
      else db.set(query.set, query.data, function(data){send(response, data);});      
    } else if (query.get){
      console.log('get: '+ query.get);
      //STATUS
      if(query.get == 'server') send(response, JSON.stringify({status: 'online'}));
      //CHAT
      if(query.get == 'chat') send(response, JSON.stringify({messages: chat}));
      //LANGUAGE
      else if(query.get == 'lang') send(response, JSON.stringify({lang: request.headers['accept-language']}));
      //DEFAULT GET
      else db.get(query.get, function(data){ send(response, data); });
    } else send(response, 'Db works!'); 
  } 
  //STATIC
  else static.read(response, pathname || 'index.html');
}).listen(port, host);

console.log(new Date() 
            + '\n' //<br>
            + '\x1B[1m' //style:bright
            + '\x1B[33m' //color:yellow
            + 'HTTP server running at: http://'+host+':'+port+'/'
            + '\x1B[0m'); //style:reset 