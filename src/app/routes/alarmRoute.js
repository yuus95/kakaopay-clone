module.exports = function(app){
    const alarm = require('../controllers/alarmController');
    const jwtMiddleware = require('../../../config/jwtMiddleware');

    app.get('/alarm', jwtMiddleware, alarm.get_list);
};
