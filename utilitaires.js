//module pour gérer les msg d'erreurs sur les urls en fonction du mode connecté ou non
exports.userCo = (req, res, next) => {
  if (!req.session.pseudo) {
    res.status(403);
    next();
    return true;
  }
};

exports.initSession = (req, res) => {
  req.session.destroy();
};
