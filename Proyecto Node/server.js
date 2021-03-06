var express = require("express");
var http = require('http');
var bodyParser = require("body-parser");
var Usuario = require("./models/usuario").Usuario;
//var session = require("express-session");
var cookieSession = require("cookie-session");
var ruta_app = require("./rutas_app");
var session_middleware = require("./middlewares/session");

var server = express();
var serverh = http.createServer(server);
var io = require('socket.io').listen(serverh);

//middlewares
server.set('views', __dirname + '/views');
server.set("view engine", "jade");
server.use(express.static(__dirname + '/public'));

//server.use("/public",express.static('public'));
//parsing = leer los archivos de la peticion
server.use(bodyParser.json()); // para peticiones application/json
server.use(bodyParser.urlencoded({extended: true}));

server.use(cookieSession({
	name: "session",
	keys: ["llave-1", "llave-2"]
}));

/*server.use(session({
	secret: "secreto123",
	resave: false, // true = la sesion se vuelve a guardar
	saveUninitialized: false //reduce el espacio que comsume en el storage
}));*/

server.get('/', function(req, res){
	res.render("index");//render a index.jade
});

server.get('/signup', function(req, res){
	res.render('signup');
});

server.get('/login', function(req, res){
	Usuario.find(function(err, doc){
		//console.log(doc);
		res.render('login');
	});

	//res.render('login');
});

server.post("/sessions", function(req, res){
	Usuario.findOne({usuario:req.body.usuario, password:req.body.password}, function(err, user){
		if(user == null){
			console.log("ERRORRRR");
			res.redirect("/login");
		}
		else{
			console.log("userrrrrrrr" + user);
			req.session.user_id = user._id;
			res.redirect("/app");
			//console.log(user);
		}
		//res.send("Hola mundo Session... Usuario_ID: " + user._id);
	})
});

server.use("/app", session_middleware);
server.use("/app", ruta_app);

server.post("/users", function(req, res){
	console.log("Nombres: "+req.body.nombres);
	console.log("apellidos: "+req.body.apellidos);
	console.log("dni: "+req.body.dni);
	console.log("fecha: "+req.body.nacimiento);
	console.log("direccion: "+req.body.direccion);
	console.log("cell: "+req.body.cel);
	console.log("email: "+req.body.email);
	console.log("Usuario: "+req.body.usuario);
	console.log("Contraseña: "+req.body.password);
	
	var usuarioActual = new Usuario({
									nombre:req.body.nombres,
									apellido:req.body.apellidos,
									dni:req.body.dni,
									fecha_naci: req.body.nacimiento,
									direccion:req.body.direccion,
									cel:req.body.cel,
									email:req.body.email,
									usuario:req.body.usuario, 
									password:req.body.password,
									password_confirmacion: req.body.password_confirmation
								});

	console.log(usuarioActual.password_confirmacion);
	usuarioActual.save(function(err){
		if(err){
			console.log(String(err));
		}
		else{
			res.redirect("/login");
		}
		//res.send("Guardamos tus datos...");
	})

	//res.send("Felicitaciones, Usted esta logeado...");
});

server.get('/ubicacion', function(req, res) {
	//pasamos parametros a layoutMapa
    res.render('layoutMapa', {
    	title: 'Ubicación en Tiempo Real',
    	description: 'Mi primera Ubicación'
    });
});

io.sockets.on('connection', function(socket){
	socket.on('coords:me', function(data){
		console.log("DATA IO: " + data);
		socket.broadcast.emit('coords:user', data);
	});
});

serverh.listen(3000);
console.log('Servidor corriendo en LOCALHOST...');