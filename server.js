// déclaration & lancement du module express
var express = require('express');
var app = express();
// session
var session = require('express-session');
var cookieParser = require('cookie-parser');
// utilisations des utilitaires
var utilitaires = require('./utilitaires');
// récupère les valeurs du body
var bodyParser = require('body-parser');
// charge module mongodb + récupération de la propriété Mongoclient de l'obj mongodb
var MongoClient = require('mongodb').MongoClient;
// url de connexion à la base mongodb
var URL ='mongodb://KaraSylla:Alchi86..@ds023495.mlab.com:23495/multijoueur';
// var URL ='mongodb://localhost:27017/multijoueur';

// déclaration variable pour la bdd
var maDb;


// fixation du moteur de visualisation & indication de l'emplacement des fichiers jade
app.set('view engine', 'jade');
app.set('views', 'jadesfiles');

// gestion des fichiers statiques
app.use(express.static(__dirname + '/staticfiles/src'));
app.use(express.static(__dirname + '/staticfiles/img'));

// gestion des sessions
app.use(session({
  secret:'motdepassequiretouvelefichiercorrespondantauclienthttp01++',
  saveUninitialized : true,
  resave: false
  // maxAge: 900000000000000000000000000000000000000000000000
}));

app.use(cookieParser());

app.use(bodyParser.urlencoded({
  extended: false
}));

var identifiantJoueur;

app.post('/verification-formulaire-inscription', (req, res) => {
  var messageErr = '';
  if (req.body.pseudonyme == '') {
    messageErr += 'veuillez saisir un pseudonyme';
    res.render('formulaire-inscription', {messageErreur: messageErr});
  }else {
    if (req.body.nvxMdp == '') {
      messageErr += 'veuillez saisir un mot de passe';
      res.render('formulaire-inscription', {messageErreur: messageErr});
    }else {
      var collection = maDb.collection('utilisateurs');
      collection.find({pseudonyme: req.body.pseudonyme}).toArray((err, data) => {
        if (data == '') {
          var collection = maDb.collection('utilisateurs');
          collection.insert({pseudonyme : req.body.pseudonyme, motDePasse: req.body.nvxMdp, avatar:req.body.avatar}, function (err, result) {
            collection.find({pseudonyme:req.body.pseudonyme}).toArray(function (err, data) {
              req.session.pseudo = req.body.pseudonyme;
              req.session.avatar = data[0].avatar;
              identifiantJoueur = req.session.pseudo;
              res.render('jeumulti', {pseudo: req.session.pseudo, avatar:req.session.avatar});
            });
          });
        }else {
          messageErr += 'Ce pseudo existe déjà, veuillez en choisir un autre';
          res.render('formulaire-inscription', {messageErreur: messageErr});
        };
      });
    };
  };
});

app.post('/verification-formulaire-connexion', (req, res) => {
  var messageErr = '';
  if (req.body.pseudonyme == '') {
    messageErr += 'veuillez saisir votre pseudonyme';
    res.render('formulaire-connexion', {messageErreur: messageErr});
  }else {
    if (req.body.mdp == '') {
      messageErr += 'veuillez saisir votre mot de passe';
      res.render('formulaire-connexion', {messageErreur: messageErr});
    }else {
      var collection = maDb.collection('utilisateurs');
      collection.find({pseudonyme: req.body.pseudonyme, motDePasse : req.body.mdp}).toArray((err, data) => {
        if (data.length != 0) {
          req.session.pseudo = req.body.pseudonyme;
          req.session.avatar = data[0].avatar;
          identifiantJoueur = req.session.pseudo;
          res.render('jeumulti', {pseudo: req.session.pseudo, avatar:req.session.avatar});
        }else {
          res.render('formulaire-connexion', {messageErreur: 'Votre identifiant et/ou votre mot de passe est incorrect(s), réessayer !'});
        }
      });
    }
  };
});


// gestion des routes en mode non connecté
app.get('/', (req, res) => {
  // initialisation des données de la session
  utilitaires.initSession(req, res);
  res.render('index');
});

// page des scores
app.get('/resultat', (req, res, next) => {
  utilitaires.initSession(req, res);
  var collection = maDb.collection('resultat');
  collection.find({}).toArray(function (err, data) {
    res.render('resultat', {resultat: data});
  });
});

// gestion des routes pour les formulaires ...
app.get('/formulaire-inscription', (req, res) => {
  // initialisation des données de la session
  utilitaires.initSession(req, res);
  res.render('formulaire-inscription');
});

app.get('/formulaire-connexion', (req, res) => {
  // initialisation des données de la session
  utilitaires.initSession(req, res);
  res.render('formulaire-connexion');
});

// gestion des routes en mode connecté
app.get('/jeumulti', (req, res, next) => {
  // accède uniquement en mode connecté
  if (utilitaires.userCo(req, res, next)) return;
  res.render('jeumulti', {pseudo: req.session.pseudo, avatar:req.session.avatar});
});


///////////////////////////////////////////////SOCKET///////////////////////////
// association du serveur websocket au serveur http ce serveur
// accept une requette upgrade (connexion persistante)
var server = require('http').Server(app);
var io = require('socket.io')(server);

// gestion d'une requête WebSocket provenant d'un client WebSocket
// socket est un objet représentant la connexion

var lesSessions = {};
var terrainsDejeu = ['terrainDeJeu1', 'terrainDeJeu2'];
var lesJoueurs = [];

// connection socket côté serveur
io.on('connection', function (socket) {

  // preparation info joueurs et affichage des joueurs chez les navigateurs (clients)
  socket.on('preparationPlayer', () => {

    // ajout des joueurs dans la room 1
    socket.room = 'terrainDeJeu1';
    socket.join('terrainDeJeu1');

    // manipulation/gestion des sockets
    infoJoueur = {
      pseudo: identifiantJoueur,
      id: socket.id
    }

    lesSessions[infoJoueur.id] = infoJoueur;

    socket.emit('ajoutJoueur', infoJoueur);
    socket.broadcast.emit('autreJoueur', infoJoueur);

    for(index in lesSessions) {
      lesJoueurs.push(lesSessions[index]);
    }

    if (lesJoueurs.length == 3) {
      lesJoueurs.shift();
      socket.emit('tousLesJoueurs', lesJoueurs);
    }
  });

  // lancement du défi
  socket.on('defi', (data) => {
    socket.broadcast.emit('acceptationDefi', data);
  });

  //envoi pseudo adversaire + message
  socket.on('PreparationGame', (data) => {
    io.sockets.emit('game', data);
  });

  //gestion des resultats...
  socket.on('envoieTrue', (data) => {
    socket.broadcast.emit('afficheResultatTrue', data);
  });

  socket.on('envoieFalse', (data) => {
    socket.broadcast.emit('afficheResultatFalse', data);
  });

  socket.on('envoieScore', (data) => {
    socket.broadcast.emit('score', data);
  });

  socket.on('envoieVictoire', (data) => {
    socket.broadcast.emit('afficheResultatAdversaire', data);
  });

  //insérer les resultats des 2 joueurs dans la bdd puis dans la page de resultat
  socket.on('resultat', (data) => {
    var collection = maDb.collection('resultat');
    collection.insert({resultat : 'date et heure : ' + data.date + ' _ ' +  'score ' + data.Joueur1 + ' ' + data.score1 + ' / ' + 'score ' +  data.Joueur2 + ' ' + data.score2 + ' _ ' + 'durée de jeu : ' + data.duree}, function (err, result) {
    });
  });

});

//detection de la deconnection d'un socket
setInterval(function(){
  for(index in lesSessions){
    if(!io.sockets.connected[lesSessions[index].id]){
      io.emit('adversaireDeco', 'veuillez vous reconnecter pour défier un nouvel adversaire');
      delete lesJoueurs;
      delete lesSessions[index];
    }
  };
}, 1000);


//gestion 403 et 404
app.use((req, res, next) => {
  switch(res.statusCode){
    case 403:
      res.render('403',{ title:'Accès interdit !', erreur403: 'Accès interdit !  - error 403'});
    break;
    default:
      res.status(404).render('404',{ title:'Page inconnue', erreur404: 'Page inconnue !  - error 404'});
  }
});

// connexion à la base de donnée
MongoClient.connect(URL, (err, db) => {
  if(err){
    return;
    console.log('impossible de se connecter à la base');
  }
  maDb = db;
  server.listen(process.env.PORT || 5000, () => {
    console.log('connecté');
  });
});
