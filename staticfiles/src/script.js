
((window, io)=>{
  "use strict"
  // au chargement du document
  $(document).ready(() => {
    // établissement d'une connexion websocket vers le serveur websocket
    var socket = io.connect('http://karasylla.herokuapp.com:5000');

    // preparation info joueurs et affichage des joueurs chez les navigateurs clients
    socket.emit('preparationPlayer');

    // affiche le nom du joueur connecté
    socket.on('ajoutJoueur', (infoJoueur) => {
      $('#JoueursCo').append(infoJoueur.pseudo);
      $('#victoire1').text(infoJoueur.pseudo  +  ' :');
      $('#affichevictoire1').css( {background : '#95c744'});
      $('#Joueur1').text(infoJoueur.pseudo  +  ' :');
      $('#tour-restant').text(3);

      // préparation defi
      var lancementBtnDefi = window.setTimeout(function () {
        $('#btn').css('display', 'block');
      },500);

      //dispariton bouton btn cacheBtn et lancement défi
      $('#btn').click(function ()  {
        clearTimeout(lancementBtnDefi);
        $(this).css('display', 'none');
        $('.cache').append('<p> ' + 'en attente de l\'adversaire' + '</p>');
        $('.cache p').css({background: 'blue', color : 'white', 'text-align' : 'center'});
        socket.emit('defi', {joueurMsg : 'votre adversaire ' +  '"' + infoJoueur.pseudo + '"' + ' souhaite vous défier'});
      });
    });

    // affiche le nom de l'adversaire '2eme joueur'
    socket.on('autreJoueur', function (autreJoueur) {
      $('#JoueursCo').append(' / ', autreJoueur.pseudo);
      $('#victoire2').text(autreJoueur.pseudo + ' :');
      $('#Joueur2').text(autreJoueur.pseudo + ' :');
    });

    // affiche le nom du deuxieme joueur pour lui meme
    socket.on('tousLesJoueurs', function (lesJoueurs) {
      $('#JoueursCo').append(' / ', lesJoueurs[0].pseudo);
      $('#victoire2').text(lesJoueurs[0].pseudo + ' :');
      $('#Joueur2').text(lesJoueurs[0].pseudo + ' :');
    });

    // lancement jeu
    socket.on('acceptationDefi', function (acceptationDdefi) {
      $('#btn').css('display', 'none');
      $('#btnAccepter').css('display', 'block');
      $('.cache').append('<p> ' + acceptationDdefi.joueurMsg + '</p>');
      $('.cache p').css({background: 'blue', color : 'white', 'text-align' : 'center'});

      // si on ma lancé un défi accepter et lancer la partie
      if ($('#btnAccepter')) {
        $('#btnAccepter').click(function () {
            socket.emit('PreparationGame', 'c\'est parti dans : ');
        });
      }
    });

    //////////////////////////////////////GAME//////////////////////////////////
    socket.on('game', function (msgStart) {


      $('#btnAccepter').css('display', 'none');

      var decompte = 3;

      var timerDecompte = setInterval(function(){

        decompte--;

        if (decompte === 0) {

          // stopper le decompte
          clearInterval(timerDecompte);
          $('.cache').css('display', 'none');
          $('.cache p').css('display', 'none');
          $('.cible').css('background','none');
          $('section li img').css('opacity', '1');

          var chronometre = {

          startTime : 0,
          start : 0,
          end : 0,
          diff : 0,
          timerIDChrono : 0,
          //
          chrono : function () {
            // objet date (date + heure)
            this.end = new Date();
            // obtenir timestamp (lecture du temps par la machine)
            this.diff = this.end - this.start;
            //manipuler le temps
            this.diff = new Date(this.diff);

            // obtenir millisecondes, secondes, minutes et heures
            var msec = this.diff.getMilliseconds();
            var sec = this.diff.getSeconds();
            var min = this.diff.getMinutes();
            var hr = this.diff.getHours() - 1;

            // gére l'esthétisme du chrono ajoute un 0 l'orsquil n'y a qu'un chiffre
            if (sec < 10) {
              sec = '0' + sec;
            }
            if (min < 10) {
              min = '0' + min;
            }
            if (msec < 10) {
              msec = '00' + msec;
            }else {
              if (msec < 100) {
                msec = '0' + msec;
              }
            }

            // affichage du temps
            var that = this;
            $('#temps-de-jeu').html(hr + ':' + min + ':' + sec + ':' + msec);
            this.timerIDChrono = setTimeout(function () {
              that.chrono();
            }, 10);

          },

            // chrono en continu
            chronoStart : function () {
              this.start = new Date();
              this.chrono();
            },
          };

          // lancement chrono
          chronometre.chronoStart();

          // initialise l'interupteur
          var interupteur;

          // nom aleatoire des joueurs du psg
          var RandTableau = function (tableauStaffPsg) {

            interupteur = 0;

            var tableauStaffPsg = ['di maria angel', 'aurier serge', 'cavani edinson','david luiz', 'zlatan ibrahimovic', 'kurzawa layvin', 'lucas moura', 'marquinhos', 'matuidi blaise', 'maxwell', 'motta thiago', 'pastore javier', 'rabiot adrien', 'silva thiago', 'verrati marco', 'van der wiel gregory', 'trapp kevin', 'laurent blanc'];

            var i;
            var Num;
            var Nbr = 18;
            var staffPsgAleatoire = new Array();
            //-- Copie le contenu
            staffPsgAleatoire = staffPsgAleatoire.concat(tableauStaffPsg);
            //-- Lance la boucle
            while( Nbr > 0){
              //-- Recup nombre aleatoire
              Num = Math.floor(Math.random() * Nbr);
              //-- 1 de moins a traiter
              Nbr--;
              //-- Stock l'element tire
              var stock = staffPsgAleatoire[Num];
              //-- Decalage les valeur du tableau
              for( i= Num; i < Nbr; i++) {
                staffPsgAleatoire[i] = staffPsgAleatoire[i+1]
                //-- Stock l'element tire en fin
                staffPsgAleatoire[ Nbr] = stock;
              }
            }
            return [staffPsgAleatoire, interupteur];
          };


          // initialisation du score / victoire / tour
          var score = 0;
          var victoire = 0;
          var tour = 3;

          // lancement
          var timerInterval = window.setInterval(function () {

              // recupération tableau aléatoire
              var tabPsgRandom = RandTableau();

              // affichage joueur psg
              $('.vs p + p').text('trouve le plus rapidement possible : ' + tabPsgRandom[0][0]);

              interupteur = tabPsgRandom[1];

            // si le nom du joueur affiché correspond au clique on incrémente de 1 + stylisation
            var cliquer = function (nomJoueur) {

              var effetTimeout;

              if (nomJoueur == $('.vs p + p').text() && interupteur == 0) {
                score++;
                interupteur = 1;
                $('.cible li').css( {background : '#95c744'});
                effetTimeout = window.setTimeout(function () { $('.cible li').css( {background : 'none'}); },500);

                socket.emit('envoieTrue');
              }
              if (interupteur == 0) {
                $('.cible li').css( {background : 'red'});
                effetTimeout = window.setTimeout(function () { $('.cible li').css( {background : 'none'}); },500);

                socket.emit('envoieFalse');
              }

            };

            // clique sur les joueurs ...
            $('.diMaria').click(function () {
              cliquer('trouve le plus rapidement possible : ' + 'di maria angel');
              $('#resultat1').html(score);

              socket.emit('envoieScore', score);
            });

            $('.sergeAurier').click(function () {
              cliquer('trouve le plus rapidement possible : ' + 'aurier serge');
              $('#resultat1').html(score);

              socket.emit('envoieScore', score);
            });

            $('.edinsonCavani').click(function () {
              cliquer('trouve le plus rapidement possible : ' + 'cavani edinson');
              $('#resultat1').html(score);

              socket.emit('envoieScore', score);
            });

            $('.davidLuiz').click(function () {
              cliquer('trouve le plus rapidement possible : ' + 'david luiz');
              $('#resultat1').html(score);

              socket.emit('envoieScore', score);
            });

            $('.zlatanIbrahimovic').click(function () {
              cliquer('trouve le plus rapidement possible : ' + 'zlatan ibrahimovic');
              $('#resultat1').html(score);

              socket.emit('envoieScore', score);
            });

            $('.layvinKurzawa').click(function () {
              cliquer('trouve le plus rapidement possible : ' + 'kurzawa layvin');
              $('#resultat1').html(score);

              socket.emit('envoieScore', score);
            });

            $('.lucasMoura').click(function () {
              cliquer('trouve le plus rapidement possible : ' + 'lucas moura');
              $('#resultat1').html(score);

              socket.emit('envoieScore', score);
            });

            $('.marquinhos').click(function () {
              cliquer('trouve le plus rapidement possible : ' + 'marquinhos');
              $('#resultat1').html(score);

              socket.emit('envoieScore', score);
            });

            $('.blaiseMatuidi').click(function () {
              cliquer('trouve le plus rapidement possible : ' + 'matuidi blaise');
              $('#resultat1').html(score);

              socket.emit('envoieScore', score);
            });

            $('.maxwell').click(function () {
              cliquer('trouve le plus rapidement possible : ' + 'maxwell');
              $('#resultat1').html(score);

              socket.emit('envoieScore', score);
            });

            $('.thiagoMotta').click(function () {
              cliquer('trouve le plus rapidement possible : ' + 'motta thiago');
              $('#resultat1').html(score);

              socket.emit('envoieScore', score);
            });

            $('.pastoreJavier').click(function () {
              cliquer('trouve le plus rapidement possible : ' + 'pastore javier');
              $('#resultat1').html(score);

              socket.emit('envoieScore', score);
            });

            $('.adrienRabiot').click(function () {
              cliquer('trouve le plus rapidement possible : ' + 'rabiot adrien');
              $('#resultat1').html(score);

              socket.emit('envoieScore', score);
            });

            $('.thiagoSilva').click(function () {
              cliquer('trouve le plus rapidement possible : ' + 'silva thiago');
              $('#resultat1').html(score);

              socket.emit('envoieScore', score);
            });

            $('.marcoVerrati').click(function () {
              cliquer('trouve le plus rapidement possible : ' + 'verrati marco');
              $('#resultat1').html(score);

              socket.emit('envoieScore', score);
            });

            $('.vanDerWiel').click(function () {
              cliquer('trouve le plus rapidement possible : ' + 'van der wiel gregory');
              $('#resultat1').html(score);

              socket.emit('envoieScore', score);
            });

            $('.kevinTrapp').click(function () {
              cliquer('trouve le plus rapidement possible : ' + 'trapp kevin');
              $('#resultat1').html(score);

              socket.emit('envoieScore', score);
            });

            $('.laurentBlanc').click(function () {
              cliquer('trouve le plus rapidement possible : ' + 'laurent blanc');
              $('#resultat1').html(score);

              socket.emit('envoieScore', score);
            });

            // gestion des tours et victoires ...
            if (score == 2) {
              tour = 2;
              victoire = 1;
              $('p#affichevictoire1').html(victoire);
              $('p#tour-restant').html(tour);
              socket.emit('envoieVictoire', {victoire : victoire, tour : tour, score : score, stopJeu : timerInterval});
            }
            if (score == 4) {
              tour = 1;
              victoire = 2;
              $('p#affichevictoire1').html(victoire);
              $('p#tour-restant').html(tour);
              socket.emit('envoieVictoire', {victoire : victoire, tour : tour, score : score, stopJeu : timerInterval});
            }
            if (score == 6) {
              tour = 'fin du jeu';
              victoire = 3;
              $('p#affichevictoire1').html(victoire);
              $('p#tour-restant').html(tour);
              socket.emit('envoieVictoire', {victoire : victoire, tour : tour, score : score, stopJeu : timerInterval});
            }

            // fin du jeu
            if ($('#resultat1').html() == 6 || $('#resultat2').html() == 6) {
              clearInterval(timerInterval);
              clearTimeout(chronometre.timerIDChrono);

              if ($('#resultat1').html() > $('#resultat2').html())
                confirm('vous avez gagné');
              if ($('#resultat2').html() > $('#resultat1').html())
                confirm('vous avez perdu');

              $('.cache').css('display','block');
              $('.cible').css('background','none');
              $('section li img').css('opacity', '1');
              $('.cache div').append('<p>clique pour voir tous les résultats : <a title="resultat" href="resultat">voir les resultats</a></p>');
            }

          },1500);

        }else {
          // execution du decompte
          $('.cache p').html(msgStart + decompte);
          $('.cache p').css({background: '#95c744', 'font-weight': 'bold'});
        }

      }, 1000);
    });

    socket.on('afficheResultatTrue', function (score) {
      $('.cible li').css( {background : '#95c744'});
      var effetTimeout = window.setTimeout(function () { $('.cible li').css( {background : 'none'}); },500);
    });

    socket.on('afficheResultatFalse', function () {
      $('.cible li').css( {background : 'red'});
      var effetTimeout = window.setTimeout(function () { $('.cible li').css( {background : 'none'}); },500);
    });

    //affiche resultat adversaire 'joueur2' ...
    socket.on('score', function (score) {
      $('#resultat2').html(score);
      $('#resultat2').css('background', 'red');
      if (score == 8) {
        $('#resultat2').fadeOut();
        $('#resultat2').fadeIn();
      }
    });

    socket.on('afficheResultatAdversaire', function (resultat) {

      $('#affichevictoire2').css('background', 'red');

      if (resultat.score == 2) {
        resultat.tour = 2;
        resultat.victoire = 1;
        $('p#affichevictoire2').html(resultat.victoire);
        $('p#tour-restant').html(resultat.tour);
      }
      if (resultat.score == 4) {
        resultat.tour = 1;
        resultat.victoire = 2;
        $('p#affichevictoire2').html(resultat.victoire);
        $('p#tour-restant').html(resultat.tour);
      }
      if (resultat.score == 6) {
        resultat.tour = 'fin du jeu';
        resultat.victoire = 3;
        $('p#affichevictoire2').html(resultat.victoire);
        $('p#tour-restant').html(resultat.tour);

        socket.emit('resultat', {
          date : new Date().toLocaleString(),
          Joueur1 : $('#Joueur1').text(),
          score1 : $('#resultat1').text(),
          Joueur2 : $('#Joueur2').text(),
          score2 : $('#resultat2').text(),
          duree : $('#temps-de-jeu').text()
        });
      }
      // fin du jeu
      if ($('#resultat2').html() == 6 || $('#resultat1').html() == 6) {
        clearInterval(timerInterval);
        clearTimeout(chronometre.timerIDChrono);
      }

    });

    // gestion deconnexion
    socket.on('adversaireDeco', function (decoRedirection) {
      $('.cache').fadeIn();
      $('.cible').css('background','white');
      $('section li img').css('opacity', '0.1');
      $('.cache').append('<div>' + decoRedirection + '</div>');
      $('.cache div').css({background: '#95c744', color : 'white', 'text-align' : 'center'});

      // redirection de l'utilisateur vers la page de connexion lorsqu'un socket est deconnecté
      window.setTimeout(function () {
        window.document.location.href = 'http://karasylla.herokuapp.com:5000/formulaire-connexion';
      }, 4000);
    });

  });

})(window, io);
